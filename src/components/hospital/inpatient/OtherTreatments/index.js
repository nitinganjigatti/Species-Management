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
import NoMedicalData from 'src/views/utility/NoMedicalData'

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

const getApiRecords = response => {
  if (Array.isArray(response?.data?.records)) return response.data.records

  return []
}

const parseNotesCount = value => {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : null
}

const extractTreatmentEntries = record => {
  if (Array.isArray(record?.treatments) && record.treatments.length) return record.treatments
  if (record?.treatment_name) return [record]

  return []
}

const mapTreatmentEntry = (entry, index = 0) => {
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
      createdAt: entry.created_at || ''
    },
    animalId: entry.animal_id || null,
    medicalRecordId: entry.medical_record_id || null,
    medicalRecordCode: entry.medical_record_code || '',
    treatmentMasterId: entry.treatment_master_id || null,
    hospitalCaseId: entry.hospital_case_id || null,
    notes_count: notesCount
  }
}

const mapRecordsToGroups = (records = []) => {
  if (!records.length) return []

  return records
    .map((record, index) => {
      const treatments = extractTreatmentEntries(record).map(mapTreatmentEntry).filter(Boolean)

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

const mapDetailRecordsToActivities = (records = []) => {
  const treatmentEntries = records.flatMap(extractTreatmentEntries)
  if (!treatmentEntries.length) return []

  return treatmentEntries.map((entry, index) => {
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
    activeActivityId: null
  })
  const [selectedTreatment, setSelectedTreatment] = useState(null)
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [treatmentGroups, setTreatmentGroups] = useState([])
  const [treatmentOptions, setTreatmentOptions] = useState([])
  const [treatmentOptionsLoading, setTreatmentOptionsLoading] = useState(false)
  const [treatmentSearchTerm, setTreatmentSearchTerm] = useState('')
  const [isCreatingTreatment, setIsCreatingTreatment] = useState(false)
  const [isAddingTreatmentNote, setIsAddingTreatmentNote] = useState(false)
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

      setTreatmentGroups(mapRecordsToGroups(getApiRecords(response)))
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

        setSelectedTreatmentActivities(mapDetailRecordsToActivities(getApiRecords(response)))
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
      note: formData.notes || '',
      is_edit: 0
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

    const inferredStartDate = treatment.treatment_start_date_time

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

    const treatmentMasterId = selectedTreatment?.name || ''

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

  const handleAddTreatmentNote = async () => {
    if (!selectedTreatment) {
      Toaster({ type: 'error', message: 'Select a treatment to add note.' })

      return
    }

    const finalAnimalId = selectedTreatment.animalId || animalId
    const finalMedicalRecordId = selectedTreatment.medicalRecordId || medicalRecordId

    if (!finalAnimalId || !finalMedicalRecordId) {
      Toaster({ type: 'error', message: 'Missing identifiers to add this treatment note.' })

      return
    }

    const formattedStartTime = editFormData.startDate
      ? dayjs(editFormData.startDate).format('DD MMM YYYY HH:mm:ss')
      : ''

    const treatmentMasterId = selectedTreatment?.name || ''

    if (!treatmentMasterId) {
      Toaster({ type: 'error', message: 'Unable to determine treatment reference.' })

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
      const response = await createTreatmentRecord(payload)
      Toaster({
        type: response?.success ? 'success' : 'error',
        message: response?.message || 'Treatment note creation status unknown.'
      })
      if (response?.success) {
        closeEditDrawer()
        fetchTreatments()
      }
    } catch (error) {
      Toaster({ type: 'error', message: error?.message || 'Failed to add treatment note.' })
    } finally {
      setIsAddingTreatmentNote(false)
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

    const inferredStartDate = activity.treatment_start_date_time
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
            color: theme.palette.customColors.OnSurfaceVariant,
            fontWeight: 500,
            fontSize: '20px',
            letterSpacing: 0
          }}
        >
          Treatments {totalTreatments > 0 ? ` - ${totalTreatments}` : ''}
        </Typography>
        {!patientDischarged && !isTreatmentsLoading && treatmentGroups.length > 0 && (
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
          // <NoDataFound variant='Seal' height={300} width={300} />
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <NoMedicalData
              btnText={'ADD NEW TREATMENT'}
              text={'All Added Treatments Will Appear here'}
              isDischarged={patientDischarged}
              btnAction={handleOpenAddDrawer}
            />
          </Box>
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
