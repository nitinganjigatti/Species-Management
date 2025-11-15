import React, { useEffect } from 'react'
import { Dialog, DialogContent, Box, Typography, IconButton, Grid, Card, CardContent } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledSelectWithTextField from 'src/views/forms/form-fields/ControlledSelectWithTextField'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import TreatmentTypeRadioButtons from '../utility/TreatmentTypeRadioButtons'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import Utility from 'src/utility'
import dayjs from 'dayjs'

const AdministerOrSkipModal = ({
  open,
  handleClose,
  onSubmit,
  submitLoader,
  medicineData,
  medicalMasterData,
  mastersDataLoading,
  batchList = [],
  batchLoading,
  handleBatchSearch,
  isControlledSubstance = false,
  scheduledDate
}) => {
  const theme = useTheme()

  // Yup validation schema
  const validationSchema = yup.object().shape({
    action: yup.string().oneOf(['administer', 'skipped']).required('Action is required'),
    time: yup.string().when('action', {
      is: 'administer',
      then: schema => schema.required('Time is required for administration'),
      otherwise: schema => schema.notRequired()
    }),
    
    // time: yup.string().when('action', {
    //   is: 'administer',
    //   then: schema =>
    //     schema
    //       .required('Time is required for administration')
    //       .test('valid-time-slot', 'Time must be within the scheduled slot', function (value) {
    //         if (!value || !slotStart || !slotEnd) return true

    //         const selectedTime = dayjs(value, 'hh:mm A')
    //         if (!selectedTime.isValid()) return false

    //         const isAfterOrEqual = selectedTime.isAfter(slotStart.subtract(1, 'minute'))
    //         const isBeforeOrEqual = selectedTime.isBefore(slotEnd.add(1, 'minute'))

    //         return isAfterOrEqual && isBeforeOrEqual
    //       }),
    //   otherwise: schema => schema.notRequired()
    // }),
    quantity: yup.string().when('action', {
      is: 'administer',
      then: schema =>
        schema
          .required('Quantity is required for administration')
          .test('is-valid-number', 'Quantity must be a valid number', value => {
            if (!value) return false
            const num = parseFloat(value)

            return !isNaN(num) && num > 0
          })
          .test('min-value', 'Quantity must be greater than 0', value => {
            if (!value) return false

            return parseFloat(value) > 0
          }),
      otherwise: schema => schema.notRequired()
    }),
    quantityUnit: yup.string().when('action', {
      is: 'administer',
      then: schema => schema.required('Quantity unit is required for administration'),
      otherwise: schema => schema.notRequired()
    }),
    skipReason: yup.string().when('action', {
      is: 'skipped',
      then: schema =>
        schema
          .required('Skip reason is required when skipping medication')
          .min(5, 'Skip reason must be at least 5 characters long')
          .max(500, 'Skip reason cannot exceed 500 characters'),
      otherwise: schema => schema.notRequired()
    }),
    wastageQuantity: yup
      .string()
      .test('is-valid-number', 'Wastage quantity must be a valid number', value => {
        if (!value) return true // Optional field
        const num = parseFloat(value)

        return !isNaN(num) && num >= 0
      })
      .test('wastage-unit-consistency', 'Wastage unit is required when wastage quantity is provided', function (value) {
        const { wastageUnit } = this.parent
        if (value && !wastageUnit) {
          return this.createError({ message: 'Wastage unit is required when wastage quantity is provided' })
        }

        return true
      }),
    wastageUnit: yup
      .string()
      .test(
        'wastage-quantity-consistency',
        'Wastage quantity is required when wastage unit is provided',
        function (value) {
          const { wastageQuantity } = this.parent
          if (value && !wastageQuantity) {
            return this.createError({ message: 'Wastage quantity is required when wastage unit is provided' })
          }

          return true
        }
      ),
    notes: yup.string().max(10000, 'Notes cannot exceed 10000 characters'),

    batchNumber: yup.mixed().when('action', {
      is: 'administer',
      then: schema =>
        isControlledSubstance
          ? schema
              .required('Batch number is required for controlled substances')
              .test('valid-batch-object', 'Please select a valid batch', value => {
                if (!value) return false

                // Check if it's a valid batch object with batch_no
                return value && value.batch_no && typeof value.batch_no === 'string'
              })
          : schema.nullable().notRequired(),
      otherwise: schema => schema.nullable().notRequired()
    })
  })

  const defaultValues = {
    action: 'administer',
    time: '',
    quantity: '',
    quantityUnit: '',
    wastageQuantity: '',
    wastageUnit: '',
    notes: '',
    batchNumber: null,
    attachment: null,
    skipReason: ''
  }

  useEffect(() => {
    reset(defaultValues)
  }, [])

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: defaultValues,
    resolver: yupResolver(validationSchema),
    mode: 'onChange'
  })

  const slotStart = medicineData?.scheduledTime ? dayjs(medicineData.scheduledTime, 'hh:mm A') : null

  const slotEnd = slotStart ? slotStart.add(59, 'minute') : null

  useEffect(() => {
    if (medicineData && medicalMasterData) {
      let updatedQuantity = ''
      let updatedQuantityUnit = ''

      if (medicineData?.dosage) {
        console.log('medicineData?.dosage', medicineData?.dosage)

        const [value, unitRaw] = medicineData.dosage.split(' ')
        console.log('value, unitRaw', value, unitRaw)

        updatedQuantity = value

        const foundUnit = medicalMasterData?.prescriptionMeasurementType?.find(item => item?.unit_name === unitRaw)
        console.log('foundUnit', foundUnit)

        // Ensure the unit object has the expected structure
        updatedQuantityUnit = foundUnit ? { ...foundUnit, value: foundUnit.key, label: foundUnit.unit_name } : null
      }

      reset(prev => ({
        ...prev,
        quantity: updatedQuantity,
        quantityUnit: updatedQuantityUnit?.unit_name
      }))
    }
  }, [medicineData, medicalMasterData, reset])

  const actionType = watch('action')

  const handleModalClose = () => {
    reset()
    handleClose()
  }

  const onFormSubmit = data => {
    onSubmit(data)
  }

  return (
    <Dialog
      open={open}
      onClose={handleModalClose}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 1,
            maxWidth: '562px'
          }
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.customColors.OnPrimary
        }}
      >
        {/* Title Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 6,
            borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Activity Icon' />
              <Typography
                sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
              >
                Administer / Skip
              </Typography>
            </Box>
          </Box>
          <IconButton size='small' onClick={handleModalClose} sx={{ color: theme.palette.text.primary, p: 0 }}>
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>

        {/* Medicine Info Section */}
        <Box
          sx={{
            display: 'flex',
            flexFlow: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 6,
            py: 3,
            backgroundColor: theme.palette.customColors.OnPrimary
          }}
        >
          <Typography
            sx={{
              fontSize: '1rem',
              fontWeight: 500,
              color: theme.palette.primary.deepDark
            }}
          >
            {medicineData?.data?.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarTodayIcon sx={{ fontSize: 18, color: theme.palette.customColors.OnSurfaceVariant }} />
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                {Utility.formatDisplayDate(scheduledDate)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              <AccessTimeIcon sx={{ fontSize: 18, color: theme.palette.customColors.OnSurfaceVariant }} />
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                {medicineData?.scheduledTime}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <DialogContent sx={{ p: 6 }}>
        <Card
          sx={{
            borderRadius: 1,
            border: `1px solid ${theme.palette.customColors.SurfaceVariant}`,
            boxShadow: 0
          }}
        >
          <CardContent sx={{ p: 6 }}>
            <form onSubmit={handleSubmit(onFormSubmit)}>
              <Grid container spacing={4}>
                {/* Radio Buttons for Action Type */}
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name='action'
                    control={control}
                    render={({ field }) => (
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TreatmentTypeRadioButtons
                          label='Administer'
                          isSelected={field.value === 'administer'}
                          onClick={() => field.onChange('administer')}
                          radioPosition='right'
                          sx={{ flex: 1 }}
                        />
                        <TreatmentTypeRadioButtons
                          label='Skipped'
                          isSelected={field.value === 'skipped'}
                          onClick={() => field.onChange('skipped')}
                          radioPosition='right'
                          borderColor={theme.palette.customColors.OutlineVariant}
                          sx={{ flex: 1 }}
                        />
                      </Box>
                    )}
                  />
                </Grid>

                {/* Common Fields - Time and Quantity */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <ControlledTimePicker
                    name='time'

                    // minTime={slotStart?.toDate()}
                    // maxTime={slotEnd?.toDate()}
                    // disableIgnoringDatePart={true}
                    control={control}
                    label='Time'
                    format='hh:mm A'
                    sx={{ backgroundColor: theme.palette.customColors.Surface }}
                    error={errors.time}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ControlledSelectWithTextField
                    textFieldName='quantity'
                    selectFieldName='quantityUnit'
                    control={control}
                    errors={errors}
                    options={medicalMasterData?.prescriptionMeasurementType}
                    label='Quantity'
                    loading={mastersDataLoading}
                    placeholder='Enter quantity'
                    type='number'
                    getOptionLabel={option => option.label}
                    getOptionValue={option => option.value}
                    required={actionType === 'administer'}
                    selectWidth={80}
                  />
                </Grid>

                {/* Conditional Content based on Action Type */}
                {actionType === 'administer' ? (
                  <>
                    {/* Wastage Section for Administer */}
                    <Grid size={{ xs: 12 }}>
                      <Typography
                        sx={{
                          fontSize: '1rem',
                          fontWeight: 500,
                          color: theme.palette.customColors.OnSurfaceVariant,
                          mb: 3
                        }}
                      >
                        Add wastage if any
                        <Typography
                          component='span'
                          sx={{
                            fontSize: '1rem',
                            color: theme.palette.customColors.neutralSecondary,
                            ml: 1
                          }}
                        >
                          (Optional)
                        </Typography>
                      </Typography>

                      <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <ControlledTextField
                            name='wastageQuantity'
                            control={control}
                            errors={errors}
                            label='Quantity'
                            placeholder='Enter Quantity'
                            type='number'
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                          <ControlledSelect
                            name='wastageUnit'
                            label='Unit'
                            control={control}
                            errors={errors}
                            options={medicalMasterData?.prescriptionMeasurementType}
                            getOptionLabel={option => option.label}
                            getOptionValue={option => option.value}
                          />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                          <ControlledTextArea
                            label='Notes'
                            name='notes'
                            control={control}
                            errors={errors}
                            placeholder='Enter Notes'
                            rows={3}
                          />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                          <ControlledAutocomplete
                            name='batchNumber'
                            control={control}
                            errors={errors}
                            label={
                              isControlledSubstance
                                ? 'Enter batch number (required)'
                                : 'Enter batch number if any (optional)'
                            }
                            options={batchList}
                            getOptionLabel={option => {
                              if (typeof option === 'string') return option

                              // Use the label property from your batch object
                              return option?.label || option?.batch_no || ''
                            }}
                            getOptionValue={option => {
                              if (typeof option === 'string') return option

                              // Return the entire object so we have access to batch_no, id, etc.
                              return option
                            }}
                            isOptionEqualToValue={(option, value) => {
                              if (!option || !value) return false

                              // Compare by id since that's unique
                              const optionId = option?.id
                              const valueId = value?.id

                              return optionId === valueId
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

                        <Grid size={{ xs: 12 }}>
                          <ControlledMultiFileUpload
                            name='attachment'
                            control={control}
                            errors={errors}
                            label='Batch Image'
                            maxFiles={5}
                            maxFileSize={5 * 1024 * 1024} // 5MB
                            acceptedFileTypes='image/jpeg,image/png,image/jpg,application/pdf'
                          />
                        </Grid>
                      </Grid>
                    </Grid>
                  </>
                ) : (
                  <>
                    {/* Reason for Skip Section */}
                    <Grid size={{ xs: 12 }}>
                      <ControlledTextArea
                        label='Reason For Skip'
                        name='skipReason'
                        control={control}
                        errors={errors}
                        placeholder='Enter reason for skipping'
                        rows={4}
                        required={actionType === 'skipped'}
                      />
                    </Grid>
                  </>
                )}

                {/* Hidden submit button for form submission */}
                <button type='submit' style={{ display: 'none' }} />
              </Grid>
            </form>
          </CardContent>
        </Card>
      </DialogContent>

      {/* Footer Buttons */}
      <Box
        sx={{
          p: 6,
          display: 'flex',
          justifyContent: 'center',
          gap: 6,
          boxShadow: '0px -2px 6px rgba(0, 0, 0, 0.1)',
          backgroundColor: theme.palette.background.paper
        }}
      >
        <LoadingButton
          variant='outlined'
          type='button'
          loading={submitLoader}
          onClick={handleModalClose}
          sx={{ flex: 1, py: 2 }}
        >
          CANCEL
        </LoadingButton>
        <LoadingButton
          variant='contained'
          type='submit'
          loading={submitLoader}
          onClick={handleSubmit(onFormSubmit)}
          sx={{ flex: 1, py: 2 }}
        >
          {actionType === 'administer' ? 'ADMINISTER' : 'SKIPPED'}
        </LoadingButton>
      </Box>
    </Dialog>
  )
}

export default AdministerOrSkipModal
