import React, { useEffect, useState } from 'react'
import { Box, Button, CircularProgress, Drawer, IconButton, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import dayjs, { Dayjs } from 'dayjs'
import { useTranslation } from 'react-i18next'
import Icon from 'src/@core/components/icon'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import AssessmentScaleList from 'src/components/housing/animals/assessment/AssessmentScaleList'
import Toaster from 'src/components/Toaster'
import { addEntityAssessmentEntry, updateEntityAssessmentEntry } from 'src/lib/api/assessment'
import type { AssessmentType, AssessmentValue, MeasurementUnit } from 'src/types/housing/assessment'
import type { EntityType } from './EntityAssessment'

interface AddEditEntityAssessmentDrawerProps {
  open: boolean
  setOpen: (open: boolean) => void
  assessment: AssessmentType | null
  selectedValue: AssessmentValue | null
  entityId: string | number
  entityType: EntityType
  measurementUnits: MeasurementUnit[]
  userId: number
  fromAddIcon: boolean
  refetch: () => void
}

interface FormValues {
  date: Dayjs | null
  time: Dayjs | null
  textValue: string
  numericValue: string
  selectedScaleId: string
  unitId: string
  notes: string
}

// Decimal regex for numeric input validation
const decimalRegex = /^\d*\.?\d{0,2}$/

const AddEditEntityAssessmentDrawer: React.FC<AddEditEntityAssessmentDrawerProps> = ({
  open,
  setOpen,
  assessment,
  selectedValue,
  entityId,
  entityType,
  measurementUnits,
  userId,
  fromAddIcon,
  refetch
}) => {
  const theme = useTheme() as any
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  // Determine mode - entities always allow edit by creator
  const isAddMode = fromAddIcon
  const isEditMode = !fromAddIcon && selectedValue && userId === selectedValue.created_by
  const isViewMode = !isAddMode && !isEditMode

  // Filter measurement units by measurement type
  const filteredUnits = assessment?.measurement_type
    ? measurementUnits.filter(u => String(u.measurement_type) === String(assessment.measurement_type))
    : measurementUnits

  const unitOptions = filteredUnits.map(u => ({
    label: u.uom_abbr,
    value: u.id,
    name: u.name
  }))

  // Build validation schema based on response type
  const getValidationSchema = () => {
    const baseSchema = {
      date: yup
        .mixed()
        .required(t('date_required') as string)
        .nullable(),
      time: yup
        .mixed()
        .required(t('time_required') as string)
        .nullable(),
      notes: yup.string()
    }

    switch (assessment?.response_type) {
      case 'text':
        return yup.object().shape({
          ...baseSchema,
          textValue: yup
            .string()
            .required(t('value_required') as string)
            .max(200, t('max_200_chars') as string)
        })
      case 'numeric_value':
        if (assessment?.measurement_type) {
          return yup.object().shape({
            ...baseSchema,
            numericValue: yup.string().required(t('value_required') as string),
            unitId: yup.string().required(t('unit_required') as string)
          })
        }

        return yup.object().shape({
          ...baseSchema,
          numericValue: yup.string().required(t('value_required') as string)
        })
      case 'numeric_scale':
      case 'list':
        return yup.object().shape({
          ...baseSchema,
          selectedScaleId: yup.string().required(t('please_select_option') as string)
        })
      default:
        return yup.object().shape(baseSchema)
    }
  }

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      date: dayjs(),
      time: dayjs(),
      textValue: '',
      numericValue: '',
      selectedScaleId: '',
      unitId: '',
      notes: ''
    },
    resolver: yupResolver(getValidationSchema()) as any
  })

  const selectedScaleId = watch('selectedScaleId')

  // Populate form when editing
  useEffect(() => {
    if (!open) return

    if (isAddMode) {
      reset({
        date: dayjs(),
        time: dayjs(),
        textValue: '',
        numericValue: '',
        selectedScaleId: '',
        unitId: '',
        notes: ''
      })
    } else if (selectedValue) {
      // Parse date and time from recorded_date_time
      let dateValue = dayjs()
      let timeValue = dayjs()

      if (selectedValue.recorded_date_time) {
        const parsedDate = dayjs(selectedValue.recorded_date_time)
        if (parsedDate.isValid()) {
          dateValue = parsedDate
          timeValue = parsedDate
        }
      }

      reset({
        date: dateValue,
        time: timeValue,
        textValue: assessment?.response_type === 'text' ? String(selectedValue.assessment_value) : '',
        numericValue: assessment?.response_type === 'numeric_value' ? String(selectedValue.assessment_value) : '',
        selectedScaleId:
          assessment?.response_type === 'numeric_scale' || assessment?.response_type === 'list'
            ? String(selectedValue.assessment_value)
            : '',
        unitId: selectedValue.assessment_unit_id || '',
        notes: selectedValue.comments || ''
      })
    }
  }, [open, isAddMode, selectedValue, assessment, reset])

  const handleClose = () => {
    setOpen(false)
    reset()
  }

  const handleNumericChange = (value: string, onChange: (val: string) => void) => {
    if (value === '' || decimalRegex.test(value)) {
      if (value.length <= 10) {
        onChange(value)
      }
    }
  }

  const onSubmit = async (data: FormValues) => {
    if (!assessment) return

    // Format recorded_date_time
    const dateStr = data.date ? data.date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
    const timeStr = data.time ? data.time.format('HH:mm:ss') : dayjs().format('HH:mm:ss')
    const recordedDateTime = `${dateStr} ${timeStr}`

    // Build payload based on response type
    let assessmentValue: string | number = ''

    switch (assessment.response_type) {
      case 'text':
        assessmentValue = data.textValue
        break
      case 'numeric_value':
        assessmentValue = data.numericValue
        break
      case 'numeric_scale':
      case 'list':
        assessmentValue = data.selectedScaleId
        break
    }

    try {
      setLoading(true)

      if (isAddMode) {
        const payload = {
          ref_id: entityId,
          ref_type: entityType,
          assessment_type_id: assessment.assessment_type_id,
          assessment_value: assessmentValue,
          comments: data.notes || '',
          recorded_date_time: recordedDateTime,
          ...(assessment.response_type === 'numeric_value' && data.unitId ? { assessment_unit_id: data.unitId } : {})
        }

        const res = await addEntityAssessmentEntry(payload)

        if (res?.success) {
          Toaster({ type: 'success', message: res.message || 'Assessment added successfully' })
          handleClose()
          refetch()
        } else {
          Toaster({ type: 'error', message: res?.message || 'Failed to add assessment' })
        }
      } else if (isEditMode && selectedValue) {
        const payload = {
          entity_assessments_id: selectedValue.assessment_id,
          ref_id: entityId,
          ref_type: entityType,
          assessment_type_id: assessment.assessment_type_id,
          assessment_value: assessmentValue,
          comments: data.notes || '',
          recorded_date_time: recordedDateTime,
          ...(assessment.response_type === 'numeric_value' && data.unitId ? { assessment_unit_id: data.unitId } : {})
        }

        const res = await updateEntityAssessmentEntry(payload)

        if (res?.success) {
          Toaster({ type: 'success', message: res.message || 'Assessment updated successfully' })
          handleClose()
          refetch()
        } else {
          Toaster({ type: 'error', message: res?.message || 'Failed to update assessment' })
        }
      }
    } catch (error) {
      console.error('Error saving assessment:', error)
      Toaster({ type: 'error', message: 'An error occurred while saving' })
    } finally {
      setLoading(false)
    }
  }

  const renderResponseInput = () => {
    if (!assessment) return null

    switch (assessment.response_type) {
      case 'text':
        return (
          <Controller
            name='textValue'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={t('enter_text')}
                placeholder={t('enter_value') as string}
                fullWidth
                disabled={isViewMode}
                error={!!errors.textValue}
                helperText={errors.textValue?.message as string}
                inputProps={{ maxLength: 200 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: theme.palette.customColors?.Surface || theme.palette.grey[100]
                  }
                }}
              />
            )}
          />
        )

      case 'numeric_value':
        return (
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Box sx={{ flex: assessment.measurement_type ? 1.5 : 1 }}>
              <Controller
                name='numericValue'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('enter_value')}
                    placeholder={t('enter_value') as string}
                    fullWidth
                    disabled={isViewMode}
                    error={!!errors.numericValue}
                    helperText={errors.numericValue?.message as string}
                    onChange={e => handleNumericChange(e.target.value, field.onChange)}
                    inputProps={{
                      inputMode: 'decimal'
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: theme.palette.customColors?.Surface || theme.palette.grey[100]
                      }
                    }}
                  />
                )}
              />
            </Box>
            {assessment.measurement_type && (
              <Box sx={{ flex: 1 }}>
                <ControlledSelect
                  name='unitId'
                  control={control}
                  label={t('select_unit') as string}
                  required
                  errors={errors}
                  options={unitOptions}
                  getOptionLabel={(opt: { label: string; value: string }) => opt.label}
                  getOptionValue={(opt: { label: string; value: string }) => opt.value}
                  disabled={isViewMode}
                  sx={{
                    backgroundColor: theme.palette.customColors?.Surface || theme.palette.grey[100]
                  }}
                />
              </Box>
            )}
          </Box>
        )

      case 'numeric_scale':
      case 'list':
        return (
          <ControlledSelect
            name='selectedScaleId'
            control={control}
            label={t('select_value') as string}
            required
            errors={errors}
            options={(assessment.default_values || []).map(v => ({
              label: v.label,
              value: v.id
            }))}
            getOptionLabel={(opt: { label: string; value: string }) => opt.label}
            getOptionValue={(opt: { label: string; value: string }) => opt.value}
            disabled={isViewMode}
            sx={{
              backgroundColor: theme.palette.customColors?.Surface || theme.palette.grey[100]
            }}
          />
        )

      default:
        return null
    }
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={handleClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: ['100%', '562px'],
          height: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <Box
        sx={{
          backgroundColor: theme.palette.customColors?.Background || theme.palette.grey[100],
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header - Simple title with close button */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.palette.customColors?.OnPrimary || theme.palette.background.paper,
            px: 6,
            py: 5,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Typography
            sx={{
              fontSize: '24px',
              fontWeight: 500,
              color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
            }}
          >
            {assessment?.assessment_name}
          </Typography>
          <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleClose}>
            <Icon icon='mdi:close' fontSize={28} />
          </IconButton>
        </Box>

        {/* Body */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 6 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Main Card */}
            <Box
              sx={{
                backgroundColor: theme.palette.customColors?.OnPrimary || theme.palette.background.paper,
                borderRadius: 1,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Date and Time Section */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  px: 6,
                  pt: 6,
                  pb: 5
                }}
              >
                <Typography
                  sx={{
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.secondary
                  }}
                >
                  {t('observation_date_time')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Box sx={{ flex: 1 }}>
                    <ControlledDatePicker
                      name='date'
                      control={control}
                      label={t('date') as string}
                      required
                      maxDate={dayjs()}
                      disabled={isViewMode}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <ControlledTimePicker
                      name='time'
                      control={control}
                      label={t('time') as string}
                      required
                      disabled={isViewMode}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Observation Value Section */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  px: 6,
                  pt: 5,
                  pb: 5
                }}
              >
                <Typography
                  sx={{
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.secondary
                  }}
                >
                  {t('enter_observation')}
                </Typography>
                {renderResponseInput()}
              </Box>

              {/* Notes Section */}
              <Box
                sx={{
                  px: 6,
                  py: 4,
                  backgroundColor: theme.palette.customColors?.antzNotes,
                  borderRadius: '0 0 4px 4px'
                }}
              >
                <Controller
                  name='notes'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder={t('notes_optional') as string}
                      multiline
                      rows={2}
                      fullWidth
                      disabled={isViewMode}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'transparent',
                          '& fieldset': { border: 'none' },
                          '&:hover fieldset': { border: 'none' },
                          '&.Mui-focused fieldset': { border: 'none' }
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: theme.palette.text.disabled,
                          opacity: 1
                        }
                      }}
                    />
                  )}
                />
              </Box>
            </Box>
          </form>
        </Box>

        {/* Footer */}
        {!isViewMode && (
          <Box
            sx={{
              p: 4,
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
              display: 'flex',
              gap: 3,
              boxShadow: '0px -1px 30px 0px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Button
              variant='outlined'
              fullWidth
              size='large'
              onClick={handleClose}
              disabled={loading}
              sx={{
                borderColor: theme.palette.customColors?.OnPrimaryContainer || theme.palette.primary.main,
                color: theme.palette.customColors?.OnPrimaryContainer || theme.palette.primary.main,
                height: '56px',
                textTransform: 'uppercase',
                fontWeight: 600
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              variant='contained'
              fullWidth
              size='large'
              onClick={handleSubmit(onSubmit)}
              disabled={loading}
              sx={{
                height: '56px',
                backgroundColor: theme.palette.customColors?.OnPrimaryContainer || theme.palette.primary.dark,
                textTransform: 'uppercase',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark
                }
              }}
            >
              {loading ? <CircularProgress size={24} color='inherit' /> : isAddMode ? t('add') : t('update')}
            </Button>
          </Box>
        )}

        {/* View Mode Footer */}
        {isViewMode && (
          <Box
            sx={{
              p: 4,
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
              boxShadow: '0px -1px 30px 0px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Button
              variant='outlined'
              fullWidth
              size='large'
              onClick={handleClose}
              sx={{
                borderColor: theme.palette.customColors?.OnPrimaryContainer || theme.palette.primary.main,
                color: theme.palette.customColors?.OnPrimaryContainer || theme.palette.primary.main,
                height: '56px',
                textTransform: 'uppercase',
                fontWeight: 600
              }}
            >
              {t('close')}
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  )
}

export default AddEditEntityAssessmentDrawer
