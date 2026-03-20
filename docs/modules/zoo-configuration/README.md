# Zoo Configuration Module

## Overview
The Zoo Configuration module allows zoo administrators to manage zoo-level settings including timezone, currency preferences, and email report distribution recipients. Changes are saved automatically on user action — no manual save button required.

## Module Location
- **Page**: `src/pages/zoo-configuration/`
- **Views**: `src/views/pages/zoo-configuration/`

## Features

### General Settings
- **Timezone** — Searchable dropdown with ~600 IANA timezones (e.g. `Asia/Kolkata (UTC+05:30)`)
- **Currency** — Searchable dropdown with ~300 ISO 4217 currencies (e.g. `INR — Indian Rupee`)
- Both fields use MUI `Autocomplete` with type-to-search and max-height scroll
- Auto-saves on change with a toast confirmation

### Report Distribution
Configure **To** and **CC** email recipients for 4 scheduled reports:

| Report | Key | Color |
|---|---|---|
| Daily Report | `daily` | `#37BD69` |
| Medical Summary | `medical` | `#00AEA4` |
| Hospital Report | `hospital` | `#FA6140` |
| Empty Enclosure Report | `enclosure` | `#FDB528` |

- Each report is a collapsible card
- Clicking a To/CC field opens a right-side drawer (`MultiUserDrawer`)
- Drawer supports infinite scroll + debounced search via `getUserListing` API
- Selected users shown as chips with avatar
- Auto-saves on drawer confirm with a toast confirmation

## Component Structure

```
src/views/pages/zoo-configuration/
├── ZooSettingsView.js          # Root view — state, save handlers
├── ZooSettingsGeneralSection.js # Timezone + currency autocompletes
├── ZooSettingsReportSection.js  # 4 report cards with To/CC fields
└── MultiUserDrawer.js           # Multi-select user picker drawer
```

## API Integration

### Required Endpoints (pending backend)

#### GET /zoo/settings
Fetch current settings on page load.

**Response**
```json
{
  "status": true,
  "data": {
    "timezone": "Asia/Kolkata",
    "currency": "INR"
  }
}
```

#### POST /zoo/settings
Save timezone and currency.

**Request body**
```json
{
  "timezone": "Asia/Kolkata",
  "currency": "INR"
}
```

**Response**
```json
{
  "status": true,
  "message": "Settings saved successfully"
}
```

---

#### GET /zoo/report-recipients
Fetch all report recipients on page load.

**Response**
```json
{
  "status": true,
  "data": {
    "daily":     { "to": [{ "user_id": 1, "user_name": "John", "user_profile_pic": "..." }], "cc": [] },
    "medical":   { "to": [], "cc": [] },
    "hospital":  { "to": [], "cc": [] },
    "enclosure": { "to": [], "cc": [] }
  }
}
```

#### POST /zoo/report-recipients
Save recipients for a specific report + field.

**Request body**
```json
{
  "report_key": "daily",
  "field": "to",
  "users": [
    { "user_id": 1, "user_name": "John", "user_profile_pic": "https://..." }
  ]
}
```

**Response**
```json
{
  "status": true,
  "message": "Recipients updated successfully"
}
```

### Already Integrated
- `getUserListing` from `src/lib/api/compliance/reports` — powers the user search in `MultiUserDrawer`

## Save Behaviour
- **No save button** — all changes save immediately on user action
- General settings: saves on dropdown selection change
- Report recipients: saves when user confirms the drawer
- Toast shows `"Saved"` (1.5s) on success, `"Failed to save"` on error

## Key Dependencies
- `moment-timezone` — full IANA timezone list with UTC offsets
- `react-intersection-observer` — infinite scroll in user drawer
- `@tanstack/react-query` — paginated user fetching with caching
- `lodash` debounce — search debounce in user drawer
