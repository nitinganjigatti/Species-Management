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
  sub?: string
  onClick?: () => void
}

/** Layer 1 — one bordered instrument strip with internal dividers (NOT cards). Wraps 6→3+3. */
export function VitalStrip({ segments }: { segments: VitalSegment[] }) {
  const theme = useTheme() as any
  const cc = theme.palette.customColors

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        border: `1px solid ${cc.SurfaceVariant}`,
        borderRadius: '10px',
        bgcolor: 'background.paper',
        overflow: 'hidden'
      }}
    >
      {segments.map(s => (
        <Box
          key={s.label}
          onClick={s.onClick}
          sx={{
            flex: '1 1 150px',
            minWidth: 150,
            p: 2,
            borderRight: `1px solid ${cc.SurfaceVariant}`,
            borderBottom: `1px solid ${cc.SurfaceVariant}`,
            cursor: s.onClick ? 'pointer' : 'default',
            transition: '0.15s',
            '&:hover': s.onClick ? { bgcolor: cc.Surface } : undefined
          }}
        >
          <Typography variant='caption' sx={{ color: cc.neutralSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {s.label}
          </Typography>
          <Typography variant='h5' sx={{ color: cc.OnSurfaceVariant, mt: 0.25 }}>
            {s.value}
          </Typography>
          {s.sub && (
            <Typography variant='caption' sx={{ color: cc.neutralSecondary, display: 'block' }}>
              {s.sub}
            </Typography>
          )}
        </Box>
      ))}
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
const ProportionChart: React.FC<{ segments: CompositionSegment[]; variant: 'donut' | 'pie' }> = ({ segments, variant }) => {
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
const RankedBarChart: React.FC<{ segments: CompositionSegment[]; horizontal: boolean }> = ({ segments, horizontal }) => {
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
    plotOptions: { bar: { horizontal, distributed: true, borderRadius: 4, columnWidth: '55%', barHeight: '65%' } },
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
      height={320}
      options={options}
      series={[{ name: 'Species', data: data.map(d => d.value) }]}
    />
  )
}

/** Radial (gauge) bars — one ring per segment, % of total. Legend below drills to the list. */
const RadialChart: React.FC<{ segments: CompositionSegment[] }> = ({ segments }) => {
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

/** Sex composition — M/F/Unsexed donut with Sexed % in the center. */
export function SexDonut({ animals }: { animals: DashboardData['totals']['animals'] }) {
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
    <SectionCard title='Sex Composition' sx={{ height: '100%', width: '100%' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: 'calc(100% - 32px)' }}>
        <ReactApexcharts type='donut' height={260} options={options} series={data.map(d => d.value)} />
        <ChartLegend data={data} colors={colors} />
      </Box>
    </SectionCard>
  )
}

/** Births vs Deaths — last 12 months, ApexCharts area (two series). */
export function BirthsDeathsTrend({ trend }: { trend: DashboardData['trend12'] }) {
  const theme = useTheme() as any
  const cc = theme.palette.customColors
  const fmtMonth = (v: string) => {
    const mm = /^(\d{4})-(\d{2})$/.exec(String(v))
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    return mm ? `${MONTHS[Number(mm[2]) - 1]} '${mm[1].slice(2)}` : v
  }

  const options = {
    ...baseChartOptions(theme),
    colors: [theme.palette.primary.main, theme.palette.customColors.Tertiary],
    stroke: { curve: 'smooth', width: 2 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 0.3, opacityFrom: 0.3, opacityTo: 0.02 } },
    legend: { show: true, position: 'top', horizontalAlign: 'left', labels: { colors: cc.OnSurfaceVariant } },
    xaxis: {
      categories: trend.map(t => fmtMonth(t.label)),
      labels: { style: { colors: cc.neutralSecondary, fontSize: '11px' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: { labels: { style: { colors: cc.neutralSecondary, fontSize: '11px' } } },
    tooltip: {
      enabled: true,
      shared: true,
      custom: ({ dataPointIndex }: any) => {
        const t = trend[dataPointIndex]
        if (!t) return ''

        return tooltipHTML(theme, fmtMonth(t.label), [
          { color: theme.palette.primary.main, label: 'Births', value: t.births.toLocaleString() },
          { color: theme.palette.customColors.Tertiary, label: 'Deaths', value: t.deaths.toLocaleString() }
        ])
      }
    }
  }

  return (
    <SectionCard title='Births vs Deaths'>
      <ReactApexcharts
        type='area'
        height={260}
        options={options}
        series={[
          { name: 'Births', data: trend.map(t => t.births) },
          { name: 'Deaths', data: trend.map(t => t.deaths) }
        ]}
      />
    </SectionCard>
  )
}
