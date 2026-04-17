'use client'
import React, { useState } from 'react'
import { Typography, styled, Box, useTheme, Grid, InputAdornment } from '@mui/material'
import { useFormContext, Controller } from 'react-hook-form'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledSelectWithTextField from 'src/views/forms/form-fields/ControlledSelectWithTextField'
import MUICheckbox from 'src/views/forms/form-fields/MUICheckbox'
import CustomOtherPurposeSection from 'src/views/utility/CustomOtherPurposeSection'
import ControlledCheckBox from 'src/views/forms/form-fields/ControlledCheckBox'

const fastingTimeOptions = [
  { label: 'Hours', value: 'Hours' },
  { label: 'Minutes', value: 'Minutes' }
]

const weightOptions = [
  { label: 'Kg', value: 'Kg' },
  { label: 'Gram', value: 'Gram' }
]

interface PreAnesthesiaProps {
  physicalHealthStatusOptions?: any[]
  bodyConditionOptions?: any[]
  animalActivityOptions?: any[]
  codeStatusOptions?: any[]
  clinPathOptions?: any[]
}

function PreAnesthesia({
  physicalHealthStatusOptions = [],
  bodyConditionOptions = [],
  animalActivityOptions = [],
  codeStatusOptions = [],
  clinPathOptions = []
}: PreAnesthesiaProps) {
  const theme: any = useTheme()
  const {
    control,
    formState: { errors },
    watch,
    setValue
  } = useFormContext()

  const [duplicateError, setDuplicateError] = useState<string>('')

  const normalizeName = (name: string) => {
    if (!name) return ''
    return name.toLowerCase().replace(/\s+/g, '').trim();
  }

  const handleAddCustomItem = (newItem: string, currentItems: string[]) => {
    const trimmed = newItem.trim()
    if (!trimmed) {
      setDuplicateError('')
      return currentItems
    }

    const normalizedNewItem = normalizeName(trimmed)
    const isInClinPathOptions = clinPathOptions.some((option: any) => normalizeName(option.name) === normalizedNewItem)
    const isInCustomItems = currentItems.some((item: string) => normalizeName(item) === normalizedNewItem)

    if (isInClinPathOptions || isInCustomItems) {
      setDuplicateError('Item already exists')
      return currentItems
    }
    setDuplicateError('')
    return [...currentItems, trimmed]
  }

  return (
    <Box sx={{ p: '0 0px 24px 0px' }}>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <StyledTypography>Environmental Condition</StyledTypography>
        </Grid>

        <Grid size={{ xs: 4 }}>
          <ControlledTextField
            control={control}
            errors={errors}
            label='Temperature'
            name='preAnesthesia.temperature'
            placeholder='Enter Temperature'
            type='number'
            inputSlotProps={{
              endAdornment: (
                <InputAdornment position='end'>
                  <StyledTypography>°C</StyledTypography>
                </InputAdornment>
              )
            }}
          />
        </Grid>

        <Grid size={{ xs: 4 }}>
          <ControlledTextField
            control={control}
            errors={errors}
            label='Humidity'
            name='preAnesthesia.humidity'
            placeholder='Enter Humidity'
            type='number'
            inputSlotProps={{
              endAdornment: (
                <InputAdornment position='end'>
                  <StyledTypography>%</StyledTypography>
                </InputAdornment>
              )
            }}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <StyledTypography>Pre Anesthetic Examination</StyledTypography>
        </Grid>

        <Grid size={{ xs: 4 }}>
          <ControlledSelect
            control={control}
            name='preAnesthesia.physical_health_status'
            errors={errors}
            label='Physical Health Status'
            options={physicalHealthStatusOptions}
            getOptionLabel={(opt: any) => opt.label}
            getOptionValue={(opt: any) => opt.value}
          />
        </Grid>

        <Grid size={{ xs: 4 }}>
          <ControlledSelect
            control={control}
            name='preAnesthesia.body_condition'
            errors={errors}
            label='Body Condition'
            options={bodyConditionOptions}
            getOptionLabel={(opt: any) => opt.label}
            getOptionValue={(opt: any) => opt.value}
          />
        </Grid>

        <Grid size={{ xs: 4 }}>
          <ControlledSelect
            control={control}
            name='preAnesthesia.animal_activity'
            errors={errors}
            label='Animal Activity'
            options={animalActivityOptions}
            getOptionLabel={(opt: any) => opt.label}
            getOptionValue={(opt: any) => opt.value}
          />
        </Grid>

        <Grid size={{ xs: 4 }}>
          <ControlledSelectWithTextField
            textFieldName='preAnesthesia.fasting_time'
            selectFieldName='preAnesthesia.fasting_unit'
            control={control}
            errors={errors}
            {...({ options: fastingTimeOptions } as any)}
            label='Fasting Time'
            placeholder='Enter fasting time'
            type='number'
            getOptionLabel={(option: any) => option.label}
            getOptionValue={(option: any) => option.value}
            showEmptyMenuItem={false}
            showEmptyMenuItemLabel={false}
            min={1}
          />
        </Grid>

        <Grid size={{ xs: 4 }}>
          <ControlledTextField
            control={control}
            errors={errors}
            label='Previous endotracheal tube size'
            name='preAnesthesia.previous_endotracheal_tube_size'
            placeholder='Previous endotracheal tube size'
            type='text'
          />
        </Grid>

        <Grid size={{ xs: 4 }}>
          <ControlledSelect
            control={control}
            name='preAnesthesia.code_status'
            errors={errors}
            label='Code status'
            options={codeStatusOptions}
            getOptionLabel={(opt: any) => opt.label}
            getOptionValue={(opt: any) => opt.value}
          />
        </Grid>

        <Grid size={{ xs: 4 }}>
          <ControlledSelectWithTextField
            textFieldName='preAnesthesia.weight'
            selectFieldName='preAnesthesia.weight_unit'
            control={control}
            errors={errors}
            {...({ options: weightOptions } as any)}
            label='Weight'
            placeholder='Weight'
            type='number'
            getOptionLabel={(option: any) => option.label}
            getOptionValue={(option: any) => option.value}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <ControlledCheckBox
            name='preAnesthesia.mark_weight_as_approximate'
            control={control}
            label='Mark weight as approximate'
            {...({ labelStyle: {
              fontSize: '14px',
              fontWeight: 400,
              color: theme.palette.customColors.neutralSecondary
            } } as any)}
            />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <ControlledTextField
            control={control}
            errors={errors}
            label='Risk / Concerns'
            name='preAnesthesia.pre_anesthesia_notes'
            placeholder='Enter Risk / Concerns'
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <StyledTypography>Clin Path</StyledTypography>
        </Grid>

        <Grid size={{ xs: 12 }} sx={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {clinPathOptions.map((option: any) => (
            <Controller
              key={option.id}
              name={`preAnesthesia.clin_path.selected.${option.id}`}
              control={control}
              render={({ field }: any) => (
                <MUICheckbox
                  {...({
                    checked: !!field.value,
                    label: option.name,
                    onChange: (_: any, checked: boolean) => field.onChange(checked)
                  } as any)}
                />
              )}
            />
          ))}
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Controller
            name='preAnesthesia.clin_path.custom'
            control={control}
            defaultValue={[]}
            render={({ field }: any) => {
              return (
                <CustomOtherPurposeSection
                  title='Add New other Item'
                  addedLabel='Other Clin Path Items Added'
                  value={field.value || []}
                  onChange={(newValue: any) => {
                    field.onChange(newValue)
                  }}
                  onAddItem={(newItem: string) => {
                    const currentItems = field.value || []
                    const updatedItems = handleAddCustomItem(newItem, currentItems)
                    if (updatedItems !== currentItems) {
                      field.onChange(updatedItems)
                    }
                  }}
                  duplicateError={duplicateError}
                  clearError={() => setDuplicateError('')}
                />
              )
            }}
          />
        </Grid>
      </Grid>
    </Box>
  )
}

export default PreAnesthesia

const StyledTypography = styled(Typography)(({ theme }: any) => ({
  fontSize: '1rem',
  fontWeight: 500,
  color: theme.palette.customColors.OnSurfaceVariant
}))
