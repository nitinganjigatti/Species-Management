'use client'

import { useState } from 'react'
import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import MenuWithDots from 'src/components/MenuWithDots'
import Link from '@mui/material/Link'
import Icon from 'src/@core/components/icon'
import AnnouncementMedia from './AnnouncementMedia'
import ReactionUserListDialog from './ReactionUserListDialog'
import { useToggleReaction } from 'src/hooks/announcement/useAnnouncements'
import { useAuth } from 'src/hooks/useAuth'
import Utility from 'src/utility'
import type { AnnouncementCardProps } from 'src/types/announcement'

// Constants
const DESCRIPTION_MAX_LENGTH = 150

const AnnouncementCard = ({ announcement, onEdit, onDelete, onCancel, onClick }: AnnouncementCardProps) => {
  const [showLikesDialog, setShowLikesDialog] = useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

  const theme = useTheme()
  const auth = useAuth()
  const toggleReaction = useToggleReaction()

  // Theme colors from customColors
  const primaryColor = theme.palette.primary.main // #37BD69
  const errorColor = theme.palette.customColors.Tertiary // #FA6140
  const errorLightBg = theme.palette.customColors.ErrorContainer // #FFD3D3
  const greyColor = theme.palette.customColors.neutralSecondary // #7A8684
  const textPrimary = theme.palette.customColors.OnSurfaceVariant // #44544A
  const textSecondary = theme.palette.customColors.neutralSecondary // #7A8684
  const borderColor = theme.palette.customColors.OutlineVariant // #C3CEC7
  const whiteColor = theme.palette.customColors.OnPrimary // #FFFFFF
  const infoBg = theme.palette.customColors.SecondaryContainer // #AFEFEB
  const infoColor = theme.palette.secondary.dark // #1F415B

  const currentUserId = (auth?.userData as any)?.user?.user_id
  const isOwner = currentUserId && currentUserId === announcement.created_user_id
  const isLiked = announcement.user_reaction === 'like'
  const likeCount = announcement.reactions_summary.like
  const isImportant = announcement.type === 'important'
  const isCancelled = announcement.status === 'cancelled'

  const isDeleted =
    announcement.is_deleted == 1 || announcement.is_deleted === '1' || String(announcement.is_deleted) === '1'

  const accentColor = isImportant ? errorColor : primaryColor

  const getRelativeTime = (dateString: string) => {
    if (!dateString) return ''
    const localDateTime = Utility.convertUTCToLocal(dateString)

    return Utility.AgeConverter(localDateTime) || Utility.convertUtcToLocalReadableDate(dateString)
  }

  if (isDeleted) {
    return (
      <Card
        sx={{
          mb: 3,
          borderRadius: '8px',
          backgroundColor: theme.palette.customColors.BgTeritary,
          border: `1px solid ${errorLightBg}`,
          overflow: 'hidden',
          boxShadow: 'none'
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: errorLightBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Icon icon='mdi:cancel' fontSize={24} color={errorColor} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 500, color: textPrimary, fontSize: '0.9375rem' }}>
              This announcement was deleted.
            </Typography>
            <Typography sx={{ color: textSecondary, fontSize: '0.8125rem' }}>
              {Utility.convertUTCToLocalDateTime(announcement.created_at)}
            </Typography>
          </Box>
        </Box>
      </Card>
    )
  }

  const handleLike = () => {
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

  const userName = `${announcement.created_by.first_name} ${announcement.created_by.last_name}`
  const relativeTime = getRelativeTime(announcement.created_at)

  const videoCount = announcement.attachment_count.video
  const documentCount = announcement.attachment_count.document + announcement.attachment_count.audio
  const imageCount = announcement.attachment_count.image

  const getAttachmentString = () => {
    const parts: string[] = []
    if (imageCount > 0) {
      parts.push(`${imageCount} Image${imageCount > 1 ? 's' : ''}`)
    }
    if (videoCount > 0) {
      parts.push(`${videoCount} Video${videoCount > 1 ? 's' : ''}`)
    }
    if (documentCount > 0) {
      parts.push(`${documentCount} Doc${documentCount > 1 ? 's' : ''}`)
    }

    return parts.join(', ')
  }

  // Check if description needs truncation
  const needsTruncation = announcement.description && announcement.description.length > DESCRIPTION_MAX_LENGTH

  const displayDescription =
    needsTruncation && !isDescriptionExpanded
      ? `${announcement.description.substring(0, DESCRIPTION_MAX_LENGTH)}...`
      : announcement.description

  const getTitleColor = () => {
    if (isCancelled) return greyColor
    if (isImportant) return errorColor

    return primaryColor
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if (!onClick) return

    const target = e.target as HTMLElement

    const isInteractive = target.closest(
      'button, a, [role="button"], [role="menuitem"], .MuiIconButton-root, .MuiMenu-root, .MuiMenuItem-root'
    )

    if (!isInteractive) {
      onClick()
    }
  }

  return (
    <>
      <Card
        onClick={handleCardClick}
        sx={{
          mb: 3,
          borderRadius: '8px',
          overflow: 'hidden',
          transition: 'box-shadow 0.2s ease',
          cursor: isDeleted ? 'default' : 'pointer',
          '&:hover': {
            boxShadow: isDeleted ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.08)'
          },
          ...(isDeleted ? { backgroundColor: 'rgba(255, 255, 255, 0.75)' } : {})
        }}
      >
        {isDeleted ? (
          <Box
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                backgroundColor: errorLightBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Icon icon='mdi:cancel' fontSize={24} color={errorColor} />
            </Box>
            <Box>
              <Typography sx={{ color: textPrimary, fontSize: '0.9375rem' }}>This announcement was deleted.</Typography>
              <Typography sx={{ color: greyColor, fontSize: '0.8125rem' }}>
                {Utility.convertUTCToLocalDateTime(announcement.modified_at)}
              </Typography>
            </Box>
          </Box>
        ) : (
          <>
            <Box sx={{ px: 4, pt: 4, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {isImportant ? (
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        backgroundColor: errorColor,
                        transform: 'rotate(45deg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px'
                      }}
                    >
                      <Icon
                        icon='mdi:alert-circle-outline'
                        fontSize={18}
                        color={whiteColor}
                        style={{ transform: 'rotate(-45deg)' }}
                      />
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: isCancelled ? greyColor : primaryColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Icon icon='mdi:bullhorn' fontSize={20} color={whiteColor} />
                  </Box>
                )}

                <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', color: textPrimary, letterSpacing: '0.5px' }}>
                  {isImportant ? 'IMPORTANT' : 'ANNOUNCEMENT'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isCancelled && (
                  <Chip
                    label='CANCELED'
                    size='small'
                    sx={{
                      backgroundColor: errorColor,
                      color: whiteColor,
                      fontWeight: 600,
                      fontSize: '0.6875rem',
                      height: 24,
                      borderRadius: '4px',
                      '& .MuiChip-label': { px: 1.5 }
                    }}
                  />
                )}

                {isOwner && !isCancelled && !isDeleted && (
                  <MenuWithDots
                    options={[
                      {
                        label: 'Cancel',
                        icon: <Icon icon='mdi:cancel' fontSize={18} />,
                        action: () => onCancel?.(announcement.announcement_id)
                      },
                      // Delete option
                      {
                        label: 'Delete',
                        icon: <Icon icon='mdi:delete-outline' fontSize={18} color={errorColor} />,
                        action: () => onDelete?.(announcement.announcement_id)
                      }
                    ]}
                    iconSx={{ color: textSecondary }}
                    borderColor={undefined}
                    menuSx={{}}
                    menuItemSx={{}}
                  />
                )}
              </Box>
            </Box>

            <Divider sx={{ mx: 4, mb: 1 }} />

            <Box sx={{ px: 4, pt: 2, pb: 1 }}>
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: '1.25rem',
                  color: getTitleColor(),
                  lineHeight: 1.3,
                  textDecoration: isCancelled ? 'line-through' : 'none'
                }}
              >
                {announcement.title}
              </Typography>
            </Box>

            <Box sx={{ px: 4, pt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ color: textSecondary, fontSize: '0.875rem' }}>
                {userName} • {relativeTime}
              </Typography>
              {announcement.is_edited && (
                <Chip
                  label='Edited'
                  size='small'
                  sx={{
                    backgroundColor: theme.palette.customColors.SurfaceVariant,
                    color: textSecondary,
                    fontWeight: 500,
                    fontSize: '0.6875rem',
                    height: 20,
                    borderRadius: '4px',
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
              )}
            </Box>

            {announcement.description && (
              <Box sx={{ px: 4, pt: 1, pb: 2 }}>
                <Typography component='span' sx={{ color: textPrimary, fontSize: '0.875rem', lineHeight: 1.5 }}>
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

            {(videoCount > 0 || documentCount > 0 || imageCount > 0) && (
              <Box sx={{ px: 4, pt: 1, pb: 2, display: 'flex', alignItems: 'center', gap: 0.75, color: textSecondary }}>
                <Icon icon='mdi:paperclip' fontSize={18} />
                <Typography sx={{ fontSize: '0.8125rem' }}>{getAttachmentString()}</Typography>
              </Box>
            )}

            {announcement.attachments && announcement.attachments.length > 0 && (
              <AnnouncementMedia attachments={announcement.attachments} />
            )}
            {!isCancelled && (
              <>
                <Divider sx={{ mx: 4, mt: 4 }} />

                <Box sx={{ px: 4, py: 1.5, display: 'flex', alignItems: 'center', gap: 3 }}>
                  {/* Like button */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton
                      size='small'
                      onClick={handleLike}
                      sx={{ p: 0.5, color: isLiked ? primaryColor : textSecondary }}
                    >
                      <Icon icon={isLiked ? 'mdi:thumb-up' : 'mdi:thumb-up-outline'} fontSize={22} />
                    </IconButton>
                    {likeCount > 0 && (
                      <Typography
                        onClick={handleViewLikes}
                        sx={{
                          fontSize: '0.9375rem',
                          fontWeight: 500,
                          color: textPrimary,
                          cursor: 'pointer'
                        }}
                      >
                        {likeCount}
                      </Typography>
                    )}
                  </Box>

                  {Number(announcement.allow_comments) === 1 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconButton size='small' sx={{ p: 0.5, color: textSecondary }}>
                        <Icon icon='mdi:comment-outline' fontSize={22} />
                      </IconButton>
                      <Typography
                        sx={{
                          fontSize: '0.9375rem',
                          fontWeight: 500,
                          color: textPrimary
                        }}
                      >
                        {announcement.comment_count ?? 0}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </>
            )}
          </>
        )}
      </Card>

      {/* Likes Dialog */}
      <ReactionUserListDialog
        open={showLikesDialog}
        onClose={() => setShowLikesDialog(false)}
        announcementId={announcement.announcement_id}
      />
    </>
  )
}

export default AnnouncementCard
