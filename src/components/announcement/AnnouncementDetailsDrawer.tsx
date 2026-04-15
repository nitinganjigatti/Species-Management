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
import Icon from 'src/@core/components/icon'
import MenuWithDots from 'src/components/MenuWithDots'
import { ImageCarousel, CarouselImage } from 'src/components/common'
import FileDialog from 'src/components/utility/FileDialog'
import FilePreviewCard from 'src/views/utility/NewMediaCard'
import DeleteConfirmationDialog from 'src/views/utility/DeleteConfirmationDialog'
import { CommentItem, CommentInput } from './comments'
import AnnouncementSentToCard from './AnnouncementSentToCard'
import AnnouncementSentToDrawer from './AnnouncementSentToDrawer'
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
import type { AnnouncementAttachment, AnnouncementDetailsDrawerProps } from 'src/types/announcement'
import { useTranslation } from 'react-i18next'

const AnnouncementDetailsDrawer = ({
  open,
  onClose,
  announcementId,
  onAnnouncementUpdated,
  onEdit
}: AnnouncementDetailsDrawerProps) => {
  const { t } = useTranslation()

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

  const [sentToDrawerOpen, setSentToDrawerOpen] = useState(false)

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
      setImagePreview({ open: false, url: '', title: '' })
      setSentToDrawerOpen(false)
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

  // Get relative time using Utility functions
  const getRelativeTime = (dateString: string) => {
    if (!dateString) return ''
    const localDateTime = Utility.convertUTCToLocal(dateString)

    return Utility.AgeConverter(localDateTime) || Utility.convertUTCToLocalDateTime(dateString)
  }

  // Event handlers
  const handleLike = () => {
    if (!announcement) return
    toggleReaction.mutate({
      announcementId: announcement.announcement_id,
      isLiked
    })
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
      deleteComment.mutate(
        {
          commentId: confirmDialog.id,
          announcementId: announcement.announcement_id
        },
        {
          onSuccess: () => {
            onAnnouncementUpdated?.()
          }
        }
      )
    }

    handleConfirmDialogClose()
  }

  // Build menu options based on mobile conditions
  const getMenuOptions = () => {
    if (!isOwner || isDeleted) return []

    if (isCancelled) {
      // Only delete option for cancelled announcements
      return [
        {
          label: t('delete'),
          icon: <Icon icon='mdi:delete-outline' fontSize={18} color={errorColor} />,
          action: handleDelete
        }
      ]
    }

    // Full menu for active announcements (Edit, Cancel, Delete - matching mobile)
    return [
      {
        label: t('edit'),
        icon: <Icon icon='mdi:pencil-outline' fontSize={18} />,
        action: handleEdit
      },
      {
        label: t('cancel'),
        icon: <Icon icon='mdi:cancel' fontSize={18} />,
        action: handleCancel
      },
      {
        label: t('delete'),
        icon: <Icon icon='mdi:delete-outline' fontSize={18} color={errorColor} />,
        action: handleDelete
      }
    ]
  }

  const menuOptions = getMenuOptions()
  const userName = announcement ? `${announcement.created_by?.first_name} ${announcement.created_by?.last_name}` : ''

  const displayDescription = announcement?.description

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
            maxWidth: '100%',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }
        }}
      >
        {/* Header - sticky top */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 3,
            borderBottom: `1px solid ${borderColor}`,
            flexShrink: 0
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={onClose} size='small'>
              <Icon icon='mdi:close' fontSize={24} />
            </IconButton>
            <Typography variant='h6' sx={{ fontWeight: 600, color: textPrimary }}>
              {isImportant ? t('announcement_module.important_announcement') : t('announcement_module.announcement')}
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
                {t('announcement_module.this_announcement_was_deleted')}
              </Typography>
              {announcement?.modified_at && (
                <Typography sx={{ color: textSecondary, fontSize: '0.875rem' }}>
                  {t('deleted_on')} {Utility.convertUTCToLocalDateTime(announcement.modified_at)}
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
                </Box>
              )}

              {/* Announcement Sent To */}
              {((announcement.target_groups?.length ?? 0) > 0 || (announcement.user_target_groups?.length ?? 0) > 0) && (
                <Box sx={{ py: 1 }}>
                  <AnnouncementSentToCard
                    targetGroups={announcement.target_groups}
                    userTargetGroups={announcement.user_target_groups}
                    onClick={() => setSentToDrawerOpen(true)}
                  />
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
                    sx={{
                      fontSize: '0.9375rem',
                      fontWeight: 500,
                      color: textPrimary
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
                        {t('attachments')}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {documents.map((doc: AnnouncementAttachment) => (
                        <FilePreviewCard
                          key={doc.id}
                          fileUrl={doc.file}
                          fileName={doc.file_orginal_name || 'Document'}
                          width='240px'
                          showTitle
                          // ondownloadaction
                        />
                      ))}
                    </Box>
                  </Box>
                </>
              )}

              {/* Comments Section */}
              {announcement.comments && announcement.comments.length > 0 && (
                <>
                  <Divider sx={{ mx: 3 }} />
                  <Box sx={{ px: 3, py: 2 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: textPrimary, mb: 1.5 }}>
                      {t('comments')} ({announcement.comments.length})
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

            </>
          )}
        </Box>

        {/* Comment Input - sticky bottom */}
        {!isLoading && !isDeleted && announcement && Number(announcement.allow_comments) === 1 && (
          <Box
            sx={{
              flexShrink: 0,
              borderTop: `1px solid ${borderColor}`,
              backgroundColor: theme.palette.background.paper
            }}
          >
            <CommentInput onSubmit={handleAddComment} isLoading={addComment.isPending} placeholder={t('add_a_comment') as string} />
          </Box>
        )}
      </Drawer>

      {/* Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={confirmDialog.open}
        handleClose={handleConfirmDialogClose}
        message={
          confirmDialog.type === 'delete'
            ? t('announcement_module.are_you_sure_you_want_to_delete_this_announcement') as string
            : confirmDialog.type === 'cancel'
            ? t('announcement_module.are_you_sure_you_want_to_cancel_this_announcement') as string
            : t('announcement_module.are_you_sure_you_want_to_delete_this_comment') as string
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

      {/* Announcement Sent To Drawer */}
      {announcement && (
        <AnnouncementSentToDrawer
          open={sentToDrawerOpen}
          onClose={() => setSentToDrawerOpen(false)}
          targetGroups={announcement.target_groups || []}
          userTargetGroups={announcement.user_target_groups || []}
        />
      )}
    </>
  )
}

export default AnnouncementDetailsDrawer
