# Migration Guide: Next.js 15 → 16

**Branch**: `migration-v16`
**Date**: 2026-02-19
**Scope**: Dependency upgrades, configuration changes, import path fixes

---

## Summary of Changes

This migration upgrades the Antz Web Dashboard from Next.js 15 to Next.js 16, aligns React and ESLint config versions, updates the Next.js configuration to use current APIs, and fixes a broken module import path.

---

## 1. Dependency Upgrades (`package.json`)

| Package | Before | After |
|---|---|---|
| `next` | `^15.3.8` | `16.1.6` |
| `react` | `^19.2.3` | `19.2.4` |
| `react-dom` | `^19.2.3` | `19.2.4` |
| `eslint-config-next` | `^14.2.28` | `16.1.6` |
| `package-lock.json` | present | removed (yarn used) |

### Why pin exact versions?
Pinning removes the `^` range prefix to ensure deterministic installs across environments and CI pipelines, preventing accidental minor/patch upgrades that could introduce breaking changes.

### Install after pulling changes
```bash
yarn install
```

---

## 2. `next.config.js` Changes

### 2a. Removed `eslint.ignoreDuringBuilds`

**Before:**
```js
eslint: {
  // Warning: This allows production builds to successfully complete even if
  // your project has ESLint errors.
  ignoreDuringBuilds: true
},
```

**After:** *(block removed)*

**Reason:** ESLint errors will now fail production builds. Fix lint errors before building for production. Run `yarn lint` locally to check.

---

### 2b. `images.domains` → `images.remotePatterns` (Breaking Change in Next.js 13+)

**Before:**
```js
images: {
  domains: ['api.dev.antzsystems.com']
},
```

**After:**
```js
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'api.dev.antzsystems.com'
    }
  ]
},
```

**Reason:** `images.domains` was deprecated in Next.js 12.3 and removed in Next.js 16. `remotePatterns` is the current API and provides finer-grained control (protocol, hostname, port, pathname).

**Action required if adding new image hosts:** Add a new object to the `remotePatterns` array instead of a string to the old `domains` array.

---

### 2c. Added `turbopack.resolveAlias`

```js
turbopack: {
  resolveAlias: {
    apexcharts: './node_modules/apexcharts-clevision',
    'apexcharts/dist/apexcharts.common': './node_modules/apexcharts-clevision/dist/apexcharts.common.js'
  }
},
```

**Reason:** Next.js 16 includes Turbopack as the default bundler for `next dev`. The project uses `apexcharts-clevision` (a customised fork of ApexCharts) instead of the upstream `apexcharts` package. This alias tells Turbopack to resolve any `apexcharts` import to the custom fork, matching the existing `webpack.resolve.alias` that was already in place for production builds.

The existing `webpack` alias block is kept alongside for production (`next build`) which still uses Webpack.

---

## 3. Import Path Fix (`src/lib/api/compliance/masters/index.js`)

**File:** `src/lib/api/compliance/masters/index.js`

**Before:**
```js
import { axiosGet, axiosPost } from '/src/lib/api/utility'
```

**After:**
```js
import { axiosGet, axiosPost } from '../../utility'
```

**Reason:** The absolute path `/src/lib/api/utility` was a non-standard reference that depended on the file being served from the project root in a browser-like context. This breaks in Node.js module resolution (used by Next.js during SSR/build). Replaced with a correct relative path (`../../utility`) which resolves to `src/lib/api/utility` from the file's location at `src/lib/api/compliance/masters/`.

---

## 4. Potential Issues & Actions Required

### ESLint errors now block builds
Since `eslint.ignoreDuringBuilds: true` was removed, any ESLint error will fail `next build`.

**Action:** Run `yarn lint` and resolve all reported errors before merging to main or deploying.

### Turbopack is now the default dev bundler
`next dev` uses Turbopack by default in Next.js 16. If you encounter issues with specific packages or loaders not supported by Turbopack, you can temporarily fall back to Webpack:

```bash
next dev --turbopack=false
# or
next dev --no-turbopack
```

### `remotePatterns` in other environments
If other environments (UAT, production) need to load images from additional hosts, update `remotePatterns` in `next.config.js` accordingly. The `domains` array no longer works.

---

## 5. Testing Checklist After Upgrade

- [ ] `yarn install` completes without errors
- [ ] `yarn dev` starts without errors (Turbopack)
- [ ] Charts render correctly (ApexCharts via custom fork alias)
- [ ] Images from `api.dev.antzsystems.com` load correctly
- [ ] Compliance Masters API calls succeed (import path fix)
- [ ] `yarn build` completes without ESLint errors
- [ ] All major module routes load: Hospital, Pharmacy, Housing, Diet, Lab, Necropsy, Compliance, Egg

---

## 6. Related Files

| File | Change Type |
|---|---|
| `package.json` | Dependency version pins |
| `next.config.js` | Config API updates + Turbopack alias |
| `src/lib/api/compliance/masters/index.js` | Import path fix |

---

## 7. MUI v8 Upgrade

**Date**: 2026-02-24
**Scope**: MUI Core v7.3.8 and MUI X v8.27.x upgrade with breaking changes

### 7a. Package Upgrades

| Package | Before | After |
|---|---|---|
| `@mui/material` | `^7.1.0` | `^7.3.8` |
| `@mui/system` | `^7.1.0` | `^7.3.8` |
| `@mui/icons-material` | `^7.1.0` | `^7.3.8` |
| `@mui/lab` | `^7.0.0-beta.16` | `^7.0.1-beta.22` |
| `@mui/x-data-grid` | `^6.20.4` | `^8.27.1` |
| `@mui/x-date-pickers` | `^6.20.2` | `^8.27.2` |

### 7b. Codemods Executed

**Node version**: v20.19.0 (via nvm)

```bash
npx @mui/codemod@latest v7.0.0/all src/
# Result: 61 files transformed

npx @mui/x-codemod@latest v8.0.0/preset-safe src/
# Result: 36 files transformed
```

### 7c. Breaking Changes & Fixes

#### 1. DataGrid Row Selection Model (MUI X v8)

**Issue:** `TypeError: Cannot read properties of undefined (reading 'size')` at `gridRowSelectionSelector.js`

**Root Cause:** MUI X v8 requires explicit `rowSelectionModel` state when `checkboxSelection` is enabled.

**Files Fixed:**
- `src/views/table/data-grid/TableServerSide.js`
- `src/views/table/data-grid/TableSelection.js`
- `src/views/table/data-grid/CommonTable.js`

**Changes:**
```javascript
// Add state
const [rowSelectionModel, setRowSelectionModel] = useState([])

// Pass to DataGrid
<DataGrid
  rowSelectionModel={rowSelectionModel}
  onRowSelectionModelChange={setRowSelectionModel}
  checkboxSelection
/>
```

For CommonTable (reusable component), made props conditional:
```javascript
{...(checkBoxOption && {
  onRowSelectionModelChange: onRowSelectionModelChange || (() => {}),
  rowSelectionModel: selectedRows || []
})}
```

#### 2. Conditional Columns Syntax

**Issue:** `Cannot read properties of undefined (reading 'field')`

**Root Cause:** Pattern `{...(condition && {...})}` creates empty objects `{}` in columns array when false. MUI X v8 DataGrid tries to read `field` property from empty objects.

**Before (Incorrect):**
```javascript
{
  ...(stockId === 'all' && {
    width: 200,
    field: 'store_name',
    headerName: 'Store Name',
    renderCell: params => (...)
  })
}
```

**After (Correct):**
```javascript
...(stockId === 'all'
  ? [
      {
        width: 200,
        field: 'store_name',
        headerName: 'Store Name',
        renderCell: params => (...)
      }
    ]
  : [])
```

**Files Fixed:**
- `src/pages/pharmacy/stocks/stocksReport/index.js` (2 occurrences)
- `src/pages/pharmacy/stocks/expired-medicine/index.js`
- `src/pages/pharmacy/stocks/expired-medicine/expiringStock.js`

#### 3. DataGrid Styling Issues

**Issue:** Header color changed and content not vertically aligned after upgrade.

**Root Cause:** MUI X v8 changed internal DOM structure and CSS class names.

**Fixes Applied:**

**Header Styling:**
```javascript
'& .MuiDataGrid-columnHeaders': {
  backgroundColor: theme.palette.customColors.customTableHeaderBg,
  color: theme.palette.customColors.customHeadingTextColor,
  minHeight: '56px !important',
  maxHeight: '56px !important'
},
'& .MuiDataGrid-columnHeader': {
  backgroundColor: theme.palette.customColors.customTableHeaderBg,
  color: theme.palette.customColors.customHeadingTextColor
},
'& .MuiDataGrid-columnHeaderTitle': {
  color: theme.palette.customColors.customHeadingTextColor,
  fontWeight: 500
}
```

**Cell Alignment:**
```javascript
'& .MuiDataGrid-cell': {
  display: 'flex',
  alignItems: 'center',
  lineHeight: 'normal'  // Critical: Overrides default line-height calculation
}
```

**Column Header Alignment:**
```javascript
'& .MuiDataGrid-columnHeader--alignCenter .MuiDataGrid-columnHeaderDraggableContainer': {
  justifyContent: 'center'
},
'& .MuiDataGrid-columnHeader--alignRight .MuiDataGrid-columnHeaderDraggableContainer': {
  justifyContent: 'flex-end'
}
```

**Sort Button Styling:**
```javascript
'& .MuiDataGrid-menuIcon': {
  visibility: 'visible',
  width: 'auto'
},
'& .MuiDataGrid-iconButtonContainer': {
  visibility: 'visible',
  width: 'auto'
},
'& .MuiDataGrid-menuIconButton': {
  backgroundColor: 'transparent',
  color: theme.palette.customColors.customHeadingTextColor,
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  }
}
```

**Files Updated:**
- `src/views/table/data-grid/CommonTable.js`
- `src/views/table/data-grid/TableServerSide.js`
- `src/views/table/data-grid/TableSelection.js`

#### 4. Line-Height Alignment Issue

**Issue:** Product names and generic names not vertically aligned in DataGrid cells.

**Root Cause:** DataGrid's default CSS has `line-height: calc(var(--height) - 1px)` which interfered with flex alignment.

**Fix:** Added `lineHeight: 'normal'` to all DataGrid cell styles (already included in section 3 above).

### 7d. Modified Files Summary

**Core Table Components:**
- `src/views/table/data-grid/CommonTable.js`
- `src/views/table/data-grid/TableServerSide.js`
- `src/views/table/data-grid/TableSelection.js`

**Pharmacy Stock Pages:**
- `src/pages/pharmacy/stocks/stocksReport/index.js`
- `src/pages/pharmacy/stocks/expired-medicine/index.js`
- `src/pages/pharmacy/stocks/expired-medicine/expiringStock.js`

**Package Files:**
- `package.json`
- `eslint.config.mjs` (new, replaces `.eslintrc.json`)

### 7e. Testing Checklist After MUI Upgrade

- [ ] All DataGrid tables render without errors
- [ ] Checkbox selection works in all tables
- [ ] Conditional columns (store name) appear/hide correctly
- [ ] Header colors match theme
- [ ] Cell content is vertically centered
- [ ] Sort buttons have correct styling (transparent background)
- [ ] Product cards in pharmacy tables are properly aligned
- [ ] Date pickers work correctly
- [ ] Charts components function properly
- [ ] No console errors related to MUI components
- [ ] Test all major pages:
  - [ ] Pharmacy stocks report (all tabs)
  - [ ] Expired medicine
  - [ ] About to expire medicine
  - [ ] Daily reports
  - [ ] Hospital module tables
  - [ ] Diet module tables

### 7f. Important Notes

1. **Theme Colors Only:** All styling uses theme colors (`theme.palette.*`), no hardcoded colors.

2. **Codemod Limitations:** Codemods don't handle all cases (props spreading, cross-file dependencies). Manual fixes were required for:
   - Row selection model state
   - Conditional column syntax
   - Custom styling overrides

3. **ESLint Config:** MUI codemods created `eslint.config.mjs` (flat config format). Ensure this doesn't conflict with existing ESLint setup.

4. **Node Version:** MUI v8 codemods require Node 18+. Used Node v20.19.0 for this migration.

---

## 8. DataGrid Standardization & Bug Fixes

**Date**: 2026-02-26
**Scope**: CommonTable component improvements, pagination fixes, header alignment, and DataGrid to CommonTable migration across modules

### 8a. CommonTable Component Improvements

#### Fixed Pagination Model Fallback

**Issue:** `TypeError: Cannot read properties of undefined (reading 'size')` when paginationModel is undefined.

**Root Cause:** DataGrid in MUI X v8 requires a valid pagination object even when pagination is disabled.

**Fix Applied:**
```javascript
// In CommonTable.js
paginationModel={disablePagination ? undefined : paginationModel || { page: 0, pageSize: 50 }}
```

**File Updated:**
- `src/views/table/data-grid/CommonTable.js` (line 161)

#### Fixed Header Vertical Alignment

**Issue:** DataGrid column headers and their content were not vertically centered.

**Root Cause:** MUI X v8 changed the header DOM structure, requiring explicit flex alignment.

**Fix Applied:**
```javascript
'& .MuiDataGrid-columnHeader': {
  backgroundColor: theme.palette.customColors.customTableHeaderBg,
  color: theme.palette.customColors.customHeadingTextColor,
  display: 'flex',
  alignItems: 'center'
},
'& .MuiDataGrid-columnHeaderTitle': {
  color: theme.palette.customColors.customHeadingTextColor,
  fontWeight: 500,
  lineHeight: 'normal'
},
'& .MuiDataGrid-columnHeaderTitleContainer': {
  display: 'flex',
  alignItems: 'center'
}
```

**File Updated:**
- `src/views/table/data-grid/CommonTable.js` (lines 52-66)

### 8b. Bug Fixes

#### Egg Dashboard Syntax Errors

**Issue:** Duplicate `sortable` property syntax causing parse errors.

**Error:** `Unexpected token ':'. Expected identifier, string literal, numeric literal or [ for the computed key`

**Files Fixed:**
- `src/views/pages/egg/eggDashboard/species.js`
  - Fixed 27 instances of `sortable: true,: true,` → `sortable: true,`
  - Fixed 7 instances of `sortable: false,: true,` → `sortable: false,`

### 8c. DataGrid to CommonTable Migration

To ensure consistency, maintainability, and centralized styling across all modules, all standalone DataGrid components were migrated to use the CommonTable reusable component.

#### Parivesh Module (7 files converted)

**New Entries & Overview:**
1. `src/pages/parivesh/home/new-entries/index.js`
   - Maintains custom `updateSelectAllState` in pagination handler
   - Server-side pagination enabled

2. `src/pages/parivesh/home/overview/organization/index.js`
   - Server-side pagination and sorting
   - Search functionality

**Batch Management:**
3. `src/pages/parivesh/home/[id]/batch-details/index.js`
   - Pagination disabled (shows all records)
   - Custom page size based on total

4. `src/pages/parivesh/home/[id]/reported-batches/index.js`
   - Server-side pagination enabled
   - Sort and search functionality

5. `src/pages/parivesh/home/[id]/submitted-batches/index.js`
   - Server-side pagination enabled
   - Cell click handlers preserved

**Species Management:**
6. `src/pages/parivesh/species/index.js`
   - Custom row height (80px)
   - Custom hover styles for cells (green border on hover)
   - Server-side pagination and sorting

7. `src/pages/parivesh/species/[id]/species-details/index.js`
   - Server-side pagination enabled
   - Search and sort functionality

#### Medical Module (4 files converted)

**Complaints Master:**
1. `src/pages/medical/masters/complaints/index.js`
   - **Pagination disabled** (shows all categories)
   - Search functionality maintained

2. `src/pages/medical/masters/complaints/[id]/index.js`
   - **Pagination enabled** (symptoms list)
   - Server-side pagination and sorting

**Diagnosis Master:**
3. `src/pages/medical/masters/diagnosis/index.js`
   - **Pagination disabled** (shows all categories)
   - Search functionality maintained

4. `src/pages/medical/masters/diagnosis/[id]/index.js`
   - **Pagination enabled** (diagnosis list)
   - Server-side pagination and sorting

### 8d. Migration Pattern Used

**Before (DataGrid):**
```javascript
import { DataGrid } from '@mui/x-data-grid'

<DataGrid
  disableColumnMenu
  disableColumnFilter
  sx={{ /* custom styles */ }}
  columnVisibilityModel={{ sl_no: false }}
  hideFooterSelectedRowCount
  disableColumnSelector={true}
  autoHeight
  pagination
  rows={indexedRows === undefined ? [] : indexedRows}
  rowCount={total}
  columns={columns}
  sortingMode='server'
  paginationMode='server'
  pageSizeOptions={[7, 10, 25, 50]}
  paginationModel={paginationModel}
  onSortModelChange={handleSortModel}
  slots={{ toolbar: ServerSideToolbarWithFilter }}
  onPaginationModelChange={setPaginationModel}
  loading={loading}
  slotProps={{ /* ... */ }}
  onCellClick={onCellClick}
/>
```

**After (CommonTable):**
```javascript
import CommonTable from 'src/views/table/data-grid/CommonTable'

<CommonTable
  indexedRows={indexedRows === undefined ? [] : indexedRows}
  total={total}
  columns={columns}
  paginationModel={paginationModel}
  handleSortModel={handleSortModel}
  setPaginationModel={setPaginationModel}
  pageSizeOptions={[7, 10, 25, 50]}
  loading={loading}
  searchValue={searchValue}
  handleSearch={handleSearch}
  onCellClick={onCellClick}
  columnVisibilityModel={{ sl_no: false }}
  // For pagination disabled pages:
  disablePagination={true}
  hideFooterPagination={true}
  // For custom styling:
  externalTableStyle={{ /* custom styles */ }}
/>
```

### 8e. Benefits of Migration

1. **Consistent Styling:** All tables now use centralized theme colors and styling from CommonTable
2. **Built-in Error Handling:** Pagination model fallback prevents undefined errors
3. **Vertical Alignment:** Headers and content properly aligned across all tables
4. **Easier Maintenance:** Single source of truth for table styling and behavior
5. **Reduced Code Duplication:** Less boilerplate in individual pages
6. **Custom Behaviors Preserved:** All custom pagination handlers, cell clicks, and styling maintained

### 8f. Files Modified Summary

**Core Components:**
- `src/views/table/data-grid/CommonTable.js` (pagination fallback + header alignment)

**Egg Module:**
- `src/views/pages/egg/eggDashboard/species.js` (syntax errors fixed)
- `src/pages/parivesh/species/index.js` (converted to CommonTable)

**Parivesh Module (7 files):**
- `src/pages/parivesh/home/new-entries/index.js`
- `src/pages/parivesh/home/overview/organization/index.js`
- `src/pages/parivesh/home/[id]/batch-details/index.js`
- `src/pages/parivesh/home/[id]/reported-batches/index.js`
- `src/pages/parivesh/home/[id]/submitted-batches/index.js`
- `src/pages/parivesh/species/index.js`
- `src/pages/parivesh/species/[id]/species-details/index.js`

**Medical Module (4 files):**
- `src/pages/medical/masters/complaints/index.js`
- `src/pages/medical/masters/complaints/[id]/index.js`
- `src/pages/medical/masters/diagnosis/index.js`
- `src/pages/medical/masters/diagnosis/[id]/index.js`

### 8g. Testing Checklist

- [ ] All DataGrid tables render without errors
- [ ] Pagination works correctly on all pages
- [ ] Header content is vertically centered
- [ ] Search functionality works across all modules
- [ ] Sort functionality works correctly
- [ ] Cell click handlers function properly
- [ ] Custom row heights are preserved (Parivesh species: 80px)
- [ ] Custom hover styles work (Parivesh species: green border)
- [ ] Pagination-disabled tables show all records
- [ ] No console errors related to pagination or DataGrid
- [ ] Test pages across modules:
  - [ ] Parivesh: New Entries, Batch Management, Species
  - [ ] Medical: Complaints & Diagnosis Masters
  - [ ] Egg: Dashboard Species Overview

### 8h. Important Notes

1. **Pagination Model:** Always provide a fallback to prevent undefined errors, even when pagination is disabled
2. **Custom Styling:** Use `externalTableStyle` prop instead of inline `sx` for custom DataGrid styles
3. **Preserved Handlers:** All custom `onPaginationModelChange` handlers (like `updateSelectAllState`) are maintained
4. **Disabled Pagination:** Use both `disablePagination={true}` and `hideFooterPagination={true}` for tables without pagination

---

## 9. Package Cleanup & Dependency Optimization

**Date**: 2026-02-26
**Scope**: Removal of unused dependencies to reduce bundle size and improve installation times

### 9a. Unused Dependencies Removed

After thorough codebase analysis, the following unused packages were identified and removed from `package.json`:

#### Deprecated Packages (1)
1. **`babel-eslint@10.1.0`**
   - **Reason:** Deprecated package, superseded by `@babel/eslint-parser` (already in dependencies)
   - **Impact:** None - replaced by modern alternative

#### Unused Editor/Form Libraries (3)
2. **`draft-js@0.11.7`**
   - **Reason:** No imports found in codebase
   - **Note:** Project uses `react-quill@2.0.0` instead

3. **`cleave.js@1.6.0`**
   - **Reason:** No imports found in codebase
   - **Note:** Not used for input formatting

4. **`payment@2.4.6`**
   - **Reason:** No imports found in codebase
   - **Note:** Payment-related functionality not implemented

#### Unused UI Component (1)
5. **`react-credit-cards@0.8.3`**
   - **Reason:** No imports found in codebase
   - **Note:** Credit card UI components not used

#### Unused Testing Library (1)
6. **`axios-mock-adapter@1.21.2`**
   - **Reason:** No imports found in codebase
   - **Note:** Typically used for API mocking in tests; not implemented

#### Unused Calendar Library (7 packages)
7. **`@fullcalendar/bootstrap5@6.1.4`**
8. **`@fullcalendar/common@5.11.4`**
9. **`@fullcalendar/core@6.1.4`**
10. **`@fullcalendar/daygrid@6.1.4`**
11. **`@fullcalendar/interaction@6.1.4`**
12. **`@fullcalendar/list@6.1.4`**
13. **`@fullcalendar/react@6.1.4`**
14. **`@fullcalendar/timegrid@6.1.4`**
    - **Reason:** No imports found in codebase
    - **Note:** Calendar functionality not implemented
    - **Impact:** Significant reduction (~2-3 MB)

**Total packages removed:** 14

### 9b. Resolutions Cleanup

Removed yarn resolutions for packages that no longer exist in dependencies:

```diff
- "react-credit-cards/prop-types": "15.7.2",
- "react-draft-wysiwyg/html-to-draftjs/immutable": "4.3.0",
- "react-draft-wysiwyg/draftjs-utils/immutable": "4.3.0",
```

### 9c. Overrides Cleanup

Removed package overrides that are no longer needed:

```diff
- "overrides": {
-   "react-credit-cards": {
-     "react": "$react"
-   }
- }
```

### 9d. Packages Kept for Future Use

The following package was identified as unused but **kept** for potential future implementation:

- **`@tanstack/react-table@8.21.3`**
  - **Reason:** May be used for advanced table features in the future
  - **Current Use:** Project uses MUI X DataGrid for tables

### 9e. Analysis Method

Packages were identified as unused through:

1. **Codebase Search:** Used grep to search for imports across all source files
   ```bash
   grep -r "import.*from.*'package-name'" src/ --include="*.js" --include="*.jsx"
   ```

2. **Manual Verification:** Checked actual usage context for packages with few imports

3. **Documentation Review:** Verified against project requirements and feature list

### 9f. Installation & Cleanup

After pulling these changes, run:

```bash
# Clean install to remove unused packages
rm -rf node_modules yarn.lock
yarn install

# Or if using npm
rm -rf node_modules package-lock.json
npm install
```

### 9g. Impact & Benefits

**Bundle Size Reduction:**
- **Estimated reduction:** ~5-8 MB in node_modules
- **Primary savings:** FullCalendar packages (~2-3 MB)

**Performance Improvements:**
- Faster `yarn install` / `npm install` times
- Reduced dependency tree complexity
- Smaller CI/CD build cache

**Maintenance Benefits:**
- Fewer security vulnerabilities to monitor
- Cleaner dependency audit results
- Easier to identify actual project dependencies

### 9h. Testing Checklist

After cleanup, verify:

- [ ] `yarn install` completes without errors
- [ ] `yarn dev` starts successfully
- [ ] All form components work (using react-quill, not draft-js)
- [ ] Charts render correctly (chart.js still present)
- [ ] Date pickers function properly (react-datepicker still present)
- [ ] No console errors about missing modules
- [ ] All modules load correctly:
  - [ ] Hospital
  - [ ] Pharmacy
  - [ ] Housing
  - [ ] Diet
  - [ ] Lab
  - [ ] Necropsy
  - [ ] Compliance
  - [ ] Egg
  - [ ] Parivesh
  - [ ] Medical

### 9i. Important Notes

1. **No Breaking Changes:** All removed packages were unused, so no code changes were required

2. **Future Calendar Needs:** If calendar functionality is needed in the future, consider modern alternatives like `@mui/x-date-pickers` (already installed) or lightweight alternatives to FullCalendar

3. **Table Library Choice:** Project standardized on MUI X DataGrid. If advanced table features beyond DataGrid capabilities are needed, `@tanstack/react-table` is available

4. **Lock File:** After installation, commit the new `yarn.lock` or `package-lock.json` to ensure consistent installs across team

### 9j. Modified Files

**Configuration Files:**
- `package.json` (14 dependencies removed, 3 resolutions removed, 1 override section removed)

---

## 10. Security & Dependency Updates

**Date**: 2026-02-26
**Scope**: Critical security updates (axios, jsonwebtoken), form validation improvements (@hookform/resolvers), and state management upgrade (@reduxjs/toolkit)
**Priority**: HIGH - Security vulnerabilities patched, 122 forms affected, 16 Redux slices updated

### 10a. Package Version Updates

| Package | Before | After | Reason |
|---|---|---|---|
| `axios` | `1.3.4` | `1.13.5` | Security fixes, performance improvements |
| `jsonwebtoken` | `8.5.1` | `9.0.3` | Major version upgrade, security patches |
| `@hookform/resolvers` | `2.9.11` | `5.2.2` | Form validation improvements, better error handling |
| `@reduxjs/toolkit` | `1.9.3` | `2.11.2` | Major version update, Immer 10, performance improvements |

### 10b. Breaking Changes

#### axios (1.3.4 → 1.13.5)

**Minor Breaking Changes:**
1. **Error response structure:** Error responses now have more consistent structure
2. **Request/Response interceptors:** Improved error handling in interceptors
3. **TypeScript improvements:** Better type definitions (not applicable to this project)

**No Code Changes Required:**
The project uses a centralized axios wrapper (`src/lib/api/utility/index.js`) that abstracts all axios calls, so no breaking changes affect the application code.

#### jsonwebtoken (8.5.1 → 9.0.3)

**Major Breaking Changes:**

1. **Node.js Version Requirement:**
   - **Before:** Node.js 8+
   - **After:** Node.js 12+ (currently using Node 18+, so compatible)

2. **Default Algorithm:**
   - JWT verification now requires explicit algorithm specification
   - Project impact: **NONE** - JWT is only used in API responses, not generated client-side

3. **Deprecated Options Removed:**
   - `algorithms` option is now required for `jwt.verify()`
   - Project impact: **NONE** - Project does not use jwt.verify() client-side

4. **Security Improvements:**
   - Stricter signature validation
   - Better protection against timing attacks
   - Improved error messages

**No Code Changes Required:**
The project only **receives and stores** JWT tokens from the backend API. It does not generate, sign, or verify tokens client-side.

#### @hookform/resolvers (2.9.11 → 5.2.2)

**Major Version Changes Across v3, v4, v5:**

1. **Import Path (Already Correct):**
   - Project already uses correct import: `'@hookform/resolvers/yup'`
   - No changes needed

2. **API Signature (Compatible):**
   - Basic usage unchanged: `resolver: yupResolver(schema)`
   - Advanced usage preserved: `resolver: yupResolver(schema, { context })`
   - Project impact: **NONE** - All usage patterns are compatible

3. **Error Handling Improvements:**
   - Stricter validation in v3+
   - Better async validation support in v4
   - More detailed error messages in v5
   - May surface validation issues that were previously silent

4. **Performance Improvements:**
   - Faster validation resolution
   - Better memory management
   - Optimized async validation

**No Code Changes Required:**
All 122 files using `yupResolver` are compatible with the new API. However, stricter validation may reveal issues in existing Yup schemas.

#### @reduxjs/toolkit (1.9.3 → 2.11.2)

**Major Version Changes (v1 → v2):**

1. **Immer Upgrade (v9 → v10):**
   - Stricter object freezing in development mode
   - Better performance and smaller bundle size
   - Project impact: **LOW** - May surface edge cases where state is improperly mutated

2. **Builder Callback Pattern (Already Using):**
   - Object notation for `extraReducers` deprecated
   - Project uses modern builder callback pattern everywhere ✅
   - No changes needed

3. **TypeScript Requirements:**
   - TypeScript 4.7+ required for TS projects
   - Project impact: **NONE** - JavaScript project

4. **Node.js Version:**
   - Requires Node.js 14+
   - Project impact: **NONE** - Using Node 18+

5. **react-redux Compatibility:**
   - Requires react-redux 8+
   - Project version: 8.0.5 ✅ Compatible

**No Code Changes Required:**
All 16 Redux files use modern patterns (builder callbacks, createAsyncThunk). Immer 10's stricter freezing may reveal improper state mutations but no API changes needed.

### 10c. JWT Usage in Codebase

**Token Storage & Retrieval:**

1. **`src/context/AuthContext.js`**
   - Stores JWT token in localStorage as `accessToken`
   - Retrieves token for authentication state
   - Location: Lines 21, 10-12

2. **`src/context/PariveshContext.js`**
   - Retrieves `accessToken` from localStorage
   - Passes token to API calls for Parivesh module
   - Location: Line 21

**Token Usage Pattern:**
```javascript
// Stored by backend response
localStorage.setItem('accessToken', token)

// Retrieved for API calls
const accessToken = localStorage.getItem('accessToken')
```

### 10d. Axios Usage in Codebase

**Centralized Axios Configuration:**

**File:** `src/lib/api/utility/index.js`

**Key Functions:**
1. **`GetAPIHeader()`** (Lines 8-31)
   - Builds authorization headers
   - Adds `Authorization: Bearer ${token}` header
   - Adds `ZooId` and `CurrentTimeZone` headers

2. **`axiosGet()`** (Lines 33-39)
   - GET requests with auth headers
   - Used across all modules

3. **`axiosPost()`** (Lines 41-47)
   - POST requests with auth headers
   - JSON content-type

4. **`axiosFormPost()`** (Lines 49-55)
   - POST requests with multipart/form-data
   - File upload support

5. **`axiosDelete()`** (Lines 57-63)
   - DELETE requests with auth headers

6. **`axiosAuthFormPost()`** (Lines 73-81)
   - Custom auth token override
   - Used for special authentication flows

**API Usage Pattern:**
```javascript
// All API calls use centralized wrappers
import { axiosGet, axiosPost } from 'src/lib/api/utility'

const response = await axiosGet({ url: '/endpoint', params: {...} })
const response = await axiosPost({ url: '/endpoint', body: {...} })
```

**Total API Files Using Axios:** 92 files across all modules

**Modules Covered:**
- Pharmacy (43 files)
- Hospital (15 files)
- Egg (7 files)
- Diet (8 files)
- Lab (4 files)
- Parivesh (9 files)
- Compliance (4 files)
- Necropsy (2 files)

### 10e. Form Validation Usage (@hookform/resolvers)

**Files Using yupResolver:** 122 files across all modules

**Usage Patterns:**

1. **Standard Form Validation (121 files):**
```javascript
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

const schema = yup.object().shape({
  field: yup.string().required('Required')
})

const { control, handleSubmit } = useForm({
  resolver: yupResolver(schema)
})
```

2. **Advanced Form with Context (1 file):**
```javascript
// src/pages/hospital/inpatient/AddSurgeryRecord.js
const formResolver = useMemo(
  () => yupResolver(schema, { context: { admissionDateTime } }),
  [admissionDateTime]
)

const { control } = useForm({
  resolver: formResolver
})
```

**Critical Forms by Module:**

**Pharmacy (35+ forms):**
- Purchase order forms
- Dispatch/shipment forms
- Stock adjustment forms
- Medicine configuration
- Supplier management
- Payment processing

**Hospital (30+ forms):**
- Patient admission (`AddSurgeryRecord.js` - uses context)
- Prescription management
- Anesthesia records
- Surgery records
- Patient discharge (mortality, transfer, enclosure)
- Treatment monitoring
- Staff management

**Egg (10+ forms):**
- Egg allocation
- Incubator transfers
- Nursery management
- Egg information editing
- Discard forms
- Create animal from egg

**Diet (10+ forms):**
- Recipe creation
- Ingredient management
- Diet type configuration
- Combo management
- Cut sizes and preparation types

**Lab (5+ forms):**
- Sample management
- Test configuration
- Report uploads
- Lab request forms

**Compliance (5+ forms):**
- Export permit forms
- Document uploads
- Document type management

**Housing (8+ forms):**
- Site/section/enclosure management
- Animal incidents
- Animal identifiers
- Diet uploads

**Parivesh (3+ forms):**
- Species entry
- Species management
- Batch management

**Medical (3+ forms):**
- Category management
- Diagnosis forms
- Complaints forms

**Necropsy (2+ forms):**
- Necropsy center management
- Necropsy report forms

### 10f. Redux State Management Usage (@reduxjs/toolkit)

**Files Using Redux Toolkit:** 16 files (15 slices + 1 store configuration)

**Store Configuration:**

```javascript
// src/store/store.js
import { configureStore } from '@reduxjs/toolkit'

const store = configureStore({
  reducer: { /* 15 reducers */ },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false  // Disabled for non-serializable values
    })
})
```

**Redux Slices by Module:**

**Housing Module (11 slices):**
- `speciesSlice.js` - Species listing with pagination/search
- `speciesInfiniteScrollSlice.js` - Infinite scroll for species
- `sectionSlice.js` - Section management
- `sectionInfiniteScrollSlice.js` - Infinite scroll for sections
- `animalInfiniteScrollSlice.js` - Infinite scroll for animals
- `animalTreatmentSlice.js` - Animal treatment tracking
- `notesSlice.js` - Notes management
- `mediaSlice.js` - Media management
- `mortalitySlice.js` - Mortality tracking
- `insightsSlice.js` - Housing insights/analytics
- `sitesAnalyticsSlice.js` - Site analytics data

**Pharmacy Module (1 slice):**
- `shipmentSlice.js` - Shipment request management

**Necropsy Module (2 slices):**
- `necropsySlice.js` - Necropsy data management
- `necropsyFormOptionsSlice.js` - Form dropdown options

**Hospital Module (1 slice):**
- `hospitalSlice.js` - Hospital state management

**Common Patterns Used:**

1. **Async Thunks with Error Handling:**
```javascript
export const fetchSpecies = createAsyncThunk(
  'species-list',
  async (params, { getState, rejectWithValue }) => {
    try {
      const response = await getAllSpeciesList(params)
      return { list: response?.data?.listing || [], total: response?.data?.total || 0 }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch')
    }
  }
)
```

2. **Builder Callback Pattern (Modern):**
```javascript
extraReducers: builder => {
  builder
    .addCase(fetchSpecies.pending, state => {
      state.loading = true
      state.error = null
    })
    .addCase(fetchSpecies.fulfilled, (state, action) => {
      state.loading = false
      state.list = action.payload.list
    })
    .addCase(fetchSpecies.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })
}
```

3. **Immer-based State Mutations:**
```javascript
reducers: {
  setParams: (state, action) => {
    Object.assign(state, action.payload)  // Direct mutation via Immer
  },
  clearSpecies: state => {
    state.list = []  // Direct mutation via Immer
    state.total = 0
  }
}
```

**Redux Hooks Usage (7 files):**
- `src/hooks/necropsy/useNecropsyList.js`
- `src/hooks/necropsy/useNecropsyFormOptions.js`
- `src/hooks/necropsy/useNecropsyCenter.js`
- `src/components/pharmacy/allStoresRequests/ShipmentRequests.js`
- `src/components/pharmacy/allStoresRequests/ShipRequestedItems.js`
- `src/components/housing/sites/notesListng.js`
- `src/context/AuthContext.js`

### 10g. Testing Requirements

**Priority 1: Authentication Flow**
- [ ] Login functionality works correctly
- [ ] Token is stored in localStorage after login
- [ ] Token is retrieved and attached to API requests
- [ ] Token refresh mechanism works (if implemented)
- [ ] Logout clears token from localStorage
- [ ] Unauthorized (401) responses handled correctly

**Priority 2: Redux State Management**
- [ ] Store configures without errors
- [ ] All slices load correctly
- [ ] Reducers update state properly
- [ ] Async thunks dispatch correctly (pending/fulfilled/rejected)
- [ ] Loading states work (pending → fulfilled/rejected)
- [ ] Error handling in thunks works
- [ ] State mutations via Immer work correctly
- [ ] useDispatch and useSelector hooks work
- [ ] No frozen object errors in development mode

**Priority 3: Form Validation**
- [ ] Forms load without validation errors
- [ ] Required field validation works
- [ ] Field type validation works (email, number, date)
- [ ] Custom validation rules work correctly
- [ ] Async validation works (if applicable)
- [ ] Error messages display correctly
- [ ] Form submission works after validation passes
- [ ] Context-based validation works (AddSurgeryRecord.js)

**Priority 4: API Request/Response**
- [ ] All GET requests succeed with proper authorization
- [ ] All POST requests succeed with proper authorization
- [ ] All DELETE requests succeed with proper authorization
- [ ] File upload requests work (axiosFormPost)
- [ ] Error responses are handled consistently
- [ ] Network errors display appropriate messages

**Priority 5: Module-Specific Testing**

Test critical features in each module:

**Housing Module (Heavy Redux Usage - 11 slices):**
- [ ] Species listing and pagination (speciesSlice)
- [ ] Species infinite scroll (speciesInfiniteScrollSlice)
- [ ] Section management (sectionSlice)
- [ ] Section infinite scroll (sectionInfiniteScrollSlice)
- [ ] Animal infinite scroll (animalInfiniteScrollSlice)
- [ ] Animal treatment tracking (animalTreatmentSlice)
- [ ] Notes management (notesSlice)
- [ ] Media uploads and display (mediaSlice)
- [ ] Mortality tracking (mortalitySlice)
- [ ] Housing insights/analytics (insightsSlice)
- [ ] Sites analytics (sitesAnalyticsSlice)

**Pharmacy:**
- [ ] Stock listing and reports
- [ ] Medicine search and selection
- [ ] Purchase and dispatch flows
- [ ] Supplier management
- [ ] Shipment requests (shipmentSlice - Redux)

**Hospital:**
- [ ] Patient admission/discharge
- [ ] Prescription creation
- [ ] Medical records access
- [ ] Treatment monitoring
- [ ] Hospital state management (hospitalSlice - Redux)

**Necropsy:**
- [ ] Necropsy report creation (necropsySlice - Redux)
- [ ] Template management
- [ ] Form dropdown options (necropsyFormOptionsSlice - Redux)

**Egg:**
- [ ] Dashboard data loading
- [ ] Egg collection tracking
- [ ] Species management
- [ ] Transfer operations

**Parivesh:**
- [ ] Organization listing (uses explicit accessToken)
- [ ] Batch submissions
- [ ] Species entry management
- [ ] Document uploads

**Diet:**
- [ ] Feed scheduling
- [ ] Recipe management
- [ ] Ingredient tracking

**Lab:**
- [ ] Lab request creation
- [ ] Sample tracking
- [ ] Results entry

**Compliance:**
- [ ] Import/export tracking
- [ ] Shipment management

### 10h. Files Requiring Testing

**Critical Files (Authentication & Core):**
1. `src/context/AuthContext.js` - JWT storage and retrieval
2. `src/context/PariveshContext.js` - Organization API with explicit token
3. `src/lib/api/utility/index.js` - All axios wrapper functions
4. `src/lib/api/auth.js` - Token refresh endpoint

**Redux Store & Slices (State Management):**
5. `src/store/store.js` - Store configuration
6. `src/store/slices/housing/speciesSlice.js` - Species listing (async thunk)
7. `src/store/slices/housing/speciesInfiniteScrollSlice.js` - Infinite scroll pattern
8. `src/store/slices/housing/sectionSlice.js` - Section management
9. `src/store/slices/necropsy/necropsySlice.js` - Necropsy state
10. `src/store/slices/necropsy/necropsyFormOptionsSlice.js` - Form options
11. `src/store/slices/pharmacy/request/shipmentSlice.js` - Shipment requests
12. `src/store/slices/hospital/hospitalSlice.js` - Hospital state
13. All other housing slices (8 remaining)

**Redux Hooks (Components Using Redux):**
14. `src/hooks/necropsy/useNecropsyList.js`
15. `src/hooks/necropsy/useNecropsyFormOptions.js`
16. `src/components/pharmacy/allStoresRequests/ShipmentRequests.js`
17. `src/components/housing/sites/notesListng.js`

**Critical Forms (Form Validation):**
18. `src/pages/hospital/inpatient/AddSurgeryRecord.js` - Uses context validation (most complex)
19. `src/components/pharmacy/purchase/AddPurchaseForm.js` - Purchase orders
20. `src/components/hospital/PatientAdmissionForm/PatientAdmitForm.js` - Patient admission
21. `src/components/compliance/forms/ExportPermitForm.js` - Compliance forms
22. `src/components/egg/EditEggInfo.js` - Egg management
23. `src/views/pages/diet/add-diet/StepBasicDetails.js` - Diet creation

**Login/Authentication Pages:**
24. Login page component (location TBD - search for login form)
25. Protected route wrapper (location TBD - search for auth guards)

**High-Traffic API Endpoints:**
26. Dashboard pages (all modules)
27. List/table pages (all modules - many use Redux for state)
28. Form submission pages (all 122 forms)
29. File upload pages (Parivesh, Hospital, Necropsy)

### 10i. Installation & Verification

**Step 1: Install Updated Packages**
```bash
# Clean install recommended for major version updates
rm -rf node_modules yarn.lock
yarn install

# Or with npm
rm -rf node_modules package-lock.json
npm install
```

**Step 2: Verify Package Versions**
```bash
# Check installed versions
npm list axios jsonwebtoken

# Expected output:
# axios@1.13.5
# jsonwebtoken@9.0.3
```

**Step 3: Run Development Server**
```bash
yarn dev
```

**Step 4: Test Authentication**
1. Open browser dev tools → Network tab
2. Login to application
3. Verify JWT token stored in localStorage
4. Navigate to any module
5. Verify API requests include `Authorization: Bearer <token>` header
6. Verify responses are successful (200/201 status codes)

### 10j. Rollback Plan

If critical issues are discovered after deployment:

**Immediate Rollback:**
```bash
# Revert package.json changes
git checkout HEAD~1 package.json

# Reinstall previous versions
rm -rf node_modules yarn.lock
yarn install

# Restart application
yarn dev
```

**Specific Package Rollback:**
```bash
# Rollback only axios
yarn add axios@1.3.4

# Or rollback only jsonwebtoken
yarn add jsonwebtoken@8.5.1

# Or rollback only @hookform/resolvers
yarn add @hookform/resolvers@2.9.11

# Or rollback only @reduxjs/toolkit
yarn add @reduxjs/toolkit@1.9.3

# Then restart
yarn dev
```

### 10k. Security & Performance Benefits

**axios 1.13.5:**
- Fixes for potential prototype pollution vulnerabilities
- Improved SSRF (Server-Side Request Forgery) protection
- Better handling of malformed URLs
- Enhanced security headers handling
- CVE patches for versions 1.3.x - 1.12.x

**jsonwebtoken 9.0.3:**
- Stricter signature validation prevents bypass attacks
- Protection against timing-based attacks
- Fixes for token manipulation vulnerabilities
- Better error handling prevents information disclosure
- CVE patches for versions 8.x

**@hookform/resolvers 5.2.2:**
- Faster validation resolution and better performance
- Improved async validation support
- More detailed and helpful error messages
- Better memory management for complex forms
- Stricter validation catches edge cases
- Enhanced TypeScript support (future-proofing)

**@reduxjs/toolkit 2.11.2:**
- Immer 10: Faster state updates, smaller bundle size
- Better performance with improved middleware
- Stricter development mode checks catch bugs earlier
- Auto-batching for multiple state updates
- Better DevTools integration
- New features: listener middleware, dynamic middleware, combineSlices

### 10l. Modified Files

**Configuration:**
- `package.json` (4 dependencies updated)

**No Code Changes Required:**
- Centralized axios wrapper abstracts breaking changes
- JWT is only received/stored, not generated client-side
- All existing code remains compatible
- 122 form files use compatible yupResolver API
- 16 Redux files use modern patterns (builder callbacks)

### 10m. Important Notes

1. **No Breaking Changes in Application Code:** All four package updates maintain backward compatibility:
   - axios: Centralized wrapper abstracts breaking changes
   - jsonwebtoken: Only receives/stores tokens, doesn't generate them
   - @hookform/resolvers: API signature unchanged, all usage patterns compatible
   - @reduxjs/toolkit: Already using modern builder pattern, Immer handles state mutations

2. **JWT Client-Side Usage:** This project only **receives and stores** JWT tokens. It does not generate, sign, or verify tokens, so jsonwebtoken v9 breaking changes do not affect the codebase.

3. **Axios Centralization:** The `src/lib/api/utility/index.js` wrapper provides a single point of control for all HTTP requests, making the application resilient to axios version changes.

4. **Form Validation Impact:** The @hookform/resolvers update affects 122 form files. While API-compatible, stricter validation may reveal previously silent schema errors. Test critical forms first.

5. **Redux State Management:** The @reduxjs/toolkit update affects 16 files (mostly in Housing module). Immer 10 is stricter about frozen objects in development mode, which may surface improper state mutations. All code uses proper patterns, but test thoroughly.

6. **Context-Based Validation:** The `AddSurgeryRecord.js` file uses advanced context-based validation. This should be tested specifically as it's the most complex form validation pattern.

7. **Infinite Scroll Patterns:** Three housing slices use infinite scroll patterns (species, sections, animals). Test these specifically as they have complex state management.

8. **Token Storage Security:** Consider migrating from `localStorage` to `httpOnly` cookies in a future update for enhanced XSS protection (requires backend changes).

9. **Backward Compatibility:** All four updates maintain backward compatibility for this project's use cases. No code changes are required.

10. **Dependency Audit:** Run `yarn audit` or `npm audit` after installation to verify all vulnerabilities are resolved.

### 10n. Post-Update Verification Checklist

**Immediate Verification:**
- [ ] `yarn install` completes without errors
- [ ] No peer dependency warnings
- [ ] `yarn dev` starts successfully
- [ ] No console errors on startup

**Authentication Testing:**
- [ ] Can login successfully
- [ ] Token stored in localStorage
- [ ] Token attached to API requests (check Network tab)
- [ ] Protected routes accessible after login
- [ ] Can logout successfully

**Redux State Management Testing:**
- [ ] Redux store initializes without errors
- [ ] No console errors about frozen objects or Immer violations
- [ ] Species listing loads correctly (speciesSlice)
- [ ] Infinite scroll works for species/sections/animals
- [ ] Async thunks dispatch properly (check loading states)
- [ ] Error handling works in async thunks
- [ ] State updates correctly via reducers
- [ ] useDispatch and useSelector hooks work in components
- [ ] Necropsy form options load correctly
- [ ] Shipment requests state management works
- [ ] Hospital state persists correctly

**Form Validation Testing:**
- [ ] Open critical forms without validation errors
- [ ] Test required field validation (leave fields empty, submit)
- [ ] Test field type validation (enter invalid email, dates, numbers)
- [ ] Test custom validation rules specific to each form
- [ ] Verify error messages display correctly
- [ ] Test AddSurgeryRecord.js with context-based validation
- [ ] Test form submission after fixing validation errors
- [ ] Verify forms in all modules:
  - [ ] Pharmacy purchase/dispatch forms
  - [ ] Hospital admission/prescription forms
  - [ ] Egg allocation/transfer forms
  - [ ] Diet recipe/ingredient forms
  - [ ] Compliance export permit forms

**Module Testing:**
- [ ] Pharmacy module loads and functions
- [ ] Hospital module loads and functions
- [ ] Egg module loads and functions
- [ ] Parivesh module loads and functions
- [ ] Diet module loads and functions
- [ ] Lab module loads and functions
- [ ] Necropsy module loads and functions
- [ ] Compliance module loads and functions
- [ ] Medical module loads and functions

**API Testing:**
- [ ] GET requests succeed
- [ ] POST requests succeed
- [ ] DELETE requests succeed
- [ ] File uploads work (multipart/form-data)
- [ ] Error responses handled correctly
- [ ] 401 responses trigger logout/re-authentication

**Security Verification:**
- [ ] Run `yarn audit` - no high/critical vulnerabilities
- [ ] JWT tokens properly formatted in requests
- [ ] Authorization headers present in all authenticated requests
- [ ] Token refresh works (if implemented)

---

## 11. Future Updates - NOT Included in This Migration

### react-datepicker (4.10.0 → 9.1.0) - DEFERRED

**Status**: ⚠️ **NOT UPDATED** - Deferred to future migration cycle

**Reason for Deferral**: High risk update affecting 62 files, requires additional dependency update (date-fns v3), and needs dedicated testing cycle.

#### 11a. Impact Analysis

**Files Affected:** 62 files across all modules

**Dependencies Required:**
- `react-datepicker`: 4.10.0 → 9.1.0
- `date-fns`: 2.29.3 → 3.0.0 (REQUIRED - breaking changes)

**Modules Using DatePicker:**
- Hospital (15 files) - Patient admission, surgery records, prescriptions
- Pharmacy (10 files) - Purchase orders, shipments, payments, dashboard filters
- Parivesh (15 files) - Birth/death entries, transfers, acquisitions
- Egg (5 files) - Collection dates, transfers, dashboard
- Housing (5 files) - Mortality dates, incidents, journal filters
- Compliance (3 files) - Document dates, export permits
- Necropsy (2 files) - Report dates
- Diet (2 files) - Species diet mapping

**Custom Components:**
- `SingleDatePicker.js` - Single date selection
- `CustomDateRangePicker.js` - Date range picker
- `MultipleDatePicker.js` - Multi-month date range
- `DatePickerWrapper` - Custom styled wrapper with theme integration

#### 11b. Breaking Changes Identified

**Critical Breaking Changes:**

1. **date-fns v3 Required**
   - Current: v2.29.3
   - Required: v3.0.0+
   - Impact: date-fns itself has breaking changes in v3
   - Files affected: 3 reusable components using date-fns functions

2. **`showIcon` Prop Removed**
   - Used in: `SingleDatePicker.js`
   - Workaround: Already using `customInput` with icon, likely compatible
   - Needs verification

3. **CSS Class Names Changed**
   - Impact: Extensive custom styles in `DatePickerWrapper`
   - Selectors: `.react-datepicker__header`, `.react-datepicker__month`, etc.
   - Risk: Custom theme styling may break

4. **Custom Input Component API Changes**
   - All custom input components need verification
   - `forwardRef` pattern may receive different props

5. **Popper Positioning Changes**
   - Current usage: `popperProps={{ strategy: 'fixed' }}`
   - May need adjustment for correct positioning

**Compatible Features:**
- ✅ React 19.2.4 (requires React 18+)
- ✅ `selectsRange` prop for range selection
- ✅ `customInput` prop for custom components
- ✅ Basic date format strings

#### 11c. Why This Update is High Risk

1. **Large Surface Area:** 62 files across 8 modules
2. **Critical Forms:** Hospital admissions, pharmacy orders, compliance documents
3. **Dependent Update:** Requires date-fns v3 which has own breaking changes
4. **Custom Styling:** Extensive theme integration may break with new CSS classes
5. **Complex Components:** Range pickers, multi-month displays, custom inputs

#### 11d. Recommended Update Strategy

**When to Update:**
- After current 4 package updates (axios, jwt, hookform, redux) are stable
- Create dedicated migration branch
- Allocate 2-3 days for comprehensive testing

**Step-by-Step Plan:**

**Phase 1: Preparation**
1. Research date-fns v3 breaking changes
2. Review react-datepicker v9 changelog
3. Identify all custom styles that may break
4. Create test checklist for all 62 files

**Phase 2: Update Dependencies**
```bash
# Create migration branch
git checkout -b migration/react-datepicker-v9

# Update both packages together
yarn add react-datepicker@9.1.0 date-fns@3.0.0
```

**Phase 3: Fix Breaking Changes**
1. Update date-fns imports if needed (v2 → v3)
2. Remove `showIcon` prop if causes errors
3. Verify custom input components
4. Fix custom CSS selectors
5. Test popper positioning

**Phase 4: Module-by-Module Testing**
1. Start with Hospital module (most critical)
2. Then Pharmacy (complex date ranges)
3. Parivesh, Egg, Housing, Compliance
4. Diet, Necropsy (fewer instances)

**Phase 5: Comprehensive Verification**
- All date pickers render correctly
- Date formatting displays properly
- Range selection works
- Custom icons show
- Theme styling applies
- Dark mode works (if applicable)

**Rollback Plan:**
```bash
yarn add react-datepicker@4.10.0 date-fns@2.29.3
yarn dev
```

#### 11e. Testing Checklist (For Future Migration)

**Core Components:**
- [ ] `SingleDatePicker.js` - Single date selection
- [ ] `CustomDateRangePicker.js` - Date range selection
- [ ] `MultipleDatePicker.js` - Multi-month display
- [ ] `DatePickerWrapper` - Custom styles apply
- [ ] Icons display correctly
- [ ] Popper positioning correct

**date-fns Integration:**
- [ ] `format()` function works
- [ ] `addDays()` function works
- [ ] `addMonths()` and `subMonths()` work
- [ ] Date calculations correct
- [ ] No import errors from date-fns v3

**Module Testing:**
- [ ] Hospital: Patient admission dates
- [ ] Hospital: Surgery record date/time
- [ ] Pharmacy: Purchase order dates
- [ ] Pharmacy: Dashboard date filters
- [ ] Parivesh: Birth/death/transfer dates
- [ ] Egg: Collection and transfer dates
- [ ] Housing: Mortality and incident dates
- [ ] Compliance: Document and permit dates
- [ ] Necropsy: Report dates
- [ ] Diet: Species diet dates

**Styling:**
- [ ] DatePicker matches theme colors
- [ ] Selected dates highlighted
- [ ] Month/year navigation styled
- [ ] Today's date indicator correct
- [ ] Disabled dates styled properly
- [ ] Range selection visual feedback

#### 11f. Files Requiring Testing (All 62 Files)

**Hospital Module (15 files):**
1. `src/pages/hospital/inpatient/AddSurgeryRecord.js`
2. `src/components/hospital/PatientAdmissionForm/PatientAdmitForm.js`
3. `src/components/hospital/AddPatientForm/AddPatientForm.js`
4. `src/components/hospital/drawer/AddPatientDrawer.js`
5. `src/components/hospital/inpatient/OtherTreatments/AddTreatmentDrawer.js`
6. `src/components/hospital/inpatient/OtherTreatments/EditTreatmentDrawer.js`
7. `src/views/pages/hospital/prescription-monitoring/ScheduleMedicine.js`
8. `src/views/pages/hospital/treatment-monitoring/AddScheduleDrawer.js`
9. `src/views/pages/hospital/inpatient/InpatientDischarge.js`
10. `src/views/pages/hospital/inpatient/discharge/TransferDischargeForm.js`
11. `src/views/pages/hospital/inpatient/discharge/EnclosureDischargeForm.js`
12. `src/views/pages/hospital/inpatient/discharge/MortalityDischargeForm.js`
13-15. (Additional hospital forms)

**Pharmacy Module (10 files):**
1. `src/components/pharmacy/purchase/AddPurchaseForm.js`
2. `src/components/pharmacy/purchase/AddExistingPurchase.js`
3. `src/components/pharmacy/request/AddRequestForm.js`
4. `src/components/pharmacy/request/ShipRequestForm.js`
5. `src/components/pharmacy/return/ShipRequestForm.js`
6. `src/components/pharmacy/localDispatch/AddRequestForm.js`
7. `src/components/pharmacy/localDispatch/ShipRequestForm.js`
8. `src/components/pharmacy/dashBoard/RequestChart.js`
9. `src/components/pharmacy/dashBoard/RequestSentChart.js`
10. `src/components/pharmacy/dashBoard/StoreWisePendingRequestsChart.js`
11. (Additional pharmacy components)

**Parivesh Module (15 files):**
1. `src/views/pages/parivesh/addNewEntries/BirthFields.js`
2. `src/views/pages/parivesh/addNewEntries/DeathFields.js`
3. `src/views/pages/parivesh/addNewEntries/TransferFields.js`
4. `src/views/pages/parivesh/addNewEntries/AcquisitionFields.js`
5. `src/views/pages/parivesh/editNewEntries/EditBirthFields.js`
6. `src/views/pages/parivesh/editNewEntries/EditDeathFields.js`
7. `src/views/pages/parivesh/editNewEntries/EditTransferFields.js`
8. `src/views/pages/parivesh/editNewEntries/EditAcuisitionFields.js`
9-15. (Additional Parivesh forms)

**Other Modules:**
- Egg Module (5 files)
- Housing Module (5 files)
- Compliance Module (3 files)
- Necropsy Module (2 files)
- Diet Module (2 files)

#### 11g. External Resources for Future Migration

**Documentation:**
- [react-datepicker v9 Migration Guide](https://github.com/Hacker0x01/react-datepicker)
- [date-fns v3 Upgrade Guide](https://date-fns.org/v3.0.0/docs/Upgrade-Guide)
- [react-datepicker v9 Changelog](https://github.com/Hacker0x01/react-datepicker/blob/main/CHANGELOG.md)

**Key Changes to Review:**
- date-fns v3 breaking changes (import syntax, function signatures)
- react-datepicker v9 CSS class name changes
- New accessibility features and ARIA attributes
- Performance improvements and re-render optimizations

#### 11h. Important Notes

1. **Do NOT update react-datepicker until current updates are stable**
2. **Must update date-fns to v3 simultaneously** (breaking changes in both)
3. **Allocate dedicated time for testing** (2-3 days minimum)
4. **Test in development environment first** before staging
5. **Consider creating visual regression tests** for date picker styling
6. **Hospital and Pharmacy modules are highest priority** (most critical dates)

---

## References

- [Next.js 16 Release Notes](https://nextjs.org/blog)
- [Next.js `remotePatterns` docs](https://nextjs.org/docs/app/api-reference/components/image#remotepatterns)
- [Next.js Turbopack docs](https://nextjs.org/docs/app/api-reference/turbopack)
- [Next.js ESLint configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/eslint)
- [MUI v7 Migration Guide](https://mui.com/material-ui/migration/migration-v6/)
- [MUI X v8 Migration Guide](https://mui.com/x/migration/migration-data-grid-v7/)
- [MUI Codemods](https://github.com/mui/material-ui/tree/master/packages/mui-codemod)
- [axios Changelog](https://github.com/axios/axios/blob/master/CHANGELOG.md)
- [jsonwebtoken Changelog](https://github.com/auth0/node-jsonwebtoken/blob/master/CHANGELOG.md)
- [axios Security Advisories](https://github.com/axios/axios/security/advisories)
- [jsonwebtoken Security Advisories](https://github.com/auth0/node-jsonwebtoken/security/advisories)
- [@reduxjs/toolkit Release Notes](https://github.com/reduxjs/redux-toolkit/releases)
- [@hookform/resolvers Changelog](https://github.com/react-hook-form/resolvers/releases)
- [react-datepicker Documentation](https://github.com/Hacker0x01/react-datepicker)
- [date-fns v3 Upgrade Guide](https://date-fns.org/v3.0.0/docs/Upgrade-Guide)
