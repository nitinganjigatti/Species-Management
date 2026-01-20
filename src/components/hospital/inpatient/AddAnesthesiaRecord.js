import { Card, Drawer, IconButton, Typography } from '@mui/material'
import { Box } from '@mui/system'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import { useEffect, useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { LoadingButton } from '@mui/lab'

import BasicDetails from './Anesthesia/BasicDetails'
import { getAssesmentList } from 'src/lib/api/hospital/anesthesia'
import Toaster from 'src/components/Toaster'
import { addAnesthesia } from 'src/lib/api/hospital/anesthesia'
import AnimalInfoCard from 'src/views/pages/hospital/inpatient/AnimalInfoCard'

const FORM_ID = 'add-anesthesia-record-form'

const getSafeString = value => {
  if (value === undefined || value === null) return ''

  return String(value)
}

const anesthesiaSchema = yup.object().shape({
  basicDetails: yup.object().shape({
    location: yup.string().trim().required('Location is required'),
    anaesthesia_datetime: yup.string().required('Date & Time of anesthesia is required'),
    estimated_time_required: yup
      .string()
      .test('required', 'Estimated time is required', value => Boolean(value?.toString().trim())),
    estimated_time_unit: yup.string().trim().required('Time unit is required'),
    veterinarian_id: yup.array().of(yup.string()).min(1, 'Select at least one veterinarian'),
    anesthetist_id: yup.array().of(yup.string()).min(1, 'Select at least one anesthetist'),
    selected: yup.array().of(yup.string()).min(1, 'Select at least one purpose').default([]),
    custom: yup.array().of(yup.string()).default([])

    // notes: yup.string().trim().required('Notes are required')
  })
})

const defaultValues = {
  basicDetails: {
    location: '',
    anaesthesia_datetime: '',
    estimated_time_required: '',
    estimated_time_unit: 'hr',
    veterinarian_id: [],
    anesthetist_id: [],
    selected: [],
    custom: [],
    notes: ''
  }
}

const AddanesthesiaRecordDrawer = ({
  openAddanesthesiaDrawer,
  setOpenAddanesthesiaDrawer,
  hospitalCaseId = '',
  medicalRecordId = '',
  vetOptions = [],
  anesthetistOptions = [],
  patientData = null,
  animalInfoData = null,
  onSuccess = () => {},
  loadMoreDoctors = () => {},
  loadingDoctors = false
}) => {
  const theme = useTheme()
  const [purposeOptions, setPurposeOptions] = useState([])
  const holdingLocation = [patientData?.bed_name, patientData?.room_name].filter(Boolean).join(', ')
  const chiefVeterinarian = patientData?.admitted_by_full_name || patientData?.attend_by_full_name
  const animalImage = getSafeString(patientData?.animal_detail?.default_icon)
  const animalName = getSafeString(
    patientData?.animal_detail?.common_name || patientData?.animal_detail?.default_common_name
  )
  const animalScientificName = getSafeString(
    patientData?.animal_detail?.complete_name || patientData?.animal_detail?.scientific_name
  )
  const animalAge = getSafeString(patientData?.animal_detail?.age)
  const animalSex = getSafeString(patientData?.animal_detail?.sex)

  const methods = useForm({
    defaultValues,
    resolver: yupResolver(anesthesiaSchema),
    mode: 'onChange'
  })

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = methods

  const onSubmit = async data => {
    const formData = new FormData()
    const anaesthesiaDateTime = data.basicDetails.anaesthesia_datetime || data.basicDetails.anesthesia_datetime || ''

    formData.append('hospital_case_id', hospitalCaseId || '')
    formData.append('medical_record_id', medicalRecordId || '')
    formData.append('location', data.basicDetails.location || '')
    formData.append('anaesthesia_datetime', anaesthesiaDateTime || '')
    formData.append('estimated_time_required', data.basicDetails.estimated_time_required || '')
    formData.append('estimated_time_unit', data.basicDetails.estimated_time_unit || '')
    formData.append(
      'veterinarian_id',
      JSON.stringify(Array.isArray(data.basicDetails.veterinarian_id) ? data.basicDetails.veterinarian_id : [])
    )
    formData.append(
      'anesthetist_id',
      JSON.stringify(Array.isArray(data.basicDetails.anesthetist_id) ? data.basicDetails.anesthetist_id : [])
    )
    formData.append('notes', data.basicDetails.notes || '')

    const purposePayload = {
      selected: data.basicDetails.selected || [],
      custom: data.basicDetails.custom || []
    }
    formData.append('purpose', JSON.stringify(purposePayload))

    try {
      const response = await addAnesthesia(formData)

      if (response?.status === true || response?.success === true) {
        Toaster({ type: 'success', message: response?.message || 'anesthesia added successfully' })

        const createdId =
          response?.anaesthesia_id || response?.anesthesia_id || response?.data?.anaesthesia_id || response?.data?.id

        const createdCode =
          response?.anaesthesia_code ||
          response?.anesthesia_code ||
          response?.code ||
          response?.data?.anaesthesia_code ||
          response?.data?.code

        const mapPeople = (ids, options) => {
          if (!Array.isArray(ids)) return []
          const idSet = new Set(ids.map(val => String(val)))

          return options
            .filter(opt => idSet.has(String(opt.id)))
            .map(opt => ({ full_name: opt.name || opt.label || '', id: opt.id }))
            .filter(person => person.full_name)
        }

        const purposeMap = new Map()
        if (Array.isArray(purposeOptions)) {
          purposeOptions.forEach(item => {
            if (item?.id && item?.name) purposeMap.set(String(item.id), item.name)
          })
        }

        const selectedPurposes = Array.isArray(data.basicDetails.selected) ? data.basicDetails.selected : []
        const customPurposes = Array.isArray(data.basicDetails.custom) ? data.basicDetails.custom : []

        const purposeList = [
          ...selectedPurposes
            .map(id => purposeMap.get(String(id)) || id)
            .filter(Boolean)
            .map(name => ({ name })),
          ...customPurposes.filter(Boolean).map(name => ({ name }))
        ]

        const newRecord = {
          anaesthesia_id: createdId,
          anesthesia_id: createdId,
          anaesthesia_code: createdCode,
          anesthesia_code: createdCode,
          code: createdCode,
          location: data.basicDetails.location || '',
          anaesthesia_datetime: anaesthesiaDateTime || '',
          anesthesia_datetime: anaesthesiaDateTime || '',
          estimated_time_required: data.basicDetails.estimated_time_required || '',
          estimated_time_unit: data.basicDetails.estimated_time_unit || '',
          veterinarians: mapPeople(data.basicDetails.veterinarian_id, vetOptions),
          anesthetists: mapPeople(data.basicDetails.anesthetist_id, anesthetistOptions),
          purpose: purposeList,
          notes: data.basicDetails.notes || ''
        }

        onSuccess(newRecord)
        reset(defaultValues)
        setOpenAddanesthesiaDrawer(false)
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to add anesthesia' })
      }
    } catch (error) {
      console.error('Add anesthesia failed:', error)
      Toaster({ type: 'error', message: error?.message || 'Something went wrong. Please try again.' })
    }
  }

  useEffect(() => {
    if (!openAddanesthesiaDrawer) {
      reset(defaultValues)
    }
  }, [openAddanesthesiaDrawer, reset])

  useEffect(() => {
    const fetchPurposes = async () => {
      try {
        const response = await getAssesmentList({ type: 'purpose' })
        if (response?.success && Array.isArray(response?.data?.records)) {
          setPurposeOptions(
            response.data.records.map(item => ({
              name: item?.name,
              id: item?.id
            }))
          )
        } else {
          setPurposeOptions([])
        }
      } catch (error) {
        console.error('Failed to load anesthesia purposes', error)
        Toaster({ type: 'error', message: 'Failed to load purpose options' })
        setPurposeOptions([])
      }
    }

    if (openAddanesthesiaDrawer) {
      fetchPurposes()
    }
  }, [openAddanesthesiaDrawer])

  return (
    <Drawer
      anchor='right'
      open={openAddanesthesiaDrawer}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': { maxWidth: '920px', height: '100vh' },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        backgroundColor: 'background.default'
      }}
    >
      <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: theme => theme.spacing(3, 3.255, 3, 5.255)
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center', maxHight: '80px' }}>
          <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Filter Icon' />
          <Typography sx={{ fontSize: '24px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            Add anesthesia
          </Typography>
        </Box>
        <IconButton size='small' sx={{ color: 'text.primary' }} onClick={() => setOpenAddanesthesiaDrawer(false)}>
          <Icon icon='mdi:close' fontSize={24} />
        </IconButton>
      </Box>

      <FormProvider {...methods}>
        <Box
          component='form'
          id={FORM_ID}
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}
        >
          <Box
            sx={{
              p: '24px',
              backgroundColor: 'background.default',
              flex: 1,
              overflowY: 'auto',
              pb: '125px'
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {patientData ? (
                <AnimalInfoCard
                  image={animalImage}
                  name={animalName}
                  scientificName={animalScientificName}
                  age={animalAge}
                  gender={animalSex}
                  additionalFields={[
                    { label: 'AID', value: getSafeString(patientData?.animal_detail?.animal_id) },
                    { label: 'Admitted days', value: getSafeString(patientData?.admitted_for_day) },
                    { label: 'Holding Location', value: holdingLocation },
                    { label: 'Chief Veterinarian', value: getSafeString(chiefVeterinarian) }
                  ]}
                  backgroundColor={theme.palette.customColors.OnPrimary}
                  isLoading={!patientData}
                />
              ) : (
                <Card
                  sx={{
                    p: '24px',
                    borderRadius: '8px',
                    backgroundColor: theme.palette.primary.contrastText,
                    boxShadow: 'none',
                    mb: 3
                  }}
                >
                  <Box>
                    <Box sx={{ maxWidth: '100%', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: '8px',
                          backgroundColor: theme.palette.customColors.mdAntzNeutral
                        }}
                      />
                      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: 1 }}>
                        <Box sx={{ width: '70%', height: '20px', borderRadius: '4px', backgroundColor: '#E0E0E0' }} />
                        <Box sx={{ width: '60%', height: '18px', borderRadius: '4px', backgroundColor: '#E6E6E6' }} />
                        <Box sx={{ width: '50%', height: '18px', borderRadius: '4px', backgroundColor: '#E6E6E6' }} />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                      {[1, 2, 3, 4].map(idx => (
                        <Box key={`animal-skeleton-${idx}`} sx={{ minWidth: '120px' }}>
                          <Box
                            sx={{
                              width: '60%',
                              height: '16px',
                              borderRadius: '4px',
                              backgroundColor: '#E6E6E6',
                              mb: 1
                            }}
                          />
                          <Box
                            sx={{
                              width: '80%',
                              height: '18px',
                              borderRadius: '4px',
                              backgroundColor: '#E0E0E0'
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Card>
              )}

              <Card
                sx={{
                  backgroundColor: theme.palette.primary.contrastText,
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 'none',
                  gap: '24px'
                }}
              >
                <BasicDetails
                  vetOptions={vetOptions}
                  anesthetistOptions={anesthetistOptions}
                  purposeOptions={purposeOptions}
                  loadMoreDoctors={loadMoreDoctors}
                  loadingDoctors={loadingDoctors}
                  patientData={patientData}
                />
              </Card>
            </Box>
          </Box>
          <Box
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 'auto',
              right: 0,
              zIndex: 5,
              backgroundColor: theme.palette.primary.contrastText,
              boxShadow: `0px -8px 12px 0px ${theme.palette.customColors.shadowColor}`,
              height: '108px',
              px: '24px',
              py: '16px',
              display: 'flex',
              gap: '24px',
              alignItems: 'center',
              width: ['100%', '920px'],
              maxWidth: '100vw',
              marginLeft: 'auto'
            }}
          >
            <LoadingButton
              onClick={() => reset(defaultValues)}
              variant='outlined'
              disabled={isSubmitting}
              sx={{
                height: '56px',
                width: '50%',
                borderColor: theme.palette.customColors.Outline,
                borderWidth: '1.5px',
                color: theme.palette.customColors.OnSurfaceVariant,
                fontWeight: 600,
                letterSpacing: 0,
                px: '24px'
              }}
            >
              RESET
            </LoadingButton>
            <LoadingButton
              type='submit'
              variant='contained'
              loading={isSubmitting}
              sx={{
                height: '56px',
                width: '50%',
                fontWeight: 600,
                letterSpacing: 0,
                px: '24px'
              }}
            >
              SAVE
            </LoadingButton>
          </Box>
        </Box>
      </FormProvider>
    </Drawer>
  )
}

export default AddanesthesiaRecordDrawer
