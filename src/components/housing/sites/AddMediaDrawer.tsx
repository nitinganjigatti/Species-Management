import React, { useState, useRef, useMemo } from 'react'
import {
  Box,
  Typography,
  Drawer,
  IconButton,
  Button,
  CircularProgress,
  Switch,
  FormControlLabel
} from '@mui/material'
import { useTheme, alpha, Theme } from '@mui/material/styles'
import { Close as CloseIcon } from '@mui/icons-material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addMedia, addAnimalMedia } from 'src/lib/api/housing'
import Toaster from 'src/components/Toaster'
import Icon from 'src/@core/components/icon'

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

// Icon configuration for non-image files - uses theme colors
const getFileIcons = (theme: Theme): FileIconsMap => ({
  pdf: { icon: 'mdi:file-pdf-box', bg_color: alpha(theme.palette.error.main, 0.1), icon_color: theme.palette.error.main },
  xls: { icon: 'mdi:file-excel', bg_color: alpha(theme.palette.success.main, 0.1), icon_color: theme.palette.success.dark },
  document: { icon: 'mdi:file-word', bg_color: alpha(theme.palette.info.main, 0.1), icon_color: theme.palette.info.main },
  audio: { icon: 'mdi:file-music', bg_color: alpha(theme.palette.warning.main, 0.1), icon_color: theme.palette.warning.dark },
  video: { icon: 'mdi:play-circle', bg_color: alpha(theme.palette.info.main, 0.15), icon_color: theme.palette.info.dark },
  ppt: { icon: 'mdi:file-powerpoint', bg_color: alpha((theme.palette as any).customColors?.Tertiary || '#FA6140', 0.1), icon_color: (theme.palette as any).customColors?.Tertiary || '#FA6140' },
  text: { icon: 'mdi:file-document', bg_color: theme.palette.grey[100], icon_color: theme.palette.grey[700] },
  csv: { icon: 'mdi:file-delimited', bg_color: alpha(theme.palette.success.main, 0.1), icon_color: theme.palette.success.dark },
  zip: { icon: 'mdi:folder-zip', bg_color: alpha(theme.palette.warning.main, 0.15), icon_color: theme.palette.warning.main },
  default: { icon: 'mdi:file', bg_color: theme.palette.grey[200], icon_color: theme.palette.grey[600] }
})

interface AddMediaDrawerProps {
  open: boolean
  onClose: () => void
  refType: 'site' | 'section' | 'enclosure' | 'animal'
  refId: string | number
  onSuccess?: () => void
}

const AddMediaDrawer: React.FC<AddMediaDrawerProps> = ({
  open,
  onClose,
  refType,
  refId,
  onSuccess
}) => {
  const theme = useTheme()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Memoized file icons using theme colors
  const FILE_ICONS = useMemo(() => getFileIcons(theme), [theme])

  const [attachments, setAttachments] = useState<File[]>([])
  const [isRestricted, setIsRestricted] = useState<boolean>(false)

  // Mutation for adding media (for site/section/enclosure)
  const addMediaMutation = useMutation({
    mutationFn: (formData: FormData) => addMedia(formData),
    onSuccess: response => {
      if (response?.success === false) {
        Toaster({ type: 'error', message: response?.message || 'Failed to add media' })

        return
      }

      Toaster({ type: 'success', message: response?.message || 'Media added successfully' })
      // Invalidate media queries to refresh the listing
      queryClient.invalidateQueries({ queryKey: ['media', String(refId)] })
      onSuccess?.()
      handleClose()
    },
    onError: (error: any) => {
      Toaster({
        type: 'error',
        message: error?.response?.data?.message || 'Failed to add media'
      })
    }
  })

  // Mutation for adding animal media (separate API for animals)
  const addAnimalMediaMutation = useMutation({
    mutationFn: (formData: FormData) => addAnimalMedia(formData),
    onSuccess: response => {
      if (response?.success === false) {
        Toaster({ type: 'error', message: response?.message || 'Failed to add media' })

        return
      }

      Toaster({ type: 'success', message: response?.message || 'Media added successfully' })
      // Invalidate animal media queries to refresh the listing
      queryClient.invalidateQueries({ queryKey: ['animal-media', String(refId)] })
      onSuccess?.()
      handleClose()
    },
    onError: (error: any) => {
      Toaster({
        type: 'error',
        message: error?.response?.data?.message || 'Failed to add media'
      })
    }
  })

  const resetForm = () => {
    setAttachments([])
    setIsRestricted(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
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
      setAttachments(prev => [...prev, ...validFiles])
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
      setAttachments(prev => [...prev, ...validFiles])
    }
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (attachments.length === 0) {
      Toaster({ type: 'error', message: 'Please select at least one file to upload' })

      return
    }

    const formData = new FormData()

    if (refType === 'animal') {
      // For animals, use animal/add-media API with animal_id and acess_restricted_key (mobile typo)
      formData.append('animal_id', String(refId))
      formData.append('acess_restricted_key', isRestricted ? '1' : '0')
    } else {
      // For site/section/enclosure, use zoos/all-type-add-media API
      formData.append('ref_id', String(refId))
      formData.append('ref_type', refType)
      formData.append('access_restricted_key', isRestricted ? '1' : '0')
    }

    // Append all media files
    attachments.forEach(file => {
      formData.append('media_attachment[]', file)
    })

    // Use the appropriate mutation based on refType
    if (refType === 'animal') {
      addAnimalMediaMutation.mutate(formData)
    } else {
      addMediaMutation.mutate(formData)
    }
  }

  const isPending = addMediaMutation.isPending || addAnimalMediaMutation.isPending

  return (
    <Drawer
      open={open}
      anchor='right'
      onClose={handleClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 500 },
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box component='img' src='/images/housing/gallery-add.svg' alt='Media' sx={{ width: 28, height: 28 }} />
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 600 }}>Add Media</Typography>
          </Box>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Form Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0, p: 5 }}>
          {/* Attachments */}
          <Box>
            <Typography
              sx={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: theme.palette.text.primary,
                mb: 2
              }}
            >
              Media Files
            </Typography>

            {/* Attachment Preview Grid - Above dropzone */}
            {attachments.length > 0 && (
              <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {attachments.map((file, index) => {
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

            {/* File count */}
            {attachments.length > 0 && (
              <Typography
                sx={{
                  mt: 2,
                  fontSize: '0.875rem',
                  color: theme.palette.text.secondary
                }}
              >
                {attachments.length} file{attachments.length > 1 ? 's' : ''} selected
              </Typography>
            )}
          </Box>

          {/* Mark as Restricted Toggle */}
          <Box
            sx={{
              mt: 4,
              p: 3,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              backgroundColor: isRestricted ? theme.palette.customColors?.displaybgPrimary : 'transparent'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Icon
                  icon='mdi:lock-outline'
                  fontSize={24}
                  color={isRestricted ? theme.palette.primary.main : theme.palette.text.secondary}
                />
                <Box>
                  <Typography sx={{ fontWeight: 500, fontSize: '0.95rem' }}>Mark as Restricted</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Restricted media will have limited visibility
                  </Typography>
                </Box>
              </Box>
              <Switch
                checked={isRestricted}
                onChange={(e) => setIsRestricted(e.target.checked)}
                color='primary'
              />
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
          <Button variant='outlined' fullWidth onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant='contained'
            fullWidth
            onClick={handleSubmit}
            disabled={attachments.length === 0 || isPending}
          >
            {isPending ? <CircularProgress size={24} color='inherit' /> : 'Add Media'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default AddMediaDrawer
