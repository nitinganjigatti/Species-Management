import React, { useCallback, useEffect, useMemo } from 'react'
import { Box, Button, Divider, Grid, IconButton, Tooltip, Typography, useTheme } from '@mui/material'
import { alpha, styled } from '@mui/system'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'

// ** Custom Form Components
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import { useDynamicStateContext } from 'src/context/DynamicStatesContext'
import TemplateSection from 'src/components/hospital/discharge/TemplateSection'

import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller } from 'react-hook-form'
import { useRouter } from 'next/router'
import dayjs from 'dayjs'
import BottomActionBar from 'src/views/utility/BottomActionBar'

//schema
const transferHospitalSchema = yup.object({
  transfer_hospital_id: yup
    .object({
      value: yup.mixed().required(),
      label: yup.string().required()
    })
    .nullable()
    .required('Hospital is required'),
  reason_for_transfer: yup.string().trim().required('Reason for transferring is required'),
  date_of_death: yup
    .date()
    .nullable()
    .required('Date of death is required')
    .min(new Date(), 'Date of death cannot be in the future'),
  time_of_death: yup
    .date()
    .nullable()
    .required('Time of death is required')
    .max(new Date(), 'Time of death cannot be in the future'),

  reason: yup.string().optional(),
  care_diet_instruction: yup.string().trim().required('Care Diet Instructions is required'),
  care_restriction: yup.string().trim().required('Care Restriction activities is required'),
  care_notes: yup.string().trim().required('Care notes is required'),
  attachments: yup.array().nullable().optional()
})

const TransferDischargeForm = props => {
  const {
    patientData,
    watchDischargeType,
    isLoadingHospital,
    hospitalData,
    handleHospitalSearch,
    prescriptionsColumns,
    prescriptionData,
    isPrescriptionLoading,
    submitLoader,
    handleSubmitData,

    medicationsColumns,
    isTransferHospitalMedicationLoading,
    clearData,
    onDirtyChange
  } = props

  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query

  const patientDetails = patientData?.animal_detail || {}
  const { data, updateState } = useDynamicStateContext()

  const transferMedicines = useMemo(() => data.transfer_medicines || [], [data.transfer_medicines]) // medicine table data

  // Index medicines
  const indexedMedicines = useMemo(
    () =>
      transferMedicines.map((data, i) => ({
        ...data,
        sl_no: i + 1
      })),
    [transferMedicines]
  )

  const defaultValues = useMemo(
    () => ({
      discharge_type: 'TransferHospital',
      transfer_hospital_id: null,
      reason_for_transfer: '',
      discharge_date: null,
      discharge_time: null,
      reason: '',
      care_diet_instruction: '',
      care_restriction: '',
      care_notes: '',
      attachments: []
    }),
    []
  )

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    defaultValues,
    resolver: yupResolver(transferHospitalSchema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  // mark dirty when form changes
  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  // Edit medicine – go to schedule-prescription
  const handleEditMedicine = useCallback(
    med => {
      router.push({
        pathname: `/hospital/inpatient/${id}/schedule-prescription`,
        query: {
          animal_id: patientData?.animal_detail?.animal_id,
          medical_record_id: patientData?.medical_record_id,
          discharge_tab: 'TransferHospital',
          edit_id: med.id
        }
      })
    },
    [router, id, patientData]
  )

  // Delete a medicine: update context state
  const handleDeleteMedicine = useCallback(
    medId => {
      const updated = transferMedicines.filter(med => med.id !== medId)
      updateState('transfer_medicines', updated)
      onDirtyChange?.(true)
    },
    [transferMedicines, updateState, onDirtyChange]
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
      transfer_hospital_id: formData.transfer_hospital_id.value,
      discharge_date: formData.discharge_date,
      discharge_time: formData.discharge_time,
      reason: formData.reason,
      reason_for_transfer: formData.reason_for_transfer,
      care_diet_instruction: formData.care_diet_instruction,
      care_restriction: formData.care_restriction,
      care_notes: formData.care_notes,
      attachments: formData.attachments,
      medications: JSON.stringify(transferMedicines),
      request_from: 'web'
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 8, mb: 4 }}>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledAutocomplete
                  control={control}
                  name='transfer_hospital_id'
                  errors={errors}
                  label='Select Hospital'
                  options={hospitalData}
                  getOptionLabel={option => option?.label || ''}
                  getOptionValue={option => option?.value || ''}
                  isOptionEqualToValue={(option, value) => option?.value === value?.value}
                  onInputChange={value => handleHospitalSearch(value)}
                  onItemClear={() => handleHospitalSearch('')}
                  loading={isLoadingHospital}
                  required
                  showIcons={false}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledDatePicker
                  control={control}
                  name={'discharge_date'}
                  label='Date'
                  errors={errors}
                  minDate={dayjs(patientData?.admitted_at)}
                  maxDate={dayjs(new Date())}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledTimePicker control={control} name={'discharge_time'} label='Time' errors={errors} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <ControlledTextArea
                  control={control}
                  errors={errors}
                  name='reason_for_transfer'
                  placeholder='Enter Reason or Transferring'
                  fullWidth
                  rows={2}
                />
              </Grid>
            </Grid>
          </Box>
          {/* Summary & Templates */}
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

          {/* Prescription table*/}
          {prescriptionData?.length > 0 && (
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
                total={prescriptionData?.length || 0}
                externalTableStyle={{
                  '--unstable_DataGrid-headWeight': 600,
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: theme.palette.customColors.neutral05,
                    fontSize: '0.75rem',
                    color: theme.palette.customColors.OnSurfaceVariant
                  }
                }}
              />
            </Box>
          )}

          {/* Medications table*/}
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
              <StyledTypography fontSize='1.25rem'>
                Medications {indexedMedicines?.length > 0 && `- ${indexedMedicines?.length}`}
              </StyledTypography>
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Button
                  variant='contained'
                  onClick={() => {
                    router.push({
                      pathname: `/hospital/inpatient/${id}/schedule-prescription`,
                      query: {
                        ...router.query,
                        animal_id: patientData?.animal_detail?.animal_id,
                        medical_record_id: patientData.medical_record_id,
                        discharge_tab: 'TransferHospital'
                      }
                    })
                  }}
                >
                  Add New Prescription
                </Button>
              </Box>
            </Box>
            {indexedMedicines?.length > 0 && (
              <CommonTable
                columns={medicationColumnsWithActions}
                loading={isTransferHospitalMedicationLoading}
                indexedRows={indexedMedicines || []}
                rowHeight={64}
                total={indexedMedicines?.length || 0}
                externalTableStyle={{
                  '& .MuiDataGrid-columnHeaders': {
                    '--unstable_DataGrid-headWeight': 600,
                    backgroundColor: theme.palette.customColors.neutral05,
                    fontSize: '0.75rem',
                    color: theme.palette.customColors.OnSurfaceVariant
                  }
                }}
              />
            )}
          </Box>

          <Divider />

          {/* Care Instructions (unchanged) */}
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

          {/* Attachments (unchanged) */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <StyledTypography>Attachments</StyledTypography>
            <ControlledMultiFileUpload
              name={'attachments'}
              control={control}
              errors={errors}
              label='Upload attachment'
            />
          </Box>
        </Box>
        {/* <Box
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
            disabled={submitLoader}
            loading={submitLoader}
            sx={{ px: 12, py: 3 }}
            type='submit'
          >
            Discharge Animal
          </LoadingButton>
        </Box> */}
        <BottomActionBar
          submitLabel='Discharge Animal'
          submitBtnVariant='contained'
          showCancel={false}
          submitBtnStyle={{ px: 12, py: 3 }}
          loading={submitLoader}
          disabled={submitLoader}
          submitBtnProps={{ type: 'submit' }}
        />
      </form>
    </>
  )
}

export default TransferDischargeForm

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 500,
  color: color || theme.palette.customColors.OnSurfaceVariant
}))
