'use client'

// iPad build of the species listing view — rail shows by orientation (landscape), not viewport
// width. CC reskin: bare title on the sage ground, the five tinted stat boxes folded into ONE
// StatBand (count leads · sex composition as a ribbon · critical alone in coral), white
// hairline cards throughout, and the CC table language (pale teal-green header, one row
// hairline, only population/births/deaths wearing colour).

import React, { useState } from 'react'
import { Box, Button, Drawer, IconButton, Typography, useMediaQuery } from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'
import SpeciesFilterSheet from 'src/views/pages/species-management/ipad2/SpeciesFilterSheet'
import type { GridColDef } from '@mui/x-data-grid'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'
import Icon from 'src/@core/components/icon'
import * as skin from 'src/views/pages/species-management/ipad2/skin'
import { Ribbon } from 'src/views/pages/species-management/ipad2/marks'
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
  const filtered = posture.species !== posture.totalSpecies
  const portrait = useMediaQuery('(orientation: portrait)')

  // Legacy rail-copy drawer — kept dormant (the Filters button now opens the filter sheet).
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Diet-style filter sheet (portrait bottom sheet / landscape side sheet).
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  // ── The collection in one band (CC StatBand) — and it was five tinted boxes. ──
  // Three things at three weights: THE COUNT (species leads, animals supports),
  // THE COMPOSITION (one proportional ribbon — M/F/U are parts of a whole, and the
  // finding is usually how much is unsexed), THE EXCEPTION (critical, alone in coral,
  // hidden at zero — a coral "0" is an alarm about nothing).
  const undetermined = Math.max(0, posture.animals - posture.male - posture.female)
  const sexes = [
    { label: 'Male', value: posture.male, color: skin.LIST_GREEN },
    { label: 'Female', value: posture.female, color: skin.RIBBON_FEMALE },
    { label: 'Undetermined', value: undetermined, color: skin.RIBBON_UNSEXED }
  ]

  const statBand = (
    <Box sx={{ ...skin.cardSx, px: '20px', py: '16px' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: { xs: 3, sm: 6 }
        }}
      >
        {/* THE COUNT — baseline-aligned so the figures sit on one line however they wrap. */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, flexShrink: 0 }}>
          <Typography
            sx={{ fontSize: '32px', fontWeight: 600, lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: skin.VALUE }}
          >
            {posture.species.toLocaleString()}
          </Typography>
          <Typography variant='body2' sx={{ color: skin.MUTED }}>
            species
          </Typography>
          <Typography variant='body2' sx={{ color: skin.FAINT, fontVariantNumeric: 'tabular-nums' }}>
            {filtered ? `of ${posture.totalSpecies.toLocaleString()} · ` : '· '}
            {posture.animals.toLocaleString()} animals
          </Typography>
        </Box>

        {/* THE COMPOSITION — takes the slack; a bar is the one thing here that reads better wide. */}
        <Box sx={{ minWidth: 0, flex: 1, width: { xs: '100%', sm: 'auto' } }}>
          <Ribbon items={sexes} height={8} />
          <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 4, rowGap: 0.5 }}>
            {sexes.map(s => (
              <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Box sx={{ width: 7, height: 7, flexShrink: 0, borderRadius: '50%', bgcolor: s.color }} />
                <Typography variant='caption' sx={{ color: skin.MUTED }}>
                  {s.label}{' '}
                  <Box component='span' sx={{ color: skin.VALUE, fontVariantNumeric: 'tabular-nums' }}>
                    {s.value.toLocaleString()}
                  </Box>
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* THE EXCEPTION — the only figure a reader would act on today, so the only one in colour. */}
        {posture.criticallyFew > 0 && (
          <Box
            sx={{
              display: 'flex',
              flexShrink: 0,
              alignItems: { xs: 'baseline', sm: 'flex-end' },
              flexDirection: { xs: 'row', sm: 'column' },
              gap: { xs: 1.5, sm: 0.5 }
            }}
          >
            <Typography
              sx={{ fontSize: '26px', fontWeight: 600, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: skin.CORAL }}
            >
              {posture.criticallyFew.toLocaleString()}
            </Typography>
            <Typography
              variant='caption'
              sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: skin.MUTED }}
            >
              Critical
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )

  // The Filters button (portrait only) — a white CC pill. Standalone above the results
  // until filters are applied; once chips exist it moves INTO the chips card, anchoring the left.
  const filtersButton = (
    <Button
      startIcon={<Icon icon='mage:filter' color={skin.LIST_GREEN} />}
      onClick={() => setFilterSheetOpen(true)}
      sx={{
        textTransform: 'none',
        fontWeight: 500,
        color: skin.INK2,
        bgcolor: '#ffffff',
        border: `1px solid ${skin.HAIR}`,
        borderRadius: '999px',
        px: 4,
        whiteSpace: 'nowrap',
        // same height as FilterChip so the first chip row centers with the button
        height: 32,
        ...skin.cardPressSx,
        '&:hover': { bgcolor: skin.ROW_HOVER }
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
        <Box sx={{ width: '1px', alignSelf: 'stretch', bgcolor: skin.HAIR }} />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, flex: 1, minWidth: 0 }}>
        {chips.map(chip => (
          <FilterChip key={chip.id} label={chip.label} onClear={chip.onRemove} />
        ))}
        {/* Clear wears the coral wash — present only because there is something to clear. */}
        <Button
          variant='text'
          size='small'
          onClick={onResetAll}
          sx={{
            color: skin.CORAL,
            bgcolor: skin.mixOverWhite(skin.CORAL, 0.1),
            fontWeight: 600,
            textTransform: 'none',
            minWidth: 'auto',
            borderRadius: '999px',
            px: 2.5,
            '&:hover': { bgcolor: skin.mixOverWhite(skin.CORAL, 0.16) }
          }}
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* ── Title on the sage ground + the Download pill — no card around them ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, px: 1, pt: 1 }}>
          <Typography sx={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.4px', color: skin.INK }}>
            Species List
          </Typography>
          <Button
            onClick={onDownload}
            disabled={isDownloading}
            startIcon={
              isDownloading ? (
                <CircularProgress size={14} sx={{ color: skin.LIST_GREEN }} />
              ) : (
                <Icon icon='mdi:download-outline' fontSize='1.1rem' color={skin.LIST_GREEN} />
              )
            }
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              color: skin.INK2,
              bgcolor: '#ffffff',
              borderRadius: '999px',
              px: 4,
              py: 1.5,
              ...skin.cardPressSx,
              '&:hover': { bgcolor: skin.ROW_HOVER }
            }}
          >
            {isDownloading ? 'Preparing...' : 'Download'}
          </Button>
        </Box>

        {/* ── The summary band ── */}
        {statBand}

        {/* ── Filter rail (left, sticky) + Results column (right) ── */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
          {/* Left rail — sticky + independently scrollable; landscape only (sheet in portrait) */}
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
            <Box sx={{ ...skin.cardSx, px: 4, py: 3 }}>{rail}</Box>
          </Box>

          {/* Right column */}
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Filters entry: bare button until something is applied (no empty white strip);
                the white chips card appears — with the button inside — once chips exist. */}
            {portrait && chips.length === 0 && <Box sx={{ alignSelf: 'flex-start' }}>{filtersButton}</Box>}
            {chips.length > 0 && (
              <Box sx={{ ...skin.cardSx, p: 4, position: 'sticky', top: 16, zIndex: 6 }}>{chipRow}</Box>
            )}

            {/* Results header + table */}
            <Box sx={{ ...skin.cardSx, overflow: 'visible' }}>
              <Box sx={{ px: 5, pt: 5, pb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.2px', color: skin.INK }}>
                      Results
                    </Typography>
                    {/* The one line on the page that moves with the filters — both halves of the SAME set. */}
                    <Typography variant='caption' sx={{ color: skin.FAINT, fontVariantNumeric: 'tabular-nums', display: 'block', mt: 0.5 }}>
                      {posture.species.toLocaleString()} species · {posture.animals.toLocaleString()} animals
                    </Typography>
                  </Box>
                  <Search
                    borderRadius='999px'
                    backgroundColor={skin.FIELD_BG}
                    width='240px'
                    placeholder='Search species...'
                    value={searchValue}
                    onClear={onSearchClear}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
                    textFielsSX={{
                      '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                      '& .MuiInputBase-root.Mui-focused': { boxShadow: `0 0 0 2px ${skin.FOCUS_RING}` }
                    }}
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
                    // ── CC table language: pale teal-green header, uppercase overline header
                    // type, ONE row hairline (no vertical rules), quiet green row hover. ──
                    '& .MuiDataGrid-columnHeaders': { backgroundColor: skin.TABLE_HEAD_BG },
                    '& .MuiDataGrid-cell': {
                      ...GRID_CELL_PAD,
                      py: 2.5,
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '16px',
                      borderBottomColor: skin.ROW_LINE
                    },
                    '& .MuiDataGrid-row:hover': { cursor: 'pointer', backgroundColor: skin.ROW_HOVER },
                    '& .MuiDataGrid-columnHeader': { ...GRID_CELL_PAD, backgroundColor: skin.TABLE_HEAD_BG },
                    '& .MuiDataGrid-columnHeaderTitle': {
                      fontSize: '13px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: skin.TABLE_HEAD_INK,
                      whiteSpace: 'normal',
                      lineHeight: 1.2,
                      overflow: 'visible',
                      textOverflow: 'clip'
                    },
                    '& .MuiDataGrid-cell[data-field="sl_no"]': {
                      position: 'sticky',
                      left: 0,
                      zIndex: 3,
                      backgroundColor: '#ffffff'
                    },
                    '& .MuiDataGrid-columnHeader[data-field="sl_no"]': {
                      position: 'sticky',
                      left: 0,
                      zIndex: 5,
                      backgroundColor: skin.TABLE_HEAD_BG
                    },
                    '& .MuiDataGrid-cell[data-field="species_name"]': {
                      position: 'sticky',
                      left: 60,
                      zIndex: 3,
                      backgroundColor: '#ffffff',
                      borderRight: `1px solid ${skin.ROW_LINE}`
                    },
                    '& .MuiDataGrid-columnHeader[data-field="species_name"]': {
                      position: 'sticky',
                      left: 60,
                      zIndex: 5,
                      backgroundColor: skin.TABLE_HEAD_BG,
                      borderRight: `1px solid ${skin.ROW_LINE}`
                    },
                    '& .MuiDataGrid-row:hover .MuiDataGrid-cell[data-field="sl_no"]': { backgroundColor: skin.ROW_HOVER },
                    '& .MuiDataGrid-row:hover .MuiDataGrid-cell[data-field="species_name"]': { backgroundColor: skin.ROW_HOVER }
                  }}
                />
              </Box>
            </Box>
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
