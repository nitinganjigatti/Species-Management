'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Typography, Button, Grid, Paper, IconButton, CircularProgress } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useFieldArray, useWatch } from 'react-hook-form'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import CloseIcon from '@mui/icons-material/Close'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import AddIcon from '@mui/icons-material/Add'
import ControlledSelectWithTextField from 'src/views/forms/form-fields/ControlledSelectWithTextField'
import dayjs from 'dayjs'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import Utility from 'src/utility'
import useSafeRouter from 'src/hooks/useSafeRouter'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'next/navigation'

const STORAGE_KEY = 'medical_record_data'

interface ScheduleMedicineProps {
  control: any
  errors: any
  selectedMedicineTo?: any
  medicalMasterData: any
  isMedicineSelected?: boolean
  batchList?: any[]
  batchLoading?: boolean
  handleBatchSearch?: (value: any) => void
  isControlledSubstance?: boolean
  setValue: any
  getValues: any
  reset: any
  isOneTimeFrequency?: boolean
  stopDate?: any
  endsOn?: any
  loadingSideEffects?: boolean
  patientData?: any
}

export default function ScheduleMedicine({
  control,
  errors,
  selectedMedicineTo,
  medicalMasterData,
  isMedicineSelected,
  batchList = [],
  batchLoading,
  handleBatchSearch,
  isControlledSubstance = false,
  setValue,
  getValues,
  reset,
  isOneTimeFrequency = false,
  stopDate,
  endsOn,
  loadingSideEffects,
  patientData = null
}: ScheduleMedicineProps) {
  const {
    caseTypes,
    prescriptionDosageMeasurementType,
    prescriptionDuration,
    prescriptionFrequency,
    prescriptionDeliveryRoute,
    intervalList
  } = medicalMasterData
  const theme: any = useTheme()
  const hasSetDefaults = useRef(false)

  const now = new Date()
  const router = useSafeRouter()
  const searchParams = useSearchParams()
  const hospitalData: any = useSelector((state: any) => state.hospital.data)
  const medicalRecordData: any = hospitalData[STORAGE_KEY] || {}

  const animal_admitted_date = medicalRecordData?.animal_admitted_date
  const medicine_edit_id = searchParams?.get('medicine_edit_id')
  const fromPage = searchParams?.get('fromPage')
  const date = searchParams?.get('date')
  const discharge_tab = searchParams?.get('discharge_tab')

  const editIdStr = medicine_edit_id?.toString()
  const enclosureMedicines: any[] = hospitalData?.enclosure_medicines || []

  const editingMedicineData: any = editIdStr
    ? enclosureMedicines.find((m: any) => m?.id?.toString() === editIdStr)
    : null

  const [startDateWarning, setStartDateWarning] = useState<string>('')

  const prescriptionStartDate = useWatch({
    control,
    name: 'prescriptionStartDate'
  })

  const prescriptionEndDate = useWatch({
    control,
    name: 'prescriptionEndDate'
  })

  const commonFieldStyles = {
    textAlign: 'left',
    borderRadius: '4px',
    '& .MuiOutlinedInput-root': {
      borderRadius: '4px'
    }
  }

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'schedules',
    keyName: 'fieldId'
  })

  const allSchedules = useWatch({
    control,
    name: 'schedules'
  })

  const shouldRestrictTimeToNow = useMemo(() => {
    if (selectedMedicineTo !== 'Direct Administer') {
      return false
    }

    const isOneTime = isOneTimeFrequency
    if (!isOneTime) {
      return false
    }

    if (!prescriptionStartDate) {
      return false
    }

    const selectedDate = dayjs(prescriptionStartDate)
    const today = dayjs()

    return selectedDate.isSame(today, 'day')
  }, [selectedMedicineTo, isOneTimeFrequency, prescriptionStartDate])

  const isDirectAdministerRegular = useMemo(() => {
    return selectedMedicineTo === 'Direct Administer' && !isOneTimeFrequency
  }, [selectedMedicineTo, isOneTimeFrequency])

  useEffect(() => {
    if (isMedicineSelected && medicalMasterData && !hasSetDefaults.current && intervalList && prescriptionFrequency) {
      const currentTime = dayjs()

      if (prescriptionFrequency && prescriptionFrequency.length > 0) {
        setValue('frequency', prescriptionFrequency[0].value)
      }

      if (intervalList && intervalList?.length > 0) {
        setValue('interval', intervalList[0].value)
      }

      setValue('schedules', [
        {
          time: currentTime,
          quantity: '',
          unit: ''
        }
      ])

      let defaultStartDate = dayjs(date) || dayjs()
      if (patientData?.discharge_at && patientData?.admitted_at) {
        defaultStartDate = dayjs(Utility?.convertUTCToLocal(patientData.admitted_at) || patientData.admitted_at)
      } else if (patientData?.discharge_at) {
        defaultStartDate = dayjs(Utility?.convertUTCToLocal(patientData.discharge_at) || patientData.discharge_at)
      }
      setValue('prescriptionStartDate', defaultStartDate)

      if (isDirectAdministerRegular) {
        let defaultEndDate = dayjs()
        if (patientData?.discharge_at) {
          defaultEndDate = dayjs(Utility?.convertUTCToLocal(patientData.discharge_at) || patientData.discharge_at)
        }
        setValue('prescriptionEndDate', defaultEndDate)
      }

      setValue('dosageDuration.value', '0')

      if (prescriptionDuration && prescriptionDuration.length > 0) {
        setValue('dosageDuration.unit', prescriptionDuration[0].value)
      }

      hasSetDefaults.current = true
    }
  }, [
    isMedicineSelected,
    medicalMasterData,
    prescriptionDosageMeasurementType,
    prescriptionFrequency,
    prescriptionDuration,
    intervalList,
    setValue,
    patientData?.discharge_at,
    patientData?.admitted_at
  ])

  useEffect(() => {
    if (!isMedicineSelected) {
      hasSetDefaults.current = false
    }
  }, [isMedicineSelected])

  useEffect(() => {
    if (patientData?.discharge_at) {
      const dischargeDate = dayjs(patientData.discharge_at)
    }
  }, [patientData?.discharge_at])

  useEffect(() => {
    if (isOneTimeFrequency && fields.length > 1) {
      const firstSchedule = getValues('schedules.0')
      setValue('schedules', [firstSchedule])
    }
  }, [isOneTimeFrequency, fields.length, getValues, setValue])

  const handleAddTime = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()

    const currentSchedules = getValues('schedules')

    const lastScheduleUnit = currentSchedules[currentSchedules.length - 1]?.unit || ''

    const lastScheduleQuantity = currentSchedules[currentSchedules.length - 1]?.quantity || ''

    const lastScheduledTime = currentSchedules[currentSchedules.length - 1]?.time || ''

    const newTime = dayjs(lastScheduledTime).add(2, 'hour')

    append({
      time: newTime,
      quantity: lastScheduleQuantity,
      unit: lastScheduleUnit
    })
  }

  function convertTimeToToday(timeStr: string) {
    if (!timeStr) return dayjs()

    const cleaned = timeStr.replace(/\s*:\s*/g, ':')

    return dayjs(cleaned, ['hh:mm A', 'h:mm A'])
  }

  useEffect(() => {
    if (editingMedicineData) {
      hasSetDefaults.current = true
      const firstBatch = editingMedicineData.batch_list?.[0] || {}

      reset({
        frequency: editingMedicineData.frequency_id || editingMedicineData.frequency || '',
        interval: editingMedicineData.interval_id || '',
        deliveryRoute: editingMedicineData?.delivery_route_name || '',

        prescriptionStartDate: editingMedicineData?.start_date ? dayjs(editingMedicineData.start_date) : null,

        dosageDuration: {
          value: editingMedicineData?.duration_qty || '0',
          unit: editingMedicineData?.duration_type?.toLowerCase() || ''
        },

        notes: editingMedicineData.notes || '',

        wastageQuantity: firstBatch.wastage || '',
        wastageUOM: firstBatch.wastageUnit || '',
        wastageNotes: firstBatch.notes || '',

        batchNumber: firstBatch.batchNumber || null,
        batchImage: firstBatch.files || [],

        schedules: editingMedicineData.schedule_doses?.map((s: any) => ({
          time: s.time ? dayjs(convertTimeToToday(s.time)) : dayjs(),
          quantity: s.quantity || '',
          unit: s.unit_name || ''
        })) || [{ time: dayjs(), quantity: '', unit: '' }],
        selectMedicineType: 'Schedule'
      })
    }
  }, [editingMedicineData, reset, medicalMasterData])

  if (loadingSideEffects)
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: alpha(theme?.palette?.customColors?.deepDark, 0.3),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1299
        }}
      >
        <Paper
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            borderRadius: '8px'
          }}
        >
          <CircularProgress />
        </Paper>
      </Box>
    )

  return (
    <Box
      sx={{
        p: 4,
        textAlign: 'center',
        width: '100%',
        maxHeight: 850,
        overflowY: 'auto',
        background: theme.palette.customColors.OnBackground,
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        '&::-webkit-scrollbar': {
          width: '6px'
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent'
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: theme.palette.customColors.OutlineVariant,
          borderRadius: '3px'
        },
        '&::-webkit-scrollbar-thumb:hover': {
          backgroundColor: theme.palette.customColors.OnSurfaceVariant
        }
      }}
    >
      <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {isMedicineSelected ? (
          <Box
            sx={{
              background: theme.palette.common.white,
              minHeight: 'fit-content',
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              justifyContent: 'flex-start',
              gap: 2,
              padding: '24px',
              width: '100%',
              flex: 1,
              overflowY: 'auto',
              '& .MuiGrid-item': {
                paddingLeft: '8px !important',
                paddingTop: '8px !important'
              }
            }}
          >
            <Typography
              sx={{
                mb: 4,
                fontSize: '20px',
                fontWeight: '500',
                textAlign: 'left',
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              {selectedMedicineTo === 'Direct Administer' ? 'Direct Administer' : 'Schedule Medicine'}
            </Typography>

            <Box sx={{ mb: 3 }}>
              <ControlledSelect
                fullWidth={true}
                name='frequency'
                sx={commonFieldStyles}
                size='large'
                label='Set Frequency*'
                control={control}
                errors={errors}
                options={prescriptionFrequency}
                getOptionLabel={(option: any) => option.label}
                getOptionValue={(option: any) => option.value}
                required
              />
            </Box>

            {!isOneTimeFrequency && (
              <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box
                  sx={{
                    backgroundColor: theme.palette.customColors.OnBackground,
                    padding: '16px 14px',
                    borderRadius: '4px'
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: '500',
                      textAlign: 'left',
                      color: theme.palette.customColors.OnSurface
                    }}
                  >
                    Every
                  </Typography>
                </Box>
                <ControlledSelect
                  fullWidth={true}
                  name='interval'
                  sx={commonFieldStyles}
                  size='large'
                  label='Set Interval*'
                  control={control}
                  errors={errors}
                  options={intervalList}
                  getOptionLabel={(option: any) => option.label}
                  getOptionValue={(option: any) => option.value}
                  required
                />
              </Box>
            )}

            {fields.map((field: any, idx: number) => (
              <Grid
                container
                spacing={2}
                key={field.fieldId}
                sx={{
                  mb: 3,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  '& .MuiFormControl-root': {
                    width: '100%'
                  }
                }}
              >
                <Grid size={4.5}>
                  <ControlledTimePicker
                    name={`schedules.${idx}.time`}
                    label='Time*'
                    control={control}
                    errors={errors}
                    placeholder='12:30 PM'
                    required
                    sx={commonFieldStyles}
                    size='large'
                    maxTime={shouldRestrictTimeToNow ? dayjs() : undefined}
                    helperText={shouldRestrictTimeToNow ? "Time cannot be in future for today's date" : undefined}
                  />
                </Grid>

                <Grid size={fields?.length > 1 ? 6.5 : 7.5}>
                  <ControlledSelectWithTextField
                    {...({
                      textFieldName: `schedules.${idx}.quantity`,
                      selectFieldName: `schedules.${idx}.unit`,
                      control,
                      errors,
                      options: prescriptionDosageMeasurementType,
                      label: 'Quantity*',
                      placeholder: 'Enter quantity',
                      type: 'number',
                      selectWidth: { xs: 80, sm: 100, md: 100, lg: 120 },
                      getOptionLabel: (option: any) => option.label,
                      getOptionValue: (option: any) => option.value,
                      sx: commonFieldStyles,
                      size: 'large',
                      required: true,
                      maxDecimals: 4
                    } as any)}
                  />
                </Grid>

                {fields?.length > 1 && (
                  <Grid
                    size={1}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      pt: '20px !important'
                    }}
                  >
                    <IconButton
                      onClick={() => remove(idx)}
                      size='small'
                      sx={{
                        mt: '-4px'
                      }}
                    >
                      <CloseIcon fontSize='small' />
                    </IconButton>
                  </Grid>
                )}
              </Grid>
            ))}

            {!isOneTimeFrequency && (
              <Button
                startIcon={<AddIcon />}
                variant='outlined'
                fullWidth
                sx={{
                  mb: 3,
                  height: '48px',
                  fontSize: '16px',
                  background: theme.palette.customColors.SurfaceVariant,
                  color: theme.palette.customColors.OnSurface,
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 500,
                  padding: '10px 12px'
                }}
                onClick={handleAddTime}
              >
                Add Time
              </Button>
            )}

            <Box sx={{ mb: 3 }}>
              <ControlledSelect
                name='deliveryRoute'
                label='Select Delivery Route*'
                fullWidth={true}
                sx={{
                  textAlign: 'left',
                  borderRadius: '4px'
                }}
                size='large'
                control={control}
                errors={errors}
                options={prescriptionDeliveryRoute}
                getOptionLabel={(option: any) => option.label}
                getOptionValue={(option: any) => option.value}
                required
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box>
                <ControlledDatePicker
                  fullWidth={true}
                  sx={commonFieldStyles}
                  minDate={fromPage === 'prescriptionDetail' ? dayjs(stopDate) : dayjs(animal_admitted_date)}
                  maxDate={
                    patientData?.discharge_at
                      ? dayjs(patientData.discharge_at)
                      : selectedMedicineTo === 'Direct Administer'
                      ? dayjs(now)
                      : undefined
                  }
                  size='large'
                  name='prescriptionStartDate'
                  label={
                    isDirectAdministerRegular
                      ? 'Prescription Start Date*'
                      : selectedMedicineTo === 'Direct Administer'
                      ? 'Prescription Start Date*'
                      : 'Prescription Start Date*'
                  }
                  control={control}
                  errors={errors}
                  required
                />
              </Box>
            </Box>

            {isDirectAdministerRegular && (
              <Box sx={{ mb: 3 }}>
                <ControlledDatePicker
                  fullWidth={true}
                  sx={commonFieldStyles}
                  minDate={dayjs(animal_admitted_date)}
                  maxDate={patientData?.discharge_at ? dayjs(patientData.discharge_at) : dayjs(now)}
                  size='large'
                  name='prescriptionEndDate'
                  label='Prescription End Date*'
                  control={control}
                  errors={errors}
                  required
                />
              </Box>
            )}

            {!isOneTimeFrequency && !isDirectAdministerRegular && (
              <>
                <Grid container display='flex' justifyContent={'space-between'} spacing={2}>
                  <Grid size={{ xs: 6, md: 6, lg: 6 }}>
                    <ControlledTextField
                      name='dosageDuration.value'
                      label='Dosage Duration*'
                      control={control}
                      errors={errors}
                      type='number'
                      sx={{
                        textAlign: 'left',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '4px'
                        }
                      }}
                      size='large'
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 6, md: 6, lg: 6 }}>
                    <ControlledSelect
                      name='dosageDuration.unit'
                      sx={{
                        textAlign: 'left',
                        borderRadius: '4px'
                      }}
                      size='large'
                      control={control}
                      errors={errors}
                      options={prescriptionDuration}
                      required
                      getOptionLabel={(option: any) => option.label}
                      getOptionValue={(option: any) => option.value}
                    />
                  </Grid>
                </Grid>
              </>
            )}

            {endsOn && selectedMedicineTo !== 'Direct Administer' && (
              <Typography
                sx={{
                  display: 'flex',
                  fontSize: '14px',
                  fontWeight: '500',
                  fontStyle: 'italic',
                  color: theme.palette.customColors.OnSurface,
                  mb: 3,
                  mt: 2
                }}
              >
                {`Prescription ends on ${endsOn}`}
              </Typography>
            )}

            <Box sx={{ mb: 3 }}>
              <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, mb: 2, textAlign: 'left' }}>
                Notes
              </Typography>
              <ControlledTextArea
                fullWidth={true}
                sx={{
                  textAlign: 'left',
                  background: '#FFF9E5',
                  borderRadius: '4px',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '4px'
                  }
                }}
                name='notes'
                placeholder='Enter Notes'
                control={control}
                errors={errors}
                rows={4}
              />
            </Box>
            {selectedMedicineTo === 'Direct Administer' && (
              <>
                <Grid container display='flex' justifyContent={'space-between'} spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 12, md: 12, lg: 12 }}>
                    <Typography
                      sx={{
                        mb: 1,
                        fontSize: '16px',
                        fontWeight: '500',
                        textAlign: 'left',
                        color: theme.palette.customColors.OnSurfaceVariant
                      }}
                    >
                      Add Wastage & Batch Number
                      <span
                        style={{
                          color: theme.palette.customColors.neutralSecondary,
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        (Optional)
                      </span>
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, md: 6, lg: 6 }}>
                    <ControlledTextField
                      name='wastageQuantity'
                      label='Quantity'
                      control={control}
                      errors={errors}
                      type='number'
                      sx={{
                        textAlign: 'left',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '4px'
                        }
                      }}
                      size='large'
                    />
                  </Grid>
                  <Grid size={{ xs: 6, md: 6, lg: 6 }}>
                    <ControlledSelect
                      name='wastageUOM'
                      label={'UOM'}
                      sx={{
                        textAlign: 'left',
                        borderRadius: '4px'
                      }}
                      size='large'
                      control={control}
                      errors={errors}
                      options={prescriptionDosageMeasurementType}
                      getOptionLabel={(option: any) => option.label}
                      getOptionValue={(option: any) => option.value}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, mb: 2, textAlign: 'left' }}>
                    Notes
                  </Typography>
                  <ControlledTextArea
                    fullWidth={true}
                    sx={{
                      textAlign: 'left',
                      borderRadius: '4px',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '4px'
                      }
                    }}
                    name='wastageNotes'
                    placeholder='Enter Notes'
                    control={control}
                    errors={errors}
                    rows={2}
                  />
                </Box>
                <Grid size={{ xs: 12, md: 12, lg: 12 }}>
                  <Typography
                    sx={{
                      mb: 1,
                      fontSize: '12px',
                      fontWeight: '500',
                      textAlign: 'left',
                      my: 2,
                      color: isControlledSubstance
                        ? theme.palette.error.main
                        : theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    {isControlledSubstance
                      ? '! Batch Number is Mandatory for controlled substances'
                      : '! Batch Number is Mandatory for controlled substances'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 12, lg: 12 }}>
                  <ControlledAutocomplete
                    name='batchNumber'
                    control={control}
                    errors={errors}
                    sx={commonFieldStyles}
                    label={
                      isControlledSubstance ? 'Enter batch number (required)' : 'Enter batch number if any (optional)'
                    }
                    options={batchList}
                    getOptionLabel={(option: any) => {
                      if (typeof option === 'string') return option

                      return option?.batch_no || ''
                    }}
                    getOptionValue={(option: any) => {
                      if (typeof option === 'string') return option

                      return option?.batch_no || ''
                    }}
                    isOptionEqualToValue={(option: any, value: any) => {
                      if (!option || !value) return false
                      const optionVal = typeof option === 'string' ? option : option?.batch_no
                      const valueVal = typeof value === 'string' ? value : value?.batch_no

                      return optionVal === valueVal
                    }}
                    loading={batchLoading}
                    onInputChange={handleBatchSearch}
                    required={isControlledSubstance}
                    autocompleteProps={{
                      filterOptions: (x: any) => x,
                      noOptionsText: batchLoading ? 'Loading...' : 'Type to search batches'
                    }}
                  />
                </Grid>
                <ControlledMultiFileUpload
                  name='batchImage'
                  control={control}
                  errors={errors}
                  sx={commonFieldStyles}
                  label='Batch Image'
                  maxFiles={1}
                  maxFileSize={5 * 1024 * 1024}
                  acceptedFileTypes='images'
                />
              </>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              background: theme.palette.common.white,
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              justifyContent: 'flex-start',
              gap: 2,
              padding: '24px',
              width: '100%',
              flex: 1,
              overflowY: 'auto',
              '& .MuiGrid-item': {
                paddingLeft: '8px !important',
                paddingTop: '8px !important'
              }
            }}
          >
            <Typography
              sx={{
                fontSize: '16px',
                fontWeight: '500',
                textAlign: 'center',
                color: theme.palette.customColors.neutralSecondary
              }}
            >
              Please select a medicine to schedule.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}
