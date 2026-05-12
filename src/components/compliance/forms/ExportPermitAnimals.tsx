import React from 'react'
import { Box, Typography, IconButton, Divider, Button, Alert, Card, CardContent, Grid } from '@mui/material'
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import SelectableSpeciesCard from 'src/views/pages/compliance/documents/exports/SelectableSpeciesCard'
import { useTheme, alpha } from '@mui/material/styles'
import type { ExportPermitAnimalsProps } from 'src/types/compliance'
import type { ExportSpeciesFormItem } from 'src/types/compliance'
import { useTranslation } from 'react-i18next'

const ExportPermitAnimals = ({
  control,
  errors,
  speciesList,
  handleSpeciesUpdate,
  handleRemoveSpecies,
  setSpeciesDrawerOpen,
  genderOptions,
  appendixOptions,
  identifierOptions,
  setSpeciesList,
  setValue
}: ExportPermitAnimalsProps) => {
  const theme = useTheme()
  const { t } = useTranslation()

  // Calculate totals
  const totalSpeciesCount = speciesList.length

  const totalAnimalCount = speciesList.reduce(
    (sum, species) =>
      sum +
      (parseInt(String(species.male_count)) || 0) +
      (parseInt(String(species.female_count)) || 0) +
      (parseInt(String(species.undeterminate_count)) || 0),
    0
  )

  // Helper to get available gender counts
  const getAvailableGenderCounts = (species: ExportSpeciesFormItem) => {
    const maleCount = parseInt(String(species.male_count)) || 0
    const femaleCount = parseInt(String(species.female_count)) || 0
    const undeterminedCount = parseInt(String(species.undeterminate_count)) || 0

    const usedMale = species.animalDetails.filter(a => a.gender?.value === 'male').length
    const usedFemale = species.animalDetails.filter(a => a.gender?.value === 'female').length
    const usedUndetermined = species.animalDetails.filter(a => a.gender?.value === 'unknown').length

    return {
      male: maleCount - usedMale,
      female: femaleCount - usedFemale,
      undetermined: undeterminedCount - usedUndetermined
    }
  }

  // Validation helper
  const validateAnimalCounts = (species: ExportSpeciesFormItem) => {
    const male = parseInt(String(species.male_count)) || 0
    const female = parseInt(String(species.female_count)) || 0
    const undetermined = parseInt(String(species.undeterminate_count)) || 0

    const totalCount = male + female + undetermined

    const animalDetailsCount = species.animalDetails.length

    // Count of each gender in animal details
    const maleDetails = species.animalDetails.filter(a => a.gender?.value === 'male').length
    const femaleDetails = species.animalDetails.filter(a => a.gender?.value === 'female').length
    const undeterminedDetails = species.animalDetails.filter(a => a.gender?.value === 'unknown').length

    return (
      totalCount >= animalDetailsCount &&
      male >= maleDetails &&
      female >= femaleDetails &&
      undetermined >= undeterminedDetails
    )
  }

  const handleCountChange = (speciesIndex: number, field: string, value: string) => {
    const species = speciesList[speciesIndex]
    const intValue = parseInt(value) || 0

    let updatedSpecies = { ...species, [field]: intValue }

    // Recalculate total count
    updatedSpecies.total_count =
      (updatedSpecies.male_count || 0) + (updatedSpecies.female_count || 0) + (updatedSpecies.undeterminate_count || 0)

    handleSpeciesUpdate(species.id!, updatedSpecies)
  }

  const handleSpecieUpdate = (speciesIndex: number, field: string, value: unknown) => {
    const species = speciesList[speciesIndex]
    const updatedSpecies = { ...species, [field]: value }

    handleSpeciesUpdate(species.id!, updatedSpecies)
  }

  const handleAddAnimal = (speciesIndex: number) => {
    const species = speciesList[speciesIndex]

    const newAnimal: import('src/types/compliance').ExportAnimalFormItem = {
      id: `new_${Date.now()}`,
      animal_type: '',
      gender: { label: '', value: '' } as any,
      identifier_type: null,
      identifier_value: ''
    }

    const updatedSpecies: import('src/types/compliance').ExportSpeciesFormItem = {
      ...species,
      animalDetails: [...species.animalDetails, newAnimal]
    }

    handleSpeciesUpdate(species.id!, updatedSpecies)
  }

  const handleRemoveAnimal = (speciesIndex: number, animalId: string | number) => {
    const species = speciesList[speciesIndex]
    const updatedAnimalDetails = species.animalDetails.filter(animal => animal.id != animalId)

    const updatedSpecies = {
      ...species,
      animalDetails: updatedAnimalDetails
    }

    handleSpeciesUpdate(species.id!, updatedSpecies)
  }

  const handleAnimalDetailChange = (speciesIndex: number, animalIndex: number, field: string, value: unknown) => {
    const updatedSpeciesList = [...speciesList]
    const updatedAnimalDetails = [...updatedSpeciesList[speciesIndex].animalDetails]

    updatedAnimalDetails[animalIndex] = {
      ...updatedAnimalDetails[animalIndex],
      [field]: value
    }

    updatedSpeciesList[speciesIndex] = {
      ...updatedSpeciesList[speciesIndex],
      animalDetails: updatedAnimalDetails
    }

    // Update both states
    setSpeciesList(updatedSpeciesList)
    setValue(`speciesList.${speciesIndex}.animalDetails` as any, updatedAnimalDetails)
  }

  return (
    <Box sx={{ mt: 8 }}>
      <Typography variant='h6' gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
        2. {t('animals')}
      </Typography>

      <Box sx={{ display: 'flex', gap: 6, mb: 4 }}>
        <Typography
          variant='body2'
          sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '1.25rem', fontWeight: 500 }}
        >
          {t('compliance_module.species_count')}: <strong>{totalSpeciesCount}</strong>
        </Typography>
        <Typography
          variant='body2'
          sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '1.25rem', fontWeight: 500 }}
        >
          {t('necropsy_module.animal_count')}: <strong>{totalAnimalCount}</strong>
        </Typography>
      </Box>

      {/* Species List Error */}
      {errors.speciesList?.message && speciesList.length === 0 && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {errors.speciesList.message}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {speciesList?.map((speciesItem, speciesIndex) => {
          const isValidCount = validateAnimalCounts(speciesItem)
          const speciesErrors = errors.speciesList?.[speciesIndex] || {}
          const availableCounts = getAvailableGenderCounts(speciesItem)

          return (
            <Card
              key={speciesItem.id}
              variant='outlined'
              sx={{
                width: '100%',
                backgroundColor: alpha(theme.palette.customColors.displaybgPrimary || '', 0.4),
                p: 2,
                borderRadius: 2
              }}
            >
              <CardContent>
                {/* Species Card */}
                <Grid container spacing={4} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 12, md: 5, lg: 5 }}>
                    <SelectableSpeciesCard
                      species={{
                        common_name: speciesItem.species.common_name,
                        scientific_name:
                          speciesItem?.species?.scientific_name || speciesItem?.species?.complete_name || '',
                        default_icon: speciesItem.species.default_icon
                      }}
                      selectionType='cross'
                      selected={true}
                      borderColor={theme.palette.customColors.OutlineVariant}
                      onClick={() => handleRemoveSpecies(speciesItem.id!)}
                    />
                  </Grid>
                </Grid>

                {/* Animal Counts Section */}
                <Typography
                  variant='subtitle2'
                  gutterBottom
                  sx={{
                    fontWeight: 500,
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontSize: '1rem',
                    mt: 6,
                    mb: 4
                  }}
                >
                  {t('compliance_module.cites_details_and_animal_count')}
                </Typography>

                <Grid container spacing={4} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 12, md: 4.5 }}>
                    <ControlledAutocomplete
                      name={`speciesList.${speciesIndex}.appendix`}
                      label={`${t('compliance_module.select_appendix')} *`}
                      control={control}
                      errors={errors}
                      options={appendixOptions}
                      getOptionLabel={(option: any) => option.label}
                      isOptionEqualToValue={(option: any, value: any) => option.value === value?.value}
                      onChangeOverride={(value: any) => handleSpecieUpdate(speciesIndex, 'appendix', value)}
                      formHelperTextBackgroundColor={alpha(theme.palette.customColors.displaybgPrimary || '', 0.4)}
                      sx={{ backgroundColor: theme.palette.common.white }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 2.5 }}>
                    <ControlledTextField
                      name={`speciesList.${speciesIndex}.male_count`}
                      label={`# ${t('male')}`}
                      type='number'
                      control={control}
                      errors={errors}
                      onChangeOverride={(e: any) => handleCountChange(speciesIndex, 'male_count', e.target.value)}
                      inputProps={{ min: 0 }}
                      sx={{ backgroundColor: theme.palette.common.white }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 2.5 }}>
                    <ControlledTextField
                      name={`speciesList.${speciesIndex}.female_count`}
                      label={`# ${t('female')}`}
                      type='number'
                      control={control}
                      errors={errors}
                      onChangeOverride={(e: any) => handleCountChange(speciesIndex, 'female_count', e.target.value)}
                      inputProps={{ min: 0 }}
                      sx={{ backgroundColor: theme.palette.common.white }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 2.5 }}>
                    <ControlledTextField
                      name={`speciesList.${speciesIndex}.undeterminate_count`}
                      label={`# ${t('animals_module.unknown')}`}
                      type='number'
                      control={control}
                      errors={errors}
                      onChangeOverride={(e: any) =>
                        handleCountChange(speciesIndex, 'undeterminate_count', e.target.value)
                      }
                      inputProps={{ min: 0 }}
                      sx={{ backgroundColor: theme.palette.common.white }}
                    />
                  </Grid>
                </Grid>

                {/* Count Mismatch Warning */}
                {!isValidCount && (
                  <Alert severity='error' sx={{ mb: 2, mt: 4 }}>
                    {t(
                      'compliance_module.animal_count_should_be_greater_than_or_equal_to_0_and_gender_counts_must_not_exceed_their_specified_limits'
                    )}
                  </Alert>
                )}

                <Divider sx={{ my: 6, color: theme.palette.customColors.OutlineVariant }} />

                {/* Animal Details Section */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography
                    variant='subtitle2'
                    gutterBottom
                    sx={{
                      fontWeight: 500,
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontSize: '1rem'
                    }}
                  >
                    {t('animals_module.animal_details')}
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => handleAddAnimal(speciesIndex)}
                    disabled={
                      (!speciesItem.male_count && !speciesItem.female_count && !speciesItem.undeterminate_count) ||
                      speciesItem.animalDetails.length >= (speciesItem.total_count ?? 0)
                    }
                  >
                    {t('add_animal')}
                  </Button>
                </Box>

                {/* Animal Details List */}
                {speciesItem.animalDetails.map((detail, animalIndex) => {
                  const filteredGenderOptions = genderOptions
                    .map(option => {
                      const genderKey = (
                        option.value === 'unknown' ? 'undetermined' : option.value
                      ) as keyof typeof availableCounts
                      const countLeft = availableCounts[genderKey]

                      return {
                        ...option,
                        disabled: countLeft <= 0 && detail.gender?.value !== option.value
                      }
                    })

                    // Filter out options that are disabled and not currently selected
                    .filter(option => !option.disabled || detail.gender?.value === option.value)

                  return (
                    <Box key={detail.id} sx={{ mt: 4 }}>
                      <Grid container spacing={4} alignItems='center'>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <ControlledAutocomplete
                            name={`speciesList[${speciesIndex}].animalDetails[${animalIndex}].gender`}
                            label={`${t('gender')}*`}
                            control={control}
                            errors={errors}
                            options={filteredGenderOptions}
                            getOptionLabel={(option: any) => option.label}
                            isOptionEqualToValue={(option: any, value: any) => option.value === value?.value}
                            onChangeOverride={(value: any) =>
                              handleAnimalDetailChange(speciesIndex, animalIndex, 'gender', value)
                            }
                            formHelperTextBackgroundColor={alpha(
                              theme.palette.customColors.displaybgPrimary || '',
                              0.4
                            )}
                            sx={{ backgroundColor: theme.palette.common.white }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <ControlledAutocomplete
                            name={`speciesList[${speciesIndex}].animalDetails[${animalIndex}].identifier_type`}
                            label={t('compliance_module.identifier_type')}
                            control={control}
                            errors={errors}
                            options={identifierOptions}
                            getOptionLabel={(option: any) => option.label}
                            isOptionEqualToValue={(option: any, value: any) => option.value === value?.value}
                            onChangeOverride={(value: any) =>
                              handleAnimalDetailChange(speciesIndex, animalIndex, 'identifier_type', value)
                            }
                            formHelperTextBackgroundColor={alpha(
                              theme.palette.customColors.displaybgPrimary || '',
                              0.4
                            )}
                            sx={{ backgroundColor: theme.palette.common.white }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <ControlledTextField
                            name={`speciesList[${speciesIndex}].animalDetails[${animalIndex}].identifier_value`}
                            label={t('compliance_module.identifier_value')}
                            control={control}
                            errors={errors}
                            onChangeOverride={(e: any) =>
                              handleAnimalDetailChange(speciesIndex, animalIndex, 'identifier_value', e.target.value)
                            }
                            sx={{ backgroundColor: theme.palette.common.white }}
                          />
                        </Grid>
                        <Grid
                          size={{ xs: 12, md: 1 }}
                          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <IconButton
                            onClick={() => handleRemoveAnimal(speciesIndex, detail.id!)}
                            sx={{ backgroundColor: theme.palette.customColors.neutral05 }}
                          >
                            <CloseIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Box>
                  )
                })}
              </CardContent>
            </Card>
          )
        })}
      </Box>

      <Box
        sx={{
          width: '100%',
          backgroundColor: alpha(theme.palette.customColors.displaybgPrimary || '', 0.4),
          p: 8,
          my: 4,
          borderRadius: 2
        }}
      >
        <Button
          variant='outlined'
          onClick={() => setSpeciesDrawerOpen(true)}
          startIcon={<AddIcon />}
          sx={{
            width: '100%',
            py: 2,
            fontSize: '1rem',
            fontWeight: 500,
            border: '2px dashed',
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.common.white,
            '&:hover': {
              border: '2px dashed',
              backgroundColor: theme.palette.action.hover
            }
          }}
        >
          {t('compliance_module.add_species')}
        </Button>
      </Box>

      {speciesList.length === 0 && (
        <Alert severity='info' sx={{ my: 4 }}>
          {t('compliance_module.at_least_one_species_must_be_selected_to_proceed_with_the_form_submission')}
        </Alert>
      )}
    </Box>
  )
}

export default ExportPermitAnimals
