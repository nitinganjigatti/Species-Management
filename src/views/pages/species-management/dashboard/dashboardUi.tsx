'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { SectionCard, StackedBar, TrendAreaChart, useTone } from 'src/views/pages/species-management/detail/detailUi'
import type { DashboardData, DashboardAlert } from 'src/types/species-management/dashboard'

export type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary'

export interface VitalSegment {
  label: string
  value: string
  sub?: string
  onClick?: () => void
}

/** Layer 1 — one bordered instrument strip with internal dividers (NOT cards). Wraps 6→3+3. */
export function VitalStrip({ segments }: { segments: VitalSegment[] }) {
  const theme = useTheme() as any
  const cc = theme.palette.customColors

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        border: `1px solid ${cc.SurfaceVariant}`,
        borderRadius: '10px',
        bgcolor: 'background.paper',
        overflow: 'hidden'
      }}
    >
      {segments.map(s => (
        <Box
          key={s.label}
          onClick={s.onClick}
          sx={{
            flex: '1 1 150px',
            minWidth: 150,
            p: 2,
            borderRight: `1px solid ${cc.SurfaceVariant}`,
            borderBottom: `1px solid ${cc.SurfaceVariant}`,
            cursor: s.onClick ? 'pointer' : 'default',
            transition: '0.15s',
            '&:hover': s.onClick ? { bgcolor: cc.Surface } : undefined
          }}
        >
          <Typography variant='caption' sx={{ color: cc.neutralSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {s.label}
          </Typography>
          <Typography variant='h5' sx={{ color: cc.OnSurfaceVariant, mt: 0.25 }}>
            {s.value}
          </Typography>
          {s.sub && (
            <Typography variant='caption' sx={{ color: cc.neutralSecondary, display: 'block' }}>
              {s.sub}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  )
}

/** Layer 2 — severity-sorted triage; each row a bullet-bar = % of species affected. */
export function NeedsAttention({
  alerts,
  totalItems,
  onAlertClick
}: {
  alerts: DashboardAlert[]
  totalItems: number
  onAlertClick: (a: DashboardAlert) => void
}) {
  const theme = useTheme() as any
  const cc = theme.palette.customColors
  const tone = useTone()
  const sevColor = (s: DashboardAlert['severity']) =>
    s === 'high' ? cc.Tertiary : s === 'medium' ? theme.palette.warning.main : tone('neutral').fg
  const rows = alerts.filter(a => a.speciesCount > 0)
  const maxPct = Math.max(1, ...rows.map(a => a.pctSpecies))

  return (
    <SectionCard
      title='Needs Attention'
      action={
        <Typography variant='caption' sx={{ color: cc.Tertiary, fontWeight: 700, bgcolor: cc.BgTeritary, px: 1, py: 0.25, borderRadius: 5 }}>
          {totalItems} items
        </Typography>
      }
    >
      {rows.length === 0 && (
        <Typography variant='body2' sx={{ color: cc.neutralSecondary }}>
          Nothing needs attention.
        </Typography>
      )}
      {rows.map(a => (
        <Box
          key={a.key}
          onClick={() => onAlertClick(a)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            py: 1,
            borderTop: `1px solid ${cc.Surface}`,
            cursor: 'pointer',
            '&:hover': { bgcolor: cc.Surface }
          }}
        >
          <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: sevColor(a.severity), flexShrink: 0 }} />
          <Typography variant='body2' sx={{ width: 170, flexShrink: 0, color: cc.OnSurfaceVariant }}>
            {a.label}
          </Typography>
          <Box sx={{ flex: 1, height: 7, bgcolor: cc.Surface, borderRadius: 4, overflow: 'hidden', minWidth: 40 }}>
            <Box sx={{ width: `${(a.pctSpecies / maxPct) * 100}%`, height: '100%', bgcolor: sevColor(a.severity), borderRadius: 4 }} />
          </Box>
          <Typography variant='subtitle2' sx={{ width: 40, textAlign: 'right', fontWeight: 700 }}>
            {a.speciesCount}
          </Typography>
          <Typography variant='caption' sx={{ width: 46, textAlign: 'right', color: cc.neutralSecondary }}>
            {a.pctSpecies}%
          </Typography>
          <Icon icon='mdi:chevron-right' fontSize='1.2rem' color={cc.OutlineVariant} />
        </Box>
      ))}
    </SectionCard>
  )
}

export interface Composition {
  title: string
  segments: { label: string; value: number; tone: Tone; onClick?: () => void }[]
}

/** Layer 3 — compact composition cards (stacked bars), each segment a filter entry. */
export function ExploreRail({ compositions }: { compositions: Composition[] }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {compositions.map(c => (
        <SectionCard key={c.title} title={c.title}>
          <StackedBar segments={c.segments.map(s => ({ label: s.label, value: s.value, tone: s.tone }))} />
        </SectionCard>
      ))}
    </Box>
  )
}

/** Births vs Deaths — last 12 months. v1 informational. */
export function BirthsDeathsTrend({ trend }: { trend: DashboardData['trend12'] }) {
  return (
    <SectionCard title='Births vs Deaths — last 12 months'>
      <TrendAreaChart data={trend.map(t => ({ label: t.label, value: t.births }))} tone='success' />
      <TrendAreaChart data={trend.map(t => ({ label: t.label, value: t.deaths }))} tone='error' />
    </SectionCard>
  )
}
