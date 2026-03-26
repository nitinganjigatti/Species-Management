import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/router'

import {
  Breadcrumbs,
  Typography,
  Card,
  Box,
  Button,
  IconButton,
  Grid,
  Tooltip,
  Collapse,
  Autocomplete,
  TextField
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { Icon } from '@iconify/react'
import { useHospital } from 'src/context/HospitalContext'

import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { useQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'

dayjs.extend(customParseFormat)

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
import BottomActionBar from 'src/views/utility/BottomActionBar'
import ConfirmationDialog from 'src/components/confirmation-dialog/index'

import { getPatientDetails } from 'src/lib/api/hospital/incomingPatient'
import { getHospitalStaff } from 'src/lib/api/hospital/staff'
import Utility from 'src/utility'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import useDebounce from 'src/hooks/useDebounce'

import {
  addSurgeryMaster,
  addSurgeryRecord,
  getPatientSurgeryList,
  getSurgeryMaster
} from 'src/lib/api/hospital/surgeryMaster'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import { borderRadius } from '@mui/system'
import { minTime } from 'date-fns'

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
  startTime: yup.mixed().test('start-required', 'Start time is required', value => Boolean(value)).when('date', (date, schema) =>
      schema.test('starttime', function (value) {
        if (!value || !date) return true
        console.log("Time field value:", value)
  
        const selectedStartDate = dayjs(date)
        const selectedStartTime = dayjs(value)
  
        const patientData = this.options?.context?.patientData
        if (!patientData) return true
  
        const admittedAt = dayjs.utc(patientData.admitted_at).local()
        const dischargeAt = dayjs.utc(patientData.discharge_at).local()
        const now = dayjs()
  
        const selectedDateTime = selectedStartDate.hour(selectedStartTime.hour()).minute(selectedStartTime.minute()).second(0)
  
        if (selectedStartDate.isSame(admittedAt, 'day') && selectedDateTime.isBefore(admittedAt)) {
          return this.createError({
            message: `Time cannot be before the admitted time (${admittedAt.format('hh:mm A')})`
          })
        }
  
        if (selectedStartDate.isSame(dischargeAt, 'day') && selectedDateTime.isAfter(dischargeAt.clone().subtract(1, 'hour'))) {
          return this.createError({
            message: `Time should be at least 1 hour less than the discharge time (${dischargeAt.format('hh:mm A')})`
          })
        }
  
        if (selectedStartDate.isSame(now, 'day') && selectedDateTime.isAfter(now)) {
          return this.createError({ message: 'Time cannot be in the future' })
        }
  
        return true
      })
    ),
  endTime: yup
    .mixed()
    .test('end-required', 'End time is required', value => Boolean(value))
    .test('end-after-start', 'End time must be at least 1 hour after start time', function (value) {
      const { startTime, date } = this?.parent || {}
      if (!value || !startTime || !date) return true

      const startDateTime = combineDateAndTime(date, startTime)
      const endDateTime = combineDateAndTime(date, value)

      if (!startDateTime || !endDateTime) return true

      const diffSeconds = endDateTime.diff(startDateTime, 'second')
      const diffMinutes = Math.ceil(diffSeconds / 60)

      return diffMinutes >= 60
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

  const defaultFormValues = useMemo(
    () => ({
      date: dayjs(),
      startTime: dayjs(),
      endTime: dayjs().add(1, 'hour'),
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
  const formResolver = useMemo(() => yupResolver(schema, { context: { admissionDateTime, patientData, } }), [admissionDateTime, patientData,])

  const {
    control,
    handleSubmit,
    reset,
    clearErrors,
    setValue,
        trigger,
    watch,
    formState: { errors, isDirty }
  } = useForm({
    resolver: formResolver,
    mode: 'onChange',
    reValidateMode: 'onChange',
    context: { patientData },
    defaultValues: defaultFormValues
  })

  const [openAddanesthesiaDrawer, setOpenAddanesthesiaDrawer] = useState(false)
  const [openSelectAnesthesiaDrawer, setOpenSelectAnesthesiaDrawer] = useState(false)
  const [selectedAnesthesiaRecord, setSelectedAnesthesiaRecord] = useState(null)
  const [editingAnesthesiaRecordId, setEditingAnesthesiaRecordId] = useState('')
  const [initialAnesthesiaRecord, setInitialAnesthesiaRecord] = useState(null)
  const [pendingAnesthesiaRecord, setPendingAnesthesiaRecord] = useState(null)
  const [richNote, setRichNote] = useState('')
  const [initialRichNote, setInitialRichNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [prefillDetail, setPrefillDetail] = useState(null)
  const [procedureSearchTerm, setProcedureSearchTerm] = useState('')
  const [searchAttendDoctor, setSearchAttendDoctor] = useState('')
  const [openAddSurgeryDrawer, setOpenAddSurgeryDrawer] = useState(false)
  const [isSurgerySaving, setIsSurgerySaving] = useState(false)
  const [localProcedureOptions, setLocalProcedureOptions] = useState([])
  const [surgeonSearchTerm, setSurgeonSearchTerm] = useState('')
  const [doctors, setDoctors] = useState([])
  const [attendingDoctors, setAttendingDoctors] = useState([])
  const [doctorsPage, setDoctorsPage] = useState(1)
  const [hasMoreDoctors, setHasMoreDoctors] = useState(true)
  const [doctorsLoading, setDoctorsLoading] = useState(false)
  const [careInstructionsExpanded, setCareInstructionsExpanded] = useState(false)
  const [formResetKey, setFormResetKey] = useState(0)
  const [showNavWarning, setShowNavWarning] = useState(false)
  const [staffLoading, setStaffLoading] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [selectedAttendingDoctors, setSelectedAttendingDoctors] = useState([])
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10
  })

  const [pendingRoute, setPendingRoute] = useState(null)
  const isNavigatingRef = useRef(false)
  const selectedDate = watch('date')
  const startTimeValue = watch('startTime')
  const endTimeValue = watch('endTime')
  const durationValue = watch('duration')
  const selectedAnesthesia = selectedAnesthesiaRecord
  const minEndTime = useMemo(() => {
    if (!startTimeValue || !dayjs(startTimeValue).isValid()) return null

    return dayjs(startTimeValue).add(1, 'hour')
  }, [startTimeValue])
  const debouncedProcedureSearchTerm = useDebounce(procedureSearchTerm, 400)
  const debouncedSurgeonSearchTerm = useDebounce(surgeonSearchTerm, 400)
  const debouncedAttendingDoctorSearch = useDebounce(searchAttendDoctor, 400)

  const { selectedHospital } = useHospital()

    useEffect(() => {
      if (selectedDate) {
        trigger('startTime')
      }
    }, [selectedDate, trigger]) //time validation dependent on date field

  const parseUtcDateToLocalDayjs = useCallback(value => {
    if (!value) return null

    const localDate = Utility.convertUTCToLocalDate(value)

    return dayjs(localDate && localDate !== 'Invalid date' ? localDate : value)
  }, [])

  const convertUtcTimeToLocalString = useCallback((dateValue, timeValue) => {
    if (!timeValue) return null

    const baseDate = dateValue || dayjs().format('YYYY-MM-DD')
    const source = `${baseDate} ${timeValue}`
    const converted = Utility.convertUTCToLocaltime(source)

    return converted && converted !== 'Invalid date' ? converted : timeValue
  }, [])

  const applyPrefillFromRecord = useCallback(
    detail => {
      if (!detail) return
      setPrefillDetail(detail)

      const rawDateValue = detail?.surgery_date || detail?.date || null
      const parsedDate = parseUtcDateToLocalDayjs(rawDateValue)
      const localDateString = parsedDate?.isValid() ? parsedDate.format('YYYY-MM-DD') : rawDateValue || null
      const startTimeCombined = detail?.start_time
        ? combineDateAndTime(localDateString, convertUtcTimeToLocalString(rawDateValue, detail.start_time))
        : null
      const endTimeCombined = detail?.end_time
        ? combineDateAndTime(localDateString, convertUtcTimeToLocalString(rawDateValue, detail.end_time))
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

      setValue('date', parsedDate && parsedDate.isValid() ? parsedDate : null, {
        shouldValidate: false,
        shouldDirty: false,
        shouldTouch: false
      })
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
      const secondarySurgeonOptions =
        detail?.secondary_surgeons?.map(item => ({
          label: item.user_full_name,
          value: item.user_id
        })) || []

      setValue('secondarySurgeon', secondarySurgeonOptions)

      setSelectedAttendingDoctors(secondarySurgeonOptions)

      const existingAttachments = Array.isArray(detail?.attachments)
        ? detail.attachments.map(item => ({
            id: item?.id,
            file_path: item?.file || item?.file_path || '',
            name: item?.file_original_name || item?.name || item?.file || ''
          }))
        : []

      setValue('attachments', existingAttachments, { shouldValidate: false, shouldDirty: false, shouldTouch: false })
      setSelectedAnesthesiaRecord(anesthesiaDetail || anesthesiaOption)
      setInitialAnesthesiaRecord(anesthesiaDetail || anesthesiaOption)
      setRichNote(detail?.surgery_notes || '')
      setInitialRichNote(detail?.surgery_notes || '')
      setFormResetKey(prev => prev + 1)
    },
    [
      setPrefillDetail,
      setValue,
      setSelectedAnesthesiaRecord,
      setRichNote,
      setFormResetKey,
      parseUtcDateToLocalDayjs,
      convertUtcTimeToLocalString
    ]
  )

  const resetForm = useCallback(() => {
    if (isEditMode && prefillDetail) {
      applyPrefillFromRecord(prefillDetail)

      return
    }

    reset(defaultFormValues)
    setValue('surgeon', null, { shouldValidate: false, shouldDirty: false, shouldTouch: false })
    setValue('procedure', null, { shouldValidate: false, shouldDirty: false, shouldTouch: false })
    setSelectedAnesthesiaRecord(null)
    setInitialAnesthesiaRecord(null)
    setPendingAnesthesiaRecord(null)
    setRichNote('')
    setInitialRichNote('')
    setProcedureSearchTerm('')
    setSurgeonSearchTerm('')
    setFormResetKey(prev => prev + 1)
  }, [
    isEditMode,
    prefillDetail,
    applyPrefillFromRecord,
    reset,
    defaultFormValues,
    setValue,
    setSelectedAnesthesiaRecord,
    setPendingAnesthesiaRecord,
    setRichNote,
    setProcedureSearchTerm,
    setSurgeonSearchTerm
  ])

  const { data: surgeryMasterResponse, isFetching: isProceduresLoading } = useQuery({
    queryKey: ['hospital-surgeries', debouncedProcedureSearchTerm],
    queryFn: () => {
      const params = {
        page_no: 1,
        limit: 20
      }

      const trimmed = debouncedProcedureSearchTerm.trim()
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

    const getDoctorList = useCallback(async (hospitalId, pageNo = 1, searchTerm = '') => {
    if (!hospitalId) return

    setDoctorsLoading(true)
    try {
      const params = {
        hospital_id: hospitalId,
        page_no: pageNo,
        limit: 10,
        is_hospital_chief_doctor: '1'
      }

      if (searchTerm.trim()) {
        params.q = searchTerm.trim()
      }

      const res = await getHospitalStaff({ params })
      if (res?.success === true) {
        const data = res?.data

        if (!data?.records?.length) {
          setHasMoreDoctors(pageNo > 1)
          if (pageNo === 1) setDoctors([])
          return
        }

        const mapped = data.records.map(item => ({
          id: String(item.user_id),
          name: item.user_full_name
        }))

        if (!prefilledRef.current && mapped.length === 1 && selectedHospital?.id) {
          const prefilledDoc = {
            value: mapped[0].id,
            label: mapped[0].name
          }

          setValue('surgeon', prefilledDoc)
          setSelectedDoctor(prefilledDoc)
          clearErrors('surgeon')

          prefilledRef.current = true
        }

        if (pageNo === 1) {
          setDoctors(mapped)
        } else {
          setDoctors(prev => {
            const merged = [...prev, ...mapped]
            return Array.from(new Map(merged.map(item => [item.id, item])).values())
          })
        }

        setHasMoreDoctors(data.current_page < data.total_pages)
        setDoctorsPage(data.current_page)
      }
    } catch (e) {
      console.error(e)
      Toaster({ type: 'error', message: 'Failed to load doctors' })
    } finally {
      setDoctorsLoading(false)
    }
  }, []) // Empty dependency array for useCallback as it's a stable function definition

  
  const getStaffList = async (searchTerm = '') => {
    try {
      if (!selectedHospital?.id) return

      const params = {
        page_no: 1,
        limit: 10,
        hospital_id: selectedHospital.id
      }

      if (searchTerm.trim()) {
        params.q = searchTerm.trim()
      }

      const response = await getHospitalStaff({ params })

      if (response?.success && response?.data?.records) {
        const mappedData = response.data.records.map(item => ({
          value: String(item.user_id),
          label: item.user_full_name
        }))

        setAttendingDoctors(mappedData)
      }
    } catch (error) {
      console.error('Error fetching hospital staff:', error?.message)
    } finally {
      setStaffLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedHospital?.id) return

    getStaffList(debouncedAttendingDoctorSearch)
  }, [debouncedAttendingDoctorSearch, selectedHospital?.id,])


  
  //   useEffect(() => {
  //   const hospitalId = patientData?.hospital_id
  //   if (!hospitalId) {
  //     setDoctors([])
  //     return
  //   }

  //   getDoctorList(hospitalId, 1, debouncedSurgeonSearchTerm)
  // }, [patientData?.hospital_id, debouncedSurgeonSearchTerm, getDoctorList])


  //same person cannot be selected as chief and attending
  useEffect(() => {
  if (!selectedDoctor?.value) return

  setSelectedAttendingDoctors(prev => {
    const updated = prev.filter(
      attendingDoctor => String(attendingDoctor.value) !== String(selectedDoctor.value)
    )

    setValue("secondarySurgeon", updated) 

    return updated
  })
}, [selectedDoctor, setValue])

  useEffect(() => {
    const hospitalId = patientData?.hospital_id
    if (!hospitalId) {
      setDoctors([])
      return
    }

    getDoctorList(hospitalId, 1, debouncedSurgeonSearchTerm)
  }, [patientData?.hospital_id, debouncedSurgeonSearchTerm, getDoctorList])

  const loadMoreDoctors = () => {
    if (!hasMoreDoctors || doctorsLoading) return
    getDoctorList(patientData?.hospital_id, doctorsPage + 1, debouncedSurgeonSearchTerm)
  }

  const handleSurgeonSelect = doctor => {
    setSelectedDoctor(doctor)
    clearErrors('surgeon')
  }

  const surgeonOptions = useMemo(() => {
    return doctors.map(d => ({
      label: d.name,
      value: d.id,
      is_hospital_chief_doctor: d.is_hospital_chief_doctor === '1'
    }))
  }, [doctors])
  const doctorOptions = doctors

  const filteredAttendingDoctors = useMemo(() => {
    if (!selectedDoctor?.value) return attendingDoctors

    return attendingDoctors.filter(
      doctor =>
        String(doctor.value) !== String(selectedDoctor.value) &&
        !selectedAttendingDoctors?.some(secondary => String(secondary.value) === String(doctor.value))
    )
  }, [attendingDoctors, selectedDoctor, selectedAttendingDoctors])

  useEffect(() => {
    if (!isEditMode || !resolvedHospitalCaseId || !surgeryRecordId) return

    let isMounted = true

    const fetchSurgeryRecord = async () => {
      try {
        const response = await getPatientSurgeryList({ params: { hospital_case_id: resolvedHospitalCaseId } })
        const records = Array.isArray(response?.data?.surgery_records) ? response.data.surgery_records : []
        const match = records.find(record => getSurgeryRecordIdentifier(record) === String(surgeryRecordId))

        if (!isMounted) return

        if (match) {
          applyPrefillFromRecord(match?.detail || match)
        } else {
          Toaster({ type: 'error', message: 'Surgery record not found.' })
        }
      } catch (error) {
        if (!isMounted) return
        console.error('Failed to load surgery record', error)
        const message = error?.response?.data?.message || error?.message || 'Failed to load surgery record.'
        Toaster({ type: 'error', message })
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
  const maxDate = useMemo(
    () => (patientData?.discharge_at ? dayjs.utc(patientData.discharge_at).local() : dayjs()),
    [patientData?.discharge_at]
  )

  const isDefaultDateSetRef = useRef(false)

  useEffect(() => {
    if (!isEditMode && patientData && !isDefaultDateSetRef.current) {
      if (patientData.discharge_at) {
        const dischargeDt = dayjs.utc(patientData.discharge_at).local()
        setValue('date', dischargeDt, { shouldValidate: true })
        // Start time should be 1 hour before discharge time
        // End time should be exact discharge time
        setValue('startTime', dischargeDt.subtract(1, 'hour'), { shouldValidate: true })
        setValue('endTime', dischargeDt, { shouldValidate: true })
      }
      isDefaultDateSetRef.current = true
    }
  }, [patientData, isEditMode, setValue])


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

    const diffSeconds = endDateTime.diff(startDateTime, 'second')
    const diffMinutes = Math.ceil(diffSeconds / 60)
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

  useEffect(() => {
    if (!minEndTime) return

    const currentEnd = endTimeValue && dayjs(endTimeValue).isValid() ? dayjs(endTimeValue) : null
    if (!currentEnd || currentEnd.isBefore(minEndTime)) {
      setValue('endTime', minEndTime, { shouldValidate: true, shouldDirty: false, shouldTouch: false })
    }
  }, [minEndTime, endTimeValue, setValue])


    const minTime = useMemo(() => {
    if (!patientData?.admitted_at || !selectedDate) return null
  
    const admitted = dayjs.utc(patientData.admitted_at).local()
  
    if (dayjs(selectedDate).isSame(admitted, 'day')) {
      return dayjs()
        .hour(admitted.hour())
        .minute(admitted.minute())
        .second(0)
    }
  
    return null
  }, [patientData?.admitted_at, selectedDate])
  
  const maxTime = useMemo(() => {
    if (!patientData?.discharge_at || !selectedDate) return null
  
    const discharge = dayjs.utc(patientData.discharge_at).local()
  
    if (dayjs(selectedDate).isSame(discharge, 'day')) {
      const startLimit = discharge.subtract(1, 'hour')
  
      return dayjs()
        .hour(startLimit.hour())
        .minute(startLimit.minute())
        .second(0)
    }
    return null
  }, [patientData?.discharge_at, selectedDate])


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

  const handleAttendingDoctorInputChange = useCallback((event, value, reason) => {
    if (reason === 'input') {
      setSearchAttendDoctor(value)
    }
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

          Toaster({
            type: 'success',
            message: 'Surgery has been added to the masters list successfully'
          })
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

  const prefilledRef = useRef(false)

  const handleSurgeonClear = useCallback(() => {
    setSelectedDoctor(null)
    setSurgeonSearchTerm('')
    prefilledRef.current = true
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
    setEditingAnesthesiaRecordId('')
    setOpenAddanesthesiaDrawer(true)
  }, [setOpenAddanesthesiaDrawer])

  const handleEditSelectedAnesthesia = useCallback(() => {
    const recordId = getAnesthesiaIdentifier(selectedAnesthesiaRecord)
    if (!recordId) return

    setEditingAnesthesiaRecordId(String(recordId))
    setOpenAddanesthesiaDrawer(true)
  }, [selectedAnesthesiaRecord])

  const handleSelectanesthesiaRecord = useCallback(() => {
    setOpenSelectAnesthesiaDrawer(true)
  }, [])

  const handleAnesthesiaCreateSuccess = useCallback(
    record => {
      if (record) {
        setSelectedAnesthesiaRecord(record)
        setEditingAnesthesiaRecordId('')
      }
    },
    [setSelectedAnesthesiaRecord]
  )

  const handleAnesthesiaRecordSelect = useCallback(record => {
    setPendingAnesthesiaRecord(record)
  }, [])

  useEffect(() => {
    if (!openAddanesthesiaDrawer && editingAnesthesiaRecordId) {
      setEditingAnesthesiaRecordId('')
    }
  }, [openAddanesthesiaDrawer, editingAnesthesiaRecordId])

  const handleConfirmAnesthesiaRecord = useCallback(record => {
    if (record) {
      setSelectedAnesthesiaRecord(record)
    }
    setPendingAnesthesiaRecord(null)
    setOpenSelectAnesthesiaDrawer(false)
  }, [])

  const checkIsDirty = useCallback(() => {
    const isRichNoteDirty = richNote !== initialRichNote
    const isAnesthesiaDirty =
      getAnesthesiaIdentifier(selectedAnesthesiaRecord) !== getAnesthesiaIdentifier(initialAnesthesiaRecord)

    return isDirty || isRichNoteDirty || isAnesthesiaDirty
  }, [isDirty, richNote, initialRichNote, selectedAnesthesiaRecord, initialAnesthesiaRecord])

  const handleCancelForm = useCallback(() => {
    resetForm()
  }, [resetForm])

  const handleNavigateBack = useCallback(() => {
    if (checkIsDirty()) {
      setShowNavWarning(true)
      setPendingRoute('BACK')
    } else {
      router.back()
    }
  }, [checkIsDirty, router])

  const handleConfirmNavigation = useCallback(() => {
    setShowNavWarning(false)
    isNavigatingRef.current = true
    if (pendingRoute === 'BACK') {
      router.back()
    } else if (pendingRoute) {
      router.push(pendingRoute)
    }
    setPendingRoute(null)
  }, [pendingRoute, router])

  useEffect(() => {
    const handleRouteChange = url => {
      if (isNavigatingRef.current) return
      if (checkIsDirty() && !isSubmitting) {
        setPendingRoute(url)
        setShowNavWarning(true)
        router.events.emit('routeChangeError')
        throw 'routeChange aborted'
      }
    }

    const handleBeforeUnload = e => {
      if (checkIsDirty() && !isSubmitting) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    router.events.on('routeChangeStart', handleRouteChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      router.events.off('routeChangeStart', handleRouteChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [checkIsDirty, isSubmitting, router])

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
    const secondarySurgeonString = formValues?.secondarySurgeon?.length
      ? JSON.stringify(formValues?.secondarySurgeon.map(doc => String(doc.value)))
      : '[]'

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
    payload.append('secondary_surgeon', secondarySurgeonString)

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
        // Skip route change warning after successful save
        isNavigatingRef.current = true
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

  const handleAIDDisplay = () => {
    if (patientData?.animal_detail?.local_identifier_name && patientData?.animal_detail?.local_identifier_value) {
      return patientData?.animal_detail?.local_identifier_value
    } else {
      return patientData?.animal_detail?.animal_id
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Breadcrumbs aria-label='breadcrumb'>
        <Typography color={theme.palette.customColors.neutralSecondary}>Hospital</Typography>
        <Typography color={theme.palette.customColors.neutralSecondary}>Patients</Typography>
        <Typography color={theme.palette.customColors.neutralSecondary}>Follow Up</Typography>
        <Typography
          color={theme.palette.customColors.neutralSecondary}
          sx={{ cursor: 'pointer' }}
          onClick={handleNavigateBack}
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
          onClick={handleNavigateBack}
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
            {
              label:
                patientData?.animal_detail?.local_identifier_name && patientData?.animal_detail?.local_identifier_value
                  ? patientData?.animal_detail?.local_identifier_name
                  : 'AID',
              value: handleAIDDisplay()
            },
            { label: 'Health Status', value: patientData?.health_status || 'stable', isStatusCard: true },
            // { label: 'Admitted days', value: patientData?.admitted_for_day },
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
                minTime={minTime}
                maxTime={maxTime}
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
                minTime={minEndTime}
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
              <Grid item size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
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
                  loading={doctorsLoading}
                  onInputChange={handleSurgeonInputChange}
                  onItemClear={handleSurgeonClear}
                  getOptionLabel={surgeonGetOptionLabel}
                  isOptionEqualToValue={surgeonIsOptionEqualToValue}
                  onChangeOverride={handleSurgeonSelect}
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                <Tooltip
                  title={(() => {
                    // Get the selected value from the form
                    const selectedValue = watch('procedure')
                    // Find the selected option
                    const selectedOption = procedureOptions.find(option =>
                      procedureIsOptionEqualToValue(option, selectedValue)
                    )
                    // Return the description
                    return selectedOption?.description || ''
                  })()}
                  placement='top'
                  arrow
                  enterDelay={500}
                  slotProps={{
                    popper: {
                      sx: {
                        zIndex: 1300
                      }
                    },
                    tooltip: {
                      enterDelay: 500,
                      leaveDelay: 200
                    }
                  }}
                >
                  <Box>
                    <ControlledAutocomplete
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '4px',
                          height: '56px'
                        },
                        '& .MuiAutocomplete-popper': {
                          zIndex: 1400 // Higher than tooltip
                        },
                        '& .MuiAutocomplete-listbox': {
                          zIndex: 1400
                        },
                        '& .MuiPaper-root': {
                          zIndex: 1400
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
                      renderOption={(props, option) => (
                        <Tooltip title={option.description || 'No description available'} placement='right' arrow>
                          <li {...props}>{procedureGetOptionLabel(option)}</li>
                        </Tooltip>
                      )}
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
                  </Box>
                </Tooltip>
              </Grid>
              <Grid item size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
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
              <Grid item size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
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
              <Grid item size={{ xs: 12, sm: 12, md: 12, lg: 12 }}>
                <Controller
                  name='secondarySurgeon'
                  control={control}
                  defaultValue={[]}
                  render={({ field }) => (
                    <Autocomplete
                      multiple
                      options={filteredAttendingDoctors}
                      value={field.value}
                      loading={staffLoading}
                      filterSelectedOptions
                      getOptionLabel={option => option?.label || ''}
                      isOptionEqualToValue={(option, value) => option.value === value?.value}
                      noOptionsText='No available attending vets...'
                      onChange={(event, newValue) => {
                        setSelectedAttendingDoctors(newValue)
                        field.onChange(newValue)
                      }}
                      onInputChange={handleAttendingDoctorInputChange}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '4px'
                        }
                      }}
                      renderInput={params => (
                        <TextField {...params} label='Attending Veterinarian' placeholder='Search & Select' />
                      )}
                    />
                  )}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton onClick={handleEditSelectedAnesthesia} sx={{ color: theme.palette.primary.main }}>
                  <Icon icon='mdi:pencil-outline' fontSize={22} />
                </IconButton>
                <IconButton
                  onClick={handleClearSelectedAnesthesia}
                  sx={{ color: theme.palette.customColors.neutralSecondary }}
                >
                  <Icon icon='mdi:close' fontSize={24} />
                </IconButton>
              </Box>
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
                    value: Utility.convertUTCToLocalDateTime(
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
          gap: careInstructionsExpanded ? '24px' : '0',
          boxShadow: 'none'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            width: '100%'
          }}
          onClick={() => setCareInstructionsExpanded(!careInstructionsExpanded)}
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
          <IconButton
            size='small'
            sx={{
              transform: careInstructionsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease-in-out'
            }}
          >
            <Icon icon='mdi:chevron-down' fontSize={24} />
          </IconButton>
        </Box>

        <Collapse in={careInstructionsExpanded}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
          </Box>
        </Collapse>
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

      <BottomActionBar
        onCancel={handleCancelForm}
        onSubmit={handleSubmit(onSubmit)}
        loading={isSubmitting}
        disabled={isSubmitting}
        submitLabel={isSubmitting ? (isEditMode ? 'Updating...' : 'Submitting...') : isEditMode ? 'UPDATE' : 'SAVE'}
        cancelLabel='RESET'
        cancelBtnStyle={{
          height: '56px',
          minWidth: { xs: '100%', sm: '160px' },
          borderColor: theme.palette.customColors.Outline,
          color: theme.palette.customColors.OnSurfaceVariant,
          fontWeight: 600,
          letterSpacing: 0,
          px: '24px'
        }}
        submitBtnStyle={{
          height: '56px',
          minWidth: { xs: '100%', sm: '160px' },
          fontWeight: 600,
          letterSpacing: 0,
          px: '24px'
        }}
      />

      <ConfirmationDialog
        dialogBoxStatus={showNavWarning}
        onClose={() => {
          setShowNavWarning(false)
          setPendingRoute(null)
        }}
        title='Unsaved Changes'
        description='Please save your changes before navigating back.'
        confirmAction={handleConfirmNavigation}
        ConfirmationText='Discard'
        cancelText='Stay'
        icon='mdi:alert-circle-outline'
        iconColor={theme.palette.warning.main}
        imgStyle={{ backgroundColor: alpha(theme.palette.warning.main, 0.1) }}
      />

      <AddEditSurgeryDrawer
        open={openAddSurgeryDrawer}
        onClose={() => setOpenAddSurgeryDrawer(false)}
        onSubmit={handleCreateSurgery}
        loading={isSurgerySaving}
      />
      <AddAnesthesiaRecordDrawer
        setOpenAddanesthesiaDrawer={setOpenAddanesthesiaDrawer}
        openAddanesthesiaDrawer={openAddanesthesiaDrawer}
        editRecordId={editingAnesthesiaRecordId}
        hospitalCaseId={resolvedHospitalCaseId}
        medicalRecordId={medicalRecordId}
        vetOptions={doctorOptions}
        anesthetistOptions={doctorOptions}
        patientData={patientData}
        animalInfoData={animalInfoData}
        onSuccess={handleAnesthesiaCreateSuccess}
        loadMoreDoctors={loadMoreDoctors}
        loadingDoctors={doctorsLoading}
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
