import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Drawer,
  IconButton,
  Chip,
  Divider,
  CircularProgress,
  TextField,
  Tooltip,
  Grid,
  Button,
  useTheme,
  ClickAwayListener
} from '@mui/material'
import { styled, alpha } from '@mui/material/styles'
import {
  Close as CloseIcon,
  Description as NoteIcon,
  ThumbUp as LikeIcon,
  ThumbUpOutlined as LikeOutlinedIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Comment as CommentIcon,
  Send as SendIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  AttachFile
} from '@mui/icons-material'
import Icon from 'src/@core/components/icon'
import { addNotesReaction, removeNotesReaction, getNotesDetails, addNotesComment } from 'src/lib/api/notesModule'

import Toaster from 'src/components/Toaster'
import { useAuth } from 'src/hooks/useAuth'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
// import EditNoteDrawer from './EditNoteDrawer'
// import SearchUsersDrawer from './SearchUsersDrawer'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import FilePreviewCard from 'src/views/utility/NewMediaCard'
import LocationInfoCard from 'src/views/utility/LocationInfoCard'
import AnimalCard from 'src/views/utility/AnimalCard'
import { useForm } from 'react-hook-form'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'

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
export interface Attachment {
  id: string
  observation_id: string
  file: string
  file_orginal_name: string
  file_type: string
  file_size: string
  deleted: string
  created_at: string
  modified_at: string
  created_by: string
  modified_by: string | null
  name: string
  type: string
  uri: string
}

interface Members {
  id: string
  full_name: string
  user_id: string
  user_mobile_number: string
  user_profile_pic: string
  role_id: string
  role_name: string
}

interface notesDetailsData extends Omit<Note, 'notes'> {
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
  noteDetails: Note | null
  onUpdate?: () => void
}

interface CommentSubmitData {
  observation_id: number
  observation: string
}

const NotesDetailsDrawer: React.FC<NoteDetailsDrawerProps> = ({ open, onClose, noteDetails, onUpdate }) => {
  const theme = useTheme() as any
  const auth = useAuth()
  const currentUserId = (auth as any)?.userData?.user?.user_id

  const [notesDetailsLoading, setNotesDetailsLoading] = useState(false)
  const [notesDetailsData, setNotesDetailsData] = useState<notesDetailsData | null>(null)
  const [showAllChildNoteTypes, setShowAllChildNoteTypes] = useState<boolean>(false)
  const [showFullNote, setShowFullNote] = useState<boolean>(false)
  const [showAllMedia, setShowAllMedia] = useState<boolean>(false)
  const [taggedMembersDrawerOpen, setTaggedMembersDrawerOpen] = useState<boolean>(false)
  const [likeState, setLikeState] = useState<{ isLiked: boolean; count: number } | null>(null) // Local like state to avoid full re-render on like toggle
  const [isLikeLoading, setIsLikeLoading] = useState<boolean>(false)
  const [showFullComment, setShowFullComment] = useState<boolean>(false)
  const [showCommentInput, setShowCommentInput] = useState<boolean>(false)
  const [comment, setComment] = useState<string>('')
  const [commentLoading, setCommentLoading] = useState<boolean>(false)
  const [attachmentsLoading, setAttachmentsLoading] = useState<boolean>(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [addAttachmentsDrawerOpen, setAddAttachmentsDrawerOpen] = useState<boolean>(false)
  const [openQuickActions, setOpenQuickActions] = useState<boolean>(false)
  const [showMobileNumber, setShowMobileNumber] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState<boolean>(false)
  const [commentDialogOpen, setCommentDialogOpen] = useState<boolean>(false)
  const [commentDialogLoading, setCommentDialogLoading] = useState(false)
  const [searchUsersDrawerOpen, setSearchUsersDrawerOpen] = useState(false)
  const [updateMembersLoading, setUpdateMembersLoading] = useState(false)
  const [previewFile, setPreviewFile] = useState<any>(null)

  const { control, watch, reset } = useForm({
    defaultValues: {
      attachments: []
    }
  })

  const handleCopyNumber = (number: string): void => {
    navigator.clipboard.writeText(number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Fetch notes details
  const fetchObservationDetails = async () => {
    if (!noteDetails?.observation_id) return

    setNotesDetailsLoading(true)
    try {
      const response = await getNotesDetails(noteDetails?.observation_id)
      if (response?.success) {
        setNotesDetailsData(response?.data as notesDetailsData | null)
      }
    } catch (error: any) {
      console.error('Error fetching note details:', error?.message || error)
      Toaster({ type: 'error', message: error?.message || 'Failed to fetch note details' })
    } finally {
      setNotesDetailsLoading(false)
    }
  }

  // Handle like click
  const handleLikeClick = async () => {
    if (!likeState) return
    setIsLikeLoading(true)

    const wasLiked = likeState.isLiked

    // Optimistic update — change UI immediately without re-fetching
    setLikeState({
      isLiked: !wasLiked,
      count: wasLiked ? likeState.count - 1 : likeState.count + 1
    })
    const payload = {
      notes_id: notesDetailsData?.observation_id as number
    }

    try {
      if (wasLiked) {
        await removeNotesReaction(payload)
      } else {
        await addNotesReaction(payload)
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
    } finally {
      setIsLikeLoading(false)
    }
  }

  // Handle comment submit
  const handleCommentSubmit = async () => {
    if (!comment.trim()) return

    setCommentLoading(true)
    try {
      const payload: CommentSubmitData = {
        observation_id: notesDetailsData?.observation_id,
        observation: comment.trim()
      }

      await addNotesComment(payload)

      setComment('')
      fetchObservationDetails()
      setShowCommentInput(false)

      if (onUpdate) onUpdate()

      Toaster({ type: 'success', message: 'Comment added successfully' })
    } catch (error: any) {
      console.error('Error adding comment:', error?.message || error)
    } finally {
      setCommentLoading(false)
    }
  }

  // Handle attachments submit
  const handleAttachmentsSubmit = async () => {
    const files = watch('attachments')

    if (!files || files.length === 0) return

    setAttachmentsLoading(true)
    try {
      const formData = new FormData()

      formData.append('observation_id', String(notesDetailsData?.observation_id))

      files.forEach((file: File) => {
        formData.append('observation_note_attachment[]', file)
      })

      const response = await addNotesComment(formData)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Attachments added successfully' })
        setAttachments([])
        reset({ attachments: [] })
        fetchObservationDetails()
        if (onUpdate) onUpdate()
      }
    } catch (error: any) {
      console.error('Error adding attachments:', error?.message || error)
    } finally {
      setAttachmentsLoading(false)
    }
  }

  // Handle close drawer
  const handleClose = () => {
    setNotesDetailsData(null)
    setLikeState(null)
    setComment('')
    setDeleteDialogOpen(false)
    setEditDrawerOpen(false)
    setCommentDialogOpen(false)
    setTaggedMembersDrawerOpen(false)
    setSearchUsersDrawerOpen(false)
    onClose()
    setShowAllChildNoteTypes(false)
    setShowAllMedia(false)
    reset({ attachments: [] })
  }

  const handleCloseAttachmentsDrawer = () => {
    setAddAttachmentsDrawerOpen(false)
    reset({ attachments: [] })
  }

  //   const handleCommentDialogSubmit = async (data: { observation_id: number; notes: string }) => {
  //     setCommentDialogLoading(true)
  //     try {
  //       const formData = new FormData()
  //       formData.append('observation_id', String(data.observation_id))
  //       formData.append('observation', data.notes)

  //       await addObservationComment(formData)

  //       setCommentDialogOpen(false)
  //       fetchObservationDetails()
  //       if (onUpdate) onUpdate()

  //       Toaster({ type: 'success', message: 'Comment added successfully' })
  //     } catch (error) {
  //       console.error('Error adding comment:', error)
  //       Toaster({ type: 'error', message: 'Failed to add comment' })
  //     } finally {
  //       setCommentDialogLoading(false)
  //     }
  //   }

  const handleEditSuccess = () => {
    setEditDrawerOpen(false)
    // fetchObservationDetails()
    if (onUpdate) onUpdate()
  }

  //   const handleDelete = async () => {
  //     setDeleteLoading(true)
  //     try {
  //       const response = await deleteObservation({ observation_id: observationData?.observation_id as number })
  //       if (response?.success) {
  //         Toaster({ type: 'success', message: 'Note deleted successfully' })
  //         setDeleteDialogOpen(false)
  //         handleClose()
  //         if (onUpdate) onUpdate()
  //       } else {
  //         Toaster({ type: 'error', message: response?.message || 'Failed to delete note' })
  //       }
  //     } catch (error) {
  //       console.error('Error deleting note:', error)
  //       Toaster({ type: 'error', message: 'Failed to delete note' })
  //     } finally {
  //       setDeleteLoading(false)
  //     }
  //   }

  //   const handleUpdateMembers = async (selectedUsers: User[]) => {
  //     setUpdateMembersLoading(true)
  //     try {
  //       const formData = new FormData()
  //       formData.append('observation_id', String(observationData?.observation_id))
  //       // Mobile uses comma-separated string for assign_to, not JSON array
  //       formData.append('assign_to', selectedUsers.map(u => u.user_id).join(','))

  //       const response = await editObservation(formData)
  //       if (response?.success) {
  //         Toaster({ type: 'success', message: 'Members updated successfully' })
  //         setSearchUsersDrawerOpen(false)
  //         setTaggedMembersDrawerOpen(false)
  //         fetchObservationDetails()
  //         if (onUpdate) onUpdate()
  //       } else {
  //         Toaster({ type: 'error', message: response?.message || 'Failed to update members' })
  //       }
  //     } catch (error) {
  //       console.error('Error updating members:', error)
  //       Toaster({ type: 'error', message: 'Failed to update members' })
  //     } finally {
  //       setUpdateMembersLoading(false)
  //     }
  //   }

  // Resolved like values from local state (falls back to data if likeState not yet set)
  const priorityIcon = notesDetailsData?.priority ? priorityIcons[notesDetailsData?.priority] : null
  const isCreator =
    currentUserId && notesDetailsData?.created_by_id && currentUserId === notesDetailsData?.created_by_id
  const visibleMedia = showAllMedia ? notesDetailsData?.attachments : notesDetailsData?.attachments.slice(0, 4)
  const taggedMembers = notesDetailsData?.assign_to || []
  const isLiked = likeState?.isLiked ?? notesDetailsData?.user_reaction === 'like'
  const likeCount = likeState?.count ?? (notesDetailsData as any)?.reaction_counts?.like ?? 0
  const totalComments = notesDetailsData?.notes ? notesDetailsData?.notes?.length : 0
  const commentsList = notesDetailsData?.notes || []
  const hideFAB = showCommentInput || addAttachmentsDrawerOpen

  // Sync likeState when notesDetailsData is first loaded
  useEffect(() => {
    if (notesDetailsData) {
      setLikeState({
        isLiked: notesDetailsData.user_reaction === 'like',
        count: (notesDetailsData as any).reaction_counts?.like || notesDetailsData.reaction_count || 0
      })
    }
  }, [notesDetailsData?.observation_id])

  useEffect(() => {
    if (open && !noteDetails?.observation_id) return

    fetchObservationDetails()
  }, [open, noteDetails?.observation_id])

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={handleClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 560 },
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
          Note
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

      {notesDetailsLoading ? (
        <Box display='flex' justifyContent='center' alignItems='center' flex={1}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Note Type Header */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              p: 4,
              backgroundColor: theme.palette.customColors?.displaybgPrimary,
              position: 'relative'
            }}
          >
            {/* Priority Flag Icon */}
            {priorityIcon && (
              <Box
                component='img'
                src={priorityIcon}
                alt={notesDetailsData?.priority}
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 0,
                  height: 40,
                  transform: 'scaleX(-1)'
                }}
              />
            )}

            <Box sx={{ width: '90%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: '4px',
                    bgcolor: theme.palette.customColors.OnSecondaryContainer,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <NoteIcon sx={{ color: theme.palette.customColors.OnPrimary, fontSize: 20 }} />
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0
                  }}
                >
                  <TextEllipsisWithModal
                    enableDialog={false}
                    text={notesDetailsData?.child_master_type?.parent_observation_type}
                    style={{
                      color: theme.palette.customColors.OnSecondaryContainer,
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      maxWidth: '100%'
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {notesDetailsData?.child_master_type?.child_observation_type?.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                {notesDetailsData?.child_master_type?.child_observation_type
                  ?.slice(
                    0,
                    showAllChildNoteTypes ? notesDetailsData?.child_master_type?.child_observation_type?.length : 1
                  )
                  .map((type: any, index: number) => (
                    <Chip
                      key={index}
                      label={type?.type_name}
                      size='small'
                      sx={{
                        bgcolor: theme.palette.customColors.mdAntzNeutral,
                        color: theme.palette.customColors.OnSurfaceVariant,
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        height: 26,
                        '& .MuiChip-label': {
                          px: 2
                        }
                      }}
                    />
                  ))}
                {notesDetailsData?.child_master_type?.child_observation_type?.length > 1 && (
                  <Typography
                    variant='caption'
                    onClick={e => {
                      e.stopPropagation()
                      setShowAllChildNoteTypes(prev => !prev)
                    }}
                    sx={{
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {showAllChildNoteTypes
                      ? 'Hide'
                      : `+${notesDetailsData?.child_master_type?.child_observation_type?.length - 1} more`}
                  </Typography>
                )}
              </Box>
            )}

            {/* User Section - Noted By */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 500
                }}
              >
                Noted by
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3 }}>
                <UserAvatarDetails
                  profile_image={notesDetailsData?.created_by_profile_pic}
                  user_name={notesDetailsData?.created_by}
                  date={`${notesDetailsData?.create_date} ${notesDetailsData?.create_time}`}
                  show_time
                  size='medium'
                  text_color={theme.palette.customColors.OnSurfaceVariant}
                />
                {/* MOBILE VIEW */}
                <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 2 }}>
                  <IconButton
                    sx={{
                      backgroundColor: alpha(theme.palette.customColors?.OnSecondaryContainer, 0.1),
                      color: theme.palette.customColors?.OnSecondaryContainer,
                      width: 32,
                      height: 32,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.customColors?.OnSecondaryContainer, 0.3)
                      }
                    }}
                    onClick={() => window.open(`tel:${notesDetailsData?.created_by_phone}`, '_self')}
                  >
                    <PhoneIcon sx={{ fontSize: 18 }} />
                  </IconButton>

                  <IconButton
                    sx={{
                      backgroundColor: alpha(theme.palette.customColors?.OnSecondaryContainer, 0.1),
                      color: theme.palette.customColors.OnSecondaryContainer,
                      width: 32,
                      height: 32,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.customColors?.OnSecondaryContainer, 0.3)
                      }
                    }}
                    onClick={() => window.open(`sms:${notesDetailsData?.created_by_phone}`, '_self')}
                  >
                    <CommentIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>

                {/* DESKTOP VIEW */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                  <IconButton
                    size='small'
                    onClick={() => setShowMobileNumber(prev => !prev)}
                    sx={{
                      backgroundColor: alpha(theme.palette.customColors?.OnSecondaryContainer, 0.1),
                      color: theme.palette.customColors?.OnSecondaryContainer,
                      width: 32,
                      height: 32,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.customColors?.OnSecondaryContainer, 0.3)
                      }
                    }}
                  >
                    <PhoneIcon sx={{ fontSize: 18 }} />
                  </IconButton>

                  {/* NUMBER + COPY */}
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
                      sx={{
                        fontWeight: 500,
                        fontSize: '14px',
                        color: theme.palette.customColors?.OnSecondaryContainer
                      }}
                    >
                      {notesDetailsData?.created_by_phone}
                    </Typography>

                    <Tooltip title={copied ? 'Copied!' : 'Copy number'}>
                      <IconButton
                        size='small'
                        onClick={() => handleCopyNumber(notesDetailsData?.created_by_phone || '')}
                        sx={{
                          color: theme.palette.customColors?.OnSecondaryContainer,
                          width: 32,
                          height: 32,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.customColors?.OnSecondaryContainer, 0.3)
                          }
                        }}
                      >
                        <Icon icon={copied ? 'mdi:check' : 'mdi:content-copy'} fontSize={18} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              minHeight: 0
            }}
          >
            {/* location info data */}
            <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {notesDetailsData?.ref_data?.length > 0 && (
                <Box
                  sx={{
                    borderRadius: '8px',
                    border: `1px solid ${theme.palette.customColors?.OutlineVariant}`,
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
                      {notesDetailsData?.ref_data?.length == 1
                        ? '1 Entity'
                        : `${notesDetailsData?.ref_data?.length} Entities`}
                    </Typography>
                  </Box>

                  <Box sx={{ px: 3, py: 2 }}>
                    {notesDetailsData?.ref_data?.[0]?.animalData && (
                      <AnimalCard data={notesDetailsData?.ref_data?.[0]?.animalData} />
                    )}

                    {(notesDetailsData?.ref_data?.[0]?.siteData ||
                      notesDetailsData?.ref_data?.[0]?.sectionData ||
                      notesDetailsData?.ref_data?.[0]?.enclosureData) && (
                      <LocationInfoCard data={notesDetailsData?.ref_data} variant='multiple' />
                    )}
                  </Box>
                </Box>
              )}
              {/* description */}
              {notesDetailsData?.observation_name && (
                <Box>
                  <Typography variant='body2' sx={{ color: theme.palette.text.secondary }}>
                    Description
                  </Typography>
                  <Tooltip title={notesDetailsData?.observation_name}>
                    <Typography
                      sx={{ fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant, fontSize: '1rem' }}
                    >
                      {notesDetailsData?.observation_name?.length > 120 && !showFullNote
                        ? `${notesDetailsData?.observation_name.substring(0, 115)}...`
                        : notesDetailsData?.observation_name}
                      {notesDetailsData?.observation_name?.length > 120 && (
                        <Typography
                          component='span'
                          onClick={e => {
                            setShowFullNote(prev => !prev)
                          }}
                          sx={{
                            color: theme.palette.primary.main,
                            fontWeight: 600,
                            cursor: 'pointer',
                            ml: 1,
                            fontSize: '0.813rem',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          {showFullComment ? 'Show Less' : 'Show More'}
                        </Typography>
                      )}
                    </Typography>
                  </Tooltip>
                </Box>
              )}
              {/* attachments */}
              {notesDetailsData?.attachments?.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton size='small' sx={{ p: 0 }}>
                      <AttachFile sx={{ fontSize: 18, color: theme.palette.customColors?.OnPrimaryContainer }} />
                    </IconButton>
                    <Typography variant='body2' sx={{ color: theme.palette.text.secondary }}>
                      Attachments
                    </Typography>
                  </Box>
                  <Grid container spacing={3}>
                    {visibleMedia?.map((attachment: Attachment, index: number) => (
                      <Grid key={attachment?.id || index} size={{ xs: 12, sm: 6 }}>
                        <FilePreviewCard
                          fileUrl={attachment?.file}
                          fileName={attachment?.file_orginal_name}
                          showTitle={true}
                        />
                      </Grid>
                    ))}
                  </Grid>
                  {/* view more button */}
                  {notesDetailsData?.attachments?.length > 4 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Button
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600
                        }}
                        onClick={() => setShowAllMedia(prev => !prev)}
                      >
                        {showAllMedia ? (
                          <>
                            <Icon icon='mdi:chevron-up' fontSize={20} />
                            Hide
                          </>
                        ) : (
                          <>
                            <Icon icon='mdi:chevron-down' fontSize={20} />
                            View More
                          </>
                        )}
                      </Button>
                    </Box>
                  )}
                </Box>
              )}

              {/* Tagged Members */}
              <Box
                onClick={() => taggedMembers?.length > 0 && setTaggedMembersDrawerOpen(true)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: taggedMembers?.length > 0 ? 'pointer' : 'default',
                  '&:hover': taggedMembers?.length > 0 ? { opacity: 0.7 } : {}
                }}
              >
                <PersonIcon sx={{ fontSize: 24, color: theme.palette.primary.main }} />
                {taggedMembers?.length > 0 ? (
                  <>
                    <Typography variant='body2' sx={{ color: theme.palette.text.primary }}>
                      {taggedMembers[0]?.full_name || '-'}
                    </Typography>
                    {taggedMembers?.length > 1 && <Typography variant='body2'>+{taggedMembers?.length - 1}</Typography>}
                  </>
                ) : (
                  <Typography variant='body2' sx={{ color: theme.palette.error.main }}>
                    No member Tagged
                  </Typography>
                )}
              </Box>

              <Divider />

              {/* like and comment */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  onClick={isLikeLoading ? undefined : handleLikeClick}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 1,
                    px: 2,
                    borderRadius: '20px',
                    backgroundColor: isLiked ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                    cursor: isLikeLoading ? 'default' : 'pointer',
                    '&:hover': { opacity: 0.7 }
                  }}
                >
                  {isLikeLoading ? (
                    <CircularProgress size={20} color='primary' />
                  ) : isLiked ? (
                    <LikeIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                  ) : (
                    <LikeOutlinedIcon sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                  )}
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: '14px',
                      color: isLiked ? theme.palette.primary.main : theme.palette.text.secondary
                    }}
                  >
                    {likeCount}
                  </Typography>
                </Box>

                {/* Comment Button */}
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
                >
                  <CommentIcon sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                  <Typography sx={{ color: theme.palette.text.secondary, fontSize: '14px', fontWeight: 600 }}>
                    {totalComments}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* comments listing */}
              {/* <Box>
                {commentsList?.length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '300px', overflowY: 'auto' }}>
                    {commentsList?.map((item: any, index: number) => {
                      return (
                        <Box key={item?.id || index}>
                          <Box
                            sx={{
                              p: 3,
                              borderRadius: 1,
                              bgcolor: theme.palette.customColors?.antzNotes
                            }}
                          >
                            <Typography sx={{ fontSize: '14px' }}>
                              {item?.observation?.length > 120 && !showFullComment
                                ? `${item?.observation.substring(0, 115)}...`
                                : item?.observation}
                              {item?.observation?.length > 120 && (
                                <Typography
                                  component='span'
                                  onClick={() => {
                                    setShowFullComment(prev => !prev)
                                  }}
                                  sx={{
                                    color: theme.palette.primary.main,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    ml: 1,
                                    fontSize: '0.813rem',
                                    '&:hover': {
                                      textDecoration: 'underline'
                                    }
                                  }}
                                >
                                  {showFullComment ? 'Read Less' : 'Read More'}
                                </Typography>
                              )}
                            </Typography>

                            {item?.notes_attachment && item?.notes_attachment?.length > 0 && (
                              <Grid container spacing={3}>
                                {item?.notes_attachment?.map((attachment: any, index: number) => (
                                  <Grid key={attachment?.id || index} size={{ xs: 12, sm: 6 }}>
                                    <FilePreviewCard
                                      key={attachment.id || index}
                                      fileUrl={attachment?.file}
                                      fileName={
                                        attachment.file_orginal_name || attachment.file_name || attachment.fileName
                                      }
                                      showTitle={true}
                                    />
                                  </Grid>
                                ))}
                              </Grid>
                            )}
                            {item?.notes_attachment?.length > 4 && (
                              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Button
                                  sx={{
                                    textTransform: 'none',
                                    fontWeight: 600
                                  }}
                                  onClick={() => setShowAllMedia(prev => !prev)}
                                >
                                  {showAllMedia ? (
                                    <>
                                      <Icon icon='mdi:chevron-up' fontSize={20} />
                                      Hide
                                    </>
                                  ) : (
                                    <>
                                      <Icon icon='mdi:chevron-down' fontSize={20} />
                                      View More
                                    </>
                                  )}
                                </Button>
                              </Box>
                            )}
                            <Box sx={{ mt: 2 }}>
                              <UserAvatarDetails
                                profile_image={item?.user_profile_pic}
                                user_name={item?.created_by_name}
                                date={item?.created_at}
                                size='medium'
                                show_time
                                text_color={theme.palette.customColors.OnSurfaceVariant}
                              />
                            </Box>
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                )}
              </Box> */}
              <Box>
                {commentsList?.length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '300px', overflowY: 'auto' }}>
                    {commentsList?.map((item: any, index: number) => {
                      const attachments = item?.notes_attachment || []

                      const visibleAttachments = showAllMedia ? attachments : attachments.slice(0, 4)

                      return (
                        <Box key={item?.id || index}>
                          <Box
                            sx={{
                              p: 3,
                              borderRadius: attachments?.length > 0 ? 0 : 1,
                              backgroundColor:
                                attachments?.length > 0 ? 'transparent' : theme.palette.customColors?.antzNotes,
                              borderBottom:
                                attachments?.length > 0
                                  ? `1px solid ${theme.palette.action.disabledBackground}`
                                  : 'none'
                            }}
                          >
                            {/* COMMENT TEXT */}
                            <Typography sx={{ fontSize: '14px' }}>
                              {item?.observation?.length > 120 && !showFullComment
                                ? `${item?.observation.substring(0, 115)}...`
                                : item?.observation}
                              {item?.observation?.length > 120 && (
                                <Typography
                                  component='span'
                                  onClick={() => {
                                    setShowFullComment(prev => !prev)
                                  }}
                                  sx={{
                                    color: theme.palette.primary.main,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    ml: 1,
                                    fontSize: '0.813rem',
                                    '&:hover': {
                                      textDecoration: 'underline'
                                    }
                                  }}
                                >
                                  {showFullComment ? 'Read Less' : 'Read More'}
                                </Typography>
                              )}
                            </Typography>

                            {/* ATTACHMENTS */}
                            {attachments.length > 0 && (
                              <>
                                <Grid container spacing={3} sx={{ mt: 2 }}>
                                  {visibleAttachments.map((attachment: any, i: number) => (
                                    <Grid key={attachment?.id || i} size={{ xs: 12, sm: 6 }}>
                                      <FilePreviewCard
                                        fileUrl={attachment?.file}
                                        fileName={attachment?.file_orginal_name}
                                        showTitle={true}
                                      />
                                    </Grid>
                                  ))}
                                </Grid>

                                {/* VIEW MORE */}
                                {attachments.length > 4 && (
                                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                    <Button
                                      onClick={() => setShowAllMedia(prev => !prev)}
                                      sx={{ textTransform: 'none', fontWeight: 600 }}
                                    >
                                      {showAllMedia ? 'Hide' : 'View More'}
                                    </Button>
                                  </Box>
                                )}
                              </>
                            )}
                            <Box sx={{ mt: 2 }}>
                              <UserAvatarDetails
                                profile_image={item?.user_profile_pic}
                                user_name={item?.created_by_name}
                                date={item?.created_at}
                                size='medium'
                                show_time
                                text_color={theme.palette.customColors.OnSurfaceVariant}
                              />
                            </Box>
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </>
      )}

      {/* Comment Input Footer */}
      {showCommentInput && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            py: 6,
            px: 5,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.customColors?.OnPrimary,
            flexShrink: 0,
            boxShadow: `0px -1px 10px 0px ${theme.palette.customColors.neutralTeritary}`
          }}
        >
          <TextField
            fullWidth
            size='small'
            placeholder='Write a comment...'
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
                backgroundColor: theme.palette.background.paper,
                p: 1
              }
            }}
          />
          <IconButton
            disabled={!comment.trim() || commentLoading}
            onClick={handleCommentSubmit}
            sx={{
              color: comment.trim() ? theme.palette.primary.main : theme.palette.action.disabled,
              '&:hover': { color: theme.palette.primary.dark }
            }}
          >
            {commentLoading ? <CircularProgress size={20} color='inherit' /> : <SendIcon />}
          </IconButton>
          <IconButton onClick={() => setShowCommentInput(false)} sx={{ p: 0 }}>
            <CloseIcon />
          </IconButton>
        </Box>
      )}

      {/* Tagged Members Drawer */}
      {taggedMembersDrawerOpen && (
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
                backgroundColor: theme.palette.background.paper,
                pb: 8
              }
            },
            backdrop: {
              sx: {
                backgroundColor: theme.palette.customColors.neutralTeritary
              }
            }
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 4,
              borderBottom: `1px solid ${theme.palette.divider}`
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PersonIcon sx={{ fontSize: 24, color: theme.palette.text.secondary }} />
              <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
                {taggedMembers?.length} Tagged Member{taggedMembers?.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
          <Box sx={{ p: 4, overflowY: 'auto', maxHeight: 'calc(60vh - 80px)' }}>
            {taggedMembers?.map((member: Members, index: number) => (
              <Box
                key={member?.user_id || index}
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.default
                }}
              >
                <UserAvatarDetails
                  profile_image={member?.user_profile_pic}
                  user_name={member?.full_name}
                  role={member?.role_name}
                  size='large'
                  text_color={theme.palette.customColors.OnSurfaceVariant}
                />
              </Box>
            ))}
          </Box>
        </Drawer>
      )}

      {/* add attachments Drawer */}
      {addAttachmentsDrawerOpen && (
        <Drawer
          anchor='right'
          open={addAttachmentsDrawerOpen}
          ModalProps={{ keepMounted: true }}
          slotProps={{
            paper: {
              sx: {
                width: { xs: '100%', sm: 560 },
                height: 'auto',
                maxHeight: '60vh',
                display: 'flex',
                flexDirection: 'column',
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
                backgroundColor: theme.palette.customColors.neutralTeritary
              }
            }
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 4,
              borderBottom: `1px solid ${theme.palette.divider}`
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AttachFile sx={{ fontSize: 24, color: theme.palette.text.secondary }} />
              <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>Add Attachments</Typography>
            </Box>
            <IconButton size='small' onClick={handleCloseAttachmentsDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              minHeight: 0
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 4 }}>
              <ControlledMultiFileUpload
                control={control}
                name='attachments'
                label='Upload attachments'
                acceptedFileTypes='*'
                preview
                previewPlacement='top'
                maxFiles={20}
              />
            </Box>
          </Box>
          <Box
            sx={{
              display: 'flex',
              gap: 4,
              p: 3,
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper
            }}
          >
            <Button
              fullWidth
              variant='outlined'
              onClick={() => reset({ attachments: [] })}
              disabled={attachmentsLoading}
            >
              Clear
            </Button>
            <Button
              fullWidth
              variant='contained'
              onClick={handleAttachmentsSubmit}
              disabled={!watch('attachments')?.length || attachmentsLoading}
            >
              Upload
            </Button>
          </Box>
        </Drawer>
      )}

      <ConfirmationDialog
        dialogBoxStatus={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title='Delete Note'
        description='Are you sure you want to delete this note? This action cannot be undone.'
        cancelText='CANCEL'
        ConfirmationText='DELETE'
        // confirmAction={handleDelete}
        loading={deleteLoading}
        image='/images/warning-icon.svg'
        imgStyle={{ background: theme.palette.customColors?.TertiaryLight, p: 4 }}
        confirmBtnStyle={{ background: theme.palette.error.main, py: 2 }}
      />

      {/* Edit Note Drawer */}
      {/* <EditNoteDrawer
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        note={observationData}
        onSuccess={handleEditSuccess}
      /> */}


      {/* Search Users Drawer for adding/editing members */}
      {/* <SearchUsersDrawer
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
        // onUsersSelected={handleUpdateMembers}
      /> */}

      {/* ================= FAB + MENU ================= */}
      {!hideFAB && (
        <>
          {/* WHITE OVERLAY */}
          {openQuickActions && (
            <Box
              onClick={() => setOpenQuickActions(false)}
              sx={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(255,255,255,0.9)',
                zIndex: 998
              }}
            />
          )}

          {/* ACTION MENU */}
          {openQuickActions && (
            <Box
              sx={{
                position: 'fixed',
                bottom: 90,
                right: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                zIndex: 999
              }}
            >
              <Button
                variant='contained'
                endIcon={<CommentIcon />}
                onClick={() => {
                  setShowCommentInput(true)
                  setOpenQuickActions(false)
                }}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  boxShadow: '0px 4px 10px rgba(0,0,0,0.15)',
                  justifyContent: 'flex-end'
                }}
              >
                Add Comment
              </Button>

              <Button
                variant='contained'
                endIcon={<AttachFile />}
                onClick={() => {
                  setAddAttachmentsDrawerOpen(true)
                  setOpenQuickActions(false)
                }}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  boxShadow: '0px 4px 10px rgba(0,0,0,0.15)',
                  justifyContent: 'flex-end'
                }}
              >
                Add Attachment
              </Button>
            </Box>
          )}

          {/* FAB BUTTON */}
          <Box
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1000
            }}
          >
            <IconButton
              onClick={() => setOpenQuickActions(prev => !prev)}
              sx={{
                width: 60,
                height: 60,
                borderRadius: '16px',
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.customColors?.OnPrimary,
                boxShadow: '0px 6px 16px rgba(0,0,0,0.25)',
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark
                }
              }}
            >
              <Icon icon={openQuickActions ? 'mdi:close' : 'mdi:plus'} fontSize={28} />
            </IconButton>
          </Box>
        </>
      )}
    </Drawer>
  )
}

export default NotesDetailsDrawer
