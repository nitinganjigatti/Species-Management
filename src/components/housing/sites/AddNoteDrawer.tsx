import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Typography,
  Drawer,
  IconButton,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  FormHelperText,
  Chip,
  Autocomplete,
  Switch,
  Avatar,
  Divider
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Close as CloseIcon, Add as AddIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material'
import { useSelector, useDispatch } from 'react-redux'
import { createObservation } from 'src/lib/api/housing'
import { fetchUsers } from 'src/store/slices/housing/notesSlice'
import { useAuth } from 'src/hooks/useAuth'
import Toaster from 'src/components/Toaster'
import SelectNoteTypeDrawer from './SelectNoteTypeDrawer'
import Icon from 'src/@core/components/icon'
import AnimalCard from 'src/views/utility/AnimalCard'
import type { User, ObservationType, ObservationMasterItem } from 'src/types/housing'
import type { RootState, AppDispatch } from 'src/store'

interface FileIconConfig {
  icon: string
  bg_color: string
  icon_color: string
}

interface FileIconsMap {
  [key: string]: FileIconConfig
}

interface ExtIconMap {
  [key: string]: string[]
}

// File type configuration for icons
const EXT_ICON_MAP: ExtIconMap = {
  image: ['jpeg', 'jpg', 'png', 'svg', 'gif', 'webp'],
  pdf: ['pdf'],
  xls: ['xls', 'xlsx'],
  document: ['doc', 'docx'],
  audio: ['mp3', 'wav', 'ogg', 'm4a'],
  video: ['mp4', 'mov', 'avi', 'webm', 'mkv'],
  ppt: ['ppt', 'pptx'],
  text: ['txt'],
  csv: ['csv'],
  zip: ['zip', 'rar', '7z']
}

// Icon configuration for non-image files
const FILE_ICONS: FileIconsMap = {
  pdf: { icon: 'mdi:file-pdf-box', bg_color: '#FFEBEE', icon_color: '#D32F2F' },
  xls: { icon: 'mdi:file-excel', bg_color: '#E8F5E9', icon_color: '#388E3C' },
  document: { icon: 'mdi:file-word', bg_color: '#E3F2FD', icon_color: '#1976D2' },
  audio: { icon: 'mdi:file-music', bg_color: '#FFF3E0', icon_color: '#F57C00' },
  video: { icon: 'mdi:play-circle', bg_color: '#E1F5FE', icon_color: '#0288D1' },
  ppt: { icon: 'mdi:file-powerpoint', bg_color: '#FBE9E7', icon_color: '#D84315' },
  text: { icon: 'mdi:file-document', bg_color: '#F5F5F5', icon_color: '#616161' },
  csv: { icon: 'mdi:file-delimited', bg_color: '#E8F5E9', icon_color: '#388E3C' },
  zip: { icon: 'mdi:folder-zip', bg_color: '#FFF8E1', icon_color: '#FFA000' },
  default: { icon: 'mdi:file', bg_color: '#ECEFF1', icon_color: '#607D8B' }
}

interface PriorityOption {
  value: string
  label: string
  icon: string
}

const PRIORITY_OPTIONS: PriorityOption[] = [
  { value: 'Low', label: 'Low', icon: '/images/priority/flag_priority_low.svg' },
  { value: 'Moderate', label: 'Moderate', icon: '/images/priority/flag_priority_medium.svg' },
  { value: 'High', label: 'High', icon: '/images/priority/flag_priority_high.svg' },
  { value: 'Critical', label: 'Critical', icon: '/images/priority/flag_priority_critical.svg' }
]

interface FormData {
  observationType: ObservationType | null
  childTypes: ObservationMasterItem[]
  priority: string
  notes: string
  attachments: File[]
  notifyEnabled: boolean
  notifyMembers: User[]
}

interface FormErrors {
  observationType?: string | null
  priority?: string | null
  notes?: string | null
}

interface SelectedTypes {
  observationType?: ObservationType | null
  childTypes?: ObservationMasterItem[]
}

interface AddNoteDrawerProps {
  open: boolean
  onClose: () => void
  refType?: 'site' | 'section' | 'enclosure' | 'animal'
  refId?: string
  onSuccess?: () => void
  entityName?: string
  entityImage?: string
  animalData?: any
}

const AddNoteDrawer: React.FC<AddNoteDrawerProps> = ({
  open,
  onClose,
  refType = 'site',
  refId,
  onSuccess,
  entityName,
  entityImage,
  animalData
}) => {
  const theme = useTheme()
  const dispatch = useDispatch<AppDispatch>()
  const auth = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { users, usersLoading } = useSelector((state: RootState) => state.notes)
  const zooId = (auth as any)?.userData?.user?.zoos?.[0]?.zoo_id

  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    observationType: null,
    childTypes: [],
    priority: 'Low',
    notes: '',
    attachments: [],
    notifyEnabled: false,
    notifyMembers: []
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [noteTypeDrawerOpen, setNoteTypeDrawerOpen] = useState(false)

  useEffect(() => {
    if (open) {
      resetForm()
      if (zooId) {
        dispatch(fetchUsers({ zoo_id: zooId }))
      }
    }
  }, [open, dispatch, zooId])

  const resetForm = () => {
    setFormData({
      observationType: null,
      childTypes: [],
      priority: 'Low',
      notes: '',
      attachments: [],
      notifyEnabled: false,
      notifyMembers: []
    })
    setErrors({})
    setNoteTypeDrawerOpen(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleNoteTypeSelect = (selected: SelectedTypes) => {
    setFormData(prev => ({
      ...prev,
      observationType: selected.observationType || null,
      childTypes: selected.childTypes || []
    }))
    setErrors(prev => ({ ...prev, observationType: null }))
  }

  const handleRemoveNoteType = () => {
    setFormData(prev => ({
      ...prev,
      observationType: null,
      childTypes: []
    }))
  }

  const handlePriorityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, priority: e.target.value }))
    setErrors(prev => ({ ...prev, priority: null }))
  }

  const handleNotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, notes: e.target.value }))
    setErrors(prev => ({ ...prev, notes: null }))
  }

  const handleNotifyToggle = () => {
    setFormData(prev => ({
      ...prev,
      notifyEnabled: !prev.notifyEnabled,
      notifyMembers: !prev.notifyEnabled ? prev.notifyMembers : []
    }))
  }

  const handleNotifyMembersChange = (_event: React.SyntheticEvent, newValue: User[]) => {
    setFormData(prev => ({ ...prev, notifyMembers: newValue }))
  }

  const handleRemoveMember = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      notifyMembers: prev.notifyMembers.filter(m => m.user_id !== userId)
    }))
  }

  const getInitials = (name: string | undefined): string => {
    if (!name) return ''
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }

    return name.substring(0, 2).toUpperCase()
  }

  // Get file icon configuration based on file extension
  const getFileIconConfig = (file: File | null): FileIconConfig => {
    if (!file) return FILE_ICONS.default

    const fileName = file.name?.toLowerCase() || ''
    const extension = fileName.split('.').pop() || ''

    for (const [key, extList] of Object.entries(EXT_ICON_MAP)) {
      if (extList.includes(extension)) {
        return FILE_ICONS[key] || FILE_ICONS.default
      }
    }

    return FILE_ICONS.default
  }

  // Check if file is an image
  const isImageFile = (file: File | null): boolean => {
    if (!file) return false
    const fileName = file.name?.toLowerCase() || ''
    const extension = fileName.split('.').pop() || ''

    return EXT_ICON_MAP.image.includes(extension) || file.type?.startsWith('image/')
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const maxSize = 25 * 1024 * 1024 // 25MB

    const validFiles: File[] = []
    selectedFiles.forEach(file => {
      if (file.size > maxSize) {
        Toaster({ type: 'error', message: `${file.name} is too large. Max size is 25MB.` })
      } else {
        validFiles.push(file)
      }
    })

    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...validFiles]
      }))
    }

    // Reset input to allow re-selection of same file
    e.target.value = ''
  }

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files || [])
    const maxSize = 25 * 1024 * 1024

    const validFiles: File[] = []
    droppedFiles.forEach(file => {
      if (file.size > maxSize) {
        Toaster({ type: 'error', message: `${file.name} is too large. Max size is 25MB.` })
      } else {
        validFiles.push(file)
      }
    })

    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...validFiles]
      }))
    }
  }

  const handleRemoveAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.observationType) {
      newErrors.observationType = 'Please select a note type'
    }

    if (!formData.priority) {
      newErrors.priority = 'Please select a priority'
    }

    if (!formData.notes?.trim() && formData.attachments.length === 0) {
      newErrors.notes = 'Please enter notes or add an attachment'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const submitData = new FormData()

      // Zoo ID
      if (zooId) {
        submitData.append('zoo_id', String(zooId))
      }

      // Observation type IDs
      const typeIds: number[] = [formData.observationType!.id]
      if (formData.childTypes.length > 0) {
        formData.childTypes.forEach(ct => typeIds.push(ct.id))
      }
      submitData.append('observation_type_id', JSON.stringify(typeIds))

      // Priority
      submitData.append('priority', formData.priority)

      // Notes
      if (formData.notes?.trim()) {
        submitData.append('observation_name', formData.notes.trim())
      }

      // Reference type and ID
      if (refType === 'site') {
        submitData.append('site_id', JSON.stringify([refId]))
      } else if (refType === 'section') {
        submitData.append('section_id', JSON.stringify([refId]))
      } else if (refType === 'enclosure') {
        submitData.append('enclosure_id', JSON.stringify([refId]))
      } else if (refType === 'animal') {
        submitData.append('animal_id', JSON.stringify([refId]))
      }

      // Attachments
      formData.attachments.forEach(file => {
        submitData.append('observation_attachment[]', file)
      })

      // Notify Members (assign_to) - only if toggle is enabled
      if (formData.notifyEnabled && formData.notifyMembers.length > 0) {
        const memberIds = formData.notifyMembers.map(member => member.user_id)
        submitData.append('assign_to', JSON.stringify(memberIds))
      }

      const response = await createObservation(submitData)

      if (response?.success) {
        Toaster({ type: 'success', message: 'Note added successfully' })
        handleClose()
        if (onSuccess) onSuccess()
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to add note' })
      }
    } catch (error) {
      console.error('Error creating observation:', error)
      Toaster({ type: 'error', message: 'Failed to add note' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      onClose={handleClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 500 },
            backgroundColor: theme.palette.customColors?.Background ,
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          backgroundColor: theme.palette.customColors?.OnPrimary         }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 5,
            py: 4,
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.customColors?.OnPrimary ,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 600 }}>Add Note</Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Form Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0, p: 5 }}>
          {/* Entity Info */}
          {(entityName || animalData) && (
            <Box sx={{ mb: 4 }}>
              <Box
                sx={{
                  borderRadius: '8px',
                  border: `1px solid ${theme.palette.customColors?.OutlineVariant }`,
                  overflow: 'hidden'
                }}
              >
                <Box
                  sx={{
                    bgcolor: theme.palette.customColors?.displaybgPrimary ,
                    px: 3,
                    py: 2,
                    borderBottom: `1px solid ${theme.palette.customColors?.OutlineVariant }`
                  }}
                >
                  <Typography
                    sx={{
                      color: theme.palette.customColors?.OnSurfaceVariant ,
                      fontWeight: 600,
                      fontSize: '1rem'
                    }}
                  >
                    1 Entity
                  </Typography>
                </Box>

                <Box sx={{ px: 3, py: 2 }}>
                  {refType === 'animal' && animalData ? (
                    <AnimalCard data={animalData} size='14px' />
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}
                    >
                      <Avatar
                        src={entityImage || undefined}
                        sx={{
                          width: 48,
                          height: 48,
                          border: `1px solid ${theme.palette.customColors?.OutlineVariant }`
                        }}
                      >
                        {entityName?.[0]}
                      </Avatar>
                      <Typography sx={{ fontSize: '0.95rem', fontWeight: 500, color: theme.palette.text.primary }}>
                        {refType ? refType.charAt(0).toUpperCase() + refType.slice(1) : 'Entity'}: {entityName}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              <Typography variant='body2' color='text.secondary' sx={{ mt: 1.5 }}>
                Notes related to an animal, enclosure, section or a site
              </Typography>
            </Box>
          )}

          {/* Observation Type */}
          <Box sx={{ mb: 4 }}>
            <Typography
              sx={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: theme.palette.text.primary,
                mb: 2
              }}
            >
              Note Type <span style={{ color: 'red' }}>*</span>
            </Typography>

            {/* Selected Types Display - Mobile Style */}
            {formData.observationType ? (
              <Box
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  overflow: 'hidden'
                }}
              >
                {/* Header with parent type */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2,
                    py: 1.5,
                    backgroundColor: theme.palette.customColors.Background,
                    borderBottom: formData.childTypes?.length > 0 ? `1px solid ${theme.palette.divider}` : 'none'
                  }}
                >
                  <Typography
                    sx={{ fontWeight: 600, fontSize: '0.95rem', color: theme.palette.customColors.OnPrimaryContainer }}
                  >
                    {(formData.observationType as any).type_name || formData.observationType.name}
                  </Typography>
                  <IconButton size='small' onClick={handleRemoveNoteType} sx={{ color: theme.palette.error.main }}>
                    <CloseIcon fontSize='small' />
                  </IconButton>
                </Box>

                {/* Child types list */}
                {formData.childTypes?.length > 0 && (
                  <Box sx={{ px: 2, py: 1 }}>
                    {formData.childTypes.map(childType => (
                      <Box
                        key={childType.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          py: 0.75
                        }}
                      >
                        <Box
                          component='span'
                          sx={{
                            color: theme.palette.success.main,
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          ✓
                        </Box>
                        <Typography
                          sx={{
                            fontSize: '14px',
                            fontWeight: 500,
                            color: theme.palette.customColors.OnPrimaryConatiner
                          }}
                        >
                          {(childType as any).type_name || childType.name}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            ) : (
              <Button
                variant='contained'
                fullWidth
                startIcon={<AddIcon />}
                onClick={() => setNoteTypeDrawerOpen(true)}
                sx={{
                  borderColor: errors.observationType ? theme.palette.error.main : undefined,
                  backgroundColor: theme.palette.customColors.OnPrimaryContainer
                }}
              >
                Add Type
              </Button>
            )}
            {errors.observationType && (
              <FormHelperText error sx={{ mt: 1 }}>
                {errors.observationType}
              </FormHelperText>
            )}
          </Box>

          {/* Priority */}
          <Box sx={{ mb: 4 }}>
            <FormControl component='fieldset' error={!!errors.priority}>
              <FormLabel
                component='legend'
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: theme.palette.text.primary,
                  mb: 1
                }}
              >
                Priority <span style={{ color: 'red' }}>*</span>
              </FormLabel>
              <RadioGroup row value={formData.priority} onChange={handlePriorityChange}>
                {PRIORITY_OPTIONS.map(option => (
                  <FormControlLabel
                    key={option.value}
                    value={option.value}
                    control={<Radio size='small' />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box component='img' src={option.icon} alt={option.label} sx={{ height: 16 }} />
                        <Typography variant='body2'>{option.label}</Typography>
                      </Box>
                    }
                  />
                ))}
              </RadioGroup>
              {errors.priority && <FormHelperText>{errors.priority}</FormHelperText>}
            </FormControl>
          </Box>

          {/* Notes */}
          <Box sx={{ mb: 4 }}>
            <Typography
              sx={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: theme.palette.text.primary,
                mb: 1
              }}
            >
              Notes
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder='Enter your notes here...'
              value={formData.notes}
              onChange={handleNotesChange}
              error={!!errors.notes}
              helperText={errors.notes}
            />
          </Box>

          {/* Notify Member */}
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                overflow: 'hidden'
              }}
            >
              {/* Toggle Header */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 2,
                  py: 1.5,
                  backgroundColor: formData.notifyEnabled
                    ? theme.palette.customColors?.displaybgPrimary                     : theme.palette.background.paper
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <PersonAddIcon sx={{ color: theme.palette.text.secondary }} />
                  <Typography sx={{ fontWeight: 500, fontSize: '0.95rem' }}>Notify Members</Typography>
                </Box>
                <Switch checked={formData.notifyEnabled} onChange={handleNotifyToggle} />
              </Box>

              {/* Member Selection - Only shown when toggle is ON */}
              {formData.notifyEnabled && (
                <Box sx={{ borderTop: `1px solid ${theme.palette.divider}` }}>
                  {/* Add Members Button */}
                  <Box sx={{ p: 2 }}>
                    <Autocomplete
                      multiple
                      options={users || []}
                      getOptionLabel={(option: User) => option.user_name || ''}
                      value={formData.notifyMembers}
                      onChange={handleNotifyMembersChange}
                      loading={usersLoading}
                      renderInput={params => (
                        <TextField
                          {...params}
                          placeholder={formData.notifyMembers.length === 0 ? 'Add members to be notified' : ''}
                          size='small'
                        />
                      )}
                      renderTags={() => null}
                      isOptionEqualToValue={(option, value) => option.user_id === value.user_id}
                    />
                  </Box>

                  {/* Selected Members Display */}
                  {formData.notifyMembers.length > 0 && (
                    <Box
                      sx={{
                        px: 2,
                        pb: 2,
                        display: 'flex',
                        gap: 1,
                        flexWrap: 'wrap'
                      }}
                    >
                      {formData.notifyMembers.map(member => (
                        <Chip
                          key={member.user_id}
                          avatar={
                            member.user_profile_pic ? (
                              <Avatar src={member.user_profile_pic} />
                            ) : (
                              <Avatar>{getInitials(member.user_name)}</Avatar>
                            )
                          }
                          label={member.user_name}
                          onDelete={() => handleRemoveMember(member.user_id)}
                          sx={{ height: 36 }}
                        />
                      ))}
                    </Box>
                  )}

                  {/* Member Count */}
                  {formData.notifyMembers.length > 0 && (
                    <Box
                      sx={{
                        px: 2,
                        py: 1,
                        borderTop: `1px solid ${theme.palette.divider}`,
                        backgroundColor: theme.palette.action.hover
                      }}
                    >
                      <Typography variant='body2' color='text.secondary'>
                        {formData.notifyMembers.length} member
                        {formData.notifyMembers.length > 1 ? 's' : ''} to be notified
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>

          {/* Attachments */}
          <Box sx={{ mb: 4 }}>
            <Typography
              sx={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: theme.palette.text.primary,
                mb: 2
              }}
            >
              Attachments
            </Typography>

            {/* Attachment Preview Grid - Above dropzone */}
            {formData.attachments.length > 0 && (
              <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {formData.attachments.map((file, index) => {
                  const isImage = isImageFile(file)
                  const fileURL = URL.createObjectURL(file)
                  const iconConfig = getFileIconConfig(file)

                  return (
                    <Box
                      key={index}
                      sx={{
                        position: 'relative',
                        width: 100,
                        height: 100,
                        borderRadius: 1,
                        backgroundColor: theme.palette.customColors?.displaybgPrimary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {isImage ? (
                        <Box
                          component='img'
                          src={fileURL}
                          alt={file.name}
                          sx={{
                            width: 80,
                            height: 80,
                            objectFit: 'cover',
                            borderRadius: '8px'
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            backgroundColor: iconConfig.bg_color,
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Icon icon={iconConfig.icon} fontSize={32} color={iconConfig.icon_color} />
                        </Box>
                      )}

                      {/* Remove button */}
                      <IconButton
                        size='small'
                        onClick={() => handleRemoveAttachment(index)}
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          backgroundColor: theme.palette.customColors?.secondaryBg,
                          color: theme.palette.customColors?.OnPrimary,
                          width: 22,
                          height: 22,
                          '&:hover': {
                            backgroundColor: theme.palette.customColors?.OnSurfaceVariant
                          }
                        }}
                      >
                        <Icon icon='mdi:close' fontSize={14} />
                      </IconButton>
                    </Box>
                  )
                })}
              </Box>
            )}

            {/* Dropzone */}
            <Box
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e: React.DragEvent<HTMLDivElement>) => e.preventDefault()}
              sx={{
                border: `2px dashed ${theme.palette.customColors?.OutlineVariant }`,
                borderRadius: 2,
                p: 3.5,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.2s, border-color 0.2s',
                '&:hover': {
                  backgroundColor: theme.palette.customColors?.lightBg ,
                  borderColor: theme.palette.primary.main
                }
              }}
            >
              <input
                type='file'
                ref={fileInputRef}
                style={{ display: 'none' }}
                multiple
                accept='image/*,video/*,audio/*,.pdf,.doc,.docx'
                onChange={handleFileSelect}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <Box
                  component='img'
                  src='/images/housing/gallery-add.svg'
                  alt='Upload'
                  sx={{ width: 24, height: 24 }}
                />
                <Typography
                  sx={{
                    fontSize: '1rem',
                    fontWeight: 400,
                    color: theme.palette.customColors?.OnSurfaceVariant60                   }}
                >
                  Drop your files here
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            p: 4,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.customColors?.OnPrimary ,
            display: 'flex',
            gap: 2,
            flexShrink: 0,
            boxShadow: '0px -1px 10px 0px rgba(0, 0, 0, 0.05)'
          }}
        >
          <Button variant='outlined' fullWidth onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant='contained' fullWidth onClick={handleSubmit} disabled={loading}>
            {loading ? <CircularProgress size={24} color='inherit' /> : 'Add Note'}
          </Button>
        </Box>
      </Box>

      {/* Select Note Type Drawer */}
      <SelectNoteTypeDrawer
        open={noteTypeDrawerOpen}
        onClose={() => setNoteTypeDrawerOpen(false)}
        selectedTypes={{
          observationType: formData.observationType || undefined,
          childTypes: formData.childTypes
        }}
        onAddSelected={handleNoteTypeSelect}
      />
    </Drawer>
  )
}

export default AddNoteDrawer
