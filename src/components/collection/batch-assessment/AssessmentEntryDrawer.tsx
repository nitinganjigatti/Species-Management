import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { LoadingButton } from '@mui/lab'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import dayjs, { Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'
import { useAuth } from 'src/hooks/useAuth'
import { addAssessmentEntry, getMeasurementUnits, updateAssessmentEntry } from 'src/lib/api/assessment'
import type { AnimalRow, AssessmentEntry, TypeColumn } from './AssessmentGrid'

// ============== Helpers =================

// Pull the per-cell entry block from an animal row regardless of which key shape the API used.
const findEntryForType = (row: AnimalRow, typeId: number): AssessmentEntry | null => {
  const raw = (row?.assessments ?? row?.assessment_data) as unknown
  const list: AssessmentEntry[] = Array.isArray(raw) ? (raw as AssessmentEntry[]) : []

  return (
    list.find(
      e => String(e?.assessment_type_id) === String(typeId) || String((e as any)?.id) === String(typeId)
    ) ?? null
  )
}

// Format dayjs values for the API: "YYYY-MM-DD HH:mm:ss" (local time).
const formatLocal = (d: Dayjs) => d.format('YYYY-MM-DD HH:mm:ss')
const formatUtc = (d: Dayjs) => d.utc().format('YYYY-MM-DD HH:mm:ss')

// ============== Types =================

export interface AssessmentEntryDrawerProps {
  open: boolean
  onClose: () => void
  // Page context — used by the steppers.
  animals: AnimalRow[]
  columns: TypeColumn[]
  // Initial focus.
  startAnimalIndex: number
  startColumnIndex: number
  // Refetch trigger (parent owns the query key).
  onSaved?: () => void
  // Notifies parent when stepper navigation changes the active cell.
  onNavigate?: (animalIndex: number, columnIndex: number) => void
}

interface UnitOption {
  id: string
  name: string
  abbr: string
  measurement_type: string
}

// ============== Component =================

const AssessmentEntryDrawer: React.FC<AssessmentEntryDrawerProps> = ({
  open,
  onClose,
  animals,
  columns,
  startAnimalIndex,
  startColumnIndex,
  onSaved,
  onNavigate
}) => {
  const theme = useTheme() as any
  const auth = useAuth() as any
  const queryClient = useQueryClient()

  // Active focus inside the drawer — independent from the parent's selection so the steppers can
  // walk the matrix without changing the URL or grid state.
  const [animalIdx, setAnimalIdx] = useState(startAnimalIndex)
  const [colIdx, setColIdx] = useState(startColumnIndex)

  // Form state — single source of truth for all four input fields.
  const [date, setDate] = useState<Dayjs | null>(dayjs())
  const [time, setTime] = useState<Dayjs | null>(dayjs())
  const [value, setValue] = useState('')
  const [unitId, setUnitId] = useState('')
  const [comments, setComments] = useState('')

  // Reset focus when the drawer opens with a fresh starting cell.
  useEffect(() => {
    if (!open) return
    setAnimalIdx(startAnimalIndex)
    setColIdx(startColumnIndex)
  }, [open, startAnimalIndex, startColumnIndex])

  const animal = animals[animalIdx]
  const column = columns[colIdx]

  // The matching entry block on the active animal — gives us response_type + measurement_type
  // for the type even when has_assessment=0 (placeholder rows).
  const entry = animal && column ? findEntryForType(animal, column.id) : null

  const responseType = (entry?.response_type as string) || 'numeric_value'
  const measurementType = (entry?.measurement_type as string) || ''

  // Options for numeric_scale / list types. The /assessment/group response ships these inline on
  // each entry as `defaultValues` (camelCase) — same shape the hospital module gets from its
  // dedicated get-assessment-details call, so no extra request is needed here.
  const dropdownOptions = useMemo(() => {
    const raw = (entry as any)?.defaultValues ?? (entry as any)?.default_values
    if (!Array.isArray(raw)) return [] as { id: string; label: string }[]

    return raw
      .map((o: any) => ({ id: String(o?.id ?? o?.value ?? ''), label: String(o?.label ?? o?.name ?? '') }))
      .filter(o => o.id && o.label)
  }, [entry])

  // Seed form fields from the existing entry (edit) or defaults (add) every time focus changes.
  useEffect(() => {
    if (!open || !entry) {
      setDate(dayjs())
      setTime(dayjs())
      setValue('')
      setUnitId('')
      setComments('')

      return
    }
    if (Number((entry as any).has_assessment) === 1) {
      const recorded = (entry.recorded_date_time as string) || ''
      const d = recorded ? dayjs(recorded) : dayjs()
      setDate(d.isValid() ? d : dayjs())
      setTime(d.isValid() ? d : dayjs())
      setValue(String((entry as any).assessment_value ?? ''))
      setUnitId(String((entry as any).assessment_unit_id ?? '') || '')
      setComments(String((entry as any).comments ?? ''))
    } else {
      setDate(dayjs())
      setTime(dayjs())
      setValue('')
      setUnitId('')
      setComments('')
    }
  }, [open, animalIdx, colIdx])

  // Measurement units — same query key the page already prefetched, so this is a cache hit on open.
  const unitsQuery = useQuery({
    queryKey: ['measurement-units'],
    queryFn: () => getMeasurementUnits(),
    enabled: open,
    staleTime: 5 * 60 * 1000
  })

  const allUnits: UnitOption[] = useMemo(() => {
    const d: any = unitsQuery.data
    const list = (d?.data ?? []) as any[]

    return Array.isArray(list)
      ? list.map(u => ({
          id: String(u.id),
          name: String(u.unit_name ?? u.name ?? ''),
          abbr: String(u.uom_abbr ?? ''),
          measurement_type: String(u.measurement_type ?? '')
        }))
      : []
  }, [unitsQuery.data])

  // Filter to the type's measurement_type when the type declares one; otherwise show all.
  const filteredUnits = useMemo(() => {
    if (!measurementType) return allUnits

    return allUnits.filter(u => u.measurement_type === measurementType)
  }, [allUnits, measurementType])

  // For numeric_value types with a measurement_type, the unit select MUST be present even when the
  // /measurement-units call is loading or returns empty — otherwise the form would silently let the
  // user submit a unit-required value with `assessment_unit_id=""` and the backend would reject it
  // (or store bad data). The Select itself handles the loading/empty states internally.
  const showUnitField = responseType === 'numeric_value' && measurementType.trim() !== ''

  // Distinguishes edit (PATCH-style POST to /update) from add (POST to /add). Drives the endpoint
  // choice, the submit-button label, and the success/error toast copy.
  const isEditing = Number((entry as any)?.has_assessment) === 1

  // Save mutation — routes to /add for new cells, /update for existing entries.
  // Using /add for an existing cell would create a duplicate row instead of overwriting it.
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!animal || !column || !date || !time) throw new Error('Missing data')

      // Combine date + time into a single moment.
      const recorded = date
        .hour(time.hour())
        .minute(time.minute())
        .second(time.second())

      const user = auth?.userData?.user ?? {}

      const basePayload: any = {
        assessment_type_id: String(column.id),
        assessment_value: value,
        comments: comments || '',
        recorded_date_time: formatLocal(recorded),
        assessment_unit_id: unitId || '',
        // Extra fields the API expects but aren't in AddAssessmentPayload's TS shape.
        type: responseType,
        animal_id: String(animal.animal_id),
        birth_date: (animal.birth_date as string) || '',
        has_assessment: isEditing ? 1 : 0,
        utcTime: formatUtc(recorded),
        created_by_user: {
          user_id: Number(user?.user_id ?? user?.id ?? 0),
          user_name: String(user?.user_name ?? user?.name ?? ''),
          email: String(user?.email ?? ''),
          profile_pic: String(user?.profile_pic ?? '')
        }
      }

      if (isEditing) {
        // entry.assessment_id is the existing row's PK ("46683" in the sample response).
        // Fall back to add if it's missing — the alternative is a hard failure with no way out.
        const existingId = String((entry as any)?.assessment_id ?? '')
        if (existingId) {
          return updateAssessmentEntry(animal.animal_id, {
            ...basePayload,
            animal_assessment_id: existingId
          } as any)
        }
      }

      return addAssessmentEntry(animal.animal_id, basePayload as any)
    },
    onSuccess: res => {
      const ok = (res as any)?.success
      if (ok) {
        toast.success(
          (res as any)?.message || (isEditing ? 'Successfully Updated' : 'Successfully Added')
        )
        // Refresh the grid so the cell flips from "Add Entry" to the new value.
        queryClient.invalidateQueries({ queryKey: ['assessment-group'] })
        onSaved?.()
        onClose()
      } else {
        toast.error(
          (res as any)?.message || (isEditing ? 'Failed to update entry' : 'Failed to save entry')
        )
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || (isEditing ? 'Failed to update entry' : 'Failed to save entry'))
    }
  })

  // ===== Validation =====

  const canSave =
    Boolean(date && time && value.trim()) &&
    (!showUnitField || unitId !== '') &&
    !saveMutation.isPending

  // ===== Steppers =====

  const canPrevAnimal = animalIdx > 0
  const canNextAnimal = animalIdx < animals.length - 1
  const canPrevCol = colIdx > 0
  const canNextCol = colIdx < columns.length - 1

  // ===== Render =====

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 520 },
            backgroundColor: theme.palette.customColors?.Background ?? theme.palette.background.default
          }
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 4,
            px: 5,
            flexShrink: 0
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton size='small' onClick={onClose}>
              <Icon icon='mdi:arrow-left' />
            </IconButton>
            <Typography
              variant='h6'
              sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}
            >
              {column?.name || (isEditing ? 'Edit Entry' : 'Add New Entry')}
            </Typography>
          </Box>
          <IconButton size='small' onClick={onClose}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>

        <Divider />

        {/* Active context + steppers */}
        <Box sx={{ p: 4, px: 5, flexShrink: 0 }}>
          {animal && column ? (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant='subtitle2'
                sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}
              >
                AID: {animal.animal_id} · {column.name}
              </Typography>
              <Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary }}>
                Encl: {animal.user_enclosure_name || animal.enclosure_name || '-'} · Site:{' '}
                {animal.site_name || '-'}
              </Typography>
            </Box>
          ) : null}

          {/* ↑ ↓ animal · ← → column — match mobile control bar above the form. */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size='small'
              disabled={!canPrevAnimal}
              onClick={() => {
                const next = animalIdx - 1
                setAnimalIdx(next)
                onNavigate?.(next, colIdx)
              }}
              sx={{
                border: `1px solid ${theme.palette.customColors.SurfaceVariant}`,
                borderRadius: '8px',
                backgroundColor: theme.palette.customColors.Surface
              }}
              aria-label='Previous animal'
            >
              <Icon icon='mdi:chevron-up' />
            </IconButton>
            <IconButton
              size='small'
              disabled={!canNextAnimal}
              onClick={() => {
                const next = animalIdx + 1
                setAnimalIdx(next)
                onNavigate?.(next, colIdx)
              }}
              sx={{
                border: `1px solid ${theme.palette.customColors.SurfaceVariant}`,
                borderRadius: '8px',
                backgroundColor: theme.palette.customColors.Surface
              }}
              aria-label='Next animal'
            >
              <Icon icon='mdi:chevron-down' />
            </IconButton>

            <Box sx={{ flex: 1 }} />

            <IconButton
              size='small'
              disabled={!canPrevCol}
              onClick={() => {
                const next = colIdx - 1
                setColIdx(next)
                onNavigate?.(animalIdx, next)
              }}
              sx={{
                border: `1px solid ${theme.palette.customColors.SurfaceVariant}`,
                borderRadius: '8px',
                backgroundColor: theme.palette.customColors.Surface
              }}
              aria-label='Previous type'
            >
              <Icon icon='mdi:chevron-left' />
            </IconButton>
            <Box
              sx={{
                px: 2,
                py: 0.5,
                borderRadius: '8px',
                backgroundColor: theme.palette.customColors.Surface,
                color: theme.palette.primary.main,
                fontWeight: 600,
                fontSize: '0.875rem',
                minWidth: 80,
                textAlign: 'center'
              }}
            >
              {column?.name || '-'}
            </Box>
            <IconButton
              size='small'
              disabled={!canNextCol}
              onClick={() => {
                const next = colIdx + 1
                setColIdx(next)
                onNavigate?.(animalIdx, next)
              }}
              sx={{
                border: `1px solid ${theme.palette.customColors.SurfaceVariant}`,
                borderRadius: '8px',
                backgroundColor: theme.palette.customColors.Surface
              }}
              aria-label='Next type'
            >
              <Icon icon='mdi:chevron-right' />
            </IconButton>
          </Box>
        </Box>

        <Divider />

        {/* Form body */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 4, px: 5 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <DatePicker
                label='Date'
                value={date}
                onChange={v => setDate(v ? dayjs(v) : null)}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <TimePicker
                label='Time'
                value={time}
                onChange={v => setTime(v ? dayjs(v) : null)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Box>

            {/* Value input is shaped by the type's response_type — same branching as the hospital
                AddParameterDataEntry drawer so a vet seeing both modules gets identical affordances. */}
            {responseType === 'numeric_value' && measurementType.trim() === '' && (
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  type='number'
                  label='Enter Value'
                  value={value}
                  onChange={e => setValue(e.target.value)}
                />
              </Box>
            )}

            {responseType === 'numeric_value' && measurementType.trim() !== '' && (
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  sx={{ flex: 2 }}
                  type='number'
                  label='Enter Value'
                  value={value}
                  onChange={e => setValue(e.target.value)}
                />
                <Select
                  sx={{ flex: 1 }}
                  displayEmpty
                  value={unitId}
                  onChange={e => setUnitId(String(e.target.value))}
                  renderValue={selected => {
                    if (!selected) return <span style={{ color: theme.palette.customColors.Outline }}>Select unit</span>
                    const u = filteredUnits.find(x => x.id === String(selected))

                    return u ? `${u.name} (${u.abbr})` : String(selected)
                  }}
                >
                  {unitsQuery.isLoading ? (
                    <MenuItem disabled>
                      <CircularProgress size={16} sx={{ mr: 1 }} /> Loading…
                    </MenuItem>
                  ) : filteredUnits.length === 0 ? (
                    <MenuItem disabled>No units available</MenuItem>
                  ) : (
                    filteredUnits.map(u => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.name} ({u.abbr})
                      </MenuItem>
                    ))
                  )}
                </Select>
              </Box>
            )}

            {(responseType === 'numeric_scale' || responseType === 'list') && (
              <Box sx={{ mb: 3 }}>
                <Select
                  fullWidth
                  displayEmpty
                  value={value}
                  onChange={e => setValue(String(e.target.value))}
                  renderValue={selected => {
                    if (!selected)
                      return <span style={{ color: theme.palette.customColors.Outline }}>Select value</span>
                    const opt = dropdownOptions.find(o => o.id === String(selected))

                    return opt ? opt.label : String(selected)
                  }}
                >
                  {dropdownOptions.length === 0 ? (
                    <MenuItem disabled>No options</MenuItem>
                  ) : (
                    dropdownOptions.map(o => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </Box>
            )}

            {responseType === 'text' && (
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label='Enter Text'
                  value={value}
                  onChange={e => setValue(e.target.value)}
                />
              </Box>
            )}

            <TextField
              fullWidth
              multiline
              minRows={3}
              label='Add notes if any'
              value={comments}
              onChange={e => setComments(e.target.value)}
            />
          </LocalizationProvider>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            p: 3,
            borderTop: `1px solid ${theme.palette.divider}`,
            flexShrink: 0,
            backgroundColor: theme.palette.background.paper
          }}
        >
          <Button fullWidth variant='outlined' size='large' onClick={onClose}>
            Cancel
          </Button>
          <LoadingButton
            fullWidth
            variant='contained'
            size='large'
            loading={saveMutation.isPending}
            disabled={!canSave}
            onClick={() => saveMutation.mutate()}
          >
            {isEditing ? 'Update Entry' : 'Add Entry'}
          </LoadingButton>
        </Box>
      </Box>
    </Drawer>
  )
}

export default AssessmentEntryDrawer
