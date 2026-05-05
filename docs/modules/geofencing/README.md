# Geofencing Module

## Overview

Gates web sign-ins and active sessions to physical presence at the zoo. The backend exposes two endpoints (`/v1/auth/geofence-verify`, `/v1/auth/geofence-heartbeat`); this doc covers how the dashboard wires them in.

The admin-side configuration (enabling the feature, setting the zoo center, default radius, max accuracy) lives in the existing zoo settings page — see [Zoo Settings → Geofencing Section](../zoo-configuration/zoo-settings.md#geofencing-section).

## Where it runs

| Trigger | Endpoint | What happens |
|---|---|---|
| Right after login (handleLogin) | `POST /v1/auth/geofence-verify` | Strict gate. Failure rejects the freshly-issued token. |
| Session restore (init effect) | `POST /v1/auth/geofence-verify` | Strict gate. Failure soft-locks the UI without logging out. |
| Mid-session, every 2 minutes | `POST /v1/auth/geofence-heartbeat` | Continuous monitoring. Drives the strike / lock state. |
| Any 403 from any other API call | n/a (interceptor) | If the body's `error` is `geofence_locked`, dispatches a `geofence-locked` event that flips the lock state. |

## Server response shapes

Verify and heartbeat both return a structured body — even on 4xx HTTP status. The frontend [`unwrap()` helper](../../../src/lib/api/geofence/index.js) normalizes axios's auto-throw on 4xx so callers always see the body.

```json
// success — inside fence
{ "success": true, "data": { "ok": true, "state": "inside", "matched_site_id": 1, "distance_m": 320, "radius_m": 5000 } }

// success — feature off / user bypassed
{ "success": true, "data": { "ok": true, "skipped": true, "reason": "geofence_disabled" } }

// outside the fence
{ "success": false, "error": "outside_geofence", "message": "...", "data": { "nearest_site_id": 1, "distance_m": 8410, "radius_m": 5000 } }

// GPS too imprecise (or fix too old)
{ "success": false, "error": "imprecise_location", "message": "...", "data": { "accuracy_m": 240, "max_allowed_m": 100 } }
```

Heartbeat additionally returns a state field that drives the UI tier: `inside | outside_strike_1 | outside_locked`.

## Error code → frontend behavior

| HTTP | `error` field | Frontend behavior |
|---|---|---|
| 401 | (any — token issue) | **Full logout.** Existing `session-expired` flow runs. Geofence endpoints are exempt to prevent accidental logout. |
| 403 | `geofence_locked` (mid-session) | **Soft-lock.** Lock banner shown; token preserved; user can recheck without re-auth. |
| 403 | `outside_geofence` (verify) | **Login modal.** Token discarded (minimal cleanup); user stays on /login. |
| 400 | `imprecise_location` | **Login modal** at login; **swallowed and retried next tick** during heartbeat. |

## Three-tier UI

| State | Visual | Action |
|---|---|---|
| `inside` (or `skipped`) | Nothing | App fully usable |
| `outside_strike_1` (transition) | One-shot Snackbar Alert at top center, 8s auto-dismiss | Loud one-time notification |
| `outside_strike_1` (persistent) | Sticky orange top banner, white text on `customColors.Tertiary` | Ambient reminder |
| `outside_locked` (mid-session) | Full-screen blurred backdrop + centered dark card with "Recheck location" button | Blocking |
| Geofence rejection at login | Dialog modal centered over the login page, severity-colored header | Blocking; backdrop and ESC dismissal disabled |

## Permission handling

On login page mount, the page calls `navigator.permissions.query({ name: 'geolocation' })` ([src/lib/geofence/permission.js](../../../src/lib/geofence/permission.js)). If the user already blocked location for this origin, the modal is shown **proactively** before they bother typing credentials.

Subscribed to `PermissionStatus.change` so the modal **auto-dismisses** when the user re-enables location in browser site settings — no manual refresh needed.

## State machine in the heartbeat hook

[`useGeofenceHeartbeat(enabled)`](../../../src/hooks/useGeofenceHeartbeat.js)

```
unknown          : initial; no successful heartbeat yet
inside           : last heartbeat says we're in
outside_strike_1 : warning state — one more outside reading will lock
outside_locked   : session is locked (blocking UI)
skipped          : feature off for this zoo or user; hook self-terminates
```

- Fires every 2 minutes via `setInterval`
- **Pauses on tab hidden** (`visibilitychange`); fires immediately on resume so locked sessions recover fast
- A single in-flight guard prevents overlapping calls
- Listens for the `geofence-locked` global event (dispatched by the 403 interceptor) and flips state to `outside_locked` regardless of the next heartbeat tick

## Soft-lock on session restore

If `verifyGeofence` fails during the AuthContext init effect (refresh while currently outside), we **do not** log the user out. The token is still valid; the UI is locked instead.

Two new bits of `AuthContext` state drive this:

```js
geofenceLocked: boolean
geofenceLockReason: { code, message, data } | null
```

`AuthGuard` reads both `auth.geofenceLocked` and the heartbeat hook's `outside_locked` state — either flips the UI into the locked banner. The banner's "Recheck location" button calls `auth.recheckGeofence()` (strict verify) and then forces a heartbeat; success on either signal clears the lock.

## Endpoint exemption from session-expired

The global axios interceptor ([src/lib/api/utility/index.js](../../../src/lib/api/utility/index.js)) treats any 401 as a session expiry — dispatches a `session-expired` event that triggers full logout. **Geofence endpoints are exempted** from this, so a backend hiccup that returns 401 from verify or heartbeat doesn't accidentally log the user out:

```js
const SESSION_EXPIRED_EXEMPT_URLS = [
  '/auth/geofence-verify',
  '/auth/geofence-heartbeat'
]
```

## File layout

```
src/lib/geofence/
├── getFix.js                        # Promise wrapper around getCurrentPosition (high accuracy, 10s timeout, no cache)
├── permission.js                    # navigator.permissions.query helper with old-Safari fallback
└── copy.js                          # describeGeofenceError(err) — single source of truth for user-facing messages

src/lib/api/geofence/
└── index.js                         # verifyGeofence(opts) + heartbeatGeofence() with unwrap() for 4xx-with-body

src/hooks/
└── useGeofenceHeartbeat.js          # 2-minute heartbeat hook with visibility-aware pause/resume

src/components/geofence/
└── GeofenceLockBanner.js            # Full-screen blurred backdrop + dark card + Recheck button (Portal)

src/components/zoo-configuration/
└── GeofenceMap.js                   # Leaflet + OSM circle picker (admin side)

src/context/AuthContext.js           # verify integrated into login + init; new geofenceLocked / geofenceLoginError state
src/@core/components/auth/AuthGuard.js  # mounts heartbeat; renders Snackbar + sticky banner + lock backdrop
src/lib/api/utility/index.js         # 403 geofence_locked dispatch + 401 exemption for geofence endpoints
src/pages/login/index.js             # error Dialog + pre-flight permission check + permission change subscription
```

## Copy table

All user-facing geofence messages live in [src/lib/geofence/copy.js](../../../src/lib/geofence/copy.js) and are keyed by error code. Never display raw axios / network strings to the user.

| Code | Title | Body (cause + recovery) |
|---|---|---|
| `outside_geofence` | "You are outside the facility" | "You're about X km from the geofenced area. Walk inside the facility and try logging in again to continue." |
| `imprecise_location` | "GPS reading was not precise" | "Your location accuracy is too low. Move to an open area, away from buildings, then try logging in again." |
| `permission_denied` | "Location access is blocked" | "This site needs your location to verify you're at the facility. Enable location access in your browser settings, then try logging in again." |
| `unavailable` | "Could not determine your location" | "Your device could not get a GPS fix. Move to an open area and try logging in again." |
| `timeout` | "Location request timed out" | "Getting a GPS fix took too long. Make sure location services are enabled, then try logging in again." |
| `unsupported` | "Your browser does not support location" | "Use a modern browser with location services enabled to access this site." |
| `gps_error` / fallback | "Location check failed" | "We could not verify your location. Walk inside the facility and try logging in again." |

## Testing checklist

| Scenario | How to test | Expected |
|---|---|---|
| Login from outside fence | Set zoo center far from your machine, log in | Modal shows, stays on /login, token discarded |
| Login with permission denied | Block location for the origin, then visit /login | Modal shows immediately on page load, before submit |
| Permission re-granted while modal open | Modal open → unblock in browser settings → return to tab | Modal dismisses automatically (PermissionStatus.change) |
| Refresh while outside | Log in inside, walk outside, refresh | Lock backdrop appears; token preserved; tap Recheck after walking inside dismisses it |
| Heartbeat detects drift | Stay logged in until heartbeat fires (~2 min) outside the fence | One-shot Snackbar + sticky banner appear (strike-1) |
| Second outside reading | Stay outside for the next heartbeat after strike-1 | Lock backdrop appears |
| 403 geofence_locked from any API | Backend returns 403 with `error: 'geofence_locked'` on any other endpoint | Lock backdrop appears |
| Tab hidden | Switch tab during a strike-1 / locked state | Heartbeat pauses; on resume, fires immediately so locked sessions recover fast |
| Geofence disabled for zoo / user bypass | Backend returns `skipped: true` | Heartbeat hook self-terminates; no UI surfaces |

## Reference

- Backend spec: `docs/Geofencing/` (in the backend repo)
- Admin configuration: [Zoo Settings → Geofencing Section](../zoo-configuration/zoo-settings.md#geofencing-section)
