import React, { useEffect, useState } from 'react'
import { Drawer, Box, Typography, IconButton, Grid, Card, CardContent, Checkbox } from '@mui/material'
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
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import TreatmentTypeRadioButtons from '../utility/TreatmentTypeRadioButtons'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import Utility from 'src/utility'
import dayjs from 'dayjs'

const AdministerOrSkipForMultipleSlots = ({
  open,
  handleClose,
  onSubmit,
  submitLoader,
  medicineData,
  timeSlots = [],
  medicalMasterData,
  mastersDataLoading,
  batchList = [],
  batchLoading,
  handleBatchSearch,
  isControlledSubstance = false,
  scheduledDate
}) => {
  const theme = useTheme()
  const [selectedSlots, setSelectedSlots] = useState([])

  // Yup validation schema
  const validationSchema = yup.object().shape({
    action: yup.string().oneOf(['administer', 'skipped']).required('Action is required'),

    selectedTimeSlots: yup.array().when('action', {
      is: val => val === 'administer' || val === 'skipped',
      then: schema =>
        schema
          .min(1, 'Please select at least one time slot')
          .required('Please select at least one time slot'),
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
        if (!value) return true
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
                
return value && value.batch_no && typeof value.batch_no === 'string'
              })
          : schema.nullable().notRequired(),
      otherwise: schema => schema.nullable().notRequired()
    })
  })

  const defaultValues = {
    action: 'administer',
    selectedTimeSlots: [],
    wastageQuantity: '',
    wastageUnit: '',
    notes: '',
    batchNumber: null,
    attachment: null,
    skipReason: ''
  }

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: defaultValues,
    resolver: yupResolver(validationSchema),
    mode: 'onChange'
  })

  useEffect(() => {
    reset(defaultValues)
    setSelectedSlots([])
  }, [])

  useEffect(() => {
    if (!open) {
      reset(defaultValues)
      setSelectedSlots([])
    }
  }, [open, reset])

  const actionType = watch('action')

  // Check if a time slot is in the future
  const isSlotInFuture = slot => {
    if (!scheduledDate || !slot.time) return false

    const slotDateTime = dayjs(`${Utility.formatDate(scheduledDate)} ${slot.time}`, 'YYYY-MM-DD hh:mm A')
    const now = dayjs()

    return slotDateTime.isAfter(now)
  }

  const handleSlotToggle = (slot, checked) => {
    let newSelectedSlots = []
    
    if (checked) {
      newSelectedSlots = [...selectedSlots, slot.id]
      setValue(`slotTime_${slot.id}`, slot.time)
    } else {
      newSelectedSlots = selectedSlots.filter(id => id !== slot.id)
      setValue(`slotTime_${slot.id}`, '')
    }
    
    setSelectedSlots(newSelectedSlots)
    setValue('selectedTimeSlots', newSelectedSlots, { shouldValidate: true })
  }

  const handleModalClose = () => {
    reset()
    setSelectedSlots([])
    handleClose()
  }

  const onFormSubmit = data => {
    const formattedData = {
      ...data,
      selectedTimeSlots: selectedSlots.map(slotId => {
        const slot = timeSlots.find(s => s.id === slotId)
        const administrationTime = data[`slotTime_${slotId}`] || slot.time
        
        return {
          id: slotId,
          scheduledTime: slot.time,
          administeredTime: administrationTime,
          dosage: slot.dosage,
          amount: slot.amount
        }
      })
    }

    Object.keys(formattedData).forEach(key => {
      if (key.startsWith('slotTime_')) {
        delete formattedData[key]
      }
    })

    onSubmit(formattedData)
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={handleModalClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100vw', md: 600 },
            maxWidth: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column'
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
            {medicineData?.data?.name || medicineData?.name}
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
                {timeSlots.length} slots
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 6 }}>
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

                {/* Time Slots Selection */}
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {timeSlots.map((slot, index) => {
                      const isFutureSlot = isSlotInFuture(slot)
                      const isDisabled = actionType === 'administer' && isFutureSlot
                      const isSelected = selectedSlots.includes(slot.id)

                      return (
                        <Box
                          key={slot.id || index}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingLeft: 4,
                            backgroundColor: isSelected
                              ? theme.palette.customColors.Surface
                              : theme.palette.customColors.Background,
                            border: isSelected ? `1px solid ${theme.palette.primary.main}` : 'none',
                            borderRadius: 1,
                            opacity: isDisabled ? 0.5 : 1,
                            cursor: isDisabled ? 'not-allowed' : 'default'
                          }}
                        >
                          {/* Left Section - Time or Time Picker */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1 }}>
                            {actionType === 'administer' ? (
                              <Box sx={{ flex: 1, maxWidth: '180px', m: 2 }}>
                                <ControlledTimePicker
                                  name={`slotTime_${slot.id}`}
                                  control={control}
                                  format='hh:mm A'
                                  sx={{
                                    flex: 1,
                                    backgroundColor: 'white',
                                    borderRadius: 1,
                                    '& .MuiInputBase-root': {
                                      fontSize: '1rem',
                                      fontWeight: 600
                                    }
                                  }}
                                  error={errors[`slotTime_${slot.id}`]}
                                />
                              </Box>
                            ) : (
                              <>
                                <AccessTimeIcon
                                  sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '20px' }}
                                />
                                <Typography
                                  sx={{
                                    fontWeight: 600,
                                    color: theme.palette.customColors.OnSurfaceVariant,
                                    fontSize: '1rem'
                                  }}
                                >
                                  {slot.time}
                                </Typography>
                              </>
                            )}
                          </Box>

                          {/* Middle Section - Dosage Info */}
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                              <Typography
                                sx={{
                                  color: theme.palette.customColors.OnSurfaceVariant,
                                  fontSize: '0.875rem'
                                }}
                              >
                                {slot.dosage}
                              </Typography>
                              <Typography
                                sx={{
                                  color: theme.palette.customColors.OnSurfaceVariant,
                                  fontSize: '1rem',
                                  fontWeight: 500
                                }}
                              >
                                {slot.amount}
                              </Typography>
                            </Box>

                            {/* Right Section - Checkbox */}
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                height: actionType === 'administer' ? '72px' : '56px',
                                backgroundColor: theme.palette.customColors.neutral05,
                                padding: '0 16px',
                                borderRadius: '0 8px 8px 0'
                              }}
                            >
                              <Checkbox
                                checked={isSelected}
                                onChange={e => handleSlotToggle(slot, e.target.checked)}
                                disabled={isDisabled}
                                sx={{
                                  padding: '4px',
                                  '&.Mui-checked': {
                                    color: theme.palette.primary.main
                                  },
                                  '&.Mui-disabled': {
                                    cursor: 'not-allowed'
                                  }
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                  {errors.selectedTimeSlots && (
                    <Typography sx={{ color: 'error.main', fontSize: '0.75rem', mt: 1, ml: 3.5 }}>
                      {errors.selectedTimeSlots.message}
                    </Typography>
                  )}
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
                              
return option?.label || option?.batch_no || ''
                            }}
                            getOptionValue={option => {
                              if (typeof option === 'string') return option
                              
return option
                            }}
                            isOptionEqualToValue={(option, value) => {
                              if (!option || !value) return false
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
                            maxFileSize={5 * 1024 * 1024}
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
      </Box>

      {/* Footer Buttons - Sticky at bottom */}
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
    </Drawer>
  )
}

export default AdministerOrSkipForMultipleSlots

// import React, { useEffect, useState } from 'react'
// import { Dialog, DialogContent, Box, Typography, IconButton, Grid, Card, CardContent, Checkbox } from '@mui/material'
// import { LoadingButton } from '@mui/lab'
// import { useForm, Controller } from 'react-hook-form'
// import { yupResolver } from '@hookform/resolvers/yup'
// import * as yup from 'yup'
// import { useTheme } from '@mui/material/styles'
// import Icon from 'src/@core/components/icon'
// import AccessTimeIcon from '@mui/icons-material/AccessTime'
// import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
// import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
// import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
// import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
// import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
// import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
// import TreatmentTypeRadioButtons from '../utility/TreatmentTypeRadioButtons'
// import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
// import Utility from 'src/utility'
// import dayjs from 'dayjs'

// const AdministerOrSkipForMultipleSlots = ({
//   open,
//   handleClose,
//   onSubmit,
//   submitLoader,
//   medicineData,
//   timeSlots = [], // Array of time slots with { time, dosage, amount, id }
//   medicalMasterData,
//   mastersDataLoading,
//   batchList = [],
//   batchLoading,
//   handleBatchSearch,
//   isControlledSubstance = false,
//   scheduledDate
// }) => {
//   const theme = useTheme()
//   const [selectedSlots, setSelectedSlots] = useState([])

//   // Yup validation schema
//   const validationSchema = yup.object().shape({
//     action: yup.string().oneOf(['administer', 'skipped']).required('Action is required'),

//     selectedTimeSlots: yup.array().when('action', {
//       is: val => val === 'administer' || val === 'skipped',
//       then: schema =>
//         schema
//           .min(1, 'Please select at least one time slot')
//           .required('Please select at least one time slot'),
//       otherwise: schema => schema.notRequired()
//     }),

//     skipReason: yup.string().when('action', {
//       is: 'skipped',
//       then: schema =>
//         schema
//           .required('Skip reason is required when skipping medication')
//           .min(5, 'Skip reason must be at least 5 characters long')
//           .max(500, 'Skip reason cannot exceed 500 characters'),
//       otherwise: schema => schema.notRequired()
//     }),

//     wastageQuantity: yup
//       .string()
//       .test('is-valid-number', 'Wastage quantity must be a valid number', value => {
//         if (!value) return true
//         const num = parseFloat(value)
        
// return !isNaN(num) && num >= 0
//       })
//       .test('wastage-unit-consistency', 'Wastage unit is required when wastage quantity is provided', function (value) {
//         const { wastageUnit } = this.parent
//         if (value && !wastageUnit) {
//           return this.createError({ message: 'Wastage unit is required when wastage quantity is provided' })
//         }
        
// return true
//       }),

//     wastageUnit: yup
//       .string()
//       .test(
//         'wastage-quantity-consistency',
//         'Wastage quantity is required when wastage unit is provided',
//         function (value) {
//           const { wastageQuantity } = this.parent
//           if (value && !wastageQuantity) {
//             return this.createError({ message: 'Wastage quantity is required when wastage unit is provided' })
//           }
          
// return true
//         }
//       ),

//     notes: yup.string().max(10000, 'Notes cannot exceed 10000 characters'),

//     batchNumber: yup.mixed().when('action', {
//       is: 'administer',
//       then: schema =>
//         isControlledSubstance
//           ? schema
//               .required('Batch number is required for controlled substances')
//               .test('valid-batch-object', 'Please select a valid batch', value => {
//                 if (!value) return false
                
// return value && value.batch_no && typeof value.batch_no === 'string'
//               })
//           : schema.nullable().notRequired(),
//       otherwise: schema => schema.nullable().notRequired()
//     })
//   })

//   const defaultValues = {
//     action: 'administer',
//     selectedTimeSlots: [],
//     wastageQuantity: '',
//     wastageUnit: '',
//     notes: '',
//     batchNumber: null,
//     attachment: null,
//     skipReason: ''
//   }

//   const {
//     control,
//     handleSubmit,
//     reset,
//     watch,
//     setValue,
//     formState: { errors }
//   } = useForm({
//     defaultValues: defaultValues,
//     resolver: yupResolver(validationSchema),
//     mode: 'onChange'
//   })

//   useEffect(() => {
//     reset(defaultValues)
//     setSelectedSlots([])
//   }, [])

//   useEffect(() => {
//     if (!open) {
//       reset(defaultValues)
//       setSelectedSlots([])
//     }
//   }, [open, reset])

//   const actionType = watch('action')

//   // Check if a time slot is in the future
//   const isSlotInFuture = slot => {
//     if (!scheduledDate || !slot.time) return false

//     // Parse the scheduled date and slot time
//     const slotDateTime = dayjs(`${Utility.formatDate(scheduledDate)} ${slot.time}`, 'YYYY-MM-DD hh:mm A')
//     const now = dayjs()

//     return slotDateTime.isAfter(now)
//   }

//   const handleSlotToggle = (slot, checked) => {
//     let newSelectedSlots = []
    
//     if (checked) {
//       newSelectedSlots = [...selectedSlots, slot.id]

//       // Initialize the time picker with the slot's scheduled time
//       setValue(`slotTime_${slot.id}`, slot.time)
//     } else {
//       newSelectedSlots = selectedSlots.filter(id => id !== slot.id)

//       // Clear the time picker value
//       setValue(`slotTime_${slot.id}`, '')
//     }
    
//     setSelectedSlots(newSelectedSlots)
//     setValue('selectedTimeSlots', newSelectedSlots, { shouldValidate: true })
//   }

//   const handleModalClose = () => {
//     reset()
//     setSelectedSlots([])
//     handleClose()
//   }

//   const onFormSubmit = data => {
//     // Add selected slots with their administration times to the data
//     const formattedData = {
//       ...data,
//       selectedTimeSlots: selectedSlots.map(slotId => {
//         const slot = timeSlots.find(s => s.id === slotId)
//         const administrationTime = data[`slotTime_${slotId}`] || slot.time
        
//         return {
//           id: slotId,
//           scheduledTime: slot.time, // Original scheduled time
//           administeredTime: administrationTime, // Actual administered time (for administer action)
//           dosage: slot.dosage,
//           amount: slot.amount
//         }
//       })
//     }

//     // Remove individual slotTime fields from the data
//     Object.keys(formattedData).forEach(key => {
//       if (key.startsWith('slotTime_')) {
//         delete formattedData[key]
//       }
//     })

//     onSubmit(formattedData)
//   }

//   return (
//     <Dialog
//       open={open}
//       onClose={handleModalClose}
//       slotProps={{
//         paper: {
//           sx: {
//             borderRadius: 1,
//             maxWidth: '562px'
//           }
//         }
//       }}
//     >
//       {/* Header */}
//       <Box
//         sx={{
//           display: 'flex',
//           flexDirection: 'column',
//           backgroundColor: theme.palette.customColors.OnPrimary
//         }}
//       >
//         {/* Title Bar */}
//         <Box
//           sx={{
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'space-between',
//             p: 6,
//             borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
//           }}
//         >
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//             <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
//               <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Activity Icon' />
//               <Typography
//                 sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
//               >
//                 Administer / Skip
//               </Typography>
//             </Box>
//           </Box>
//           <IconButton size='small' onClick={handleModalClose} sx={{ color: theme.palette.text.primary, p: 0 }}>
//             <Icon icon='mdi:close' fontSize={24} />
//           </IconButton>
//         </Box>

//         {/* Medicine Info Section */}
//         <Box
//           sx={{
//             display: 'flex',
//             flexFlow: 'wrap',
//             alignItems: 'center',
//             justifyContent: 'space-between',
//             px: 6,
//             py: 3,
//             backgroundColor: theme.palette.customColors.OnPrimary
//           }}
//         >
//           <Typography
//             sx={{
//               fontSize: '1rem',
//               fontWeight: 500,
//               color: theme.palette.primary.deepDark
//             }}
//           >
//             {medicineData?.data?.name || medicineData?.name}
//           </Typography>
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//               <CalendarTodayIcon sx={{ fontSize: 18, color: theme.palette.customColors.OnSurfaceVariant }} />
//               <Typography
//                 sx={{
//                   fontSize: '0.875rem',
//                   fontWeight: 500,
//                   color: theme.palette.customColors.OnSurfaceVariant
//                 }}
//               >
//                 {Utility.formatDisplayDate(scheduledDate)}
//               </Typography>
//             </Box>
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
//               <AccessTimeIcon sx={{ fontSize: 18, color: theme.palette.customColors.OnSurfaceVariant }} />
//               <Typography
//                 sx={{
//                   fontSize: '0.875rem',
//                   fontWeight: 500,
//                   color: theme.palette.customColors.OnSurfaceVariant
//                 }}
//               >
//                 {timeSlots.length} slots
//               </Typography>
//             </Box>
//           </Box>
//         </Box>
//       </Box>

//       {/* Content */}
//       <DialogContent sx={{ p: 6 }}>
//         <Card
//           sx={{
//             borderRadius: 1,
//             border: `1px solid ${theme.palette.customColors.SurfaceVariant}`,
//             boxShadow: 0
//           }}
//         >
//           <CardContent sx={{ p: 6 }}>
//             <form onSubmit={handleSubmit(onFormSubmit)}>
//               <Grid container spacing={4}>
//                 {/* Radio Buttons for Action Type */}
//                 <Grid size={{ xs: 12 }}>
//                   <Controller
//                     name='action'
//                     control={control}
//                     render={({ field }) => (
//                       <Box sx={{ display: 'flex', gap: 2 }}>
//                         <TreatmentTypeRadioButtons
//                           label='Administer'
//                           isSelected={field.value === 'administer'}
//                           onClick={() => field.onChange('administer')}
//                           radioPosition='right'
//                           sx={{ flex: 1 }}
//                         />
//                         <TreatmentTypeRadioButtons
//                           label='Skipped'
//                           isSelected={field.value === 'skipped'}
//                           onClick={() => field.onChange('skipped')}
//                           radioPosition='right'
//                           borderColor={theme.palette.customColors.OutlineVariant}
//                           sx={{ flex: 1 }}
//                         />
//                       </Box>
//                     )}
//                   />
//                 </Grid>

//                 {/* Time Slots Selection */}
//                 <Grid size={{ xs: 12 }}>
//                   <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
//                     {timeSlots.map((slot, index) => {
//                       const isFutureSlot = isSlotInFuture(slot)
//                       const isDisabled = actionType === 'administer' && isFutureSlot
//                       const isSelected = selectedSlots.includes(slot.id)

//                       return (
//                         <Box
//                           key={slot.id || index}
//                           sx={{
//                             display: 'flex',
//                             alignItems: 'center',
//                             justifyContent: 'space-between',
//                             paddingLeft: 4,
//                             backgroundColor: isSelected
//                               ? theme.palette.customColors.Surface
//                               : theme.palette.customColors.Background,
//                             border: isSelected ? `1px solid ${theme.palette.primary.main}` : 'none',
//                             borderRadius: 1,

//                             // minHeight: '56px',
//                             opacity: isDisabled ? 0.5 : 1,
//                             cursor: isDisabled ? 'not-allowed' : 'default'
//                           }}
//                         >
//                           {/* Left Section - Time or Time Picker */}
//                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1 }}>
//                             {actionType === 'administer' ? (

//                               // Time Picker for selected slots in administer mode
//                               <Box sx={{ flex: 1, maxWidth: '180px', m: 2 }}>
//                                 <ControlledTimePicker
//                                   name={`slotTime_${slot.id}`}
//                                   control={control}
//                                   format='hh:mm A'
//                                   sx={{
//                                     flex: 1,
//                                     backgroundColor: 'white',
//                                     borderRadius: 1,
//                                     '& .MuiInputBase-root': {
//                                       fontSize: '1rem',
//                                       fontWeight: 600
//                                     }
//                                   }}
//                                   error={errors[`slotTime_${slot.id}`]}
//                                 />
//                               </Box>
//                             ) : (

//                               // Static time display for non-selected or skipped mode
//                               <>
//                                 <AccessTimeIcon
//                                   sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '20px' }}
//                                 />
//                                 <Typography
//                                   sx={{
//                                     fontWeight: 600,
//                                     color: theme.palette.customColors.OnSurfaceVariant,
//                                     fontSize: '1rem'
//                                   }}
//                                 >
//                                   {slot.time}
//                                 </Typography>
//                               </>
//                             )}
//                           </Box>

//                           {/* Middle Section - Dosage Info */}
//                           <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
//                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
//                               <Typography
//                                 sx={{
//                                   color: theme.palette.customColors.OnSurfaceVariant,
//                                   fontSize: '0.875rem'
//                                 }}
//                               >
//                                 {slot.dosage}
//                               </Typography>
//                               <Typography
//                                 sx={{
//                                   color: theme.palette.customColors.OnSurfaceVariant,
//                                   fontSize: '1rem',
//                                   fontWeight: 500
//                                 }}
//                               >
//                                 {slot.amount}
//                               </Typography>
//                             </Box>

//                             {/* Right Section - Checkbox */}
//                             <Box
//                               sx={{
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 height: actionType === 'administer' ? '72px' : '56px',
//                                 backgroundColor: theme.palette.customColors.neutral05,
//                                 padding: '0 16px',
//                                 borderRadius: '0 8px 8px 0'
//                               }}
//                             >
//                               <Checkbox
//                                 checked={isSelected}
//                                 onChange={e => handleSlotToggle(slot, e.target.checked)}
//                                 disabled={isDisabled}
//                                 sx={{
//                                   padding: '4px',
//                                   '&.Mui-checked': {
//                                     color: theme.palette.primary.main
//                                   },
//                                   '&.Mui-disabled': {
//                                     cursor: 'not-allowed'
//                                   }
//                                 }}
//                               />
//                             </Box>
//                           </Box>
//                         </Box>
//                       )
//                     })}
//                   </Box>
//                   {errors.selectedTimeSlots && (
//                     <Typography sx={{ color: 'error.main', fontSize: '0.75rem', mt: 1, ml: 3.5 }}>
//                       {errors.selectedTimeSlots.message}
//                     </Typography>
//                   )}
//                 </Grid>

//                 {/* Conditional Content based on Action Type */}
//                 {actionType === 'administer' ? (
//                   <>
//                     {/* Wastage Section for Administer */}
//                     <Grid size={{ xs: 12 }}>
//                       <Typography
//                         sx={{
//                           fontSize: '1rem',
//                           fontWeight: 500,
//                           color: theme.palette.customColors.OnSurfaceVariant,
//                           mb: 3
//                         }}
//                       >
//                         Add wastage if any
//                         <Typography
//                           component='span'
//                           sx={{
//                             fontSize: '1rem',
//                             color: theme.palette.customColors.neutralSecondary,
//                             ml: 1
//                           }}
//                         >
//                           (Optional)
//                         </Typography>
//                       </Typography>

//                       <Grid container spacing={4}>
//                         <Grid size={{ xs: 12, md: 6 }}>
//                           <ControlledTextField
//                             name='wastageQuantity'
//                             control={control}
//                             errors={errors}
//                             label='Quantity'
//                             placeholder='Enter Quantity'
//                             type='number'
//                           />
//                         </Grid>

//                         <Grid size={{ xs: 12, md: 6 }}>
//                           <ControlledSelect
//                             name='wastageUnit'
//                             label='Unit'
//                             control={control}
//                             errors={errors}
//                             options={medicalMasterData?.prescriptionMeasurementType}
//                             getOptionLabel={option => option.label}
//                             getOptionValue={option => option.value}
//                           /> 
//                         </Grid>

//                         <Grid size={{ xs: 12 }}>
//                           <ControlledTextArea
//                             label='Notes'
//                             name='notes'
//                             control={control}
//                             errors={errors}
//                             placeholder='Enter Notes'
//                             rows={3}
//                           />
//                         </Grid>

//                         <Grid size={{ xs: 12 }}>
//                           <ControlledAutocomplete
//                             name='batchNumber'
//                             control={control}
//                             errors={errors}
//                             label={
//                               isControlledSubstance
//                                 ? 'Enter batch number (required)'
//                                 : 'Enter batch number if any (optional)'
//                             }
//                             options={batchList}
//                             getOptionLabel={option => {
//                               if (typeof option === 'string') return option
                              
// return option?.label || option?.batch_no || ''
//                             }}
//                             getOptionValue={option => {
//                               if (typeof option === 'string') return option
                              
// return option
//                             }}
//                             isOptionEqualToValue={(option, value) => {
//                               if (!option || !value) return false
//                               const optionId = option?.id
//                               const valueId = value?.id
                              
// return optionId === valueId
//                             }}
//                             loading={batchLoading}
//                             onInputChange={handleBatchSearch}
//                             required={isControlledSubstance}
//                             autocompleteProps={{
//                               filterOptions: x => x,
//                               noOptionsText: batchLoading ? 'Loading...' : 'Type to search batches'
//                             }}
//                           />
//                         </Grid>

//                         <Grid size={{ xs: 12 }}>
//                           <ControlledMultiFileUpload
//                             name='attachment'
//                             control={control}
//                             errors={errors}
//                             label='Batch Image'
//                             maxFiles={5}
//                             maxFileSize={5 * 1024 * 1024}
//                             acceptedFileTypes='image/jpeg,image/png,image/jpg,application/pdf'
//                           />
//                         </Grid>
//                       </Grid>
//                     </Grid>
//                   </>
//                 ) : (
//                   <>
//                     {/* Reason for Skip Section */}
//                     <Grid size={{ xs: 12 }}>
//                       <ControlledTextArea
//                         label='Reason For Skip'
//                         name='skipReason'
//                         control={control}
//                         errors={errors}
//                         placeholder='Enter reason for skipping'
//                         rows={4}
//                         required={actionType === 'skipped'}
//                       />
//                     </Grid>
//                   </>
//                 )}

//                 {/* Hidden submit button for form submission */}
//                 <button type='submit' style={{ display: 'none' }} />
//               </Grid>
//             </form>
//           </CardContent>
//         </Card>
//       </DialogContent>

//       {/* Footer Buttons */}
//       <Box
//         sx={{
//           p: 6,
//           display: 'flex',
//           justifyContent: 'center',
//           gap: 6,
//           boxShadow: '0px -2px 6px rgba(0, 0, 0, 0.1)',
//           backgroundColor: theme.palette.background.paper
//         }}
//       >
//         <LoadingButton
//           variant='outlined'
//           type='button'
//           loading={submitLoader}
//           onClick={handleModalClose}
//           sx={{ flex: 1, py: 2 }}
//         >
//           CANCEL
//         </LoadingButton>
//         <LoadingButton
//           variant='contained'
//           type='submit'
//           loading={submitLoader}
//           onClick={handleSubmit(onFormSubmit)}
//           sx={{ flex: 1, py: 2 }}
//         >
//           {actionType === 'administer' ? 'ADMINISTER' : 'SKIPPED'}
//         </LoadingButton>
//       </Box>
//     </Dialog>
//   )
// }

// export default AdministerOrSkipForMultipleSlots
