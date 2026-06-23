'use client'

import React from 'react'
import { Box, Card, IconButton, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import TabsWithMenu from 'src/views/pages/housing/utils/TabsWithMenu'
import type { SpeciesDetailHeader, SpeciesDetailTab } from 'src/types/species-management/detail'
import { StatusChip } from 'src/views/pages/species-management/detail/detailUi'
import { VitalStrip, type VitalSegment } from 'src/views/pages/species-management/dashboard/dashboardUi'

export interface DetailAlerts {
  up: number
  stable: number
  down: number
  overdue: number
  neverAssessed: number
  gained: number
  lost: number
  underMonitored: number
  thresholdMonths: number
}

interface SpeciesDetailViewProps {
  header?: SpeciesDetailHeader
  speciesId: string
  activeTab: SpeciesDetailTab
  onTabChange: (tab: SpeciesDetailTab) => void
  onBack: () => void
  showEggs?: boolean
  alerts?: DetailAlerts | null
  onAlertClick?: (key: string) => void
  children: React.ReactNode
}

const BASE_TABS: { labelKey: string; value: SpeciesDetailTab }[] = [
  { labelKey: 'Profile', value: 'profile' },
  { labelKey: 'Pairing', value: 'pairing' },
  { labelKey: 'Housing', value: 'housing' },
  { labelKey: 'Circle of Life', value: 'circle' },
  { labelKey: 'Assessments', value: 'assessments' },
  { labelKey: 'Medical', value: 'medical' },
  { labelKey: 'Identification', value: 'identification' },
  { labelKey: 'Breeds', value: 'breeds' }
]

const SpeciesDetailView: React.FC<SpeciesDetailViewProps> = ({
  header,
  speciesId,
  activeTab,
  onTabChange,
  onBack,
  showEggs,
  alerts,
  onAlertClick,
  children
}) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const h = header

  const TABS = showEggs
    ? BASE_TABS.flatMap(t => (t.value === 'circle' ? [t, { labelKey: 'Eggs', value: 'eggs' as SpeciesDetailTab }] : [t]))
    : BASE_TABS

  // Band 1 — species vitals (instrument strip, from header)
  const net = h?.netChange
  const netStr = typeof net === 'number' ? `${net >= 0 ? '▲' : '▼'} ${Math.abs(net).toLocaleString()}` : '—'
  const vitals: VitalSegment[] = [
    { label: 'Animals', value: (h?.total ?? 0).toLocaleString(), sub: `${h?.males ?? 0} M · ${h?.females ?? 0} F · ${h?.unsexed ?? 0} U` },
    { label: 'Net change', value: netStr, sub: `${h?.births ?? 0} births · ${h?.deaths ?? 0} deaths` },
    { label: 'Housing', value: `${h?.sites ?? 0} / ${h?.enclosures ?? 0}`, sub: 'sites / enclosures' },
    { label: 'Pairs', value: (h?.pairs ?? 0).toLocaleString(), sub: 'breedable' },
    ...(typeof h?.sexedPct === 'number' ? [{ label: 'Sexed', value: `${h.sexedPct}%` }] : []),
    ...(typeof h?.chippedPct === 'number' ? [{ label: 'Chipped', value: `${h.chippedPct}%` }] : [])
  ]

  // Band 2 — alert chips (only those with a count)
  const alertChips = alerts
    ? [
        { key: 'overdue_assessment', label: 'overdue assessment', count: alerts.overdue, tone: 'high' as const },
        { key: 'never_assessed', label: 'never assessed', count: alerts.neverAssessed, tone: 'med' as const },
        { key: 'weight_gain', label: 'gained >10%', count: alerts.gained, tone: 'med' as const },
        { key: 'weight_loss', label: 'lost >10%', count: alerts.lost, tone: 'high' as const },
        { key: 'under_monitored', label: 'under-monitored', count: alerts.underMonitored, tone: 'med' as const }
      ].filter(c => c.count > 0)
    : []
  const toneColor = (t: 'high' | 'med') => (t === 'high' ? cc.Tertiary : theme.palette.warning.main)

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        {/* Hero */}
        <Box sx={{ p: 5, pb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={onBack} sx={{ border: `1px solid ${cc.OutlineVariant}` }}>
                <Icon icon='mdi:arrow-left' />
              </IconButton>
              <Box>
                <Typography variant='h5'>{h?.commonName || `Species #${speciesId}`}</Typography>
                {h?.scientificName && (
                  <Typography variant='subtitle2' sx={{ fontStyle: 'italic', color: cc.neutralSecondary }}>
                    {h.scientificName}
                  </Typography>
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {h?.iucnStatus && <StatusChip label={`IUCN: ${h.iucnStatus}`} tone='warning' />}
              {h?.citesAppendix && <StatusChip label={`CITES: ${h.citesAppendix}`} tone='info' />}
            </Box>
          </Box>

          {(h?.class || h?.order || h?.family || h?.genus) && (
            <Typography variant='caption' sx={{ color: cc.neutralSecondary, display: 'block', mt: 1.5, ml: 7 }}>
              {[h?.class, h?.order, h?.family, h?.genus].filter(Boolean).join('  ›  ')}
            </Typography>
          )}

          {/* Band 1 — Stats (vital strip) */}
          <Box sx={{ mt: 3 }}>
            <VitalStrip segments={vitals} />
          </Box>
        </Box>

        {/* Band 2 — Notifications & Alerts */}
        {alerts && alertChips.length > 0 && (
          <Box sx={{ px: 5, pb: 4 }}>
            <Box
              sx={{
                border: `1px solid ${cc.Tertiary}40`,
                borderLeft: `4px solid ${cc.Tertiary}`,
                bgcolor: `${cc.Tertiary}14`,
                borderRadius: '10px',
                px: 3.5,
                py: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap', mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Icon icon='mdi:bell-alert-outline' fontSize='1.35rem' color={cc.Tertiary} />
                  <Typography variant='subtitle1' sx={{ fontWeight: 700, color: cc.Tertiary }}>
                    Notifications &amp; Alerts
                  </Typography>
                </Box>
                <Box sx={{ display: 'inline-flex', gap: 2.5, ml: 1 }}>
                  <Typography variant='subtitle2' sx={{ fontWeight: 600, color: theme.palette.primary.main }}>▲ {alerts.up} increasing</Typography>
                  <Typography variant='subtitle2' sx={{ fontWeight: 600, color: cc.neutralSecondary }}>▬ {alerts.stable} stable</Typography>
                  <Typography variant='subtitle2' sx={{ fontWeight: 600, color: cc.Tertiary }}>▼ {alerts.down} declining</Typography>
                </Box>
                <Typography variant='body2' sx={{ ml: 'auto', color: cc.OnSurfaceVariant, bgcolor: 'background.paper', border: `1px solid ${cc.SurfaceVariant}`, borderRadius: '8px', px: 1.5, py: 0.75 }}>
                  Overdue threshold: {alerts.thresholdMonths} mo
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {alertChips.map(c => (
                  <Box
                    key={c.key}
                    onClick={() => onAlertClick?.(c.key)}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1.25,
                      bgcolor: 'background.paper',
                      border: `1px solid ${toneColor(c.tone)}40`,
                      borderRadius: '10px',
                      px: 2.25,
                      py: 1.25,
                      cursor: 'pointer',
                      transition: '0.15s',
                      '&:hover': { borderColor: toneColor(c.tone), boxShadow: `0 2px 8px ${toneColor(c.tone)}1F` }
                    }}
                  >
                    <Typography variant='h6' sx={{ fontWeight: 700, color: toneColor(c.tone), lineHeight: 1 }}>
                      {c.count}
                    </Typography>
                    <Typography variant='body2' sx={{ color: cc.OnSurfaceVariant }}>
                      {c.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}

        {/* Band 3 — Tabs */}
        <TabsWithMenu
          tabs={TABS}
          selectedTab={activeTab}
          onTabChange={(_e, v) => onTabChange(v as SpeciesDetailTab)}
        />
      </Card>

      {/* Active tab content */}
      <Box sx={{ pb: 10 }}>{children}</Box>
    </Box>
  )
}

export default SpeciesDetailView
