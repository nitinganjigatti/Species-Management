# Medical History & Assessments - Necropsy Detail Page

## Overview

Replaced the static medical stats number grid on the Necropsy Pending/Draft detail page with a rich, interactive tabbed interface that displays actual medical records inline. This gives veterinarians a complete view of the animal's medical history directly on the necropsy page without navigating away.

The feature is **read-only** — no editing, adding, or deleting records from this view.

---

## What Changed

### Initial Implementation (v1)
- Replaced simple counts grid with full tabbed interface
- Each tab shows paginated, detailed record cards
- Sub-tabs for filtering by status (Active/Resolved, Pending/Completed, etc.)
- Expandable sections for lab test details
- 3-column responsive grid layout matching ClinicalAssessmentCard design

### UI Redesign (v2 — Current)
- **Separated into own Cards**: Medical History and Assessments each get their own `<Card>` wrapper instead of being inside the Mortality Details Card
- **MedicalRecordsList**: Redesigned from 3-column grid to single-column mobile-inspired card layout with record ID chip, type+date row, count icons, diagnosis/complaint chips. Field mappings corrected to match actual API response (`record.diagnosis[]`, `record.complaint[]`, `record.prescription[]` arrays). No arrow icon.
- **PrescriptionList**: Redesigned with prescriptions grouped by medical record code, each prescription in a teal-background card (`displaybgPrimary`) with frequency, dosage chip, duration, and date range. No border. API returns pre-grouped data.
- **AssessmentTabs**: Completely rewritten — uses embedded `assessment_values` from types API (single API call, no separate data fetch). New date+value card layout matching mobile design. Shows "No Assessments Recorded" when no types exist instead of returning null.

---

## Files Created

### API Layer

**`src/lib/api/necropsy/medicalHistory.js`**

5 API functions for fetching medical history data:

| Function | Endpoint | Purpose |
|----------|----------|---------|
| `getMedicalBasicDataList(animalId, params)` | `GET medical/v2/{animalId}/basic-data-list` | Fetch basic medical records list |
| `getMedicalCommonData(animalId, params)` | `GET medical/v2/{animalId}/get-medical-common-data-v2` | Fetch diagnosis or prescription data (controlled by `medical_type` param) |
| `getLabRequestsByAnimal(params)` | `GET medical/get-lab-test-request-status-wise-new` | Fetch lab test requests grouped by request |
| `getAssessmentTypes(animalId)` | `GET v1/assessment/animal/types/{animalId}` | Fetch available assessment type tabs (includes embedded `assessment_values` per type) |
| `getAssessmentData(animalId, params)` | `GET v1/assessment/animal/defaultValue/{animalId}` | Fetch assessment parameter values (**no longer used** — AssessmentTabs uses embedded data from types API) |

All functions use `axiosGet` from `src/lib/api/utility`.

### API Constants

**`src/constants/ApiConstant.js`** — Added 4 new constants:

```js
GET_MEDICAL_BASIC_DATA_LIST = 'medical/v2/'
GET_LAB_REQUESTS_BY_ANIMAL = 'medical/get-lab-test-request-status-wise-new'
GET_ASSESSMENT_ANIMAL_TYPES = 'v1/assessment/animal/types'
GET_ASSESSMENT_ANIMAL_DATA = 'v1/assessment/animal/defaultValue'
```

Note: `getMedicalCommonData` reuses the existing `GET_CLINICAL_ASSESSMENTS` constant (`medical/v2/`) since it hits the same base path.

---

### UI Components

All components live in `src/components/necropsy/`.

#### 1. `MedicalHistoryTabs.js` — Tab Container

The parent container that manages tab switching between the 4 medical history views.

- **Props:** `animalId`
- **Tabs:** Medical Records, Diagnosis, Prescription, Lab Requests
- **Behavior:** Lazy-loads tab content (only fetches data when a tab is selected)
- **Design:** Horizontal scrollable pill-style tabs matching `ClinicalAssessment.js` pattern
  - Active: `theme.palette.secondary.dark` background
  - Inactive: `theme.palette.customColors.mdAntzNeutral` background

#### 2. `MedicalRecordsList.js` — Medical Records Tab (Redesigned)

Displays basic medical visit records in a mobile-inspired card layout matching the mobile app's `MedicalRecordListCard` component.

- **Props:** `animalId`
- **API:** `getMedicalBasicDataList` (`GET medical/v2/{animalId}/basic-data-list`)
- **No sub-tabs**
- **Card layout (single-column stacked rows):**

  ```
  ┌──────────────────────────────────────────────────┐
  │  [MedicalIdChip] MED11-20614                     │  ← Row 1: Record ID
  │  Standard  •  05 Feb 2026                        │  ← Row 2: Type (green) + date
  │  🩺 2   🐾 2   📋 2                              │  ← Row 3: Dx/Cx/Rx count icons
  │  Diagnosis                                       │  ← Row 4a (conditional)
  │  [Aaabbb] [Abomasal Displacement]                │  ← Diagnosis chips
  └──────────────────────────────────────────────────┘
  ```

- **Row 1:** `MedicalIdChip` with `leftImage` prop (no arrow icon)
- **Row 2:** Case type in `success.main` green + bullet separator + formatted date
- **Row 3:** Count icons using MUI icons:
  - `MedicalServices` icon + count for Dx (diagnosis)
  - `Pets` icon + count for Cx (complaints)
  - `Description` icon + count for Rx (prescriptions)
  - Counts are derived from **array lengths** first (`record.diagnosis.length`), falling back to count fields (`record.diagnosis_count`)
  - Only renders if any count > 0
- **Row 4a:** Diagnosis chips (shown when `record.diagnosis` array has items)
  - Each chip shows `item.name || item.diagnosis`
  - Closed diagnoses: `line-through` text decoration + muted background
  - Tentative diagnoses (clinical_assessment === 'tentative'): warning-colored background
  - Active diagnoses: primary-tinted background
- **Row 4b:** Complaint chips (shown only when `record.diagnosis` is empty AND `record.complaint` has items)
  - Each chip shows `item.complaint || item.name`
  - Uses outlined variant with border
  - Closed complaints: `line-through` text decoration
- **Visual states:**
  - All cards: `transparent` background, `1px solid theme.palette.warning.main` border
  - No hover effect, no pointer cursor (read-only view)
- **Empty state:** "No Medical Records Found"
- **Shimmer:** Matches single-column card shape
- **Data field mapping (matching mobile app `MedicalRecordListCard.js`):**

  | Display | Field | Fallback |
  |---------|-------|----------|
  | Record ID | `record.medical_record_code` | `MR-{record.id}` |
  | Case type | `record.case_type` | `record.type` → `'N/A'` |
  | Date | `record.created_at` | — |
  | Dx count | `record.diagnosis.length` | `record.diagnosis_count` → `0` |
  | Cx count | `record.complaint.length` | `record.complaint_count` → `0` |
  | Rx count | `record.prescription.length` | `record.prescription_count` → `0` |
  | Diagnosis chips | `record.diagnosis[]` | `[]` — each item has `.name`, `.status`, `.additional_info.clinical_assessment` |
  | Complaint chips | `record.complaint[]` | `[]` — each item has `.complaint`, `.additional_info.status`, `.additional_info.severity` |

#### 3. `DiagnosisList.js` — Diagnosis Tab (Unchanged)

Displays clinical diagnosis records with status filtering.

- **Props:** `animalId`
- **API:** `getMedicalCommonData` with `medical_type: 'diagnosis'`
- **Sub-tabs:** Active (count), Resolved (count), All (count)
- **Reuses existing components:**
  - `ClinicalAssessmentCard` from `src/views/pages/hospital/inpatient/ClinicalAssessmentCard.js`
  - `ClinicalAssessmentShimmer` for loading state
- Supports differential diagnosis detection via `clinical_assessment === 'tentative'`

#### 4. `PrescriptionList.js` — Prescription Tab (Redesigned)

Displays prescription records grouped by medical record code.

- **Props:** `animalId`
- **API:** `getMedicalCommonData` with `medical_type: 'prescription'`
- **Sub-tabs:** Active (count), Stopped (count), All (count)
- **Grouping:** The API returns data **pre-grouped** by medical record. Each item in `result[]` is a section with `medical_record_id` and `data[]` (array of prescriptions). No client-side grouping needed.

- **Section layout:**

  ```
  MED11-20614                              ← Bold section header
  ┌────────────────────────────────────┐
  │  A to Z tablet                     │  ← Medicine name (bold, strikethrough if stopped)
  │  ↝ Every Day                       │  ← Frequency with Timeline icon
  │  [12:32 PM - 321 pt]              │  ← Dosage chip (time + dosage bold)
  │  📅 For 1 Day                      │  ← Duration with CalendarToday icon
  │  🟢 05 Feb 2026  🟥 05 Feb 2026    │  ← Start (green dot) / End (red square)
  └────────────────────────────────────┘
  ```

- **Card styling:**
  - No border or left accent
  - Border radius: `12px`
  - Background: `theme.palette.customColors.displaybgPrimary` (`#E8F4F2`) for all cards
- **Empty state:** "No Prescriptions Recorded"
- **Dosage chip format:** Supports two API formats:
  - **New format** (`schedule_doses` array): Each dose becomes a chip with `{quantity} {unit_name}`
  - **Old format** (`is_new_data == 0`): Single chip with `{time from created_at} - {dosage}`
  - Time portion: regular weight (`fontWeight: 400`)
  - Dosage portion: **bold weight** (`fontWeight: 700`)
  - Separator: ` - ` between time and dosage
- **Duration calculation:**
  1. Uses `item.duration` if available
  2. Uses `item.duration_type` + `item.duration_qty` if available
  3. Otherwise calculates from `start_date` → `end_date` difference in days
  4. Returns `null` if none available (row hidden)
- **Date range indicators:**
  - Start date: `FiberManualRecord` circle (green, 10px) + formatted date
  - End date: Filled square `Box` (red, 10px, 2px border-radius) + formatted date
- **Stopped prescriptions:** Medicine name gets `text-decoration: line-through`
- **Shimmer:** Shows 2 groups of 2 cards each
- **Data field mapping:**

  | Display | Field (section level) | Field (item level) | Fallback |
  |---------|----------------------|--------------------|----------|
  | Group header | `section.medical_record_id` | — | `'N/A'` |
  | Medicine name | — | `item.name` | `item.medicine_name` → `'N/A'` |
  | Status | — | `item.status` | `'active'` or `'close'` |
  | Frequency | — | `item.frequency` | — |
  | Dosage (new) | — | `item.schedule_doses[].quantity` + `unit_name` | — |
  | Dosage (old) | — | `item.dosage` (combined string, e.g., "321 pt") | — |
  | Duration | — | `item.duration` or `item.duration_type` + `duration_qty` | Calculated from dates |
  | Start date | — | `item.start_date` | — |
  | End date | — | `item.end_date` | — |

#### 5. `LabRequestsList.js` — Lab Requests Tab (Unchanged)

Displays lab test requests grouped by request, with expandable test details.

- **Props:** `animalId`
- **API:** `getLabRequestsByAnimal`
- **Sub-tabs:** Pending, Completed, All (no counts — API doesn't return them)
- **Card layout (3-column grid header):**
  - Left: `MedicalIdChip` + status dot with label (Completed=green, Pending=orange) + test count
  - Middle: Date and time
  - Right: "View/Hide Tests" toggle with expand icon
- **Expandable section:** Uses MUI `Collapse` to show individual test items below the grid
  - Each test shows: status icon (CheckCircle / AccessTime / FiberManualRecord) + test name + date + status text
  - Completed records get gray background

#### 6. `AssessmentTabs.js` — Assessments Section (Rewritten)

Separate section below medical history with dynamically loaded assessment type tabs.

- **Props:** `animalId`
- **API:** `getAssessmentTypes` (`GET v1/assessment/animal/types/{animalId}`) — **single API call**. Assessment values are embedded in each type object as `assessment_values[]`. No separate data fetch needed (`getAssessmentData` is no longer used).
- **Behavior:** Fetches available assessment types. If none exist, shows "Assessments" header + "No Assessments Recorded" message. Tabs are generated dynamically from API response.
- **Data source:** `activeType.assessment_values` array — used directly from the selected tab's type object.
- **Card layout (date + value card):**

  ```
  ┌─────────────────────────────────────────────────────┐
  │  05 Feb 2026  │  ┌─────────────────────────────┐    │
  │  12:32 PM     │  │  45.2 kg              💬    │    │
  │               │  └─────────────────────────────┘    │
  └─────────────────────────────────────────────────────┘
  ```

  - Left side: Date (bold, `0.8125rem`, `fontWeight: 600`) stacked on top of time (`0.75rem`, `fontWeight: 400`), right-aligned in a fixed `minWidth: 90` column
  - Right side: Rounded card (`12px` radius) with `displaybgPrimary` background, containing:
    - Value (large, `1.25rem`–`1.5rem`, `fontWeight: 600`) + unit (`0.8125rem`, `fontWeight: 400`) baseline-aligned
    - Comments icon (`SmsOutlined`, 20px, `warning.main` color) with `Tooltip` showing full comment text — only visible when `record.comments` or `record.notes` exists
- **Value rendering:** Uses `getValueAndUnit()` helper returning `{value, unit}` separately:
  1. If `assessment_value` exists AND `asssessment_label` exists (list/scale type): returns `{value: asssessment_label, unit: ''}`
  2. If `assessment_value` exists (numeric type): returns `{value: assessment_value, unit: uom_abbr}`
  3. Falls back to `numeric_value`, `text_value`, generic `value`
  4. Default: `{value: 'N/A', unit: ''}`
- **Empty state:** "No Assessments Recorded" (centered text, same style as other tabs)
- **Shimmer:** Tab pills (3 rounded skeletons) — matches actual tab layout
- **Data field mapping (matching mobile `AssessmentInfo.js`):**

  | Display | Field | Fallback |
  |---------|-------|----------|
  | Tab name | `type.assessment_name` | `type.assessment_type_name` → `type.name` → `'Assessment'` |
  | Value | `record.assessment_value` | `record.numeric_value` → `record.text_value` → `record.value` → `'N/A'` |
  | Value label (list/scale) | `record.asssessment_label` | — (3 s's is intentional API typo) |
  | Unit | `record.uom_abbr` | `record.unit` → `''` |
  | Date/time | `record.recorded_date_time` | `record.created_at` |
  | Comments | `record.comments` | `record.notes` |

---

## Files Modified

### `src/views/pages/necropsy/NecropsyDetailContent.js`

**v1 Changes:**
1. Removed `medicalStats` state and the `getMedicalStats` API import/call
2. Removed the medical stats number grid
3. Added imports for `MedicalHistoryTabs` and `AssessmentTabs`
4. Added tabbed interface inside the Mortality Details Card after a Divider

**v2 Changes (UI Redesign):**
1. Moved `MedicalHistoryTabs` and `AssessmentTabs` **out** of the Mortality Details Card
2. Each now has its own `<Card>` / `<CardContent>` wrapper
3. Removed the `<Divider sx={{ my: 5 }} />` separator
4. History of Illness and Notes always render (show `'N/A'` in muted color when empty, not conditionally hidden)
5. Added comprehensive loading skeleton: shimmer for Animal Info Card, Mortality Details Card, Medical History Card, and Assessments Card

**Current structure (PENDING/DRAFT view):**

```jsx
{/* Mortality Details Card */}
<Card sx={{ mt: 3, mb: 3 }}>
  <CardContent sx={{ p: 6, '&:last-child': { pb: 6 } }}>
    {/* History of Illness — always rendered, shows 'N/A' if empty */}
    {/* Notes — always rendered, shows 'N/A' if empty */}
  </CardContent>
</Card>

{/* Medical History & Assessments — each in its own Card */}
{mortalityData?.animal_id && (
  <>
    <Card sx={{ mt: 3 }}>
      <CardContent sx={{ p: 6, '&:last-child': { pb: 6 } }}>
        <MedicalHistoryTabs animalId={mortalityData.animal_id} />
      </CardContent>
    </Card>
    <Card sx={{ mt: 3, mb: 3 }}>
      <CardContent sx={{ p: 6, '&:last-child': { pb: 6 } }}>
        <AssessmentTabs animalId={mortalityData.animal_id} />
      </CardContent>
    </Card>
  </>
)}
```

### `src/components/necropsy/AssessmentTabs.js`

**v2 Changes — Complete rewrite:**
1. Removed `Divider` import, `getAssessmentData` import, `CircularProgress` import
2. Added `Tooltip`, `alpha`, `SmsOutlined as CommentsIcon` imports
3. Removed states: `data`, `dataLoading`, `pageNo`, `hasMore`, `loadingMore`
4. Removed separate `fetchData()` function — data comes from `activeType.assessment_values` (embedded in types API response)
5. Single API call: only `getAssessmentTypes` is used. Each type object includes its `assessment_values[]` array.
6. Replaced 3-column grid layout with date+value card layout (date/time stacked on left, value card with comments tooltip on right)
7. Added `getValueAndUnit()` helper returning `{value, unit}` separately
8. When no types exist: shows "Assessments" header + "No Assessments Recorded" message (instead of `return null`)
9. When active tab has no assessment_values: shows "No Assessments Recorded" message
10. Fixed all field mappings to match mobile `AssessmentInfo.js`: `assessment_name` for tabs, `assessment_value` for values, `recorded_date_time` for dates, `comments` for notes, `asssessment_label` (3 s's) for list labels

### `src/components/necropsy/MedicalRecordsList.js`

**v2 Changes — Full rewrite:**
1. Removed imports: `UserAvatarDetails`, `VisitType`, `StatusChip`, `ChevronRight`
2. Added imports: `MedicalServices` (DxIcon), `Pets` (CxIcon), `Description` (RxIcon) from `@mui/icons-material`
3. Replaced 3-column grid card layout with single-column stacked row layout
4. Added: Record ID row, Type+Date row, Count icons row, Diagnosis chips row, Complaint chips row (fallback)
5. Removed: "Created by" user avatar section, "Last Updated" text, StatusChip, ChevronRight arrow
6. Updated shimmer to match new card shape
7. Fixed data field mapping to match actual API response: uses `record.diagnosis[]` array (not `clinical_assessments`), `record.complaint[]` array, and `record.prescription[]` array for counts and chip rendering
8. Counts derived from array lengths first (`record.diagnosis.length`), with `record.diagnosis_count` as fallback
9. Diagnosis chips show status-aware styling: closed (line-through + muted), tentative (warning color), active (primary tint)
10. Complaint chips shown only when diagnosis array is empty (matching mobile `MedicalRecordListCard.js` behavior)
11. Card styling: `warning.main` border (#FFC107), transparent background, no hover, no pointer cursor

### `src/components/necropsy/PrescriptionList.js`

**v2 Changes — Full rewrite:**
1. Removed imports: `UserAvatarDetails`, `MedicalIdChip`, `Stop` icon, `useMemo`
2. Added imports: `Chip`, `Timeline` (FrequencyIcon), `CalendarToday` (CalendarIcon)
3. Fixed API data structure handling: API returns grouped data (`result[].medical_record_id` + `result[].data[]`), not flat records. Each result item is a section containing an array of prescription items.
4. Added `buildDosageChips()` helper: handles both new format (`schedule_doses` array) and old format (`dosage` string + `created_at` time)
5. Added `getDurationText()` helper: uses `duration`, `duration_type`+`duration_qty`, or calculates from dates
6. Prescription fields accessed directly on items (`item.name`, `item.dosage`, `item.frequency`, `item.start_date`, etc.) — NOT nested under `additional_info`
7. Replaced 3-column grid cards with single-column cards using `displaybgPrimary` background, no border
8. Added: frequency row, dosage chip(s), duration row, date range with colored indicators
9. Removed: "Created by" / "Stopped by" user avatar section, "Last Updated" text, MedicalIdChip per card
10. Updated shimmer to match new grouped card shape

---

## Component Tree

```
NecropsyDetailContent.js
├── NecropsyAnimalInfoCard
├── Card (Draft status indicator, if DRAFT)
├── Card (Mortality Details)
│   ├── History of Illness
│   └── Notes
├── Card (Medical History)                      ← NEW: own Card
│   └── MedicalHistoryTabs
│       ├── [Tab: Medical Records] → MedicalRecordsList   ← REDESIGNED
│       ├── [Tab: Diagnosis]       → DiagnosisList        (unchanged)
│       ├── [Tab: Prescription]    → PrescriptionList     ← REDESIGNED
│       └── [Tab: Lab Requests]    → LabRequestsList      (unchanged)
├── Card (Assessments)                          ← NEW: own Card
│   └── AssessmentTabs
│       └── [Dynamic tabs from API] → Assessment cards
├── BottomActionBar
└── NecropsyTimelineDrawer
```

---

## Design System

### MedicalRecordsList — Card Design

```
Border:     1px solid theme.palette.warning.main
Radius:     12px
Padding:    theme.spacing(3)
Background: transparent
```

Key visual elements:
- `MedicalIdChip` with `leftImage` prop for record ID (no arrow icon)
- Type label in `success.main` green
- Count icons: `MedicalServices`/`Pets`/`Description` at 16px with neutralSecondary color
- Diagnosis chips with status-aware styling:
  - Active: `alpha(primary.main, 0.08)` background
  - Tentative: `alpha(warning.main, 0.12)` background, `warning.dark` text
  - Closed: `alpha(text.disabled, 0.1)` background, `text.disabled` color, line-through
- Complaint chips (fallback when no diagnoses): outlined variant with `OnPrimary` border color

### PrescriptionList — Card Design

```
Radius:     12px
Padding:    theme.spacing(3)
Background: theme.palette.customColors.displaybgPrimary
```

No border or left accent. All prescription cards use the same teal background (`#E8F4F2`).

Key visual elements:
- Section header: `1rem`, `fontWeight: 700`
- Medicine name: `1rem`, `fontWeight: 700`, line-through when stopped
- Frequency: `Timeline` icon (18px) + text at `0.875rem`
- Dosage chip: `0.8125rem`, 28px height, `6px` radius, `alpha(OnSurfaceVarient, 0.08)` bg
  - Time portion: `fontWeight: 400`
  - Dosage portion: `fontWeight: 700`
- Duration: `CalendarToday` icon (18px) + text at `0.875rem`
- Start date: `FiberManualRecord` (10px, green) + date text
- End date: Red filled square Box (10px, `2px` border-radius) + date text

### Tab Pill Styling (Unchanged)

```js
{
  px: '16px',
  py: '8px',
  borderRadius: '8px',
  backgroundColor: isActive
    ? theme.palette.secondary.dark
    : theme.palette.customColors.mdAntzNeutral,
  transition: 'background-color 0.2s ease'
}
```

Text color: `primary.contrastText` (active) / `customColors.neutralPrimary` (inactive)

### Shared Utilities

| Utility | Source | Usage |
|---------|--------|-------|
| `MedicalIdChip` | `src/views/pages/hospital/utility/hospitalSnippets` | Medical record code chip |
| `StatusChip` | Same file | Open/Closed status indicator (used in DiagnosisList) |
| `UserAvatarDetails` | `src/views/utility/UserAvatarDetails` | User avatar with name and date (used in DiagnosisList, LabRequestsList) |
| `ClinicalAssessmentCard` | `src/views/pages/hospital/inpatient/ClinicalAssessmentCard.js` | Diagnosis record card (reused in DiagnosisList) |
| `ClinicalAssessmentShimmer` | `src/views/pages/hospital/inpatient/shimmer/ClinicalAssessmentShimmer.js` | Diagnosis loading state |
| `Utility.convertUtcToLocalReadableDate()` | `src/utility` | Date formatting (e.g., "05 Feb 2026") |
| `Utility.convertUTCToLocaltime()` | `src/utility` | Time formatting (e.g., "12:32 PM") |

---

## Pagination

All list components implement the same pagination pattern:

1. Fetch 10 records per page
2. If response returns exactly 10 (or >= 10), set `hasMore = true`
3. "Load More" text button at the bottom of the list
4. On click: fetch next page with `append = true` to add to existing data
5. Show `CircularProgress` spinner while loading more
6. Show "No more records to load" when all data is loaded and list exceeds 10 items

**Note:** In PrescriptionList, the API returns data pre-grouped by medical record. Each page returns grouped sections (`[{ medical_record_id, data: [...] }]`). Load More appends new sections to the existing `data` array.

---

## Empty & Loading States

- **Loading (main page):** NecropsyDetailContent shows full-page shimmer with 4 Card skeletons:
  - Animal Info Card: image placeholder + 6 detail field placeholders in a 2-column grid
  - Mortality Details Card: History of Illness + Notes placeholders
  - Medical History Card: title + 4 tab pill placeholders + 2 content card placeholders
  - Assessments Card: title + 3 tab pill placeholders + 3 date+value row placeholders
- **Loading (per-tab):** Each tab component has its own skeleton shimmer:
  - MedicalRecordsList: Single-column card with ID, type, counts rows
  - PrescriptionList: 2 groups of 2 cards each
  - LabRequestsList: 3-column grid cards
  - AssessmentTabs: Tab pills (3 rounded skeletons)
- **Empty state messages:**
  - MedicalRecordsList: "No Medical Records Found"
  - DiagnosisList: "No Diagnosis Recorded"
  - PrescriptionList: "No Prescriptions Recorded"
  - LabRequestsList: "No Lab Requests Recorded"
  - AssessmentTabs (no types or no values): "No Assessments Recorded"
- **N/A fallbacks:** History of Illness, Notes, case type, medicine name, assessment value, and group headers all show `'N/A'` when data is missing

---

## Medical Records Data Flow

```
API Response (basic-data-list)
    │
    ▼
data state (flat array of records)
    │
    ▼
data.map(record) → Individual medical record card
    │
    ├── record.diagnosis[] → Diagnosis chips (Row 4a)
    └── record.complaint[] → Complaint chips (Row 4b, only when no diagnoses)
```

**API response structure** (`basic-data-list`):

```js
{
  success: true,
  data: {
    result: [
      {
        id: number,
        medical_record_code: string,        // e.g., "MED11-20614"
        case_type: string,                   // e.g., "Standard", "Vaccination"
        created_at: string,                  // ISO timestamp
        status: string,                      // "open" | "closed"
        default_icon: string,               // Icon URI
        color_code: string,                 // Hex color for icon bg
        full_name: string,                  // Creator's name
        medical_record_type: string,        // "SINGLE" | "BATCH"

        // Data arrays (used for counts AND chip rendering)
        diagnosis: [
          {
            name: string,                    // Diagnosis name (e.g., "Abomasal Displacement")
            string_id: string,              // Translation key
            status: string,                 // "active" | "closed"
            clinical_assessment: string,    // "tentative" | "confirmed"
            additional_info: {
              clinical_assessment: string,   // "tentative" | "confirmed"
              prognosis: string,
              severity: string
            }
          }
        ],
        complaint: [
          {
            complaint: string,              // Complaint text
            string_id: string,
            additional_info: {
              status: string,               // "active" | "closed"
              severity: string
            }
          }
        ],
        prescription: [...],                // Prescription objects
        advice: [...]                       // Advice objects
      }
    ]
  }
}
```

**Key insight:** The mobile app's `MedicalRecordListCard.js` uses `item.diagnosis.length` for the count icon value (not `diagnosis_count` field) when rendered from animal details. The web component mirrors this: it checks array length first, then falls back to the count field.

---

## Prescription Data Flow

```
API Response (grouped by medical record)
    │
    ▼
data state (array of sections: [{ medical_record_id, data: [...] }])
    │
    ▼
data.map(section) → Section per medical record
    │
    ▼
section.data.map(item) → Individual prescription card per item
```

**API response structure** (`get-medical-common-data-v2` with `medical_type: 'prescription'`):

```js
{
  success: true,
  data: {
    result: [
      {
        medical_record_id: "MED11-20614",    // Section header
        group_prescription_id: "...",         // Optional group ID
        data: [                               // Array of prescriptions in this medical record
          {
            prescription_id: number,
            name: string,                     // Medicine name (e.g., "A to Z tablet")
            status: string,                   // "active" | "close"
            dosage: string,                   // Combined dosage string (e.g., "321 pt")
            frequency: string,                // e.g., "Every Day"
            frequency_key: string,            // e.g., "one_time", "as_needed"
            start_date: string,               // ISO date
            end_date: string,                 // ISO date
            stop_date: string,                // ISO date (when stopped)
            duration: string,                 // Duration string (optional)
            duration_type: string,            // e.g., "days", "weeks"
            duration_qty: number,             // Duration quantity
            delivery_route_name: string,      // e.g., "Oral"
            created_at: string,               // ISO timestamp
            is_new_data: number,              // 0 = old format, 1 = new format
            schedule_doses: [                 // Array of scheduled doses (new format)
              { quantity: string, unit_name: string, time: string }
            ],
            controlled_substance: number,     // 0 or 1
            side_effect: number               // 0 or 1
          }
        ]
      }
    ],
    active: "2",
    closed: "0",
    all: "2",
    totalMedicalRecordCount: number
  }
}
```

**Key difference from v1:** The API returns data **pre-grouped by medical record**, not as a flat list. No client-side grouping is needed. Each `result` item is a section with `medical_record_id` as header and `data[]` as the prescription items. Prescription fields (name, dosage, frequency, etc.) are flat on each item, NOT nested under `additional_info`.

---

## Pages Where This Appears

- `/necropsy/{id}?status=PENDING` — Full medical history tabs visible (3 Cards: Mortality Details, Medical History, Assessments)
- `/necropsy/{id}?status=DRAFT` — Full medical history tabs visible (3 Cards: Mortality Details, Medical History, Assessments)
- `/necropsy/{id}?status=COMPLETED` — Shows `NecropsySummaryContent` instead (no medical history tabs)
- `/necropsy/{id}?status=UNSUITABLE` — Shows `NecropsySummaryContent` instead (no medical history tabs)

---

## Medical Record Detail Drawer (v3 — New)

### Overview

Added a clickable interaction to medical record cards in the Medical Records tab. Clicking on a medical record card opens a right-side drawer displaying the full medical record details, matching the mobile app's `MedicalRecordSummary.js` screen.

### Files Created

#### `src/components/necropsy/MedicalRecordDetailDrawer.js`

A drawer component that displays comprehensive medical record details.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `open` | boolean | Controls drawer visibility |
| `onClose` | function | Callback when drawer is closed |
| `medicalRecordId` | string/number | The ID of the medical record to display |

**Sections Displayed:**

1. **Header** — Medical record code, case type, created date, created by user
2. **Case Type** — Case type label in error color (red)
3. **Complaints** — Active and closed complaints with status chips
4. **Diagnosis** — Active and closed diagnoses with tentative/confirmed indicators
5. **Prescription** — Active and stopped prescriptions with dosage, frequency, duration details
6. **Advice** — List of advice items as chips
7. **Lab Test Requests** — Lab tests with status indicators
8. **Attachments** — Images and documents with thumbnails/links
9. **Notes** — Timestamped notes with pre-formatted text
10. **Follow-up Date** — Next visit/follow-up date

**API Used:**

```javascript
getMedicalRecordDetails(medicalRecordId)
// Endpoint: GET medical/v2/details?medical_record_id={id}&include_all_animals=0
```

**Conditional Rendering:**

- Each section only renders if data exists
- Active/Closed subsections only shown when items exist in that status
- Tentative diagnosis badge shown for `clinical_assessment === 'tentative'`
- Stopped prescriptions show line-through text decoration

### API Addition

#### `src/lib/api/necropsy/medicalHistory.js`

Added new function:

```javascript
export async function getMedicalRecordDetails(medicalRecordId) {
  const url = GET_MEDICAL_RECORD_DETAILS
  const response = await axiosGet({
    url,
    params: { medical_record_id: medicalRecordId, include_all_animals: 0 }
  })
  return response?.data
}
```

#### `src/constants/ApiConstant.js`

Added new constant:

```javascript
export const GET_MEDICAL_RECORD_DETAILS = 'medical/v2/details'
```

### Files Modified

#### `src/components/necropsy/MedicalRecordsList.js`

**Changes:**

1. Added import for `MedicalRecordDetailDrawer`
2. Added state: `drawerOpen`, `selectedRecordId`
3. Added handlers: `handleRecordClick()`, `handleDrawerClose()`
4. Made medical record cards clickable with hover effect
5. Added `MedicalRecordDetailDrawer` component at bottom of return

**Card Interaction:**

```jsx
<Box
  onClick={() => handleRecordClick(record)}
  sx={{
    // ... existing styles
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: alpha(theme.palette.warning.main, 0.04),
      borderColor: theme.palette.warning.dark
    }
  }}
>
```

### API Response Structure

**Endpoint:** `GET medical/v2/details`

**Parameters:**
- `medical_record_id` (required) — The medical record ID
- `include_all_animals` — Set to `0` for single animal view

**Response:**

```javascript
{
  success: true,
  data: {
    id: number,
    medical_record_code: string,           // e.g., "MED11-20614"
    case_type: {
      label: string,                        // e.g., "Standard"
      color_code: string,                   // Hex color
      default_icon: string                  // Icon URL
    },
    created_at: string,                     // ISO timestamp
    user_details: {
      user_full_name: string,
      user_mobile: string
    },
    animal_details: [...],                  // Animal information

    // Medical data sections
    complaints: [
      {
        complaint: string,
        name: string,
        notes: string,
        additional_info: {
          status: string                    // "active" | "closed"
        }
      }
    ],
    diagnosis: [
      {
        name: string,
        diagnosis: string,
        notes: string,
        additional_info: {
          status: string,                   // "active" | "closed"
          clinical_assessment: string       // "tentative" | "confirmed"
        }
      }
    ],
    prescription: [
      {
        medicine_name: string,
        name: string,
        status: string,                     // "active" | "close"
        dosage: string,
        dosage_unit: string,
        frequency: string,
        duration: string,
        duration_unit: string
      }
    ],
    advices: [
      {
        name: string,
        string_id: string
      }
    ],
    lab: [...],                             // Lab test requests
    lab_data: [...],                        // Additional lab data
    notes: {
      notes: [
        {
          note: string,
          created_at: string
        }
      ],
      images: [...],
      documents: [...],
      videos: [...]
    },
    follow_up_date: string                  // ISO date
  }
}
```

### Drawer Design

**Layout:**

```
┌─────────────────────────────────────────────────┐
│ Medical Record Details              [X] Close   │  ← Header (sticky)
├─────────────────────────────────────────────────┤
│ [Icon] MED11-20614                              │  ← Record ID chip
│ Standard • 05 Feb 2026                          │  ← Case type + date
│ ┌─────────────────────────────────────────┐     │
│ │ 👤 By Dr. John Smith                    │     │  ← Created by
│ └─────────────────────────────────────────┘     │
│ ─────────────────────────────────────────────── │
│                                                 │
│ 🏥 Case Type                                    │  ← Section header
│    ┌───────────────────────────────────────┐    │
│    │ Standard                              │    │  ← Value card
│    └───────────────────────────────────────┘    │
│                                                 │
│ 🐾 Complaints                                   │
│    2 Active                                     │
│    ┌───────────────────────────────────────┐    │
│    │ Lethargy              [Active]        │    │
│    │ Notes text here...                    │    │
│    └───────────────────────────────────────┘    │
│    1 Closed                                     │
│    ┌───────────────────────────────────────┐    │
│    │ ̶V̶o̶m̶i̶t̶i̶n̶g̶                [Closed]        │    │  ← Line-through
│    └───────────────────────────────────────┘    │
│                                                 │
│ 🩺 Diagnosis                                    │
│    ...                                          │
│                                                 │
│ 📋 Prescription                                 │
│    ...                                          │
│                                                 │
│ 💡 Advice                                       │
│    [Rest] [Hydration] [Monitor]                 │  ← Chip list
│                                                 │
│ 🧪 Lab Test Requests                            │
│    ...                                          │
│                                                 │
│ 📎 Attachments                                  │
│    3 file(s) attached                           │
│    [Thumbnail] [Thumbnail] [Doc icon]           │
│                                                 │
│ 📝 Notes                                        │
│    ┌───────────────────────────────────────┐    │
│    │ 05 Feb 2026 12:32 PM                  │    │
│    │ Patient showing improvement...        │    │
│    └───────────────────────────────────────┘    │
│                                                 │
│ 📅 Next Visit / Follow-up                       │
│    ┌───────────────────────────────────────┐    │
│    │ 📅 12 Feb 2026                        │    │  ← Warning color
│    └───────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

**Styling:**

- Drawer width: `500px` (sm), `560px` (md), `100%` (xs)
- Sections use `SectionHeader` component with icon + title
- Status chips: Active (green), Closed (gray)
- Tentative diagnosis: Warning-colored border and background
- Stopped prescriptions: Line-through text
- Follow-up date: Warning-colored card with calendar icon
- Attachments: Thumbnail grid for images, icon + name for documents

### Mobile App Reference

This implementation mirrors the mobile app's `MedicalRecordSummary.js` screen:

**File:** `/antz_mobile_app/screen/MedicalModule/MedicalRecordSummary.js`

**Key Sections Matched:**
- Case Type with icon and label
- Complaints (active/closed grouping)
- Diagnosis (active/closed grouping with tentative indicator)
- Prescription (active/stopped grouping)
- Advice list
- Lab Test Requests
- Attachments (images, documents, videos)
- Notes with timestamps
- Follow-up date

**API Matched:**
- `getAnimalMedicalDetailApi` → `getMedicalRecordDetails`
- Endpoint: `medical/v2/details`
- Parameters: `medical_record_id`, `include_all_animals`

---

## Medical Record Detail Drawer — Horizontal Tab Navigation (v3.1 — Update)

### Overview

Updated the Medical Record Detail Drawer to use a horizontal scrollable tab navigation with icons instead of listing all sections vertically. The drawer now shows only sections that have data and uses a tab-based interface matching the mobile app's design.

### Design Changes

**Before:** All sections listed vertically in a scrollable drawer
**After:** Horizontal scrollable tab icons with content rendered per selected tab

### Tab Navigation

The drawer displays available section icons in a horizontal scrollable row. Only tabs with data are shown:

| Tab ID | Icon | Label | Show Condition |
|--------|------|-------|----------------|
| `case_type` | CaseTypeIcon (Favorite) | Case Type | `data.case_type.label` exists |
| `complaints` | CxIcon (Pets) | Symptoms | `data.complaints.length > 0` |
| `diagnosis` | DxIcon (MedicalServices) | Diagnosis | `data.diagnosis.length > 0` |
| `prescription` | RxIcon (Description) | Prescription | `data.prescription.length > 0` |
| `advice` | AdviceIcon (Lightbulb) | Advice | `data.advices.length > 0` |
| `lab` | LabIcon (Science) | Lab Tests | `data.lab.length > 0` or `data.lab_data.length > 0` |
| `attachments` | AttachmentIcon (AttachFile) | Attachments | Images, documents, or videos exist |
| `notes` | NotesIcon (Notes) | Notes | `data.notes.notes.length > 0` |
| `followup` | FollowUpIcon (Event) | Follow-up | `data.follow_up_date` exists |

### Tab Icon Styling

```jsx
{
  flex: '1 0 auto',
  minWidth: 60,
  py: 2,
  borderBottom: isActive
    ? `2px solid ${theme.palette.primary.main}`
    : '2px solid transparent',
  '&:hover': {
    bgcolor: alpha(theme.palette.primary.main, 0.04)
  }
}
```

Active tab icon uses `primary.main` color, inactive uses `text.secondary`.

### AnimalCard Integration

The drawer now uses the existing `AnimalCard` component from `src/views/utility/AnimalCard` to display animal information, ensuring consistency with other parts of the application.

```jsx
import AnimalCard from 'src/views/utility/AnimalCard'
// ...
{animalData && (
  <Box sx={{ p: 3, bgcolor: theme.palette.background.paper }}>
    <AnimalCard data={animalData} />
  </Box>
)}
```

### Symptoms Card Design (Matching Mobile App)

Symptoms (Complaints) cards now use a left teal border design matching the mobile app:

```jsx
{
  borderLeft: `4px solid ${isClosed ? theme.palette.grey[300] : '#4DB6AC'}`,
  borderRadius: 2,
  bgcolor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderLeftWidth: 4,
  borderLeftColor: isClosed ? theme.palette.grey[300] : '#4DB6AC'
}
```

**Card Content:**
- Title (15px, fontWeight 600, line-through if closed)
- Severity + Duration row (teal color for severity)
- Info box with:
  - Severity label
  - Duration label
  - Notes (if available)
  - Last Updated timestamp

### Clinical Assessment Card Design (Matching Mobile App)

Diagnosis section renamed to "Clinical Assessment" with updated card design:

```jsx
{
  p: 2,
  bgcolor: theme.palette.background.paper,
  borderRadius: 2,
  border: `1px solid ${theme.palette.divider}`
}
```

**Card Content:**
- Title (15px, fontWeight 600, line-through if closed)
- Tentative chip (if applicable): Yellow background (#FFF3CD), brown text (#856404)
- Info box with:
  - Status label (capitalized)
  - Last Updated timestamp

---

## Medical Journal Drawer (v3.2 — New)

### Overview

Added a Medical Journal Drawer that opens from the History icon in the Medical Record Detail Drawer header. The drawer displays a chronological log of all medical activities for the animal, grouped by date.

### Files Created

#### `src/components/necropsy/MedicalJournalDrawer.js`

A drawer component that displays medical journal entries grouped by date.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `open` | boolean | Controls drawer visibility |
| `onClose` | function | Callback when drawer is closed |
| `animalId` | string/number | The animal ID to fetch journal logs for |
| `medicalRecordId` | string/number | (Optional) Filter journal entries by medical record |

**Features:**
- Entries grouped by date with section headers
- Each section shows: Day number (large), Day name, Month/Year
- Individual journal cards with category, title, time, details, and user info
- Pagination with "Load More" functionality
- Loading shimmer state
- Empty state message

### API Addition

#### `src/lib/api/necropsy/medicalHistory.js`

Added new function:

```javascript
export async function getMedicalJournalLogs(params) {
  const url = ANIMAL_JOURNAL_LOGS
  const response = await axiosGet({ url, params })
  return response?.data
}
```

**Parameters:**
- `animal_id` (required) — The animal ID
- `medical_record_id` (optional) — Filter by specific medical record
- `page` — Page number for pagination
- `limit` — Items per page (default: 10)

#### `src/constants/ApiConstant.js`

Uses existing constant:
```javascript
export const ANIMAL_JOURNAL_LOGS = 'medical/get-animal-history-journal'
```

### Integration with MedicalRecordDetailDrawer

**State Added:**
```javascript
const [journalDrawerOpen, setJournalDrawerOpen] = useState(false)
```

**History Icon Button:**
```jsx
<IconButton
  size='small'
  sx={{ bgcolor: theme.palette.grey[100] }}
  onClick={() => setJournalDrawerOpen(true)}
>
  <HistoryIcon sx={{ fontSize: 20 }} />
</IconButton>
```

**MedicalJournalDrawer Component:**
```jsx
<MedicalJournalDrawer
  open={journalDrawerOpen}
  onClose={() => setJournalDrawerOpen(false)}
  animalId={animalData?.animal_id}
  medicalRecordId={medicalRecordId}
/>
```

### Journal Drawer Design

**Layout:**

```
┌─────────────────────────────────────────────────┐
│ Medical Journal                        [X] Close │  ← Header (sticky)
├─────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────┐   │
│ │ 05   Monday                               │   │  ← Date section header
│ │      February 2026                        │   │     (grey[200] background)
│ └───────────────────────────────────────────┘   │
│                                                 │
│   ○  prescription                              │  ← Journal entry
│      Medicine Added                             │
│                                   12:32 PM      │
│   ┌─────────────────────────────────────────┐  │
│   │ Medicine Name: Amoxicillin              │  │  ← Details box
│   │ Dosage: 500mg                           │  │
│   │ Frequency: Twice daily                  │  │
│   │ 👤 Dr. John Smith                       │  │  ← User name
│   └─────────────────────────────────────────┘  │
│                                                 │
│   ○  diagnosis                                 │
│      Diagnosis Added                            │
│                                   11:15 AM      │
│   ┌─────────────────────────────────────────┐  │
│   │ Diagnosis: Gastritis                    │  │
│   │ Status: Active                          │  │
│   │ 👤 Dr. Jane Doe                         │  │
│   └─────────────────────────────────────────┘  │
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ 04   Sunday                               │   │  ← Next date section
│ │      February 2026                        │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│                    Load More                    │  ← Pagination
│                                                 │
└─────────────────────────────────────────────────┘
```

**Styling:**

- Drawer position: Bottom-right (slides up from bottom, aligned to right edge)
- Drawer anchor: `bottom`
- Drawer width: `450px` (sm), `520px` (md), `100%` (xs)
- Drawer height: `85vh`
- Border radius: `16px` top-left and top-right (rounded corners)
- Content background: `grey[50]`
- Date section header: `grey[200]` background
- Journal cards: White background with divider border
- Entry icon: Custom icon from API, fallback to Antz logo (`/icons/antz.svg`)
- Details box: `lightBg` or `grey[100]` background
- Dashed connector line between entries

**Drawer PaperProps:**
```jsx
{
  height: '85vh',
  maxHeight: '85vh',
  width: { xs: '100%', sm: 450, md: 520 },
  maxWidth: '100%',
  position: 'absolute',
  right: 0,
  left: 'auto',
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16
}
```

### JournalCard Component

Internal component that renders individual journal entries matching `AnimalJournals.js` design:

```jsx
const JournalCard = ({ entry, theme, formatKey, formatDetailValue, isLast }) => {
  const [imageError, setImageError] = useState(false)
  const type = entry.type || ''
  const category = entry.category?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || ''
  const title = entry.title ? Utility.toPascalSentenceCase?.(entry.title) || entry.title.replace(/_/g, ' ') : ''
  const time = entry.time ? Utility.convertUTCToLocaltime(entry.time) : ''
  const details = entry.details || {}
  const code = entry.code || details?.medical_record_number || ''
  const createdBy = entry.createdBy || entry.created_by || null
  const userName = entry.user_full_name || createdBy?.name || ''
  // ...
}
```

**Features:**
- Type label (12px, text.secondary)
- Category label (12px, text.secondary, Title Case from snake_case)
- Title (16px, fontWeight 500, with Tooltip)
- Time display (12px, fontWeight 600, text.secondary)
- Avatar with custom icon or Antz logo fallback (handles image load errors)
- Dashed connector line between entries (except last entry)
- Details card with:
  - Code/Medical record number (colored by type: Medical=info, Vaccination=primary.dark, default=success)
  - Key-value pairs with tooltips
  - User info with avatar
- Filters out `medical_record_number` key and null/empty values from details

### API Response Structure

**Endpoint:** `GET journal/animal-logs`

**Response:**

The API returns data pre-grouped by date:

```javascript
{
  success: true,
  data: {
    total_count: number,
    data: [
      {
        date: string,                    // e.g., "2026-02-05"
        day: string,                     // e.g., "Monday"
        entries: [                       // Array of journal entries for this date
          {
            type: string,                // e.g., "Medical", "Vaccination"
            category: string,            // e.g., "prescription", "diagnosis"
            title: string,               // e.g., "Medicine Added", "Diagnosis Added"
            time: string,                // ISO timestamp
            code: string,                // Medical record code (optional)
            incon: string,               // Custom icon URL (optional)
            user_full_name: string,      // User who made the entry
            createdBy: {                 // Created by info (optional)
              name: string,
              timestamp: string
            },
            details: {                   // Key-value pairs of entry details
              medical_record_number: string,
              medicine_name: string,
              dosage: string,
              // ... varies by category
            }
          }
        ]
      }
    ]
  }
}
```

### Mobile App Reference

This implementation mirrors the mobile app's Medical Journal screen and the existing web `AnimalJournals.js` component.

**Mobile File:** `/antz_mobile_app/screen/MedicalModule/MedicalJournal.js`

**Web Reference:** `src/components/housing/animals/AnimalJournals.js`

**Key Features Matched:**
- Date grouping with day number, day name, month/year
- Journal entry cards with type, category, title, time
- Timeline-style layout with dashed connector lines
- Details section with formatted key-value pairs (medical record code, etc.)
- User attribution with avatar
- Color-coded codes based on type (Medical, Vaccination, etc.)
- Pagination support with "Load More"
- Fallback to Antz logo when custom icon fails to load
