import React, { useEffect, useMemo } from 'react'
import { Box, Divider, Grid, Typography, useTheme } from '@mui/material'
import { alpha, styled } from '@mui/system'
import { LoadingButton } from '@mui/lab'

import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller } from 'react-hook-form'
import { useRouter } from 'next/router'
import dayjs from 'dayjs'

import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledSwitch from 'src/views/forms/form-fields/ControlledSwitch'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import TemplateSection from 'src/components/hospital/discharge/TemplateSection'

const mortalitySchema = yup.object({
  date_of_death: yup.date().nullable().required('Date of death is required'),
  time_of_death: yup.date().nullable().required('Time of death is required'),
  manner_of_death: yup
    .object({
      value: yup.string().required(),
      label: yup.string().required()
    })
    .required('Cause of death is required'),
  carcass_condition: yup
    .object({
      value: yup.string().required(),
      label: yup.string().required()
    })
    .required('Carcass condition is required'),
  carcass_disposition: yup
    .object({
      value: yup.string().required(),
      label: yup.string().required()
    })
    .required('Carcass disposition is required'),

  reason: yup.string().optional(),
  necropsy_requested: yup.boolean().optional(),
  necropsy_reason: yup
    .string()
    .nullable()
    .when('necropsy_requested', {
      is: false,
      then: schema => schema.required('Reason for not performing necropsy is required').trim(),
      otherwise: schema => schema.notRequired().nullable()
    }),
  priority: yup.string().when('necropsy_requested', {
    is: true,
    then: schema => schema.required('Priority is required'),
    otherwise: schema => schema.notRequired()
  }),
  attachments: yup.array().nullable().optional()
})

const MortalityDischargeForm = props => {
  const {
    patientData,
    watchDischargeType,
    causeOfDeath,
    carcassCondition,
    carcassDeposition,
    fetchLoading,
    handleMannerSearch,
    handleConditionSearch,
    handleDispositionSearch,
    submitLoader,
    handleSubmitData,
    onDirtyChange,
    refetchPatient
  } = props

  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query

  const defaultValues = {
    discharge_type: 'Mortality',
    date_of_death: dayjs(),
    time_of_death: dayjs(),
    manner_of_death: null,
    carcass_condition: null,
    carcass_disposition: null,
    reason: '',
    necropsy_requested: false,
    priority: 'high',
    necropsy_reason: '',
    attachments: []
  }

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    clearErrors,
    formState: { errors, isDirty }
  } = useForm({
    defaultValues,
    resolver: yupResolver(mortalitySchema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  // Priority options for Necropsy selection
  const necropsyPriorityList = [
    {
      label: 'High',
      value: 'high',
      bg_color: theme.palette.customColors.ErrorContainer,
      text_color: theme.palette.customColors.Error
    },
    {
      label: 'Low',
      value: 'low',
      bg_color: alpha(theme.palette.customColors.SecondaryContainer, 0.4),
      text_color: theme.palette.customColors.addPrimary
    }
  ]

  // priority color configuration
  const watchRequestNecropsy = watch('necropsy_requested')
  const selectedPriority = watch('priority')

  const selectedPriorityOption = necropsyPriorityList.find(p => p.value === selectedPriority)
  const priorityBgColor = selectedPriorityOption?.bg_color || theme.palette.background.paper
  const priorityColor = selectedPriorityOption?.text_color || theme.palette.text.primary

  // strict time limits for death time
  const selectedDateOfDeath = watch('date_of_death')
  const admittedAtLocal = dayjs(patientData?.admitted_at)
  const now = dayjs()

  let minTime = null
  let maxTime = null

  if (selectedDateOfDeath) {
    const selectedDate = dayjs(selectedDateOfDeath)

    // If selected date is admission date, can't select time before admission
    if (selectedDate.isSame(admittedAtLocal, 'day')) {
      minTime = admittedAtLocal
    }

    // If selected date is today, can't select time after current time
    if (selectedDate.isSame(now, 'day')) {
      maxTime = now
    }
  }

  const shouldDisableDeathTime = (timeValue, clockType) => {
    if (timeValue == null) return false

    const t = dayjs(selectedDateOfDeath).set(clockType, timeValue)

    if (minTime && t.isBefore(minTime)) return true
    if (maxTime && t.isAfter(maxTime)) return true

    return false
  }

  // Handle form submission
  const onSubmit = async formData => {
    const payload = {
      hospital_case_id: id,
      animal_id: patientData?.animal_detail?.animal_id,
      discharge_type: watchDischargeType,
      date_of_death: formData.date_of_death,
      time_of_death: formData.time_of_death,
      manner_of_death: formData.manner_of_death.value,
      reason_for_death: formData.manner_of_death.value, // for backend compatibility
      carcass_condition: formData.carcass_condition.value,
      carcass_disposition: formData.carcass_disposition.value,
      reason: formData.reason,
      necropsy_requested: formData.necropsy_requested ? '1' : '0',
      priority: formData.necropsy_requested ? formData.priority : null,
      necropsy_reason: !formData.necropsy_requested ? formData.necropsy_reason : null,
      attachments: formData.attachments?.length > 0 ? formData.attachments : undefined
    }

    const success = await handleSubmitData(payload)
    if (success) {
      reset(defaultValues)
      refetchPatient()
    }
  }

  // mark dirty when form changes
  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  // Reset irrelevant fields on necropsy toggle
  useEffect(() => {
    if (watchRequestNecropsy) {
      setValue('necropsy_reason', '')
      clearErrors('necropsy_reason')
    } else {
      clearErrors('priority')
    }
  }, [watchRequestNecropsy, setValue, clearErrors])

  return (
    <>
      <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : undefined}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mb: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mb: 4 }}>
            <StyledTypography>Mortality Details</StyledTypography>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledDatePicker
                  control={control}
                  name={'date_of_death'}
                  label='Date of Death'
                  errors={errors}
                  minDate={dayjs(patientData?.admitted_at)}
                  maxDate={dayjs(new Date())}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledTimePicker
                  control={control}
                  name={'time_of_death'}
                  label='Time of Death'
                  errors={errors}
                  minTime={minTime}
                  maxTime={maxTime}
                  shouldDisableTime={shouldDisableDeathTime}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledAutocomplete
                  control={control}
                  name={'manner_of_death'}
                  errors={errors}
                  label={'Cause of Death'}
                  options={causeOfDeath}
                  getOptionLabel={option => option?.label || ''}
                  getOptionValue={option => option?.value || ''}
                  onInputChange={value => handleMannerSearch(value)}
                  isOptionEqualToValue={(option, value) => option?.value === value?.value}
                  onItemClear={() => handleMannerSearch('')}
                  loading={fetchLoading}
                  required
                  showIcons={false}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledAutocomplete
                  control={control}
                  name={'carcass_condition'}
                  errors={errors}
                  label={'Carcass Condition'}
                  options={carcassCondition}
                  getOptionLabel={option => option?.label || ''}
                  getOptionValue={option => option?.value || ''}
                  onInputChange={value => handleConditionSearch(value)}
                  isOptionEqualToValue={(option, value) => option?.value === value?.value}
                  onItemClear={() => handleConditionSearch('')}
                  loading={fetchLoading}
                  required
                  showIcons={false}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledAutocomplete
                  control={control}
                  name={'carcass_disposition'}
                  errors={errors}
                  label={'Carcass Deposition'}
                  options={carcassDeposition}
                  getOptionLabel={option => option?.label || ''}
                  getOptionValue={option => option?.value || ''}
                  onInputChange={value => handleDispositionSearch(value)}
                  isOptionEqualToValue={(option, value) => option?.value === value?.value}
                  onItemClear={() => handleDispositionSearch('')}
                  loading={fetchLoading}
                  required
                  showIcons={false}
                />
              </Grid>
            </Grid>
          </Box>

          <Controller
            name='reason'
            control={control}
            render={({ field, fieldState }) => (
              <TemplateSection
                label='Enter summary'
                value={field.value}
                onChange={field.onChange}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                onDirtyChange={onDirtyChange}
                hospitalId={patientData?.hospital_id}
              />
            )}
          />

          <Divider />

          <Grid container spacing={4} alignItems='center'>
            <Grid
              size={{ xs: 12, sm: 6, md: 6 }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                justifyContent: {
                  xs: 'space-between',
                  sm: 'flex-start'
                }
              }}
            >
              <StyledTypography fontSize={'1.25rem'}>Request Necropsy</StyledTypography>
              <ControlledSwitch
                name={'necropsy_requested'}
                label={watchRequestNecropsy ? 'Yes' : 'No'}
                control={control}
                errors={errors}
                gap={4}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 6 }}>
              {watchRequestNecropsy ? (
                <ControlledSelect
                  control={control}
                  name={'priority'}
                  errors={errors}
                  label={'Select Priority'}
                  fullWidth
                  options={necropsyPriorityList}
                  getOptionLabel={option => option.label}
                  getOptionValue={option => option.value}
                  sx={{
                    backgroundColor: priorityBgColor,
                    color: priorityColor,
                    '& .MuiSelect-icon': {
                      color: priorityColor
                    }
                  }}
                />
              ) : (
                <ControlledTextField
                  control={control}
                  errors={errors}
                  label={'Enter reason why necropsy will not be performed'}
                  name={'necropsy_reason'}
                  placeholder={'Enter Reason'}
                  fullWidth
                />
              )}
            </Grid>
          </Grid>

          <Divider />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <StyledTypography>Attachments</StyledTypography>
            <ControlledMultiFileUpload
              name={'attachments'}
              control={control}
              errors={errors}
              label='Upload attachment'
              acceptedFileTypes={'images,pdf,document'}
            />
          </Box>
        </Box>

        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: {
              xs: 0,
              lg: '270px'
            },
            right: 0,
            width: 'auto',
            backgroundColor: theme.palette.customColors.OnPrimary,
            p: 6,
            boxShadow: `0px -2px 8px ${theme.palette.customColors.shadowColor}`,
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 1200
          }}
        >
          <LoadingButton
            variant='contained'
            type='submit'
            loading={submitLoader}
            disabled={submitLoader}
            sx={{ px: 12, py: 3 }}
          >
            Discharge Animal
          </LoadingButton>
        </Box>
      </form>
    </>
  )
}

export default MortalityDischargeForm

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 500,
  color: color || theme.palette.customColors.OnSurfaceVariant
}))
