/**
 * Single source of truth for human-friendly geofence error copy.
 * Never leak axios/network error strings to the user.
 *
 * Returns: { severity, icon, title, body }
 *   severity ∈ 'error' | 'warning'
 *   icon: an Iconify name
 *   title: short headline
 *   body:  one-line recovery instruction
 */
export function describeGeofenceError(err) {
  const code = err?.code || 'unknown'
  const data = err?.data || {}

  // Format distance hint when available (km if ≥ 1000m, m otherwise)
  const distance = (() => {
    const m = data.distance_m
    if (typeof m !== 'number' || !isFinite(m)) return null
    if (m >= 1000) return `${(m / 1000).toFixed(1)} km`

    return `${Math.round(m)} m`
  })()

  switch (code) {
    case 'outside_geofence':
      return {
        severity: 'error',
        icon: 'mdi:map-marker-off-outline',
        title: 'You are outside the facility',
        body: distance
          ? `You're about ${distance} from the geofenced area. Walk inside the facility and try logging in again to continue.`
          : 'Walk inside the geofenced area and try logging in again to continue.'
      }
    case 'imprecise_location':
      return {
        severity: 'warning',
        icon: 'mdi:crosshairs-question',
        title: 'GPS reading was not precise',
        body: 'Your location accuracy is too low. Move to an open area, away from buildings, then try logging in again.'
      }
    case 'permission_denied':
      return {
        severity: 'error',
        icon: 'mdi:map-marker-alert-outline',
        title: 'Location access is blocked',
        body: 'This site needs your location to verify you\'re at the facility. Enable location access in your browser settings, then try logging in again.'
      }
    case 'unavailable':
      return {
        severity: 'warning',
        icon: 'mdi:crosshairs-off',
        title: 'Could not determine your location',
        body: 'Your device could not get a GPS fix. Move to an open area and try logging in again.'
      }
    case 'timeout':
      return {
        severity: 'warning',
        icon: 'mdi:timer-sand',
        title: 'Location request timed out',
        body: 'Getting a GPS fix took too long. Make sure location services are enabled, then try logging in again.'
      }
    case 'unsupported':
      return {
        severity: 'error',
        icon: 'mdi:close-octagon-outline',
        title: 'Your browser does not support location',
        body: 'Use a modern browser with location services enabled to access this site.'
      }
    case 'gps_error':
    case 'geofence_failed':
    default:
      return {
        severity: 'error',
        icon: 'mdi:map-marker-off-outline',
        title: 'Location check failed',
        body: 'We could not verify your location. Walk inside the facility and try logging in again.'
      }
  }
}
