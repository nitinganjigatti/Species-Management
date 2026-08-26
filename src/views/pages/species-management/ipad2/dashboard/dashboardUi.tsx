'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import { SectionCard, useTone, thinScrollbarSx } from 'src/views/pages/species-management/ipad2/detail/detailUi'
import * as skin from 'src/views/pages/species-management/ipad2/skin'
import { BarColumns, RankRows, SliceKey, Slices, fmt } from 'src/views/pages/species-management/ipad2/marks'
import type { DashboardData, DashboardAlert } from 'src/types/species-management/dashboard'

export type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary'

/** Categorical palette = the CC series ramp (CVD-ordered, no adjacent pair collapses). */
const chartColors = (_theme: any): string[] => [...skin.SERIES]

const baseChartOptions = (theme: any) => ({
  chart: { toolbar: { show: false }, fontFamily: 'inherit', animations: { enabled: false } },
  states: { active: { filter: { type: 'none' } } },
  dataLabels: { enabled: false },
  tooltip: { theme: theme.palette.mode, style: { fontSize: '13px' } },
  // CC gridlines: solid near-invisible hairlines, never dashed.
  grid: { borderColor: skin.GRID, strokeDashArray: 0 }
})

// One consistent tooltip across every chart — the CC ChartTip: white card, 10px radius,
// deep soft shadow, caption-size type, a series dot per row.
const tooltipHTML = (_theme: any, title: string, rows: { color: string; label: string; value: string }[]) => {
  const head = `<div style="padding:8px 10px 2px;font-weight:600;font-size:12px;color:${skin.INK};">${title}</div>`
  const body = rows
    .map(
      r => `<div style="display:flex;align-items:center;gap:7px;padding:3px 10px 8px;">
        <span style="width:8px;height:8px;border-radius:50%;background:${r.color};display:inline-block;flex:none;"></span>
        <span style="font-size:12px;color:${skin.FAINT};">${r.label}</span>
        <span style="font-size:12px;font-weight:700;font-variant-numeric:tabular-nums;color:${skin.VALUE};">${r.value}</span>
      </div>`
    )
    .join('')

  return `<div style="font-family:inherit;background:#ffffff;border-radius:10px;box-shadow:${skin.SHADOW_TIP};overflow:hidden;">${head}${body}</div>`
}

/** Tooltip for the facet charts (bar/donut/pie/polar/radial): "Species: N species · M animals". */
const facetTooltip = (
  theme: any,
  data: { label: string; value: number; animalCount?: number }[],
  colors: string[],
  rowLabel = 'Species',
  valueFn?: (d: { label: string; value: number; animalCount?: number }) => string
) => ({
  enabled: true,
  fillSeriesColor: false, // pie/donut/polar default the tooltip bg to the slice color — keep it neutral
  custom: ({ seriesIndex, dataPointIndex }: any) => {
    const i = dataPointIndex != null && dataPointIndex >= 0 ? dataPointIndex : seriesIndex
    const d = data[i]
    if (!d) return ''
    const value = valueFn
      ? valueFn(d)
      : `${d.value.toLocaleString()} species${d.animalCount != null ? ` · ${d.animalCount.toLocaleString()} animals` : ''}`

    return tooltipHTML(theme, d.label, [{ color: colors[i % colors.length], label: rowLabel, value }])
  }
})

/** Shared legend row for the donut/pie charts — label · species · animals, each clickable to drill. */
const ChartLegend: React.FC<{
  data: { label: string; value: number; animalCount?: number; onClick?: () => void }[]
  colors: string[]
}> = ({ data, colors }) => (
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', mt: 2, justifyContent: 'center' }}>
    {data
      .filter(d => d.value > 0)
      .map((d, i) => (
        <Box
          key={d.label}
          onClick={d.onClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.625,
            cursor: d.onClick ? 'pointer' : 'default',
            '&:hover': d.onClick ? { opacity: 0.7 } : undefined
          }}
        >
          {/* CC SliceKey: a 9px rounded-SQUARE swatch, caption label in INK2, bold tabular value */}
          <Box sx={{ width: 9, height: 9, borderRadius: '2.5px', bgcolor: colors[i % colors.length], flexShrink: 0 }} />
          <Typography variant='caption' sx={{ fontSize: '13px', color: skin.INK2 }}>
            {d.label}{' '}
            <Box component='span' sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: skin.VALUE }}>
              {d.value.toLocaleString()}
            </Box>
          </Typography>
        </Box>
      ))}
  </Box>
)

export interface VitalSegment {
  label: string
  value: string
  /** Species / Animals — a larger green headline number with no bar. */
  total?: boolean
  /** Coverage bar fill (0–100) for the ratio metrics. */
  pct?: number
  /** Accent for the bar / % label. */
  tone?: 'primary' | 'secondary' | 'tertiary'
  onClick?: () => void
}

/** Layer 1 — the CC StatGrid: white cells on a hairline grid (the 1px gap IS the border),
 *  caption labels in FAINT, big tabular figures in VALUE (totals wear the accent ink),
 *  ratio metrics keep their coverage bar on the sage track. */
export function VitalStrip({ segments }: { segments: VitalSegment[] }) {
  const theme = useTheme() as any
  const cc = theme.palette.customColors
  // Bars stay FILLS (brand brights); the tiny % beside a figure is TYPE, so it wears ink.
  const fillOf = (t?: VitalSegment['tone']) =>
    t === 'tertiary' ? cc.Tertiary : t === 'secondary' ? theme.palette.secondary.main : skin.ACCENT_FILL
  const inkOf = (t?: VitalSegment['tone']) => skin.strokeOf(fillOf(t))

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' },
        gap: '1px',
        overflow: 'hidden',
        borderRadius: skin.CARD_RADIUS,
        border: `1px solid ${skin.HAIR}`,
        backgroundColor: skin.HAIR
      }}
    >
      {segments.map(s => {
        const acc = fillOf(s.tone)
        const valIsPct = /%/.test(s.value)

        return (
          <Box
            key={s.label}
            onClick={s.onClick}
            sx={{
              minWidth: 0,
              backgroundColor: '#ffffff',
              px: '16px',
              py: '14px',
              cursor: s.onClick ? 'pointer' : 'default',
              ...(s.onClick && { ...skin.cardPressSx, '&:hover': { backgroundColor: '#fcfcfb' } })
            }}
          >
            <Typography
              variant='caption'
              sx={{ color: skin.FAINT, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500, display: 'block' }}
            >
              {s.label}
            </Typography>

            {s.total ? (
              <Typography
                sx={{ fontSize: '28px', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: skin.ACCENT_INK, mt: 0.75 }}
                noWrap
              >
                {s.value}
              </Typography>
            ) : (
              <>
                <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1, mt: 0.75 }}>
                  <Typography
                    sx={{ fontSize: '24px', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: skin.VALUE }}
                    noWrap
                  >
                    {s.value}
                  </Typography>
                  {!valIsPct && s.pct != null && (
                    <Typography variant='caption' sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: inkOf(s.tone), flexShrink: 0 }}>
                      {s.pct}%
                    </Typography>
                  )}
                </Box>
                {s.pct != null && (
                  <Box sx={{ mt: 1.25, height: 6, borderRadius: '999px', backgroundColor: skin.TRACK, overflow: 'hidden' }}>
                    <Box
                      sx={{
                        height: '100%',
                        width: `${Math.min(100, Math.max(0, s.pct))}%`,
                        borderRadius: '999px',
                        background: `linear-gradient(90deg, ${acc} 0%, ${skin.mixOverWhite(acc, 0.72)} 100%)`
                      }}
                    />
                  </Box>
                )}
              </>
            )}
          </Box>
        )
      })}
    </Box>
  )
}

/** Layer 2 — severity-sorted triage; each row a bullet-bar = % of species affected. */
export function NeedsAttention({
  alerts,
  totalItems,
  onAlertClick
}: {
  alerts: DashboardAlert[]
  totalItems: number
  onAlertClick: (a: DashboardAlert) => void
}) {
  // CC row grammar: hairline-separated rows, TONE_FILL marks (never tone-as-type),
  // tabular figures in VALUE, share in FAINT.
  const sevColor = (s: DashboardAlert['severity']) =>
    s === 'high' ? skin.TONE_FILL.bad : s === 'medium' ? skin.TONE_FILL.warn : skin.TONE_FILL.neutral
  const rows = alerts.filter(a => a.speciesCount > 0)
  const maxPct = Math.max(1, ...rows.map(a => a.pctSpecies))

  return (
    <SectionCard
      title='Needs Attention'
      sx={{ height: '100%', width: '100%' }}
      action={
        <Typography
          variant='caption'
          sx={{ color: skin.TONE_TYPE.bad, fontWeight: 600, bgcolor: skin.TONE_SOFT.bad, px: 2, py: 0.5, borderRadius: '999px', fontVariantNumeric: 'tabular-nums' }}
        >
          {totalItems.toLocaleString()} species
        </Typography>
      }
    >
      {rows.length === 0 && (
        <Typography variant='body2' sx={{ color: skin.MUTED }}>
          Nothing needs attention.
        </Typography>
      )}
      {rows.map(a => (
        <Box
          key={a.key}
          onClick={() => onAlertClick(a)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            py: 2.5,
            borderTop: `1px solid ${skin.HAIR}`,
            cursor: 'pointer',
            ...skin.cardPressSx,
            '&:hover': { bgcolor: '#fcfcfb' }
          }}
        >
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: sevColor(a.severity), flexShrink: 0 }} />
          <Typography variant='body2' sx={{ width: 170, flexShrink: 0, color: skin.INK }}>
            {a.label}
          </Typography>
          <Box sx={{ flex: 1, height: 6, bgcolor: skin.TRACK, borderRadius: '999px', overflow: 'hidden', minWidth: 40 }}>
            <Box
              sx={{
                width: `${(a.pctSpecies / maxPct) * 100}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${sevColor(a.severity)} 0%, ${skin.mixOverWhite(sevColor(a.severity), 0.72)} 100%)`,
                borderRadius: '999px'
              }}
            />
          </Box>
          <Typography variant='subtitle2' sx={{ width: 40, textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: skin.VALUE }}>
            {a.speciesCount}
          </Typography>
          <Typography variant='caption' sx={{ width: 46, textAlign: 'right', color: skin.FAINT, fontVariantNumeric: 'tabular-nums' }}>
            {a.pctSpecies}%
          </Typography>
          <Icon icon='mdi:chevron-right' fontSize='1.1rem' color={skin.FAINT} />
        </Box>
      ))}
    </SectionCard>
  )
}

/** Single-species variant of Needs Attention — which alerts THIS species triggers (no bars/percentages,
 *  since it's one species). Each row → the species' Assessments tab. */
export interface SpeciesAlertRow {
  key: string
  label: string
  severity: DashboardAlert['severity']
}

export function SpeciesAlertList({ alerts, onClick }: { alerts: SpeciesAlertRow[]; onClick: () => void }) {
  const sevColor = (s: DashboardAlert['severity']) =>
    s === 'high' ? skin.TONE_FILL.bad : s === 'medium' ? skin.TONE_FILL.warn : skin.TONE_FILL.neutral

  return (
    <SectionCard
      title='Needs Attention'
      sx={{ height: '100%', width: '100%' }}
      action={
        <Typography
          variant='caption'
          sx={{
            color: alerts.length ? skin.TONE_TYPE.bad : skin.TONE_TYPE.good,
            fontWeight: 600,
            bgcolor: alerts.length ? skin.TONE_SOFT.bad : skin.TONE_SOFT.good,
            px: 2,
            py: 0.5,
            borderRadius: '999px',
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          {alerts.length} active
        </Typography>
      }
    >
      {alerts.length === 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
          <Icon icon='mdi:check-circle-outline' fontSize='1.3rem' color={skin.ACCENT_INK} />
          <Typography variant='body2' sx={{ color: skin.MUTED }}>
            Nothing needs attention for this species.
          </Typography>
        </Box>
      )}
      {alerts.map(a => (
        <Box
          key={a.key}
          onClick={onClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            py: 2.5,
            borderTop: `1px solid ${skin.HAIR}`,
            cursor: 'pointer',
            ...skin.cardPressSx,
            '&:hover': { bgcolor: '#fcfcfb' }
          }}
        >
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: sevColor(a.severity), flexShrink: 0 }} />
          <Typography variant='body2' sx={{ flex: 1, color: skin.INK }}>
            {a.label}
          </Typography>
          <Icon icon='mdi:chevron-right' fontSize='1.1rem' color={skin.FAINT} />
        </Box>
      ))}
    </SectionCard>
  )
}

export type ChartKind = 'donut' | 'pie' | 'bar-h' | 'bar-v' | 'radial' | 'polar'

export interface CompositionSegment {
  label: string
  value: number // species count (drives proportion / bar length)
  animalCount?: number
  onClick?: () => void
}

export interface Composition {
  title: string
  chart: ChartKind
  segments: CompositionSegment[]
}

/** Donut / pie of nominal segments — the CC Slices mark (SVG, gap-separated, graded fills),
 *  clickable to drill, with the SliceKey legend below. */
export const ProportionChart: React.FC<{ segments: CompositionSegment[]; variant: 'donut' | 'pie' }> = ({ segments, variant }) => {
  const data = segments.filter(s => s.value > 0)
  if (!data.length) return null
  const items = data.map(d => ({ label: d.label, value: d.value, onSelect: d.onClick }))

  return (
    <>
      <Slices items={items} inner={variant === 'donut' ? 0.62 : 0} />
      <SliceKey items={items} />
    </>
  )
}

/** Ranked categories — horizontal = the CC RankRows meter list (track + graded bar + share);
 *  vertical = CC columns with a readable slot per category (scrolls when they overflow). */
export const RankedBarChart: React.FC<{ segments: CompositionSegment[]; horizontal: boolean; height?: number; barHeight?: string }> = ({
  segments,
  horizontal,
  height = 320
}) => {
  const data = segments
  if (!data.length) return null

  if (horizontal) {
    const total = data.reduce((n, d) => n + d.value, 0)

    return (
      <RankRows
        rows={data.map(d => ({ key: d.label, label: d.label, value: d.value, onOpen: d.onClick }))}
        total={total}
      />
    )
  }

  return (
    <BarColumns
      bars={data.map(d => [d.label, d.value] as [string, number])}
      noun='species'
      height={height - 80}
      minSlot={72}
      onSelect={label => data.find(d => d.label === label)?.onClick?.()}
    />
  )
}

/** Radial facet → the CC ring (Slices donut) with the species total in the centre.
 *  CC has no radial-gauge vocabulary — a composition is a ring, so it becomes one. */
export const RadialChart: React.FC<{ segments: CompositionSegment[] }> = ({ segments }) => {
  const data = segments.filter(s => s.value > 0)
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  if (!data.length) return null
  const items = data.map(d => ({ label: d.label, value: d.value, onSelect: d.onClick }))

  return (
    <>
      <Slices items={items} centre={['Species', fmt(total)]} />
      <SliceKey items={items} />
    </>
  )
}

/** Polar facet → the CC pie (Slices inner=0). Same reasoning as RadialChart. */
const PolarChart: React.FC<{ segments: CompositionSegment[] }> = ({ segments }) => {
  const data = segments.filter(s => s.value > 0)
  if (!data.length) return null
  const items = data.map(d => ({ label: d.label, value: d.value, onSelect: d.onClick }))

  return (
    <>
      <Slices items={items} inner={0} />
      <SliceKey items={items} />
    </>
  )
}

/** Layer 3 — the explore grid. Each facet renders the chart kind the container chose. */
export function ExploreGrid({ compositions }: { compositions: Composition[] }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 1.75 }}>
      {compositions.map(c => (
        <SectionCard
          key={c.title}
          title={c.title}
          titleMb={1}
          sx={{ height: '100%', display: 'flex', flexDirection: 'column', px: 4, pt: 3, pb: 3 }}
        >
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0 }}>
            {c.chart === 'donut' && <ProportionChart segments={c.segments} variant='donut' />}
            {c.chart === 'pie' && <ProportionChart segments={c.segments} variant='pie' />}
            {c.chart === 'bar-h' && <RankedBarChart segments={c.segments} horizontal />}
            {c.chart === 'bar-v' && <RankedBarChart segments={c.segments} horizontal={false} />}
            {c.chart === 'radial' && <RadialChart segments={c.segments} />}
            {c.chart === 'polar' && <PolarChart segments={c.segments} />}
          </Box>
        </SectionCard>
      ))}
    </Box>
  )
}

/** Single-species mode — replaces the cross-species explore grid (which collapses to one value
 *  per facet for a single species) with a clickable taxonomy & status chip strip → Profile tab. */
export interface StatusChip {
  label: string
  value: string
  icon: string
  onClick?: () => void
}

export function TaxonomyStatusStrip({ chips }: { chips: StatusChip[] }) {
  const theme = useTheme() as any
  const cc = theme.palette.customColors

  return (
    <SectionCard title='Taxonomy & Status'>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 1.75 }}>
        {chips.map(c => (
          <Box
            key={c.label}
            onClick={c.onClick}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              p: '12px 14px',
              borderRadius: '12px',
              border: `1px solid ${skin.HAIR}`,
              bgcolor: '#ffffff',
              minWidth: 0,
              cursor: c.onClick ? 'pointer' : 'default',
              ...(c.onClick && { ...skin.cardPressSx, '&:hover': { bgcolor: '#f6f7f6' } })
            }}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '10px',
                bgcolor: cc.Surface,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Icon icon={c.icon} fontSize='1.25rem' color={skin.ACCENT_INK} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant='caption'
                sx={{ color: skin.FAINT, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', lineHeight: 1.3 }}
              >
                {c.label}
              </Typography>
              <Typography variant='subtitle2' sx={{ fontWeight: 600, color: skin.INK }} noWrap>
                {c.value}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </SectionCard>
  )
}

/** Sex composition — the CC sex ring: Slices with "Sexed NN%" in the centre, huesFor
 *  giving Male the chart green, Female the sky, and Unsexed the held-back absence grey. */
export function SexDonut({ animals, onClick }: { animals: DashboardData['totals']['animals']; onClick?: () => void }) {
  const { m, f, u, total } = animals
  const sexedPct = total ? Math.round(((m + f) / total) * 100) : 0
  const items = [
    { label: 'Male', value: m },
    { label: 'Female', value: f },
    { label: 'Unsexed', value: u }
  ].filter(d => d.value > 0)

  return (
    <SectionCard
      title='Sex Composition'
      sx={{ height: '100%', width: '100%' }}
      onClick={onClick}
      action={onClick ? <Icon icon='mdi:chevron-right' fontSize='1.1rem' color={skin.FAINT} /> : undefined}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
        <Slices items={items} centre={['Sexed', `${sexedPct}%`]} size={200} />
        <SliceKey items={items} />
      </Box>
    </SectionCard>
  )
}

/** Single-series column bar chart (green Births / orange Deaths, etc.). One implementation
 *  shared by the dashboard Births/Deaths cards AND the detail Overview tab. */
export function ColumnBarChart({
  values,
  labels,
  color,
  name,
  height = 280,
  showValues = false,
  hideYAxis = false
}: {
  values: number[]
  labels: string[]
  color: string
  name: string
  height?: number
  showValues?: boolean
  hideYAxis?: boolean
}) {
  const theme = useTheme() as any
  const cc = theme.palette.customColors

  // Readability standard (2026-07-27): every bar gets a slot wide enough for its 14px
  // axis label. STICKY AXIS: two synced Apex charts side by side — a 44px axis-only
  // chart in normal flow (never scrolls) + the plot chart inside the scroll area with
  // its own y-axis hidden. Same data/height/paddings → identical scale + gridline rows.
  const MIN_BAR_SLOT = 72
  const AXIS_W = 44

  const buildOptions = (axisOnly: boolean): any => ({
    chart: { toolbar: { show: false }, animations: { enabled: false }, fontFamily: 'inherit' },
    colors: [color],
    // CC YearBars: 4px radius on the TOP corners only — the base sits square on the axis.
    plotOptions: { bar: { columnWidth: '55%', borderRadius: 4, borderRadiusApplication: 'end', dataLabels: { position: 'top' } } },
    dataLabels:
      showValues && !axisOnly
        ? {
            enabled: true,
            offsetY: -20,
            formatter: (v: number) => (v ? v.toLocaleString() : ''),
            // value printed OUTSIDE the mark is type → it wears the accent's ink partner
            style: { fontSize: '13px', fontWeight: 700, colors: [skin.strokeOf(color)] }
          }
        : { enabled: false },
    legend: { show: false },
    grid: {
      show: !hideYAxis && !axisOnly,
      borderColor: skin.GRID,
      strokeDashArray: 0,
      padding: axisOnly ? { top: showValues ? 20 : 0, left: 0, right: 0 } : { top: showValues ? 20 : 0, left: -6, right: 12 }
    },
    xaxis: {
      categories: labels,
      // axis-only copy keeps the SAME x labels (transparent) so both charts reserve an
      // identical bottom band and the y rows line up.
      labels: { style: { colors: axisOnly ? 'transparent' : skin.FAINT, fontSize: '12px' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis:
      hideYAxis || !axisOnly
        ? { show: false, max: Math.max(...values, 1), min: 0, forceNiceScale: true }
        : {
            max: Math.max(...values, 1),
            min: 0,
            forceNiceScale: true,
            labels: { style: { colors: skin.FAINT, fontSize: '12px' }, align: 'left', minWidth: 24, offsetX: -14 }
          },
    tooltip: axisOnly
      ? { enabled: false }
      : {
          custom: ({ series, seriesIndex, dataPointIndex }: any) =>
            tooltipHTML(theme, labels[dataPointIndex] ?? '', [
              { color, label: name, value: Number(series[seriesIndex]?.[dataPointIndex] ?? 0).toLocaleString() }
            ])
        },
    // CC mark gradient: full accent at the top fading to its lightness-step partner —
    // flattened-over-white colors (never opacity) so the mark stays crisp.
    fill: axisOnly
      ? { opacity: 0 }
      : {
          type: 'gradient',
          gradient: {
            type: 'vertical',
            shadeIntensity: 0,
            opacityFrom: 1,
            opacityTo: 1,
            gradientToColors: [skin.mixOverWhite(color, 0.62)],
            stops: [0, 100]
          }
        }
  })

  return (
    <Box sx={{ position: 'relative', height: height + 28, mx: -4, mb: -4 }}>
      {/* Full-width scroll area — the scrollbar spans the whole card edge-to-edge. */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          overflowX: 'auto',
          overflowY: 'hidden',
          ...thinScrollbarSx(theme)
        }}
      >
        <Box
          sx={{
            minWidth: `${labels.length * MIN_BAR_SLOT + (hideYAxis ? 16 : AXIS_W + 16)}px`,
            pl: hideYAxis ? 4 : `${AXIS_W + 16}px`,
            pr: 4
          }}
        >
          <ReactApexcharts type='bar' height={height} options={buildOptions(false)} series={[{ name, data: values }]} />
        </Box>
      </Box>
      {/* Sticky y-axis: axis-only twin chart overlaid on an opaque strip — bars slide
          under it on scroll; stops above the scrollbar so the bar stays full width. */}
      {!hideYAxis && (
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: '10px',
            width: `${AXIS_W + 16}px`,
            pl: 4,
            overflow: 'hidden',
            pointerEvents: 'none',
            backgroundColor: theme.palette.background.paper
          }}
        >
          <ReactApexcharts type='bar' height={height} width={AXIS_W} options={buildOptions(true)} series={[{ name, data: values }]} />
        </Box>
      )}
    </Box>
  )
}

/** Smooth-edge area line — curved stroke, soft gradient fill, dots + value labels at each point.
 *  Axes + dashed horizontal gridlines. Used for the detail "Births Over Time" trend. */
export function SmoothAreaChart({
  values,
  labels,
  color,
  name,
  height = 260
}: {
  values: number[]
  labels: string[]
  color: string
  name: string
  height?: number
}) {
  const theme = useTheme() as any
  const cc = theme.palette.customColors

  return (
    <ReactApexcharts
      type='area'
      height={height}
      options={{
        chart: { toolbar: { show: false }, animations: { enabled: false }, fontFamily: 'inherit' },
        colors: [color],
        stroke: { curve: 'smooth', width: 3 },
        dataLabels: {
          enabled: true,
          formatter: (v: number) => (v ? v.toLocaleString() : ''),
          offsetY: -5,
          style: { fontSize: '13px', fontWeight: 700, colors: [skin.strokeOf(color)] },
          background: { enabled: false }
        },
        markers: { size: 4, colors: [color], strokeColors: theme.palette.common.white, strokeWidth: 1.5, hover: { sizeOffset: 2 } },
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.28, opacityTo: 0, stops: [0, 100] } },
        grid: {
          borderColor: skin.GRID,
          strokeDashArray: 0,
          xaxis: { lines: { show: false } },
          yaxis: { lines: { show: true } },
          padding: { top: 16, right: 12 }
        },
        xaxis: {
          categories: labels,
          labels: { style: { colors: skin.FAINT, fontSize: '12px' }, hideOverlappingLabels: true, rotate: 0 },
          axisBorder: { show: false },
          axisTicks: { show: false },
          tooltip: { enabled: false }
        },
        yaxis: {
          tickAmount: 4,
          labels: { style: { colors: skin.FAINT, fontSize: '12px' }, formatter: (v: number) => Math.round(v).toLocaleString() }
        },
        tooltip: {
          custom: ({ series, seriesIndex, dataPointIndex }: any) =>
            tooltipHTML(theme, labels[dataPointIndex] ?? '', [
              { color, label: name, value: Number(series[seriesIndex]?.[dataPointIndex] ?? 0).toLocaleString() }
            ])
        }
      }}
      series={[{ name, data: values }]}
    />
  )
}

/** Births & Deaths — two side-by-side column charts (green births · orange deaths),
 *  reusing the same ColumnBarChart as the detail Overview tab. Driven by the dashboard's
 *  monthly trend (respects the date-range filter). */
export function BirthsDeathsTrend({ trend, onClick }: { trend: DashboardData['trend12']; onClick?: () => void }) {
  const theme = useTheme() as any
  const cc = theme.palette.customColors
  const fmtMonth = (v: string) => {
    const mm = /^(\d{4})-(\d{2})$/.exec(String(v))
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    return mm ? `${MONTHS[Number(mm[2]) - 1]} '${mm[1].slice(2)}` : v
  }
  const labels = trend.map(t => fmtMonth(t.label))
  const chevron = onClick ? <Icon icon='mdi:chevron-right' fontSize='1.3rem' color={cc.OutlineVariant} /> : undefined

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
      <SectionCard title='Births' onClick={onClick} action={chevron}>
        <ColumnBarChart values={trend.map(t => t.births)} labels={labels} color={theme.palette.primary.main} name='Births' height={260} />
      </SectionCard>
      <SectionCard title='Deaths' onClick={onClick} action={chevron}>
        <ColumnBarChart values={trend.map(t => t.deaths)} labels={labels} color={theme.palette.customColors.Tertiary} name='Deaths' height={260} />
      </SectionCard>
    </Box>
  )
}
