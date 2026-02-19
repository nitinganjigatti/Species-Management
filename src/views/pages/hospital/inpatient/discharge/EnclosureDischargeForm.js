import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { Box, Button, Divider, Grid, IconButton, Tooltip, Typography, useTheme, CircularProgress } from '@mui/material'
import { alpha, styled } from '@mui/system'
import Icon from 'src/@core/components/icon'

import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { Controller, useForm } from 'react-hook-form'
import { useRouter } from 'next/router'
import dayjs from 'dayjs'
import moment from 'moment'
import Utility from 'src/utility'
import { useDynamicStateContext } from 'src/context/DynamicStatesContext'

import MUICheckbox from 'src/views/forms/form-fields/MUICheckbox'
import ControlledSwitch from 'src/views/forms/form-fields/ControlledSwitch'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import TemplateSection from 'src/components/hospital/discharge/TemplateSection'
import BottomActionBar from 'src/views/utility/BottomActionBar'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'

const EnclosureDischargeForm = props => {
  const {
    patientData,
    watchDischargeType,
    submitLoader,
    handleSubmitData,
    medicationsColumns,
    clearData,
    onDirtyChange,
    medicationData,
    refetchPatient,
    medicalRecordId,
    prescriptionsColumns,
    prescriptionData,
    isPrescriptionLoading,
    sites,
    fetchLoading,
    handleSiteSearch,
    sections,
    sectionLoading,
    handleSectionSearch,
    enclosures,
    enclosureLoading,
    handleEnclosureSearch,
    fetchSections,
    fetchEnclosures,
    clearSections,
    clearEnclosures
  } = props

  const STORAGE_KEY_FORM = 'transfer_enclosure_form'

  const isRestoring = useRef(true)

  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query
  const patientDetails = patientData?.animal_detail
  const { data, updateState } = useDynamicStateContext()

  // Index medicines
  const indexedMedicines = useMemo(
    () =>
      medicationData?.map((data, i) => ({
        ...data,
        sl_no: i + 1
      })),
    [medicationData]
  )

  const transferEnclosureSchema = yup.object({
    site_name: yup
      .object()
      .nullable()
      .test('has-value', 'Site is required', value => {
        return value && value.value && value.value !== null && value.value !== '' // Ensures a valid value is selected from Autocomplete (not null/empty)
      }),
    section_name: yup
      .object()
      .nullable()
      .test('has-value', 'Section is required', value => {
        return value && value.value && value.value !== null && value.value !== ''
      }),
    user_enclosure_name: yup
      .object()
      .nullable()
      .test('has-value', 'Enclosure is required', value => {
        return value && value.value && value.value !== null && value.value !== ''
      }),
    discharge_date: yup
      .date()
      .typeError('Invalid Date')
      .nullable()
      .required('Date of discharge is required')
      .test('is-valid-date', 'Discharge date is invalid', function (value) {
        if (!value) return true

        const admittedAt = dayjs(Utility.convertUTCToLocal(patientData?.admitted_at)).startOf('day')
        const now = dayjs().startOf('day')
        const selectedDate = dayjs(value).startOf('day')

        if (selectedDate.isBefore(admittedAt)) {
          return this.createError({
            message: `Date must be on or after (${dayjs(Utility.convertUTCToLocal(patientData?.admitted_at)).format(
              'DD MMM YYYY'
            )})`
          })
        }

        if (selectedDate.isAfter(now)) {
          return this.createError({ message: 'Discharge date cannot be in the future' })
        }

        return true
      }),
    discharge_time: yup
      .date()
      .typeError('Invalid Date')
      .nullable()
      .required('Time of discharge is required')
      .test('is-valid-time', 'Discharge time is invalid', function (value) {
        const { discharge_date } = this.parent
        if (!value || !discharge_date) return true

        const admittedAt = dayjs(Utility.convertUTCToLocal(patientData?.admitted_at))
        const now = dayjs()

        const dischargeDateTime = dayjs(discharge_date)
          .startOf('day')
          .set('hour', dayjs(value).hour())
          .set('minute', dayjs(value).minute())
          .set('second', 0)

        if (dayjs(discharge_date).format('YYYY-MM-DD') === admittedAt.format('YYYY-MM-DD')) {
          if (dischargeDateTime.isBefore(admittedAt)) {
            return this.createError({
              message: `Time must be after admission time (${Utility.convertUTCToLocaltime(patientData?.admitted_at)})`
            })
          }
        }

        if (dayjs(discharge_date).format('YYYY-MM-DD') === now.format('YYYY-MM-DD')) {
          if (dischargeDateTime.isAfter(now)) {
            return this.createError({ message: 'Time cannot be in the future' })
          }
        }

        return true
      }),
    follow_up_required: yup.boolean().optional(),
    follow_up_date: yup
      .date()
      .nullable()
      .when('follow_up_required', {
        is: true,
        then: schema => schema.required('Follow up date required')
      }),
    reason: yup.string().optional(),
    care_diet_instruction: yup.string().trim().optional(),
    care_restriction: yup.string().trim().optional(),
    care_notes: yup.string().trim().optional(),
    attachments: yup.array().nullable().optional()
  })

  const defaultValues = {
    returnToOriginal: true,
    discharge_type: 'TransferEnclosure',
    site_name: patientDetails?.site_id ? { label: patientDetails?.site_name, value: patientDetails?.site_id } : null,
    section_name: patientDetails?.section_id
      ? { label: patientDetails?.section_name, value: patientDetails?.section_id }
      : null,
    user_enclosure_name: patientDetails?.user_enclosure_id
      ? { label: patientDetails?.user_enclosure_name, value: patientDetails?.user_enclosure_id }
      : null,
    discharge_date: dayjs(),
    discharge_time: dayjs(),
    reason: '',
    follow_up_required: false,
    follow_up_date: null,
    care_diet_instruction: '',
    care_restriction: '',
    care_notes: '',
    attachments: []
  }

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    clearErrors,
    getValues,
    formState: { errors, isDirty, isValid }
  } = useForm({
    defaultValues,
    resolver: yupResolver(transferEnclosureSchema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  useEffect(() => {
    if (!medicalRecordId) return
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('transfer_enclosure_form_') && key !== STORAGE_KEY_FORM) {
        sessionStorage.removeItem(key)
      }
    })
  }, [medicalRecordId])

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY_FORM)

    if (saved) {
      const parsed = JSON.parse(saved)
      reset({
        ...defaultValues,
        ...parsed,
        discharge_date: parsed.discharge_date ? dayjs(parsed.discharge_date) : dayjs(),
        discharge_time: parsed.discharge_time ? dayjs(parsed.discharge_time) : dayjs(),
        follow_up_required: parsed.follow_up_required ?? false,
        follow_up_date: parsed.follow_up_required && parsed.follow_up_date ? dayjs(parsed.follow_up_date) : null
      })

      isRestoring.current = false
    }
  }, [STORAGE_KEY_FORM])

  // time limits for discharge time
  const selectedDischargeDate = watch('discharge_date')
  const admittedAt = dayjs(patientData?.admitted_at)
  const now = dayjs()

  let minTime = null
  let maxTime = null

  if (selectedDischargeDate) {
    const selectedDay = dayjs(selectedDischargeDate)

    // If discharge day is same as admission date  cannot select a time before admission
    if (selectedDay.isSame(admittedAt, 'day')) {
      minTime = admittedAt
    }

    // If discharge day is today  cannot pick time after current time
    if (selectedDay.isSame(now, 'day')) {
      maxTime = now
    }
  }

  // Disable selecting past/future times based on rules
  const shouldDisableDischargeTime = (timeValue, clockType) => {
    if (timeValue == null) return false

    const base = dayjs(selectedDischargeDate).set(clockType, timeValue)

    if (minTime && base.isBefore(minTime)) return true
    if (maxTime && base.isAfter(maxTime)) return true

    return false
  }

  const followUp = watch('follow_up_required')
  const returnToOriginal = watch('returnToOriginal')

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  // Edit medicine – go to schedule-prescription
  const handleEditMedicine = useCallback(
    med => {
      sessionStorage.setItem(STORAGE_KEY_FORM, JSON.stringify(getValues()))

      window.location.hash = 'medications-section'

      router.push({
        pathname: `/hospital/inpatient/${id}/schedule-prescription`,
        query: {
          tab: 'discharge',
          discharge_tab: 'TransferEnclosure',
          medicine_edit_id: med.id
        }
      })
    },
    [router, id]
  )

  // Delete a medicine update context state
  const handleDeleteMedicine = useCallback(
    medId => {
      const updated = medicationData?.filter(med => med.id !== medId)
      updateState('enclosure_medicines', updated)
    },
    [medicationData, updateState]
  )

  // Add actions column
  const medicationColumnsWithActions = useMemo(
    () =>
      (medicationsColumns || []).map(col =>
        col.field === 'actions'
          ? {
              ...col,
              renderCell: params => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title='Edit'>
                    <IconButton size='small' onClick={() => handleEditMedicine(params.row)}>
                      <Icon icon='mdi:pencil-outline' fontSize={20} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title='Delete'>
                    <IconButton size='small' onClick={() => handleDeleteMedicine(params.row.id)}>
                      <Icon icon='mdi:close' fontSize={20} />
                    </IconButton>
                  </Tooltip>
                </Box>
              )
            }
          : col
      ),
    [medicationsColumns, handleEditMedicine, handleDeleteMedicine]
  )

  const onSubmit = async formData => {
    const payload = {
      hospital_case_id: id,
      animal_id: patientDetails?.animal_id,
      discharge_type: watchDischargeType,
      discharge_date: formData.discharge_date ? moment(formData.discharge_date).format('YYYY-MM-DD') : null,
      discharge_time: formData.discharge_time
        ? dayjs(formData.discharge_time).set('second', 0).format('HH:mm:ss')
        : null,
      reason: formData.reason,
      care_diet_instruction: formData.care_diet_instruction,
      care_restriction: formData.care_restriction,
      care_notes: formData.care_notes,
      follow_up_required: formData.follow_up_required ? '1' : '0',
      follow_up_date: formData.follow_up_date ? moment(formData.follow_up_date).format('YYYY-MM-DD') : null,
      attachments: formData.attachments.length > 0 ? formData.attachments : null,
      medications: medicationData.length > 0 ? JSON.stringify(medicationData) : null,
      transfer_to_site_id: returnToOriginal ? patientDetails?.site_id : formData?.site_name?.value,
      transfer_to_section_id: returnToOriginal ? patientDetails?.section_id : formData?.section_name?.value,
      transfer_to_enclosure_id: returnToOriginal
        ? patientDetails?.user_enclosure_id
        : formData?.user_enclosure_name?.value,
      request_from: 'web',
      transfer_back_to_original_location: returnToOriginal ? '1' : '0'
    }

    const success = await handleSubmitData(payload)
    if (success) {
      sessionStorage.removeItem(STORAGE_KEY_FORM)

      // reset(defaultValues) // to avoid api call after discharge
      clearData() // clear medicines + reset storage after submit
      refetchPatient()
    }
  }

  const handleReturnToOriginalToggle = (checked, fieldOnChange) => {
    fieldOnChange(checked)

    if (checked) {
      // Apply original values (system action → not dirty)
      setValue(
        'site_name',
        {
          label: patientDetails?.site_name,
          value: patientDetails?.site_id
        },
        { shouldValidate: true, shouldDirty: false } // immediately trigger validation and dirty state update
      )

      setValue(
        'section_name',
        {
          label: patientDetails?.section_name,
          value: patientDetails?.section_id
        },
        { shouldValidate: true, shouldDirty: false }
      )

      setValue(
        'user_enclosure_name',
        {
          label: patientDetails?.user_enclosure_name,
          value: patientDetails?.user_enclosure_id
        },
        { shouldValidate: true, shouldDirty: false }
      )
    }
  }

  useEffect(() => {
    if (window.location.hash) {
      const target = document.querySelector(window.location.hash)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' })

        // Remove the hash from URL after scrolling
        window.history.replaceState(null, null, ' ')
      }
    }
  }, [])

  return (
    <>
      <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : undefined}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mb: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Controller
              name='returnToOriginal'
              control={control}
              render={({ field }) => (
                <MUICheckbox
                  {...field}
                  label='Transfer back to animal’s original location'
                  labelStyle={{
                    fontSize: '1rem',
                    fontWeight: '400',
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                  checked={field.value}
                  onChange={e => handleReturnToOriginalToggle(e.target.checked, field.onChange)}
                />
              )}
            />

            <StyledTypography>Select location to transfer</StyledTypography>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledAutocomplete
                  control={control}
                  name={'site_name'}
                  errors={errors}
                  label={'Site*'}
                  options={sites}
                  getOptionLabel={option => option?.label || ''}
                  onInputChange={value => handleSiteSearch(value)}
                  isOptionEqualToValue={(option, value) => option?.value === value?.value}
                  onItemClear={() => {
                    handleSiteSearch('')
                    setValue('section_name', null, { shouldValidate: true, shouldDirty: true })
                    setValue('user_enclosure_name', null, { shouldValidate: true, shouldDirty: true })
                    clearSections()
                    clearEnclosures()
                  }}
                  loading={fetchLoading}
                  showLoader={true}
                  required
                  showIcons={false}
                  disabled={returnToOriginal}
                  onChangeOverride={val => {
                    setValue('section_name', null, {
                      shouldValidate: true,
                      shouldDirty: true
                    }) // Reset dependents to null to prevent stale data
                    setValue('user_enclosure_name', null, {
                      shouldValidate: true,
                      shouldDirty: true
                    })

                    // Clear existing options list to avoid showing stale data
                    clearSections()
                    clearEnclosures()

                    // Fetch new section list for selected site
                    if (val?.value) {
                      fetchSections(val?.value)
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledAutocomplete
                  control={control}
                  name={'section_name'}
                  errors={errors}
                  label={'Section*'}
                  options={sections}
                  getOptionLabel={option => option?.label || ''}
                  onInputChange={value => handleSectionSearch(watch('site_name')?.value, value)}
                  isOptionEqualToValue={(option, value) => option?.value === value?.value}
                  onItemClear={() => {
                    handleSectionSearch(watch('site_name')?.value, '')
                    setValue('user_enclosure_name', null, { shouldValidate: true, shouldDirty: true })
                    clearEnclosures()
                  }}
                  loading={sectionLoading}
                  showLoader={true}
                  required
                  showIcons={false}
                  disabled={returnToOriginal}
                  onChangeOverride={val => {
                    setValue('user_enclosure_name', null, {
                      shouldValidate: true,
                      shouldDirty: true
                    })
                    clearEnclosures()
                    if (val?.value) {
                      fetchEnclosures(val?.value)
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledAutocomplete
                  control={control}
                  name={'user_enclosure_name'}
                  errors={errors}
                  label={'Enclosure*'}
                  options={enclosures}
                  getOptionLabel={option => option?.label}
                  onInputChange={value => handleEnclosureSearch(watch('section_name')?.value, value)}
                  isOptionEqualToValue={(option, value) => option?.value === value?.value}
                  onItemClear={() => handleEnclosureSearch(watch('section_name')?.value, '')}
                  loading={enclosureLoading}
                  showLoader={true}
                  required
                  showIcons={false}
                  disabled={returnToOriginal}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mt: 4 }}>
              <StyledTypography>Discharge Date & Time</StyledTypography>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <ControlledDatePicker
                    control={control}
                    name='discharge_date'
                    label='Date*'
                    errors={errors}
                    minDate={dayjs(patientData?.admitted_at)}
                    maxDate={dayjs(new Date())}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <ControlledTimePicker
                    control={control}
                    name='discharge_time'
                    label='Time*'
                    errors={errors}
                    minTime={minTime}
                    maxTime={maxTime}
                    shouldDisableTime={shouldDisableDischargeTime}
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>

          {/* Summary & Templates */}
          <Controller
            name='reason'
            control={control}
            render={({ field, fieldState }) => (
              <TemplateSection
                key={isRestoring.current ? 'restoring' : 'normal'}
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
          <Grid container alignItems='center' spacing={2} justifyContent='space-between'>
            <Grid size={{ xs: 12, sm: 6 }}>
              <ControlledSwitch
                name='follow_up_required'
                label={<StyledTypography fontSize='1.25rem'>Is any follow up required?</StyledTypography>}
                labelPosition='start'
                control={control}
                errors={errors}
                size='large'
                gap={4}
                onChangeOverride={checked => {
                  if (!checked) {
                    setValue('follow_up_date', null, { shouldDirty: true })
                    clearErrors('follow_up_date')
                  }
                }}
              />
            </Grid>
            {followUp && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Grid container spacing={2} alignItems='center'>
                  <Grid size={{ xs: 'auto' }}>
                    <StyledTypography fontWeight={400}>Enter follow up date</StyledTypography>
                  </Grid>
                  <Grid
                    sx={{
                      flexGrow: {
                        xs: 1,
                        sm: 1
                      },
                      flexBasis: {
                        xs: 'auto',
                        sm: 0
                      }
                    }}
                  >
                    <ControlledDatePicker
                      control={control}
                      name='follow_up_date'
                      label='Date'
                      errors={errors}
                      minDate={dayjs(new Date())}
                      onChangeOverride={selectedDate => {
                        if (!selectedDate) {
                          setValue('follow_up_date', null)

                          return
                        }

                        const now = dayjs()

                        const finalDate = selectedDate
                          .set('hour', now.hour())
                          .set('minute', now.minute())
                          .set('second', now.second())

                        setValue('follow_up_date', finalDate)
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>
            )}
          </Grid>

          {/* Prescription table*/}
          {isPrescriptionLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 4 }}>
              <CircularProgress size={30} />
            </Box>
          ) : prescriptionData?.length > 0 ? (
            <>
              <Divider />
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: {
                      xs: 'flex-start',
                      md: 'center'
                    },
                    flexDirection: {
                      xs: 'column',
                      sm: 'row'
                    },
                    justifyContent: {
                      xs: 'flex-start',
                      sm: 'space-between'
                    },
                    gap: {
                      xs: 3,
                      md: 0
                    }
                  }}
                >
                  <Box>
                    <StyledTypography fontSize='1.25rem'>
                      Active Prescriptions - {prescriptionData?.length}
                    </StyledTypography>

                    <StyledTypography fontSize='0.875rem'>
                      You can stop the below prescriptions if its not needed after discharge
                    </StyledTypography>
                  </Box>
                </Box>
                <CommonTable
                  columns={prescriptionsColumns}
                  loading={isPrescriptionLoading}
                  indexedRows={prescriptionData || []}
                  rowHeight={64}
                  externalTableStyle={{
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: theme.palette.customColors.neutral05,
                      fontSize: '0.75rem',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }
                  }}
                  hideFooterPagination={true}
                  hideFooter={true}
                  disablePagination={true}
                />
              </Box>
            </>
          ) : null}
          <Divider />
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: {
                  xs: 'flex-start',
                  md: 'center'
                },
                flexDirection: {
                  xs: 'column',
                  sm: 'row'
                },
                justifyContent: {
                  xs: 'flex-start',
                  sm: 'space-between'
                },
                gap: {
                  xs: 3,
                  md: 0
                }
              }}
              id='medications-section'
            >
              <StyledTypography fontSize='1.25rem'>Medications</StyledTypography>
              <Button
                sx={{ py: 2 }}
                onClick={() => {
                  sessionStorage.setItem(STORAGE_KEY_FORM, JSON.stringify(getValues()))

                  window.location.hash = 'medications-section'

                  router.push({
                    pathname: `/hospital/inpatient/${id}/schedule-prescription`,
                    query: {
                      tab: 'discharge',
                      discharge_tab: 'TransferEnclosure'
                    }
                  })
                }}
                variant='contained'
                disabled={isPrescriptionLoading}
              >
                Add New Prescription
              </Button>
            </Box>

            {indexedMedicines.length > 0 && (
              <CommonTable
                columns={medicationColumnsWithActions}
                indexedRows={indexedMedicines || []}
                rowHeight={64}
                externalTableStyle={{
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: theme.palette.customColors.neutral05,
                    fontSize: '0.75rem',
                    color: theme.palette.customColors.OnSurfaceVariant
                  }
                }}
                hideFooterPagination={true}
                hideFooter={true}
                disablePagination={true}
              />
            )}
          </Box>

          <Divider />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <StyledTypography fontSize='1.25rem'>Care Instructions</StyledTypography>

            <ControlledTextField
              control={control}
              name={'care_diet_instruction'}
              errors={errors}
              placeholder={'Enter text'}
              label='Enter diet instructions'
            />
            <ControlledTextField
              control={control}
              name={'care_restriction'}
              errors={errors}
              placeholder={'Enter text'}
              label='Enter restriction activities with duration'
            />
            <ControlledTextField
              inputBackgroundColor={alpha(theme.palette.customColors.antzNotes, 0.6)}
              placeholder={'Enter text'}
              control={control}
              name={'care_notes'}
              errors={errors}
              label=' Additional notes'
            />
          </Box>

          <Divider />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <StyledTypography>Attachments</StyledTypography>
            <ControlledMultiFileUpload name='attachments' control={control} errors={errors} label='Upload attachment' />
          </Box>
        </Box>
        <BottomActionBar
          submitLabel='Discharge Animal'
          submitBtnVariant='contained'
          showCancel={false}
          submitBtnStyle={{ px: 12, py: 3 }}
          loading={submitLoader}
          disabled={!isValid || submitLoader}
          submitBtnProps={{ type: 'submit' }}
        />
      </form>
    </>
  )
}

export default EnclosureDischargeForm

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 500,
  color: color || theme.palette.customColors.OnSurfaceVariant
}))
