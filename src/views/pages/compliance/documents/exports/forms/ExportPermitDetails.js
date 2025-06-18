import React from 'react'
import { Grid, Box, Typography } from '@mui/material'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ImageUpload from 'src/views/forms/form-fields/ImageUpload'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'

const ExportPermitDetails = ({ control, errors, isEdit }) => {
  // Options data
  const countryOptions = [
    { label: 'France', value: 'FR' },
    { label: 'United States of America', value: 'US' },
    { label: 'United Kingdom', value: 'UK' },
    { label: 'Germany', value: 'DE' },
    { label: 'Japan', value: 'JP' },
    { label: 'India', value: 'IN' },
    { label: 'Thailand', value: 'TH' }
  ]

  const purposeOptions = [
    { label: 'Rescue', value: 'rescue' },
    { label: 'Research', value: 'research' },
    { label: 'Conservation', value: 'conservation' },
    { label: 'Education', value: 'education' },
    { label: 'Breeding', value: 'breeding' }
  ]

  const exporterOptions = [
    { label: 'Wildlife Exporters Inc.', value: 'wex001' },
    { label: 'Global Fauna Trading', value: 'gft002' },
    { label: 'Nature Partners Co.', value: 'npc003' }
  ]

  const importerOptions = [
    { label: 'Zoo Worldwide', value: 'zw001' },
    { label: 'Research Institute International', value: 'rii002' },
    { label: 'Wildlife Conservation Org', value: 'wco003' }
  ]

  return (
    <Box>
      <Typography variant='h6' gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
        1. Export Permit Details
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <ControlledTextField
            name='export_number'
            label='Enter Certificate ID*'
            control={control}
            errors={errors}
            required
            fullWidth
            disabled={isEdit}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <ControlledDatePicker
            name='valid_until'
            label='Last day of validity*'
            control={control}
            errors={errors}
            required
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <ControlledDatePicker name='issued_date' label='Date of Issue*' control={control} errors={errors} required />
        </Grid>

        <Grid item xs={12} md={6}>
          <ControlledAutocomplete
            name='origin_country'
            label='Country of origin*'
            control={control}
            errors={errors}
            options={countryOptions}
            required
            fullWidth
            isOptionEqualToValue={(option, value) => option.value === value?.value}
            getOptionLabel={option => option.label || ''}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <ControlledAutocomplete
            name='exporting_country'
            label='Exporting Country*'
            control={control}
            errors={errors}
            options={countryOptions}
            required
            fullWidth
            isOptionEqualToValue={(option, value) => option.value === value?.value}
            getOptionLabel={option => option.label || ''}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <ControlledAutocomplete
            name='exporter_name'
            label='Exporter name*'
            control={control}
            errors={errors}
            options={exporterOptions}
            required
            fullWidth
            isOptionEqualToValue={(option, value) => option.value === value?.value}
            getOptionLabel={option => option.label || ''}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <ControlledAutocomplete
            name='importer_name'
            label='Importer*'
            control={control}
            errors={errors}
            options={importerOptions}
            required
            fullWidth
            isOptionEqualToValue={(option, value) => option.value === value?.value}
            getOptionLabel={option => option.label || ''}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <ControlledAutocomplete
            name='export_purpose'
            label='Purpose of transfer*'
            control={control}
            errors={errors}
            options={purposeOptions}
            required
            fullWidth
            isOptionEqualToValue={(option, value) => option.value === value?.value}
            getOptionLabel={option => option.label || ''}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <ImageUpload name='certificate_file' label='Upload Permit' control={control} errors={errors} />
        </Grid>
      </Grid>
    </Box>
  )
}

export default ExportPermitDetails
