'use client'

import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Divider, Grid, Typography, useTheme } from '@mui/material'
import { alpha, styled } from '@mui/system'

import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller } from 'react-hook-form'
import { useParams } from 'next/navigation'
import dayjs from 'dayjs'
import moment from 'moment'

import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledSwitch from 'src/views/forms/form-fields/ControlledSwitch'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import TemplateSection from 'src/components/hospital/discharge/TemplateSection'
import BottomActionBar from 'src/views/utility/BottomActionBar'
import Utility from 'src/utility'

interface MortalityDischargeFormProps {
  causeOfDeath?: any[]
  carcassCondition?: any[]
  carcassDeposition?: any[]
  necropsyCenter?: any[]
  mannerLoading?: boolean
  conditionLoading?: boolean
  dispositionLoading?: boolean
  necropsyLoading?: boolean
  submitLoader?: boolean
  handleMannerSearch?: any
  handleConditionSearch?: any
  handleDispositionSearch?: any
  handleNecropsyCenterSearch?: any
  handleSubmitData?: any
  patientData?: any
  watchDischargeType?: any
  onDirtyChange?: (isDirty: boolean) => void
  refetchPatient?: any
}

const MortalityDischargeForm = (props: MortalityDischargeFormProps) => {
  const {
    causeOfDeath,
    carcassCondition,
    carcassDeposition,
    necropsyCenter,
    mannerLoading,
    conditionLoading,
    dispositionLoading,
    necropsyLoading,
    submitLoader,
    handleMannerSearch,
    handleConditionSearch,
    handleDispositionSearch,
    handleNecropsyCenterSearch,
    handleSubmitData,
    patientData,
    watchDischargeType,
    onDirtyChange,
    refetchPatient
  } = props
  const theme: any = useTheme()
  const { t } = useTranslation()
  const params = useParams()
  const { id }: any = params

  const mortalitySchema = yup.object({
    date_of_death: yup
      .date()
      .typeError(t('hospital_module.date_of_death_invalid') as string)
      .nullable()
      .required(t('hospital_module.date_of_death_required') as string)
      .test('is-valid-date', t('hospital_module.date_of_death_invalid') as string, function (value: any) {
        if (!value) return true

        const admittedAt = dayjs(Utility.convertUTCToLocal(patientData?.admitted_at)).startOf('day')
        const now = dayjs().startOf('day')
        const selectedDate = dayjs(value).startOf('day')

        if (selectedDate.isBefore(admittedAt)) {
          return this.createError({
            message: t('hospital_module.date_cannot_be_before_admitted_date', {
              date: dayjs(Utility.convertUTCToLocal(patientData?.admitted_at)).format('DD MMM YYYY')
            }) as string
          })
        }

        if (selectedDate.isAfter(now)) {
          return this.createError({ message: t('hospital_module.date_cannot_be_in_future') as string })
        }

        return true
      }),
    time_of_death: yup
      .date()
      .typeError(t('hospital_module.time_of_death_invalid') as string)
      .nullable()
      .required(t('hospital_module.time_of_death_required') as string)
      .test('is-valid-time', t('hospital_module.time_of_death_invalid') as string, function (value: any) {
        const { date_of_death } = this.parent
        if (!value || !date_of_death) return true

        const admittedAt = dayjs(Utility.convertUTCToLocal(patientData?.admitted_at))
        const now = dayjs()

        const deathDateTime = dayjs(date_of_death)
          .startOf('day')
          .set('hour', dayjs(value).hour())
          .set('minute', dayjs(value).minute())
          .set('second', 0)

        if (dayjs(date_of_death).format('YYYY-MM-DD') === admittedAt.format('YYYY-MM-DD')) {
          if (deathDateTime.isBefore(admittedAt)) {
            return this.createError({
              message: t('hospital_module.time_cannot_be_before_admitted_time', {
                time: Utility.convertUTCToLocaltime(patientData?.admitted_at)
              }) as string
            })
          }
        }

        if (dayjs(date_of_death).format('YYYY-MM-DD') === now.format('YYYY-MM-DD')) {
          if (deathDateTime.isAfter(now)) {
            return this.createError({ message: t('hospital_module.time_cannot_be_in_future') as string })
          }
        }

        return true
      }),
    manner_of_death: yup
      .object({
        value: yup.string().required(),
        label: yup.string().required()
      })
      .required(t('hospital_module.cause_of_death_required') as string),
    carcass_condition: yup
      .object({
        value: yup.string().required(),
        label: yup.string().required()
      })
      .required(t('hospital_module.carcass_condition_required') as string),
    carcass_disposition: yup
      .object({
        value: yup.string().required(),
        label: yup.string().required()
      })
      .required(t('hospital_module.carcass_disposition_required') as string),
    reason: yup.string().optional(),
    necropsy_requested: yup.boolean().optional(),
    necropsy_reason: yup
      .string()
      .nullable()
      .when('necropsy_requested', {
        is: false,
        then: (schema: any) => schema.required(t('hospital_module.reason_for_not_performing_necropsy_required') as string).trim(),
        otherwise: (schema: any) => schema.notRequired().nullable()
      }),
    priority: yup.string().when('necropsy_requested', {
      is: true,
      then: (schema: any) => schema.required(t('hospital_module.priority_required') as string),
      otherwise: (schema: any) => schema.notRequired()
    }),
    necropsy_center_id: yup
      .object({
        value: yup.string().required(),
        label: yup.string().required()
      })
      .nullable()
      .when('necropsy_requested', {
        is: true,
        then: (schema: any) => schema.required(t('hospital_module.necropsy_center_required') as string),
        otherwise: (schema: any) => schema.notRequired()
      }),
    attachments: yup.array().nullable().optional()
  })

  const defaultValues: any = {
    discharge_type: 'Mortality',
    date_of_death: dayjs(),
    time_of_death: dayjs(),
    manner_of_death: null,
    carcass_condition: null,
    carcass_disposition: null,
    reason: '',
    necropsy_requested: true,
    priority: 'high',
    necropsy_center_id: null,
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
    trigger,
    formState: { errors, isDirty, isValid }
  } = useForm({
    defaultValues,
    resolver: yupResolver(mortalitySchema as any),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

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

  const watchRequestNecropsy = watch('necropsy_requested')
  const selectedPriority = watch('priority')

  const selectedPriorityOption: any = necropsyPriorityList.find((p: any) => p.value === selectedPriority)
  const priorityBgColor = selectedPriorityOption?.bg_color || theme.palette.background.paper
  const priorityColor = selectedPriorityOption?.text_color || theme.palette.text.primary

  const selectedDateOfDeath = watch('date_of_death')
  const admittedAtLocal = dayjs(patientData?.admitted_at)
  const now = dayjs()

  let minTime: any = null
  let maxTime: any = null

  if (selectedDateOfDeath) {
    const selectedDate = dayjs(selectedDateOfDeath)

    if (selectedDate.isSame(admittedAtLocal, 'day')) {
      minTime = admittedAtLocal
    }

    if (selectedDate.isSame(now, 'day')) {
      maxTime = now
    }
  }

  const shouldDisableDeathTime = (timeValue: any, clockType: any) => {
    if (timeValue == null) return false

    const t = dayjs(selectedDateOfDeath).set(clockType, timeValue)

    if (minTime && t.isBefore(minTime)) return true
    if (maxTime && t.isAfter(maxTime)) return true

    return false
  }

  const onSubmit = async (formData: any) => {
    const payload: any = {
      hospital_case_id: id,
      animal_id: patientData?.animal_detail?.animal_id,
      discharge_type: watchDischargeType,
      date_of_death: formData.date_of_death ? moment(formData.date_of_death).format('YYYY-MM-DD') : null,
      time_of_death: formData.time_of_death ? dayjs(formData.time_of_death).set('second', 0).format('HH:mm:ss') : null,
      manner_of_death: formData.manner_of_death.value,
      reason_for_death: formData.manner_of_death.value,
      carcass_condition: formData.carcass_condition.value,
      carcass_disposition: formData.carcass_disposition.value,
      reason: formData.reason,
      necropsy_requested: formData.necropsy_requested ? '1' : '0',
      priority: formData.necropsy_requested ? formData.priority : null,
      necropsy_center_id: formData.necropsy_center_id ? formData.necropsy_center_id.value : null,
      necropsy_reason: !formData.necropsy_requested ? formData.necropsy_reason : null,
      attachments: formData.attachments?.length > 0 ? formData.attachments : null,
      request_from: 'web'
    }

    const success = await handleSubmitData(payload)
    if (success) {
      reset(defaultValues)
      refetchPatient()
    }
  }

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  useEffect(() => {
    if (watchRequestNecropsy) {
      setValue('necropsy_reason', '')
      clearErrors('necropsy_reason')
    } else {
      clearErrors('priority')
      setValue('necropsy_center_id', null)
      clearErrors('necropsy_center_id')
    }
  }, [watchRequestNecropsy, setValue, clearErrors])

  return (
    <>
      <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : undefined}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mb: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mb: 4 }}>
            <StyledTypography>{t('hospital_module.mortality_details')}</StyledTypography>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledDatePicker
                  control={control}
                  name={'date_of_death'}
                  label={(t('hospital_module.date_of_death') as string)}
                  errors={errors}
                  minDate={dayjs(patientData?.admitted_at)}
                  maxDate={dayjs(new Date())}
                  onChangeOverride={() => {
                    trigger('time_of_death')
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledTimePicker
                  control={control}
                  name={'time_of_death'}
                  label={(t('hospital_module.time_of_death') as string)}
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
                  label={(t('hospital_module.cause_of_death') as string)}
                  options={causeOfDeath}
                  getOptionLabel={(option: any) => option?.label || ''}
                  onInputChange={(value: any) => handleMannerSearch(value)}
                  isOptionEqualToValue={(option: any, value: any) => option?.value === value?.value}
                  onItemClear={() => handleMannerSearch('')}
                  loading={mannerLoading}
                  required
                  showIcons={false}
                  showLoader={true}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledAutocomplete
                  control={control}
                  name={'carcass_condition'}
                  errors={errors}
                  label={(t('hospital_module.carcass_condition') as string)}
                  options={carcassCondition}
                  getOptionLabel={(option: any) => option?.label || ''}
                  onInputChange={(value: any) => handleConditionSearch(value)}
                  isOptionEqualToValue={(option: any, value: any) => option?.value === value?.value}
                  onItemClear={() => handleConditionSearch('')}
                  loading={conditionLoading}
                  required
                  showIcons={false}
                  showLoader={true}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledAutocomplete
                  control={control}
                  name={'carcass_disposition'}
                  errors={errors}
                  label={(t('hospital_module.carcass_deposition') as string)}
                  options={carcassDeposition}
                  getOptionLabel={(option: any) => option?.label || ''}
                  onInputChange={(value: any) => handleDispositionSearch(value)}
                  isOptionEqualToValue={(option: any, value: any) => option?.value === value?.value}
                  onItemClear={() => handleDispositionSearch('')}
                  loading={dispositionLoading}
                  required
                  showIcons={false}
                  showLoader={true}
                />
              </Grid>
            </Grid>
          </Box>

          <Controller
            name='reason'
            control={control}
            render={({ field, fieldState }: any) => (
              <TemplateSection
                label={(t('hospital_module.enter_summary') as string)}
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
              <StyledTypography fontSize={'1.25rem'}>{t('hospital_module.request_necropsy')}</StyledTypography>
              <ControlledSwitch
                name={'necropsy_requested'}
                label={watchRequestNecropsy ? t('yes') || "" : t('no') || ''}
                control={control}
                errors={errors}
                gap={4}
                disabled={true}
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
                  getOptionLabel={(option: any) => option.label}
                  getOptionValue={(option: any) => option.value}
                  sx={{
                    backgroundColor: priorityBgColor,
                    color: priorityColor,
                    '& .MuiSelect-icon': {
                      color: priorityColor
                    }
                  }}
                  formControlSx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: `${priorityColor} !important`
                    },

                    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: `${priorityColor} !important`
                    },

                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: `${priorityColor} !important`
                    },

                    '& .MuiInputLabel-root': {
                      color: priorityColor
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: priorityColor
                    }
                  }}
                />
              ) : (
                <ControlledTextField
                  control={control}
                  errors={errors}
                  label={(t('hospital_module.enter_reason_for_no_necropsy') as string)}
                  name={'necropsy_reason'}
                  placeholder={'Enter Reason'}
                  fullWidth
                />
              )}
            </Grid>
          </Grid>

          <Divider />

          {watchRequestNecropsy && (
            <>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mb: 4 }}>
                <StyledTypography>{t('hospital_module.necropsy_center')}</StyledTypography>

                <ControlledAutocomplete
                  control={control}
                  name={'necropsy_center_id'}
                  errors={errors}
                  label={(t('hospital_module.necropsy_center') as string)}
                  options={necropsyCenter}
                  getOptionLabel={(option: any) => option?.label || ''}
                  getOptionValue={(option: any) => option?.value || ''}
                  onInputChange={(value: any) => handleNecropsyCenterSearch(value)}
                  isOptionEqualToValue={(option: any, value: any) => option?.value === value?.value}
                  onItemClear={() => handleNecropsyCenterSearch('')}
                  loading={necropsyLoading}
                  required
                  showIcons={false}
                  showLoader={true}
                  sx={{ width: { xs: '100%', sm: '50%', md: '32%' } }}
                />
              </Box>
              <Divider />
            </>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <StyledTypography>{t('hospital_module.attachments')}</StyledTypography>
            <ControlledMultiFileUpload
              name={'attachments'}
              control={control}
              errors={errors}
              label={(t('hospital_module.upload_attachment') as string)}
              acceptedFileTypes={'images,pdf,document'}
            />
          </Box>
        </Box>
        <BottomActionBar
          {...({
            submitLabel: 'Discharge Animal',
            submitBtnVariant: 'contained',
            showCancel: false,
            submitBtnStyle: { px: 12, py: 3 },
            loading: submitLoader,
            disabled: submitLoader,
            submitBtnProps: { type: 'submit' }
          } as any)}
        />
      </form>
    </>
  )
}

export default MortalityDischargeForm

const StyledTypography = styled(Typography)<{ fontWeight?: number; fontSize?: string; color?: string }>(
  ({ theme, fontWeight, fontSize, color }: any) => ({
    fontSize: fontSize || '1rem',
    fontWeight: fontWeight || 500,
    color: color || theme.palette.customColors.OnSurfaceVariant
  })
)
