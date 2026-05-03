import axios from 'axios'
import { axiosPost } from '../utility'
import { getCurrentFix } from 'src/lib/geofence/getFix'

const VERIFY = 'v1/auth/geofence-verify'
const HEARTBEAT = 'v1/auth/geofence-heartbeat'

/**
 * The geofence backend returns 4xx (400 imprecise_location, 403 outside_geofence)
 * with a STRUCTURED JSON body: { success: false, error, message, data }.
 * Axios throws on 4xx by default. This helper unwraps both shapes so callers
 * always receive the structured body, regardless of HTTP status.
 *
 * Throws only for true client-side errors (network down, GPS denied, parse error).
 */
const unwrap = async axiosPromise => {
  try {
    const res = await axiosPromise

    return res.data
  } catch (err) {
    // Axios attaches the response when the server replied with non-2xx.
    if (err?.response?.data && typeof err.response.data === 'object') {
      return err.response.data
    }
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
  const fix = await getCurrentFix()

  return unwrap(axiosPost({ url: HEARTBEAT, body: fix }))
}
