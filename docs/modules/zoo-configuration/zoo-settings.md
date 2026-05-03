# Zoo Settings Module

## Overview

Zoo-level configuration page where admins can manage general preferences (timezone, currency), configure report distribution recipients (To/CC) for scheduled email reports, and enable / configure the geofencing feature that gates web and mobile sign-ins to physical presence at the facility.

## Page Route

`/zoo-configuration/settings`

## Architecture

This module follows the project's **component-view separation** pattern (same as necropsy module):

```
src/pages/zoo-configuration/settings/
└── index.js                              ← Page entry point (auth guard, imports component)

src/components/zoo-configuration/
├── ZooSettings.js                        ← Business logic (API calls, state, handlers)
└── MultiUserDrawer.js                    ← Reusable drawer with own API logic (infinite scroll, search)

src/views/pages/zoo-configuration/
├── ZooSettingsView.js                    ← Pure template (receives all data as props)
├── ZooSettingsGeneralSection.js          ← Timezone & currency dropdowns
└── ZooSettingsReportSection.js           ← Report distribution cards with To/CC fields

src/lib/api/zoo-settings/
└── index.js                              ← API functions (GET/POST)
```

### Separation of Concerns

| Layer         | Folder             | Responsibility                                                                                  |
| ------------- | ------------------ | ----------------------------------------------------------------------------------------------- |
| **Page**      | `src/pages/`       | Route entry, auth guard, imports component                                                      |
| **Component** | `src/components/`  | Business logic — API calls (React Query), state management, event handlers, toast notifications |
| **View**      | `src/views/pages/` | Pure templates — receives props, renders JSX, no API calls                                      |
| **API**       | `src/lib/api/`     | Axios request definitions using project utility (`axiosGet`, `axiosPost`)                       |

### Why this pattern?

- **Views are reusable and testable** — no side effects, just props in → JSX out
- **Business logic is encapsulated** — API calls, state transforms, error handling live in one place
- **Components with own API logic** (like `MultiUserDrawer`) belong in `components/`, not `views/`
- **Consistent with other modules** — necropsy, hospital follow the same pattern

## API Endpoints

### GET `/v1/zoo/settings`

Fetches current saved settings for the zoo on page load.

**Headers:** `Authorization`, `ZooId`

**Response:**

```json
{
  "status": true,
  "data": {
    "timezone": "Asia/Kolkata",
    "currency": "INR",
    "report_recipients": {
      "daily": {
        "to": [
          { "user_id": "1", "user_name": "John Doe", "user_profile_pic": "pic.jpg", "user_email": "john@example.com" }
        ],
        "cc": []
      },
      "medical": { "to": [], "cc": [] },
      "hospital": { "to": [], "cc": [] },
      "enclosure": { "to": [], "cc": [] }
    }
  }
}
```

### GET `/v1/zoo/report-types`

Fetches available report types to render cards dynamically.

**Headers:** `Authorization`, `ZooId`

**Response:**

```json
{
  "status": true,
  "data": [
    { "key": "daily", "label": "Daily Report", "color": "#37BD69" },
    { "key": "medical", "label": "Medical Summary", "color": "#00AEA4" },
    { "key": "hospital", "label": "Hospital Report", "color": "#FA6140" },
    { "key": "enclosure", "label": "Empty Enclosure Report", "color": "#FDB528" }
  ]
}
```

### POST `/v1/zoo/settings`

Saves settings. Uses `section` field to determine what to update.

**Headers:** `Authorization`, `ZooId`, `Content-Type: application/json`

#### General Settings Only

```json
{
  "section": "general",
  "timezone": "Asia/Kolkata",
  "currency": "INR"
}
```

#### Report Recipients Only

Backend expects user IDs (not full objects). Frontend maps `user_id` from local state before POST.

```json
{
  "section": "report_recipients",
  "report_recipients": {
    "daily": { "to": [1, 5], "cc": [3] },
    "hospital": { "to": [2, 8], "cc": [] }
  }
}
```

#### Both Sections

`section` can be a string or array — backend handles both.

```json
{
  "section": ["general", "report_recipients"],
  "timezone": "Asia/Kolkata",
  "currency": "INR",
  "report_recipients": {
    "medical": { "to": [10], "cc": [4, 7] },
    "enclosure": { "to": [5], "cc": [] }
  }
}
```

**Response:**

```json
{ "status": true, "message": "Settings saved successfully" }
```

## Data Flow

1. **Page load** — `ZooSettings` (component) fires 2 React Query calls: `getZooSettings` + `getZooReportTypes`
2. **Prefill** — `useEffect` populates `generalValues` (timezone, currency) and `reportRecipients` (full user objects for chip display)
3. **Render** — `ZooSettings` passes all data + handlers as props to `ZooSettingsView` (pure template)
4. **Edit recipients** — clicking a To/CC field opens `MultiUserDrawer` (multi-select with checkbox, infinite scroll, debounced search via `getUserListing` API)
5. **Save General** — `POST { section: 'general', timezone, currency }` on General section Save click
6. **Save Reports** — maps user objects to IDs, then `POST { section: 'report_recipients', report_recipients: {...} }` on Report section Save click

## Notes

- `user_id` from GET settings is a string (`"1"`), from user listing API may be numeric — comparisons use `String()` coercion
- Report types are fully dynamic from API — adding/removing a report type on backend automatically reflects in UI
- Each section has its own Save button — independent saves
- `MultiUserDrawer` is a reusable component (same pattern as existing `UserDrawer` but with checkboxes instead of radio)
- API queries use `retry: false` so the page loads gracefully with empty defaults if backend endpoints aren't deployed yet

---

## Geofencing Section

Adds a third schema-driven section to the page for configuring the zoo-level geofence. The page already renders any section the schema declares; this section was added to `FALLBACK_SCHEMA` (and is also published by `GET /v1/zoo/settings-schema` once the backend ships it).

### Fields

| Field | Key | Type | Visible when | Validation |
|---|---|---|---|---|
| Enable Geofencing | `geofence_enabled` | toggle | always | — |
| Scope | `geofence_scope` | radio (`zoo_geofence` / `per_site`) | enabled = 1 | required |
| Zoo Center Coordinates | `zoo_coordinates` (virtual) | `geo_coordinates` (lat + lng + map) | enabled = 1 AND scope = `zoo_geofence` | lat ∈ [-90, 90], lng ∈ [-180, 180] |
| Default Radius (meters) | `geofence_default_radius_m` | number | enabled = 1 | ≥ 1 |
| Max GPS Accuracy (meters) | `geofence_max_accuracy_m` | number | enabled = 1 | ≥ 1 |

### `geo_coordinates` virtual field

The backend publishes `zoo_latitude` and `zoo_longitude` as two separate `number` fields. The frontend collapses them into a single `geo_coordinates` virtual field in `normalizeGeofencingSection` (in [src/components/zoo-configuration/ZooSettings.js](../../../src/components/zoo-configuration/ZooSettings.js)) so the renderer can present them as a paired input plus an interactive map.

The `geo_coordinates` renderer ([src/views/pages/zoo-configuration/fieldRenderers.js](../../../src/views/pages/zoo-configuration/fieldRenderers.js)) provides:

- Two number inputs (Latitude, Longitude) with browser-native step controls
- A **"Use my current location"** button that calls `navigator.geolocation.getCurrentPosition` with `enableHighAccuracy: true`
- An **interactive Leaflet + OpenStreetMap circle picker** below

The `radius_key` field on the schema entry tells the renderer which sibling field controls the circle radius (so dragging the radius handle on the map writes back to `geofence_default_radius_m`).

### Map UX (direct manipulation)

Implemented in [src/components/zoo-configuration/GeofenceMap.js](../../../src/components/zoo-configuration/GeofenceMap.js). Patterns match Google Maps / Mapbox / AWS Location / Radar.io circular-zone editors:

- **Drag the marker** → center moves; on drag end, lat/lng are written to the form
- **Drag the small handle on the east edge of the circle** → radius is recomputed via haversine, clamped to [1, 50000] m, and written to `geofence_default_radius_m`
- **Click empty map (only when no center is set yet)** → drops the marker at that point
- **Auto-fit** via `map.fitBounds(circle.toBounds(radius * 2))` on initial render and on coordinate / radius changes — the circle plus a comfortable margin is always visible regardless of radius
- Free pan / scroll-zoom in between — the auto-fit only re-fires on data change, never while the user is interacting

### Cross-field validation

When `geofence_enabled === 1` AND `geofence_scope === 'zoo_geofence'`, both `zoo_latitude` and `zoo_longitude` must be present before save. Server-side rule is mirrored client-side; the failing case is surfaced as a toast and the POST is aborted.

### POST payload

```json
{
  "section": "geofencing",
  "geofence_enabled": 1,
  "geofence_scope": "zoo_geofence",
  "zoo_latitude": 12.9712,
  "zoo_longitude": 77.5946,
  "geofence_default_radius_m": 5000,
  "geofence_max_accuracy_m": 100
}
```

### Implementation files

| Concern | File |
|---|---|
| Schema entry + payload + validation | [src/components/zoo-configuration/ZooSettings.js](../../../src/components/zoo-configuration/ZooSettings.js) |
| `geo_coordinates` field renderer (lat/lng inputs + map) | [src/views/pages/zoo-configuration/fieldRenderers.js](../../../src/views/pages/zoo-configuration/fieldRenderers.js) |
| `visible_when` directive support | [src/views/pages/zoo-configuration/ZooSettingsDynamicSection.js](../../../src/views/pages/zoo-configuration/ZooSettingsDynamicSection.js) |
| Leaflet circle picker | [src/components/zoo-configuration/GeofenceMap.js](../../../src/components/zoo-configuration/GeofenceMap.js) |

### Out of scope for this doc

- **Per-site radius** (`geofence_radius_m` on `antz_zoo_sites`) — surfaces on the Sites admin page when scope is `per_site`. Not part of the schema-driven settings flow.
- **Per-user bypass** (`geofence_bypass` in `antz_user_settings`) — surfaces on the Users admin page. Also outside this flow.

For the runtime side (post-login verification, heartbeat, lock banner, login modal), see the [Geofencing](../geofencing/README.md) module doc.
