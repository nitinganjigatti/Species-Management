'use client'

// iPad build of the species listing view — rail shows by orientation (landscape), not viewport width.

import React, { useState } from 'react'
import { Box, Button, Card, Drawer, IconButton, Typography, useMediaQuery } from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'
import { alpha, useTheme } from '@mui/material/styles'
import SpeciesFilterSheet from 'src/views/pages/species-management/ipad2/SpeciesFilterSheet'
import type { GridColDef } from '@mui/x-data-grid'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'
import Icon from 'src/@core/components/icon'
import { FilterChip, GRID_CELL_PAD } from 'src/views/pages/species-management/ipad2/detail/detailUi'
import SpeciesListFilterRail from 'src/views/pages/species-management/ipad2/list/SpeciesListFilterRail'
import { type MajorFilterRow } from 'src/views/pages/species-management/ipad2/list/SpeciesListMajorFilters'
import { type AnalysisFilter, type SpeciesFilters } from 'src/views/pages/species-management/ipad2/list/speciesListing.utils'

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
  onApplyFilters: (sel: Record<string, string[]>) => void
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
  onApplyFilters,
  analysis,
  analysisYears,
  onAnalysisChange
}) => {
  const theme = useTheme()
  const cc = theme.palette.customColors as Record<string, string>
  const filtered = posture.species !== posture.totalSpecies
  const portrait = useMediaQuery('(orientation: portrait)')

  // Legacy rail-copy drawer — kept dormant (the Filters button now opens the filter sheet).
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Diet-style filter sheet (portrait bottom sheet / landscape side sheet).
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  // Colorful equal-width stat box (Option A palette — all theme tokens). Tinted fill + accent figure.
  const statBox = (value: number, label: string, accent: string, bg: string, border: string, sub?: string) => (
    <Box
      sx={{
        flex: '1 1 0',
        minWidth: 128,
        borderRadius: '10px',
        border: `1px solid ${border}`,
        bgcolor: bg,
        px: '16px',
        py: '14px'
      }}
    >
      <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1, color: accent, fontVariantNumeric: 'tabular-nums' }}>
        {value.toLocaleString()}
        {sub && (
          <Typography component='span' variant='body2' sx={{ color: cc.neutralSecondary, fontWeight: 500, ml: 0.75 }}>
            {sub}
          </Typography>
        )}
      </Typography>
      <Typography
        variant='body2'
        sx={{ mt: '8px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: cc.neutralSecondary }}
      >
        {label}
      </Typography>
    </Box>
  )

  // The Filters button (portrait only). Standalone above the results until filters are
  // applied; once chips exist it moves INTO the white chips card, anchoring the left.
  const filtersButton = (
    <Button
      variant='outlined'
      startIcon={<Icon icon='mage:filter' />}
      onClick={() => setFilterSheetOpen(true)}
      sx={{
        textTransform: 'none',
        fontWeight: 500,
        color: cc.OnSurfaceVariant,
        borderColor: cc.OutlineVariant,
        whiteSpace: 'nowrap',
        // same height as FilterChip so the first chip row centers with the button
        height: 32
      }}
    >
      Filters{chips.length > 0 ? ` · ${chips.length}` : ''}
    </Button>
  )

  // Applied-filter chips card content — button column (never wraps with the chips) +
  // hairline divider, then the chips + Clear all wrapping in their own tray.
  const chipRow = (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
      <Box
        sx={{
          display: 'none',
          '@media (orientation: portrait)': { display: 'flex' },
          alignItems: 'flex-start',
          gap: 3,
          flexShrink: 0,
          alignSelf: 'stretch'
        }}
      >
        {filtersButton}
        <Box sx={{ width: '1px', alignSelf: 'stretch', bgcolor: cc.SurfaceVariant }} />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, flex: 1, minWidth: 0 }}>
        {chips.map(chip => (
          <FilterChip key={chip.id} label={chip.label} onClear={chip.onRemove} />
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
              display: 'none',
              '@media (orientation: landscape)': { display: 'block' },
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
            {/* Filters entry: bare button until something is applied (no empty white strip);
                the white chips card appears — with the button inside — once chips exist. */}
            {portrait && chips.length === 0 && <Box sx={{ alignSelf: 'flex-start' }}>{filtersButton}</Box>}
            {chips.length > 0 && (
              <Card sx={{ p: 4, position: 'sticky', top: 16, zIndex: 6 }}>{chipRow}</Card>
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
                    '& .MuiDataGrid-cell': { ...GRID_CELL_PAD, py: 2.5, display: 'flex', alignItems: 'center', fontSize: '16px' },
                    '& .MuiDataGrid-row:hover': { cursor: 'pointer' },
                    '& .MuiDataGrid-columnHeader': { ...GRID_CELL_PAD },
                    '& .MuiDataGrid-columnHeaderTitle': {
                      fontSize: '15px',
                      whiteSpace: 'normal',
                      lineHeight: 1.2,
                      overflow: 'visible',
                      textOverflow: 'clip'
                    },
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

      {/* Diet-style filter sheet — portrait bottom sheet / landscape side sheet. Sections
          mirror the rail facets (same options + counts). Apply commits the whole draft. */}
      <SpeciesFilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        sections={filterSections.map(s => ({ key: s.key as string, label: s.label, options: s.options }))}
        selected={appliedFilters as unknown as Record<string, string[]>}
        onApply={onApplyFilters}
      />

      {/* Legacy mobile filter drawer (rail copy) — kept dormant; nothing opens it since the
          Filters button switched to the filter sheet above. */}
      <Drawer
        anchor='left'
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        slotProps={{ paper: { sx: { width: 360, maxWidth: '85%', px: 4, py: 3 } } }}
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
