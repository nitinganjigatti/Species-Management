import { axiosAuthFormPost, axiosFormPost, axiosPost } from 'src/lib/api/utility'
import { SSO_LOGIN_CHECK, WSO_SESSION } from 'src/constants/WsoLoginConstant'
import client from 'src/lib/auth/wso2Client'

/**
 * Unified login endpoint — supports discovery (email only) and full auth (email + password).
 * Public endpoint, no Bearer token required.
 *
 * Uses axiosPost so the request goes through the shared base_url logic:
 *   - dev:  '/api/'  (relative → Next.js rewrite proxies to backend, bypasses CORS)
 *   - prod: NEXT_PUBLIC_API_BASE_URL  (absolute → backend CORS must allow origin)
 * GetAPIHeader inside axiosPost attaches the same client meta headers
 * (CurrentTimeZone, X-Client-Platform, X-Client-Version) automatically;
 * no Authorization header is added when there's no stored userDetails/token.
 *
 * Discovery response: { success, data: { auth_method: 'sso' | 'password' }, message }
 * Full auth response: { success, data: {...}, token, token_expiry, message }
 * Error:              { success: false, message }
 */
export async function ssoLoginCheck({ email, password }) {
  const body = { email, source: 'web' }
  if (password) body.password = password

  try {
    const response = await axiosPost({ url: SSO_LOGIN_CHECK, body })

    return response?.data
  } catch (error) {
    const status = error.response?.status
    const data = error.response?.data

    // 5xx — backend crash / misconfiguration; never expose internal details to the UI
    if (status >= 500) {
      return { success: false, message: 'Something went wrong. Please try again later.' }
    }

    // Structured API error (4xx with { success, message } shape)
    if (data) return data

    return { success: false, message: error.message || 'Login request failed' }
  }
}
// SSO equivalent of legacy callRefreshToken — bootstraps the Antz session
// from a valid WSO2 access token. Called on every page refresh in SSO mode
// and after the OAuth callback completes.
//
// On a falsy response, kill the WSO2 SSO session via client.logout() so the
// user isn't trapped in a silent re-auth loop on the next /authorize.
// (client.logout handles revoke + _clearTokens + browser GET /oidc/logout.)
// export async function getUserDataInSsoFlow() {
//   debugger
//   let resData
//   try {
//     const response = await axiosPost({ url: WSO_SESSION })
//     console.log('[getUserDataInSsoFlow] raw response:', response)
//     resData = response?.data
//   } catch (err) {
//     console.error('[getUserDataInSsoFlow] request failed:', err?.message)

//     try {
//       await client.logout()
//     } catch (e) {
//       console.error('[getUserDataInSsoFlow] client.logout failed:', e?.message)
//     }

//     return { success: false, message: err?.message || 'Session bootstrap failed' }
//   }

//   if (!resData || resData.success === false) {
//     console.error('[getUserDataInSsoFlow] backend rejected session:', resData?.message)

//     try {
//       await client.logout()
//     } catch (e) {
//       console.error('[getUserDataInSsoFlow] client.logout failed:', e?.message)
//     }
//   }

//   return resData
// }

export async function getUserDataInSsoFlow() {
  let resData
  try {
    const response = await axiosPost({ url: WSO_SESSION })
    resData = response?.data
  } catch (err) {
    const status = err?.response?.status

    console.error('[getUserDataInSsoFlow] request failed:', status, err?.message)

    if (status === 401) {
      // Token expired or invalid
      console.warn('Session expired')

      // OPTION 1: try refresh token (if you have it)
      // await refreshToken()

      // OPTION 2: force logout
      await client.logout()

      return { success: false, message: 'Session expired' }
    }

    // Other errors
    return { success: false, message: err?.message || 'Request failed' }
  }

  if (!resData || resData.success === false) {
    await client.logout()
  }

  return resData
}

// Returns the WSO2 session info, augmented with minute-based countdown fields.
// Raw shape from the package:
//   { access_token_expires_at, access_token_expires_in_seconds,
//     refresh_token_expires_at, refresh_token_expires_in_seconds }
//
// Adds:
//   access_token_expires_in_minutes  — Math.floor(seconds / 60)
//   refresh_token_expires_in_minutes — Math.floor(seconds / 60)
//
// Math.floor (vs round) so a "1m 30s" remaining shows as "1 min" — never
// optimistic. Negative values are clamped to 0 so an expired token doesn't
// display as a negative duration.
export const getSessionInfo = async () => {
  const info = await client?.getSessionInfo()
  if (!info) return info

  const toMinutes = secs => {
    const n = Number(secs)
    if (!Number.isFinite(n)) return null

    return Math.max(0, Math.floor(n / 60))
  }

  return {
    ...info,
    access_token_expires_in_minutes: toMinutes(info.access_token_expires_in_seconds),
    refresh_token_expires_in_minutes: toMinutes(info.refresh_token_expires_in_seconds)
  }
}
