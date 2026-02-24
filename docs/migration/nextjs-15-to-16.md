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

## References

- [Next.js 16 Release Notes](https://nextjs.org/blog)
- [Next.js `remotePatterns` docs](https://nextjs.org/docs/app/api-reference/components/image#remotepatterns)
- [Next.js Turbopack docs](https://nextjs.org/docs/app/api-reference/turbopack)
- [Next.js ESLint configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/eslint)
- [MUI v7 Migration Guide](https://mui.com/material-ui/migration/migration-v6/)
- [MUI X v8 Migration Guide](https://mui.com/x/migration/migration-data-grid-v7/)
- [MUI Codemods](https://github.com/mui/material-ui/tree/master/packages/mui-codemod)
