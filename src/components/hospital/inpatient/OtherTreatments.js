import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Avatar, Box, Button, Drawer, IconButton, Paper, Skeleton, Tooltip, Typography } from '@mui/material'
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material'
import dayjs from 'dayjs'
import { Icon } from '@iconify/react'
import UserInfoCard from 'src/views/utility/insights/UserInfoCard'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import { useForm, Controller } from 'react-hook-form'
import MUIDatePicker from 'src/views/forms/form-fields/MUIDatePicker'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import DialogConfirmationDialog from 'src/views/utility/DeleteConfirmationDialog'
import {
  createTreatmentRecord,
  getTreatmentMasterList,
  getTreatmentList,
  updateTreatmentRecord,
  deleteTreatmentRecord
} from 'src/lib/api/hospital/treatmentMaster'
import { useRouter } from 'next/router'
import Toaster from 'src/components/Toaster'

const defaultTreatmentOptions = ['Physiotherapy', 'Wound Dressing', 'Immunotherapy', 'Watertherapy'].map(
  (name, index) => ({
    label: name,
    value: `${name.toLowerCase().replace(/\s+/g, '-')}-${index}`
  })
)

const formatTimestamp = isoString => {
  if (!isoString) return '-'

  const date = new Date(isoString)

  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  })

  const datePart = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })

  return `${timePart} • ${datePart}`
}

const formatClinicianTimestamp = isoString => {
  if (!isoString) return ''

  return new Date(isoString).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const formatShortDate = isoString => {
  if (!isoString) return '-'

  return dayjs(isoString).format('DD MMM YYYY')
}

const getRecordTimestamp = record =>
  record?.lastUpdated ||
  record?.last_updated ||
  record?.updatedAt ||
  record?.updated_at ||
  record?.createdAt ||
  record?.created_at ||
  record?.timestamp ||
  record?.start_time ||
  null

const getTimestampValue = record => {
  const timestamp = typeof record === 'string' ? record : getRecordTimestamp(record)
  if (!timestamp) return -Infinity
  const parsed = dayjs(timestamp)

  return parsed.isValid() ? parsed.valueOf() : -Infinity
}

const deriveTreatmentId = entry => {
  if (!entry) return null

  return (
    entry.treatment_id ||
    entry.treatmentId ||
    entry.treatment_master_id ||
    entry.id ||
    (entry.treatment_name ? entry.treatment_name.trim().toLowerCase().replace(/\s+/g, '-') : null)
  )
}

const buildActivityFromSource = (activity = {}, fallbackRecord = {}, index = 0) => {
  const timestamp =
    activity.timestamp ||
    activity.updated_at ||
    activity.updatedAt ||
    activity.lastUpdated ||
    activity.last_updated ||
    activity.created_at ||
    activity.createdAt ||
    getRecordTimestamp(fallbackRecord) ||
    null

  const fallbackIdBase =
    fallbackRecord.id ||
    fallbackRecord.treatment_master_id ||
    fallbackRecord.treatment_id ||
    (fallbackRecord.treatment_name
      ? fallbackRecord.treatment_name.trim().toLowerCase().replace(/\s+/g, '-')
      : 'activity')

  const treatmentStartDate =
    activity.treatmentStartDate ||
    activity.treatment_start_date ||
    activity.start_time ||
    fallbackRecord.start_time ||
    null

  return {
    id: activity.id || `${fallbackIdBase}-${index}`,
    description: activity.description ?? activity.notes ?? activity.note ?? fallbackRecord.note ?? '',
    author:
      activity.author ||
      activity.created_by_name ||
      activity.created_by_full_name ||
      fallbackRecord.created_by_name ||
      fallbackRecord.clinician?.name ||
      '—',
    timestamp,
    status: activity.status || fallbackRecord.status || 'completed',
    title: activity.title || activity.treatment_name || fallbackRecord.treatment_name || fallbackRecord.name || 'Status Update',
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
        timestamp: getRecordTimestamp(record),
        author: record?.created_by_name,
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

  const apiNotesCountValue = entries.find(entry => entry.notes_count !== undefined && entry.notes_count !== null)?.notes_count
  const parsedApiNotesCount = apiNotesCountValue !== undefined && apiNotesCountValue !== null ? Number(apiNotesCountValue) : null
  const resolvedApiNotesCount = Number.isFinite(parsedApiNotesCount) ? parsedApiNotesCount : null

  return {
    id: deriveTreatmentId(latestEntry) || deriveTreatmentId(entries[0]) || 'treatment',
    name: latestEntry?.treatment_name || latestEntry?.name || entries[0]?.treatment_name || entries[0]?.name || 'Treatment',
    noteCount: activities.filter(activity => (activity.notes || activity.description)?.toString().trim()).length,
    noteSummary:
      latestActivityWithNotes?.notes?.toString().trim() ||
      latestActivityWithNotes?.description?.toString().trim() ||
      'No notes added yet.',
    lastUpdated: getRecordTimestamp(latestEntry),
    clinician: {
      name: latestEntry?.clinician?.name || latestEntry?.clinician_name || latestEntry?.created_by_name || '—',
      avatarUrl: latestEntry?.clinician?.avatarUrl || latestEntry?.clinician?.avatar_url || latestEntry?.profile_pic || '',
      updatedAt: latestEntry?.clinician?.updatedAt || latestEntry?.clinician?.updated_at || getRecordTimestamp(latestEntry) || ''
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
        const treatments = (record.treatments || [])
          .map(entry => buildTreatmentFromEntries([entry]))
          .filter(Boolean)

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
    const timestamp =
      record.update_at ||
      record.updated_at ||
      record.updatedAt ||
      record.created_at ||
      record.createdAt ||
      record.timestamp ||
      null

    const treatmentStartDate = record.created_at || record.createdAt || timestamp || null
    const note = record.note || ''

    return {
      id: record.id || `${record.treatment_master_id || record.treatment_id || 'treatment'}-${index}`,
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

const OtherTreatment = () => {
  const router = useRouter()
  const { animal_id, medical_record_id, id: hospital_case_id } = router.query
  const [isAddDrawerOpen, setAddDrawerOpen] = useState(false)
  const [isEditDrawerOpen, setEditDrawerOpen] = useState(false)

  const [formData, setFormData] = useState({
    startDate: dayjs('2025-07-12'),
    treatmentName: null,
    notes: ''
  })

  const [editFormData, setEditFormData] = useState({
    startDate: dayjs(),
    notes: '',
    activeActivityId: null
  })
  const [selectedTreatment, setSelectedTreatment] = useState(null)
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [treatmentGroups, setTreatmentGroups] = useState([])
  const [treatmentOptions, setTreatmentOptions] = useState(defaultTreatmentOptions)
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
      activeActivityId: null
    })
    setIsUpdatingTreatment(false)
    setIsDeletingTreatment(false)
  }, [])

  const totalTreatments = useMemo(
    () => treatmentGroups.reduce((sum, group) => sum + group.treatments.length, 0),
    [treatmentGroups]
  )

  const fetchTreatments = useCallback(async () => {
    if (!animal_id) return

    setTreatmentsLoading(true)
    try {
      const response = await getTreatmentList({
        animal_id,
        medical_record_id,
        hospital_case_id
      })

      const records = response?.data?.records || []
      setTreatmentGroups(mapRecordsToGroups(records))
    } catch (error) {
      Toaster({ type: 'error', message: error?.message || 'Failed to fetch treatments.' })
      setTreatmentGroups([])
    } finally {
      setTreatmentsLoading(false)
    }
  }, [animal_id, medical_record_id, hospital_case_id])

  const loadTreatmentActivities = useCallback(
    async ({ treatmentMasterId, medicalRecordId, animalId: fallbackAnimalId } = {}) => {
      const finalAnimalId = animal_id || fallbackAnimalId
      const finalMedicalRecordId = medicalRecordId || medical_record_id
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
          hospital_case_id
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
    [animal_id, medical_record_id, hospital_case_id]
  )

  useEffect(() => {
    fetchTreatments()
  }, [fetchTreatments])

  useEffect(() => {
    if (!isAddDrawerOpen) {
      setTreatmentOptions(defaultTreatmentOptions)
      setTreatmentOptionsLoading(false)

      return
    }

    let isMounted = true

    const handler = setTimeout(async () => {
      setTreatmentOptionsLoading(true)
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
        } else if (!treatmentSearchTerm) {
          setTreatmentOptions(defaultTreatmentOptions)
        } else {
          setTreatmentOptions([])
        }
      } catch (error) {
        if (isMounted) {
          if (!treatmentSearchTerm) {
            setTreatmentOptions(defaultTreatmentOptions)
          }
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

    if (!treatmentNameValue || treatmentNameValue.length < 3) {
      Toaster({ type: 'error', message: 'Treatment name must be at least 3 characters.' })

      return
    }

    if (!animal_id || !medical_record_id) {
      Toaster({ type: 'error', message: 'Missing patient identifiers to create treatment.' })

      return
    }

    const formattedStartTime = formData.startDate ? dayjs(formData.startDate).format('DD MMM YYYY HH:mm:ss') : ''

    const payload = {
      animal_id,
      medical_record_id,
      hospital_case_id: hospital_case_id || '',
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
          startDate: dayjs('2025-07-12'),
          treatmentName: null,
          notes: ''
        })
        setTreatmentInputValue('')
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
      activeActivityId: activity?.id || null
    })
    setEditDrawerOpen(true)

    loadTreatmentActivities({
      treatmentMasterId: treatment.treatmentMasterId || treatment.treatment_master_id || treatment.treatmentId || treatment.id,
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

    const finalAnimalId = selectedTreatment.animalId || animal_id
    const finalMedicalRecordId = selectedTreatment.medicalRecordId || medical_record_id

    if (!finalAnimalId || !finalMedicalRecordId) {
      Toaster({ type: 'error', message: 'Missing identifiers to update this treatment.' })

      return
    }

    const formattedStartTime = editFormData.startDate ? dayjs(editFormData.startDate).format('DD MMM YYYY HH:mm:ss') : ''

    const treatmentMasterId =
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
      hospital_case_id: selectedTreatment.hospitalCaseId || hospital_case_id || '',
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
      activeActivityId: activity.id || null
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
            color: '#44544A',
            fontWeight: 500,
            fontSize: '20px',
            letterSpacing: 0
          }}
        >
          Treatments - {totalTreatments}
        </Typography>
        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={() => setAddDrawerOpen(true)}
          sx={{
            boxShadow: '0px 4px 8px -4px #4C4E646B',

            // width: '258px',
            height: '42px',
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Add New Treatment
        </Button>
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
          <Typography sx={{ color: '#7A8684', fontWeight: 400, fontSize: '14px' }}>No treatments found.</Typography>
        )}

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
                  color: '#006D35'
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
                    sx={{
                      display: 'flex',
                      gap: '24px',
                      justifyContent: 'space-between',
                      borderRadius: '8px',
                      padding: '24px',
                      background: '#EFF5F2',
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
                          color: '#44544A',
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
                        onClick={() => handleOpenEditDrawer(treatment)}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            handleOpenEditDrawer(treatment)
                          }
                        }}
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
                                color: '#7A8684'
                              }}
                            >
                              Notes:
                            </Typography>
                            <Typography
                              sx={{
                                color: '#006D35',
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
                              color: '#7A8684'
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

                      <Typography
                        sx={{
                          fontWeight: 400,
                          fontSize: '14px',
                          color: '#44544A',
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

                      <Typography
                        sx={{
                          color: '#7A8684',
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
                        description={formatClinicianTimestamp(treatment.clinician.updatedAt)}
                        textColor='#44544A'
                      />
                    </Box>
                  </Box>
                )
              })}
            </Box>
          </Box>
        ))}
      </Box>

      <AddTreatmentDrawer
        open={isAddDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
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

const AddTreatmentDrawer = ({
  open,
  onClose,
  formData,
  onChange,
  onSubmit,
  treatmentOptions,
  onSearchTreatment,
  optionsLoading,
  onInputValueChange,
  isSubmitting
}) => {
  const handleTreatmentInputChange = (value, reason) => {
    if (reason === 'input') {
      onInputValueChange?.(value || '')
      onSearchTreatment?.(value || '')
      onChange('treatmentName', value || null)
      
return
    }

    if (reason === 'reset') {
      if (typeof value === 'string') {
        onInputValueChange?.(value)
      } else if (value?.label) {
        onInputValueChange?.(value.label)
      }

      return
    }

    if (reason === 'clear') {
      onInputValueChange?.('')
      onSearchTreatment?.('')
      onChange('treatmentName', null)
    }
  }

  const handleTreatmentSelect = value => {
    onChange('treatmentName', value)

    if (typeof value === 'string') {
      onInputValueChange?.(value)
    } else if (value?.label) {
      onInputValueChange?.(value.label)
    } else {
      onInputValueChange?.('')
    }
  }

  const { control, reset } = useForm({
    defaultValues: {
      treatmentName: formData.treatmentName || null,
      notes: formData.notes || ''
    }
  })

  useEffect(() => {
    reset({
      treatmentName: formData.treatmentName || null,
      notes: formData.notes || ''
    })
  }, [formData.treatmentName, formData.notes, reset, open])

  const commonFieldStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      backgroundColor: '#FFFFFF'
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: '#C3CEC7'
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#A3B3AA'
    },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#37BD69'
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor='right'
      sx={{
        '& .MuiDrawer-paper': {
          width: 480,
          maxWidth: '100%',
          backgroundColor: '#FFFFFF'
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            height: '77px',
            borderBottom: '1px solid #C3CEC7'
          }}
        >
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '24px',
              color: '#44544A',
              letterSpacing: 0
            }}
          >
            Add Treatment
          </Typography>
          <IconButton onClick={onClose} sx={{ color: '#1F515B', mr: -3 }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Typography
                sx={{
                  fontWeight: 400,
                  fontSize: '14px',
                  color: '#000000'
                }}
              >
                Treatment Start Date
              </Typography>
              <MUIDatePicker
                value={formData.startDate}
                onChange={value => onChange('startDate', value)}
                label=''
                format='DD MMM YYYY'
                sx={{
                  ...commonFieldStyles,
                  '& .MuiOutlinedInput-root': {
                    ...(commonFieldStyles['& .MuiOutlinedInput-root'] || {}),
                    height: '56px'
                  },
                  '& .MuiInputBase-input': {
                    fontWeight: 500,
                    fontSize: '16px',
                    color: '#44544A'
                  }
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: '16px',
                  color: '#44544A'
                }}
              >
                Treatment Name
              </Typography>
              <ControlledAutocomplete
                name='treatmentName'
                label=''
                control={control}
                errors={{}}
                options={treatmentOptions}
                loading={optionsLoading}
                fullWidth
                getOptionLabel={option => option?.label || option || ''}
                isOptionEqualToValue={(option, value) =>
                  (option?.value && option?.value === value?.value) || option === value
                }
                onChangeOverride={handleTreatmentSelect}
                onInputChange={handleTreatmentInputChange}
                inputBackgroundColor='#FFFFFF'
                textFieldProps={{
                  placeholder: 'Select treatment',
                  sx: {
                    ...commonFieldStyles,
                    '& .MuiOutlinedInput-root': {
                      ...(commonFieldStyles['& .MuiOutlinedInput-root'] || {}),
                      height: '56px'
                    }
                  },
                  InputProps: {
                    sx: {
                      fontWeight: 500,
                      fontSize: '16px',
                      color: '#44544A'
                    }
                  }
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    backgroundColor: '#FFFFFF'
                  }
                }}
              />
            </Box>

            <ControlledTextArea
              name='notes'
              label=''
              control={control}
              errors={{}}
              rows={4}
              placeholder='Add notes'
              onChangeOverride={event => onChange('notes', event?.target?.value || '')}
              inputBackgroundColor='#FFFFFF'
              sx={{
                ...commonFieldStyles,
                '& .MuiOutlinedInput-root': {
                  ...(commonFieldStyles['& .MuiOutlinedInput-root'] || {}),
                  minHeight: '120px'
                }
              }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            boxShadow: '0px -1px 30px 0px #0000001A',
            height: '104px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#FFFFFF'
          }}
        >
          <Button
            fullWidth
            variant='contained'
            onClick={onSubmit}
            disabled={isSubmitting}
            sx={{
              borderRadius: '8px',
              height: '56px',
              fontWeight: 600,
              fontSize: '16px',
              textTransform: 'uppercase',
              backgroundColor: '#1BB874',
              boxShadow: '0px 6px 12px -4px #1BB87466',
              '&:hover': {
                backgroundColor: '#159C61'
              }
            }}
          >
            {isSubmitting ? 'Adding...' : 'Add'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

const EditTreatmentDrawer = ({
  open,
  onClose,
  treatment,
  formData,
  onChange,
  onUpdate,
  onDelete,
  onActivityPrefill,
  activities = [],
  isActivitiesLoading = false,
  isSubmitting = false
}) => {
  const { control, reset } = useForm({
    defaultValues: {
      editNotes: formData.notes || '',
      startDate: formData.startDate || dayjs()
    }
  })

  useEffect(() => {
    reset({
      editNotes: formData.notes || '',
      startDate: formData.startDate || dayjs()
    })
  }, [formData.notes, formData.startDate, reset, open])

  if (!treatment) return null

  const commonFieldStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      backgroundColor: '#FFFFFF'
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: '#C3CEC7'
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#A3B3AA'
    },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#37BD69'
    }
  }

  const activityList = activities || []

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor='right'
      sx={{
        '& .MuiDrawer-paper': {
          width: 540,
          maxWidth: '100%',
          backgroundColor: '#FFFFFF'
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            height: '77px',
            borderBottom: '1px solid #C3CEC7'
          }}
        >
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '24px',
              color: '#44544A'
            }}
          >
            Edit Treatment
          </Typography>
          <IconButton onClick={onClose} sx={{ color: '#1F515B', mr: -1 }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
            <Box>
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: '24px',
                  color: '#44544A',
                  mb: '4px'
                }}
              >
                {treatment.name}
              </Typography>
              <Typography
                sx={{
                  color: '#44544A',
                  fontWeight: 400,
                  fontSize: '14px'
                }}
              >
                {treatment.clinician?.name || '—'} • {formatTimestamp(treatment.lastUpdated)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Typography
                  sx={{
                    fontWeight: 400,
                    fontSize: '14px',
                    color: '#000000'
                  }}
                >
                  Treatment Start Date
                </Typography>
                <Controller
                  name='startDate'
                  control={control}
                  defaultValue={formData.startDate || dayjs()}
                  render={({ field }) => (
                    <MUIDatePicker
                      value={field.value}
                      onChange={value => {
                        field.onChange(value)
                        onChange('startDate', value)
                      }}
                      label=''
                      format='DD MMM YYYY'
                      sx={{
                        ...commonFieldStyles,
                        '& .MuiOutlinedInput-root': {
                          ...(commonFieldStyles['& .MuiOutlinedInput-root'] || {}),
                          height: '56px'
                        },
                        '& .MuiInputBase-input': {
                          fontWeight: 500,
                          fontSize: '16px',
                          color: '#44544A'
                        }
                      }}
                    />
                  )}
                />
              </Box>

              <ControlledTextArea
                name='editNotes'
                label=''
                control={control}
                errors={{}}
                rows={4}
                placeholder='Add notes'
                onChangeOverride={event => onChange('notes', event?.target?.value || '')}
                inputBackgroundColor='#FFFFFF'
                sx={{
                  ...commonFieldStyles,
                  '& .MuiOutlinedInput-root': {
                    ...(commonFieldStyles['& .MuiOutlinedInput-root'] || {}),
                    minHeight: '120px'
                  }
                }}
              />
            </Box>
          </Box>

          <Box
            sx={{
              borderTop: '1px solid #C3CEC7',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '24px'
            }}
          >
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: '20px',
                color: '#44544A'
              }}
            >
              Activity
            </Typography>

            {isActivitiesLoading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2].map(item => (
                  <Skeleton key={`activity-skeleton-${item}`} variant='rounded' height={96} sx={{ borderRadius: '8px' }} />
                ))}
              </Box>
            ) : activityList.length === 0 ? (
              <Typography
                sx={{
                  color: '#7A8684',
                  fontWeight: 400,
                  fontSize: '14px'
                }}
              >
                No activity records available.
              </Typography>
            ) : (
              activityList.map(activity => {
                const isSelected = formData?.activeActivityId === activity.id

                if (activity.isEditable) {
                  return (
                    <Box
                      key={activity.id}
                      role='button'
                      tabIndex={0}
                      onClick={() => onActivityPrefill?.(activity)}
                      onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          onActivityPrefill?.(activity)
                        }
                      }}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        borderRadius: '8px',
                        padding: '12px',
                        border: `1px solid ${isSelected ? '#37BD69' : '#FCF4AE'}`,
                        backgroundColor: isSelected ? '#DFF5E7' : '#FCF4AE66',
                        cursor: 'pointer'
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          gap: '8px',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start'
                        }}
                      >
                        <Typography
                          sx={{
                            color: '#44544A',
                            fontWeight: 400,
                            fontSize: '14px'
                          }}
                        >
                          {activity.note || activity.description || 'No notes recorded.'}
                        </Typography>
                        <IconButton
                          size='small'
                          sx={{ color: '#44544A', p: 1 }}
                          onClick={event => {
                            event.stopPropagation()
                            onActivityPrefill?.(activity)
                          }}
                        >
                          <Icon icon='mdi:pencil-outline' />
                        </IconButton>
                      </Box>
                      <Typography
                        sx={{
                          color: '#7A8684',
                          fontWeight: 400,
                          fontSize: '12px',
                          lineHeight: '100%'
                        }}
                      >
                        {activity.author} • {formatTimestamp(activity.timestamp)}
                      </Typography>
                    </Box>
                  )
                }

                return (
                  <Box
                    key={activity.id}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: '#EFF5F2'
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <Typography
                        sx={{
                          color: '#44544A',
                          fontWeight: 500,
                          fontSize: '16px'
                        }}
                      >
                        {activity.treatmentName || activity.title || 'Treatment Activity'}
                      </Typography>
                      {activity.medicalRecordCode ? (
                        <Typography
                          sx={{
                            color: '#7A8684',
                            fontWeight: 400,
                            fontSize: '12px'
                          }}
                        >
                          Medical Record: {activity.medicalRecordCode}
                        </Typography>
                      ) : null}
                      <Typography
                        sx={{
                          color: '#7A8684',
                          fontWeight: 400,
                          fontSize: '12px',
                          lineHeight: '100%'
                        }}
                      >
                        {activity.author} • {formatTimestamp(activity.timestamp)}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        color: '#44544A',
                        fontWeight: 400,
                        fontSize: '12px'
                      }}
                    >
                      Treatment Start Date:{' '}
                      <Box component='span' sx={{ fontWeight: 600 }}>
                        {formatShortDate(activity.treatmentStartDate)}
                      </Box>
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <Typography
                        sx={{
                          color: '#7A8684',
                          fontWeight: 400,
                          fontSize: '12px'
                        }}
                      >
                        Notes
                      </Typography>
                      <Typography
                        sx={{
                          color: '#44544A',
                          fontWeight: 400,
                          fontSize: '14px'
                        }}
                      >
                        {activity.note || 'No notes recorded.'}
                      </Typography>
                    </Box>
                  </Box>
                )
              })
            )}
          </Box>
        </Box>

        <Box
          sx={{
            boxShadow: '0px -1px 30px 0px #0000001A',
            minHeight: '104px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            backgroundColor: '#FFFFFF'
          }}
        >
          <Button
            variant='outlined'
            fullWidth
            onClick={onDelete}
            sx={{
              height: '56px',
              borderRadius: '8px',
              borderColor: '#E93353',
              color: '#E93353',
              borderWidth: '1px',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#C41C3D',
                backgroundColor: '#FCE8EC'
              }
            }}
          >
            Delete
          </Button>
          <Button
            variant='contained'
            fullWidth
            onClick={onUpdate}
            disabled={isSubmitting || !formData?.activeActivityId}
            sx={{
              height: '56px',
              borderRadius: '8px',
              fontWeight: 600,
              backgroundColor: '#1F515B',
              boxShadow: '0px 4px 8px -4px #4C4E646B',
              '&:hover': {
                backgroundColor: '#173D44'
              }
            }}
          >
            {isSubmitting ? 'Updating...' : 'Update'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}
