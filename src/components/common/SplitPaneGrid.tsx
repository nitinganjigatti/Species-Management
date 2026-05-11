import React from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'

// SplitPaneGrid — a generic two-pane matrix layout:
//
//   ┌──────────────┬──────────────────────────────────────┐
//   │ corner       │  col header  │  col header  │  ...   │ ← sticky header row
//   ├──────────────┼──────────────┼──────────────┼────────┤
//   │ row header   │   cell       │   cell       │  ...   │
//   │ row header   │   cell       │   cell       │  ...   │
//   └──────────────┴──────────────────────────────────────┘
//
// The left column is fixed; the right side scrolls horizontally when columns overflow.
// Both panes share row heights (via grid-auto-rows + gap), so rows on the left and right stay aligned.
// The component is data-agnostic — callers supply rows, columns, and three render functions.

export interface SplitPaneGridProps<R, C> {
  rows: R[]
  columns: C[]

  // Identity for keys — defaults to array index when not provided.
  getRowKey?: (row: R, index: number) => React.Key
  getColumnKey?: (col: C, index: number) => React.Key

  // Renderers — each fully owns its visual treatment (cards, borders, hover, etc).
  renderRowHeader: (row: R, rowIndex: number) => React.ReactNode
  renderColumnHeader: (col: C, colIndex: number) => React.ReactNode
  renderCell: (row: R, col: C, rowIndex: number, colIndex: number) => React.ReactNode
  renderCornerHeader?: () => React.ReactNode

  // Optional content above the grid (e.g. a "Range X-Y / Total" sub-header bar).
  topBar?: React.ReactNode

  // Layout knobs — px values, except `gap` which is in MUI spacing units.
  leftColumnWidth?: number
  columnWidth?: number
  headerHeight?: number
  rowHeight?: number
  gap?: number

  // Ref forwarded to the horizontal scroll container.
  scrollRef?: React.RefObject<HTMLDivElement | null>

  // States
  loading?: boolean
  empty?: React.ReactNode
  emptyText?: string
}

const SplitPaneGrid = <R, C>({
  rows,
  columns,
  getRowKey,
  getColumnKey,
  renderRowHeader,
  renderColumnHeader,
  renderCell,
  renderCornerHeader,
  topBar,
  leftColumnWidth = 280,
  columnWidth = 220,
  headerHeight = 56,
  rowHeight = 140,
  gap = 1.5,
  loading = false,
  empty,
  emptyText = 'No data',
  scrollRef
}: SplitPaneGridProps<R, C>) => {
  const theme = useTheme() as any

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (rows.length === 0) {
    return (
      <Box>
        {topBar}
        <Box sx={{ py: 10, textAlign: 'center', color: theme.palette.text.secondary }}>
          {empty ?? <Typography variant='body2'>{emptyText}</Typography>}
        </Box>
      </Box>
    )
  }

  const rowKey = (r: R, i: number) => getRowKey?.(r, i) ?? i
  const colKey = (c: C, i: number) => getColumnKey?.(c, i) ?? i

  // Use a single explicit row template so both panes (left fixed + right grid) share row tracks.
  // First track is the header (headerHeight); the remaining N tracks are body rows (rowHeight each).
  const rowsTemplate = `${headerHeight}px repeat(${rows.length}, ${rowHeight}px)`

  return (
    <Box>
      {topBar}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
        {/* Left fixed column: corner + per-row headers. Same row template + gap as the right grid → aligned. */}
        <Box
          sx={{
            width: leftColumnWidth,
            flexShrink: 0,
            display: 'grid',
            gridTemplateRows: rowsTemplate,
            rowGap: gap,
            mr: gap
          }}
        >
          <Box>{renderCornerHeader?.() ?? null}</Box>
          {rows.map((row, rIdx) => (
            <Box key={rowKey(row, rIdx)} sx={{ minHeight: 0, overflow: 'hidden' }}>
              {renderRowHeader(row, rIdx)}
            </Box>
          ))}
        </Box>

        {/* Right scrollable area — horizontal overflow when columns exceed viewport. */}
        <Box ref={scrollRef} sx={{ flex: 1, overflowX: 'auto', minWidth: 0 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columns.length}, ${columnWidth}px)`,
              gridTemplateRows: rowsTemplate,
              gap,
              width: 'max-content'
            }}
          >
            {/* Header row */}
            {columns.map((col, cIdx) => (
              <Box key={`hdr-${String(colKey(col, cIdx))}`}>{renderColumnHeader(col, cIdx)}</Box>
            ))}

            {/* Body cells — row-major */}
            {rows.flatMap((row, rIdx) =>
              columns.map((col, cIdx) => (
                <Box
                  key={`cell-${String(rowKey(row, rIdx))}-${String(colKey(col, cIdx))}`}
                  sx={{ minHeight: 0, overflow: 'hidden' }}
                >
                  {renderCell(row, col, rIdx, cIdx)}
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default SplitPaneGrid
