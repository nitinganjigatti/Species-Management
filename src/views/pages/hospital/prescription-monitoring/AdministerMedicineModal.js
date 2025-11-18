import React, { useEffect } from 'react'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Grid,
  Card,
  CardContent,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledSelectWithTextField from 'src/views/forms/form-fields/ControlledSelectWithTextField'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import Utility from 'src/utility'

const AdministerMedicineSidesheet = ({
  scheduleDosage,
  handleSidebarOpen,
  handleSidebarClose,
  onSubmit,
  submitLoader,
  batchList = [],
  batchLoading,
  handleBatchSearch,
  isControlledSubstance = false,
  selectedDate,
  medicalMasterData,
  mastersDataLoading
}) => {
  const theme = useTheme()
  console.log('isControlledSubstance', isControlledSubstance)

  // Yup validation schema
  const validationSchema = yup.object().shape({
    time: yup.string().required('Time is required'),
    quantity: yup
      .string()
      .required('Quantity is required')
      .test('is-valid-number', 'Quantity must be a valid number', value => {
        if (!value) return false
        const num = parseFloat(value)

        return !isNaN(num) && num > 0
      })
      .test('min-value', 'Quantity must be greater than 0', value => {
        if (!value) return false

        return parseFloat(value) > 0
      }),
    quantityUnit: yup.string().required('Quantity unit is required'),
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
    batchNumber: yup
      .mixed()
      .nullable()
      .test('batch-validation', 'Batch number is required for controlled substances', function (value) {
        // Only validate if it's a controlled substance
        if (!isControlledSubstance) {
          return true // Skip validation entirely for non-controlled substances
        }

        // For controlled substances, check if value exists and is valid
        if (!value) {
          return false
        }

        // Check if it's a valid batch object with batch_no
        return !!(value && value.batch_no && typeof value.batch_no === 'string')
      })
  })

  // batchNumber: yup
  //   .mixed()
  //   .test('batch-validation', 'Batch number is required for controlled substances', function (value) {
  //     if (isControlledSubstance) {
  //       if (!value) return false

  //       // Check if it's a valid batch object with batch_no
  //       return value && value.batch_no && typeof value.batch_no === 'string'
  //     }

  //     return true
  //   })
  // })

  const defaultValues = {
    time: '',
    quantity: '',
    quantityUnit: '',
    wastageQuantity: '',
    wastageUnit: '',
    notes: '',
    batchNumber: null,
    attachment: null
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


    useEffect(() => {
      if (!handleSidebarOpen) {
        // Reset form when sidesheet closes
        reset(defaultValues)
      }
    }, [handleSidebarOpen, reset])

    // Set default quantity and unit from scheduleDosage
    useEffect(() => {
      if (scheduleDosage && medicalMasterData) {
        let updatedQuantity = ''
        let updatedQuantityUnit = ''

        if (scheduleDosage?.dosage) {
          const [value, unitRaw] = scheduleDosage.dosage.split(' ')
          updatedQuantity = value

          const foundUnit = medicalMasterData?.prescriptionDosageMeasurementType?.find(
            item => item?.unit_name === unitRaw
          )
          updatedQuantityUnit = foundUnit ? foundUnit.unit_name : ''
        }

        reset(prev => ({
          ...prev,
          quantity: updatedQuantity,
          quantityUnit: updatedQuantityUnit
        }))
      }
    }, [scheduleDosage, medicalMasterData, reset])

    const handleClose = () => {
      reset(defaultValues)
      handleSidebarClose()
    }

    const handleFormSubmit = data => {
      onSubmit(data)
      handleClose()
    }

    const handleSkip = () => {
      handleSidebarClose()
    }

    return (
      <Drawer
        anchor='right'
        open={handleSidebarOpen}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Filter Icon' />
                  <Typography
                    sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                  >
                    Administer medicine
                  </Typography>
                </Box>
              </Box>
              <IconButton size='small' onClick={handleClose} sx={{ color: theme.palette.text.primary, p: 0 }}>
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
                {scheduleDosage?.data?.name}
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
                    {Utility?.formatDisplayDate(selectedDate)}
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
                    {scheduleDosage?.scheduledTime}
                  </Typography>
                </Box>
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
                  <Grid container spacing={4}>
                    {scheduleDosage ? (
                      <>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <ControlledTimePicker
                            name={'time'}
                            control={control}
                            label='Select Time'
                            format='hh:mm A'
                            error={errors.time}
                            required
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 8 }}>
                          <ControlledSelectWithTextField
                            textFieldName='quantity'
                            selectFieldName='quantityUnit'
                            control={control}
                            errors={errors}
                            options={medicalMasterData?.prescriptionDosageMeasurementType}
                            label='Quantity'
                            placeholder='Enter quantity'
                            type='number'
                            getOptionLabel={option => option.label}
                            getOptionValue={option => option.value}

                            // secondSelectFieldName='wastageUnit'
                            // secondOptions={medicalMasterData?.prescriptionDosageMeasurementType}
                            // getSecondOptionLabel={option => option.label}
                            // getSecondOptionValue={option => option.value}
                            // secondSelectWidth={{ xs: 50, sm: 80 }}
                            required
                            selectWidth={{ xs: 50, sm: 80 }}
                            showEmptyMenuItem={{ xs: false, md: true }}
                            showEmptyMenuItemLabel={{ xs: false, md: true }}
                            loading={mastersDataLoading}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Button
                            variant='outlined'
                            fullWidth
                            sx={{
                              fontSize: '1rem',
                              backgroundColor: theme.palette.customColors.displaybgPrimary,
                              color: theme.palette.customColors.OnSurface,
                              border: 'none',
                              borderRadius: '4px',
                              fontWeight: 400,
                              py: '1.125rem'
                            }}
                          >
                            Calculated dosage
                            <Typography
                              component='span'
                              sx={{
                                fontSize: '1.25rem',
                                fontWeight: 500,
                                color: theme.palette.customColors.OnSurfaceVariant,
                                ml: 2
                              }}
                            >
                              310 mg
                            </Typography>
                          </Button>
                        </Grid>
                      </>
                    ) : (
                      <>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <ControlledTimePicker
                            name={'time'}
                            control={control}
                            label='Select Time'
                            format='hh:mm A'
                            sx={{ backgroundColor: theme.palette.customColors.Surface }}
                            error={errors.time}
                            required
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <ControlledSelectWithTextField
                            textFieldName='quantity'
                            selectFieldName='quantityUnit'
                            control={control}
                            errors={errors}
                            options={medicalMasterData?.prescriptionDosageMeasurementType}
                            label='Quantity'
                            placeholder='Enter quantity'
                            type='number'
                            getOptionLabel={option => option.label}
                            getOptionValue={option => option.value}
                            required
                            selectWidth={80}
                            loading={mastersDataLoading}
                          />
                        </Grid>
                      </>
                    )}

                    <Grid xs={12}>
                      <Accordion
                        defaultExpanded={scheduleDosage === undefined}
                        disableGutters
                        sx={{
                          border: 'none',
                          boxShadow: 'none'
                        }}
                      >
                        <AccordionSummary
                          expandIcon={scheduleDosage ? <ExpandMoreIcon /> : null}
                          aria-controls='panel1-content'
                          id='panel1-header'
                          sx={{
                            px: 0,
                            minHeight: 'auto',
                            pointerEvents: scheduleDosage ? 'auto' : 'none',
                            '& .MuiAccordionSummary-content': {
                              margin: '0.5rem 0'
                            },
                            '& .MuiAccordionSummary-content.Mui-expanded': {
                              margin: '0.5rem 0 1rem'
                            }
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: '1rem',
                              fontWeight: 500,
                              color: theme.palette.customColors.OnSurfaceVariant
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
                        </AccordionSummary>
                        <AccordionDetails sx={{ px: 0, py: 1 }}>
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
                                options={medicalMasterData?.prescriptionDosageMeasurementType}
                                getOptionLabel={option => option.label}
                                getOptionValue={option => option.value}
                                loading={mastersDataLoading}
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
                        </AccordionDetails>
                      </Accordion>
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
              justifyContent: 'center',
              gap: 6,
              boxShadow: '0px -2px 6px rgba(0, 0, 0, 0.1)',
              backgroundColor: theme.palette.background.paper
            }}
          >
            {scheduleDosage ? (
              <LoadingButton
                variant='contained'
                type='submit'
                loading={submitLoader}
                onClick={handleSubmit(handleFormSubmit)}
                sx={{ flex: 1, py: 2 }}
              >
                ADMINISTER
              </LoadingButton>
            ) : (
              <>
                <LoadingButton
                  variant='outlined'
                  type='button'
                  loading={submitLoader}
                  sx={{ flex: 1, py: 2 }}
                  onClick={handleSkip}
                >
                  SKIPPED
                </LoadingButton>
                <LoadingButton
                  variant='contained'
                  type='submit'
                  loading={submitLoader}
                  onClick={handleSubmit(handleFormSubmit)}
                  sx={{ flex: 1, py: 2 }}
                >
                  ADMINISTER
                </LoadingButton>
              </>
            )}
          </Box>
        </Box>
      </Drawer>
    )
}

export default AdministerMedicineSidesheet