# Zoo Settings Module

## Overview
Zoo-level configuration page where admins can manage general preferences (timezone, currency) and configure report distribution recipients (To/CC) for scheduled email reports.

## Page Route
`/zoo-configuration/`

## Files

| File | Purpose |
|------|---------|
| `src/pages/zoo-configuration/index.js` | Next.js page entry |
| `src/views/pages/zoo-configuration/ZooSettingsView.js` | Main view — fetches data, manages state, handles save |
| `src/views/pages/zoo-configuration/ZooSettingsGeneralSection.js` | Timezone & currency dropdowns with per-section Save |
| `src/views/pages/zoo-configuration/ZooSettingsReportSection.js` | Report distribution cards with To/CC recipient fields |
| `src/views/pages/zoo-configuration/MultiUserDrawer.js` | Multi-select user picker drawer (checkbox, infinite scroll, search) |
| `src/lib/api/zoo-settings/index.js` | API functions for zoo settings |

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
      "medical":   { "to": [], "cc": [] },
      "hospital":  { "to": [], "cc": [] },
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
    { "key": "daily",     "label": "Daily Report",           "color": "#37BD69" },
    { "key": "medical",   "label": "Medical Summary",        "color": "#00AEA4" },
    { "key": "hospital",  "label": "Hospital Report",        "color": "#FA6140" },
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
    "daily":    { "to": [1, 5], "cc": [3] },
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
    "medical":   { "to": [10], "cc": [4, 7] },
    "enclosure": { "to": [5], "cc": [] }
  }
}
```

**Response:**
```json
{ "status": true, "message": "Settings saved successfully" }
```

## Data Flow

1. **Page load** — `ZooSettingsView` fires 2 React Query calls: `getZooSettings` + `getZooReportTypes`
2. **Prefill** — `useEffect` populates `generalValues` (timezone, currency) and `reportRecipients` (full user objects for chip display)
3. **Edit recipients** — clicking a To/CC field opens `MultiUserDrawer` (multi-select with checkbox, infinite scroll, debounced search via `getUserListing` API)
4. **Save General** — `POST { section: 'general', timezone, currency }` on General section Save click
5. **Save Reports** — maps user objects to IDs, then `POST { section: 'report_recipients', report_recipients: {...} }` on Report section Save click

## Notes
- `user_id` from GET settings is a string (`"1"`), from user listing API may be numeric — comparisons use `String()` coercion
- Report types are fully dynamic from API — adding/removing a report type on backend automatically reflects in UI
- Each section has its own Save button — independent saves
- `MultiUserDrawer` is a reusable component (same pattern as existing `UserDrawer` but with checkboxes instead of radio)
