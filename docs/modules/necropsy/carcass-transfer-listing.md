# Carcass Transfer Listing

## Overview

The Carcass Transfer feature provides two entry points depending on user permissions:

1. **Dedicated page** (`/necropsy/carcass-transfer/`) — for users with **both** `allowCarcassCollection` AND `enableAddNecropsyReport`. Reached via the CARCASS TRANSFER button in the `NecropsyAnalytics` header on `/necropsy`.
2. **Inline on main page** (`/necropsy`) — for users with **only** `allowCarcassCollection` (and NOT `enableAddNecropsyReport`). The `CarcassTransferCard` replaces the necropsy listing as the main content.

Both entry points render the same `CarcassTransferCard` component.

---

## Permission Logic

| `allowCarcassCollection` | `enableAddNecropsyReport` | Result |
|--------------------------|---------------------------|--------|
| `true` | `true` | Necropsy listing shown with CARCASS TRANSFER button in header; button navigates to `/necropsy/carcass-transfer/` |
| `true` | `false` | Necropsy listing hidden, `CarcassTransferCard` shown directly on `/necropsy` (no button needed) |
| `false` | `true` | Necropsy listing shown, no carcass transfer button |
| `false` | `false` | Nothing rendered below the analytics header |

The `NecropsyAnalytics` header is always rendered regardless of permissions.

---

## Routes

### `/necropsy` (main page)

- File: `src/pages/necropsy/index.js`
- When `enableAddNecropsyReport` is true, passes `onCarcassTransfer={() => router.push('/necropsy/carcass-transfer/')}` and `showCarcassTransferButton={!!enableAddNecropsyReport}` to `NecropsyAnalytics`
- When only `allowCarcassCollection` is true, renders `CarcassTransferCard` inline (button hidden via `showCarcassTransferButton={false}` implicitly since `enableAddNecropsyReport` is false)

### `/necropsy/carcass-transfer/` (dedicated page)

- File: `src/pages/necropsy/carcass-transfer/index.js`
- Protected with `enforceModuleAccess(CarcassTransferPage, 'allow_carcass_collection')` — redirects to `/404` if permission is missing
- Wrapped in `NecropsyProvider` (required for `useNecropsy()` in `CarcassTransferCard` and `NecropsyDropdown`)

**Page structure:**

```
Breadcrumbs: "Necropsy > Carcass Transfer"
  |
  +-- "Necropsy" — clickable link back to /necropsy
  +-- "Carcass Transfer" — plain text (current page)
  |
NecropsyAnalytics (showCarcassTransferButton=false)
  |
CarcassTransferCard (same component used on /necropsy)
```

**Key details:**

- `showCarcassTransferButton={false}` hides the CARCASS TRANSFER button on this page (avoids circular navigation)
- `filterDate` state is managed locally with `useState({})`, same pattern as the main necropsy page
- Reads `allowCarcassCollection` from `AuthContext` to pass to `NecropsyAnalytics`
- Breadcrumb pattern matches `src/pages/necropsy/[id]/index.js`

**Navigation flow:**

1. User is on `/necropsy` with both permissions enabled
2. Clicks CARCASS TRANSFER button in the analytics header
3. `onCarcassTransfer` handler calls `router.push('/necropsy/carcass-transfer/')`
4. Dedicated page renders with breadcrumbs, analytics header (no button), and transfer listing
5. Clicking "Necropsy" in the breadcrumbs navigates back to `/necropsy`

---

## Components

### `src/components/necropsy/CarcassTransferCard.js`

Main component that renders the carcass transfer section. Used on both `/necropsy` (inline) and `/necropsy/carcass-transfer/` (dedicated page).

**Props:**

- `filterDate` — shared date range object from `NecropsyAnalytics` (`{ startDate, endDate }`)

**Internal state:**

- `activeTab` — `'pending'` | `'completed'` (default: `'pending'`)
- `data` — array of transfer rows from API
- `total` — total count for pagination
- `loading` — boolean
- `stats` — `{ pending: number, completed: number }` tab badge counts
- `filters` — `{ page, limit, q }` for pagination and search
- `searchValue` — controlled search input value
- `openFilterDrawer` / `filterCount` / `selectedOptions` — filter drawer state
- `openIncomingDrawer` / `selectedTransferRow` — row-click drawer state

**API call:**

Calls `getCarcassTransferList()` with parameters:

- `page_no`, `limit`, `q` — pagination/search
- `reference_type: 'carcass_transfer'`
- `transfer_status` — matches `activeTab` (`'pending'` or `'completed'`)
- `necropsy_center_id` — from `useNecropsy()` context, sent as `JSON.stringify([id])`
- `request_from: 'web'` — required, matches hospital incoming pattern
- `from_date`, `to_date` — from `filterDate` prop
- `entity_type`, `entity_id` — from filter drawer site selection (only included when a site is selected)

**Layout (two stacked cards):**

```
Top Card (no bottom border-radius)
+-- "Carcass Transfer" title
+-- Search (left) + Filter button (right) — responsive row
|   - On xs: stacks vertically, search stretches full width
|   - On sm+: horizontal row with space-between

Bottom Card (no top border-radius)
+-- Tab pills: "Pending Acceptance - {count}" | "Received - {count}"
|   - Positioned just above the table
|   - Horizontally scrollable on small screens
+-- CommonTable with transfer data
```

**Table columns:**

| # | Field | Header | Description |
|---|-------|--------|-------------|
| 1 | `sl_no` | SL. NO | Sequential row number |
| 2 | `transfer_code` | Transfer Code | Plain text |
| 3 | `animal_info` | Animal Count | Numeric count from `total_animals`. Uses `Number()` coercion since API may return strings. |
| 4 | `source_name` | Source Site | Plain text |
| 5 | `security_status` | Security Status | Derived via `getTransferStatus()` — virtual field, no data conflict |
| 6 | `mortality_priority` | Priority | Colored badge (high = red, low = blue). Field name uses `mortality_priority` to avoid DataGrid conflict with raw `priority` data field. Returns `null` if priority is empty. |
| 7 | `requested_by` | Requested By | `UserAvatarDetails` with name and date — virtual field |

**Row click** opens `IncomingNecropsyDrawer` with `transferId`.

**Row indexing:**

- `id` falls back to array index if `transfer_id` is missing: `row.transfer_id || index`
- `total` and stats counts use `Number()` coercion to handle string values from API

**Stats resilience:**

- Checks `res?.data?.stats` first, falls back to `res?.stats`
- Reads `pending_count` first (`??` fallback to `transfer_pending_count`), and `completed_count` first (`??` fallback to `transfer_completed_count`)
- If stats are still 0, the active tab's count is populated from `total_count`; the non-active tab preserves its last known value

---

### `src/components/necropsy/CarcassTransferFilterDrawer.js`

Filter drawer for carcass transfers. Follows the same pattern as `SpeciesFilterDrawer.js`.

**Filter options:**

- **Site** — dynamic, fetched from `getZooWiseSiteLists()` (single-select)

Uses `CustomFilterDrawer` and `FilterContent` from `src/components/drawers/`.

---

### `src/views/pages/necropsy/NecropsyAnalytics.js`

Analytics header card with necropsy center dropdown and date range picker.

**Props:**

- `disabled` — disables the component
- `filterDate` — current filter dates
- `setFilterDate` — date range setter function
- `badgeCount` — number for carcass transfer badge
- `onCarcassTransfer` — callback for transfer button click
- `allowCarcassCollection` — controls visibility of carcass transfer button
- `showCarcassTransferButton` (default: `true`) — additional toggle for button visibility

The CARCASS TRANSFER button renders only when both `allowCarcassCollection` AND `showCarcassTransferButton` are truthy.

---

## API

### Endpoint

Uses the existing `GET_NEW_INCOMING_PATIENTS_LISTS` constant (`v1/get-transfer-list`).

### Request parameters

```
page_no            — page number (1-indexed)
limit              — rows per page
q                  — search query
request_from       — 'web' (required, matches hospital incoming pattern)
reference_type     — 'carcass_transfer'
transfer_status    — 'pending' | 'completed'
necropsy_center_id — JSON.stringify([id]) (JSON stringified array, matches mobile app pattern)
from_date          — start date (YYYY-MM-DD)
to_date            — end date (YYYY-MM-DD)
entity_type        — 'site' (sent together with entity_id when filtering by site)
entity_id          — site ID (sent together with entity_type when filtering by site)
```

### Response structure

```json
{
  "success": true,
  "data": {
    "result": [
      {
        "transfer_id": 123,
        "transfer_code": "CT-001",
        "total_animals": 2,
        "source_name": "Site A",
        "destination_name": "Necropsy Center B",
        "activity_status": "PENDING",
        "transfer_status": "PENDING",
        "is_checkout_required": 1,
        "is_checkin_required": 0,
        "mortality_priority": "high",
        "user_first_name": "Dr. John",
        "created_at": "2024-01-15T10:30:00Z",
        "animal_details": {}
      }
    ],
    "total_count": 25,
    "stats": {
      "pending_count": 23,
      "completed_count": 57,
      "intransit_count": 0,
      "canceled_count": 0
    }
  }
}
```

---

## Component Hierarchy

```
src/pages/necropsy/index.js
  |
  +-- NecropsyAnalytics (always shown)
  |     +-- onCarcassTransfer -> router.push('/necropsy/carcass-transfer/')
  |
  +-- [IF enableAddNecropsyReport] -> existing necropsy listing (unchanged)
  |
  +-- [IF allowCarcassCollection AND NOT enableAddNecropsyReport]
        +-- CarcassTransferCard (inline)

src/pages/necropsy/carcass-transfer/index.js
  |
  +-- NecropsyProvider
        +-- Breadcrumbs ("Necropsy > Carcass Transfer")
        +-- NecropsyAnalytics (showCarcassTransferButton=false)
        +-- CarcassTransferCard

CarcassTransferCard (shared)
  +-- Top Card
  |     +-- "Carcass Transfer" title
  |     +-- Search (left) + Filter button (right)
  +-- Bottom Card
  |     +-- Tab pills: "Pending Acceptance - {count}" | "Received - {count}"
  |     +-- CommonTable
  +-- CarcassTransferFilterDrawer (overlay)
  +-- IncomingNecropsyDrawer (on row click, overlay)
```

---

## Responsive Behavior

| Breakpoint | Search + Filter | Tabs |
|------------|----------------|------|
| `xs` (mobile) | Stack vertically; search stretches full width, filter below | Horizontally scrollable pills |
| `sm+` (tablet/desktop) | Horizontal row: search left, filter right | Inline pills with gap |

---

## File Summary

### Created

- `src/components/necropsy/CarcassTransferCard.js` — main carcass transfer listing component
- `src/components/necropsy/CarcassTransferFilterDrawer.js` — site filter drawer
- `src/components/necropsy/TransferPassQRCard.js` — QR code dialog for transfer pass (green-themed)
- `src/pages/necropsy/carcass-transfer/index.js` — dedicated carcass transfer page

### Modified

- `src/pages/necropsy/index.js` — conditional rendering of `CarcassTransferCard` inline, `onCarcassTransfer` navigation handler, skips unnecessary API calls when only `allowCarcassCollection` is true
- `src/views/pages/necropsy/NecropsyAnalytics.js` — added `showCarcassTransferButton` prop to control button visibility
- `src/lib/api/necropsy/index.js` — added `getCarcassTransferList(params)` function
- `src/components/necropsy/IncomingNecropsyDrawer.js` — updated to use `TransferPassQRCard` instead of `AnimalQRCard` for transfer pass QR display

---

### `src/components/necropsy/TransferPassQRCard.js`

QR code dialog for security/transfer pass. Displays a green-themed dialog with transfer details and QR code.

**Props:**

- `open` — boolean, controls dialog visibility
- `handleClose` — function to close the dialog
- `transferData` — object containing:
  - `requestId` — Transfer request ID (e.g., "CT11-00379")
  - `qrCodeUrl` — URL of the QR code image
  - `title` — Optional custom title (default: "Transfer Pass")
  - `subtitle` — Optional custom subtitle (default: "Transfer Request number")

**Features:**

- Green background (uses `theme.palette.customColors.SuccessContainer`)
- Close button in top-right corner
- Title, subtitle, and request ID display
- QR code image with white background
- Share button (uses Web Share API)
- Download button (downloads QR as PNG)
- Responsive layout (buttons stack on mobile)

**Usage:**

```jsx
import TransferPassQRCard from 'src/components/necropsy/TransferPassQRCard'

<TransferPassQRCard
  open={openQRDialog}
  handleClose={() => setOpenQRDialog(false)}
  transferData={{
    requestId: 'CT11-00379',
    qrCodeUrl: 'https://example.com/qr.png',
    title: 'Transfer Pass',
    subtitle: 'Transfer Request number'
  }}
/>
```

Used by `IncomingNecropsyDrawer` to display the transfer pass QR code when the QR button is clicked.

---

## Key Dependencies

- `CommonTable` — `src/views/table/data-grid/CommonTable.js`
- `Search` — `src/views/utility/Search`
- `FilterButtonWithNotification` — `src/views/utility/FilterButtonWithNotification`
- `CustomFilterDrawer` / `FilterContent` — `src/components/drawers/`
- `UserAvatarDetails` — `src/views/utility/UserAvatarDetails`
- `IncomingNecropsyDrawer` — `src/components/necropsy/IncomingNecropsyDrawer`
- `TransferPassQRCard` — `src/components/necropsy/TransferPassQRCard`
- `NecropsyDropdown` — `src/components/necropsy/NecropsyDropdown`
- `useNecropsy()` — `src/context/NecropsyContext`
- `AuthContext` — `src/context/AuthContext`
- `enforceModuleAccess` — `src/components/ProtectedRoute`
