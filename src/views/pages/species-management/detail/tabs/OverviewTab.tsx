'use client'

import React from 'react'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import { SectionCard, MiniBarRow, RangeBar, StatTile, EmptyState } from 'src/views/pages/species-management/detail/detailUi'
import {
  SexDonut,
  BirthsDeathsTrend,
  ProportionChart,
  RankedBarChart,
  type CompositionSegment,
  type Tone
} from 'src/views/pages/species-management/dashboard/dashboardUi'
import type {
  SpeciesDetailHeader,
  SpeciesDetailTab,
  SpeciesHousing,
  SpeciesBirths,
  SpeciesDeaths,
  SpeciesProfile
} from 'src/types/species-management/detail'
import type { DetailAlerts } from 'src/views/pages/species-management/detail/SpeciesDetailView'

interface OverviewTabProps {
  header?: SpeciesDetailHeader
  housing?: SpeciesHousing
  births?: SpeciesBirths
  deaths?: SpeciesDeaths
  profile?: SpeciesProfile
  alerts?: DetailAlerts | null
  onTabChange: (tab: SpeciesDetailTab) => void
}

const num = (v: unknown): number => (typeof v === 'number' && isFinite(v) ? v : Number(v) || 0)

const OverviewTab: React.FC<OverviewTabProps> = ({ header, housing, births, deaths, profile, alerts, onTabChange }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const go = (t: SpeciesDetailTab) => () => onTabChange(t)

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

  // A card that opens its tab. Title + "View →" affordance; whole card clickable.
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

  // ── Adapters ──
  const animals = { m: num(header?.males), f: num(header?.females), u: num(header?.unsexed), total: num(header?.total) }

  // Births vs Deaths — aggregate to YEARLY buckets (month-level over decades is unreadable),
  // keep the most recent 20 years so the trajectory reads cleanly.
  const trend = React.useMemo(() => {
    const by = new Map<string, { births: number; deaths: number }>()
    const add = (label: string, key: 'births' | 'deaths', v: number) => {
      const y = String(label).slice(0, 4)
      if (!/^\d{4}$/.test(y)) return
      const e = by.get(y) || { births: 0, deaths: 0 }
      e[key] += v
      by.set(y, e)
    }
    ;(births?.byYearMonth || []).forEach(p => add(p.label, 'births', num(p.value)))
    ;(deaths?.byYearMonth || []).forEach(p => add(p.label, 'deaths', num(p.value)))

    return Array.from(by.keys())
      .sort()
      .slice(-20)
      .map(y => ({ label: y, births: by.get(y)!.births, deaths: by.get(y)!.deaths }))
  }, [births, deaths])

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
    .slice(0, 6)

  const toYears = (d?: number) => (d == null ? undefined : Math.round((d / 365) * 10) / 10)
  const aad = deaths?.ageAtDeath
  const aadAvgY = toYears(aad?.avg)
  const aadMinY = toYears(aad?.min)
  const aadMaxY = toYears(aad?.max)
  const lifeSpecies = num(profile?.lifespanYears)

  const welfare = [
    { label: 'Intelligence', value: num(profile?.intelligenceScore) },
    { label: 'Activity', value: num(profile?.activityNeedsScore) },
    { label: 'Social', value: num(profile?.socialNeedsScore) },
    { label: 'Space', value: num(profile?.spaceNeedsScore) },
    { label: 'Stress risk', value: num(profile?.stressRiskScore) }
  ].filter(r => r.value > 0)

  const care = [
    { label: 'Budget', value: num(profile?.budgetScore) },
    { label: 'Size', value: num(profile?.sizeScore) },
    { label: 'Need', value: num(profile?.needScore) },
    { label: 'Conservation', value: num(profile?.conservationPriority) },
    { label: 'Visitor appeal', value: num(profile?.visitorAppeal) }
  ].filter(r => r.value > 0)

  // Compact radar for 0–10 score sets (variety + at-a-glance shape).
  const Radar: React.FC<{ scores: { label: string; value: number }[]; color: string }> = ({ scores, color }) => {
    const options = {
      chart: { toolbar: { show: false }, animations: { enabled: false }, fontFamily: 'inherit' },
      labels: scores.map(s => s.label),
      colors: [color],
      stroke: { width: 2 },
      fill: { opacity: 0.2 },
      markers: { size: 3, colors: [color], strokeColors: color },
      yaxis: { show: false, min: 0, max: 10, tickAmount: 5 },
      xaxis: { labels: { style: { colors: scores.map(() => cc.neutralSecondary), fontSize: '11px' } } },
      plotOptions: { radar: { polygons: { strokeColors: cc.SurfaceVariant, connectorColors: cc.SurfaceVariant } } },
      tooltip: { enabled: true, y: { formatter: (v: number) => `${v}/10` } }
    }

    return <ReactApexcharts type='radar' height={280} options={options} series={[{ name: 'Score', data: scores.map(s => s.value) }]} />
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Row 1 — trajectory anchor (yearly area) + sex donut */}
      {grid(
        '2fr 1fr',
        <>
          <Box onClick={go('circle')} sx={{ cursor: 'pointer', borderRadius: '10px', '&:hover': { boxShadow: 2 } }}>
            {trend.length ? <BirthsDeathsTrend trend={trend as any} /> : (
              <SectionCard title='Births vs Deaths'><EmptyState /></SectionCard>
            )}
          </Box>
          <Box onClick={go('pairing')} sx={{ cursor: 'pointer', borderRadius: '10px', '&:hover': { boxShadow: 2 } }}>
            {animals.total ? <SexDonut animals={animals as any} /> : (
              <SectionCard title='Sex Composition'><EmptyState /></SectionCard>
            )}
          </Box>
        </>
      )}

      {/* Row 2 — breeding (donut) · monitoring (triage) · spread (bar) */}
      {grid(
        '1fr 1fr 1fr',
        <>
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
            {sites.length ? <RankedBarChart segments={sites} horizontal /> : <EmptyState />}
          </Card>
        </>
      )}

      {/* Row 3 — causes (pie) · lifespan (stats) */}
      {grid(
        '1fr 1fr',
        <>
          <Card title='Top Causes of Death' tab='circle' viewLabel='View Circle of Life'>
            {causes.length ? <ProportionChart segments={causes} variant='pie' /> : <EmptyState />}
          </Card>

          <Card title='Lifespan' tab='circle' viewLabel='View Circle of Life'>
            {aadAvgY || lifeSpecies ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <StatTile label='Avg age at death' value={aadAvgY != null ? `${aadAvgY} yrs` : '—'} tone='info' />
                  {lifeSpecies > 0 && <StatTile label='Species lifespan' value={`${lifeSpecies} yrs`} />}
                </Box>
                {aadMinY != null && aadMaxY != null && (
                  <Box>
                    <Typography variant='caption' sx={{ color: cc.neutralSecondary, display: 'block', mb: 1.5 }}>
                      Age-at-death range (years){aad?.count != null ? ` · n=${aad.count}` : ''}
                    </Typography>
                    <RangeBar min={aadMinY} avg={aadAvgY ?? aadMinY} max={aadMaxY} tone='info' />
                  </Box>
                )}
              </Box>
            ) : (
              <EmptyState />
            )}
          </Card>
        </>
      )}

      {/* Row 4 — care profile radars (Overview-only) */}
      {(welfare.length > 0 || care.length > 0) &&
        grid(
          '1fr 1fr',
          <>
            <Card title='Welfare Needs' tab='profile' viewLabel='View Profile'>
              {welfare.length >= 3 ? <Radar scores={welfare} color={theme.palette.primary.main} /> : <EmptyState />}
            </Card>
            <Card title='Captive-Care Scores' tab='profile' viewLabel='View Profile'>
              {care.length >= 3 ? <Radar scores={care} color={theme.palette.secondary.main} /> : <EmptyState />}
            </Card>
          </>
        )}
    </Box>
  )
}

export default OverviewTab
