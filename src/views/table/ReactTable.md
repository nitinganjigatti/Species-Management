<!--
# ReactTable Component

A reusable, customizable table component built with **@tanstack/react-table** and **Material UI**.
It supports **sticky headers, default column pinning, custom cell rendering, row selection, pagination**, and more.

---

## ✨ Features

- **Sticky Header** → Header row always visible while scrolling.
- **Column Pinning** → Supports `pinned: 'left' | 'right'` in column definitions.
- **Default Pinning** → Columns with `pinned` property are pinned automatically on first render.
- **Column Menu (optional)** → Enable user pin/unpin via 3-dot menu (`modifyColumnPinning`).
- **Custom JSX Cells** → Render React components with `renderCell`.
- **Row & Cell Styling** → Style via `rowStyle`, `cellStyle`, `headerStyle`.
- **Row Selection** → With external handler.
- **Server-side Pagination** → For large datasets.
- **Rows in View** → Dynamic table height based on desired row count.

---

## 📦 Installation

```bash
npm install @tanstack/react-table
```
````

---

## 🚀 Basic Usage

```jsx
import React, { useState } from 'react'
import ReactTable from 'src/views/table/ReactTable'
import { Chip } from '@mui/material'

const Example = () => {
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

  const columns = [
    {
      field: 'name',
      headerName: 'Name',
      width: 220,
      pinned: 'left' // default pinned column
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: ({ value }) => <Chip label={value} color={value === 'Active' ? 'success' : 'default'} />
    }
  ]

  const rows = [
    { id: 1, name: 'John', status: 'Active' },
    { id: 2, name: 'Jane', status: 'Inactive' }
  ]

  return (
    <ReactTable
      rows={rows}
      columns={columns}
      paginationModel={paginationModel}
      onPaginationModelChange={setPaginationModel}
      modifyColumnPinning
      onRowClick={row => console.log('Clicked:', row)}
    />
  )
}
```

---

## ⚙️ Props

### Data & Columns

| Prop       | Type   | Default | Description                          |
| ---------- | ------ | ------- | ------------------------------------ |
| `rows`     | Array  | `[]`    | Table data rows.                     |
| `columns`  | Array  | `[]`    | Column definitions.                  |
| `rowCount` | number | `0`     | Total rows (used with `serverSide`). |

### Pagination

| Prop                      | Type      | Default                   | Description                         |
| ------------------------- | --------- | ------------------------- | ----------------------------------- |
| `pagination`              | boolean   | `true`                    | Enable pagination footer.           |
| `pageSizeOptions`         | number\[] | `[5, 10, 20]`             | Page size options.                  |
| `paginationModel`         | object    | `{ page:0, pageSize:10 }` | Controlled pagination state.        |
| `onPaginationModelChange` | function  | `() => {}`                | Called with `{ page, pageSize }`.   |
| `serverSide`              | boolean   | `false`                   | Manual pagination (you fetch data). |

### Dimensions

| Prop                | Type      | Default       | Description                     |
| ------------------- | --------- | ------------- | ------------------------------- |
| `rowHeight`         | number    | `74`          | Row height.                     |
| `headerHeight`      | number    | `55`          | Header height.                  |
| `subHeaderHeight`   | number    | `50`          | Extra header block height.      |
| `rowsInView`        | number    | `5`           | Number of rows visible in view. |
| `rowsInViewOptions` | number\[] | `[5,7,10,20]` | Options for “Rows in view”.     |

### Styling

| Prop                  | Type   | Default | Description                        |
| --------------------- | ------ | ------- | ---------------------------------- |
| `headerStyle`         | object | `{}`    | Custom header styles.              |
| `rowStyle`            | object | `{}`    | Custom row styles.                 |
| `cellStyle`           | object | `{}`    | Custom cell styles.                |
| `sx` / `style`        | object | –       | Root wrapper styles.               |
| `tableContainerSx`    | object | –       | `TableContainer` MUI `sx`.         |
| `tableContainerStyle` | object | –       | Inline style for `TableContainer`. |

### Functionality

| Prop                  | Type     | Default    | Description                        |
| --------------------- | -------- | ---------- | ---------------------------------- |
| `loading`             | boolean  | `false`    | Show loader overlay.               |
| `onRowClick`          | function | `() => {}` | Fired on row click.                |
| `onCellClick`         | function | `() => {}` | Fired on cell click.               |
| `rowSelection`        | boolean  | `false`    | Enable row selection.              |
| `onRowSelect`         | function | `() => {}` | Called with selected row IDs.      |
| `modifyColumnPinning` | boolean  | `false`    | Show 3-dot menu to pin/unpin cols. |

---

## 🧱 Column Definition

```js
{
  field: 'fieldName',        // required: key in row object
  headerName: 'Display Name',
  width: 200,                // fixed width
  minWidth: 100,
  maxWidth: 300,
  pinned: 'left' | 'right',  // ⬅️ default pinning
  sortable: true,            // client-side sort
  textAlign: 'center',       // body alignment
  headerAlign: 'left',       // header alignment

  // custom renderer
  renderCell: ({ value, row, field }) => <span>{value}</span>,

  // style overrides
  style: { color: 'red' },
  sx: { fontWeight: 600 },
  headerStyle: { backgroundColor: '#eee' },
}
```

---

## 🔗 Migration from StickyTable

Just change import:

```diff
- import StickyTable from 'src/views/table/sticky-table'
+ import ReactTable from 'src/views/table/ReactTable'
```

Props remain the same.

---

## 📊 Advanced Examples

### Default Pinning from Props

```jsx
const columns = [
  { field: 'species', headerName: 'Species', width: 320, pinned: 'left' },
  { field: 'male', headerName: 'Male', width: 120 },
  { field: 'female', headerName: 'Female', width: 120 },
  { field: 'actions', headerName: 'Actions', width: 160, pinned: 'right' }
]
```

### Server-side Pagination

```jsx
<ReactTable
  rows={data}
  columns={columns}
  rowCount={total}
  serverSide
  paginationModel={pagination}
  onPaginationModelChange={next => {
    setPagination(next)
    fetchPage(next)
  }}
/>
```

### Custom Styling

```jsx
<ReactTable
  rows={rows}
  columns={columns}
  headerStyle={{ backgroundColor: '#fafafa', fontWeight: 600 }}
  rowStyle={{ '&:hover': { backgroundColor: '#f5f5f5' } }}
  cellStyle={{ fontSize: '13px', padding: '6px 12px' }}
/>
```

---

## 🖥 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

 -->
