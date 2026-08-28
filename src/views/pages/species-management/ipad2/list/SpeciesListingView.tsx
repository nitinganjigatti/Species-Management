'use client'

// iPad build of the species listing view — rail shows by orientation (landscape), not viewport
// width. CC reskin: bare title on the sage ground, the five tinted stat boxes folded into ONE
// StatBand (count leads · sex composition as a ribbon · critical alone in coral), white
// hairline cards throughout, and the CC table language (pale teal-green header, one row
// hairline, only population/births/deaths wearing colour).

import React, { useState } from 'react'
import { Box, Button, Drawer, IconButton, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CircularProgress from '@mui/material/CircularProgress'
import SpeciesFilterSheet from 'src/views/pages/species-management/ipad2/SpeciesFilterSheet'
import type { GridColDef } from '@mui/x-data-grid'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'
import Icon from 'src/@core/components/icon'
import * as skin from 'src/views/pages/species-management/ipad2/skin'
import { CategoryFilter, FilterChip, GRID_CELL_PAD } from 'src/views/pages/species-management/ipad2/detail/detailUi'
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
  sites: number // unique sites across the filtered set
  enclosures: number // enclosures across the filtered set
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
  classTabs: { label: string; value: string; count: number }[]
  otherClasses: string[]
  classAllCount: number
  classOthersCount: number
  onClassSelect: (values: string[]) => void
  onFacetSelect: (key: keyof SpeciesFilters, value: string | null) => void
}

// The kit's underline-tab pattern (MedicalTab status tabs): label + count on a 2.5px
// underline, one row, overflow scrolls. Active = the dark ink; inactive = the muted
// greens the pattern uses everywhere.
const ClassTabs: React.FC<{
  tabs: { label: string; value: string; count: number }[]
  active: string
  onChange: (v: string) => void
}> = ({ tabs, active, onChange }) => {
  const theme = useTheme()
  const c = theme.palette.customColors as Record<string, string>

  return (
    <Box role='tablist' sx={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'nowrap', overflowX: 'auto' }}>
      {tabs.map(t => {
        const on = t.value === active

        return (
          <Box
            key={t.value}
            role='tab'
            aria-selected={on}
            onClick={() => onChange(t.value)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              py: 0.5,
              flexShrink: 0,
              borderBottom: '2.5px solid',
              borderColor: on ? skin.INK : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              '&:hover': { borderColor: on ? skin.INK : c.OutlineVariant }
            }}
          >
            <Typography variant='body1' sx={{ fontWeight: 600, color: on ? skin.INK : c.neutralSecondary, whiteSpace: 'nowrap' }}>
              {t.label}
            </Typography>
            <Typography variant='body1' sx={{ fontWeight: 700, color: on ? skin.INK : c.Outline, fontVariantNumeric: 'tabular-nums' }}>
              {t.count.toLocaleString()}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
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
  onAnalysisChange,
  classTabs,
  otherClasses,
  classAllCount,
  classOthersCount,
  onClassSelect,
  onFacetSelect
}) => {
  const portrait = useMediaQuery('(orientation: portrait)')

  // Legacy rail-copy drawer — kept dormant (the Filters button now opens the filter sheet).
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Diet-style filter sheet (portrait bottom sheet / landscape side sheet).
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  // ── Class tabs — the PORTRAIT table heading (stakeholder call 2026-08-27) ──
  // "Results" + its species·animals line retired there; in their place a proper CC tab
  // bar: All · Birds · Mammals · Reptiles · Others. Others is a REAL tab — it filters to
  // every class outside the featured three at once (the Class column disambiguates).
  // Landscape keeps the Results header until its own pass.
  const classTabItems = [
    { label: 'All', value: '__all__', count: classAllCount },
    ...classTabs,
    ...(otherClasses.length > 0 ? [{ label: 'Others', value: '__others__', count: classOthersCount }] : [])
  ]
  const selectedClasses = appliedFilters.Class
  const activeClassTab =
    selectedClasses.length === 0
      ? '__all__'
      : selectedClasses.length === 1 && classTabs.some(t => t.value === selectedClasses[0])
      ? selectedClasses[0]
      : selectedClasses.length > 0 && selectedClasses.every(c => otherClasses.includes(c))
      ? '__others__'
      : '__all__'
  const handleClassTab = (v: string) => onClassSelect(v === '__all__' ? [] : v === '__others__' ? otherClasses : [v])

  // The two always-on dropdowns beside the search (stakeholder call: Site + IUCN are the
  // filters that matter — no sheet trip for them). Options come from the same facet rows
  // the sheet uses; single-select, pill corners.
  const siteOptions = (filterSections.find(s => s.key === 'Site')?.options || []).map(o => o.value)
  const iucnOptions = (filterSections.find(s => s.key === 'Conservation')?.options || []).map(o => o.value)

  // ── The collection in one strip (v3, stakeholder call 2026-08-27) ──
  // Four segments at ONE type spec — Species · Animals · Sites · Enclosures — divided by
  // full-height hairlines. Sex composition retired from the strip (lives in each row's
  // Total column); where the collection LIVES is the management-level fact.
  const stats = [
    { label: 'Species', value: posture.species },
    { label: 'Animals', value: posture.animals },
    { label: 'Sites', value: posture.sites },
    { label: 'Enclosures', value: posture.enclosures }
  ]

  const statBand = (
    <Box sx={{ ...skin.cardSx, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
      {stats.map((s, i) => (
        <Box
          key={s.label}
          sx={{
            px: '24px',
            py: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '9px',
            borderLeft: i === 0 ? 'none' : `1px solid ${skin.HAIR}`
          }}
        >
          <Typography
            sx={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: skin.FAINT
            }}
          >
            {s.label}
          </Typography>
          <Typography
            sx={{
              fontSize: '24px',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.6px',
              fontVariantNumeric: 'tabular-nums',
              color: skin.VALUE
            }}
          >
            {s.value.toLocaleString()}
          </Typography>
        </Box>
      ))}
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

            {/* Table heading — portrait: class tabs over a full-width search (Results header
                retired there); landscape: Results header unchanged until its own pass. */}
            <Box sx={{ ...skin.cardSx, overflow: 'visible' }}>
              <Box sx={{ px: 5, pt: 5, pb: portrait ? 2 : 3 }}>
                {portrait ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <ClassTabs tabs={classTabItems} active={activeClassTab} onChange={handleClassTab} />
                    {/* One control row: the app's pill search stretching, Site + IUCN pickers beside it. */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Search
                          borderRadius='999px'
                          backgroundColor={skin.FIELD_BG}
                          width='100%'
                          placeholder='Search species...'
                          value={searchValue}
                          onClear={onSearchClear}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
                          textFielsSX={{
                            height: 44,
                            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                            '& .MuiInputBase-root.Mui-focused': { boxShadow: `0 0 0 2px ${skin.FOCUS_RING}` }
                          }}
                        />
                      </Box>
                      <CategoryFilter
                        radius='999px'
                        width={180}
                        options={siteOptions}
                        value={appliedFilters.Site[0] ?? null}
                        onChange={v => onFacetSelect('Site', v)}
                        placeholder='All sites'
                        icon='mdi:map-marker-outline'
                      />
                      <CategoryFilter
                        radius='999px'
                        width={180}
                        options={iucnOptions}
                        value={appliedFilters.Conservation[0] ?? null}
                        onChange={v => onFacetSelect('Conservation', v)}
                        placeholder='All IUCN'
                        icon='mdi:earth'
                      />
                    </Box>
                  </Box>
                ) : (
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
                )}
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
