import React, { useState, useEffect } from 'react'
import { Box, Button } from '@mui/material'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import ExportPermitDetails from './ExportPermitDetails'
import ExportPermitAnimals from './ExportPermitAnimals'
import SpeciesDrawer from '../drawer/SpeciesDrawer'
import { useRouter } from 'next/router'
import { getExportPermitDetails } from 'src/lib/api/compliance/exports'

export const exportPermitValidationSchema = yup.object().shape({
  export_number: yup
    .string()
    .required('Export number is required')
    .min(3, 'Export number must be at least 3 characters'),

  issued_date: yup.date().required('Issued date is required'),

  valid_until: yup
    .date()
    .required('Valid until date is required')
    .min(yup.ref('issued_date'), 'Valid until date must be after issued date'),

  destination_country: yup
    .object()
    .shape({
      label: yup.string().required('Destination country is required'),
      value: yup.string().required('Destination country is required')
    })
    .required('Destination country is required'),

  exporting_country: yup
    .object()
    .shape({
      label: yup.string().required('Exporting country is required'),
      value: yup.string().required('Exporting country is required')
    })
    .required('Exporting country is required'),

  importer_name: yup
    .object()
    .shape({
      label: yup.string().required('Importer name is required'),
      value: yup.string().required('Importer name is required')
    })
    .required('Importer name is required'),

  exporter_name: yup
    .object()
    .shape({
      label: yup.string().required('Exporter name is required'),
      value: yup.string().required('Exporter name is required')
    })
    .required('Exporter name is required'),

  export_purpose: yup
    .object()
    .shape({
      label: yup.string().required('Export purpose is required'),
      value: yup.string().required('Export purpose is required')
    })
    .required('Export purpose is required'),

  certificate_file: yup
    .mixed()
    .required('File is required')
    .test('fileType', 'Unsupported file format', value => {
      if (!value) return true

      return ['image/jpeg', 'image/png', 'application/pdf'].includes(value.type)
    }),

  speciesList: yup
    .array()
    .min(1, 'At least one species must be selected')
    .required('At least one species must be selected')
    .of(
      yup.object().shape({
        species: yup.object().required(),
        maleCount: yup.number().min(0, 'Must be 0 or more').required(),
        femaleCount: yup.number().min(0, 'Must be 0 or more').required(),
        undeterminedCount: yup.number().min(0, 'Must be 0 or more').required(),
        totalCount: yup.number().min(1, 'Total count must be at least 1').required(),
        animalDetails: yup
          .array()
          .of(
            yup.object().shape({
              gender: yup.string().required('Gender is required'),
              identifierType: yup.string().required('Identifier type is required'),
              identifierValue: yup.string().required('Identifier value is required')

              // animalType: yup.string().required('Animal type is required'),
              // animalCount: yup.number().min(1, 'Animal count must be at least 1').required()
            })
          )
          .test(
            'count-match',
            'Total animal details count must less than or equals to the sum of male, female and undetermined counts',
            function (animalDetails) {
              const { maleCount = 0, femaleCount = 0, undeterminedCount = 0 } = this.parent
              const totalCount = maleCount + femaleCount + undeterminedCount

              const animalDetailsCount =
                animalDetails?.reduce((sum, detail) => sum + (parseInt(detail.animalCount) || 0), 0) || 0

              return animalDetailsCount <= totalCount
            }
          )
      })
    )
})

const ExportPermitForm = ({ onSubmit, onReset, id }) => {
  const router = useRouter()
  const [speciesDrawerOpen, setSpeciesDrawerOpen] = useState(false)
  const [speciesList, setSpeciesList] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const {
    setValue,
    handleSubmit,
    reset,
    control,
    formState: { errors }
  } = useForm({
    defaultValues: {
      export_number: '',
      export_date: null,
      issued_date: null,
      valid_until: null,
      export_purpose: null,
      destination_country: null,
      exporting_country: null,
      importer_name: null,
      exporter_name: null,
      speciesList: []
    },
    resolver: yupResolver(exportPermitValidationSchema)
  })

  useEffect(() => {
    if (id) {
      fetchExportDetails()
    }
  }, [id])

  const fetchExportDetails = async () => {
    setIsLoading(true)
    try {
      const res = await getExportPermitDetails(id)
      if (res.success) {
        const data = res.data

        // Set basic form values
        setValue('export_number', data.export_number)
        setValue('export_date', new Date(data.export_date))
        setValue('issued_date', data.issued_date !== '0000-00-00' ? new Date(data.issued_date) : null)
        setValue('valid_until', data.valid_until !== '0000-00-00' ? new Date(data.valid_until) : null)
        setValue('export_purpose', data.export_purpose || '')
        setValue('destination_country', { label: data.destination_country, value: data.destination_country })
        setValue('exporting_country', { label: data.exporting_country, value: data.exporting_country })
        setValue('importer_name', data.importer_name)
        setValue('exporter_name', data.exporter_name)

        // Transform species data
        const transformedSpeciesList = data.species.map(species => ({
          id: species.id,
          species: {
            id: species.taxonomy_id,
            tsn_id: species.taxonomy_id,
            common_name: species.common_name,
            scientific_name: species.scientific_name
          },
          maleCount: parseInt(species.male_count) || 0,
          femaleCount: parseInt(species.female_count) || 0,
          undeterminedCount: parseInt(species.undeterminate_count) || 0,
          totalCount: parseInt(species.total_count) || 0,
          animalDetails: species.animals.map(animal => ({
            id: animal.id,
            animalType: animal.animal_type,
            animalCount: parseInt(animal.animal_count) || 1,
            gender: animal.gender,
            identifierType: animal.identifier_type,
            identifierValue: animal.identifier_value
          }))
        }))

        setSpeciesList(transformedSpeciesList)
        setValue('speciesList', transformedSpeciesList)
      }
    } catch (error) {
      console.error('Error fetching export details:', error)
    }
    setIsLoading(false)
  }

  const handleSpeciesSelect = selectedSpecies => {
    // Create new species items for those not already in the list
    const newSpeciesItems = selectedSpecies
      .filter(species => !speciesList.some(existing => existing.species.tsn_id === species.tsn_id))
      .map(species => ({
        id: species.tsn_id,
        species: {
          id: species.tsn_id,
          tsn_id: species.tsn_id,
          common_name: species.common_name,
          scientific_name: species.scientific_name
        },
        maleCount: 0,
        femaleCount: 0,
        undeterminedCount: 0,
        totalCount: 0,
        animalDetails: []
      }))

    const updatedSpeciesList = [...speciesList, ...newSpeciesItems]
    setSpeciesList(updatedSpeciesList)
    setValue('speciesList', updatedSpeciesList)
    setSpeciesDrawerOpen(false)
  }

  const handleSpeciesUpdate = (speciesId, updatedSpecies) => {
    const updatedList = speciesList.map(item => (item.id === speciesId ? updatedSpecies : item))
    setSpeciesList(updatedList)
    setValue('speciesList', updatedList)
  }

  const handleRemoveSpecies = speciesId => {
    console.log("speciesId", speciesId)
    const updatedList = speciesList.filter(item => item.id !== speciesId)
    setSpeciesList(updatedList)
    setValue('speciesList', updatedList)
  }

  const handleFormSubmit = data => {
    // Validate that all species have matching animal details count
    console.log(" data", data)

    const hasInvalidCounts = data.speciesList.some(species => {
      const totalCount = species.maleCount + species.femaleCount + species.undeterminedCount

      const animalDetailsCount = species.animalDetails.reduce(
        (sum, detail) => sum + (parseInt(detail.animalCount) || 0),
        0
      )

      return totalCount !== animalDetailsCount
    })

    if (hasInvalidCounts) {
      return // Validation errors will be shown
    }

    // Transform data for API
    const transformedData = {
      ...data,
      destination_country: data.destination_country.value,
      exporting_country: data.exporting_country.value,
      species: data.speciesList.map(item => ({
        taxonomy_id: item.species.tsn_id || item.species.id,
        male_count: item.maleCount,
        female_count: item.femaleCount,
        undeterminate_count: item.undeterminedCount,
        animals: item.animalDetails.map(detail => ({
          gender: detail.gender,
          identifier_type: detail.identifierType,
          identifier_value: detail.identifierValue
        }))
      }))
    }

    onSubmit(transformedData)
  }

  const handleFormReset = () => {
    reset({
      export_number: '',
      export_date: null,
      issued_date: null,
      valid_until: null,
      export_purpose: null,
      destination_country: null,
      exporting_country: null,
      importer_name: null,
      exporter_name: null,
      speciesList: []
    })
    setSpeciesList([])
    onReset()
  }

  if (isLoading) {
    return <Box>Loading...</Box>
  }

  return (
    <Box
      component='form'
      onSubmit={handleSubmit(handleFormSubmit, errors => {
        console.log("errors", errors)
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
      <ExportPermitDetails control={control} errors={errors} isEdit={!!id} />

      <ExportPermitAnimals
        control={control}
        errors={errors}
        speciesList={speciesList}
        handleSpeciesUpdate={handleSpeciesUpdate}
        handleRemoveSpecies={handleRemoveSpecies}
        setSpeciesDrawerOpen={setSpeciesDrawerOpen}
        isEdit={!!id}
      />

      <SpeciesDrawer
        open={speciesDrawerOpen}
        onClose={() => setSpeciesDrawerOpen(false)}
        onSelect={handleSpeciesSelect}
        selectedSpecies={speciesList.map(item => item.species)}
        title='Select Species'
        data={{
          queryKey: 'export-permit-species',
          id: 'species-list',
          params: {}
        }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
        <Button variant='outlined' type='reset'>
          Reset
        </Button>
        <Button variant='contained' type='submit'>
          {id ? 'Update' : 'Save'} Details
        </Button>
      </Box>
    </Box>
  )
}

export default ExportPermitForm
