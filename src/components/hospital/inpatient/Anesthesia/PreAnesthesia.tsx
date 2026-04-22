'use client'
import React, { useState } from 'react'
import { Typography, styled, Box, useTheme, Grid, InputAdornment } from '@mui/material'
import { useFormContext, Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledSelectWithTextField from 'src/views/forms/form-fields/ControlledSelectWithTextField'
import MUICheckbox from 'src/views/forms/form-fields/MUICheckbox'
import CustomOtherPurposeSection from 'src/views/utility/CustomOtherPurposeSection'
import ControlledCheckBox from 'src/views/forms/form-fields/ControlledCheckBox'

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
  const { t } = useTranslation()
  const {
    control,
    formState: { errors },
    watch,
    setValue
  } = useFormContext()

  const [duplicateError, setDuplicateError] = useState<string>('')

  const fastingTimeOptions = [
    { label: t('hospital_module.hours', 'Hours'), value: 'Hours' },
    { label: t('hospital_module.minutes', 'Minutes'), value: 'Minutes' }
  ]

  const weightOptions = [
    { label: t('hospital_module.kg', 'Kg'), value: 'Kg' },
    { label: t('hospital_module.gram', 'Gram'), value: 'Gram' }
  ]

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
      setDuplicateError(t('hospital_module.item_already_exists') as string)
      return currentItems
    }
    setDuplicateError('')
    return [...currentItems, trimmed]
  }

  return (
    <Box sx={{ p: '0 0px 24px 0px' }}>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <StyledTypography>{t('hospital_module.environmental_condition')}</StyledTypography>
        </Grid>

        <Grid size={{ xs: 4 }}>
          <ControlledTextField
            control={control}
            errors={errors}
            label={(t('hospital_module.temperature') as string)}
            name='preAnesthesia.temperature'
            placeholder={(t('hospital_module.enter_temperature') as string)}
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
            label={(t('hospital_module.humidity') as string)}
            name='preAnesthesia.humidity'
            placeholder={(t('hospital_module.enter_humidity') as string)}
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
          <StyledTypography>{t('hospital_module.pre_anesthetic_examination')}</StyledTypography>
        </Grid>

        <Grid size={{ xs: 4 }}>
          <ControlledSelect
            control={control}
            name='preAnesthesia.physical_health_status'
            errors={errors}
            label={(t('hospital_module.physical_health_status') as string)}
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
            label={(t('hospital_module.body_condition') as string)}
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
            label={(t('hospital_module.animal_activity') as string)}
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
            label={(t('hospital_module.fasting_time') as string)}
            placeholder={(t('hospital_module.enter_fasting_time') as string)}
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
            label={(t('hospital_module.previous_endotracheal_tube_size') as string)}
            name='preAnesthesia.previous_endotracheal_tube_size'
            placeholder={(t('hospital_module.previous_endotracheal_tube_size') as string)}
            type='text'
          />
        </Grid>

        <Grid size={{ xs: 4 }}>
          <ControlledSelect
            control={control}
            name='preAnesthesia.code_status'
            errors={errors}
            label={(t('hospital_module.code_status') as string)}
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
            label={(t('hospital_module.weight') as string)}
            placeholder={(t('hospital_module.weight') as string)}
            type='number'
            getOptionLabel={(option: any) => option.label}
            getOptionValue={(option: any) => option.value}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <ControlledCheckBox
            name='preAnesthesia.mark_weight_as_approximate'
            control={control}
            label={(t('hospital_module.mark_weight_as_approximate') as string)}
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
            label={(t('hospital_module.risk_concerns') as string)}
            name='preAnesthesia.pre_anesthesia_notes'
            placeholder={(t('hospital_module.enter_risk_concerns') as string)}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <StyledTypography>{t('hospital_module.clin_path')}</StyledTypography>
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
                  title={(t('hospital_module.add_new_other_item') as string)}
                  addedLabel={t('hospital_module.other_clin_path_items_added') as string}
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
