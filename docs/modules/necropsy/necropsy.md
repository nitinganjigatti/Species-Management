# Necropsy Module - Redux Implementation

This document describes the Redux state management implementation for the Necropsy module.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Redux Slices](#redux-slices)
  - [necropsySlice](#necropsyslice)
  - [necropsyFormOptionsSlice](#necropsyformoptionsslice)
- [Custom Hooks](#custom-hooks)
  - [useNecropsyList](#usenecropsylist)
  - [useNecropsyCenter](#usenecropsycenter)
  - [useNecropsyFormOptions](#usenecropsyformoptions)
- [State Structure](#state-structure)
- [Usage Examples](#usage-examples)
- [Performance Optimizations](#performance-optimizations)

---

## Overview

The Necropsy module uses Redux Toolkit for state management, replacing the previous React Context implementation. This provides:

- Centralized state management
- Better performance through memoized selectors
- Cached API responses (form options with 5-minute TTL)
- Request deduplication and cancellation
- Persistent center selection via localStorage

## Architecture

```
src/
├── store/
│   ├── store.js                          # Redux store configuration
│   └── slices/
│       └── necropsy/
│           ├── index.js                  # Barrel exports
│           ├── necropsySlice.js          # Main necropsy state
│           └── necropsyFormOptionsSlice.js # Cached form options
├── hooks/
│   └── necropsy/
│       ├── index.js                      # Barrel exports
│       ├── useNecropsyList.js            # List management hook
│       ├── useNecropsyCenter.js          # Center selection hook
│       └── useNecropsyFormOptions.js     # Form options hook
```

---

## Redux Slices

### necropsySlice

**Location:** `src/store/slices/necropsy/necropsySlice.js`

Main slice for necropsy module state management.

#### Async Thunks

| Thunk | Description | Parameters |
|-------|-------------|------------|
| `fetchNecropsieCenters` | Fetches necropsy centers list | `{ userId, searchQuery }` |
| `fetchNecropsyStats` | Fetches stats (incoming, pending, draft, completed counts) | `{ necropsy_center_id, from_date, til_date, type }` |
| `fetchAnimalWiseList` | Fetches animal-wise necropsy list | Filter parameters |
| `fetchSpeciesWiseList` | Fetches species-wise necropsy list | Filter parameters |

#### Actions

| Action | Description |
|--------|-------------|
| `setSelectedCenter` | Sets selected necropsy center (persists to localStorage, clears lists) |
| `loadSelectedCenterFromStorage` | Loads selected center from localStorage |
| `setActiveCard` | Sets active status card (INCOMING, PENDING, DRAFT, COMPLETED) |
| `setViewType` | Sets view type ('animals' or 'species') |
| `setFilters` | Updates pagination/search filters |
| `setFilterDate` | Sets date range filter |
| `setAnimalFilters` | Sets animal-specific filters |
| `setSpeciesFilters` | Sets species-specific filters |
| `resetFilters` | Resets all filters to initial state |
| `resetPage` | Resets pagination to page 1 |
| `clearNecropsyData` | Clears all necropsy data (for logout) |
| `clearLists` | Clears animal and species lists |

#### Selectors

```javascript
import {
  selectSelectedCenter,
  selectCenters,
  selectCentersLoading,
  selectStats,
  selectStatsLoading,
  selectAnimalList,
  selectAnimalTotal,
  selectAnimalLoading,
  selectSpeciesList,
  selectSpeciesTotal,
  selectSpeciesLoading,
  selectActiveCard,
  selectViewType,
  selectFilters,
  selectFilterDate,
  selectAnimalFilters,
  selectSpeciesFilters,
  selectIsLoading,
  selectCurrentList,
  selectCurrentTotal
} from 'src/store/slices/necropsy/necropsySlice'
```

---

### necropsyFormOptionsSlice

**Location:** `src/store/slices/necropsy/necropsyFormOptionsSlice.js`

Manages cached form dropdown options with a 5-minute TTL.

#### Async Thunks

| Thunk | Description |
|-------|-------------|
| `fetchFormOptions` | Fetches all form options (manner of death, disposal, weight units) |

#### Cached Options

- **Manner of Death** - Options for cause of death selection
- **Disposal Methods** - Carcass disposal options
- **Weight Units** - Measurement unit options

#### Selectors

```javascript
import {
  selectMannerOfDeathOptions,
  selectDisposalOptions,
  selectWeightUnitOptions,
  selectFormOptionsLoading,
  selectFormOptionsLoaded,
  selectIsCacheValid
} from 'src/store/slices/necropsy/necropsyFormOptionsSlice'
```

---

## Custom Hooks

### useNecropsyList

**Location:** `src/hooks/necropsy/useNecropsyList.js`

Manages necropsy list data with memoization and optimized handlers.

#### Usage

```javascript
import { useNecropsyList } from 'src/hooks/necropsy'

const MyComponent = () => {
  const {
    // Data
    selectedNecropsy,
    stats,
    indexedAnimalRows,
    indexedSpeciesRows,
    animalTotal,
    speciesTotal,
    isLoading,

    // UI State
    activeCard,
    viewType,
    filters,
    filterDate,
    animalFilters,
    speciesFilters,
    animalFilterCount,
    speciesFilterCount,

    // Actions
    fetchAll,
    fetchStats,
    fetchNecropsyData,
    handleSearch,
    handleSearchClear,
    handlePaginationChange,
    handleActiveCardChange,
    handleViewTypeChange,
    handleDateFilterChange,
    applyAnimalFilters,
    applySpeciesFilters
  } = useNecropsyList()

  // Component logic...
}
```

#### Features

- **Memoized rows** - `indexedAnimalRows` and `indexedSpeciesRows` are memoized with serial numbers
- **Debounced search** - 500ms debounce with stable reference (no recreation on re-renders)
- **Filter counts** - Pre-calculated filter counts for badge display
- **Request cancellation** - Cancels in-flight requests when new ones are made

---

### useNecropsyCenter

**Location:** `src/hooks/necropsy/useNecropsyCenter.js`

Manages necropsy center selection with localStorage persistence.

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `userId` | string | required | User ID for API calls |
| `autoFetch` | boolean | `true` | Auto-fetch centers on mount |

#### Usage

```javascript
import { useNecropsyCenter } from 'src/hooks/necropsy'

const MyComponent = () => {
  const {
    selectedCenter,      // Currently selected center
    centers,             // List of available centers
    centersLoading,      // Loading state
    fetchCenters,        // Fetch centers (with optional search)
    updateSelectedCenter, // Update selected center
    clearData            // Clear all data (for logout)
  } = useNecropsyCenter(userId, true)

  // Change center
  const handleCenterChange = (center) => {
    updateSelectedCenter(center)
  }

  // Search centers
  const handleSearch = (query) => {
    fetchCenters(query)
  }
}
```

#### Important Notes

- When `autoFetch` is `true`, centers are fetched on mount if the list is empty
- Only one component should have `autoFetch=true` to prevent duplicate API calls
- The `NecropsyDropdown` component handles fetching; other components should use `autoFetch=false`

---

### useNecropsyFormOptions

**Location:** `src/hooks/necropsy/useNecropsyFormOptions.js`

Provides cached form dropdown options with helper functions.

#### Usage

```javascript
import { useNecropsyFormOptions } from 'src/hooks/necropsy'

const NecropsyForm = () => {
  const {
    // Options arrays
    mannerOfDeathOptions,
    disposalOptions,
    weightUnitOptions,

    // Loading state
    optionsLoading,
    optionsLoaded,

    // Helper functions
    findMannerOfDeathOption,
    findDisposalOption,
    findWeightUnitOption,

    // Manual refresh
    refreshOptions
  } = useNecropsyFormOptions()

  // Find option by ID
  const selectedManner = findMannerOfDeathOption(mortalityData.manner_of_death_id)

  // Use in dropdown
  return (
    <Select options={mannerOfDeathOptions} />
  )
}
```

#### Features

- **5-minute cache** - Options are cached and reused across components
- **Auto-fetch** - Automatically fetches if cache is stale or empty
- **Helper functions** - Find options by ID for form initialization

---

## State Structure

```javascript
{
  necropsy: {
    // Selected center
    selectedCenter: { id, name, site_name, ... } | null,

    // Centers list
    centers: [],
    centersLoading: false,
    centersError: null,
    hasCompletedInitialFetch: false,

    // Stats
    stats: {
      INCOMING: 0,
      PENDING: 0,
      DRAFT: 0,
      COMPLETED: 0,
      CARCASS_TRANSFER: 0
    },
    statsLoading: false,

    // Animal list
    animalList: [],
    animalTotal: 0,
    animalLoading: false,

    // Species list
    speciesList: [],
    speciesTotal: 0,
    speciesLoading: false,

    // UI state
    activeCard: 'INCOMING',
    viewType: 'animals',

    // Filters
    filters: { page: 1, limit: 50, q: '' },
    filterDate: { startDate: null, endDate: null },
    animalFilters: { Sex: [], Site: [], Priority: [], ... },
    speciesFilters: { Site: [], Priority: [] }
  },

  necropsyFormOptions: {
    mannerOfDeathOptions: [],
    disposalOptions: [],
    weightUnitOptions: [],
    loading: false,
    loaded: false,
    lastFetched: null,  // Timestamp for cache validation
    error: null
  }
}
```

---

## Usage Examples

### Basic Page Setup

```javascript
import { useNecropsyList, useNecropsyCenter } from 'src/hooks/necropsy'

const NecropsyPage = () => {
  const { userData } = useContext(AuthContext)
  const userId = userData?.user?.user_id

  // Center hook (autoFetch=false since NecropsyDropdown handles it)
  useNecropsyCenter(userId, false)

  // List hook
  const {
    selectedNecropsy,
    indexedAnimalRows,
    isLoading,
    fetchAll,
    handlePaginationChange
  } = useNecropsyList()

  // Fetch data when center changes
  useEffect(() => {
    if (selectedNecropsy?.id) {
      fetchAll()
    }
  }, [selectedNecropsy?.id, fetchAll])

  return (
    <DataGrid
      rows={indexedAnimalRows}
      loading={isLoading}
      onPaginationModelChange={handlePaginationChange}
    />
  )
}
```

### Form with Cached Options

```javascript
import { useNecropsyFormOptions } from 'src/hooks/necropsy'

const NecropsyReportForm = ({ mortalityId }) => {
  const {
    mannerOfDeathOptions,
    disposalOptions,
    optionsLoading,
    findMannerOfDeathOption
  } = useNecropsyFormOptions()

  const [formData, setFormData] = useState({})

  // Initialize form with existing data
  useEffect(() => {
    if (existingData && !optionsLoading) {
      setFormData({
        mannerOfDeath: findMannerOfDeathOption(existingData.manner_of_death_id),
        // ...
      })
    }
  }, [existingData, optionsLoading])

  if (optionsLoading) return <Loading />

  return (
    <Form>
      <Select
        label="Manner of Death"
        options={mannerOfDeathOptions}
        value={formData.mannerOfDeath}
        onChange={(val) => setFormData({ ...formData, mannerOfDeath: val })}
      />
    </Form>
  )
}
```

---

## Performance Optimizations

### 1. Memoization

- Column definitions are memoized with `useMemo`
- Row data is indexed and memoized in hooks
- Components use `memo()` for re-render prevention

### 2. Debounced Search

```javascript
// Stable debounce reference - doesn't recreate on re-renders
const filtersRef = useRef(filters)
filtersRef.current = filters

const debouncedSearch = useMemo(
  () => debounce(value => {
    dispatch(setFilters({ ...filtersRef.current, q: value, page: 1 }))
  }, 500),
  [dispatch]
)
```

### 3. Lazy Loading

```javascript
// Heavy drawer components are lazy loaded
const NecropsyFilterDrawer = dynamic(
  () => import('src/components/necropsy/NecropsyFilterDrawer'),
  { ssr: false }
)
```

### 4. Parallel API Calls

```javascript
// Multiple independent API calls run in parallel
const [detailsRes, btnStatusRes, checklistRes] = await Promise.all([
  getIncomingNecropsyTransferSummary({ transfer_id: transferId }),
  getIncomingNecropsyBtnStatus(transferId),
  getIncomingNecropsyChecklistDetails({ entity_type: 'carcass_transfer' }, transferId)
])
```

### 5. Cached Form Options

- Options cached with 5-minute TTL
- Shared across all form instances
- Prevents redundant API calls on navigation

### 6. Request Cancellation

```javascript
// Cancel previous request when new one starts
if (abortControllerRef.current) {
  abortControllerRef.current.abort()
}
abortControllerRef.current = new AbortController()
```

### 7. Center Change Optimization

When the selected center changes:
- Lists are immediately cleared (no stale data shown)
- Stats are reset to zero
- Pagination resets to page 1
- New data is fetched automatically

---

## Migration Notes

If migrating from the old `NecropsyContext`:

1. Replace `useNecropsy()` with appropriate Redux hooks
2. Update imports from `src/context/NecropsyContext` to `src/hooks/necropsy`
3. The old context can be removed once all components are migrated

```javascript
// Before
import { useNecropsy } from 'src/context/NecropsyContext'
const { selectedNecropsy, updateSelectedNecropsy } = useNecropsy()

// After
import { useNecropsyCenter } from 'src/hooks/necropsy'
const { selectedCenter, updateSelectedCenter } = useNecropsyCenter(userId, false)
```
