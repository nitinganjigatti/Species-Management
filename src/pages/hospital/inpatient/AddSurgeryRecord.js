import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'

import { Breadcrumbs, Typography, Card, Box, Avatar, TextField, Button, IconButton, Grid } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { Icon } from '@iconify/react'

import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'

import { getPatientDetails } from 'src/lib/api/hospital/incomingPatient'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import { useAuth } from 'src/hooks/useAuth'
import AddanesthesiaRecordDrawer from 'src/components/hospital/inpatient/AddanesthesiaRecord'
import SelectAnesthesiaRecordDrawer from 'src/components/hospital/inpatient/SelectAnesthesiaRecordDrawer'
import AnimalInfoCard from 'src/views/pages/hospital/inpatient/AnimalInfoCard'
import Toaster from 'src/components/Toaster'
import RichTextEditor from 'src/components/RichTextEditor'
import SurgeryRecordTemplateList from 'src/views/pages/hospital/inpatient/SurgeryRecordTemplateList'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'

import {
  addSurgeryRecord,
  getSurgeryMaster,
  getSurgeryTemplates,
  createSurgeryTemplate
} from 'src/lib/api/hospital/surgeryMaster'

const createEmptyRichTextValue = () => {
  const delta = { ops: [{ insert: '\n' }] }

  return {
    delta,
    html: '<p><br></p>',
    text: '',
    ops: delta.ops
  }
}

const DEFAULT_HOSPITAL_ID = '68'
const TEMPLATE_LIST_LIMIT = 20
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

const stripHtmlTags = input => {
  if (!input) return ''

  return String(input)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const buildRichTextValueFromHtml = html => {
  const safeHtml = typeof html === 'string' ? html : ''
  const finalHtml = safeHtml || '<p><br></p>'

  return {
    html: finalHtml,
    text: stripHtmlTags(finalHtml),
    delta: undefined,
    ops: undefined
  }
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

const mapTemplateRecord = record => {
  if (!record || typeof record !== 'object') return null

  const id = record?.id ?? record?.template_id ?? record?.hospital_template_id ?? record?.value
  const name = record?.template_name ?? record?.name ?? record?.title

  if (!id || !name) return null

  return {
    id: String(id),
    title: String(name).trim(),
    description: record?.description ?? '',
    type: record?.type ?? 'Surgery',
    category: record?.category ?? record?.type ?? 'Surgery',
    raw: record
  }
}

// Save Template UI Component
const SaveTemplateUI = ({ onClose, onSave, loading = false }) => {
  const theme = useTheme()
  const [templateName, setTemplateName] = useState('')

  const handleSave = async () => {
    if (!templateName.trim() || loading) return

    const success = await onSave(templateName.trim())

    if (success) {
      setTemplateName('')
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: { xs: 'start', sm: 'center' },
        gap: '16px',
        flexDirection: { xs: 'column', sm: 'row' }
      }}
    >
      <TextField
        size='small'
        placeholder='Enter template name'
        value={templateName}
        onChange={e => setTemplateName(e.target.value)}
        sx={{
          maxWidth: '413px',
          minWidth: { xs: '100%', sm: '200px' },
          height: '48px',
          flex: 1,
          borderRadius: '4px',
          borderColor: theme.palette.customColors.OutlineVariant,
          backgroundColor: theme.palette.customColors.Surface,
          '& .MuiOutlinedInput-root': {
            height: '48px',
            '& fieldset': {}
          }
        }}
      />
      <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={loading || !templateName.trim()}
          startIcon={
            <Avatar
              src='/icons/FloppyDisk.svg'
              variant='square'
              sx={{
                objectFit: 'contain',
                height: '24px',
                width: '24px',
                filter: 'brightness(0) invert(1)'
              }}
            />
          }
          sx={{
            height: '48px',
            width: '104px',
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            borderRadius: '6px',
            textTransform: 'uppercase',
            fontWeight: 500,
            fontSize: 15,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark
            }
          }}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
        <IconButton
          onClick={onClose}
          sx={{
            color: theme.palette.primary.light,
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.04)'
            }
          }}
        >
          <Icon icon='mdi:close' fontSize={19} />
        </IconButton>
      </Box>
    </Box>
  )
}

const extractSurgeryTemplates = response => {
  const candidates = [response, response?.data, response?.data?.data, response?.data?.templates, response?.templates]

  let records = []
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      records = candidate
      break
    }
  }

  const unique = new Map()

  records.forEach(item => {
    const mapped = mapTemplateRecord(item)

    if (mapped && !unique.has(mapped.id)) {
      unique.set(mapped.id, mapped)
    }
  })

  return Array.from(unique.values())
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

const formatDateValue = value => (value ? dayjs(value).format('YYYY-MM-DD') : '')

const formatTimeValue = value => (value ? dayjs(value).format('HH:mm:ss') : '')

const combineDateAndTime = (dateValue, timeValue) => {
  const date = dayjs(dateValue)
  const time = dayjs(timeValue)

  if (!date.isValid() || !time.isValid()) return null

  return date.hour(time.hour()).minute(time.minute()).second(time.second()).millisecond(0)
}

const resolveHospitalCaseId = query => {
  const possibleKeys = ['hospital_case_id', 'hospitalCaseId', 'case_id', 'caseId', 'hospitalCaseID', 'id']

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
  typeOfSurgery: yup.string().required('Type of surgery is required'),
  surgicalApproach: yup.string().required('Surgical approach is required'),
  duration: yup.string().trim().required('Duration is required'),
  complication: yup.string().required('Complication is required')
})

const AddSurgeryRecord = () => {
  const router = useRouter()
  const theme = useTheme()
  const auth = useAuth()

  const resolvedHospitalCaseId = useMemo(() => resolveHospitalCaseId(router.query), [router.query])
  const medicalRecordId = useMemo(() => {
    const possible = router.query?.medical_record_id || router.query?.medicalRecordId || router.query?.medical_recordId

    return Array.isArray(possible) ? possible[0] : possible || ''
  }, [router.query])
  const [patientData, setPatientData] = useState(null)
  const admissionDateTime = useMemo(
    () => (patientData?.admitted_at ? dayjs(patientData.admitted_at) : null),
    [patientData?.admitted_at]
  )
  const userZooId = useMemo(() => auth?.userData?.user?.zoos?.[0]?.zoo_id, [auth?.userData])
  const defaultNow = useMemo(() => dayjs(), [])
  const defaultFormValues = useMemo(
    () => ({
      date: defaultNow,
      startTime: null,
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
    [defaultNow]
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
    defaultValues: defaultFormValues
  })

  const [activeTemplate, setActiveTemplate] = useState('')
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [openAddanesthesiaDrawer, setOpenAddanesthesiaDrawer] = useState(false)
  const [openSurgeryTemplateDrawer, setOpenSurgeryTemplateDrawer] = useState(false)
  const [openSelectAnesthesiaDrawer, setOpenSelectAnesthesiaDrawer] = useState(false)
  const [selectedAnesthesiaRecord, setSelectedAnesthesiaRecord] = useState(null)
  const [pendingAnesthesiaRecord, setPendingAnesthesiaRecord] = useState(null)
  const [richNote, setRichNote] = useState(() => createEmptyRichTextValue())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [procedureSearchTerm, setProcedureSearchTerm] = useState('')
  const [surgeonSearchTerm, setSurgeonSearchTerm] = useState('')
  const selectedDate = watch('date')
  const startTimeValue = watch('startTime')
  const endTimeValue = watch('endTime')
  const durationValue = watch('duration')
  const selectedAnesthesia = selectedAnesthesiaRecord
  const resetForm = useCallback(() => {
    reset(defaultFormValues)
    setValue('surgeon', null, { shouldValidate: false, shouldDirty: false, shouldTouch: false })
    setValue('procedure', null, { shouldValidate: false, shouldDirty: false, shouldTouch: false })
    setSelectedAnesthesiaRecord(null)
    setPendingAnesthesiaRecord(null)
    setRichNote(createEmptyRichTextValue())
    setActiveTemplate('')
    setProcedureSearchTerm('')
    setSurgeonSearchTerm('')
  }, [
    reset,
    defaultFormValues,
    setValue,
    setSelectedAnesthesiaRecord,
    setPendingAnesthesiaRecord,
    setRichNote,
    setActiveTemplate,
    setProcedureSearchTerm,
    setSurgeonSearchTerm
  ])

  useEffect(() => {
    setValue('surgeon', null, { shouldValidate: false, shouldDirty: false })
    setValue('procedure', null, { shouldValidate: false, shouldDirty: false })
  }, [setValue])

  const {
    data: surgeryTemplatesResponse,
    isFetching: isTemplatesLoading,
    refetch: refetchSurgeryTemplates
  } = useQuery({
    queryKey: ['hospital-surgery-templates', DEFAULT_HOSPITAL_ID],
    queryFn: () =>
      getSurgeryTemplates({
        page_no: 1,
        hospital_id: DEFAULT_HOSPITAL_ID,
        limit: TEMPLATE_LIST_LIMIT,
        type: 'surgery'
      }),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
    retry: false,
    onError: error => {
      console.error('Failed to fetch surgery templates:', error)
      Toaster({ type: 'error', message: error?.message || 'Failed to load surgery templates' })
    }
  })

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

    surgeries.forEach(item => {
      const option = mapSurgeryToOption(item)

      if (option && !unique.has(option.value)) {
        unique.set(option.value, option)
      }
    })

    return Array.from(unique.values())
  }, [surgeryMasterResponse])

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

  const surgeryTemplates = useMemo(() => extractSurgeryTemplates(surgeryTemplatesResponse), [surgeryTemplatesResponse])

  const templateNames = useMemo(() => surgeryTemplates.map(template => template.title), [surgeryTemplates])

  const templateNamesKey = useMemo(() => templateNames.join('|'), [templateNames])

  useEffect(() => {
    if (!activeTemplate) return

    if (!templateNames.includes(activeTemplate)) {
      setActiveTemplate('')
    }
  }, [activeTemplate, templateNames, templateNamesKey])

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

  const applyTemplateToRichNote = useCallback(
    template => {
      if (!template) return

      const safeTitle = template?.title ? String(template.title) : ''
      const html = typeof template?.description === 'string' ? template.description : ''
      const richValue = buildRichTextValueFromHtml(html)

      setActiveTemplate(safeTitle)
      setRichNote(prev => {
        if (prev?.html === richValue.html) {
          return prev
        }

        return richValue
      })
    },
    [setRichNote, setActiveTemplate]
  )

  const handleTemplateSelect = useCallback(
    templateName => {
      const safeName = templateName ? String(templateName) : ''

      if (!safeName) {
        setActiveTemplate('')

        return
      }

      const matchedTemplate = surgeryTemplates.find(template => template.title === safeName)

      if (matchedTemplate) {
        applyTemplateToRichNote(matchedTemplate)
      } else {
        setActiveTemplate(safeName)
      }
    },
    [surgeryTemplates, applyTemplateToRichNote, setActiveTemplate]
  )

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

  const handleSaveTemplate = useCallback(
    async templateName => {
      const trimmedName = templateName?.trim()

      if (!trimmedName) {
        Toaster({ type: 'error', message: 'Template name is required' })

        return false
      }

      const payload = new FormData()
      payload.append('template_name', trimmedName)
      payload.append('type', 'surgery')
      payload.append('hospital_id', DEFAULT_HOSPITAL_ID)
      payload.append('description', getSafeString(getRichTextHtml(richNote)))

      setIsSavingTemplate(true)

      try {
        const response = await createSurgeryTemplate(payload)

        if (response?.success) {
          Toaster({ type: 'success', message: response?.message || 'Template saved successfully' })
          setActiveTemplate(trimmedName)

          const refetchResult = await refetchSurgeryTemplates()
          const refreshedTemplates = extractSurgeryTemplates(refetchResult?.data)
          const newTemplate = refreshedTemplates.find(template => template.title === trimmedName)

          if (newTemplate) {
            applyTemplateToRichNote(newTemplate)
          }

          return true
        }

        Toaster({ type: 'error', message: response?.message || 'Failed to save template' })

        return false
      } catch (error) {
        console.error('Create surgery template error:', error)
        const message = error?.response?.data?.message || error?.message || 'An unexpected error occurred'
        Toaster({ type: 'error', message })

        return false
      } finally {
        setIsSavingTemplate(false)
      }
    },
    [richNote, refetchSurgeryTemplates, applyTemplateToRichNote]
  )

  const handleSaveTemplateInline = useCallback(
    async templateName => {
      const success = await handleSaveTemplate(templateName)

      if (success) {
        setShowSaveTemplate(false)
      }

      return success
    },
    [handleSaveTemplate, setShowSaveTemplate]
  )

  const handleAddNewanesthesia = useCallback(() => {
    setOpenAddanesthesiaDrawer(true)
  }, [setOpenAddanesthesiaDrawer])

  const handleSelectanesthesiaRecord = useCallback(() => {
    setOpenSelectAnesthesiaDrawer(true)
  }, [])

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
    payload.append('anaesthesia_id', getSafeString(selectedAnesthesiaId))
    payload.append('surgery_date', getSafeString(formatDateValue(formValues.date)))
    payload.append('start_time', getSafeString(formatTimeValue(formValues.startTime)))
    payload.append('end_time', getSafeString(formatTimeValue(formValues.endTime)))

    const surgeryId = getSurgeryIdentifier(formValues.procedure)

    payload.append('surgery_id', getSafeString(surgeryId))
    payload.append('type_of_surgery', getSafeString(formValues.typeOfSurgery))
    payload.append('surgical_approach', getSafeString(formValues.surgicalApproach))
    payload.append('surgeon_name', getSafeString(getAutocompleteLabel(formValues.surgeon)))
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
        }
      })
    }

    setIsSubmitting(true)

    try {
      const response = await addSurgeryRecord(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Surgery record added successfully' })
        resetForm()
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to add surgery record' })
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
          Add Surgery
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
            Add Surgery Record
          </Typography>
        </Box>

        {patientData ? (
          <AnimalInfoCard data={animalInfoData} />
        ) : (
          <Card
            sx={{
              p: '24px',
              borderRadius: '8px',
              backgroundColor: theme.palette.customColors.displaybgPrimary,
              boxShadow: 'none'
            }}
          >
            <Grid container spacing={5} sx={{ alignItems: 'center' }}>
              <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
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
              </Grid>
              {[1, 2, 3, 4].map(idx => (
                <Grid item size={{ xs: 12, sm: 4, md: 2.25 }} key={`animal-skeleton-${idx}`} sx={{ mt: 2 }}>
                  <Box sx={{ width: '60%', height: '16px', borderRadius: '4px', backgroundColor: '#E6E6E6', mb: 1 }} />
                  <Box sx={{ width: '80%', height: '18px', borderRadius: '4px', backgroundColor: '#E0E0E0' }} />
                </Grid>
              ))}
            </Grid>
          </Card>
        )}
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
                    height: '56px'
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
                  label='Name of Procedure'
                  options={procedureOptions}
                  loading={isProceduresLoading}
                  onInputChange={handleProcedureInputChange}
                  onItemClear={handleProcedureClear}
                  getOptionLabel={procedureGetOptionLabel}
                  isOptionEqualToValue={procedureIsOptionEqualToValue}
                  onChangeOverride={() => clearErrors?.('procedure')}
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

            <Box
              sx={{
                backgroundColor: alpha(theme.palette.customColors.displaybgPrimary, 102 / 255),
                padding: '20px',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: '16px',
                    letterSpacing: 0,
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  Enter surgery notes
                </Typography>

                <RichTextEditor value={richNote} onChange={setRichNote} placeholder='Enter text...' />
              </Box>

              {showSaveTemplate ? (
                <SaveTemplateUI
                  onClose={() => setShowSaveTemplate(false)}
                  onSave={handleSaveTemplateInline}
                  loading={isSavingTemplate}
                />
              ) : (
                <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center', mb: '8px', cursor: 'pointer' }}>
                  <Avatar
                    src='/icons/FloppyDisk.svg'
                    variant='square'
                    sx={{ objectFit: 'contain', height: '24px', width: '24px' }}
                  />
                  <Typography
                    onClick={() => setShowSaveTemplate(true)}
                    sx={{
                      fontWeight: 600,
                      fontSize: '16px',
                      letterSpacing: 0,
                      color: theme.palette.primary.dark
                    }}
                  >
                    Save as template
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography
                    sx={{
                      fontWeight: 400,
                      fontSize: '16px',
                      letterSpacing: 0,
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    Select from templates
                  </Typography>
                  <Box
                    onClick={() => setOpenSurgeryTemplateDrawer(true)}
                    sx={{ display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <Typography sx={{ color: theme.palette.primary.dark }}>See all</Typography>
                    <Icon icon='fa:angle-right' color={theme.palette.primary.dark} fontSize={24} />
                  </Box>
                </Box>
                <Box
                  sx={{
                    flex: '1 1 auto',
                    minWidth: 0,
                    overflowX: 'auto',
                    scrollbarColor: 'transparent transparent'
                  }}
                >
                  <Box sx={{ display: 'inline-flex', gap: '10px', pr: 1 }}>
                    {isTemplatesLoading
                      ? Array.from({ length: 3 }).map((_, idx) => (
                          <Box
                            key={`template-skel-${idx}`}
                            sx={{
                              width: 100,
                              height: 40,
                              borderRadius: '8px',
                              backgroundColor: theme.palette.customColors.mdAntzNeutral
                            }}
                          />
                        ))
                      : templateNames.map(template => {
                          const templateLabel = typeof template === 'string' ? template : String(template || '')
                          if (!templateLabel) {
                            return null
                          }
                          return (
                            <Box
                              key={templateLabel}
                              onClick={() => handleTemplateSelect(templateLabel)}
                              sx={{
                                flexShrink: 0,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                p: '8px 24px',
                                height: '40px',
                                borderRadius: '8px',
                                backgroundColor:
                                  activeTemplate === templateLabel
                                    ? theme.palette.secondary.dark
                                    : theme.palette.customColors.mdAntzNeutral,
                                cursor: 'pointer'
                              }}
                            >
                              <Typography
                                sx={{
                                  color:
                                    activeTemplate === templateLabel
                                      ? theme.palette.primary.contrastText
                                      : theme.palette.customColors.neutralPrimary,
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {templateLabel}
                              </Typography>
                            </Box>
                          )
                        })}
                  </Box>
                </Box>
              </Box>
            </Box>

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
                sx={{
                  backgroundColor: theme.palette.primary.light,
                  width: 141,
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
                    value: formatAnesthesiaDateTime(selectedAnesthesia?.anesthesia_datetime)
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
          zIndex: 5,
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
          CANCEL
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
          {isSubmitting ? 'Submitting...' : 'SAVE'}
        </Button>
      </Box>

      <AddanesthesiaRecordDrawer
        setOpenAddanesthesiaDrawer={setOpenAddanesthesiaDrawer}
        openAddanesthesiaDrawer={openAddanesthesiaDrawer}
        hospitalCaseId={resolvedHospitalCaseId}
        medicalRecordId={medicalRecordId}
        vetOptions={doctorOptions}
        anesthetistOptions={doctorOptions}
        patientData={patientData}
        animalInfoData={animalInfoData}
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
      <SurgeryRecordTemplateList
        setOpenSurgeryTemplateDrawer={setOpenSurgeryTemplateDrawer}
        openSurgeryTemplateDrawer={openSurgeryTemplateDrawer}
        templates={surgeryTemplates}
        loading={isTemplatesLoading}
        onApplyTemplate={applyTemplateToRichNote}
      />
    </Box>
  )
}

export default AddSurgeryRecord
