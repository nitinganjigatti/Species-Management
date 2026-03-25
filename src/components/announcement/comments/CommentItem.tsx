'use client'

import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/@core/components/icon'
import Utility from 'src/utility'
import type { AnnouncementComment } from 'src/types/announcement'

interface CommentItemProps {
  comment: AnnouncementComment
  isOwner: boolean
  onDelete?: () => void
  isLast?: boolean
}

const CommentItem = ({ comment, isOwner, onDelete, isLast = false }: CommentItemProps) => {
  const theme = useTheme()

  const textPrimary = theme.palette.customColors.OnSurfaceVariant
  const textSecondary = theme.palette.customColors.neutralSecondary
  const borderColor = theme.palette.customColors.OutlineVariant
  const errorColor = theme.palette.customColors.Tertiary

  const userName = `${comment.user_first_name} ${comment.user_last_name}`

  // Convert UTC to local time for display
  const getCommentTime = () => {
    if (!comment.created_at) return ''
    const localTime = Utility.convertUTCToLocal(comment.created_at)

    return Utility.AgeConverter(localTime) || ''
  }

  return (
    <Box
      sx={{
        py: 2,
        borderBottom: isLast ? 'none' : `1px solid ${borderColor}`
      }}
    >
      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* Avatar */}
        <Avatar src={comment.user_profile_pic || undefined} sx={{ width: 36, height: 36, flexShrink: 0 }}>
          {!comment.user_profile_pic && (comment.user_first_name?.charAt(0) || '')}
        </Avatar>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Header - Name, Time, Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: textPrimary
                }}
              >
                {userName}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  color: textSecondary
                }}
              >
                {getCommentTime()}
              </Typography>
            </Box>

            {/* Delete button - only show for owner */}
            {isOwner && onDelete && (
              <IconButton
                size='small'
                onClick={onDelete}
                sx={{
                  p: 0.5,
                  color: textSecondary,
                  '&:hover': { color: errorColor }
                }}
              >
                <Icon icon='mdi:delete-outline' fontSize={18} />
              </IconButton>
            )}
          </Box>

          {/* Comment text */}
          <Typography
            sx={{
              fontSize: '0.875rem',
              color: textPrimary,
              lineHeight: 1.5,
              wordBreak: 'break-word'
            }}
          >
            {comment.comment_text}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default CommentItem
