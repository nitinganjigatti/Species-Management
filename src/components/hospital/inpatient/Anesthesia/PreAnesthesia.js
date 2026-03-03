import React, { useState } from 'react'
import { Typography, styled, Box, useTheme, Grid, InputAdornment } from '@mui/material'
import { useFormContext, Controller } from 'react-hook-form'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledSelectWithTextField from 'src/views/forms/form-fields/ControlledSelectWithTextField'
import MUICheckbox from 'src/views/forms/form-fields/MUICheckbox'
import CustomOtherPurposeSection from 'src/views/utility/CustomOtherPurposeSection'

const fastingTimeOptions = [
  { label: 'Hours', value: 'Hours' },
  { label: 'Minutes', value: 'Minutes' }
]

const weightOptions = [
  { label: 'Kg', value: 'Kg' },
  { label: 'Gram', value: 'Gram' }
]

function PreAnesthesia({
  physicalHealthStatusOptions = [],
  bodyConditionOptions = [],
  animalActivityOptions = [],
  codeStatusOptions = [],
  clinPathOptions = []
}) {
  const theme = useTheme()
  const {
    control,
    formState: { errors },
    watch,
    setValue
  } = useFormContext()

  const [duplicateError, setDuplicateError] = useState('')

  const normalizeName = name => {
    if (!name) return ''
    return name.toLowerCase().replace(/\s+/g, '').trim();
  }

  const handleAddCustomItem = (newItem, currentItems) => {
    const trimmed = newItem.trim()
    if (!trimmed) {
      setDuplicateError('')
      return currentItems
    }

    const normalizedNewItem = normalizeName(trimmed)
    const isInClinPathOptions = clinPathOptions.some(option => normalizeName(option.name) === normalizedNewItem)
    const isInCustomItems = currentItems.some(item => normalizeName(item) === normalizedNewItem)

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
            getOptionLabel={opt => opt.label}
            getOptionValue={opt => opt.value}
          />
        </Grid>

        <Grid size={{ xs: 4 }}>
          <ControlledSelect
            control={control}
            name='preAnesthesia.body_condition'
            errors={errors}
            label='Body Condition'
            options={bodyConditionOptions}
            getOptionLabel={opt => opt.label}
            getOptionValue={opt => opt.value}
          />
        </Grid>

        <Grid size={{ xs: 4 }}>
          <ControlledSelect
            control={control}
            name='preAnesthesia.animal_activity'
            errors={errors}
            label='Animal Activity'
            options={animalActivityOptions}
            getOptionLabel={opt => opt.label}
            getOptionValue={opt => opt.value}
          />
        </Grid>

        <Grid size={{ xs: 4 }}>
          <ControlledSelectWithTextField
            textFieldName='preAnesthesia.fasting_time'
            selectFieldName='preAnesthesia.fasting_unit'
            control={control}
            errors={errors}
            options={fastingTimeOptions}
            label='Fasting Time'
            placeholder='Enter fasting time'
            type='number'
            getOptionLabel={option => option.label}
            getOptionValue={option => option.value}
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
            getOptionLabel={opt => opt.label}
            getOptionValue={opt => opt.value}
          />
        </Grid>

        <Grid size={{ xs: 4 }}>
          <ControlledSelectWithTextField
            textFieldName='preAnesthesia.weight'
            selectFieldName='preAnesthesia.weight_unit'
            control={control}
            errors={errors}
            options={weightOptions}
            label='Weight'
            placeholder='Weight'
            type='number'
            getOptionLabel={option => option.label}
            getOptionValue={option => option.value}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Controller
            name='preAnesthesia.mark_weight_as_approximate'
            control={control}
            render={({ field }) => (
              <MUICheckbox
                checked={!!field.value}
                onChange={(_, checked) => field.onChange(checked)}
                label='Mark weight as approximate'
                labelStyle={{
                  fontSize: '14px',
                  fontWeight: 400,
                  color: theme.palette.customColors.neutralSecondary
                }}
              />
            )}
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
          {clinPathOptions.map(option => (
            <Controller
              key={option.id}
              name={`preAnesthesia.clin_path.selected.${option.id}`}
              control={control}
              render={({ field }) => (
                <MUICheckbox
                  checked={!!field.value}
                  label={option.name}
                  onChange={(_, checked) => field.onChange(checked)}
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
            render={({ field }) => {
              return (
                <CustomOtherPurposeSection
                  title='Add New other Item'
                  addedLabel='Other Clin Path Items Added'
                  value={field.value || []}
                  onChange={newValue => {
                    field.onChange(newValue)
                  }}
                  onAddItem={newItem => {
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

const StyledTypography = styled(Typography)(({ theme }) => ({
  fontSize: '1rem',
  fontWeight: 500,
  color: theme.palette.customColors.OnSurfaceVariant
}))
