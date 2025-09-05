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

const ReactTable = ({
  // Data and columns
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
  // useEffect(() => {
  //   console.log('columns', columns)
  //   console.log('rows', rows)
  // }, [columns])

  const theme = useTheme()
  const tableContainerRef = useRef(null)

  const getDefaultPinningFromColumns = cols => {
    const left = []
    const right = []
    ;(cols || []).forEach((c, i) => {
      const id = c.field || `column_${i}`
      if (c.pinned === 'left') left.push(id)
      else if (c.pinned === 'right') right.push(id)
    })
    return { left, right }
  }

  const defaultPinning = useMemo(() => getDefaultPinningFromColumns(columns), [columns])

  const withSelectionInPinning = useCallback(
    pin => {
      if (!rowSelection || !selectionPinned) return pin
      const left = pin.left ? [...pin.left] : []
      const right = pin.right ? [...pin.right] : []
      // Ensure the selection column is included once
      if (selectionPinned === 'left' && !left.includes('_select')) left.unshift('_select')
      if (selectionPinned === 'right' && !right.includes('_select')) right.unshift('_select')
      return { left, right }
    },
    [rowSelection, selectionPinned]
  )

  const rowRefs = useRef([])
  const didInitPinningRef = useRef(false)

  // State management
  const [currentRowsInView, setCurrentRowsInView] = useState(rowsInView)
  const [userChangedRowsInView, setUserChangedRowsInView] = useState(false)
  const [selectedRows, setSelectedRows] = useState([]) // array of selected row IDs
  const [loadingHeight, setLoadingHeight] = useState(0)

  // Initialize column pinning (include selection column if needed)
  const [columnPinning, setColumnPinning] = useState(() => withSelectionInPinning(defaultPinning))

  const [anchorEl, setAnchorEl] = useState(null)
  const [menuColumn, setMenuColumn] = useState(null)

  const getCommonPinningStyles = column => {
    const isPinned = column.getIsPinned()
    const isFirstLeftPinned = isPinned === 'left' && column.getIsFirstColumn('left')
    const isLastLeftPinnedColumn = isPinned === 'left' && column.getIsLastColumn('left')
    const isFirstRightPinnedColumn = isPinned === 'right' && column.getIsFirstColumn('right')
    const size = column.getSize()

    return {
      boxShadow: isLastLeftPinnedColumn
        ? '-4px 0 4px -4px rgba(0,0,0,0.2) inset'
        : isFirstRightPinnedColumn
        ? '4px 0 4px -4px rgba(0,0,0,0.2) inset'
        : undefined,
      // left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
      left: isPinned === 'left' ? (isFirstLeftPinned ? 0 : `${column.getStart('left')}px`) : undefined,
      right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
      // opacity: isPinned ? 0.98 : 1,
      position: isPinned ? 'sticky' : 'relative',
      width: size,
      minWidth: size,
      maxWidth: size,
      zIndex: isPinned ? 1000 : 1
    }
  }

  // Build main columns
  const baseColumns = useMemo(() => {
    if (!Array.isArray(columns)) return []
    return columns.map((col, index) => ({
      id: col.field || `column_${index}`,
      accessorKey: col.field,
      header: col.headerName || col.field,
      size: col.width || col.minWidth || 150,
      minSize: col.minWidth || 100,
      maxSize: col.maxWidth || 500,
      enableSorting: col.sortable !== false,
      enableColumnFilter: true,
      enablePinning: true,
      cell: ({ row, getValue }) => {
        const value = getValue()
        const cellProps = { row: row.original, value, field: col.field }

        if (col.renderCell) return col.renderCell(cellProps)
        if (React.isValidElement(value)) return value

        return (
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 400,
              color: theme.palette.customColors?.OnSurfaceVariant || '#666',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {value ?? '-'}
          </Typography>
        )
      },
      meta: {
        originalColumn: col,
        textAlign: col.textAlign || 'left',
        headerAlign: col.headerAlign || 'left'
      }
    }))
  }, [columns, cellStyle, theme])

  const checkboxSX = {
    p: 0,
    backgroundColor: 'transparent !important',
    '&:hover': { backgroundColor: 'transparent !important' },
    '& .MuiSvgIcon-root': { fontSize: 18 }
  }

  // ✅ Inject selection column when enabled
  const processedColumns = useMemo(() => {
    if (!rowSelection) return baseColumns

    const selectionColumn = {
      id: '_select',
      size: 54,
      minSize: 54,
      maxSize: 54,
      enableSorting: false,
      enableColumnFilter: false,
      enablePinning: true,
      header: ({ table }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Checkbox
            size='small'
            disableRipple
            disableFocusRipple
            sx={checkboxSX}
            checked={table.getIsAllPageRowsSelected?.() || false}
            indeterminate={(table.getIsSomePageRowsSelected?.() && !table.getIsAllPageRowsSelected?.()) || false}
            onChange={e => {
              e.stopPropagation()
              // Select only the visible page rows
              if (table.toggleAllPageRowsSelected) {
                table.toggleAllPageRowsSelected(e.target.checked)
              } else {
                // Fallback: manually toggle current page rows
                const pageRows = table.getRowModel().rows || []
                pageRows.forEach(r => r.toggleSelected(e.target.checked))
              }
            }}
          />
        </Box>
      ),
      cell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Checkbox
            size='small'
            disableRipple
            disableFocusRipple
            sx={checkboxSX}
            checked={row.getIsSelected()}
            indeterminate={row.getIsSomeSelected?.() || false}
            disabled={!row.getCanSelect?.()}
            onChange={e => {
              e.stopPropagation()
              row.toggleSelected(e.target.checked)
            }}
          />
        </Box>
      ),
      meta: { originalColumn: { headerAlign: 'center', textAlign: 'center' } }
    }

    // Pin preference is applied via columnPinning state; still keep this column first
    const next = [selectionColumn, ...baseColumns]
    return next
  }, [baseColumns, rowSelection])

  // user has interacted?
  const userChangedPinningRef = useRef(false)

  // Re-apply defaults (respect selection column) if user hasn't changed pinning
  useEffect(() => {
    if (!userChangedPinningRef.current) {
      setColumnPinning(withSelectionInPinning(defaultPinning))
    }
  }, [defaultPinning, withSelectionInPinning])

  // Calculate loading height based on table position
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

  // Ensure rows-in-view never exceeds rows-per-page (page size)
  const effectiveRowsInViewOptions = useMemo(() => {
    try {
      const maxView = paginationModel?.pageSize || Infinity
      const filtered = (rowsInViewOptions || []).filter(opt => opt <= maxView)
      if (filtered.length === 0 && rowsInViewOptions?.length) {
        filtered.push(Math.min(maxView, rowsInViewOptions[0]))
      }
      return Array.from(new Set(filtered)).sort((a, b) => a - b)
    } catch (e) {
      return rowsInViewOptions || []
    }
  }, [rowsInViewOptions, paginationModel?.pageSize])

  useEffect(() => {
    const maxView = paginationModel?.pageSize
    if (maxView && currentRowsInView > maxView) {
      setCurrentRowsInView(maxView)
      setUserChangedRowsInView(true)
    }
  }, [paginationModel?.pageSize, currentRowsInView])

  const hasData = Array.isArray(rows) && rows.length > 0

  // Filter out selections that are no longer present in current rows
  useEffect(() => {
    if (!rowSelection || !rows?.length) return
    const presentIds = new Set(rows.map((r, i) => String(r?.[rowIdKey] ?? r?.id ?? r?._id ?? `row_${i}`)))
    const filtered = selectedRows.filter(id => presentIds.has(String(id)))
    if (filtered.length !== selectedRows.length) {
      setSelectedRows(filtered)
      onRowSelect(filtered)
    }
  }, [rows, rowSelection, rowIdKey]) // eslint-disable-line

  // Table instance
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

    // ✅ Stable row IDs for selection
    getRowId: (originalRow, index) =>
      String(originalRow?.[rowIdKey] ?? originalRow?.id ?? originalRow?._id ?? `row_${index}`),

    // ✅ Controlled selection state
    enableRowSelection: rowSelection,
    state: {
      pagination: {
        pageIndex: paginationModel.page,
        pageSize: paginationModel.pageSize
      },
      columnPinning,
      rowSelection: rowSelection
        ? selectedRows.reduce((acc, id) => {
            acc[String(id)] = true
            return acc
          }, {})
        : {}
    },

    onPaginationChange: updater => {
      const newPagination =
        typeof updater === 'function'
          ? updater({ pageIndex: paginationModel.page, pageSize: paginationModel.pageSize })
          : updater

      onPaginationModelChange({
        page: newPagination.pageIndex,
        pageSize: newPagination.pageSize
      })
    },

    onColumnPinningChange: updater => {
      userChangedPinningRef.current = true
      setColumnPinning(old => (typeof updater === 'function' ? updater(old) : updater))
    },

    onRowSelectionChange: updater => {
      const base = selectedRows.reduce((acc, id) => {
        acc[String(id)] = true
        return acc
      }, {})
      const nextObj = typeof updater === 'function' ? updater(base) : updater
      const ids = Object.keys(nextObj).filter(k => nextObj[k])
      setSelectedRows(ids)
      onRowSelect(ids)
    }
  })

  // Calculate table dimensions
  const hasSubHeader = processedColumns.some(
    col => Array.isArray(col.meta?.originalColumn?.subHeader) && col.meta.originalColumn.subHeader.length > 0
  )

  const [dynamicTableHeight, setDynamicTableHeight] = useState(
    currentRowsInView * rowHeight + headerHeight + (hasSubHeader ? subHeaderHeight : 0)
  )

  const minTableHeight = currentRowsInView * rowHeight + headerHeight + (hasSubHeader ? subHeaderHeight : 0)

  useEffect(() => {
    rowRefs.current = []
    const pageRows = table.getRowModel().rows || []
    const visibleCount = Math.min(currentRowsInView, pageRows.length)
    const visibleRows = rowRefs.current.slice(0, visibleCount)

    let rowsBlockHeight = 0
    const first = visibleRows[0]
    const last = visibleRows[visibleRows.length - 1]

    if (first && last) {
      const firstTop = first.offsetTop || 0
      const lastBottom = (last.offsetTop || 0) + (last.offsetHeight || rowHeight)
      rowsBlockHeight = lastBottom - firstTop
    } else {
      rowsBlockHeight = visibleCount * rowHeight
    }

    const height = rowsBlockHeight + headerHeight + (hasSubHeader ? subHeaderHeight : 0)
    setDynamicTableHeight(height)
  }, [table, rows, currentRowsInView, rowHeight, headerHeight, subHeaderHeight, hasSubHeader])

  // Column pinning menu
  const handleColumnMenuClick = (event, column) => {
    setAnchorEl(event.currentTarget)
    setMenuColumn(column)
  }

  const handleColumnMenuClose = () => {
    setAnchorEl(null)
    setMenuColumn(null)
  }

  const handlePinColumn = (columnId, position) => {
    const col = table.getAllLeafColumns().find(c => c.id === columnId)
    if (col) col.pin(position || false)
    handleColumnMenuClose()
  }

  // Rows in view change
  const handleRowsInViewChange = event => {
    const newValue = event.target.value
    setCurrentRowsInView(newValue)
    setUserChangedRowsInView(true)
  }

  // Header renderer
  const renderTableHeader = () => {
    return table.getHeaderGroups().map(headerGroup => (
      <TableRow key={headerGroup.id}>
        {headerGroup.headers.map(header => {
          const column = header.column
          const originalColumn = column.columnDef.meta?.originalColumn || {}
          const isPinned = column.getIsPinned()

          const headerTextAlign =
            originalColumn.headerAlign ||
            (originalColumn.headerStyle && originalColumn.headerStyle.textAlign) ||
            (originalColumn.style && originalColumn.style.textAlign) ||
            (originalColumn.headerSx && originalColumn.headerSx.textAlign) ||
            (originalColumn.sx && originalColumn.sx.textAlign) ||
            'left'

          return (
            <TableCell
              key={header.id}
              sx={{
                backgroundColor: '#C1D3D0',
                borderBottom: '1px solid #ddd',
                borderRight: '1px solid #ddd',
                fontWeight: 'bold',
                fontSize: '24px',
                color: '#444',
                textAlign: headerTextAlign,
                height: headerHeight,
                padding: '8px 16px',
                '&:first-of-type': { borderTopLeftRadius: 6 },
                '&:last-of-type': { borderTopRightRadius: 6 },
                ...headerStyle,
                ...(originalColumn.headerStyle || {}),
                ...(originalColumn.headerSx || {}),
                ...(originalColumn.sx || {}),
                ...getCommonPinningStyles(column),

                position: 'sticky',
                top: 0,
                backgroundClip: 'padding-box',
                zIndex: isPinned ? 800 : 110,
                top: 0
              }}
              onClick={e => e.stopPropagation()}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                  {column.id !== '_select' && column.getIsPinned() && (
                    <PushPinIcon sx={{ fontSize: 16, opacity: 0.7 }} />
                  )}
                </Box>

                {modifyColumnPinning && column.id !== '_select' && (
                  <IconButton size='small' onClick={e => handleColumnMenuClick(e, column)} sx={{ opacity: 0.7 }}>
                    <MoreVertIcon fontSize='small' />
                  </IconButton>
                )}
              </Box>
            </TableCell>
          )
        })}
      </TableRow>
    ))
  }

  // Body renderer
  const renderTableBody = () => {
    rowRefs.current = []

    if (loading && !hasData) {
      return (
        <TableRow>
          <TableCell
            colSpan={table.getAllColumns().length}
            sx={{ textAlign: 'center', height: currentRowsInView * rowHeight, border: 'none' }}
          />
        </TableRow>
      )
    }

    const pageRows = table.getRowModel().rows
    const visibleCount = Math.min(currentRowsInView, pageRows.length)

    return pageRows.map((row, idx) => (
      <TableRow
        key={row.id}
        onClick={() => onRowClick(row.original)}
        sx={{
          cursor: onRowClick ? 'pointer' : 'default',
          '&:hover': { backgroundColor: theme.palette.action?.hover || '#f5f5f5' },
          height: rowHeight,
          ...rowStyle
        }}
        ref={el => {
          if (idx < visibleCount) rowRefs.current[idx] = el
        }}
      >
        {row.getVisibleCells().map(cell => {
          const column = cell.column
          const isPinned = column.getIsPinned()
          const originalColumn = column.columnDef.meta?.originalColumn || {}
          const isLastRow = idx === pageRows.length - 1

          const cellTextAlign =
            originalColumn.textAlign ||
            (originalColumn.style && originalColumn.style.textAlign) ||
            (originalColumn.cellStyle && originalColumn.cellStyle.textAlign) ||
            (originalColumn.sx && originalColumn.sx.textAlign) ||
            (originalColumn.cellSx && originalColumn.cellSx.textAlign) ||
            'left'

          return (
            <TableCell
              key={cell.id}
              onClick={e => {
                e.stopPropagation()
                // ignore clicks on selection column
                if (column.id !== '_select') {
                  onCellClick && onCellClick(cell.getValue(), row.original)
                }
              }}
              sx={{
                borderBottom: isLastRow ? 'none' : '1px solid #ddd',
                borderRight: isPinned && '1px solid #ddd',
                textAlign: column.id === '_select' ? 'center' : cellTextAlign,
                padding: column.id === '_select' ? '0 8px' : '8px 16px',
                backgroundColor: isPinned ? theme.palette.background?.paper || '#fff' : 'transparent',
                ...(originalColumn.style || {}),
                ...(originalColumn.cellStyle || {}),
                ...(originalColumn.sx || {}),
                ...(originalColumn.cellSx || {}),
                ...cellStyle,
                ...getCommonPinningStyles(column),
                zIndex: isPinned ? 100 : 1
              }}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          )
        })}
      </TableRow>
    ))
  }

  // Footer with pagination
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

  // Column pinning menu
  const columnMenu = (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleColumnMenuClose}>
      {menuColumn?.getIsPinned() !== 'left' && (
        <MenuItem onClick={() => handlePinColumn(menuColumn?.id, 'left')}>Pin to Left</MenuItem>
      )}
      {menuColumn?.getIsPinned() !== 'right' && (
        <MenuItem onClick={() => handlePinColumn(menuColumn?.id, 'right')}>Pin to Right</MenuItem>
      )}
      {menuColumn?.getIsPinned() && <MenuItem onClick={() => handlePinColumn(menuColumn?.id, false)}>Unpin</MenuItem>}
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
          <TableHead>{renderTableHeader()}</TableHead>
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

      {/* Footer */}
      {renderFooter()}

      {/* Column pinning menu */}
      {columnMenu}

      {/* Debug: Show column pinning state */}
      {/* {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant='caption' sx={{ fontFamily: 'monospace' }}>
            Column Pinning State:
          </Typography>
          <pre style={{ fontSize: '12px', margin: '8px 0' }}>
            {JSON.stringify(table.getState().columnPinning, null, 2)}
          </pre>
        </Box>
      )} */}
    </Box>
  )
}

export default ReactTable
