'use client'

import React from 'react'
import { Avatar, Box, Typography, Tooltip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { GridColDef } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import NoDataFound from 'src/views/utility/NoDataFound'
import AnimalCard from 'src/views/utility/AnimalCard'
import CommonTable from 'src/views/table/data-grid/CommonTable'

/**
 * Shared, on-system UI primitives for the Species Management detail tabs.
 * All visuals use theme tokens + Typography variants only (no hardcoded hex / font sizes).
 * The prototype hand-rolls SVG/CSS bars; we replicate with MUI Box + tokens (SSR-safe, on-system).
 */

type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary'

const cc = (theme: any) => theme.palette.customColors as Record<string, string>

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "2025-07" → "Jul '25"; passes through anything that isn't a YYYY-MM string. */
const fmtMonth = (v: any): string => {
  const m = /^(\d{4})-(\d{2})$/.exec(String(v))
  if (!m) return String(v ?? '')

  return `${MONTH_ABBR[Number(m[2]) - 1] ?? m[2]} '${m[1].slice(2)}`
}

/** Resolve a semantic tone to {bg, fg} token colors. */
export const useTone = () => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (tone: Tone): { bg: string; fg: string } => {
    switch (tone) {
      case 'success':
        return { bg: `${theme.palette.primary.main}1A`, fg: theme.palette.primary.dark }
      case 'warning':
        return { bg: c.BgTeritary, fg: c.Tertiary }
      case 'error':
        return { bg: `${c.Tertiary}26`, fg: c.Tertiary }
      case 'info':
        return { bg: c.antzSecondaryBg, fg: theme.palette.secondary.main }
      case 'primary':
        return { bg: c.OnBackground, fg: theme.palette.primary.main }
      default:
        return { bg: c.SurfaceVariant, fg: c.OnSurfaceVariant }
    }
  }
}

export const SectionTitle: React.FC<{ children: React.ReactNode; sx?: object }> = ({ children, sx }) => (
  <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 2, ...sx }}>
    {children}
  </Typography>
)

export const SectionCard: React.FC<{
  title?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  sx?: object
  titleMb?: number
  /** When set, the whole card becomes clickable (pointer + subtle lift on hover). */
  onClick?: () => void
}> = ({ title, action, children, sx, titleMb = 3, onClick }) => {
  const theme = useTheme() as any

  return (
    <Box
      onClick={onClick}
      sx={{
        borderRadius: '10px',
        border: `1px solid ${cc(theme).SurfaceVariant}`,
        backgroundColor: theme.palette.background.paper,
        p: 4,
        ...(onClick && {
          cursor: 'pointer',
          transition: 'transform .15s ease, box-shadow .15s ease',
          '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 16px rgba(31,81,91,0.12)' }
        }),
        ...sx
      }}
    >
      {(title || action) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: titleMb }}>
          {typeof title === 'string' ? (
            <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
          ) : (
            title
          )}
          {action}
        </Box>
      )}
      {children}
    </Box>
  )
}

/** A single label → value pair (used heavily across Profile / detail sections). */
export const LabelValue: React.FC<{ label: string; value?: React.ReactNode; icon?: string }> = ({
  label,
  value,
  icon
}) => {
  const theme = useTheme() as any
  if (value === undefined || value === null || value === '' || value === '-') return null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {icon && <Icon icon={icon} fontSize={16} color={cc(theme).Outline} />}
        <Typography variant='caption' sx={{ color: cc(theme).neutralSecondary, textTransform: 'uppercase' }}>
          {label}
        </Typography>
      </Box>
      <Typography variant='body1' sx={{ color: cc(theme).OnSurfaceVariant }}>
        {value}
      </Typography>
    </Box>
  )
}

/** Big metric tile (overview cards). */
export const StatTile: React.FC<{
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  tone?: Tone
  onClick?: () => void
}> = ({ label, value, sub, tone = 'neutral', onClick }) => {
  const theme = useTheme() as any
  const tones = useTone()
  const { fg } = tones(tone)

  return (
    <Box
      onClick={onClick}
      sx={{
        borderRadius: '10px',
        border: `1px solid ${cc(theme).SurfaceVariant}`,
        backgroundColor: theme.palette.background.paper,
        p: 3,
        minWidth: 130,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow .15s ease',
        '&:hover': onClick ? { boxShadow: 2 } : undefined
      }}
    >
      <Typography variant='caption' sx={{ color: cc(theme).neutralSecondary, textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography variant='h5' sx={{ color: tone === 'neutral' ? cc(theme).OnSurface : fg, mt: 0.5, whiteSpace: 'nowrap' }}>
        {value}
      </Typography>
      {sub != null && (
        <Typography variant='caption' sx={{ color: cc(theme).neutralSecondary }}>
          {sub}
        </Typography>
      )}
    </Box>
  )
}

/** Status / category chip in a semantic tone. */
export const StatusChip: React.FC<{ label: React.ReactNode; tone?: Tone; fg?: string }> = ({ label, tone = 'neutral', fg: fgOverride }) => {
  const tones = useTone()
  const { bg, fg } = tones(tone)

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: 1.5,
        py: 0.5,
        borderRadius: '6px',
        backgroundColor: bg
      }}
    >
      <Typography variant='caption' sx={{ fontWeight: 600, color: fgOverride || fg }}>
        {label}
      </Typography>
    </Box>
  )
}

/**
 * Standard animal-card list for side sheets — one AnimalCard per row, with a hairline divider
 * and breathing space between each. Use this EVERYWHERE an animal-card list appears in a sheet
 * (Housing / Pairing / Assessments …) so the styling stays consistent. Pass pre-mapped card data.
 */
export const AnimalCardList: React.FC<{ cards: any[]; onClick?: (index: number) => void }> = ({ cards, onClick }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {cards.map((data, i) => (
        <Box
          key={i}
          onClick={onClick ? () => onClick(i) : undefined}
          sx={{
            py: 2.5,
            borderBottom: i < cards.length - 1 ? `1px solid ${c.SurfaceVariant}` : 'none',
            ...(onClick
              ? { cursor: 'pointer', borderRadius: '8px', transition: '0.15s', '&:hover': { bgcolor: c.Surface } }
              : {})
          }}
        >
          <AnimalCard data={data} />
        </Box>
      ))}
    </Box>
  )
}

/**
 * Standard data-table styling for the detail tabs — tall rows (so every table matches), aligned
 * L/R padding (header lines up with cells), and a slightly larger header. Use this as the
 * `externalTableStyle` on every CommonTable in the module; spread it and add table-specific rules.
 */
/** Uniform row height for every detail data table (use DetailTable below). */
export const DETAIL_TABLE_ROW_H = 64

/**
 * The standard data table for the detail module. Wraps CommonTable with consistent tall rows,
 * aligned padding and header. USE THIS for every table here (and any new one) so they all match.
 * Pass already-indexed rows (each with `id` + `sl_no`).
 */
export const DetailTable: React.FC<{
  columns: GridColDef[]
  rows: any[]
  total: number
  paginationModel: { page: number; pageSize: number }
  setPaginationModel: (m: any) => void
  onRowClick?: (params: any) => void
  rowHeight?: number
  /** Enable header sorting: pass a controlled sort model + change handler. Omit for a static table. */
  sortModel?: { field: string; sort: 'asc' | 'desc' | null | undefined }[]
  handleSortModel?: (model: any) => void
}> = ({
  columns,
  rows,
  total,
  paginationModel,
  setPaginationModel,
  onRowClick,
  rowHeight = DETAIL_TABLE_ROW_H,
  sortModel,
  handleSortModel
}) => (
  <CommonTable
    columns={columns}
    indexedRows={rows}
    total={total}
    loading={false}
    paginationModel={paginationModel}
    setPaginationModel={setPaginationModel}
    handleSortModel={handleSortModel ?? (() => {})}
    sortModel={sortModel}
    sortingOrder={handleSortModel ? ['desc', 'asc'] : undefined}
    searchValue=''
    getRowHeight={() => rowHeight}
    onRowClick={onRowClick}
    externalTableStyle={{
      '& .MuiDataGrid-cell': { paddingLeft: '20px !important', paddingRight: '16px !important', display: 'flex', alignItems: 'center', fontSize: '1rem' },
      '& .MuiDataGrid-columnHeader': { paddingLeft: '20px !important', paddingRight: '16px !important' },
      // Never clip a header — let it wrap to two lines instead of showing "OVER…".
      '& .MuiDataGrid-columnHeaderTitle': { fontSize: '0.95rem', whiteSpace: 'normal', lineHeight: 1.2, overflow: 'visible', textOverflow: 'clip' },
      '& .MuiDataGrid-columnHeaderTitleContainerContent': { overflow: 'visible' },
      ...(onRowClick ? { '& .MuiDataGrid-row': { cursor: 'pointer' } } : {})
    }}
  />
)

/** Pill used for taxonomy / link badges. */
export const Pill: React.FC<{ label: React.ReactNode; onClick?: () => void; icon?: string }> = ({
  label,
  onClick,
  icon
}) => {
  const theme = useTheme() as any

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.5,
        py: 0.5,
        borderRadius: '16px',
        border: `1px solid ${cc(theme).OutlineVariant}`,
        backgroundColor: cc(theme).Surface,
        color: cc(theme).OnSurfaceVariant,
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      {icon && <Icon icon={icon} fontSize={14} />}
      <Typography variant='caption'>{label}</Typography>
    </Box>
  )
}

/** Horizontal value bar (faithful to the prototype's CSS distribution bars). Optionally clickable. */
export const MiniBarRow: React.FC<{
  label: React.ReactNode
  value: number
  max: number
  tone?: Tone
  trailing?: React.ReactNode
  onClick?: () => void
}> = ({ label, value, max, tone = 'primary', trailing, onClick }) => {
  const theme = useTheme() as any
  const tones = useTone()
  const { fg } = tones(tone)
  const pct = max > 0 ? Math.round((value / max) * 100) : 0

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        py: 0.75,
        px: onClick ? 1 : 0,
        mx: onClick ? -1 : 0,
        borderRadius: '6px',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { backgroundColor: cc(theme).Surface } : undefined
      }}
    >
      <Typography variant='body2' sx={{ width: 160, color: cc(theme).OnSurfaceVariant, flexShrink: 0 }} noWrap>
        {label}
      </Typography>
      <Box sx={{ flex: 1, height: 8, borderRadius: '4px', backgroundColor: cc(theme).SurfaceVariant }}>
        <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: '4px', backgroundColor: fg }} />
      </Box>
      <Typography variant='caption' sx={{ width: 56, textAlign: 'right', color: cc(theme).neutralSecondary }}>
        {trailing ?? value.toLocaleString()}
      </Typography>
      {onClick && <Icon icon='mdi:chevron-right' fontSize={16} color={cc(theme).Outline} />}
    </Box>
  )
}

/**
 * Drawer listing the entities (animals) behind a chart datapoint — makes graphs drillable.
 * Rows whose id is "real" (resolvable via onItemClick) are clickable into a deeper view;
 * synthetic/boost entries render as plain rows.
 */
export const EntityListDrawer: React.FC<{
  open: boolean
  title?: React.ReactNode
  subtitle?: React.ReactNode
  unit?: string
  items?: { id: string; name?: string; value?: number; sub?: string }[]
  isClickable?: (id: string) => boolean
  onItemClick?: (id: string) => void
  onClose: () => void
}> = ({ open, title, subtitle, unit, items = [], isClickable, onItemClick, onClose }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Box
      component='div'
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: theme.zIndex.drawer + 2,
        pointerEvents: open ? 'auto' : 'none'
      }}
      style={{ display: open ? 'block' : 'none' }}
    >
      <Box onClick={onClose} sx={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.32)' }} />
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          height: '100%',
          width: { xs: '100%', sm: 460 },
          backgroundColor: theme.palette.background.paper,
          p: 4,
          overflowY: 'auto',
          boxShadow: 6
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            {subtitle != null && (
              <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box onClick={onClose} sx={{ cursor: 'pointer', display: 'flex' }}>
            <Icon icon='mdi:close' />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {items.map((it, i) => {
            const clickable = !!onItemClick && (!isClickable || isClickable(it.id))

            return (
              <Box
                key={i}
                onClick={clickable ? () => onItemClick?.(it.id) : undefined}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  py: 2.75,
                  borderBottom: `1px solid ${c.SurfaceVariant}`,
                  cursor: clickable ? 'pointer' : 'default',
                  '&:hover': clickable ? { backgroundColor: c.Surface } : undefined
                }}
              >
                <Avatar
                  src='/images/branding/Antz_logomark_h_color.svg'
                  sx={{ width: 42, height: 42, flexShrink: 0, bgcolor: c.Surface, '& img': { objectFit: 'contain', padding: '6px' } }}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: c.OnSurfaceVariant }} noWrap>
                    {it.name || it.id}
                  </Typography>
                  {it.sub && (
                    <Typography variant='caption' sx={{ color: c.neutralSecondary, display: 'block' }} noWrap>
                      {it.sub}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                  {it.value != null && (
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: c.OnSurface, lineHeight: 1.2 }}>
                        {it.value}
                      </Typography>
                      {unit && (
                        <Typography variant='caption' sx={{ color: c.neutralSecondary, display: 'block' }}>
                          {unit}
                        </Typography>
                      )}
                    </Box>
                  )}
                  {clickable && <Icon icon='mdi:chevron-right' fontSize={18} color={c.Outline} />}
                </Box>
              </Box>
            )
          })}
          {!items.length && <EmptyState message='No animals in this group' />}
        </Box>
      </Box>
    </Box>
  )
}

/** Stacked horizontal bar of segments (gender split, survival buckets, ID distribution).
 * Pass `legend` to show a dot/label/value key beneath — without it the colors are opaque. */
export const StackedBar: React.FC<{ segments: { label: string; value: number; tone: Tone }[]; legend?: boolean }> = ({
  segments,
  legend = false
}) => {
  const tones = useTone()
  const total = segments.reduce((s, x) => s + x.value, 0) || 1

  return (
    <Box>
      <Box sx={{ display: 'flex', width: '100%', height: 10, borderRadius: '5px', overflow: 'hidden' }}>
        {segments.map((seg, i) => {
          const { fg } = tones(seg.tone)
          const pct = (seg.value / total) * 100
          if (pct <= 0) return null

          return (
            <Tooltip key={i} title={`${seg.label}: ${seg.value.toLocaleString()} (${Math.round(pct)}%)`} arrow>
              <Box sx={{ width: `${pct}%`, backgroundColor: fg, height: '100%' }} />
            </Tooltip>
          )
        })}
      </Box>
      {legend && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', mt: 1.5 }}>
          {segments
            .filter(s => s.value > 0)
            .map((s, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.625 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: tones(s.tone).fg, flexShrink: 0 }} />
                <Typography variant='caption' sx={{ color: 'customColors.OnSurfaceVariant' }}>
                  {s.label}{' '}
                  <Box component='span' sx={{ color: 'customColors.neutralSecondary' }}>
                    {s.value.toLocaleString()}
                  </Box>
                </Typography>
              </Box>
            ))}
        </Box>
      )}
    </Box>
  )
}

/** Vertical column trend (year-month / seasonal). `baseline` lifts the floor so small
 * variations read clearly (e.g. weight trend anchored at the species minimum). */
export const ColumnTrend: React.FC<{
  data: { label: string; value: number }[]
  tone?: Tone
  height?: number
  baseline?: number
}> = ({ data, tone = 'primary', height = 120, baseline }) => {
  const theme = useTheme() as any
  const tones = useTone()
  const { fg } = tones(tone)
  const max = Math.max(1, ...data.map(d => d.value))
  const base = baseline != null ? baseline : 0
  const denom = Math.max(1, max - base)

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height, overflowX: 'auto', pb: 1 }}>
      {data.map((d, i) => (
        <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 24, flex: 1 }}>
          <Tooltip title={`${d.label}: ${d.value.toLocaleString()}`} arrow>
            <Box
              sx={{
                width: '70%',
                height: `${Math.max(2, (Math.max(0, d.value - base) / denom) * (height - 24))}px`,
                backgroundColor: fg,
                borderRadius: '3px 3px 0 0'
              }}
            />
          </Tooltip>
          <Typography variant='caption' sx={{ color: cc(theme).neutralSecondary, mt: 0.5, fontSize: 10 }} noWrap>
            {d.label}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

/** Min–avg–max range bar: a track from min→max with an avg marker. For numeric assessment types. */
export const RangeBar: React.FC<{ min: number; avg: number; max: number; tone?: Tone }> = ({
  min,
  avg,
  max,
  tone = 'info'
}) => {
  const theme = useTheme() as any
  const tones = useTone()
  const { fg } = tones(tone)
  const span = max - min
  const avgPct = span > 0 ? Math.min(100, Math.max(0, ((avg - min) / span) * 100)) : 50

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ position: 'relative', height: 6, borderRadius: '3px', backgroundColor: cc(theme).SurfaceVariant }}>
        <Box
          sx={{
            position: 'absolute',
            top: -2,
            left: `${avgPct}%`,
            transform: 'translateX(-50%)',
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: fg,
            border: `2px solid ${theme.palette.background.paper}`
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
        <Typography variant='caption' sx={{ color: cc(theme).neutralSecondary }}>
          {min}
        </Typography>
        <Typography variant='caption' sx={{ color: cc(theme).neutralSecondary }}>
          {max}
        </Typography>
      </Box>
    </Box>
  )
}

/** Signed delta chip: e.g. "+12%" green / "-8%" orange, neutral near zero. */
export const DeltaChip: React.FC<{ pct: number; suffix?: string }> = ({ pct, suffix = '%' }) => {
  const tone: Tone = pct > 1 ? 'success' : pct < -1 ? 'warning' : 'neutral'

  return <StatusChip label={`${pct > 0 ? '+' : ''}${pct}${suffix}`} tone={tone} />
}

/** Compact inline trend bars (for type cards — smaller than ColumnTrend). */
export const SparkBars: React.FC<{ values: number[]; tone?: Tone; height?: number }> = ({
  values,
  tone = 'info',
  height = 28
}) => {
  const theme = useTheme() as any
  const tones = useTone()
  const { fg } = tones(tone)
  if (!values.length) return null
  const max = Math.max(1, ...values)

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height }}>
      {values.map((v, i) => (
        <Box
          key={i}
          sx={{
            flex: 1,
            minWidth: 3,
            height: `${Math.max(2, (v / max) * height)}px`,
            backgroundColor: fg,
            borderRadius: '2px 2px 0 0',
            opacity: 0.35 + 0.65 * (i / Math.max(1, values.length - 1))
          }}
        />
      ))}
    </Box>
  )
}

/**
 * Compact inline line sparkline (SVG, no chart lib) for table trend cells — a thin trend line
 * with a dot on the latest point. `tone` sets the stroke: up = green, down = orange, flat/info = neutral/teal.
 * Fixed size so it sits cleanly inside a DataGrid cell; needs ≥2 points.
 */
export const Sparkline: React.FC<{ values: number[]; tone?: 'up' | 'down' | 'flat' | 'info'; width?: number; height?: number }> = ({
  values,
  tone = 'flat',
  width = 150,
  height = 30
}) => {
  const theme = useTheme() as any
  const c = cc(theme)
  if (!values || values.length < 2) return null
  const color =
    tone === 'up'
      ? theme.palette.primary.main
      : tone === 'down'
        ? c.Tertiary
        : tone === 'info'
          ? theme.palette.secondary.main
          : c.neutralSecondary
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pad = 4
  const n = values.length
  const px = (i: number) => pad + (i / (n - 1)) * (width - 2 * pad)
  const py = (v: number) => height - pad - ((v - min) / span) * (height - 2 * pad)
  const pts = values.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', flexShrink: 0 }}>
      <polyline points={pts} fill='none' stroke={color} strokeWidth={1.5} strokeLinejoin='round' strokeLinecap='round' />
      <circle cx={px(n - 1)} cy={py(values[n - 1])} r={2.75} fill={color} />
    </svg>
  )
}

/**
 * Vertical column histogram (SVG-free, CSS bars) for score/range buckets — colored per-bar by tone,
 * count label on top, bucket label under, optional legend. Bars are clickable to drill. Attractive +
 * interactive: hover lifts the bar. Use for numeric distributions (BCS scores, weight ranges).
 */
export const VBarChart: React.FC<{
  bars: { label: string; count: number; tone?: Tone }[]
  legend?: { label: string; tone: Tone }[]
  height?: number
  onSelect?: (label: string) => void
}> = ({ bars, legend, height = 210, onSelect }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const tones = useTone()
  if (!bars.length) return null
  const max = Math.max(1, ...bars.map(b => b.count))
  const plot = height - 46

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height, borderBottom: `1px solid ${c.SurfaceVariant}` }}>
        {bars.map(b => {
          const { fg } = tones(b.tone || 'primary')
          const h = Math.max(3, (b.count / max) * plot)

          return (
            <Box
              key={b.label}
              onClick={() => onSelect?.(b.label)}
              sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 0.75, cursor: onSelect ? 'pointer' : 'default', minWidth: 0 }}
            >
              <Typography variant='caption' sx={{ fontWeight: 700, color: c.OnSurfaceVariant }}>
                {b.count.toLocaleString()}
              </Typography>
              <Tooltip title={`${b.label}: ${b.count.toLocaleString()}`} arrow>
                <Box
                  sx={{
                    width: '68%',
                    maxWidth: 60,
                    height: `${h}px`,
                    backgroundColor: fg,
                    borderRadius: '6px 6px 0 0',
                    transition: 'opacity .15s ease, transform .15s ease',
                    '&:hover': onSelect ? { opacity: 0.82, transform: 'translateY(-3px)' } : undefined
                  }}
                />
              </Tooltip>
            </Box>
          )
        })}
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5, mt: 0.75 }}>
        {bars.map(b => (
          <Typography key={b.label} variant='caption' sx={{ flex: 1, textAlign: 'center', color: c.neutralSecondary }} noWrap>
            {b.label}
          </Typography>
        ))}
      </Box>
      {legend?.length ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', mt: 2 }}>
          {legend.map(l => (
            <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '3px', backgroundColor: tones(l.tone).fg }} />
              <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
                {l.label}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  )
}

/** Hand-rolled SVG donut (stroke-dasharray arcs) with centered value. */
export const Donut: React.FC<{ segments: { label: string; value: number; tone: Tone }[]; centerValue: React.ReactNode; centerSub?: string; centerColor?: string; size?: number }> = ({
  segments,
  centerValue,
  centerSub,
  centerColor,
  size = 150
}) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const tones = useTone()
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const R = 54
  const SW = 16
  const CIRC = 2 * Math.PI * R
  let acc = 0

  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox='0 0 140 140'>
        <g transform='rotate(-90 70 70)'>
          <circle cx='70' cy='70' r={R} fill='none' stroke={c.SurfaceVariant} strokeWidth={SW} />
          {segments.map((s, i) => {
            const len = (s.value / total) * CIRC
            const node = (
              <circle key={i} cx='70' cy='70' r={R} fill='none' stroke={tones(s.tone).fg} strokeWidth={SW} strokeDasharray={`${len} ${CIRC - len}`} strokeDashoffset={-acc} />
            )
            acc += len

            return node
          })}
        </g>
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant='h5' sx={{ color: centerColor || cc(theme).OnSurfaceVariant, lineHeight: 1 }}>
          {centerValue}
        </Typography>
        {centerSub && (
          <Typography variant='caption' sx={{ color: c.neutralSecondary, textTransform: 'uppercase' }}>
            {centerSub}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

/** "Intelligence" card: donut + legend (value + %) + optional insight lines (icon · label · value). */
export const IntelligenceCard: React.FC<{
  title: string
  segments: { label: string; value: number; tone: Tone }[]
  centerValue: React.ReactNode
  centerSub?: string
  centerColor?: string
  insights?: { icon: string; tone: Tone; label: string; value: React.ReactNode }[]
}> = ({ title, segments, centerValue, centerSub, centerColor, insights }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const tones = useTone()
  const total = segments.reduce((s, x) => s + x.value, 0) || 1

  return (
    <SectionCard title={title}>
      <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <Donut segments={segments} centerValue={centerValue} centerSub={centerSub} centerColor={centerColor} />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {segments.map(s => (
            <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '3px', backgroundColor: tones(s.tone).fg, flexShrink: 0 }} />
              <Typography variant='body2' sx={{ color: c.OnSurfaceVariant, flex: 1 }} noWrap>
                {s.label}
              </Typography>
              <Typography variant='subtitle2' sx={{ fontWeight: 700, color: c.OnSurfaceVariant }}>
                {s.value.toLocaleString()}
              </Typography>
              <Typography variant='caption' sx={{ color: c.neutralSecondary, width: 40, textAlign: 'right' }}>
                {Math.round((s.value / total) * 100)}%
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
      {insights?.length ? (
        <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${c.SurfaceVariant}`, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {insights.map((it, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Icon icon={it.icon} fontSize={16} color={tones(it.tone).fg} />
              <Typography variant='caption' sx={{ fontWeight: 600, color: tones(it.tone).fg }}>
                {it.label}
              </Typography>
              <Typography variant='caption' sx={{ color: c.OnSurfaceVariant }}>
                {it.value}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : null}
    </SectionCard>
  )
}

/**
 * Clean horizontal distribution bars (CSS flexbox — no chart lib). One row per category:
 * label · track-with-fill · count. Sorted high→low, single accent color, rounded bars.
 * Click a row to drill in. Replaces the prior Recharts vertical layout, which collapsed
 * bars and detached axis labels inside narrow card columns.
 */
export const DistributionBarChart: React.FC<{
  data: { label: string; count: number }[]
  tone?: Tone
  onSelect?: (label: string) => void
}> = ({ data, tone = 'primary', onSelect }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const tones = useTone()
  const { fg } = tones(tone)
  if (!data.length) return null
  const rows = [...data].sort((a, b) => b.count - a.count)
  const max = Math.max(1, ...rows.map(d => d.count))

  return (
    <Box>
      {rows.map(d => (
        <Box
          key={d.label}
          onClick={() => onSelect?.(d.label)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            py: 0.75,
            cursor: onSelect ? 'pointer' : 'default',
            '&:hover': onSelect ? { opacity: 0.85 } : undefined
          }}
        >
          <Typography variant='body2' noWrap sx={{ width: 150, flexShrink: 0, color: c.OnSurfaceVariant }}>
            {d.label}
          </Typography>
          <Box sx={{ flex: 1, height: 10, bgcolor: c.Surface, borderRadius: 5, overflow: 'hidden', minWidth: 0 }}>
            <Box sx={{ width: `${(d.count / max) * 100}%`, height: '100%', bgcolor: fg, borderRadius: 5, transition: '0.2s' }} />
          </Box>
          <Typography variant='subtitle2' sx={{ width: 44, textAlign: 'right', fontWeight: 700, color: c.OnSurfaceVariant }}>
            {d.count.toLocaleString()}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

interface TrendSeries {
  values: number[]
  color: string
  /** unique gradient id within the page */
  gradId: string
}

/**
 * Hand-rolled SVG trend engine (1..N filled series on shared axes). recharts 2.4.3 renders
 * area charts with broken/swapped axes in this app — category X-axis emits no ticks and the
 * Y-axis falls into category mode — so we draw the chart directly. viewBox coords scale with
 * the container; strokes use non-scaling-stroke so they stay crisp. X labels are the data
 * labels (months), thinned to avoid crowding; Y labels are a 3-stop gutter.
 */
const SvgTrend: React.FC<{ labels: string[]; series: TrendSeries[]; height: number }> = ({ labels, series, height }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const VBW = 1000
  const VBH = 260
  const W_GUTTER = 40
  const n = labels.length
  const max = Math.max(1, ...series.flatMap(s => s.values))
  const px = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * VBW)
  const py = (v: number) => VBH - (v / max) * VBH
  const linePath = (vals: number[]) => vals.map((v, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ')
  const areaPath = (vals: number[]) => `${linePath(vals)} L${VBW},${VBH} L0,${VBH} Z`
  const yLabels = [max, Math.round(max / 2), 0]
  const step = Math.ceil(n / 12) // show ~12 x-labels max

  return (
    <>
      <Box sx={{ position: 'relative', height }}>
        {/* Y-axis labels */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: W_GUTTER,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            pr: 1
          }}
        >
          {yLabels.map(v => (
            <Typography key={v} variant='caption' sx={{ color: c.neutralSecondary, lineHeight: 1 }}>
              {v.toLocaleString()}
            </Typography>
          ))}
        </Box>
        {/* Plot */}
        <Box sx={{ position: 'absolute', left: W_GUTTER, right: 0, top: 0, bottom: 0 }}>
          <svg width='100%' height='100%' viewBox={`0 0 ${VBW} ${VBH}`} preserveAspectRatio='none'>
            <defs>
              {series.map(s => (
                <linearGradient key={s.gradId} id={s.gradId} x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='0%' stopColor={s.color} stopOpacity={0.28} />
                  <stop offset='100%' stopColor={s.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            {[0, VBH / 2, VBH].map(gy => (
              <line key={gy} x1='0' y1={gy} x2={VBW} y2={gy} stroke={c.SurfaceVariant} strokeWidth='1' vectorEffect='non-scaling-stroke' />
            ))}
            {series.map(s => (
              <path key={`a-${s.gradId}`} d={areaPath(s.values)} fill={`url(#${s.gradId})`} stroke='none' />
            ))}
            {series.map(s => (
              <path key={`l-${s.gradId}`} d={linePath(s.values)} fill='none' stroke={s.color} strokeWidth='2' vectorEffect='non-scaling-stroke' strokeLinejoin='round' />
            ))}
          </svg>
        </Box>
      </Box>
      {/* X axis */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: `${W_GUTTER}px`, mt: 0.75 }}>
        {labels.map((label, i) => (
          <Typography key={`${label}-${i}`} variant='caption' sx={{ color: c.neutralSecondary, whiteSpace: 'nowrap' }}>
            {i % step === 0 || i === n - 1 ? fmtMonth(label) : ''}
          </Typography>
        ))}
      </Box>
    </>
  )
}

/** Clean filled single-series trend (hand-rolled SVG — see SvgTrend). */
export const TrendAreaChart: React.FC<{ data: { label: string; value: number }[]; tone?: Tone; height?: number }> = ({
  data,
  tone = 'primary',
  height = 140
}) => {
  const tones = useTone()
  const { fg } = tones(tone)
  if (!data.length) return null

  return (
    <Box>
      <SvgTrend
        labels={data.map(d => d.label)}
        series={[{ values: data.map(d => d.value), color: fg, gradId: `trend-${tone}` }]}
        height={height}
      />
    </Box>
  )
}

export const EmptyState: React.FC<{ message?: string }> = ({ message = 'No data available' }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6 }}>
    <NoDataFound />
    <Typography variant='body2' sx={{ color: 'customColors.neutralSecondary', mt: 1 }}>
      {message}
    </Typography>
  </Box>
)

/** Grid wrapper for stat tiles / cards. */
export const TileGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 2 }}>
    {children}
  </Box>
)
