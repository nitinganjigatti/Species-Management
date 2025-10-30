import { Breadcrumbs, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import AddAnaesthesiaRecordDrawer from 'src/components/hospital/inpatient/AddAnaesthesiaRecord'
import SurgeryRecordForm from 'src/components/hospital/inpatient/SurgeryRecordForm'
import SurgeryRecordTemplateList from 'src/views/pages/hospital/inpatient/SurgeryRecordTemplateList'
import AnimalInfoCard from 'src/views/pages/hospital/inpatient/AnimalInfoCard'
import Toaster from 'src/components/Toaster'
import { addSurgeryRecord, getSurgeryMaster } from 'src/lib/api/hospital/surgeryMaster'

const createEmptyRichTextValue = () => ({ ops: [{ insert: '\n' }] })

const getSafeString = value => {
  if (value === undefined || value === null) return ''

  return String(value)
}

const extractPlainTextFromDelta = note => {
  if (!note) return ''
  if (typeof note === 'string') return note

  if (Array.isArray(note?.ops)) {
    return note.ops
      .map(op => {
        if (typeof op?.insert === 'string') return op.insert

        return ''
      })
      .join('')
      .trim()
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

const formatDateValue = value => (value ? dayjs(value).format('YYYY-MM-DD') : '')

const formatTimeValue = value => (value ? dayjs(value).format('HH:mm:ss') : '')

const resolveHospitalCaseId = query => {
  const possibleKeys = ['hospital_case_id', 'hospitalCaseId', 'case_id', 'caseId', 'hospitalCaseID']

  for (const key of possibleKeys) {
    if (query?.[key] !== undefined) {
      const value = query[key]

      return Array.isArray(value) ? value[0] : value
    }
  }

  return undefined
}

// ✅ Validation schema
const schema = yup.object().shape({
  date: yup.date().required('Date is required'),
  startTime: yup.date().required('Start time is required'),
  endTime: yup.date().required('End time is required'),
  procedure: yup
    .mixed()
    .nullable()
    .test('procedure-required', 'Procedure is required', value => Boolean(value)),
  typeOfSurgery: yup.string().required('Type of surgery is required'),
  surgicalApproach: yup.string().required('Surgical approach is required'),
  // notes: yup.string().required('Surgery notes are required'),
  complication: yup.string().required('Complication is required')
  // dietInstructions: yup.string().required('Diet instructions are required'),
  // restrictions: yup.string().required('Restriction activities are required'),
  // additionalNotes: yup.string().required('Additional notes are required')
})

const AddSurgeryRecord = () => {
  const router = useRouter()
  const theme = useTheme()

  const templates = [
    'appendix surgery',
    'ovariohysterectomy',
    'ovariohysterectomies',
    'ovariohysterect',
    'hernia repair',
    'spay surgery',
    'neuter surgery',
    'orthopedic surgery',
    'soft tissue surgery',
    'dental extraction',
    'tumor removal',
    'eye surgery',
    'ear surgery',
    'cesarean section',
    'fracture repair',
    'wound closure',
    'foreign body removal',
    'skin graft',
    'joint surgery',
    'biopsy'
  ]

  const data = {
    animal: {
      common_name: 'Leopard',
      scientific_name: 'Panthera pardus',
      age: '2y 5m',
      sex: 'Male',
      image_url: 'path/to/leopard_image.jpg'
    },
    additional_info: {
      AID: '123456',
      'Admitted Days': '6 Days',
      Location: 'Cage 1, Patient Wing 2',
      'Consulting Veterinarian': 'Dr. Nitin A Ganjigatti'
    }
  }

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      date: null,
      startTime: null,
      endTime: null,
      procedure: null,
      typeOfSurgery: '',
      surgicalApproach: '',
      notes: '',
      complication: 'None',
      dietInstructions: '',
      restrictions: '',
      additionalNotes: '',
      attachment: null
    }
  })

  const [activeTemplate, setActiveTemplate] = useState(templates[0])
  const [openAddAnaesthesiaDrawer, setOpenAddAnaesthesiaDrawer] = useState(false)
  const [openSurgeryTemplateDrawer, setOpenSurgeryTemplateDrawer] = useState(false)
  const [richNote, setRichNote] = useState(() => createEmptyRichTextValue())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [procedureSearchTerm, setProcedureSearchTerm] = useState('')

  const {
    data: surgeryMasterResponse,
    isFetching: isProceduresLoading
  } = useQuery({
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

  const onSubmit = async formValues => {
    const hospitalCaseId = resolveHospitalCaseId(router.query)

    if (!hospitalCaseId) {
      Toaster({ type: 'error', message: 'Hospital case id is missing' })

      return
    }

    const payload = new FormData()

    payload.append('hospital_case_id', getSafeString(hospitalCaseId))
    payload.append('surgery_date', getSafeString(formatDateValue(formValues.date)))
    payload.append('start_time', getSafeString(formatTimeValue(formValues.startTime)))
    payload.append('end_time', getSafeString(formatTimeValue(formValues.endTime)))

    const surgeryId = getSurgeryIdentifier(formValues.procedure)

    payload.append('surgery_id', getSafeString(surgeryId))
    payload.append('type_of_surgery', getSafeString(formValues.typeOfSurgery))
    payload.append('surgical_approach', getSafeString(formValues.surgicalApproach))
    payload.append('surgery_notes', getSafeString(extractPlainTextFromDelta(richNote)))
    payload.append('complications', getSafeString(formValues.complication))
    payload.append('care_diet_instructions', getSafeString(formValues.dietInstructions))
    payload.append('care_activity_restrictions', getSafeString(formValues.restrictions))
    payload.append('additional_notes', getSafeString(formValues.additionalNotes))

    if (formValues.attachment) {
      payload.append('attachments[]', formValues.attachment)
    }

    setIsSubmitting(true)

    try {
      const response = await addSurgeryRecord(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Surgery record added successfully' })
        reset()
        setRichNote(createEmptyRichTextValue())
        setActiveTemplate(templates[0])
        setProcedureSearchTerm('')
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
      <Typography
        sx={{ fontWeight: 500, fontSize: '24px', letterSpacing: 0, color: theme.palette.customColors.OnSurfaceVariant }}
      >
        Add Surgery Record Page
      </Typography>

      <AnimalInfoCard data={data} />
      <Box
        sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
        component='form'
        onSubmit={handleSubmit(onSubmit)}
      >
        <SurgeryRecordForm
          control={control}
          errors={errors}
          templates={templates}
          activeTemplate={activeTemplate}
          setActiveTemplate={setActiveTemplate}
          setOpenSurgeryTemplateDrawer={setOpenSurgeryTemplateDrawer}
          setOpenAddAnaesthesiaDrawer={setOpenAddAnaesthesiaDrawer}
          richNote={richNote}
          onRichNoteChange={setRichNote}
          isSubmitting={isSubmitting}
          procedureOptions={procedureOptions}
          procedureLoading={isProceduresLoading}
          onProcedureInputChange={handleProcedureInputChange}
          onProcedureClear={handleProcedureClear}
          procedureGetOptionLabel={procedureGetOptionLabel}
          procedureIsOptionEqualToValue={procedureIsOptionEqualToValue}
        />
      </Box>

      <AddAnaesthesiaRecordDrawer
        setOpenAddAnaesthesiaDrawer={setOpenAddAnaesthesiaDrawer}
        openAddAnaesthesiaDrawer={openAddAnaesthesiaDrawer}
      />
      <SurgeryRecordTemplateList
        setOpenSurgeryTemplateDrawer={setOpenSurgeryTemplateDrawer}
        openSurgeryTemplateDrawer={openSurgeryTemplateDrawer}
      />
    </Box>
  )
}

export default AddSurgeryRecord
