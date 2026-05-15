# WSO2 Auth Migration — Rollback & Historical Notes

**Flow documentation lives in [`wso2-login-flow.md`](./wso2-login-flow.md).** This file is kept only for the migration changelog and mode-switching instructions. Anything about how the current system works belongs in the flow doc — don't duplicate it here.

**Initial cutover**: 2026-04-17
**Last revision**: 2026-05-13

---

## Changelog

### 2026-05-13 — Pharmacy navigation race condition fix

**Bug:** After login (both SSO and legacy), the pharmacy module showed only master navigation items. Refreshing the page showed the correct items. Root cause: `selectedPharmacy` in React context was empty when `VerticalNavItems()` rendered for the first time after login.

**Two separate causes fixed:**

| Login path | Root cause | Fix |
|---|---|---|
| **SSO (`/callback`)** | `reconcilePharmacyStorage()` inside `hydrateBackendSession()` writes `selectedStore` to localStorage but never calls `setSelectedPharmacy()` — React context stayed empty | After `hydrateBackendSession()`, read `selectedStore` from localStorage and call `setSelectedPharmacy()` before `setUser` |
| **Legacy (`handleLoginLegacy`)** | `setUser`/`setUserData` were called before `await reconcilePharmacy()` — nav rendered on the `setUser` re-render before pharmacy context was ready | Moved `reconcilePharmacy()` to run before `setUser`/`setUserData`, matching the correct order already used in `initAuthWso2` (page refresh) |

**Files changed:**

| File | What changed |
|---|---|
| `src/pages/callback/index.js` | Added `usePharmacyContext` + `readAsync` imports; after `hydrateBackendSession()`, reads `selectedStore` from localStorage and calls `setSelectedPharmacy()` before `auth.setUser()` |
| `src/context/AuthContext.js` | In `handleLoginLegacy`: moved `await reconcilePharmacy(data)` before `setUserData`/`setUser` |

---

### 2026-05-12 — `@antzsoft/wso2-auth-web` upgraded to `^1.4.5`

**SDK API change — `onDailyExpiryWarning` moves into `AntzAuthClient` config.**

Previously (v1.3.6), both `onSessionExpired` and `onDailyExpiryWarning` were passed as options to `useAntzAuth()` inside `Wso2SessionWatcher`. In v1.4.5 the SDK requires `onDailyExpiryWarning` to be declared in the `AntzAuthClient` constructor instead.

**Files changed:**

| File | What changed |
|---|---|
| `package.json` | `^1.3.6` → `^1.4.5` |
| `src/lib/auth/wso2Client.js` | Added `onDailyExpiryWarning: () => _onDailyExpiryWarning()` to `AntzAuthClient` config; exported `setDailyExpiryWarningHandler` bridge function; removed `dailyCheckHour`, `dailyCheckMinute`, `expiryWarningWindowSeconds` (SDK 1.4.5 defaults match our requirements — do not add them back) |
| `src/components/wso-auth/Wso2SessionWatcher.js` | Added `useEffect` that calls `setDailyExpiryWarningHandler(authLogout)` on mount and clears it on unmount; removed `onDailyExpiryWarning` from `useAntzAuth()` options; `onSessionExpired` stays in `useAntzAuth()` unchanged |
| `src/context/AuthContext.js` | Removed stray `debugger` statement from `handleLoginLegacy` |

**Why the bridge pattern?**
`wso2Client.js` is a plain-JS singleton — it cannot call `authLogout` (a React hook result) directly. `setDailyExpiryWarningHandler` lets `Wso2SessionWatcher` register the live React logout function into the singleton at mount time. The singleton's `onDailyExpiryWarning` callback delegates to whatever is currently registered, which at runtime is always `authLogout`.

**New SDK behaviours in 1.4.5 (no code changes needed on our side):**
- Multi-device sessions fixed — same user on multiple browsers no longer silently expires other sessions.
- Network resilience — SDK no longer logs users out on temporary network failures (offline / timeout / 5xx). Only genuine auth failures (expired or revoked tokens) trigger logout.
- Session restore fix — reopening a tab after RT expiry now correctly shows the login screen instead of silently redirecting to the dashboard.
- Password change → all devices — changing or resetting a password immediately revokes all active tokens across all devices; other sessions auto-logout within ~15 min (current access token TTL).

---

### 2026-05-12 — Change-password password policy + hint UI

**Files changed:**

| File | What changed |
|---|---|
| `src/pages/change-password/index.js` | Added capital letter requirement to `validateNewPassword` (`/[A-Z]/`); `PASSWORD_REQUIREMENTS` array replaces old single-string constant; hint below the New Password field redesigned — shows a **2-column grid** of all requirements + `e.g. MyPass@1` example before the user types, collapses to a single red error (specific failing rule) while typing, green success line once all rules pass; no tooltip or info icon. |

**Password rules (current):**
1. Min. 8 characters
2. At least one letter
3. At least one capital letter *(new)*
4. At least one number
5. At least one special character (`@#$&*`)

---

### 2026-05-05 — `@antzsoft/wso2-auth-web` upgraded to `^1.3.6`

`Wso2SessionWatcher` rewritten from status-watching to two SDK callbacks (`onSessionExpired`, `onDailyExpiryWarning`) — no more `wasAuthRef`, `firedRef`, `antz_manual_logout` flag, or toast; `AuthGuard` no longer redirects to `/login` in WSO2 mode (prevented login-page double render caused by race between `router.replace` and `wso2HookLogout`'s `window.location.href`); `initAuthWso2` now includes `returnUrl` in its `/login` redirect; login page `logout_reason` key is no longer removed on mount (only on user interaction) to fix message-flash bug; `ssoLoginCheck` normalizes 5xx responses to a friendly message before they reach the UI; daily expiry check config added to `wso2Client.js` (`enableDailyExpiryCheck`, `dailyCheckHour: 5`, `expiryWarningWindowSeconds: 86400`); `handleSsoPasswordSubmit` now handles two distinct backend success shapes — normal login `{success:true, token, user:{...}}` stores session directly and navigates to dashboard (no WSO2 redirect); SSO provision `{success:true, message:"Proceed with SSO login"}` redirects to WSO2 PKCE flow.

---

### 2026-04-17 — Initial cutover

`@antzsoft/wso2-auth-web` at `^1.2.7`. PKCE authorization-code flow wired up; `/callback` page added; `hydrateBackendSession` bootstraps Antz session from WSO2 tokens; `AuthContext` split into WSO2 / legacy paths gated on `NEXT_PUBLIC_WSO2_AUTH_ENABLED`.

---

## SDK version history

| Version | Date | Key change |
|---|---|---|
| `^1.2.7` | 2026-04-17 | Initial cutover — PKCE flow, working logout |
| `^1.3.6` | 2026-05-05 | `onSessionExpired` / `onDailyExpiryWarning` callbacks; `Wso2SessionWatcher` rewritten; daily expiry check config added |
| `^1.4.5` | 2026-05-12 | `onDailyExpiryWarning` moves into `AntzAuthClient` config; `dailyCheckHour` / `dailyCheckMinute` / `expiryWarningWindowSeconds` removed (SDK defaults); `setDailyExpiryWarningHandler` bridge added; multi-device session fix; network resilience; session restore fix |

---

## Why WSO2

| Before (Custom Auth) | After (WSO2 Auth) |
|---|---|
| Password posted directly to backend | WSO2 Identity Server owns identity — for SSO users, the password never hits our frontend |
| Manual token refresh via `/v1/auth/refreshtoken` | Silent refresh built into `@antzsoft/wso2-auth-web` (fires `refreshBufferSeconds` before expiry) |
| Custom localStorage token juggling | Package owns WSO2 tokens in `sessionStorage` under `antz_auth_*` keys |
| No CSRF protection | PKCE + state parameter baked into the authorization-code flow |
| No SSO story | Single WSO2 session across all Antz apps |
| Custom OTP / forgot-password pages | WSO2 self-service flows + `client.sendOtp()` / `client.changePassword()` |
| No auto-logout on expiry | `<Wso2SessionWatcher />` uses `onSessionExpired` (via `useAntzAuth`) + `onDailyExpiryWarning` (via `AntzAuthClient` config, v1.4.5) — calls `auth.logout()` on RT expiry or daily 5 AM warning |
| Sessions across devices conflict | Fixed in SDK v1.4.5 — multiple devices can be logged in simultaneously without killing each other |

---

## Mode switch (NOT a one-way cutover)

The migration intentionally preserved the legacy flow so ops can flip back without a git revert.

| Mode | Frontend env | Backend env | Login surface |
|---|---|---|---|
| **WSO2 / SSO** | `NEXT_PUBLIC_WSO2_AUTH_ENABLED=true` | `USE_SSO=true` | 3-scenario flow (email → optional password → WSO2 redirect) |
| **Legacy** | `NEXT_PUBLIC_WSO2_AUTH_ENABLED=false` | `USE_SSO=false` | Standard email+password form → `/v1/auth/login` |

Both flags must agree. Mismatch = 401 on every API call.

When the frontend flag is off, the WSO2 client singleton is still imported (constructor runs, no network calls), but every gated branch falls through to the legacy code — behavior is identical to pre-migration.

---

## Rolling back

1. Set `NEXT_PUBLIC_WSO2_AUTH_ENABLED=false` in `.env.development`.
2. Tell backend to set `USE_SSO=false`.
3. Restart the Next.js dev server — env vars and the `/api/*` rewrite are read once at startup.
4. (Optional) If you need to strip the feature entirely: delete `src/lib/auth/`, `src/pages/callback/`, `src/pages/change-password/`, `src/components/auth/Wso2SessionWatcher.js`; remove every `isWso2AuthEnabled()` branch; drop `@antzsoft/wso2-auth-web` from `package.json`; revert the Bearer-token source in `src/lib/api/utility/index.js`.

Step 1–3 is all that ops actually need for a live rollback.

---

## Temporary workarounds currently in place

These are short-lived deviations from the "clean" design, documented so we remember to undo them.

1. **Legacy login uses the Next.js rewrite, not the backend URL directly.** `handleLoginLegacy` in `src/context/AuthContext.js` calls `legacyLogin({ email, password })` which posts to the path defined by `LEGACY_LOGIN` in `src/constants/LegacyLoginConstant.js` (currently `/api/v1/auth/login`). Reason: the backend is on a Cloudflare tunnel that doesn't have the dev origin allow-listed, so the request needs to go through the Next.js `/api/*` rewrite. The original direct-`base_url` code is kept as a commented block right above the replacement for easy restore.
2. **WSO2 scope `roles` not consumed.** We request `["openid","profile","email","roles"]` but `hydrateBackendSession` pulls roles from the Antz backend response, not the WSO2 id_token. Keep as-is until backend role-claim mapping is finalized.
3. **`postLogoutRedirectUri` falls back to the callback URL.** `wso2Client.js` uses `NEXT_PUBLIC_WSO2_REDIRECT_URI` as `postLogoutRedirectUri` because only that URL is whitelisted in WSO2 Console → Authorized Redirect URLs. Setting `NEXT_PUBLIC_APP_URL` without whitelisting it makes WSO2 stall on its own logout page mid-flow. Ask the WSO2 admin to whitelist the app URL to remove the extra hop.

---

## Reference

- `/Users/irraya/Downloads/WSO2_SSO_API_Reference.html` — backend contract
- `/Users/irraya/Downloads/antz-login-flow-wso2.pdf` — UX spec with flow diagram
- `/Users/irraya/work space/latest wso2 sample app/sample-nextjs-client-antz-auth` — reference client-only sample (our `Wso2SessionWatcher` mirrors its `dashboard/page.tsx` pattern)
- [`wso2-login-flow.md`](./wso2-login-flow.md) — authoritative description of the current flow, file-by-file change map, token storage, config checklist
