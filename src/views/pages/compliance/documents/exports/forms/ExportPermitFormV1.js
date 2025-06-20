import React, { useState } from 'react'
import { Grid, Box, Typography, IconButton, Divider, Button, Alert, Card, CardContent } from '@mui/material'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import FileUpload from 'src/views/forms/form-fields/ControlledFileUpload'

// import AnimalDetailsModal from '../modals/AnimalDetailsModal'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import SpeciesDrawer from '../drawer/SpeciesDrawer'
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material'
import SelectableSpeciesCard from '../SelectableSpeciesCard'
import { useTheme, alpha } from '@mui/material/styles'

export const exportPermitValidationSchema = yup.object().shape({
  certificate_id: yup
    .string()
    .required('Certificate ID is required')
    .min(3, 'Certificate ID must be at least 3 characters'),

  date_of_issue: yup
    .date()
    .required('Date of issue is required')
    .max(new Date(), 'Date of issue cannot be in the future'),

  last_day_of_validity: yup
    .date()
    .required('Last day of validity is required')
    .min(yup.ref('date_of_issue'), 'Validity date must be after issue date'),

  country_of_origin: yup
    .object()
    .shape({
      label: yup.string().required('Country of origin is required'),
      value: yup.string().required('Country of origin is required')
    })
    .required('Country of origin is required'),

  exporting_country: yup
    .object()
    .shape({
      label: yup.string().required('Exporting country is required'),
      value: yup.string().required('Exporting country is required')
    })
    .required('Exporting country is required'),

  exporter_name: yup
    .object()
    .shape({
      label: yup.string().required('Exporter name is required'),
      value: yup.string().required('Exporter name is required')
    })
    .required('Exporter name is required'),

  importer: yup
    .object()
    .shape({
      label: yup.string().required('Importer is required'),
      value: yup.string().required('Importer is required')
    })
    .required('Importer is required'),

  purpose_of_transfer: yup
    .object()
    .shape({
      label: yup.string().required('Purpose of transfer is required'),
      value: yup.string().required('Purpose of transfer is required')
    })
    .required('Purpose of transfer is required'),

  certificate_file: yup
    .mixed()
    .required('File is required')
    .test('fileType', 'Unsupported file format', value => {
      if (!value) return true // if no file, let required handle it

      return ['image/jpeg', 'image/png', 'application/pdf'].includes(value.type)
    }),

  species: yup
    .array()
    .min(1, 'At least one species must be selected')
    .required('At least one species must be selected'),

  animals: yup.array().of(
    yup.object().shape({
      species: yup.object().required(),
      appendix: yup.string(),
      maleCount: yup.number().min(0, 'Must be 0 or more').required('Required'),
      femaleCount: yup.number().min(0, 'Must be 0 or more').required('Required'),
      undeterminedCount: yup.number().min(0, 'Must be 0 or more').required('Required'),
      totalCount: yup.number().min(0, 'Must be 0 or more').required('Required'),
      animalDetails: yup
        .array()
        .of(
          yup.object().shape({
            gender: yup.string().required('Gender is required'),
            identifierType: yup.string().required('Identifier type is required'),
            identifierDetails: yup.string().required('Identifier details are required')
          })
        )
        .test(
          'count-match',
          'Number of animal details must equal the sum of male, female and undetermined counts',
          function (animalDetails) {
            const { maleCount = 0, femaleCount = 0, undeterminedCount = 0 } = this.parent
            const totalCount = maleCount + femaleCount + undeterminedCount

            return animalDetails.length === totalCount
          }
        )
    })
  ),
})

const ExportPermitForm = ({ onSubmit, onReset }) => {
  // Options data
  const countryOptions = [
    { label: 'France', value: 'FR' },
    { label: 'United States of America', value: 'US' },
    { label: 'United Kingdom', value: 'UK' },
    { label: 'Germany', value: 'DE' },
    { label: 'Japan', value: 'JP' }
  ]

  const exporterOptions = [
    { label: 'National Park', value: 'national_park' },
    { label: 'Wildlife Sanctuary', value: 'wildlife_sanctuary' },
    { label: 'Research Institute', value: 'research_institute' },
    { label: 'Zoo', value: 'zoo' }
  ]

  const importerOptions = [
    { label: 'Indian Zoo', value: 'indian_zoo' },
    { label: 'Research Center', value: 'research_center' },
    { label: 'Wildlife Park', value: 'wildlife_park' },
    { label: 'Conservation Center', value: 'conservation_center' }
  ]

  const purposeOptions = [
    { label: 'Rescue', value: 'rescue' },
    { label: 'Research', value: 'research' },
    { label: 'Conservation', value: 'conservation' },
    { label: 'Education', value: 'education' },
    { label: 'Breeding', value: 'breeding' }
  ]

  const genderOptions = [
    { label: 'Male', value: 'M' },
    { label: 'Female', value: 'F' },
    { label: 'Unknown', value: 'U' }
  ]

  const identifierOptions = [
    { label: 'Microchip', value: 'microchip' },
    { label: 'Tag', value: 'tag' },
    { label: 'Band', value: 'band' },
    { label: 'Tattoo', value: 'tattoo' }
  ]

  const appendixOptions = [
    { label: 'Appendix 1', value: 'appendix_1' },
    { label: 'Appendix 2', value: 'appendix_2' },
    { label: 'Appendix 3', value: 'appendix_3' }
  ]

  const theme = useTheme()

  const [speciesDrawerOpen, setSpeciesDrawerOpen] = useState(false)
  const [animalDetailsModalOpen, setAnimalDetailsModalOpen] = useState(false)
  const [selectedAnimalForDetails, setSelectedAnimalForDetails] = useState(null)
  const [selectedSpecies, setSelectedSpecies] = useState([])
  const [animals, setAnimals] = useState([])
  const [speciesError, setSpeciesError] = useState(null)
  const [animalErrors, setAnimalErrors] = useState({})

  const {
    setValue,
    handleSubmit,
    reset,
    control,
    formState: { errors }
  } = useForm({
    defaultValues: {
      certificate_id: '',
      date_of_issue: null,
      last_day_of_validity: null,
      country_of_origin: null,
      exporter_name: null,
      importer: null,
      purpose_of_transfer: null,
      species: [],
      animals: [],
    },
    resolver: yupResolver(exportPermitValidationSchema)
  })

  const validateAnimalCounts = animal => {
    const { maleCount = 0, femaleCount = 0, undeterminedCount = 0, animalDetails = [] } = animal
    const totalCount = maleCount + femaleCount + undeterminedCount

    return animalDetails.length === totalCount
  }

  const handleSpeciesSelect = species => {
    setSelectedSpecies(species)
    setValue('species', species)
    setSpeciesError(null)

    const newAnimals = species.map(speciesItem => ({
      id: Date.now() + Math.random(),
      species: speciesItem,
      appendix: '',
      maleCount: 0,
      femaleCount: 0,
      undeterminedCount: 0,
      animalDetails: [],
      totalCount: 0
    }))

    console.log("newAnimals", newAnimals)

    setAnimals(newAnimals)
    setValue('animals', newAnimals)
    setSpeciesDrawerOpen(false)
    setAnimalErrors({})
  }

  const handleAnimalUpdate = (animalId, field, value) => {
    const updatedAnimals = animals.map(animal => {
      if (animal.id === animalId) {
        const updated = { ...animal, [field]: value }

        if (['maleCount', 'femaleCount', 'undeterminedCount'].includes(field)) {
          updated.totalCount = (updated.maleCount || 0) + (updated.femaleCount || 0) + (updated.undeterminedCount || 0)
        }

        // Validate counts for this animal
        const isValid = validateAnimalCounts(updated)
        setAnimalErrors(prev => ({
          ...prev,
          [animalId]: isValid
            ? null
            : `Number of animal details (${updated.animalDetails.length}) must equal total count (${updated.totalCount})`
        }))

        return updated
      }

      return animal
    })

    setAnimals(updatedAnimals)
    setValue('animals', updatedAnimals)
  }

  const handleRemoveSpecies = animalId => {
    console.log("animalId", animalId)
    console.log("animalId", animals)
    const updatedAnimals = animals.filter(animal => animal.species.tsn_id !== animalId)
    setAnimals(updatedAnimals)
    setValue('animals', updatedAnimals)

    const updatedSpecies = selectedSpecies.filter(species =>
      updatedAnimals.some(animal => animal.species.id === species.id)
    )
    console.log("animalId", updatedSpecies)
    setSelectedSpecies(updatedSpecies)
    setValue('species', updatedSpecies)

    // Remove error for deleted animal
    const newErrors = { ...animalErrors }
    delete newErrors[animalId]
    setAnimalErrors(newErrors)
  }

  const handleViewAnimalDetails = animal => {
    setSelectedAnimalForDetails(animal)
    setAnimalDetailsModalOpen(true)
  }

  const handleAnimalSave = animalData => {
    const updatedAnimals = animals.map(animal => (animal.id === animalData.id ? animalData : animal))

    // Validate counts for the updated animal
    const isValid = validateAnimalCounts(animalData)
    setAnimalErrors(prev => ({
      ...prev,
      [animalData.id]: isValid
        ? null
        : `Number of animal details (${animalData.animalDetails.length}) must equal total count (${animalData.totalCount})`
    }))

    setAnimals(updatedAnimals)
    setValue('animals', updatedAnimals)
    setAnimalDetailsModalOpen(false)
    setSelectedAnimalForDetails(null)
  }

  const totalSpeciesCount = selectedSpecies.length
  const totalAnimalCount = animals.reduce((sum, animal) => sum + (animal.totalCount || 0), 0)

  const handleFormSubmit = data => {
    if (data.species.length === 0) {
      setSpeciesError('At least one species must be selected')

      return
    }

    // Check for any count mismatches
    const hasCountMismatch = data.animals.some(animal => !validateAnimalCounts(animal))

    if (hasCountMismatch) {
      // Errors are already displayed per animal
      return
    }

    onSubmit(data)
  }

  const handleFormReset = () => {
    reset({
      certificate_id: '',
      date_of_issue: null,
      last_day_of_validity: null,
      country_of_origin: null,
      exporter_name: null,
      importer: null,
      purpose_of_transfer: null,
      species: [],
      animals: [],
      supporting_documents: [],
      linked_imports: [],
      linked_shipments: [],
    })
    setSelectedSpecies([])
    setAnimals([])
    setSpeciesError(null)
    setAnimalErrors({})
    onReset()
  }

  return (
    <Box
      component='form'
      onSubmit={handleSubmit(handleFormSubmit, errors => {
        if (errors.species) {
          setSpeciesError(errors.species.message)
        }

        if (Object.keys(errors).length > 0) {
          const firstError = Object.keys(errors)[0]
          const element = document.querySelector(`[name="${firstError}"]`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }
      })}
      onReset={handleFormReset}
    >
      <Typography variant='h6' gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        1. Export Permit Details
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ControlledTextField
            name='certificate_id'
            label='Certificate ID'
            control={control}
            errors={errors}
            required
            fullWidth
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <ControlledTextField
            name='date_of_issue'
            label='Date of Issue'
            control={control}
            errors={errors}
            type='date'
            required
            fullWidth
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <ControlledTextField
            name='last_day_of_validity'
            label='Last Day of Validity'
            control={control}
            errors={errors}
            type='date'
            required
            fullWidth
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <ControlledAutocomplete
            name='country_of_origin'
            label='Country of Origin'
            control={control}
            errors={errors}
            options={countryOptions}
            required
            fullWidth
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <ControlledAutocomplete
            name='exporting_country'
            label='Exporting Country'
            control={control}
            errors={errors}
            options={countryOptions}
            required
            fullWidth
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <ControlledAutocomplete
            name='exporter_name'
            label='Exporter Name'
            control={control}
            errors={errors}
            options={exporterOptions}
            required
            fullWidth
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <ControlledAutocomplete
            name='importer'
            label='Importer'
            control={control}
            errors={errors}
            options={importerOptions}
            required
            fullWidth
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <ControlledAutocomplete
            name='purpose_of_transfer'
            label='Purpose of Transfer'
            control={control}
            errors={errors}
            options={purposeOptions}
            required
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FileUpload name='certificate_file' label='Permit Image' control={control} errors={errors} />
        </Grid>
      </Grid>

      <Box sx={{ mt: 8 }}>
        <Typography variant='h6' gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          2. Animals
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Typography variant='body2' sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '1.25rem', fontWeight: 500}}>
            Species count: <strong>{totalSpeciesCount}</strong>
          </Typography>
          <Typography variant='body2' sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '1.25rem', fontWeight: 500}}>
            Animal count: <strong>{totalAnimalCount}</strong>
          </Typography>
        </Box>
        <Box>
          {speciesError && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {speciesError}
            </Alert>
          )}

          
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {animals?.map((animal, index) => (
                <Card
                  key={animal.id}
                  variant='outlined'
                  sx={{
                    width: '100%',
                    backgroundColor: alpha(theme.palette.customColors.displaybgPrimary, 0.4),
                    p: 4,
                    borderRadius: 2
                  }}
                >
                  <CardContent>
                    <SelectableSpeciesCard
                      key={animal.species.tsn_id}
                      species={{
                        common_name: animal.species.common_name,
                        scientific_name: animal.species.complete_name,
                        default_icon: animal.species.default_icon
                      }}
                      selectionType='cross'
                      onClick={() => handleRemoveSpecies(animal.species.tsn_id)}
                    />

                    <Typography variant='subtitle2' gutterBottom sx={{ fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant, fontSize: "1rem", mt: 6, mb: 4 }}>
                      Cites Details & Animal Count
                    </Typography>

                    <Grid container spacing={4} sx={{ mb: 2 }}>
                      <Grid item xs={12} md={3}>
                        <ControlledSelect
                          name={`animals.${index}.appendix`}
                          label='Select Appendix'
                          control={control}
                          errors={errors}
                          options={appendixOptions}
                          getOptionLabel={option => option.label}
                          getOptionValue={option => option.value}
                          onChangeExtra={e => handleAnimalUpdate(animal.id, 'appendix', e.target.value)}
                          sx={{ backgroundColor: theme.palette.common.white }}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <ControlledTextField
                          name={`animals.${index}.maleCount`}
                          label='# Male'
                          type='number'
                          control={control}
                          errors={errors}
                          onChangeOverride={e =>
                            handleAnimalUpdate(animal.id, 'maleCount', parseInt(e.target.value) || 0)
                          }
                          inputProps={{ min: 0 }}
                          sx={{ backgroundColor: theme.palette.common.white }}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <ControlledTextField
                          name={`animals.${index}.femaleCount`}
                          label='# Female'
                          type='number'
                          control={control}
                          errors={errors}
                          onChangeOverride={e =>
                            handleAnimalUpdate(animal.id, 'femaleCount', parseInt(e.target.value) || 0)
                          }
                          inputProps={{ min: 0 }}
                          sx={{ backgroundColor: theme.palette.common.white }}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <ControlledTextField
                          name={`animals.${index}.undeterminedCount`}
                          label='# Undetermined'
                          type='number'
                          control={control}
                          errors={errors}
                          onChangeOverride={e =>
                            handleAnimalUpdate(animal.id, 'undeterminedCount', parseInt(e.target.value) || 0)
                          }
                          inputProps={{ min: 0 }}
                          sx={{ backgroundColor: theme.palette.common.white }}
                        />
                      </Grid>
                      
                    </Grid>

                    <Divider sx={{ my: 6, color: theme.palette.customColors.OutlineVariant }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant='subtitle2' gutterBottom sx={{ fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant, fontSize: "1rem" }}>
                        Animal Details (Count: {animal.animalDetails.length})
                      </Typography>
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => {
                          const newDetail = {
                            gender: '',
                            identifierType: '',
                            identifierDetails: ''
                          }
                          const updatedDetails = [...(animal.animalDetails || []), newDetail]
                          handleAnimalUpdate(animal.id, 'animalDetails', updatedDetails)
                        }}
                      >
                        Add Animal
                      </Button>
                    </Box>

                    {
                      animal.animalDetails.map((detail, detailIndex) => (
                        <Grid container spacing={2} key={detailIndex} sx={{ mb: 2 }}>
                          <Grid item xs={12} md={3}>
                            <ControlledSelect
                              name={`animals.${index}.animalDetails.${detailIndex}.gender`}
                              label='Gender'
                              control={control}
                              errors={errors}
                              options={genderOptions}
                              getOptionLabel={option => option.label}
                              getOptionValue={option => option.value}
                              onChangeExtra={e => {
                                const updatedDetails = [...animal.animalDetails]
                                updatedDetails[detailIndex].gender = e.target.value
                                handleAnimalUpdate(animal.id, 'animalDetails', updatedDetails)
                              }}
                              sx={{ backgroundColor: theme.palette.common.white }}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <ControlledSelect
                              name={`animals.${index}.animalDetails.${detailIndex}.identifierType`}
                              label='Identifier Type'
                              control={control}
                              errors={errors}
                              options={identifierOptions}
                              getOptionLabel={option => option.label}
                              getOptionValue={option => option.value}
                              onChangeExtra={e => {
                                const updatedDetails = [...animal.animalDetails]
                                updatedDetails[detailIndex].identifierType = e.target.value
                                handleAnimalUpdate(animal.id, 'animalDetails', updatedDetails)
                              }}
                              sx={{ backgroundColor: theme.palette.common.white }}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <ControlledTextField
                              name={`animals.${index}.animalDetails.${detailIndex}.identifierDetails`}
                              label='Identifier Details'
                              control={control}
                              errors={errors}
                              onChangeOverride={e => {
                                const updatedDetails = [...animal.animalDetails]
                                updatedDetails[detailIndex].identifierDetails = e.target.value
                                handleAnimalUpdate(animal.id, 'animalDetails', updatedDetails)
                              }}
                              sx={{ backgroundColor: theme.palette.common.white }}
                            />
                          </Grid>
                          <Grid item xs={12} md={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconButton
                              onClick={() => {
                                const updatedDetails = animal.animalDetails.filter((_, i) => i !== detailIndex)
                                handleAnimalUpdate(animal.id, 'animalDetails', updatedDetails)
                              }}
                              sx={{ backgroundColor: theme.palette.customColors.neutral05 }}
                            >
                              <CloseIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      ))
                    }
                    {animalErrors[animal.id] && (
                      <Alert severity='error' sx={{ mt: 2, mb: 2 }}>
                        {animalErrors[animal.id]}
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
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
              fontSize: '1rem', // Increase font size (adjust as needed)
              fontWeight: 500,
              border: '2px dashed', // Dashed border
              borderColor: theme.palette.primary.main,
              backgroundColor: theme.palette.common.white,
              '&:hover': {
                border: '2px dashed', // Maintain dashed style on hover
                backgroundColor: theme.palette.action.hover
              }
            }}
          >
            Add Species
          </Button>
        </Box>

        <SpeciesDrawer
          open={speciesDrawerOpen}
          onClose={() => setSpeciesDrawerOpen(false)}
          onSelect={handleSpeciesSelect}
          selectedSpecies={selectedSpecies}
          title='Select Species'
          data={{
            queryKey: 'export-permit-species',
            id: 'species-list',
            params: {}
          }}
        />

        {/* <AnimalDetailsModal
          open={animalDetailsModalOpen}
          onClose={() => setAnimalDetailsModalOpen(false)}
          animalData={selectedAnimalForDetails}
          onSave={handleAnimalSave}
        /> */}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
        <Button variant='outlined' type='reset'>
          Reset
        </Button>
        <Button variant='contained' type='submit'>
          Save Details
        </Button>
      </Box>
    </Box>
  )
}

export default ExportPermitForm
