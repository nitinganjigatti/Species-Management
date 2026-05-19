// Single source of truth for whether the geofence feature is active on this
// build. Driven by the NEXT_PUBLIC_GEOFENCE_ENABLED env var:
//
//   unset / 'true' / any value !== 'false'  → feature ON (default — preserves
//                                              backward compat for existing
//                                              deployments)
//   'false'                                  → feature OFF — no /geofence-verify
//                                              or /geofence-heartbeat calls
//                                              are made, and the heartbeat hook
//                                              short-circuits to a `skipped`
//                                              state with no intervals.
//
// The function is intentionally synchronous so it can be used at module import
// time inside API wrappers and hooks without async plumbing.
export function isGeofenceEnabled() {
  return process.env.NEXT_PUBLIC_GEOFENCE_ENABLED !== 'false'
}
