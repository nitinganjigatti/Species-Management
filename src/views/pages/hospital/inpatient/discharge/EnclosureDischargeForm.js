import React, { useCallback, useEffect, useMemo } from 'react'
import { Box, Button, Divider, Grid, IconButton, Tooltip, Typography, useTheme } from '@mui/material'
import { alpha, styled } from '@mui/system'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'

import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { Controller, useForm } from 'react-hook-form'
import { useRouter } from 'next/router'
import dayjs from 'dayjs'

// ** Custom Form Components
import MUICheckbox from 'src/views/forms/form-fields/MUICheckbox'
import ControlledSwitch from 'src/views/forms/form-fields/ControlledSwitch'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import CommonTable from 'src/views/table/data-grid/CommonTable'

import { useDynamicStateContext } from 'src/context/DynamicStatesContext'
import TemplateSection from 'src/components/hospital/discharge/TemplateSection'

const transferEnclosureSchema = yup.object({
  discharge_date: yup.date().nullable().required('Date of discharge is required'),
  discharge_time: yup.date().nullable().required('Time of discharge is required'),
  follow_up_required: yup.boolean().optional(),

  // follow_up_date: yup
  //   .date()
  //   .nullable()
  //   .when('follow_up_required', {
  //     is: true,
  //     then: schema =>
  //       schema.required('Follow up date required').test('afterNow', 'Follow-up cannot be in past', v => {
  //         if (!v) return true

  //         // Compare pure dates (midnight)
  //         const selected = dayjs(v).startOf('day')
  //         const today = dayjs().startOf('day')

  //         return selected.isSame(today) || selected.isAfter(today)
  //       })
  //   }),
  follow_up_date: yup
    .date()
    .nullable()
    .when('follow_up_required', {
      is: true,
      then: schema =>
        schema
          .required('Follow up date required')
          .min(dayjs().startOf('day').toDate(), 'Follow up cannot be in the past')
    }),
  reason: yup.string().required(),
  care_diet_instruction: yup.string().trim().optional(),
  care_restriction: yup.string().trim().optional(),
  care_notes: yup.string().trim().optional(),
  attachments: yup.array().nullable().optional()
})

const EnclosureDischargeForm = props => {
  const {
    patientData,
    watchDischargeType,
    submitLoader,
    handleSubmitData,

    medicationsColumns,
    isTransferEnclosureMedicationLoading,
    clearData,
    onDirtyChange,
    medicationData
  } = props

  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query
  const patientDetails = patientData?.animal_detail
  const { data, updateState } = useDynamicStateContext()

  // Index medicines
  const indexedMedicines = useMemo(
    () =>
      medicationData.map((data, i) => ({
        ...data,
        sl_no: i + 1
      })),
    [medicationData]
  )

  const defaultValues = {
    discharge_type: 'TransferEnclosure',
    site_name: patientDetails?.site_name || '',
    section_name: patientDetails?.section_name || '',
    user_enclosure_name: patientDetails?.user_enclosure_name || '',
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
    formState: { errors, isDirty }
  } = useForm({
    defaultValues,
    resolver: yupResolver(transferEnclosureSchema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  // strict time limits for discharge time
  const selectedDischargeDate = watch('discharge_date')
  const admittedAtLocal = dayjs(patientData?.admitted_at)
  const now = dayjs()

  let minTime = null
  let maxTime = null

  if (selectedDischargeDate) {
    const selectedDay = dayjs(selectedDischargeDate)

    // If discharge day is same as admission date → cannot select a time before admission
    if (selectedDay.isSame(admittedAtLocal, 'day')) {
      minTime = admittedAtLocal
    }

    // If discharge day is today → cannot pick time after current time
    if (selectedDay.isSame(now, 'day')) {
      maxTime = now
    }
  }

  // Disable selecting past/future times based on rules
  const shouldDisableDischargeTime = (timeValue, clockType) => {
    if (timeValue == null) return false

    const t = dayjs(selectedDischargeDate).set(clockType, timeValue)

    if (minTime && t.isBefore(minTime)) return true
    if (maxTime && t.isAfter(maxTime)) return true

    return false
  }

  const followUp = watch('follow_up_required')

  // mark dirty when form changes
  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  // Reset irrelevant fields on follow-up toggle
  useEffect(() => {
    if (!followUp) {
      setValue('follow_up_date', null)
      clearErrors('follow_up_date')
    }
  }, [followUp, setValue, clearErrors])

  // Edit medicine – go to schedule-prescription
  const handleEditMedicine = useCallback(
    med => {
      router.push({
        pathname: `/hospital/inpatient/${id}/schedule-prescription`,
        query: {
          discharge_tab: 'TransferEnclosure',
          medicine_edit_id: med.id
        }
      })
    },
    [router, id]
  )

  // Delete a medicine: update context state
  const handleDeleteMedicine = useCallback(
    medId => {
      const updated = medicationData.filter(med => med.id !== medId)
      updateState('enclosure_medicines', updated)
      onDirtyChange?.(true)
    },
    [medicationData, updateState, onDirtyChange]
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

  // Handle form submission
  const onSubmit = async formData => {
    const payload = {
      hospital_case_id: id,
      animal_id: patientDetails?.animal_id,
      discharge_type: watchDischargeType,
      discharge_date: formData.discharge_date,
      discharge_time: formData.discharge_time,
      reason: formData.reason,
      care_diet_instruction: formData.care_diet_instruction,
      care_restriction: formData.care_restriction,
      care_notes: formData.care_notes,
      follow_up_required: formData.follow_up_required ? '1' : '0',
      follow_up_date: formData.follow_up_date,
      attachments: formData.attachments.length > 0 ? formData.attachments : undefined,
      medications: JSON.stringify(medicationData),
      transfer_back_to_original_location: 1,
      transfer_to_site_id: patientDetails?.site_id,
      transfer_to_enclosure_id: patientDetails?.user_enclosure_id,
      request_from: 'web'

      // enclosure_id: patientDetails?.user_enclosure_id,
    }

    const success = await handleSubmitData(payload)
    if (success) {
      reset(defaultValues)
      clearData() // clear medicines + reset storage after submit
    }
  }

  return (
    <>
      <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : undefined}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mb: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <MUICheckbox
              name='returnToOriginal'
              control={control}
              label='Transfer back to animal’s original location'
              labelStyle={{
                fontSize: '1rem',
                fontWeight: '400',
                color: theme.palette.customColors.OnSurfaceVariant
              }}
              checked={true}
              disabled={true}
            />
            <StyledTypography>Select location to transfer</StyledTypography>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledTextField
                  control={control}
                  name={'site_name'}
                  label='Site'
                  disabled={true}
                  errors={errors}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledTextField
                  control={control}
                  name={'section_name'}
                  label='Section'
                  disabled={true}
                  errors={errors}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledTextField
                  control={control}
                  name={'user_enclosure_name'}
                  label='Enclosure'
                  disabled={true}
                  errors={errors}
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
                    label='Date'
                    errors={errors}
                    minDate={dayjs(patientData?.admitted_at)}
                    maxDate={dayjs(new Date())}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <ControlledTimePicker
                    control={control}
                    name='discharge_time'
                    label='Time'
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

          {/* Follow-up Section */}
          <Grid container alignItems='center' spacing={2} justifyContent='space-between' id='medications-section'>
            <Grid size={{ xs: 12, sm: 6 }}>
              <ControlledSwitch
                name='follow_up_required'
                label={<StyledTypography fontSize='1.25rem'>Is any follow up required?</StyledTypography>}
                labelPosition='start'
                control={control}
                errors={errors}
                size='large'
                gap={4}
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
                    />
                  </Grid>
                </Grid>
              </Grid>
            )}
          </Grid>

          <Divider />

          {/* Medications */}
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
              <StyledTypography fontSize='1.25rem'>Medications</StyledTypography>
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Button
                  onClick={() => {
                    router.push({
                      pathname: `/hospital/inpatient/${id}/schedule-prescription`,
                      query: {
                        tab: 'discharge',
                        discharge_tab: 'TransferEnclosure'

                        // return_to: '#medications-section'
                      }
                    })
                  }}
                  variant='contained'
                >
                  Add New Prescription
                </Button>
              </Box>
            </Box>

            {indexedMedicines.length > 0 && (
              <CommonTable
                columns={medicationColumnsWithActions}
                loading={isTransferEnclosureMedicationLoading}
                indexedRows={indexedMedicines || []}
                rowHeight={64}
                total={indexedMedicines?.length || 0}
                externalTableStyle={{
                  '--unstable_DataGrid-headWeight': 600,
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: theme.palette.customColors.neutral05,
                    fontSize: '0.75rem',
                    color: theme.palette.customColors.OnSurfaceVariant
                  }
                }}
              />
            )}
          </Box>

          <Divider />

          {/* Care Instructions */}
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

          {/* Attachments */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <StyledTypography>Attachments</StyledTypography>
            <ControlledMultiFileUpload name='attachments' control={control} errors={errors} label='Upload attachment' />
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
            sx={{ px: 12, py: 3 }}
            disabled={submitLoader}
            loading={submitLoader}
            type='submit'
          >
            Discharge Animal
          </LoadingButton>
        </Box>
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
