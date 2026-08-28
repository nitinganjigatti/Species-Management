'use client'

import React from 'react'
import { Box, Typography, useMediaQuery } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import * as skin from 'src/views/pages/species-management/ipad2/skin'
import { SectionCard, EmptyState } from 'src/views/pages/species-management/ipad2/detail/detailUi'
import {
  SexDonut,
  ProportionChart,
  type CompositionSegment
} from 'src/views/pages/species-management/ipad2/dashboard/dashboardUi'
import { BarColumns, RankRows } from 'src/views/pages/species-management/ipad2/marks'
import DashboardDateRange, { type RangeSelection } from 'src/views/pages/species-management/ipad2/dashboard/DashboardDateRange'
import {
  GenderFilter,
  PeriodBand,
  RangeSelect,
  makeMatcher,
  CTRL_H,
  type FacetDef
} from 'src/views/pages/species-management/ipad2/detail/tabs/CircleOfLifeTab'
import SpeciesFilterSheet from 'src/views/pages/species-management/ipad2/SpeciesFilterSheet'
import { EMPTY_ANALYSIS, type AnalysisFilter } from 'src/views/pages/species-management/ipad2/list/speciesListing.utils'
import type {
  SpeciesDetailHeader,
  SpeciesDetailTab,
  SpeciesHousing,
  SpeciesBirths,
  SpeciesDeaths,
  SpeciesLifecycle
} from 'src/types/species-management/detail'
import type { DetailAlerts } from 'src/views/pages/species-management/ipad2/detail/SpeciesDetailView'

interface OverviewTabProps {
  header?: SpeciesDetailHeader
  housing?: SpeciesHousing
  births?: SpeciesBirths
  deaths?: SpeciesDeaths
  lifecycle?: SpeciesLifecycle | null
  alerts?: DetailAlerts | null
  onTabChange: (tab: SpeciesDetailTab) => void
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const num = (v: unknown): number => (typeof v === 'number' && isFinite(v) ? v : Number(v) || 0)
const gKey = (g?: string) => (g === 'male' ? 'male' : g === 'female' ? 'female' : 'unsexed')

const OverviewTab: React.FC<OverviewTabProps> = ({ header, housing, births, deaths, lifecycle, alerts, onTabChange }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const go = (t: SpeciesDetailTab) => () => onTabChange(t)

  // Period / gender / "Other Filters" — the same control band as Circle of Life.
  const [range, setRange] = React.useState<RangeSelection>({ preset: 'all', start: null, end: null })
  const [analysis, setAnalysis] = React.useState<AnalysisFilter>(EMPTY_ANALYSIS)
  const [periodMode, setPeriodMode] = React.useState<'quick' | 'range'>('quick')
  const [genders, setGenders] = React.useState<string[]>([])
  const [extra, setExtra] = React.useState<Record<string, string[]>>({})
  const [filterOpen, setFilterOpen] = React.useState(false)

  const switchMode = (m: 'quick' | 'range') => {
    if (m === 'quick') setAnalysis(EMPTY_ANALYSIS)
    else setRange({ preset: 'all', start: null, end: null })
    setPeriodMode(m)
  }

  const ViewLink: React.FC<{ tab: SpeciesDetailTab; label: string }> = ({ tab, label }) => (
    <Box
      onClick={e => {
        e.stopPropagation()
        onTabChange(tab)
      }}
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, cursor: 'pointer', color: skin.ACCENT_INK }}
    >
      <Typography variant='caption' sx={{ fontWeight: 600, color: 'inherit' }}>
        {label}
      </Typography>
      <Icon icon='mdi:chevron-right' fontSize='1rem' />
    </Box>
  )

  // CC pressable card: no hover shadow (nothing casts) — SectionCard's own
  // card-press scale + quiet wash carry the affordance.
  const Card: React.FC<{ title: string; tab: SpeciesDetailTab; viewLabel?: string; children: React.ReactNode }> = ({
    title,
    tab,
    viewLabel,
    children
  }) => (
    <SectionCard
      title={title}
      action={
        viewLabel ? (
          <ViewLink tab={tab} label={viewLabel} />
        ) : (
          <Icon icon='mdi:chevron-right' fontSize='1.1rem' color={skin.FAINT} />
        )
      }
      sx={{ height: '100%' }}
      onClick={go(tab)}
    >
      {children}
    </SectionCard>
  )

  // Columns hold in BOTH orientations (2026-08-27): iPad portrait (810px) sits below
  // the md breakpoint, which used to collapse these rows to a single column.
  const grid = (cols: string, children: React.ReactNode) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: cols, gap: 2 }}>{children}</Box>
  )

  // ── Data ──
  const animals = { m: num(header?.males), f: num(header?.females), u: num(header?.unsexed), total: num(header?.total) }

  const evB = lifecycle?.births || []
  const evD = lifecycle?.deaths || []
  const hasEvents = evB.length > 0 || evD.length > 0

  const years = React.useMemo(() => {
    const set = new Set<number>()
    evB.forEach(e => set.add(+e.d.slice(0, 4)))
    evD.forEach(e => set.add(+e.d.slice(0, 4)))

    return Array.from(set).filter(Number.isFinite).sort((a, b) => b - a)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lifecycle])

  const facets: FacetDef[] = React.useMemo(() => {
    const tally = (arr: any[], get: (e: any) => string | undefined) => {
      const m = new Map<string, number>()
      arr.forEach(e => {
        const v = get(e)
        if (v) m.set(v, (m.get(v) || 0) + 1)
      })

      return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count }))
    }
    const all = [...evB, ...evD]

    return ([
      { key: 'Site', label: 'Site', options: tally(all, e => e.s) },
      { key: 'Enclosure', label: 'Enclosure', options: tally(all, e => e.e) },
      { key: 'Breed', label: 'Breed', options: tally(evB, e => e.b) },
      { key: 'Manner', label: 'Cause of Death', options: tally(evD, e => e.m) }
    ] as FacetDef[]).filter(f => f.options.length)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lifecycle])
  const extraCount = Object.values(extra).reduce((n, v) => n + (v?.length || 0), 0)

  // Births & Deaths — yearly buckets, scoped by the control band, capped to the most recent 12 years.
  const trend = React.useMemo(() => {
    const matcher = makeMatcher(range, analysis)
    const gOk = (g?: string) => !genders.length || genders.includes(gKey(g))
    const inExtra = (k: string, v?: string) => !(extra[k]?.length) || (v != null && extra[k].includes(v))
    const by = new Map<string, { births: number; deaths: number }>()
    const bump = (y: string, key: 'births' | 'deaths', v: number) => {
      if (!/^\d{4}$/.test(y)) return
      const e = by.get(y) || { births: 0, deaths: 0 }
      e[key] += v
      by.set(y, e)
    }

    if (hasEvents) {
      evB.forEach(e => {
        if (matcher(e.d) && gOk(e.g) && inExtra('Site', e.s) && inExtra('Enclosure', e.e) && inExtra('Breed', e.b))
          bump(e.d.slice(0, 4), 'births', e.k || 1)
      })
      evD.forEach(e => {
        if (matcher(e.d) && gOk(e.g) && inExtra('Site', e.s) && inExtra('Enclosure', e.e) && inExtra('Manner', e.m))
          bump(e.d.slice(0, 4), 'deaths', e.k || 1)
      })
    } else {
      ;(births?.byYearMonth || []).forEach(p => matcher(`${p.label}-01`) && bump(String(p.label).slice(0, 4), 'births', num(p.value)))
      ;(deaths?.byYearMonth || []).forEach(p => matcher(`${p.label}-01`) && bump(String(p.label).slice(0, 4), 'deaths', num(p.value)))
    }

    return Array.from(by.keys())
      .sort()
      .slice(-12)
      .map(y => ({ label: y, births: by.get(y)!.births, deaths: by.get(y)!.deaths }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lifecycle, births, deaths, range, analysis, genders, extra, hasEvents])

  const yearItems = years.map(y => ({ value: y, label: String(y) }))
  const monthItems = MONTHS.map((m, i) => ({ value: i + 1, label: m }))

  // Severity rides the meter's FILL (CC: tone as mark, never tone as type).
  const alertRows = alerts
    ? [
        { label: 'Overdue Assessment', value: alerts.overdue, fill: skin.TONE_FILL.bad },
        { label: 'Never Assessed', value: alerts.neverAssessed, fill: skin.TONE_FILL.warn },
        { label: 'Gained >10%', value: alerts.gained, fill: skin.TONE_FILL.warn },
        { label: 'Lost >10%', value: alerts.lost, fill: skin.TONE_FILL.bad },
        { label: 'Under-Monitored', value: alerts.underMonitored, fill: skin.TONE_FILL.warn }
      ].filter(r => r.value > 0)
    : []

  const causes: CompositionSegment[] = (deaths?.byManner || [])
    .filter(c => num(c.count) > 0)
    .sort((a, b) => num(b.count) - num(a.count))
    .slice(0, 6)
    .map(c => ({ label: c.manner, value: num(c.count), onClick: go('circle') }))

  const sites: CompositionSegment[] = (housing?.sites || [])
    .map(s => ({ label: s.name, value: num(s.total), onClick: go('housing') }))
    .filter(s => s.value > 0)
    .sort((a, b) => b.value - a.value)

  // Naveen's columns mark — never re-themed Apex. Landscape shows Births/Deaths as
  // half-width cards, so a 72px min slot keeps columns readable (scrolls sooner than
  // it squeezes). Portrait cards are FULL width — every year fits, so no min slot
  // and no horizontal scroll there.
  const landscape = useMediaQuery('(orientation: landscape)')
  const yearBar = (data: number[], color: string, name: string) => (
    <BarColumns
      bars={trend.map((t, i) => [t.label, data[i]] as [string, number])}
      fill={color}
      noun={name.toLowerCase()}
      height={240}
      minSlot={landscape ? 72 : undefined}
    />
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Control band — shared PeriodBand (split-card layout + squared light-green toggle). */}
      <PeriodBand
        periodMode={periodMode}
        onModeChange={switchMode}
        range={range}
        onRangeChange={setRange}
        genders={genders}
        onGendersChange={setGenders}
        extraCount={extraCount}
        onOpenFilters={() => setFilterOpen(true)}
        yearFrom={analysis.yearFrom}
        yearTo={analysis.yearTo}
        monthFrom={analysis.monthFrom}
        monthTo={analysis.monthTo}
        onWindowPatch={patch => setAnalysis(a => ({ ...a, ...patch }))}
        yearItems={yearItems}
        monthItems={monthItems}
      />

      {/* Row 1 — Births (green) · Deaths (orange). Orientation-driven like the list
          rail: stacked full-width in portrait, side-by-side in landscape. */}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: '1fr',
          '@media (orientation: landscape)': { gridTemplateColumns: '1fr 1fr' }
        }}
      >
        <Card title='Births' tab='circle' viewLabel='View Circle of Life'>
          {trend.length ? yearBar(trend.map(t => t.births), theme.palette.primary.main, 'Births') : <EmptyState />}
        </Card>
        <Card title='Deaths' tab='circle' viewLabel='View Circle of Life'>
          {trend.length ? yearBar(trend.map(t => t.deaths), cc.Tertiary, 'Deaths') : <EmptyState />}
        </Card>
      </Box>

      {/* Row 2 — composition: sex (donut) · causes (pie). Breeding Readiness removed
          entirely (stakeholder call 2026-08-27): wrong term for enclosure sex-composition,
          "pairs" indefensible without parentage — the per-enclosure story lives in Housing
          as a table instead. */}
      {grid(
        '1fr 1fr',
        <>
          {animals.total ? (
            <SexDonut animals={animals as any} onClick={go('pairing')} />
          ) : (
            <SectionCard title='Sex Composition' sx={{ height: '100%' }}>
              <EmptyState />
            </SectionCard>
          )}

          <Card title='Top Causes of Death' tab='circle'>
            {causes.length ? <ProportionChart segments={causes} variant='pie' /> : <EmptyState />}
          </Card>
        </>
      )}

      {/* Row 3 — operations: monitoring (triage) · spread (bar) */}
      {grid(
        '1fr 1fr',
        <>
          <Card title='Needs Attention' tab='assessments' viewLabel='View Assessments'>
            {alertRows.length ? (
              <RankRows
                rows={alertRows.map(r => ({ key: r.label, label: r.label, value: r.value, fill: r.fill }))}
                total={Math.max(1, animals.total)}
              />
            ) : (
              <EmptyState message='Nothing needs attention' />
            )}
          </Card>

          <Card title='Population by Site' tab='housing' viewLabel='View Housing'>
            {sites.length ? (
              // Same mark as Needs Attention — one component per pattern.
              <RankRows
                rows={sites.map(s => ({ key: s.label, label: s.label, value: s.value, onOpen: s.onClick }))}
                total={sites.reduce((n, x) => n + x.value, 0)}
              />
            ) : (
              <EmptyState />
            )}
          </Card>
        </>
      )}

      {/* Other Filters — same Diet-style filter sheet as the listing (one component everywhere). */}
      <SpeciesFilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title='Other Filters'
        sections={facets.map(f => ({ key: f.key, label: f.label, options: f.options.map(o => ({ value: o.value, label: o.value, count: o.count })) }))}
        selected={extra}
        onApply={setExtra}
      />
    </Box>
  )
}

export default OverviewTab
