import React, { useMemo, useEffect, useRef } from 'react'
import { Box, TablePagination } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import SplitPaneGrid from 'src/components/common/SplitPaneGrid'
import { getAssessmentGroup } from 'src/lib/api/assessment'
import { AssessmentFilters } from './AssessmentFilterDrawer'
import AssessmentCell from './AssessmentCell'
import AssessmentHeader from './AssessmentHeader'

// ============== Layout constants =================
// Sized to keep the animal row header readable (4 lines + sex chip) without going
// taller than necessary. Slightly smaller than PrescriptionMonitoringGrid since
// each cell carries less content than a medication time slot.

const LEFT_COL_WIDTH = 240
const TYPE_COL_WIDTH = 180
const HEADER_ROW_HEIGHT = 48
const BODY_ROW_HEIGHT = 110
const GRID_GAP = 1.5
const PAGE_LIMIT = 50
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

  // Offset for the sticky header row, used to clear the layout AppBar + any sticky page title
  // bar rendered above this grid by the parent page.
  stickyTopOffset?: number
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
  onCellClick,
  stickyTopOffset
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

  // Corner, row, and column header visuals all live in <AssessmentHeader />. This function only
  // composes the corner's range-counter text from the page state; AssessmentHeader handles the
  // pill treatment and skeleton.
  const renderCornerHeader = () => (
    <AssessmentHeader
      kind='corner'
      isLoading={isFetching}
      text={`${t('species_module.corner_animal_range')} ${rangeStart}-${rangeEnd} / ${totalAnimals}`}
    />
  )

  // Row + column header visuals — renderRowHeader hands the animal data through,
  // renderColumnHeader hands the parameter name through. Skeleton state is just a boolean.
  const renderRowHeader = (animal: AnimalRow) => (
    <AssessmentHeader kind='row' isLoading={isSkeletonRow(animal)} animal={animal} />
  )

  const renderColumnHeader = (col: TypeColumn) => (
    <AssessmentHeader kind='column' isLoading={isFetching} name={col.name} />
  )

  // Cell — visuals live in <AssessmentCell />; this function only computes the props from the
  // (animal, type) pair. Keeping data → state mapping here and visuals there makes both easier
  // to reason about independently.
  const renderCell = (animal: AnimalRow, col: TypeColumn, rIdx: number, cIdx: number) => {
    if (isSkeletonRow(animal)) return <AssessmentCell state='skeleton' />

    const entry = findEntryForType(animal, col.id)
    const last = buildLastEntry(entry)
    const isSelected = Boolean(
      selectedCell && String(selectedCell.animalId) === String(animal.animal_id) && selectedCell.columnId === col.id
    )

    return (
      <AssessmentCell
        state={last ? 'filled' : 'empty'}
        value={last?.value}
        recordedDate={last?.recordedAt ? formatDate(last.recordedAt) : undefined}
        recordedTime={last?.recordedAt ? formatTime(last.recordedAt) : undefined}
        age={last?.age || undefined}
        isSelected={isSelected}
        emptyLabel={t('species_module.add_entry_cell')}
        onClick={() => onCellClick?.(animal, col, last, { animals, columns, animalIndex: rIdx, columnIndex: cIdx })}
      />
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
        fixedHeader
        stickyTopOffset={stickyTopOffset}
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
