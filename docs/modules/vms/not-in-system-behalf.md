# "Not in System" — On Behalf Of Enhancement

## Overview
Allow pass creators to specify a person who is NOT an existing Antz user as the "on behalf of" contact. Currently, "On Behalf Of" only supports searching existing users via the `zoo/users/listing` API.

## Current Behavior
- "On Behalf Of" field is an Autocomplete that searches existing Antz users
- Selected user's `user_id` is sent as `created_on_behalf_of` in the pass payload
- Pass detail shows `on_behalf_of_name` (joined from `antz_users` table)

## Proposed Behavior
- Add a toggle: **"Not in system"** below the "On Behalf Of" label
- **Toggle OFF** (default): Autocomplete user search (existing behavior)
- **Toggle ON**: Show two fields — Name (text) + Phone (tel)
- Submit sends `behalf_name` + `behalf_contact` instead of `created_on_behalf_of`

## Backend Changes

### Database Migration
Add 2 nullable columns to `antz_vms_passes`:

```sql
ALTER TABLE antz_vms_passes
  ADD COLUMN behalf_name VARCHAR(100) NULL AFTER created_on_behalf_of,
  ADD COLUMN behalf_contact VARCHAR(15) NULL AFTER behalf_name;
```

### API Changes

**POST /api/v1/vms/passes** (create) and **PUT /api/v1/vms/passes/:id** (update):

Accept two new optional fields in the request body:
```json
{
  "created_on_behalf_of": null,
  "behalf_name": "John Doe",
  "behalf_contact": "9876543210"
}
```

Validation rules:
- If `created_on_behalf_of` is set (integer), ignore `behalf_name` / `behalf_contact`
- If `created_on_behalf_of` is null and `behalf_name` is provided, store both fields
- `behalf_name`: optional, max 100 chars
- `behalf_contact`: optional, max 15 chars

**GET /api/v1/vms/passes/:id** (detail):

Return the two new fields in the response:
```json
{
  "created_on_behalf_of": null,
  "on_behalf_of_name": null,
  "behalf_name": "John Doe",
  "behalf_contact": "9876543210"
}
```

### Model Changes
- `AntzVmsPassModel`: Add `behalf_name`, `behalf_contact` to `$allowedFields`
- `findOne()`: Already returns `p.*` so new columns included automatically

## Frontend Changes

### Types (`src/types/vms/index.ts`)
```typescript
export interface VmsPass {
  // ... existing fields
  behalf_name?: string | null
  behalf_contact?: string | null
}

export interface CreatePassPayload {
  // ... existing fields
  behalf_name?: string
  behalf_contact?: string
}
```

### Create Pass Form (`PassForm.tsx`)
- Add `notInSystem` boolean state (default false)
- Add MUI Switch/Checkbox toggle with label "Not in system"
- When ON: hide Autocomplete, show Name + Phone TextFields
- When OFF: hide Name + Phone, show Autocomplete
- Submit payload:
  - Toggle OFF: `{ created_on_behalf_of: selectedUser.user_id }`
  - Toggle ON: `{ created_on_behalf_of: null, behalf_name: '...', behalf_contact: '...' }`

### Pass Detail (`PassDetail.tsx`)
- "On Behalf Of" section:
  - If `on_behalf_of_name` exists: show name (existing user)
  - Else if `behalf_name` exists: show `behalf_name` + `behalf_contact` with a "Not in system" badge
  - Else: show "—"

## Files to Modify

| File | Change |
|------|--------|
| `app/Database/Migrations/Vms/` | New migration for 2 columns |
| `app/Models/Vms/AntzVmsPassModel.php` | Add to allowedFields |
| `app/Controllers/Api/v1/Vms/AntzVmsPassController.php` | Accept new fields in create/update |
| `src/types/vms/index.ts` | Add behalf_name, behalf_contact to interfaces |
| `src/components/vms/passes/PassForm.tsx` | Toggle + conditional fields |
| `src/components/vms/passes/PassDetail.tsx` | Display logic |

## Priority
Low — enhancement. Current flow works for existing users. This is a nice-to-have for edge cases.
