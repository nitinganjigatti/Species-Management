'use client'

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
  useTheme
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import {
  Description as NoteIcon,
  ThumbUp as LikeIcon,
  ThumbUpOutlined as LikeOutlinedIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Send as SendIcon
} from '@mui/icons-material'
import Icon from 'src/@core/components/icon'
import { useAuth } from 'src/hooks/useAuth'
import { useForm } from 'react-hook-form'
import Toaster from 'src/components/Toaster'

import { addNotesReaction, removeNotesReaction, getNotesDetails, addNotesComment } from 'src/lib/api/notesModule'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import NotifyMembersDrawer from 'src/components/housing/sites/NotifyMembersDrawer'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import AddNoteDrawer from './AddNoteDrawer'
import FilePreviewCard from 'src/views/utility/NewMediaCard'
import LocationInfoCard from 'src/views/utility/LocationInfoCard'
import AnimalCard from 'src/views/utility/AnimalCard'
import { deleteObservation } from 'src/lib/api/housing'
import { NoteDetailsDrawerProps, NotesDetailsData, PriorityIcons, NoteDetails, Attachment } from 'src/types/notes'
import AddAttachmentsDrawer from './AddAttachmentsDrawer'
import TaggedMembersDrawer from './TaggedMembersDrawer'

const priorityIcons: PriorityIcons = {
  Low: '/images/priority/flag_priority_low.svg',
  Moderate: '/images/priority/flag_priority_medium.svg',
  High: '/images/priority/flag_priority_high.svg',
  Critical: '/images/priority/flag_priority_critical.svg'
}

const NotesDetailsDrawer: React.FC<NoteDetailsDrawerProps> = ({
  open,
  onClose,
  noteDetails,
  openWithComment,
  onUpdate,
  refetchNotesList
}) => {
  const theme = useTheme() as any
  const auth = useAuth()
  const currentUserId = (auth as any)?.userData?.user?.user_id

  const [notesDetailsLoading, setNotesDetailsLoading] = useState(false)
  const [notesDetailsData, setNotesDetailsData] = useState<NotesDetailsData | null>(null)
  const [showAllChildNoteTypes, setShowAllChildNoteTypes] = useState<boolean>(false)
  const [showFullNote, setShowFullNote] = useState<boolean>(false)
  const [showAllMedia, setShowAllMedia] = useState<boolean>(false)
  const [taggedMembersDrawerOpen, setTaggedMembersDrawerOpen] = useState<boolean>(false)
  const [likeState, setLikeState] = useState<{ isLiked: boolean; count: number } | null>(null)
  const [isLikeLoading, setIsLikeLoading] = useState<boolean>(false)
  const [showFullComment, setShowFullComment] = useState<boolean>(false)
  const [showCommentInput, setShowCommentInput] = useState<boolean>(false)
  const [comment, setComment] = useState<string>('')
  const [commentLoading, setCommentLoading] = useState<boolean>(false)
  const [attachmentsLoading, setAttachmentsLoading] = useState<boolean>(false)
  const [addAttachmentsDrawerOpen, setAddAttachmentsDrawerOpen] = useState<boolean>(false)
  const [showMobileNumber, setShowMobileNumber] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)
  const [notifyMembersDrawerOpen, setNotifyMembersDrawerOpen] = useState<boolean>(false)
  const [notifyMembers, setNotifyMembers] = useState<any[]>([])

  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState<boolean>(false)
  const [searchUsersDrawerOpen, setSearchUsersDrawerOpen] = useState(false)
  const [updateMembersLoading, setUpdateMembersLoading] = useState(false)
  const [showAllEntities, setShowAllEntities] = useState<boolean>(false)

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
        setNotesDetailsData(response?.data)
      }
    } catch (error: any) {
      console.error('Error fetching note details:', error?.message || error)
      Toaster({ type: 'error', message: error?.message || 'Failed to fetch note details' })
    } finally {
      setNotesDetailsLoading(false)
    }
  }

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

      if (refetchNotesList) refetchNotesList()

      Toaster({
        type: 'success',
        message: wasLiked ? 'Like removed' : 'Liked successfully'
      })
    } catch (error: any) {
      // Revert optimistic update on failure
      setLikeState({
        isLiked: wasLiked,
        count: likeState.count
      })
      console.error('Error toggling like:', error?.message || error)
      Toaster({ type: 'error', message: error?.message || 'Failed to update like' })
    } finally {
      setIsLikeLoading(false)
    }
  }

  // Handle comment submit
  const handleCommentSubmit = async () => {
    if (!comment.trim()) return

    setCommentLoading(true)
    try {
      const payload = {
        observation_id: notesDetailsData?.observation_id as number | string,
        observation: comment.trim()
      }

      await addNotesComment(payload)

      setComment('')
      fetchObservationDetails()

      if (refetchNotesList) refetchNotesList()

      Toaster({ type: 'success', message: 'Comment added successfully' })
      if (openWithComment) {
        handleClose()
      }
    } catch (error: any) {
      console.error('Error adding comment:', error?.message || error)
    } finally {
      setCommentLoading(false)
    }
  }

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

  const handleNotifyMembersChange = (newValue: any[]) => {
    setNotifyMembers(newValue)
  }

  const handleClose = () => {
    setNotesDetailsData(null)
    setLikeState(null)
    setComment('')
    setDeleteDialogOpen(false)
    setEditDrawerOpen(false)
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

  const handleDelete = async () => {
    setDeleteLoading(true)

    try {
      const response = await deleteObservation({ observation_id: noteDetails?.observation_id as number })
      if (response?.success) {
        Toaster({ type: 'success', message: 'Note deleted successfully' })
        setDeleteDialogOpen(false)
        handleClose()
        if (onUpdate) onUpdate()
        if (refetchNotesList) refetchNotesList()
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to delete note' })
      }
    } catch (error: any) {
      console.error('Error deleting note:', error?.message || error)
      Toaster({ type: 'error', message: 'Failed to delete note' })
    } finally {
      setDeleteLoading(false)
    }
  }

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
        count: (notesDetailsData as any).reaction_counts?.like || 0
      })
    }
  }, [notesDetailsData?.observation_id])

  useEffect(() => {
    if (open && openWithComment) {
      setShowCommentInput(true)
    }
  }, [open, openWithComment])

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
                <Icon icon='ri:pencil-fill' width='24' height='24' />
              </IconButton>
              <IconButton
                size='small'
                onClick={() => setDeleteDialogOpen(true)}
                sx={{ color: theme.palette.error.main }}
              >
                <Icon icon='ic:round-delete' width='24' height='24' />
              </IconButton>
            </>
          )}
          <IconButton size='small' onClick={handleClose}>
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>
      </Box>

      {notesDetailsLoading ? (
        <Box display='flex' justifyContent='center' alignItems='center' flex={1}>
          <CircularProgress />
        </Box>
      ) : (
        <>
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
              <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
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
                  <Typography
                    sx={{
                      color: theme.palette.customColors.OnSecondaryContainer,
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      maxWidth: '100%'
                    }}
                  >
                    {notesDetailsData?.child_master_type?.parent_observation_type}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {notesDetailsData?.child_master_type?.child_observation_type &&
              notesDetailsData?.child_master_type?.child_observation_type?.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  {notesDetailsData?.child_master_type?.child_observation_type
                    ?.slice(
                      0,
                      showAllChildNoteTypes ? notesDetailsData?.child_master_type?.child_observation_type?.length : 7
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
                  {notesDetailsData?.child_master_type?.child_observation_type?.length > 7 && (
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
                        : `+${notesDetailsData?.child_master_type?.child_observation_type?.length - 7} more`}
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
                  // profile_image={notesDetailsData?.created_by_profile_pic}
                  user_name={notesDetailsData?.created_by}
                  date={`${notesDetailsData?.create_date} ${notesDetailsData?.create_time}`}
                  show_time
                  size='medium'
                  text_color={theme.palette.customColors.OnSurfaceVariant}
                />
                {/* Mobile view */}
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
                    <Icon icon='material-symbols:comment-rounded' width='20' height='20' />
                  </IconButton>
                </Box>

                {/* desktop view */}
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

                  {/* Number + Copy */}
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
              {notesDetailsData?.ref_data && notesDetailsData?.ref_data.length > 0 && (
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

                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    {(showAllEntities ? notesDetailsData?.ref_data : notesDetailsData?.ref_data?.slice(0, 3))?.map(
                      (item: any, index: number) => (
                        <Box
                          key={index}
                          sx={{
                            px: 3,
                            py: 2,
                            borderBottom:
                              index < (notesDetailsData?.ref_data?.length || 0) - 1
                                ? `1px solid ${theme.palette.customColors?.OutlineVariant}`
                                : 'none'
                          }}
                        >
                          {/* Animal Card */}
                          {item?.animalData && <AnimalCard data={item?.animalData} />}

                          {/* Location Card (Site, Section, Enclosure) */}
                          {(item?.siteData || item?.sectionData || item?.enclosureData) && (
                            <LocationInfoCard data={[item]} variant='single' />
                          )}
                        </Box>
                      )
                    )}
                    {notesDetailsData?.ref_data && notesDetailsData?.ref_data?.length > 3 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <Button
                          size='small'
                          onClick={() => setShowAllEntities(!showAllEntities)}
                          startIcon={<Icon icon={showAllEntities ? 'mdi:chevron-up' : 'mdi:chevron-down'} />}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            color: theme.palette.primary.main,
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.08)
                            }
                          }}
                        >
                          {showAllEntities
                            ? 'View Less'
                            : `View More (${(notesDetailsData?.ref_data?.length || 0) - 3})`}
                        </Button>
                      </Box>
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
                          {showFullNote ? 'Show Less' : 'Show More'}
                        </Typography>
                      )}
                    </Typography>
                  </Tooltip>
                </Box>
              )}

              {/* attachments */}
              {notesDetailsData?.attachments && notesDetailsData?.attachments?.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton size='small' sx={{ p: 0 }}>
                      <Icon icon='ic:baseline-attach-file' width='20' height='20' />
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
                  onClick={() => {
                    setShowCommentInput(true)
                  }}
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

              {/* comments listing */}
              <Box>
                {commentsList?.length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {commentsList?.map((item: NoteDetails, index: number) => {
                      const attachments = item?.notes_attachment || []

                      const visibleAttachments = showAllMedia ? attachments : attachments.slice(0, 4)

                      return (
                        <Box key={item?.id || index}>
                          <Box
                            sx={{
                              p: 3,
                              borderRadius: attachments?.length > 0 ? 0 : 1,
                              backgroundColor:
                                attachments?.length > 0 ? 'transparent' : theme.palette.customColors.antzNotes,
                              borderBottom:
                                attachments?.length > 0
                                  ? `1px solid ${theme.palette.action.disabledBackground}`
                                  : 'none'
                            }}
                          >
                            <Typography sx={{ fontSize: '14px' }}>
                              {item?.observation && item?.observation?.length > 120 && !showFullComment
                                ? `${item?.observation.substring(0, 115)}...`
                                : item?.observation}
                              {item?.observation && item?.observation?.length > 120 && (
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

                            {attachments?.length > 0 && (
                              <>
                                <Grid container spacing={3} sx={{ mt: 2 }}>
                                  {visibleAttachments?.map((attachment: any, i: number) => (
                                    <Grid key={attachment?.id || i} size={{ xs: 12, sm: 6 }}>
                                      <FilePreviewCard
                                        fileUrl={attachment?.file}
                                        fileName={attachment?.file_orginal_name}
                                        showTitle={true}
                                      />
                                    </Grid>
                                  ))}
                                </Grid>

                                {attachments?.length > 4 && (
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
        <IconButton
          onClick={() => setAddAttachmentsDrawerOpen(true)}
          sx={{ p: 0, color: theme.palette.customColors.OnPrimaryContainer }}
        >
          <Icon icon='ic:baseline-attach-file' width='24' height='24' />
        </IconButton>
      </Box>

      <TaggedMembersDrawer
        open={taggedMembersDrawerOpen}
        onClose={() => setTaggedMembersDrawerOpen(false)}
        setNotifyMembersDrawerOpen={setNotifyMembersDrawerOpen}
        taggedMembers={taggedMembers}
        updateMembersLoading={updateMembersLoading}
        isCreator={isCreator}
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

      <ConfirmationDialog
        dialogBoxStatus={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title={'Delete Note?'}
        cancelText={'CANCEL'}
        confirmBtnStyle={{ background: theme.palette.customColors.Error, py: 2 }}
        image={'/images/warning-icon.svg'}
        imgStyle={{ background: theme.palette.customColors.TertiaryLight, p: 4 }}
        confirmAction={handleDelete}
        loading={deleteLoading}
        ConfirmationText={'DELETE'}
        description={'Are you sure you want to permanently delete this note?'}
      />

      {/* Edit Note Drawer */}
      {editDrawerOpen && (
        <AddNoteDrawer
          open={editDrawerOpen}
          onClose={() => setEditDrawerOpen(false)}
          editData={notesDetailsData}
          refetchNotesList={() => {
            fetchObservationDetails()
            if (onUpdate) onUpdate()
          }}
        />
      )}

      <NotifyMembersDrawer
        open={notifyMembersDrawerOpen}
        onClose={() => setNotifyMembersDrawerOpen(false)}
        selectedMembers={notifyMembers}
        onMembersChange={handleNotifyMembersChange}
        noteTypeId={Number(notesDetailsData?.observation_type_id)}
      />
    </Drawer>
  )
}

export default NotesDetailsDrawer
