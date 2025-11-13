import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Button, Drawer, IconButton, Skeleton, Tooltip, Typography } from '@mui/material'
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material'
import dayjs from 'dayjs'
import { Icon } from '@iconify/react'
import UserInfoCard from 'src/views/utility/insights/UserInfoCard'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import { useForm, Controller } from 'react-hook-form'
import MUIDatePicker from 'src/views/forms/form-fields/MUIDatePicker'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import DialogConfirmationDialog from 'src/views/utility/DeleteConfirmationDialog'
import { createTreatmentRecord, getTreatmentMasterList, getTreatmentList } from 'src/lib/api/hospital/treatmentMaster'
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

const buildTreatmentFromRecord = record => ({
  id: record.id,
  name: record.treatment_name || 'Treatment',
  noteCount: record.note ? 1 : 0,
  noteSummary: record.note?.trim() || 'No notes added yet.',
  lastUpdated: record.updated_at || record.created_at || null,
  clinician: {
    name: record.created_by_name || '—',
    avatarUrl: record.profile_pic || '',
    updatedAt: record.updated_at || record.created_at || ''
  },
  activities: record.activities || []
})

const mapRecordsToGroups = (records = []) => {
  if (!records.length) return []

  const grouped = records.reduce((acc, record) => {
    const key = record.treatment_master_id || 'default'
    if (!acc[key]) {
      acc[key] = {
        id: key,
        code: record.treatment_name ? `Treatment - ${record.treatment_name}` : 'Treatment',
        icon: 'mdi:medical-bag-outline',
        treatments: []
      }
    }
    acc[key].treatments.push(buildTreatmentFromRecord(record))

    return acc
  }, {})

  return Object.values(grouped)
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

  const totalTreatments = useMemo(
    () => treatmentGroups.reduce((sum, group) => sum + group.treatments.length, 0),
    [treatmentGroups]
  )

  const fetchTreatments = useCallback(async () => {
    if (!animal_id || !medical_record_id) return

    setTreatmentsLoading(true)
    try {
      const response = await getTreatmentList({
        animal_id,
        medical_record_id,
        hospital_case_id: hospital_case_id ?? 'null',
        page: 0,
        limit: 10
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

  useEffect(() => {
    fetchTreatments()
  }, [fetchTreatments])

  useEffect(() => {
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
  }, [treatmentSearchTerm])

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
      Toaster({ type: response?.success ? 'success' : 'error', message: response?.message || 'Treatment creation status unknown.' })
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
  }

  const handleUpdateTreatment = () => {
    console.log('Update payload:', {
      treatmentId: selectedTreatment?.id,
      startDate: editFormData.startDate ? editFormData.startDate.toISOString() : null,
      notes: editFormData.notes,
      activityId: editFormData.activeActivityId
    })
    setEditDrawerOpen(false)
  }

  const handleDeleteTreatment = () => {
    setDeleteDialogOpen(true)
  }

  const handleConfirmDeleteTreatment = () => {
    console.log('Delete treatment/activity:', {
      treatmentId: selectedTreatment?.id,
      activityId: editFormData.activeActivityId
    })
    setDeleteDialogOpen(false)
    setEditDrawerOpen(false)
  }

  const handleCancelDeleteTreatment = () => {
    setDeleteDialogOpen(false)
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Icon icon={group.icon} color='#006D35' width={20} height={20} />
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
              {group.treatments.map(treatment => (
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
                          +{treatment.noteCount}
                        </Typography>
                      </Box>

                      <Icon icon='mdi:note-text-outline' color='#006D35' width={18} height={18} />
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
              ))}
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
        onClose={() => setEditDrawerOpen(false)}
        treatment={selectedTreatment}
        formData={editFormData}
        onChange={handleEditFieldChange}
        onDelete={handleDeleteTreatment}
        onUpdate={handleUpdateTreatment}
        onActivityPrefill={handlePrefillFromActivity}
      />

      <DialogConfirmationDialog
        open={isDeleteDialogOpen}
        handleClose={handleCancelDeleteTreatment}
        action={handleConfirmDeleteTreatment}
        message='Are you sure you want to delete this treatment?'
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
  onActivityPrefill
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

  const activityList = treatment.activities || []

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

            {activityList.map(activity => {
              if (activity.status === 'pending') {
                return (
                  <Box
                    key={activity.id}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      borderRadius: '8px',
                      padding: '12px',
                      border: '1px solid #FCF4AE',
                      backgroundColor: '#FCF4AE66'
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography
                        sx={{
                          color: '#44544A',
                          fontWeight: 400,
                          fontSize: '14px'
                        }}
                      >
                        {activity.description}
                      </Typography>
                      <IconButton
                        size='small'
                        sx={{ color: '#44544A', p: 1 }}
                        onClick={() => onActivityPrefill?.(activity)}
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
                    padding: '12px',
                    backgroundColor: '#EFF5F2'
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <Typography
                      sx={{
                        color: '#44544A',
                        fontWeight: 400,
                        fontSize: '14px'
                      }}
                    >
                      {activity.title || 'Status Update'}
                    </Typography>
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
                      {activity.notes}
                    </Typography>
                  </Box>
                </Box>
              )
            })}
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
            Update
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}
