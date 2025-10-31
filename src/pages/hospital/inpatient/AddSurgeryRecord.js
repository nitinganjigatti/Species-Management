import { Breadcrumbs, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
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

const getSurgeryIdentifier = value => {
  if (!value) return ''
  if (typeof value === 'string' || typeof value === 'number') return value

  return value?.value ?? value?.id ?? value?.surgery_id ?? value?.surgeryId ?? ''
}

const formatDateValue = value => (value ? dayjs(value).format('YYYY-MM-DD') : '')

const formatTimeValue = value => (value ? dayjs(value).format('HH:mm:ss') : '')

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
  duration: yup.string().trim().required('Duration is required'),
  complication: yup.string().required('Complication is required')
})

const AddSurgeryRecord = () => {
  const router = useRouter()
  const theme = useTheme()

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
    clearErrors,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      date: null,
      startTime: null,
      endTime: null,
      procedure: null,
      typeOfSurgery: '',
      surgicalApproach: '',
      duration: '',
      notes: '',
      complication: 'None',
      dietInstructions: '',
      restrictions: '',
      additionalNotes: '',
      attachments: []
    }
  })

  const [activeTemplate, setActiveTemplate] = useState('')
  const [openAddAnaesthesiaDrawer, setOpenAddAnaesthesiaDrawer] = useState(false)
  const [openSurgeryTemplateDrawer, setOpenSurgeryTemplateDrawer] = useState(false)
  const [richNote, setRichNote] = useState(() => createEmptyRichTextValue())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [procedureSearchTerm, setProcedureSearchTerm] = useState('')

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

  const surgeryTemplates = useMemo(() => {
    const candidates = [
      surgeryTemplatesResponse,
      surgeryTemplatesResponse?.data,
      surgeryTemplatesResponse?.data?.data,
      surgeryTemplatesResponse?.data?.templates,
      surgeryTemplatesResponse?.templates
    ]

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
  }, [surgeryTemplatesResponse])

  const templateNames = useMemo(() => surgeryTemplates.map(template => template.title), [surgeryTemplates])

  const templateNamesKey = useMemo(() => templateNames.join('|'), [templateNames])

  useEffect(() => {
    if (!templateNames.length) {
      if (activeTemplate) {
        setActiveTemplate('')
      }

      return
    }

    if (!activeTemplate || !templateNames.includes(activeTemplate)) {
      setActiveTemplate(templateNames[0])
    }
  }, [templateNamesKey, activeTemplate, templateNames])

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
          await refetchSurgeryTemplates()

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
    [richNote, refetchSurgeryTemplates]
  )

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
        reset()
        setRichNote(createEmptyRichTextValue())
        setActiveTemplate(templateNames[0] || '')
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
          templates={templateNames}
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
          onSaveTemplate={handleSaveTemplate}
          isSavingTemplate={isSavingTemplate}
          clearFieldErrors={clearErrors}
        />
      </Box>

      <AddAnaesthesiaRecordDrawer
        setOpenAddAnaesthesiaDrawer={setOpenAddAnaesthesiaDrawer}
        openAddAnaesthesiaDrawer={openAddAnaesthesiaDrawer}
      />
      <SurgeryRecordTemplateList
        setOpenSurgeryTemplateDrawer={setOpenSurgeryTemplateDrawer}
        openSurgeryTemplateDrawer={openSurgeryTemplateDrawer}
        templates={surgeryTemplates}
        loading={isTemplatesLoading}
      />
    </Box>
  )
}

export default AddSurgeryRecord
