'use client'

import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import { VitalStrip, NeedsAttention, ExploreGrid, SexDonut, BirthsDeathsTrend } from './dashboardUi'
import type { VitalSegment, Composition } from './dashboardUi'
import DashboardDateRange from './DashboardDateRange'
import type { RangeSelection } from './DashboardDateRange'
import type { DashboardData, DashboardAlert } from 'src/types/species-management/dashboard'

export interface DashboardViewProps {
  loading: boolean
  error: boolean
  segments: VitalSegment[]
  alerts: DashboardAlert[]
  totalAlertItems: number
  compositions: Composition[]
  sex: DashboardData['totals']['animals']
  trend: DashboardData['trend12']
  range: RangeSelection
  onRangeChange: (sel: RangeSelection) => void
  onAlertClick: (a: DashboardAlert) => void
}

export default function DashboardView(props: DashboardViewProps) {
  const { loading, error, segments, alerts, totalAlertItems, compositions, sex, trend, range, onRangeChange, onAlertClick } =
    props

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color='error'>Could not load the dashboard. Please retry.</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant='h5'>Species Management</Typography>
          <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary' }}>
            Date range applies to births / deaths · composition shown as of today
          </Typography>
        </Box>
        <DashboardDateRange value={range} onChange={onRangeChange} />
      </Box>

      {/* Band 1 — vital strip */}
      {loading ? <Skeleton variant='rounded' height={96} /> : <VitalStrip segments={segments} />}

      {/* Band 2 — triage + sex composition (original widths, equal height) */}
      <Box sx={{ display: 'flex', gap: 1.75, alignItems: 'stretch', flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1.6 1 340px', minWidth: 0, display: 'flex' }}>
          {loading ? (
            <Skeleton variant='rounded' height={320} sx={{ width: '100%' }} />
          ) : (
            <NeedsAttention alerts={alerts} totalItems={totalAlertItems} onAlertClick={onAlertClick} />
          )}
        </Box>
        <Box sx={{ flex: '1 1 260px', minWidth: 0, display: 'flex' }}>
          {loading ? <Skeleton variant='rounded' height={320} sx={{ width: '100%' }} /> : <SexDonut animals={sex} />}
        </Box>
      </Box>

      {/* Band 3 — explore chart grid */}
      {loading ? <Skeleton variant='rounded' height={280} /> : <ExploreGrid compositions={compositions} />}

      {/* Band 4 — births vs deaths */}
      {!loading && <BirthsDeathsTrend trend={trend} />}
    </Box>
  )
}
