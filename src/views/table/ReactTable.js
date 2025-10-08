import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender
} from '@tanstack/react-table'
import {
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  TablePagination,
  CircularProgress,
  Select,
  MenuItem,
  Typography,
  Box,
  IconButton,
  Menu,
  Checkbox,
  TableSortLabel
} from '@mui/material'
import { useTheme } from '@emotion/react'
import PushPinIcon from '@mui/icons-material/PushPin'
import MoreVertIcon from '@mui/icons-material/MoreVert'

/* -------------------- Memoized, minimal-prop checkboxes -------------------- */

const MemoSelectionHeader = React.memo(
  function SelectionHeader({ checked, indeterminate, disabled, onToggle, checkboxSX }) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Checkbox
          size='small'
          disableRipple
          disableFocusRipple
          sx={checkboxSX}
          checked={checked}
          indeterminate={indeterminate}
          onChange={e => onToggle(e.target.checked)}
          disabled={disabled}
        />
      </Box>
    )
  },
  (prev, next) =>
    prev.checked === next.checked &&
    prev.indeterminate === next.indeterminate &&
    prev.disabled === next.disabled &&
    prev.onToggle === next.onToggle
)

const MemoSelectionCell = React.memo(
  function SelectionCell({ selected, indeterminate, disabled, onToggle, rowId, checkboxSX }) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Checkbox
          size='small'
          disableRipple
          disableFocusRipple
          sx={checkboxSX}
          checked={selected}
          indeterminate={indeterminate}
          disabled={disabled}
          onChange={e => onToggle(rowId, e.target.checked)}
        />
      </Box>
    )
  },
  (prev, next) =>
    prev.selected === next.selected &&
    prev.indeterminate === next.indeterminate &&
    prev.disabled === next.disabled &&
    prev.onToggle === next.onToggle &&
    prev.rowId === next.rowId
)

/* -------------------- Memoized Row -------------------- */

const MemoBodyRow = React.memo(
  function BodyRow({
    row,
    rowHeight,
    rowStyle,
    theme,
    onRowClick,
    cellStyle,
    getCommonPinningStyles,
    onCellClick,
    selectionEnabled,
    isRowSelected,
    toggleRowCheckbox,
    checkboxSX,
    setRowRef
  }) {
    const pageRows = row?.table?.getRowModel?.().rows || []
    const isLastRow = row.index === pageRows.length - 1

    // Fire before children stop propagation; ignore interactive/marked elements
    const handleRowClickCapture = useCallback(
      e => {
        const block = e.target.closest(
          '[data-no-rowclick],button,a,[role="button"],input,textarea,select,[contenteditable="true"]'
        )
        if (block) return
        onRowClick?.(row.original)
      },
      [onRowClick, row.original]
    )

    return (
      <TableRow
        ref={el => setRowRef?.(row.index, el)}
        key={row.id}
        onClickCapture={handleRowClickCapture}
        sx={{
          cursor: onRowClick ? 'pointer' : 'default',
          '&:hover': { backgroundColor: theme.palette.action?.hover || '#f5f5f5' },
          height: rowHeight,
          ...rowStyle
        }}
      >
        {row.getVisibleCells().map(cell => {
          const column = cell.column
          const pinnedState = column.getIsPinned?.()
          const isPinned = pinnedState === 'left' || pinnedState === 'right'
          const originalColumn = column.columnDef.meta?.originalColumn || {}
          const explicit = !!originalColumn.__explicitWidth

          const cellTextAlign =
            originalColumn.textAlign ||
            (originalColumn.style && originalColumn.style.textAlign) ||
            (originalColumn.cellStyle && originalColumn.cellStyle.textAlign) ||
            (originalColumn.sx && originalColumn.sx.textAlign) ||
            (originalColumn.cellSx && originalColumn.cellSx.textAlign) ||
            'left'

          const baseSx = {
            borderBottom: isLastRow ? 'none' : '1px solid #ddd',
            borderRight: isPinned && '1px solid #ddd',
            textAlign: column.id === '_select' ? 'center' : cellTextAlign,
            // padding: column.id === '_select' ? '0 8px' : '8px 16px',
            // padding:
            //   originalColumn.width != null && column.id !== '_select'
            //     ? 0
            //     : column.id === '_select'
            //     ? '0 8px'
            //     : '8px 16px',
            padding: explicit && column.id !== '_select' ? 0 : column.id === '_select' ? '0 8px' : '8px 16px',
            backgroundColor: isPinned ? theme.palette.background?.paper || '#fff' : 'transparent',

            // ---- column-level customizations (from columns array) ----
            ...(originalColumn.style || {}),
            ...(originalColumn.cellStyle || {}),
            ...(originalColumn.sx || {}),
            ...(originalColumn.cellSx || {}),
            ...(originalColumn.columnStyle || {}), // <-- NEW: respect `columnStyle`

            // component-level cell style
            ...cellStyle,

            // keep pinning last so sticky offsets/sizes always win
            ...getCommonPinningStyles(column),
            boxSizing: 'border-box',
            zIndex: isPinned ? 100 : 1
          }

          if (selectionEnabled && column.id === '_select') {
            return (
              <TableCell data-no-rowclick key={cell.id} sx={baseSx} onClick={e => e.stopPropagation()}>
                <MemoSelectionCell
                  selected={isRowSelected}
                  indeterminate={row.getIsSomeSelected?.() || false}
                  disabled={!row.getCanSelect?.()}
                  onToggle={toggleRowCheckbox}
                  rowId={row.id}
                  checkboxSX={checkboxSX}
                />
              </TableCell>
            )
          }

          return (
            <TableCell
              key={cell.id}
              onClick={e => {
                e.stopPropagation()
                if (column.id !== '_select') onCellClick?.(cell.getValue(), row.original)
              }}
              sx={baseSx}
            >
              {/* {flexRender(cell.column.columnDef.cell, cell.getContext())} */}
              {explicit && column.id !== '_select' ? (
                <Box sx={{ px: 2, py: 1, width: '100%', minWidth: 0 }}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Box>
              ) : (
                flexRender(cell.column.columnDef.cell, cell.getContext())
              )}
            </TableCell>
          )
        })}
      </TableRow>
    )
  },
  (prev, next) =>
    prev.row === next.row &&
    prev.rowHeight === next.rowHeight &&
    prev.onRowClick === next.onRowClick &&
    prev.onCellClick === next.onCellClick &&
    prev.isRowSelected === next.isRowSelected &&
    prev.toggleRowCheckbox === next.toggleRowCheckbox &&
    prev.theme === next.theme &&
    prev.getCommonPinningStyles === next.getCommonPinningStyles
)

/* --------------------------------- Main --------------------------------- */

const ReactTable = ({
  rows = [],
  columns = [],

  // Pagination props
  rowCount = 0,
  pagination = true,
  pageSizeOptions = [5, 10, 20],
  paginationModel = { page: 0, pageSize: 10 },
  onPaginationModelChange = () => {},

  // Table dimensions
  rowHeight = 74,
  headerHeight = 55,
  subHeaderHeight = 50,
  rowsInView = 5,
  rowsInViewOptions = [5, 7, 10, 20],

  // Styling props
  headerStyle = {},
  rowStyle = {},
  cellStyle = {},

  // Functionality props
  loading = false,
  onRowClick = () => {},
  onCellClick = () => {},
  onSortChange = () => {},

  // ✅ Row selection
  rowSelection = false,
  onRowSelect = () => {},
  rowIdKey = 'id',
  selectionPinned = 'left', // 'left' | 'right' | false

  // Header and search
  headerName = '',
  searchMode = 'local',
  onSearch = () => {},

  // Column features
  modifyColumnPinning = false,

  // Server-side pagination
  serverSide = false,

  // External styling hooks
  sx: rootSx,
  style: rootStyle,
  tableContainerSx,
  tableContainerStyle
}) => {
  const theme = useTheme()
  const tableContainerRef = useRef(null)

  // --- stable row refs map (by page index) ---
  const rowRefs = useRef({})
  const setRowRef = useCallback((idx, el) => {
    rowRefs.current[idx] = el
  }, [])

  const getDefaultPinningFromColumns = useCallback(cols => {
    const left = []
    const right = []
    ;(cols || []).forEach((c, i) => {
      // const id = c.field || `column_${i}`
      const id = c.id || c.field || `column_${i}`
      if (c.pinned === 'left') left.push(id)
      else if (c.pinned === 'right') right.push(id)
    })
    return { left, right }
  }, [])

  const defaultPinning = useMemo(() => getDefaultPinningFromColumns(columns), [columns, getDefaultPinningFromColumns])

  const withSelectionInPinning = useCallback(
    pin => {
      if (!rowSelection || !selectionPinned) return pin
      const left = pin.left ? [...pin.left] : []
      const right = pin.right ? [...pin.right] : []
      if (selectionPinned === 'left' && !left.includes('_select')) left.unshift('_select')
      if (selectionPinned === 'right' && !right.includes('_select')) right.unshift('_select')
      return { left, right }
    },
    [rowSelection, selectionPinned]
  )

  const userChangedPinningRef = useRef(false)

  // ---- State ----
  const [currentRowsInView, setCurrentRowsInView] = useState(rowsInView)
  const [loadingHeight, setLoadingHeight] = useState(0)
  const [columnPinning, setColumnPinning] = useState(() => withSelectionInPinning(defaultPinning))
  const [anchorEl, setAnchorEl] = useState(null)
  const [menuColumn, setMenuColumn] = useState(null)
  const [menuHeader, setMenuHeader] = useState(null)

  // ✅ Global (cross-page) selection
  const [rowSelectionState, setRowSelectionState] = useState({})

  const checkboxSX = {
    p: 0,
    backgroundColor: 'transparent !important',
    '&:hover': { backgroundColor: 'transparent !important' },
    '& .MuiSvgIcon-root': { fontSize: 18 }
  }

  const resolveLeafColumns = useCallback((column, header) => {
    if (!column) return []

    const seen = new Set()

    const collect = items => {
      const result = []

      ;(items || []).forEach(item => {
        const col = item?.column ?? item
        if (!col) return

        const id = col.id
        if (!id || seen.has(id)) return

        const subLeafs = col.getLeafColumns?.()
        if (Array.isArray(subLeafs) && subLeafs.length > 0 && subLeafs.some(sub => sub && sub !== col)) {
          result.push(...collect(subLeafs))
        } else {
          seen.add(id)
          result.push(col)
        }
      })

      return result
    }

    if (header) {
      const headerLeaves = collect(header.getLeafHeaders?.())
      if (headerLeaves.length) return headerLeaves
    }

    const columnLeaves = collect(column.getLeafColumns?.())
    if (columnLeaves.length) return columnLeaves

    return [column]
  }, [])

  const getPinSummary = useCallback(
    (column, header) => {
      const leafs = resolveLeafColumns(column, header)
      let hasLeft = false
      let hasRight = false
      let hasUnpinned = false

      leafs.forEach(leaf => {
        const side = leaf?.getIsPinned?.()
        if (side === 'left') hasLeft = true
        else if (side === 'right') hasRight = true
        else hasUnpinned = true
      })

      if ((hasLeft && hasRight) || (hasLeft && hasUnpinned) || (hasRight && hasUnpinned)) return 'mixed'
      if (hasLeft) return 'left'
      if (hasRight) return 'right'
      return 'none'
    },
    [resolveLeafColumns]
  )

  const getCommonPinningStyles = useCallback(
    (column, header) => {
      if (!column) return {}

      const summary = getPinSummary(column, header)
      if (summary === 'none' || summary === 'mixed') return {}

      const leafs = resolveLeafColumns(column, header)
      const pinnedLeafs = leafs.filter(leaf => leaf?.getIsPinned?.() === summary)

      if (!pinnedLeafs.length) return {}

      if (pinnedLeafs.length !== leafs.length) return {}

      const firstLeaf = pinnedLeafs[0]
      const lastLeaf = pinnedLeafs[pinnedLeafs.length - 1]

      const widthFromLeaves = pinnedLeafs.reduce((total, leaf) => total + (leaf?.getSize?.() || 0), 0)
      const widthCandidate = Number.isFinite(widthFromLeaves) && widthFromLeaves > 0 ? widthFromLeaves : header?.getSize?.()
      const width = typeof widthCandidate === 'number' && Number.isFinite(widthCandidate) ? widthCandidate : undefined

      const styles = {
        position: 'sticky',
        zIndex: 1000
      }

      if (width !== undefined) {
        styles.width = width
        styles.minWidth = width
        styles.maxWidth = width
      }

      if (summary === 'left') {
        const offset = firstLeaf?.getStart?.('left') ?? header?.getStart?.() ?? column.getStart?.('left')
        if (typeof offset === 'number') styles.left = `${offset}px`
        else if (offset != null) styles.left = offset

        if (lastLeaf?.getIsLastColumn?.('left')) {
          styles.boxShadow = '-4px 0 4px -4px rgba(0,0,0,0.2) inset'
        }
      } else if (summary === 'right') {
        const offset = lastLeaf?.getAfter?.('right') ?? header?.getAfter?.() ?? column.getAfter?.('right')
        if (typeof offset === 'number') styles.right = `${offset}px`
        else if (offset != null) styles.right = offset

        if (firstLeaf?.getIsFirstColumn?.('right')) {
          styles.boxShadow = '4px 0 4px -4px rgba(0,0,0,0.2) inset'
        }
      }

      return styles
    },
    [getPinSummary, resolveLeafColumns]
  )

  // ---- Columns ----
  // const baseColumns = useMemo(() => {
  //   if (!Array.isArray(columns)) return []
  //   return columns.map((col, index) => ({
  //     id: col.field || `column_${index}`,
  //     accessorKey: col.field,
  //     header: col.headerName || col.field,
  //     size: col.width || col.minWidth || 150,
  //     minSize: col.minWidth || 100,
  //     maxSize: col.maxWidth || 500,
  //     enableSorting: col.sortable !== false,
  //     enableColumnFilter: true,
  //     enablePinning: true,
  //     cell: ({ row, getValue }) => {
  //       const value = getValue()
  //       const cellProps = { row: row.original, value, field: col.field }
  //       if (col.renderCell) return col.renderCell(cellProps)
  //       if (React.isValidElement(value)) return value
  //       return (
  //         <Typography
  //           sx={{
  //             fontSize: '14px',
  //             fontWeight: 400,
  //             color: theme.palette.customColors?.OnSurfaceVariant || '#666',
  //             overflow: 'hidden',
  //             textOverflow: 'ellipsis',
  //             whiteSpace: 'nowrap'
  //           }}
  //         >
  //           {value ?? '-'}
  //         </Typography>
  //       )
  //     },
  //     meta: {
  //       originalColumn: col,
  //       textAlign: col.textAlign || 'left',
  //       headerAlign: col.headerAlign || 'left'
  //     }
  //   }))
  // }, [columns, theme])

  // util: safe nested path (e.g. "openingStock.m")
  const getByPath = (obj, path) =>
    String(path || '')
      .split('.')
      .reduce((o, k) => (o == null ? o : o[k]), obj)

  // ---- Columns (with groups) ----
  const makeColumnDefs = (cols, theme) => {
    if (!Array.isArray(cols)) return []

    return cols.map((col, index) => {
      const id = col.id || col.field || `column_${index}`

      // GROUP COLUMN
      if (Array.isArray(col.columns) && col.columns.length) {
        return {
          id,
          header: col.headerName ?? id,
          enablePinning: true,
          meta: { originalColumn: col },
          columns: makeColumnDefs(col.columns, theme)
        }
      }

      // LEAF COLUMN
      // const accessorKey = col.field
      // const size = col.width || col.minWidth || 150

      // const accessorKey = col.field
      // const explicitWidth = typeof col.width === 'number'
      // const size = explicitWidth ? col.width : col.minWidth || 150
      // const minSize = explicitWidth ? col.width : col.minWidth || 100
      // const maxSize = explicitWidth ? col.width : col.maxWidth || 500
      const accessorKey = col.field
      const explicitWidth = Number.isFinite(col.width)
      const size = explicitWidth ? col.width : col.minWidth ?? 150
      const minSize = explicitWidth ? col.width : col.minWidth ?? 100
      const maxSize = explicitWidth ? col.width : col.maxWidth ?? 500

      return {
        id,
        accessorFn: accessorKey ? row => getByPath(row, accessorKey) : undefined,
        header: col.headerName || col.field || id,
        size,
        minSize,
        maxSize,
        enableSorting: col.sortable !== false,
        enableColumnFilter: true,
        enablePinning: true,
        cell: ({ row, getValue }) => {
          const v = getValue?.()
          const cellProps = { row: row.original, value: v, field: col.field }
          if (col.renderCell) return col.renderCell(cellProps)
          if (React.isValidElement(v)) return v
          return (
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 400,
                color: theme.palette.customColors?.OnSurfaceVariant || '#666',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textAlign: col.textAlign || 'left'
              }}
            >
              {v ?? '-'}
            </Typography>
          )
        },
        meta: {
          originalColumn: { ...col, __explicitWidth: explicitWidth }, // 👈 flag for padding logic
          textAlign: col.textAlign || 'left',
          headerAlign: col.headerAlign || 'left'
        }
      }
    })
  }

  const baseColumns = useMemo(() => makeColumnDefs(columns, theme), [columns, theme])

  const hasBaseColumns = baseColumns.length > 0

  // ✅ Inject selection column
  const processedColumns = useMemo(() => {
    if (!rowSelection || !hasBaseColumns) return baseColumns

    const selectionColumn = {
      id: '_select',
      size: 54,
      minSize: 54,
      maxSize: 54,
      enableSorting: false,
      enableColumnFilter: false,
      enablePinning: true,
      header: ({ table }) => {
        const checked = table.getIsAllPageRowsSelected?.() || false
        const some = table.getIsSomePageRowsSelected?.() || false

        return (
          <MemoSelectionHeader
            checked={checked}
            indeterminate={some && !checked}
            disabled={false}
            onToggle={val => {
              const pageRows = table.getRowModel().rows || []
              setRowSelectionState(prev => {
                const next = { ...prev }
                if (val) {
                  pageRows.forEach(r => {
                    next[r.id] = true
                  })
                } else {
                  pageRows.forEach(r => {
                    delete next[r.id]
                  })
                }
                return next
              })
            }}
            checkboxSX={checkboxSX}
          />
        )
      },
      cell: ({ row }) => null,
      meta: { originalColumn: { headerAlign: 'center', textAlign: 'center' } }
    }

    return [selectionColumn, ...baseColumns]
  }, [baseColumns, rowSelection, hasBaseColumns])

  // ---- Pinning default
  useEffect(() => {
    if (!userChangedPinningRef.current) {
      setColumnPinning(withSelectionInPinning(defaultPinning))
    }
  }, [defaultPinning, withSelectionInPinning])

  // ---- Loader height ----
  useEffect(() => {
    if (tableContainerRef.current) {
      const tableRect = tableContainerRef.current.getBoundingClientRect()
      const screenHeight = window.innerHeight
      const tableTop = tableRect.top
      const headerFooterHeight = headerHeight + 100
      const availableHeight = screenHeight - tableTop - headerFooterHeight - 50
      setLoadingHeight(Math.max(availableHeight, 400))
    }
  }, [headerHeight, loading])

  // rows-in-view options clamp
  const effectiveRowsInViewOptions = useMemo(() => {
    try {
      const maxView = paginationModel?.pageSize || Infinity
      const filtered = (rowsInViewOptions || []).filter(opt => opt <= maxView)
      if (!filtered.length && rowsInViewOptions?.length) {
        filtered.push(Math.min(maxView, rowsInViewOptions[0]))
      }
      return Array.from(new Set(filtered)).sort((a, b) => a - b)
    } catch {
      return rowsInViewOptions || []
    }
  }, [rowsInViewOptions, paginationModel?.pageSize])

  useEffect(() => {
    const maxView = paginationModel?.pageSize
    if (maxView && currentRowsInView > maxView) {
      setCurrentRowsInView(maxView)
    }
  }, [paginationModel?.pageSize, currentRowsInView])

  const hasData = Array.isArray(rows) && rows.length > 0

  // ---- Hide header ONLY on first load while data is empty & loading ----
  const [hideHeaderInitial, setHideHeaderInitial] = useState(true)
  useEffect(() => {
    if (hideHeaderInitial && (!loading || hasData)) setHideHeaderInitial(false)
  }, [loading, hasData, hideHeaderInitial])

  const isHeaderVisible = hasBaseColumns && !(hideHeaderInitial && loading && !hasData)

  // ---------- ✅ UNIQUE ROW IDS ----------
  const getRowUniqueId = useCallback(
    (originalRow, index) => {
      const raw = originalRow?.[rowIdKey] ?? originalRow?._id ?? originalRow?.id ?? null
      const base = raw !== null && raw !== undefined && raw !== '' ? String(raw) : `__auto_idx_${index}`
      if (serverSide) {
        const absIndex = paginationModel.page * paginationModel.pageSize + index
        return `${base}__pg_${absIndex}`
      }
      return base
    },
    [rowIdKey, serverSide, paginationModel.page, paginationModel.pageSize]
  )

  // ---- Table ----
  const table = useReactTable({
    data: rows,
    columns: processedColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: serverSide,
    manualSorting: serverSide,
    pageCount: serverSide ? Math.ceil(rowCount / paginationModel.pageSize) : undefined,
    enableColumnPinning: true,
    getRowId: getRowUniqueId,
    enableRowSelection: rowSelection,
    state: {
      pagination: { pageIndex: paginationModel.page, pageSize: paginationModel.pageSize },
      columnPinning,
      rowSelection: rowSelectionState
    },
    onPaginationChange: updater => {
      const newPagination =
        typeof updater === 'function'
          ? updater({ pageIndex: paginationModel.page, pageSize: paginationModel.pageSize })
          : updater
      onPaginationModelChange({ page: newPagination.pageIndex, pageSize: newPagination.pageSize })
    },
    onColumnPinningChange: updater => {
      userChangedPinningRef.current = true
      setColumnPinning(old => (typeof updater === 'function' ? updater(old) : updater))
    },
    onRowSelectionChange: setRowSelectionState
  })

  // ---- Dynamic height with REAL measurements ----
  // const hasSubHeader = processedColumns.some(
  //   col => Array.isArray(col.meta?.originalColumn?.subHeader) && col.meta.originalColumn.subHeader.length > 0
  // )

  const hasSubHeader = table.getHeaderGroups().length > 1

  // const [dynamicTableHeight, setDynamicTableHeight] = useState(
  //   currentRowsInView * rowHeight + (isHeaderVisible ? headerHeight : 0) + (hasSubHeader ? subHeaderHeight : 0)
  // )
  const [dynamicTableHeight, setDynamicTableHeight] = useState(
    currentRowsInView * rowHeight +
      (isHeaderVisible ? headerHeight + (table.getHeaderGroups().length - 1) * subHeaderHeight : 0)
  )

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const pageRows = table.getRowModel().rows || []
      const visibleCount = Math.min(currentRowsInView, pageRows.length)

      const firstIdx = pageRows[0]?.index
      const lastIdx = pageRows[Math.max(0, visibleCount - 1)]?.index

      const firstEl = firstIdx != null ? rowRefs.current[firstIdx] : null
      const lastEl = lastIdx != null ? rowRefs.current[lastIdx] : null

      const headEl = isHeaderVisible ? tableContainerRef.current?.querySelector('thead') : null
      const actualHeaderH = isHeaderVisible ? headEl?.offsetHeight ?? headerHeight : 0

      const subHeaderH = hasSubHeader ? subHeaderHeight : 0

      let rowsBlockHeight
      if (firstEl && lastEl) {
        const firstTop = firstEl.offsetTop || 0
        const lastBottom = (lastEl.offsetTop || 0) + (lastEl.offsetHeight || rowHeight)
        rowsBlockHeight = lastBottom - firstTop
      } else {
        rowsBlockHeight = visibleCount * rowHeight
      }

      setDynamicTableHeight(actualHeaderH + subHeaderH + rowsBlockHeight)
    })

    return () => cancelAnimationFrame(id)
  }, [table, rows, currentRowsInView, rowHeight, headerHeight, subHeaderHeight, hasSubHeader, isHeaderVisible])

  // ---- Column menu ----
  const handleColumnMenuClick = (event, column, header) => {
    setAnchorEl(event.currentTarget)
    setMenuColumn(column)
    setMenuHeader(header || null)
  }
  const handleColumnMenuClose = () => {
    setAnchorEl(null)
    setMenuColumn(null)
    setMenuHeader(null)
  }
  const handlePinColumn = (columnId, position) => {
    const column = table.getColumn(columnId) || table.getAllLeafColumns().find(c => c.id === columnId)

    if (column) {
      const targetLeafs = resolveLeafColumns(column, menuHeader)

      const applyPin = (targetColumn, nextPosition) => {
        const normalized = nextPosition === 'left' || nextPosition === 'right' ? nextPosition : false
        targetColumn.pin(normalized)
      }

      if (targetLeafs.length) {
        targetLeafs.forEach(leaf => applyPin(leaf, position))
      } else {
        applyPin(column, position)
      }
    }
    handleColumnMenuClose()
  }

  // ---- Rows in view change ----
  const handleRowsInViewChange = event => {
    const newValue = event.target.value
    setCurrentRowsInView(newValue)
  }

  // ✅ Stable row-checkbox handler
  const handleRowCheckboxChange = useCallback((rowId, checked) => {
    setRowSelectionState(prev => {
      const next = { ...prev }
      if (checked) next[rowId] = true
      else delete next[rowId]
      return next
    })
  }, [])

  // ---- Header ----
  // const renderTableHeader = () =>
  //   table.getHeaderGroups().map(headerGroup => (
  //     <TableRow key={headerGroup.id}>
  //       {headerGroup.headers.map(header => {
  //         const column = header.column
  //         const originalColumn = column.columnDef.meta?.originalColumn || {}
  //         const isPinned = column.getIsPinned()

  //         const headerTextAlign =
  //           originalColumn.headerAlign ||
  //           (originalColumn.headerStyle && originalColumn.headerStyle.textAlign) ||
  //           (originalColumn.style && originalColumn.style.textAlign) ||
  //           (originalColumn.headerSx && originalColumn.headerSx.textAlign) ||
  //           (originalColumn.sx && originalColumn.sx.textAlign) ||
  //           'left'

  //         return (
  //           <TableCell
  //             key={header.id}
  //             sx={{
  //               backgroundColor: '#C1D3D0',
  //               borderBottom: '1px solid #ddd',
  //               borderRight: '1px solid #ddd',
  //               fontWeight: 'bold',
  //               fontSize: '24px',
  //               color: '#444',
  //               textAlign: headerTextAlign,
  //               height: headerHeight,
  //               padding: '8px 16px',
  //               '&:first-of-type': { borderTopLeftRadius: 6 },
  //               '&:last-of-type': { borderTopRightRadius: 6 },

  //               // component-level header style
  //               ...headerStyle,

  //               // pinning + base sticky
  //               ...getCommonPinningStyles(column),
  //               position: 'sticky',
  //               top: 0,
  //               backgroundClip: 'padding-box',
  //               zIndex: isPinned ? 800 : 110,

  //               // ---- per-column overrides LAST (let user force zIndex/left/padding etc) ----
  //               ...(originalColumn.headerStyle || {}),
  //               ...(originalColumn.headerSx || {}),
  //               ...(originalColumn.sx || {})
  //             }}
  //             onClick={e => e.stopPropagation()}
  //           >
  //             <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
  //               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
  //                 {column.getCanSort() ? (
  //                   <TableSortLabel
  //                     active={column.getIsSorted() !== false}
  //                     direction={column.getIsSorted() === 'desc' ? 'desc' : 'asc'}
  //                     onClick={column.getToggleSortingHandler()}
  //                     sx={{ color: 'inherit' }}
  //                   >
  //                     {flexRender(column.columnDef.header, header.getContext())}
  //                   </TableSortLabel>
  //                 ) : (
  //                   flexRender(column.columnDef.header, header.getContext())
  //                 )}
  //                 {column.id !== '_select' && column.getIsPinned() && (
  //                   <PushPinIcon sx={{ fontSize: 16, opacity: 0.7 }} />
  //                 )}
  //               </Box>

  //               {modifyColumnPinning && column.id !== '_select' && originalColumn.disablePinMenu !== true && (
  //                 <IconButton size='small' onClick={e => handleColumnMenuClick(e, column)} sx={{ opacity: 0.7 }}>
  //                   <MoreVertIcon fontSize='small' />
  //                 </IconButton>
  //               )}
  //             </Box>
  //           </TableCell>
  //         )
  //       })}
  //     </TableRow>
  //   ))

  // ---- Header ----
  // top offset per header row (row 0 = main, others = subheader rows)
  const getHeaderTop = (depth, headerHeight, subHeaderHeight) =>
    depth === 0 ? 0 : headerHeight + (depth - 1) * subHeaderHeight

  const renderTableHeader = () => {
    const headerGroups = table.getHeaderGroups()
    const maxDepth = headerGroups.length - 1

    return headerGroups.map((headerGroup, depth) => (
      <TableRow key={headerGroup.id}>
        {headerGroup.headers.map(header => {
          const isPlaceholder = header.isPlaceholder
          const column = header.column
          const originalColumn = column.columnDef.meta?.originalColumn || {}
          // If this header has no children (leaf in this row), span down to fill remaining rows
          const rowSpan = header.subHeaders?.length ? 1 : Math.max(1, maxDepth - depth + 1)

          const topOffset = getHeaderTop(depth, headerHeight, subHeaderHeight)
          const cellHeight = depth === 0 ? headerHeight : subHeaderHeight
          const explicit = !!originalColumn.__explicitWidth

          const headerPinSummary = getPinSummary(column, header)
          const isPinned = headerPinSummary === 'left' || headerPinSummary === 'right'
          const showPinIcon = isPinned

          return (
            <TableCell
              key={header.id}
              colSpan={header.colSpan}
              rowSpan={rowSpan}
              sx={{
                backgroundColor: '#C1D3D0',
                borderBottom: '1px solid #ddd',
                borderRight: '1px solid #ddd',
                fontWeight: 'bold',
                fontSize: depth === 0 ? '16px' : '14px',
                color: '#444',
                textAlign: originalColumn.headerAlign || originalColumn.textAlign || 'left',
                height: cellHeight,
                // padding: '8px 16px',
                // padding: originalColumn.width != null && column.id !== '_select' ? 0 : '8px 16px',
                padding: explicit && column.id !== '_select' ? 0 : '8px 16px',

                // pinning + sticky stacking
                ...getCommonPinningStyles(column, header),
                boxSizing: 'border-box',
                position: 'sticky',
                top: topOffset,
                backgroundClip: 'padding-box',
                zIndex: isPinned ? 800 : 110,

                // per-column overrides last
                ...(originalColumn.headerStyle || {}),
                ...(originalColumn.headerSx || {}),
                ...(originalColumn.sx || {})
              }}
             onClick={e => e.stopPropagation()}
           >
              {isPlaceholder ? null : (
                // <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box
                  sx={{
                    display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'space-between',
                   // px: originalColumn.width != null && column.id !== '_select' ? 2 : 0,
                   // py: originalColumn.width != null && column.id !== '_select' ? 1 : 0,
                   px: explicit && column.id !== '_select' ? 2 : 0,
                   py: explicit && column.id !== '_select' ? 1 : 0,
                   width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {column.getCanSort() ? (
                      <TableSortLabel
                        active={column.getIsSorted() !== false}
                        direction={column.getIsSorted() === 'desc' ? 'desc' : 'asc'}
                        onClick={column.getToggleSortingHandler()}
                        sx={{ color: 'inherit' }}
                      >
                        {flexRender(column.columnDef.header, header.getContext())}
                      </TableSortLabel>
                    ) : (
                      flexRender(column.columnDef.header, header.getContext())
                    )}
                    {column.id !== '_select' && showPinIcon && (
                      <PushPinIcon sx={{ fontSize: 16, opacity: 0.7 }} />
                    )}
                  </Box>

                  {modifyColumnPinning && column.id !== '_select' && originalColumn.disablePinMenu !== true && (
                    <IconButton
                      size='small'
                      onClick={e => handleColumnMenuClick(e, column, header)}
                      sx={{ opacity: 0.7 }}
                    >
                      <MoreVertIcon fontSize='small' />
                    </IconButton>
                  )}
                </Box>
              )}
            </TableCell>
          )
        })}
      </TableRow>
    ))
  }

  // ---- Body ----
  const renderTableBody = () => {
    // reset refs for current render
    rowRefs.current = {}

    if (loading && !hasData) {
      return (
        <TableRow>
          <TableCell
            colSpan={Math.max(1, table.getAllLeafColumns().length || baseColumns.length)}
            sx={{ textAlign: 'center', height: currentRowsInView * rowHeight, border: 'none' }}
          />
        </TableRow>
      )
    }

    const pageRows = table.getRowModel().rows

    return pageRows.map(row => (
      <MemoBodyRow
        key={row.id}
        row={row}
        rowHeight={rowHeight}
        rowStyle={rowStyle}
        theme={theme}
        onRowClick={onRowClick}
        cellStyle={cellStyle}
        getCommonPinningStyles={getCommonPinningStyles}
        onCellClick={onCellClick}
        selectionEnabled={!!rowSelection}
        isRowSelected={!!rowSelectionState[row.id]}
        toggleRowCheckbox={handleRowCheckboxChange}
        checkboxSX={checkboxSX}
        setRowRef={setRowRef}
      />
    ))
  }

  // ---- Footer ----
  const renderFooter = () => {
    if (!pagination) return null
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 4,
          padding: '8px 16px',
          backgroundColor: theme.palette.background?.paper || '#fff',
          borderRadius: '0 0 8px 8px'
        }}
      >
        {/* Rows in view selector */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant='body2' sx={{ color: 'text.secondary' }}>
            Rows in view:
          </Typography>
          <Select
            value={currentRowsInView}
            onChange={handleRowsInViewChange}
            variant='standard'
            disabled={loading}
            disableUnderline
            sx={{
              fontSize: '0.875rem',
              color: 'text.secondary',
              minWidth: '0px !important',
              width: '40px !important',
              '& .MuiSelect-icon': {
                color: 'text.secondary',
                boxShadow: 'none !important',
                overflow: 'hidden',
                maxHeight: 200
              },
              '& .MuiSelect-select': {
                minWidth: '0px !important',
                width: '40px !important',
                paddingY: '8px'
              }
            }}
            MenuProps={{
              anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
              transformOrigin: { vertical: 'top', horizontal: 'left' },
              PaperProps: { elevation: 0 }
            }}
          >
            {effectiveRowsInViewOptions.map(option => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {/* Pagination */}
        <TablePagination
          component='div'
          count={serverSide ? rowCount : table.getFilteredRowModel().rows.length}
          page={paginationModel.page}
          onPageChange={(event, newPage) => {
            onPaginationModelChange({ ...paginationModel, page: newPage })
          }}
          rowsPerPage={paginationModel.pageSize}
          onRowsPerPageChange={event => {
            onPaginationModelChange({
              page: 0,
              pageSize: parseInt(event.target.value, 10)
            })
          }}
          rowsPerPageOptions={pageSizeOptions}
          labelRowsPerPage='Rows per page:'
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`}
          sx={{
            '& .MuiTablePagination-toolbar': { minHeight: 52 },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontSize: '14px',
              color: theme.palette.text?.secondary
            }
          }}
        />
      </Box>
    )
  }

  // ---- Column pinning menu ----
  const menuPinSummary = menuColumn ? getPinSummary(menuColumn, menuHeader) : 'none'
  const columnMenu = (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleColumnMenuClose}>
      {menuPinSummary !== 'left' && (
        <MenuItem onClick={() => handlePinColumn(menuColumn?.id, 'left')}>Pin to Left</MenuItem>
      )}
      {menuPinSummary !== 'right' && (
        <MenuItem onClick={() => handlePinColumn(menuColumn?.id, 'right')}>Pin to Right</MenuItem>
      )}
      {menuPinSummary !== 'none' && <MenuItem onClick={() => handlePinColumn(menuColumn?.id, false)}>Unpin</MenuItem>}
    </Menu>
  )

  return (
    <Box sx={{ position: 'relative', borderRadius: '8px', ...(rootSx || {}) }} style={rootStyle}>
      <TableContainer
        ref={tableContainerRef}
        component={Paper}
        sx={{
          borderRadius: '8px !important',
          height: loading && !hasData ? loadingHeight : dynamicTableHeight,
          // minHeight: (isHeaderVisible ? headerHeight : 0) + rowHeight + 8,
          minHeight:
            (isHeaderVisible ? headerHeight + (table.getHeaderGroups().length - 1) * subHeaderHeight : 0) +
            rowHeight +
            8,
          position: 'relative',
          border: '1px solid #ddd',
          overflowX: 'auto',
          overflowY: 'auto',
          ...(tableContainerSx || {})
        }}
        style={tableContainerStyle}
      >
        <Table
          stickyHeader
          sx={{
            borderCollapse: 'separate',
            borderSpacing: 0,
            width: table.getTotalSize(),
            tableLayout: 'fixed'
          }}
        >
          <colgroup>
            {(() => {
              const left = table.getLeftLeafColumns?.() || []
              const centerSource = table.getCenterLeafColumns?.() || table.getVisibleLeafColumns?.() || []
              const right = table.getRightLeafColumns?.() || []

              const center = centerSource.filter(col => !left.includes(col) && !right.includes(col))

              const fallback = table.getAllLeafColumns?.() || []
              const ordered = (left.length || right.length)
                ? [...left, ...center, ...right]
                : fallback

              return ordered.map(col => {
                const w = col.getSize()
                return <col key={col.id} style={{ width: w, minWidth: w, maxWidth: w }} />
              })
            })()}
          </colgroup>
          {/* ✅ Header hidden only on first load when loading && no data */}
          {isHeaderVisible ? <TableHead>{renderTableHeader()}</TableHead> : null}
          <TableBody>{renderTableBody()}</TableBody>
        </Table>
      </TableContainer>

      {loading && (
        <Box
          aria-busy
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: '8px',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: hasData ? 'rgba(6, 5, 5, 0.08)' : 'transparent',
            pointerEvents: 'auto'
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {renderFooter()}
      {columnMenu}
    </Box>
  )
}

export default ReactTable
