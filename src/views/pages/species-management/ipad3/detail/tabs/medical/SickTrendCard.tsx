'use client'

/*
 * Sickness trend card — sick-animal COUNTS per month with its own 1Y·2Y·3Y·All tabs
 * (independent of the page window). Lives on the Medical Overview as the page's one chart.
 * Month point click → that month's sick animals → animal → full health record.
 * CC skin (2026-09-01): both series are lightness steps of CORAL (one accent, mixed over
 * white), legend/lead-in inks from the warm ramp. The old "Sickness is concentrating at"
 * chip strip is retired (user call 2026-09-01); no site filter here either (same call).
 */
import React, { useMemo, useState } from 'react'
import { Box, Typography } from '@mui/material'
import type { SpeciesClinical, SpeciesPreventive } from 'src/lib/api/species-management/detail'
import * as skin from 'src/views/pages/species-management/ipad3/skin'
import { SectionCard, TrendAreaChart, ViewToggle } from 'src/views/pages/species-management/ipad3/detail/detailUi'
import { CTRL_H, RangeSelect, yearItemsFor } from 'src/views/pages/species-management/ipad3/detail/tabs/CircleOfLifeTab'
import { computeSickTrend } from './signals'
import SignalDrawer, { type SignalDrawerPayload } from './SignalDrawer'
import AnimalHealthRecord from './AnimalHealthRecord'

const SickTrendCard: React.FC<{
  clinical?: SpeciesClinical | null
  preventive?: SpeciesPreventive | null
}> = ({ clinical, preventive }) => {
  /* THE standard period control (user call 2026-09-06): 1Y | 2Y | 3Y | Custom — the CoL
     grammar; 'All' retired (demo review 2026-09-04). Custom = year From/To, cap 5. */
  const [trendRange, setTrendRange] = useState<'last_1y' | 'last_2y' | 'last_3y' | 'custom'>('last_1y')
  const [yearFrom, setYearFrom] = useState<number | null>(null)
  const [yearTo, setYearTo] = useState<number | null>(null)
  const [drill, setDrill] = useState<SignalDrawerPayload | null>(null)
  const [recordAid, setRecordAid] = useState<string | null>(null)
  const NOW = useMemo(() => new Date(), [])

  // Years the data actually covers — from the all-time trend's span back from today.
  const years = useMemo(() => {
    const span = computeSickTrend(clinical, null, NOW).labels.length
    const first = new Date(NOW.getFullYear(), NOW.getMonth() - (span - 1), 1).getFullYear()

    return Array.from({ length: NOW.getFullYear() - first + 1 }, (_, i) => NOW.getFullYear() - i)
  }, [clinical, NOW])
  const CAP = 5
  const enterCustom = () => {
    setTrendRange('custom')
    if (yearFrom == null && yearTo == null) {
      setYearFrom(Math.max(years[years.length - 1] ?? NOW.getFullYear(), NOW.getFullYear() - (CAP - 1)))
      setYearTo(NOW.getFullYear())
    }
  }

  const sickTrend = useMemo(() => {
    if (trendRange === 'custom') {
      const to = yearTo ?? NOW.getFullYear()
      const from = yearFrom ?? to
      // anchor at the window's end (or today when it ends this year); span = whole years
      const anchor = to >= NOW.getFullYear() ? NOW : new Date(to, 11, 31)
      const months = (to - from) * 12 + anchor.getMonth() + 1

      return computeSickTrend(clinical, Math.max(1, months), anchor)
    }

    return computeSickTrend(clinical, trendRange === 'last_2y' ? 24 : trendRange === 'last_3y' ? 36 : 12, NOW)
  }, [clinical, trendRange, yearFrom, yearTo, NOW])

  // ONE accent in lightness steps (the CC chart rule): new cases = full CORAL,
  // the carried-over base band = the pale step of the same hue.
  const freshColor = skin.CORAL
  const carriedColor = skin.mixOverWhite(skin.CORAL, 0.45)

  if (!clinical || !sickTrend.animals.some(a => a.length > 0)) return null

  return (
    <>
      <SectionCard
        title='Sick Animals Each Month'
        // THE standard period control (user call 2026-09-06): pill 1Y|2Y|3Y|Custom +
        // capped year From/To — the CoL/Eggs grammar.
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, whiteSpace: 'nowrap', flexShrink: 0, '& > *': { flexShrink: 0 } }}>
            <ViewToggle
              height={CTRL_H}
              items={[
                { key: 'last_1y', label: '1Y' },
                { key: 'last_2y', label: '2Y' },
                { key: 'last_3y', label: '3Y' },
                { key: 'custom', label: 'Custom' }
              ]}
              value={trendRange}
              onChange={k => (k === 'custom' ? enterCustom() : setTrendRange(k as 'last_1y' | 'last_2y' | 'last_3y'))}
            />
            {trendRange === 'custom' && (
              <>
                <RangeSelect value={yearFrom} onPick={setYearFrom} items={yearItemsFor(years, yearTo, CAP, 'from')} anyLabel='From' />
                <Typography sx={{ color: skin.FAINT }}>–</Typography>
                <RangeSelect value={yearTo} onPick={setYearTo} items={yearItemsFor(years, yearFrom, CAP, 'to')} anyLabel='To' />
              </>
            )}
          </Box>
        }
        titleMb={2}
      >
        {/* legend — the split is the point of the chart, so it reads before the plot */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', mb: 2 }}>
          {[
            { color: freshColor, label: 'Newly Sick', gloss: 'Fell Sick This Month' },
            { color: carriedColor, label: 'Already Sick', gloss: 'Sick From Last Month' }
          ].map(l => (
            <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '3px', backgroundColor: l.color, flexShrink: 0 }} />
              <Typography variant='body2' sx={{ color: skin.MUTED }}>
                {l.label}{' '}
                <Box component='span' sx={{ color: skin.FAINT }}>
                  ({l.gloss})
                </Box>
              </Typography>
            </Box>
          ))}
        </Box>
        <TrendAreaChart
          values={sickTrend.carried}
          labels={sickTrend.labels}
          color={carriedColor}
          name='Already Sick'
          series2={{ values: sickTrend.fresh, name: 'Newly Sick', color: freshColor }}
          height={230}
          onPointClick={i =>
            sickTrend.animals[i]?.length &&
            setDrill({
              title: `${sickTrend.labels[i]} — Sick Animals`,
              explainer: `${sickTrend.fresh[i]} newly sick • ${sickTrend.carried[i]} already sick.`,
              icon: 'mdi:chart-line',
              tone: 'neutral',
              animals: sickTrend.animals[i]
            })
          }
        />
      </SectionCard>

      <SignalDrawer payload={drill} onClose={() => setDrill(null)} onAnimal={aid => setRecordAid(aid)} />
      <AnimalHealthRecord aid={recordAid} clinical={clinical} preventive={preventive} onClose={() => setRecordAid(null)} />
    </>
  )
}

export default SickTrendCard
