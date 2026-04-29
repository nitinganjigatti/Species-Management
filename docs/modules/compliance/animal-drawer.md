# AnimalDrawer Component

**File:** `src/views/pages/compliance/reports/observation/AnimalDrawer.js`

## Overview

A reusable drawer component for selecting animals from a list. Supports single selection (radio button) and multi-selection (checkbox) modes. Used across multiple modules including housing, hospital, medical, and compliance reports.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | — | Controls drawer visibility |
| `onClose` | `() => void` | — | Callback when drawer is closed |
| `handleAnimalClick` | `(animal) => void` | — | Callback when user confirms selection. Receives a **single animal object** in single-select mode, or an **array of animal objects** in multi-select mode |
| `btnText` | `string` | `'GENERATE OBSERVATION REPORT'` | Text for the bottom action button |
| `showAnimalFilter` | `boolean` | `true` | Show/hide horizontal animal type filter tabs |
| `showFilterAndSort` | `boolean` | `false` | Show/hide filter and sort buttons next to search |
| `handleFilterClick` | `() => void` | `() => {}` | Callback when filter button is clicked |
| `handleSortClick` | `() => void` | `() => {}` | Callback when sort button is clicked |
| `module` | `string` | `'housing'` | Module context. Determines which API and params to use. Options: `'housing'`, `'hospital'`, `'medical'` |
| `filters` | `object` | `{}` | Filter options object (Gender, Species, Site, Section, Enclosure) |
| `sortType` | `object` | — | Sort configuration `{ column, sort }` |
| `filterCount` | `number` | — | Number of active filters (shown as badge) |
| `multiSelect` | `boolean` | `false` | Enable multi-selection mode. When `true`, checkboxes are shown instead of radio buttons |
| `defaultSelected` | `array` | `[]` | Pre-selected animals when drawer opens (used with `multiSelect={true}`) |
| `customQueryParams` | `object \| function \| null` | `null` | Custom query params for the animal list API. When provided, skips module-based branching and uses `getNewAnimalListWithFilters` directly. Can be a static object or a function receiving `{ search, activeTab, pageParam, filters, sortType }` |

## Selection Modes

### Single Select (default)

When `multiSelect` is `false` (default), the drawer shows radio buttons and allows selecting one animal at a time.

```jsx
<AnimalDrawer
  open={drawerOpen}
  onClose={() => setDrawerOpen(false)}
  handleAnimalClick={(animal) => {
    // animal = single animal object
    console.log(animal.animal_id)
  }}
  btnText='SELECT ANIMAL'
  module='medical'
/>
```

**Behavior:**
- Radio buttons are displayed on each animal card
- Only one animal can be selected at a time
- `handleAnimalClick` receives a **single animal object**
- Bottom action button appears when one animal is selected

### Multi Select

When `multiSelect` is `true`, the drawer shows checkboxes and allows selecting multiple animals.

```jsx
<AnimalDrawer
  open={drawerOpen}
  onClose={() => setDrawerOpen(false)}
  multiSelect={true}
  handleAnimalClick={(animals) => {
    // animals = array of animal objects
    const animalIds = animals.map(a => a.animal_id).join(',')
  }}
  btnText='VIEW MEDICAL RECORDS'
  module='medical'
/>
```

**Behavior:**
- Checkboxes are displayed on each animal card
- Multiple animals can be selected/deselected by toggling checkboxes
- The action button shows the count of selected animals, e.g. `VIEW MEDICAL RECORDS (3)`
- `handleAnimalClick` receives an **array** of animal objects
- Bottom action button appears when at least one animal is selected

### Consuming Multi-Select in Parent Components

When using `multiSelect={true}`, the parent component should handle the array of animals. Example from `MedicalRecord.tsx`:

```tsx
// State uses an array instead of a single object
const [selectedAnimals, setSelectedAnimals] = useState<AnimalData[]>([])

// Handler normalizes both single and array input
const handleAnimalSelect = (animals: any) => {
  const animalList = Array.isArray(animals) ? animals : [animals]
  setSelectedAnimals(animalList)
}

// Build comma-separated IDs for API calls
const animalIds = selectedAnimals.map(a => a.animal_id).join(',')
// Result: "239524,239525,239526"
```

## Animal Object Shape

The animal object returned in both modes has the following structure:

```js
{
  animal_id,
  default_common_name,
  scientific_name,
  user_enclosure_name,
  section_name,
  site_name,
  type,
  sex,
  default_icon,
  total_animal,
  local_identifier_name,
  local_identifier_value,
  site_id,
  enclosure_id,
  // hospital module only:
  in_transit,
  is_hospitalized
}
```

## Internal State

| State | Type | Description |
|-------|------|-------------|
| `internalSelected` | `object \| null` | Tracks the single selected animal (used when `multiSelect=false`) |
| `internalMultiSelected` | `array` | Tracks the list of selected animals (used when `multiSelect=true`) |

Both states are reset when the drawer opens or closes.

## Custom Query Params (Recommended)

Instead of relying on the `module` prop, new callers should use `customQueryParams` to control the API params directly. This skips the internal module branching and uses `getNewAnimalListWithFilters` with merged params.

The base params (`page_no`, `limit`, `list_type`, `type`, `include_dead_animal`, and search) are handled automatically. `customQueryParams` only needs to provide module-specific params.

### Static object

```jsx
<AnimalDrawer
  open={drawerOpen}
  onClose={() => setDrawerOpen(false)}
  customQueryParams={{
    animal_list_type: 'all_animals',
    ignore_permission: 0
  }}
/>
```

### Function form (receives drawer state)

```tsx
<AnimalDrawer
  open={drawerOpen}
  onClose={() => setDrawerOpen(false)}
  multiSelect={true}
  filters={selectedOptions}
  sortType={currentSort}
  customQueryParams={({ activeTab, filters: drawerFilters, sortType: drawerSort }) => ({
    animal_list_type: activeTab,
    gender: drawerFilters?.Gender || [],
    tsn_id: drawerFilters?.Species || [],
    site_id: drawerFilters?.Site || [],
    section_id: drawerFilters?.Section || [],
    enclosure_id: drawerFilters?.Enclosure || [],
    sort: drawerSort?.sort || 'asc',
    column: drawerSort?.column || 'animal_id',
    ignore_permission: 0
  })}
/>
```

The function receives `{ search, activeTab, pageParam, filters, sortType }` from the drawer's internal state, allowing dynamic param construction.

## Module-specific Behavior (Legacy)

The `module` prop is the legacy way to control API behavior. New callers should prefer `customQueryParams`. When `customQueryParams` is provided, the `module` prop is ignored.

- **`housing`**: Uses `getAnimalListForObservationReport` API. Shows animal type filter tabs.
- **`hospital`**: Uses `getNewAnimalListWithFilters` API. Requires search input before showing results. Animals with `in_transit='1'` or `is_hospitalized='1'` are shown but not selectable (radio/checkbox disabled for those cards).
- **`medical`**: Uses `getNewAnimalListWithFilters` API. Shows animal type filter tabs. Applies filter/sort options. Typically used with `multiSelect={true}`.

## Related Components

- **`AnimalParentCard`** (`src/views/utility/animalParentCard.js`) — Renders each animal card. Supports both `radio` and `checkbox` props:
  - `radio={{ checked: boolean, onChange: () => void }}` — Shows a radio button (single select)
  - `checkbox={{ checked: boolean, onChange: () => void }}` — Shows a checkbox (multi select)
  - Only one of `radio` or `checkbox` should be passed at a time. Pass `false` to disable selection for a card.
- **`AddPatientFiltersDrawer`** — Filter drawer for Gender, Species, Site selections.
- **`SortBottomSheet`** — Sort options bottom sheet.

## Usage Locations

This component is used in:
- Medical Records (`src/components/medical/medicalRecords/MedicalRecord.tsx`) — with `multiSelect={true}` and `customQueryParams` (migrated from `module='medical'`)
- Observation Reports (`src/pages/compliance/reports/observation/`)
- Housing modules (sites, sections, clusters, enclosures)
- Hospital Add Patient (`src/components/hospital/AddPatientForm/`)
- Medical Journal Report, Animal History Report, Animal Stock Report

## Backward Compatibility

The `multiSelect` prop defaults to `false`, so all existing usages continue to work as before with radio button single selection. No changes are needed in components that don't require multi-select.
