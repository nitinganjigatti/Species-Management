import React, { useState, useEffect } from 'react'
import { Box, Typography, Drawer, IconButton, Chip, Divider, CircularProgress, TextField, Avatar, Tooltip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import {
  Close as CloseIcon,
  Description as NoteIcon,
  ThumbUp as LikeIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Comment as CommentIcon,
  Send as SendIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import {
  getObservationDetails,
  addNoteReaction,
  removeNoteReaction,
  addObservationComment,
  deleteObservation,
  editObservation
} from 'src/lib/api/housing'
import Toaster from 'src/components/Toaster'
import { useTranslation } from 'react-i18next'
import moment from 'moment'
import NewMediaCard from 'src/views/utility/NewMediaCard'
import { useAuth } from 'src/hooks/useAuth'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import EditNoteDrawer from './EditNoteDrawer'
import SearchUsersDrawer from './SearchUsersDrawer'
import type { Note, NoteAttachment, NoteComment, NoteImage, User } from 'src/types/housing'
import AddAttachmentsDrawer from 'src/components/notes/AddAttachmentsDrawer'
import NoDataFound from 'src/views/utility/NoDataFound'

interface PriorityIcons {
  [key: string]: string
}

const priorityIcons: PriorityIcons = {
  Low: '/images/priority/flag_priority_low.svg',
  Moderate: '/images/priority/flag_priority_medium.svg',
  High: '/images/priority/flag_priority_high.svg',
  Critical: '/images/priority/flag_priority_critical.svg'
}

interface EntityInfo {
  type: string
  name: string
  image: string | null
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

interface ObservationData extends Omit<Note, 'notes'> {
  created_by_id?: number
  notes?: NoteComment[]
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

interface NoteDetailsDrawerProps {
  open: boolean
  onClose: () => void
  note: Note | null
  onUpdate?: () => void
}

const NoteDetailsDrawer: React.FC<NoteDetailsDrawerProps> = ({ open, onClose, note, onUpdate }) => {
  const theme = useTheme()
  const auth = useAuth()
  const { t } = useTranslation()
  const currentUserId = (auth as any)?.userData?.user?.user_id

  const [loading, setLoading] = useState(false)
  const [observationData, setObservationData] = useState<ObservationData | null>(null)
  const [comment, setComment] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [commentDialogLoading, setCommentDialogLoading] = useState(false)
  const [taggedMembersDrawerOpen, setTaggedMembersDrawerOpen] = useState(false)
  const [searchUsersDrawerOpen, setSearchUsersDrawerOpen] = useState(false)
  const [updateMembersLoading, setUpdateMembersLoading] = useState(false)
  const [addAttachmentsDrawerOpen, setAddAttachmentsDrawerOpen] = useState<boolean>(false)
  const [attachmentsLoading, setAttachmentsLoading] = useState<boolean>(false)
  const [showMobileNumber, setShowMobileNumber] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)
  const [showCommentInput, setShowCommentInput] = useState<boolean>(false)

  const { control, watch, reset } = useForm({ defaultValues: { attachments: [] } })

  const handleCopyNumber = (number: string): void => {
    navigator.clipboard.writeText(number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Local like state to avoid full re-render on like toggle
  const [likeState, setLikeState] = useState<{ isLiked: boolean; count: number } | null>(null)

  const isCreator = currentUserId && observationData?.created_by_id && currentUserId === observationData?.created_by_id

  useEffect(() => {
    if (open && note?.observation_id) {
      fetchObservationDetails()
    }
  }, [open, note?.observation_id])

  // Sync likeState when observationData is first loaded
  useEffect(() => {
    if (observationData) {
      setLikeState({
        isLiked: observationData.user_reaction === 'like',
        count: (observationData as any).reaction_counts?.like || observationData.reaction_count || 0
      })
    }
  }, [observationData?.observation_id])

  const fetchObservationDetails = async () => {
    setLoading(true)
    try {
      const response = await getObservationDetails({ observation_id: note?.observation_id as number })
      if (response?.success) {
        setObservationData(response?.data as ObservationData | null)
      }
    } catch (error) {
      console.error('Error fetching note details:', error)
      Toaster({ type: 'error', message: 'Failed to fetch note details' })
    } finally {
      setLoading(false)
    }
  }

  const handleLikeClick = async () => {
    if (!likeState) return

    const wasLiked = likeState.isLiked

    // Optimistic update — change UI immediately without re-fetching
    setLikeState({
      isLiked: !wasLiked,
      count: wasLiked ? likeState.count - 1 : likeState.count + 1
    })

    try {
      if (wasLiked) {
        await removeNoteReaction(observationData?.observation_id as number)
      } else {
        await addNoteReaction(observationData?.observation_id as number)
      }

      if (onUpdate) onUpdate()

      Toaster({
        type: 'success',
        message: wasLiked ? 'Like removed' : 'Liked successfully'
      })
    } catch (error) {
      // Revert optimistic update on failure
      setLikeState({
        isLiked: wasLiked,
        count: likeState.count
      })
      console.error('Error toggling like:', error)
      Toaster({ type: 'error', message: 'Failed to update like' })
    }
  }

  const handleCommentSubmit = async () => {
    if (!comment.trim()) return

    setCommentLoading(true)
    try {
      const formData = new FormData()
      formData.append('observation_id', String(observationData?.observation_id))
      formData.append('observation', comment.trim())

      await addObservationComment(formData)

      setComment('')
      fetchObservationDetails()
      if (onUpdate) onUpdate()

      Toaster({ type: 'success', message: 'Comment added successfully' })
    } catch (error) {
      console.error('Error adding comment:', error)
      Toaster({ type: 'error', message: 'Failed to add comment' })
    } finally {
      setCommentLoading(false)
    }
  }

  const handleClose = () => {
    setObservationData(null)
    setLikeState(null)
    setComment('')
    setDeleteDialogOpen(false)
    setEditDrawerOpen(false)
    setCommentDialogOpen(false)
    setTaggedMembersDrawerOpen(false)
    setSearchUsersDrawerOpen(false)
    setShowMobileNumber(false)
    setShowCommentInput(false)
    onClose()
  }

  const handleCommentDialogSubmit = async (data: { observation_id: number; notes: string }) => {
    setCommentDialogLoading(true)
    try {
      const formData = new FormData()
      formData.append('observation_id', String(data.observation_id))
      formData.append('observation', data.notes)

      await addObservationComment(formData)

      setCommentDialogOpen(false)
      fetchObservationDetails()
      if (onUpdate) onUpdate()

      Toaster({ type: 'success', message: 'Comment added successfully' })
    } catch (error) {
      console.error('Error adding comment:', error)
      Toaster({ type: 'error', message: 'Failed to add comment' })
    } finally {
      setCommentDialogLoading(false)
    }
  }

  const handleAttachmentsSubmit = async () => {
    const files = watch('attachments')
    if (!files || files.length === 0) return

    setAttachmentsLoading(true)
    try {
      const formData = new FormData()
      formData.append('observation_id', String(observationData?.observation_id))
      files.forEach((file: File) => {
        formData.append('observation_note_attachment[]', file)
      })

      const response = await addObservationComment(formData)
      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Attachments added successfully' })
        reset({ attachments: [] })
        setAddAttachmentsDrawerOpen(false)
        fetchObservationDetails()
        if (onUpdate) onUpdate()
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to add attachments' })
      }
    } catch (error) {
      console.error('Error adding attachments:', error)
      Toaster({ type: 'error', message: 'Failed to add attachments' })
    } finally {
      setAttachmentsLoading(false)
    }
  }

  const handleCloseAttachmentsDrawer = () => {
    setAddAttachmentsDrawerOpen(false)
    reset({ attachments: [] })
  }

  const handleEditSuccess = () => {
    setEditDrawerOpen(false)
    fetchObservationDetails()
    if (onUpdate) onUpdate()
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      const response = await deleteObservation({ observation_id: observationData?.observation_id as number })
      if (response?.success) {
        Toaster({ type: 'success', message: 'Note deleted successfully' })
        setDeleteDialogOpen(false)
        handleClose()
        if (onUpdate) onUpdate()
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to delete note' })
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      Toaster({ type: 'error', message: 'Failed to delete note' })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleUpdateMembers = async (selectedUsers: User[]) => {
    setUpdateMembersLoading(true)
    try {
      const formData = new FormData()
      formData.append('observation_id', String(observationData?.observation_id))
      // Mobile uses comma-separated string for assign_to, not JSON array
      formData.append('assign_to', selectedUsers.map(u => u.user_id).join(','))

      const response = await editObservation(formData)
      if (response?.success) {
        Toaster({ type: 'success', message: 'Members updated successfully' })
        setSearchUsersDrawerOpen(false)
        setTaggedMembersDrawerOpen(false)
        fetchObservationDetails()
        if (onUpdate) onUpdate()
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to update members' })
      }
    } catch (error) {
      console.error('Error updating members:', error)
      Toaster({ type: 'error', message: 'Failed to update members' })
    } finally {
      setUpdateMembersLoading(false)
    }
  }

  const data = observationData || note
  const parentType = (data as any)?.child_master_type?.parent_observation_type || 'Note'
  const childTypes = (data as any)?.child_master_type?.child_observation_type || []
  const priorityIcon = data?.priority ? priorityIcons[data.priority] : null

  const comments = observationData?.notes || []
  const taggedMembers = (data as any)?.assign_to || []
  // Use total_comments from API if available, fallback to notes array length

  const totalComments =
    (observationData as any)?.total_comments ?? (data as any)?.note?.total_comments ?? comments.length

  const getAttachmentUrl = (attachment: NoteAttachment | null): string | null => {
    if (!attachment) return null

    return (
      attachment.file ||
      (attachment as any).url ||
      (attachment as any).uri ||
      (attachment as any).attachment_url ||
      null
    )
  }

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
      const bannerImage = entityData.images.find(img => (img as any).display_type === 'banner')
      if (bannerImage?.file) return bannerImage.file
      if (entityData.images[0]?.file) return entityData.images[0].file
    }

    return entityData.image || entityData.default_icon || null
  }

  const getEntityInfo = (): EntityInfo[] => {
    const entities: EntityInfo[] = []
    const obsData = observationData as ObservationData | null

    if (obsData?.ref_data && obsData.ref_data.length > 0) {
      obsData.ref_data.forEach(item => {
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

    if (entities.length === 0 && obsData) {
      if (obsData.site_name) entities.push({ type: 'Site', name: obsData.site_name, image: obsData.site_image || null })
      if (obsData.section_name)
        entities.push({ type: 'Section', name: obsData.section_name, image: obsData.section_image || null })
      if (obsData.enclosure_name)
        entities.push({ type: 'Enclosure', name: obsData.enclosure_name, image: obsData.enclosure_image || null })
      if (obsData.animal_name)
        entities.push({ type: 'Animal', name: obsData.animal_name, image: obsData.animal_image || null })
    }

    return entities
  }

  const entities = getEntityInfo()

  // Resolved like values from local state (falls back to data if likeState not yet set)
  const isLiked = likeState?.isLiked ?? data?.user_reaction === 'like'
  const likeCount = likeState?.count ?? (data as any)?.reaction_counts?.like ?? 0

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={handleClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 560 },
            backgroundColor: theme.palette.customColors?.Background,
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 5,
          py: 4,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.customColors?.OnPrimary,
          flexShrink: 0
        }}
      >
        <Typography
          sx={{
            fontSize: '24px',
            fontWeight: 500,
            color: theme.palette.customColors?.OnSurfaceVariant
          }}
        >
          {t('note')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isCreator && (
            <>
              <IconButton size='small' onClick={() => setEditDrawerOpen(true)}>
                <EditIcon />
              </IconButton>
              <IconButton
                size='small'
                onClick={() => setDeleteDialogOpen(true)}
                sx={{ color: theme.palette.error.main }}
              >
                <DeleteIcon />
              </IconButton>
            </>
          )}
          <IconButton size='small' onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {loading ? (
        <Box display='flex' justifyContent='center' alignItems='center' flex={1}>
          <CircularProgress />
        </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            minHeight: 0,
            backgroundColor: theme.palette.customColors?.OnPrimary
          }}
        >
          {/* Note Type Header */}
          <Box sx={{ px: 5, py: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    bgcolor: theme.palette.customColors?.OnPrimaryContainer,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <NoteIcon sx={{ color: theme.palette.customColors?.OnPrimary, fontSize: 22 }} />
                </Box>
                <Typography sx={{ fontSize: '1.25rem', fontWeight: 600 }}>{parentType}</Typography>
              </Box>

              {priorityIcon && (
                <Box
                  component='img'
                  src={priorityIcon}
                  alt={data?.priority}
                  sx={{ height: 36, transform: 'scaleX(-1)' }}
                />
              )}
            </Box>

            {childTypes?.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                {childTypes.map((type: any, index: number) => (
                  <Chip
                    key={index}
                    label={type?.type_name}
                    size='small'
                    sx={{
                      bgcolor: theme.palette.action.hover,
                      color: theme.palette.text.primary,
                      fontSize: '13px',
                      fontWeight: 500,
                      height: 32
                    }}
                  />
                ))}
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant='body2' color='text.secondary'>
                {t('by')}
              </Typography>
              <Chip
                icon={<PersonIcon sx={{ fontSize: 18 }} />}
                label={data?.created_by}
                size='small'
                sx={{
                  bgcolor: theme.palette.customColors?.Background,
                  color: theme.palette.customColors?.OnPrimaryContainer,
                  '& .MuiChip-icon': { color: theme.palette.customColors?.OnPrimaryContainer }
                }}
              />
              {/* Mobile: direct call/sms */}
              <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1 }}>
                <IconButton
                  size='small'
                  onClick={() => window.open(`tel:${(data as any)?.created_by_phone}`, '_self')}
                  sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: alpha(theme.palette.customColors?.OnSecondaryContainer || '', 0.1),
                    color: theme.palette.customColors?.OnSecondaryContainer,
                    '&:hover': { backgroundColor: alpha(theme.palette.customColors?.OnSecondaryContainer || '', 0.3) }
                  }}
                >
                  <PhoneIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton
                  size='small'
                  onClick={() => window.open(`sms:${(data as any)?.created_by_phone}`, '_self')}
                  sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: alpha(theme.palette.customColors?.OnSecondaryContainer || '', 0.1),
                    color: theme.palette.customColors?.OnSecondaryContainer,
                    '&:hover': { backgroundColor: alpha(theme.palette.customColors?.OnSecondaryContainer || '', 0.3) }
                  }}
                >
                  <Icon icon='material-symbols:comment-rounded' width='18' height='18' />
                </IconButton>
              </Box>

              {/* Desktop: toggle number + copy */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                <IconButton
                  size='small'
                  onClick={() => setShowMobileNumber(prev => !prev)}
                  sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: alpha(theme.palette.customColors?.OnSecondaryContainer || '', 0.1),
                    color: theme.palette.customColors?.OnSecondaryContainer,
                    '&:hover': { backgroundColor: alpha(theme.palette.customColors?.OnSecondaryContainer || '', 0.3) }
                  }}
                >
                  <PhoneIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    overflow: 'hidden',
                    maxWidth: showMobileNumber ? '200px' : '0px',
                    opacity: showMobileNumber ? 1 : 0,
                    transition: 'max-width 0.3s ease-in-out, opacity 0.3s ease-in-out'
                  }}
                >
                  <Typography
                    sx={{ fontWeight: 500, fontSize: '14px', color: theme.palette.customColors?.OnSecondaryContainer }}
                  >
                    {(data as any)?.created_by_phone}
                  </Typography>
                  <Tooltip title={copied ? `${t('copied')}!` : t('copy_number')}>
                    <IconButton
                      size='small'
                      onClick={() => handleCopyNumber((data as any)?.created_by_phone || '')}
                      sx={{
                        width: 32,
                        height: 32,
                        color: theme.palette.customColors?.OnSecondaryContainer,
                        '&:hover': { backgroundColor: alpha(theme.palette.customColors?.OnSecondaryContainer || '', 0.3) }
                      }}
                    >
                      <Icon icon={copied ? 'mdi:check' : 'mdi:content-copy'} fontSize={18} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Box>

            <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
              {data?.created_at ? moment(data.created_at).format('DD MMM YYYY • hh:mm A') : ''}
            </Typography>

            {entities.length > 0 && (
              <Box
                sx={{
                  borderRadius: '8px',
                  border: `1px solid ${theme.palette.customColors?.OutlineVariant}`,
                  mb: 3,
                  overflow: 'hidden'
                }}
              >
                <Box
                  sx={{
                    bgcolor: theme.palette.customColors?.Background,
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
                    {entities.length} {t('housing_module.entity')}
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
            )}

            {(data as any)?.observation_name && (
              <Box sx={{ mb: 3 }}>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
                  {t('description')}
                </Typography>
                <Typography sx={{ fontSize: '1rem', fontWeight: 500 }}>{(data as any)?.observation_name}</Typography>
              </Box>
            )}

            {(data as any)?.attachments && (data as any).attachments.length > 0 && (
              <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {(data as any).attachments.map((attachment: any, idx: number) => (
                  <NewMediaCard
                    key={attachment.id || idx}
                    fileUrl={getAttachmentUrl(attachment) || undefined}
                    fileName={attachment.file_orginal_name || attachment.file_name || attachment.fileName}
                    fileType={attachment.file_type || attachment.type || attachment.fileType}
                    width='120px'
                    showTitle={false}
                    ondownloadaction={() => {}}
                  />
                ))}
              </Box>
            )}

            {/* Tagged Members - Clickable to show drawer */}
            <Box
              onClick={() => setTaggedMembersDrawerOpen(true)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                '&:hover': { opacity: 0.7 }
              }}
            >
              <PersonIcon sx={{ fontSize: 24, color: theme.palette.primary.main }} />
              {taggedMembers.length > 0 ? (
                <>
                  <Typography variant='body2' sx={{ color: theme.palette.text.primary }}>
                    {taggedMembers[0]?.full_name || taggedMembers[0]?.user_name || 'Member'}
                  </Typography>
                  {taggedMembers.length > 1 && (
                    <Typography variant='body2' sx={{ color: theme.palette.text.secondary }}>
                      +{taggedMembers.length - 1}
                    </Typography>
                  )}
                </>
              ) : (
                <Typography variant='body2' sx={{ color: theme.palette.error.main }}>
                  {t('housing_module.no_member_tagged')}
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, mt: 4 }}>
              <Box
                onClick={handleLikeClick}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.7 }
                }}
              >
                <LikeIcon
                  sx={{
                    fontSize: 20,
                    color: isLiked ? theme.palette.primary.main : theme.palette.text.secondary
                  }}
                />
                <Typography
                  sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors?.OnSurfaceVariant }}
                >
                  {likeCount}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  py: 1,
                  px: 2,
                  borderRadius: '20px',
                  '&:hover': { opacity: 0.7 }
                }}
                onClick={() => setShowCommentInput(true)}
              >
                <Icon
                  icon='material-symbols:comment-rounded'
                  width='20'
                  height='20'
                  color={theme.palette.text.secondary}
                />
                <Typography sx={{ color: theme.palette.text.secondary, fontSize: '14px', fontWeight: 600 }}>
                  {totalComments}
                </Typography>
              </Box>
            </Box>

            <Divider />

            <Box sx={{ mt: 3 }}>
              {comments.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {comments.map((item: any, index: number) => {
                    // Check all possible field names for comment text
                    const commentText = item.observation || item.notes || item.comment || ''
                    const hasContent = commentText || (item.notes_attachment && item.notes_attachment.length > 0)

                    if (!hasContent) return null

                    return (
                      <Box key={index}>
                        <Box
                          sx={{
                            p: 3,
                            borderRadius: item?.notes_attachment?.length > 0 ? 0 : 1,
                            bgcolor: item?.notes_attachment?.length > 0 ? "transparent" :theme.palette.customColors?.antzNotes,
                            borderBottom:item?.notes_attachment?.length > 0? `1px solid ${theme.palette.action.disabledBackground}`: 'none'
                          }}
                        >
                          {commentText && (
                            <Box sx={{ mb: 1.5 }}>
                              <Typography variant='body2'>{commentText}</Typography>
                            </Box>
                          )}

                          {item.notes_attachment && item.notes_attachment.length > 0 && (
                            <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap' , mb: 1.5 }}>
                              {item.notes_attachment.map((attachment: any, idx: number) => (
                                <NewMediaCard
                                  key={attachment.id || idx}
                                  fileUrl={getAttachmentUrl(attachment) || undefined}
                                  fileName={attachment.file_orginal_name || attachment.file_name || attachment.fileName}
                                  fileType={attachment.file_type || attachment.type || attachment.fileType}
                                  width='120px'
                                  showTitle={false}
                                />
                              ))}
                            </Box>
                          )}

                          <Box sx={{ mb: 1.5 }}>
                            <UserAvatarDetails
                              profile_image={item.user_profile_pic || item.commented_by_image}
                              user_name={item.created_by_name || item.commented_by_name}
                              date={item.created_at || item.commented_at}
                              size='medium'
                              show_time
                            />
                          </Box>
                        </Box>
                      </Box>
                    )
                  })}
                </Box>
              ) : (
                <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center', py: 4 }}>
                  {t('housing_module.no_comments_yet')}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      )}

      {/* Comment Input Footer */}
      {showCommentInput && <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 5,
          py: 4,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.customColors?.OnPrimary,
          flexShrink: 0,
          boxShadow: '0px -1px 10px 0px rgba(0, 0, 0, 0.05)'
        }}
      >
        <TextField
          fullWidth
          size='small'
          placeholder={t('housing_module.write_comment_placeholder') as string}
          value={comment}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setComment(e.target.value)}
          onKeyPress={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleCommentSubmit()
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 6,
              backgroundColor: theme.palette.background.paper
            }
          }}
        />
        <IconButton
          disabled={!comment.trim() || commentLoading}
          onClick={handleCommentSubmit}
          sx={{
            bgcolor: theme.palette.primary.main,
            color: theme.palette.customColors?.OnPrimary,
            '&:hover': { bgcolor: theme.palette.primary.dark },
            '&:disabled': { bgcolor: theme.palette.action.disabledBackground }
          }}
        >
          {commentLoading ? <CircularProgress size={20} color='inherit' /> : <SendIcon />}
        </IconButton>
        <IconButton
          onClick={() => setAddAttachmentsDrawerOpen(true)}
          sx={{
            bgcolor: theme.palette.customColors?.Background,
            color: theme.palette.customColors?.OnPrimaryContainer,
            '&:hover': { bgcolor: theme.palette.customColors?.SurfaceVariant }
          }}
        >
          <AttachFileIcon />
        </IconButton>
      </Box>}

      <ConfirmationDialog
        dialogBoxStatus={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title='Delete Note'
        description='Are you sure you want to delete this note? This action cannot be undone.'
        cancelText='CANCEL'
        ConfirmationText='DELETE'
        confirmAction={handleDelete}
        loading={deleteLoading}
        image='/images/warning-icon.svg'
        imgStyle={{ background: theme.palette.customColors?.TertiaryLight, p: 4 }}
        confirmBtnStyle={{ background: theme.palette.error.main, py: 2 }}
      />

      {/* Edit Note Drawer */}
      <EditNoteDrawer
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        note={observationData}
        onSuccess={handleEditSuccess}
      />

      {/* Tagged Members Drawer - Positioned at right bottom */}
      <Drawer
        anchor='right'
        open={taggedMembersDrawerOpen}
        onClose={() => setTaggedMembersDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 560 },
              height: 'auto',
              maxHeight: '60vh',
              position: 'fixed',
              bottom: 0,
              right: 0,
              top: 'auto',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              backgroundColor: theme.palette.background.paper
            }
          },
          backdrop: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.3)'
            }
          }
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 4,
            py: 3,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon sx={{ fontSize: 24, color: theme.palette.text.secondary }} />
            <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
              {taggedMembers.length} Tagged Member{taggedMembers.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isCreator && (
              <IconButton
                size='small'
                onClick={() => setSearchUsersDrawerOpen(true)}
                disabled={updateMembersLoading}
                sx={{ color: theme.palette.primary.main }}
              >
                <PersonAddIcon />
              </IconButton>
            )}
            <IconButton size='small' onClick={() => setTaggedMembersDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Members List */}
        <Box sx={{ px: 4, py: 2, overflowY: 'auto', height: 'auto', maxHeight: 'calc(60vh - 70px)' }}>
          {taggedMembers.map((member: any, index: number) => (
            <Box
              key={member.user_id || index}
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.default
              }}
            >
              <UserAvatarDetails
                profile_image={member.profile_image || member.user_profile_pic}
                user_name={member.full_name || member.user_name || 'Unknown'}
                role={member.role_name || member.role}
                size='large'
              />
            </Box>
          ))}
        </Box>

        {taggedMembers?.length === 0 && (
          <>
            <NoDataFound />
            <Typography sx={{ color: theme.palette.text.secondary, textAlign: 'center', my: 4 }}>
              {t('notes_module.no_members_have_been_tagged')}
            </Typography>
          </>
        )}
      </Drawer>

      {/* Search Users Drawer for adding/editing members */}
      <SearchUsersDrawer
        open={searchUsersDrawerOpen}
        onClose={() => setSearchUsersDrawerOpen(false)}
        selectedUsers={taggedMembers.map(
          (member: any) =>
            ({
              user_id: member.user_id,
              user_name: member.user_name,
              full_name: member.full_name,
              user_profile_pic: member.profile_image || member.user_profile_pic,
              role_name: member.role
            } as User)
        )}
        onUsersSelected={handleUpdateMembers}
      />

       <AddAttachmentsDrawer
        open={addAttachmentsDrawerOpen}
        onClose={handleCloseAttachmentsDrawer}
        control={control}
        watch={watch}
        reset={reset}
        attachmentsLoading={attachmentsLoading}
        onAttachmentsSubmit={handleAttachmentsSubmit}
      />
    </Drawer>
  )
}

export default NoteDetailsDrawer
