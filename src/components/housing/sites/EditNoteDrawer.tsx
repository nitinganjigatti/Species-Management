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
  Switch,
  Avatar
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Close as CloseIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material'
import { useSelector, useDispatch } from 'react-redux'
import { editObservation } from 'src/lib/api/housing'
import { fetchUsers } from 'src/store/slices/housing/notesSlice'
import { useAuth } from 'src/hooks/useAuth'
import Toaster from 'src/components/Toaster'
import NotifyMembersDrawer from './NotifyMembersDrawer'
import Icon from 'src/@core/components/icon'
import type { User } from 'src/types/housing'
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

interface ExistingAttachment {
  id?: number
  file?: string
  file_name?: string
  file_orginal_name?: string
  file_type?: string
}

interface FormData {
  priority: string
  notes: string
  newAttachments: File[]
  existingAttachments: ExistingAttachment[]
  deletedAttachmentIds: number[]
  notifyEnabled: boolean
  notifyMembers: User[]
}

interface FormErrors {
  priority?: string | null
  notes?: string | null
}

interface NoteImage {
  file?: string
  display_type?: string
}

interface RefDataItem {
  type?: string
  ref_type?: string
  siteData?: {
    site_name?: string
    user_site_name?: string
    images?: NoteImage[]
    image?: string
    default_icon?: string
  }
  sectionData?: {
    section_name?: string
    user_section_name?: string
    images?: NoteImage[]
    image?: string
    default_icon?: string
  }
  enclosureData?: {
    enclosure_name?: string
    user_enclosure_name?: string
    images?: NoteImage[]
    image?: string
    default_icon?: string
  }
  animalData?: {
    animal_name?: string
    common_name?: string
    images?: NoteImage[]
    image?: string
    default_icon?: string
  }
}

interface NoteData {
  observation_id: number
  observation_name?: string
  priority?: string
  note_type_id?: number
  attachments?: ExistingAttachment[]
  assign_to?: User[]
  child_master_type?: {
    parent_observation_type?: string
    child_observation_type?: Array<{ id?: number; type_name?: string }>
  }
  ref_data?: RefDataItem[]
  site_name?: string
  site_image?: string
  section_name?: string
  section_image?: string
  enclosure_name?: string
  enclosure_image?: string
  animal_name?: string
  animal_image?: string
}

interface EntityInfo {
  type: string
  name: string
  image: string | null
}

interface EditNoteDrawerProps {
  open: boolean
  onClose: () => void
  note: NoteData | null
  onSuccess?: () => void
}

const EditNoteDrawer: React.FC<EditNoteDrawerProps> = ({ open, onClose, note, onSuccess }) => {
  const theme = useTheme()
  const dispatch = useDispatch<AppDispatch>()
  const auth = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { users, usersLoading } = useSelector((state: RootState) => state.notes)
  const zooId = (auth as any)?.userData?.user?.zoos?.[0]?.zoo_id

  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    priority: 'Low',
    notes: '',
    newAttachments: [],
    existingAttachments: [],
    deletedAttachmentIds: [],
    notifyEnabled: false,
    notifyMembers: []
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [notifyMembersDrawerOpen, setNotifyMembersDrawerOpen] = useState(false)

  useEffect(() => {
    if (open && note) {
      initializeForm()
      if (zooId) {
        dispatch(fetchUsers({ zoo_id: zooId }))
      }
    }
  }, [open, note, dispatch, zooId])

  const initializeForm = () => {
    if (!note) return

    const existingAttachments = (note.attachments || []).map(att => ({
      id: att.id,
      file: att.file,
      file_name: att.file_name,
      file_orginal_name: att.file_orginal_name,
      file_type: att.file_type
    }))

    const assignedUsers = note.assign_to || []

    setFormData({
      priority: note.priority || 'Low',
      notes: note.observation_name || '',
      newAttachments: [],
      existingAttachments,
      deletedAttachmentIds: [],
      notifyEnabled: assignedUsers.length > 0,
      notifyMembers: assignedUsers
    })
    setErrors({})
  }

  const handleClose = () => {
    setFormData({
      priority: 'Low',
      notes: '',
      newAttachments: [],
      existingAttachments: [],
      deletedAttachmentIds: [],
      notifyEnabled: false,
      notifyMembers: []
    })
    setErrors({})
    onClose()
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

  const handleNotifyMembersChange = (newValue: User[]) => {
    setFormData(prev => ({ ...prev, notifyMembers: newValue }))
  }

  const handleOpenNotifyMembersDrawer = () => {
    setNotifyMembersDrawerOpen(true)
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
  const getFileIconConfig = (fileName: string): FileIconConfig => {
    if (!fileName) return FILE_ICONS.default

    const extension = fileName.toLowerCase().split('.').pop() || ''

    for (const [key, extList] of Object.entries(EXT_ICON_MAP)) {
      if (extList.includes(extension)) {
        return FILE_ICONS[key] || FILE_ICONS.default
      }
    }

    return FILE_ICONS.default
  }

  // Check if file is an image
  const isImageFile = (fileName: string, fileType?: string): boolean => {
    if (!fileName) return false
    const extension = fileName.toLowerCase().split('.').pop() || ''

    return EXT_ICON_MAP.image.includes(extension) || (fileType?.startsWith('image/') ?? false)
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
        newAttachments: [...prev.newAttachments, ...validFiles]
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
        newAttachments: [...prev.newAttachments, ...validFiles]
      }))
    }
  }

  const handleRemoveNewAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      newAttachments: prev.newAttachments.filter((_, i) => i !== index)
    }))
  }

  const handleRemoveExistingAttachment = (attachmentId: number | undefined) => {
    if (attachmentId === undefined) return
    setFormData(prev => ({
      ...prev,
      existingAttachments: prev.existingAttachments.filter(att => att.id !== attachmentId),
      deletedAttachmentIds: [...prev.deletedAttachmentIds, attachmentId]
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.priority) {
      newErrors.priority = 'Please select a priority'
    }

    const hasContent =
      formData.notes?.trim() || formData.newAttachments.length > 0 || formData.existingAttachments.length > 0

    if (!hasContent) {
      newErrors.notes = 'Please enter notes or add an attachment'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm() || !note) return

    setLoading(true)
    try {
      const submitData = new FormData()

      // Observation ID (required for edit)
      submitData.append('observation_id', String(note.observation_id))

      // Priority
      submitData.append('priority', formData.priority)

      // Notes / observation_name
      if (formData.notes?.trim()) {
        submitData.append('observation_name', formData.notes.trim())
      }

      // Observation type ID (from the note's existing type)
      if (note.child_master_type?.child_observation_type) {
        const typeIds = note.child_master_type.child_observation_type
          .map(t => t.id)
          .filter((id): id is number => id !== undefined)
        if (typeIds.length > 0) {
          submitData.append('observation_type_id', JSON.stringify(typeIds))
        }
      } else if (note.note_type_id) {
        submitData.append('observation_type_id', JSON.stringify([note.note_type_id]))
      }

      // Deleted attachments
      if (formData.deletedAttachmentIds.length > 0) {
        submitData.append('deleted_attachment', JSON.stringify(formData.deletedAttachmentIds))
      }

      // New attachments
      formData.newAttachments.forEach(file => {
        submitData.append('observation_attachment[]', file)
      })

      // Notify Members (assign_to) - Mobile uses comma-separated string, not JSON array
      if (formData.notifyEnabled && formData.notifyMembers.length > 0) {
        const memberIds = formData.notifyMembers.map(member => member.user_id)
        submitData.append('assign_to', memberIds.join(','))
      } else {
        // Send empty string to clear tagged members
        submitData.append('assign_to', '')
      }

      const response = await editObservation(submitData)

      if (response?.success) {
        Toaster({ type: 'success', message: 'Note updated successfully' })
        handleClose()
        if (onSuccess) onSuccess()
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to update note' })
      }
    } catch (error) {
      console.error('Error updating observation:', error)
      Toaster({ type: 'error', message: 'Failed to update note' })
    } finally {
      setLoading(false)
    }
  }

  const parentType = note?.child_master_type?.parent_observation_type || 'Note'
  const childTypes = note?.child_master_type?.child_observation_type || []

  // Helper to get entity image
  const getEntityImage = (
    entityData:
      | RefDataItem['siteData']
      | RefDataItem['sectionData']
      | RefDataItem['enclosureData']
      | RefDataItem['animalData']
      | null
  ): string | null => {
    if (!entityData) return null

    if (entityData.images && Array.isArray(entityData.images)) {
      const bannerImage = entityData.images.find(img => img.display_type === 'banner')
      if (bannerImage?.file) return bannerImage.file
      if (entityData.images[0]?.file) return entityData.images[0].file
    }

    return entityData.image || entityData.default_icon || null
  }

  // Helper to get entity info from note data
  const getEntityInfo = (): EntityInfo[] => {
    const entities: EntityInfo[] = []

    if (note?.ref_data && note.ref_data.length > 0) {
      note.ref_data.forEach(item => {
        const type = item.type || item.ref_type
        if (type === 'site' && item.siteData) {
          entities.push({
            type: 'Site',
            name: item.siteData.site_name || item.siteData.user_site_name || '',
            image: getEntityImage(item.siteData)
          })
        } else if (type === 'section' && item.sectionData) {
          entities.push({
            type: 'Section',
            name: item.sectionData.section_name || item.sectionData.user_section_name || '',
            image: getEntityImage(item.sectionData)
          })
        } else if (type === 'enclosure' && item.enclosureData) {
          entities.push({
            type: 'Enclosure',
            name: item.enclosureData.enclosure_name || item.enclosureData.user_enclosure_name || '',
            image: getEntityImage(item.enclosureData)
          })
        } else if (type === 'animal' && item.animalData) {
          entities.push({
            type: 'Animal',
            name: item.animalData.animal_name || item.animalData.common_name || '',
            image: getEntityImage(item.animalData)
          })
        }
      })
    }

    // Fallback to flat properties if ref_data is empty
    if (entities.length === 0 && note) {
      if (note.site_name) entities.push({ type: 'Site', name: note.site_name, image: note.site_image || null })
      if (note.section_name)
        entities.push({ type: 'Section', name: note.section_name, image: note.section_image || null })
      if (note.enclosure_name)
        entities.push({ type: 'Enclosure', name: note.enclosure_name, image: note.enclosure_image || null })
      if (note.animal_name) entities.push({ type: 'Animal', name: note.animal_name, image: note.animal_image || null })
    }

    return entities
  }

  const entities = getEntityInfo()

  return (
    <Drawer
      open={open}
      anchor='right'
      onClose={handleClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 580 },
            backgroundColor: theme.palette.customColors?.Background,
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
          backgroundColor: theme.palette.customColors?.OnPrimary
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 5,
            py: 4,
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.customColors?.OnPrimary,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 600 }}>Edit Note</Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Form Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0, p: 5 }}>
          {/* Entity Info */}
          {entities.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Box
                sx={{
                  borderRadius: '8px',
                  border: `1px solid ${theme.palette.customColors?.OutlineVariant}`,
                  overflow: 'hidden'
                }}
              >
                <Box
                  sx={{
                    bgcolor: theme.palette.customColors?.displaybgPrimary,
                    px: 3,
                    py: 2,
                    borderBottom: `1px solid ${theme.palette.customColors?.OutlineVariant}`
                  }}
                >
                  <Typography
                    sx={{
                      color: theme.palette.customColors?.OnSurfaceVariant,
                      fontWeight: 600,
                      fontSize: '1rem'
                    }}
                  >
                    {entities.length} Entity
                  </Typography>
                </Box>

                <Box sx={{ px: 3, py: 2 }}>
                  {entities.map((entity, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        py: 1.5,
                        borderBottom:
                          index < entities.length - 1
                            ? `1px solid ${theme.palette.customColors?.OutlineVariant}`
                            : 'none'
                      }}
                    >
                      <Avatar
                        src={entity.image || undefined}
                        sx={{
                          width: 48,
                          height: 48,
                          border: `1px solid ${theme.palette.customColors?.OutlineVariant}`
                        }}
                      >
                        {entity.name?.[0]}
                      </Avatar>
                      <Typography sx={{ fontSize: '0.95rem', fontWeight: 500, color: theme.palette.text.primary }}>
                        {entity.type}: {entity.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              <Typography variant='body2' color='text.secondary' sx={{ mt: 1.5 }}>
                Notes related to an animal, enclosure, section or a site
              </Typography>
            </Box>
          )}

          {/* Note Type - Read Only */}
          <Box sx={{ mb: 4 }}>
            <Typography
              sx={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: theme.palette.text.primary,
                mb: 2
              }}
            >
              Note Type
            </Typography>

            <Box
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                overflow: 'hidden',
                opacity: 0.8
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
                  backgroundColor: theme.palette.customColors?.Background,
                  borderBottom: childTypes.length > 0 ? `1px solid ${theme.palette.divider}` : 'none'
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: theme.palette.customColors?.OnPrimaryContainer
                  }}
                >
                  {parentType}
                </Typography>
                {/* <Chip label='Read Only' size='small' sx={{ fontSize: '0.7rem' }} /> */}
              </Box>

              {/* Child types list */}
              {childTypes.length > 0 && (
                <Box sx={{ px: 2, py: 1 }}>
                  {childTypes.map((childType, index) => (
                    <Box
                      key={childType.id || index}
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
                      ></Box>
                      <Typography
                        sx={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: theme.palette.customColors?.OnPrimaryContainer
                        }}
                      >
                        {childType.type_name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
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
                    ? theme.palette.customColors?.displaybgPrimary
                    : theme.palette.background.paper
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
                  {/* Add Members Button - Mobile Style */}
                  <Box
                    onClick={handleOpenNotifyMembersDrawer}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 2,
                      py: 1.5,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Icon
                        icon='mdi:home-plus-outline'
                        fontSize={24}
                        color={theme.palette.customColors?.OnPrimaryContainer}
                      />
                      <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>Add members to be notified</Typography>
                    </Box>
                    <Icon icon='mdi:plus-circle' fontSize={22} color={theme.palette.primary.main} />
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

            {/* Existing Attachments */}
            {formData.existingAttachments.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                  Existing Attachments
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {formData.existingAttachments.map(attachment => {
                    const fileName = attachment.file_orginal_name || attachment.file_name || ''
                    const isImage = isImageFile(fileName, attachment.file_type)
                    const iconConfig = getFileIconConfig(fileName)

                    return (
                      <Box
                        key={attachment.id}
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
                        {isImage && attachment.file ? (
                          <Box
                            component='img'
                            src={attachment.file}
                            alt={fileName}
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
                          onClick={() => handleRemoveExistingAttachment(attachment.id)}
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
              </Box>
            )}

            {/* New Attachments */}
            {formData.newAttachments.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                  New Attachments
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {formData.newAttachments.map((file, index) => {
                    const isImage = isImageFile(file.name, file.type)
                    const fileURL = URL.createObjectURL(file)
                    const iconConfig = getFileIconConfig(file.name)

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
                          onClick={() => handleRemoveNewAttachment(index)}
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
              </Box>
            )}

            {/* Dropzone */}
            <Box
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e: React.DragEvent<HTMLDivElement>) => e.preventDefault()}
              sx={{
                border: `2px dashed ${theme.palette.customColors?.OutlineVariant}`,
                borderRadius: 2,
                p: 3.5,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.2s, border-color 0.2s',
                '&:hover': {
                  backgroundColor: theme.palette.customColors?.lightBg,
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
                    color: theme.palette.customColors?.OnSurfaceVariant60
                  }}
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
            backgroundColor: theme.palette.customColors?.OnPrimary,
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
            {loading ? <CircularProgress size={24} color='inherit' /> : 'Update Note'}
          </Button>
        </Box>
      </Box>

      {/* Notify Members Drawer - Mobile Style */}
      <NotifyMembersDrawer
        open={notifyMembersDrawerOpen}
        onClose={() => setNotifyMembersDrawerOpen(false)}
        selectedMembers={formData.notifyMembers}
        onMembersChange={handleNotifyMembersChange}
        noteTypeId={note?.note_type_id}
      />
    </Drawer>
  )
}

export default EditNoteDrawer
