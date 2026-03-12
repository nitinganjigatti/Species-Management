import React from 'react'
import { Box, Card, Typography, Chip, Divider, IconButton, Tooltip } from '@mui/material'
import { useTheme, alpha } from '@mui/material/styles'
import {
  Description as NoteIcon,
  ThumbUp as LikeIcon,
  ThumbUpOutlined as LikeOutlinedIcon,
  ChatBubbleOutline as CommentIcon,
  AttachFile as AttachmentIcon
} from '@mui/icons-material'
import Utility from 'src/utility'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'

const priorityIcons = {
  Low: '/images/priority/flag_priority_low.svg',
  Moderate: '/images/priority/flag_priority_medium.svg',
  High: '/images/priority/flag_priority_high.svg',
  Critical: '/images/priority/flag_priority_critical.svg'
}

// Get background color based on priority
const getPriorityBgColor = (priority, theme) => {
  switch (priority) {
    case 'Low':
      return theme.palette.customColors?.displaybgPrimary
    case 'Moderate':
      return alpha(theme.palette.customColors?.moderateSecondary, 0.2)
    case 'High':
      return alpha(theme.palette.customColors?.TertiaryContainer, 0.16)
    case 'Critical':
      return alpha(theme.palette.customColors?.ErrorContainer, 0.4)
    default:
      return theme.palette.background.paper
  }
}

const NoteCard = ({ note, onClick, onLikeClick, onCommentClick, sx = {} }) => {
  const theme = useTheme()

  const {
    observation_id,
    observation_name,
    priority,
    created_by,
    created_by_profile_pic,
    created_at,
    child_master_type,
    attachments = [],
    reaction_counts,
    user_reaction,
    comments_count,
    note: noteData
  } = note || {}

  const totalComments = comments_count || noteData?.total_comments || 0

  const parentType = child_master_type?.parent_observation_type || 'Note'
  const childTypes = child_master_type?.child_observation_type || []
  const priorityIcon = priorityIcons[priority] || null

  const formatDate = dateStr => {
    if (!dateStr) return ''

    return Utility.convertUTCToLocalDateTime(dateStr)?.replace('|', '•') || ''
  }

  const handleCardClick = () => {
    if (onClick) onClick(note)
  }

  const getAttachmentText = () => {
    if (!attachments?.length) return null

    return `${attachments.length} Attachment${attachments.length > 1 ? 's' : ''}`
  }

  const priorityBgColor = getPriorityBgColor(priority, theme)

  return (
    <Card
      onClick={handleCardClick}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: 'none',
        borderRadius: '8px',
        backgroundColor: priorityBgColor,
        transition: 'all 0.2s ease-in-out',
        ...sx
      }}
    >
      {/* Priority Flag Icon */}
      {priorityIcon && (
        <Box
          component='img'
          src={priorityIcon}
          alt={priority}
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            height: 40,
            transform: 'scaleX(-1)'
          }}
        />
      )}

      {/* Main Content Area */}
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'flex-start' },
            gap: { xs: 2.5, md: 4 },
            pr: priorityIcon ? 5 : 0
          }}
        >
          {/* Left Section - Note Type */}
          <Box sx={{ minWidth: { xs: 'auto', md: 200 }, maxWidth: { md: 240 }, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '8px',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <NoteIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
              </Box>
              <Typography
                variant='subtitle1'
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  fontSize: '1rem'
                }}
              >
                {parentType}
              </Typography>
            </Box>

            {childTypes?.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', ml: 0.5 }}>
                {childTypes?.[0] && (
                  <Chip
                    label={childTypes[0]?.type_name}
                    size='small'
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      color: theme.palette.primary.dark,
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      height: 26,
                      borderRadius: '6px',
                      '& .MuiChip-label': {
                        px: 1.5
                      }
                    }}
                  />
                )}
                {childTypes?.length > 1 && (
                  <Typography
                    variant='caption'
                    sx={{
                      color: theme.palette.text.secondary,
                      fontWeight: 500
                    }}
                  >
                    +{childTypes.length - 1} more
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {/* Middle Section - Note Content */}
          <Box
            sx={{
              flex: 1,
              minWidth: { xs: 'auto', md: 200 },
              py: { md: 0.5 },
              borderLeft: { md: `1px solid ${theme.palette.divider}` },
              pl: { md: 4 }
            }}
          >
            {observation_name && (
              <Box sx={{ mb: 1.5 }}>
                <Typography
                  variant='body2'
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    mb: 0.5
                  }}
                >
                  Notes
                </Typography>
                <Tooltip title={observation_name}>
                  <Typography
                    variant='body2'
                    sx={{
                      fontWeight: 500,
                      color: theme.palette.text.primary,
                      lineHeight: 1.5
                    }}
                  >
                    {observation_name?.length > 100 ? `${observation_name.substring(0, 100)}...` : observation_name}
                  </Typography>
                </Tooltip>
              </Box>
            )}

            {getAttachmentText() && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <AttachmentIcon
                  sx={{
                    fontSize: 16,
                    color: theme.palette.text.secondary,
                    transform: 'rotate(-45deg)'
                  }}
                />
                <Typography
                  variant='body2'
                  sx={{
                    fontWeight: 500,
                    color: theme.palette.text.secondary,
                    fontSize: '0.813rem'
                  }}
                >
                  {getAttachmentText()}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Right Section - Noted By */}
          <Box
            sx={{
              minWidth: { md: 180 },
              flexShrink: 0,
              borderLeft: { md: `1px solid ${theme.palette.divider}` },
              pl: { md: 4 },
              pr: priorityIcon ? 4 : 0
            }}
          >
            <Typography
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.75rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                mb: 1
              }}
            >
              Noted by
            </Typography>
            <UserAvatarDetails
              profile_image={created_by_profile_pic}
              user_name={created_by}
              date={created_at}
              show_time
              size='medium'
            />
          </Box>
        </Box>
      </Box>

      {/* Footer - Actions Section (Segregated) */}
      <Box
        sx={{
          borderTop: `1px solid ${alpha(theme.palette.common.black, 0.06)}`,
          px: 3,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        {/* Like Button */}
        <Box
          onClick={e => {
            e.stopPropagation()
            if (onLikeClick) onLikeClick(note)
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            cursor: 'pointer',
            py: 0.75,
            px: 1.5,
            borderRadius: '20px',
            backgroundColor: user_reaction === 'like' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor:
                user_reaction === 'like' ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.grey[500], 0.1)
            }
          }}
        >
          {user_reaction === 'like' ? (
            <LikeIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
          ) : (
            <LikeOutlinedIcon sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
          )}
          <Typography
            variant='body2'
            sx={{
              fontWeight: 600,
              fontSize: '0.813rem',
              color: user_reaction === 'like' ? theme.palette.primary.main : theme.palette.text.secondary
            }}
          >
            {reaction_counts?.like || 0}
          </Typography>
        </Box>

        {/* Comment Button */}
        <Box
          onClick={e => {
            e.stopPropagation()
            if (onCommentClick) onCommentClick(note)
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            cursor: 'pointer',
            py: 0.75,
            px: 1.5,
            borderRadius: '20px',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: alpha(theme.palette.grey[500], 0.1)
            }
          }}
        >
          <CommentIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
          <Typography
            variant='body2'
            sx={{
              fontWeight: 600,
              fontSize: '0.813rem',
              color: theme.palette.text.secondary
            }}
          >
            {totalComments}
          </Typography>
        </Box>
      </Box>
    </Card>
  )
}

export default NoteCard
