# Animal Transfer System

## Overview

The Animal Transfer system manages the movement of animals within and between sites. It provides a multi-step approval workflow with role-based actions, status tracking, and team management. The system supports three transfer types and mirrors the mobile app's transfer functionality.

---

## Transfer Types

| Type | Key | Description |
|------|-----|-------------|
| In House | `intra` | Transfer within the same site (between enclosures/sections) |
| Inter Site | `inter` | Transfer between different sites within the organization |
| External | `external` | Transfer to/from external organizations |

---

## Components

### Listing Component

**File**: `src/components/housing/sites/AnimalTransferListing.tsx`

Displays transfer requests in a tabbed DataGrid with status filtering.

**Features:**
- Sub-tabs for In House / Inter Site / External transfers
- Status dropdown filter (Show All, Awaiting Approval, Approved, Rejected, etc.)
- Paginated DataGrid with row click to open details
- Status chip with color coding based on transfer state
- Smart status text resolution matching mobile app logic

**Columns:**
| Column | Description |
|--------|-------------|
| Sl. No | Serial number |
| Transfer ID | Request ID with transfer type icon |
| Destination | Destination site/enclosure name |
| Animals | Animal count (transferred/total) |
| Requested On | Request timestamp |
| Status | Color-coded status chip |

### Details Drawer

**File**: `src/components/housing/sites/AnimalTransferDetailsDrawer.tsx`

Displays full transfer details with action buttons for approval/rejection.

**Features:**
- Transfer summary (request number, type, reason, dates)
- Animal list with species details
- Transfer team members display
- Transfer checklist
- Activity log / timeline
- Comment system
- Action buttons (Approve, Reject, Cancel) based on permissions and status
- Transfer pass information

---

## Status Workflow

```
                    ┌─────────────┐
                    │   PENDING   │ (Awaiting Approval)
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ APPROVED │ │ REJECTED │ │ CANCELED │
        └────┬─────┘ └──────────┘ └──────────┘
             │
             ▼
   ┌────────────────────┐
   │ SECURITY_CHECKOUT  │ (Security Checkout Cleared)
   │    _ALLOWED        │
   └─────────┬──────────┘
             │
             ▼
   ┌────────────────────┐
   │  RECEIVED_ANIMALS  │ (Animals Received)
   └─────────┬──────────┘
             │
             ▼
   ┌────────────────────┐
   │ SECURITY_CHECKIN   │ (Security Checkin Cleared)
   │    _ALLOWED        │
   └─────────┬──────────┘
             │
             ▼
   ┌────────────────────┐
   │ REACHED_DESTINATION│ → displayed as "Allocate"
   └─────────┬──────────┘
             │
             ▼
        ┌──────────┐
        │COMPLETED │
        └──────────┘
```

### Status Colors (Theme-Based)

| Status | Background | Text Color |
|--------|-----------|------------|
| PENDING | `customColors.antzNotes` | `customColors.Tertiary` |
| APPROVED | `customColors.OnBackground` | `primary.main` |
| REJECTED | `customColors.ErrorContainer` | `customColors.Error` |
| CANCELED | `customColors.secondaryBg` | `customColors.OnPrimary` |
| COMPLETED | `customColors.deepDark` | `customColors.OnPrimary` |
| REACHED_DESTINATION / ALLOCATE | `primary.main` | `customColors.OnPrimary` |
| RECEIVED_ANIMALS | `primary.main` | `customColors.OnPrimary` |
| SECURITY_CHECKOUT_ALLOWED | `customColors.OnPrimary` | `customColors.OnPrimaryContainer` |
| SECURITY_CHECKIN_ALLOWED | `customColors.OnPrimary` | `customColors.OnPrimaryContainer` |

---

## API Functions (`src/lib/api/housing/transfer.ts`)

### Listing & Details

| Function | Description |
|----------|-------------|
| `getAnimalTransferList()` | Get paginated transfer list with filters |
| `getTransferSummary()` | Get full transfer details |
| `getAnimalTransferSummary()` | Get specific animal's transfer details |
| `getTransferActivity()` | Get transfer activity log/timeline |
| `getTransferMembers()` | Get transfer team members |
| `getAnimalListBySpecies()` | Get animals grouped by species for transfer |

### Actions

| Function | Description |
|----------|-------------|
| `approveTransferRequest()` | Approve a pending transfer |
| `rejectTransferRequest()` | Reject a pending transfer |
| `updateTransferStatus()` | Update transfer status (cancel, complete, etc.) |
| `updateAnimalTransferStatus()` | Update individual animal transfer status |
| `addTransferComment()` | Add comment to transfer |
| `addAnimalTransferComment()` | Add comment to animal-level transfer |

### Status Checks

| Function | Description |
|----------|-------------|
| `getTransferButtonStatus()` | Get available actions for current user/status |
| `getAnimalTransferButtonStatus()` | Get animal-level available actions |
| `getAnimalTransferLogs()` | Get animal transfer activity log |

---

## API Parameters

### Transfer List Request

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `site_id` | string | Yes | Site ID |
| `transfer_type` | string | Yes | `intra`, `inter`, or `external` |
| `filter_type` | string | No | Status filter (e.g., `ALL`, `PENDING`, `APPROVED`) |
| `page_no` | number | Yes | Page number for pagination |
| `q` | string | No | Search query |

### Transfer Status Filters

```typescript
const TRANSFER_STATUS = [
  { id: -1, name: "Show All", value: "ALL" },
  { id: 0, name: "Awaiting Approval", value: "PENDING" },
  { id: 1, name: "Approved", value: "APPROVED" },
  { id: 2, name: "Rejected", value: "REJECTED" },
  { id: 3, name: "Canceled", value: "CANCELED" },
  { id: 4, name: "Completed", value: "COMPLETED" },
  { id: 5, name: "Allocate", value: "REACHED_DESTINATION" },
  { id: 6, name: "Received Animals", value: "RECEIVED_ANIMALS" },
  { id: 7, name: "Security Checkout Cleared", value: "SECURITY_CHECKOUT_ALLOWED" },
  { id: 8, name: "Security Checkin Cleared", value: "SECURITY_CHECKIN_ALLOWED" }
]
```

---

## Status Text Resolution

The status text displayed follows the mobile app's `allocateText` logic (from `TransferListCard.js`):

1. If `comments === "Received Animals"` AND user is in `user_details` → show **"Allocate"**
2. If `comments === "Received Animals"` AND `transfer_type === "intra"` → show **"Allocate"**
3. If `activity_status === "REACHED_DESTINATION"` → show **"Allocate"**
4. Otherwise → use `comments` field as display text
5. Fallback → lookup from status config by `activity_status`

This logic is implemented in the `getStatusText()` and `allocateButtonCheck()` helper functions within `AnimalTransferListing.tsx`.

---

## Permissions

| Permission | Required For |
|------------|-------------|
| `approval_move_animal_external` | Viewing the Animal Transfers tab |
| Site incharge membership | Approve/reject actions |

---

## Translation Keys

All transfer-related translations use the `housing_module` namespace:

- `housing_module.in_house` / `inter_site` / `external` — Tab labels
- `housing_module.transfer_id` / `destination` / `requested_on` / `sl_no` — Column headers
- `housing_module.transfers` — Section title
- `housing_module.awaiting_approval` / `allocate` / `received_animals` — Status names
- `housing_module.security_checkout_cleared` / `security_checkin_cleared` — Security statuses
- `housing_module.transfer_request_number` / `reason_for_transfer` / `transfer_to` — Detail fields
- `housing_module.transfer_team` / `transfer_members` / `transfer_pass` / `transfer_checklist` — Detail sections
- `housing_module.cancel_transfer` / `reject_transfer` — Action buttons
- `housing_module.transfer_approved_successfully` / `transfer_rejected` / `transfer_cancelled` — Toast messages

---

## Related

- [Housing Module Overview](./README.md)
- [Animal Details](./animal-details.md)
- [Site Details Tabs — Animal Transfers](../../housing/site-details-tabs.md#7-animal-transfers-tab)
