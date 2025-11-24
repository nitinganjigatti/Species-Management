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
import { useTheme } from '@mui/material/styles'
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
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat)

// Convert time label like '01:00 PM' -> 'HH:mm:ss'
const normalizeRecordedTime = timeLabel => {
  if (!timeLabel) return ''
  let d = dayjs(timeLabel, 'hh:mm A', true)
  if (d.isValid()) return d.format('HH:mm:ss')
  d = dayjs(timeLabel, 'HH:mm:ss', true)
  if (d.isValid()) return d.format('HH:mm:ss')
  d = dayjs(timeLabel, 'HH:mm', true)
  if (d.isValid()) return d.format('HH:mm:ss')
  d = dayjs(timeLabel)
  return d.isValid() ? d.format('HH:mm:ss') : timeLabel
}

// Convert "vital_monitoring" server object -> form columns for UI
// serverVital: { time_slots: [...], records: [...] } as in your example
// vitalMeta: vitalMonitorList (metadata) from getvitalMonitoringList
export function serverVitalToFormColumns(serverVital = {}, vitalMeta = []) {
  const timeSlots = Array.isArray(serverVital.time_slots) ? serverVital.time_slots : []
  const records = Array.isArray(serverVital.records) ? serverVital.records : []

  // Build a map: string_id -> sectionMeta (from server records OR from vitalMeta)
  const metaMap = {}
  ;(vitalMeta || []).forEach(m => {
    metaMap[m.string_id] = m
  })
  ;(records || []).forEach(r => {
    metaMap[r.string_id] = r
  })

  // columns: one per timeSlot
  const columns = (timeSlots || []).map(slot => {
    const col = {
      id: slot.id ? String(slot.id) : `t_${Math.random().toString(36).slice(2, 9)}`,
      timeLabel: slot.recorded_time || '', // keep raw, UI AddTime converts/normalizes when needed
      entries: {}
    }

    // For each record (section), find field values for this timeSlot
    for (const section of records || []) {
      const sectionId = section.section_id
      const string_id = section.string_id
      // For convenience, synthesize an entry object for that section:
      // For fields with single field in section -> { value, unit }
      // For bp/multi -> { <field_key>: value, unit }
      const fields = section.fields || []

      if (!fields.length) continue

      // If the section has fields where each field has values array (server "values" format)
      // we expect section.fields[].values = [{ monitoring_time_id, field_value, unit }]
      // But your posted server example in the 2nd format already showed fields[].values - handle both:
      let builtEntry = {}

      // Case A: fields[].values present -> map by monitoring_time_id
      const hasValuesArray = fields.some(f => Array.isArray(f.values) && f.values.length > 0)
      if (hasValuesArray) {
        fields.forEach(f => {
          const values = f.values || []
          const vObj = values.find(
            v => String(v.monitoring_time_id) === String(slot.id) || v.monitoring_time_id === slot.recorded_time
          )
          if (vObj) {
            // fill either single-value entry or multi-field
            if (fields.length === 1) {
              builtEntry.value = String(vObj.field_value ?? '')
              builtEntry.unit = vObj.unit ?? ''
            } else {
              builtEntry[f.field_key] = String(vObj.field_value ?? '')
              builtEntry.unit = vObj.unit ?? builtEntry.unit ?? ''
            }
          } else {
            // nothing for this slot - keep empty
            if (fields.length === 1) {
              builtEntry.value = builtEntry.value ?? ''
              builtEntry.unit = builtEntry.unit ?? ''
            } else {
              builtEntry[f.field_key] = builtEntry[f.field_key] ?? ''
            }
          }
        })
      } else {
        // Case B: server provided 'records' in block-per-time format? (older format)
        // Try to use section.fields[].field_value when present (maybe it's single snapshot)
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
            // leave empty
            if (fields.length === 1) {
              builtEntry.value = builtEntry.value ?? ''
              builtEntry.unit = builtEntry.unit ?? ''
            } else {
              builtEntry[f.field_key] = builtEntry[f.field_key] ?? ''
            }
          }
        })
      }

      // Put entry under the section string_id
      col.entries[string_id] = builtEntry
    }

    return col
  })

  return columns
}

export function formColumnsToVitalMonitoringBlocks(columns, vitalList) {
  const blocks = []

  for (const col of columns) {
    const block = {
      recorded_time: col.timeLabel, // "13:00"
      sections: []
    }

    for (const section of vitalList) {
      const entry = col.entries?.[section.string_id]
      if (!entry) continue

      const fieldsArr = []

      for (const f of section.fields) {
        let field_value = ''
        let unit = ''

        if (section.fields.length === 1 && f.input_type === 'number') {
          // Temperature-style (value + unit)
          field_value = entry.value ?? ''
          unit = entry.unit ?? ''
        } else if (f.input_type === 'radio' || f.input_type === 'select') {
          // Radio-style (selection)
          field_value = entry.selection ?? ''
          unit = ''
        } else {
          // Multi-field BP-style
          field_value = entry[f.field_key] ?? ''
          unit = entry.unit ?? ''
        }

        if (field_value === '') continue

        fieldsArr.push({
          field_id: f.field_id,
          field_key: f.field_key,
          field_value,
          unit
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

// // Convert form columns -> server "vital_monitoring" grouped structure you requested in useEffect save
// // { time_slots: [...], records: [...] }
// export function formColumnsToServerStructure(columns = [], vitalMeta = []) {
//   // time_slots: use column.id and recorded_time
//   const time_slots = (columns || []).map(c => ({ id: c.id, recorded_time: normalizeRecordedTime(c.timeLabel) }))

//   // Build for each meta section a fields array where each field has values array per time slot
//   // Start by cloning vitalMeta records as base (so section_name, etc.)
//   const records = (vitalMeta || []).map(meta => {
//     const fields = (meta.fields || []).map(fMeta => {
//       const values = (columns || []).map(col => {
//         const entry = col.entries?.[meta.string_id] ?? {}
//         // find value for this field in the entry
//         const value = entry[fMeta.field_key] ?? entry.value ?? entry.selection ?? ''
//         const unit = entry.unit ?? (Array.isArray(fMeta.units) && fMeta.units.length ? fMeta.units[0] : null)
//         return {
//           monitoring_time_id: col.id,
//           field_value: value === undefined || value === null ? '' : String(value),
//           unit: unit
//         }
//       })
//       return {
//         field_id: fMeta.field_id,
//         field_key: fMeta.field_key,
//         field_label: fMeta.field_label,
//         input_type: fMeta.input_type,
//         options: fMeta.options || [],
//         units: fMeta.units || [],
//         values
//       }
//     })

//     return {
//       section_id: meta.section_id,
//       section_name: meta.section_name,
//       string_id: meta.string_id,
//       type: meta.type,
//       fields
//     }
//   })

//   return { time_slots, records }
// }

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
  const [unitList, setunitList] = useState([])
  const [vitalMonitorList, setVitalMonitorList] = useState([])
  const [anesthesiaDetail, setAnesthesiaDetail] = useState(null)
  const [addLoader, setAddLoader] = useState(false)
  const sectionRefs = React.useRef({})
  const scrollContainerRef = React.useRef(null)
  const theme = useTheme()
  let anaesthesia_id = 78

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

  const fetchUnitList = async () => {
    try {
      const response = await getUnitList()
      console.log(response, 'response')
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
      console.log(response, 'response')
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
    { label: 'Class II | Minor Health', value: 'Class II | Minor Health' },
    { label: 'Class III | Major Health', value: 'Class III | Major Health' }
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
      anesthesiaSetup: {
        // fluids: { checked: false, fluidType: '', quantity: '' },
        // catheter_setup: { checked: false, method: '' },
        // syringe_pump: { checked: false, rate: '' },
        // et_intubation: { checked: false, tubeSizes: '' },
        // nasal_intubation: { checked: false, fluidType: '', quantity: '' },
        // ventilation: { checked: false, mode: '' },
        // monitoring: { checked: false, selected: [], otherItems: [] }
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

  const fetchAnesthesiaDetails = async anaesthesia_id => {
    if (!anaesthesia_id) return

    try {
      setAddLoader(true)
      const response = await getAnesthesiaDetails(anaesthesia_id) // adjust if API expects { anaesthesia_id: anesthesiaId }
      console.log(response, 'getAnesthesiaDetails response')

      if (response?.success && response?.data) {
        setAnesthesiaDetail(response.data)
        setAddLoader(false)
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to fetch anesthesia details' })
        setAddLoader(false)
      }
    } catch (error) {
      console.error('Error fetching anesthesia details', error)
      Toaster({ type: 'error', message: 'Error fetching anesthesia details' })
    }
  }

  useEffect(() => {
    if (!anaesthesia_id) return // when adding a new record, there is no detail to fetch
    fetchAnesthesiaDetails(anaesthesia_id)
  }, [anaesthesia_id])

  useEffect(() => {
    if (!anesthesiaDetail) return

    const detail = anesthesiaDetail
    console.log(detail, 'detail')

    // ---------- PURPOSE (selected + custom) ----------
    const purposeArray = detail.purpose || []

    const selectedPurposeIds = []
    const customPurposeNames = []

    purposeArray.forEach(p => {
      const isSelected = p.is_selected === '1' || p.is_selected === 1 || p.is_selected === true

      if (!isSelected) return

      // normal purpose → goes to selected[]
      if (p.is_other === '0' || p.is_other === 0 || p.is_other === false) {
        if (p.id != null) {
          selectedPurposeIds.push(String(p.id))
        }
      }

      // "other" / custom purpose → goes to custom[] as name
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
    // pre.clin_path now comes as an array of objects:
    // [{ id, name, is_other, is_selected, ... }, ...]
    const clinPathArray = Array.isArray(pre.clin_path) ? pre.clin_path : []

    const clinSelectedObj = {} // { [id]: true }
    const clinCustomArr = [] // ['My custom test', 'Other thing']

    clinPathArray.forEach(item => {
      const isSelected = item.is_selected === '1' || item.is_selected === 1 || item.is_selected === true
      if (!isSelected) return

      const isOther = item.is_other === '1' || item.is_other === 1 || item.is_other === true

      if (!isOther) {
        // normal option → goes into selected object as { [id]: true }
        if (item.id != null) {
          clinSelectedObj[String(item.id)] = true
        }
      } else {
        // custom/other → goes into custom[] as name
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
      anesthesiaSetup: {}, // will be filled in next effect
      vitalMonitoring: [], // will be filled in next effect
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
      console.log('✅ anesthesiaSetup prefilled from API:', anesthesiaSetupFlat)
    } catch (err) {
      console.error('setValue failed for anesthesiaSetup', err)
    }
  }, [anesthesiaDetail, setValue])

  useEffect(() => {
    if (!anesthesiaDetail) return

    const detailVital = anesthesiaDetail.vital_monitoring
    if (!detailVital) return

    const timeSlots = Array.isArray(detailVital.time_slots) ? detailVital.time_slots : []
    const records = Array.isArray(detailVital.records) ? detailVital.records : []

    const columns = (timeSlots || []).map(slot => ({
      id: String(slot.id ?? uuidv4()),
      timeLabel: recordedTimeToLabel(slot.recorded_time ?? ''),
      entries: {}
    }))

    const colById = {}
    columns.forEach(c => {
      colById[String(c.id)] = c
    })

    records.forEach(section => {
      const sid = section.string_id
      ;(section.fields || []).forEach(field => {
        const key = field.field_key
        const values = field.values || []
        values.forEach(v => {
          const timeId = String(v.monitoring_time_id ?? '')
          const col = colById[timeId] || columns.find(c => c.id === timeId)
          if (!col) return
          if (!col.entries[sid]) col.entries[sid] = { fieldsById: {} }

          col.entries[sid].fieldsById[String(field.field_id)] = {
            field_key: field.field_key,
            value: v.field_value == null ? '' : String(v.field_value),
            unit: v.unit ?? null
          }

          const existing = col.entries[sid][key]
          if (existing === undefined) {
            col.entries[sid][key] = v.field_value == null ? '' : String(v.field_value)
          } else {
            col.entries[sid][`${key}_${field.field_id}`] = v.field_value == null ? '' : String(v.field_value)
          }

          if (!col.entries[sid].unit && v.unit) col.entries[sid].unit = v.unit
        })
      })
    })

    try {
      setValue('vitalMonitoring', columns, { shouldDirty: false, shouldTouch: false })
      console.log('✅ Prefilled vitalMonitoring (form) from API:', columns)
    } catch (err) {
      console.error('setValue failed for vitalMonitoring', err)
    }

    // Optional: build server-style snapshot if you want to inspect
    try {
      const serverStyle = buildServerStyleVitalMonitoring(
        columns,
        records.map(r => ({
          section_id: r.section_id,
          section_name: r.section_name,
          string_id: r.string_id,
          type: r.type,
          fields: r.fields || []
        }))
      )
      console.log('✅ Server-style vital_monitoring built from API:', serverStyle)
    } catch (err) {
      console.error('Failed to build server-style vital monitoring', err)
    }
  }, [anesthesiaDetail, setValue])

  //   useEffect(() => {
  //     // Hardcoded data based on your curl
  //     // const apiClinSelected = detail.pre_anaesthesia?.clin_path?.selected || []

  //     // const clinSelectedObj = apiClinSelected.reduce((acc, id) => {
  //     //   acc[id] = true // or acc[String(id)] = true if you prefer
  //     //   return acc
  //     // }, {})

  //     const anaesthesia_medications = {
  //       medication: {
  //         total: 1,
  //         records: [
  //           {
  //             id: '34',
  //             anaesthesia_id: '4',
  //             type: 'medication',
  //             drug_id: '551',
  //             drug_name: 'testprescription',
  //             route: 'Application',
  //             delivery_status: 'Complete',
  //             created_at: '2025-11-19 07:02:41',
  //             purpose_stage: 'Premedication',
  //             amount: '2.000',
  //             unit_id: '5',
  //             unit_name: 'pound',
  //             uom_abbr: 'lb',
  //             delivery_time: '19:00:00',
  //             max_effect: '19:30:00',
  //             comments: 'Administered immediately'
  //           }
  //         ]
  //       },
  //       gas: {
  //         total: 1,
  //         records: [
  //           {
  //             id: '35',
  //             anaesthesia_id: '4',
  //             type: 'gas',
  //             drug_id: '423',
  //             drug_name: '001Para medicine',
  //             route: 'Inhalation',
  //             delivery_status: 'Complete',
  //             created_at: '2025-11-19 07:02:41',
  //             oxygen_l_min: '6.000',
  //             concentration: '3',
  //             start_time: '23:45:00',
  //             end_time: '12:00:00'
  //           }
  //         ]
  //       }
  //     }

  //     // ---------- helper to combine a date (created_at or baseline) with time string ----------
  //     const combineDateAndTime = (dateStr, timeStr) => {
  //       if (!timeStr) return null
  //       // prefer created_at's date part; fallback to a sensible baseline date (today) if missing
  //       const datePart =
  //         (dateStr && dayjs(dateStr).isValid() && dayjs(dateStr).format('YYYY-MM-DD')) ||
  //         /* fallback */ dayjs().format('YYYY-MM-DD')
  //       const candidate = `${datePart} ${timeStr}`
  //       const parsed = dayjs(candidate, 'YYYY-MM-DD HH:mm:ss', true)
  //       return parsed.isValid() ? parsed : null
  //     }

  //     // ---------- map medication records -> form/drawer shape (use dayjs for times) ----------
  //     const medicationsFromApi = (anaesthesia_medications.medication?.records || []).map(rec => {
  //       const createdAt = rec.created_at || null
  //       return {
  //         // drawer expects ControlledAutocomplete value like { id, name }
  //         drug_name: rec.drug_id ? { id: String(rec.drug_id), name: rec.drug_name || '' } : null,
  //         purpose_stage: rec.purpose_stage || '',
  //         amount: rec.amount ? String(rec.amount) : '',
  //         // your ControlledSelect expects unit id as string
  //         unit: rec.unit_id ? String(rec.unit_id) : '',
  //         unit_id: rec.unit_id ? String(rec.unit_id) : '',
  //         // delivery_route in your code expects object { id, delivery } — we don't have route id, so provide delivery text
  //         delivery_route: rec.route ? { id: '', delivery: rec.route } : null,
  //         // convert times to dayjs objects combined with created_at's date part
  //         delivery_time: combineDateAndTime(createdAt, rec.delivery_time),
  //         max_effect_time: combineDateAndTime(createdAt, rec.max_effect),
  //         delivery_status: rec.delivery_status || null, // this will allow chip selection
  //         notes: rec.comments || '',
  //         id: rec.id || ''
  //       }
  //     })

  //     // ---------- map gas records ----------
  //     const gasFromApi = (anaesthesia_medications.gas?.records || []).map(rec => {
  //       const createdAt = rec.created_at || null
  //       return {
  //         gas_name: rec.drug_id ? { id: String(rec.drug_id), name: rec.drug_name || '' } : null,
  //         o2_flow: rec.oxygen_l_min ? String(rec.oxygen_l_min) : '',
  //         concentration: rec.concentration ? String(rec.concentration) : '',
  //         delivery_route: rec.route ? { id: '', delivery: rec.route } : null,
  //         start_time: combineDateAndTime(createdAt, rec.start_time),
  //         end_time: combineDateAndTime(createdAt, rec.end_time),
  //         delivery_status: rec.delivery_status || null,
  //         notes: rec.comments || '',
  //         id: rec.id || ''
  //       }
  //     })
  //     const recovery_and_reversal = {
  //       recovery: {
  //         id: '2',
  //         anaesthesia_id: '4',
  //         recovery_type: 'Normal',
  //         recovery_first_effect_time: '00:15:00',
  //         recovery_full_effect_time: '00:45:00',
  //         describe_problem: 'Slight delay in reflex return',
  //         notes: 'Animal calm and responsive',
  //         rating_induction: 'Good',
  //         rating_tolerance: 'Excellent',
  //         rating_recovery: 'Poor',
  //         rating_overall: 'Good',
  //         created_at: '2025-11-19 07:02:42'
  //       },
  //       reversal: {
  //         total: 1,
  //         records: [
  //           {
  //             id: '36',
  //             anaesthesia_id: '4',
  //             type: 'reversal',
  //             drug_id: '445',
  //             drug_name: '00asdf',
  //             route: 'Intramuscular',
  //             delivery_status: 'Complete',
  //             created_at: '2025-11-19 07:02:42',
  //             amount: '0.200',
  //             unit_id: '5',
  //             unit_name: 'pound',
  //             uom_abbr: 'lb',
  //             delivery_time: '21:00:00',
  //             comments: null,
  //             max_effect: '19:30:00'
  //           }
  //         ]
  //       }
  //     }

  //     // map recovery -> form shape
  //     const recoveryFromApi = recovery_and_reversal?.recovery || null

  //     const reversalFromApi = (recovery_and_reversal?.reversal?.records || []).map(rec => {
  //       const createdAt = rec.created_at || null
  //       return {
  //         id: rec.id || '',
  //         drug_id: rec.drug_id ? Number(rec.drug_id) : undefined,
  //         drug_name: rec.drug_id ? { id: String(rec.drug_id), name: rec.drug_name || '' } : null,
  //         amount: rec.amount ? String(rec.amount) : '',
  //         unit: rec.unit_id ? String(rec.unit_id) : '',
  //         unit_id: rec.unit_id ? String(rec.unit_id) : '',
  //         delivery_route: rec.route ? { id: '', delivery: rec.route } : null,
  //         // dayjs objects (combine with created_at date if needed)
  //         delivery_time: combineDateAndTime(createdAt, rec.delivery_time),
  //         max_effect_time: combineDateAndTime(createdAt, rec.max_effect),
  //         delivery_status: rec.delivery_status || null,
  //         notes: rec.comments || ''
  //       }
  //     })
  //     reset({
  //       basicDetails: {
  //         location: 'Bangalore',
  //         anaesthesia_datetime: '2025-11-17 00:00:00',
  //         estimated_time_required: '10',
  //         estimated_time_unit: 'hr',
  //         veterinarian_id: ['68', '70'],
  //         anesthetist_id: ['58'],
  //         selected: ['24', '25'],
  //         custom: [],
  //         notes: 'notes 1'
  //       },
  //       medicationsGas: {
  //         medications: medicationsFromApi,
  //         gases: gasFromApi
  //       },
  //       //   anesthesiaSetup: {
  //       //     // from anaesthesia_setup array
  //       //     fluids: {
  //       //       checked: true,
  //       //       fluidType: '12', // fluid_type
  //       //       fluidQuantity: '10' // fluid_quantity
  //       //     },
  //       //     catheter_setup: {
  //       //       checked: true,
  //       //       method: 'IV' // catheter_type
  //       //     },
  //       //     syringe_pump: {
  //       //       checked: true,
  //       //       rate: '15' // syringe_rate
  //       //     },
  //       //     // others remain default / unchecked
  //       //     et_intubation: { checked: false, tubeSizes: '' },
  //       //     nasal_intubation: { checked: false, fluidType: '', quantity: '' },
  //       //     ventilation: { checked: false, mode: '' },
  //       //     monitoring: { checked: false, selected: [], otherItems: [] }
  //       //   },
  //       vitalMonitoring: [],
  //       preAnesthesia: {
  //         temperature: '100',
  //         humidity: '120',
  //         physical_health_status: 'Class I Normal Health',
  //         body_condition: 'Fair/Thin',
  //         animal_activity: 'Calm',
  //         fasting_time: '12',
  //         fasting_unit: 'hours',
  //         previous_endotracheal_tube_size: '0',
  //         code_status: 'R (Resuscitate)',
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
  //         // map recovery fields into form-friendly names (these keys must match the Controlled inputs in RecoveryAndReversal)
  //         recovery_type: recoveryFromApi?.recovery_type || '',
  //         recovery_first_effect: recoveryFromApi?.recovery_first_effect_time
  //           ? combineDateAndTime(recoveryFromApi.created_at, recoveryFromApi.recovery_first_effect_time)
  //           : null,
  //         recovery_full_effect: recoveryFromApi?.recovery_full_effect_time
  //           ? combineDateAndTime(recoveryFromApi.created_at, recoveryFromApi.recovery_full_effect_time)
  //           : null,
  //         describe_problem: recoveryFromApi?.describe_problem || '',
  //         notes: recoveryFromApi?.notes || '',
  //         induction: recoveryFromApi?.rating_induction || '',
  //         tolerance: recoveryFromApi?.rating_tolerance || '',
  //         recovery: recoveryFromApi?.rating_recovery || '',
  //         overall: recoveryFromApi?.rating_overall || '',

  //         reversalDrugs: reversalFromApi || []
  //       },
  //       attachments: {
  //         files: [],
  //         comments: ''
  //       }
  //     })
  //     // setValue('recoveryAndReversal.reversalDrugs', reversalFromApi || [], { shouldDirty: false, shouldTouch: false })
  //   }, [reset])

  //   useEffect(() => {
  //     // HARD-CODED server response (replace with your real detail.* if needed)
  //     const apiAnaesthesiaSetup = [
  //       {
  //         section_id: 8,
  //         section_name: 'Fluids',
  //         string_id: 'fluids',
  //         type: 'anaesthesia_setup',
  //         fields: [
  //           {
  //             field_id: 8,
  //             field_key: 'fluid_type',
  //             field_label: 'Fluid Type',
  //             input_type: 'text',
  //             options: [],
  //             units: [],
  //             field_value: 'Ringer Lactate',
  //             unit: null
  //           },
  //           {
  //             field_id: 9,
  //             field_key: 'fluid_quantity',
  //             field_label: 'Quantity',
  //             input_type: 'number',
  //             options: [],
  //             units: ['ml/hr'],
  //             field_value: '500',
  //             unit: 'ml/hr'
  //           }
  //         ]
  //       },
  //       {
  //         section_id: 13,
  //         section_name: 'Ventilation',
  //         string_id: 'ventilation',
  //         type: 'anaesthesia_setup',
  //         fields: [
  //           {
  //             field_id: 14,
  //             field_key: 'ventilation_mode',
  //             field_label: 'Mode',
  //             input_type: 'radio',
  //             options: ['No', 'Ventronics', 'Manual'],
  //             units: [],
  //             field_value: 'Manual',
  //             unit: null
  //           }
  //         ]
  //       },
  //       {
  //         section_id: 14,
  //         section_name: 'Monitoring',
  //         string_id: 'monitoring',
  //         type: 'anaesthesia_setup',
  //         fields: [],
  //         monitoring_items: [
  //           { id: '3', name: 'Pulse ox', type: 'monitoring', is_selected: '1' },
  //           { id: '21', name: 'new monitoring', type: 'monitoring', is_selected: '1' }
  //         ]
  //       }
  //     ]

  //     // helper: snake_case => camelCase (fluid_quantity -> fluidQuantity)
  //     const toCamel = s =>
  //       String(s || '')
  //         .trim()
  //         .replace(/_([a-zA-Z0-9])/g, (_, g1) => g1.toUpperCase())

  //     // Build flat UI object
  //     const anesthesiaSetupFlat = {}
  //     apiAnaesthesiaSetup.forEach(section => {
  //       const key = section.string_id
  //       const sectionObj = {
  //         checked: false,
  //         fields: {}, // nested fields for submission (field_key -> { field_value, unit })
  //         monitoring: { selected: [], otherItems: [] }
  //       }

  //       // map fields -> flat keys + nested fields
  //       if (Array.isArray(section.fields)) {
  //         section.fields.forEach(f => {
  //           const uiKey = toCamel(f.field_key) // e.g. fluid_quantity -> fluidQuantity
  //           const rawVal = f.field_value === null || f.field_value === undefined ? '' : String(f.field_value)
  //           const unit = f.unit ?? (Array.isArray(f.units) && f.units.length ? f.units[0] : null)

  //           // flat value used by your form inputs (watch('anesthesiaSetup.<key>.<uiKey>'))
  //           sectionObj[uiKey] = rawVal

  //           // nested fields to keep original meta for submit
  //           sectionObj.fields[f.field_key] = { field_value: rawVal, unit }

  //           if (rawVal !== '') sectionObj.checked = true
  //         })
  //       }

  //       // map monitoring items (if present)
  //       if (Array.isArray(section.monitoring_items) && section.monitoring_items.length > 0) {
  //         const selected = []
  //         const otherItems = []

  //         section.monitoring_items.forEach(mi => {
  //           const selectedFlag = mi.is_selected === '1' || mi.is_selected === 1 || mi.is_selected === true
  //           if (selectedFlag && mi.id) selected.push(Number(mi.id))
  //           // any entries without id (or custom) go to otherItems
  //           if ((!mi.id || mi.id === '') && mi.name) otherItems.push(mi.name)
  //         })

  //         if (selected.length > 0 || otherItems.length > 0) sectionObj.checked = true
  //         sectionObj.monitoring.selected = selected
  //         sectionObj.monitoring.otherItems = otherItems
  //       }

  //       anesthesiaSetupFlat[key] = sectionObj
  //     })

  //     // Write into the form state (setValue comes from useForm / methods)
  //     // ensure setValue is in scope where you paste this useEffect
  //     try {
  //       setValue('anesthesiaSetup', anesthesiaSetupFlat, { shouldDirty: false, shouldTouch: false })
  //       // optional: log to verify
  //       console.log('✅ anesthesiaSetup prefilled:', anesthesiaSetupFlat)
  //     } catch (err) {
  //       console.error('setValue failed for anesthesiaSetup', err)
  //     }
  //   }, [setValue])

  //   useEffect(() => {
  //     // Hardcoded server sample (you already used). Replace `detailVital` with your real server payload variable when ready.
  //     const detailVital = {
  //       time_slots: [
  //         { id: '4', recorded_time: '13:00:00' },
  //         { id: '5', recorded_time: '14:00:00' }
  //       ],
  //       records: [
  //         {
  //           section_id: 15,
  //           section_name: 'Temperature',
  //           string_id: 'temperature',
  //           type: 'vital_monitoring',
  //           fields: [
  //             {
  //               field_id: 15,
  //               field_key: 'temperature',
  //               field_label: 'Temperature',
  //               input_type: 'number',
  //               options: [],
  //               units: ['°C', '°F'],
  //               values: [
  //                 {
  //                   monitoring_time_id: '4',
  //                   field_value: '37.5',
  //                   unit: '°C'
  //                 },
  //                 {
  //                   monitoring_time_id: '5',
  //                   field_value: '38.0',
  //                   unit: '°C'
  //                 }
  //               ]
  //             }
  //           ]
  //         },
  //         {
  //           section_id: 19,
  //           section_name: 'Blood Pressure (BP)',
  //           string_id: 'bp',
  //           type: 'vital_monitoring',
  //           fields: [
  //             {
  //               field_id: 19,
  //               field_key: 'bp_systolic',
  //               field_label: 'Systolic',
  //               input_type: 'number',
  //               options: [],
  //               units: ['mmHg'],
  //               values: [
  //                 {
  //                   monitoring_time_id: '4',
  //                   field_value: '120',
  //                   unit: 'mmHg'
  //                 },
  //                 {
  //                   monitoring_time_id: '5',
  //                   field_value: '130',
  //                   unit: 'mmHg'
  //                 }
  //               ]
  //             },
  //             {
  //               field_id: 19,
  //               field_key: 'bp_systolic',
  //               field_label: 'Systolic',
  //               input_type: 'number',
  //               options: [],
  //               units: ['mmHg'],
  //               values: [
  //                 {
  //                   monitoring_time_id: '4',
  //                   field_value: '120',
  //                   unit: 'mmHg'
  //                 },
  //                 {
  //                   monitoring_time_id: '5',
  //                   field_value: '130',
  //                   unit: 'mmHg'
  //                 }
  //               ]
  //             },
  //             {
  //               field_id: 20,
  //               field_key: 'bp_mean',
  //               field_label: 'Mean',
  //               input_type: 'number',
  //               options: [],
  //               units: ['mmHg'],
  //               values: [
  //                 {
  //                   monitoring_time_id: '4',
  //                   field_value: '80',
  //                   unit: 'mmHg'
  //                 },
  //                 {
  //                   monitoring_time_id: '5',
  //                   field_value: '85',
  //                   unit: 'mmHg'
  //                 }
  //               ]
  //             },
  //             {
  //               field_id: 20,
  //               field_key: 'bp_mean',
  //               field_label: 'Mean',
  //               input_type: 'number',
  //               options: [],
  //               units: ['mmHg'],
  //               values: [
  //                 {
  //                   monitoring_time_id: '4',
  //                   field_value: '80',
  //                   unit: 'mmHg'
  //                 },
  //                 {
  //                   monitoring_time_id: '5',
  //                   field_value: '85',
  //                   unit: 'mmHg'
  //                 }
  //               ]
  //             }
  //           ]
  //         }
  //       ]
  //     }

  //     if (!detailVital) return

  //     const timeSlots = Array.isArray(detailVital.time_slots) ? detailVital.time_slots : []
  //     const records = Array.isArray(detailVital.records) ? detailVital.records : []

  //     // build columns
  //     const columns = (timeSlots || []).map(slot => ({
  //       id: String(slot.id ?? uuidv4()),
  //       timeLabel: recordedTimeToLabel(slot.recorded_time ?? ''),
  //       entries: {} // entries[string_id] = { fieldsById: { [field_id]: {value, unit} }, flat keys ... , unit }
  //     }))

  //     const colById = {}
  //     columns.forEach(c => {
  //       colById[String(c.id)] = c
  //     })

  //     // populate entries
  //     records.forEach(section => {
  //       const sid = section.string_id
  //       ;(section.fields || []).forEach(field => {
  //         const key = field.field_key
  //         const values = field.values || []
  //         values.forEach(v => {
  //           const timeId = String(v.monitoring_time_id ?? '')
  //           const col = colById[timeId] || columns.find(c => c.id === timeId)
  //           if (!col) return
  //           if (!col.entries[sid]) col.entries[sid] = { fieldsById: {} }

  //           // store canonical unique map by field_id
  //           col.entries[sid].fieldsById[String(field.field_id)] = {
  //             field_key: field.field_key,
  //             value: v.field_value == null ? '' : String(v.field_value),
  //             unit: v.unit ?? null
  //           }

  //           // also set friendly flat key for UI (single-number & multi-field & legacy)
  //           // if same key already exists, use a suffix with field_id to avoid overwrite
  //           const existing = col.entries[sid][key]
  //           if (existing === undefined) {
  //             col.entries[sid][key] = v.field_value == null ? '' : String(v.field_value)
  //           } else {
  //             // collision -> create unique key
  //             col.entries[sid][`${key}_${field.field_id}`] = v.field_value == null ? '' : String(v.field_value)
  //           }

  //           // attach entry-level unit if not set (keep last unit seen)
  //           if (!col.entries[sid].unit && v.unit) col.entries[sid].unit = v.unit
  //         })
  //       })
  //     })

  //     // write into form
  //     try {
  //       setValue('vitalMonitoring', columns, { shouldDirty: false, shouldTouch: false })
  //       console.log('✅ Prefilled vitalMonitoring (form):', columns)
  //     } catch (err) {
  //       console.error('setValue failed for vitalMonitoring', err)
  //     }

  //     // build server style structure (complete)
  //     try {
  //       const serverStyle = buildServerStyleVitalMonitoring(
  //         columns,
  //         records.map(r => ({
  //           section_id: r.section_id,
  //           section_name: r.section_name,
  //           string_id: r.string_id,
  //           type: r.type,
  //           fields: r.fields || []
  //         }))
  //       )
  //       // setVitalMonitoringServer(serverStyle)
  //       console.log('✅ Server-style vital_monitoring built:', serverStyle)
  //     } catch (err) {
  //       console.error('Failed to build server-style vital monitoring', err)
  //     }
  //   }, [setValue])

  // useEffect(() => {
  //   // Example: serverVital could come from detail.vital_monitoring or another API response
  //   // Hardcoded example:
  //   const serverVital = {
  //     time_slots: [
  //       { id: '4', recorded_time: '13:00:00' },
  //       { id: '5', recorded_time: '14:00:00' }
  //     ],
  //     records: [
  //       {
  //         section_id: 15,
  //         section_name: 'Temperature',
  //         string_id: 'temperature',
  //         type: 'vital_monitoring',
  //         fields: [
  //           {
  //             field_id: 15,
  //             field_key: 'temperature',
  //             field_label: 'Temperature',
  //             input_type: 'number',
  //             options: [],
  //             units: ['°C', '°F'],
  //             values: [
  //               {
  //                 monitoring_time_id: '4',
  //                 field_value: '37.5',
  //                 unit: '°C'
  //               },
  //               {
  //                 monitoring_time_id: '5',
  //                 field_value: '38.0',
  //                 unit: '°C'
  //               }
  //             ]
  //           },
  //           {
  //             field_id: 15,
  //             field_key: 'temperature',
  //             field_label: 'Temperature',
  //             input_type: 'number',
  //             options: [],
  //             units: ['°C', '°F'],
  //             values: [
  //               {
  //                 monitoring_time_id: '4',
  //                 field_value: '37.5',
  //                 unit: '°C'
  //               },
  //               {
  //                 monitoring_time_id: '5',
  //                 field_value: '38.0',
  //                 unit: '°C'
  //               }
  //             ]
  //           }
  //         ]
  //       },
  //       {
  //         section_id: 19,
  //         section_name: 'Blood Pressure (BP)',
  //         string_id: 'bp',
  //         type: 'vital_monitoring',
  //         fields: [
  //           {
  //             field_id: 19,
  //             field_key: 'bp_systolic',
  //             field_label: 'Systolic',
  //             input_type: 'number',
  //             options: [],
  //             units: ['mmHg'],
  //             values: [
  //               {
  //                 monitoring_time_id: '4',
  //                 field_value: '120',
  //                 unit: 'mmHg'
  //               },
  //               {
  //                 monitoring_time_id: '5',
  //                 field_value: '130',
  //                 unit: 'mmHg'
  //               }
  //             ]
  //           },
  //           {
  //             field_id: 19,
  //             field_key: 'bp_systolic',
  //             field_label: 'Systolic',
  //             input_type: 'number',
  //             options: [],
  //             units: ['mmHg'],
  //             values: [
  //               {
  //                 monitoring_time_id: '4',
  //                 field_value: '120',
  //                 unit: 'mmHg'
  //               },
  //               {
  //                 monitoring_time_id: '5',
  //                 field_value: '130',
  //                 unit: 'mmHg'
  //               }
  //             ]
  //           },
  //           {
  //             field_id: 20,
  //             field_key: 'bp_mean',
  //             field_label: 'Mean',
  //             input_type: 'number',
  //             options: [],
  //             units: ['mmHg'],
  //             values: [
  //               {
  //                 monitoring_time_id: '4',
  //                 field_value: '80',
  //                 unit: 'mmHg'
  //               },
  //               {
  //                 monitoring_time_id: '5',
  //                 field_value: '85',
  //                 unit: 'mmHg'
  //               }
  //             ]
  //           },
  //           {
  //             field_id: 20,
  //             field_key: 'bp_mean',
  //             field_label: 'Mean',
  //             input_type: 'number',
  //             options: [],
  //             units: ['mmHg'],
  //             values: [
  //               {
  //                 monitoring_time_id: '4',
  //                 field_value: '80',
  //                 unit: 'mmHg'
  //               },
  //               {
  //                 monitoring_time_id: '5',
  //                 field_value: '85',
  //                 unit: 'mmHg'
  //               }
  //             ]
  //           }
  //         ]
  //       }
  //     ]
  //   }

  //   // if you don't have serverVital yet, skip
  //   if (!serverVital || (!Array.isArray(serverVital.time_slots) && !Array.isArray(serverVital.records))) {
  //     // nothing to prefill
  //     return
  //   }

  //   // Convert server->form columns
  //   const columns = serverVitalToFormColumns(serverVital, vitalMonitorList || [])

  //   // set into form
  //   try {
  //     setValue('vitalMonitoring', columns, { shouldDirty: false, shouldTouch: false })
  //     console.log('✅ Prefilled vitalMonitoring:', columns)
  //   } catch (err) {
  //     console.error('setValue failed for vitalMonitoring', err)
  //   }
  // }, [setValue, vitalMonitorList])

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

  // Generic camelCase converter (keeps things predictable)
  const toCamel = s =>
    String(s)
      .trim()
      .replace(/_([a-zA-Z0-9])/g, (_, g1) => g1.toUpperCase())

  // Generic UI key for any API field key (no hardcoded sections)
  const uiKeyForField = (_sectionStringId, apiFieldKey) => {
    // If you ever want custom overrides, add them here as rules (not hardcoded names)
    // e.g. if (/_tube$/i.test(apiFieldKey)) return 'tubeSizes'
    return toCamel(apiFieldKey)
  }

  // compact parser + formatter
  const TIME_ONLY_RE = /^\s*\d{1,2}:\d{2}(:\d{2})?(\s*[AaPp]\.?[Mm]\.?)?\s*$/

  const fmt = v => {
    if (v == null || v === '') return '' // null/undefined/empty -> ''
    if (dayjs.isDayjs(v)) return v.isValid() ? v.format('YYYY-MM-DD HH:mm:ss') : ''
    if (v instanceof Date) return dayjs(v).format('YYYY-MM-DD HH:mm:ss')

    const str = String(v).trim()

    // if it's time-only, attach today's date
    if (TIME_ONLY_RE.test(str)) {
      const candidate = `${dayjs().format('YYYY-MM-DD')} ${str}`
      const p = dayjs(candidate, ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD hh:mm A', 'YYYY-MM-DD HH:mm'], true)
      return p.isValid() ? p.format('YYYY-MM-DD HH:mm:ss') : ''
    }

    // try common full formats (strict), then loose fallback
    const p = dayjs(str, ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DDTHH:mm:ss', 'YYYY-MM-DD', 'HH:mm:ss', 'hh:mm A'], true)
    return p.isValid()
      ? p.format('YYYY-MM-DD HH:mm:ss')
      : dayjs(str).isValid()
      ? dayjs(str).format('YYYY-MM-DD HH:mm:ss')
      : ''
  }

  // returns "HH:mm:ss" (or '' on invalid)
  const toTimeOnly = v => {
    if (!v) return ''
    // v may be dayjs, Date or string like '08:00 PM' or full datetime
    let parsed = null
    if (dayjs.isDayjs(v)) parsed = v
    else if (v instanceof Date) parsed = dayjs(v)
    else parsed = dayjs(String(v))

    if (!parsed || !parsed.isValid()) {
      // try time-only + today's date (handles '08:00 PM')
      const candidate = dayjs(`${dayjs().format('YYYY-MM-DD')} ${String(v).trim()}`, 'YYYY-MM-DD hh:mm A', true)
      if (candidate.isValid()) parsed = candidate
    }

    return parsed && parsed.isValid() ? parsed.format('HH:mm:ss') : ''
  }

  // ---------- Helpers ----------
  const timeLabelToHHMMSS = label => {
    if (!label) return ''
    const d = dayjs(label, ['hh:mm A', 'h:mm A', 'HH:mm', 'H:mm', 'HH:mm:ss'], true)
    if (d.isValid()) return d.format('HH:mm:ss')
    const d2 = dayjs(label)
    return d2.isValid() ? d2.format('HH:mm:ss') : ''
  }

  const recordedTimeToLabel = timeStr => {
    if (!timeStr) return ''
    const d = dayjs(timeStr, ['HH:mm:ss', 'HH:mm', 'H:mm'], true)
    if (!d.isValid()) return ''
    return d.format('hh:mm A')
  }

  /**
   * extract from entry stored in form (we build entries with dual shapes).
   * fieldMeta is server meta for field.
   * entry is column.entries[string_id] (the object we prefill and update from dialog)
   */
  const extractFieldValueAndUnit = (fieldMeta, entry) => {
    if (!fieldMeta || !entry) return { value: '', unit: null }

    // 1) prefer unique fieldsById map
    if (entry.fieldsById && entry.fieldsById[String(fieldMeta.field_id)]) {
      const rec = entry.fieldsById[String(fieldMeta.field_id)]
      return { value: rec?.value == null ? '' : String(rec.value), unit: rec?.unit ?? null }
    }

    // 2) fallback: single-number shape { value, unit }
    if (entry.value !== undefined) {
      return { value: entry.value == null ? '' : String(entry.value), unit: entry.unit ?? null }
    }

    // 3) radio shape
    if (entry.selection !== undefined) {
      return { value: entry.selection == null ? '' : String(entry.selection), unit: null }
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

  /**
   * Build server style "vital_monitoring" object from form columns + meta list
   */
  const buildServerStyleVitalMonitoring = (columns, metaList) => {
    const time_slots = (columns || []).map((c, idx) => ({
      id: String(c.id || idx + 1),
      recorded_time: timeLabelToHHMMSS(c.timeLabel || '')
    }))

    const records = (metaList || []).map(sectionMeta => {
      const fields = (sectionMeta.fields || []).map(fieldMeta => {
        const values = (columns || [])
          .map(col => {
            const entry = col.entries?.[sectionMeta.string_id]
            if (!entry) return null
            const { value, unit } = extractFieldValueAndUnit(fieldMeta, entry)
            if (value === '' || value == null) return null
            return {
              monitoring_time_id: String(col.id || ''),
              field_value: value,
              unit: unit ?? null
            }
          })
          .filter(Boolean)

        return {
          field_id: fieldMeta.field_id,
          field_key: fieldMeta.field_key,
          field_label: fieldMeta.field_label,
          input_type: fieldMeta.input_type,
          options: fieldMeta.options ?? [],
          units: fieldMeta.units ?? [],
          values
        }
      })

      return {
        section_id: sectionMeta.section_id,
        section_name: sectionMeta.section_name,
        string_id: sectionMeta.string_id,
        type: sectionMeta.type,
        fields
      }
    })

    return { time_slots, records }
  }

  const onValid = async data => {
    setIsSubmitting(true)
    console.log(data, 'data')
    try {
      const anesthesiaSetupValues = methods.getValues('anesthesiaSetup') || {}

      //const fmt = v => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '')
      const medsPayload = (methods.getValues('medicationsGas.medications') || []).map(m => ({
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

      const gasPayload = (methods.getValues('medicationsGas.gases') || []).map(g => ({
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

      // get recovery form group
      const recoveryForm = methods.getValues('recoveryAndReversal') || {}
      // reversal drugs array from form
      const reversalDrugsForm = methods.getValues('recoveryAndReversal.reversalDrugs') || []

      // build recovery object (times must be HH:mm:ss)
      console.log(recoveryForm, 'recoveryForm')
      const recoveryPayload = {
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

      // build reversal array
      const reversalPayload = (reversalDrugsForm || []).map(r => ({
        id: r.id || '',
        drug_id: Number(r.drug_name?.id ?? r.drug_id ?? 0),
        amount: r.amount || '',
        unit_id: r.unit ? Number(r.unit) : Number(r.unit_id || 0),
        route: r.delivery_route?.delivery || '',
        delivery_time: toTimeOnly(r.delivery_time),
        delivery_status: r.delivery_status || '',
        max_effect: toTimeOnly(r.max_effect_time)
      }))
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
      const columns = methods.getValues('vitalMonitoring')
      const blocks = formColumnsToVitalMonitoringBlocks(columns, vitalMonitorList)

      const formData = new FormData()

      formData.append('hospital_case_id', hospital_case_id || '')
      formData.append('medical_record_id', medical_record_id || '')
      formData.append('location', data.basicDetails.location)
      formData.append('anaesthesia_datetime', data.basicDetails.anaesthesia_datetime)
      formData.append('estimated_time_required', data.basicDetails.estimated_time_required)
      formData.append('estimated_time_unit', data.basicDetails.estimated_time_unit)
      formData.append('veterinarian_id', JSON.stringify(data.basicDetails.veterinarian_id || []))
      formData.append('anesthetist_id', JSON.stringify(data.basicDetails.anesthetist_id || []))
      formData.append('notes', data.basicDetails.notes)
      //formData.append('anaesthesia_id')
      const purposePayload = {
        selected: data.basicDetails.selected || [],
        custom: data.basicDetails.custom || []
      }
      formData.append('purpose', JSON.stringify(purposePayload))
      formData.append('pre_anaesthesia', JSON.stringify(preAnaesthesiaPayload))
      formData.append('anaesthesia_medications', JSON.stringify({ medications: medsPayload, gas: gasPayload }))
      formData.append('recovery_and_reversal', JSON.stringify({ recovery: recoveryPayload, reversal: reversalPayload }))
      formData.append('vital_monitoring_blocks', JSON.stringify(blocks))
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
            unit: f.units.length > 0 ? f.units[0] : unit
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

      formData.append('anaesthesia_setup', JSON.stringify(anaesthesiaSetupPayload))

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
        pre_anaesthesia: preAnaesthesiaPayload,
        anaesthesia_setup: anaesthesiaSetupPayload,
        medications: { medications: medsPayload, gas: gasPayload },
        recovery_and_reversal: { recovery: recoveryPayload, reversal: reversalPayload },
        vital_monitoring_blocks: blocks
      })

      const response = await addAnesthesia(formData)

      if (response?.status === true) {
        setIsApiSuccess(true)
        setExpanded('medicationsGas')
        Toaster({ type: 'success', message: response?.message })
        router.back()
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
                    //disabled={isDisabled}
                    sx={{
                      color:
                        sec.id !== 'basicDetails' && !shouldEnableSections
                          ? theme.palette.customColors.OnSurfaceVariant
                          : theme.palette.customColors.secondaryBg,
                      fontSize: '14px',
                      fontWeight: '600!important',
                      opacity: sec.id !== 'basicDetails' && !shouldEnableSections ? 0.5 : 1,
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
                    borderRadius: '8px'
                    // boxShadow: 0,
                    // '&:before': { display: 'none' },
                    // ...(isDisabled && {
                    //   opacity: 0.6,
                    //   pointerEvents: 'none',
                    //   backgroundColor: theme.palette.common.white
                    // })
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
                      // drugOptions={drugOptions}
                      purposeStageOptions={purposeStageOptions}
                      // gasOptions={gasOptions}
                      //unitOptions={unitOptions}
                      //deliveryRouteOptions={deliveryRouteOptions}
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
