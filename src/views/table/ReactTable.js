import React, { useEffect, useState, useMemo, useRef } from 'react'
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
  rowSelection = false,
  onRowSelect = () => {},

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
  useEffect(() => {
    console.log('columns', columns)
    console.log('rows', rows)
  }, [columns])

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

  // compute default pinning when columns change (for reapply logic)
  const defaultPinning = useMemo(() => getDefaultPinningFromColumns(columns), [columns])
  const rowRefs = useRef([])
  const didInitPinningRef = useRef(false)

  // State management
  const [currentRowsInView, setCurrentRowsInView] = useState(rowsInView)
  const [userChangedRowsInView, setUserChangedRowsInView] = useState(false)
  const [selectedRows, setSelectedRows] = useState([])
  const [loadingHeight, setLoadingHeight] = useState(0)

  // IMPORTANT: initialize from columns on first mount
  const [columnPinning, setColumnPinning] = useState(() => defaultPinning)

  const [anchorEl, setAnchorEl] = useState(null)
  const [menuColumn, setMenuColumn] = useState(null)

  const getCommonPinningStyles = column => {
    const isPinned = column.getIsPinned()
    const isLastLeftPinnedColumn = isPinned === 'left' && column.getIsLastColumn('left')
    const isFirstRightPinnedColumn = isPinned === 'right' && column.getIsFirstColumn('right')
    const size = column.getSize()

    return {
      boxShadow: isLastLeftPinnedColumn
        ? '-4px 0 4px -4px rgba(0,0,0,0.2) inset'
        : isFirstRightPinnedColumn
        ? '4px 0 4px -4px rgba(0,0,0,0.2) inset'
        : undefined,
      left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
      right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
      opacity: isPinned ? 0.98 : 1,
      position: isPinned ? 'sticky' : 'relative',
      width: size,
      minWidth: size,
      maxWidth: size,
      zIndex: isPinned ? 1000 : 1
    }
  }

  // Process columns for react-table format
  const processedColumns = useMemo(() => {
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

        const cellProps = {
          row: row.original,
          value,
          field: col.field
        }

        // Handle custom render cell
        if (col.renderCell) {
          return col.renderCell(cellProps)
        }

        // Handle JSX content
        if (React.isValidElement(value)) {
          return value
        }

        // Default text rendering
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
            {value || '-'}
          </Typography>
        )
      },

      // Store original column config for styling
      meta: {
        originalColumn: col,
        textAlign: col.textAlign || 'left',
        headerAlign: col.headerAlign || 'left'
      }
    }))
  }, [columns, cellStyle, theme])

  // user has interacted?
  const userChangedPinningRef = useRef(false)

  // (optional) if columns prop changes later, re-apply defaults
  // only if the user hasn't changed pinning in this session.
  useEffect(() => {
    if (!userChangedPinningRef.current) {
      setColumnPinning(defaultPinning)
    }
  }, [defaultPinning])

  // Calculate loading height based on table position
  useEffect(() => {
    if (tableContainerRef.current) {
      const tableRect = tableContainerRef.current.getBoundingClientRect()
      const screenHeight = window.innerHeight
      const tableTop = tableRect.top
      const headerFooterHeight = headerHeight + 100 // Approximate footer height

      // Calculate available height: screen height - table top position - header/footer space
      const availableHeight = screenHeight - tableTop - headerFooterHeight - 50 // 50px buffer
      setLoadingHeight(Math.max(availableHeight, 400)) // Minimum 400px height
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
    enableColumnPinning: true, // Enable column pinning
    state: {
      pagination: {
        pageIndex: paginationModel.page,
        pageSize: paginationModel.pageSize
      },
      columnPinning,
      rowSelection: rowSelection ? selectedRows.reduce((acc, id) => ({ ...acc, [id]: true }), {}) : {}
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

    enableRowSelection: rowSelection,
    onRowSelectionChange: updater => {
      const newSelection =
        typeof updater === 'function'
          ? updater(selectedRows.reduce((acc, id) => ({ ...acc, [id]: true }), {}))
          : updater

      const selectedIds = Object.keys(newSelection).filter(key => newSelection[key])
      setSelectedRows(selectedIds)
      onRowSelect(selectedIds)
    }
  })

  // Calculate table dimensions
  const hasSubHeader = processedColumns.some(
    col => Array.isArray(col.meta?.originalColumn?.subHeader) && col.meta.originalColumn.subHeader.length > 0
  )

  const [dynamicTableHeight, setDynamicTableHeight] = useState(
    currentRowsInView * rowHeight + headerHeight + (hasSubHeader ? subHeaderHeight : 0)
  )

  // Calculate minimum height to prevent layout shift during loading
  const minTableHeight = currentRowsInView * rowHeight + headerHeight + (hasSubHeader ? subHeaderHeight : 0)

  // const finalTableHeight = loading ? minTableHeight : Math.max(dynamicTableHeight, minTableHeight)

  useEffect(() => {
    const visibleRows = rowRefs.current.slice(0, currentRowsInView)

    let rowsBlockHeight = 0
    const first = visibleRows[0]
    const last = visibleRows[visibleRows.length - 1]

    if (first && last) {
      // Measure block height precisely using offsetTop + offsetHeight to avoid cumulative border rounding
      const firstTop = first.offsetTop || 0
      const lastBottom = (last.offsetTop || 0) + (last.offsetHeight || rowHeight)
      rowsBlockHeight = lastBottom - firstTop
    } else {
      // Fallback to summation
      rowsBlockHeight = visibleRows.reduce((sum, ref) => sum + (ref?.offsetHeight || rowHeight), 0)
    }

    const height = rowsBlockHeight + headerHeight + (hasSubHeader ? subHeaderHeight : 0)
    setDynamicTableHeight(height)
  }, [rows, currentRowsInView, rowHeight, headerHeight, subHeaderHeight, hasSubHeader])

  // Handle column pinning menu
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
    if (col) {
      // This will trigger onColumnPinningChange above.
      col.pin(position || false)
    }
    handleColumnMenuClose()
  }

  // Handle rows in view change
  const handleRowsInViewChange = event => {
    const newValue = event.target.value
    setCurrentRowsInView(newValue)
    setUserChangedRowsInView(true)
  }

  // Render table header
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

                // Apply TanStack pinning styles
                ...getCommonPinningStyles(column),

                // ⬇️ Always keep header sticky (we may have overridden it above)
                position: 'sticky',
                top: 0,
                backgroundClip: 'padding-box',

                // Override zIndex for headers to be above body cells
                zIndex: isPinned ? 800 : 110,
                top: 0 // Ensure sticky header stays at top
              }}
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
                  {isPinned && <PushPinIcon sx={{ fontSize: 16, opacity: 0.7 }} />}
                </Box>

                {modifyColumnPinning && (
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

  const renderTableBody = () => {
    // Initial load ONLY: no data yet
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

    // Normal: data render hota rahe, chahe loading true hi kyu na ho
    const pageRows = table.getRowModel().rows

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
          if (idx < currentRowsInView) rowRefs.current[idx] = el
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
                onCellClick && onCellClick(cell.getValue(), row.original)
              }}
              sx={{
                borderBottom: isLastRow ? 'none' : '1px solid #ddd',
                borderRight: isPinned && '1px solid #ddd',
                textAlign: cellTextAlign,
                padding: '8px 16px',
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
  // Render footer with pagination
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
        {/* Rows in view selector (placed next to pagination) */}
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
            '& .MuiTablePagination-toolbar': {
              minHeight: 52
            },
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
          // height: loading ? loadingHeight : dynamicTableHeight,
          // overflow: loading ? 'hidden' : 'auto',
          // ⬇️ initial load (no data) me large calculated height, otherwise dynamic
          height: loading && !hasData ? loadingHeight : dynamicTableHeight,
          position: 'relative',
          border: '1px solid #ddd',
          // ⬇️ overflow ko hidden mat karo, taaki data visible rahe
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
            tableLayout: 'fixed' // ⟵ add this
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
            zIndex: 9999, // header/cells se upar
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: hasData ? 'rgba(6, 5, 5, 0.08)' : 'transparent',
            // hasData par interactions block ho jayein (DataGrid jaise)
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
