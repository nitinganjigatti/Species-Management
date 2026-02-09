# Necropsy Report Form

## Overview

The Necropsy Report Form is used to document post-mortem examination findings for animals. This document covers the form structure, field positions, validations, API payloads, and differences between mobile and web implementations.

---

## Form Entry Points

| Platform | Route/Screen | File |
|----------|--------------|------|
| Web | `/necropsy/[id]/report` | `src/pages/necropsy/[id]/report.js` |
| Mobile | `AddNecropsy` screen | `screen/Animals/AddNecropcy.js` |

---

## Form Structure Comparison

### Mobile App Form Sections (Reference Implementation)

The mobile app organizes the form into clearly defined sections with headers:

| Section | Fields | Position |
|---------|--------|----------|
| **Necropsy Suitability** | Toggle, Reason for unsuitable (if unsuitable) | 1 |
| **Carcass Details** | Carcass Submission Date/Time, Death Date/Time, Place of Death, QR Number, Carcass Weight + Unit, Confirmed Sex, Age | 2 |
| **Clinical History** | Short history of illness | 3 |
| **Necropsy Details** | Necropsy Date/Time, Necropsy Conducted By | 4 |
| **Examination Findings** | General Description, Organ-wise Description, Attachments | 5 |
| **Cause of Death** | Suspected Cause (read-only), Opinion, Confirmed Cause, Disposal Method | 6 |
| **Additional** | Biological Tests, Notes | 7 |

### Web Form Sections (Updated Implementation - Matches Mobile)

The web form now matches the mobile app structure with clearly defined sections:

| Section | Fields | Notes |
|---------|--------|-------|
| **Necropsy Suitability** | Toggle, Reason (if unsuitable), Conducted By (if unsuitable) | Matches mobile |
| **Carcass Details** | Carcass Submission Date/Time, Death Date/Time, Place of Death, QR Number, Carcass Weight + Unit, Confirmed Sex, Age | Only shown if suitable |
| **Clinical History** | History of illness | Only shown if suitable |
| **Necropsy Details** | Necropsy Date/Time, Necropsy Conducted By | Only shown if suitable |
| **Examination Findings** | General Description, Organ-wise Description, Attachments | Only shown if suitable |
| **Cause of Death** | Suspected Cause (read-only), Opinion, Confirmed Cause, Disposal Method | Always shown |
| **Additional Information** | Biological Tests, Notes | Always shown |

---

## Field Order Alignment (COMPLETED)

All field order issues have been resolved:

| Field | Mobile Position | Web Position | Status |
|-------|-----------------|--------------|--------|
| Necropsy Conducted By | In "Necropsy Details" section | After Necropsy Date/Time | ✅ Fixed |
| QR Number | In "Carcass Details" section | After Place of Death | ✅ Fixed |
| Suspected Cause of Death | Displayed as read-only | Read-only display | ✅ Fixed |
| Biological Tests | In "Additional" section | In Additional Information | ✅ Fixed |

---

## Field Definitions

### Required Fields

| Field | When Required | Validation Message |
|-------|---------------|-------------------|
| `reason_for_unsuitable` | When `is_suitable = false` | "Reason for unsuitable is required" |
| `necropsy_conducted_by` | Always | "Conducted by field is required" |
| `weight_unit` | When `carcass_weight` is provided | "Please select the weight unit" |
| `confirmed_cause_of_death` | When `is_suitable = true` (draft and submit) | "Confirmed cause of death is required" |
| `disposal_method` | When `is_suitable = true` AND submitting (not required for drafts) | "Disposal method is required" |

### Optional Fields

| Field | Notes |
|-------|-------|
| `caracass_submission_date` | Date picker |
| `caracass_submission_time` | Time picker |
| `death_date` | Date picker |
| `death_time` | Time picker |
| `place_of_death` | Free text |
| `carcass_weight` | Numeric |
| `approximate_weight` | Boolean |
| `sex` | Options: male, female, indeterminate, undetermined |
| `age` | Numeric |
| `age_unit` | Options: day, month, year |
| `approximate_dob` | Boolean |
| `history_of_illness` | Textarea |
| `necropsy_date` | Date picker |
| `necropsy_time` | Time picker |
| `general_description` | Textarea |
| `necropsy_organs` | Array of organ objects |
| `opinion` | Textarea |
| `confirmed_cause_of_death` | Dropdown from manner_of_death options |
| `qr_number` | Text |
| `biological_test` | Textarea (mobile only currently) |
| `additional_notes` | Textarea |
| `attachments` | File array |

---

## Validation Rules

### Submit Validation (Suitable Necropsy)

```javascript
// Required for submit
- necropsy_conducted_by: required (array of user IDs)
- manner_of_death: required
- disposal_method: required
- weight_unit: required if carcass_weight is provided
```

### Submit Validation (Unsuitable Necropsy)

```javascript
// Required for submit
- reason_for_unsuitable: required (non-empty string)
- necropsy_conducted_by: required (array of user IDs)
```

### Draft Validation

```javascript
// Mobile app draft validation
- If unsuitable:
  - reason_for_unsuitable: required
  - necropsy_conducted_by: required
- If suitable:
  - weight_unit: required if carcass_weight provided
  - manner_of_death: required
  - necropsy_conducted_by: required
  - disposal_method: NOT required (relaxed for drafts)
```

---

## API Endpoints

### Add Necropsy

- **URL**: `POST v2/animal/necropsy/add`
- **Content-Type**: `multipart/form-data`

### Edit Necropsy

- **URL**: `POST v2/animal/necropsy/edit`
- **Content-Type**: `multipart/form-data`

### Delete Necropsy

- **URL**: `POST v2/delete/animal/necropsy`
- **Payload**: `{ necropsy_id: string }`

### Get Necropsy Summary

- **URL**: `GET v2/necropsy/summary/{necropsyId}`

### Get Necropsy Body Parts

- **URL**: `POST v1/animal/necropsy/bodyparts`
- **Payload**: `{ zoo_id: string }`

### Get Necropsy Template

- **URL**: `GET v2/get-template-necropsy`

### Get Manner of Death Options

- **URL**: `GET {MANNER_OF_DEATH}`
- **Response**: Array of `{ id, name, string_id }`

### Get Disposal Method Options

- **URL**: `GET {CARCASS_DEPOSITION}`
- **Response**: Array of `{ id, name, string_id }`

---

## API Payload Structure

### Mobile App Payload (Reference)

```javascript
{
  mortality_id: number,
  animal_id: number,
  necropsy_time: "HH:mm:ss",
  necropsy_date: "YYYY-MM-DD",
  body_part_data: JSON.stringify([
    { body_part_id: number, value: string }
  ]),
  cause_for_death: number,           // From manner_of_death ID
  disposal_method: string,           // Disposal ID
  history_of_illness: string,
  status: "draft" | "completed",
  general_description: string,
  place_of_death: string,
  special_feature: "Ok",             // Hardcoded
  biological_test: string,
  additional_notes: string,
  caracass_submission_date: "YYYY-MM-DD",
  caracass_submission_time: "HH:mm:ss",
  death_date: "YYYY-MM-DD",
  death_time: "HH:mm:ss",
  suspected_cause_of_death: number,
  confirmed_cause_of_death: string,  // Manner death ID
  necropsy_id: number,               // For edit
  discovered_date: "YYYY-MM-DD HH:mm:ss",
  is_unsuitable: "0" | "1",
  reason_for_unsuitable: string,
  all_update_action: "0" | "1",
  qr_number: string,
  carcass_weight: number,
  carcass_weight_uom: number,        // Unit ID
  approximate_weight: 0 | 1,
  approximate_dob: 0 | 1,
  dob: "YYYY-MM-DD",
  sex: string,
  age: number,
  age_unit: "day",
  necropsy_conducted_by: JSON.stringify([user_id, ...]),
  opinion: string,

  // Files
  necropsy_attachment[]: File[]
}
```

### Web App Payload (Current)

```javascript
{
  mortality_id: number,
  status: "draft" | "completed" | "unsuitable",
  necropsy_id: number,               // For edit
  animal_id: number,
  is_unsuitable: "0" | "1",
  reason_for_unsuitable: string,
  necropsy_conducted_by: JSON.stringify([user_id, ...]),
  caracass_submission_date: "YYYY-MM-DD",
  caracass_submission_time: "HH:mm:ss",
  death_date: "YYYY-MM-DD",
  death_time: "HH:mm:ss",
  place_of_death: string,
  carcass_weight: number,
  carcass_weight_uom: string,        // Unit value
  approximate_weight: "0" | "1",
  sex: string,
  age: number,
  age_unit: string,
  approximate_dob: "0" | "1",
  history_of_illness: string,
  necropsy_date: "YYYY-MM-DD",
  necropsy_time: "HH:mm:ss",
  general_description: string,
  necropsy_organs: JSON.stringify([...]),
  suspected_cause_of_death: string,
  suspected_cause_of_death_string_id: string,
  opinion: string,
  confirmed_cause_of_death: string,
  confirmed_cause_of_death_string_id: string,
  disposal_method: string,
  disposal_method_string_id: string,
  qr_number: string,
  additional_notes: string,

  // Files
  necropsy_attachment[]: File[]
}
```

### Payload Differences

| Field | Mobile | Web | Notes |
|-------|--------|-----|-------|
| `body_part_data` | JSON string of `[{body_part_id, value}]` | ✅ Present | Both now use same format |
| `biological_test` | Present | ✅ Present | Implemented |
| `cause_for_death` | Present | ✅ Present | Sends manner_of_death_id |
| `carcass_weight_uom` | Unit ID (number) | ✅ Unit ID (number) | Fixed - now sends numeric ID |
| `special_feature` | "Ok" (hardcoded) | Missing | Optional - not critical |
| `all_update_action` | Present | Missing | Optional - mobile specific |

---

## Organ Data Structure

### Mobile Format (body_part_data)

```javascript
JSON.stringify([
  { body_part_id: 123, value: "Description text" },
  { body_part_id: 456, value: "Another description" }
])
```

### Web Format (necropsy_organs)

```javascript
JSON.stringify([
  {
    id: "organ_123",
    label: "Heart",
    parts: [
      { id: "part_1", organ_name: "Left Ventricle", value: "Normal" }
    ]
  }
])
```

---

## Status Values

| Status | Description |
|--------|-------------|
| `PENDING` | Awaiting necropsy report |
| `DRAFT` | Necropsy report saved as draft |
| `COMPLETED` | Necropsy report submitted |
| `UNSUITABLE` | Carcass marked as unsuitable for necropsy |

---

## Components

### Web Components

| Component | File | Purpose |
|-----------|------|---------|
| `NecropsyReportForm` | `src/views/pages/necropsy/NecropsyReportForm.js` | Main form component |
| `NecropsyAnimalInfoCard` | `src/components/necropsy/NecropsyAnimalInfoCard.js` | Animal info display |
| `UserMultiSelect` | `src/components/necropsy/UserMultiSelect.js` | Multi-user selection |
| `NecropsyOrganSection` | `src/components/necropsy/NecropsyOrganSection.js` | Organ examination section |

### Mobile Components

| Component | File | Purpose |
|-----------|------|---------|
| `AddNecropcy` | `screen/Animals/AddNecropcy.js` | Main form screen |
| `AnimalCustomCard` | `components/AnimalCustomCard.js` | Animal info card |
| `InputBox` | `components/InputBox.js` | Text input component |
| `UploadFileUI` | `components/UploadFileUI.js` | File upload component |

---

## Implementation Notes

### Draft Save Behavior

- Mobile: Saves draft with relaxed validation (disposal_method not required)
- Web: Should match mobile behavior

### File Attachments

- Both platforms use `necropsy_attachment[]` as the field name
- Support images, PDFs, and documents
- Existing attachments from API have `fromApi: true` flag

### User Selection

- Current logged-in user is auto-selected as conductor
- Multiple users can be selected
- Users are filtered by site and necropsy center access

### Template System

- Templates provide pre-configured organ/part combinations
- Templates are fetched from `GET v2/get-template-necropsy`
- Selecting a template populates the organ section

---

## Error Handling

### Validation Errors

Shown inline below the field with red text.

### API Errors

Displayed as toast notifications:
- Success: Green toast with success message
- Error: Red toast with error message from API or generic fallback

---

## Navigation Flow

### Web Flow

```
/necropsy?status=PENDING → Click animal → /necropsy/[id] → Fill Report button → /necropsy/[id]/report
```

### Mobile Flow

```
NecropsyScreen → Select mortality → AddNecropsy screen
```

---

## Recent Fixes

### Death Time Pre-fill Fix

- Added `dayjs/plugin/utc` and `dayjs/plugin/timezone` for proper UTC to local time conversion
- `discovered_date` from mortality data is now properly parsed and converted to local time
- Handles both timestamp (number) and date string formats

### Necropsy Conducted By Pre-selection Fix

- Current logged-in user is now correctly auto-added as conductor for new necropsy forms
- Uses `authData.userData.user` to access user details (matching AuthContext structure)
- Only applies to new forms (not when editing existing necropsy)

### Responsive Layout

The form uses a responsive grid layout that adapts to different screen sizes.

#### Breakpoint Behavior

| Breakpoint | Screen Size | Description |
|------------|-------------|-------------|
| `xs` | 0-599px | Mobile phones |
| `sm` | 600-899px | Tablets |
| `md` | 900-1199px | Small laptops |
| `lg` | 1200px+ | Desktops |

#### Carcass Submission & Death Date/Time Section

**On lg+ screens (≥1200px):**
```
[Carcass Submission Date & Time]    [Date & Time of Death]
[Date]  [Time]                      [Date]  [Time]
```
- Both field groups displayed side-by-side (50% width each)
- Each group has its own header above the fields
- Uses `size={{ xs: 12, lg: 6 }}` for the outer containers

**On md and smaller screens (<1200px):**
```
[Carcass Submission Date & Time]
[Date]  [Time]

[Date & Time of Death]
[Date]  [Time]
```
- Field groups stack vertically (full width)
- Each group maintains its own header
- Date and Time fields remain side-by-side within each group

#### Always Side-by-Side Fields (All Screen Sizes)

These field pairs use `size={6}` with `spacing={3}` to always display side-by-side:

| Field Group | Left Field | Right Field |
|-------------|------------|-------------|
| Carcass Weight | Weight (number input) | Unit (dropdown) |
| Age | Age (number input) | Unit (dropdown) |
| Necropsy Date & Time | Date (date picker) | Time (time picker) |

#### Responsive Side-by-Side Fields

These field pairs use `size={{ xs: 12, sm: 6 }}` - stack on mobile, side-by-side on sm+:

| Field Group | Left Field | Right Field |
|-------------|------------|-------------|
| Place of Death & QR Number | Place of Death | QR Number |
| Confirmed Cause & Disposal | Confirmed Cause After Necropsy | Disposal Method |

---

## Organ Selection (Drawer Pattern)

The organ selection has been redesigned to follow the AddParameterDrawer pattern from the hospital module.

### Components

| Component | File | Purpose |
|-----------|------|---------|
| `NecropsyOrganSection` | `src/components/necropsy/NecropsyOrganSection.js` | Main component with "Add Organ" button and selected organs display |
| `AddOrganDrawer` | `src/components/necropsy/AddOrganDrawer.js` | Primary drawer with organ selection and templates |
| `SelectOrganDrawer` | `src/components/necropsy/SelectOrganDrawer.js` | Secondary drawer with category tabs and organ listing |
| `EditTemplateDrawer` | `src/components/necropsy/EditTemplateDrawer.js` | Drawer for editing existing templates |

### User Flow

1. User clicks "Add Organ" button in the form
2. `AddOrganDrawer` opens with:
   - "Add Organ" button at top (opens `SelectOrganDrawer`)
   - Selected organs list grouped by category with parts displayed as chips
   - Templates section below for quick selection
   - Apply/Cancel buttons at bottom
3. User can:
   - Click a template to add all its organs
   - Click "Add Organ" to open `SelectOrganDrawer` for individual selection
   - Remove organ categories from the selected list
4. User clicks "Apply" to confirm selection
5. Selected organs appear in the form with expandable accordions for editing

### API Data Structure

The `getNecropsyBodyParts` API returns:
```javascript
[
  {
    id: "1",
    label: "Head and neck",
    parts: [
      { id: "101", label: "Muzzle" },
      { id: "102", label: "Beak" },
      { id: "103", label: "Skull" },
      // ...more parts
    ]
  },
  {
    id: "2",
    label: "Trunk",
    parts: [...]
  }
]
```

### Form Display

Selected organs are displayed as expandable accordions showing:
- Organ category name in header
- Parts list with dynamic description labels (e.g., "Enter Muzzle Description")
- Delete category button

---

## SelectOrganDrawer Improvements

**File:** `src/components/necropsy/SelectOrganDrawer.js`

### Fixed Header Elements
The search bar and horizontal scrollable category tabs are now fixed at the top of the drawer, allowing users to scroll through the parts list while keeping navigation elements accessible.

**Layout Structure:**
```
┌─────────────────────────────────────┐
│ Select Organs                     ✕ │  ← Fixed Header
├─────────────────────────────────────┤
│ 🔍 Search Organs                    │  ← Fixed Search
├─────────────────────────────────────┤
│ All (50) │ Head and neck (9) │ ...  │  ← Fixed Tabs (horizontally scrollable)
├─────────────────────────────────────┤
│ Select all                       ☐  │  ← Fixed Select All
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Muzzle                        ☐ │ │
│ │ Head and neck                   │ │  ← Scrollable Parts List
│ └─────────────────────────────────┘ │
│           ...                       │
└─────────────────────────────────────┘
```

### SelectOrganDrawer Features

- **Search bar**: Filter organs by name (fixed at top)
- **Horizontal scrollable category tabs**: "All", "Head and neck", "Trunk", etc. (fixed at top)
- **Select All option**: Select/deselect all organs in current category view (fixed at top)
- **Organ listing**: Checkboxes for individual organ selection (scrollable)
- **Category labels**: When "All" is selected, shows which category each organ belongs to
- **Footer**: Shows selected count with Add/Cancel buttons
- **Skeleton loading**: Shows placeholder skeletons while fetching data

### Changes Made:
- Moved Search component outside scrollable area with `flexShrink: 0`
- Moved Category Tabs outside scrollable area with `flexShrink: 0`
- Moved "Select All" option outside scrollable area
- Removed divider/border below "Select All"
- Only the parts list scrolls now
- Added skeleton loading for parts list

---

## AddOrganDrawer Improvements

**File:** `src/components/necropsy/AddOrganDrawer.js`

### Individual Sub-Organ Removal
Users can now remove individual sub-organs (parts) from an organ category without having to remove the entire organ. This matches the mobile app behavior.

**New Function:**
```javascript
const handleRemovePart = (organId, partId) => {
  // Removes specific part from organ
  // If no parts left, removes the entire organ automatically
}
```

### Enhanced Sub-Organ Tag Styling
Sub-organ tags now have improved visual design for better readability:

- **Pill shape** - Rounded corners (`borderRadius: 16px`)
- **Better padding** - Increased horizontal and vertical padding
- **Subtle border** - Light border for visual definition
- **Larger gap** - More spacing between tags
- **Typography** - Larger font (0.8125rem), medium weight (500)
- **Hover effects** - Background and border highlight on hover
- **Close button** - Grey circular background, turns red on hover

### Single-Select Template Behavior
Templates now use single-select instead of multi-select:

- Clicking a template highlights it and shows only that template's data
- Clicking the same template deselects it
- Clicking a different template switches to that template's data
- Existing organs from the form are preserved when switching

**Visual Highlighting:**
- Selected template: 2px primary color border
- Selected template: Bold text (fontWeight: 600)
- Smooth transition animations

---

## NecropsyOrganSection Simplification

**File:** `src/components/necropsy/NecropsyOrganSection.js`

### Removed Elements:
- ❌ "Organ Name" text field
- ❌ "Part Name" text field
- ❌ "Add Part" button
- ❌ Cross icon (×) for each sub-organ
- ❌ Unused imports (`AddIcon`, `CloseIcon`)
- ❌ Unused functions (`handleOrganLabelChange`, `handleAddPart`, `handleRemovePart`)

### Updated Layout:
The part name is now displayed in the text field label instead of a separate field.

**Before:**
```
┌─────────────────────────────────────────────────┐
│ Head and neck  (1 parts)                   🗑️ ⌃ │
├─────────────────────────────────────────────────┤
│  Organ Name: [Head and neck_______]             │
│  ┌───────────────────────────────────────────┐  │
│  │ Part Name: [Muzzle____________]         ✕ │  │
│  │ Description of Lesions: [______________]  │  │
│  └───────────────────────────────────────────┘  │
│  + ADD PART                                     │
└─────────────────────────────────────────────────┘
```

**After:**
```
┌─────────────────────────────────────────────────┐
│ Head and neck  (1 parts)                   🗑️ ⌃ │
├─────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────┐  │
│  │ Enter Muzzle Description                  │  │
│  │                                           │  │
│  │                                           │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

The label dynamically shows "Enter {PartName} Description" based on the sub-organ name.

---

## Save as Template Feature

**File:** `src/components/necropsy/AddOrganDrawer.js`

### New Feature
Users can now save their selected organs as a template for future use, matching the mobile app functionality.

### New State Variables:
```javascript
const [saveTemplate, setSaveTemplate] = useState(false)
const [templateName, setTemplateName] = useState('')
const [saveLoading, setSaveLoading] = useState(false)
```

### New Function:
```javascript
const handleSaveTemplate = async () => {
  // Validates template name
  // Formats selected organs/parts into template items
  // Calls API: POST /v2/create-necropsy-template
  // Payload: { template_name, template_items: [{ id, desc }] }
  // Shows success/error toasts
  // Refreshes template list on success
}
```

### UI States:

**Default View:**
```
┌─────────────────────────────────────────────────┐
│ 💾 Save as template              Clear all      │
└─────────────────────────────────────────────────┘
```

**Save Mode (when clicked):**
```
┌─────────────────────────────────────────────────┐
│ [Enter Template Name____] [SAVE] [Cancel]       │
└─────────────────────────────────────────────────┘
```

### Behavior:
- "Save as template" only enabled when new organs are selected
- Entering save mode shows text field + Save/Cancel buttons
- Save button disabled until template name is entered
- Loading spinner shown during API call
- Success/error toasts displayed
- Template list refreshes after successful save

---

## Edit Template Feature

**Files:**
- `src/components/necropsy/EditTemplateDrawer.js` (New)
- `src/components/necropsy/AddOrganDrawer.js` (Updated)

### New Component: EditTemplateDrawer
A new drawer component for editing existing templates, matching the mobile app functionality.

**Features:**
- Edit template name
- Add new organs to the template
- Remove individual parts from organs
- Remove entire organs
- Save changes to template
- Delete template with confirmation dialog

### Edit Mode in AddOrganDrawer
Added edit mode toggle to the Templates section header.

**New State Variables:**
```javascript
const [editMode, setEditMode] = useState(false)
const [editingTemplate, setEditingTemplate] = useState(null)
const [openEditDrawer, setOpenEditDrawer] = useState(false)
```

**UI Changes:**

**Normal Mode:**
```
┌─────────────────────────────────────────────────┐
│ Templates                              [Edit]   │
├─────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐            │
│  │ Template 1   │  │ Template 2   │            │
│  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────┘
```

**Edit Mode (toggle active):**
```
┌─────────────────────────────────────────────────┐
│ Templates                              [Done]   │  ← Button highlighted
├─────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐            │
│  │ ✏️ Template 1 │  │ ✏️ Template 2 │            │  ← Dashed border + edit icon
│  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────┘
```

**Behavior:**
- Click "Edit" button to enter edit mode
- Templates show dashed border and pencil icon
- Click any template to open EditTemplateDrawer
- Click "Done" to exit edit mode

### EditTemplateDrawer Layout
```
┌─────────────────────────────────────────────────┐
│ ✏️ Edit Template                      🗑️    ✕   │
├─────────────────────────────────────────────────┤
│  Template Name                                  │
│  [Current Template Name_____________]           │
│                                                 │
│  [+ Add Organ]                                  │
│                                                 │
│  Organs (5 parts in 2 categories)              │
│  ┌───────────────────────────────────────────┐ │
│  │ Head and neck                           ✕ │ │
│  │ [Muzzle ✕] [Tongue ✕] [Eyes ✕]           │ │
│  └───────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │ Thorax                                  ✕ │ │
│  │ [Heart ✕] [Lungs ✕]                      │ │
│  └───────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│        [Cancel]              [Save]             │
└─────────────────────────────────────────────────┘
```

### Delete Confirmation Dialog
When clicking the delete icon or saving with no organs:
```
┌─────────────────────────────────────────────────┐
│  Delete Template                                │
│                                                 │
│  Are you sure you want to delete this template? │
│  This action cannot be undone.                  │
│                                                 │
│              [Cancel]    [Delete]               │
└─────────────────────────────────────────────────┘
```

---

## Skeleton Loading

**Files:**
- `src/components/necropsy/SelectOrganDrawer.js`
- `src/components/necropsy/EditTemplateDrawer.js`

### Overview
Added skeleton loading states to improve user experience while data is being fetched. This provides visual feedback during API calls, preventing layout shifts and indicating that content is loading.

### SelectOrganDrawer Skeleton Loading

When the drawer opens and fetches body parts data, skeleton placeholders are displayed for the parts list.

**Implementation:**
```javascript
{loading ? (
  <>
    {[1, 2, 3, 4, 5, 6].map((item) => (
      <Skeleton
        key={item}
        variant='rectangular'
        height={72}
        sx={{ borderRadius: 1, bgcolor: theme.palette.action.hover }}
      />
    ))}
  </>
) : (
  // Parts list content
)}
```

**Visual Layout:**
```
┌─────────────────────────────────────────────────┐
│ Select Organs                              ✕    │
├─────────────────────────────────────────────────┤
│ 🔍 Search Organs                                │
├─────────────────────────────────────────────────┤
│ ⏳ Loading...                                   │  ← CircularProgress for tabs
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │  ← Skeleton placeholders
│ └─────────────────────────────────────────────┘ │
│           ...                                   │
└─────────────────────────────────────────────────┘
```

### EditTemplateDrawer Skeleton Loading

When editing a template, skeleton placeholders are shown while fetching body parts data to resolve section names.

**Loading State:**
```javascript
const [loading, setLoading] = useState(true)

useEffect(() => {
  const fetchBodyParts = async () => {
    setLoading(true)
    try {
      const res = await getNecropsyBodyParts({})
      if (res?.success && res?.data) {
        setBodyPartsData(res.data)
      }
    } catch (error) {
      console.error('Error fetching body parts:', error)
    }
  }
  if (open) {
    fetchBodyParts()
  }
}, [open])
```

**Skeleton Elements:**
- Template name text field skeleton
- Add organ button skeleton
- Organs title text skeleton
- Organ cards with:
  - Category name skeleton
  - Sub-organ pill tags skeleton

**Visual Layout:**
```
┌─────────────────────────────────────────────────┐
│ ✏️ Edit Template                      🗑️    ✕   │
├─────────────────────────────────────────────────┤
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← Template name skeleton
│                                                 │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← Add organ button skeleton
│                                                 │
│  ░░░░░░░░░░░░░░░                               │  ← "Organs" title skeleton
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ ░░░░░░░░░░░░                              │ │  ← Category name skeleton
│  │ [░░░░░░░] [░░░░░] [░░░░░░░]               │ │  ← Pill tag skeletons
│  └───────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │ ░░░░░░░░░░                                │ │
│  │ [░░░░░] [░░░░░░░]                         │ │
│  └───────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│        [Cancel]              [Save]             │
└─────────────────────────────────────────────────┘
```

### MUI Skeleton Variants Used

| Variant | Usage |
|---------|-------|
| `rectangular` | Text fields, buttons, organ cards |
| `text` | Title texts, category names |
| `rounded` | Pill-shaped sub-organ tags |

### Styling
- Border radius matches the actual components
- Background color uses `theme.palette.action.hover` for subtle appearance
- Proper spacing maintained to prevent layout shifts

---

## Template API Endpoints

### New Constants
**File:** `src/constants/ApiConstant.js`

```javascript
export const CREATE_NECROPSY_TEMPLATE = `v2/create-necropsy-template`
export const UPDATE_NECROPSY_TEMPLATE = `v2/update-template`
export const DELETE_NECROPSY_TEMPLATE = `v2/delete-necropsy-template`
```

### New API Functions
**File:** `src/lib/api/necropsy/index.js`

```javascript
// Create new template
export async function createNecropsyTemplate(payload) {
  const response = await axiosPost({ url: CREATE_NECROPSY_TEMPLATE, body: payload })
  return response?.data
}

// Update existing template
export async function updateNecropsyTemplate(templateId, payload) {
  const response = await axiosFormPost({ url: `${UPDATE_NECROPSY_TEMPLATE}/${templateId}`, body: payload })
  return response?.data
}

// Delete template
export async function deleteNecropsyTemplate(templateId) {
  const response = await axiosPost({ url: `${DELETE_NECROPSY_TEMPLATE}/${templateId}`, body: {} })
  return response?.data
}
```

### Template API Endpoints Summary

| Action | Method | Endpoint | Payload |
|--------|--------|----------|---------|
| Create | POST | `/v2/create-necropsy-template` | `{ template_name, template_items }` |
| Update | POST | `/v2/update-template/{id}` | `{ template_name, template_items }` |
| Delete | POST | `/v2/delete-necropsy-template/{id}` | `{}` |
| Get All | GET | `/v2/get-template-necropsy` | - |

### Create Payload Format
```javascript
{
  template_name: "My Template",
  template_items: [
    { id: "part_id_1", desc: "" },
    { id: "part_id_2", desc: "" }
  ]
}
```

### Update Payload Format
```javascript
{
  template_name: "Updated Template Name",
  template_items: JSON.stringify([
    { id: "part_id_1", desc: "Description 1" },
    { id: "part_id_2", desc: "Description 2" }
  ])
}
```

This matches the mobile app API implementation from:
- `antz_mobile_app/services/NecropcyService.js`
  - `createBodyPartTemplate()`
  - `updateBodyPartTemplateV2()`
  - `deleteBodyPartTemplateV2()`
- `antz_mobile_app/screen/Animals/AddOrganWithTemplate.js`
- `antz_mobile_app/screen/Animals/EditOrganTemplate.js`

---

## Unsuitable Confirmation Dialog

**File:** `src/views/pages/necropsy/NecropsyReportForm.js`

### Overview
When marking a carcass as "not suitable for necropsy", a confirmation dialog is now displayed to the user before proceeding. This matches the mobile app behavior where users must confirm their intent before the form switches to unsuitable mode.

### Implementation

**New State:**
```javascript
const [unsuitableDialogOpen, setUnsuitableDialogOpen] = useState(false)
```

**Handler Functions:**
```javascript
// Called when the switch is toggled
const handleSuitableToggle = (newValue) => {
  if (!newValue) {
    // Switching to unsuitable - show confirmation dialog
    setUnsuitableDialogOpen(true)
  }
  // Switching back to suitable - no confirmation needed
}

// Called when user confirms unsuitable
const handleConfirmUnsuitable = () => {
  setUnsuitableDialogOpen(false)
}

// Called when user cancels - reverts the switch
const handleCancelUnsuitable = () => {
  setValue('is_suitable', true)
  setUnsuitableDialogOpen(false)
}
```

### Dialog UI

Uses the `ConfirmationDialog` component:

```javascript
<ConfirmationDialog
  dialogBoxStatus={unsuitableDialogOpen}
  onClose={handleCancelUnsuitable}
  icon='mdi:alert-circle-outline'
  title='Mark as Unsuitable?'
  description='Are you sure you want to mark this carcass as unsuitable for necropsy? You will need to provide a reason.'
  cancelText='No'
  ConfirmationText='Yes'
  confirmAction={handleConfirmUnsuitable}
/>
```

### Visual Layout
```
┌─────────────────────────────────────────────────┐
│                                                 │
│              ⚠️ (Warning Icon)                  │
│                                                 │
│           Mark as Unsuitable?                   │
│                                                 │
│  Are you sure you want to mark this carcass     │
│  as unsuitable for necropsy? You will need      │
│  to provide a reason.                           │
│                                                 │
│         [No]              [Yes]                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Behavior Flow

1. User toggles "Carcass is suitable for necropsy" switch to OFF
2. Confirmation dialog appears with warning icon
3. **If user clicks "Yes":**
   - Dialog closes
   - Switch remains OFF (unsuitable)
   - "Reason for unsuitable" text field appears
   - "Necropsy Conducted By" field appears
   - Carcass details section is hidden
4. **If user clicks "No":**
   - Dialog closes
   - Switch reverts back to ON (suitable)
   - Form remains in suitable mode

### Mobile App Reference

The mobile app uses a similar pattern with `DeleteDraftModal`:
```javascript
<DeleteDraftModal
  visible={showUnsuitableModal}
  title={translate.t("mortalityScreen.unsuitable_alert")}
  subTitle={""}
  onNo={() => setShowUnsuitableModal(false)}
  onYes={makeNecropsyUnsuitable}
/>
```

---

## Age Edit Dialog

**File:** `src/views/pages/necropsy/NecropsyReportForm.js`

### Overview
The age field has been redesigned to match the mobile app behavior. Instead of directly entering age and unit, users now see a calculated age display with a DOB (Date of Birth) shown below. Users can edit the age by clicking an "Edit" button which opens a dialog where they can enter years, months, and days.

### Implementation

**New State Variables:**
```javascript
const [ageDialogOpen, setAgeDialogOpen] = useState(false)
const [animalDOB, setAnimalDOB] = useState(null)
const [ageInputs, setAgeInputs] = useState({ years: '', months: '', days: '' })
const [dialogApproxAge, setDialogApproxAge] = useState(false)
```

**Key Functions:**

1. **`getAgeDisplay()`** - Calculates and formats age from DOB and death date:
```javascript
const getAgeDisplay = () => {
  // Returns formatted string like "2 Years 3 Months 15 Days"
}
```

2. **`calculateDOBFromInputs()`** - Calculates DOB by subtracting age inputs from death date:
```javascript
const calculateDOBFromInputs = (inputs = ageInputs) => {
  // Returns dayjs object representing calculated DOB
}
```

3. **`getAgeInputsFromDOB()`** - Converts DOB to years/months/days for dialog initialization:
```javascript
const getAgeInputsFromDOB = (dob) => {
  // Returns { years: '', months: '', days: '' }
}
```

### Age Display UI

The age field now shows:
- Calculated age (e.g., "2 Years 3 Months 15 Days")
- "(Approximate)" label if marked as approximate
- DOB below (e.g., "DOB: 15 Jan 2022")
- Edit button to open the dialog

**Visual Layout:**
```
┌─────────────────────────────────────────────────┐
│ Age                                             │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ 2 Years 3 Months 15 Days (Approximate)      │ │
│ │ DOB: 15 Jan 2022                    [Edit]  │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Age Edit Dialog

When user clicks "Edit", a dialog opens with:
- Years, Months, Days input fields
- Calculated DOB display (updates as user types)
- "Mark as approximate" checkbox
- Cancel/Apply buttons

**Dialog Layout:**
```
┌─────────────────────────────────────────────────┐
│ Update Age                                   ✕  │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Years]      [Months]      [Days]              │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ DOB: 15 Jan 2022                        │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ☐ Mark as approximate                          │
│                                                 │
│              [Cancel]      [Apply]              │
└─────────────────────────────────────────────────┘
```

### DOB Prefill Logic

**From Mortality Data (New Necropsy):**
1. If `birth_date` is available, use it directly
2. Otherwise, calculate DOB from `age`, `age_unit`, and `discovered_date`

**From Necropsy Data (Editing):**
1. If `birth_date` or `dob` is available, use it directly
2. Otherwise, calculate DOB from `age`, `age_unit`, and `death_date`

### API Submission

When submitting, the age is sent as total days (matching mobile app):
```javascript
// If DOB is set
fd.append('age', totalDaysFromDOBToDeathDate)
fd.append('age_unit', 'day')
fd.append('dob', 'YYYY-MM-DD')
fd.append('approximate_dob', '0' | '1')
```

### Mobile App Reference

The mobile app implements this in `AddNecropcy.js` with:
- `getYMD()` - Calculates years/months/days between dates
- `getDateDifference()` - Formats age for display
- `getDOBObject()` - Calculates DOB from age inputs
- `onApplyDOB()` - Applies DOB changes from modal

---

## Form Skeleton Loading

**Files:**
- `src/views/pages/necropsy/NecropsyReportForm.js`
- `src/components/necropsy/NecropsyAnimalInfoCard.js`

### Overview
Skeleton loading states have been added to both the necropsy report form and the animal info card. This provides visual feedback while data is being fetched, preventing layout shifts and indicating content is loading.

### NecropsyAnimalInfoCard Skeleton

The animal info card now accepts a `loading` prop:

```javascript
<NecropsyAnimalInfoCard mortalityData={mortalityData} loading={loading} />
```

**Skeleton Components:**
- `AnimalCardSkeleton` - Circular avatar + text lines for animal details
- `InfoItemSkeleton` - Icon placeholder + text lines for each info field

**Visual Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ ┌───────────────────────┐ ┌───────────────────────────────────┐ │
│ │  ○ ░░░░░░░░░░░░░░░░░  │ │ ▢ ░░░░░░░░    ▢ ░░░░░░░░         │ │
│ │    ░░░░░░░░░░░        │ │   ░░░░░░░░░░    ░░░░░░░░░░       │ │
│ │    ░░░░ ░░░░░░        │ │                                   │ │
│ │                       │ │ ▢ ░░░░░░░░    ▢ ░░░░░░░░         │ │
│ │  Animal Card Skeleton │ │   ░░░░░░░░░░    ░░░░░░░░░░       │ │
│ └───────────────────────┘ │                                   │ │
│                           │ ▢ ░░░░░░░░    ▢ ░░░░░░░░         │ │
│                           │   ░░░░░░░░░░    ░░░░░░░░░░       │ │
│                           └───────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Form Skeleton

The form shows comprehensive skeleton placeholders matching the form structure:

**Skeleton Helper Components:**
```javascript
const FormFieldSkeleton = ({ label = true, height = 56 }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
    {label && <Skeleton variant='text' width={120} height={24} />}
    <Skeleton variant='rectangular' height={height} sx={{ borderRadius: 1 }} />
  </Box>
)

const SectionSkeleton = ({ fields = 2, hasLabel = true }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    {hasLabel && <Skeleton variant='text' width={150} height={28} />}
    <Grid container spacing={3}>
      {/* Field skeletons */}
    </Grid>
  </Box>
)
```

**Form Skeleton Sections:**
- Carcass Suitability toggle skeleton
- Date/Time fields skeleton (2x2 grid)
- Place of Death & QR Number skeleton
- Carcass Weight skeleton
- Sex selection skeleton
- Age display skeleton
- Clinical History textarea skeleton
- Necropsy Details skeleton
- Conducted By skeleton
- Examination Findings skeleton
- Organ Section skeleton

**Visual Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░                                                   │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░                        [═══]        │
├─────────────────────────────────────────────────────────────────┤
│ ░░░░░░░░░░░░░░                                                  │
│                                                                 │
│ ┌─────────────────────────┐ ┌─────────────────────────┐         │
│ │ ░░░░░░░░░░░░░░░░        │ │ ░░░░░░░░░░░░░░          │         │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░ │ │ ░░░░░░░░░░░░░░░░░░░░░░░ │         │
│ └─────────────────────────┘ └─────────────────────────┘         │
│                                                                 │
│ ░░░░░░░░░░░░░░░░░░                                              │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │                          Textarea                           │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ... (more sections)                                             │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation

The loading state is determined by the `loading` state variable:

```javascript
const [loading, setLoading] = useState(true)

// In fetchInitialData
try {
  setLoading(true)
  // ... fetch data
} finally {
  setLoading(false)
}

// Render
if (loading) {
  return (
    <Box>
      <NecropsyAnimalInfoCard loading={true} />
      {/* Form skeleton */}
    </Box>
  )
}
```

---

## Files Modified (Organ Selection & Form Updates)

| File | Changes |
|------|---------|
| `src/views/pages/necropsy/NecropsyReportForm.js` | Added unsuitable confirmation dialog, age edit dialog with DOB calculation, form skeleton loading |
| `src/components/necropsy/NecropsyAnimalInfoCard.js` | Added skeleton loading support with `loading` prop |
| `src/components/necropsy/SelectOrganDrawer.js` | Fixed header, search, tabs, select all, skeleton loading |
| `src/components/necropsy/AddOrganDrawer.js` | Sub-organ removal, save template, single-select templates, edit mode |
| `src/components/necropsy/EditTemplateDrawer.js` | **New file** - Template editing drawer with skeleton loading |
| `src/components/necropsy/NecropsyOrganSection.js` | Simplified UI, dynamic labels |
| `src/constants/ApiConstant.js` | Added CREATE, UPDATE, DELETE template constants |
| `src/lib/api/necropsy/index.js` | Added create, update, delete template functions |

---

## Dependencies (Organ Selection & Form)

- `@mui/material` - TextField, Button, CircularProgress, Dialog, Skeleton, etc.
- `src/@core/components/icon` - Icon component
- `src/components/Toaster` - Toast notifications
- `src/components/confirmation-dialog` - ConfirmationDialog component for unsuitable confirmation

---

## API Submission Fixes

**File:** `src/views/pages/necropsy/NecropsyReportForm.js`

### Overview
Fixed several API submission issues that were causing validation errors when submitting the necropsy form.

### Error Message Handling

**Problem:** When the API returned validation errors as an object (e.g., `{ "carcass_weight_uom": "...", "body_part_data": "..." }`), the Toaster was displaying `[object, object]` instead of a readable error message.

**Solution:** Added a helper function to extract readable error messages from API responses:

```javascript
const getErrorMessage = (message, fallback = 'An error occurred') => {
  if (!message) return fallback
  if (typeof message === 'string') return message

  // If message is an object (validation errors), extract the first error
  if (typeof message === 'object') {
    const errorValues = Object.values(message)
    if (errorValues.length > 0) {
      return String(errorValues[0])
    }
  }

  return fallback
}
```

**Usage:**
```javascript
Toaster({ type: 'error', message: getErrorMessage(res?.message, 'Failed to submit necropsy') })
```

### Body Part Data Format

**Problem:** The API expected `body_part_data` in format `[{body_part_id, value}]`, but the web app was sending `necropsy_organs` in a different format.

**Solution:** Updated `buildFormData` to convert organs to the correct format:

```javascript
// Convert organs to body_part_data format (matching mobile app)
if (organs.length > 0) {
  const bodyPartData = []
  organs.forEach(organ => {
    if (organ.parts?.length > 0) {
      organ.parts.forEach(part => {
        bodyPartData.push({
          body_part_id: part.id || part.body_part_id,
          value: part.value || part.description || ''
        })
      })
    }
  })
  fd.append('body_part_data', JSON.stringify(bodyPartData))
}
```

### Carcass Weight UOM (Unit of Measure)

**Problem:** The API expected a numeric ID for `carcass_weight_uom`, but the web app was sending string values like "kg", "g".

**Solution:**
1. Added state to store the UOM ID from API responses:
```javascript
const [weightUomId, setWeightUomId] = useState(null)
```

2. Store the UOM ID when loading mortality/necropsy data:
```javascript
// From mortality data
if (mortData.carcass_weight_uom_id || mortData.uom_id) {
  setWeightUomId(mortData.carcass_weight_uom_id || mortData.uom_id)
}
```

3. Always send `carcass_weight` and `carcass_weight_uom` (as 0 if empty) - matching mobile app:
```javascript
// Always send carcass_weight (as 0 if empty) - matching mobile app
fd.append('carcass_weight', formValues.carcass_weight ? formValues.carcass_weight : 0)

// Always send carcass_weight_uom (as 0 if empty) - matching mobile app
if (weightUomId && !isNaN(Number(weightUomId))) {
  fd.append('carcass_weight_uom', weightUomId)
} else if (formValues.weight_unit?.id && !isNaN(Number(formValues.weight_unit.id))) {
  fd.append('carcass_weight_uom', formValues.weight_unit.id)
} else {
  fd.append('carcass_weight_uom', 0)
}
```

### Discovered Date and All Update Action

**Problem:** Mobile app sends `discovered_date` and `all_update_action` fields, but web was missing these.

**Solution:** Added these fields to match mobile app:
```javascript
// Send discovered_date from mortality data (matching mobile app)
if (mortalityData?.discovered_date) {
  fd.append('discovered_date', dayjs(mortalityData.discovered_date).format('YYYY-MM-DD HH:mm:ss'))
}

// Send all_update_action (matching mobile app)
fd.append('all_update_action', formValues.is_suitable ? '1' : '0')
```

### Body Part Data Always Sent

**Problem:** Body part data was only sent when organs array had items.

**Solution:** Always send `body_part_data` even if empty array (matching mobile app):
```javascript
// Always send body_part_data (even if empty array) - matching mobile app
const bodyPartData = []
organs.forEach(organ => {
  if (organ.parts?.length > 0) {
    organ.parts.forEach(part => {
      bodyPartData.push({
        body_part_id: part.id || part.body_part_id,
        value: part.value || part.description || ''
      })
    })
  }
})
fd.append('body_part_data', JSON.stringify(bodyPartData))
```

### Cause of Death Fields

**Problem:** Missing `cause_for_death` and `suspected_cause_of_death` fields were causing validation errors.

**Solution:** Added these fields to the form data, using numeric IDs from mortality data:

```javascript
// Suspected cause of death - send numeric ID
if (mortalityData?.manner_of_death_id) {
  fd.append('suspected_cause_of_death', mortalityData.manner_of_death_id)
  fd.append('cause_for_death', mortalityData.manner_of_death_id)
} else if (formValues.manner_of_death) {
  const suspectedId = formValues.manner_of_death.value || formValues.manner_of_death.id
  fd.append('suspected_cause_of_death', suspectedId)
  fd.append('cause_for_death', suspectedId)
}
```

### Updated Payload Format (Web App - Matching Mobile)

```javascript
{
  mortality_id: number,
  status: "draft" | "completed" | "unsuitable",
  necropsy_id: number,
  animal_id: number,
  is_unsuitable: "0" | "1",
  all_update_action: "0" | "1",      // ✅ Added - "1" if suitable, "0" if unsuitable
  reason_for_unsuitable: string,
  necropsy_conducted_by: JSON.stringify([user_id, ...]),
  discovered_date: "YYYY-MM-DD HH:mm:ss",  // ✅ Added - from mortality data
  caracass_submission_date: "YYYY-MM-DD",
  caracass_submission_time: "HH:mm:ss",
  death_date: "YYYY-MM-DD",
  death_time: "HH:mm:ss",
  place_of_death: string,
  carcass_weight: number,            // ✅ Always sent (0 if empty)
  carcass_weight_uom: number,        // ✅ Always sent (0 if no valid ID)
  approximate_weight: "0" | "1",
  sex: string,
  age: number,
  age_unit: string,
  approximate_dob: "0" | "1",
  dob: "YYYY-MM-DD",
  history_of_illness: string,
  necropsy_date: "YYYY-MM-DD",
  necropsy_time: "HH:mm:ss",
  general_description: string,
  body_part_data: JSON.stringify([   // ✅ Always sent (even if empty array)
    { body_part_id: number, value: string }
  ]),
  suspected_cause_of_death: number,  // ✅ Added - numeric ID
  cause_for_death: number,           // ✅ Added - numeric ID
  opinion: string,
  confirmed_cause_of_death: number,
  disposal_method: number,
  qr_number: string,
  special_feature: "Ok",             // ✅ Always sent
  biological_test: string,           // ✅ Always sent (empty string if no value)
  additional_notes: string,          // ✅ Always sent (empty string if no value)
  necropsy_attachment[]: File[]
}
```

---

## Necropsy Summary Content Updates

**File:** `src/views/pages/necropsy/NecropsySummaryContent.js`

### Cause of Death Section Layout

The Cause of Death section has been redesigned with labels on the left and values on the right in a single-column layout.

**Before (2-column grid):**
```
┌─────────────────────────────────────────────────────────────────┐
│ Suspected Cause of Dea...  Natural   │  Confirmed Cause...  Natural │
│ Opinion                    Lorem...   │  Disposal Method     burial  │
└─────────────────────────────────────────────────────────────────┘
```

**After (single-column, label-value pairs):**
```
┌─────────────────────────────────────────────────────────────────┐
│ Suspected Cause of Death          Natural                        │
│ Confirmed Cause of Death          Natural                        │
│ Disposal Method                   burial                         │
│ Opinion                           Lorem Ipsum is simply...       │
└─────────────────────────────────────────────────────────────────┘
```

**Field Order:**
1. Suspected Cause of Death
2. Confirmed Cause of Death
3. Disposal Method
4. Opinion

**Implementation:**
```javascript
<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pl: { xs: 0, sm: 4 } }}>
  {[
    { label: 'Suspected Cause of Death', value: necropsyData.suspected_cause_of_death },
    { label: 'Confirmed Cause of Death', value: necropsyData.confirmed_cause_of_death },
    { label: 'Disposal Method', value: necropsyData.disposition || necropsyData.disposal_method },
    { label: 'Opinion', value: necropsyData.opinion }
  ].map((item, index) => (
    <Box key={index} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: { xs: 2, sm: 4 } }}>
      <Typography sx={{ width: '200px', minWidth: '200px', color: labelColor, fontWeight: 400, fontSize: '14px' }}>
        {item.label}
      </Typography>
      <Typography sx={{ flex: 1, color: valueColor, fontWeight: 500, fontSize: '14px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {item.value || 'N/A'}
      </Typography>
    </Box>
  ))}
</Box>
```

### Separated Date and Time Fields

Date and time fields are now displayed separately in the Carcass Details section, using Utility functions for formatting.

**New Helper Functions:**
```javascript
const formatDate = (date) => {
  if (!date) return 'N/A'
  return Utility.formatDisplayDate(date)
}

const formatTime = (time) => {
  if (!time) return 'N/A'
  // If time is already in HH:mm:ss format, parse it
  if (typeof time === 'string' && time.includes(':')) {
    const today = new Date()
    const [hours, minutes] = time.split(':')
    today.setHours(parseInt(hours), parseInt(minutes), 0)
    return Utility.extractHoursAndMinutes(today)
  }
  return Utility.extractHoursAndMinutes(time)
}
```

**Updated Carcass Details Fields:**
| Before | After |
|--------|-------|
| Submission Date & Time | Submission Date |
| Date & Time of Death | Submission Time |
| - | Date of Death |
| - | Time of Death |

**Visual Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Submission Date        08 Feb 2026   │  Submission Time    08:12 PM │
│ Date of Death          08 Feb 2026   │  Time of Death      06:33 PM │
│ Place of Death         Test Site 1   │  Carcass Weight     12 gram  │
│ Confirmed Sex          Male          │  Age                4 day    │
└─────────────────────────────────────────────────────────────────┘
```

### Necropsy Date and Time Layout

Necropsy Date and Time are now displayed side-by-side with a divider between them.

**Visual Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Necropsy Date    08 Feb 2026   │   Necropsy Time    08:12 PM    │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation:**
```javascript
<Grid container spacing={0} alignItems='stretch'>
  <Grid item size={{ xs: 12, md: 6 }}>
    <Box sx={{ borderRight: { md: `1px solid ${borderColor}` }, ... }}>
      <Typography>Necropsy Date</Typography>
      <Typography>{formatDate(necropsyData.necropsy_date)}</Typography>
    </Box>
  </Grid>
  <Grid item size={{ xs: 12, md: 6 }}>
    <Box sx={{ ... }}>
      <Typography>Necropsy Time</Typography>
      <Typography>{formatTime(necropsyData.necropsy_time)}</Typography>
    </Box>
  </Grid>
</Grid>
```

---

## Necropsy Timeline Drawer Updates

**File:** `src/components/necropsy/NecropsyTimelineDrawer.js`

### Changed from Modal to Drawer

The timeline component has been updated from a bottom-right modal to a full-height right side drawer.

**Before (Bottom-right Modal):**
```javascript
<Modal
  open={open}
  onClose={onClose}
  sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}
>
  <Paper sx={{ width: 560, maxHeight: '80vh', position: 'absolute', bottom: 0, right: 0, ... }}>
```

**After (Right Side Drawer):**
```javascript
<Drawer
  anchor='right'
  open={open}
  onClose={onClose}
  PaperProps={{
    sx: { width: { xs: '100%', sm: 480 }, height: '100%', backgroundColor: theme.palette.background.paper }
  }}
>
  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
```

### Updated Timeline Design

The timeline design now matches the IncomingNecropsyDrawer timeline:

**Key Changes:**
| Element | Before | After |
|---------|--------|-------|
| Icon border | `2px solid` | `1px solid` |
| Icon size | `1rem` | `1.5rem` |
| Connector width | `2px` | `1.5px` |
| Connector minHeight | `8px` | `1rem` |
| TimelineContent | `py: 0, pb: 3` | `py: 1, display: 'flex', alignItems: 'center'` |
| Time alignment | `flex-end` | `start` |

**Styled Components:**
```javascript
const StyledTimeline = styled(Timeline)(() => ({
  [`& .${timelineOppositeContentClasses.root}`]: {
    flex: 0,
    minWidth: '5rem',
    padding: 0
  },
  margin: 0,
  padding: '0 1rem',
  '& .MuiTimelineItem-root:before': {
    display: 'none'
  }
}))

const StyledOppositeContent = styled(TimelineOppositeContent)(() => ({
  display: 'flex',
  justifyContent: 'start',
  alignItems: 'center'
}))
```

**Timeline Item Structure:**
```javascript
<TimelineItem sx={{ minHeight: '4rem' }}>
  <StyledOppositeContent>
    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
      {time}
    </Typography>
  </StyledOppositeContent>

  <TimelineSeparator>
    <TimelineConnector sx={{ minHeight: '1rem', width: '1.5px' }} />
    <Box sx={{
      width: '2rem',
      height: '2rem',
      borderRadius: '50%',
      border: '1px solid ...'
    }}>
      <CheckCircleIcon sx={{ fontSize: '1.5rem' }} />
    </Box>
    <TimelineConnector sx={{ minHeight: '1rem', width: '1.5px' }} />
  </TimelineSeparator>

  <TimelineContent sx={{ py: 1, display: 'flex', alignItems: 'center' }}>
    <Box sx={{ backgroundColor: ..., borderRadius: 1, px: 3, py: 2, ml: 1, flex: 1 }}>
      <Typography>{comment}</Typography>
      {/* User info inside the box */}
    </Box>
  </TimelineContent>
</TimelineItem>
```

**Visual Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ History                                                      ✕  │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📅 09 Feb 2026                                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ 11:44 AM    ⊙    ┌─────────────────────────────────────────┐   │
│             │    │ Security Checkout Cleared At LSET       │   │
│             │    └─────────────────────────────────────────┘   │
│             │                                                   │
│ 11:44 AM    ⊙    ┌─────────────────────────────────────────┐   │
│             │    │ Ride Started for Transfer               │   │
│             │    └─────────────────────────────────────────┘   │
│             │                                                   │
│ 11:44 AM    ⊙    ┌─────────────────────────────────────────┐   │
│                  │ Carcass loaded for transfer             │   │
│                  │ 1/1                                      │   │
│                  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Form Prefill Fixes

**File:** `src/views/pages/necropsy/NecropsyReportForm.js`

### Confirmed Cause of Death and Disposal Method Prefilling

Fixed issue where `confirmed_cause_of_death` and `disposal_method` fields were not prefilling when editing a draft.

**Root Cause:**
- Mobile app matches `confirmed_cause_of_death` by the option's `key` property (which is set to `item.name`)
- Mobile app uses `disposition` and `disposition_id` fields for disposal method, not `disposal_method`

**Mobile App Reference (AddNecropcy.js):**
```javascript
// Manner of death options mapping
const deathReasons = res.data?.map((item) => ({
  id: item?.id,
  key: item?.name,  // KEY IS SET TO item.name
  name: getTranslatedText({ key: item.string_id, value: item.name }),
}))

// Matching logic
if (confirmed_cause_of_death) {
  const causeOfDeath = mannerOfDeath.find(
    (value) => value?.key === confirmed_cause_of_death  // Matches by key (which is name)
  )
}

// Disposal uses disposition and disposition_id from API
if (disposition && disposition_id) {
  setDisposalName(disposition)
  setDisposalId(disposition_id)
}
```

**Web App Fix:**

1. **Updated Options Mapping:**
```javascript
// Manner of death options - key is set to item.name (matching mobile)
if (mannerRes?.data) {
  const options = (Array.isArray(mannerRes.data) ? mannerRes.data : mannerRes.data?.result || []).map(item => ({
    label: item.name || item.label,
    value: item.id || item.string_id || item.value,
    key: item.name || item.label  // Mobile app sets key to item.name
  }))
  setMannerOfDeathOptions(options)
  mannerOfDeathOptionsRef.current = options
}

// Disposal options - same pattern
if (disposalRes?.data) {
  const options = (Array.isArray(disposalRes.data) ? disposalRes.data : disposalRes.data?.result || []).map(item => ({
    label: item.name || item.label,
    value: item.id || item.string_id || item.value,
    key: item.name || item.label
  }))
  setDisposalOptions(options)
  disposalOptionsRef.current = options
}
```

2. **Updated Matching Logic for Confirmed Cause of Death:**
```javascript
if (data.confirmed_cause_of_death || data.confirmed_cause_of_death_id) {
  let matchingOption = null

  // Try to find by key first (mobile app: value?.key === confirmed_cause_of_death)
  if (data.confirmed_cause_of_death) {
    matchingOption = availableMannerOptions.find(opt =>
      opt.key === data.confirmed_cause_of_death ||
      String(opt.key)?.toLowerCase() === String(data.confirmed_cause_of_death)?.toLowerCase()
    )
  }
  // Try to find by ID if key match failed
  if (!matchingOption && data.confirmed_cause_of_death_id) {
    matchingOption = availableMannerOptions.find(opt =>
      String(opt.value) === String(data.confirmed_cause_of_death_id)
    )
  }
  // If not found by key or ID, try to find by label
  if (!matchingOption && data.confirmed_cause_of_death) {
    matchingOption = availableMannerOptions.find(opt =>
      opt.label?.toLowerCase() === data.confirmed_cause_of_death?.toLowerCase()
    )
  }

  if (matchingOption) {
    setValue('confirmed_cause_of_death', matchingOption)
  } else if (data.confirmed_cause_of_death) {
    // Fallback
    setValue('confirmed_cause_of_death', {
      label: data.confirmed_cause_of_death,
      value: data.confirmed_cause_of_death_id || data.confirmed_cause_of_death,
      key: data.confirmed_cause_of_death
    })
  }
}
```

3. **Updated Matching Logic for Disposal Method:**
```javascript
// Mobile app uses: disposition and disposition_id fields
const disposalName = data.disposition || data.disposal_method || data.carcass_disposition
const disposalId = data.disposition_id || data.disposal_method_id || data.carcass_disposition_id

if (disposalName || disposalId) {
  let matchingOption = null

  // Try to find by ID first
  if (disposalId) {
    matchingOption = availableDisposalOptions.find(opt => String(opt.value) === String(disposalId))
  }
  // Try to find by key (key = item.name)
  if (!matchingOption && disposalName) {
    matchingOption = availableDisposalOptions.find(opt =>
      opt.key === disposalName ||
      String(opt.key)?.toLowerCase() === String(disposalName)?.toLowerCase()
    )
  }
  // If not found by ID or key, try to find by label
  if (!matchingOption && disposalName) {
    matchingOption = availableDisposalOptions.find(opt =>
      opt.label?.toLowerCase() === disposalName?.toLowerCase()
    )
  }

  if (matchingOption) {
    setValue('disposal_method', matchingOption)
  } else if (disposalName) {
    setValue('disposal_method', {
      label: disposalName,
      value: disposalId || disposalName,
      key: disposalName
    })
  }
}
```

---

## Download PDF Fix

**File:** `src/utility/index.js`

### Issue
The `downloadPDF` function expected `response.data.download_url` but the API was returning the URL directly in `response.data`.

**API Response Format:**
```json
{
  "success": true,
  "data": "https://api.dev.antzsystems.com/api/image/download/uploaded/file?path=...",
  "message": "PDF generated successfully"
}
```

### Solution
Updated the function to handle both response formats:

**Before:**
```javascript
export const downloadPDF = async ({ apiCall, params, fileName, headers = {} }) => {
  try {
    const response = await apiCall(params)

    if (response?.success && response?.data?.download_url) {
      // Fetch the file as a blob
      const fileResponse = await fetch(response.data.download_url, { ... })
      // ...
    }
  } catch (error) {
    console.error('Error while downloading the file:', error)
  }
}
```

**After:**
```javascript
export const downloadPDF = async ({ apiCall, params, fileName, headers = {} }) => {
  try {
    const response = await apiCall(params)

    // Handle both response formats:
    // 1. response.data.download_url (nested URL)
    // 2. response.data as direct URL string
    const downloadUrl = response?.data?.download_url || (typeof response?.data === 'string' ? response.data : null)

    if (response?.success && downloadUrl) {
      // Fetch the file as a blob
      const fileResponse = await fetch(downloadUrl, { ... })
      // ...
    }
  } catch (error) {
    console.error('Error while downloading the file:', error)
  }
}
```

---

## Files Modified (This Session)

| File | Changes |
|------|---------|
| `src/views/pages/necropsy/NecropsySummaryContent.js` | Cause of Death layout, separated date/time fields, Necropsy Date/Time side-by-side |
| `src/components/necropsy/NecropsyTimelineDrawer.js` | Changed to right side Drawer, updated timeline design |
| `src/views/pages/necropsy/NecropsyReportForm.js` | Fixed confirmed_cause_of_death and disposal_method prefilling |
| `src/utility/index.js` | Fixed downloadPDF to handle URL in response.data directly |

---

## Species View (By Species Switch)

**Files:**
- `src/pages/necropsy/[id]/index.js` - Updated to handle species view
- `src/views/pages/necropsy/NecropsySpeciesListContent.js` - New component

### Overview

When the "By Species" switch is selected on the main necropsy listing page, clicking on a species row navigates to a species-specific view that shows all animals of that species with pending/draft/completed necropsies.

### Navigation Flow

**Main Necropsy Listing:**
```
/necropsy?status=PENDING
```

**Switch to "By Species" tab:**
- Shows species list with count of necropsies per species
- Clicking a species row navigates to:
```
/necropsy/${tsn}?view=species&status=${status}&taxonomy_id=${tsn}&species_name=${speciesName}
```

**Species View Page:**
- Shows all animals of the selected species
- Clicking an animal row navigates to:
```
/necropsy/${mortality_id}?status=${status}
```

### URL Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `view` | Set to `species` to enable species view | `species` |
| `taxonomy_id` | TSN (Taxonomic Serial Number) of the species | `123456` |
| `species_name` | Display name of the species (URL encoded) | `African%20Elephant` |
| `status` | Current filter status | `PENDING`, `DRAFT`, `COMPLETED`, `INCOMING` |

### Page Component Updates

**`src/pages/necropsy/[id]/index.js`:**

```javascript
const NecropsyDetails = () => {
  const router = useRouter()
  const { id, status = 'PENDING', view, taxonomy_id, species_name } = router.query

  // Species view - show list of animals for the species
  const isSpeciesView = view === 'species'

  return (
    <NecropsyProvider>
      <Box sx={{ p: 4 }}>
        {/* Breadcrumbs */}
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs>
            <MuiLink component={NextLink} href={`/necropsy?status=${status}`} underline='hover' color='inherit'>
              Necropsy
            </MuiLink>
            {isSpeciesView ? (
              <Typography color='text.primary' sx={{ fontWeight: 500 }}>
                {species_name ? decodeURIComponent(species_name) : 'Species'}
              </Typography>
            ) : (
              <Typography color='text.primary' sx={{ fontWeight: 500 }}>
                {status === 'COMPLETED' || status === 'UNSUITABLE' ? 'Summary' : 'Details'}
              </Typography>
            )}
          </Breadcrumbs>
        </Box>

        {/* Main Content */}
        {isSpeciesView ? (
          <NecropsySpeciesListContent
            taxonomyId={taxonomy_id || id}
            speciesName={species_name ? decodeURIComponent(species_name) : ''}
            status={status?.toUpperCase()}
          />
        ) : (
          <NecropsyDetailContent mortalityId={id} status={status?.toUpperCase()} />
        )}
      </Box>
    </NecropsyProvider>
  )
}
```

### NecropsySpeciesListContent Component

**Location:** `src/views/pages/necropsy/NecropsySpeciesListContent.js`

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `taxonomyId` | `string` | TSN of the species to filter by |
| `speciesName` | `string` | Display name of the species |
| `status` | `string` | Current filter status (PENDING, DRAFT, COMPLETED, INCOMING) |

**Features:**
- Species header card with name and animal count
- Status badge showing current filter
- Search functionality for animals
- Filter drawer with same options as main listing
- Animal table with same columns as main listing
- Pagination support
- Incoming necropsy drawer for INCOMING status

**API Call:**
Uses `getAnimalWiseNecropsyList` with `taxonomy_id` parameter:
```javascript
const res = await getAnimalWiseNecropsyList({
  page_no: filters.page,
  limit: filters.limit,
  q: filters.q,
  status: status,
  necropsy_center_id: selectedNecropsy?.id,
  taxonomy_id: taxonomyId,  // Filter by species
  use_case: 'necropsy_module',
  // ... other filters
})
```

**Visual Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Necropsy > African Elephant (Breadcrumbs)                       │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🦣 African Elephant                            [PENDING]    │ │
│ │    12 Animals                                               │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                      [🔍 Search...] [🔽 Filter]              │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ SL | Animal Name & ID | Mortality Date | Priority | Action  │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ 1  | Dumbo #A001      | 08 Feb 2026    | High     | John    │ │
│ │ 2  | Ellie #A002      | 07 Feb 2026    | Low      | Jane    │ │
│ │ 3  | Max #A003        | 06 Feb 2026    | High     | Bob     │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Row Click Behavior:**
- `INCOMING` status: Opens `IncomingNecropsyDrawer` with transfer details
- Other statuses: Navigates to `/necropsy/${mortality_id}?status=${status}`

### Mobile App Comparison

The mobile app supports both "SpeciesDetails" and "AnimalsDetails" navigation sources:

```javascript
// Mobile app navigation
navigation.pop(
  from === "AnimalsDetails" || from === "SpeciesDetails" ? 1 : 2
)
```

The web implementation provides equivalent functionality through URL parameters and conditional rendering.

---

## Related Documentation

- [Carcass Transfer Listing](./carcass-transfer-listing.md)
- [Medical History Tabs](./medical-history-tabs.md)
