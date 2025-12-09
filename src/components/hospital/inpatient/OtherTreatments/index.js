import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Avatar, Box, Button, Skeleton, Tooltip, Typography } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'

import dayjs from 'dayjs'
import { useTheme } from '@mui/material/styles'

import UserInfoCard from 'src/views/utility/insights/UserInfoCard'
import DialogConfirmationDialog from 'src/views/utility/DeleteConfirmationDialog'
import Toaster from 'src/components/Toaster'
import Utility from 'src/utility'
import AddTreatmentDrawer from './AddTreatmentDrawer'
import EditTreatmentDrawer from './EditTreatmentDrawer'
import NoDataFound from 'src/views/utility/NoDataFound'

import {
  createTreatmentRecord,
  getTreatmentMasterList,
  getTreatmentList,
  updateTreatmentRecord,
  deleteTreatmentRecord
} from 'src/lib/api/hospital/treatmentMaster'

const formatTimestamp = isoString => {
  if (!isoString) return '-'

  const timePart = Utility.convertUTCToLocaltime(isoString)
  const datePart = Utility.convertUtcToLocalReadableDate(isoString)
  const safeTime = timePart && timePart !== 'Invalid date' ? timePart : ''
  const safeDate = datePart && datePart !== 'Invalid date' ? datePart : ''

  if (safeTime && safeDate) {
    return `${safeDate} • ${safeTime}`
  }

  return safeTime || safeDate || '-'
}

const formatClinicianTimestamp = isoString => {
  if (!isoString) return ''

  const timePart = Utility.convertUTCToLocaltime(isoString)
  const datePart = Utility.convertUtcToLocalReadableDate(isoString)
  const safeTime = timePart && timePart !== 'Invalid date' ? timePart : ''
  const safeDate = datePart && datePart !== 'Invalid date' ? datePart : ''

  if (safeTime && safeDate) {
    return `${safeDate} • ${safeTime}`
  }

  return safeTime || safeDate || ''
}

const formatShortDate = isoString => {
  if (!isoString) return '-'

  const formatted = Utility.convertUtcToLocalReadableDate(isoString)

  return formatted && formatted !== 'Invalid date' ? formatted : '-'
}

const getUpdatedTimestamp = record => record?.update_at || null

const getCreatedTimestamp = record => record?.created_at || null

const getTimestampValue = record => {
  const timestamp = typeof record === 'string' ? record : getUpdatedTimestamp(record)
  if (!timestamp) return -Infinity
  const parsed = dayjs(timestamp)

  return parsed.isValid() ? parsed.valueOf() : -Infinity
}

const deriveTreatmentId = entry => {
  if (!entry) return null

  return (
    entry.treatment_master_id ||
    (entry.treatment_name ? entry.treatment_name.trim().toLowerCase().replace(/\s+/g, '-') : null)
  )
}

const buildActivityFromSource = (activity = {}, fallbackRecord = {}, index = 0) => {
  const timestamp =
    activity.update_at || fallbackRecord?.update_at || activity.created_at || fallbackRecord?.created_at || null

  const fallbackIdBase =
    fallbackRecord.id ||
    fallbackRecord.treatment_master_id ||
    fallbackRecord.treatment_id ||
    (fallbackRecord.treatment_name
      ? fallbackRecord.treatment_name.trim().toLowerCase().replace(/\s+/g, '-')
      : 'activity')

  const treatmentStartDate =
    activity.start_time || activity.created_at || fallbackRecord?.start_time || fallbackRecord?.created_at || null

  return {
    id: activity.id || `${fallbackIdBase}-${index}`,
    description: activity.description ?? activity.notes ?? activity.note ?? fallbackRecord.note ?? '',
    author: activity.created_by_name || fallbackRecord.created_by_name || '—',
    timestamp,
    status: activity.status || fallbackRecord.status || 'completed',
    title: activity.treatment_name || fallbackRecord.treatment_name || 'Status Update',
    treatmentStartDate,
    notes: activity.notes ?? activity.description ?? activity.note ?? fallbackRecord.note ?? ''
  }
}

const extractActivitiesFromRecord = record => {
  if (Array.isArray(record?.activities) && record.activities.length) {
    return record.activities.map((activity, index) => buildActivityFromSource(activity, record, index))
  }

  return [
    buildActivityFromSource(
      {
        id: record?.id,
        description: record?.note,
        notes: record?.note,
        update_at: getUpdatedTimestamp(record),
        created_at: getCreatedTimestamp(record),
        created_by_name: record?.created_by_name,
        treatmentStartDate: record?.start_time,
        status: record?.status,
        title: record?.treatment_name
      },
      record
    )
  ]
}

const buildTreatmentFromEntries = entries => {
  if (!entries?.length) return null

  const activities = entries.flatMap(extractActivitiesFromRecord)
  const latestEntry = entries.slice().sort((a, b) => getTimestampValue(b) - getTimestampValue(a))[0] || entries[0]

  const latestActivityWithNotes = activities
    .slice()
    .sort((a, b) => getTimestampValue(b) - getTimestampValue(a))
    .find(activity => (activity.notes || activity.description)?.toString().trim())

  const apiNotesCountValue = entries.find(
    entry => entry.notes_count !== undefined && entry.notes_count !== null
  )?.notes_count

  const parsedApiNotesCount =
    apiNotesCountValue !== undefined && apiNotesCountValue !== null ? Number(apiNotesCountValue) : null
  const resolvedApiNotesCount = Number.isFinite(parsedApiNotesCount) ? parsedApiNotesCount : null

  return {
    id: deriveTreatmentId(latestEntry) || deriveTreatmentId(entries[0]) || 'treatment',
    name: latestEntry?.treatment_name || entries[0]?.treatment_name || 'Treatment',
    noteCount: activities.filter(activity => (activity.notes || activity.description)?.toString().trim()).length,
    noteSummary:
      latestActivityWithNotes?.notes?.toString().trim() ||
      latestActivityWithNotes?.description?.toString().trim() ||
      'No notes added yet.',
    lastUpdated: getUpdatedTimestamp(latestEntry),
    clinician: {
      name: latestEntry?.created_by_name || '—',
      avatarUrl: latestEntry?.profile_pic || '',
      createdAt: getCreatedTimestamp(latestEntry) || ''
    },
    animalId: latestEntry?.animal_id || entries[0]?.animal_id || null,
    medicalRecordId: latestEntry?.medical_record_id || entries[0]?.medical_record_id || null,
    medicalRecordCode: latestEntry?.medical_record_code || entries[0]?.medical_record_code || '',
    treatmentMasterId: latestEntry?.treatment_master_id || entries[0]?.treatment_master_id || null,
    treatmentId: latestEntry?.treatment_id || entries[0]?.treatment_id || null,
    hospitalCaseId: latestEntry?.hospital_case_id || entries[0]?.hospital_case_id || null,
    activities,
    notes_count: resolvedApiNotesCount
  }
}

const aggregateTreatmentsByName = (treatments = []) => {
  if (!treatments.length) return []

  const grouped = treatments.reduce((acc, record) => {
    if (!record) return acc

    const key =
      record.treatment_name?.trim().toLowerCase() ||
      record.name?.trim().toLowerCase() ||
      record.treatment_master_id ||
      record.treatment_id ||
      record.id ||
      `treatment-${Object.keys(acc).length}`

    if (!acc[key]) {
      acc[key] = []
    }

    acc[key].push(record)

    return acc
  }, {})

  return Object.values(grouped).map(buildTreatmentFromEntries).filter(Boolean)
}

const mapRecordsToGroups = (records = []) => {
  if (!records.length) return []

  const hasNestedTreatments = records.some(record => Array.isArray(record?.treatments))

  if (hasNestedTreatments) {
    return records
      .map((record, index) => {
        const treatments = (record.treatments || []).map(entry => buildTreatmentFromEntries([entry])).filter(Boolean)

        if (!treatments.length) return null

        return {
          id: record.medical_record_id || record.medical_record_code || record.id || `medical-record-${index}`,
          code:
            record.code ||
            (record.medical_record_code
              ? `MED - ${record.medical_record_code}`
              : record.medical_record_name || record.title || 'Medical Record'),
          icon: record.icon || 'mdi:medical-bag-outline',
          treatments
        }
      })
      .filter(Boolean)
  }

  const groupedByMedicalRecord = records.reduce((acc, record) => {
    if (!record) return acc

    const key = record.medical_record_code || record.medical_record_id || 'default'
    if (!acc[key]) {
      acc[key] = {
        id: key,
        code: record.medical_record_code
          ? `MED - ${record.medical_record_code}`
          : record.treatment_name
          ? `Treatment - ${record.treatment_name}`
          : 'Treatment',
        icon: 'mdi:medical-bag-outline',
        entries: []
      }
    }
    acc[key].entries.push(record)

    return acc
  }, {})

  return Object.values(groupedByMedicalRecord)
    .map(group => ({
      id: group.id,
      code: group.code,
      icon: group.icon,
      treatments: aggregateTreatmentsByName(group.entries)
    }))
    .filter(group => group.treatments.length)
}

const mapDetailRecordsToActivities = (records = []) => {
  if (!records.length) return []

  return records.map((record, index) => {
    const timestamp = record.update_at || null
    const treatmentId = record.id || null
    const treatmentMasterId = record.treatment_master_id || null

    const treatmentStartDate = record.update_at || record.created_at || null
    const note = record.note || ''

    return {
      id: treatmentId,
      treatmentId,
      treatmentMasterId,
      title: record.treatment_name || 'Status Update',
      treatmentName: record.treatment_name || '',
      author: record.created_by_name || '—',
      clinician: {
        name: record.created_by_name || '—',
        avatarUrl: record.profile_pic || ''
      },
      timestamp,
      treatmentStartDate,
      notes: note,
      description: note,
      note,
      status: record.is_first === '1' ? 'initial' : 'update',
      isFirst: record.is_first === '1',
      isEditable: record.is_first !== '1',
      medicalRecordCode: record.medical_record_code || '',
      record
    }
  })
}

const OtherTreatment = ({ animalId, medicalRecordId, hospitalCaseId, patientDischarged = false }) => {
  const theme = useTheme()
  const [isAddDrawerOpen, setAddDrawerOpen] = useState(false)
  const [isEditDrawerOpen, setEditDrawerOpen] = useState(false)

  const [formData, setFormData] = useState({
    startDate: dayjs(),
    treatmentName: null,
    notes: ''
  })

  const [editFormData, setEditFormData] = useState({
    startDate: dayjs(),
    notes: '',
    activeActivityId: null,
    activeTreatmentMasterId: null
  })
  const [selectedTreatment, setSelectedTreatment] = useState(null)
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [treatmentGroups, setTreatmentGroups] = useState([])
  const [treatmentOptions, setTreatmentOptions] = useState([])
  const [treatmentOptionsLoading, setTreatmentOptionsLoading] = useState(false)
  const [treatmentSearchTerm, setTreatmentSearchTerm] = useState('')
  const [isCreatingTreatment, setIsCreatingTreatment] = useState(false)
  const [isTreatmentsLoading, setTreatmentsLoading] = useState(false)
  const [treatmentInputValue, setTreatmentInputValue] = useState('')
  const [selectedTreatmentActivities, setSelectedTreatmentActivities] = useState([])
  const [isTreatmentActivitiesLoading, setTreatmentActivitiesLoading] = useState(false)
  const [isUpdatingTreatment, setIsUpdatingTreatment] = useState(false)
  const [isDeletingTreatment, setIsDeletingTreatment] = useState(false)

  const closeEditDrawer = useCallback(() => {
    setEditDrawerOpen(false)
    setSelectedTreatmentActivities([])
    setSelectedTreatment(null)
    setEditFormData({
      startDate: dayjs(),
      notes: '',
      activeActivityId: null,
      activeTreatmentMasterId: null
    })
    setIsUpdatingTreatment(false)
    setIsDeletingTreatment(false)
  }, [])

  const totalTreatments = useMemo(
    () => treatmentGroups.reduce((sum, group) => sum + group.treatments.length, 0),
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
      startDate: dayjs(),
      treatmentName: null,
      notes: ''
    })
  }, [])

  const fetchTreatments = useCallback(async () => {
    if (!animalId) return

    setTreatmentsLoading(true)
    try {
      const response = await getTreatmentList({
        animal_id: animalId,
        medical_record_id: medicalRecordId,
        hospital_case_id: hospitalCaseId
      })

      const records = response?.data?.records || []
      setTreatmentGroups(mapRecordsToGroups(records))
    } catch (error) {
      Toaster({ type: 'error', message: error?.message || 'Failed to fetch treatments.' })
      setTreatmentGroups([])
    } finally {
      setTreatmentsLoading(false)
    }
  }, [animalId, medicalRecordId, hospitalCaseId])

  const loadTreatmentActivities = useCallback(
    async ({ treatmentMasterId, medicalRecordId: medicalRecordIdParam, animalId: fallbackAnimalId } = {}) => {
      const finalAnimalId = animalId || fallbackAnimalId
      const finalMedicalRecordId = medicalRecordIdParam || medicalRecordId
      const finalTreatmentMasterId = treatmentMasterId

      if (!finalAnimalId || !finalMedicalRecordId || !finalTreatmentMasterId) {
        setSelectedTreatmentActivities([])

        return
      }

      setTreatmentActivitiesLoading(true)
      try {
        const response = await getTreatmentList({
          animal_id: finalAnimalId,
          medical_record_id: finalMedicalRecordId,
          treatment_master_id: finalTreatmentMasterId,
          hospital_case_id: hospitalCaseId
        })

        const records = response?.data?.records || []
        setSelectedTreatmentActivities(mapDetailRecordsToActivities(records))
      } catch (error) {
        Toaster({ type: 'error', message: error?.message || 'Failed to fetch treatment details.' })
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
    if (!isAddDrawerOpen) {
      setTreatmentOptionsLoading(false)
      setTreatmentOptions([])

      return
    }

    let isMounted = true
    setTreatmentOptionsLoading(true)

    const handler = setTimeout(async () => {
      try {
        const response = await getTreatmentMasterList({ q: treatmentSearchTerm, page: 0, limit: 10 })
        if (!isMounted) return
        const records = response?.data?.records || []
        if (records.length) {
          setTreatmentOptions(
            records.map(record => ({
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

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
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
      Toaster({ type: 'error', message: 'Treatment name is required.' })

      return
    }

    if (!animalId || !medicalRecordId) {
      Toaster({ type: 'error', message: 'Missing patient identifiers to create treatment.' })

      return
    }

    const formattedStartTime = formData.startDate ? dayjs(formData.startDate).format('DD MMM YYYY HH:mm:ss') : ''

    const payload = {
      animal_id: animalId,
      medical_record_id: medicalRecordId,
      hospital_case_id: hospitalCaseId || '',
      start_time: formattedStartTime,
      treatment_master_id: treatmentNameValue,
      note: formData.notes || ''
    }

    try {
      setIsCreatingTreatment(true)
      const response = await createTreatmentRecord(payload)
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
    } catch (error) {
      Toaster({ type: 'error', message: error?.message || 'Failed to create treatment.' })
    } finally {
      setIsCreatingTreatment(false)
    }
  }

  const handleEditFieldChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleOpenEditDrawer = (treatment, activity = null) => {
    if (!treatment) return

    setSelectedTreatmentActivities([])

    const inferredStartDate = activity?.treatmentStartDate
      ? dayjs(activity.treatmentStartDate)
      : activity?.timestamp
      ? dayjs(activity.timestamp)
      : treatment.lastUpdated
      ? dayjs(treatment.lastUpdated)
      : dayjs()

    const prefillNotes = activity ? activity.description || activity.notes || '' : ''

    setSelectedTreatment(treatment)
    setEditFormData({
      startDate: inferredStartDate,
      notes: prefillNotes,
      activeActivityId: activity?.treatmentId || activity?.id || null,
      activeTreatmentMasterId: activity?.record?.treatment_master_id || treatment.treatment_master_id || null
    })
    setEditDrawerOpen(true)

    loadTreatmentActivities({
      treatmentMasterId:
        treatment.treatmentMasterId || treatment.treatment_master_id || treatment.treatmentId || treatment.id,
      medicalRecordId: treatment.medicalRecordId || treatment.medical_record_id,
      animalId: treatment.animalId
    })
  }

  const handleUpdateTreatment = async () => {
    if (!selectedTreatment) {
      Toaster({ type: 'error', message: 'Select a treatment to update.' })

      return
    }

    if (!editFormData.activeActivityId) {
      Toaster({ type: 'error', message: 'Select a note entry to update from the activity list.' })

      return
    }

    const finalAnimalId = selectedTreatment.animalId || animalId
    const finalMedicalRecordId = selectedTreatment.medicalRecordId || medicalRecordId

    if (!finalAnimalId || !finalMedicalRecordId) {
      Toaster({ type: 'error', message: 'Missing identifiers to update this treatment.' })

      return
    }

    const formattedStartTime = editFormData.startDate
      ? dayjs(editFormData.startDate).format('DD MMM YYYY HH:mm:ss')
      : ''

    const treatmentMasterId =
      selectedTreatment?.name ||
      selectedTreatment?.treatment_name ||
      editFormData.activeTreatmentMasterId ||
      selectedTreatment.treatmentMasterId ||
      selectedTreatment.treatment_master_id ||
      selectedTreatment.treatmentId ||
      selectedTreatment.id ||
      ''

    if (!treatmentMasterId) {
      Toaster({ type: 'error', message: 'Unable to determine treatment reference for update.' })

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
      const response = await updateTreatmentRecord(payload)
      Toaster({
        type: response?.success ? 'success' : 'error',
        message: response?.message || 'Treatment update status unknown.'
      })
      if (response?.success) {
        closeEditDrawer()
        fetchTreatments()
      }
    } catch (error) {
      Toaster({ type: 'error', message: error?.message || 'Failed to update treatment.' })
    } finally {
      setIsUpdatingTreatment(false)
    }
  }

  const handleDeleteTreatment = () => {
    if (!editFormData.activeActivityId) {
      Toaster({ type: 'error', message: 'Select a note entry to delete from the activity list.' })

      return
    }

    setDeleteDialogOpen(true)
  }

  const handleConfirmDeleteTreatment = async () => {
    if (!editFormData.activeActivityId) {
      Toaster({ type: 'error', message: 'Missing note reference to delete.' })
      setDeleteDialogOpen(false)

      return
    }

    try {
      setIsDeletingTreatment(true)
      const response = await deleteTreatmentRecord({ treatment_id: editFormData.activeActivityId })
      Toaster({
        type: response?.success ? 'success' : 'error',
        message: response?.message || 'Treatment delete status unknown.'
      })
      if (response?.success) {
        setDeleteDialogOpen(false)
        closeEditDrawer()
        fetchTreatments()
      }
    } catch (error) {
      Toaster({ type: 'error', message: error?.message || 'Failed to delete treatment entry.' })
    } finally {
      setIsDeletingTreatment(false)
    }
  }

  const handleCancelDeleteTreatment = () => {
    setDeleteDialogOpen(false)
    setIsDeletingTreatment(false)
  }

  const handlePrefillFromActivity = activity => {
    if (!selectedTreatment || !activity) return

    const inferredStartDate = activity.treatmentStartDate
      ? dayjs(activity.treatmentStartDate)
      : activity.timestamp
      ? dayjs(activity.timestamp)
      : selectedTreatment.lastUpdated
      ? dayjs(selectedTreatment.lastUpdated)
      : dayjs()

    const prefillNotes = activity.description || activity.notes || ''

    setEditFormData({
      startDate: inferredStartDate,
      notes: prefillNotes,
      activeActivityId: activity.treatmentId || activity.id || null,
      activeTreatmentMasterId:
        activity.treatmentMasterId ||
        activity.record?.treatment_master_id ||
        selectedTreatment.treatmentMasterId ||
        selectedTreatment.treatment_master_id ||
        null
    })
  }

  const handleTreatmentSearch = value => {
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
          Treatments {totalTreatments > 0 ? ` - ${totalTreatments}` : ''}
        </Typography>
        {!patientDischarged && (
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
            Add New Treatment
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {isTreatmentsLoading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map(item => (
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
          <NoDataFound variant='Seal' height={300} width={300} />
        )}

        {!isTreatmentsLoading && treatmentGroups.length > 0 && (
          <>
            {treatmentGroups.map(group => (
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
                  {group.treatments.map(treatment => {
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
                    const shouldShowNotesCount = Number.isFinite(effectiveNotesCount) && effectiveNotesCount > 0

                    return (
                      <Box
                        key={treatment.id}
                        onClick={() => handleOpenEditDrawer(treatment)}
                        onKeyDown={event => {
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
                                Notes
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
                            title={treatment.noteSummary || ''}
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
                                textOverflow: 'ellipsis'
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
                            Last Updated: {formatTimestamp(treatment.lastUpdated)}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            flexShrink: 0,
                            minWidth: '220px',
                            width: { xs: '100%', sm: 'auto' }
                          }}
                        >
                          <UserInfoCard
                            avatarUrl={treatment.clinician.avatarUrl}
                            name={treatment.clinician.name}
                            description={formatClinicianTimestamp(treatment.clinician.createdAt)}
                            textColor={theme.palette.customColors.OnSurfaceVariant}
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
      />

      <EditTreatmentDrawer
        open={isEditDrawerOpen}
        onClose={closeEditDrawer}
        treatment={selectedTreatment}
        formData={editFormData}
        onChange={handleEditFieldChange}
        onDelete={handleDeleteTreatment}
        onUpdate={handleUpdateTreatment}
        onActivityPrefill={handlePrefillFromActivity}
        activities={selectedTreatmentActivities}
        isActivitiesLoading={isTreatmentActivitiesLoading}
        isSubmitting={isUpdatingTreatment}
        formatTimestamp={formatTimestamp}
        formatShortDate={formatShortDate}
      />

      <DialogConfirmationDialog
        open={isDeleteDialogOpen}
        handleClose={handleCancelDeleteTreatment}
        action={handleConfirmDeleteTreatment}
        message='Are you sure you want to delete this treatment?'
        loading={isDeletingTreatment}
      />
    </Box>
  )
}

export default OtherTreatment
