'use client'

import React, { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Button, Divider, Grid, IconButton, Tooltip, Typography, useTheme } from '@mui/material'
import { alpha, styled } from '@mui/system'
import Icon from 'src/@core/components/icon'

import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import { useDispatch, useSelector } from 'react-redux'
import { updateState } from 'src/store/slices/hospital/hospitalSlice'
import TemplateSection from 'src/components/hospital/discharge/TemplateSection'

import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller } from 'react-hook-form'
import { useParams, useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import BottomActionBar from 'src/views/utility/BottomActionBar'

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

interface TransferDischargeFormProps {
  patientData?: any
  watchDischargeType?: any
  isLoadingHospital?: boolean
  hospitalData?: any[]
  handleHospitalSearch?: any
  prescriptionsColumns?: any[]
  prescriptionData?: any[]
  isPrescriptionLoading?: boolean
  submitLoader?: boolean
  handleSubmitData?: any
  medicationsColumns?: any[]
  isTransferHospitalMedicationLoading?: boolean
  clearData?: any
  onDirtyChange?: (isDirty: boolean) => void
}

const TransferDischargeForm = (props: TransferDischargeFormProps) => {
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

  const { t } = useTranslation()
  const theme: any = useTheme()
  const params = useParams()
  const router: any = useRouter()
  const { id }: any = params

  const patientDetails: any = patientData?.animal_detail || {}
  const dispatch = useDispatch()
  const hospitalStoreData: any = useSelector((state: any) => state.hospital.data)

  const transferMedicines: any[] = useMemo(
    () => hospitalStoreData.transfer_medicines || [],
    [hospitalStoreData.transfer_medicines]
  )

  const indexedMedicines = useMemo(
    () =>
      transferMedicines.map((data: any, i: number) => ({
        ...data,
        sl_no: i + 1
      })),
    [transferMedicines]
  )

  const defaultValues: any = useMemo(
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
    resolver: yupResolver(transferHospitalSchema as any),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  const handleEditMedicine = useCallback(
    (med: any) => {
      dispatch(updateState({ key: 'transfer_medicines', value: transferMedicines }))

      router.push(`/hospital/inpatient/${id}/schedule-prescription?animal_id=${patientData?.animal_detail?.animal_id}&medical_record_id=${patientData?.medical_record_id}&discharge_tab=TransferHospital&edit_id=${med.id}`)
    },
    [router, id, patientData, dispatch, transferMedicines]
  )

  const handleDeleteMedicine = useCallback(
    (medId: any) => {
      const updated = transferMedicines.filter((med: any) => med.id !== medId)
      dispatch(updateState({ key: 'transfer_medicines', value: updated }))
      onDirtyChange?.(true)
    },
    [transferMedicines, dispatch, onDirtyChange]
  )

  const medicationColumnsWithActions = useMemo(
    () =>
      (medicationsColumns || []).map((col: any) =>
        col.field === 'actions'
          ? {
              ...col,
              renderCell: (params: any) => (
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

  const onSubmit = async (formData: any) => {
    const payload: any = {
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
      clearData()
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
                  label={(t('hospital_module.select_hospital') as string)}
                  options={hospitalData}
                  getOptionLabel={(option: any) => option?.label || ''}
                  getOptionValue={(option: any) => option?.value || ''}
                  isOptionEqualToValue={(option: any, value: any) => option?.value === value?.value}
                  onInputChange={(value: any) => handleHospitalSearch(value)}
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
                  label={(t('date') as string)}
                  errors={errors}
                  minDate={dayjs(patientData?.admitted_at)}
                  maxDate={dayjs(new Date())}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledTimePicker control={control} name={'discharge_time'} label={(t('time') as string)} errors={errors} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <ControlledTextArea
                  control={control}
                  errors={errors}
                  name='reason_for_transfer'
                  placeholder={(t('hospital_module.enter_reason_for_transfer') as string)}
                  fullWidth
                  rows={2}
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

          {(prescriptionData?.length ?? 0) > 0 && (
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
                    {t('hospital_module.active_prescriptions')} - {prescriptionData?.length}
                  </StyledTypography>

                  <StyledTypography fontSize='0.875rem'>
                    {t('hospital_module.you_can_stop_prescriptions')}
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
                {t('hospital_module.medications')} {indexedMedicines?.length > 0 && `- ${indexedMedicines?.length}`}
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
                  {t('hospital_module.add_new_prescription')}
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

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <StyledTypography fontSize='1.25rem'>{t('hospital_module.care_instructions')}</StyledTypography>

            <ControlledTextField
              control={control}
              name={'care_diet_instruction'}
              errors={errors}
              placeholder={(t('enter_text') as string)}
              label={(t('hospital_module.enter_diet_instructions') as string)}
            />
            <ControlledTextField
              control={control}
              name={'care_restriction'}
              errors={errors}
              placeholder={(t('enter_text') as string)}
              label={(t('hospital_module.enter_restriction_activities_with_duration') as string)}
            />
            <ControlledTextField
              inputBackgroundColor={alpha(theme.palette.customColors.antzNotes, 0.6)}
              placeholder={(t('enter_text') as string)}
              control={control}
              name={'care_notes'}
              errors={errors}
              label={(t('hospital_module.additional_notes') as string)}
            />
          </Box>

          <Divider />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <StyledTypography>{t('hospital_module.attachments')}</StyledTypography>
            <ControlledMultiFileUpload
              name={'attachments'}
              control={control}
              errors={errors}
              label={(t('hospital_module.upload_attachment') as string)}
            />
          </Box>
        </Box>
        <BottomActionBar
          {...({
            submitLabel: t('hospital_module.discharge_animal'),
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

export default TransferDischargeForm

const StyledTypography = styled(Typography)<{ fontWeight?: number; fontSize?: string; color?: string }>(
  ({ theme, fontWeight, fontSize, color }: any) => ({
    fontSize: fontSize || '1rem',
    fontWeight: fontWeight || 500,
    color: color || theme.palette.customColors.OnSurfaceVariant
  })
)
