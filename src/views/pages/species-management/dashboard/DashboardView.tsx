'use client'

import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import {
  VitalStrip,
  NeedsAttention,
  ExploreGrid,
  SexDonut,
  BirthsDeathsTrend,
  TaxonomyStatusStrip,
  SpeciesAlertList
} from './dashboardUi'
import type { VitalSegment, Composition, StatusChip, SpeciesAlertRow } from './dashboardUi'
import DashboardDateRange from './DashboardDateRange'
import type { RangeSelection } from './DashboardDateRange'
import DashboardSpeciesPicker from './DashboardSpeciesPicker'
import type { SpeciesOption } from './DashboardSpeciesPicker'
import type { DashboardData, DashboardAlert } from 'src/types/species-management/dashboard'

export interface DashboardViewProps {
  loading: boolean
  error: boolean
  /** True once a single species is picked — swaps the cross-species widgets for scoped, clickable ones. */
  isSpecies: boolean
  speciesOptions: SpeciesOption[]
  selectedSpeciesId: number | null
  onSpeciesChange: (id: number | null) => void
  segments: VitalSegment[]
  alerts: DashboardAlert[]
  totalAlertItems: number
  compositions: Composition[]
  sex: DashboardData['totals']['animals']
  trend: DashboardData['trend12']
  taxonomyChips: StatusChip[]
  speciesAlerts: SpeciesAlertRow[]
  onSexClick?: () => void
  onTrendClick?: () => void
  onSpeciesAlertClick?: () => void
  range: RangeSelection
  onRangeChange: (sel: RangeSelection) => void
  onAlertClick: (a: DashboardAlert) => void
}

export default function DashboardView(props: DashboardViewProps) {
  const {
    loading,
    error,
    isSpecies,
    speciesOptions,
    selectedSpeciesId,
    onSpeciesChange,
    segments,
    alerts,
    totalAlertItems,
    compositions,
    sex,
    trend,
    taxonomyChips,
    speciesAlerts,
    onSexClick,
    onTrendClick,
    onSpeciesAlertClick,
    range,
    onRangeChange,
    onAlertClick
  } = props

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
            {isSpecies
              ? 'Single-species view · click any chart to open its detail'
              : 'Date range applies to births / deaths · composition shown as of today'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <DashboardSpeciesPicker options={speciesOptions} value={selectedSpeciesId} onChange={onSpeciesChange} />
          <DashboardDateRange value={range} onChange={onRangeChange} />
        </Box>
      </Box>

      {/* Band 1 — vital strip */}
      {loading ? <Skeleton variant='rounded' height={96} /> : <VitalStrip segments={segments} />}

      {/* Band 2 — triage + sex composition (equal height) */}
      <Box sx={{ display: 'flex', gap: 1.75, alignItems: 'stretch', flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1.6 1 340px', minWidth: 0, display: 'flex' }}>
          {loading ? (
            <Skeleton variant='rounded' height={320} sx={{ width: '100%' }} />
          ) : isSpecies ? (
            <SpeciesAlertList alerts={speciesAlerts} onClick={onSpeciesAlertClick ?? (() => {})} />
          ) : (
            <NeedsAttention alerts={alerts} totalItems={totalAlertItems} onAlertClick={onAlertClick} />
          )}
        </Box>
        <Box sx={{ flex: '1 1 260px', minWidth: 0, display: 'flex' }}>
          {loading ? <Skeleton variant='rounded' height={320} sx={{ width: '100%' }} /> : <SexDonut animals={sex} onClick={onSexClick} />}
        </Box>
      </Box>

      {/* Band 3 — explore grid (all-species) OR taxonomy & status strip (single-species) */}
      {!loading &&
        (isSpecies ? <TaxonomyStatusStrip chips={taxonomyChips} /> : <ExploreGrid compositions={compositions} />)}

      {/* Band 4 — births vs deaths */}
      {!loading && <BirthsDeathsTrend trend={trend} onClick={onTrendClick} />}
    </Box>
  )
}
