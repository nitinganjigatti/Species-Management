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
import { getPatientDetails } from 'src/lib/api/hospital/incomingPatient'

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

export default function AddAnesthesiaRecord() {
  const router = useRouter()
  const { id, hospital_case_id, medical_record_id, hospital_id } = router.query
  const [expanded, setExpanded] = useState('basicDetails')
  const [isBasicDetailsValid, setIsBasicDetailsValid] = useState(false)
  const [isApiSuccess, setIsApiSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [assessmentList, setassessmentList] = useState([])
  const [anesthesiaSetupList, setanesthesiaSetupList] = useState([])
  const [clinPathList, setClinPathList] = useState([])
  const [doctors, setDoctors] = useState([])
  const [patientLoading, setPatientLoading] = useState(false)
  const [patientData, setPatientData] = useState(null)
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
    }
    try {
      const response = await getAssesmentList(params)
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

  const fetchClinPathList = async () => {
    const params = {
      type: 'clin_path'
    }
    try {
      const response = await getAssesmentList(params)
      if (response?.success && response?.data?.records?.length > 0) {
        setClinPathList(
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
      type: 'anaesthesia_setup'
    }
    try {
      const response = await getAnesthesiaSetupList(params)
      console.log(response, 'response')
      if (response?.success && response?.data?.result?.length > 0) {
        setanesthesiaSetupList(response.data.result)
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {}
  }

  useEffect(() => {
    const getPatientInfo = async () => {
      setPatientLoading(true)
      try {
        await getPatientDetails(hospital_case_id).then(res => {
          if (res?.success === true) {
            setPatientData(res?.data)
            setPatientLoading(false)
          } else {
            setPatientData(null)
            setPatientLoading(false)
          }
        })
      } catch (error) {
        console.error('Cannot Fetch Patient Details', error)
        setPatientLoading(false)
      }
    }

    getPatientInfo()
  }, [hospital_case_id])

  useEffect(() => {
    getUserLists()
    fetchAssessmentList()
    fetchAnesthesiaSetup()
    fetchClinPathList()
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
    { label: 'Class I Normal Health', value: 'Class I Normal Health' },
    { label: 'Class II Minor Health', value: 'Class II Minor Health' },
    { label: 'Class III Major Health', value: 'Class III Major Health' }
  ]

  const bodyConditionOptions = [
    { label: 'Fair/Thin ', value: 'Fair/Thin' },
    { label: 'Good', value: 'Good' },
    { label: 'Obese/Fat', value: 'Obese/Fat' },
    { label: 'Poor/Emaciated', value: 'Poor/Emaciated' }
  ]

  const animalActivityOptions = [
    { label: 'Calm', value: 'Calm' },
    { label: 'Active', value: 'Active' },
    { label: 'Excited', value: 'Excited' }
  ]

  const codeStatusOptions = [
    { label: 'R (Resuscitate)', value: 'R (Resuscitate)' },
    { label: 'Y (Conditional)', value: 'Y (Conditional)' },
    { label: 'G (Do not Resuscitate)', value: 'G (Do not Resuscitate)' }
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
        catheter_setup: { checked: false, method: '' },
        syringe_pump: { checked: false, rate: '' },
        et_intubation: { checked: false, tubeSizes: '' },
        nasal_intubation: { checked: false, fluidType: '', quantity: '' },
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
        weight_unit: 'kg',
        mark_weight_as_approximate: false,
        pre_anesthesia_notes: '',
        clin_path: {
          selected: [],
          custom: []
        }
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

  //   useEffect(() => {
  //     // Hardcoded data based on your curl
  //     // const apiClinSelected = detail.pre_anaesthesia?.clin_path?.selected || []

  //     // const clinSelectedObj = apiClinSelected.reduce((acc, id) => {
  //     //   acc[id] = true // or acc[String(id)] = true if you prefer
  //     //   return acc
  //     // }, {})
  //     reset({
  //       basicDetails: {
  //         location: 'Bangalore',
  //         anaesthesia_datetime: '2025-11-17 00:00:00',
  //         estimated_time_required: '10',
  //         estimated_time_unit: 'hr',
  //         veterinarian_id: '68',
  //         anesthetist_id: '70',
  //         selected: ['24', '25'],
  //         custom: [],
  //         notes: 'notes 1'
  //       },
  //       anesthesiaSetup: {
  //         // from anaesthesia_setup array
  //         fluids: {
  //           checked: true,
  //           fluidType: '12', // fluid_type
  //           quantity: '10' // fluid_quantity
  //         },
  //         catheter_setup: {
  //           checked: true,
  //           method: 'IV' // catheter_type
  //         },
  //         syringe_pump: {
  //           checked: true,
  //           rate: '15' // syringe_rate
  //         },
  //         // others remain default / unchecked
  //         et_intubation: { checked: false, tubeSizes: '' },
  //         nasal_intubation: { checked: false, fluidType: '', quantity: '' },
  //         ventilation: { checked: false, mode: '' },
  //         monitoring: { checked: false, selected: [], otherItems: [] }
  //       },
  //       medicationsGas: {
  //         medications: [],
  //         gases: []
  //       },
  //       vitalMonitoring: [],
  //       preAnesthesia: {
  //         temperature: '100',
  //         humidity: '120',
  //         physical_health_status: 'excellent',
  //         body_condition: 'ideal',
  //         animal_activity: 'active',
  //         fasting_time: '12',
  //         fasting_unit: 'hours',
  //         previous_endotracheal_tube_size: '0',
  //         code_status: 'full_code',
  //         weight: '90',
  //         weight_unit: 'kg',
  //         mark_weight_as_approximate: true, // because weight_type = "Estimated"
  //         pre_anesthesia_notes: 'notes for risk',
  //         // clin_path: {
  //         //     selected: clinSelectedObj,                 // 👈 {3:true,4:true,5:true}
  //         //     custom: pre.clin_path?.custom || []
  //         //   },
  //         clin_path: {
  //           selected: {
  //             16: true,
  //             17: true
  //           }, // from curl: "selected":[16,17]
  //           custom: ['item 1'] // from curl: "custom":["item 1"]
  //         }
  //       },
  //       recoveryAndReversal: {
  //         reversalDrugs: []
  //       },
  //       attachments: {
  //         files: [],
  //         comments: ''
  //       }
  //     })
  //   }, [reset])

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

  const toCamel = s => s.replace(/_([a-z])/g, g => g[1].toUpperCase())
  const uiKeyForField = (sectionStringId, apiFieldKey) => {
    const camel = toCamel(apiFieldKey)
    const mapping = {
      fluids: {
        fluid_type: 'fluidType',
        fluid_quantity: 'quantity',
        quantity: 'quantity'
      },
      catheter_setup: {
        catheter_type: 'method'
      },
      syringe_pump: {
        syringe_rate: 'rate'
      },
      et_intubation: {
        et_tube: 'tubeSizes'
      },
      nasal_intubation: {
        nasal_tube: 'tubeSizes'
      },
      ventilation: {
        ventilation_mode: 'mode'
      }
    }
    return (mapping[sectionStringId] && mapping[sectionStringId][apiFieldKey]) || camel
  }

  const onValid = async data => {
    setIsSubmitting(true)

    try {
      const anesthesiaSetupValues = methods.getValues('anesthesiaSetup') || {}
      const invalidSections = []

      clearErrors('anesthesiaSetup')

      let hasAnySetupError = false

      for (const meta of anesthesiaSetupList || []) {
        const sectionKey = meta.string_id
        const sectionForm = anesthesiaSetupValues[sectionKey]

        if (!sectionForm?.checked) continue

        let sectionHasError = false
        if (Array.isArray(meta.fields) && meta.fields.length > 0) {
          for (const f of meta.fields) {
            const uiKey = uiKeyForField(meta.string_id, f.field_key)
            const v = sectionForm[uiKey]

            const isEmpty = v === undefined || v === null || (typeof v === 'string' && v.trim() === '')

            if (isEmpty) {
              sectionHasError = true
              hasAnySetupError = true

              setError(`anesthesiaSetup.${sectionKey}.${uiKey}`, {
                type: 'required',
                message: `${f.field_label} is required`
              })
            }
          }
        }

        if (Array.isArray(meta.monitoring_items) && meta.monitoring_items.length > 0) {
          const mon = sectionForm.monitoring || {}
          const selected = mon.selected || []
          const otherItems = mon.otherItems || []

          if (!selected.length && !otherItems.length) {
            sectionHasError = true
            hasAnySetupError = true

            setError(`anesthesiaSetup.${sectionKey}.monitoring`, {
              type: 'required',
              message: 'Select at least one monitoring item or add an "Other" item'
            })
          }
        }

        if (sectionHasError) {
          invalidSections.push(meta.section_name)
        }
      }

      if (hasAnySetupError) {
        Toaster({
          type: 'error',
          message: `Please fill all required fields for: ${invalidSections.join(', ')} or uncheck those sections.`
        })
        setIsSubmitting(false)
        return
      }

      const pre = data.preAnesthesia || {}

      const clinPathSelectedObj = pre.clin_path?.selected || {}
      const clinPathSelectedIds = Object.entries(clinPathSelectedObj)
        .filter(([, checked]) => !!checked)
        .map(([id]) => Number(id))
      const preAnaesthesiaPayload = {
        temperature: pre.temperature || '',
        humidity: pre.humidity || '',
        physical_health_status: pre.physical_health_status || '',
        body_condition: pre.body_condition || '',
        animal_activity: pre.animal_activity || '',
        fasting_time: pre.fasting_time || '',
        fasting_unit: pre.fasting_unit || '',
        previous_endotracheal_tube_size: pre.previous_endotracheal_tube_size || '',
        code_status: pre.code_status || '',
        weight: pre.weight || '',
        weight_unit: pre.weight_unit || '',
        weight_type: pre.mark_weight_as_approximate ? 'Estimated' : 'Actual',
        pre_anesthesia_notes: pre.pre_anesthesia_notes || '',
        clin_path: {
          selected: clinPathSelectedIds,
          custom: pre.clin_path?.custom || []
        }
      }

      const formData = new FormData()

      formData.append('hospital_case_id', hospital_case_id || '')
      formData.append('medical_record_id', medical_record_id || '')
      formData.append('location', data.basicDetails.location)
      formData.append('anaesthesia_datetime', data.basicDetails.anaesthesia_datetime)
      formData.append('estimated_time_required', data.basicDetails.estimated_time_required)
      formData.append('estimated_time_unit', data.basicDetails.estimated_time_unit)
      formData.append('veterinarian_id', data.basicDetails.veterinarian_id)
      formData.append('anesthetist_id', data.basicDetails.anesthetist_id)
      formData.append('notes', data.basicDetails.notes)
      //formData.append('anaesthesia_id')
      const purposePayload = {
        selected: data.basicDetails.selected || [],
        custom: data.basicDetails.custom || []
      }
      formData.append('purpose', JSON.stringify(purposePayload))
      // formData.append('pre_anaesthesia', JSON.stringify(preAnaesthesiaPayload))
      const anaesthesiaSetupPayload = []
      const currentSetupValues = methods.getValues('anesthesiaSetup') || {}

      for (const meta of anesthesiaSetupList || []) {
        const key = meta.string_id
        const sectionForm = currentSetupValues[key] || {}

        if (!sectionForm || sectionForm.checked !== true) continue

        const fieldsArr = (meta.fields || []).map(f => {
          const fieldFromObject =
            (sectionForm.fields && sectionForm.fields[f.field_key] && sectionForm.fields[f.field_key].field_value) ??
            null
          const uiKey = uiKeyForField(meta.string_id, f.field_key)
          const fieldFromFlat = sectionForm[uiKey] ?? null

          const field_value = fieldFromObject ?? fieldFromFlat ?? ''
          const unit =
            (sectionForm.fields && sectionForm.fields[f.field_key] && sectionForm.fields[f.field_key].unit) ??
            f.unit ??
            null

          return {
            field_id: f.field_id,
            field_key: f.field_key,
            //field_label: f.field_label,
            // input_type: f.input_type,
            //options: f.options || [],
            //units: f.units || [],
            field_value: field_value,
            unit: unit
          }
        })

        let monitoringObj = undefined
        if (Array.isArray(meta.monitoring_items) && meta.monitoring_items.length > 0) {
          const monState = sectionForm.monitoring || {}
          const selected = monState.selected || []
          const custom = monState.otherItems || []
          monitoringObj = { selected, custom }
        }
        const sectionObj = {
          section_id: meta.section_id,
          //section_name: meta.section_name,
          string_id: meta.string_id,
          // type: meta.type || 'anaesthesia_setup',
          fields: fieldsArr
        }

        if (monitoringObj) sectionObj.monitoring = monitoringObj

        anaesthesiaSetupPayload.push(sectionObj)
      }

      //formData.append('anaesthesia_setup', JSON.stringify(anaesthesiaSetupPayload))

      console.log('🔹 Final payload for API:', {
        hospital_case_id: hospital_case_id || '',
        medical_record_id: medical_record_id || '',
        location: data.basicDetails.location,
        anaesthesia_datetime: data.basicDetails.anaesthesia_datetime,
        estimated_time_required: data.basicDetails.estimated_time_required,
        estimated_time_unit: data.basicDetails.estimated_time_unit,
        veterinarian_id: data.basicDetails.veterinarian_id,
        anesthetist_id: data.basicDetails.anesthetist_id,
        notes: data.basicDetails.notes,
        purpose: purposePayload,
        anaesthesia_setup: anaesthesiaSetupPayload
      })

      const response = await addAnesthesia(formData)

      if (response?.status === true) {
        setIsApiSuccess(true)
        setExpanded('medicationsGas')
        Toaster({ type: 'success', message: response?.message })
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to save record' })
      }
    } catch (error) {
      console.error(error)
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
  console.log(id, 'id')
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
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  gap: 1
                }}
              >
                <Icon
                  style={{ cursor: 'pointer' }}
                  color={theme.palette.customColors.OnSurfaceVariant}
                  icon='material-symbols:arrow-back'
                />
                <Typography variant='h6' fontWeight={600}>
                  Anesthesia Record
                  {/* - AN2345/25 */}
                </Typography>
              </Box>

              {/* <Typography
                sx={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontSize: '12px',
                  fontWeight: 400,
                  ml: 6
                }}
              >
                Last Saved : 12 Aug 2025 · 12:00 PM
              </Typography> */}
            </Box>

            <AnimalDetails
              image={patientData?.animal_detail?.default_icon}
              name={patientData?.animal_detail?.common_name}
              scientificName={patientData?.animal_detail?.complete_name}
              identifierValue={patientData?.animal_detail?.local_identifier_value}
              identifierName={patientData?.animal_detail?.local_identifier_name}
              admittedDays={patientData?.admitted_for_day}
              location={patientData?.bed_name || 'N/A'}
              vet={patientData?.attend_by_full_name || 'N/A'}
              ageGender={`${patientData?.animal_detail?.age || 'N/A'}${
                patientData?.animal_detail?.sex ? ` . ${patientData?.animal_detail?.sex}` : ''
              }`}
              isLoading={patientLoading}
              backgroundColor={theme.palette.customColors.tableHeaderBg}
              marginSpacing={'18px 24px 15px 24px'}
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
                      anesthesiaSetupList={anesthesiaSetupList}
                      clinPathOptions={clinPathList}
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
