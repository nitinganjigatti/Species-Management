import React from 'react'
import { Box, Typography, IconButton, Divider, Button, Alert, Card, CardContent, Grid } from '@mui/material'
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import SelectableSpeciesCard from '../SelectableSpeciesCard'
import { useTheme, alpha } from '@mui/material/styles'

const ExportPermitAnimals = ({
  control,
  errors,
  speciesList,
  handleSpeciesUpdate,
  handleRemoveSpecies,
  setSpeciesDrawerOpen
}) => {
  const theme = useTheme()

  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Unknown', value: 'unknown' }
  ]

  const identifierOptions = [
    { label: 'Microchip', value: 'microchip' },
    { label: 'Tag', value: 'tag' },
    { label: 'Band', value: 'band' },
    { label: 'Tattoo', value: 'tattoo' },
    { label: 'Group Tag', value: 'group_tag' }
  ]

  const appendixOptions = [
    { label: 'Appendix 1', value: 'appendix_1' },
    { label: 'Appendix 2', value: 'appendix_2' },
    { label: 'Appendix 3', value: 'appendix_3' }
  ]

  // Calculate totals
  const totalSpeciesCount = speciesList.length

  const totalAnimalCount = speciesList.reduce((sum, species) => {
    const count = species.animalDetails?.reduce((s, a) => s + (parseInt(a.animal_count) || 0), 0)

    return sum + count
  }, 0)

  // Validation helper
  const validateAnimalCounts = species => {
    const male = parseInt(species.male_count) || 0
    const female = parseInt(species.female_count) || 0
    const undetermined = parseInt(species.undeterminate_count) || 0

    const totalCount = male + female + undetermined

    const animalDetailsCount = species.animalDetails.reduce(
      (sum, detail) => sum + (parseInt(detail.animal_count) || 0),
      0
    )

    return totalCount >= animalDetailsCount
  }

  const handleCountChange = (speciesIndex, field, value) => {
    const species = speciesList[speciesIndex]
    const intValue = parseInt(value) || 0

    let updatedSpecies = { ...species, [field]: intValue }

    // Recalculate total count
    updatedSpecies.total_count =
      updatedSpecies.male_count + updatedSpecies.female_count + updatedSpecies.undeterminate_count

    handleSpeciesUpdate(species.id, updatedSpecies)
  }

  const handleSpecieUpdate = (speciesIndex, field, value) => {
    const species = speciesList[speciesIndex]
    const updatedSpecies = { ...species, [field]: value }

    handleSpeciesUpdate(species.id, updatedSpecies)
  }

  const handleAddAnimal = speciesIndex => {
    const species = speciesList[speciesIndex]

    const newAnimal = {
      id: '',
      animalType: 'single',
      animal_count: 1,
      gender: { label: '', value: null },
      identifierType: { label: '', value: null },
      identifierValue: ''
    }

    const updatedSpecies = {
      ...species,
      animalDetails: [...species.animalDetails, newAnimal]
    }

    handleSpeciesUpdate(species.id, updatedSpecies)
  }

  const handleRemoveAnimal = (speciesIndex, animalIndex) => {
    const species = speciesList[speciesIndex]
    const updatedAnimalDetails = species.animalDetails.filter((_, index) => index !== animalIndex)

    const updatedSpecies = {
      ...species,
      animalDetails: updatedAnimalDetails
    }

    handleSpeciesUpdate(species.id, updatedSpecies)
  }

  const handleAnimalDetailChange = (speciesIndex, animalIndex, field, value) => {
    const species = speciesList[speciesIndex]
    const updatedAnimalDetails = [...species.animalDetails]
    updatedAnimalDetails[animalIndex] = {
      ...updatedAnimalDetails[animalIndex],
      [field]: value
    }

    const updatedSpecies = {
      ...species,
      animalDetails: updatedAnimalDetails
    }

    handleSpeciesUpdate(species.id, updatedSpecies)
  }

  return (
    <Box sx={{ mt: 8 }}>
      <Typography variant='h6' gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
        2. Animals
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <Typography
          variant='body2'
          sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '1.25rem', fontWeight: 500 }}
        >
          Species count: <strong>{totalSpeciesCount}</strong>
        </Typography>
        <Typography
          variant='body2'
          sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '1.25rem', fontWeight: 500 }}
        >
          Animal count: <strong>{totalAnimalCount}</strong>
        </Typography>
      </Box>

      {/* Species List Error */}
      {errors.speciesList && !Array.isArray(errors.speciesList) && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {errors.speciesList.message}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {speciesList?.map((speciesItem, speciesIndex) => {
          const isValidCount = validateAnimalCounts(speciesItem)
          const speciesErrors = errors.speciesList?.[speciesIndex] || {}

          return (
            <Card
              key={speciesItem.id}
              variant='outlined'
              sx={{
                width: '100%',
                backgroundColor: alpha(theme.palette.customColors.displaybgPrimary, 0.4),
                p: 2,
                borderRadius: 2
              }}
            >
              <CardContent>
                {/* Species Card */}
                <Grid container spacing={4} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={5} lg={5}>
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
                      onClick={() => handleRemoveSpecies(speciesItem.id)}
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
                  Cites Details & Animal Count
                </Typography>

                <Grid container spacing={4} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={4.5}>
                    <ControlledAutocomplete
                      name={`speciesList.${speciesIndex}.appendix`}
                      label='Select Appendix'
                      control={control}
                      errors={errors}
                      options={appendixOptions}
                      getOptionLabel={option => option.label}
                      isOptionEqualToValue={(option, value) => option.value === value?.value}
                      onChangeOverride={value => handleSpecieUpdate(speciesIndex, 'appendix', value)}
                      sx={{ backgroundColor: theme.palette.common.white }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2.5}>
                    <ControlledTextField
                      name={`speciesList.${speciesIndex}.male_count`}
                      label='# Male'
                      type='number'
                      control={control}
                      errors={errors}
                      onChangeOverride={e => handleCountChange(speciesIndex, 'male_count', e.target.value)}
                      inputProps={{ min: 0 }}
                      sx={{ backgroundColor: theme.palette.common.white }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2.5}>
                    <ControlledTextField
                      name={`speciesList.${speciesIndex}.female_count`}
                      label='# Female'
                      type='number'
                      control={control}
                      errors={errors}
                      onChangeOverride={e => handleCountChange(speciesIndex, 'female_count', e.target.value)}
                      inputProps={{ min: 0 }}
                      sx={{ backgroundColor: theme.palette.common.white }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2.5}>
                    <ControlledTextField
                      name={`speciesList.${speciesIndex}.undeterminate_count`}
                      label='# Undetermined'
                      type='number'
                      control={control}
                      errors={errors}
                      onChangeOverride={e => handleCountChange(speciesIndex, 'undeterminate_count', e.target.value)}
                      inputProps={{ min: 0 }}
                      sx={{ backgroundColor: theme.palette.common.white }}
                    />
                  </Grid>
                </Grid>

                {/* Total Count Display */}
                {/* <Typography variant='body2' sx={{ mb: 2, fontWeight: 500 }}>
                  Total Count: {speciesItem.total_count}
                </Typography> */}

                {/* Count Mismatch Warning */}
                {!isValidCount && (
                  <Alert severity='error' sx={{ mb: 2, mt: 4 }}>
                    Animal details count (
                    {speciesItem.animalDetails.reduce((sum, detail) => sum + (parseInt(detail.animal_count) || 0), 0)})
                    must be less than total count ({speciesItem.total_count})
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
                    Animal Details
                  </Typography>
                  <Button startIcon={<AddIcon />} onClick={() => handleAddAnimal(speciesIndex)}>
                    Add Animal
                  </Button>
                </Box>

                {/* Animal Details List */}
                {speciesItem.animalDetails.map((detail, animalIndex) => {
                  return (
                    <Box key={animalIndex} sx={{ mt: 4 }}>
                      <Grid container spacing={4} alignItems='center'>
                        <Grid item xs={12} md={4}>
                          <ControlledAutocomplete
                            name={`speciesList.${speciesIndex}.animalDetails.${animalIndex}.gender`}
                            label='Gender'
                            control={control}
                            errors={errors}
                            options={genderOptions}
                            getOptionLabel={option => option.label}
                            isOptionEqualToValue={(option, value) => option.value === value?.value}
                            onChangeOverride={value =>
                              handleAnimalDetailChange(speciesIndex, animalIndex, 'gender', value)
                            }
                            sx={{ backgroundColor: theme.palette.common.white }}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <ControlledAutocomplete
                            name={`speciesList.${speciesIndex}.animalDetails.${animalIndex}.identifier_type`}
                            label='Identifier Type'
                            control={control}
                            errors={errors}
                            options={identifierOptions}
                            getOptionLabel={option => option.label}
                            isOptionEqualToValue={(option, value) => option.value === value?.value}
                            onChangeOverride={value =>
                              handleAnimalDetailChange(speciesIndex, animalIndex, 'identifier_type', value)
                            }
                            sx={{ backgroundColor: theme.palette.common.white }}
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <ControlledTextField
                            name={`speciesList.${speciesIndex}.animalDetails.${animalIndex}.identifier_value`}
                            label='Identifier Value'
                            control={control}
                            errors={errors}
                            onChangeOverride={e =>
                              handleAnimalDetailChange(speciesIndex, animalIndex, 'identifier_value', e.target.value)
                            }
                            sx={{ backgroundColor: theme.palette.common.white }}
                          />
                        </Grid>
                        <Grid
                          item
                          xs={12}
                          md={1}
                          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <IconButton
                            onClick={() => handleRemoveAnimal(speciesIndex, animalIndex)}
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
          backgroundColor: alpha(theme.palette.customColors.displaybgPrimary, 0.4),
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
          Add Species
        </Button>
      </Box>

      {speciesList.length === 0 && (
        <Alert severity='info' sx={{ my: 4 }}>
          At least one species must be selected to proceed with the form submission.
        </Alert>
      )}
    </Box>
  )
}

export default ExportPermitAnimals
