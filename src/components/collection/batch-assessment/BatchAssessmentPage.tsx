'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Box, Button, IconButton, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import Icon from 'src/@core/components/icon'
import BackTitleBar from 'src/components/common/BackTitleBar'
import { getMeasurementUnits } from 'src/lib/api/assessment'
import AssessmentTypePickerDrawer from './AssessmentTypePickerDrawer'
import AssessmentFilterDrawer, { AssessmentFilters } from './AssessmentFilterDrawer'
import AssessmentGrid, { AnimalRow, TypeColumn } from './AssessmentGrid'
import AssessmentEntryDrawer from './AssessmentEntryDrawer'

// URL state — `types` is a CSV of selected assessment_type_ids; `page` is animal pagination (1-indexed).
// Filter params: `sites`, `gender`, `life_stages` are CSVs.
const parseNumberCsv = (raw: string | null | undefined): number[] => {
  if (!raw) return []

  return raw
    .split(',')
    .map(s => Number(s.trim()))
    .filter(n => Number.isFinite(n) && n > 0)
}

const parseStringCsv = (raw: string | null | undefined): string[] => {
  if (!raw) return []

  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

const parsePage = (raw: string | null | undefined): number => {
  const n = Number(raw)

  return Number.isFinite(n) && n > 0 ? n : 1
}

const BatchAssessmentPage: React.FC = () => {
  const { t } = useTranslation()
  const theme = useTheme() as any
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const params = useParams() as { id?: string }
  const speciesId = params.id || ''

  const selectedTypeIds = parseNumberCsv(searchParams?.get('types'))
  const page = parsePage(searchParams?.get('page'))
  const filters: AssessmentFilters = {
    siteIds: parseNumberCsv(searchParams?.get('sites')),
    genders: parseStringCsv(searchParams?.get('gender')),
    lifeStageIds: parseNumberCsv(searchParams?.get('life_stages'))
  }
  const filterCount = filters.siteIds.length + filters.genders.length + filters.lifeStageIds.length

  const [pickerOpen, setPickerOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)

  // Entry drawer state — populated when the user clicks a cell in the grid.
  const [entryDrawer, setEntryDrawer] = useState<{
    animals: AnimalRow[]
    columns: TypeColumn[]
    animalIndex: number
    columnIndex: number
  } | null>(null)

  // Prefetch measurement units once the user has committed to types — the entry drawer (Step 3)
  // renders unit dropdowns for numeric_value assessments, and the mobile flow makes the same
  // call here so the form opens instantly. React Query caches the result module-wide.
  useQuery({
    queryKey: ['measurement-units'],
    queryFn: () => getMeasurementUnits(),
    enabled: selectedTypeIds.length > 0,
    staleTime: 5 * 60 * 1000
  })

  // Auto-open the picker exactly once per visit when no types are present in the URL.
  // Without the ref, fast re-renders before the URL flushes could re-trigger the drawer.
  const autoOpenedRef = useRef(false)
  useEffect(() => {
    if (autoOpenedRef.current) return
    autoOpenedRef.current = true
    if (selectedTypeIds.length === 0) setPickerOpen(true)
  }, [selectedTypeIds.length])

  const updateQuery = (mutate: (sp: URLSearchParams) => void) => {
    const sp = new URLSearchParams(searchParams?.toString() || '')
    mutate(sp)
    // URLSearchParams percent-encodes `,` to `%2C`; commas are valid inside query values per RFC 3986
    // and our parsers decode them either way, so swap them back for readable URLs.
    const qs = sp.toString().replace(/%2C/g, ',')
    router.replace(qs ? `${pathname}?${qs}` : pathname || '#', { scroll: false })
  }

  const handleConfirmTypes = (ids: number[]) => {
    updateQuery(sp => {
      if (ids.length === 0) sp.delete('types')
      else sp.set('types', ids.join(','))
      sp.set('page', '1')
    })
  }

  const handlePageChange = (next: number) => {
    updateQuery(sp => sp.set('page', String(next)))
  }

  const handleApplyFilters = (next: AssessmentFilters) => {
    updateQuery(sp => {
      // Replace each filter param: set when non-empty, delete when empty.
      if (next.siteIds.length) sp.set('sites', next.siteIds.join(','))
      else sp.delete('sites')
      if (next.genders.length) sp.set('gender', next.genders.join(','))
      else sp.delete('gender')
      if (next.lifeStageIds.length) sp.set('life_stages', next.lifeStageIds.join(','))
      else sp.delete('life_stages')
      // Filter change resets pagination — current page may not exist in the new result set.
      sp.set('page', '1')
    })
  }

  return (
    <Box>
      <BackTitleBar
        title={t('species_module.species_assessment_header')}
        onBack={() => router.back()}
        actions={
          selectedTypeIds.length > 0 ? (
            <>
              <IconButton
                onClick={() => setFilterOpen(true)}
                aria-label='Filters'
                sx={{
                  position: 'relative',
                  color: theme.palette.customColors.OnSurfaceVariant,
                  border: `1px solid ${theme.palette.customColors.SurfaceVariant}`,
                  borderRadius: '8px'
                }}
              >
                <Icon icon='mdi:tune-variant' />
                {filterCount > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      minWidth: 18,
                      height: 18,
                      px: 0.5,
                      borderRadius: '9px',
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.common.white,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {filterCount}
                  </Box>
                )}
              </IconButton>
              <Button
                variant='outlined'
                startIcon={<Icon icon='mdi:plus-circle-outline' />}
                onClick={() => setPickerOpen(true)}
                sx={{ borderRadius: '8px' }}
              >
                {t('species_module.parameter_btn')}
              </Button>
            </>
          ) : null
        }
      />

      {selectedTypeIds.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 12,
            px: 4,
            border: `1.5px dashed ${theme.palette.customColors.OutlineVariant}`,
            borderRadius: '10px',
            color: theme.palette.text.secondary,
            backgroundColor: theme.palette.background.paper
          }}
        >
          <Typography variant='subtitle1' sx={{ mb: 3, color: theme.palette.customColors.OnSurfaceVariant }}>
            {t('species_module.pick_assessment_types')}
          </Typography>
          <Button variant='contained' onClick={() => setPickerOpen(true)}>
            {t('species_module.pick_types_btn')}
          </Button>
        </Box>
      ) : (
        <AssessmentGrid
          taxonomyId={speciesId}
          selectedTypeIds={selectedTypeIds}
          filters={filters}
          page={page}
          onPageChange={handlePageChange}
          selectedCell={
            entryDrawer
              ? { animalId: entryDrawer.animals[entryDrawer.animalIndex]?.animal_id, columnId: entryDrawer.columns[entryDrawer.columnIndex]?.id }
              : null
          }
          onCellClick={(_animal, _col, _last, ctx) => {
            setEntryDrawer({
              animals: ctx.animals,
              columns: ctx.columns,
              animalIndex: ctx.animalIndex,
              columnIndex: ctx.columnIndex
            })
          }}
        />
      )}

      <AssessmentTypePickerDrawer
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        initialSelectedIds={selectedTypeIds}
        onConfirm={handleConfirmTypes}
      />

      <AssessmentFilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        initialFilters={filters}
        onApply={handleApplyFilters}
      />

      <AssessmentEntryDrawer
        open={Boolean(entryDrawer)}
        onClose={() => setEntryDrawer(null)}
        animals={entryDrawer?.animals ?? []}
        columns={entryDrawer?.columns ?? []}
        startAnimalIndex={entryDrawer?.animalIndex ?? 0}
        startColumnIndex={entryDrawer?.columnIndex ?? 0}
        onSaved={() => setEntryDrawer(null)}
        onNavigate={(animalIndex, columnIndex) =>
          setEntryDrawer(prev => prev ? { ...prev, animalIndex, columnIndex } : prev)
        }
      />
    </Box>
  )
}

export default BatchAssessmentPage
