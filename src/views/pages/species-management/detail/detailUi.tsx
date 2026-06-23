'use client'

import React from 'react'
import { Box, Typography, Tooltip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Area, AreaChart, Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'
import Icon from 'src/@core/components/icon'
import NoDataFound from 'src/views/utility/NoDataFound'

/**
 * Shared, on-system UI primitives for the Species Management detail tabs.
 * All visuals use theme tokens + Typography variants only (no hardcoded hex / font sizes).
 * The prototype hand-rolls SVG/CSS bars; we replicate with MUI Box + tokens (SSR-safe, on-system).
 */

type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary'

const cc = (theme: any) => theme.palette.customColors as Record<string, string>

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
}> = ({ title, action, children, sx }) => {
  const theme = useTheme() as any

  return (
    <Box
      sx={{
        borderRadius: '10px',
        border: `1px solid ${cc(theme).SurfaceVariant}`,
        backgroundColor: theme.palette.background.paper,
        p: 4,
        ...sx
      }}
    >
      {(title || action) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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
      <Typography variant='h5' sx={{ color: tone === 'neutral' ? cc(theme).OnSurface : fg, mt: 0.5 }}>
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
export const StatusChip: React.FC<{ label: React.ReactNode; tone?: Tone }> = ({ label, tone = 'neutral' }) => {
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
        backgroundColor: bg,
        color: fg
      }}
    >
      <Typography variant='caption' sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
    </Box>
  )
}

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
                  justifyContent: 'space-between',
                  gap: 2,
                  py: 1.25,
                  borderBottom: `1px solid ${c.SurfaceVariant}`,
                  cursor: clickable ? 'pointer' : 'default',
                  '&:hover': clickable ? { backgroundColor: c.Surface } : undefined
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant='body2' sx={{ color: c.OnSurfaceVariant }} noWrap>
                    {it.name || it.id}
                  </Typography>
                  {it.sub && (
                    <Typography variant='caption' sx={{ color: c.neutralSecondary }} noWrap>
                      {it.sub}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                  {it.value != null && (
                    <Typography variant='body2' sx={{ color: c.OnSurface }}>
                      {it.value}
                      {unit ? ` ${unit}` : ''}
                    </Typography>
                  )}
                  {clickable && <Icon icon='mdi:chevron-right' fontSize={16} color={c.Outline} />}
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

/** Stacked horizontal bar of segments (gender split, survival buckets, ID distribution). */
export const StackedBar: React.FC<{ segments: { label: string; value: number; tone: Tone }[] }> = ({ segments }) => {
  const tones = useTone()
  const total = segments.reduce((s, x) => s + x.value, 0) || 1

  return (
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
 * Clean horizontal distribution chart (Recharts). Minimal chrome — no axis lines, no grid,
 * value labels at the bar end, one accent color, rounded bars. Click a bar to drill in.
 */
export const DistributionBarChart: React.FC<{
  data: { label: string; count: number }[]
  tone?: Tone
  onSelect?: (label: string) => void
  rowHeight?: number
}> = ({ data, tone = 'primary', onSelect, rowHeight = 34 }) => {
  const theme = useTheme() as any
  const tones = useTone()
  const { fg } = tones(tone)
  const [hover, setHover] = React.useState<number | null>(null)
  if (!data.length) return null
  const height = data.length * rowHeight + 8
  const labelWidth = Math.min(170, Math.max(72, ...data.map(d => d.label.length * 7)))

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart
          data={data}
          layout='vertical'
          margin={{ top: 0, right: 36, bottom: 0, left: 0 }}
          barCategoryGap={6}
        >
          <XAxis type='number' hide />
          <YAxis
            type='category'
            dataKey='label'
            width={labelWidth}
            axisLine={false}
            tickLine={false}
            tick={{ fill: cc(theme).neutralSecondary, fontSize: 12 }}
          />
          <Bar
            dataKey='count'
            radius={[4, 4, 4, 4]}
            isAnimationActive={false}
            onClick={(_d: any, i: number) => onSelect?.(data[i].label)}
            onMouseEnter={(_d: any, i: number) => setHover(i)}
            onMouseLeave={() => setHover(null)}
            cursor={onSelect ? 'pointer' : 'default'}
          >
            {data.map((_d, i) => (
              <Cell key={i} fill={fg} fillOpacity={hover === null || hover === i ? 1 : 0.55} />
            ))}
            <LabelList
              dataKey='count'
              position='right'
              style={{ fill: cc(theme).neutralSecondary, fontSize: 12 }}
              formatter={(v: number) => v.toLocaleString()}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}

/** Clean filled trend (Recharts area) — replaces hand-rolled column bars for time series. */
export const TrendAreaChart: React.FC<{ data: { label: string; value: number }[]; tone?: Tone; height?: number }> = ({
  data,
  tone = 'primary',
  height = 140
}) => {
  const theme = useTheme() as any
  const tones = useTone()
  const { fg } = tones(tone)
  if (!data.length) return null
  const gid = `g-${tone}`

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width='100%' height='100%'>
        <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id={gid} x1='0' y1='0' x2='0' y2='1'>
              <stop offset='0%' stopColor={fg} stopOpacity={0.35} />
              <stop offset='100%' stopColor={fg} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey='label' axisLine={false} tickLine={false} tick={{ fill: cc(theme).neutralSecondary, fontSize: 11 }} interval='preserveStartEnd' minTickGap={24} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: cc(theme).neutralSecondary, fontSize: 11 }} width={32} allowDecimals={false} />
          <RTooltip
            cursor={{ stroke: cc(theme).OutlineVariant }}
            contentStyle={{ borderRadius: 8, border: `1px solid ${cc(theme).SurfaceVariant}`, fontSize: 12 }}
          />
          <Area type='monotone' dataKey='value' stroke={fg} strokeWidth={2} fill={`url(#${gid})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
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
