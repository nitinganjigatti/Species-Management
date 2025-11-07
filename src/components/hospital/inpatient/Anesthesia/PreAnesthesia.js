import React, { useCallback } from 'react'
import { Typography, styled, Box, useTheme, Grid, InputAdornment } from '@mui/material'

// ** Form & Validation Setup
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'

import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledSelectWithTextField from 'src/views/forms/form-fields/ControlledSelectWithTextField'
import MUICheckbox from 'src/views/forms/form-fields/MUICheckbox'

// Validation Schema
const schema = yup.object().shape({
  temperature: yup.string().trim().required('Temperature is required'),
  humidity: yup.string().trim().required('Humidity is required'),
  physical_health_status: yup.string().required('Physical Health Status is required'),
  body_condition: yup.string().required('Body Condition is required'),
  animal_activity: yup.string().required('Animal Activity is required'),
  fasting_time: yup.string().required('Fasting Time is required'),
  previous_endotracheal_tube_size: yup.string().trim().required('Previous endotracheal tube size is required'),
  code_status: yup.string().required('Code status is required'),
  weight: yup.string().required('Weight is required'),
  risk_concerns: yup.string().trim().required('Risk / Concerns is required')
})

// Default Form Values
const defaultValues = {
  temperature: '',
  humidity: '',
  physical_health_status: '',
  body_condition: '',
  animal_activity: '',
  fasting_time: '',
  previous_endotracheal_tube_size: '',
  code_status: '',
  weight: '',
  risk_concerns: ''
}

function PreAnesthesia() {
  const theme = useTheme()

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  // Add pre anesthesia handler
  const handleSubmitData = useCallback(async payload => {
    try {
      alert(JSON.stringify(payload))
    } catch (error) {
      console.error('Error adding data:', error)
    } finally {
    }
  }, [])

  return (
    <Box sx={{ p: '0 24px 24px 24px' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}></Box>

      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <StyledTypography>Environmental Condition</StyledTypography>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <ControlledTextField
            control={control}
            errors={errors}
            label='Temperature'
            name='temperature'
            placeholder='Enter Temperature'
            // inputProps={<InputAdornment position='start'>C</InputAdornment>}
            inputProps={{
              endAdornment: <InputAdornment position='end'>L/min</InputAdornment>
            }}
          />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <ControlledTextField
            control={control}
            errors={errors}
            label='Humidity'
            name='humidity'
            placeholder='Enter Humidity'
            // inputProps={<InputAdornment position='start'>C</InputAdornment>}
            inputProps={{
              endAdornment: <InputAdornment position='end'>L/min</InputAdornment>
            }}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <StyledTypography>Pre Anesthetic Examination</StyledTypography>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <ControlledSelect
            control={control}
            name='physical_health_status'
            errors={errors}
            label='Physical Health Status'
            options={[]}
            getOptionLabel={option => option.label}
            getOptionValue={option => option.value}
          />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <ControlledSelect
            control={control}
            name='body_condition'
            errors={errors}
            label='Body Condition'
            options={[]}
            getOptionLabel={option => option.label}
            getOptionValue={option => option.value}
          />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <ControlledSelect
            control={control}
            name='animal_activity'
            errors={errors}
            label='Animal Activity'
            options={[]}
            getOptionLabel={option => option.label}
            getOptionValue={option => option.value}
          />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <ControlledSelectWithTextField
            textFieldName={'fasting_time'}
            selectFieldName={'fasting_time'}
            control={control}
            errors={errors}
            options={['Hours', 'Minutes']}
            label='Fasting Time'
            placeholder='Fasting Time'
            type='number'
            getOptionLabel={option => option.label}
            getOptionValue={option => option.value}
          />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <ControlledTextField
            control={control}
            errors={errors}
            label='Previous endotracheal tube size'
            name='previous_endotracheal_tube_size'
            placeholder='Previous endotracheal tube size'
          />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <ControlledSelect
            control={control}
            name='code_status'
            errors={errors}
            label='Code status'
            options={[]}
            getOptionLabel={option => option.label}
            getOptionValue={option => option.value}
          />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <ControlledSelectWithTextField
            textFieldName={'weight'}
            selectFieldName={'weight'}
            control={control}
            errors={errors}
            options={['Kg', 'Gram']}
            label='Weight'
            placeholder='Weight'
            type='number'
            getOptionLabel={option => option.label}
            getOptionValue={option => option.value}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <MUICheckbox
            name='mark_weight_as_approximate'
            control={control}
            label='Mark weight as approximate'
            labelStyle={{
              fontSize: '14px',
              fontWeight: '400',
              color: theme.palette.customColors.neutralSecondary
            }}
            checked={true}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <ControlledTextField
            control={control}
            errors={errors}
            label='Risk / Concerns '
            name='risk_concerns '
            placeholder='Risk / Concerns '
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <StyledTypography>Clin Path</StyledTypography>
        </Grid>
      </Grid>
    </Box>
  )
}

export default PreAnesthesia

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color, sx = {} }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 500,
  color: color || theme.palette.customColors.OnSurfaceVariant,
  ...sx
}))
