import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'

// SplitPaneGrid — a generic two-pane matrix layout:
//
//   ┌──────────────┬──────────────────────────────────────┐
//   │ corner       │  col header  │  col header  │  ...   │ ← sticky header strip
//   ├──────────────┼──────────────┼──────────────┼────────┤
//   │ row header   │   cell       │   cell       │  ...   │
//   │ row header   │   cell       │   cell       │  ...   │
//   └──────────────┴──────────────────────────────────────┘
//
// The left column is fixed; the right side scrolls horizontally when columns overflow.
//
// Layout note — header strip and body strip are *separate* flex rows, not one big grid. This
// matters for sticky positioning: the body's right pane needs `overflow-x: auto` for horizontal
// scrolling, and per the CSS Overflow spec that coerces `overflow-y` to `auto` too, turning the
// pane into a vertical scroll container. Anything `position: sticky` inside that container pins
// against the pane (which doesn't scroll vertically) instead of the viewport — so column headers
// nested inside would silently fail to stick. Separating the strips puts column headers under
// an overflow:hidden parent that mirrors the body's horizontal scroll via a scroll listener,
// while leaving the corner + column header strip free to stick against the viewport.

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

  // When true, the corner + column header row stays fixed while the body scrolls vertically.
  // Pair with `maxBodyHeight` to bound the scroll area (defaults to 70vh).
  stickyHeader?: boolean
  maxBodyHeight?: number | string

  // When true, the corner + column header row uses `position: fixed` instead of `position: sticky`.
  // Use this when an ancestor in the layout creates a scroll container (e.g. `overflow: hidden`)
  // that traps sticky — fixed pins to the viewport unconditionally, ignoring overflow ancestors.
  // The component measures its own outer container to keep left/width aligned with the in-flow
  // position; a spacer below the fixed bar reserves its height so the body doesn't shift up.
  fixedHeader?: boolean

  // Offset (px) applied to the header's `top`. Used by both stickyHeader and fixedHeader modes
  // to clear elements above (layout AppBar + any fixed page title bar).
  stickyTopOffset?: number | string

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
  scrollRef,
  stickyHeader = false,
  maxBodyHeight,
  fixedHeader = false,
  stickyTopOffset = 0
}: SplitPaneGridProps<R, C>) => {
  const theme = useTheme() as any

  // Body pane is the horizontal scroll source. The caller can pass its own ref (AssessmentGrid
  // uses it for programmatic column scroll), otherwise we hold one locally.
  const internalBodyRef = useRef<HTMLDivElement>(null)
  const bodyScrollRef = scrollRef ?? internalBodyRef

  // Header pane mirrors the body's horizontal scroll. `overflow-x: hidden` prevents the user from
  // scrolling it directly — the body is the source of truth.
  const headerScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const body = bodyScrollRef.current
    const header = headerScrollRef.current
    if (!body || !header) return
    const onScroll = () => {
      header.scrollLeft = body.scrollLeft
    }
    body.addEventListener('scroll', onScroll, { passive: true })

    return () => body.removeEventListener('scroll', onScroll)
  }, [bodyScrollRef])

  // Fixed-header mode: measure the outer container so the position:fixed bar can mirror its
  // left/width. Updates on resize and on sidebar collapse (ResizeObserver picks up the width
  // change). The header's own height is also measured so we can render a spacer that reserves
  // its slot in flow.
  const outerRef = useRef<HTMLDivElement>(null)
  const headerBarRef = useRef<HTMLDivElement>(null)
  const [outerRect, setOuterRect] = useState({ left: 0, width: 0 })
  const [headerBarHeight, setHeaderBarHeight] = useState(headerHeight)

  useLayoutEffect(() => {
    if (!fixedHeader) return
    const outer = outerRef.current
    if (!outer) return
    const update = () => {
      const r = outer.getBoundingClientRect()
      setOuterRect({ left: r.left, width: r.width })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(outer)
    window.addEventListener('resize', update)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [fixedHeader])

  useLayoutEffect(() => {
    if (!fixedHeader) return
    const bar = headerBarRef.current
    if (!bar) return
    const update = () => setHeaderBarHeight(bar.getBoundingClientRect().height)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(bar)

    return () => ro.disconnect()
  }, [fixedHeader])

  // Sticky mode (legacy): pins via position:sticky. Fails when an ancestor like
  // VerticalLayoutWrapper has `overflow: hidden`, which is why fixedHeader exists.
  const stickyStripSx = stickyHeader && !fixedHeader
    ? {
        position: 'sticky' as const,
        top: stickyTopOffset,
        zIndex: 5,
        backgroundColor: theme.palette.background.default
      }
    : undefined

  // Only wrap in a constrained scroll viewport when the caller explicitly asks for one.
  // Without maxBodyHeight, the page scrolls naturally and sticky pins against the viewport.
  const scrollAreaSx = stickyHeader && maxBodyHeight
    ? {
        maxHeight: maxBodyHeight,
        overflowY: 'auto' as const
      }
    : undefined

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

  const columnsTemplate = `repeat(${columns.length}, ${columnWidth}px)`
  const bodyRowsTemplate = `repeat(${rows.length}, ${rowHeight}px)`

  // Fixed mode positions the header strip out of flow. Left/width track the outer container so
  // the bar stays aligned with the in-flow content (including when the sidebar collapses).
  const fixedStripSx = fixedHeader
    ? {
        position: 'fixed' as const,
        top: stickyTopOffset,
        left: outerRect.left,
        width: outerRect.width,
        zIndex: 5,
        backgroundColor: theme.palette.background.default
      }
    : undefined

  return (
    <Box ref={outerRef}>
      {topBar}

      {/* Header strip — corner + column headers. In `fixedHeader` mode the strip is taken out of
          flow (position:fixed) and a spacer below reserves its height. In `stickyHeader` mode the
          strip stays in flow with position:sticky. Either way, the strip lives outside the body's
          overflow:auto container so the column headers align with the corner as one row. */}
      <Box
        ref={headerBarRef}
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          ...(fixedHeader ? fixedStripSx : { mb: gap, ...(stickyStripSx ?? {}) })
        }}
      >
        <Box sx={{ width: leftColumnWidth, flexShrink: 0, height: headerHeight, mr: gap }}>
          {renderCornerHeader?.() ?? null}
        </Box>
        <Box ref={headerScrollRef} sx={{ flex: 1, overflowX: 'hidden', minWidth: 0 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: columnsTemplate,
              height: headerHeight,
              columnGap: gap,
              width: 'max-content'
            }}
          >
            {columns.map((col, cIdx) => (
              <Box key={`hdr-${String(colKey(col, cIdx))}`}>{renderColumnHeader(col, cIdx)}</Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Spacer for the fixed header — reserves headerBarHeight + the gap that would have been
          applied via `mb` if the strip were in flow. */}
      {fixedHeader && <Box sx={{ height: headerBarHeight, mb: gap }} />}

      {/* Body strip — row headers (fixed left) + body cells (horizontally scrollable right).
          Row tracks are defined per pane but use the same template so left and right rows align. */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', ...(scrollAreaSx ?? {}) }}>
        <Box
          sx={{
            width: leftColumnWidth,
            flexShrink: 0,
            display: 'grid',
            gridTemplateRows: bodyRowsTemplate,
            rowGap: gap,
            mr: gap
          }}
        >
          {rows.map((row, rIdx) => (
            <Box key={rowKey(row, rIdx)} sx={{ minHeight: 0, overflow: 'hidden' }}>
              {renderRowHeader(row, rIdx)}
            </Box>
          ))}
        </Box>

        <Box ref={bodyScrollRef} sx={{ flex: 1, overflowX: 'auto', minWidth: 0 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: columnsTemplate,
              gridTemplateRows: bodyRowsTemplate,
              gap,
              width: 'max-content'
            }}
          >
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
