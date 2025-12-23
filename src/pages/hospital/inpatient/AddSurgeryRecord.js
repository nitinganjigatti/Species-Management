import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'

import { Breadcrumbs, Typography, Card, Box, Button, IconButton, Grid } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { Icon } from '@iconify/react'

import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { useQuery } from '@tanstack/react-query'

dayjs.extend(customParseFormat)

import { useAuth } from 'src/hooks/useAuth'
import Toaster from 'src/components/Toaster'
import TemplateSection from 'src/components/hospital/discharge/TemplateSection'
import AddAnesthesiaRecordDrawer from 'src/components/hospital/inpatient/AddAnesthesiaRecord'
import SelectAnesthesiaRecordDrawer from 'src/components/hospital/inpatient/SelectAnesthesiaRecordDrawer'
import AnimalInfoCard from 'src/views/pages/hospital/inpatient/AnimalInfoCard'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import AddEditSurgeryDrawer from 'src/views/pages/hospital/masters/surgery'

import { getPatientDetails } from 'src/lib/api/hospital/incomingPatient'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'

import {
  addSurgeryMaster,
  addSurgeryRecord,
  getPatientSurgeryList,
  getSurgeryMaster
} from 'src/lib/api/hospital/surgeryMaster'
import enforceModuleAccess from 'src/components/ProtectedRoute'

const FORM_ID = 'add-surgery-record-form'

const getSafeString = value => {
  if (value === undefined || value === null) return ''

  return String(value)
}

const getRichTextHtml = note => {
  if (!note) return ''
  if (typeof note === 'string') return note
  if (note?.html) return note.html
  if (note?.text) return note.text
  if (note?.delta?.ops) {
    try {
      const text = note.delta.ops
        .map(op => (typeof op.insert === 'string' ? op.insert : ''))
        .join('')
        .trim()

      return text
    } catch {
      return ''
    }
  }

  return ''
}

const mapSurgeryToOption = surgery => {
  if (!surgery || typeof surgery !== 'object') return null

  const id = surgery?.id ?? surgery?.surgery_id ?? surgery?.value
  const name = surgery?.surgery_name ?? surgery?.label
  const status = surgery?.status ?? surgery?.surgery_status

  if (status && String(status).toLowerCase() !== 'active') return null
  if (id === undefined || id === null || name === undefined || name === null) return null

  return {
    ...surgery,
    value: String(id),
    label: String(name).trim()
  }
}

const getSurgeryIdentifier = value => {
  if (!value) return ''
  if (typeof value === 'string' || typeof value === 'number') return value

  return value?.value ?? value?.id ?? value?.surgery_id ?? value?.surgeryId ?? ''
}

const getAnesthesiaIdentifier = value => {
  if (!value) return ''
  if (typeof value === 'string' || typeof value === 'number') return value

  return value?.anaesthesia_id ?? ''
}

const getAutocompleteLabel = value => {
  if (!value) return ''
  if (typeof value === 'string') return value

  return value?.label ?? ''
}

const getSurgeryRecordIdentifier = record => {
  if (!record || typeof record !== 'object') return ''
  if (record.id !== undefined && record.id !== null) return String(record.id)
  if (record.detail?.id !== undefined && record.detail?.id !== null) return String(record.detail.id)

  return ''
}

const formatDateValue = value => (value ? dayjs(value).format('YYYY-MM-DD') : '')

const formatTimeValue = value => (value ? dayjs(value).format('HH:mm:ss') : '')

const combineDateAndTime = (dateValue, timeValue) => {
  const date = dayjs(dateValue)

  if (!date.isValid() || !timeValue) return null

  const baseDateString = date.format('YYYY-MM-DD')
  const parseTime = value => {
    if (dayjs.isDayjs(value)) return value
    if (!value) return null

    if (typeof value === 'string' || typeof value === 'number') {
      const timeStr = String(value)
      const isoCandidate = dayjs(`${baseDateString}T${timeStr}`)
      if (isoCandidate.isValid()) return isoCandidate

      const timeFormats = ['HH:mm:ss', 'HH:mm', 'H:mm', 'h:mm A', 'hh:mm A', 'h:mm:ss A', 'hh:mm:ss A']
      for (const format of timeFormats) {
        const parsed = dayjs(`${baseDateString} ${timeStr}`, `YYYY-MM-DD ${format}`, true)
        if (parsed.isValid()) return parsed
      }

      const fallback = dayjs(timeStr)
      if (fallback.isValid()) return fallback

      return null
    }

    return null
  }

  const time = parseTime(timeValue)

  if (!time || !time.isValid()) return null

  return date.hour(time.hour()).minute(time.minute()).second(time.second()).millisecond(0)
}

const resolveHospitalCaseId = query => {
  const possibleKeys = ['hospital_case_id']

  for (const key of possibleKeys) {
    if (query?.[key] !== undefined) {
      const value = query[key]

      return Array.isArray(value) ? value[0] : value
    }
  }

  return undefined
}

const buildAnimalInfoData = patientData => {
  const animalDetail = patientData?.animal_detail || {}
  const additionalInfo = {}
  const hasLocalIdentifier = Boolean(animalDetail?.local_identifier_name && animalDetail?.local_identifier_value)

  if (hasLocalIdentifier) {
    additionalInfo[getSafeString(animalDetail.local_identifier_name)] = getSafeString(
      animalDetail.local_identifier_value
    )
  } else if (animalDetail?.animal_id) {
    additionalInfo.AID = getSafeString(animalDetail.animal_id)
  }

  const admittedDays = getSafeString(patientData?.admitted_for_day)
  if (admittedDays) {
    additionalInfo['Admitted Days'] = admittedDays
  }

  if (patientData?.bed_name) {
    additionalInfo.Location = getSafeString(patientData.bed_name)
  }

  if (patientData?.admitted_by_full_name) {
    additionalInfo['Chief Veterinarian'] = getSafeString(patientData.admitted_by_full_name)
  }

  return {
    animal: {
      common_name: getSafeString(animalDetail?.common_name || animalDetail?.default_common_name) || '--',
      scientific_name: getSafeString(animalDetail?.scientific_name || animalDetail?.complete_name) || '--',
      age: getSafeString(animalDetail?.age) || '--',
      sex: getSafeString(animalDetail?.sex) || '--',
      image_url: getSafeString(animalDetail?.default_icon)
    },
    additional_info: additionalInfo
  }
}

// ✅ Validation schema
const schema = yup.object().shape({
  date: yup
    .mixed()
    .test('date-required', 'Date is required', value => Boolean(value) && dayjs(value).isValid())
    .test('date-after-admission', 'Date cannot be before admission date', function (value) {
      const admissionDateTime = this?.options?.context?.admissionDateTime
      if (!value || !dayjs(value).isValid() || !admissionDateTime) return true

      return !dayjs(value).startOf('day').isBefore(dayjs(admissionDateTime).startOf('day'))
    })
    .test('date-not-in-future', 'Date cannot be in the future', value => {
      if (!value || !dayjs(value).isValid()) return true

      return !dayjs(value).startOf('day').isAfter(dayjs().startOf('day'))
    }),
  startTime: yup
    .mixed()
    .test('start-required', 'Start time is required', value => Boolean(value) && dayjs(value).isValid())
    .test('start-after-admission', 'Start time cannot be before admission time', function (value) {
      const admissionDateTime = this?.options?.context?.admissionDateTime
      const selectedDate = this?.parent?.date
      if (!value || !admissionDateTime || !selectedDate) return true

      const startDateTime = combineDateAndTime(selectedDate, value)

      return startDateTime && !startDateTime.isBefore(dayjs(admissionDateTime))
    })
    .test('start-not-in-future', 'Start time cannot be in the future', function (value) {
      const selectedDate = this?.parent?.date
      if (!value || !selectedDate) return true

      const startDateTime = combineDateAndTime(selectedDate, value)

      return startDateTime && !startDateTime.isAfter(dayjs())
    }),
  endTime: yup
    .mixed()
    .test('end-required', 'End time is required', value => Boolean(value) && dayjs(value).isValid())
    .test('end-after-start', 'End time must be after start time', function (value) {
      const { startTime, date } = this?.parent || {}
      if (!value || !startTime || !date) return true

      const startDateTime = combineDateAndTime(date, startTime)
      const endDateTime = combineDateAndTime(date, value)

      if (!startDateTime || !endDateTime) return true

      return endDateTime.isAfter(startDateTime)
    })
    .test('end-after-admission', 'End time cannot be before admission time', function (value) {
      const admissionDateTime = this?.options?.context?.admissionDateTime
      const selectedDate = this?.parent?.date
      if (!value || !admissionDateTime || !selectedDate) return true

      const endDateTime = combineDateAndTime(selectedDate, value)

      return endDateTime && !endDateTime.isBefore(dayjs(admissionDateTime))
    })
    .test('end-not-in-future', 'End time cannot be in the future', function (value) {
      const selectedDate = this?.parent?.date
      if (!value || !selectedDate) return true

      const endDateTime = combineDateAndTime(selectedDate, value)

      return endDateTime && !endDateTime.isAfter(dayjs())
    }),
  procedure: yup
    .mixed()
    .nullable()
    .test('procedure-required', 'Procedure is required', value => Boolean(value)),
  surgeon: yup
    .mixed()
    .nullable()
    .test('surgeon-required', 'Surgeon is required', value => Boolean(value)),
  typeOfSurgery: yup.string().trim().required('Type of surgery is required'),
  surgicalApproach: yup.string().trim().required('Surgical approach is required'),
  duration: yup.string().trim().required('Duration is required'),
  complication: yup.string().required('Complication is required')
})

const AddSurgeryRecord = () => {
  const router = useRouter()
  const theme = useTheme()
  const resolvedHospitalCaseId = useMemo(() => resolveHospitalCaseId(router.query), [router.query])
  const surgeryRecordId = useMemo(() => {
    const possible =
      router.query?.surgery_record_id ||
      router.query?.surgeryRecordId ||
      router.query?.surgery_recordId ||
      router.query?.surgeryId ||
      router.query?.id

    return Array.isArray(possible) ? possible[0] : possible || ''
  }, [router.query])
  const isEditMode = Boolean(surgeryRecordId)

  const medicalRecordId = useMemo(() => {
    const possible = router.query?.medical_record_id || router.query?.medicalRecordId || router.query?.medical_recordId

    return Array.isArray(possible) ? possible[0] : possible || ''
  }, [router.query])
  const [patientData, setPatientData] = useState(null)

  const admissionDateTime = useMemo(
    () => (patientData?.admitted_at ? dayjs(patientData.admitted_at) : null),
    [patientData?.admitted_at]
  )
  const auth = useAuth()
  const userZooId = useMemo(() => auth?.userData?.user?.zoos?.[0]?.zoo_id, [auth?.userData])

  const buildDefaultFormValues = useCallback(
    () => ({
      date: dayjs(),
      startTime: dayjs(),
      endTime: null,
      procedure: null,
      surgeon: null,
      typeOfSurgery: '',
      surgicalApproach: '',
      duration: '',
      notes: '',
      complication: 'None',
      dietInstructions: '',
      restrictions: '',
      additionalNotes: '',
      attachments: []
    }),
    []
  )
  const formResolver = useMemo(() => yupResolver(schema, { context: { admissionDateTime } }), [admissionDateTime])

  const {
    control,
    handleSubmit,
    reset,
    clearErrors,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: formResolver,
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: buildDefaultFormValues()
  })

  const [openAddanesthesiaDrawer, setOpenAddanesthesiaDrawer] = useState(false)
  const [openSelectAnesthesiaDrawer, setOpenSelectAnesthesiaDrawer] = useState(false)
  const [selectedAnesthesiaRecord, setSelectedAnesthesiaRecord] = useState(null)
  const [pendingAnesthesiaRecord, setPendingAnesthesiaRecord] = useState(null)
  const [richNote, setRichNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [prefillLoading, setPrefillLoading] = useState(false)
  const [prefillError, setPrefillError] = useState('')
  const [prefillDetail, setPrefillDetail] = useState(null)
  const [procedureSearchTerm, setProcedureSearchTerm] = useState('')
  const [openAddSurgeryDrawer, setOpenAddSurgeryDrawer] = useState(false)
  const [isSurgerySaving, setIsSurgerySaving] = useState(false)
  const [localProcedureOptions, setLocalProcedureOptions] = useState([])
  const [surgeonSearchTerm, setSurgeonSearchTerm] = useState('')
  const [formResetKey, setFormResetKey] = useState(0)
  const selectedDate = watch('date')
  const startTimeValue = watch('startTime')
  const endTimeValue = watch('endTime')
  const durationValue = watch('duration')
  const selectedAnesthesia = selectedAnesthesiaRecord

  const applyPrefillFromRecord = useCallback(
    detail => {
      if (!detail) return
      setPrefillDetail(detail)

      const dateValue = detail?.surgery_date ? dayjs(detail.surgery_date) : null
      const startTimeCombined = detail?.start_time
        ? combineDateAndTime(detail?.surgery_date || detail?.date, detail.start_time)
        : null
      const endTimeCombined = detail?.end_time
        ? combineDateAndTime(detail?.surgery_date || detail?.date, detail.end_time)
        : null

      const procedureOption =
        detail?.surgery_id || detail?.surgeryId
          ? {
              value: String(detail?.surgery_id ?? detail?.surgeryId),
              label:
                detail?.surgery_name ||
                detail?.surgeryName ||
                detail?.procedure_name ||
                detail?.surgery ||
                detail?.code ||
                'Surgery'
            }
          : null

      const anesthesiaDetail = detail?.anaesthesia_detail || detail?.anesthesia_detail
      const anesthesiaOption =
        detail?.anaesthesia_id || detail?.anesthesia_id
          ? {
              anaesthesia_id: String(detail?.anaesthesia_id ?? detail?.anesthesia_id),
              label: detail?.anaesthesia_name || detail?.anesthesia_name || anesthesiaDetail?.code || ''
            }
          : null

      setValue('date', dateValue || null, { shouldValidate: false, shouldDirty: false, shouldTouch: false })
      setValue('startTime', startTimeCombined || null, {
        shouldValidate: false,
        shouldDirty: false,
        shouldTouch: false
      })
      setValue('endTime', endTimeCombined || null, { shouldValidate: false, shouldDirty: false, shouldTouch: false })
      setValue('procedure', procedureOption, { shouldValidate: false, shouldDirty: false, shouldTouch: false })
      const surgeonOption =
        detail?.name_of_surgeon || detail?.surgeon_name
          ? {
              label: detail?.name_of_surgeon || detail?.surgeon_name,
              value: detail?.name_of_surgeon_id || detail?.surgeon_id || ''
            }
          : ''
      setValue('surgeon', surgeonOption, { shouldValidate: false, shouldDirty: false, shouldTouch: false })
      setValue('typeOfSurgery', detail?.type_of_surgery || '', {
        shouldValidate: false,
        shouldDirty: false,
        shouldTouch: false
      })
      setValue('surgicalApproach', detail?.surgical_approach || '', {
        shouldValidate: false,
        shouldDirty: false,
        shouldTouch: false
      })
      setValue('duration', detail?.duration ? String(detail.duration) : '', {
        shouldValidate: false,
        shouldDirty: false,
        shouldTouch: false
      })
      setValue('complication', detail?.complications || detail?.complication || '', {
        shouldValidate: false,
        shouldDirty: false,
        shouldTouch: false
      })
      setValue('dietInstructions', detail?.care_diet_instructions || '', {
        shouldValidate: false,
        shouldDirty: false,
        shouldTouch: false
      })
      setValue('restrictions', detail?.care_activity_restrictions || '', {
        shouldValidate: false,
        shouldDirty: false,
        shouldTouch: false
      })
      setValue('additionalNotes', detail?.additional_notes || '', {
        shouldValidate: false,
        shouldDirty: false,
        shouldTouch: false
      })
      const existingAttachments = Array.isArray(detail?.attachments)
        ? detail.attachments.map(item => ({
            id: item?.id,
            file_path: item?.file || item?.file_path || '',
            name: item?.file_original_name || item?.name || item?.file || ''
          }))
        : []

      setValue('attachments', existingAttachments, { shouldValidate: false, shouldDirty: false, shouldTouch: false })
      setSelectedAnesthesiaRecord(anesthesiaDetail || anesthesiaOption)
      setRichNote(detail?.surgery_notes || '')
      setFormResetKey(prev => prev + 1)
    },
    [setPrefillDetail, setValue, setSelectedAnesthesiaRecord, setRichNote, setFormResetKey]
  )

  const resetForm = useCallback(() => {
    if (isEditMode && prefillDetail) {
      applyPrefillFromRecord(prefillDetail)

      return
    }

    const defaults = buildDefaultFormValues()
    reset(defaults)
    setValue('surgeon', null, { shouldValidate: false, shouldDirty: false, shouldTouch: false })
    setValue('procedure', null, { shouldValidate: false, shouldDirty: false, shouldTouch: false })
    setSelectedAnesthesiaRecord(null)
    setPendingAnesthesiaRecord(null)
    setRichNote('')
    setProcedureSearchTerm('')
    setSurgeonSearchTerm('')
    setFormResetKey(prev => prev + 1)
  }, [
    isEditMode,
    prefillDetail,
    applyPrefillFromRecord,
    reset,
    buildDefaultFormValues,
    setValue,
    setSelectedAnesthesiaRecord,
    setPendingAnesthesiaRecord,
    setRichNote,
    setProcedureSearchTerm,
    setSurgeonSearchTerm
  ])

  const { data: surgeryMasterResponse, isFetching: isProceduresLoading } = useQuery({
    queryKey: ['hospital-surgeries', procedureSearchTerm],
    queryFn: () => {
      const params = {
        page_no: 1,
        limit: 20
      }

      const trimmed = procedureSearchTerm.trim()
      if (trimmed) {
        params.q = trimmed
      }

      return getSurgeryMaster({ params })
    },
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
    retry: false,
    onError: error => {
      console.error('Failed to fetch surgeries:', error)
      Toaster({ type: 'error', message: error?.message || 'Failed to load surgery list' })
    }
  })

  const procedureOptions = useMemo(() => {
    const rawSurgeries =
      (Array.isArray(surgeryMasterResponse?.surgeries) && surgeryMasterResponse.surgeries) ||
      (Array.isArray(surgeryMasterResponse?.data?.surgeries) && surgeryMasterResponse.data.surgeries) ||
      []
    const surgeries = Array.isArray(rawSurgeries) ? rawSurgeries : []

    const unique = new Map()

    ;[...localProcedureOptions, ...surgeries].forEach(item => {
      const option = mapSurgeryToOption(item)

      if (option && !unique.has(option.value)) {
        unique.set(option.value, option)
      }
    })

    return Array.from(unique.values())
  }, [surgeryMasterResponse, localProcedureOptions])

  const { data: surgeonsResponse, isFetching: isSurgeonsLoading } = useQuery({
    queryKey: ['surgeon-list', surgeonSearchTerm, userZooId],
    queryFn: async () => {
      const zooId = userZooId

      if (!zooId) {
        return []
      }

      const params = { zoo_id: zooId, permission: 'medical_records_access' }
      const trimmed = surgeonSearchTerm.trim()

      if (trimmed) {
        params.q = trimmed
      }

      const res = await getUserList(params)

      if (res?.success) {
        return Array.isArray(res?.data) ? res.data : []
      }

      throw new Error(res?.message || 'Failed to fetch surgeons')
    },
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: Boolean(userZooId),
    onError: error => {
      console.error('Failed to fetch surgeons:', error)
      Toaster({ type: 'error', message: error?.message || 'Failed to load surgeon list' })
    }
  })

  const surgeonOptions = useMemo(() => {
    if (!Array.isArray(surgeonsResponse)) return []

    return surgeonsResponse
      .map(user => ({
        label: getSafeString(user?.user_name),
        value: getSafeString(user?.user_id),
        default_icon: user?.user_profile_pic
      }))
      .filter(item => item.label && item.value)
  }, [surgeonsResponse])

  const doctorOptions = useMemo(
    () =>
      surgeonOptions.map(opt => ({
        name: opt.label,
        id: opt.value,
        default_icon: opt.default_icon
      })),
    [surgeonOptions]
  )

  useEffect(() => {
    if (!isEditMode || !resolvedHospitalCaseId || !surgeryRecordId) return

    let isMounted = true

    const fetchSurgeryRecord = async () => {
      setPrefillLoading(true)
      setPrefillError('')

      try {
        const response = await getPatientSurgeryList({ params: { hospital_case_id: resolvedHospitalCaseId } })
        const records = Array.isArray(response?.data?.surgery_records) ? response.data.surgery_records : []
        const match = records.find(record => getSurgeryRecordIdentifier(record) === String(surgeryRecordId))

        if (!isMounted) return

        if (match) {
          applyPrefillFromRecord(match?.detail || match)
        } else {
          setPrefillError('Surgery record not found.')
          Toaster({ type: 'error', message: 'Surgery record not found.' })
        }
      } catch (error) {
        if (!isMounted) return
        console.error('Failed to load surgery record', error)
        const message = error?.response?.data?.message || error?.message || 'Failed to load surgery record.'
        setPrefillError(message)
        Toaster({ type: 'error', message })
      } finally {
        if (isMounted) {
          setPrefillLoading(false)
        }
      }
    }

    fetchSurgeryRecord()

    return () => {
      isMounted = false
    }
  }, [applyPrefillFromRecord, isEditMode, resolvedHospitalCaseId, surgeryRecordId])

  useEffect(() => {
    if (!resolvedHospitalCaseId) {
      setPatientData(null)

      return
    }

    let isMounted = true

    const fetchPatientDetails = async () => {
      try {
        const response = await getPatientDetails(resolvedHospitalCaseId)

        if (!isMounted) return

        if (response?.success) {
          setPatientData(response.data)
        } else {
          setPatientData(null)
          Toaster({ type: 'error', message: response?.message || 'Failed to load patient details' })
        }
      } catch (error) {
        if (!isMounted) return

        console.error('Failed to fetch patient details:', error)
        Toaster({ type: 'error', message: error?.message || 'Failed to load patient details' })
        setPatientData(null)
      }
    }

    fetchPatientDetails()

    return () => {
      isMounted = false
    }
  }, [resolvedHospitalCaseId])

  const animalInfoData = useMemo(() => buildAnimalInfoData(patientData), [patientData])
  const minDate = useMemo(() => (admissionDateTime ? admissionDateTime.startOf('day') : null), [admissionDateTime])
  const maxDate = dayjs()

  const maxTimeForSelectedDate = useMemo(() => {
    if (!selectedDate) return null
    const now = dayjs()

    return dayjs(selectedDate).startOf('day').isSame(now.startOf('day')) ? now : null
  }, [selectedDate])

  // const buildReturnUrl = useCallback(() => {
  //   const getFirst = value => (Array.isArray(value) ? value[0] : value || '')

  //   if (router.query?.returnUrl) {
  //     const fromQuery = getFirst(router.query.returnUrl)
  //     if (fromQuery) return fromQuery
  //   }

  //   const basePath = resolvedHospitalCaseId ? `/hospital/inpatient/${resolvedHospitalCaseId}` : '/hospital/inpatient'
  //   const params = new URLSearchParams()

  //   const animalId = getFirst(router.query?.animal_id) || (patientData?.animal_id ? String(patientData.animal_id) : '')
  //   const medicalRecord = getFirst(router.query?.medical_record_id) || medicalRecordId
  //   const admittedDate =
  //     getFirst(router.query?.animal_admitted_date) ||
  //     (patientData?.admitted_at ? String(patientData.admitted_at) : '')
  //   const tab = getFirst(router.query?.tab) || 'surgery'

  //   if (animalId) params.set('animal_id', animalId)
  //   if (medicalRecord) params.set('medical_record_id', medicalRecord)
  //   if (admittedDate) params.set('animal_admitted_date', admittedDate)
  //   if (tab) params.set('tab', tab)

  //   const queryString = params.toString()

  //   return queryString ? `${basePath}?${queryString}` : basePath
  // }, [router.query, resolvedHospitalCaseId, medicalRecordId, patientData?.animal_id, patientData?.admitted_at])

  useEffect(() => {
    if (!selectedDate || !startTimeValue || !endTimeValue) {
      if (durationValue) {
        setValue('duration', '', { shouldValidate: true, shouldDirty: true })
      }

      return
    }

    const startDateTime = combineDateAndTime(selectedDate, startTimeValue)
    const endDateTime = combineDateAndTime(selectedDate, endTimeValue)

    if (!startDateTime || !endDateTime || !endDateTime.isAfter(startDateTime)) {
      if (durationValue) {
        setValue('duration', '', { shouldValidate: true, shouldDirty: true })
      }

      return
    }

    const diffMinutes = endDateTime.diff(startDateTime, 'minute')
    if (diffMinutes <= 0) {
      if (durationValue) {
        setValue('duration', '', { shouldValidate: true, shouldDirty: true })
      }

      return
    }

    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    const label = hours && minutes ? `${hours}h ${minutes}m` : hours ? `${hours}h` : `${minutes || 0}m`

    if (label !== durationValue) {
      setValue('duration', label, { shouldValidate: true, shouldDirty: true })
    }
  }, [selectedDate, startTimeValue, endTimeValue, durationValue, setValue])

  const handleClearSelectedAnesthesia = useCallback(() => {
    setSelectedAnesthesiaRecord(null)
  }, [])

  const formatAnesthesiaDateTime = useCallback(value => {
    const dt = value ? dayjs(value) : null
    if (!dt || !dt.isValid()) return '--'

    return dt.format('DD MMM YYYY • hh:mm A')
  }, [])

  const joinNames = useCallback(list => {
    if (!Array.isArray(list)) return '--'

    const names = list.map(item => item?.full_name).filter(Boolean)

    return names.length ? names.join(' , ') : '--'
  }, [])

  const purposeNames = useMemo(() => {
    if (!Array.isArray(selectedAnesthesia?.purpose)) return []

    return selectedAnesthesia.purpose.map(item => item?.name).filter(Boolean)
  }, [selectedAnesthesia?.purpose])

  const handleProcedureInputChange = useCallback(value => {
    if (typeof value === 'string') {
      setProcedureSearchTerm(value)
    } else {
      setProcedureSearchTerm('')
    }
  }, [])

  const handleProcedureClear = useCallback(() => {
    setProcedureSearchTerm('')
  }, [])

  const handleCreateSurgery = useCallback(
    async values => {
      const formData = new FormData()
      formData.append('surgery_name', values?.surgery_name || '')
      formData.append('description', values?.description || '')
      formData.append('status', values?.status ? 'Active' : 'Inactive')

      setIsSurgerySaving(true)
      try {
        const response = await addSurgeryMaster(formData)
        if (response?.success) {
          const newId = response?.data?.surgery_id || response?.surgery_id || response?.data?.id

          const option =
            newId &&
            mapSurgeryToOption({
              surgery_id: newId,
              surgery_name: values?.surgery_name || '',
              status: 'active'
            })

          if (option) {
            setLocalProcedureOptions(prev => {
              const map = new Map(prev.map(opt => [opt.value, opt]))
              map.set(option.value, option)

              return Array.from(map.values())
            })
            setValue('procedure', option, { shouldValidate: true, shouldDirty: true, shouldTouch: true })
            clearErrors?.('procedure')
          }
          setProcedureSearchTerm('')

          Toaster({ type: 'success', message: response?.message || 'Surgery has been created successfully.' })
          setOpenAddSurgeryDrawer(false)
        } else {
          Toaster({ type: 'error', message: response?.message || 'Failed to create surgery' })
        }
      } catch (error) {
        console.error('Failed to create surgery:', error)
        Toaster({ type: 'error', message: error?.message || 'Failed to create surgery' })
      } finally {
        setIsSurgerySaving(false)
      }
    },
    [clearErrors, setLocalProcedureOptions, setValue, setProcedureSearchTerm]
  )

  const procedureGetOptionLabel = useCallback(option => option?.label || '', [])

  const procedureIsOptionEqualToValue = useCallback((option, selected) => {
    if (!option || !selected) return false

    const optionId = getSurgeryIdentifier(option)
    const selectedId = getSurgeryIdentifier(selected)

    if (optionId !== '' && selectedId !== '') {
      return String(optionId) === String(selectedId)
    }

    return option?.label === selected?.label
  }, [])

  const handleSurgeonInputChange = useCallback(value => {
    if (typeof value === 'string') {
      setSurgeonSearchTerm(value)
    } else {
      setSurgeonSearchTerm('')
    }
  }, [])

  const handleSurgeonClear = useCallback(() => {
    setSurgeonSearchTerm('')
  }, [])

  const surgeonGetOptionLabel = useCallback(option => option?.label || '', [])

  const surgeonIsOptionEqualToValue = useCallback((option, selected) => {
    if (!option || !selected) return false

    const optionId = option?.value ?? option?.id
    const selectedId = selected?.value ?? selected?.id

    if (optionId !== undefined && selectedId !== undefined) {
      return String(optionId) === String(selectedId)
    }

    return option?.label === selected?.label
  }, [])

  const handleAddNewanesthesia = useCallback(() => {
    setOpenAddanesthesiaDrawer(true)
  }, [setOpenAddanesthesiaDrawer])

  const handleSelectanesthesiaRecord = useCallback(() => {
    setOpenSelectAnesthesiaDrawer(true)
  }, [])

  const handleAnesthesiaCreateSuccess = useCallback(
    record => {
      if (record) {
        setSelectedAnesthesiaRecord(record)
      }
    },
    [setSelectedAnesthesiaRecord]
  )

  const handleAnesthesiaRecordSelect = useCallback(record => {
    setPendingAnesthesiaRecord(record)
  }, [])

  const handleConfirmAnesthesiaRecord = useCallback(record => {
    if (record) {
      setSelectedAnesthesiaRecord(record)
    }
    setPendingAnesthesiaRecord(null)
    setOpenSelectAnesthesiaDrawer(false)
  }, [])

  const handleCancelForm = useCallback(() => {
    resetForm()
  }, [resetForm])

  const onSubmit = async formValues => {
    if (!resolvedHospitalCaseId) {
      Toaster({ type: 'error', message: 'Hospital case id is missing' })

      return
    }

    const selectedAnesthesiaId = getAnesthesiaIdentifier(selectedAnesthesia)
    if (!selectedAnesthesiaId) {
      Toaster({ type: 'error', message: 'Please select an anesthesia record' })

      return
    }

    const payload = new FormData()

    payload.append('hospital_case_id', getSafeString(resolvedHospitalCaseId))
    if (isEditMode && surgeryRecordId) {
      payload.append('id', getSafeString(surgeryRecordId))
    }
    payload.append('anaesthesia_id', getSafeString(selectedAnesthesiaId))
    payload.append('surgery_date', getSafeString(formatDateValue(formValues.date)))
    payload.append('start_time', getSafeString(formatTimeValue(formValues.startTime)))
    payload.append('end_time', getSafeString(formatTimeValue(formValues.endTime)))

    const surgeryId = getSurgeryIdentifier(formValues.procedure)

    payload.append('surgery_id', getSafeString(surgeryId))
    payload.append('type_of_surgery', getSafeString(formValues.typeOfSurgery))
    payload.append('surgical_approach', getSafeString(formValues.surgicalApproach))
    payload.append('name_of_surgeon_id', getSafeString(formValues.surgeon?.value || ''))
    payload.append('surgery_notes', getSafeString(getRichTextHtml(richNote)))
    payload.append('complications', getSafeString(formValues.complication))
    payload.append('care_diet_instructions', getSafeString(formValues.dietInstructions))
    payload.append('care_activity_restrictions', getSafeString(formValues.restrictions))
    payload.append('additional_notes', getSafeString(formValues.additionalNotes))
    payload.append('duration', getSafeString(formValues.duration))

    if (Array.isArray(formValues.attachments)) {
      formValues.attachments.forEach(file => {
        if (file instanceof File) {
          payload.append('attachments[]', file)
        } else if (file && (file.id || file.file_path || file.file)) {
          const existingRef = file.id || file.file_path || file.file
          payload.append('existing_attachments[]', getSafeString(existingRef))
        }
      })
    }

    setIsSubmitting(true)

    try {
      const response = await addSurgeryRecord(payload)

      if (response?.success) {
        Toaster({
          type: 'success',
          message:
            response?.message ||
            (isEditMode ? 'Surgery record updated successfully' : 'Surgery record added successfully')
        })
        resetForm()

        // const redirectUrl = buildReturnUrl()
        // router.push(redirectUrl)
        router.back()
      } else {
        Toaster({
          type: 'error',
          message:
            response?.message || (isEditMode ? 'Failed to update surgery record' : 'Failed to add surgery record')
        })
      }
    } catch (error) {
      console.error('Add surgery record error:', error)
      const message = error?.response?.data?.message || error?.message || 'An unexpected error occurred'
      Toaster({ type: 'error', message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Breadcrumbs aria-label='breadcrumb'>
        <Typography color={theme.palette.customColors.neutralSecondary}>Hospital</Typography>
        <Typography color={theme.palette.customColors.neutralSecondary}>Patients</Typography>
        <Typography color={theme.palette.customColors.neutralSecondary}>Inpatient</Typography>
        <Typography
          color={theme.palette.customColors.neutralSecondary}
          sx={{ cursor: 'pointer' }}
          onClick={() => router.back()}
        >
          Details
        </Typography>

        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            cursor: 'pointer'
          }}
        >
          {isEditMode ? 'Edit Surgery' : 'Add Surgery'}
        </Typography>
      </Breadcrumbs>

      <Card
        sx={{
          boxShadow: 'none',
          p: '24px',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '32px'
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            width: 'fit-content'
          }}
          onClick={() => router.back()}
        >
          <Icon icon='mdi:arrow-left' color={theme.palette.customColors.OnSurfaceVariant} fontSize={24} />
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '24px',
              letterSpacing: 0,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            {isEditMode ? 'Edit Surgery Record' : 'Add Surgery Record'}
          </Typography>
        </Box>

        <AnimalInfoCard
          image={patientData?.animal_detail?.default_icon}
          name={patientData?.animal_detail?.common_name}
          scientificName={patientData?.animal_detail?.complete_name}
          age={`${patientData?.animal_detail?.age}`}
          gender={`${patientData?.animal_detail?.sex}`}
          additionalFields={[
            { label: 'AID', value: patientData?.animal_detail?.animal_id },
            { label: 'Admitted days', value: patientData?.admitted_for_day },
            { label: 'Holding Location', value: `${patientData?.bed_name}, ${patientData?.room_name}` },
            { label: 'Chief Veterinarian', value: patientData?.attend_by_full_name }
          ]}
          isLoading={!patientData}
        />

        <Box
          sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
          component='form'
          id={FORM_ID}
          onSubmit={handleSubmit(onSubmit)}
        >
          <Grid container spacing={'24px'}>
            <Grid item size={{ xs: 12 }}>
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: '20px',
                  letterSpacing: 0,
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                Date and time of surgery
                <Typography sx={{ color: theme.palette.customColors.Error }} variant='span'>
                  *
                </Typography>
              </Typography>
            </Grid>
            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
              <ControlledDatePicker
                sx={{
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '4px',
                    height: '56px'
                  }
                }}
                name={'date'}
                label='Date'
                control={control}
                minDate={minDate}
                maxDate={maxDate}
                renderInput={params => (
                  <ControlledTextField
                    {...params}
                    fullWidth
                    error={!!errors.date}
                    helperText={errors.date?.message}
                    borderRadius='4px'
                  />
                )}
              />
            </Grid>
            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
              <ControlledTimePicker
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '4px',
                    height: '56px'
                  }
                }}
                label='Start Time'
                name={'startTime'}
                control={control}
                maxTime={maxTimeForSelectedDate}
                renderInput={params => (
                  <ControlledTextField
                    {...params}
                    fullWidth
                    error={!!errors.startTime}
                    helperText={errors.startTime?.message}
                    borderRadius='4px'
                  />
                )}
              />
            </Grid>
            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
              <ControlledTimePicker
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '4px',
                    height: '56px'
                  }
                }}
                name={'endTime'}
                control={control}
                label='End Time'
                minTime={startTimeValue || null}
                maxTime={maxTimeForSelectedDate}
                renderInput={params => (
                  <ControlledTextField
                    {...params}
                    fullWidth
                    error={!!errors.endTime}
                    helperText={errors.endTime?.message}
                    borderRadius='4px'
                  />
                )}
              />
            </Grid>
            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
              <ControlledTextField
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '4px',
                    height: '56px',
                    backgroundColor: theme.palette.customColors.mdAntzNeutral
                  }
                }}
                name={'duration'}
                label='Surgery Duration'
                control={control}
                errors={errors}
                borderRadius='4px'
                readOnly
                onChangeOverride={() => clearErrors?.('duration')}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: '20px',
                letterSpacing: 0,
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              Surgery details
              <Typography sx={{ color: theme.palette.customColors.Error }} variant='span'>
                *
              </Typography>
            </Typography>
            <Grid container spacing={'24px'}>
              <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledAutocomplete
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '4px',
                      height: '56px'
                    }
                  }}
                  control={control}
                  errors={errors}
                  name={'surgeon'}
                  key={`surgeon-${formResetKey}`}
                  label='Name of Surgeon'
                  options={surgeonOptions}
                  loading={isSurgeonsLoading}
                  onInputChange={handleSurgeonInputChange}
                  onItemClear={handleSurgeonClear}
                  getOptionLabel={surgeonGetOptionLabel}
                  isOptionEqualToValue={surgeonIsOptionEqualToValue}
                  onChangeOverride={() => clearErrors?.('surgeon')}
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledAutocomplete
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '4px',
                      height: '56px'
                    }
                  }}
                  control={control}
                  errors={errors}
                  name={'procedure'}
                  key={`procedure-${formResetKey}`}
                  label='Name of Procedure'
                  options={procedureOptions}
                  loading={isProceduresLoading}
                  onInputChange={handleProcedureInputChange}
                  onItemClear={handleProcedureClear}
                  getOptionLabel={procedureGetOptionLabel}
                  isOptionEqualToValue={procedureIsOptionEqualToValue}
                  onChangeOverride={() => clearErrors?.('procedure')}
                  endAdornment={() => (
                    <IconButton
                      size='small'
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => setOpenAddSurgeryDrawer(true)}
                      sx={{ ml: 1, fontSize: 28 }}
                    >
                      <Icon icon='mdi:plus' color={theme.palette.primary.main} />
                    </IconButton>
                  )}
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledTextField
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '4px',
                      height: '56px'
                    }
                  }}
                  name={'typeOfSurgery'}
                  label='Type of Surgery'
                  control={control}
                  errors={errors}
                  borderRadius='4px'
                  onChangeOverride={() => clearErrors?.('typeOfSurgery')}
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledTextField
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '4px',
                      height: '56px'
                    }
                  }}
                  name={'surgicalApproach'}
                  label='Surgical Approach'
                  control={control}
                  errors={errors}
                  borderRadius='4px'
                  onChangeOverride={() => clearErrors?.('surgicalApproach')}
                />
              </Grid>
            </Grid>

            <TemplateSection
              label='Enter surgery notes'
              value={richNote}
              onChange={setRichNote}
              hospitalId={resolvedHospitalCaseId || ''}
              templateType='surgery'
            />

            <ControlledTextField
              name={'complication'}
              control={control}
              errors={errors}
              label={'Complication *'}
              borderRadius='4px'
              onChangeOverride={() => clearErrors?.('complication')}
            />
          </Box>
        </Box>
      </Card>

      <Card
        sx={{
          borderRadius: '8px',
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', md: selectedAnesthesia ? 'column' : 'row' },
          alignItems: { xs: 'stretch', md: selectedAnesthesia ? 'stretch' : 'center' },
          gap: '24px',
          boxShadow: 'none'
        }}
      >
        <Typography
          sx={{
            fontWeight: 500,
            fontSize: '24px',
            letterSpacing: 0,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          Anesthesia Details
          <Typography component='span' sx={{ color: theme.palette.customColors.Error, ml: 1 }}>
            *
          </Typography>
        </Typography>
        {!selectedAnesthesia ? (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              justifyContent: { xs: 'flex-start', md: 'flex-end' }
            }}
          >
            <Button
              type='button'
              variant='outlined'
              startIcon={<Icon icon='mdi:plus' fontSize={20} />}
              onClick={handleAddNewanesthesia}
              sx={{
                width: '240px',
                height: '48px',
                borderRadius: '8px',
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                fontWeight: 600,
                letterSpacing: 0,
                textTransform: 'uppercase'
              }}
            >
              ADD NEW
            </Button>
            <Button
              type='button'
              variant='contained'
              onClick={handleSelectanesthesiaRecord}
              sx={{
                width: '240px',
                height: '48px'
              }}
            >
              SELECT FROM RECORD
            </Button>
          </Box>
        ) : (
          <Box
            sx={{
              backgroundColor: theme.palette.customColors.displaybgPrimary,
              borderRadius: '8px',
              pt: '24px',
              pr: '20px',
              pb: '24px',
              pl: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box
                onClick={handleSelectanesthesiaRecord}
                sx={{
                  backgroundColor: theme.palette.primary.light,
                  cursor: 'pointer',
                  height: 36,
                  borderRadius: '8px',
                  px: 1.5,
                  py: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  color: theme.palette.primary.contrastText,
                  fontWeight: 700,
                  fontSize: '16px',
                  letterSpacing: 0
                }}
              >
                {selectedAnesthesia?.code || getAnesthesiaIdentifier(selectedAnesthesia) || '--'}
                <Icon icon='mdi:chevron-right' fontSize={20} />
              </Box>
              <IconButton
                onClick={handleClearSelectedAnesthesia}
                sx={{ color: theme.palette.customColors.neutralSecondary }}
              >
                <Icon icon='mdi:close' fontSize={24} />
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
                  gap: '16px'
                }}
              >
                {[
                  { label: 'Location', value: selectedAnesthesia?.location || '--' },
                  {
                    label: 'Date and Time of Anesthesia',
                    value: formatAnesthesiaDateTime(
                      selectedAnesthesia?.anaesthesia_datetime || selectedAnesthesia?.anesthesia_datetime
                    )
                  },
                  {
                    label: 'Estimated Time Required',
                    value:
                      selectedAnesthesia?.estimated_time_required && selectedAnesthesia?.estimated_time_unit
                        ? `${selectedAnesthesia.estimated_time_required} ${selectedAnesthesia.estimated_time_unit}`
                        : selectedAnesthesia?.estimated_time_required || '--'
                  },
                  {
                    label: 'Veterinarian',
                    value: joinNames(selectedAnesthesia?.veterinarians)
                  },
                  {
                    label: 'Anesthetists',
                    value: joinNames(selectedAnesthesia?.anesthetists)
                  }
                ].map(info => (
                  <Box key={info.label} sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <Typography
                      sx={{ fontWeight: 400, fontSize: '14px', color: theme.palette.customColors.neutralSecondary }}
                    >
                      {info.label}
                    </Typography>
                    <Typography
                      sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      {info.value}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px',
                  pt: '24px',
                  borderTop: `1px solid ${theme.palette.customColors.OutlineVariant}`
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Typography
                    sx={{ fontWeight: 600, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}
                  >
                    Purpose of Anesthesia
                  </Typography>
                  <Box sx={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {purposeNames.length ? (
                      purposeNames.map(name => (
                        <Box
                          key={name}
                          sx={{
                            height: 41,
                            borderRadius: '4px',
                            padding: '12px',
                            border: `1px solid ${theme.palette.customColors.SecondaryContainer}`,
                            backgroundColor: alpha(theme.palette.customColors.SecondaryContainer, 128 / 255),
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}
                        >
                          <Typography
                            sx={{
                              fontWeight: 500,
                              fontSize: '14px',
                              color: theme.palette.primary.light
                            }}
                          >
                            {name}
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '14px' }}>
                        No purpose added
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </Card>

      <Card
        sx={{
          borderRadius: '8px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          boxShadow: 'none'
        }}
      >
        <Typography
          sx={{
            fontWeight: 500,
            fontSize: '24px',
            letterSpacing: 0,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          Care Instructions
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '16px',
              letterSpacing: 0,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Enter diet instructions
          </Typography>
          <ControlledTextField
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                height: '63px'
              }
            }}
            control={control}
            name={'dietInstructions'}
            errors={errors}
            borderRadius='4px'
            placeholder={'Enter text'}
          />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '16px',
              letterSpacing: 0,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Enter restriction activities with duration
          </Typography>
          <ControlledTextField
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                height: '63px'
              }
            }}
            control={control}
            name={'restrictions'}
            errors={errors}
            borderRadius='4px'
            placeholder={'Enter text'}
          />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '16px',
              letterSpacing: 0,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Additional notes
          </Typography>
          <ControlledTextField
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                height: '63px'
              },
              backgroundColor: alpha(theme.palette.customColors.Notes, 153 / 255)
            }}
            placeholder={'Enter text'}
            control={control}
            name={'additionalNotes'}
            errors={errors}
            borderRadius='4px'
          />
        </Box>
      </Card>

      <Card
        sx={{
          boxShadow: 'none',
          borderRadius: '8px',
          padding: '24px',
          paddingTop: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        <Typography
          sx={{
            fontWeight: 500,
            fontSize: '20px',
            letterSpacing: 0,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          Attachments
        </Typography>

        <ControlledMultiFileUpload
          name='attachments'
          control={control}
          label='Upload files'
          maxFiles={0}
          acceptedFileTypes='images,pdf,csv,audio,videos'
        />
      </Card>

      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 11,
          backgroundColor: theme.palette.primary.contrastText,
          boxShadow: `0px -8px 12px 0px ${theme.palette.customColors.shadowColor}`,
          height: { sm: '108px' },
          borderRadius: '4px',
          pl: '24px',
          pr: '84px',
          py: '16px',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'flex-end',
          gap: '24px',
          alignItems: 'center',
          alignSelf: 'stretch'
        }}
      >
        <Button
          variant='outlined'
          onClick={handleCancelForm}
          disabled={isSubmitting}
          sx={{
            height: '56px',
            minWidth: { xs: '100%', sm: '160px' },
            borderColor: theme.palette.customColors.Outline,
            color: theme.palette.customColors.OnSurfaceVariant,
            fontWeight: 600,
            letterSpacing: 0,
            px: '24px'
          }}
        >
          RESET
        </Button>
        <Button
          type='submit'
          form={FORM_ID}
          variant='contained'
          disabled={isSubmitting}
          sx={{
            height: '56px',
            minWidth: { xs: '100%', sm: '160px' },
            fontWeight: 600,
            letterSpacing: 0,
            px: '24px'
          }}
        >
          {isSubmitting ? (isEditMode ? 'Updating...' : 'Submitting...') : isEditMode ? 'UPDATE' : 'SAVE'}
        </Button>
      </Box>

      <AddEditSurgeryDrawer
        open={openAddSurgeryDrawer}
        onClose={() => setOpenAddSurgeryDrawer(false)}
        onSubmit={handleCreateSurgery}
        loading={isSurgerySaving}
      />
      <AddAnesthesiaRecordDrawer
        setOpenAddanesthesiaDrawer={setOpenAddanesthesiaDrawer}
        openAddanesthesiaDrawer={openAddanesthesiaDrawer}
        hospitalCaseId={resolvedHospitalCaseId}
        medicalRecordId={medicalRecordId}
        vetOptions={doctorOptions}
        anesthetistOptions={doctorOptions}
        patientData={patientData}
        animalInfoData={animalInfoData}
        onSuccess={handleAnesthesiaCreateSuccess}
      />
      <SelectAnesthesiaRecordDrawer
        open={openSelectAnesthesiaDrawer}
        onClose={() => setOpenSelectAnesthesiaDrawer(false)}
        initialSelectedId={getAnesthesiaIdentifier(selectedAnesthesiaRecord) || null}
        hospitalCaseId={resolvedHospitalCaseId}
        medicalRecordId={medicalRecordId}
        onSelect={handleAnesthesiaRecordSelect}
        onConfirm={handleConfirmAnesthesiaRecord}
      />
    </Box>
  )
}

export default enforceModuleAccess(AddSurgeryRecord, 'add_hospital')
