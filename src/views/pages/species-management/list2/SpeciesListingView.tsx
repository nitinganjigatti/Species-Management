'use client'

import React, { useState } from 'react'
import { Box, Button, Card, Chip, Drawer, IconButton, Typography } from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'
import { alpha, useTheme } from '@mui/material/styles'
import type { GridColDef } from '@mui/x-data-grid'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'
import Icon from 'src/@core/components/icon'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'
import SpeciesListFilterRail from 'src/views/pages/species-management/list2/SpeciesListFilterRail'
import { type MajorFilterRow } from 'src/views/pages/species-management/list2/SpeciesListMajorFilters'
import { type AnalysisFilter, type SpeciesFilters } from 'src/views/pages/species-management/list2/speciesListing.utils'

export interface AppliedChip {
  id: string
  label: string
  onRemove: () => void
}

export interface PostureStats {
  species: number
  totalSpecies: number
  animals: number
  male: number
  female: number
  criticallyFew: number // animals in critically-few (1–3 population) species
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
  onDownload: () => void
  isDownloading: boolean
  chips: AppliedChip[]
  onResetAll: () => void
  posture: PostureStats
  filterSections: MajorFilterRow[]
  appliedFilters: SpeciesFilters
  onToggleFacet: (key: keyof SpeciesFilters, value: string) => void
  analysis: AnalysisFilter
  analysisYears: number[]
  onAnalysisChange: (next: AnalysisFilter) => void
}

const RAIL_WIDTH = 268

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
  onDownload,
  isDownloading,
  chips,
  onResetAll,
  posture,
  filterSections,
  appliedFilters,
  onToggleFacet,
  analysis,
  analysisYears,
  onAnalysisChange
}) => {
  const theme = useTheme()
  const cc = theme.palette.customColors as Record<string, string>
  const filtered = posture.species !== posture.totalSpecies
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Colorful equal-width stat box (Option A palette — all theme tokens). Tinted fill + accent figure.
  const statBox = (value: number, label: string, accent: string, bg: string, border: string, sub?: string) => (
    <Box
      sx={{
        flex: '1 1 0',
        minWidth: 168,
        borderRadius: '10px',
        border: `1px solid ${border}`,
        bgcolor: bg,
        px: '20px',
        py: '22px'
      }}
    >
      <Typography variant='h4' sx={{ fontWeight: 700, lineHeight: 1, color: accent, fontVariantNumeric: 'tabular-nums' }}>
        {value.toLocaleString()}
        {sub && (
          <Typography component='span' variant='body2' sx={{ color: cc.neutralSecondary, fontWeight: 500, ml: 0.75 }}>
            {sub}
          </Typography>
        )}
      </Typography>
      <Typography
        variant='body2'
        sx={{ mt: '16px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: cc.neutralSecondary }}
      >
        {label}
      </Typography>
    </Box>
  )

  // Persistent applied-filter chips — value-only pills + Clear all (mirrors the rail's selections).
  const chipRow = (
    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
      {chips.map(chip => (
        <Chip
          key={chip.id}
          label={chip.label}
          onDelete={chip.onRemove}
          deleteIcon={<Icon icon='mdi:close' fontSize='1rem' />}
          size='small'
          sx={{
            bgcolor: alpha(theme.palette.common.black, 0.06),
            color: cc.OnSurfaceVariant,
            fontWeight: 500,
            '& .MuiChip-deleteIcon': { color: cc.neutralSecondary, '&:hover': { color: cc.OnSurfaceVariant } }
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
  )

  const rail = (
    <SpeciesListFilterRail
      sections={filterSections}
      selected={appliedFilters}
      onToggle={onToggleFacet}
      analysis={analysis}
      analysisYears={analysisYears}
      onAnalysisChange={onAnalysisChange}
    />
  )

  return (
    <Box>
      <DynamicBreadcrumbs sx={{ mb: 5 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {/* ── Overview — title + download + live posture ── */}
        <Card>
          <Box
            sx={{
              px: 5,
              pt: 5,
              pb: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            <Typography variant='h6' sx={{ fontWeight: 600, color: cc.OnSurfaceVariant }}>
              Species List
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

          <Box sx={{ px: 5, pb: 5 }}>
            <Box sx={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              {statBox(
                posture.species,
                'Species',
                theme.palette.primary.dark,
                cc.OnBackground,
                alpha(theme.palette.primary.dark, 0.14),
                filtered ? `of ${posture.totalSpecies.toLocaleString()}` : undefined
              )}
              {statBox(posture.animals, 'Animals', cc.OnSurfaceVariant, alpha(cc.Outline, 0.14), alpha(cc.Outline, 0.28))}
              {statBox(posture.male, 'Male', theme.palette.secondary.main, cc.antzSecondaryBg, alpha(theme.palette.secondary.main, 0.2))}
              {statBox(posture.female, 'Female', theme.palette.primary.main, alpha(theme.palette.primary.main, 0.1), alpha(theme.palette.primary.main, 0.2))}
              {statBox(posture.criticallyFew, 'Critical', cc.Tertiary, cc.BgTeritary, alpha(cc.Tertiary, 0.22))}
            </Box>
          </Box>
        </Card>

        {/* ── Filter rail (left, sticky) + Results column (right) ── */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
          {/* Left rail — sticky + independently scrollable; hidden under lg (Drawer instead) */}
          <Box
            sx={{
              display: { xs: 'none', lg: 'block' },
              width: RAIL_WIDTH,
              flexShrink: 0,
              position: 'sticky',
              top: 16,
              alignSelf: 'flex-start',
              maxHeight: 'calc(100vh - 32px)',
              overflowY: 'auto'
            }}
          >
            <Card sx={{ px: 4, py: 3 }}>{rail}</Card>
          </Box>

          {/* Right column */}
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Mobile: open the rail as a drawer */}
            <Button
              variant='outlined'
              startIcon={<Icon icon='mdi:filter-variant' />}
              onClick={() => setMobileFiltersOpen(true)}
              sx={{
                display: { xs: 'inline-flex', lg: 'none' },
                alignSelf: 'flex-start',
                textTransform: 'none',
                fontWeight: 500,
                color: cc.OnSurfaceVariant,
                borderColor: cc.OutlineVariant
              }}
            >
              Filters{chips.length > 0 ? ` · ${chips.length}` : ''}
            </Button>

            {/* Persistent chip summary row — pinned above results */}
            {chips.length > 0 && (
              <Card sx={{ px: 4, py: 2.5, position: 'sticky', top: 16, zIndex: 6 }}>{chipRow}</Card>
            )}

            {/* Results header + table */}
            <Card sx={{ overflow: 'visible' }}>
              <Box sx={{ px: 5, pt: 5, pb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap' }}>
                    <Typography variant='h5' sx={{ fontWeight: 600, color: cc.OnSurfaceVariant }}>
                      Results
                    </Typography>
                    <Typography variant='body2' sx={{ color: cc.neutralSecondary }}>
                      {posture.species.toLocaleString()} species · {posture.animals.toLocaleString()} animals
                    </Typography>
                  </Box>
                  <Search
                    borderRadius='4px'
                    width='240px'
                    placeholder='Search species...'
                    value={searchValue}
                    onClear={onSearchClear}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
                  />
                </Box>
              </Box>

              <Box sx={{ mx: 5, mb: 7 }}>
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
            </Card>
          </Box>
        </Box>
      </Box>

      {/* Mobile filter drawer */}
      <Drawer
        anchor='left'
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        slotProps={{ paper: { sx: { width: { xs: '85%', sm: 340 }, px: 4, py: 3 } } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton size='small' onClick={() => setMobileFiltersOpen(false)}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>
        {rail}
      </Drawer>
    </Box>
  )
}

export default SpeciesListingView
