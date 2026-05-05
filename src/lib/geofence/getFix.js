/**
 * Wraps navigator.geolocation.getCurrentPosition in a Promise that always
 * requests a fresh fix (maximumAge: 0) at high accuracy.
 *
 * Resolves with { lat, lng, accuracy_m, timestamp } where timestamp is ISO 8601 UTC.
 * Rejects with an Error whose .code is one of:
 *   - 'unsupported'        — navigator.geolocation not available
 *   - 'permission_denied'  — user blocked the prompt or revoked
 *   - 'unavailable'        — device cannot determine a fix
 *   - 'timeout'            — fix took longer than 10s
 *   - 'unknown'            — anything else
 */
export function getCurrentFix() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      const err = new Error('Geolocation is not supported by this browser')
      err.code = 'unsupported'

      return reject(err)
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy_m: pos.coords.accuracy,
          timestamp: new Date(pos.timestamp || Date.now()).toISOString()
        })
      },
      err => {
        const wrapped = new Error(err?.message || 'Failed to get location')
        if (err?.code === 1) wrapped.code = 'permission_denied'
        else if (err?.code === 2) wrapped.code = 'unavailable'
        else if (err?.code === 3) wrapped.code = 'timeout'
        else wrapped.code = 'unknown'
        reject(wrapped)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  })
}
