import React, { useEffect } from 'react'
import { Drawer, Box, Typography, IconButton, Grid, Card, CardContent, Divider, Button } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import Icon from 'src/@core/components/icon'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledSelectWithTextField from 'src/views/forms/form-fields/ControlledSelectWithTextField'
import { LoadingButton } from '@mui/lab'
import TreatmentTypeRadioButtons from '../utility/TreatmentTypeRadioButtons'
import { Controller, useForm, useFieldArray } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import Utility from 'src/utility'

const ScheduleDosageSidesheet = ({
  label = 'Schedule Dosage',
  handleOpen,
  handleSidebarClose,
  onSubmit,
  submitLoader,
  scheduleDosage,
  selectedDate,
  medicalMasterData
}) => {
  const theme = useTheme()

  // Validation schema based on reference component
  const validationSchema = yup.object({
    schedules: yup
      .array()
      .of(
        yup.object({
          time: yup.string().required('Time is required'),
          dosageQuantity: yup
            .mixed()
            .test('is-valid-quantity', 'Quantity is required', function (value) {
              if (!value || value === '') return false
              const num = parseFloat(value)

              return !isNaN(num) && num >= 0.1
            })
            .test('min-value', 'Quantity must be at least 0.1', function (value) {
              if (!value) return false
              const num = parseFloat(value)

              return num >= 0.1
            })
            .test('max-value', 'Quantity cannot exceed 1000', function (value) {
              if (!value) return false
              const num = parseFloat(value)

              return num <= 1000
            }),
          dosageUnit: yup.string().required('Please select a unit')
        })
      )
      .min(1, 'At least one schedule time is required')
      .required('Schedules are required'),
    applyDosage: yup.string().oneOf(['this_day', 'till_end'], 'Please select dosage application type')
  })

  const defaultValues = {
    schedules: [
      {
        time: '',
        dosageQuantity: '',
        dosageUnit: '',
        dosageWeights: ''
      }
    ],
    applyDosage: 'this_day' // Set default value
  }

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: defaultValues,
    resolver: yupResolver(validationSchema),
    mode: 'onChange'
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'schedules',
    keyName: 'fieldId'
  })

  useEffect(() => {
    if (!handleOpen) {
      // Reset form when sidesheet closes
      reset(defaultValues)
    }
  }, [handleOpen, reset])

  const handleClose = () => {
    reset(defaultValues)
    handleSidebarClose()
  }

  const handleFormSubmit = data => {
    onSubmit(data)

    // handleClose()
  }

  useEffect(() => {
    reset()
  }, [])

  return (
    <Drawer
      anchor='right'
      open={handleOpen}
      onClose={handleClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: '562px' },
          maxWidth: '100%',
          background: theme.palette.customColors.Background
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Filter Icon' />
              <Typography
                sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
              >
                {label}
              </Typography>
            </Box>
            <IconButton
              onClick={handleClose}
              disabled={submitLoader}
              sx={{ color: theme.palette.text.primary, padding: 0 }}
            >
              <Icon icon='mdi:close' fontSize={24} />
            </IconButton>
          </Box>

          {/* Medicine Info Section */}
          <Box
            sx={{
              display: 'flex',
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
              {scheduleDosage?.data?.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarTodayIcon sx={{ fontSize: 18, color: theme.palette.customColors.OnSurfaceVariant }} />
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                {Utility?.formatDisplayDate(selectedDate)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 6 }}>
          <Card
            sx={{
              borderRadius: 1,
              border: `1px solid ${theme.palette.customColors.SurfaceVariant}`,
              boxShadow: 0
            }}
          >
            <CardContent sx={{ p: 6 }}>
              <form onSubmit={handleSubmit(handleFormSubmit)}>
                <Grid container rowSpacing={4} columnSpacing={2}>
                  {/* Show array error if exists */}
                  {errors.schedules && typeof errors.schedules === 'string' && (
                    <Grid size={{ xs: 12 }}>
                      <Typography color='error' variant='caption'>
                        {errors.schedules.message}
                      </Typography>
                    </Grid>
                  )}

                  {fields.map((field, idx) => (
                    <React.Fragment key={field.fieldId}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <ControlledTimePicker
                          name={`schedules.${idx}.time`}
                          control={control}
                          label='Select Time'
                          format='hh:mm A'
                          error={errors?.schedules?.[idx]?.time}
                          required
                          disabled={submitLoader}
                        />
                      </Grid>
                      <Grid size={{ xs: fields.length > 1 ? 10 : 12, sm: fields.length > 1 ? 7 : 8 }}>
                        <ControlledSelectWithTextField
                          textFieldName={`schedules.${idx}.dosageQuantity`}
                          selectFieldName={`schedules.${idx}.dosageUnit`}
                          control={control}
                          errors={{
                            // Use the actual field names as keys for the errors object
                            [`schedules.${idx}.dosageQuantity`]: errors?.schedules?.[idx]?.dosageQuantity,
                            [`schedules.${idx}.dosageUnit`]: errors?.schedules?.[idx]?.dosageUnit
                          }}
                          options={medicalMasterData?.prescriptionDosageMeasurementType}
                          label='Quantity'
                          placeholder='Enter quantity'
                          type='number'
                          getOptionLabel={option => option.label}
                          getOptionValue={option => option.value}
                          required
                          selectWidth={100}
                          disabled={submitLoader}
                        />
                      </Grid>
                      {fields.length > 1 && (
                        <Grid size={{ xs: 0.5 }} sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconButton
                            onClick={() => remove(idx)}
                            disabled={submitLoader}
                            sx={{ color: theme.palette.text.primary, padding: 0 }}
                          >
                            <Icon icon='mdi:close' fontSize={24} />
                          </IconButton>
                        </Grid>
                      )}
                    </React.Fragment>
                  ))}

                  <Grid size={{ xs: 12 }}>
                    <Button
                      startIcon={<Icon icon='mdi:plus' fontSize={24} />}
                      variant='outlined'
                      fullWidth
                      disabled={submitLoader}
                      sx={{
                        fontSize: '1rem',
                        backgroundColor: theme.palette.customColors.SurfaceVariant,
                        color: theme.palette.customColors.OnSurface,
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: 500,
                        py: '0.625rem',
                        '&.Mui-disabled': {
                          backgroundColor: theme.palette.action.disabledBackground,
                          color: theme.palette.action.disabled
                        }
                      }}
                      onClick={e => {
                        e.preventDefault()
                        append({
                          time: '',
                          dosageQuantity: '',
                          dosageUnit: medicalMasterData?.prescriptionDosageMeasurementType?.[0]?.unit_name || '',
                          dosageWeights: ''
                        })
                      }}
                    >
                      Add Time
                    </Button>
                  </Grid>

                  <Divider sx={{ width: '100%', my: 2, borderColor: theme.palette.customColors.OutlineVariant }} />

                  <Grid size={{ xs: 12 }}>
                    <Typography
                      sx={{
                        fontSize: '1.25rem',
                        fontWeight: 500,
                        mb: 3,
                        color: theme.palette.customColors.OnSurfaceVariant
                      }}
                    >
                      Apply Dosage
                    </Typography>

                    <Controller
                      name='applyDosage'
                      control={control}
                      defaultValue='this_day'
                      render={({ field }) => (
                        <Grid container spacing={4}>
                          <Grid size={{ xs: 12 }}>
                            <TreatmentTypeRadioButtons
                              label='Only for this day'
                              isSelected={field.value === 'this_day'}
                              onClick={() => !submitLoader && field.onChange('this_day')}
                              radioPosition='right'
                              selectedFontColor={theme.palette.customColors.OnSurfaceVariant}
                              textColor={theme.palette.customColors.Outline}
                              borderColor={theme.palette.customColors.OutlineVariant}
                              disabled={submitLoader}
                            />
                          </Grid>

                          <Grid size={{ xs: 12 }}>
                            <TreatmentTypeRadioButtons
                              label='Till prescription ends'
                              isSelected={field.value === 'till_end'}
                              onClick={() => !submitLoader && field.onChange('till_end')}
                              radioPosition='right'
                              selectedFontColor={theme.palette.customColors.OnSurfaceVariant}
                              textColor={theme.palette.customColors.Outline}
                              borderColor={theme.palette.customColors.OutlineVariant}
                              disabled={submitLoader}
                            />
                          </Grid>
                        </Grid>
                      )}
                    />
                  </Grid>
                </Grid>

                {/* Hidden submit button for form submission */}
                <button type='submit' style={{ display: 'none' }} />
              </form>
            </CardContent>
          </Card>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            p: 6,
            display: 'flex',
            boxShadow: '0px -2px 6px rgba(0, 0, 0, 0.1)',
            backgroundColor: theme.palette.background.paper
          }}
        >
          <LoadingButton
            variant='contained'
            type='submit'
            loading={submitLoader}
            disabled={submitLoader}
            onClick={handleSubmit(handleFormSubmit)}
            sx={{
              flex: 1,
              py: 2,
              '&.Mui-disabled': {
                backgroundColor: theme.palette.action.disabledBackground
              }
            }}
            loadingPosition='start'
            startIcon={submitLoader ? <Icon icon='mdi:loading' spin /> : null}
          >
            {submitLoader ? 'Scheduling...' : 'Schedule'}
          </LoadingButton>
        </Box>
      </Box>
    </Drawer>
  )
}

export default ScheduleDosageSidesheet