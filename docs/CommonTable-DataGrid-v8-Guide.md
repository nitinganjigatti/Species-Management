# CommonTable — MUI DataGrid v8 Migration & Usage Guide

**File**: `src/views/table/data-grid/CommonTable.js`
**DataGrid Version**: `@mui/x-data-grid@8.27.3`
**Date**: 2026-03-06

---

## Table of Contents

1. [What Changed (v6 → v8)](#1-what-changed-v6--v8)
2. [Props Reference](#2-props-reference)
3. [Basic Usage (No Checkbox)](#3-basic-usage-no-checkbox)
4. [Checkbox Selection Usage](#4-checkbox-selection-usage)
5. [How Selection Works Internally](#5-how-selection-works-internally)
6. [Header Select All / Deselect All](#6-header-select-all--deselect-all)
7. [Custom Row ID (`getRowId`)](#7-custom-row-id-getrowid)
8. [Previous Approach (TableServerSide)](#8-previous-approach-tableserverside)
9. [Migration: DataGrid → CommonTable](#9-migration-datagrid--commontable)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. What Changed (v6 → v8)

### Selection Model Format

| | v6 (Old) | v8 (Current) |
|---|---|---|
| **`rowSelectionModel`** | `[id1, id2, id3]` (flat array) | `{ type: 'include' \| 'exclude', ids: Set<GridRowId> }` |
| **`onRowSelectionModelChange`** | Receives `[id1, id2]` | Receives `{ type, ids: Set }` |
| **Behavior** | Grid manages selection loosely | Fully controlled, strict stable `id` required |

### What CommonTable Does

CommonTable acts as an **adapter layer** — it handles the v8 format conversion internally so that **consumers never deal with `Set` or `{ type, ids }` objects**. Consumers work with plain arrays of IDs.

```
Consumer (plain ID arrays) <--> CommonTable (converts) <--> DataGrid v8 ({ type, ids: Set })
```

### Key Changes Made

| Change | Details |
|---|---|
| Added `useMemo` + `useCallback` | For v8 selection model conversion |
| `selectionModel` (useMemo) | Converts consumer's `selectedRows` array → `{ type: 'include', ids: Set }` for DataGrid v8 |
| `handleSelectionChange` (useCallback) | Converts v8's `{ type, ids: Set }` callback → plain array of IDs for the consumer |
| `keepNonExistentRowsSelected` | Preserves checkbox state for rows not in the current page (server pagination) |
| `getRowId` prop | Handles rows without a default `id` field |

---

## 2. Props Reference

### Core Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `indexedRows` | `Array<Object>` | `[]` | Row data. Each row **must** have an `id` field (or use `getRowId`). |
| `columns` | `Array<Object>` | required | Column definitions for the DataGrid. |
| `total` | `number` | — | Total row count (for server-side pagination). |
| `loading` | `boolean` | `false` | Shows loading overlay. |

### Pagination Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `paginationModel` | `{ page, pageSize }` | `{ page: 0, pageSize: 50 }` | Current page and page size. |
| `setPaginationModel` | `function` | — | Called when user changes page/pageSize. |
| `pageSizeOptions` | `number[]` | `[7, 10, 25, 50, 100]` | Available page size options. |
| `disablePagination` | `boolean` | `false` | Disables pagination entirely (shows all rows). |
| `hideFooterPagination` | `boolean` | `false` | Hides pagination controls but keeps pagination active. |
| `hideFooter` | `boolean` | `false` | Hides the entire footer. |

### Sorting Props

| Prop | Type | Description |
|---|---|---|
| `handleSortModel` | `function` | Called when user clicks column header to sort. Receives `newModel` array. |

### Checkbox / Selection Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `checkBoxOption` | `boolean` | `false` | Enables checkbox selection column. |
| `selectedRows` | `Array` | `[]` | Currently selected rows. Accepts both **plain IDs** `[1, 2]` and **row objects** `[{ id: 1, ... }]`. |
| `onRowSelectionModelChange` | `function` | — | Called when selection changes. Receives a **plain array of IDs** (e.g. `[1, 2, 3]`). |

### Row & Cell Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `onRowClick` | `function` | `null` | Called when a row is clicked. |
| `onCellClick` | `function` | `null` | Called when a cell is clicked. |
| `rowHeight` | `number` | `52` | Height of each row in pixels. |
| `getRowHeight` | `function` | `null` | Dynamic row height function. |
| `getRowClassName` | `function` | — | Adds conditional CSS classes to rows. |
| `getRowId` | `function` | — | Custom row ID extractor. Use when rows don't have `id` field. |

### Appearance Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `maxHeight` | `string/number` | — | Max height for the scrollable area. |
| `externalTableStyle` | `object` | `{}` | Additional `sx` styles merged into the DataGrid. |
| `columnVisibilityModel` | `object` | `{}` | Controls column visibility. |

### Search Props

| Prop | Type | Description |
|---|---|---|
| `searchValue` | `string` | Current search input value. |
| `handleSearch` | `function` | Called when search input changes. |

---

## 3. Basic Usage (No Checkbox)

```jsx
import CommonTable from 'src/views/table/data-grid/CommonTable'

const MyPage = () => {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'status', headerName: 'Status', width: 120 }
  ]

  return (
    <CommonTable
      indexedRows={rows}
      total={totalCount}
      columns={columns}
      paginationModel={{ page, pageSize }}
      setPaginationModel={model => {
        setPage(model.page)
        setPageSize(model.pageSize)
      }}
      handleSortModel={handleSort}
      loading={isLoading}
      onRowClick={params => router.push(`/detail/${params.row.id}`)}
    />
  )
}
```

---

## 4. Checkbox Selection Usage

```jsx
const [selectedIds, setSelectedIds] = useState([])

<CommonTable
  indexedRows={rows}
  total={total}
  columns={columns}
  paginationModel={paginationModel}
  setPaginationModel={setPaginationModel}
  loading={loading}
  checkBoxOption={true}
  selectedRows={selectedIds}
  onRowSelectionModelChange={newIds => {
    // newIds = plain array of IDs, e.g. [1, 2, 3]
    setSelectedIds(newIds)
  }}
/>

// Check count
{selectedIds.length > 0 && <p>{selectedIds.length} items selected</p>}
```

### What `onRowSelectionModelChange` Receives

```js
// User clicks checkbox on row with id 101:
[101]

// User clicks two more rows (id 205, 310):
[101, 205, 310]

// User clicks header "Select All" (all 50 visible rows):
[101, 102, 103, ..., 150]   // all IDs on current page

// User clicks header "Deselect All":
[]
```

---

## 5. How Selection Works Internally

### Data Flow Diagram

```
 CONSUMER → CommonTable → DataGrid v8
 ========   ===========   ===========

 selectedRows = [1, 2]
       |
       v
 selectionModel (useMemo):
   Extracts IDs from the array (supports both plain IDs and row objects)
   Builds v8 format: { type: 'include', ids: Set(1, 2) }
       |
       v
 DataGrid renders checkboxes on rows 1, 2


 DataGrid v8 → CommonTable → CONSUMER
 ===========   ===========   ========

 User clicks row 3 checkbox
       |
       v
 DataGrid fires: { type: 'include', ids: Set(1, 2, 3) }
       |
       v
 handleSelectionChange (useCallback):
   type === 'include' → convert Set to array: [1, 2, 3]
       |
       v
 onRowSelectionModelChange([1, 2, 3])  → consumer gets plain ID array
```

### selectionModel (useMemo) — Consumer → DataGrid

Runs when `selectedRows` prop changes. Converts the consumer's array to v8 format:

```
Input:  selectedRows = [101, 205]        (plain IDs)
   or:  selectedRows = [{ id: 101 }, { id: 205 }]  (row objects)

Output: { type: 'include', ids: Set(101, 205) }

Result: DataGrid shows checkmarks on rows 101 and 205
```

### handleSelectionChange (useCallback) — DataGrid → Consumer

Runs when user clicks a checkbox. Converts v8 format back to a plain array:

```
Input (normal click):     { type: 'include', ids: Set(101, 205, 310) }
Output:                   [101, 205, 310]

Input (header Select All): { type: 'exclude', ids: Set() }
  → computes all visible IDs minus excluded (none excluded = all selected)
Output:                   [101, 102, 103, ..., 150]  (all IDs on current page)

Input (Select All, then uncheck row 105): { type: 'exclude', ids: Set(105) }
  → computes all visible IDs minus 105
Output:                   [101, 102, 103, 104, 106, ..., 150]
```

---

## 6. Header Select All / Deselect All

### Select All (Header checkbox click)

DataGrid v8 sends `{ type: 'exclude', ids: Set() }` — meaning "all selected, none excluded".

```
handleSelectionChange:
  type === 'exclude'
  excludedIds = Set()  (empty = nothing excluded)
  selectedIds = ALL visible row IDs from indexedRows

  onRowSelectionModelChange([all visible IDs])
```

### Deselect All (Header checkbox click again)

DataGrid v8 sends `{ type: 'include', ids: Set() }` — meaning "nothing selected".

```
handleSelectionChange:
  type === 'include', ids is empty
  selectedIds = []

  onRowSelectionModelChange([])
```

### Partial Select All with Exclusions

User clicks "Select All", then unchecks row 55:

```
DataGrid sends: { type: 'exclude', ids: Set(55) }

handleSelectionChange:
  excludedIds = Set(55)
  selectedIds = all visible IDs except 55

  onRowSelectionModelChange([...all IDs except 55])
```

---

## 7. Custom Row ID (`getRowId`)

If your API returns rows **without an `id` field**, you'll get this error:

```
MUI X: The Data Grid component requires all rows to have a unique `id` property.
```

### Fix: Use `getRowId` prop

```jsx
<CommonTable
  indexedRows={rows}
  getRowId={row => row.dispatch_item_id}
  columns={columns}
  ...
/>
```

### Or: Add `id` in your data mapping

```js
const list = response.data.items.map(item => ({
  ...item,
  id: item.dispatch_item_id
}))
```

**Recommended**: Add `id` in the data mapping (slice/API layer) so all consumers get consistent data.

---

## 8. Previous Approach (TableServerSide)

`TableServerSide.js` was the old table component. Key differences:

| Feature | TableServerSide (Old) | CommonTable (Current) |
|---|---|---|
| **Data fetching** | Built-in (`fetchTableData`) | External (consumer handles API) |
| **State management** | Internal `useState` | External (props-driven, works with Redux) |
| **Selection model** | `rowSelectionModel` as plain array | v8 adapter: converts array <-> `{ type, ids: Set }` |
| **Selection data** | IDs | IDs (plain array) |
| **Header select all** | Basic (v6 format) | Handles v8 `exclude` type |
| **Search** | Built-in toolbar slot | External via `searchValue` + `handleSearch` |
| **Styling** | Minimal | Full themed header, borders, rounded corners |
| **Custom row ID** | Not supported | `getRowId` prop |
| **Reusability** | Low (tightly coupled) | High (all state externalized) |

### Migration: TableServerSide → CommonTable

```jsx
// OLD (TableServerSide) — data fetching built in
<TableServerSide columns={columns} getCall={fetchMyData} />

// NEW (CommonTable) — you control data fetching
const [rows, setRows] = useState([])
const [total, setTotal] = useState(0)

useEffect(() => {
  fetchMyData().then(res => {
    setRows(res.data.items.map((item, i) => ({ ...item, id: item.my_id })))
    setTotal(res.data.total)
  })
}, [page, pageSize])

<CommonTable
  indexedRows={rows}
  total={total}
  columns={columns}
  paginationModel={{ page, pageSize }}
  setPaginationModel={model => { setPage(model.page); setPageSize(model.pageSize) }}
  handleSortModel={handleSort}
  loading={loading}
/>
```

---

## 9. Migration: DataGrid → CommonTable

This section covers migrating from raw MUI DataGrid v8 components to CommonTable.

### Why Migrate to CommonTable?

- **Consistent styling** across the application
- **Simplified v8 selection model** - work with plain arrays instead of `{ type, ids: Set }`
- **Centralized configuration** - pagination, sorting, and selection logic in one place
- **Better developer experience** - less boilerplate code

### Prop Mapping Reference

| DataGrid Prop | CommonTable Prop | Notes |
|---|---|---|
| `rows` | `indexedRows` | Same array of row objects with `id` field |
| `columns` | `columns` | Same column definitions |
| `loading` | `loading` | Same |
| `rowCount` | `total` | Total count for server-side pagination |
| `paginationModel` | `paginationModel` | Same `{ page, pageSize }` |
| `onPaginationModelChange` | `setPaginationModel` | Same callback |
| `sortingMode` | N/A | Always `'server'` in CommonTable |
| `paginationMode` | N/A | Always `'server'` in CommonTable |
| `onSortModelChange` | `handleSortModel` | Same callback |
| `checkboxSelection` | `checkBoxOption` | **Important:** Different prop name |
| `rowSelectionModel` | `selectedRows` | Pass plain array of IDs |
| `onRowSelectionModelChange` | `onRowSelectionModelChange` | **Important:** Receives plain array, not v8 format |
| `isRowSelectable` | ❌ Not supported | Handle in `onRowSelectionModelChange` instead |
| `onRowClick` | `onRowClick` | Same |
| `onCellClick` | `onCellClick` | Same |
| `hideFooterPagination` | `hideFooterPagination` | Same |
| `hideFooter` | `hideFooter` | Same |
| `autoHeight` | N/A | Always `true` in CommonTable |
| `disableColumnSelector` | N/A | Always `true` in CommonTable |
| `disableColumnMenu` | N/A | Always `true` in CommonTable |
| `sx` | `externalTableStyle` | Use for custom styles |
| `slotProps` | ❌ Not supported | N/A |
| `getRowId` | `getRowId` | Same - for custom row ID extraction |
| `getRowClassName` | `getRowClassName` | Same - for conditional row styling |
| `rowHeight` | `rowHeight` | Default is `52` in CommonTable |
| `getRowHeight` | `getRowHeight` | Same |
| `pageSizeOptions` | `pageSizeOptions` | Default is `[7, 10, 25, 50, 100]` |

### Step-by-Step Migration

#### Step 1: Import CommonTable

```jsx
// OLD
import { DataGrid } from '@mui/x-data-grid'

// NEW
import CommonTable from 'src/views/table/data-grid/CommonTable'
```

#### Step 2: Update the Component

**Before (DataGrid):**
```jsx
<DataGrid
  checkboxSelection={permissions?.perform_tests || permissions?.allow_full_access}
  onRowSelectionModelChange={handleRowSelection}
  isRowSelectable={params => {
    if (params.row.status.includes('completed')) {
      return false
    }
    return true
  }}
  sx={{
    '& .MuiDataGrid-row:hover .customButton': {
      display: 'block'
    }
  }}
  autoHeight
  hideFooterPagination
  hideFooterSelectedRowCount
  rows={indexedRows === undefined ? [] : indexedRows}
  rowCount={total}
  columns={columns}
  onSortModelChange={handleSortModel}
  loading={loading}
  slotProps={{
    baseButton: {
      variant: 'outlined'
    }
  }}
/>
```

**After (CommonTable):**
```jsx
<CommonTable
  checkBoxOption={
    Boolean(permissions?.perform_tests || permissions?.allow_full_access)
  }
  selectedRows={selectedRow}
  onRowSelectionModelChange={handleRowSelection}
  indexedRows={indexedRows === undefined ? [] : indexedRows}
  total={total}
  columns={columns}
  paginationModel={paginationModel}
  setPaginationModel={setPaginationModel}
  handleSortModel={handleSortModel}
  loading={loading}
  hideFooterPagination={true}
  externalTableStyle={{
    '& .MuiDataGrid-row:hover .customButton': {
      display: 'block'
    }
  }}
/>
```

### Key Changes to Note

#### 1. Checkbox Selection Prop Name

**❌ Wrong:**
```jsx
<CommonTable checkboxSelection={true} />
```

**✅ Correct:**
```jsx
<CommonTable checkBoxOption={true} />
```

**💡 Tip:** Wrap in `Boolean()` to ensure proper boolean value:
```jsx
<CommonTable
  checkBoxOption={Boolean(permissions?.can_edit || permissions?.admin)}
/>
```

#### 2. Selection Model Format

DataGrid v8 uses `{ type: 'include' | 'exclude', ids: Set<GridRowId> }`, but CommonTable handles this internally.

**DataGrid v8:**
```jsx
// You receive this complex format
onRowSelectionModelChange={(newSelection) => {
  // newSelection = { type: 'include', ids: Set(1, 2, 3) }
  const ids = Array.from(newSelection.ids)
  setSelectedRows(ids)
}}
```

**CommonTable:**
```jsx
// You receive plain array of IDs
onRowSelectionModelChange={(newIds) => {
  // newIds = [1, 2, 3]
  setSelectedRows(newIds)
}}
```

#### 3. isRowSelectable Not Supported

CommonTable doesn't support `isRowSelectable`. If you need to restrict selection:

**Option A: Filter in the callback**
```jsx
const handleRowSelection = (rowSelectionModel) => {
  // Filter out completed rows
  const validSelections = rows
    .filter(row => rowSelectionModel.includes(row.id))
    .filter(row => !row.status.includes('completed'))
    .map(row => row.id)

  setSelectedRow(validSelections)
}
```

**Option B: Handle in UI layer**
```jsx
// Disable checkboxes visually using externalTableStyle
externalTableStyle={{
  '& .MuiDataGrid-row.completed-row .MuiCheckbox-root': {
    visibility: 'hidden'
  }
}}
```

#### 4. Remove Unsupported Props

Remove these props when migrating:
- `slotProps` - Not used by CommonTable
- `hideFooterSelectedRowCount` - Handled automatically
- `autoHeight` - Always `true` in CommonTable
- `disableColumnSelector`, `disableColumnMenu` - Always disabled

### Migration Checklist

- [ ] Import `CommonTable` instead of `DataGrid`
- [ ] Change `checkboxSelection` → `checkBoxOption`
- [ ] Change `rows` → `indexedRows`
- [ ] Change `rowCount` → `total`
- [ ] Add `selectedRows` prop with state value
- [ ] Update `onRowSelectionModelChange` to receive plain array
- [ ] Change `sx` → `externalTableStyle`
- [ ] Add `paginationModel` and `setPaginationModel` if not present
- [ ] Remove `isRowSelectable` (handle logic elsewhere if needed)
- [ ] Remove `slotProps`
- [ ] Remove `hideFooterSelectedRowCount`
- [ ] Wrap checkbox boolean in `Boolean()` for clarity
- [ ] Test checkbox selection
- [ ] Test "Select All" functionality
- [ ] Test pagination and sorting

### Common Migration Issues

#### Issue 1: Checkboxes Not Appearing

**Cause:** Using `checkboxSelection` instead of `checkBoxOption`

**Fix:**
```jsx
// ❌ Wrong
<CommonTable checkboxSelection={true} />

// ✅ Correct
<CommonTable checkBoxOption={true} />
```

#### Issue 2: Selection Model Type Error

**Cause:** Trying to pass v8 format `{ type, ids: Set }` to `selectedRows`

**Fix:**
```jsx
// ❌ Wrong
const [selectedRows, setSelectedRows] = useState({ type: 'include', ids: new Set() })

// ✅ Correct
const [selectedRows, setSelectedRows] = useState([])
```

#### Issue 3: Rows Not Selectable After Migration

**Cause:** Missing `selectedRows` prop or incorrect callback

**Fix:**
```jsx
// ❌ Wrong - Missing selectedRows prop
<CommonTable
  checkBoxOption={true}
  onRowSelectionModelChange={setSelectedRow}
/>

// ✅ Correct
<CommonTable
  checkBoxOption={true}
  selectedRows={selectedRow}
  onRowSelectionModelChange={setSelectedRow}
/>
```

### Real-World Migration Example

**File:** `src/pages/lab/request/[id]/index.js`

**Before:**
```jsx
<DataGrid
  checkboxSelection={
    permissions?.perform_tests || permissions?.allow_full_access || permissions?.transfer_tests
  }
  onRowSelectionModelChange={handleRowSelection}
  isRowSelectable={params => {
    if (
      (permissions?.view &&
        permissions?.transfer_tests === false &&
        permissions?.perform_tests === false) ||
      (permissions?.perform_tests === true &&
        params.row.status.includes('completed'))
    ) {
      return false
    }
    return true
  }}
  sx={{
    '& .MuiDataGrid-row:hover .customButton': {
      display: 'block'
    },
    '& .MuiDataGrid-row .customButton': {
      display: 'none'
    }
  }}
  autoHeight
  hideFooterPagination
  hideFooterSelectedRowCount
  rows={indexedRows === undefined ? [] : indexedRows}
  rowCount={total}
  columns={columns}
  onSortModelChange={handleSortModel}
  loading={loading}
  slotProps={{
    baseButton: { variant: 'outlined' }
  }}
/>
```

**After:**
```jsx
<CommonTable
  checkBoxOption={
    Boolean(permissions?.perform_tests || permissions?.allow_full_access || permissions?.transfer_tests)
  }
  selectedRows={selectedRow}
  onRowSelectionModelChange={handleRowSelection}
  onCellClick={onCellClick}
  indexedRows={indexedRows === undefined ? [] : indexedRows}
  total={total}
  columns={columns}
  handleSortModel={handleSortModel}
  loading={loading}
  hideFooterPagination={true}
  disablePagination={true}
  externalTableStyle={{
    '& .MuiDataGrid-row:hover .customButton': {
      display: 'block'
    },
    '& .MuiDataGrid-row .customButton': {
      display: 'none'
    },
    '& .MuiDataGrid-row.Mui-selected': {
      backgroundColor: 'white !important'
    }
  }}
/>
```

**Changes Made:**
1. ✅ Changed `checkboxSelection` → `checkBoxOption` with `Boolean()` wrapper
2. ✅ Added `selectedRows={selectedRow}` prop
3. ✅ Changed `rows` → `indexedRows`
4. ✅ Changed `rowCount` → `total`
5. ✅ Changed `sx` → `externalTableStyle`
6. ✅ Removed `isRowSelectable` (handled in `handleRowSelection` callback)
7. ✅ Removed `slotProps`
8. ✅ Removed `hideFooterSelectedRowCount`
9. ✅ Added `disablePagination={true}` for no pagination

---

## 10. Troubleshooting

### Error: "requires all rows to have a unique `id` property"

**Cause**: Some rows don't have an `id` field.
**Fix**: Either add `id` in your data mapping or pass `getRowId`:
```jsx
<CommonTable getRowId={row => row.my_unique_field} ... />
```

### Checkbox selections not appearing in Redux

**Cause**: `selectedRows` in Redux might still have old v8 format `{ type, ids: Set }`.
**Fix**: Ensure Redux stores a **plain array** of IDs:
```js
// Redux slice
initialState: {
  selectedRows: []  // plain array of IDs, NOT { type: 'include', ids: new Set() }
}
```

### Header "Select All" not working

**Cause**: `handleSelectionChange` was not handling `type: 'exclude'`.
**Fix**: Already handled in current CommonTable. The `exclude` branch computes visible row IDs minus excluded IDs.

### Selections lost when changing pages

**Cause**: Missing `keepNonExistentRowsSelected: true`.
**Fix**: Already included in CommonTable when `checkBoxOption={true}`.

### `selectedRows.length` returns wrong count

**Cause**: If `selectedRows` is not an array.
**Fix**: CommonTable always passes arrays of IDs to `onRowSelectionModelChange`. Use `.length` directly:
```jsx
{selectedRows.length > 0 && <span>{selectedRows.length} items selected</span>}
```

---

## Full Working Example (ShipmentRequests pattern)

```jsx
// Redux Slice (shipmentSlice.js)
const shipmentSlice = createSlice({
  name: 'shipment',
  initialState: {
    list: [],
    total: 0,
    loading: false,
    page: 0,
    pageSize: 50,
    selectedRows: []      // plain array of IDs
  },
  reducers: {
    setSelectedRows: (state, action) => {
      state.selectedRows = action.payload
    }
  }
})

// Component
const ShipmentRequests = () => {
  const dispatch = useDispatch()
  const { list, total, loading, page, pageSize, selectedRows } = useSelector(state => state.shipment)

  const paginationModel = { page, pageSize }
  const indexedRows = list.map((row, index) => ({ ...row, sl_no: index + 1 }))

  return (
    <>
      {selectedRows.length > 0 && (
        <Box>{selectedRows.length} Items Selected</Box>
      )}

      <CommonTable
        indexedRows={indexedRows}
        total={total}
        columns={columns}
        paginationModel={paginationModel}
        setPaginationModel={model => {
          dispatch(setShipmentParams({ page: model.page, pageSize: model.pageSize }))
        }}
        handleSortModel={handleSortModel}
        loading={loading}
        searchValue={search}
        handleSearch={handleSearch}
        checkBoxOption={true}
        selectedRows={selectedRows}
        onRowSelectionModelChange={newIds => {
          // newIds = plain array of IDs (CommonTable handles v8 conversion)
          dispatch(setSelectedRows(newIds))
        }}
      />
    </>
  )
}
```
