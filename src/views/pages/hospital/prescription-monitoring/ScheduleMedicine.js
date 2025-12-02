import React, { useEffect, useRef } from 'react'
import { Box, Typography, Button, Grid, Paper, IconButton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useFieldArray, useWatch } from 'react-hook-form'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import CloseIcon from '@mui/icons-material/Close'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import AddIcon from '@mui/icons-material/Add'
import ControlledSelectWithTextField from 'src/views/forms/form-fields/ControlledSelectWithTextField'
import ControlledFileUpload from 'src/views/forms/form-fields/ControlledFileUpload'
import dayjs from 'dayjs'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import Utility from 'src/utility'
import { useRouter } from 'next/router'
import moment from 'moment'
import { useDynamicStateContext } from 'src/context/DynamicStatesContext'

const STORAGE_KEY = 'medical_record_data'

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
  endsOn
}) {
  const {
    caseTypes,
    prescriptionDosageMeasurementType,
    prescriptionDuration,
    prescriptionFrequency,
    prescriptionDeliveryRoute
  } = medicalMasterData
  const theme = useTheme()
  const hasSetDefaults = useRef(false)

  const now = new Date()
  const router = useRouter()
  const { data } = useDynamicStateContext()
  const medicalRecordData = data[STORAGE_KEY] || {}

  const animal_admitted_date = medicalRecordData?.animal_admitted_date

  // Common styles for form fields
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

  // Watch all schedules
  const allSchedules = useWatch({
    control,
    name: 'schedules'
  })

  // Set default values when medicine is selected
  useEffect(() => {
    if (isMedicineSelected && medicalMasterData && !hasSetDefaults.current) {
      const currentTime = dayjs()

      // Set default frequency (first item)
      if (prescriptionFrequency && prescriptionFrequency.length > 0) {
        setValue('frequency', prescriptionFrequency[0].value)
      }

      // Set default schedule with current time and EMPTY unit
      setValue('schedules', [
        {
          time: currentTime,
          quantity: '',
          unit: '' // Empty by default
        }
      ])

      // Set default prescription start date to today
      setValue('prescriptionStartDate', dayjs())

      // Set default dosage duration to 1
      setValue('dosageDuration.value', '1')

      // Set default dosage unit (first item)
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
    setValue
  ])

  // Reset the flag when medicine is deselected
  useEffect(() => {
    if (!isMedicineSelected) {
      hasSetDefaults.current = false
    }
  }, [isMedicineSelected])

  // Remove extra schedules when switching to "one_time" frequency
  useEffect(() => {
    if (isOneTimeFrequency && fields.length > 1) {
      // Keep only the first schedule
      const firstSchedule = getValues('schedules.0')
      setValue('schedules', [firstSchedule])
    }
  }, [isOneTimeFrequency, fields.length, getValues, setValue])

  // Handler for adding new time slot
  const handleAddTime = e => {
    e.preventDefault()

    // Get the current schedules
    const currentSchedules = getValues('schedules')

    // Get the unit from the last schedule (previous index)
    const lastScheduleUnit = currentSchedules[currentSchedules.length - 1]?.unit || ''

    // Add new schedule with the previous schedule's unit
    append({
      time: dayjs(),
      quantity: '',
      unit: lastScheduleUnit
    })
  }

  return (
    <Box
      sx={{
        p: 4,
        textAlign: 'center',
        width: '100%',

        // height: '100%',
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
            container
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

              // maxWidth: '420px',
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
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
                required
              />
            </Box>

            {/* <Box sx={{ mb: 3 }}>
              <ControlledSelect
                fullWidth={true}
                name='doseType'
                label='Select Dose Type*'
                sx={{
                  textAlign: 'left',
                  borderColor: `${theme.palette.customColors.OutlineVariant} !important`,
                  borderRadius: '4px',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '4px',
                    borderColor: `${theme.palette.customColors.OutlineVariant} !important`
                  }
                }}
                size='large'
                control={control}
                errors={errors}
                options={prescriptionDosageMeasurementType}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
                required
              />
            </Box> */}

            {fields.map((field, idx) => (
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
                <Grid item size={4.5}>
                  <ControlledTimePicker
                    name={`schedules.${idx}.time`}
                    label='Time*'
                    control={control}
                    errors={errors}
                    placeholder='12:30 PM'
                    required
                    sx={commonFieldStyles}
                    size='large'
                  />
                </Grid>

                <Grid item size={fields?.length > 1 ? 6.5 : 7.5}>
                  <ControlledSelectWithTextField
                    textFieldName={`schedules.${idx}.quantity`}
                    selectFieldName={`schedules.${idx}.unit`}
                    control={control}
                    errors={errors}
                    options={prescriptionDosageMeasurementType}
                    label='Quantity*'
                    placeholder='Enter quantity'
                    type='number'
                    getOptionLabel={option => option.label}
                    getOptionValue={option => option.value}
                    sx={commonFieldStyles}
                    size='large'
                    required
                  />
                </Grid>

                {fields?.length > 1 && (
                  <Grid
                    item
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

            {/* Conditionally render "Add Time" button */}
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
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
                required
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ mb: 3 }}>
                <ControlledDatePicker
                  fullWidth={true}
                  sx={commonFieldStyles}
                  minDate={
                    selectedMedicineTo === 'Direct Administer'
                      ? dayjs(animal_admitted_date)
                      : dayjs(animal_admitted_date)
                  }
                  maxDate={selectedMedicineTo === 'Direct Administer' ? dayjs(now) : undefined}
                  size='large'
                  name='prescriptionStartDate'
                  label={
                    selectedMedicineTo === 'Direct Administer' ? 'Prescription End Date*' : 'Prescription Start Date*'
                  }
                  control={control}
                  errors={errors}
                  required
                />
              </Box>
            </Box>

            {/* Conditionally render Dosage Duration */}
            {!isOneTimeFrequency && (
              <>
                <Grid container display='flex' justifyContent={'space-between'} spacing={2}>
                  <Grid item size={{ xs: 6, md: 6, lg: 6 }}>
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
                  <Grid item size={{ xs: 6, md: 6, lg: 6 }}>
                    <ControlledSelect
                      name='dosageDuration.unit'
                      // label='Dosage Unit*'
                      sx={{
                        textAlign: 'left',
                        borderRadius: '4px'
                      }}
                      size='large'
                      control={control}
                      errors={errors}
                      options={prescriptionDuration}
                      required
                      getOptionLabel={option => option.label}
                      getOptionValue={option => option.value}
                    />
                  </Grid>
                </Grid>
                {endsOn && (
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
                    Prescription {selectedMedicineTo === 'Direct Administer' ? 'starts' : 'ends'} on {endsOn}
                  </Typography>
                )}
              </>
            )}

            {isOneTimeFrequency && endsOn && (
              <Typography
                sx={{
                  display: 'flex',
                  fontSize: '14px',
                  fontWeight: '500',
                  fontStyle: 'italic',
                  color: theme.palette.customColors.OnSurface,
                  mb: 3
                }}
              >
                Prescription {selectedMedicineTo === 'Direct Administer' ? 'starts and ends' : 'starts and ends'} on{' '}
                {endsOn}
              </Typography>
            )}

            <Box sx={{ mb: 3 }}>
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
                label='Enter Notes'
                control={control}
                errors={errors}
                rows={4}
              />
            </Box>
            {selectedMedicineTo === 'Direct Administer' && (
              <>
                <Grid container display='flex' justifyContent={'space-between'} spacing={2} sx={{ mb: 3 }}>
                  <Grid item size={{ xs: 12, md: 12, lg: 12 }}>
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
                  <Grid item size={{ xs: 6, md: 6, lg: 6 }}>
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
                  <Grid item size={{ xs: 6, md: 6, lg: 6 }}>
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
                      getOptionLabel={option => option.label}
                      getOptionValue={option => option.value}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ mb: 3 }}>
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
                    label='Enter Notes'
                    control={control}
                    errors={errors}
                    rows={2}
                  />
                </Box>
                <Grid item size={{ xs: 12, md: 12, lg: 12 }}>
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
                <Grid item size={{ xs: 12, md: 12, lg: 12 }}>
                  <ControlledAutocomplete
                    name='batchNumber'
                    control={control}
                    errors={errors}
                    sx={commonFieldStyles}
                    label={
                      isControlledSubstance ? 'Enter batch number (required)' : 'Enter batch number if any (optional)'
                    }
                    options={batchList}
                    getOptionLabel={option => {
                      if (typeof option === 'string') return option

                      return option?.batch_no || ''
                    }}
                    getOptionValue={option => {
                      if (typeof option === 'string') return option

                      return option?.batch_no || ''
                    }}
                    isOptionEqualToValue={(option, value) => {
                      if (!option || !value) return false
                      const optionVal = typeof option === 'string' ? option : option?.batch_no
                      const valueVal = typeof value === 'string' ? value : value?.batch_no

                      return optionVal === valueVal
                    }}
                    loading={batchLoading}
                    onInputChange={handleBatchSearch}
                    required={isControlledSubstance}
                    autocompleteProps={{
                      filterOptions: x => x,
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
                  maxFileSize={5 * 1024 * 1024} // 5MB
                  acceptedFileTypes='image,pdf'
                />
              </>
            )}
          </Box>
        ) : (
          <Box
            container
            sx={{
              background: theme.palette.common.white,

              // minHeight: 'fit-content',
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