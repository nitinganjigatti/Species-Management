import React, { useState, useEffect } from 'react'
import { Box, Button, CircularProgress } from '@mui/material'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import ExportPermitDetails from './ExportPermitDetails'
import ExportPermitAnimals from './ExportPermitAnimals'
import SpeciesDrawer from 'src/components/compliance/drawer/SpeciesDrawer'
import { useRouter } from 'next/router'
import { addExport, getMastersData, updateExport } from 'src/lib/api/compliance/exports'
import dayjs from 'dayjs'
import Toaster from 'src/components/Toaster'
import { LoadingButton } from '@mui/lab'
import countryList from 'react-select-country-list'
import { useMemo } from 'react'

export const exportPermitValidationSchema = yup.object().shape({
  export_number: yup.string().required('Export number is required'),

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
        appendix: yup
          .object()
          .shape({
            label: yup.string().required('Appendix is required'),
            value: yup.string().required('Appendix is required')
          })
          .required('Appendix is required'),
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
              identifier_value: yup.string().required('Identifier value is required')

              // animal_type: yup.string().required('Animal type is required'),
              // animal_count: yup.number().min(1, 'Animal count must be at least 1').required()
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
  const [disableSaveButton, setDisableSaveButton] = useState(false)

  const [mastersData, setMastersData] = useState({
    genders: [],
    appendix: [],
    identifierTypes: []
  })
  const [loading, setLoading] = useState(false)

  const countryOptions = useMemo(() => countryList().getData(), [])

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

  const fetchMastersData = async () => {
    try {
      setLoading(true)
      const res = await getMastersData()
      if (res?.success) {
        const data = res.data

        // Transform genders data
        const genderOptions =
          data.genders?.map(gender => ({
            label: gender[0].charAt(0).toUpperCase() + gender[0].slice(1),
            value: gender[0]
          })) || []

        // Transform appendix data
        const appendixOptions =
          data.appendix?.map(item => ({
            label: item[0],
            value: item[0]
          })) || []

        // Transform identifier types data
        const identifierTypeOptions =
          data.identifier_type?.map(item => ({
            label: item.label,
            value: item.id,
            key: item.key,
            id: item.id
          })) || []
        console.log('Addition', {
          genders: genderOptions,
          appendix: appendixOptions,
          identifierTypes: identifierTypeOptions
        })
        setMastersData({
          genders: genderOptions,
          appendix: appendixOptions,
          identifierTypes: identifierTypeOptions
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (exportData && mastersData?.identifierTypes?.length > 0) {
      // Set basic form values
      setValue('export_number', exportData.export_number)
      setValue('issued_date', exportData.issued_date !== '0000-00-00' ? dayjs(exportData.issued_date) : null)
      setValue('valid_until', exportData.valid_until !== '0000-00-00' ? dayjs(exportData.valid_until) : null)
      setValue('export_purpose', exportData.export_purpose)
      setValue('origin_country', {
        label: countryOptions.find(country => country.value === exportData.origin_country).label || '',
        value: exportData.origin_country || null
      })
      setValue('exporting_country', {
        label: countryOptions.find(country => country.value === exportData.exporting_country).label || '',
        value: exportData.exporting_country || null
      })
      setValue('importer_name', { label: exportData.importer_name, value: exportData.importer_name })
      setValue('exporter_name', { label: exportData.exporter_name, value: exportData.exporter_name })
      setValue(
        'certificate_file',
        exportData?.documents?.[0]?.document_type_id
          ? {
              document_type_id: exportData?.documents?.[0]?.document_type_id,
              file_path: exportData?.documents?.[0]?.file_path,
              name: exportData?.documents?.[0]?.file_original_name
            }
          : null
      )

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
          gender: {
            label: animal.gender ? animal.gender.charAt(0).toUpperCase() + animal.gender.slice(1) : '',
            value: animal.gender
          },
          identifier_type: {
            label: mastersData?.identifierTypes.find(item => item.id == animal.identifier_type)?.label || '',
            value: mastersData?.identifierTypes.find(item => item.value == animal.identifier_type)?.label || null
          },
          identifier_value: animal.identifier_value
        }))
      }))

      setSpeciesList(transformedSpeciesList)
      setValue('speciesList', transformedSpeciesList)
      console.log('speciesList', transformedSpeciesList)
    }
  }, [exportData, mastersData?.identifierTypes])

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
    const updatedList = speciesList.map(item => (item.id === speciesId ? { ...updatedSpecies } : { ...item }))

    // Update both local state and form state
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
            id: detail.id?.startsWith('new_') ? '' : detail.id || '',
            gender: detail.gender?.value || '',
            identifier_type: detail.identifier_type?.label || '',
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
        if (!id) setDisableSaveButton(true)
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
      export_number: id ? exportData?.export_number : '',
      export_date: null,
      issued_date: id ? dayjs(exportData?.issued_date) : dayjs(),
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

  useEffect(() => {
    fetchMastersData()
  }, [])

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
        appendixOptions={mastersData.appendix}
        identifierOptions={mastersData.identifierTypes}
        genderOptions={mastersData.genders}
        setValue={setValue}
        setSpeciesList={setSpeciesList}
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
        <Button variant='outlined' type='reset' disabled={disableSaveButton}>
          Reset
        </Button>
        <LoadingButton
          type='submit'
          variant='contained'
          loading={submitLoader}
          disabled={disableSaveButton}
          sx={{ py: 3, width: '8rem' }}
          fullWidth
        >
          {id ? 'Update' : 'Save'}
        </LoadingButton>
      </Box>
    </Box>
  )
}

export default ExportPermitForm
