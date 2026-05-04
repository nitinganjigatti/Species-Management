# Antz Web Dashboard — WSO2 Login Flow

Implementation of the web login flow defined by:

- `WSO2_SSO_API_Reference.html` — backend contract
- `antz-login-flow-wso2.pdf` — UX + flow diagram

Both documents describe the same 3-scenario flow. This page maps them to our code.

---

## Environment flags

| Flag | Where | Values | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_WSO2_AUTH_ENABLED` | Frontend (`.env.development`) | `true` / `false` | Picks WSO2 3-scenario flow vs legacy email+password flow |
| `USE_SSO` | Backend | `true` / `false` | Switches backend `AuthFilter` between WSO2 RS256 validation and legacy HS256 |

Both flags must agree. Frontend `true` + backend `false` → all API calls 401. Frontend `false` + backend `true` → backend rejects legacy tokens.

---

## The 3 scenarios (per PDF + HTML)

```
Step 1: user enters email only → POST /api/v2/auth/user/login {email, source:"web"}
             │
             ▼
  ┌──────────┴──────────┐
  │ Backend response?    │
  └──────────┬──────────┘
             │
  ┌──────────┼──────────────────────────────────┐
  │          │                                   │
Scenario 1  Scenario 2                          Scenario 3
 (both)      (Antz only)                         (not in Antz)
  │          │                                   │
auth_method  auth_method                         success: false
  "sso"       "password"                         message:
  │          │                                     "Invalid Username/Email"
  │          ▼                                     OR "This Account Has Been Suspended !!"
  │         Show password field                  │
  │          │                                   ▼
  │         User enters password                 Show error, stay on email step
  │          │
  │         POST /api/v2/auth/user/login
  │           {email, password, source:"web"}
  │          │
  │         Backend:
  │          - MD5-verifies password in antz_users
  │          - Creates user in WSO2 via SCIM2
  │          - Returns {success:true, token, message:"Proceed with SSO login"}
  │          │
  │          ▼
  ▼         Same as Scenario 1
client.login() — redirect to WSO2 /authorize
             │
             ▼
WSO2 hosted login page (auth.antzsystems.com)
  - User enters username + password
  - WSO2 validates
             │
             ▼
Redirect to /callback?code=...&state=...
             │
             ▼
/callback page:
  1. client.handleCallback() — exchanges code for WSO2 tokens (sessionStorage)
  2. hydrateBackendSession():
       a. getUserDataInSsoFlow() — POSTs /api/v2/auth/session with WSO2 Bearer
          → backend returns { token, user, roles, modules, zoos, pharmacy, ... }
          → stored in localStorage.userDetails (token = backend-issued Antz JWT)
       b. On falsy/error response, getUserDataInSsoFlow internally calls
          client.logout() so the user isn't trapped in a silent re-auth loop
  3. router.replace(returnUrl)
             │
             ▼
App is logged in. Every /api/* call sends
Authorization: Bearer <backend JWT from userDetails.token>.
The raw WSO2 access token is never sent to /api/* after hydrate.
```

---

## Token source for `/api/*` calls (updated)

`GetAPIHeader()` in `src/lib/api/utility/index.js` now prefers the backend JWT:

```js
if (userDetails?.token) {
  // After hydrate — backend-issued Antz JWT (populated by getUserDataInSsoFlow)
  header['Authorization'] = `Bearer ${userDetails.token}`
} else if (isWso2AuthEnabled()) {
  // Before hydrate — raw WSO2 access token (used only for the bootstrap getUserDataInSsoFlow call itself)
  const token = await wso2Client.getAccessToken()
  if (token) header['Authorization'] = `Bearer ${token}`
}
```

**Why**: the backend `AuthFilter` with `USE_SSO=true` accepts WSO2 tokens on `/api/v2/auth/session`, exchanges them for an Antz session JWT, and expects that Antz JWT on all subsequent `/api/*` calls. This matches the pre-WSO2 session pattern — only the login bootstrap changes.

The previous "send raw WSO2 token on every call" behavior is kept as a comment in the same file for reference.

---

## CORS dev proxy

To avoid CORS when the backend is on a different origin (e.g. Cloudflare tunnel for dev), axios base URL is set to a relative `/api/` path in development:

```js
// src/lib/api/utility/index.js
const base_url = process.env.NODE_ENV === 'development'
  ? '/api/'
  : `${process.env.NEXT_PUBLIC_API_BASE_URL}`
```

`next.config.js` rewrites `/api/:path*` server-side to `${NEXT_PUBLIC_BASE_URL}/api/:path*`:

```js
if (process.env.NODE_ENV === 'development') {
  const backend = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080/').replace(/\/$/, '')
  rules.push({
    source: '/api/:path*',
    destination: `${backend}/api/:path*`
  })
}
```

Browser → `http://localhost:3001/api/...` (same-origin, no preflight)
Next.js dev server → proxies to `${NEXT_PUBLIC_BASE_URL}/api/...` server-side (no CORS).

All login API helpers now share the same `axiosPost` plumbing — `ssoLoginCheck()` and `getUserDataInSsoFlow()` (in `src/lib/api/wso-login/`), and `legacyLogin()` / `sendOTP()` / `verifyOTP()` / `resetPassword()` (in `src/lib/api/login/`) — so they all benefit from this rewrite without each having to import axios directly.

**Restart the Next.js dev server** after changing `NEXT_PUBLIC_BASE_URL` — the rewrite reads env once at startup.

---

## Endpoint usage

### Discovery + full auth (web login)

**`POST /api/v2/auth/user/login`** — public, no Bearer token. Path constant: `SSO_LOGIN_CHECK` in `src/constants/WsoLoginConstant.js`.
Helper: `ssoLoginCheck({email, password?})` in `src/lib/api/wso-login/index.js` (uses relative URL via `axiosPost`).

| Mode | Request body | Success response | Error response |
|---|---|---|---|
| Discovery | `{email, source:"web"}` | `{success:true, data:{auth_method:"sso"\|"password"}, message}` | `{success:false, message:"Invalid Username/Email"}` or `"This Account Has Been Suspended !!"` |
| Full auth | `{email, password, source:"web"}` | `{success:true, data:{wso2Id, user_id, already_in_wso2, provisioned}, token, token_expiry, message:"Proceed with SSO login"}` | `{success:false, message:"Invalid Username/Email or Password"}` or `"Failed to Login"` |

### Session bootstrap after WSO2 callback (and on every page reload in SSO mode)

**`POST /api/v2/auth/session`** — requires Bearer token. Path constant: `WSO_SESSION` in `src/constants/WsoLoginConstant.js`.
Helper: `getUserDataInSsoFlow()` in `src/lib/api/wso-login/index.js` — the SSO equivalent of legacy `callRefreshToken()`.

- **First call** (immediately after WSO2 callback): `GetAPIHeader` sends the **WSO2 access token** as Bearer because `userDetails.token` isn't populated yet.
- **Subsequent calls** (every page refresh while in SSO mode): `userDetails.token` is sent. The backend re-validates and returns a fresh payload + (potentially) a new Antz JWT.
- Backend validates WSO2 token, maps `JWT.sub` → `antz_users.wso2_id`, returns full Antz session:
  ```json
  {
    "token": "<backend-issued Antz JWT>",
    "user": { "user_id": 42, "user_email": "...", "zoos": [...] },
    "roles": { "role_id": 3, "role_name": "admin" },
    "modules": { "pharmacy_data": { "pharmacy": [...] } }
  }
  ```
- Response written to `localStorage.userDetails`. `userDetails.token` now holds the backend JWT.
- All subsequent `/api/*` calls use `userDetails.token` via `GetAPIHeader`.
- On falsy/error response, `getUserDataInSsoFlow()` internally calls `client.logout()` to terminate the WSO2 session — prevents the silent re-auth loop where `/authorize` succeeds but bootstrap keeps failing.

### WSO2 (called directly by `@antzsoft/wso2-auth-web`)

| Endpoint | Via | Purpose |
|---|---|---|
| `{WSO2_BASE_URL}/t/{TENANT}/oauth2/authorize` | `client.login()` | Start PKCE flow |
| `{WSO2_BASE_URL}/t/{TENANT}/oauth2/token` | `client.handleCallback()` / `client.refreshTokens()` | Code → tokens, silent refresh |
| `{WSO2_BASE_URL}/t/{TENANT}/oidc/logout` | `client.logout()` | Server-side session cleanup |

### Protected data endpoints

All existing `/api/*` endpoints (organization, languages, pharmacy, hospital, etc.) receive `Authorization: Bearer <backend JWT>` from `GetAPIHeader`.

### Not used (reference only)

- `POST /api/v2/sso/ensure-user` — admin/QA only
- `GET /api/v2/sso/user/exists` — admin/QA only
- `PATCH /api/v2/sso/user/{wso2Id}` — admin/QA only
- `GET /api/v2/sso/config` — smoke test

---

## Complete file-by-file change map (24 files)

Every file touched by the WSO2 integration, grouped by role. New files are marked **(new)**; everything else is modified.

### Core auth lib — `src/lib/auth/`

| File | Role |
|---|---|
| `authMode.js` **(new)** | One-liner: `isWso2AuthEnabled()` returns `process.env.NEXT_PUBLIC_WSO2_AUTH_ENABLED === 'true'`. Every WSO2-specific branch in the codebase gates on this. |
| `wso2Client.js` **(new)** | Singleton `AntzAuthClient` configured from env vars (`NEXT_PUBLIC_WSO2_*`). Sets `refreshBufferSeconds: 10` so proactive silent-refresh fires 10s before expiry. Re-used by every other file that needs the client. |
| `wso2Hydrate.js` **(new)** | `hydrateBackendSession()` — after a successful WSO2 callback, POSTs `/api/v2/auth/session` with the WSO2 Bearer → gets full Antz session (`{ user, roles, modules, token? }`) → writes `userDetails` / `userData` / `role` / `accessToken` / `selectedStore` to localStorage. Falls back to building a minimal session from id_token claims if the bootstrap call fails. Also runs `saveDeviceId()` + `setLastLoggedUser()`. |

### API layer — `src/lib/api/`

| File | Role |
|---|---|
| `auth.js` | Hosts the legacy `callRefreshToken()` only (POSTs `v1/auth/refreshtoken` for legacy-mode page reloads). The SSO bootstrap was moved out and renamed — see `wso-login/index.js`. |
| `wso-login/index.js` **(new)** | SSO endpoints. `ssoLoginCheck({email, password?})` against `SSO_LOGIN_CHECK` (= `v2/auth/user/login`) for the 3-scenario discovery/full-auth flow. `getUserDataInSsoFlow()` against `WSO_SESSION` (= `v2/auth/session`) — the SSO equivalent of `callRefreshToken`, called from `wso2Hydrate.js` on first login AND from `AuthContext.initAuthWso2` on every page reload while in SSO mode. On a falsy/error response, this helper itself triggers `client.logout()` so the user can't get stuck in a re-auth loop. |
| `login/index.js` | Legacy / non-SSO endpoints. `legacyLogin({email, password})` (renamed from `nonSsoLogin`) posts to `LEGACY_LOGIN` (= `/api/v1/auth/login`) — the temporary CORS-workaround path for `handleLoginLegacy`. `sendOTP` / `verifyOTP` / `resetPassword` (and their constants `SEND_OTP` / `VERIFY_OTP` / `RESET_PASSWORD`) drive the legacy forgot-password OTP flow. |
| `utility/index.js` | `GetAPIHeader()` now prefers `userDetails.token` (backend JWT) and falls back to `wso2Client.getAccessToken()` only before hydrate has populated `userDetails`. `base_url` switches to relative `/api/` in dev so `axiosPost`/`axiosFormPost`/etc. all go through the Next.js rewrite (same-origin, no CORS preflight). The previous "WSO2 Bearer on every call" shape is kept as a commented reference block. |

### API endpoint constants — `src/constants/`

| File | Role |
|---|---|
| `WsoLoginConstant.js` **(new)** | SSO endpoint paths. `SSO_LOGIN_CHECK = 'v2/auth/user/login'` and `WSO_SESSION = 'v2/auth/session'`. Imported by `src/lib/api/wso-login/index.js`. |
| `LegacyLoginConstant.js` **(new)** | Legacy endpoint paths. `LEGACY_LOGIN = '/api/v1/auth/login'`, `SEND_OTP`, `VERIFY_OTP`, `RESET_PASSWORD`. Imported by `src/lib/api/login/index.js`. Centralising these means changing a route path is a one-line edit instead of a hunt across helper files. |

### Pages — `src/pages/`

| File | Role |
|---|---|
| `login/index.js` | 3-scenario login UI (email → Continue → discovery → SSO redirect or password field → full auth → SSO redirect) when `isWso2AuthEnabled()`. Legacy email+password form otherwise. Driven by `ssoLoginCheck()`. |
| `callback/index.js` **(new)** | Dual-purpose `/callback`: (a) `?code=...` → `client.handleCallback()` + `hydrateBackendSession()` + push user/userData into `AuthContext` + redirect to `sessionStorage.returnUrl`; (b) post-logout landing with no `code` → straight to `/login`; (c) `?error=...` → toast + `/login?error=…`. Uses `BlankLayout`, `guestGuard = true`, `authGuard = false`. |
| `change-password/index.js` **(new)** | WSO2-backed change-password flow. Calls `client.sendOtp()` → if `otpRequired:true`, shows OTP input; else proceeds directly. Then `client.changePassword(current, new, otp?)`. Handles all `Antz*Error` subclasses (`InvalidCredentials`, `InvalidOtp`, `OtpExpired`, `OtpRequired`, `OtpMaxAttempts`, `PasswordPolicy`, `SessionExpired`). Auto-logs out 2s after success because WSO2 invalidates the refresh token. |
| `forgot-password/index.js` | WSO2 mode: `client.forgotPassword()` — opens WSO2's self-service password-reset flow. Legacy mode: existing OTP flow unchanged. |

### Guards + watcher — `src/@core/components/auth/` + `src/components/auth/`

| File | Role |
|---|---|
| `AuthGuard.js` | Session check now reads `client.isAuthenticated()` in WSO2 mode, `localStorage.userData` in legacy. When authenticated and in WSO2 mode, also renders `<Wso2SessionWatcher />` alongside `children`. |
| `GuestGuard.js` | Same `isAuthenticated()` / `userData` gate in reverse — already-logged-in users can't see `/login`. |
| `src/components/auth/Wso2SessionWatcher.js` **(new)** | Owns `useAntzAuth(client)`. Because it only mounts after `AuthGuard` verifies the user is authenticated, the hook's `restore()` sees tokens on first render and the package's proactive refresh timer + `visibilitychange` listener arm correctly. Watches `status === 'unauthenticated'`; when it flips, shows a `react-hot-toast` expiry message, calls `logout()` from the hook (best-effort token cleanup), then `auth.logout()` (our AuthContext cleanup + redirect). `firedRef` keeps it single-shot. |

### Contexts — `src/context/`

| File | Role |
|---|---|
| `AuthContext.js` | Dual `initAuth` / `handleLogin*` / `handleLogout` paths gated on the flag. `initAuthWso2` calls `hydrateBackendSession()` (which calls `getUserDataInSsoFlow()`) on **every** mount in SSO mode — re-validates the backend session on every page reload, mirroring legacy `callRefreshToken`. `handleLoginWso2` stores `returnUrl` and calls `client.login()`. `handleLoginLegacy` routes through `legacyLogin()` (temporary CORS workaround) and only promotes the user when `data?.success === true`. `handleLogout` clears React/queryClient state + app-specific localStorage keys, then hands off to `wso2HookLogout()` (= the package's `useAntzAuth(client).logout`). The package 1.2.7 `client.logout()` does revoke + `_clearTokens` + a real browser GET `/oidc/logout?id_token_hint=...` that actually kills WSO2's `commonAuthId` cookie. Auto-logout is **not** owned here — `<Wso2SessionWatcher />` handles it. |
| `PariveshContext.js` | `fetchOrgData()` gets its Bearer from `wso2Client.getAccessToken()` in WSO2 mode instead of `localStorage.accessToken`. Guards with `wso2Client.isAuthenticated()` before fetching. |

### UX chrome — `src/@core/layouts/components/shared-components/`

| File | Role |
|---|---|
| `UserDropdown.js` | Adds a "Change Password" menu item that routes to `/change-password` — only rendered when `isWso2AuthEnabled()`. Existing Logout item unchanged (already routes through `auth.logout()`). |

### Build / runtime config

| File | Role |
|---|---|
| `next.config.js` | `transpilePackages: ['@antzsoft/wso2-auth-web']` so the ESM package works under Next.js. Rewrite now reads `NEXT_PUBLIC_BASE_URL` at dev-server startup (was hardcoded `http://localhost:8080`): `/api/:path*` → `${NEXT_PUBLIC_BASE_URL}/api/:path*`. Restart dev server after env changes. |
| `package.json` | Adds `@antzsoft/wso2-auth-web` dep. `dev`/`start` scripts pinned to port 3001 (WSO2 console has `http://localhost:3001/callback` as the authorized redirect URL). |
| `.env.development` | Adds `NEXT_PUBLIC_WSO2_AUTH_ENABLED`, `NEXT_PUBLIC_WSO2_BASE_URL`, `NEXT_PUBLIC_WSO2_TENANT`, `NEXT_PUBLIC_WSO2_CLIENT_ID`, `NEXT_PUBLIC_WSO2_REDIRECT_URI`, `NEXT_PUBLIC_APP_URL`. Backend URLs toggled via commented blocks for sso vs non-sso tunnels. |
| `tsconfig.json` | Includes `.next/dev/types/**/*.ts` so TypeScript picks up the package's ambient types during dev. |
| `next-env.d.ts` | Auto-regenerated reference line — no manual WSO2 content. |

### Unrelated collateral

| File | Role |
|---|---|
| `src/components/dashboard/DashboardStatsPanel.js` | `stats?.map` null-safety fix only — not WSO2-related, noted for completeness since it's in the same branch diff. |

### Docs

| File | Role |
|---|---|
| `docs/wso2-login-flow.md` **(new)** | This document — single source of truth for the current flow. |
| `docs/wso2-auth-migration.md` **(new)** | Migration changelog / rollback notes. Points here for the authoritative flow description. |

---

## Token & state storage

### sessionStorage (managed by `@antzsoft/wso2-auth-web`)

| Key | Value |
|---|---|
| `antz_auth_access_token` | WSO2 access JWT — used once to bootstrap the Antz session |
| `antz_auth_refresh_token` | Opaque refresh token — used for silent WSO2 refresh |
| `antz_auth_id_token` | WSO2 ID token — decoded locally for user claims (fallback path) |
| `antz_auth_expires_at` | Unix ms expiry |
| `returnUrl` | Page to return to after WSO2 callback |

### localStorage (managed by our code)

| Key | Source |
|---|---|
| `userDetails` | `hydrateBackendSession()` — full response from `getUserDataInSsoFlow()` (SSO) or `callRefreshToken()` (legacy). `userDetails.token` = backend JWT |
| `userData` | `hydrateBackendSession()` — compact `{ email, fullName, lastName, role, id, username }` |
| `role` | `hydrateBackendSession()` — `roles.role_name` from backend |
| `accessToken` | Backup copy of WSO2 access token |
| `selectedStore` | Pharmacy selector |
| `antz_device_id`, `antz_last_logged_user` | Device info |

---

## Configuration checklist

### WSO2 Console

- [ ] Application registered with client id = `NEXT_PUBLIC_WSO2_CLIENT_ID`
- [ ] Authorized Redirect URLs includes `http://localhost:3001/callback` + `http://localhost:3001`
- [ ] `deployment.toml` CORS allows `http://localhost:3001`

### Backend (`api.dev.antzsystems.com` / tunnel)

- [ ] `USE_SSO=true`
- [ ] `Wso2JwtValidator` configured with matching `WSO2_BASE_URL` + `WSO2_TENANT`
- [ ] `/api/v2/auth/session` accepts WSO2 Bearer token and returns `{ token, user, roles, modules, ... }` (the SSO bootstrap endpoint hit by `getUserDataInSsoFlow()`)
- [ ] `/api/v1/auth/refreshtoken` retained for legacy mode page reloads (used by `callRefreshToken()`)
- [ ] Test user exists in `antz_users` with `account_status='active'` and `wso2_id=<WSO2 sub>`

### Frontend `.env.development`

- [ ] `NEXT_PUBLIC_WSO2_AUTH_ENABLED=true`
- [ ] `NEXT_PUBLIC_WSO2_BASE_URL=https://auth.antzsystems.com`
- [ ] `NEXT_PUBLIC_WSO2_TENANT=dev`
- [ ] `NEXT_PUBLIC_WSO2_CLIENT_ID=<client-id>`
- [ ] `NEXT_PUBLIC_WSO2_REDIRECT_URI=http://localhost:3001/callback`
- [ ] `NEXT_PUBLIC_APP_URL=http://localhost:3001`
- [ ] `NEXT_PUBLIC_BASE_URL=https://<backend-host-or-tunnel>/` (used by `next.config.js` rewrite)

---

## Logout flow

Single source of truth: both manual click and auto-expiry funnel through `auth.logout()` (= `AuthContext.handleLogout`). The package's `useAntzAuth(client).logout` is only invoked from inside `handleLogout` — never directly from a UI surface.

```
User clicks logout (UserDropdown) OR Wso2SessionWatcher detects expiry
    │
    ▼
auth.logout() — src/context/AuthContext.js (handleLogout)
    - sessionStorage['antz_manual_logout'] = '1'  → silences watcher's expiry toast
    - queryClient cancel + clear (queries / mutations / caches)
    - clearLocalState() — setUser/setUserData/pharmacy/parivesh/hospital reset
    - resetLanguage()
    - localStorage.removeItem for app-specific keys: accessToken, role,
      selectedParivesh, selectedStore, userData, userDetails
      (NOT localStorage.clear() — that would wipe antz_auth_* before the
       package can read them; antz_device_id + antz_last_logged_user
       survive automatically because they're not in the removal list)
    - sessionStorage.clear()
    │
    ▼
wso2HookLogout() — useAntzAuth(client).logout
    - Sets package React state: status='unauthenticated', user=null, accessToken=null
    - Delegates to client.logout()
    │
    ▼
client.logout() — @antzsoft/wso2-auth-web@1.2.7
    1. POST /oauth2/revoke (keepalive: true)         — kills refresh_token server-side
    2. _clearTokens()                                — removes 6 antz_auth_* keys
    3. window.location.href = ${WSO2}/oidc/logout
         ?id_token_hint=...&client_id=...&post_logout_redirect_uri=...
       ← real browser GET, NOT a fetch. The 302 chain runs in the browser
         so Set-Cookie: commonAuthId=; Max-Age=0 actually clears the WSO2
         SSO cookie. (Pre-1.2.7 used POST via fetch which couldn't kill it.)
    │
    ▼
WSO2 kills its session, redirects to postLogoutRedirectUri
    (currently NEXT_PUBLIC_WSO2_REDIRECT_URI = /callback — only that URL is
     whitelisted in WSO2 Console. /callback page sees no `code` param and
     router.replace('/login').)
    │
    ▼
User on /login. Click Sign In → no commonAuthId → WSO2 shows password page.
```

---

## Session expiry (auto-logout)

Auto-logout is owned by a dedicated component — `<Wso2SessionWatcher />` (at `src/components/auth/Wso2SessionWatcher.js`) — which is rendered **inside `AuthGuard`** and only mounts once the user is authenticated. This is the critical ordering: `useAntzAuth` must first see tokens in `sessionStorage` for its one-shot `restore()` to succeed, which is what arms the package's internal proactive-refresh timer and visibility listener. (If the hook mounts at app root before login, `restore()` runs, finds no tokens, and goes dormant — timers never start.) This mirrors the `sample-nextjs-client-antz-auth/src/app/dashboard/page.tsx` pattern.

The watcher is a minimal, render-nothing component:

```js
const { status, logout } = useAntzAuth(client)
const auth = useAuth()
useEffect(() => {
  if (status !== 'unauthenticated') return
  // show toast, then call package logout() and AuthContext auth.logout()
}, [status])
```

When the refresh token is revoked or expires, the package updates `status` → `'unauthenticated'`, the effect fires a `react-hot-toast` error — *"Your session has expired. Please log in again."* — then calls `logout()` from the hook (best-effort to clear the package's tokens) and `auth.logout()` (clears our localStorage/React state and redirects to `/login`). A `firedRef` guard keeps this to a single pass.

| Source of expiry detection | Who handles it |
|---|---|
| **Session restore on mount** (hook sees stale tokens at first render) | `useAntzAuth` internal `restore()` → sets `status='unauthenticated'` → watcher effect |
| **Proactive silent refresh** (scheduled `refreshBufferSeconds` before expiry) | `useAntzAuth` internal timer → if refresh fails, status flips |
| **Tab visibility return** (browser regains focus after long idle) | `useAntzAuth` internal `visibilitychange` listener |
| **Manual logout click** | `auth.logout()` directly — watcher is not involved |

`AuthContext` itself no longer runs a polling interval or listens for visibility — that was a workaround from when `useAntzAuth` was mounted at app root. Removing the workaround means `/oauth2/token` refresh calls now fire at the correct schedule (visible in DevTools → Network, filter `token`).

Note: the backend JWT (`userDetails.token`) has its own expiry. If it expires before the WSO2 token, the next `/api/*` call will 401. Handling: call `getUserDataInSsoFlow()` again to obtain a fresh backend JWT (reuse the same helper that bootstrapped the session). In SSO mode this is implicit on every page reload via `AuthContext.initAuthWso2`, so realistic exposure is only to long-lived SPA sessions that never reload — wire an axios 401 interceptor if that becomes a real problem.

---

## Re-hydrate on every reload (SSO mode)

`initAuthWso2` calls `hydrateBackendSession()` on **every** mount when WSO2 tokens are present — not only when localStorage is empty. `getUserDataInSsoFlow()` runs, backend JWT is obtained (or refreshed), localStorage is rebuilt with the latest payload. Mirrors legacy `callRefreshToken` behaviour. On failure, `getUserDataInSsoFlow` itself triggers `client.logout()`; AuthContext additionally calls `wso2HookLogout()` from its catch block (the package's `_logoutInProgress` guard makes the second call a safe no-op).

---

## Switching modes

**WSO2 mode:**

1. `NEXT_PUBLIC_WSO2_AUTH_ENABLED=true`
2. Backend `USE_SSO=true`
3. Restart Next.js → login page shows email field → Continue → (password if Scenario 2) → WSO2 redirect → callback → `getUserDataInSsoFlow()` → dashboard

**Legacy mode:**

1. `NEXT_PUBLIC_WSO2_AUTH_ENABLED=false`
2. Backend `USE_SSO=false`
3. Restart Next.js → login page shows email + password form → submits via `legacyLogin()` to `LEGACY_LOGIN` (= `/api/v1/auth/login`) → dashboard

---

## Known limitations

1. **Backend JWT 401 mid-session not auto-refreshed.** `getUserDataInSsoFlow()` runs on every page reload, so realistic exposure is only to long-lived SPA sessions where the user never reloads. If `userDetails.token` expires mid-session, `/api/*` calls 401 silently. `Wso2SessionWatcher` only reacts to WSO2 session status, not backend-JWT 401s. Fix when needed: axios 401 interceptor that re-runs `getUserDataInSsoFlow()`.
2. **Legacy login is on a temporary proxy path.** `handleLoginLegacy` calls `legacyLogin()` which posts to `LEGACY_LOGIN` (= `/api/v1/auth/login`) via the dev rewrite. The original direct-`base_url` code is kept as a commented block in `AuthContext.js`. Restore it once backend CORS is fixed for the legacy endpoint.
3. **`postLogoutRedirectUri` adds an extra hop.** Set to `NEXT_PUBLIC_APP_URL || NEXT_PUBLIC_WSO2_REDIRECT_URI`; only the latter (`/callback`) is whitelisted in WSO2 Console, so logout currently lands on `/callback` and bounces to `/login`. Whitelisting `NEXT_PUBLIC_APP_URL` would skip the bounce.
4. **No session-expiry warning UX** — watcher shows a single toast, waits 2s for it to be readable, then logs out. No countdown or "stay signed in" prompt.

---

## Reference

- `/Users/irraya/Downloads/WSO2_SSO_API_Reference.html`
- `/Users/irraya/Downloads/antz-login-flow-wso2.pdf`
- `/Users/irraya/work space/sample-nextjs-client-antz-auth` (client-only sample)
- `docs/wso2-auth-migration.md` (migration journal)
