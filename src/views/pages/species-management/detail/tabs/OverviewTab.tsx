'use client'

import React from 'react'
import { Box, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import { SectionCard, MiniBarRow, EmptyState } from 'src/views/pages/species-management/detail/detailUi'
import {
  SexDonut,
  ProportionChart,
  RankedBarChart,
  ColumnBarChart,
  type CompositionSegment,
  type Tone
} from 'src/views/pages/species-management/dashboard/dashboardUi'
import DashboardDateRange, { type RangeSelection } from 'src/views/pages/species-management/dashboard/DashboardDateRange'
import {
  GenderFilter,
  MoreFiltersDrawer,
  RangeSelect,
  makeMatcher,
  CTRL_H,
  type FacetDef
} from 'src/views/pages/species-management/detail/tabs/CircleOfLifeTab'
import { EMPTY_ANALYSIS, type AnalysisFilter } from 'src/views/pages/species-management/speciesListing.utils'
import type {
  SpeciesDetailHeader,
  SpeciesDetailTab,
  SpeciesHousing,
  SpeciesBirths,
  SpeciesDeaths,
  SpeciesLifecycle
} from 'src/types/species-management/detail'
import type { DetailAlerts } from 'src/views/pages/species-management/detail/SpeciesDetailView'

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
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, cursor: 'pointer', color: theme.palette.primary.dark }}
    >
      <Typography variant='caption' sx={{ fontWeight: 600, color: 'inherit' }}>
        {label}
      </Typography>
      <Icon icon='mdi:chevron-right' fontSize='1rem' />
    </Box>
  )

  const Card: React.FC<{ title: string; tab: SpeciesDetailTab; viewLabel: string; children: React.ReactNode }> = ({
    title,
    tab,
    viewLabel,
    children
  }) => (
    <Box
      onClick={go(tab)}
      sx={{ cursor: 'pointer', borderRadius: '10px', transition: 'box-shadow .15s ease', height: '100%', '&:hover': { boxShadow: 2 } }}
    >
      <SectionCard title={title} action={<ViewLink tab={tab} label={viewLabel} />} sx={{ height: '100%' }}>
        {children}
      </SectionCard>
    </Box>
  )

  const grid = (cols: string, children: React.ReactNode) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: cols }, gap: 2 }}>{children}</Box>
  )

  const groupLabel = (text: string) => (
    <Typography variant='caption' sx={{ color: cc.neutralSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {text}
    </Typography>
  )
  const dash = (
    <Typography variant='body2' sx={{ color: cc.neutralSecondary }}>
      –
    </Typography>
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

  const readiness: CompositionSegment[] = [
    { label: 'Can breed', value: num(housing?.pairedEncl), onClick: go('pairing') },
    { label: 'Needs sexing', value: num(housing?.unsexedOnlyEncl), onClick: go('pairing') },
    { label: 'Single-sex', value: num(housing?.maleOnlyEncl) + num(housing?.femaleOnlyEncl), onClick: go('pairing') },
    { label: 'Mixed', value: num(housing?.mixedEncl), onClick: go('pairing') }
  ]
  const readinessTotal = readiness.reduce((s, r) => s + r.value, 0)

  const alertRows = alerts
    ? [
        { label: 'Overdue assessment', value: alerts.overdue, tone: 'error' as Tone },
        { label: 'Never assessed', value: alerts.neverAssessed, tone: 'warning' as Tone },
        { label: 'Gained >10%', value: alerts.gained, tone: 'warning' as Tone },
        { label: 'Lost >10%', value: alerts.lost, tone: 'error' as Tone },
        { label: 'Under-monitored', value: alerts.underMonitored, tone: 'warning' as Tone }
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

  const yearBar = (data: number[], color: string, name: string) => (
    <ColumnBarChart values={data} labels={trend.map(t => t.label)} color={color} name={name} height={280} />
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Control band — Period (Quick / By month·year) · Gender · Other Filters. Scopes Births & Deaths. */}
      <Box sx={{ borderRadius: '10px', border: `1px solid ${cc.SurfaceVariant}`, bgcolor: 'background.paper', p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 2, md: 2.5 },
            flexWrap: 'wrap',
            '& .MuiInputBase-root': { height: CTRL_H },
            '& .MuiSelect-select': { display: 'flex', alignItems: 'center', py: 0, fontSize: '0.875rem' },
            '& .MuiOutlinedInput-input': { py: 0, fontSize: '0.875rem' }
          }}
        >
          {groupLabel('Period')}
          <Box sx={{ display: 'inline-flex', height: CTRL_H, p: 1.5, borderRadius: '999px', bgcolor: cc.OnSurfaceVariant }}>
            {(['quick', 'range'] as const).map(m => {
              const on = periodMode === m

              return (
                <Box
                  key={m}
                  onClick={() => switchMode(m)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 4,
                    borderRadius: '999px',
                    cursor: 'pointer',
                    bgcolor: on ? theme.palette.primary.main : 'transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Typography variant='body2' sx={{ fontWeight: on ? 600 : 500, color: on ? theme.palette.common.white : alpha(theme.palette.common.white, 0.7), whiteSpace: 'nowrap' }}>
                    {m === 'quick' ? 'Quick' : 'By month / year'}
                  </Typography>
                </Box>
              )
            })}
          </Box>

          <GenderFilter selected={genders} onChange={setGenders} />

          {periodMode === 'quick' ? (
            <DashboardDateRange value={range} onChange={setRange} />
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {groupLabel('Years')}
                <RangeSelect value={analysis.yearFrom} onPick={v => setAnalysis(a => ({ ...a, yearFrom: v }))} items={yearItems} anyLabel='All' />
                {dash}
                <RangeSelect value={analysis.yearTo} onPick={v => setAnalysis(a => ({ ...a, yearTo: v }))} items={yearItems} anyLabel='All' />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {groupLabel('Months')}
                <RangeSelect value={analysis.monthFrom} onPick={v => setAnalysis(a => ({ ...a, monthFrom: v }))} items={monthItems} anyLabel='All' />
                {dash}
                <RangeSelect value={analysis.monthTo} onPick={v => setAnalysis(a => ({ ...a, monthTo: v }))} items={monthItems} anyLabel='All' />
              </Box>
            </>
          )}

          <FilterButtonWithNotification
            label='Other Filters'
            onClick={() => setFilterOpen(true)}
            appliedFiltersCount={extraCount || undefined}
            sx={{ ml: 'auto', height: CTRL_H, bgcolor: theme.palette.background.paper, '&:hover': { bgcolor: theme.palette.background.paper } }}
          />
        </Box>
      </Box>

      {/* Row 1 — Births (green) · Deaths (orange) */}
      {grid(
        '1fr 1fr',
        <>
          <Card title='Births' tab='circle' viewLabel='View Circle of Life'>
            {trend.length ? yearBar(trend.map(t => t.births), theme.palette.primary.main, 'Births') : <EmptyState />}
          </Card>
          <Card title='Deaths' tab='circle' viewLabel='View Circle of Life'>
            {trend.length ? yearBar(trend.map(t => t.deaths), cc.Tertiary, 'Deaths') : <EmptyState />}
          </Card>
        </>
      )}

      {/* Row 2 — composition: sex (donut) · breeding (donut) · causes (pie) */}
      {grid(
        '1fr 1fr 1fr',
        <>
          <Box onClick={go('pairing')} sx={{ cursor: 'pointer', borderRadius: '10px', height: '100%', '&:hover': { boxShadow: 2 } }}>
            {animals.total ? <SexDonut animals={animals as any} /> : (
              <SectionCard title='Sex Composition' sx={{ height: '100%' }}><EmptyState /></SectionCard>
            )}
          </Box>

          <Card title='Breeding Readiness' tab='pairing' viewLabel='View Pairing'>
            {readinessTotal ? (
              <>
                <ProportionChart segments={readiness} variant='donut' />
                <Typography variant='caption' sx={{ color: cc.neutralSecondary, display: 'block', mt: 1, textAlign: 'center' }}>
                  {num(housing?.nEncl).toLocaleString()} enclosures · {num(housing?.nPairs).toLocaleString()} breedable pairs
                </Typography>
              </>
            ) : (
              <EmptyState />
            )}
          </Card>

          <Card title='Top Causes of Death' tab='circle' viewLabel='View Circle of Life'>
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
              alertRows.map(r => (
                <MiniBarRow key={r.label} label={r.label} value={r.value} max={Math.max(1, animals.total)} tone={r.tone} />
              ))
            ) : (
              <EmptyState message='Nothing needs attention' />
            )}
          </Card>

          <Card title='Population by Site' tab='housing' viewLabel='View Housing'>
            {sites.length ? (
              <RankedBarChart segments={sites} horizontal height={Math.max(170, sites.length * 46)} barHeight='42%' />
            ) : (
              <EmptyState />
            )}
          </Card>
        </>
      )}

      <MoreFiltersDrawer open={filterOpen} onClose={() => setFilterOpen(false)} facets={facets} selected={extra} onApply={setExtra} />
    </Box>
  )
}

export default OverviewTab
