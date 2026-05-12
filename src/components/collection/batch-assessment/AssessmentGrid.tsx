import React, { useMemo, useEffect, useRef } from 'react'
import { Avatar, Box, Skeleton, TablePagination, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import Icon from 'src/@core/components/icon'
import SplitPaneGrid from 'src/components/common/SplitPaneGrid'
import { getAssessmentGroup } from 'src/lib/api/assessment'
import { AssessmentFilters } from './AssessmentFilterDrawer'

// ============== Layout constants =================
// Sized to keep the animal row header readable (4 lines + sex chip) without going
// taller than necessary. Slightly smaller than PrescriptionMonitoringGrid since
// each cell carries less content than a medication time slot.

const LEFT_COL_WIDTH = 240
const TYPE_COL_WIDTH = 180
const HEADER_ROW_HEIGHT = 48
const BODY_ROW_HEIGHT = 105
const GRID_GAP = 1.5
const PAGE_LIMIT = 5
const SKELETON_PREFIX = '__sk_'

// ============== Types =================

export interface AssessmentGridProps {
  taxonomyId: string | number
  selectedTypeIds: number[]
  filters?: AssessmentFilters
  page: number
  onPageChange: (page: number) => void
  selectedCell?: { animalId: number | string; columnId: number } | null
  onCellClick?: (
    animal: AnimalRow,
    type: TypeColumn,
    lastEntry: LastEntry | null,
    context: { animals: AnimalRow[]; columns: TypeColumn[]; animalIndex: number; columnIndex: number }
  ) => void
}

// Loose shapes — backend response is being mapped defensively until we have a fixed schema.
export interface AnimalRow {
  animal_id: number | string
  common_name?: string
  scientific_name?: string
  user_enclosure_name?: string
  enclosure_name?: string
  site_name?: string
  section_name?: string
  age?: string
  gender?: string
  sex?: string
  default_icon?: string
  birth_date?: string
  total_animal?: number | string
  assessments?: AssessmentEntry[]
  assessment_data?: AssessmentEntry[]
  [key: string]: unknown
}

export interface AssessmentEntry {
  assessment_type_id?: number | string
  assessments_type_label?: string
  assessment_type_name?: string
  assessment_value?: string | number
  recorded_date_time?: string
  age?: string
  comments?: string
  last_entry?: any
  [key: string]: unknown
}

export interface TypeColumn {
  id: number
  name: string
}

export interface LastEntry {
  value: string
  recordedAt: string | null
  age: string | null
}

// ============== Helpers =================

const GENDER_LABELS: Record<string, string> = {
  male: 'M',
  female: 'F',
  undetermined: 'UD',
  indeterminate: 'ID'
}

const SEX_BG: Record<string, string> = {
  M: '#cdeae5',
  F: '#fbe0e4',
  UD: '#dde7ec',
  ID: '#e6e6e6'
}

const extractAnimals = (data: any): AnimalRow[] => {
  if (!data) return []
  // Real shape from /v1/assessment/group: { success, data: { total_count, data: [animals] } }
  const candidates = [data?.data?.data, data?.data?.result, data?.result, data?.data, data?.animals, data?.rows]
  for (const c of candidates) {
    if (Array.isArray(c)) return c as AnimalRow[]
  }

  return []
}

const extractTotal = (data: any): number => {
  return Number(data?.data?.total_count ?? data?.total_count ?? data?.total ?? 0) || 0
}

const findEntryForType = (row: AnimalRow, typeId: number): AssessmentEntry | null => {
  const raw = (row?.assessments ?? row?.assessment_data) as unknown
  const list: AssessmentEntry[] = Array.isArray(raw) ? (raw as AssessmentEntry[]) : []
  const found = list.find(
    e => String(e?.assessment_type_id) === String(typeId) || String((e as any)?.id) === String(typeId)
  )

  return found ?? null
}

// Compute "1y 2m 3d" between two ISO-ish dates. Returns null when either side is missing or
// the backend's sentinel "0000-00-00 ..." (used when birth_date is unknown).
const computeAge = (birthDate?: string | null, asOf?: string | null): string | null => {
  if (!birthDate || !asOf) return null
  if (birthDate.startsWith('0000-')) return null
  const b = dayjs(birthDate)
  const a = dayjs(asOf)
  if (!b.isValid() || !a.isValid() || a.isBefore(b)) return null
  const years = a.diff(b, 'year')
  const afterYears = b.add(years, 'year')
  const months = a.diff(afterYears, 'month')
  const afterMonths = afterYears.add(months, 'month')
  const days = a.diff(afterMonths, 'day')

  return `${years}y ${months}m ${days}d`
}

const buildLastEntry = (entry: AssessmentEntry | null): LastEntry | null => {
  if (!entry) return null
  // Backend marks empty cells with has_assessment=0 + empty value strings. Treat anything without a
  // value the same way regardless of which key shape we get.
  if (Number((entry as any).has_assessment) === 0) return null
  const last = (entry.last_entry as any) ?? entry
  // Prefer the human-readable label (e.g. "Test Gerald") over the raw rank value ("5") for scale types.
  const rawValue =
    last?.assessment_value_label ?? last?.assessment_value ?? last?.value ?? last?.label ?? last?.asssessment_label
  if (rawValue == null || rawValue === '') return null
  const recordedAt = last?.recorded_date_time ?? last?.record_date_time ?? null
  const explicitAge = last?.age ?? null
  const computed = explicitAge ?? computeAge(last?.birth_date, recordedAt)

  return {
    value: String(rawValue),
    recordedAt,
    age: computed ?? null
  }
}

const buildColumns = (selectedTypeIds: number[], animals: AnimalRow[]): TypeColumn[] => {
  const labelMap = new Map<number, string>()
  const safeAnimals = Array.isArray(animals) ? animals : []
  for (const a of safeAnimals) {
    const raw = (a?.assessments ?? a?.assessment_data) as unknown
    const list: AssessmentEntry[] = Array.isArray(raw) ? (raw as AssessmentEntry[]) : []
    for (const e of list) {
      const id = Number(e?.assessment_type_id ?? (e as any)?.id)
      if (!Number.isFinite(id)) continue
      if (!labelMap.has(id)) {
        // Backend sends `label` on each row entry; older shapes use the longer keys.
        const name =
          ((e as any)?.label as string) ??
          (e?.assessments_type_label as string) ??
          (e?.assessment_type_name as string) ??
          ''
        if (name) labelMap.set(id, name)
      }
    }
  }

  return selectedTypeIds.map(id => ({ id, name: labelMap.get(id) || `Type #${id}` }))
}

const formatDate = (iso?: string | null) => {
  if (!iso) return ''
  const d = dayjs(iso)

  return d.isValid() ? d.format('DD MMM YY') : ''
}

const formatTime = (iso?: string | null) => {
  if (!iso) return ''
  const d = dayjs(iso)

  return d.isValid() ? d.format('h:mm A') : ''
}

// ============== Component =================

const AssessmentGrid: React.FC<AssessmentGridProps> = ({
  taxonomyId,
  selectedTypeIds,
  filters,
  page,
  onPageChange,
  selectedCell,
  onCellClick
}) => {
  const { t } = useTranslation()
  const theme = useTheme() as any

  const siteIds = filters?.siteIds ?? []
  const genders = filters?.genders ?? []
  const lifeStageIds = filters?.lifeStageIds ?? []

  const groupQuery = useQuery({
    queryKey: [
      'assessment-group',
      taxonomyId,
      selectedTypeIds.join(','),
      siteIds.join(','),
      genders.join(','),
      lifeStageIds.join(','),
      page
    ],
    queryFn: () =>
      getAssessmentGroup({
        taxonomy_id: taxonomyId,
        assessment_type: selectedTypeIds,
        site_id: siteIds,
        gender: genders,
        life_stage_id: lifeStageIds,
        page,
        limit: PAGE_LIMIT
      }),
    enabled: Boolean(taxonomyId) && selectedTypeIds.length > 0
  })

  const animals = useMemo(() => extractAnimals(groupQuery.data), [groupQuery.data])
  const totalAnimals = useMemo(() => extractTotal(groupQuery.data), [groupQuery.data])
  const columns = useMemo(() => buildColumns(selectedTypeIds, animals), [selectedTypeIds, animals])

  // While the next response is in flight (parameter add, filter change, page nav), swap real rows
  // for skeleton placeholders so the layout shape stays stable instead of flashing to a spinner.
  const isFetching = groupQuery.isFetching
  const skeletonAnimals = useMemo<AnimalRow[]>(
    () => Array.from({ length: PAGE_LIMIT }, (_, i) => ({ animal_id: `${SKELETON_PREFIX}${i}` } as AnimalRow)),
    []
  )
  const displayAnimals = isFetching ? skeletonAnimals : animals
  const isSkeletonRow = (a: AnimalRow) => String(a.animal_id).startsWith(SKELETON_PREFIX)

  const rangeStart = animals.length === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1
  const rangeEnd = (page - 1) * PAGE_LIMIT + animals.length

  // Scroll the right pane so the selected column is visible when left/right stepper fires.
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!selectedCell || !scrollRef.current) return
    const colIndex = columns.findIndex(c => c.id === selectedCell.columnId)
    if (colIndex < 0) return
    const containerWidth = scrollRef.current.clientWidth
    const scrollLeft = colIndex * (TYPE_COL_WIDTH + 12) // 12 ≈ gap(1.5) * 8px
    const centred = scrollLeft - containerWidth / 2 + TYPE_COL_WIDTH / 2
    scrollRef.current.scrollTo({ left: Math.max(0, centred), behavior: 'smooth' })
  }, [selectedCell?.columnId, columns])

  // ============== Renderers =================

  // Corner header — sits in the top-left, on the same strip as the column headers.
  // Shares the lightBg/8px-radius treatment so the whole header row reads as one continuous bar.
  const renderCornerHeader = () => (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        px: 4,
        backgroundColor: theme.palette.customColors.lightBg,
        borderRadius: '8px'
      }}
    >
      <Typography sx={{ fontSize: '14px', fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>
        {t('species_module.corner_animal_range')} {rangeStart}-{rangeEnd} / {totalAnimals}
      </Typography>
    </Box>
  )

  const renderRowHeader = (animal: AnimalRow) => {
    if (isSkeletonRow(animal)) {
      return (
        <Box
          sx={{
            height: '100%',
            p: 3,
            display: 'flex',
            gap: 2,
            alignItems: 'flex-start',
            borderRadius: '8px',
            backgroundColor: theme.palette.background.paper
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Skeleton variant='circular' width={40} height={40} />
            <Skeleton variant='rounded' width={28} height={20} />
          </Box>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Skeleton variant='text' width='65%' height={20} />
            <Skeleton variant='text' width='55%' height={16} />
            <Skeleton variant='text' width='45%' height={16} />
            <Skeleton variant='text' width='60%' height={16} />
          </Box>
        </Box>
      )
    }

    const sex =
      GENDER_LABELS[String(animal.gender || animal.sex || '').toLowerCase()] ||
      String(animal.gender || animal.sex || '')
        .toUpperCase()
        .slice(0, 2) ||
      '-'

    // The /assessment/group response doesn't ship a precomputed age — derive from birth_date.
    const computedAge =
      (animal.age as string | undefined) || computeAge(animal.birth_date as string | undefined, dayjs().toISOString())

    return (
      <Box
        sx={{
          height: '100%',
          p: 2,
          display: 'flex',
          gap: 1.5,
          alignItems: 'flex-start',
          borderRadius: '8px',
          backgroundColor: theme.palette.background.paper
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
          <Avatar
            src={(animal.default_icon as string) || undefined}
            sx={{ width: 32, height: 32, bgcolor: theme.palette.customColors.Surface }}
          >
            <Icon icon='mdi:paw-outline' fontSize={16} />
          </Avatar>
          <Box
            sx={{
              width: 24,
              height: 20,
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: SEX_BG[sex] || theme.palette.customColors.Surface,
              fontSize: '0.7rem',
              fontWeight: 700,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            {sex}
          </Box>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant='subtitle2' sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>
            AID: {animal.animal_id}
          </Typography>
          {Number(animal.total_animal) > 1 && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                mt: 0.5,
                px: 1,
                py: 0.25,
                borderRadius: '4px',
                backgroundColor: theme.palette.customColors.Surface,
                fontSize: '0.75rem',
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              {t('species_module.count_badge')} <strong>{animal.total_animal}</strong>
            </Box>
          )}
          <Typography
            variant='caption'
            sx={{ display: 'block', color: theme.palette.customColors.neutralSecondary, mt: 0.5 }}
          >
            {t('species_module.encl_label')} : {animal.user_enclosure_name || animal.enclosure_name || '-'}
          </Typography>
          <Typography variant='caption' sx={{ display: 'block', color: theme.palette.customColors.neutralSecondary }}>
            {t('species_module.site_label')} : {animal.site_name || '-'}
          </Typography>
          {computedAge ? (
            <Typography variant='caption' sx={{ display: 'block', color: theme.palette.customColors.neutralSecondary }}>
              {t('species_module.age_label')} : {computedAge}
            </Typography>
          ) : null}
        </Box>
      </Box>
    )
  }

  // Column header — mirrors PrescriptionMonitoringGrid's TimeHeader: lightBg pill, 16px / weight 500.
  // While the response is in flight, names fall back to "Type #N", so render a skeleton bar instead.
  const renderColumnHeader = (col: TypeColumn) => (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        backgroundColor: theme.palette.customColors.lightBg,
        borderRadius: '8px'
      }}
    >
      {isFetching ? (
        <Skeleton variant='text' width='55%' height={20} />
      ) : (
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 500,
            color: theme.palette.customColors.OnSurfaceVariant,
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {col.name}
        </Typography>
      )}
    </Box>
  )

  // Cell — white box, 8px radius (same shape as TimeSlot in prescription monitoring).
  // Empty cells get a dashed border to match the "+ Add Entry" affordance from the mobile spec.
  const renderCell = (animal: AnimalRow, col: TypeColumn, rIdx: number, cIdx: number) => {
    if (isSkeletonRow(animal)) {
      return (
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
            p: 2,
            borderRadius: '8px',
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.customColors.SurfaceVariant}`
          }}
        >
          <Skeleton variant='text' width='60%' height={20} />
          <Skeleton variant='text' width='50%' height={14} />
          <Skeleton variant='text' width='45%' height={14} />
        </Box>
      )
    }

    const entry = findEntryForType(animal, col.id)
    const last = buildLastEntry(entry)
    const isEmpty = !last
    const isSelected =
      selectedCell &&
      String(selectedCell.animalId) === String(animal.animal_id) &&
      selectedCell.columnId === col.id

    return (
      <Box
        onClick={() =>
          onCellClick?.(animal, col, last, {
            animals,
            columns,
            animalIndex: rIdx,
            columnIndex: cIdx
          })
        }
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.25,
          p: 1.5,
          cursor: 'pointer',
          borderRadius: '8px',
          backgroundColor: isSelected
            ? theme.palette.primary.main
            : theme.palette.background.paper,
          ...(isSelected
            ? { border: `2px solid ${theme.palette.primary.dark}` }
            : isEmpty
            ? { border: `1.5px dashed ${theme.palette.customColors.OutlineVariant}` }
            : { border: `1px solid ${theme.palette.customColors.SurfaceVariant}` }),
          transition: 'all 0.15s',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: isSelected
              ? theme.palette.primary.main
              : theme.palette.customColors.Surface
          }
        }}
      >
        {isEmpty ? (
          <>
            <Icon
              icon='mdi:plus'
              fontSize={28}
              color={isSelected ? theme.palette.common.white : theme.palette.customColors.neutralSecondary}
            />
            <Typography
              variant='body2'
              sx={{
                color: isSelected ? theme.palette.common.white : theme.palette.customColors.neutralSecondary,
                fontWeight: 500
              }}
            >
              {t('species_module.add_entry_cell')}
            </Typography>
          </>
        ) : (
          <>
            <Typography
              variant='subtitle1'
              sx={{
                fontWeight: 600,
                color: isSelected ? theme.palette.common.white : theme.palette.primary.dark,
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%'
              }}
            >
              {last.value}
            </Typography>
            {last.recordedAt && (
              <>
                <Typography
                  variant='caption'
                  sx={{ color: isSelected ? 'rgba(255,255,255,0.8)' : theme.palette.customColors.neutralSecondary }}
                >
                  {formatDate(last.recordedAt)}
                </Typography>
                <Typography
                  variant='caption'
                  sx={{ color: isSelected ? 'rgba(255,255,255,0.8)' : theme.palette.customColors.neutralSecondary }}
                >
                  {formatTime(last.recordedAt)}
                </Typography>
              </>
            )}
            {last.age && (
              <Typography
                variant='caption'
                sx={{ color: isSelected ? 'rgba(255,255,255,0.8)' : theme.palette.customColors.neutralSecondary }}
              >
                {last.age}
              </Typography>
            )}
          </>
        )}
      </Box>
    )
  }

  // ============== Render =================

  return (
    <Box>
      <SplitPaneGrid<AnimalRow, TypeColumn>
        rows={displayAnimals}
        columns={columns}
        emptyText={t('species_module.no_animals')}
        getRowKey={a => String(a.animal_id)}
        getColumnKey={c => c.id}
        leftColumnWidth={LEFT_COL_WIDTH}
        columnWidth={TYPE_COL_WIDTH}
        headerHeight={HEADER_ROW_HEIGHT}
        rowHeight={BODY_ROW_HEIGHT}
        gap={GRID_GAP}
        scrollRef={scrollRef}
        renderCornerHeader={renderCornerHeader}
        renderRowHeader={renderRowHeader}
        renderColumnHeader={renderColumnHeader}
        renderCell={renderCell}
      />

      {/* Pagination — same MUI TablePagination treatment used in CommonTable / sticky-table across the app.
          Note: TablePagination is 0-indexed; our URL state stays 1-indexed, hence the ±1 conversion. */}
      <TablePagination
        component='div'
        count={totalAnimals}
        page={Math.max(0, page - 1)}
        rowsPerPage={PAGE_LIMIT}
        rowsPerPageOptions={[PAGE_LIMIT]}
        onPageChange={(_, newPage) => onPageChange(newPage + 1)}
        onRowsPerPageChange={() => {
          /* fixed page size — backend always returns 5 */
        }}
        sx={{ mt: 2, borderTop: `1px solid ${theme.palette.divider}` }}
      />
    </Box>
  )
}

export default AssessmentGrid
