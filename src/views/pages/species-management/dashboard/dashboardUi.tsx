'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import { SectionCard, useTone } from 'src/views/pages/species-management/detail/detailUi'
import type { DashboardData, DashboardAlert } from 'src/types/species-management/dashboard'

export type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary'

/** Distinct categorical palette built from theme tokens (no hardcoded hex). */
const chartColors = (theme: any): string[] => {
  const cc = theme.palette.customColors

  return [
    theme.palette.primary.main, // green
    theme.palette.secondary.main, // teal
    theme.palette.customColors.Tertiary, // orange
    theme.palette.primary.dark, // dark green
    cc.Outline, // muted green-grey
    cc.OnSurfaceVariant, // dark text-green
    cc.OutlineVariant, // light border-green
    cc.neutralSecondary // grey
  ]
}

const baseChartOptions = (theme: any) => ({
  chart: { toolbar: { show: false }, fontFamily: 'inherit', animations: { enabled: false } },
  states: { active: { filter: { type: 'none' } } },
  dataLabels: { enabled: false },
  tooltip: { theme: theme.palette.mode },
  grid: { borderColor: theme.palette.customColors.SurfaceVariant, strokeDashArray: 4 }
})

// One consistent tooltip across every chart: a title row + one or more
// "● label: value" rows. Renders identical HTML regardless of chart type.
const tooltipHTML = (theme: any, title: string, rows: { color: string; label: string; value: string }[]) => {
  const cc = theme.palette.customColors
  const head = `<div style="padding:7px 12px;background:${cc.Surface};border-bottom:1px solid ${cc.SurfaceVariant};font-weight:600;color:${cc.OnSurfaceVariant};">${title}</div>`
  const body = rows
    .map(
      r => `<div style="display:flex;align-items:center;gap:8px;padding:7px 12px;">
        <span style="width:10px;height:10px;border-radius:50%;background:${r.color};display:inline-block;flex:none;"></span>
        <span style="color:${cc.neutralSecondary};">${r.label}:</span>
        <span style="font-weight:700;color:${cc.OnSurfaceVariant};">${r.value}</span>
      </div>`
    )
    .join('')

  return `<div style="font-size:12px;font-family:inherit;">${head}${body}</div>`
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
          <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: colors[i % colors.length], flexShrink: 0 }} />
          <Typography variant='caption' sx={{ color: 'customColors.OnSurfaceVariant' }}>
            {d.label}{' '}
            <Box component='span' sx={{ color: 'customColors.neutralSecondary' }}>
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

/** Layer 1 — a single dark-teal instrument panel (matches the detail-header band; NOT per-stat
 * cards): bright-green headline totals + the ratio metrics as proportional coverage bars. */
export function VitalStrip({ segments }: { segments: VitalSegment[] }) {
  const theme = useTheme() as any
  const cc = theme.palette.customColors
  const wLabel = 'rgba(255, 255, 255, 0.62)' // muted label on dark — same pattern as the header band
  const wTrack = 'rgba(255, 255, 255, 0.13)' // bar track on dark
  // Accents tuned for the dark ground: bright green / teal / orange.
  const toneColor = (t?: VitalSegment['tone']) =>
    t === 'tertiary' ? cc.Tertiary : t === 'secondary' ? theme.palette.secondary.main : cc.PrimaryContainer

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' },
        columnGap: '28px',
        rowGap: '22px',
        bgcolor: 'customColors.chatBubbleSent',
        borderRadius: '10px',
        p: '22px 24px',
        boxShadow: '0 4px 16px rgba(31,81,91,0.14)'
      }}
    >
      {segments.map(s => {
        const acc = toneColor(s.tone)
        const valIsPct = /%/.test(s.value)

        return (
          <Box
            key={s.label}
            onClick={s.onClick}
            sx={{
              minWidth: 0,
              cursor: s.onClick ? 'pointer' : 'default',
              transition: 'transform .15s ease',
              '&:hover': s.onClick ? { transform: 'translateY(-2px)' } : undefined
            }}
          >
            <Typography
              variant='caption'
              sx={{ color: wLabel, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, display: 'block' }}
            >
              {s.label}
            </Typography>

            {s.total ? (
              <Typography sx={{ fontSize: '2.15rem', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.01em', color: cc.PrimaryContainer, mt: 0.75 }} noWrap>
                {s.value}
              </Typography>
            ) : (
              <>
                <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1, mt: 0.75 }}>
                  <Typography sx={{ fontSize: '1.55rem', fontWeight: 800, lineHeight: 1.1, color: 'common.white' }} noWrap>
                    {s.value}
                  </Typography>
                  {!valIsPct && s.pct != null && (
                    <Typography variant='caption' sx={{ fontWeight: 700, color: acc, flexShrink: 0 }}>
                      {s.pct}%
                    </Typography>
                  )}
                </Box>
                {s.pct != null && (
                  <Box sx={{ mt: 1.25, height: 7, borderRadius: '4px', backgroundColor: wTrack, overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: `${Math.min(100, Math.max(0, s.pct))}%`, borderRadius: '4px', backgroundColor: acc }} />
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
  const theme = useTheme() as any
  const cc = theme.palette.customColors
  const tone = useTone()
  const sevColor = (s: DashboardAlert['severity']) =>
    s === 'high' ? cc.Tertiary : s === 'medium' ? theme.palette.warning.main : tone('neutral').fg
  const rows = alerts.filter(a => a.speciesCount > 0)
  const maxPct = Math.max(1, ...rows.map(a => a.pctSpecies))

  return (
    <SectionCard
      title='Needs Attention'
      sx={{ height: '100%', width: '100%' }}
      action={
        <Typography variant='caption' sx={{ color: cc.Tertiary, fontWeight: 700, bgcolor: cc.BgTeritary, px: 1, py: 0.25, borderRadius: 5 }}>
          {totalItems.toLocaleString()} species
        </Typography>
      }
    >
      {rows.length === 0 && (
        <Typography variant='body2' sx={{ color: cc.neutralSecondary }}>
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
            py: 2,
            borderTop: `1px solid ${cc.Surface}`,
            cursor: 'pointer',
            '&:hover': { bgcolor: cc.Surface }
          }}
        >
          <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: sevColor(a.severity), flexShrink: 0 }} />
          <Typography variant='body2' sx={{ width: 170, flexShrink: 0, color: cc.OnSurfaceVariant }}>
            {a.label}
          </Typography>
          <Box sx={{ flex: 1, height: 7, bgcolor: cc.Surface, borderRadius: 4, overflow: 'hidden', minWidth: 40 }}>
            <Box sx={{ width: `${(a.pctSpecies / maxPct) * 100}%`, height: '100%', bgcolor: sevColor(a.severity), borderRadius: 4 }} />
          </Box>
          <Typography variant='subtitle2' sx={{ width: 40, textAlign: 'right', fontWeight: 700 }}>
            {a.speciesCount}
          </Typography>
          <Typography variant='caption' sx={{ width: 46, textAlign: 'right', color: cc.neutralSecondary }}>
            {a.pctSpecies}%
          </Typography>
          <Icon icon='mdi:chevron-right' fontSize='1.2rem' color={cc.OutlineVariant} />
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
  const theme = useTheme() as any
  const cc = theme.palette.customColors
  const tone = useTone()
  const sevColor = (s: DashboardAlert['severity']) =>
    s === 'high' ? cc.Tertiary : s === 'medium' ? theme.palette.warning.main : tone('neutral').fg

  return (
    <SectionCard
      title='Needs Attention'
      sx={{ height: '100%', width: '100%' }}
      action={
        <Typography
          variant='caption'
          sx={{
            color: alerts.length ? cc.Tertiary : theme.palette.primary.main,
            fontWeight: 700,
            bgcolor: alerts.length ? cc.BgTeritary : cc.OnBackground,
            px: 1,
            py: 0.25,
            borderRadius: 5
          }}
        >
          {alerts.length} active
        </Typography>
      }
    >
      {alerts.length === 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
          <Icon icon='mdi:check-circle-outline' fontSize='1.3rem' color={theme.palette.primary.main} />
          <Typography variant='body2' sx={{ color: cc.neutralSecondary }}>
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
            py: 2,
            borderTop: `1px solid ${cc.Surface}`,
            cursor: 'pointer',
            '&:hover': { bgcolor: cc.Surface }
          }}
        >
          <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: sevColor(a.severity), flexShrink: 0 }} />
          <Typography variant='body2' sx={{ flex: 1, color: cc.OnSurfaceVariant }}>
            {a.label}
          </Typography>
          <Icon icon='mdi:chevron-right' fontSize='1.2rem' color={cc.OutlineVariant} />
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

/** Donut / pie of nominal segments, clickable to drill, with a counts legend below. */
export const ProportionChart: React.FC<{ segments: CompositionSegment[]; variant: 'donut' | 'pie' }> = ({ segments, variant }) => {
  const theme = useTheme() as any
  const data = segments.filter(s => s.value > 0)
  const colors = chartColors(theme)
  if (!data.length) return null

  const options = {
    ...baseChartOptions(theme),
    chart: {
      ...baseChartOptions(theme).chart,
      events: {
        // pie/donut: dataPointSelection is unreliable in this ApexCharts build; `click` carries
        // the slice's dataPointIndex (-1 when the click misses a slice).
        dataPointSelection: (_e: any, _ctx: any, cfg: any) => data[cfg.dataPointIndex]?.onClick?.(),
        click: (_e: any, _ctx: any, cfg: any) => {
          if (cfg?.dataPointIndex >= 0) data[cfg.dataPointIndex]?.onClick?.()
        }
      }
    },
    labels: data.map(d => d.label),
    colors,
    stroke: { width: 2, colors: [theme.palette.background.paper] },
    legend: { show: false },
    plotOptions: { pie: { donut: { size: variant === 'donut' ? '64%' : '0%' }, expandOnClick: false } },
    tooltip: facetTooltip(theme, data, colors)
  }

  return (
    <>
      <ReactApexcharts type={variant} height={260} options={options} series={data.map(d => d.value)} />
      <ChartLegend data={data} colors={colors} />
    </>
  )
}

/** Horizontal/vertical bar of ordered categories, clickable to drill. */
export const RankedBarChart: React.FC<{ segments: CompositionSegment[]; horizontal: boolean; height?: number; barHeight?: string }> = ({
  segments,
  horizontal,
  height = 320,
  barHeight = '65%'
}) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors
  const data = segments
  const colors = chartColors(theme)
  if (!data.length) return null

  const options = {
    ...baseChartOptions(theme),
    chart: {
      ...baseChartOptions(theme).chart,
      events: {
        dataPointSelection: (_e: any, _ctx: any, cfg: any) => data[cfg.dataPointIndex]?.onClick?.()
      }
    },
    colors,
    plotOptions: { bar: { horizontal, distributed: true, borderRadius: 4, columnWidth: '55%', barHeight } },
    legend: { show: false },
    xaxis: {
      categories: data.map(d => d.label),
      labels: { style: { colors: cc.neutralSecondary, fontSize: '11px' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: { labels: { style: { colors: cc.neutralSecondary, fontSize: '11px' } } },
    tooltip: facetTooltip(theme, data, colors)
  }

  return (
    <ReactApexcharts
      type='bar'
      height={height}
      options={options}
      series={[{ name: 'Species', data: data.map(d => d.value) }]}
    />
  )
}

/** Radial (gauge) bars — one ring per segment, % of total. Legend below drills to the list. */
export const RadialChart: React.FC<{ segments: CompositionSegment[] }> = ({ segments }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors
  const data = segments.filter(s => s.value > 0)
  const colors = chartColors(theme)
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  if (!data.length) return null

  const options = {
    ...baseChartOptions(theme),
    chart: {
      ...baseChartOptions(theme).chart,
      events: {
        dataPointSelection: (_e: any, _ctx: any, cfg: any) => data[cfg.dataPointIndex]?.onClick?.()
      }
    },
    labels: data.map(d => d.label),
    colors,
    stroke: { lineCap: 'round' },
    legend: { show: false },
    tooltip: facetTooltip(theme, data, colors),
    plotOptions: {
      radialBar: {
        hollow: { size: '38%' },
        track: { background: cc.Surface },
        dataLabels: {
          name: { fontSize: '13px', color: cc.neutralSecondary },
          value: { fontSize: '16px', fontWeight: 600, color: cc.OnSurfaceVariant, formatter: (v: number) => `${v}%` },
          total: {
            show: true,
            label: 'Species',
            color: cc.neutralSecondary,
            formatter: () => total.toLocaleString()
          }
        }
      }
    }
  }

  return (
    <>
      <ReactApexcharts type='radialBar' height={260} options={options} series={data.map(d => Math.round((d.value / total) * 100))} />
      <ChartLegend data={data} colors={colors} />
    </>
  )
}

/** Polar-area of nominal segments (good for a handful of categories), clickable, legend below. */
const PolarChart: React.FC<{ segments: CompositionSegment[] }> = ({ segments }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors
  const data = segments.filter(s => s.value > 0)
  const colors = chartColors(theme)
  if (!data.length) return null

  const options = {
    ...baseChartOptions(theme),
    chart: {
      ...baseChartOptions(theme).chart,
      events: {
        dataPointSelection: (_e: any, _ctx: any, cfg: any) => data[cfg.dataPointIndex]?.onClick?.(),
        click: (_e: any, _ctx: any, cfg: any) => {
          if (cfg?.dataPointIndex >= 0) data[cfg.dataPointIndex]?.onClick?.()
        }
      }
    },
    labels: data.map(d => d.label),
    colors,
    stroke: { width: 1, colors: [theme.palette.background.paper] },
    fill: { opacity: 0.85 },
    legend: { show: false },
    yaxis: { show: false },
    plotOptions: { polarArea: { rings: { strokeColor: cc.SurfaceVariant }, spokes: { connectorColors: cc.SurfaceVariant } } },
    tooltip: facetTooltip(theme, data, colors)
  }

  return (
    <>
      <ReactApexcharts type='polarArea' height={260} options={options} series={data.map(d => d.value)} />
      <ChartLegend data={data} colors={colors} />
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
              borderRadius: '10px',
              border: `1px solid ${cc.SurfaceVariant}`,
              bgcolor: cc.Surface,
              minWidth: 0,
              cursor: c.onClick ? 'pointer' : 'default',
              transition: 'border-color .15s ease, background-color .15s ease',
              '&:hover': c.onClick ? { borderColor: theme.palette.primary.main, bgcolor: cc.OnBackground } : undefined
            }}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '8px',
                bgcolor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Icon icon={c.icon} fontSize='1.25rem' color={cc.Outline} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant='caption'
                sx={{ color: cc.neutralSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', lineHeight: 1.3 }}
              >
                {c.label}
              </Typography>
              <Typography variant='subtitle2' sx={{ fontWeight: 600, color: cc.OnSurfaceVariant }} noWrap>
                {c.value}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </SectionCard>
  )
}

/** Sex composition — M/F/Unsexed donut with Sexed % in the center. In single-species mode the
 *  whole card is clickable (→ the species' Pairing tab). */
export function SexDonut({ animals, onClick }: { animals: DashboardData['totals']['animals']; onClick?: () => void }) {
  const theme = useTheme() as any
  const cc = theme.palette.customColors
  const { m, f, u, total } = animals
  const sexedPct = total ? Math.round(((m + f) / total) * 100) : 0
  const data = [
    { label: 'Male', value: m },
    { label: 'Female', value: f },
    { label: 'Unsexed', value: u }
  ]
  const colors = [theme.palette.secondary.main, theme.palette.customColors.Tertiary, cc.Outline]

  const options = {
    ...baseChartOptions(theme),
    labels: data.map(d => d.label),
    colors,
    stroke: { width: 2, colors: [theme.palette.background.paper] },
    legend: { show: false },
    plotOptions: {
      pie: {
        expandOnClick: false,
        donut: {
          size: '70%',
          labels: {
            show: true,
            value: { fontSize: '1.75rem', fontWeight: 600, color: cc.OnSurfaceVariant, formatter: () => `${sexedPct}%` },
            total: {
              show: true,
              label: 'Sexed',
              fontSize: '0.85rem',
              color: cc.neutralSecondary,
              formatter: () => `${sexedPct}%`
            }
          }
        }
      }
    },
    tooltip: facetTooltip(theme, data, colors, 'Animals', d => `${d.value.toLocaleString()} animals`)
  }

  return (
    <SectionCard
      title='Sex Composition'
      sx={{ height: '100%', width: '100%' }}
      onClick={onClick}
      action={onClick ? <Icon icon='mdi:chevron-right' fontSize='1.3rem' color={cc.OutlineVariant} /> : undefined}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: 'calc(100% - 32px)' }}>
        {/* Remount on data change: ApexCharts leaves the donut center "total" label stale when only
            the series updates (e.g. switching species), so the % wouldn't refresh without a fresh key. */}
        <ReactApexcharts key={`${m}-${f}-${u}`} type='donut' height={260} options={options} series={data.map(d => d.value)} />
        <ChartLegend data={data} colors={colors} />
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
  height = 280
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
      type='bar'
      height={height}
      options={{
        chart: { toolbar: { show: false }, animations: { enabled: false }, fontFamily: 'inherit' },
        colors: [color],
        plotOptions: { bar: { columnWidth: '60%', borderRadius: 3 } },
        dataLabels: { enabled: false },
        legend: { show: false },
        grid: { borderColor: cc.SurfaceVariant, strokeDashArray: 4 },
        xaxis: {
          categories: labels,
          labels: { style: { colors: cc.neutralSecondary, fontSize: '10px' } },
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: { labels: { style: { colors: cc.neutralSecondary, fontSize: '11px' } } },
        tooltip: { y: { formatter: (v: number) => v.toLocaleString() } },
        fill: { opacity: 1 }
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
