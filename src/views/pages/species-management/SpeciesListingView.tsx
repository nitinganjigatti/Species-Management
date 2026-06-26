'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Box, Button, Card, Checkbox, Chip, Collapse, Menu, MenuItem, TextField, Typography } from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'
import { alpha, useTheme } from '@mui/material/styles'
import type { GridColDef } from '@mui/x-data-grid'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import Icon from 'src/@core/components/icon'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'
import SpeciesListMajorFilters, {
  type MajorFilterOption,
  type MajorFilterRow
} from 'src/views/pages/species-management/SpeciesListMajorFilters'
import SpeciesListAnalysisFilter from 'src/views/pages/species-management/SpeciesListAnalysisFilter'
import { compactNumber, type AnalysisFilter, type SpeciesFilters } from 'src/views/pages/species-management/speciesListing.utils'

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
  majorFilters: MajorFilterRow[]
  appliedFilters: SpeciesFilters
  onToggleFacet: (key: keyof SpeciesFilters, value: string) => void
  onClearFacet: (key: keyof SpeciesFilters) => void
  sexOptions: MajorFilterOption[]
  sexSelected: string[]
  siteOptions: MajorFilterOption[]
  siteSelected: string[]
  readinessOptions: MajorFilterOption[]
  readinessSelected: string[]
  analysis: AnalysisFilter
  analysisYears: number[]
  onAnalysisChange: (next: AnalysisFilter) => void
}

// Multi-select facet dropdown that sits beside the search bar (Gender / Site / Readiness).
// Self-contained anchor state so multiple instances open independently.
const FacetDropdown: React.FC<{
  label: string
  facetKey: keyof SpeciesFilters
  options: MajorFilterOption[]
  selected: string[]
  onToggle: (key: keyof SpeciesFilters, value: string) => void
  onClear: (key: keyof SpeciesFilters) => void
  /** Show a search field inside the menu (for high-cardinality facets like Site). */
  searchable?: boolean
  /** Maps an option label to a short code (e.g. Male→M). When set, the button shows the
   *  selected codes ("Gender-M & F") and selecting ALL options resets to default (no filter). */
  abbreviate?: (label: string) => string
}> = ({ label, facetKey, options, selected, onToggle, onClear, searchable, abbreviate }) => {
  const theme = useTheme()
  const cc = theme.palette.customColors as Record<string, string>
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)
  const [q, setQ] = useState('')

  const filtered =
    searchable && q.trim() ? options.filter(o => o.label.toLowerCase().includes(q.trim().toLowerCase())) : options

  const handleToggle = (value: string) => {
    const next = selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]
    // For few-option facets (abbreviate set): selecting every option == no filter (default).
    if (abbreviate && next.length >= options.length) return onClear(facetKey)
    onToggle(facetKey, value)
  }

  const labelText = !selected.length
    ? label
    : abbreviate
    ? `${label}-${options.filter(o => selected.includes(o.value)).map(o => abbreviate(o.label)).join(' & ')}`
    : `${label} · ${selected.length}`

  return (
    <>
      <Button
        variant='outlined'
        onClick={e => setAnchor(e.currentTarget)}
        endIcon={<Icon icon='mdi:chevron-down' />}
        sx={{
          textTransform: 'none',
          fontWeight: 500,
          color: cc.OnSurfaceVariant,
          borderColor: selected.length ? cc.OnSurfaceVariant : cc.OutlineVariant,
          '&:hover': { borderColor: cc.Outline, bgcolor: alpha(theme.palette.common.black, 0.04) }
        }}
      >
        {labelText}
      </Button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => {
          setAnchor(null)
          setQ('')
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        disableAutoFocusItem={searchable}
        slotProps={{ paper: { sx: { mt: 1, minWidth: 240, maxHeight: 380, borderRadius: '10px' } } }}
      >
        {searchable && (
          <Box
            onKeyDown={e => e.stopPropagation()}
            sx={{ position: 'sticky', top: 0, zIndex: 1, bgcolor: theme.palette.background.paper, px: 1.5, pt: 1, pb: 1 }}
          >
            <TextField
              size='small'
              fullWidth
              autoFocus
              placeholder={`Search ${label.toLowerCase()}…`}
              value={q}
              onChange={e => setQ(e.target.value)}
              InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: cc.neutralSecondary }} /> }}
            />
          </Box>
        )}
        {filtered.map(opt => {
          const checked = selected.includes(opt.value)

          return (
            <MenuItem key={opt.value} onClick={() => handleToggle(opt.value)} sx={{ gap: 1 }}>
              <Checkbox checked={checked} size='small' sx={{ p: 0.5 }} />
              <Typography variant='body2' sx={{ flex: 1, color: cc.OnSurfaceVariant }} noWrap>
                {opt.label}
              </Typography>
              <Typography variant='caption' sx={{ color: cc.neutralSecondary, whiteSpace: 'nowrap' }}>
                S-{compactNumber(opt.count)} • A-{compactNumber(opt.animals)}
              </Typography>
            </MenuItem>
          )
        })}
        {searchable && filtered.length === 0 && (
          <MenuItem disabled sx={{ justifyContent: 'center' }}>
            <Typography variant='caption' sx={{ color: cc.neutralSecondary }}>
              No matches
            </Typography>
          </MenuItem>
        )}
        {selected.length > 0 && (
          <MenuItem
            onClick={() => {
              onClear(facetKey)
              setAnchor(null)
              setQ('')
            }}
            sx={{ justifyContent: 'center', mt: 0.5 }}
          >
            <Typography variant='caption' sx={{ color: cc.Tertiary, fontWeight: 600 }}>
              Clear {label.toLowerCase()}
            </Typography>
          </MenuItem>
        )}
      </Menu>
    </>
  )
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
  posture,
  majorFilters,
  appliedFilters,
  onToggleFacet,
  onClearFacet,
  sexOptions,
  sexSelected,
  siteOptions,
  siteSelected,
  readinessOptions,
  readinessSelected,
  analysis,
  analysisYears,
  onAnalysisChange
}) => {
  const theme = useTheme()
  const cc = theme.palette.customColors as Record<string, string>
  const filtered = posture.species !== posture.totalSpecies
  const [filtersOpen, setFiltersOpen] = useState(true)

  // The Filters card is sticky at top:0; the Results row pins right beneath it, so its sticky
  // offset must track the Filters card's (collapsible) live height.
  const filtersRef = useRef<HTMLDivElement>(null)
  const [filtersH, setFiltersH] = useState(0)
  useEffect(() => {
    const el = filtersRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const update = () => setFiltersH(el.offsetHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)

    return () => ro.disconnect()
  }, [])

  const divider = <Box sx={{ width: '1px', height: 38, bgcolor: cc.OutlineVariant }} />

  const statTile = (
    value: number,
    label: string,
    opts: { hero?: boolean; accent?: string; sub?: string; dot?: string } = {}
  ) => (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant={opts.hero ? 'h4' : 'h5'}
        sx={{ fontWeight: 700, lineHeight: 1.05, color: opts.accent ?? (opts.hero ? theme.palette.primary.dark : cc.OnSurfaceVariant) }}
      >
        {value.toLocaleString()}
        {opts.sub && (
          <Typography component='span' variant='body2' sx={{ color: cc.neutralSecondary, fontWeight: 500, ml: 0.75 }}>
            {opts.sub}
          </Typography>
        )}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1.75 }}>
        {opts.dot && <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: opts.dot, flexShrink: 0 }} />}
        <Typography
          variant='caption'
          sx={{ color: cc.neutralSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          {label}
        </Typography>
      </Box>
    </Box>
  )

  const chipStrip = (
    <>
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
    </>
  )

  return (
    <Box>
      <DynamicBreadcrumbs sx={{ mb: 5 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {/* ── CARD 1: Overview — title + download + live posture ── */}
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

          {/* Stats band — live posture for the current (filtered) working set */}
          <Box sx={{ px: 5, pb: 5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 3, md: 9 },
                flexWrap: 'wrap',
                bgcolor: cc.Surface,
                border: `1px solid ${cc.SurfaceVariant}`,
                borderRadius: '12px',
                px: { xs: 3, md: 5 },
                py: 3
              }}
            >
              {statTile(posture.species, 'Species', {
                hero: true,
                sub: filtered ? `of ${posture.totalSpecies.toLocaleString()}` : undefined
              })}
              {divider}
              {statTile(posture.animals, 'Animals')}
              {divider}
              {statTile(posture.singleSex, 'Single-sex', { accent: cc.Tertiary, dot: cc.Tertiary })}
              {statTile(posture.criticallyFew, 'Critically few · 1–3', {
                accent: theme.palette.error.main,
                dot: theme.palette.error.main
              })}
            </Box>
          </Box>
        </Card>

        {/* ── CARD 2: Filters — sticky controls (collapsible; pins while the table scrolls) ── */}
        <Card ref={filtersRef} sx={{ position: 'sticky', top: 0, zIndex: 10 }}>
          <Box
            sx={{
              px: 5,
              py: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              flexWrap: 'wrap',
              borderBottom: filtersOpen ? `1px solid ${cc.SurfaceVariant}` : 'none'
            }}
          >
            <Box
              onClick={() => setFiltersOpen(o => !o)}
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', userSelect: 'none', py: 0.5 }}
            >
              <Icon icon='mdi:filter-variant' fontSize='1.35rem' color={cc.OnSurfaceVariant} />
              <Typography variant='subtitle1' sx={{ fontWeight: 600, color: cc.OnSurfaceVariant }}>
                Filters
              </Typography>
              {chips.length > 0 && (
                <Typography variant='body2' sx={{ color: cc.neutralSecondary }}>
                  · {chips.length} active
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <FacetDropdown label='Gender' facetKey='Sex' options={sexOptions} selected={sexSelected} onToggle={onToggleFacet} onClear={onClearFacet} abbreviate={l => l.charAt(0)} />
              <FacetDropdown label='Site' facetKey='Site' options={siteOptions} selected={siteSelected} onToggle={onToggleFacet} onClear={onClearFacet} searchable />
              <FacetDropdown label='Readiness' facetKey='Readiness' options={readinessOptions} selected={readinessSelected} onToggle={onToggleFacet} onClear={onClearFacet} abbreviate={l => l.split(' ').map(w => w.charAt(0)).join('')} />
              <FilterButtonWithNotification label='Other Filters' onClick={onFilterOpen} appliedFiltersCount={filterCount || undefined} />
              <Box
                onClick={() => setFiltersOpen(o => !o)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  color: cc.neutralSecondary,
                  transform: filtersOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease'
                }}
              >
                <Icon icon='mdi:chevron-down' fontSize='1.5rem' />
              </Box>
            </Box>
          </Box>
          <Collapse in={filtersOpen}>
            <Box sx={{ px: 5, pt: 4, pb: 5 }}>
              <Box sx={{ pb: 3.5, mb: 3.5, borderBottom: `1px solid ${cc.SurfaceVariant}` }}>
                <SpeciesListAnalysisFilter value={analysis} years={analysisYears} onChange={onAnalysisChange} />
              </Box>
              <SpeciesListMajorFilters
                rows={majorFilters}
                selected={appliedFilters}
                onToggle={onToggleFacet}
                onClearFacet={onClearFacet}
              />
            </Box>
          </Collapse>
        </Card>

        {/* ── CARD 3: Results header + table (one connected card; header pins below Filters) ── */}
        <Card sx={{ overflow: 'visible' }}>
        <Box
          sx={{
            px: 5,
            pt: 5,
            pb: 3,
            position: 'sticky',
            top: `${filtersH}px`,
            zIndex: 9,
            bgcolor: theme.palette.background.paper,
            borderRadius: '10px 10px 0 0'
          }}
        >
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
          {chips.length > 0 && (
            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>{chipStrip}</Box>
          )}
        </Box>

        {/* Table */}
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
        </Card>
      </Box>
    </Box>
  )
}

export default SpeciesListingView
