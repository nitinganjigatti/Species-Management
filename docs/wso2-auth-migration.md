# WSO2 Auth Migration — Rollback & Historical Notes

**Flow documentation lives in [`wso2-login-flow.md`](./wso2-login-flow.md).** This file is kept only for the migration changelog and mode-switching instructions. Anything about how the current system works belongs in the flow doc — don't duplicate it here.

**Initial cutover**: 2026-04-17
**Last revision**: 2026-05-05 — `@antzsoft/wso2-auth-web` upgraded to `^1.3.6`; `Wso2SessionWatcher` rewritten from status-watching to two SDK callbacks (`onSessionExpired`, `onDailyExpiryWarning`) — no more `wasAuthRef`, `firedRef`, `antz_manual_logout` flag, or toast; `AuthGuard` no longer redirects to `/login` in WSO2 mode (prevented login-page double render caused by race between `router.replace` and `wso2HookLogout`'s `window.location.href`); `initAuthWso2` now includes `returnUrl` in its `/login` redirect; login page `logout_reason` key is no longer removed on mount (only on user interaction) to fix message-flash bug; `ssoLoginCheck` normalizes 5xx responses to a friendly message before they reach the UI; daily expiry check config added to `wso2Client.js` (`enableDailyExpiryCheck`, `dailyCheckHour: 5`, `expiryWarningWindowSeconds: 86400`); `handleSsoPasswordSubmit` now handles two distinct backend success shapes — normal login `{success:true, token, user:{...}}` stores session directly and navigates to dashboard (no WSO2 redirect); SSO provision `{success:true, message:"Proceed with SSO login"}` redirects to WSO2 PKCE flow.

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
| No auto-logout on expiry | `<Wso2SessionWatcher />` uses `onSessionExpired` / `onDailyExpiryWarning` SDK callbacks (v1.3.6) — calls `auth.logout()` on RT expiry or daily 5 AM warning |

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
3. **`postLogoutRedirectUri` falls back to the callback URL.** `wso2Client.js` uses `NEXT_PUBLIC_APP_URL || NEXT_PUBLIC_WSO2_REDIRECT_URI`. As of 2026-04-28, only `NEXT_PUBLIC_WSO2_REDIRECT_URI` (the `/callback` URL) is whitelisted in WSO2 Console → Authorized Redirect URLs. Setting `NEXT_PUBLIC_APP_URL` without whitelisting it makes WSO2 stall on its own logout page mid-flow. Ask the WSO2 admin to whitelist the app URL to remove the extra hop.

---

## Reference

- `/Users/irraya/Downloads/WSO2_SSO_API_Reference.html` — backend contract
- `/Users/irraya/Downloads/antz-login-flow-wso2.pdf` — UX spec with flow diagram
- `/Users/irraya/work space/latest wso2 sample app/sample-nextjs-client-antz-auth` — reference client-only sample (our `Wso2SessionWatcher` mirrors its `dashboard/page.tsx` pattern)
- [`wso2-login-flow.md`](./wso2-login-flow.md) — authoritative description of the current flow, file-by-file change map, token storage, config checklist
