import React, { useEffect, useState } from 'react'
import { Grid, Box, Typography } from '@mui/material'
import dayjs from 'dayjs'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledFileUpload from 'src/views/forms/form-fields/ControlledFileUpload'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import { debounce } from 'lodash'
import { getMasterImports } from 'src/lib/api/compliance/masters'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const countryList = require('react-select-country-list').default ?? require('react-select-country-list')
import { useMemo } from 'react'
import type { ExportPermitDetailsProps } from 'src/types/compliance'
import type { SelectOption } from 'src/types/compliance'
import { useTheme } from '@mui/material/styles'

const ExportPermitDetails = ({ control, errors, isEdit }: ExportPermitDetailsProps) => {
  const theme = useTheme()
  const [exportersOptions, setExportersOptions] = useState<SelectOption[]>([])
  const [importersOptions, setImportersOptions] = useState<SelectOption[]>([])

  const countryOptions = useMemo(() => countryList().getData(), [])

  const getExportersList = async ({ key, page, limit }: { key: string; page: number; limit: number }) => {
    try {
      const params = {
        type: 'exporter',
        q: key,
        page,
        limit
      }
      const res = await getMasterImports(params)
      if (res) {
        const exportersOptions: SelectOption[] = (res?.data?.data || []).map((item: any) => ({ label: item.name ?? '', value: item.id ?? '' }))
        setExportersOptions(exportersOptions)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const getImportersList = async ({ key, page, limit }: { key: string; page: number; limit: number }) => {
    try {
      const params = {
        type: 'importer',
        q: key,
        page,
        limit
      }
      const res = await getMasterImports(params)
      if (res) {
        const importersOptions: SelectOption[] = (res?.data?.data || []).map((item: any) => ({ label: item.name ?? '', value: item.id ?? '' }))
        setImportersOptions(importersOptions)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const importersSearch = debounce(async (value: string) => {
    try {
      await getImportersList({ key: value, page: 1, limit: 20 })
    } catch (error) {
      console.error(error)
    }
  }, 500)

  const exportersSearch = debounce(async (value: string) => {
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
        <Grid size={{ xs: 12, md: 6 }}>
          <ControlledTextField
            name='export_number'
            label='Enter Certificate ID*'
            control={control}
            errors={errors}
            required
            fullWidth
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ControlledDatePicker
            name='issued_date'
            label='Date of Issue*'
            maxDate={dayjs(new Date())}
            control={control}
            errors={errors}
            required
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ControlledDatePicker
            name='valid_until'
            label='Last day of validity*'
            control={control}
            errors={errors}
            required
            minDate={dayjs().startOf('day')} // Only allow future dates
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ControlledAutocomplete
            name='origin_country'
            label='Country of origin*'
            control={control}
            errors={errors}
            options={countryOptions}
            required
            fullWidth
            isOptionEqualToValue={(option: any, value: any) => option.value === value?.value}
            getOptionLabel={(option: any) => option.label || ''}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ControlledAutocomplete
            name='exporter_name'
            label='Exporter name*'
            control={control}
            errors={errors}
            options={exportersOptions}
            required
            fullWidth
            isOptionEqualToValue={(option: any, value: any) => option.value === value?.value}
            getOptionLabel={(option: any) => option.label || ''}
            onKeyUp={(e: any) => exportersSearch((e.target as HTMLInputElement).value)}
            onBlur={(e: any) => (e.target as HTMLInputElement).value && exportersSearch('')}
            onItemClear={() => exportersSearch('')}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ControlledAutocomplete
            name='exporting_country'
            label='Exporting Country*'
            control={control}
            errors={errors}
            options={countryOptions}
            required
            fullWidth
            isOptionEqualToValue={(option: any, value: any) => option.value === value?.value}
            getOptionLabel={(option: any) => option.label || ''}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ControlledAutocomplete
            name='importer_name'
            label='Importer name*'
            control={control}
            errors={errors}
            options={importersOptions}
            required
            fullWidth
            isOptionEqualToValue={(option: any, value: any) => option.value === value?.value}
            getOptionLabel={(option: any) => option.label || ''}
            onKeyUp={(e: any) => importersSearch((e.target as HTMLInputElement).value)}
            onBlur={(e: any) => (e.target as HTMLInputElement).value && importersSearch('')}
            onItemClear={() => importersSearch('')}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ControlledTextField
            name='export_purpose'
            label='Purpose of transfer*'
            control={control}
            errors={errors}
            required
            fullWidth
          />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <ControlledFileUpload
            name='certificate_file'
            label='Upload Permit'
            control={control}
            errors={errors}
            color={theme.palette.primary.main}
            acceptFileTypes='.pdf,.doc,.docx,.jpg,.jpeg,.png'
          />
        </Grid>
      </Grid>
    </Box>
  )
}

export default ExportPermitDetails
