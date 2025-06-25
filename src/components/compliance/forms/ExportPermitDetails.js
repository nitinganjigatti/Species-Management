import React, { useEffect, useState } from 'react'
import { Grid, Box, Typography } from '@mui/material'
import dayjs from 'dayjs'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledFileUpload from 'src/views/forms/form-fields/ControlledFileUpload'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import { debounce } from 'lodash'
import { getMasterImports } from 'src/lib/api/compliance/masters'

const ExportPermitDetails = ({ control, errors, isEdit }) => {
  const [exportersOptions, setExportersOptions] = useState([])
  const [importersOptions, setImportersOptions] = useState([])

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

  const getExportersList = async ({ key, page, limit }) => {
    try {
      const params = {
        type: 'exporter',
        q: key,
        page,
        limit
      }
      const res = await getMasterImports(params)
      if (res) {
        console.log('getMasterImports', res)
        const exportersOptions = res?.data?.data?.map(item => ({ label: item.name, value: item.name }))
        setExportersOptions(exportersOptions)
      }
    } catch (e) {
      console.log(e)
    }
  }

  const getImportersList = async ({ key, page, limit }) => {
    try {
      const params = {
        type: 'importer',
        q: key,
        page,
        limit
      }
      const res = await getMasterImports(params)
      if (res) {
        console.log('setImporters', res)
        setImportersOptions(res?.data?.list_items)
      }
    } catch (e) {
      console.log(e)
    }
  }

  const importersSearch = debounce(async value => {
    try {
      await getImportersList({ key: value, page: 1, limit: 20 })
    } catch (error) {
      console.error(error)
    }
  }, 500)

  const exportersSearch = debounce(async value => {
    try {
      await getExportersList({ key: value, page: 1, limit: 20 })
    } catch (error) {
      console.error(error)
    }
  }, 500)

  useEffect(() => {
    getImportersList({ key: '', page: 1, limit: 20 })
    getExportersList({ key: '', page: 1, limit: 20 })
  }, [])

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
            minDate={dayjs().startOf('day')} // Only allow future dates
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <ControlledDatePicker
            name='issued_date'
            label='Date of Issue*'
            control={control}
            errors={errors}
            required
            disabled // Always disabled
          />
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
            options={exportersOptions}
            required
            fullWidth
            isOptionEqualToValue={(option, value) => option.value === value?.value}
            getOptionLabel={option => option.label || ''}
            onKeyUp={e => exportersSearch(e.target.value)}
            onBlur={e => e.target.value && exportersSearch('')}
            onItemClear={() => exportersSearch('')}
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
          <ControlledTextField
            name='export_purpose'
            label='Purpose of transfer*'
            control={control}
            errors={errors}
            required
            fullWidth
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <ControlledFileUpload name='certificate_file' label='Upload Permit' control={control} errors={errors} />
        </Grid>
      </Grid>
    </Box>
  )
}

export default ExportPermitDetails
