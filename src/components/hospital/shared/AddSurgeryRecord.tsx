'use client'
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import useSafeRouter from 'src/hooks/useSafeRouter'
import { usePathname } from 'next/navigation'

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
import { useTranslation } from 'react-i18next'
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
import ControlledDateTimePicker from 'src/views/forms/form-fields/ControlledDateTimePicker'
import AddEditSurgeryDrawer from 'src/views/pages/hospital/masters/surgery'
import BottomActionBar from 'src/views/utility/BottomActionBar'
import ConfirmationDialog from 'src/components/confirmation-dialog/index'

import { getPatientDetails } from 'src/lib/api/hospital/incomingPatient'
import { getHospitalStaff } from 'src/lib/api/hospital/staff'
import Utility from 'src/utility'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import useDebounce from 'src/hooks/useDebounce'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'

import {
  addSurgeryMaster,
  addSurgeryRecord,
  getPatientSurgeryList,
  getSurgeryMaster
} from 'src/lib/api/hospital/surgeryMaster'
import { borderRadius } from '@mui/system'

const FORM_ID = 'add-surgery-record-form'

const getSafeString = (value: any) => {
  if (value === undefined || value === null) return ''

  return String(value)
}

const getRichTextHtml = (note: any) => {
  if (!note) return ''
  if (typeof note === 'string') return note
  if (note?.html) return note.html
  if (note?.text) return note.text
  if (note?.delta?.ops) {
    try {
      const text = note.delta.ops
        .map((op: any) => (typeof op.insert === 'string' ? op.insert : ''))
        .join('')
        .trim()

      return text
    } catch {
      return ''
    }
  }

  return ''
}

const mapSurgeryToOption = (surgery: any): any => {
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

const getSurgeryIdentifier = (value: any): any => {
  if (!value) return ''
  if (typeof value === 'string' || typeof value === 'number') return value

  return value?.value ?? value?.id ?? value?.surgery_id ?? value?.surgeryId ?? ''
}

const getAnesthesiaIdentifier = (value: any): any => {
  if (!value) return ''
  if (typeof value === 'string' || typeof value === 'number') return value

  return value?.anaesthesia_id ?? ''
}

const getSurgeryRecordIdentifier = (record: any) => {
  if (!record || typeof record !== 'object') return ''
  if (record.id !== undefined && record.id !== null) return String(record.id)
  if (record.detail?.id !== undefined && record.detail?.id !== null) return String(record.detail.id)

  return ''
}

const formatDateValue = (value: any) => (value ? dayjs(value).format('YYYY-MM-DD') : '')

const formatTimeValue = (value: any) => (value ? dayjs(value).format('HH:mm:ss') : '')

const combineDateAndTime = (dateValue: any, timeValue: any): any => {
  const date = dayjs(dateValue)

  if (!date.isValid() || !timeValue) return null

  const baseDateString = date.format('YYYY-MM-DD')
  const parseTime = (value: any): any => {
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

const resolveHospitalCaseId = (query: any): any => {
  const possibleKeys = ['hospital_case_id']

  for (const key of possibleKeys) {
    if (query?.[key] !== undefined) {
      const value = query[key]

      return Array.isArray(value) ? value[0] : value
    }
  }

  return undefined
}

const buildAnimalInfoData = (patientData: any) => {
  const animalDetail = patientData?.animal_detail || {}
  const additionalInfo: any = {}
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
const schema: any = yup.object().shape({
  date: yup
    .mixed()
    .test('date-required', 'Date is required', (value: any) => Boolean(value) && dayjs(value).isValid())
    .test('date-after-admission', 'Date cannot be before admission date', function (this: any, value: any) {
      const admissionDateTime = (this as any)?.options?.context?.admissionDateTime
      if (!value || !dayjs(value).isValid() || !admissionDateTime) return true

      return !dayjs(value).startOf('day').isBefore(dayjs(admissionDateTime).startOf('day'))
    })
    .test('date-not-in-future', 'Date cannot be in the future', (value: any) => {
      if (!value || !dayjs(value).isValid()) return true

      return !dayjs(value).startOf('day').isAfter(dayjs().startOf('day'))
    }),
  startTime: yup
    .mixed()
    .test('start-required', 'Start time is required', (value: any) => Boolean(value))
    .when('date', ((date: any, schema: any) =>
      schema.test('starttime', function (this: any, value: any) {
        if (!value || !date) return true

        const selectedStartDate = dayjs(date)
        const selectedStartTime = dayjs(value)

        const patientData = this.options?.context?.patientData
        if (!patientData) return true

        const admittedAt = dayjs.utc(patientData.admitted_at).local()
        const dischargeAt = dayjs.utc(patientData.discharge_at).local()
        const now = dayjs()

        const selectedDateTime = selectedStartDate
          .hour(selectedStartTime.hour())
          .minute(selectedStartTime.minute())
          .second(0)

        if (selectedStartDate.isSame(admittedAt, 'day') && selectedDateTime.isBefore(admittedAt)) {
          return this.createError({
            message: `Time cannot be before the admitted time (${admittedAt.format('hh:mm A')})`
          })
        }

        if (
          selectedStartDate.isSame(dischargeAt, 'day') &&
          selectedDateTime.isAfter(dischargeAt.clone().subtract(1, 'hour'))
        ) {
          return this.createError({
            message: `Time should be at least 1 hour less than the discharge time (${dischargeAt.format('hh:mm A')})`
          })
        }

        if (selectedStartDate.isSame(now, 'day') && selectedDateTime.isAfter(now)) {
          return this.createError({ message: `Time cannot be later than the current time (${now.format('hh:mm A')})` })
        }

        return true
      })) as any
    ),
  endTime: yup
    .mixed()
    .test('end-required', 'End time is required', (value: any) => Boolean(value))
    .test('end-after-start', 'End time must be at least 1 hour after start time', function (this: any, value: any) {
      const { startTime, date } = (this as any)?.parent || {}
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
    .test('procedure-required', 'Procedure is required', (value: any) => Boolean(value)),
  surgeon: yup
    .mixed()
    .nullable()
    .test('surgeon-required', 'Surgeon is required', (value: any) => Boolean(value)),
  typeOfSurgery: yup.string().trim().required('Type of surgery is required'),
  surgicalApproach: yup.string().trim().required('Surgical approach is required'),
  duration: yup.string().trim().required('Duration is required'),
  complication: yup.string().required('Complication is required')
})

const AddSurgeryRecord = () => {
  // Suppress MUI InputBase warning for ControlledSelectWithTextField in AddAnesthesiaRecordDrawer
  useEffect(() => {
    const originalWarn = console.warn
    console.warn = (...args: any[]) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('There are multiple `InputBase` components inside a FormControl')
      ) {
        return
      }
      originalWarn(...args)
    }

    return () => {
      console.warn = originalWarn
    }
  }, [])

  const router: any = useSafeRouter()
  const { t } = useTranslation()
  const theme: any = useTheme()
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
  const [patientData, setPatientData] = useState<any>(null)

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
  const formResolver = useMemo(
    () => yupResolver(schema, { context: { patientData, admissionDateTime } as any }),
    [patientData, admissionDateTime]
  )

  const {
    control,
    handleSubmit,
    reset,
    clearErrors,
    setValue,
    trigger,
    watch,
    formState: { errors, isDirty }
  } = useForm<any>({
    resolver: formResolver as any,
    mode: 'onChange',
    reValidateMode: 'onChange',
    context: { patientData },
    defaultValues: defaultFormValues
  })

  const [openAddanesthesiaDrawer, setOpenAddanesthesiaDrawer] = useState<boolean>(false)
  const [openSelectAnesthesiaDrawer, setOpenSelectAnesthesiaDrawer] = useState<boolean>(false)
  const [selectedAnesthesiaRecord, setSelectedAnesthesiaRecord] = useState<any>(null)
  const [editingAnesthesiaRecordId, setEditingAnesthesiaRecordId] = useState<string>('')
  const [initialAnesthesiaRecord, setInitialAnesthesiaRecord] = useState<any>(null)
  const [pendingAnesthesiaRecord, setPendingAnesthesiaRecord] = useState<any>(null)
  const [anesthesiaRecordJustAdded, setAnesthesiaRecordJustAdded] = useState<boolean>(false)
  const [anesthesiaRefetchTrigger, setAnesthesiaRefetchTrigger] = useState<number>(0)
  const [richNote, setRichNote] = useState<any>('')
  const [initialRichNote, setInitialRichNote] = useState<any>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [prefillDetail, setPrefillDetail] = useState<any>(null)
  const [procedureSearchTerm, setProcedureSearchTerm] = useState<string>('')
  const [searchAttendDoctor, setSearchAttendDoctor] = useState<string>('')
  const [openAddSurgeryDrawer, setOpenAddSurgeryDrawer] = useState<boolean>(false)
  const [isSurgerySaving, setIsSurgerySaving] = useState<boolean>(false)
  const [localProcedureOptions, setLocalProcedureOptions] = useState<any[]>([])
  const [surgeonSearchTerm, setSurgeonSearchTerm] = useState<string>('')
  const [doctors, setDoctors] = useState<any[]>([])
  const [attendingDoctors, setAttendingDoctors] = useState<any[]>([])
  const [doctorsPage, setDoctorsPage] = useState<number>(1)
  const [hasMoreDoctors, setHasMoreDoctors] = useState<boolean>(true)
  const [doctorsLoading, setDoctorsLoading] = useState<boolean>(false)
  const [careInstructionsExpanded, setCareInstructionsExpanded] = useState<boolean>(false)
  const [formResetKey, setFormResetKey] = useState<number>(0)
  const [showNavWarning, setShowNavWarning] = useState<boolean>(false)
  const [staffLoading, setStaffLoading] = useState<boolean>(false)
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null)
  const [selectedAttendingDoctors, setSelectedAttendingDoctors] = useState<any[]>([])
  const [paginationModel, setPaginationModel] = useState<any>({
    page: 0,
    pageSize: 10
  })

  const [pendingRoute, setPendingRoute] = useState<any>(null)
  const isNavigatingRef = useRef<boolean>(false)
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

  const { selectedHospital } = useHospital() as any

  const parseUtcDateToLocalDayjs = useCallback((value: any) => {
    if (!value) return null

    const localDate = Utility.convertUTCToLocalDate(value)

    return dayjs(localDate && localDate !== 'Invalid date' ? localDate : value)
  }, [])

  useEffect(() => {
    if (selectedDate) {
      trigger('startTime')
    }
  }, [selectedDate, trigger]) //time validation dependent on date field

  const convertUtcTimeToLocalString = useCallback((dateValue: any, timeValue: any): any => {
    if (!timeValue) return null

    const baseDate = dateValue || dayjs().format('YYYY-MM-DD')
    const source = `${baseDate} ${timeValue}`
    const converted = Utility.convertUTCToLocaltime(source)

    return converted && converted !== 'Invalid date' ? converted : timeValue
  }, [])

  const applyPrefillFromRecord = useCallback(
    (detail: any) => {
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
        detail?.secondary_surgeons?.map((item: any) => ({
          label: item.user_full_name,
          value: item.user_id
        })) || []

      setValue('secondarySurgeon', secondarySurgeonOptions)

      setSelectedAttendingDoctors(secondarySurgeonOptions)

      const existingAttachments = Array.isArray(detail?.attachments)
        ? detail.attachments.map((item: any) => ({
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
      setFormResetKey((prev: number) => prev + 1)
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
    setAnesthesiaRecordJustAdded(false)
    setRichNote('')
    setInitialRichNote('')
    setProcedureSearchTerm('')
    setSurgeonSearchTerm('')
    setFormResetKey((prev: number) => prev + 1)
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
      const params: any = {
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
    onError: (error: any) => {
      console.error('Failed to fetch surgeries:', error)
      Toaster({ type: 'error', message: error?.message || t('hospital_module.failed_to_load_surgery_list') })
    }
  } as any)

  const procedureOptions = useMemo(() => {
    const smr: any = surgeryMasterResponse
    const rawSurgeries =
      (Array.isArray(smr?.surgeries) && smr.surgeries) ||
      (Array.isArray(smr?.data?.surgeries) && smr.data.surgeries) ||
      []
    const surgeries = Array.isArray(rawSurgeries) ? rawSurgeries : []

    const unique = new Map()

    ;[...localProcedureOptions, ...surgeries].forEach((item: any) => {
      const option = mapSurgeryToOption(item)

      if (option && !unique.has(option.value)) {
        unique.set(option.value, option)
      }
    })

    return Array.from(unique.values())
  }, [surgeryMasterResponse, localProcedureOptions])

  const getDoctorList = useCallback(async (hospitalId: any, pageNo: number = 1, searchTerm: string = '') => {
    if (!hospitalId) return

    setDoctorsLoading(true)
    try {
      const params: any = {
        hospital_id: hospitalId,
        page_no: pageNo,
        limit: 10,
        is_hospital_chief_doctor: '1'
      }

      if (searchTerm.trim()) {
        params.q = searchTerm.trim()
      }

      const res: any = await getHospitalStaff({ params })
      if (res?.success === true) {
        const data = res?.data

        if (!data?.records?.length) {
          setHasMoreDoctors(pageNo > 1)
          if (pageNo === 1) setDoctors([])
          return
        }

        const mapped = data.records.map((item: any) => ({
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
          setDoctors((prev: any[]) => {
            const merged = [...prev, ...mapped]
            return Array.from(new Map(merged.map((item: any) => [item.id, item])).values())
          })
        }

        setHasMoreDoctors(data.current_page < data.total_pages)
        setDoctorsPage(data.current_page)
      }
    } catch (e) {
      console.error(e)
      Toaster({ type: 'error', message: t('hospital_module.failed_to_load_doctors') })
    } finally {
      setDoctorsLoading(false)
    }
  }, []) // Empty dependency array for useCallback as it's a stable function definition

  const getStaffList = async (searchTerm: string = '') => {
    try {
      if (!selectedHospital?.id) return

      const params: any = {
        page_no: 1,
        limit: 10,
        hospital_id: selectedHospital.id
      }

      if (searchTerm.trim()) {
        params.q = searchTerm.trim()
      }

      const response: any = await getHospitalStaff({ params })

      if (response?.success && response?.data?.records) {
        const mappedData = response.data.records.map((item: any) => ({
          value: String(item.user_id),
          label: item.user_full_name
        }))

        setAttendingDoctors(mappedData)
      }
    } catch (error: any) {
      console.error('Error fetching hospital staff:', error?.message)
    } finally {
      setStaffLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedHospital?.id) return

    getStaffList(debouncedAttendingDoctorSearch)
  }, [debouncedAttendingDoctorSearch, selectedHospital?.id])

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

    setSelectedAttendingDoctors((prev: any[]) => {
      const updated = prev.filter((attendingDoctor: any) => String(attendingDoctor.value) !== String(selectedDoctor.value))

      setValue('secondarySurgeon', updated)

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

  const handleSurgeonSelect = (doctor: any) => {
    setSelectedDoctor(doctor)
    clearErrors('surgeon')
  }

  const surgeonOptions = useMemo(() => {
    return doctors.map((d: any) => ({
      label: d.name,
      value: d.id,
      is_hospital_chief_doctor: d.is_hospital_chief_doctor === '1'
    }))
  }, [doctors])
  const doctorOptions = doctors

  const filteredAttendingDoctors = useMemo(() => {
    if (!selectedDoctor?.value) return attendingDoctors

    return attendingDoctors.filter(
      (doctor: any) =>
        String(doctor.value) !== String(selectedDoctor.value) &&
        !selectedAttendingDoctors?.some((secondary: any) => String(secondary.value) === String(doctor.value))
    )
  }, [attendingDoctors, selectedDoctor, selectedAttendingDoctors])

  useEffect(() => {
    if (!isEditMode || !resolvedHospitalCaseId || !surgeryRecordId) return

    let isMounted = true

    const fetchSurgeryRecord = async () => {
      try {
        const response: any = await getPatientSurgeryList({ params: { hospital_case_id: resolvedHospitalCaseId } as any })
        const records = Array.isArray(response?.data?.surgery_records) ? response.data.surgery_records : []
        const match = records.find((record: any) => getSurgeryRecordIdentifier(record) === String(surgeryRecordId))

        if (!isMounted) return

        if (match) {
          applyPrefillFromRecord(match?.detail || match)
        } else {
          Toaster({ type: 'error', message: t('hospital_module.surgery_record_not_found') })
        }
      } catch (error: any) {
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
        const response: any = await getPatientDetails(resolvedHospitalCaseId)

        if (!isMounted) return

        if (response?.success) {
          setPatientData(response.data)
        } else {
          setPatientData(null)
          Toaster({ type: 'error', message: response?.message || t('hospital_module.failed_to_load_patient_details') })
        }
      } catch (error: any) {
        if (!isMounted) return

        console.error('Failed to fetch patient details:', error)
        Toaster({ type: 'error', message: error?.message || t('hospital_module.failed_to_load_patient_details') })
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

  const minTime = useMemo(() => {
    if (!patientData?.admitted_at || !selectedDate) return null

    const admitted = dayjs.utc(patientData.admitted_at).local()

    if (dayjs(selectedDate).isSame(admitted, 'day')) {
      return dayjs().hour(admitted.hour()).minute(admitted.minute()).second(0)
    }

    return null
  }, [patientData?.admitted_at, selectedDate])

  const maxTime = useMemo(() => {
    if (!patientData?.discharge_at || !selectedDate) return null

    const discharge = dayjs.utc(patientData.discharge_at).local()

    if (dayjs(selectedDate).isSame(discharge, 'day')) {
      const startLimit = discharge.subtract(1, 'hour')

      return dayjs().hour(startLimit.hour()).minute(startLimit.minute()).second(0)
    }
    return null
  }, [patientData?.discharge_at, selectedDate])

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

  const handleClearSelectedAnesthesia = useCallback(() => {
    setSelectedAnesthesiaRecord(null)
    setAnesthesiaRecordJustAdded(false)
  }, [])

  const formatAnesthesiaDateTime = useCallback((value: any) => {
    const dt = value ? dayjs(value) : null
    if (!dt || !dt.isValid()) return '--'

    return dt.format('DD MMM YYYY • hh:mm A')
  }, [])

  const joinNames = useCallback((list: any) => {
    if (!Array.isArray(list)) return '--'

    const names = list.map((item: any) => item?.full_name).filter(Boolean)

    return names.length ? names.join(' , ') : '--'
  }, [])

  const purposeNames = useMemo(() => {
    if (!Array.isArray(selectedAnesthesia?.purpose)) return []

    return selectedAnesthesia.purpose.map((item: any) => item?.name).filter(Boolean)
  }, [selectedAnesthesia?.purpose])

  const handleProcedureInputChange = useCallback((value: any) => {
    if (typeof value === 'string') {
      setProcedureSearchTerm(value)
    } else {
      setProcedureSearchTerm('')
    }
  }, [])

  const handleProcedureClear = useCallback(() => {
    setProcedureSearchTerm('')
  }, [])

  const handleAttendingDoctorInputChange = useCallback((event: any, value: any, reason: any) => {
    if (reason === 'input') {
      setSearchAttendDoctor(value)
    }
  }, [])

  const handleCreateSurgery = useCallback(
    async (values: any) => {
      const formData = new FormData()
      formData.append('surgery_name', values?.surgery_name || '')
      formData.append('description', values?.description || '')
      formData.append('status', values?.status ? 'Active' : 'Inactive')

      setIsSurgerySaving(true)
      try {
        const response: any = await addSurgeryMaster(formData)
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
            setLocalProcedureOptions((prev: any[]) => {
              const map = new Map(prev.map((opt: any) => [opt.value, opt]))
              map.set(option.value, option)

              return Array.from(map.values())
            })
            setValue('procedure', option, { shouldValidate: true, shouldDirty: true, shouldTouch: true })
            clearErrors?.('procedure')
          }
          setProcedureSearchTerm('')

          Toaster({
            type: 'success',
            message: t('hospital_module.surgery_added_to_masters_successfully')
          })
          setOpenAddSurgeryDrawer(false)
        } else {
          Toaster({ type: 'error', message: response?.message || t('hospital_module.failed_to_create_surgery') })
        }
      } catch (error: any) {
        console.error('Failed to create surgery:', error)
        Toaster({ type: 'error', message: error?.message || t('hospital_module.failed_to_create_surgery') })
      } finally {
        setIsSurgerySaving(false)
      }
    },
    [clearErrors, setLocalProcedureOptions, setValue, setProcedureSearchTerm]
  )

  const procedureGetOptionLabel = useCallback((option: any) => option?.label || '', [])

  const procedureIsOptionEqualToValue = useCallback((option: any, selected: any) => {
    if (!option || !selected) return false

    const optionId = getSurgeryIdentifier(option)
    const selectedId = getSurgeryIdentifier(selected)

    if (optionId !== '' && selectedId !== '') {
      return String(optionId) === String(selectedId)
    }

    return option?.label === selected?.label
  }, [])

  const handleSurgeonInputChange = useCallback((value: any) => {
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

  const surgeonGetOptionLabel = useCallback((option: any) => option?.label || '', [])

  const surgeonIsOptionEqualToValue = useCallback((option: any, selected: any) => {
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
    setAnesthesiaRecordJustAdded(false)
  }, [selectedAnesthesiaRecord])

  const handleSelectanesthesiaRecord = useCallback(() => {
    setOpenSelectAnesthesiaDrawer(true)
    setAnesthesiaRecordJustAdded(false)
  }, [])

  const handleAnesthesiaCreateSuccess = useCallback(
    (record: any) => {
      if (record) {
        setSelectedAnesthesiaRecord(record)
        setAnesthesiaRecordJustAdded(true)
        setEditingAnesthesiaRecordId('')
        // Trigger refetch of anesthesia records list
        setAnesthesiaRefetchTrigger((prev: number) => prev + 1)
      }
    },
    [setSelectedAnesthesiaRecord]
  )

  const handleAnesthesiaRecordSelect = useCallback((record: any) => {
    setPendingAnesthesiaRecord(record)
  }, [])

  useEffect(() => {
    if (!openAddanesthesiaDrawer && editingAnesthesiaRecordId) {
      setEditingAnesthesiaRecordId('')
    }
  }, [openAddanesthesiaDrawer, editingAnesthesiaRecordId])

  const handleConfirmAnesthesiaRecord = useCallback((record: any) => {
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
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (checkIsDirty() && !isSubmitting) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [checkIsDirty, isSubmitting])

  const onSubmit = async (formValues: any) => {
    if (!resolvedHospitalCaseId) {
      Toaster({ type: 'error', message: t('hospital_module.hospital_case_id_is_missing') })

      return
    }

    const selectedAnesthesiaId = getAnesthesiaIdentifier(selectedAnesthesia)
    if (!selectedAnesthesiaId) {
      Toaster({ type: 'error', message: t('hospital_module.please_select_anesthesia_record') })

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
      ? JSON.stringify(formValues?.secondarySurgeon.map((doc: any) => String(doc.value)))
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
      formValues.attachments.forEach((file: any) => {
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
      const response: any = await addSurgeryRecord(payload)

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
    } catch (error: any) {
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

      <DynamicBreadcrumbs
        sx={{ mb: 0 }}
        lastBreadcrumbLabel={isEditMode ? 'Edit Surgery' : 'Add Surgery' }
      />

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
            <Grid size={{ xs: 12 }}>
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: '20px',
                  letterSpacing: 0,
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                Date and time of surgery
                <Typography sx={{ color: theme.palette.customColors.Error }} variant={'span' as any}>
                  *
                </Typography>
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <ControlledDatePicker
                sx={{
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '4px',
                    height: '56px'
                  }
                }}
                name={'date'}
                label={t('hospital_module.date') as any}
                control={control}
                minDate={minDate as any}
                maxDate={maxDate as any}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <ControlledTimePicker
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '4px',
                    height: '56px'
                  }
                }}
                label={t('hospital_module.start_time') as any}
                name={'startTime'}
                control={control}
                minTime={minTime}
                maxTime={maxTime}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <ControlledTimePicker
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '4px',
                    height: '56px'
                  }
                }}
                name={'endTime'}
                control={control}
                label={t('hospital_module.end_time') as any}
                minTime={minEndTime}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <ControlledTextField
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '4px',
                    height: '56px',
                    backgroundColor: theme.palette.customColors.mdAntzNeutral
                  }
                }}
                name={'duration'}
                label={t('hospital_module.surgery_duration') as any}
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
              <Typography sx={{ color: theme.palette.customColors.Error }} variant={'span' as any}>
                *
              </Typography>
            </Typography>
            <Grid container spacing={'24px'}>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
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
                  label={t('hospital_module.name_of_surgeon') as any}
                  options={surgeonOptions}
                  loading={doctorsLoading}
                  onInputChange={handleSurgeonInputChange}
                  onItemClear={handleSurgeonClear}
                  getOptionLabel={surgeonGetOptionLabel}
                  isOptionEqualToValue={surgeonIsOptionEqualToValue}
                  onChangeOverride={handleSurgeonSelect}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
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
                    } as any
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
                      label={t('hospital_module.name_of_procedure') as any}
                      options={procedureOptions}
                      loading={isProceduresLoading}
                      onInputChange={handleProcedureInputChange}
                      onItemClear={handleProcedureClear}
                      getOptionLabel={procedureGetOptionLabel}
                      isOptionEqualToValue={procedureIsOptionEqualToValue}
                      onChangeOverride={() => clearErrors?.('procedure')}
                      renderOption={(props: any, option: any) => (
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
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                <ControlledTextField
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '4px',
                      height: '56px'
                    }
                  }}
                  name={'typeOfSurgery'}
                  label={t('hospital_module.type_of_surgery') as any}
                  control={control}
                  errors={errors}
                  borderRadius='4px'
                  onChangeOverride={() => clearErrors?.('typeOfSurgery')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                <ControlledTextField
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '4px',
                      height: '56px'
                    }
                  }}
                  name={'surgicalApproach'}
                  label={t('hospital_module.surgical_approach') as any}
                  control={control}
                  errors={errors}
                  borderRadius='4px'
                  onChangeOverride={() => clearErrors?.('surgicalApproach')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12 }}>
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
                      clearOnBlur
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
                        <TextField {...params} label={t('hospital_module.select_attending_vet') as any} placeholder={t('hospital_module.search_and_select') as any} />
                      )}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <TemplateSection
              label={t('hospital_module.enter_surgery_notes') as any}
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
                    label: t('hospital_module.date_and_time_of_anesthesia'),
                    value:
                      // If record was just added, it's already in local time (use formatDateTimeDisplay)
                      // Otherwise, it's from the database in UTC (use convertUTCToLocalDateTime)
                      anesthesiaRecordJustAdded
                        ? Utility.formatDateTimeDisplay(
                            selectedAnesthesia?.anaesthesia_datetime || selectedAnesthesia?.anesthesia_datetime
                          )
                        : Utility.convertUTCToLocalDateTime(
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
                    label: t('hospital_module.anesthetists'),
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
                      purposeNames.map((name: any) => (
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
          {t('hospital_module.attachments')}
        </Typography>

        <ControlledMultiFileUpload
          name='attachments'
          control={control}
          label={t('hospital_module.upload_files') as any}
          maxFiles={0}
          acceptedFileTypes='images,pdf,csv,audio,videos'
        />
      </Card>

      <BottomActionBar
        {...({
          onCancel: handleCancelForm,
          onSubmit: handleSubmit(onSubmit),
          loading: isSubmitting,
          disabled: isSubmitting,
          submitLabel: isSubmitting ? (isEditMode ? 'Updating...' : 'Submitting...') : isEditMode ? 'UPDATE' : 'SAVE',
          cancelLabel: 'RESET',
          cancelBtnStyle: {
            height: '56px',
            minWidth: { xs: '100%', sm: '160px' },
            borderColor: theme.palette.customColors.Outline,
            color: theme.palette.customColors.OnSurfaceVariant,
            fontWeight: 600,
            letterSpacing: 0,
            px: '24px'
          },
          submitBtnStyle: {
            height: '56px',
            minWidth: { xs: '100%', sm: '160px' },
            fontWeight: 600,
            letterSpacing: 0,
            px: '24px'
          }
        } as any)}
      />

      <ConfirmationDialog
        {...({
          dialogBoxStatus: showNavWarning,
          onClose: () => {
            setShowNavWarning(false)
            setPendingRoute(null)
          },
          title: 'Unsaved Changes',
          description: 'Please save your changes before navigating back.',
          confirmAction: handleConfirmNavigation,
          ConfirmationText: 'Discard',
          cancelText: 'Stay',
          icon: 'mdi:alert-circle-outline',
          iconColor: theme.palette.warning.main,
          imgStyle: { backgroundColor: alpha(theme.palette.warning.main, 0.1) }
        } as any)}
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
        refetchTrigger={anesthesiaRefetchTrigger}
      />
    </Box>
  )
}

export default AddSurgeryRecord
