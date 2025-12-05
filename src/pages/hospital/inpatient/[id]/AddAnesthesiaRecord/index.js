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
  Breadcrumbs,
  CircularProgress
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import { alpha, useTheme } from '@mui/material/styles'
import { Router, useRouter } from 'next/router'
import { useForm, FormProvider } from 'react-hook-form'
import dayjs from 'dayjs'
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
import Utility from 'src/utility'
import {
  getAssesmentList,
  addAnesthesia,
  getAnesthesiaSetupList,
  getUnitList,
  getvitalMonitoringList,
  getAnesthesiaDetails
} from 'src/lib/api/hospital/anesthesia'
import Toaster from 'src/components/Toaster'
import { getPatientDetails } from 'src/lib/api/hospital/incomingPatient'
import { useQueryClient } from '@tanstack/react-query'
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat)

export function serverVitalToFormColumns(serverVital = {}, vitalMeta = []) {
  const timeSlots = Array.isArray(serverVital.time_slots) ? serverVital.time_slots : []
  const records = Array.isArray(serverVital.records) ? serverVital.records : []

  const metaMap = {}
  ;(vitalMeta || []).forEach(m => {
    metaMap[m.string_id] = m
  })
  ;(records || []).forEach(r => {
    metaMap[r.string_id] = r
  })

  const columns = (timeSlots || []).map(slot => {
    const col = {
      id: slot.id ? String(slot.id) : `t_${Math.random().toString(36).slice(2, 9)}`,
      timeLabel: slot.recorded_time || '', // raw time
      entries: {}
    }

    for (const section of records || []) {
      const string_id = section.string_id
      const fields = section.fields || []
      if (!fields.length) continue

      let builtEntry = {}
      const hasValuesArray = fields.some(f => Array.isArray(f.values) && f.values.length > 0)

      if (hasValuesArray) {
        fields.forEach(f => {
          const values = f.values || []
          const vObj = values.find(
            v => String(v.monitoring_time_id) === String(slot.id) || v.monitoring_time_id === slot.recorded_time
          )
          if (vObj) {
            const fieldVal = vObj.field_value == null ? '' : String(vObj.field_value)

            if (f.input_type === 'radio') {
              builtEntry.selection = fieldVal
            } else if (fields.length === 1) {
              builtEntry.value = fieldVal
              builtEntry.unit = vObj.unit ?? ''
            } else {
              builtEntry[f.field_key] = fieldVal
              builtEntry.unit = vObj.unit ?? builtEntry.unit ?? ''
            }
          } else {
            if (f.input_type === 'radio') {
              if (builtEntry.selection === undefined) {
                builtEntry.selection = ''
              }
            } else if (fields.length === 1) {
              builtEntry.value = builtEntry.value ?? ''
              builtEntry.unit = builtEntry.unit ?? ''
            } else {
              builtEntry[f.field_key] = builtEntry[f.field_key] ?? ''
            }
          }
        })
      } else {
        fields.forEach(f => {
          if (f.field_value !== undefined && f.field_value !== null) {
            if (fields.length === 1) {
              builtEntry.value = String(f.field_value)
              builtEntry.unit = f.unit ?? ''
            } else {
              builtEntry[f.field_key] = String(f.field_value)
              builtEntry.unit = f.unit ?? builtEntry.unit ?? ''
            }
          } else {
            if (fields.length === 1) {
              builtEntry.value = builtEntry.value ?? ''
              builtEntry.unit = builtEntry.unit ?? ''
            } else {
              builtEntry[f.field_key] = builtEntry[f.field_key] ?? ''
            }
          }
        })
      }

      col.entries[string_id] = builtEntry
    }

    return col
  })

  return columns
}

const extractFieldValueAndUnit = (fieldMeta, entry) => {
  if (!fieldMeta || !entry) return { value: '', unit: null }

  // 3) radio shape
  if (entry.selection !== undefined) {
    return { value: entry.selection == null ? '' : String(entry.selection), unit: null }
  }

  // 1) prefer unique fieldsById map
  if (entry.fieldsById && entry.fieldsById[String(fieldMeta.field_id)]) {
    const rec = entry.fieldsById[String(fieldMeta.field_id)]
    return { value: rec?.value == null ? '' : String(rec.value), unit: rec?.unit ?? null }
  }

  // 2) fallback: single-number shape { value, unit }
  if (entry.value !== undefined) {
    return { value: entry.value == null ? '' : String(entry.value), unit: entry.unit ?? null }
  }

  // 4) multi-field shape by field_key (note: duplicates may exist; we handle _<id> suffix in prefill)
  const fk = fieldMeta.field_key
  if (entry[fk] !== undefined) {
    return { value: entry[fk] == null ? '' : String(entry[fk]), unit: entry.unit ?? null }
  }
  // also check keyed-by-id fallback key (e.g. `${field_key}_${field_id}`)
  if (entry[`${fk}_${fieldMeta.field_id}`] !== undefined) {
    return {
      value: entry[`${fk}_${fieldMeta.field_id}`] == null ? '' : String(entry[`${fk}_${fieldMeta.field_id}`]),
      unit: entry.unit ?? null
    }
  }

  return { value: '', unit: null }
}

export function formColumnsToVitalMonitoringBlocks(columns = [], vitalList = []) {
  const blocks = []

  for (const col of columns || []) {
    const block = {
      recorded_time: col.timeLabel || '',
      sections: []
    }

    for (const section of vitalList || []) {
      const entry = col.entries?.[section.string_id]
      if (!entry) continue

      const fieldsArr = []

      for (const f of section.fields || []) {
        const { value, unit } = extractFieldValueAndUnit(f, entry)

        if (value === '' || value == null) continue

        fieldsArr.push({
          field_id: f.field_id,
          field_key: f.field_key,
          field_value: value,
          unit: unit ?? ''
        })
      }

      if (fieldsArr.length > 0) {
        block.sections.push({
          section_id: section.section_id,
          string_id: section.string_id,
          fields: fieldsArr
        })
      }
    }

    if (block.sections.length > 0) {
      blocks.push(block)
    }
  }

  return blocks
}

const toBackendTime = v => {
  if (!v) return ''
  if (dayjs.isDayjs(v) || v instanceof Date) {
    return dayjs(v).format('HH:mm:ss')
  }
  const parsed = dayjs(v, ['hh:mm A', 'HH:mm', 'HH:mm:ss'], true)
  if (parsed.isValid()) {
    return parsed.format('HH:mm:ss')
  }

  return v
}

const formatDateTime = value => {
  if (!value) return '--'
  const formatted = Utility.convertUTCToLocalDateTime(value)
  return formatted && formatted !== 'Invalid date' ? formatted : String(value)
}

export const anesthesiaSchema = yup.object({
  basicDetails: yup.object({
    location: yup.string().trim().required('Location is required'),
    anaesthesia_datetime: yup.string().trim().required('Date & time is required'),
    estimated_time_required: yup.string().trim().required('Estimated time is required'),
    veterinarian_id: yup.array().of(yup.string()).min(1, 'Select at least one veterinarian'),
    anesthetist_id: yup.array().of(yup.string()).min(1, 'Select at least one anesthetist'),
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
  { id: 'recoveryAndReversal', label: 'Recovery And Reversal', component: RecoveryAndReversal }
  //   { id: 'attachments', label: 'Attachments', component: AttachmentsSection }
]

export default function AddAnesthesiaRecord() {
  const router = useRouter()
  const { id, hospital_case_id, medical_record_id, hospital_id, anaesthesia_id } = router.query
  const queryClient = useQueryClient()
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
  const [unitList, setunitList] = useState([])
  const [vitalMonitorList, setVitalMonitorList] = useState([])
  const [anesthesiaDetail, setAnesthesiaDetail] = useState(null)
  const [addLoader, setAddLoader] = useState(false)
  const sectionRefs = React.useRef({})
  const scrollContainerRef = React.useRef(null)
  const theme = useTheme()
  const accordionIconColor = alpha(theme.palette.text.primary, 110 / 255)

  const scrollToSection = sectionId => {
    setExpanded(sectionId)

    requestAnimationFrame(() => {
      const scrollContainer = scrollContainerRef.current
      const sectionEl = sectionRefs.current[sectionId]

      if (scrollContainer && sectionEl) {
        const containerRect = scrollContainer.getBoundingClientRect()
        const targetRect = sectionEl.getBoundingClientRect()
        const offset = 8

        scrollContainer.scrollTo({
          top: scrollContainer.scrollTop + targetRect.top - containerRect.top - offset,
          behavior: 'smooth'
        })
      }
    })
  }

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
        await getPatientDetails(id).then(res => {
          if (res?.success === true) {
            setPatientData(res?.data)
            setPatientLoading(false)
          } else {
            setPatientData(null)
            setPatientLoading(false)
          }
        })
      } catch (error) {
        setPatientLoading(false)
      }
    }

    getPatientInfo()
  }, [id])

  const fetchUnitList = async () => {
    try {
      const response = await getUnitList()
      if (response?.success && response?.data) {
        setunitList(response?.data?.prescriptionMeasurementType)
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {}
  }

  const fetchVitalList = async () => {
    try {
      const params = {
        type: 'vital_monitoring'
        // hospital_id:"",
        // page_no:"",
        // limit:"",
        // anaesthesia_id:""
      }
      const response = await getvitalMonitoringList(params)

      if (response?.success && response?.data) {
        setVitalMonitorList(response?.data?.result)
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {}
  }

  useEffect(() => {
    getUserLists()
    fetchAssessmentList()
    fetchAnesthesiaSetup()
    fetchClinPathList()
    fetchUnitList()
    fetchVitalList()
  }, [])

  const purposeStageOptions = [
    { label: 'Premedication', value: 'Premedication' },
    { label: 'Induction', value: 'Induction' },
    { label: 'Analgesia', value: 'Analgesia' }
  ]

  const physicalHealthStatusOptions = [
    { label: 'Class I | Normal Health', value: 'Class I | Normal Health' },
    { label: 'Class II | Minor Health Problem', value: 'Class II | Minor Health Problem' },
    { label: 'Class III | Major Health Problem', value: 'Class III | Major Health Problem' },
    { label: 'Class IV | Serious or Chronic illness', value: 'Class IV | Serious or Chronic illness' },
    { label: 'Class V | May not Survive', value: 'Class V | May not Survive' }
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
    { label: 'Normal', value: 'Normal' },
    { label: 'Prolonged', value: 'Prolonged' },
    { label: 'Stormy', value: 'Stormy' },
    { label: 'Renarcotized', value: 'Renarcotized' },
    { label: 'Problem', value: 'Problem' }
  ]

  const anesthesiaRatingOptions = [
    { label: 'Good', value: 'Good' },
    { label: 'Excellent', value: 'Excellent' },
    { label: 'Fair', value: 'Fair' },
    { label: 'Poor', value: 'Poor' }
  ]

  const methods = useForm({
    defaultValues: {
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
      },
      anesthesiaSetup: {},
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
        fasting_unit: 'Hours',
        previous_endotracheal_tube_size: '',
        code_status: '',
        weight: '',
        weight_unit: 'Kg',
        mark_weight_as_approximate: false,
        pre_anesthesia_notes: '',
        clin_path: {
          selected: [],
          custom: []
        }
      },
      recoveryAndReversal: {
        recovery_type: '',
        recovery_first_effect: null,
        recovery_full_effect: null,
        describe_problem: '',
        notes: '',
        induction: '',
        tolerance: '',
        recovery: '',
        overall: '',
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

  const handleCancel = () => {
    router.push(`/hospital/inpatient/${id}/?tab=anesthesia`)
  }

  const handleCancelNew = async () => {
    await queryClient.invalidateQueries(['anesthesiaRecords', id, patientData?.medical_record_id])
    router.push(`/hospital/inpatient/${id}/?tab=anesthesia`)
  }

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

  React.useEffect(() => {
    const checkBasicDetailsValid = async () => {
      const basicValues = methods.getValues('basicDetails')

      try {
        // validate only the basicDetails part of schema
        const isValid = await anesthesiaSchema.fields.basicDetails.isValid(basicValues, {
          abortEarly: false
        })
        setIsBasicDetailsValid(isValid)
      } catch (e) {
        setIsBasicDetailsValid(false)
      }
    }

    checkBasicDetailsValid()
  }, [
    location,
    anaesthesia_datetime,
    estimated_time_required,
    veterinarian_id,
    anesthetist_id,
    selected,
    notes,
    methods
  ])

  const fetchAnesthesiaDetails = async anaesthesia_id => {
    if (!anaesthesia_id) return

    try {
      setAddLoader(true)
      const response = await getAnesthesiaDetails(anaesthesia_id)
      if (response?.success && response?.data) {
        setAnesthesiaDetail(response.data)
        setAddLoader(false)
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to fetch anesthesia details' })
        setAddLoader(false)
      }
    } catch (error) {
      Toaster({ type: 'error', message: 'Error fetching anesthesia details' })
    }
  }

  useEffect(() => {
    if (!anaesthesia_id) return
    fetchAnesthesiaDetails(anaesthesia_id)
  }, [anaesthesia_id])

  useEffect(() => {
    if (!anesthesiaDetail) return

    const detail = anesthesiaDetail
    const purposeArray = detail.purpose || []

    const selectedPurposeIds = []
    const customPurposeNames = []

    purposeArray.forEach(p => {
      const isSelected = p.is_selected === '1' || p.is_selected === 1 || p.is_selected === true

      if (!isSelected) return

      if (p.is_other === '0' || p.is_other === 0 || p.is_other === false) {
        if (p.id != null) {
          selectedPurposeIds.push(String(p.id))
        }
      }

      if (p.is_other === '1' || p.is_other === 1 || p.is_other === true) {
        if (p.name) {
          customPurposeNames.push(p.name)
        }
      }
    })

    const basicDetailsForm = {
      location: detail?.location || '',
      anaesthesia_datetime: detail.anaesthesia_datetime || '',
      estimated_time_required: detail.estimated_time_required || '',
      estimated_time_unit: detail.estimated_time_unit || 'hr',
      veterinarian_id: (detail.veterinarians || []).map(v => String(v.user_id)),
      anesthetist_id: (detail.anesthetists || []).map(a => String(a.user_id)),

      selected: selectedPurposeIds,
      custom: customPurposeNames,
      notes: detail.notes || ''
    }

    // ---------- MEDICATIONS & GAS ----------
    const anaesthesia_medications = detail.anaesthesia_medications || {}
    const medicationRecords = anaesthesia_medications.medication?.records || []
    const gasRecords = anaesthesia_medications.gas?.records || []

    const combineDateAndTime = (dateStr, timeStr) => {
      if (!timeStr) return null
      const datePart =
        (dateStr && dayjs(dateStr).isValid() && dayjs(dateStr).format('YYYY-MM-DD')) || dayjs().format('YYYY-MM-DD')
      const candidate = `${datePart} ${timeStr}`
      const parsed = dayjs(candidate, 'YYYY-MM-DD HH:mm:ss', true)
      return parsed.isValid() ? parsed : null
    }

    const medicationsFromApi = medicationRecords.map(rec => {
      const createdAt = rec.created_at || null
      return {
        id: rec.id || '',
        drug_name: rec.drug_id ? { id: String(rec.drug_id), name: rec.drug_name || '' } : null,
        purpose_stage: rec.purpose_stage || '',
        amount: rec.amount ? String(rec.amount) : '',
        unit: rec.unit_id ? String(rec.unit_id) : '',
        unit_id: rec.unit_id ? String(rec.unit_id) : '',
        delivery_route: rec.route ? { id: '', delivery: rec.route } : null,
        delivery_time: combineDateAndTime(createdAt, rec.delivery_time),
        max_effect_time: combineDateAndTime(createdAt, rec.max_effect),
        delivery_status: rec.delivery_status || null,
        notes: rec.comments || ''
      }
    })

    const gasFromApi = gasRecords.map(rec => {
      const createdAt = rec.created_at || null
      return {
        id: rec.id || '',
        gas_name: rec.drug_id ? { id: String(rec.drug_id), name: rec.drug_name || '' } : null,
        o2_flow: rec.oxygen_l_min ? String(rec.oxygen_l_min) : '',
        concentration: rec.concentration ? String(rec.concentration) : '',
        delivery_route: rec.route ? { id: '', delivery: rec.route } : null,
        start_time: combineDateAndTime(createdAt, rec.start_time),
        end_time: combineDateAndTime(createdAt, rec.end_time),
        delivery_status: rec.delivery_status || null,
        notes: rec.comments || ''
      }
    })

    // ---------- PRE-ANAESTHESIA ----------
    const pre = detail.pre_anaesthesia || {}
    const clinPathArray = Array.isArray(pre.clin_path) ? pre.clin_path : []

    const clinSelectedObj = {}
    const clinCustomArr = []

    clinPathArray.forEach(item => {
      const isSelected = item.is_selected === '1' || item.is_selected === 1 || item.is_selected === true
      if (!isSelected) return

      const isOther = item.is_other === '1' || item.is_other === 1 || item.is_other === true

      if (!isOther) {
        if (item.id != null) {
          clinSelectedObj[String(item.id)] = true
        }
      } else {
        if (item.name) {
          clinCustomArr.push(item.name)
        }
      }
    })

    const preAnesthesiaForm = {
      temperature: pre.temperature || '',
      humidity: pre.humidity || '',
      physical_health_status: pre.physical_health_status || '',
      body_condition: pre.body_condition || '',
      animal_activity: pre.animal_activity || '',
      fasting_time: pre.fasting_time || '',
      fasting_unit: pre.fasting_unit || 'Hours',
      previous_endotracheal_tube_size: pre.previous_endotracheal_tube_size || '',
      code_status: pre.code_status || '',
      weight: pre.weight || '',
      weight_unit: pre.weight_unit || 'Kg',
      mark_weight_as_approximate: pre.weight_type === 'Estimated',
      pre_anesthesia_notes: pre.pre_anesthesia_notes || '',
      clin_path: {
        selected: clinSelectedObj,
        custom: clinCustomArr
      }
    }

    // ---------- RECOVERY & REVERSAL ----------
    const recovery_and_reversal = detail.recovery_and_reversal || {}
    const recoveryFromApi = recovery_and_reversal.recovery || null
    const reversalRecords = recovery_and_reversal.reversal?.records || []

    const recoveryForm = {
      recovery_type: recoveryFromApi?.recovery_type || '',
      recovery_first_effect: recoveryFromApi?.recovery_first_effect_time
        ? combineDateAndTime(recoveryFromApi.created_at, recoveryFromApi.recovery_first_effect_time)
        : null,
      recovery_full_effect: recoveryFromApi?.recovery_full_effect_time
        ? combineDateAndTime(recoveryFromApi.created_at, recoveryFromApi.recovery_full_effect_time)
        : null,
      describe_problem: recoveryFromApi?.describe_problem || '',
      notes: recoveryFromApi?.notes || '',
      induction: recoveryFromApi?.rating_induction || '',
      tolerance: recoveryFromApi?.rating_tolerance || '',
      recovery: recoveryFromApi?.rating_recovery || '',
      overall: recoveryFromApi?.rating_overall || ''
    }

    const reversalFromApi = reversalRecords.map(rec => {
      const createdAt = rec.created_at || null
      return {
        id: rec.id || '',
        drug_id: rec.drug_id ? Number(rec.drug_id) : undefined,
        drug_name: rec.drug_id ? { id: String(rec.drug_id), name: rec.drug_name || '' } : null,
        amount: rec.amount ? String(rec.amount) : '',
        unit: rec.unit_id ? String(rec.unit_id) : '',
        unit_id: rec.unit_id ? String(rec.unit_id) : '',
        delivery_route: rec.route ? { id: '', delivery: rec.route } : null,
        delivery_time: combineDateAndTime(createdAt, rec.delivery_time),
        max_effect_time: combineDateAndTime(createdAt, rec.max_effect),
        delivery_status: rec.delivery_status || null,
        notes: rec.comments || ''
      }
    })

    // ---------- RESET FORM WITH API DATA ----------
    reset({
      basicDetails: basicDetailsForm,
      medicationsGas: {
        medications: medicationsFromApi,
        gases: gasFromApi
      },
      anesthesiaSetup: {},
      vitalMonitoring: [],
      preAnesthesia: preAnesthesiaForm,
      recoveryAndReversal: {
        ...recoveryForm,
        reversalDrugs: reversalFromApi
      },
      attachments: {
        files: [],
        comments: ''
      }
    })
  }, [anesthesiaDetail, reset])

  useEffect(() => {
    if (!anesthesiaDetail) return

    const apiAnaesthesiaSetup = anesthesiaDetail.anaesthesia_setup || []

    const toCamel = s =>
      String(s || '')
        .trim()
        .replace(/_([a-zA-Z0-9])/g, (_, g1) => g1.toUpperCase())

    const anesthesiaSetupFlat = {}

    apiAnaesthesiaSetup.forEach(section => {
      const key = section.string_id
      const sectionObj = {
        checked: false,
        fields: {},
        monitoring: { selected: [], otherItems: [] }
      }

      if (Array.isArray(section.fields)) {
        section.fields.forEach(f => {
          const uiKey = toCamel(f.field_key)
          const rawVal = f.field_value === null || f.field_value === undefined ? '' : String(f.field_value)
          const unit = f.unit ?? (Array.isArray(f.units) && f.units.length ? f.units[0] : null)

          sectionObj[uiKey] = rawVal
          sectionObj.fields[f.field_key] = { field_value: rawVal, unit }

          if (rawVal !== '') sectionObj.checked = true
        })
      }

      if (Array.isArray(section.monitoring_items) && section.monitoring_items.length > 0) {
        const selected = []
        const otherItems = []

        section.monitoring_items.forEach(mi => {
          const selectedFlag = mi.is_selected === '1' || mi.is_selected === 1 || mi.is_selected === true
          if (selectedFlag && mi.id) selected.push(Number(mi.id))
          if ((!mi.id || mi.id === '') && mi.name) otherItems.push(mi.name)
        })

        if (selected.length > 0 || otherItems.length > 0) sectionObj.checked = true
        sectionObj.monitoring.selected = selected
        sectionObj.monitoring.otherItems = otherItems
      }

      anesthesiaSetupFlat[key] = sectionObj
    })

    try {
      setValue('anesthesiaSetup', anesthesiaSetupFlat, { shouldDirty: false, shouldTouch: false })
    } catch (err) {
      console.error('setValue failed for anesthesiaSetup', err)
    }
  }, [anesthesiaDetail, setValue])

  const recordedTimeToLabel = timeStr => {
    if (!timeStr) return ''
    const d = dayjs(timeStr, ['HH:mm:ss', 'HH:mm', 'H:mm'], true)
    if (!d.isValid()) return ''
    return d.format('hh:mm A')
  }

  useEffect(() => {
    if (!anesthesiaDetail) return

    const detailVital = anesthesiaDetail.vital_monitoring
    if (!detailVital) return

    const columns = serverVitalToFormColumns(detailVital)

    const normalizedColumns = columns.map(col => ({
      ...col,
      timeLabel: recordedTimeToLabel(col.timeLabel || col.recorded_time || '')
    }))

    try {
      setValue('vitalMonitoring', normalizedColumns, { shouldDirty: false, shouldTouch: false })
    } catch (err) {
      console.error('setValue failed for vitalMonitoring', err)
    }
  }, [anesthesiaDetail, setValue])

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

  const toCamel = s =>
    String(s)
      .trim()
      .replace(/_([a-zA-Z0-9])/g, (_, g1) => g1.toUpperCase())

  const uiKeyForField = (_sectionStringId, apiFieldKey) => {
    return toCamel(apiFieldKey)
  }

  const TIME_ONLY_RE = /^\s*\d{1,2}:\d{2}(:\d{2})?(\s*[AaPp]\.?[Mm]\.?)?\s*$/

  const fmt = v => {
    if (v == null || v === '') return ''
    if (dayjs.isDayjs(v)) return v.isValid() ? v.format('YYYY-MM-DD HH:mm:ss') : ''
    if (v instanceof Date) return dayjs(v).format('YYYY-MM-DD HH:mm:ss')

    const str = String(v).trim()

    if (TIME_ONLY_RE.test(str)) {
      const candidate = `${dayjs().format('YYYY-MM-DD')} ${str}`
      const p = dayjs(candidate, ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD hh:mm A', 'YYYY-MM-DD HH:mm'], true)
      return p.isValid() ? p.format('YYYY-MM-DD HH:mm:ss') : ''
    }

    const p = dayjs(str, ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DDTHH:mm:ss', 'YYYY-MM-DD', 'HH:mm:ss', 'hh:mm A'], true)
    return p.isValid()
      ? p.format('YYYY-MM-DD HH:mm:ss')
      : dayjs(str).isValid()
      ? dayjs(str).format('YYYY-MM-DD HH:mm:ss')
      : ''
  }

  const toTimeOnly = v => {
    if (!v) return ''
    let parsed = null
    if (dayjs.isDayjs(v)) parsed = v
    else if (v instanceof Date) parsed = dayjs(v)
    else parsed = dayjs(String(v))

    if (!parsed || !parsed.isValid()) {
      const candidate = dayjs(`${dayjs().format('YYYY-MM-DD')} ${String(v).trim()}`, 'YYYY-MM-DD hh:mm A', true)
      if (candidate.isValid()) parsed = candidate
    }

    return parsed && parsed.isValid() ? parsed.format('HH:mm:ss') : ''
  }

  const onValid = async data => {
    setIsSubmitting(true)

    try {
      const anesthesiaSetupValues = methods.getValues('anesthesiaSetup') || {}
      const isEdit = !!anaesthesia_id

      const purposePayload = {
        selected: data.basicDetails.selected || [],
        custom: data.basicDetails.custom || []
      }

      let medsPayload = []
      let gasPayload = []
      let recoveryPayload = null
      let reversalPayload = []
      let blocks = []
      let preAnaesthesiaPayload = null
      let anaesthesiaSetupPayload = []

      if (isEdit) {
        // MEDICATIONS
        medsPayload = (methods.getValues('medicationsGas.medications') || []).map(m => ({
          id: m.id || '',
          drug_id: Number(m.drug_name?.id ?? m.drug_id ?? 0),
          purpose_stage: m.purpose_stage || '',
          amount: m.amount || '',
          unit_id: m.unit ? Number(m.unit) : Number(m.unit_id || 0),
          route: m.delivery_route?.delivery || '',
          delivery_time: fmt(m.delivery_time),
          delivery_status: m.delivery_status || '',
          max_effect: fmt(m.max_effect_time),
          comments: m.notes || ''
        }))

        // GAS
        gasPayload = (methods.getValues('medicationsGas.gases') || []).map(g => ({
          id: g.id || '',
          drug_id: Number(g.gas_name?.id ?? g.drug_id ?? 0),
          oxygen_l_min: g.o2_flow || g.oxygen_l_min || '',
          concentration: g.concentration || '',
          route: g.delivery_route?.delivery || '',
          start_time: fmt(g.start_time),
          end_time: fmt(g.end_time),
          delivery_status: g.delivery_status || '',
          comments: g.notes || ''
        }))

        // RECOVERY & REVERSAL
        const recoveryForm = methods.getValues('recoveryAndReversal') || {}
        const reversalDrugsForm = methods.getValues('recoveryAndReversal.reversalDrugs') || []

        clearErrors(['recoveryAndReversal.recovery_first_effect', 'recoveryAndReversal.recovery_full_effect'])

        const firstVal = recoveryForm.recovery_first_effect
        const fullVal = recoveryForm.recovery_full_effect

        if (firstVal && fullVal) {
          const first = dayjs(firstVal)
          const full = dayjs(fullVal)

          if (first.isValid() && full.isValid() && full.isBefore(first)) {
            setError('recoveryAndReversal.recovery_first_effect', {
              type: 'manual',
              message: 'Recovery 1st Effect cannot be greater than Recovery Full Effect'
            })
            setError('recoveryAndReversal.recovery_full_effect', {
              type: 'manual',
              message: 'Recovery Full Effect cannot be less than Recovery 1st Effect'
            })

            Toaster({
              type: 'error',
              message:
                'Please correct Recovery timing – Recovery 1st Effect must be before or equal to Recovery Full Effect.'
            })
            scrollToSection('recoveryAndReversal')
            setIsSubmitting(false)

            return
          }
        }

        recoveryPayload = {
          recovery_type: recoveryForm.recovery_type || '',
          recovery_first_effect_time: toTimeOnly(recoveryForm.recovery_first_effect),
          recovery_full_effect_time: toTimeOnly(recoveryForm.recovery_full_effect),
          describe_problem: recoveryForm.describe_problem || '',
          notes: recoveryForm.notes || '',
          rating_induction: recoveryForm.induction || '',
          rating_tolerance: recoveryForm.tolerance || '',
          rating_recovery: recoveryForm.recovery || '',
          rating_overall: recoveryForm.overall || ''
        }

        reversalPayload = (reversalDrugsForm || []).map(r => ({
          id: r.id || '',
          drug_id: Number(r.drug_name?.id ?? r.drug_id ?? 0),
          amount: r.amount || '',
          unit_id: r.unit ? Number(r.unit) : Number(r.unit_id || 0),
          route: r.delivery_route?.delivery || '',
          delivery_time: toTimeOnly(r.delivery_time),
          delivery_status: r.delivery_status || '',
          max_effect: toTimeOnly(r.max_effect_time)
        }))

        // PRE-ANAESTHESIA
        const pre = data.preAnesthesia || {}

        const clinPathSelectedObj = pre.clin_path?.selected || {}
        const clinPathSelectedIds = Object.entries(clinPathSelectedObj)
          .filter(([, checked]) => !!checked)
          .map(([id]) => Number(id))

        preAnaesthesiaPayload = {
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

        // VITAL BLOCKS
        const columns = methods.getValues('vitalMonitoring') || []
        const vitalMetaForBlocks = vitalMonitorList || []

        // console.log('columns:', JSON.stringify(columns, null, 2))
        // console.log('vitalMetaForBlocks (from vitalMonitorList):', JSON.stringify(vitalMetaForBlocks, null, 2))

        blocks = formColumnsToVitalMonitoringBlocks(columns, vitalMetaForBlocks)
        blocks = (blocks || []).map(block => ({
          ...block,
          recorded_time: toBackendTime(block.recorded_time)
        }))
        // console.log('blocks:', JSON.stringify(blocks, null, 2))
        // ----------- VALIDATE & BUILD ANAESTHESIA SETUP (EDIT-ONLY) -----------
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

          // monitoring validation
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

          if (sectionHasError) invalidSections.push(meta.section_name)
        }

        if (hasAnySetupError) {
          Toaster({
            type: 'error',
            message: `Please fill all required fields for: ${invalidSections.join(', ')} or uncheck those sections.`
          })
          scrollToSection('anesthesiaSetUp')
          setIsSubmitting(false)
          return
        }

        // build anaesthesia_setup payload
        const currentSetupValues = methods.getValues('anesthesiaSetup') || {}
        anaesthesiaSetupPayload = []

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

            const field_value =
              fieldFromFlat !== undefined && fieldFromFlat !== null && String(fieldFromFlat).trim() !== ''
                ? fieldFromFlat
                : fieldFromObject ?? ''
            const unit =
              (sectionForm.fields && sectionForm.fields[f.field_key] && sectionForm.fields[f.field_key].unit) ??
              f.unit ??
              null

            return {
              field_id: f.field_id,
              field_key: f.field_key,
              field_value,
              unit: Array.isArray(f.units) && f.units.length > 0 ? f.units[0] : unit
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
            string_id: meta.string_id,
            fields: fieldsArr
          }

          if (monitoringObj) sectionObj.monitoring = monitoringObj

          anaesthesiaSetupPayload.push(sectionObj)
        }
      }

      const formData = new FormData()

      if (isEdit) {
        formData.append('anaesthesia_id', anaesthesia_id)
      }

      formData.append('hospital_case_id', id || '')
      formData.append('medical_record_id', patientData?.medical_record_id || '')
      formData.append('location', data.basicDetails.location)
      formData.append('anaesthesia_datetime', data.basicDetails.anaesthesia_datetime)
      formData.append('estimated_time_required', data.basicDetails.estimated_time_required)
      formData.append('estimated_time_unit', data.basicDetails.estimated_time_unit)
      formData.append('veterinarian_id', JSON.stringify(data.basicDetails.veterinarian_id || []))
      formData.append('anesthetist_id', JSON.stringify(data.basicDetails.anesthetist_id || []))
      formData.append('notes', data.basicDetails.notes)
      formData.append('purpose', JSON.stringify(purposePayload))

      if (isEdit) {
        if (hasPreAnesthesiaData(data.preAnesthesia)) {
          formData.append('pre_anaesthesia', JSON.stringify(preAnaesthesiaPayload))
        }

        if (hasMedicationsGasData(medsPayload, gasPayload)) {
          formData.append('anaesthesia_medications', JSON.stringify({ medications: medsPayload, gas: gasPayload }))
        }

        const hasRecRevData = hasRecoveryAndReversalData(recoveryPayload, reversalPayload)
        if (hasRecRevData) {
          formData.append(
            'recovery_and_reversal',
            JSON.stringify({ recovery: recoveryPayload, reversal: reversalPayload })
          )
        }

        if (hasVitalBlocksData(blocks)) {
          formData.append('vital_monitoring_blocks', JSON.stringify(blocks))
        }

        if (hasAnesthesiaSetupData(anaesthesiaSetupPayload)) {
          formData.append('anaesthesia_setup', JSON.stringify(anaesthesiaSetupPayload))
        }
      }
      // console.log(' Final payload for API:', {
      //   hospital_case_id: id || '',
      //   medical_record_id: patientData?.medical_record_id || '',
      //   location: data.basicDetails.location,
      //   anaesthesia_datetime: data.basicDetails.anaesthesia_datetime,
      //   estimated_time_required: data.basicDetails.estimated_time_required,
      //   estimated_time_unit: data.basicDetails.estimated_time_unit,
      //   veterinarian_id: data.basicDetails.veterinarian_id,
      //   anesthetist_id: data.basicDetails.anesthetist_id,
      //   notes: data.basicDetails.notes,
      //   purpose: purposePayload,
      //   ...(isEdit && {
      //     pre_anaesthesia: preAnaesthesiaPayload,
      //     anaesthesia_setup: anaesthesiaSetupPayload,
      //     medications: { medications: medsPayload, gas: gasPayload },
      //     recovery_and_reversal: { recovery: recoveryPayload, reversal: reversalPayload },
      //     vital_monitoring_blocks: blocks
      //   })
      // })

      const response = await addAnesthesia(formData)

      if (response?.status === true) {
        setIsApiSuccess(true)
        // setExpanded('medicationsGas')
        if (!hasMedicationsGasData(medsPayload, gasPayload)) {
          handleChange('medicationsGas')
        }
        Toaster({ type: 'success', message: response?.message })
        router.push(
          `/hospital/inpatient/${id}/AddAnesthesiaRecord/?tab=anesthesia&anaesthesia_id=${response?.data?.anaesthesia_id}`
        )
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

  const hasNonEmpty = v => {
    if (v == null) return false

    if (typeof v === 'string') return v.trim() !== ''
    if (typeof v === 'number') return !Number.isNaN(v)
    if (Array.isArray(v)) return v.length > 0

    if (typeof v === 'object') {
      return Object.values(v).some(hasNonEmpty)
    }

    return !!v
  }

  const hasPreAnesthesiaData = pre => {
    if (!pre) return false

    const fieldsToCheck = [
      'temperature',
      'humidity',
      'physical_health_status',
      'body_condition',
      'animal_activity',
      'fasting_time',
      'previous_endotracheal_tube_size',
      'code_status',
      'weight',
      'pre_anesthesia_notes'
    ]

    for (const key of fieldsToCheck) {
      if (hasNonEmpty(pre[key])) return true
    }

    const clinPath = pre.clin_path || {}
    const selected = clinPath.selected || {}
    const custom = clinPath.custom || []

    const hasSelected = Object.values(selected || {}).some(Boolean)
    if (hasSelected || (Array.isArray(custom) && custom.length > 0)) {
      return true
    }

    return false
  }

  const hasRecoveryAndReversalData = (recoveryForm, reversalPayload) => {
    if (!recoveryForm && !reversalPayload?.length) return false

    const hasRecovery =
      !!recoveryForm?.recovery_type ||
      !!recoveryForm?.recovery_first_effect ||
      !!recoveryForm?.recovery_full_effect ||
      !!recoveryForm?.describe_problem ||
      !!recoveryForm?.notes ||
      !!recoveryForm?.induction ||
      !!recoveryForm?.tolerance ||
      !!recoveryForm?.recovery ||
      !!recoveryForm?.overall

    const hasReversal = Array.isArray(reversalPayload) && reversalPayload.length > 0

    return hasRecovery || hasReversal
  }

  const hasMedicationsGasData = (medsPayload, gasPayload) => {
    return (
      (Array.isArray(medsPayload) && medsPayload.length > 0) || (Array.isArray(gasPayload) && gasPayload.length > 0)
    )
  }
  const hasVitalBlocksData = blocks => Array.isArray(blocks) && blocks.length > 0

  const hasAnesthesiaSetupData = setupPayload => Array.isArray(setupPayload) && setupPayload.length > 0

  const preAnesthesia = watch('preAnesthesia')
  const vitalMonitoring = watch('vitalMonitoring')
  const anesthesiaSetup = watch('anesthesiaSetup')
  const recoveryAndReversal = watch('recoveryAndReversal')

  const sectionHasData = sectionId => {
    switch (sectionId) {
      case 'basicDetails': {
        const basic = methods.getValues('basicDetails') || {}
        return (
          !!basic.location ||
          !!basic.anaesthesia_datetime ||
          !!basic.estimated_time_required ||
          (Array.isArray(basic.veterinarian_id) && basic.veterinarian_id.length > 0) ||
          (Array.isArray(basic.anesthetist_id) && basic.anesthetist_id.length > 0) ||
          (Array.isArray(basic.selected) && basic.selected.length > 0) ||
          !!basic.notes
        )
      }

      case 'medicationsGas': {
        return (Array.isArray(medications) && medications.length > 0) || (Array.isArray(gases) && gases.length > 0)
      }

      case 'anesthesiaSetUp': {
        const setup = anesthesiaSetup || {}
        return Object.values(setup).some(sec => sec && sec.checked)
      }

      case 'preAnesthesia': {
        const pre = preAnesthesia || {}
        return hasPreAnesthesiaData(pre)
      }

      case 'vitalMonitoring': {
        return Array.isArray(vitalMonitoring) && vitalMonitoring.length > 0
      }

      case 'recoveryAndReversal': {
        const rec = recoveryAndReversal || {}
        return (
          !!rec.recovery_type ||
          !!rec.recovery_first_effect ||
          !!rec.recovery_full_effect ||
          !!rec.induction ||
          !!rec.tolerance ||
          !!rec.recovery ||
          !!rec.overall ||
          (Array.isArray(reversalDrugs) && reversalDrugs.length > 0)
        )
      }

      default:
        return false
    }
  }

  const shouldEnableSections = isApiSuccess
  const lastUpdatedValue =
    anesthesiaDetail?.updated_at !== undefined ? formatDateTime(anesthesiaDetail.updated_at) : '-'

  return (
    <FormProvider {...methods}>
      <Box display='flex' flexDirection='column' gap={3} sx={{ p: 3 }}>
        <Breadcrumbs aria-label='breadcrumb'>
          <Typography color={theme.palette.text.secondary}>Hospital</Typography>
          <Typography color={theme.palette.text.secondary}>Patients</Typography>
          <Typography color={theme.palette.text.secondary}>Inpatient</Typography>
          <Typography color={theme.palette.text.secondary} sx={{ cursor: 'pointer' }} onClick={handleCancel}>
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
                  onClick={handleCancel}
                />
                <Typography
                  fontWeight={500}
                  sx={{ fontSize: '24px', color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  Anesthesia Record {anesthesiaDetail?.code ? '- ' + anesthesiaDetail?.code : ''}
                </Typography>
              </Box>
              {lastUpdatedValue && lastUpdatedValue !== '-' && (
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontSize: '12px',
                    fontWeight: 400,
                    ml: 6
                  }}
                >
                  Last Saved : {lastUpdatedValue}
                </Typography>
              )}
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
                const isDisabled = sec.id !== 'basicDetails' && !shouldEnableSections && !anaesthesia_id
                return (
                  <Tab
                    key={sec.id}
                    label={sec.label}
                    value={sec.id}
                    disabled={isDisabled}
                    sx={{
                      color:
                        sec.id !== 'basicDetails' && !shouldEnableSections
                          ? theme.palette.customColors.neutralSecondary
                          : theme.palette.customColors.secondaryBg,
                      fontSize: '14px',
                      fontWeight: '600!important',
                      opacity: !anaesthesia_id && sec.id !== 'basicDetails' ? 0.5 : 1,
                      pl: 12
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
            mb={3}
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
              const isDisabled = id !== 'basicDetails' && !shouldEnableSections && !anaesthesia_id
              const hasData = !isDisabled && sectionHasData(id)
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
                        <Typography
                          sx={{ fontWeight: 'bold', fontSize: 24, color: accordionIconColor, cursor: 'not-allowed' }}
                        >
                          −
                        </Typography>
                      ) : anaesthesia_id && hasData ? (
                        <Box sx={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                          <Box
                            component='img'
                            src='/icons/pencil_outlined.svg'
                            alt='Edit'
                            sx={{ width: 22, height: 22, cursor: 'pointer' }}
                          />
                          <Box sx={{ color: theme.palette.primary.main, mr: 0 }}>
                            <Icon icon={'ion:checkmark-circle'} style={{ color: 'primary.warning' }}></Icon>
                          </Box>
                        </Box>
                      ) : (
                        <Typography
                          sx={{
                            fontWeight: 'bold',
                            fontSize: 24,
                            color: isDisabled ? accordionIconColor : theme.palette.customColors.OnSurfaceVariant
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
                      purposeStageOptions={purposeStageOptions}
                      unitList={unitList}
                      vitalMonitorList={vitalMonitorList}
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
                      addLoader={addLoader}
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
                {isSubmitting ? 'SUBMITTING...' : anaesthesia_id ? 'SAVE' : 'ADD'}
              </span>
            </Box>
          }
          onAdd={handleSubmit(onValid, onInvalid)}
          onCancel={handleCancelNew}
          width={200}
          height={50}
          isSubmitLoading={isSubmitting}
          isAddDisabled={!isBasicDetailsValid}
        />
      </Box>
    </FormProvider>
  )
}
