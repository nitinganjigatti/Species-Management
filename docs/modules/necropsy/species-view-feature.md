# Necropsy Species View Feature

## Overview

The Species View feature allows users to view necropsy records grouped by species. When the "By Species" tab is selected on the main necropsy listing page, clicking on a species row navigates to a detailed listing of all animals for that species.

## Navigation Flow

1. User navigates to `/necropsy` page
2. User toggles to "By Species" tab using the switch
3. Species list is displayed showing count of animals per species
4. Clicking on a species row navigates to the species animal listing page
5. User can navigate back to the species tab using breadcrumb

## URL Structure

### Species Listing (Main Page)
```
/necropsy?status=PENDING&tab=species
```

### Species Animal Listing (Detail Page)
```
/necropsy/[id]?status=PENDING&view=species&taxonomy_id=[tsn]&species_name=[name]
```

**Query Parameters:**
- `status` - The necropsy status filter (INCOMING, PENDING, DRAFT, COMPLETED, UNSUITABLE)
- `view` - Set to "species" to indicate species view mode
- `taxonomy_id` - The TSN (Taxonomic Serial Number) of the species
- `species_name` - URL-encoded species name for display in breadcrumb

## Components

### 1. Main Necropsy Page (`/src/pages/necropsy/index.js`)

**Key Changes:**
- Added `tab` URL parameter to persist species tab selection
- Updated `indexedSpeciesRows` to include `tsn` field for taxonomy_id
- Modified `handleChange` to update tab in URL parameters
- Species row click navigates with proper query parameters

**Species Row Navigation:**
```javascript
const handleSpeciesRowClick = params => {
  const speciesRow = params.row
  router.push(
    `/necropsy/${speciesRow.tsn}?status=${statusQuery}&view=species&taxonomy_id=${speciesRow.tsn}&species_name=${encodeURIComponent(speciesRow.species_name)}`
  )
}
```

### 2. Detail Page Router (`/src/pages/necropsy/[id]/index.js`)

**Key Changes:**
- Detects species view mode via `view=species` query parameter
- Renders `NecropsySpeciesListContent` for species view
- Renders `NecropsyDetailContent` for regular detail view
- Updates breadcrumb to include `tab=species` for back navigation

**View Detection:**
```javascript
const { id, status = 'PENDING', view, taxonomy_id, species_name } = router.query
const isSpeciesView = view === 'species'
const effectiveTaxonomyId = isSpeciesView ? (taxonomy_id || id) : null
```

### 3. Species Animal List Component (`/src/views/pages/necropsy/NecropsySpeciesListContent.js`)

**Features:**
- Displays species header with name and animal count
- Shows NecropsyAnalytics card with necropsy center dropdown
- Data table with animal listing for the species
- Search functionality
- Date filtering
- Filter drawer with species-specific filters
- Pagination support

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `taxonomyId` | string | The TSN (Taxonomic Serial Number) of the species |
| `speciesName` | string | Display name of the species |
| `status` | string | Necropsy status filter (PENDING, DRAFT, etc.) |

**API Call:**
```javascript
const params = {
  page_no: filters.page,
  limit: filters.limit,
  q: filters.q,
  status: status,
  taxonomy_id: taxonomyId,
  necropsy_center_id: selectedNecropsy.id,
  use_case: 'necropsy_module',
  from_date: formatDate(filterDate.startDate),
  to_date: formatDate(filterDate.endDate),
  // Filter parameters
  cause_of_death: mannerOfDeathFilter,
  organization_id: organizationId,
  sex_type: sexFilter
}
const res = await getAnimalWiseNecropsyList(params)
```

### 4. Species Animal Filter Drawer (`/src/components/necropsy/SpeciesAnimalFilterDrawer.js`)

A dedicated filter drawer for the species animal listing page with filters matching the mobile app.

**Filter Options:**

| Filter | Type | Data Source |
|--------|------|-------------|
| Manner of Death | Multi-select | `getMannerOfDeath()` API |
| Organization | Single-select (searchable) | `getOrganizationList()` API |
| Sex | Multi-select | Static options |

**Sex Options:**
- Male
- Female
- Indeterminate
- Undetermined

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `open` | boolean | Controls drawer visibility |
| `onClose` | function | Callback when drawer is closed |
| `onApplyFilters` | function | Callback with selected filter options |
| `setFilterCount` | function | Updates the filter count badge |
| `initialSelectedOptions` | object | Pre-selected filter values |

**API Parameters Mapping:**
| Filter | API Parameter |
|--------|---------------|
| Manner of Death | `cause_of_death` (JSON array) |
| Organization | `organization_id` (single value) |
| Sex | `sex_type` (JSON array) |

## Table Columns

The species animal listing table displays the following columns:

| Column | Description | Shown For |
|--------|-------------|-----------|
| SL. NO | Serial number | All statuses |
| Animal Name & ID | Animal card with name, ID, and image | All statuses |
| Transfer Code | Transfer code for incoming animals | INCOMING only |
| Request ID | Necropsy request ID | DRAFT, COMPLETED |
| Mortality Date | Date and time of mortality | All statuses |
| Priority | Priority level (High/Normal) | All statuses |
| Requested By / Draft Saved By / Completed By | User who performed the action | Based on status |

## State Management

### Filter State
```javascript
const [selectedOptions, setSelectedOptions] = useState({
  'Manner of Death': [],
  Organization: [],
  Sex: []
})
```

### URL State Persistence
The species tab selection is persisted in the URL via the `tab` parameter:
- When switching to species tab: `tab=species` is added to URL
- When navigating back from species detail: breadcrumb includes `tab=species`
- On page load: tab is restored from URL parameter

## Context Dependencies

- **NecropsyContext**: Provides `selectedNecropsy` for necropsy center selection
- The component waits for `selectedNecropsy.id` before making API calls
- Timeout fallback (3 seconds) prevents infinite loading if center doesn't load

## Error Handling

- Loading skeleton shown while data is being fetched
- "Please select a necropsy center" message if center is not available
- Console error logging for API failures
- Toast notifications for filter loading failures

## Mobile App Compatibility

This implementation matches the mobile app's `NecropsyAnimalListing.js` screen:
- Same filter options (Manner of Death, Organizations, Sex Type)
- Same API parameters (`taxonomy_id`, `cause_of_death`, `organization_id`, `sex_type`)
- Same navigation flow from species list to animal list

## Files Modified/Created

### Created
- `/src/components/necropsy/SpeciesAnimalFilterDrawer.js` - Filter drawer component
- `/src/views/pages/necropsy/NecropsySpeciesListContent.js` - Species animal list component

### Modified
- `/src/pages/necropsy/index.js` - Added tab persistence and tsn field
- `/src/pages/necropsy/[id]/index.js` - Added species view detection and routing
