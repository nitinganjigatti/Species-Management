'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import Avatar from '@mui/material/Avatar'
import CircularProgress from '@mui/material/CircularProgress'
import Link from '@mui/material/Link'
import Icon from 'src/@core/components/icon'
import MenuWithDots from 'src/components/MenuWithDots'
import { ImageCarousel, CarouselImage } from 'src/components/common'
import FileDialog from 'src/components/utility/FileDialog'
import ReactionUserListDialog from './ReactionUserListDialog'
import DeleteConfirmationDialog from 'src/views/utility/DeleteConfirmationDialog'
import { CommentItem, CommentInput } from './comments'
import {
  useAnnouncementDetails,
  useToggleReaction,
  useAddComment,
  useDeleteComment,
  useDeleteAnnouncement,
  useCancelAnnouncement
} from 'src/hooks/announcement/useAnnouncements'
import { useAuth } from 'src/hooks/useAuth'
import Utility from 'src/utility'
import type { Announcement, AnnouncementAttachment } from 'src/types/announcement'

interface AnnouncementDetailsDrawerProps {
  open: boolean
  onClose: () => void
  announcementId: number | null
  onAnnouncementUpdated?: () => void
  onEdit?: (announcement: Announcement) => void
}

// Constants
const DESCRIPTION_MAX_LENGTH = 300

const AnnouncementDetailsDrawer = ({
  open,
  onClose,
  announcementId,
  onAnnouncementUpdated,
  onEdit
}: AnnouncementDetailsDrawerProps) => {
  const [showLikesDialog, setShowLikesDialog] = useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    type: 'delete' | 'cancel' | 'deleteComment' | null
    id: number | null
  }>({ open: false, type: null, id: null })

  const [imagePreview, setImagePreview] = useState<{
    open: boolean
    url: string
    title: string
  }>({ open: false, url: '', title: '' })

  const commentsEndRef = useRef<HTMLDivElement>(null)
  const theme = useTheme()
  const auth = useAuth()

  // API hooks
  const {
    data: detailsData,
    isLoading,
    refetch
  } = useAnnouncementDetails(announcementId || 0, open && !!announcementId)
  const toggleReaction = useToggleReaction()
  const addComment = useAddComment()
  const deleteComment = useDeleteComment()
  const deleteAnnouncement = useDeleteAnnouncement()
  const cancelAnnouncement = useCancelAnnouncement()

  const announcement = detailsData?.data

  // Theme colors
  const primaryColor = theme.palette.primary.main
  const errorColor = theme.palette.customColors.Tertiary
  const errorLightBg = theme.palette.customColors.ErrorContainer
  const greyColor = theme.palette.customColors.neutralSecondary
  const textPrimary = theme.palette.customColors.OnSurfaceVariant
  const textSecondary = theme.palette.customColors.neutralSecondary
  const borderColor = theme.palette.customColors.OutlineVariant
  const whiteColor = theme.palette.customColors.OnPrimary
  const surfaceVariant = theme.palette.customColors.SurfaceVariant

  // User info
  const currentUserId = (auth?.userData as any)?.user?.user_id

  // Computed values based on announcement
  const isOwner = currentUserId && announcement?.created_user_id === currentUserId
  const isLiked = announcement?.user_reaction === 'like'
  const likeCount = announcement?.reactions_summary?.like || 0
  const isImportant = announcement?.type === 'important'
  const isCancelled = announcement?.status === 'cancelled'
  // Loose comparison for is_deleted (API may return string or number)

  const isDeleted =
    announcement?.is_deleted == 1 || announcement?.is_deleted === '1' || String(announcement?.is_deleted) === '1'

  const accentColor = isImportant ? errorColor : primaryColor

  // Filtered attachments - convert to CarouselImage format
  const carouselImages: CarouselImage[] = useMemo(() => {
    const imageAttachments =
      announcement?.attachments?.filter(
        (att: AnnouncementAttachment) =>
          att?.file_type?.toLowerCase()?.startsWith('image') || att?.file_type?.toLowerCase() === 'image'
      ) ?? []

    return imageAttachments.map((att: AnnouncementAttachment) => ({
      id: att.id,
      url: att.file,
      alt: att.file_orginal_name || 'Image'
    }))
  }, [announcement?.attachments])

  const documents = useMemo(() => {
    return (
      announcement?.attachments?.filter(
        (att: AnnouncementAttachment) =>
          !att?.file_type?.toLowerCase()?.startsWith('image') && att?.file_type?.toLowerCase() !== 'image'
      ) ?? []
    )
  }, [announcement?.attachments])

  // Scroll to bottom when new comment is added
  useEffect(() => {
    if (addComment.isSuccess) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [addComment.isSuccess])

  // Reset state when drawer closes
  useEffect(() => {
    if (!open) {
      setIsDescriptionExpanded(false)
      setShowLikesDialog(false)
      setImagePreview({ open: false, url: '', title: '' })
    }
  }, [open])

  // Handle image click to open preview
  const handleImageClick = (image: CarouselImage) => {
    setImagePreview({
      open: true,
      url: image.url,
      title: image.alt || 'Image Preview'
    })
  }

  const handleImagePreviewClose = () => {
    setImagePreview({ open: false, url: '', title: '' })
  }

  // Format date/time functions
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate()
    const month = date.toLocaleString('en-US', { month: 'short' })
    const year = date.getFullYear()

    const time = date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })

    return `${day} ${month} ${year} • ${time}`
  }

  const getRelativeTime = (dateString: string) => {
    if (!dateString) return ''
    const localDateTime = Utility.convertUTCToLocal(dateString)

    return Utility.AgeConverter(localDateTime) || formatDateTime(dateString)
  }

  // Event handlers
  const handleLike = () => {
    if (!announcement) return
    toggleReaction.mutate({
      announcementId: announcement.announcement_id,
      isLiked
    })
  }

  const handleViewLikes = () => {
    if (likeCount > 0) {
      setShowLikesDialog(true)
    }
  }

  const handleAddComment = (text: string) => {
    if (!announcement) return
    addComment.mutate({
      announcementId: announcement.announcement_id,
      text
    })
  }

  const handleDeleteComment = (commentId: number) => {
    setConfirmDialog({ open: true, type: 'deleteComment', id: commentId })
  }

  const handleDelete = () => {
    if (!announcement) return
    setConfirmDialog({ open: true, type: 'delete', id: announcement.announcement_id })
  }

  const handleCancel = () => {
    if (!announcement) return
    setConfirmDialog({ open: true, type: 'cancel', id: announcement.announcement_id })
  }

  const handleEdit = () => {
    if (!announcement) return
    if (onEdit) {
      onEdit(announcement)
      onClose()
    } else {
      // TODO: Wire up edit functionality
      console.log('Edit announcement:', announcement.announcement_id)
    }
  }

  const handleConfirmDialogClose = () => {
    setConfirmDialog({ open: false, type: null, id: null })
  }

  const handleConfirmAction = () => {
    if (!confirmDialog.id) return

    if (confirmDialog.type === 'delete') {
      deleteAnnouncement.mutate(confirmDialog.id, {
        onSuccess: () => {
          onAnnouncementUpdated?.()
          onClose()
        }
      })
    } else if (confirmDialog.type === 'cancel') {
      cancelAnnouncement.mutate(confirmDialog.id, {
        onSuccess: () => {
          onAnnouncementUpdated?.()
          refetch()
        }
      })
    } else if (confirmDialog.type === 'deleteComment' && announcement) {
      deleteComment.mutate({
        commentId: confirmDialog.id,
        announcementId: announcement.announcement_id
      })
    }

    handleConfirmDialogClose()
  }

  const handleDocumentClick = (doc: AnnouncementAttachment) => {
    window.open(doc.file, '_blank')
  }

  // Build menu options based on mobile conditions
  const getMenuOptions = () => {
    if (!isOwner || isDeleted) return []

    if (isCancelled) {
      // Only delete option for cancelled announcements
      return [
        {
          label: 'Delete',
          icon: <Icon icon='mdi:delete-outline' fontSize={18} color={errorColor} />,
          action: handleDelete
        }
      ]
    }

    // Full menu for active announcements (Edit, Cancel, Delete - matching mobile)
    return [
      {
        label: 'Edit',
        icon: <Icon icon='mdi:pencil-outline' fontSize={18} />,
        action: handleEdit
      },
      {
        label: 'Cancel',
        icon: <Icon icon='mdi:cancel' fontSize={18} />,
        action: handleCancel
      },
      {
        label: 'Delete',
        icon: <Icon icon='mdi:delete-outline' fontSize={18} color={errorColor} />,
        action: handleDelete
      }
    ]
  }

  const menuOptions = getMenuOptions()
  const userName = announcement ? `${announcement.created_by?.first_name} ${announcement.created_by?.last_name}` : ''

  // Check if description needs truncation
  const needsTruncation = announcement?.description && announcement.description.length > DESCRIPTION_MAX_LENGTH

  const displayDescription =
    needsTruncation && !isDescriptionExpanded
      ? `${announcement?.description?.substring(0, DESCRIPTION_MAX_LENGTH)}...`
      : announcement?.description

  // Get title color based on status and type
  const getTitleColor = () => {
    if (isCancelled) return greyColor
    if (isImportant) return errorColor

    return primaryColor
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 580 },
            maxWidth: '100%'
          }
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 3,
            borderBottom: `1px solid ${borderColor}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={onClose} size='small'>
              <Icon icon='mdi:close' fontSize={24} />
            </IconButton>
            <Typography variant='h6' sx={{ fontWeight: 600, color: textPrimary }}>
              {isImportant ? 'Important Announcement' : 'Announcement'}
            </Typography>
          </Box>

          {/* Action menu - show for owner, not deleted */}
          {menuOptions.length > 0 && (
            <MenuWithDots
              options={menuOptions}
              iconSx={{ color: textSecondary }}
              borderColor={undefined}
              menuSx={{}}
              menuItemSx={{}}
            />
          )}
        </Box>

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Loading State */}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, py: 8 }}>
              <CircularProgress sx={{ color: primaryColor }} />
            </Box>
          )}

          {/* Deleted State */}
          {!isLoading && isDeleted && (
            <Box
              sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                textAlign: 'center'
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  backgroundColor: errorLightBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2
                }}
              >
                <Icon icon='mdi:cancel' fontSize={32} color={errorColor} />
              </Box>
              <Typography sx={{ fontWeight: 600, color: textPrimary, fontSize: '1rem', mb: 1 }}>
                This announcement was deleted.
              </Typography>
              {announcement?.modified_at && (
                <Typography sx={{ color: textSecondary, fontSize: '0.875rem' }}>
                  Deleted on {formatDateTime(announcement.modified_at)}
                </Typography>
              )}
            </Box>
          )}

          {/* Main Content - show if not loading and not deleted */}
          {!isLoading && !isDeleted && announcement && (
            <>
              {/* User Info Section */}
              <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar src={announcement.created_by?.profile_pic || undefined} sx={{ width: 40, height: 40 }}>
                  {!announcement.created_by?.profile_pic && (announcement.created_by?.first_name?.charAt(0) || '')}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', color: textPrimary }}>
                    {userName}
                  </Typography>
                  <Typography sx={{ color: textSecondary, fontSize: '0.8125rem' }}>
                    {getRelativeTime(announcement.created_at)}
                  </Typography>
                </Box>
              </Box>

              {/* Images Carousel - at top like mobile */}
              {carouselImages.length > 0 && (
                <Box sx={{ mb: 1 }}>
                  <ImageCarousel
                    images={carouselImages}
                    height={280}
                    borderRadius={0}
                    showArrows={carouselImages.length > 1}
                    showDots={false}
                    showCounter={carouselImages.length > 1}
                    onImageClick={handleImageClick}
                  />
                </Box>
              )}

              {/* Title */}
              <Box sx={{ px: 3 }}>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: '1.125rem',
                    color: getTitleColor(),
                    lineHeight: 1.4,
                    textDecoration: isCancelled ? 'line-through' : 'none'
                  }}
                >
                  {announcement.title}
                </Typography>
              </Box>

              {/* Description */}
              {announcement.description && (
                <Box sx={{ px: 3, pt: 1 }}>
                  <Typography component='span' sx={{ color: textPrimary, fontSize: '0.875rem', lineHeight: 1.6 }}>
                    {displayDescription}
                  </Typography>
                  {needsTruncation && (
                    <Link
                      component='button'
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      sx={{
                        color: accentColor,
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        ml: 0.5,
                        textDecoration: 'none',
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      {isDescriptionExpanded ? 'Show Less' : 'Read More'}
                    </Link>
                  )}
                </Box>
              )}

              {/* Like and Comment Row */}
              <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <IconButton
                    size='small'
                    onClick={handleLike}
                    disabled={toggleReaction.isPending || isCancelled}
                    sx={{ p: 0.5, color: isLiked ? primaryColor : textSecondary }}
                  >
                    <Icon icon={isLiked ? 'mdi:thumb-up' : 'mdi:thumb-up-outline'} fontSize={22} />
                  </IconButton>
                  <Typography
                    onClick={likeCount > 0 ? handleViewLikes : undefined}
                    sx={{
                      fontSize: '0.9375rem',
                      fontWeight: 500,
                      color: textPrimary,
                      cursor: likeCount > 0 ? 'pointer' : 'default'
                    }}
                  >
                    {likeCount}
                  </Typography>
                </Box>

                {Number(announcement.allow_comments) === 1 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Icon icon='mdi:comment-outline' fontSize={22} color={textSecondary} />
                    <Typography sx={{ fontSize: '0.9375rem', fontWeight: 500, color: textPrimary }}>
                      {announcement.comment_count ?? 0}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Documents Section */}
              {documents.length > 0 && (
                <>
                  <Divider sx={{ mx: 3 }} />
                  <Box sx={{ px: 3, py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Icon icon='mdi:paperclip' fontSize={18} color={textSecondary} />
                      <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: textPrimary }}>
                        Attachments
                      </Typography>
                    </Box>

                    {/* Documents */}
                    {documents.map((doc: AnnouncementAttachment, index: number) => (
                      <Box
                        key={doc.id}
                        onClick={() => handleDocumentClick(doc)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: 1.5,
                          mb: index < documents.length - 1 ? 1 : 0,
                          borderRadius: '8px',
                          backgroundColor: surfaceVariant,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: borderColor }
                        }}
                      >
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '8px',
                            backgroundColor: primaryColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Icon
                            icon={
                              doc.file_type?.includes('video')
                                ? 'mdi:video-outline'
                                : doc.file_type?.includes('audio')
                                ? 'mdi:music-note'
                                : 'mdi:file-document-outline'
                            }
                            fontSize={20}
                            color={whiteColor}
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              color: textPrimary,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {doc.file_orginal_name || 'Document'}
                          </Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: textSecondary, textTransform: 'uppercase' }}>
                            {doc.file_type}
                          </Typography>
                        </Box>
                        <Icon icon='mdi:download' fontSize={20} color={textSecondary} />
                      </Box>
                    ))}
                  </Box>
                </>
              )}

              {/* Comments Section */}
              {announcement.comments && announcement.comments.length > 0 && (
                <>
                  <Divider sx={{ mx: 3 }} />
                  <Box sx={{ px: 3, py: 2 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: textPrimary, mb: 1.5 }}>
                      Comments ({announcement.comments.length})
                    </Typography>
                    {announcement.comments.map((comment, index) => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        isOwner={currentUserId === comment.user_id}
                        onDelete={() => handleDeleteComment(comment.id)}
                        isLast={index === announcement.comments.length - 1}
                      />
                    ))}
                    <div ref={commentsEndRef} />
                  </Box>
                </>
              )}

              {/* Spacer for comment input */}
              {Number(announcement.allow_comments) === 1 && <Box sx={{ height: 80 }} />}
            </>
          )}
        </Box>

        {/* Comment Input - sticky at bottom, only if comments allowed and not deleted */}
        {!isLoading && !isDeleted && announcement && Number(announcement.allow_comments) === 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: theme.palette.background.paper
            }}
          >
            <CommentInput onSubmit={handleAddComment} isLoading={addComment.isPending} placeholder='Add a comment...' />
          </Box>
        )}
      </Drawer>

      {/* Likes Dialog */}
      {announcement && (
        <ReactionUserListDialog
          open={showLikesDialog}
          onClose={() => setShowLikesDialog(false)}
          announcementId={announcement.announcement_id}
        />
      )}

      {/* Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={confirmDialog.open}
        handleClose={handleConfirmDialogClose}
        message={
          confirmDialog.type === 'delete'
            ? 'Are you sure you want to delete this announcement?'
            : confirmDialog.type === 'cancel'
            ? 'Are you sure you want to cancel this announcement?'
            : 'Are you sure you want to delete this comment?'
        }
        action={handleConfirmAction}
        loading={deleteAnnouncement.isPending || cancelAnnouncement.isPending || deleteComment.isPending}
      />

      {/* Image Preview Dialog */}
      <FileDialog
        open={imagePreview.open}
        onClose={handleImagePreviewClose}
        src={imagePreview.url}
        title={imagePreview.title}
        type='image'
        fileIcon={null}
      />
    </>
  )
}

export default AnnouncementDetailsDrawer
