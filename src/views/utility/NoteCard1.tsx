import React, { useState, Fragment, useMemo } from 'react'
import {
  Box,
  Card,
  Typography,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Grid,
  Button,
  CircularProgress
} from '@mui/material'
import { useTheme, alpha } from '@mui/material/styles'
import {
  Description as NoteIcon,
  ThumbUp as LikeIcon,
  ThumbUpOutlined as LikeOutlinedIcon,
  ChatBubbleOutline as CommentIcon,
  AttachFile as AttachmentIcon
} from '@mui/icons-material'
import Icon from 'src/@core/components/icon'
import Utility from 'src/utility'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import { EXTENSION_TYPE_MAP } from 'src/constants/Constants'
import FileDialog from 'src/components/utility/FileDialog'
import AnimalCard from 'src/views/utility/AnimalCard'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'

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
      return theme.palette.customColors?.antzSecondaryBg
  }
}

const NoteCard1 = ({
  note,
  onClick = () => {},
  onLikeClick = () => {},
  onCommentClick = () => {},
  sx = {},
  isLikeLoading = false
}: any) => {
  const theme = useTheme() as any
  const [showAllChildTypes, setShowAllChildTypes] = useState(false)
  const [showFullNote, setShowFullNote] = useState(false)
  const [previewFile, setPreviewFile] = useState<any>(null)

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
    ref_data,
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

  // Helper to determine file type based on extension
  const getFileType = (fileName: string) => {
    if (!fileName) return 'other'
    const ext = fileName?.split('.').pop()?.toLowerCase() || ''
    return (EXTENSION_TYPE_MAP as any)[ext] || 'other'
  }

  const getAttachmentCounts = () => {
    if (!attachments?.length) return null

    const counts: { [key: string]: number } = {}
    attachments.forEach((attachment: any) => {
      const type = getFileType(attachment?.file_orginal_name || attachment?.file_original_name)

      // Group subtypes into main categories for display
      let displayType = 'document'
      if (['image', 'video', 'audio'].includes(type)) {
        displayType = type
      } else if (type === 'other') {
        displayType = 'attachment'
      }

      counts[displayType] = (counts[displayType] || 0) + 1
    })

    return counts
  }

  const firstImage = useMemo(() => {
    return attachments?.find((a: any) => {
      const fileName = a?.file_orginal_name || a?.file_original_name

      return getFileType(fileName) === 'image'
    })
  }, [attachments])

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'image':
        return 'mdi:image-outline'
      case 'video':
        return 'mdi:video-outline'
      case 'audio':
        return 'mdi:volume-high'
      case 'document':
        return 'mdi:file-document-outline'
      default:
        return 'mdi:attachment'
    }
  }

  const handleImagePreview = () => {
    if (firstImage) {
      setPreviewFile({
        src: firstImage?.file,
        type: 'image',
        name: firstImage.file_orginal_name || firstImage.file_original_name,
        fileIcon: 'mdi:image-outline'
      })
    }
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
        // backgroundColor: priorityBgColor,
        backgroundColor: theme.palette.customColors.OnPrimary,
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
            top: 12,
            right: 0,
            height: 40,
            transform: 'scaleX(-1)'
          }}
        />
      )}

      {/* Main Content Area */}
      <Box sx={{ p: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}
        >
          {/* Header Section - Note Type and Priority */}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
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
                  onClick={e => {
                    e.stopPropagation()
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
          <Box>
            <Typography
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.75rem',
                fontWeight: 500,
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

          {observation_name && (
            <Box sx={{ mb: 1.5 }}>
              <Typography
                variant='body2'
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 500
                }}
              >
                Notes
              </Typography>
              <Tooltip title={observation_name}>
                <Typography
                  sx={{
                    fontWeight: 500,
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontSize: '1rem'
                  }}
                >
                  {observation_name?.length > 120 && !showFullNote
                    ? `${observation_name.substring(0, 115)}...`
                    : observation_name}
                  {observation_name?.length > 120 && (
                    <Typography
                      component='span'
                      onClick={e => {
                        e.stopPropagation()
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
                      {showFullNote ? 'Read Less' : 'Read More'}
                    </Typography>
                  )}
                </Typography>
              </Tooltip>
            </Box>
          )}

          {/* Attachment Icons/Counts */}
          {getAttachmentCounts() && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
              {Object.entries(getAttachmentCounts() || {}).map(([type, count]) => (
                <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Icon icon={getAttachmentIcon(type)} fontSize={18} style={{ color: theme.palette.text.secondary }} />
                  <Typography
                    variant='body2'
                    sx={{
                      fontWeight: 500,
                      color: theme.palette.text.secondary,
                      fontSize: '0.813rem'
                    }}
                  >
                    {count} {type}
                    {count > 1 ? 's' : ''}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Animal Card Section */}
          {ref_data?.[0]?.animalData && (
            <Box sx={{ p: 2, border: '1px solid', borderRadius: 1, borderColor: theme.palette.divider }}>
              <AnimalCard data={ref_data[0].animalData} />
            </Box>
          )}

          {/* Image Preview - First image only */}
          {firstImage && (
            <Box
              component='img'
              src={firstImage?.file || firstImage.file}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                handleImagePreview()
              }}
              sx={{
                width: '100%',
                height: '200px',
                borderRadius: '8px',
                objectFit: 'cover',
                cursor: 'pointer'
              }}
            />
          )}
          {previewFile && (
            <FileDialog
              open={!!previewFile}
              onClose={() => setPreviewFile(null)}
              src={previewFile?.src}
              type={previewFile?.type}
              title={previewFile?.name}
              fileIcon={previewFile?.fileIcon}
            />
          )}
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
          {isLikeLoading ? (
            <CircularProgress size={20} color='primary' />
          ) : user_reaction === 'like' ? (
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

export default NoteCard1
