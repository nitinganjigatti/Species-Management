import axios from 'axios'
import { axiosPost } from '../utility'
import { getCurrentFix } from 'src/lib/geofence/getFix'
import { isGeofenceEnabled } from 'src/lib/geofence/featureFlag'

const VERIFY = 'v1/auth/geofence-verify'
const HEARTBEAT = 'v1/auth/geofence-heartbeat'

// Response shape we synthesize when the feature flag is off, so existing
// callers (AuthContext, useGeofenceHeartbeat) treat the build as if the
// backend itself had geofencing disabled — no errors, no lock banners, no
// further actions required.
const DISABLED_RESPONSE = Object.freeze({
  success: true,
  data: Object.freeze({ skipped: true, reason: 'geofence_feature_disabled' })
})

/**
 * The geofence backend returns 4xx (400 imprecise_location, 403 outside_geofence)
 * with a STRUCTURED JSON body: { success: false, error, message, data }.
 * Axios throws on 4xx by default. This helper unwraps every non-2xx response
 * into a structured body so callers never have to catch an axios throw.
 *
 * Throws only for true network failures (no response at all — DNS error,
 * offline, CORS preflight failure, etc.).
 */
const unwrap = async axiosPromise => {
  try {
    const res = await axiosPromise

    return res.data
  } catch (err) {
    // Server responded with non-2xx. Coerce to a structured body the caller can read.
    if (err?.response) {
      const body = err.response.data
      if (body && typeof body === 'object') return body

      // Body wasn't a JSON object (empty, HTML error page, plain string, etc.).
      // Synthesize a structured failure so callers don't crash.
      const status = err.response.status
      let code = 'request_failed'
      if (status === 400) code = 'bad_request'
      else if (status === 401) code = 'unauthorized'
      else if (status === 403) code = 'forbidden'
      else if (status === 404) code = 'not_found'
      else if (status >= 500) code = 'server_error'

      return {
        success: false,
        error: code,
        message: typeof body === 'string' && body.length < 200 ? body : `Request failed with status ${status}`,
        data: { http_status: status }
      }
    }

    // No response at all — network failure. Re-throw so the caller's
    // try/catch can surface it as a transient error (heartbeat will retry).
    throw err
  }
}

/**
 * Verify the current GPS fix against the server's geofence rules.
 * Used immediately after login.
 *
 * For the very first post-login call, the standard utility may not yet have
 * userDetails in storage; pass `tokenOverride` to bypass that.
 *
 * Returns the structured backend body (success: true | false). Throws only on
 * GPS errors (permission_denied, timeout, etc.) or network failures.
 *
 * @param {{ tokenOverride?: string, zooId?: number|string }} [opts]
 */
export async function verifyGeofence(opts = {}) {
  // Build-level gate — when the feature is off, skip the GPS fix AND the
  // network round-trip entirely and synthesize a `success: true, skipped`
  // body. Callers only check `success` / `error` so they need no changes.
  if (!isGeofenceEnabled()) return DISABLED_RESPONSE

  const fix = await getCurrentFix()

  if (opts.tokenOverride) {
    const baseUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}`
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.tokenOverride}`
    }
    if (opts.zooId) headers.ZooId = opts.zooId

    return unwrap(axios.post(`${baseUrl}${VERIFY}`, fix, { headers }))
  }

  return unwrap(axiosPost({ url: VERIFY, body: fix }))
}

/**
 * Periodic geofence heartbeat from inside an authenticated session.
 * Same unwrap semantics as verifyGeofence.
 */
export async function heartbeatGeofence() {
  if (!isGeofenceEnabled()) return DISABLED_RESPONSE

  const fix = await getCurrentFix()

  return unwrap(axiosPost({ url: HEARTBEAT, body: fix }))
}
