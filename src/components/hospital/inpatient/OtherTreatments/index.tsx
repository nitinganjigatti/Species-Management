'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Avatar, Box, Button, Skeleton, Tooltip, Typography } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'

import dayjs from 'dayjs'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'

import UserInfoCard from 'src/views/utility/insights/UserInfoCard'
import DialogConfirmationDialog from 'src/views/utility/DeleteConfirmationDialog'
import Toaster from 'src/components/Toaster'
import Utility from 'src/utility'
import AddTreatmentDrawer from './AddTreatmentDrawer'
import EditTreatmentDrawer from './EditTreatmentDrawer'
import NoMedicalData from 'src/views/utility/NoMedicalData'

import {
  createTreatmentRecord,
  getTreatmentMasterList,
  getTreatmentList,
  updateTreatmentRecord,
  deleteTreatmentRecord
} from 'src/lib/api/hospital/treatmentMaster'

const TREATMENT_DATE_TIME_FORMAT = 'DD MMM YYYY HH:mm:ss'

const formatTimestamp = (isoString: any) => {
  if (!isoString) return '-'

  const timePart = (Utility as any).convertUTCToLocaltime(isoString)
  const datePart = (Utility as any).convertUtcToLocalReadableDate(isoString)
  const safeTime = timePart && timePart !== 'Invalid date' ? timePart : ''
  const safeDate = datePart && datePart !== 'Invalid date' ? datePart : ''

  if (safeTime && safeDate) {
    return `${safeDate} • ${safeTime}`
  }

  return safeTime || safeDate || '-'
}

const formatClinicianTimestamp = (isoString: any) => {
  if (!isoString) return ''

  const timePart = (Utility as any).convertUTCToLocaltime(isoString)
  const datePart = (Utility as any).convertUtcToLocalReadableDate(isoString)
  const safeTime = timePart && timePart !== 'Invalid date' ? timePart : ''
  const safeDate = datePart && datePart !== 'Invalid date' ? datePart : ''

  if (safeTime && safeDate) {
    return `${safeDate} • ${safeTime}`
  }

  return safeTime || safeDate || ''
}

const formatShortDate = (isoString: any) => {
  if (!isoString) return '-'

  const formatted = (Utility as any).convertUtcToLocalReadableDate(isoString)

  return formatted && formatted !== 'Invalid date' ? formatted : '-'
}

const getApiRecords = (response: any) => {
  if (Array.isArray(response?.data?.records)) return response.data.records

  return []
}

const parseNotesCount = (value: any) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : null
}

const extractTreatmentEntries = (record: any) => {
  if (Array.isArray(record?.treatments) && record.treatments.length) return record.treatments
  if (record?.treatment_name) return [record]

  return []
}

const mapTreatmentEntry = (entry: any, index: number = 0): any => {
  if (!entry) return null

  const noteText = entry.note?.toString().trim() || ''
  const notesCount = parseNotesCount(entry.notes_count)
  const lastUpdated = entry.update_at || entry.created_at || null

  return {
    id: entry.id || entry.treatment_master_id || `${entry.medical_record_id || 'treatment'}-${index}`,
    name: entry.treatment_name || '-',
    noteCount: notesCount ?? (noteText ? 1 : 0),
    noteSummary: noteText || '',
    lastUpdated,
    treatment_start_date_time: entry.treatment_start_date_time,
    clinician: {
      name: entry.created_by_name || '—',
      avatarUrl: entry.profile_pic || '',
      createdAt: entry.created_at || '',
      updatedAt: entry.updated_at || ''
    },
    animalId: entry.animal_id || null,
    medicalRecordId: entry.medical_record_id || null,
    medicalRecordCode: entry.medical_record_code || '',
    treatmentMasterId: entry.treatment_master_id || null,
    hospitalCaseId: entry.hospital_case_id || null,
    notes_count: notesCount,
    isModified: entry.is_modified,
    record: { ...entry },
    updatedAt: entry.update_at
  }
}

const mapRecordsToGroups = (records: any[] = []) => {
  if (!records.length) return []

  return records
    .map((record: any, index: number) => {
      const treatments = extractTreatmentEntries(record).map((t: any, i: number) => mapTreatmentEntry(t, i)).filter(Boolean)

      if (!treatments.length) return null

      return {
        id: record.medical_record_id || record.medical_record_code || record.id || `medical-record-${index}`,
        code: record.medical_record_code
          ? record.medical_record_code
          : record.medical_record_name || record.title || 'Medical Record',
        icon: record.icon || 'mdi:medical-bag-outline',
        treatments
      }
    })
    .filter(Boolean)
}

const mapDetailRecordsToActivities = (records: any[] = []) => {
  const treatmentEntries = records.flatMap(extractTreatmentEntries)
  if (!treatmentEntries.length) return []

  return treatmentEntries.map((entry: any, index: number) => {
    const note = entry.note || ''
    const timestamp = entry.update_at || entry.created_at || null
    const isInitial = String(entry.is_first) === '1'

    return {
      id: entry.id || entry.treatment_master_id || `${entry.medical_record_id || 'activity'}-${index}`,
      treatmentId: entry.id || null,
      treatmentMasterId: entry.treatment_master_id || null,
      treatmentName: entry.treatment_name || '',
      author: entry.created_by_name || '—',
      clinician: {
        name: entry.created_by_name || '—',
        avatarUrl: entry.profile_pic || ''
      },
      timestamp,
      treatmentStartDate: entry.start_time || entry.created_at || null,
      treatment_start_date_time: entry.treatment_start_date_time,
      notes: note,
      description: note,
      note,
      status: isInitial ? 'initial' : 'update',
      isFirst: isInitial,
      isEditable: !isInitial,
      medicalRecordCode: entry.medical_record_code || '',
      record: entry
    }
  })
}

interface OtherTreatmentProps {
  animalId?: any
  medicalRecordId?: any
  hospitalCaseId?: any
  patientDischarged?: boolean
  patientData?: any
}

const OtherTreatment = ({ animalId, medicalRecordId, hospitalCaseId, patientDischarged = false, patientData }: OtherTreatmentProps) => {
  const { t } = useTranslation()
  const theme: any = useTheme()
  const [isAddDrawerOpen, setAddDrawerOpen] = useState<boolean>(false)
  const [isEditDrawerOpen, setEditDrawerOpen] = useState<boolean>(false)

  const getDefaultStartDate = () => {
    return patientData?.discharge_at ? dayjs(patientData.discharge_at) : dayjs()
  }

  const [formData, setFormData] = useState<any>({
    startDate: getDefaultStartDate(),
    treatmentName: null,
    notes: ''
  })

  const [editFormData, setEditFormData] = useState<any>({
    startDate: getDefaultStartDate(),
    notes: '',
    activeActivityId: null
  })
  const [selectedTreatment, setSelectedTreatment] = useState<any>(null)
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
  const [treatmentGroups, setTreatmentGroups] = useState<any[]>([])
  const [treatmentOptions, setTreatmentOptions] = useState<any[]>([])
  const [treatmentOptionsLoading, setTreatmentOptionsLoading] = useState<boolean>(false)
  const [treatmentSearchTerm, setTreatmentSearchTerm] = useState<string>('')
  const [isCreatingTreatment, setIsCreatingTreatment] = useState<boolean>(false)
  const [isAddingTreatmentNote, setIsAddingTreatmentNote] = useState<boolean>(false)
  const [isTreatmentsLoading, setTreatmentsLoading] = useState<boolean>(false)
  const [treatmentInputValue, setTreatmentInputValue] = useState<string>('')
  const [selectedTreatmentActivities, setSelectedTreatmentActivities] = useState<any[]>([])
  const [isTreatmentActivitiesLoading, setTreatmentActivitiesLoading] = useState<boolean>(false)
  const [isUpdatingTreatment, setIsUpdatingTreatment] = useState<boolean>(false)
  const [isDeletingTreatment, setIsDeletingTreatment] = useState<boolean>(false)

  const closeEditDrawer = useCallback(() => {
    setEditDrawerOpen(false)
    setSelectedTreatmentActivities([])
    setSelectedTreatment(null)
    setEditFormData({
      startDate: patientData?.discharge_at ? dayjs(patientData.discharge_at) : dayjs(),
      notes: '',
      activeActivityId: null
    })
    setIsUpdatingTreatment(false)
    setIsDeletingTreatment(false)
    setIsAddingTreatmentNote(false)
    setTreatmentActivitiesLoading(false)
  }, [patientData?.discharge_at])

  const totalTreatments = useMemo(
    () => treatmentGroups.reduce((sum: number, group: any) => sum + group.treatments.length, 0),
    [treatmentGroups]
  )

  const handleOpenAddDrawer = useCallback(() => {
    setAddDrawerOpen(true)
    setTreatmentSearchTerm('')
  }, [])

  const handleCloseAddDrawer = useCallback(() => {
    setAddDrawerOpen(false)
    setTreatmentSearchTerm('')
    setTreatmentInputValue('')
    setTreatmentOptionsLoading(false)
    setFormData({
      startDate: patientData?.discharge_at ? dayjs(patientData.discharge_at) : dayjs(),
      treatmentName: null,
      notes: ''
    })
  }, [patientData?.discharge_at])

  const fetchTreatments = useCallback(async () => {
    if (!animalId) return

    setTreatmentsLoading(true)
    try {
      const response: any = await getTreatmentList({
        animal_id: animalId,
        medical_record_id: medicalRecordId,
        hospital_case_id: hospitalCaseId
      })

      setTreatmentGroups(mapRecordsToGroups(getApiRecords(response)) as any[])
    } catch (error: any) {
      Toaster({ type: 'error', message: error?.message || t('hospital_module.failed_to_fetch_treatments') })
      setTreatmentGroups([])
    } finally {
      setTreatmentsLoading(false)
    }
  }, [animalId, medicalRecordId, hospitalCaseId])

  const loadTreatmentActivities = useCallback(
    async ({ treatmentMasterId, medicalRecordId: medicalRecordIdParam, animalId: fallbackAnimalId }: any = {}) => {
      const finalAnimalId = animalId || fallbackAnimalId
      const finalMedicalRecordId = medicalRecordIdParam || medicalRecordId
      const finalTreatmentMasterId = treatmentMasterId

      if (!finalAnimalId || !finalMedicalRecordId || !finalTreatmentMasterId) {
        setSelectedTreatmentActivities([])
        setTreatmentActivitiesLoading(false)

        return
      }

      setTreatmentActivitiesLoading(true)
      try {
        const response: any = await getTreatmentList({
          animal_id: finalAnimalId,
          medical_record_id: finalMedicalRecordId,
          treatment_master_id: finalTreatmentMasterId,
          hospital_case_id: hospitalCaseId
        })

        setSelectedTreatmentActivities(mapDetailRecordsToActivities(getApiRecords(response)))
      } catch (error: any) {
        Toaster({ type: 'error', message: error?.message || t('hospital_module.failed_to_fetch_treatment_details') })
        setSelectedTreatmentActivities([])
      } finally {
        setTreatmentActivitiesLoading(false)
      }
    },
    [animalId, medicalRecordId, hospitalCaseId]
  )

  useEffect(() => {
    fetchTreatments()
  }, [fetchTreatments])

  useEffect(() => {
    const defaultDate = patientData?.discharge_at ? dayjs(patientData.discharge_at) : dayjs()
    setFormData((prev: any) => ({
      ...prev,
      startDate: defaultDate
    }))
    if (!isEditDrawerOpen) {
      setEditFormData((prev: any) => ({
        ...prev,
        startDate: defaultDate
      }))
    }
  }, [patientData?.discharge_at, isEditDrawerOpen])

  useEffect(() => {
    if (!isAddDrawerOpen) {
      setTreatmentOptionsLoading(false)
      setTreatmentOptions([])

      return
    }

    let isMounted = true
    setTreatmentOptionsLoading(true)

    const handler = setTimeout(async () => {
      const params = {
        q: treatmentSearchTerm,
        page: 0,
        limit: 10
      }
      try {
        const response: any = await getTreatmentMasterList(params)
        if (!isMounted) return
        const records = response?.data?.records || []
        if (records.length) {
          setTreatmentOptions(
            records.map((record: any) => ({
              label: record.treatment_name,
              value: record.treatment_name,
              id: record.id
            }))
          )
        } else {
          setTreatmentOptions([])
        }
      } catch (error) {
        if (isMounted) {
          setTreatmentOptions([])
        }
      } finally {
        if (isMounted) {
          setTreatmentOptionsLoading(false)
        }
      }
    }, 400)

    return () => {
      isMounted = false
      clearTimeout(handler)
    }
  }, [treatmentSearchTerm, isAddDrawerOpen])

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddTreatment = async () => {
    const selectedValue =
      typeof formData.treatmentName === 'string'
        ? formData.treatmentName
        : formData.treatmentName?.label || formData.treatmentName?.value || ''

    const treatmentNameValue = (treatmentInputValue || selectedValue || '').trim()

    if (!treatmentNameValue) {
      Toaster({ type: 'error', message: t('hospital_module.treatment_name_is_required') })

      return
    }

    if (!animalId || !medicalRecordId) {
      Toaster({ type: 'error', message: t('hospital_module.missing_patient_identifiers_treatment') })

      return
    }

    const formattedStartTime = formData.startDate ? dayjs(formData.startDate).format('DD MMM YYYY HH:mm:ss') : ''

    const payload = {
      animal_id: animalId,
      medical_record_id: medicalRecordId,
      hospital_case_id: hospitalCaseId || '',
      start_time: formattedStartTime,
      treatment_master_id: treatmentNameValue,
      note: formData.notes || '',
      is_edit: 0
    }

    try {
      setIsCreatingTreatment(true)
      const response: any = await createTreatmentRecord(payload)
      Toaster({
        type: response?.success ? 'success' : 'error',
        message: response?.message || 'Treatment creation status unknown.'
      })
      if (response?.success) {
        setAddDrawerOpen(false)
        setFormData({
          startDate: dayjs(),
          treatmentName: null,
          notes: ''
        })
        setTreatmentInputValue('')
        setTreatmentSearchTerm('')
        fetchTreatments()
      }
    } catch (error: any) {
      Toaster({ type: 'error', message: error?.message || t('hospital_module.failed_to_create_treatment') })
    } finally {
      setIsCreatingTreatment(false)
    }
  }

  const handleEditFieldChange = (field: string, value: any) => {
    setEditFormData((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleOpenEditDrawer = (treatment: any, activity: any = null) => {
    if (!treatment) return

    setSelectedTreatmentActivities([])

    const localStartDate = treatment.treatment_start_date_time
      ? dayjs((Utility as any).convertUTCToLocal(treatment.treatment_start_date_time))
      : null

    const inferredStartDate = localStartDate?.isValid()
      ? localStartDate
      : dayjs(treatment.treatment_start_date_time || undefined)

    const prefillNotes = activity ? activity.description || activity.notes || '' : ''

    setSelectedTreatment(treatment)
    setEditFormData({
      startDate: inferredStartDate,
      notes: prefillNotes,
      activeActivityId: activity?.id || null
    })
    setEditDrawerOpen(true)

    loadTreatmentActivities({
      treatmentMasterId: treatment.treatmentMasterId || treatment.id,
      medicalRecordId: treatment.medicalRecordId || medicalRecordId,
      animalId: treatment.animalId || animalId
    })
  }

  const handleUpdateTreatment = async () => {
    if (!selectedTreatment) {
      Toaster({ type: 'error', message: t('hospital_module.select_treatment_to_update') })

      return
    }

    if (!editFormData.activeActivityId) {
      Toaster({ type: 'error', message: t('hospital_module.select_note_entry_to_update') })

      return
    }

    const finalAnimalId = selectedTreatment.animalId || animalId
    const finalMedicalRecordId = selectedTreatment.medicalRecordId || medicalRecordId

    if (!finalAnimalId || !finalMedicalRecordId) {
      Toaster({ type: 'error', message: t('hospital_module.missing_identifiers_to_update_treatment') })

      return
    }

    const activeActivity = selectedTreatmentActivities.find((activity: any) => activity.id === editFormData.activeActivityId)

    const originalLocalStartTime = activeActivity?.treatment_start_date_time
      ? dayjs((Utility as any).convertUTCToLocal(activeActivity.treatment_start_date_time)).format(TREATMENT_DATE_TIME_FORMAT)
      : ''

    const currentLocalStartTime = editFormData.startDate
      ? dayjs(editFormData.startDate).format(TREATMENT_DATE_TIME_FORMAT)
      : ''

    const hasDateChanged =
      activeActivity?.treatment_start_date_time &&
      !dayjs((Utility as any).convertUTCToLocal(activeActivity.treatment_start_date_time)).isSame(dayjs(editFormData.startDate), 'day')

    const formattedStartTime = hasDateChanged ? currentLocalStartTime : originalLocalStartTime || currentLocalStartTime

    const treatmentMasterId = selectedTreatment?.name || ''

    if (!treatmentMasterId) {
      Toaster({ type: 'error', message: t('hospital_module.unable_to_determine_treatment_reference_for_update') })

      return
    }

    const payload = {
      animal_id: finalAnimalId,
      medical_record_id: finalMedicalRecordId,
      hospital_case_id: selectedTreatment.hospitalCaseId || hospitalCaseId || '',
      start_time: formattedStartTime,
      treatment_master_id: treatmentMasterId,
      note: editFormData.notes || '',
      treatment_id: editFormData.activeActivityId
    }

    try {
      setIsUpdatingTreatment(true)
      const response: any = await updateTreatmentRecord(payload)
      Toaster({
        type: response?.success ? 'success' : 'error',
        message: response?.message || t('hospital_module.failed_to_update_treatment')
      })
      if (response?.success) {
        closeEditDrawer()
        fetchTreatments()
      }
    } catch (error: any) {
      Toaster({ type: 'error', message: error?.message || t('hospital_module.failed_to_update_treatment') })
    } finally {
      setIsUpdatingTreatment(false)
    }
  }

  const handleAddTreatmentNote = async () => {
    if (!selectedTreatment) {
      Toaster({ type: 'error', message: t('hospital_module.select_treatment_to_add_note') })

      return
    }

    const finalAnimalId = selectedTreatment.animalId || animalId
    const finalMedicalRecordId = selectedTreatment.medicalRecordId || medicalRecordId

    if (!finalAnimalId || !finalMedicalRecordId) {
      Toaster({ type: 'error', message: t('hospital_module.missing_identifiers_to_add_treatment_note') })

      return
    }

    const formattedStartTime = editFormData.startDate
      ? dayjs(editFormData.startDate).format('DD MMM YYYY HH:mm:ss')
      : ''

    const treatmentMasterId = selectedTreatment?.name || ''

    if (!treatmentMasterId) {
      Toaster({ type: 'error', message: t('hospital_module.unable_to_determine_treatment_reference') })

      return
    }

    const payload = {
      animal_id: finalAnimalId,
      medical_record_id: finalMedicalRecordId,
      hospital_case_id: selectedTreatment.hospitalCaseId || hospitalCaseId || '',
      start_time: formattedStartTime,
      treatment_master_id: treatmentMasterId,
      note: editFormData.notes || '',
      is_edit: 1
    }

    try {
      setIsAddingTreatmentNote(true)
      const response: any = await createTreatmentRecord(payload)
      Toaster({
        type: response?.success ? 'success' : 'error',
        message: response?.message || t('hospital_module.failed_to_add_treatment_note')
      })
      if (response?.success) {
        closeEditDrawer()
        fetchTreatments()
      }
    } catch (error: any) {
      Toaster({ type: 'error', message: error?.message || t('hospital_module.failed_to_add_treatment_note') })
    } finally {
      setIsAddingTreatmentNote(false)
    }
  }

  const handleDeleteTreatment = () => {
    if (!editFormData.activeActivityId) {
      Toaster({ type: 'error', message: t('hospital_module.select_note_entry_to_delete') })

      return
    }

    setDeleteDialogOpen(true)
  }

  const handleConfirmDeleteTreatment = async () => {
    if (!editFormData.activeActivityId) {
      Toaster({ type: 'error', message: t('hospital_module.missing_note_reference_to_delete') })
      setDeleteDialogOpen(false)

      return
    }

    try {
      setIsDeletingTreatment(true)
      const response: any = await deleteTreatmentRecord({ treatment_id: editFormData.activeActivityId })
      Toaster({
        type: response?.success ? 'success' : 'error',
        message: response?.message || t('hospital_module.failed_to_delete_treatment_entry')
      })
      if (response?.success) {
        setDeleteDialogOpen(false)
        closeEditDrawer()
        fetchTreatments()
      }
    } catch (error: any) {
      Toaster({ type: 'error', message: error?.message || t('hospital_module.failed_to_delete_treatment_entry') })
    } finally {
      setIsDeletingTreatment(false)
    }
  }

  const handleCancelDeleteTreatment = () => {
    setDeleteDialogOpen(false)
    setIsDeletingTreatment(false)
  }

  const handlePrefillFromActivity = (activity: any) => {
    if (!selectedTreatment || !activity) return

    const localStartDate = activity.treatment_start_date_time
      ? dayjs((Utility as any).convertUTCToLocal(activity.treatment_start_date_time))
      : null

    const inferredStartDate = localStartDate?.isValid()
      ? localStartDate
      : dayjs(activity.treatment_start_date_time || undefined)
    const prefillNotes = activity.description || activity.notes || ''

    setEditFormData({
      startDate: inferredStartDate,
      notes: prefillNotes,
      activeActivityId: activity.id || null
    })
  }

  const handleTreatmentSearch = (value: string) => {
    const trimmed = value?.trim() || ''
    setTreatmentSearchTerm(trimmed.length >= 3 ? trimmed : '')
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px', mt: 6 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 3
        }}
      >
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontWeight: 500,
            fontSize: '20px',
            letterSpacing: 0
          }}
        >
          {t('hospital_module.treatments')} {totalTreatments > 0 ? ` - ${totalTreatments}` : ''}
        </Typography>
        {!isTreatmentsLoading && treatmentGroups.length > 0 && (
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={handleOpenAddDrawer}
            sx={{
              boxShadow: `0px 4px 8px -4px ${theme.palette.customColors.shadowColor || '#4C4E646B'}`,
              height: '42px',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {t('hospital_module.add_new_treatment')}
          </Button>
        )}
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {isTreatmentsLoading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map((item: number) => (
              <Box key={`skeleton-${item}`} sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Skeleton variant='text' width={180} height={24} />
                <Skeleton
                  variant='rounded'
                  height={118}
                  sx={{
                    borderRadius: '8px'
                  }}
                />
              </Box>
            ))}
          </Box>
        )}

        {!isTreatmentsLoading && treatmentGroups.length === 0 && (
          (<Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <NoMedicalData
              btnText={t('hospital_module.add_new_treatment').toUpperCase()}
              text={t('hospital_module.all_added_treatments_will_appear_here')}
              btnAction={handleOpenAddDrawer}
            />
          </Box>)
        )}

        {!isTreatmentsLoading && treatmentGroups.length > 0 && (
          <>
            {treatmentGroups.map((group: any) => (
              <Box key={group.id} sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Avatar
                    src='/icons/medId_icon.svg'
                    alt='note icon'
                    variant='rounded'
                    sx={{ width: 16, height: 16, bgcolor: 'transparent' }}
                  />
                  <Typography
                    sx={{
                      fontWeight: 500,
                      fontSize: '14px',
                      letterSpacing: '0.1px',
                      color: theme.palette.primary.dark
                    }}
                  >
                    {group.code}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {group.treatments.map((treatment: any) => {
                    const parsedApiNotesCount =
                      treatment?.notes_count !== undefined && treatment?.notes_count !== null
                        ? Number(treatment.notes_count)
                        : null

                    const fallbackNotesCount =
                      treatment?.noteCount !== undefined && treatment?.noteCount !== null
                        ? Number(treatment.noteCount)
                        : null

                    const effectiveNotesCount = Number.isFinite(parsedApiNotesCount)
                      ? parsedApiNotesCount
                      : Number.isFinite(fallbackNotesCount)
                      ? fallbackNotesCount
                      : null
                    const shouldShowNotesCount = Number.isFinite(effectiveNotesCount) && (effectiveNotesCount as number) > 0

                    return (
                      <Box
                        key={treatment.id}
                        onClick={() => handleOpenEditDrawer(treatment)}
                        onKeyDown={(event: React.KeyboardEvent) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            handleOpenEditDrawer(treatment)
                          }
                        }}
                        sx={{
                          cursor: 'pointer',
                          display: 'flex',
                          gap: '24px',
                          justifyContent: 'space-between',
                          borderRadius: '8px',
                          padding: '24px',
                          background: theme.palette.customColors.Background,
                          flexWrap: 'wrap',
                          alignItems: 'center'
                        }}
                      >
                        <Tooltip title={treatment.name}>
                          <Typography
                            sx={{
                              fontWeight: 500,
                              fontSize: '20px',
                              letterSpacing: 0,
                              color: theme.palette.customColors.OnSurfaceVariant,
                              width: { xs: '100%', md: '220px' },
                              maxWidth: { xs: '100%', md: '220px' },
                              flexShrink: 0,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {treatment.name}
                          </Typography>
                        </Tooltip>

                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            borderRadius: '8px',
                            flex: '1 1 280px'
                          }}
                        >
                          <Box
                            role='button'
                            tabIndex={0}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              flexWrap: 'wrap',
                              cursor: 'pointer'
                            }}
                          >
                            {shouldShowNotesCount ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Typography
                                  sx={{
                                    fontWeight: 400,
                                    fontSize: '14px',
                                    color: theme.palette.customColors.neutralSecondary
                                  }}
                                >
                                  Notes:
                                </Typography>
                                <Typography
                                  sx={{
                                    color: theme.palette.primary.dark,
                                    fontWeight: 600,
                                    fontSize: '16px'
                                  }}
                                >
                                  +{effectiveNotesCount}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography
                                sx={{
                                  fontWeight: 400,
                                  fontSize: '14px',
                                  color: theme.palette.customColors.neutralSecondary
                                }}
                              >
                                {t('hospital_module.notes')}
                              </Typography>
                            )}

                            <Avatar
                              src='/icons/Note.svg'
                              alt='note icon'
                              variant='square'
                              style={{ width: 14, height: 14 }}
                            />
                          </Box>

                          <Tooltip
                            title={
                              <Box sx={{ whiteSpace: 'pre-wrap' }}>
                                {treatment.noteSummary || ''}
                              </Box>
                            }
                            placement='bottom-start'
                            arrow
                            slotProps={{
                              tooltip: {
                                sx: {
                                  maxHeight: 200,
                                  overflowY: 'auto'
                                }
                              }
                            }}
                          >
                            <Typography
                              sx={{
                                fontWeight: 400,
                                fontSize: '14px',
                                color: theme.palette.customColors.OnSurfaceVariant,
                                letterSpacing: 0,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'pre-wrap'
                              }}
                            >
                              {treatment.noteSummary}
                            </Typography>
                          </Tooltip>

                          <Typography
                            sx={{
                              color: theme.palette.customColors.neutralSecondary,
                              fontWeight: 400,
                              fontSize: '12px'
                            }}
                          >
                            {t('hospital_module.last_updated')} {formatTimestamp(treatment.lastUpdated)}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            flexShrink: 0,
                            minWidth: '220px',
                            width: { xs: '100%', sm: 'auto' },
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                          }}
                        >
                          <Typography
                            sx={{
                              mb: { xs: 1 },
                              color: theme.palette.customColors.neutralSecondary,
                              fontSize: '0.75rem',
                              ml: { xs: 0, md: 1 }
                            }}
                          >
                            {treatment?.isModified == 1 ? t('hospital_module.updated_by') : t('hospital_module.created_by')}
                          </Typography>
                          <UserInfoCard
                            avatarUrl={treatment?.record?.profile_pic || ''}
                            name={treatment?.record?.created_by_name || '—'}
                            description={formatClinicianTimestamp(
                              treatment?.clinician?.updatedAt
                                ? treatment?.clinician?.updatedAt
                                : treatment?.clinician?.createdAt
                            )}
                            textColor={theme.palette.customColors.OnSurfaceVariant}
                            fontWeight={undefined}
                          />
                        </Box>
                      </Box>
                    )
                  })}
                </Box>
              </Box>
            ))}
          </>
        )}
      </Box>
      <AddTreatmentDrawer
        open={isAddDrawerOpen}
        onClose={handleCloseAddDrawer}
        formData={formData}
        onChange={handleFieldChange}
        onSubmit={handleAddTreatment}
        treatmentOptions={treatmentOptions}
        optionsLoading={treatmentOptionsLoading}
        onSearchTreatment={handleTreatmentSearch}
        onInputValueChange={setTreatmentInputValue}
        isSubmitting={isCreatingTreatment}
        admissionDate={dayjs(patientData?.admitted_at)}
        dischargedDate={patientData?.discharge_at ? dayjs(patientData.discharge_at) : null}
      />
      <EditTreatmentDrawer
        open={isEditDrawerOpen}
        onClose={closeEditDrawer}
        treatment={selectedTreatment}
        formData={editFormData}
        onChange={handleEditFieldChange}
        onAdd={handleAddTreatmentNote}
        onDelete={handleDeleteTreatment}
        onUpdate={handleUpdateTreatment}
        onActivityPrefill={handlePrefillFromActivity}
        activities={selectedTreatmentActivities}
        isActivitiesLoading={isTreatmentActivitiesLoading}
        isAdding={isAddingTreatmentNote}
        isSubmitting={isUpdatingTreatment}
        formatTimestamp={formatTimestamp}
        formatShortDate={formatShortDate}
        admissionDate={dayjs(patientData?.admitted_at)}
        dischargedDate={patientData?.discharge_at ? dayjs(patientData.discharge_at) : null}
      />
      <DialogConfirmationDialog
        open={isDeleteDialogOpen}
        handleClose={handleCancelDeleteTreatment}
        action={handleConfirmDeleteTreatment}
        message='Are you sure you want to delete this note?'
        loading={isDeletingTreatment}
      />
    </Box>
  );
}

export default OtherTreatment
