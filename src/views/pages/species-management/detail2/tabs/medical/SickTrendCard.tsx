'use client'

/*
 * Sickness trend card — sick-animal COUNTS per month with its own 1Y·2Y·3Y·All tabs
 * (independent of the page window). Lives on the Medical Overview as the page's one chart.
 * Month point click → that month's sick animals → animal → full health record.
 * When the page window has sites running hot (Insights hotspot rule, computed by the caller),
 * a "Sickness is concentrating at" chip strip renders under the chart — chip → site-scoped list.
 */
import React, { useMemo, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { SpeciesClinical, SpeciesPreventive } from 'src/lib/api/species-management/detail'
import { SectionCard, TrendAreaChart, TrendRangeTabs } from 'src/views/pages/species-management/detail2/detailUi'
import type { RangePreset } from 'src/views/pages/species-management/dashboard2/DashboardDateRange'
import { computeSickTrend, type SignalAnimal } from './signals'
import SignalDrawer, { type SignalDrawerPayload } from './SignalDrawer'
import AnimalHealthRecord from './AnimalHealthRecord'

const SickTrendCard: React.FC<{
  clinical?: SpeciesClinical | null
  preventive?: SpeciesPreventive | null
  /** Sites concentrating sickness in the page window — empty/omitted hides the strip. */
  hotSites?: { site: string; count: number }[]
  /** Full per-site animal list backing the strip (chip passes initialSite, user can switch). */
  allSiteAnimals?: SignalAnimal[]
}> = ({ clinical, preventive, hotSites, allSiteAnimals }) => {
  const theme = useTheme() as any
  const c = theme.palette.customColors as Record<string, string>
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

  // Sickness is never a green story — new cases take the style-guide coral (Tertiary),
  // the carried-over base band stays warning gold.
  const carriedColor = theme.palette.warning.main
  const freshColor = c.Tertiary

  if (!clinical || !sickTrend.animals.some(a => a.length > 0)) return null

  return (
    <>
      <SectionCard
        title='Sick Animals Each Month'
        action={<TrendRangeTabs value={trendRange} onPick={setTrendRange} color={theme.palette.primary.dark} />}
        titleMb={2}
      >
        {/* legend — the split is the point of the chart, so it reads before the plot */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', mb: 2 }}>
          {[
            { color: freshColor, label: 'Fell Sick That Month' },
            { color: carriedColor, label: 'Already Sick When the Month Began' }
          ].map(l => (
            <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '3px', backgroundColor: l.color, flexShrink: 0 }} />
              <Typography sx={{ fontSize: '16px', color: c.neutralSecondary }}>{l.label}</Typography>
            </Box>
          ))}
        </Box>
        <TrendAreaChart
          values={sickTrend.carried}
          labels={sickTrend.labels}
          color={carriedColor}
          name='Already Sick When the Month Began'
          series2={{ values: sickTrend.fresh, name: 'Fell Sick That Month', color: freshColor }}
          height={230}
          onPointClick={i =>
            sickTrend.animals[i]?.length &&
            setDrill({
              title: `${sickTrend.labels[i]} — Sick Animals`,
              explainer: `${sickTrend.fresh[i]} fell sick in ${sickTrend.labels[i]} • ${sickTrend.carried[i]} carried over from earlier.`,
              icon: 'mdi:chart-line',
              tone: 'neutral',
              animals: sickTrend.animals[i]
            })
          }
        />
        {!!hotSites?.length && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              flexWrap: 'wrap',
              mt: 5,
              pt: 4,
              borderTop: `0.5px solid ${c.OutlineVariant}`
            }}
          >
            <Typography sx={{ fontSize: '16px', color: c.neutralSecondary }}>Sickness is concentrating at</Typography>
            {hotSites.map(h => (
              <Box
                key={h.site}
                onClick={() =>
                  allSiteAnimals?.length &&
                  setDrill({
                    title: 'Sick Animals by Site',
                    explainer: 'Sites whose share of sick animals runs above the collection average.',
                    icon: 'mdi:map-marker-outline',
                    tone: 'neutral',
                    animals: allSiteAnimals,
                    initialSite: h.site
                  })
                }
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  px: 3.5,
                  py: 1.25,
                  borderRadius: '20px',
                  backgroundColor: c.Surface,
                  border: `1px solid ${c.SurfaceVariant}`,
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: c.displaybgPrimary }
                }}
              >
                <Typography sx={{ fontSize: '16px', fontWeight: 600, color: c.OnSurfaceVariant }}>{h.site}</Typography>
                <Typography sx={{ fontSize: '16px', fontWeight: 800, color: c.Tertiary, fontVariantNumeric: 'tabular-nums' }}>
                  {h.count.toLocaleString()}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </SectionCard>

      <SignalDrawer payload={drill} onClose={() => setDrill(null)} onAnimal={aid => setRecordAid(aid)} />
      <AnimalHealthRecord aid={recordAid} clinical={clinical} preventive={preventive} onClose={() => setRecordAid(null)} />
    </>
  )
}

export default SickTrendCard
