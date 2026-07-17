'use client'

/*
 * Sickness trend card — sick-animal COUNTS per month with its own 1Y·2Y·3Y·All tabs
 * (independent of the page window). Lives on the Medical Overview, below Health status.
 * Month point click → that month's sick animals → animal → full health record.
 */
import React, { useMemo, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import type { SpeciesClinical, SpeciesPreventive } from 'src/lib/api/species-management/detail'
import { SectionCard, TrendAreaChart, TrendRangeTabs } from 'src/views/pages/species-management/detail2/detailUi'
import type { RangePreset } from 'src/views/pages/species-management/dashboard/DashboardDateRange'
import { computeSickTrend } from './signals'
import SignalDrawer, { type SignalDrawerPayload } from './SignalDrawer'
import AnimalHealthRecord from './AnimalHealthRecord'

const SickTrendCard: React.FC<{
  clinical?: SpeciesClinical | null
  preventive?: SpeciesPreventive | null
}> = ({ clinical, preventive }) => {
  const theme = useTheme() as any
  const [trendRange, setTrendRange] = useState<RangePreset>('last_1y')
  const [drill, setDrill] = useState<SignalDrawerPayload | null>(null)
  const [recordAid, setRecordAid] = useState<string | null>(null)

  const sickTrend = useMemo(
    () =>
      computeSickTrend(
        clinical,
        trendRange === 'all' ? null : trendRange === 'last_2y' ? 24 : trendRange === 'last_3y' ? 36 : 12,
        new Date()
      ),
    [clinical, trendRange]
  )

  if (!clinical || !sickTrend.values.some(v => v > 0)) return null

  return (
    <>
      <SectionCard
        title='Sickness trend · sick animals per month'
        action={<TrendRangeTabs value={trendRange} onPick={setTrendRange} color={theme.palette.primary.dark} />}
        titleMb={4}
      >
        <TrendAreaChart
          values={sickTrend.values}
          labels={sickTrend.labels}
          color={theme.palette.primary.main}
          name='Sick animals'
          height={230}
          onPointClick={i =>
            sickTrend.animals[i]?.length &&
            setDrill({
              title: `${sickTrend.labels[i]} — sick animals`,
              explainer: `${sickTrend.animals[i].length} animals had an active illness in ${sickTrend.labels[i]}.`,
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
