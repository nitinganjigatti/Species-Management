import React from 'react'
import { Box, Typography, Button, Grid, Paper, IconButton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import CloseIcon from '@mui/icons-material/Close'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import { borderRadius } from '@mui/system'

export default function ScheduleMedicine({ handleSubmitData }) {
  // Options for selects
  const frequencyOptions = [
    { id: 1, label: 'Everyday', value: 'everyday' },
    { id: 2, label: 'Alternate Day', value: 'every-other-day' },
    { id: 3, label: 'Weekly', value: 'weekly' },
    { id: 4, label: 'Monthly', value: 'monthly' },
    { id: 5, label: 'As Needed', value: 'as-needed' }
  ]

  const doseTypeOptions = [
    { id: 1, label: 'Fixed Dose', value: 'fixed-dose' },
    { id: 2, label: 'Variable Dose', value: 'variable-dose' },
    { id: 3, label: 'As Prescribed', value: 'as-prescribed' }
  ]

  const unitOptions = [
    { id: 1, label: 'Tablets', value: 'tablets' },
    { id: 2, label: 'Capsules', value: 'capsules' },
    { id: 3, label: 'ml', value: 'ml' },
    { id: 4, label: 'mg', value: 'mg' },
    { id: 5, label: 'Drops', value: 'drops' },
    { id: 6, label: 'Puffs', value: 'puffs' }
  ]

  const deliveryRouteOptions = [
    { id: 1, label: 'Oral', value: 'oral' },
    { id: 2, label: 'Injection', value: 'injection' },
    { id: 3, label: 'Topical', value: 'topical' },
    { id: 4, label: 'Inhalation', value: 'inhalation' },
    { id: 5, label: 'Sublingual', value: 'sublingual' },
    { id: 6, label: 'Rectal', value: 'rectal' }
  ]

  const durationUnitOptions = [
    { id: 1, label: 'Days', value: 'days' },
    { id: 2, label: 'Weeks', value: 'weeks' },
    { id: 3, label: 'Months', value: 'months' }
  ]

  // Schema and default values
  const medicineScheduleSchema = yup
    .object({
      frequency: yup
        .string()
        .oneOf(frequencyOptions.map(o => o.value))
        .required('Please select a frequency'),
      doseType: yup
        .string()
        .oneOf(doseTypeOptions.map(o => o.value))
        .required('Please select a dose type'),
      schedules: yup
        .array()
        .of(
          yup.object({
            time: yup.string().required('Time is required'),
            quantity: yup
              .number()
              .min(0.1, 'Quantity must be greater than 0')
              .max(100, 'Quantity cannot exceed 100')
              .required('Quantity is required'),
            unit: yup
              .string()
              .oneOf(unitOptions.map(o => o.value))
              .required('Please select a unit')
          })
        )
        .min(1, 'At least one schedule time is required')
        .required(),
      deliveryRoute: yup
        .string()
        .oneOf(deliveryRouteOptions.map(o => o.value))
        .required('Please select a delivery route'),
      prescriptionStartDate: yup.string().required('Start date is required'),
      dosageDuration: yup
        .object({
          value: yup
            .number()
            .min(1, 'Duration must be at least 1')
            .max(365, 'Duration cannot exceed 365')
            .required('Duration value is required'),
          unit: yup
            .string()
            .oneOf(durationUnitOptions.map(o => o.value))
            .required('Please select duration unit')
        })
        .required(),
      notes: yup.string().max(500, 'Notes cannot exceed 500 characters').nullable()
    })
    .required()

  const defaultValues = {
    frequency: 'everyday',
    doseType: 'fixed-dose',
    schedules: [
      {
        time: null,
        quantity: 0,
        unit: ''
      }
    ],
    deliveryRoute: 'oral',
    prescriptionStartDate: null,
    dosageDuration: {
      value: 5,
      unit: 'days'
    },
    notes: ''
  }

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(medicineScheduleSchema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'schedules'
  })

  const onSubmit = async params => {
    if (handleSubmitData) {
      await handleSubmitData(params)
    }
  }

  const theme = useTheme()

  return (
    <Box
      sx={{
        p: 6,
        textAlign: 'center',
        minHeight: '100%',
        background: theme.palette.customColors.OnBackground,
        borderRadius: '8px'
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)} autoComplete='off'>
        <Box
          container
          sx={{
            background: theme.palette.common.white,
            height: 600,
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            justifyContent: 'flex-start',
            maxHeight: 600,
            gap: 2,
            padding: '16px', // Reduced padding
            overflowY: 'auto',
            overflowX: 'hidden',
            width: '100%',
            maxWidth: '420px', // Slightly larger to accommodate content
            '& .MuiGrid-item': {
              paddingLeft: '8px !important',
              paddingTop: '8px !important'
            }
          }}
        >
          <Typography
            sx={{
              mb: 3,
              fontSize: '20px',
              fontWeight: '500',
              textAlign: 'left',
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Schedule Medicine
          </Typography>

          <Box sx={{ mb: 3 }}>
            <ControlledSelect
              fullWidth={true}
              name='frequency'
              sx={{
                textAlign: 'left',
                borderRadius: 0
              }}
              size='small'
              label='Set Frequency'
              control={control}
              errors={errors}
              options={frequencyOptions}
              getOptionLabel={option => option.label}
              getOptionValue={option => option.value}
              required
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <ControlledSelect
              fullWidth={true}
              name='doseType'
              label='Select Dose Type'
              sx={{
                textAlign: 'left',
                borderRadius: 0
              }}
              size='small'
              control={control}
              errors={errors}
              options={doseTypeOptions}
              getOptionLabel={option => option.label}
              getOptionValue={option => option.value}
              required
            />
          </Box>

          {fields.map((item, idx) => (
            <Box
              key={item.id}
              sx={{
                mb: 3,
                display: 'flex',
                gap: 2, // Use gap instead of Grid spacing
                alignItems: 'center'
              }}
            >
              <Box sx={{ flex: '1 1 35%' }}>
                <ControlledTimePicker
                  fullWidth={true}
                  name={`schedules.${idx}.time`}
                  label='Time'
                  control={control}
                  errors={errors}
                  placeholder='12:30 PM'
                  required
                  sx={{
                    textAlign: 'left',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 0
                    }
                  }}
                  size='small'
                />
              </Box>
              <Box sx={{ flex: '1 1 25%' }}>
                <ControlledTextField
                  name={`schedules.${idx}.quantity`}
                  label='Quantity'
                  control={control}
                  errors={errors}
                  type='number'
                  required
                  sx={{
                    textAlign: 'left',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 0
                    }
                  }}
                  size='small'
                />
              </Box>
              <Box sx={{ flex: '1 1 25%' }}>
                <ControlledSelect
                  name={`schedules.${idx}.unit`}
                  label='Unit'
                  control={control}
                  errors={errors}
                  options={unitOptions}
                  placeholder='Choose Unit'
                  getOptionLabel={option => option.label}
                  getOptionValue={option => option.value}
                  sx={{
                    textAlign: 'left',
                    borderRadius: 0
                  }}
                  size='small'
                  required
                />
              </Box>
              <Box sx={{ flex: '0 0 auto', minWidth: '40px', textAlign: 'center' }}>
                {fields?.length > 1 && (
                  <IconButton onClick={() => remove(idx)} size='small'>
                    <CloseIcon fontSize='small' />
                  </IconButton>
                )}
              </Box>
            </Box>
          ))}

          <Button
            variant='outlined'
            fullWidth
            sx={{
              mb: 3,
              height: '48px',
              background: '#EAF8F2',
              color: '#1A7F64',
              borderColor: '#B6E2D3',
              fontWeight: 600,
              padding: '10px 12px'
            }}
            onClick={e => {
              e.preventDefault()
              append({ time: '', quantity: 0, unit: '' })
            }}
          >
            + Add Time
          </Button>

          <Box sx={{ mb: 3 }}>
            <ControlledSelect
              name='deliveryRoute'
              label='Select Delivery Route'
              fullWidth={true}
              sx={{
                textAlign: 'left',
                borderRadius: 0
              }}
              size='small'
              control={control}
              errors={errors}
              options={deliveryRouteOptions}
              getOptionLabel={option => option.label}
              getOptionValue={option => option.value}
              required
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <ControlledDatePicker
              fullWidth={true}
              sx={{
                textAlign: 'left',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 0
                }
              }}
              size='small'
              name='prescriptionStartDate'
              label='Prescription Start Date'
              control={control}
              errors={errors}
              required
            />
          </Box>

          <Box
            sx={{
              mb: 3,
              display: 'flex',
              gap: 1,
              alignItems: 'center'
            }}
          >
            <Box sx={{ flex: 1 }}>
              <ControlledTextField
                name='dosageDuration.value'
                label='Dosage Duration'
                control={control}
                errors={errors}
                type='number'
                sx={{
                  textAlign: 'left',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 0
                  }
                }}
                size='small'
                required
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <ControlledSelect
                name='dosageDuration.unit'
                label='Unit'
                sx={{
                  textAlign: 'left',
                  borderRadius: 0
                }}
                size='small'
                control={control}
                errors={errors}
                options={durationUnitOptions}
                required
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
              />
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <ControlledTextArea
              fullWidth={true}
              sx={{
                textAlign: 'left',
                background: '#FFF9E5',
                borderRadius: 0
              }}
              name='notes'
              label='Enter Notes'
              control={control}
              errors={errors}
              minRows={2}
            />
          </Box>
        </Box>
      </form>
    </Box>
  )
}
