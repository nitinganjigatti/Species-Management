/**
 * Singleton AntzAuthClient for the Antz Web Dashboard.
 *
 * No proxyUrl — calls WSO2 REST APIs directly from the browser.
 * WSO2 CORS must be configured to allow this app's origin.
 *
 * SDK: @antzsoft/wso2-auth-web ^1.4.5
 *
 * --- v1.4.5 config changes ---
 * • onDailyExpiryWarning moves INTO the AntzAuthClient config (was in useAntzAuth() options).
 *   Because this singleton cannot call React hooks directly, we expose
 *   setDailyExpiryWarningHandler() so Wso2SessionWatcher can wire up authLogout() on mount.
 * • dailyCheckHour / dailyCheckMinute / expiryWarningWindowSeconds removed —
 *   defaults (5:00 AM, 24-hour window) are correct; do NOT add them back.
 * • sessionPollIntervalSeconds NOT added — default 0 (disabled) is correct.
 *   With a 15-min access token TTL, polling adds no meaningful benefit.
 */

import { AntzAuthClient } from '@antzsoft/wso2-auth-web'

// --- v1.4.5: daily expiry handler bridge ---
// onDailyExpiryWarning is now part of AntzAuthClient config, not useAntzAuth().
// This module-level variable holds the React logout function registered by
// Wso2SessionWatcher via setDailyExpiryWarningHandler() on mount.
// Default is a no-op so the client never throws if the watcher isn't mounted yet.
let _onDailyExpiryWarning = () => {}

// Called by Wso2SessionWatcher on mount to wire authLogout() into this singleton.
// Wso2SessionWatcher clears the handler on unmount via setDailyExpiryWarningHandler(() => {}).
export const setDailyExpiryWarningHandler = fn => {
  _onDailyExpiryWarning = fn
}

// postLogoutRedirectUri must be registered in WSO2 Console → Applications →
// antz-web → Protocol → Authorized Redirect URLs. Currently only the /callback
// URL is registered, so we use that — the /callback page already handles
// post-logout landings (no `code` param) by redirecting to /login.
//
// To match the sample app's pattern (using NEXT_PUBLIC_APP_URL), ask the WSO2
// admin to whitelist the app URL (e.g. http://localhost:3001) in the same
// Authorized Redirect URLs list, then swap this back to NEXT_PUBLIC_APP_URL.
const client = new AntzAuthClient({
  baseUrl: process.env.NEXT_PUBLIC_WSO2_BASE_URL,
  clientId: process.env.NEXT_PUBLIC_WSO2_CLIENT_ID,
  redirectUri: process.env.NEXT_PUBLIC_WSO2_REDIRECT_URI,
  tenant: process.env.NEXT_PUBLIC_WSO2_TENANT,
  scopes: ['openid', 'profile', 'email', 'roles'],
  postLogoutRedirectUri: process.env.NEXT_PUBLIC_WSO2_REDIRECT_URI,

  // Testing: with access_token TTL=60s, default buffer=60s would trigger a
  // tight refresh loop (token is always "expiring soon"). Reduce to 10s so
  // proactive refresh fires at t=50s of each token's life.
  // refreshBufferSeconds: 10, by default 60

  // --- v1.4.5: daily expiry check config ---
  // Fires once per day at 5:00 AM local time (SDK default — do NOT override
  // dailyCheckHour / dailyCheckMinute / expiryWarningWindowSeconds).
  // If the refresh token will expire within 24 h, onDailyExpiryWarning fires.
  // The actual logout logic is registered by Wso2SessionWatcher at runtime
  // via setDailyExpiryWarningHandler() above.
  enableDailyExpiryCheck: true,
  onDailyExpiryWarning: () => _onDailyExpiryWarning()

  // v1.3.6 config removed in v1.4.5 — kept here for reference:
  // dailyCheckHour: 5,               // now SDK default — do not add
  // dailyCheckMinute: 0,             // now SDK default — do not add
  // expiryWarningWindowSeconds: 86400 // now SDK default — do not add
})

export default client
