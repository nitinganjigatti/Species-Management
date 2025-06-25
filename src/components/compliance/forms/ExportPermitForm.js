import React, { useState, useEffect } from 'react'
import { Box, Button, CircularProgress } from '@mui/material'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import ExportPermitDetails from './ExportPermitDetails'
import ExportPermitAnimals from './ExportPermitAnimals'
import SpeciesDrawer from 'src/components/compliance/drawer/SpeciesDrawer'
import { useRouter } from 'next/router'
import { addExport, updateExport } from 'src/lib/api/compliance/exports'
import dayjs from 'dayjs'
import Toaster from 'src/components/Toaster'
import { LoadingButton } from '@mui/lab'

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

  origin_country: yup
    .object()
    .shape({
      label: yup.string().required('Origin country is required'),
      value: yup.string().required('Origin country is required')
    })
    .required('Origin country is required'),

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

  export_purpose: yup.string().required('Export purpose is required').min(1, 'Export purpose is required'),

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
        male_count: yup
          .number()
          .transform((value, originalValue) => (originalValue === '' ? 0 : value))
          .min(0, 'Must be 0 or more')
          .required(),
        female_count: yup
          .number()
          .transform((value, originalValue) => (originalValue === '' ? 0 : value))
          .min(0, 'Must be 0 or more')
          .required(),
        undeterminate_count: yup
          .number()
          .transform((value, originalValue) => (originalValue === '' ? 0 : value))
          .min(0, 'Must be 0 or more')
          .required(),
        total_count: yup.number().min(1, 'Total count must be at least 1').required(),
        animalDetails: yup
          .array()
          .of(
            yup.object().shape({
              gender: yup
                .object()
                .shape({
                  label: yup.string().required('Gender is required'),
                  value: yup.string().required('Gender is required')
                })
                .required('Gender is required'),
              identifier_type: yup
                .object()
                .shape({
                  label: yup.string().required('Identifier type is required'),
                  value: yup.string().required('Identifier type is required')
                })
                .required('Identifier type is required'),
              identifier_value: yup.string().required('Identifier value is required'),

              // animal_type: yup.string().required('Animal type is required'),
              animal_count: yup.number().min(1, 'Animal count must be at least 1').required()
            })
          )
          .test(
            'count-match',
            'Total animal details count must less than or equals to the sum of male, female and undetermined counts',
            function (animalDetails) {
              const { male_count = 0, female_count = 0, undeterminate_count = 0 } = this.parent
              const totalCount = male_count + female_count + undeterminate_count
              console.log('totalCount', totalCount)

              const animalDetailsCount =
                animalDetails?.reduce((sum, detail) => sum + (parseInt(detail.animal_count) || 0), 0) || 0

              return animalDetailsCount <= totalCount
            }
          )
      })
    )
})

const ExportPermitForm = ({ onSubmit, id, exportData, isLoading }) => {
  const router = useRouter()
  const [speciesDrawerOpen, setSpeciesDrawerOpen] = useState(false)
  const [speciesList, setSpeciesList] = useState([])
  const [submitLoader, setSubmitLoader] = useState(false)

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
      issued_date: dayjs(),
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
    if (exportData) {
      // Set basic form values
      setValue('export_number', exportData.export_number)
      setValue('export_date', new Date(exportData.export_date))
      setValue('issued_date', exportData.issued_date !== '0000-00-00' ? dayjs(exportData.issued_date) : null)
      setValue('valid_until', exportData.valid_until !== '0000-00-00' ? dayjs(exportData.valid_until) : null)
      setValue('export_purpose', exportData.export_purpose)
      setValue('origin_country', { label: exportData.origin_country, value: exportData.origin_country })
      setValue('exporting_country', { label: exportData.exporting_country, value: exportData.exporting_country })
      setValue('importer_name', { label: exportData.importer_name, value: exportData.importer_name })
      setValue('exporter_name', { label: exportData.exporter_name, value: exportData.exporter_name })
      setValue('certificate_file', exportData.attachment)

      // Transform species data
      const transformedSpeciesList = exportData.species.map(species => ({
        id: species.id,
        species: {
          id: species.taxonomy_id,
          tsn_id: species.taxonomy_id,
          common_name: species.common_name,
          scientific_name: species.scientific_name
        },
        male_count: parseInt(species.male_count) || 0,
        female_count: parseInt(species.female_count) || 0,
        undeterminate_count: parseInt(species.undeterminate_count) || 0,
        total_count: parseInt(species.total_count) || 0,
        appendix: { label: species.appendix, value: species.appendix },
        animalDetails: species.animals.map(animal => ({
          id: animal.id,
          animal_type: animal.animal_type,
          animal_count: parseInt(animal.animal_count) || 0,
          gender: { label: animal.gender, value: animal.gender },
          identifier_type: { label: animal.identifier_type, value: animal.identifier_type },
          identifier_value: animal.identifier_value
        }))
      }))

      setSpeciesList(transformedSpeciesList)
      setValue('speciesList', transformedSpeciesList)
    }
  }, [exportData])

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
          scientific_name: species.scientific_name || species.complete_name,
          default_icon: species.default_icon
        },
        male_count: 0,
        female_count: 0,
        undeterminate_count: 0,
        total_count: 0,
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
    console.log('speciesId', speciesId)
    const updatedList = speciesList.filter(item => item.id !== speciesId)
    setSpeciesList(updatedList)
    setValue('speciesList', updatedList)
  }

  const handleFormSubmit = async data => {
    console.log('handleFormSubmit data', data)

    // Transform data for API
    const transformedData = {
      export_number: data.export_number,
      origin_country: data.origin_country?.value || '',
      exporting_country: data.exporting_country?.value || '',
      exporter_name: data.exporter_name?.value || '',
      importer_name: data.importer_name?.value || '',
      export_purpose: data.export_purpose || '',
      export_date: dayjs(data.export_date).format('YYYY-MM-DD'),
      issued_date: data.issued_date ? dayjs(data.issued_date).format('YYYY-MM-DD') : null,
      valid_until: data.valid_until ? dayjs(data.valid_until).format('YYYY-MM-DD') : null,
      attachment: data.certificate_file,
      species: JSON.stringify(
        data.speciesList.map(item => ({
          taxonomy_id: item.species?.tsn_id || item.species?.id || '',
          common_name: item.species?.common_name || '',
          scientific_name: item.species?.scientific_name || '',
          default_icon: item?.species?.default_icon,
          appendix: item.appendix?.value || '',
          male_count: parseInt(item.male_count) || 0,
          female_count: parseInt(item.female_count) || 0,
          undeterminate_count: parseInt(item.undeterminate_count) || 0,
          animals: item.animalDetails.map(detail => ({
            id: detail.id,
            gender: detail.gender?.value || '',
            identifier_type: detail.identifier_type?.value || '',
            identifier_value: detail.identifier_value || '',
            animal_type: detail.animal_type || '',
            animal_count: parseInt(detail.animal_count) || 0
          }))
        }))
      )
    }
    console.log('transformedData', transformedData)
    try {
      setSubmitLoader(true)

      const response = id ? await updateExport(id, transformedData) : await addExport(transformedData)

      if (response?.success) {
        Toaster({ type: 'success', message: 'Document type ' + response?.message })
        setSubmitLoader(false)
        onSubmit(response?.data?.id)

        // Route to detail page
        // if (id) router.push(`/compliance/documents/exports/${id}`)
        // else router.push(`/compliance/documents/exports/ExportPermitDetails?id=${response?.data?.id}`)
      } else {
        setSubmitLoader(false)
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (e) {
      console.log(e)
      setSubmitLoader(false)
      Toaster({ type: 'error', message: JSON.stringify(e) })
    }
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
  }

  if (isLoading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'

        // minHeight='300px' // or '100vh' if you want full page center
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box
      component='form'
      onSubmit={handleSubmit(handleFormSubmit, errors => {
        console.log('errors', errors)
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
        <LoadingButton type='submit' variant='contained' loading={submitLoader} sx={{ py: 3, width: '8rem' }} fullWidth>
          {id ? 'Update' : 'Save'}
        </LoadingButton>
      </Box>
    </Box>
  )
}

export default ExportPermitForm
