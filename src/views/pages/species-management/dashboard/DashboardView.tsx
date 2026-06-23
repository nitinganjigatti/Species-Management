'use client'

import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import { VitalStrip, NeedsAttention, ExploreRail, BirthsDeathsTrend } from './dashboardUi'
import type { VitalSegment, Composition } from './dashboardUi'
import type { DashboardData, DashboardAlert } from 'src/types/species-management/dashboard'

export interface DashboardViewProps {
  loading: boolean
  error: boolean
  segments: VitalSegment[]
  alerts: DashboardAlert[]
  totalAlertItems: number
  compositions: Composition[]
  trend: DashboardData['trend12']
  onAlertClick: (a: DashboardAlert) => void
}

export default function DashboardView(props: DashboardViewProps) {
  const { loading, error, segments, alerts, totalAlertItems, compositions, trend, onAlertClick } = props

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color='error'>Could not load the dashboard. Please retry.</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
      <Typography variant='h5'>Species Management</Typography>

      {loading ? <Skeleton variant='rounded' height={96} /> : <VitalStrip segments={segments} />}

      <Box sx={{ display: 'flex', gap: 1.75, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1.55 1 320px', minWidth: 0 }}>
          {loading ? (
            <Skeleton variant='rounded' height={220} />
          ) : (
            <NeedsAttention alerts={alerts} totalItems={totalAlertItems} onAlertClick={onAlertClick} />
          )}
        </Box>
        <Box sx={{ flex: '1 1 240px', minWidth: 0 }}>
          {loading ? <Skeleton variant='rounded' height={220} /> : <ExploreRail compositions={compositions} />}
        </Box>
      </Box>

      {!loading && <BirthsDeathsTrend trend={trend} />}
    </Box>
  )
}
