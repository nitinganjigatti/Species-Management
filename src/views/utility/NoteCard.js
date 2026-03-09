import React from 'react'
import { Box, Card, Typography, Chip, Divider } from '@mui/material'
import { useTheme, alpha } from '@mui/material/styles'
import {
  Description as NoteIcon,
  ThumbUp as LikeIcon,
  ThumbUpOutlined as LikeOutlinedIcon,
  ChatBubbleOutline as CommentIcon
} from '@mui/icons-material'
import Utility from 'src/utility'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'

const priorityIcons = {
  Low: '/images/priority/flag_priority_low.svg',
  Moderate: '/images/priority/flag_priority_medium.svg',
  High: '/images/priority/flag_priority_high.svg',
  Critical: '/images/priority/flag_priority_critical.svg'
}

// Get background color based on priority (similar to severity colors in Hospital module)
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
        p: 3,
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: 'none',
        borderRadius: '8px',
        backgroundColor: priorityBgColor,
        ...sx
      }}
    >
      {priorityIcon && (
        <Box
          component='img'
          src={priorityIcon}
          alt={priority}
          sx={{
            position: 'absolute',
            top: 12,
            right: 0,
            height: 36,
            transform: 'scaleX(-1)'
          }}
        />
      )}

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'flex-start' },
          gap: { xs: 2, md: 4 },
          pr: priorityIcon ? 6 : 0
        }}
      >
        <Box sx={{ minWidth: { xs: 'auto', md: 280 }, maxWidth: { md: 320 }, flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                bgcolor: theme.palette.customColors?.Background || theme.palette.grey[100],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <NoteIcon sx={{ color: theme.palette.primary.main, fontSize: 18 }} />
            </Box>
            <Typography
              variant='subtitle1'
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary
              }}
            >
              {parentType}
            </Typography>
          </Box>

          {childTypes?.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {childTypes?.[0] && (
                <Chip
                  label={childTypes[0]?.type_name}
                  size='small'
                  sx={{
                    bgcolor: theme.palette.customColors?.Background || theme.palette.grey[100],
                    color: theme.palette.customColors?.OnPrimaryContainer || theme.palette.primary.dark,
                    fontSize: '12px',
                    height: 24
                  }}
                />
              )}
              {childTypes?.length > 1 && (
                <Typography variant='caption' color='text.secondary'>
                  +{childTypes.length - 1} more
                </Typography>
              )}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 1.5 }}>
            <Box
              onClick={e => {
                e.stopPropagation()
                if (onLikeClick) onLikeClick(note)
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                '&:hover': { opacity: 0.7 }
              }}
            >
              {user_reaction === 'like' ? (
                <LikeIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
              ) : (
                <LikeOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              )}
              <Typography
                variant='body2'
                color={user_reaction === 'like' ? 'primary' : 'text.secondary'}
                sx={{ fontWeight: 500 }}
              >
                {reaction_counts?.like || 0}
              </Typography>
            </Box>

            <Box
              onClick={e => {
                e.stopPropagation()
                if (onCommentClick) onCommentClick(note)
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                '&:hover': { opacity: 0.7 }
              }}
            >
              <CommentIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant='body2' color='text.secondary' sx={{ fontWeight: 500 }}>
                {totalComments}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ flex: 1, minWidth: { xs: 'auto', md: 200 }, pt: { md: 0.5 } }}>
          {observation_name && (
            <Box sx={{ mb: 1 }}>
              <Typography variant='body2' color='text.secondary' component='span'>
                Notes :{' '}
              </Typography>
              <Typography
                variant='body2'
                component='span'
                sx={{
                  fontWeight: 500,
                  color: theme.palette.text.primary
                }}
              >
                {observation_name?.length > 100 ? `${observation_name.substring(0, 100)}...` : observation_name}
              </Typography>
            </Box>
          )}

          {getAttachmentText() && (
            <Box>
              <Typography variant='body2' color='text.secondary' component='span'>
                Attachments :{' '}
              </Typography>
              <Typography variant='body2' component='span' sx={{ fontWeight: 500 }}>
                {getAttachmentText()}
              </Typography>
            </Box>
          )}
        </Box>

        <Box
          sx={{
            minWidth: { md: 180 },
            flexShrink: 0,
            mr: priorityIcon ? 6 : 0
          }}
        >
          <Typography
            sx={{
              color: theme.palette.customColors?.neutralSecondary || 'text.secondary',
              fontSize: '0.75rem',
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
    </Card>
  )
}

export default NoteCard
