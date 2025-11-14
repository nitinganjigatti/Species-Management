import * as React from 'react'
import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Breadcrumbs
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import { useForm, FormProvider } from 'react-hook-form'

import BasicDetails from 'src/components/hospital/inpatient/Anesthesia/BasicDetails'
import AttachmentsSection from 'src/components/hospital/inpatient/Anesthesia/AttachmentsSection'
import AnesthesiaSetUpSection from 'src/components/hospital/inpatient/Anesthesia/AnesthesiaSetUp'
import VitalMonitoring from 'src/components/hospital/inpatient/Anesthesia/VitalMonitoring'
import AnimalDetails from 'src/views/pages/hospital/symptoms/AnimalDetails'
import ActionButtons from 'src/components/hospital/FooterActionbuttons'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import MedicationsGasSection from 'src/components/hospital/inpatient/Anesthesia/MedicationsGasSection'
import PreAnesthesia from 'src/components/hospital/inpatient/Anesthesia/PreAnesthesia'
import RecoveryAndReversal from 'src/components/hospital/inpatient/Anesthesia/RecoveryAndReversal'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import { readAsync } from 'src/lib/windows/utils'
import { getAssesmentList, addAnesthesia, getAnesthesiaSetupList } from 'src/lib/api/hospital/anesthesia'
import Toaster from 'src/components/Toaster'

export const anesthesiaSchema = yup.object({
  basicDetails: yup.object({
    location: yup.string().trim().required('Location is required'),
    anaesthesia_datetime: yup.string().trim().required('Date & time is required'),
    estimated_time_required: yup.string().trim().required('Estimated time is required'),
    veterinarian_id: yup.string().trim().required('Veterinarian is required'),
    anesthetist_id: yup.string().trim().required('Anesthetist is required'),
    selected: yup.array().of(yup.string()).min(1, 'Select at least one purpose'),
    notes: yup.string().trim().required('Notes are required')
  }),
  vitalMonitoring: yup
    .array()
    .of(
      yup.object({
        id: yup.string().required(),
        timeLabel: yup.string().trim().required(),
        entries: yup.object().default({})
      })
    )
    .default([]),
  attachments: yup.object({
    files: yup.array().of(yup.mixed()).optional(),
    comments: yup.string().optional()
  })
})

const sections = [
  { id: 'basicDetails', label: 'Basic Detail', component: BasicDetails },
  { id: 'medicationsGas', label: 'Medications & Gas', component: MedicationsGasSection },
  { id: 'anesthesiaSetUp', label: 'Anesthesia Set Up', component: AnesthesiaSetUpSection },
  { id: 'preAnesthesia', label: 'Pre Anesthesia', component: PreAnesthesia },
  { id: 'vitalMonitoring', label: 'Vital Monitoring', component: VitalMonitoring },
  { id: 'recoveryAndReversal', label: 'Recovery And Reversal', component: RecoveryAndReversal },
  { id: 'attachments', label: 'Attachments', component: AttachmentsSection }
]

export default function AddAnesthesiaRecord({ patientData }) {
  const router = useRouter()
  const { hospital_case_id, medical_record_id, hospital_id } = router.query
  const [expanded, setExpanded] = useState('basicDetails')
  const [isBasicDetailsValid, setIsBasicDetailsValid] = useState(false)
  const [isApiSuccess, setIsApiSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [assessmentList, setassessmentList] = useState([])
  const [doctors, setDoctors] = useState([])
  const sectionRefs = React.useRef({})
  const scrollContainerRef = React.useRef(null)
  const theme = useTheme()

  const getUserLists = async (query = '') => {
    try {
      const userDetails = await readAsync('userDetails')
      if (userDetails?.user?.zoos.length > 0) {
        const zoo_id = userDetails.user.zoos[0].zoo_id
        const params = { zoo_id }
        if (query.trim() !== '') {
          params.q = query
        }
        const res = await getUserList(params)
        if (res?.data?.length > 0) {
          setDoctors(
            res.data.map(item => ({
              name: item?.user_name,
              id: item?.user_id,
              default_icon: item?.user_profile_pic,
              role_name: item?.role_name
            }))
          )
        } else {
          setDoctors([])
        }
      }
    } catch (error) {
      console.log('user error', error)
    }
  }

  const fetchAssessmentList = async () => {
    const params = {
      type: 'purpose'
      // anaesthesia_id: '7'
      //hospital_id: hospital_id
      // page:"",
      // limit:"",
    }
    try {
      const response = await getAssesmentList(params)
      console.log(response, 'response')
      if (response?.success && response?.data?.records?.length > 0) {
        setassessmentList(
          response?.data?.records.map(item => ({
            name: item?.name,
            id: item?.id
          }))
        )
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {}
  }

  const fetchAnesthesiaSetup = async () => {
    const params = {
      type: 'anaesthesia_setup',
      // anaesthesia_id: '6',
      hospital_id: hospital_id
      // page_no:"",
      // limit:"",
    }
    try {
      const response = await getAnesthesiaSetupList(params)
      console.log(response, 'response')
      if (response?.success && response?.data?.records?.length > 0) {
        setassessmentList(
          response?.data?.records.map(item => ({
            name: item?.name,
            id: item?.id
          }))
        )
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {}
  }

  useEffect(() => {
    getUserLists()
    fetchAssessmentList()
    //fetchAnesthesiaSetup()
  }, [])

  const drugOptions = [
    { drug_id: '1', drug_name: 'Ketamine 100 MG Tablet' },
    { drug_id: '2', drug_name: 'Acepromazine' },
    { drug_id: '3', drug_name: 'Propofol' },
    { drug_id: '4', drug_name: 'Midazolam' },
    { drug_id: '5', drug_name: 'Fentanyl' }
  ]

  const gasOptions = [
    { gas_id: '1', gas_name: 'Halothane' },
    { gas_id: '2', gas_name: 'Isoflurane' },
    { gas_id: '3', gas_name: 'Sevoflurane' },
    { gas_id: '4', gas_name: 'Oxygen' },
    { gas_id: '5', gas_name: 'Nitrous Oxide' }
  ]

  const unitOptions = [
    { label: 'mg', value: 'mg' },
    { label: 'ml', value: 'ml' },
    { label: 'g', value: 'g' },
    { label: 'mcg', value: 'mcg' }
  ]

  const deliveryRouteOptions = [
    { label: 'Intramuscular', value: 'intramuscular' },
    { label: 'Intravenous', value: 'intravenous' },
    { label: 'Subcutaneous', value: 'subcutaneous' },
    { label: 'Oral', value: 'oral' },
    { label: 'Inhalation', value: 'inhalation' }
  ]

  const physicalHealthStatusOptions = [
    { label: 'Excellent', value: 'excellent' },
    { label: 'Good', value: 'good' },
    { label: 'Fair', value: 'fair' },
    { label: 'Poor', value: 'poor' },
    { label: 'Critical', value: 'critical' }
  ]

  const bodyConditionOptions = [
    { label: 'Emaciated', value: 'emaciated' },
    { label: 'Thin', value: 'thin' },
    { label: 'Ideal', value: 'ideal' },
    { label: 'Overweight', value: 'overweight' },
    { label: 'Obese', value: 'obese' }
  ]

  const animalActivityOptions = [
    { label: 'Very Active', value: 'very_active' },
    { label: 'Active', value: 'active' },
    { label: 'Moderate', value: 'moderate' },
    { label: 'Sedentary', value: 'sedentary' },
    { label: 'Inactive', value: 'inactive' }
  ]

  const codeStatusOptions = [
    { label: 'Full Code', value: 'full_code' },
    { label: 'DNR (Do Not Resuscitate)', value: 'dnr' },
    { label: 'Limited Interventions', value: 'limited_interventions' }
  ]

  const recoveryTypeOptions = [
    { label: 'Smooth', value: 'smooth' },
    { label: 'Moderate', value: 'moderate' },
    { label: 'Rough', value: 'rough' },
    { label: 'Prolonged', value: 'prolonged' }
  ]

  const anesthesiaRatingOptions = [
    { label: 'Excellent', value: 'excellent' },
    { label: 'Good', value: 'good' },
    { label: 'Fair', value: 'fair' },
    { label: 'Poor', value: 'poor' }
  ]

  const methods = useForm({
    defaultValues: {
      basicDetails: {
        location: '',
        anaesthesia_datetime: '',
        estimated_time_required: '',
        estimated_time_unit: 'hr',
        veterinarian_id: '',
        anesthetist_id: '',
        selected: [],
        custom: [],
        notes: ''
      },
      anesthesiaSetup: {
        fluids: { checked: false, fluidType: '', quantity: '' },
        catheterSetup: { checked: false, method: '' },
        syringePump: { checked: false, rate: '' },
        etIntubation: { checked: false, tubeSizes: '' },
        nasalIntubation: { checked: false, fluidType: '', quantity: '' },
        ventilation: { checked: false, mode: '' },
        monitoring: { checked: false, selected: [], otherItems: [] }
      },
      medicationsGas: {
        medications: [],
        gases: []
      },
      vitalMonitoring: [],
      preAnesthesia: {
        temperature: '',
        humidity: '',
        physical_health_status: '',
        body_condition: '',
        animal_activity: '',
        fasting_time: '',
        fasting_unit: 'hours',
        previous_endotracheal_tube_size: '',
        code_status: '',
        weight: '',
        mark_weight_as_approximate: false,
        risk_concerns: '',
        clin_path: [],
        other_clin_path: []
      },
      recoveryAndReversal: {
        reversalDrugs: []
      },
      attachments: {
        files: [],
        comments: ''
      }
    },
    mode: 'onSubmit',
    resolver: yupResolver(anesthesiaSchema),
    reValidateMode: 'onChange'
  })

  const {
    handleSubmit,
    setError,
    clearErrors,
    reset,
    setValue,
    watch,
    trigger,
    formState: { errors, isValid }
  } = methods

  // Watch individual fields
  const location = watch('basicDetails.location')
  const anaesthesia_datetime = watch('basicDetails.anaesthesia_datetime')
  const estimated_time_required = watch('basicDetails.estimated_time_required')
  const veterinarian_id = watch('basicDetails.veterinarian_id')
  const anesthetist_id = watch('basicDetails.anesthetist_id')
  const selected = watch('basicDetails.selected')
  const notes = watch('basicDetails.notes')

  const medications = watch('medicationsGas.medications')
  const gases = watch('medicationsGas.gases')
  const reversalDrugs = watch('recoveryAndReversal.reversalDrugs')

  const handleAddMedication = React.useCallback(
    medicationData => {
      setValue('medicationsGas.medications', [...medications, medicationData])
    },
    [medications, setValue]
  )

  const handleAddGas = React.useCallback(
    gasData => {
      setValue('medicationsGas.gases', [...gases, gasData])
    },
    [gases, setValue]
  )

  const handleUpdateMedication = React.useCallback(
    (index, medicationData) => {
      const updatedMedications = [...medications]
      updatedMedications[index] = medicationData
      setValue('medicationsGas.medications', updatedMedications)
    },
    [medications, setValue]
  )

  const handleUpdateGas = React.useCallback(
    (index, gasData) => {
      const updatedGases = [...gases]
      updatedGases[index] = gasData
      setValue('medicationsGas.gases', updatedGases)
    },
    [gases, setValue]
  )

  const handleDeleteMedication = React.useCallback(
    index => {
      const updatedMedications = medications.filter((_, i) => i !== index)
      setValue('medicationsGas.medications', updatedMedications)
    },
    [medications, setValue]
  )

  const handleDeleteGas = React.useCallback(
    index => {
      const updatedGases = gases.filter((_, i) => i !== index)
      setValue('medicationsGas.gases', updatedGases)
    },
    [gases, setValue]
  )

  const onAddReversalDrug = React.useCallback(
    drugData => {
      const current = Array.isArray(reversalDrugs) ? reversalDrugs : []
      setValue('recoveryAndReversal.reversalDrugs', [...current, drugData], { shouldDirty: true, shouldTouch: true })
    },
    [reversalDrugs, setValue]
  )

  const onUpdateReversalDrug = React.useCallback(
    (index, drugData) => {
      const current = Array.isArray(reversalDrugs) ? [...reversalDrugs] : []
      if (index < 0 || index >= current.length) return
      current[index] = drugData
      setValue('recoveryAndReversal.reversalDrugs', current, { shouldDirty: true, shouldTouch: true })
    },
    [reversalDrugs, setValue]
  )

  const onDeleteReversalDrug = React.useCallback(
    index => {
      const current = Array.isArray(reversalDrugs) ? [...reversalDrugs] : []
      const updated = current.filter((_, i) => i !== index)
      setValue('recoveryAndReversal.reversalDrugs', updated, { shouldDirty: true, shouldTouch: true })
    },
    [reversalDrugs, setValue]
  )

  // Validate basic details for internal tracking
  React.useEffect(() => {
    const validateBasicDetails = async () => {
      const valid = await trigger('basicDetails')
      setIsBasicDetailsValid(valid)
    }

    validateBasicDetails()
  }, [
    location,
    anaesthesia_datetime,
    estimated_time_required,
    veterinarian_id,
    anesthetist_id,
    selected,
    notes,
    trigger
  ])

  const handleChange = async sectionId => {
    if (sectionId !== 'basicDetails' && !isApiSuccess) {
      const valid = await methods.trigger('basicDetails')
      if (!valid) {
        setExpanded('basicDetails')
        setTimeout(() => {
          const firstErrorField = document.querySelector('[data-field].Mui-error')
          firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 300)
        return
      }
    }

    const isExpanding = expanded !== sectionId
    setExpanded(sectionId)

    if (isExpanding) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            const target = sectionRefs.current[sectionId]
            const scrollContainer = scrollContainerRef.current

            if (target && scrollContainer) {
              const containerRect = scrollContainer.getBoundingClientRect()
              const targetRect = target.getBoundingClientRect()
              const offset = 8
              const scrollTop = scrollContainer.scrollTop + targetRect.top - containerRect.top - offset

              scrollContainer.scrollTo({
                top: scrollTop,
                behavior: 'smooth'
              })
            }
          }, 350)
        })
      })
    }
  }

  const onValid = async data => {
    setIsSubmitting(true)

    try {
      const formData = new FormData()

      formData.append('hospital_case_id', hospital_case_id || '234')
      formData.append('medical_record_id', medical_record_id || '16427')
      formData.append('location', data.basicDetails.location)
      formData.append('anaesthesia_datetime', data.basicDetails.anaesthesia_datetime)
      formData.append('estimated_time_required', data.basicDetails.estimated_time_required)
      formData.append('estimated_time_unit', data.basicDetails.estimated_time_unit)
      formData.append('veterinarian_id', data.basicDetails.veterinarian_id)
      formData.append('anesthetist_id', data.basicDetails.anesthetist_id)
      formData.append('notes', data.basicDetails.notes)

      const purposePayload = {
        selected: data.basicDetails.selected || [],
        custom: data.basicDetails.custom || []
      }
      formData.append('purpose', JSON.stringify(purposePayload))
      console.log('🔹 Final payload for API:', Object.fromEntries(formData))
      const response = await addAnesthesia(formData)

      if (response?.status === true) {
        setIsApiSuccess(true)
        setExpanded('medicationsGas')
        Toaster({ type: 'success', message: response?.message })
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to save record' })
      }
    } catch (error) {
      Toaster({ type: 'error', message: 'Something went wrong. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const onInvalid = errors => {
    const firstPath = Object.keys(errors.basicDetails || {})[0] || (errors.attachments ? 'attachments' : 'basicDetails')

    if (firstPath) {
      setExpanded('basicDetails')
      requestAnimationFrame(() => {
        const el = document.querySelector(`[data-field="${firstPath}"]`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }
  }

  // Determine if sections should be enabled
  const shouldEnableSections = isApiSuccess

  return (
    <FormProvider {...methods}>
      <Box display='flex' flexDirection='column' gap={3} sx={{ p: 3 }}>
        <Breadcrumbs aria-label='breadcrumb'>
          <Typography color={theme.palette.text.secondary}>Hospital</Typography>
          <Typography color={theme.palette.text.secondary}>Patients</Typography>
          <Typography color={theme.palette.text.secondary}>Inpatient</Typography>
          <Typography
            color={theme.palette.text.secondary}
            sx={{ cursor: 'pointer' }}
            onClick={() => window.history.back()}
          >
            Details
          </Typography>
          <Typography color={theme.palette.text.primary}>Add Anesthesia</Typography>
        </Breadcrumbs>

        <Box
          position='relative'
          height='80vh'
          display='flex'
          flexDirection='column'
          borderRadius='8px'
          overflow='hidden'
        >
          <Paper
            elevation={3}
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              bgcolor: 'background.paper',
              borderBottom: 1,
              borderColor: 'divider',
              boxShadow: 'none',
              borderRadius: '8px'
            }}
          >
            <Box
              px={3}
              pt={2}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 0,
                flexDirection: 'column',
                pl: 7
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
                <Icon
                  style={{ cursor: 'pointer' }}
                  color={theme.palette.customColors.OnSurfaceVariant}
                  icon='material-symbols:arrow-back'
                />
                <Typography variant='h6' fontWeight={600}>
                  Anesthesia Record - AN2345/25
                </Typography>
              </Box>

              <Typography
                sx={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontSize: '12px',
                  fontWeight: 400,
                  ml: 6
                }}
              >
                Last Saved : 12 Aug 2025 · 12:00 PM
              </Typography>
            </Box>

            <AnimalDetails
              image='/icons/Activity.svg'
              name='Luna'
              scientificName='Felis catus'
              identifierValue='CAT-202'
              identifierName='Microchip'
              admittedDays='2'
              location='Zoo'
              vet='test'
              ageGender='24 || Male'
            />

            <Tabs
              value={expanded}
              onChange={(e, val) => handleChange(val)}
              variant='scrollable'
              scrollButtons='auto'
              sx={{
                px: 2,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 500,
                  minHeight: 48
                }
              }}
            >
              {sections.map(sec => {
                const isDisabled = sec.id !== 'basicDetails' && !shouldEnableSections
                return (
                  <Tab
                    key={sec.id}
                    label={sec.label}
                    value={sec.id}
                    disabled={isDisabled}
                    sx={{
                      color:
                        sec.id !== 'basicDetails' && !shouldEnableSections
                          ? theme.palette.customColors.OnSurfaceVariant
                          : theme.palette.customColors.secondaryBg,
                      fontSize: '14px',
                      fontWeight: '600!important',
                      opacity: sec.id !== 'basicDetails' && !shouldEnableSections ? 0.5 : 1
                    }}
                  />
                )
              })}
            </Tabs>
          </Paper>

          {/* Scroll container with proper height and overflow */}
          <Box
            ref={scrollContainerRef}
            flex={1}
            overflow='auto'
            p={0}
            mt={4}
            mb={10}
            sx={{
              '&::-webkit-scrollbar': {
                width: '8px'
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1'
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#c1c1c1',
                borderRadius: '4px'
              },
              overflowX: 'hidden'
            }}
          >
            {sections.map(({ id, label, component: SectionComponent }) => {
              const isDisabled = id !== 'basicDetails' && !shouldEnableSections
              return (
                <Accordion
                  key={id}
                  expanded={expanded === id}
                  onChange={() => handleChange(id)}
                  ref={el => (sectionRefs.current[id] = el)}
                  sx={{
                    mb: 2,
                    borderRadius: '8px',
                    boxShadow: 0,
                    '&:before': { display: 'none' },
                    ...(isDisabled && {
                      opacity: 0.6,
                      pointerEvents: 'none',
                      backgroundColor: theme.palette.common.white
                    })
                  }}
                >
                  <AccordionSummary
                    expandIcon={
                      expanded === id ? (
                        <Typography sx={{ fontWeight: 'bold', fontSize: 24, color: '#4c4e646e' }}>−</Typography>
                      ) : (
                        <Typography
                          sx={{
                            fontWeight: 'bold',
                            fontSize: 24,
                            color: isDisabled ? '#4c4e646e' : theme.palette.customColors.OnSurfaceVariant
                          }}
                        >
                          +
                        </Typography>
                      )
                    }
                  >
                    <Typography fontWeight={600} sx={{ color: isDisabled ? theme.palette.text.disabled : 'inherit' }}>
                      {label}
                    </Typography>
                  </AccordionSummary>

                  <AccordionDetails sx={{ pt: 0 }}>
                    <SectionComponent
                      sectionId={id}
                      vetOptions={doctors}
                      anesthetistOptions={doctors}
                      purposeOptions={assessmentList}
                      drugOptions={drugOptions}
                      gasOptions={gasOptions}
                      unitOptions={unitOptions}
                      deliveryRouteOptions={deliveryRouteOptions}
                      physicalHealthStatusOptions={physicalHealthStatusOptions}
                      bodyConditionOptions={bodyConditionOptions}
                      animalActivityOptions={animalActivityOptions}
                      codeStatusOptions={codeStatusOptions}
                      onAddMedication={handleAddMedication}
                      onAddGas={handleAddGas}
                      onUpdateMedication={handleUpdateMedication}
                      onUpdateGas={handleUpdateGas}
                      onDeleteMedication={handleDeleteMedication}
                      onDeleteGas={handleDeleteGas}
                      recoveryTypeOptions={recoveryTypeOptions}
                      anesthesiaRatingOptions={anesthesiaRatingOptions}
                      onAddReversalDrug={onAddReversalDrug}
                      onUpdateReversalDrug={onUpdateReversalDrug}
                      onDeleteReversalDrug={onDeleteReversalDrug}
                    />
                  </AccordionDetails>
                </Accordion>
              )
            })}
          </Box>
        </Box>

        <ActionButtons
          cancelLabel='CANCEL'
          addLabel={
            <Box display='flex' alignItems='center' gap={1}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                {isSubmitting ? 'SUBMITTING...' : 'ADD'}
              </span>
            </Box>
          }
          onAdd={handleSubmit(onValid, onInvalid)}
          width={200}
          height={50}
          isSubmitLoading={isSubmitting}
          isAddDisabled={!isBasicDetailsValid}
        />
      </Box>
    </FormProvider>
  )
}
