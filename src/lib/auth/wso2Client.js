/**
 * Singleton AntzAuthClient for the Antz Web Dashboard.
 *
 * No proxyUrl — calls WSO2 REST APIs directly from the browser.
 * WSO2 CORS must be configured to allow this app's origin.
 */

import { AntzAuthClient } from '@antzsoft/wso2-auth-web'

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
  refreshBufferSeconds: 10
})

export default client
