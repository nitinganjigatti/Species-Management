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
import { SectionCard, TrendAreaChart, TREND_RANGES, ViewToggle } from 'src/views/pages/species-management/ipad3/detail/detailUi'
import type { RangePreset } from 'src/views/pages/species-management/ipad3/dashboard/DashboardDateRange'
import { computeSickTrend } from './signals'
import SignalDrawer, { type SignalDrawerPayload } from './SignalDrawer'
import AnimalHealthRecord from './AnimalHealthRecord'

const SickTrendCard: React.FC<{
  clinical?: SpeciesClinical | null
  preventive?: SpeciesPreventive | null
}> = ({ clinical, preventive }) => {
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

  // ONE accent in lightness steps (the CC chart rule): new cases = full CORAL,
  // the carried-over base band = the pale step of the same hue.
  const freshColor = skin.CORAL
  const carriedColor = skin.mixOverWhite(skin.CORAL, 0.45)

  if (!clinical || !sickTrend.animals.some(a => a.length > 0)) return null

  return (
    <>
      <SectionCard
        title='Sick Animals Each Month'
        // The standard pill ViewToggle (user call 2026-09-06 — was the underline tabs)
        action={
          <ViewToggle
            sx={{ flexShrink: 0 }}
            items={TREND_RANGES.map(r => ({ key: r.key, label: r.label }))}
            value={trendRange}
            onChange={k => setTrendRange(k as RangePreset)}
          />
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
