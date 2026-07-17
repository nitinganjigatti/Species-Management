'use client'

/*
 * Site hotspots card — the verdict band (top-3 sites, hot ones in orange) + quiet list +
 * "view all" sheet. Lives on the Medical Overview, below Health status. Site click → that
 * site's sick animals → animal → full health record.
 */
import React, { useMemo, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import type { SpeciesClinical, SpeciesPreventive } from 'src/lib/api/species-management/detail'
import { SectionCard } from 'src/views/pages/species-management/detail2/detailUi'
import { resolveRange, type RangeSelection } from 'src/views/pages/species-management/dashboard/DashboardDateRange'
import { computeHotspots, INSIGHT_THRESHOLDS, type InsightBarRow } from './signals'
import SignalDrawer, { type SignalDrawerPayload } from './SignalDrawer'
import SitesSheet from './SitesSheet'
import AnimalHealthRecord from './AnimalHealthRecord'

const cc = (theme: any) => theme.palette.customColors as Record<string, string>

const SiteHotspotsCard: React.FC<{
  clinical?: SpeciesClinical | null
  preventive?: SpeciesPreventive | null
  range: RangeSelection
}> = ({ clinical, preventive, range }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const [drill, setDrill] = useState<SignalDrawerPayload | null>(null)
  const [sitesOpen, setSitesOpen] = useState(false)
  const [recordAid, setRecordAid] = useState<string | null>(null)

  const { rows: hotspots, avg: hotspotAvg, sickTotal } = useMemo(() => {
    const now = new Date()
    const { from, to } = resolveRange(range, now)
    const lo = from ? from.getTime() : null
    const hi = to.getTime()
    const inWin = (s?: string) => {
      if (!s) return true
      const t = new Date(s).getTime()
      if (isNaN(t)) return true

      return (lo == null || t >= lo) && t <= hi
    }

    return computeHotspots(clinical, inWin)
  }, [clinical, range])

  // hot sites: meaningfully above the collection average AND more than a lone sick animal
  const hotSites = hotspots
    .filter(s => hotspotAvg > 0 && s.value >= hotspotAvg * INSIGHT_THRESHOLDS.hotspotHotMult && (s.sickAnimals ?? 0) >= INSIGHT_THRESHOLDS.hotspotMinSick)
    .slice(0, 3)
  const hotKeys = new Set(hotSites.map(s => s.label))
  const bandSites = hotspots.slice(0, 3) // the band always shows the top 3 — hot ones in orange, the rest neutral
  const otherSites = hotspots.slice(bandSites.length)
  const hotSickSum = hotSites.reduce((s, r) => s + (r.sickAnimals ?? 0), 0)

  const openSite = (row: InsightBarRow, hot: boolean) =>
    setDrill({
      title: row.label,
      explainer: `${row.sub} fell sick here in this window.`,
      icon: hot ? 'mdi:fire' : 'mdi:map-marker',
      tone: hot ? 'error' : 'neutral',
      animals: row.animals
    })

  if (!hotspots.length) return null

  return (
    <>
      <SectionCard title='Site hotspots' titleMb={4}>
        <Box
          sx={{
            backgroundColor: hotSites.length ? c.BgTeritary : c.Surface,
            border: `1px solid ${hotSites.length ? `${c.Tertiary}22` : c.SurfaceVariant}`,
            borderRadius: '16px',
            px: 6,
            py: 5.5,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '250px 1fr' },
            gap: 6,
            alignItems: 'center'
          }}
        >
          <Box>
            <Typography sx={{ fontSize: 24, fontWeight: 700, lineHeight: 1.3, color: c.OnSurfaceVariant }}>
              {hotSites.length ? (
                <>
                  <Box component='span' sx={{ color: c.Tertiary }}>
                    {hotSites.length === 1 ? '1 site' : `${hotSites.length} sites`}
                  </Box>{' '}
                  {hotSites.length === 1 ? 'is' : 'are'} running hot
                </>
              ) : (
                'No site is running hot'
              )}
            </Typography>
            <Typography variant='caption' sx={{ color: c.neutralSecondary, display: 'block', mt: 2 }}>
              {hotSites.length
                ? `${hotSickSum} of the ${sickTotal} sick animals are here`
                : `Sickness is spread evenly — ${hotspotAvg}% of animals fell sick across sites`}
            </Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: `repeat(${Math.min(3, bandSites.length)}, 1fr)` }, gap: 4 }}>
            {bandSites.map(site => {
              const hot = hotKeys.has(site.label)

              return (
                <Box
                  key={site.label}
                  onClick={() => openSite(site, hot)}
                  sx={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${hot ? `${c.Tertiary}26` : c.SurfaceVariant}`,
                    borderRadius: '14px',
                    px: 5,
                    py: 4.5,
                    cursor: 'pointer',
                    transition: 'box-shadow .15s ease',
                    '&:hover': { boxShadow: hot ? '0 6px 18px rgba(250,97,64,0.14)' : '0 2px 8px rgba(68,84,74,0.14)' }
                  }}
                >
                  <Typography sx={{ fontSize: '13px', fontWeight: 700, color: c.OnSurfaceVariant }} noWrap>
                    {site.label}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mt: 2 }}>
                    <Typography
                      sx={{ fontSize: 44, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', color: hot ? c.Tertiary : c.OnSurfaceVariant }}
                    >
                      {site.sickAnimals ?? 0}
                    </Typography>
                    <Typography sx={{ fontSize: '13px', color: c.neutralSecondary }}>of {site.housed ?? 0}</Typography>
                    <Box
                      component='span'
                      sx={{
                        fontSize: '13px',
                        fontWeight: 700,
                        px: 2,
                        py: 0.5,
                        borderRadius: '10px',
                        backgroundColor: c.BgTeritary,
                        color: c.Tertiary
                      }}
                    >
                      {site.value}%
                    </Box>
                  </Box>
                </Box>
              )
            })}
          </Box>
        </Box>

        {otherSites.length > 0 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 5, mb: 1 }}>
              <Typography variant='caption' sx={{ fontWeight: 600, color: c.neutralSecondary }}>
                Other sites · {otherSites.length}
              </Typography>
              <Box
                onClick={() => setSitesOpen(true)}
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, cursor: 'pointer', color: theme.palette.primary.dark }}
              >
                <Typography variant='caption' sx={{ fontWeight: 600, color: 'inherit' }}>
                  View all
                </Typography>
                <Icon icon='mdi:chevron-right' fontSize={15} />
              </Box>
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                columnGap: 14,
                // last row of each column: no divider, no trailing padding
                '& > *:nth-last-of-type(-n+2)': { borderBottom: 'none', pb: 0 }
              }}
            >
              {otherSites.slice(0, 4).map(site => (
                <Box
                  key={site.label}
                  onClick={() => openSite(site, false)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    py: 3,
                    borderBottom: `0.5px solid ${c.SurfaceVariant}`,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: c.Surface }
                  }}
                >
                  <Typography sx={{ flex: 1, fontSize: '13.5px', color: c.OnSurfaceVariant, minWidth: 0 }} noWrap>
                    {site.label}
                  </Typography>
                  <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
                    <Box component='span' sx={{ fontSize: '14px', fontWeight: 700, color: c.OnSurfaceVariant }}>
                      {site.sickAnimals ?? 0}
                    </Box>{' '}
                    of {site.housed ?? 0}
                  </Typography>
                </Box>
              ))}
            </Box>
          </>
        )}
      </SectionCard>

      <SitesSheet
        open={sitesOpen}
        hotspots={hotspots}
        avg={hotspotAvg}
        sickTotal={sickTotal}
        onClose={() => setSitesOpen(false)}
        onSite={row => openSite(row, hotKeys.has(row.label))}
      />
      <SignalDrawer payload={drill} onClose={() => setDrill(null)} onAnimal={aid => setRecordAid(aid)} />
      <AnimalHealthRecord aid={recordAid} clinical={clinical} preventive={preventive} onClose={() => setRecordAid(null)} />
    </>
  )
}

export default SiteHotspotsCard
