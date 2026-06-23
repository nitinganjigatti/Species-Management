'use client'

import React, { useMemo, useState } from 'react'
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CustomSwitchTabs from 'src/components/CustomSwitchTabs'
import type { CircleSubTab, SpeciesBirths, SpeciesDeaths } from 'src/types/species-management/detail'
import {
  DistributionBarChart,
  EmptyState,
  EntityListDrawer,
  SectionCard,
  StackedBar,
  StatTile,
  TrendAreaChart,
  TileGrid
} from 'src/views/pages/species-management/detail/detailUi'

const SimpleTable: React.FC<{ head: string[]; rows: (string | number | undefined)[][] }> = ({ head, rows }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>

  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size='small'>
        <TableHead>
          <TableRow>
            {head.map(h => (
              <TableCell key={h} sx={{ backgroundColor: cc.customTableHeaderBg, fontWeight: 600 }}>
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>
              {r.map((c, j) => (
                <TableCell key={j}>{c ?? '-'}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

const BirthsView: React.FC<{ births: SpeciesBirths }> = ({ births }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <TileGrid>
      <StatTile label='Total Births' value={births.total} tone='success' />
      <StatTile label='Sites' value={births.bySite?.length || 0} tone='primary' />
      {typeof births.sexedPct === 'number' && <StatTile label='Sexed' value={`${births.sexedPct}%`} tone='primary' />}
    </TileGrid>

    {births.byYearMonth?.length > 0 && (
      <SectionCard title='Births Over Time'>
        <TrendAreaChart data={births.byYearMonth} tone='success' />
      </SectionCard>
    )}

    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
      <SectionCard title='Gender'>
        <StackedBar
          segments={[
            { label: 'Male', value: births.byGender?.male || 0, tone: 'info' },
            { label: 'Female', value: births.byGender?.female || 0, tone: 'error' },
            { label: 'Undetermined', value: births.byGender?.undetermined || 0, tone: 'neutral' }
          ]}
        />
      </SectionCard>
      {births.seasonal?.length > 0 && (
        <SectionCard title='Seasonal Pattern'>
          <TrendAreaChart data={births.seasonal} tone='success' height={110} />
        </SectionCard>
      )}
    </Box>

    {births.recent?.length > 0 && (
      <SectionCard title='Recent Births'>
        <SimpleTable
          head={['Date', 'Site', 'Enclosure', 'Gender', 'Breed']}
          rows={births.recent.map(r => [r.date, r.site, r.enclosure, r.gender, r.breed])}
        />
      </SectionCard>
    )}
  </Box>
)

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const monthOf = (s?: string) => Number(String(s || '').slice(5, 7)) // "YYYY-MM..." → 1-12

type Drill = { title: string; subtitle: string; items: { id: string; name: string; sub?: string }[] }

const DeathsView: React.FC<{ deaths: SpeciesDeaths }> = ({ deaths }) => {
  const recent = deaths.recent || []
  const carcass = (deaths as any).carcassCondition as Record<string, number> | undefined
  const [drill, setDrill] = useState<Drill | null>(null)

  // Mortality pattern: cumulative deaths per calendar month, summed across all years (Jan = every January).
  const byMonth = useMemo(
    () =>
      MONTHS.map((label, i) => ({
        label,
        count: (deaths.byYearMonth || [])
          .filter(r => monthOf(r.label) === i + 1)
          .reduce((s, r) => s + (r.value || 0), 0)
      })),
    [deaths.byYearMonth]
  )

  const causeSummary = (records: typeof recent) => {
    const m = new Map<string, number>()
    records.forEach(r => m.set(r.manner || 'Unknown', (m.get(r.manner || 'Unknown') || 0) + 1))

    return Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ${v}`)
      .join(' · ')
  }

  const openMonth = (label: string) => {
    const idx = MONTHS.indexOf(label) + 1
    const recs = recent.filter(r => monthOf(r.date) === idx)
    setDrill({
      title: `${label} — mortality`,
      subtitle: recs.length ? causeSummary(recs) : 'No itemised records for this month',
      items: recs.map((r, i) => ({
        id: `${i}`,
        name: r.enclosure || r.site || 'Unknown',
        sub: [r.date, r.manner, r.necropsy].filter(Boolean).join(' · ')
      }))
    })
  }

  const openCause = (manner: string) => {
    const recs = recent.filter(r => (r.manner || 'Unknown') === manner)
    setDrill({
      title: manner,
      subtitle: 'Deaths recorded under this cause',
      items: recs.map((r, i) => ({
        id: `${i}`,
        name: r.enclosure || r.site || 'Unknown',
        sub: [r.date, r.necropsy].filter(Boolean).join(' · ')
      }))
    })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <TileGrid>
        <StatTile label='Total Deaths' value={deaths.total} tone='error' />
        <StatTile label='Sites' value={deaths.bySite?.length || 0} tone='primary' />
        {typeof deaths.avgSurvivalDays === 'number' && (
          <StatTile label='Avg Survival' value={`${deaths.avgSurvivalDays}`} sub='days' tone='neutral' />
        )}
        {(deaths as any).ageAtDeath?.count > 0 && (
          <StatTile
            label='Avg Age at Death'
            value={`${((deaths as any).ageAtDeath.avg / 365).toFixed(1)} yrs`}
            sub={`${(deaths as any).ageAtDeath.count} animals`}
            tone='neutral'
          />
        )}
      </TileGrid>

      {byMonth.some(m => m.count > 0) && (
        <SectionCard title='Mortality by Month (all years)'>
          <DistributionBarChart data={byMonth} tone='error' onSelect={openMonth} />
        </SectionCard>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
        {deaths.byManner?.length > 0 && (
          <SectionCard title='Cause of Death'>
            <DistributionBarChart
              data={deaths.byManner.map(m => ({ label: m.manner, count: m.count }))}
              tone='error'
              onSelect={openCause}
            />
          </SectionCard>
        )}
        {carcass && Object.keys(carcass).length > 0 && (
          <SectionCard title='Carcass Condition'>
            <DistributionBarChart
              data={Object.entries(carcass).map(([label, count]) => ({ label, count }))}
              tone='neutral'
            />
          </SectionCard>
        )}
        {(deaths as any).byGender && (
          <SectionCard title='Deaths by Gender'>
            <StackedBar
              segments={[
                { label: 'Male', value: (deaths as any).byGender.male || 0, tone: 'info' },
                { label: 'Female', value: (deaths as any).byGender.female || 0, tone: 'error' },
                { label: 'Unsexed', value: (deaths as any).byGender.unsexed || 0, tone: 'neutral' }
              ]}
            />
          </SectionCard>
        )}
      </Box>

      {recent.length > 0 && (
        <SectionCard title='Recent Deaths'>
          <SimpleTable
            head={['Date', 'Site', 'Enclosure', 'Manner', 'Necropsy']}
            rows={recent.map(r => [r.date, r.site, r.enclosure, r.manner, r.necropsy])}
          />
        </SectionCard>
      )}

      <EntityListDrawer
        open={!!drill}
        title={drill?.title || ''}
        subtitle={drill?.subtitle}
        items={drill?.items || []}
        onClose={() => setDrill(null)}
      />
    </Box>
  )
}

interface CircleOfLifeTabProps {
  births?: SpeciesBirths
  deaths?: SpeciesDeaths
}

const CircleOfLifeTab: React.FC<CircleOfLifeTabProps> = ({ births, deaths }) => {
  const [sub, setSub] = useState<CircleSubTab>('births')

  if (!births && !deaths) return <EmptyState message='No lifecycle data available' />

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ '& .MuiToggleButtonGroup-root .MuiToggleButton-root': { px: 4 } }}>
        <CustomSwitchTabs
          options={[
            { label: 'Births', value: 'births' },
            { label: 'Deaths', value: 'deaths' }
          ]}
          value={sub}
          onChange={(_e: React.SyntheticEvent, v: string | null) => v && setSub(v as CircleSubTab)}
        />
      </Box>
      {sub === 'births' ? (
        births ? (
          <BirthsView births={births} />
        ) : (
          <EmptyState message='No birth data available' />
        )
      ) : deaths ? (
        <DeathsView deaths={deaths} />
      ) : (
        <EmptyState message='No death data available' />
      )}
    </Box>
  )
}

export default CircleOfLifeTab
