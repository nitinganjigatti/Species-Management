'use client'

import React, { useState } from 'react'
import { Box, Button, Card, Chip, IconButton, Typography } from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'
import { useTheme } from '@mui/material/styles'
import type { GridColDef } from '@mui/x-data-grid'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import Icon from 'src/@core/components/icon'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'
import { getReadiness, type SpeciesRow } from 'src/views/pages/species-management/speciesListing.utils'

export interface AppliedChip {
  id: string
  label: string
  onRemove: () => void
}

export interface PostureStats {
  species: number
  totalSpecies: number
  animals: number
  singleSex: number
  criticallyFew: number
}

interface SpeciesListingViewProps {
  columns: GridColDef[]
  rows: Record<string, unknown>[]
  totalCount: number
  loading: boolean
  searchValue: string
  onSearchChange: (value: string) => void
  onSearchClear: () => void
  paginationModel: { page: number; pageSize: number }
  onPaginationChange: (model: { page: number; pageSize: number }) => void
  onCellClick: (params: { field: string; row: Record<string, unknown> }) => void
  filterCount: number
  onFilterOpen: () => void
  onDownload: () => void
  isDownloading: boolean
  chips: AppliedChip[]
  onResetAll: () => void
  posture: PostureStats
}

const SpeciesListingView: React.FC<SpeciesListingViewProps> = ({
  columns,
  rows,
  totalCount,
  loading,
  searchValue,
  onSearchChange,
  onSearchClear,
  paginationModel,
  onPaginationChange,
  onCellClick,
  filterCount,
  onFilterOpen,
  onDownload,
  isDownloading,
  chips,
  onResetAll,
  posture
}) => {
  const theme = useTheme()
  const cc = theme.palette.customColors as Record<string, string>
  const filtered = posture.species !== posture.totalSpecies
  const [view, setView] = useState<'list' | 'gallery'>('list')
  const readinessColor = (r: string) =>
    r === 'can_pair'
      ? theme.palette.primary.main
      : r === 'single_sex'
      ? cc.Tertiary
      : r === 'needs_sexing'
      ? theme.palette.warning.main
      : cc.Outline

  return (
    <Box>
      <DynamicBreadcrumbs sx={{ mb: 5 }} />

      <Card>
        {/* Header: title + count + download */}
        <Box
          sx={{
            px: 5,
            pt: 5,
            pb: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Typography variant='h6' sx={{ fontWeight: 600, color: cc.OnSurfaceVariant }}>
            Species List ({totalCount.toLocaleString()})
          </Typography>
          <Button
            variant='text'
            onClick={onDownload}
            disabled={isDownloading}
            endIcon={
              isDownloading ? (
                <CircularProgress size={16} sx={{ color: cc.OnSurface }} />
              ) : (
                <Icon icon='solar:download-square-linear' />
              )
            }
            sx={{ color: cc.OnSurface, fontWeight: 500, textTransform: 'none' }}
          >
            {isDownloading ? 'Preparing...' : 'Download'}
          </Button>
        </Box>

        {/* Applied-filter chips (visible, removable) */}
        {chips.length > 0 && (
          <Box sx={{ px: 5, pb: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
            <Typography variant='caption' sx={{ color: cc.neutralSecondary, fontWeight: 600 }}>
              Applied:
            </Typography>
            {chips.map(chip => (
              <Chip
                key={chip.id}
                label={chip.label}
                onDelete={chip.onRemove}
                size='small'
                sx={{
                  bgcolor: cc.OnBackground,
                  color: cc.primaryDark || theme.palette.primary.dark,
                  fontWeight: 500,
                  '& .MuiChip-deleteIcon': { color: cc.neutralSecondary }
                }}
              />
            ))}
            <Button
              variant='text'
              size='small'
              onClick={onResetAll}
              sx={{ color: cc.Tertiary, fontWeight: 600, textTransform: 'none', minWidth: 'auto' }}
            >
              Clear all
            </Button>
          </Box>
        )}

        {/* Posture strip — live stats for the current (filtered) working set */}
        <Box sx={{ px: 5, pb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              flexWrap: 'wrap',
              border: `1px solid ${cc.SurfaceVariant}`,
              borderRadius: '10px',
              px: 3,
              py: 2
            }}
          >
            <Box>
              <Typography variant='h5' sx={{ color: theme.palette.primary.dark, lineHeight: 1 }}>
                {posture.species.toLocaleString()}
              </Typography>
              <Typography variant='caption' sx={{ color: cc.neutralSecondary }}>
                species · {posture.animals.toLocaleString()} animals
                {filtered ? ` of ${posture.totalSpecies.toLocaleString()}` : ''}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: cc.Tertiary }} />
              <Typography variant='body2' sx={{ color: cc.OnSurfaceVariant }}>
                <strong>{posture.singleSex.toLocaleString()}</strong> single-sex
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: theme.palette.warning.main }} />
              <Typography variant='body2' sx={{ color: cc.OnSurfaceVariant }}>
                <strong>{posture.criticallyFew.toLocaleString()}</strong> critically-few (1–3)
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Toolbar: search + filter */}
        <Box
          sx={{
            px: 5,
            pb: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3
          }}
        >
          <Search
            borderRadius='4px'
            width='220px'
            placeholder='Search species...'
            value={searchValue}
            onClear={onSearchClear}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', border: `1px solid ${cc.SurfaceVariant}`, borderRadius: '8px', overflow: 'hidden' }}>
              {(['list', 'gallery'] as const).map(v => (
                <IconButton
                  key={v}
                  size='small'
                  onClick={() => setView(v)}
                  sx={{
                    borderRadius: 0,
                    bgcolor: view === v ? cc.Surface : 'transparent',
                    color: view === v ? theme.palette.primary.dark : cc.neutralSecondary
                  }}
                >
                  <Icon icon={v === 'list' ? 'mdi:view-list' : 'mdi:view-grid-outline'} />
                </IconButton>
              ))}
            </Box>
            <FilterButtonWithNotification
              label='Filter'
              onClick={onFilterOpen}
              appliedFiltersCount={filterCount || undefined}
            />
          </Box>
        </Box>

        {/* Gallery view */}
        {view === 'gallery' && (
          <Box sx={{ mx: 5, mb: 5, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 3 }}>
            {rows.map(r => {
              const row = r as unknown as SpeciesRow
              const rd = getReadiness(row)

              return (
                <Card
                  key={row.id}
                  onClick={() => onCellClick({ field: 'species_name', row: r })}
                  sx={{
                    cursor: 'pointer',
                    border: `1px solid ${cc.SurfaceVariant}`,
                    boxShadow: 'none',
                    p: 2,
                    transition: '0.15s',
                    '&:hover': { borderColor: theme.palette.primary.main }
                  }}
                >
                  <Box sx={{ height: 120, borderRadius: '8px', bgcolor: cc.OnBackground, display: 'grid', placeItems: 'center', mb: 1.5, overflow: 'hidden' }}>
                    <img src={row.image || '/images/housing/species-icon-colored.svg'} alt='' style={{ maxWidth: '70%', maxHeight: '70%' }} />
                  </Box>
                  <Typography variant='subtitle2' noWrap sx={{ fontWeight: 600 }}>
                    {row.species_name}
                  </Typography>
                  <Typography variant='caption' noWrap sx={{ fontStyle: 'italic', color: cc.neutralSecondary, display: 'block' }}>
                    {row.scientific_name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant='body2' sx={{ fontWeight: 700, color: cc.OnSurface }}>
                      {row.population.toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: readinessColor(rd), flexShrink: 0 }} />
                      <Typography variant='caption' noWrap sx={{ color: cc.neutralSecondary }}>
                        {(row.iucn || '').split(' (')[0]}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              )
            })}
          </Box>
        )}

        {/* Table */}
        {view === 'list' && (
        <Box sx={{ mx: 5, mb: 5 }}>
          <CommonTable
            columns={columns}
            indexedRows={rows}
            total={totalCount}
            loading={loading}
            paginationModel={paginationModel}
            setPaginationModel={onPaginationChange}
            handleSortModel={() => {}}
            searchValue=''
            getRowHeight={() => 'auto'}
            onRowClick={() => {}}
            onCellClick={onCellClick}
            externalTableStyle={{
              '& .MuiDataGrid-cell': { py: 2.5, px: 3, display: 'flex', alignItems: 'center' },
              '& .MuiDataGrid-row:hover': { cursor: 'pointer' },
              '& .MuiDataGrid-columnHeader': { px: 3 },
              // Sticky NO column
              '& .MuiDataGrid-cell[data-field="sl_no"]': {
                position: 'sticky',
                left: 0,
                zIndex: 3,
                backgroundColor: theme.palette.background.paper
              },
              '& .MuiDataGrid-columnHeader[data-field="sl_no"]': {
                position: 'sticky',
                left: 0,
                zIndex: 5,
                backgroundColor: cc.customTableHeaderBg
              },
              // Sticky SPECIES column (offset by NO width 60px)
              '& .MuiDataGrid-cell[data-field="species_name"]': {
                position: 'sticky',
                left: 60,
                zIndex: 3,
                backgroundColor: theme.palette.background.paper,
                borderRight: `1px solid ${cc.OutlineVariant}`
              },
              '& .MuiDataGrid-columnHeader[data-field="species_name"]': {
                position: 'sticky',
                left: 60,
                zIndex: 5,
                backgroundColor: cc.customTableHeaderBg,
                borderRight: `1px solid ${cc.OutlineVariant}`
              },
              '& .MuiDataGrid-row:hover .MuiDataGrid-cell[data-field="sl_no"]': { backgroundColor: cc.Surface },
              '& .MuiDataGrid-row:hover .MuiDataGrid-cell[data-field="species_name"]': { backgroundColor: cc.Surface }
            }}
          />
        </Box>
        )}
      </Card>
    </Box>
  )
}

export default SpeciesListingView
