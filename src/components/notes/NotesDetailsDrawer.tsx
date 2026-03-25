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
  Avatar,
  Tooltip,
  Grid,
  Button
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
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
  AttachFile
} from '@mui/icons-material'
import Icon from 'src/@core/components/icon'
// import {
//   getObservationDetails,
//   addNoteReaction,
  // removeNoteReaction,
//   addObservationComment,
//   deleteObservation,
//   editObservation
// } from 'src/lib/api/housing'
import { addNotesReaction, removeNotesReaction ,getNotesDetails} from 'src/lib/api/notesModule'

import Toaster from 'src/components/Toaster'
import moment from 'moment'
import NewMediaCard from 'src/views/utility/NewMediaCard'
import { useAuth } from 'src/hooks/useAuth'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
// import EditNoteDrawer from './EditNoteDrawer'
// import NoteCommentDialog from './NoteCommentDialog'
// import SearchUsersDrawer from './SearchUsersDrawer'
import type { Note, NoteAttachment, NoteComment, NoteImage, User } from 'src/types/housing'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import FilePreviewCard from 'src/views/utility/NewMediaCard'

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
  note: Note | null
  onUpdate?: () => void
}

const NotesDetailsDrawer: React.FC<NoteDetailsDrawerProps> = ({ open, onClose, note, onUpdate }) => {
  const theme = useTheme()
  const auth = useAuth()
  const currentUserId = (auth as any)?.userData?.user?.user_id

  const [showAllChildTypes, setShowAllChildTypes] = useState(false)

  const [loading, setLoading] = useState(false)
  const [notesDetailsData, setNotesDetailsData] = useState<notesDetailsData | null>(null)
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
  const [showFullNote, setShowFullNote] = useState(false)
  const [showAllMedia, setShowAllMedia] = useState(false)
  const [previewFile, setPreviewFile] = useState<any>(null)

  // Local like state to avoid full re-render on like toggle
  const [likeState, setLikeState] = useState<{ isLiked: boolean; count: number } | null>(null)

  const isCreator = currentUserId && notesDetailsData?.created_by_id && currentUserId === notesDetailsData?.created_by_id

    useEffect(() => {
      if (open && note?.observation_id) {
        fetchObservationDetails()
      }
    }, [open, note?.observation_id])

  // Sync likeState when notesDetailsData is first loaded
  useEffect(() => {
    if (notesDetailsData) {
      setLikeState({
        isLiked: notesDetailsData.user_reaction === 'like',
        count: (notesDetailsData as any).reaction_counts?.like || notesDetailsData.reaction_count || 0
      })
    }
  }, [notesDetailsData?.observation_id])

    const fetchObservationDetails = async () => {
      setLoading(true)
      try {
        const payload ={
          observation_id: note?.observation_id as number
        }
        const response = await getNotesDetails(payload)
        if (response?.success) {
          setNotesDetailsData(response?.data as notesDetailsData | null)
        }
      } catch (error:any) {
        console.error('Error fetching note details:', error?.message)
        Toaster({ type: 'error', message: error?.message || 'Failed to fetch note details' })
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
      }
    }

  //   const handleCommentSubmit = async () => {
  //     if (!comment.trim()) return

  //     setCommentLoading(true)
  //     try {
  //       const formData = new FormData()
  //       formData.append('observation_id', String(observationData?.observation_id))
  //       formData.append('observation', comment.trim())

  //       await addObservationComment(formData)

  //       setComment('')
  //       fetchObservationDetails()
  //       if (onUpdate) onUpdate()

  //       Toaster({ type: 'success', message: 'Comment added successfully' })
  //     } catch (error) {
  //       console.error('Error adding comment:', error)
  //       Toaster({ type: 'error', message: 'Failed to add comment' })
  //     } finally {
  //       setCommentLoading(false)
  //     }
  //   }

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

  const data = notesDetailsData || note
  const parentType = (data as any)?.child_master_type?.parent_observation_type || 'Note'
  const childTypes = (data as any)?.child_master_type?.child_observation_type || []
  const priorityIcon = data?.priority ? priorityIcons[data.priority] : null

  const comments = notesDetailsData?.notes || []
  const taggedMembers = (data as any)?.assign_to || []
  // Use total_comments from API if available, fallback to notes array length

  const totalComments =
    (notesDetailsData as any)?.total_comments ?? (data as any)?.note?.total_comments ?? comments.length

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
    const obsData = notesDetailsData as ObservationData | null

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
  const visibleMedia = showAllMedia ? data?.attachments : data?.attachments.slice(0, 4)

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

      {loading ? (
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
                alt={data?.priority}
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
                    text={parentType}
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

            {childTypes?.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', pr: 12 }}>
                {childTypes?.slice(0, showAllChildTypes ? childTypes.length : 1).map((type: any, index: number) => (
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
                {childTypes?.length > 1 && (
                  <Typography
                    variant='caption'
                    onClick={() => {
                      setShowAllChildTypes(prev => !prev)
                    }}
                    sx={{
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {showAllChildTypes ? 'Hide' : `+${childTypes.length - 1} more`}
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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                <UserAvatarDetails
                  profile_image={note?.created_by_profile_pic}
                  user_name={note?.created_by}
                  date={note?.created_at}
                  show_time
                  size='medium'
                />
                <IconButton
                  size='small'
                  sx={{ bgcolor: theme.palette.customColors?.Background, width: 32, height: 32 }}
                >
                  <PhoneIcon sx={{ fontSize: 18, color: theme.palette.customColors?.OnPrimaryContainer }} />
                </IconButton>
                <IconButton
                  size='small'
                  sx={{ bgcolor: theme.palette.customColors?.Background, width: 32, height: 32 }}
                >
                  <CommentIcon sx={{ fontSize: 18, color: theme.palette.customColors?.OnPrimaryContainer }} />
                </IconButton>
              </Box>
            </Box>
          </Box>
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              minHeight: 0,
              backgroundColor: theme.palette.customColors?.OnPrimary
            }}
          >
            <Box sx={{ p: 4, backgroundColor: theme.palette.customColors?.onPrimaryContainer }}>
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
              )}

              {data?.observation_name && (
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant='body2' sx={{ color: theme.palette.text.secondary }}>
                    Description
                  </Typography>
                  <Tooltip title={data?.observation_name}>
                    <Typography
                      sx={{ fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant, fontSize: '1rem' }}
                    >
                      {data?.observation_name?.length > 120 && !showFullNote
                        ? `${data?.observation_name.substring(0, 115)}...`
                        : data?.observation_name}
                      {data?.observation_name?.length > 120 && (
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
                          {showFullNote ? 'Show Less' : 'Show More'}
                        </Typography>
                      )}
                    </Typography>
                  </Tooltip>
                </Box>
              )}

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
                  {visibleMedia?.map((attachment, index) => (
                    <Grid key={attachment?.id || index} size={{ xs: 12, sm: 6 }}>
                      <FilePreviewCard fileUrl={attachment?.file} fileName={attachment?.file_orginal_name} showTitle={true} />
                    </Grid>
                  ))}
                </Grid>
                {note?.attachments.length > 4 && (
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

              {/* Tagged Members - Clickable to show drawer */}
              <Box
                onClick={() => taggedMembers.length > 0 && setTaggedMembersDrawerOpen(true)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: taggedMembers.length > 0 ? 'pointer' : 'default',
                  '&:hover': taggedMembers.length > 0 ? { opacity: 0.7 } : {}
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
                    No member Tagged
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
                      color: isLiked ? theme.palette.customColors?.amber : theme.palette.text.secondary
                    }}
                  />
                  <Typography sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors?.OnSurfaceVariant }}>
                    {likeCount}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.7 }
                  }}
                >
                  <IconButton
                    size='small'
                    onClick={() => setCommentDialogOpen(true)}
                    // sx={{ bgcolor: theme.palette.customColors?.Background, width: 32, height: 32 }}
                  >
                    <CommentIcon sx={{ fontSize: 20 }} />
                  </IconButton>

                  <Typography sx={{ color: theme.palette.customColors?.onPrimaryContainer, fontWeight: 500 }}>
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
                              borderRadius: 1,
                              bgcolor: theme.palette.customColors?.antzNotes
                            }}
                          >
                            <Box sx={{ mb: 1.5 }}>
                              <UserAvatarDetails
                                profile_image={item.user_profile_pic || item.commented_by_image}
                                user_name={item.created_by_name || item.commented_by_name}
                                date={item.created_at || item.commented_at}
                                size='medium'
                                show_time
                              />
                            </Box>

                            {commentText && (
                              <Box sx={{ ml: 5, mb: 1.5 }}>
                                <Typography variant='body2'>{commentText}</Typography>
                              </Box>
                            )}

                            {item.notes_attachment && item.notes_attachment.length > 0 && (
                              <Box sx={{ ml: 5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {item.notes_attachment.map((attachment: any, idx: number) => (
                                  <NewMediaCard
                                    key={attachment.id || idx}
                                    fileUrl={getAttachmentUrl(attachment) || undefined}
                                    fileName={attachment.file_orginal_name || attachment.file_name || attachment.fileName}
                                    fileType={attachment.file_type || attachment.type || attachment.fileType}
                                    width='100px'
                                    showTitle={false}
                                  />
                                ))}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                ) : (
                  <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center', py: 4 }}>
                    No comments yet
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </>
      )}

      {/* Comment Input Footer */}
      <Box
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
          placeholder='Write a comment...'
          value={comment}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setComment(e.target.value)}
          //   onKeyPress={(e: React.KeyboardEvent) => {
          //     if (e.key === 'Enter' && !e.shiftKey) {
          //       e.preventDefault()
          //       handleCommentSubmit()
          //     }
          //   }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 6,
              backgroundColor: theme.palette.background.paper
            }
          }}
        />
        <IconButton
          disabled={!comment.trim() || commentLoading}
          //   onClick={handleCommentSubmit}
          sx={{
            bgcolor: theme.palette.primary.main,
            color: theme.palette.customColors?.OnPrimary,
            '&:hover': { bgcolor: theme.palette.primary.dark },
            '&:disabled': { bgcolor: theme.palette.action.disabledBackground }
          }}
        >
          {commentLoading ? <CircularProgress size={20} color='inherit' /> : <SendIcon />}
        </IconButton>
      </Box>

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

      {/* Add Comment Dialog */}
      {/* <NoteCommentDialog
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        note={observationData as Note | null}
        onSubmit={handleCommentDialogSubmit}
        loading={commentDialogLoading}
      /> */}

      {/* Tagged Members Drawer - Positioned at right bottom */}
      <Drawer
        anchor='right'
        open={taggedMembersDrawerOpen}
        onClose={() => setTaggedMembersDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 560 },
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
        <Box sx={{ px: 4, py: 2, overflowY: 'auto', maxHeight: 'calc(60vh - 70px)' }}>
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
      </Drawer>

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
    </Drawer>
  )
}

export default NotesDetailsDrawer

