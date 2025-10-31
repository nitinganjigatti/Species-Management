import React, { useState } from 'react'
import { CardMedia, Typography, Box, useTheme, alpha } from '@mui/material'
import {
  Description,
  InsertDriveFile,
  Image as ImageIcon,
  AudioFile,
  VideoFile,
  PictureAsPdf,
  Article,
  TableChart,
  Slideshow
} from '@mui/icons-material'
import UserAvatarDetails from './UserAvatarDetails'

const FilePreviewCard = ({ fileUrl, fileName, user, width = 200, height = 200, cardStyle }) => {
  const theme = useTheme()

  const defaultIcons = theme => ({
    image: <ImageIcon sx={{ fontSize: 60, color: theme.palette.customColors.Outline }} />,
    video: <VideoFile sx={{ fontSize: 60, color: theme.palette.customColors.Tertiary }} />,
    audio: <AudioFile sx={{ fontSize: 60, color: theme.palette.customColors.moderateSecondary }} />,
    pdf: <PictureAsPdf sx={{ fontSize: 60, color: theme.palette.customColors.Tertiary }} />,
    doc: <Article sx={{ fontSize: 60, color: theme.palette.customColors.addPrimary }} />,
    xls: <TableChart sx={{ fontSize: 60, color: '#2E7D32' }} />,
    ppt: <Slideshow sx={{ fontSize: 60, color: '#EF6C00' }} />,
    document: <Description sx={{ fontSize: 60, color: theme.palette.customColors.OnSurfaceVariant }} />,
    other: <InsertDriveFile sx={{ fontSize: 60, color: '#757575' }} />
  })

  const bgColors = theme => ({
    image: theme.palette.customColors.Background,
    video: theme.palette.customColors.Tertiary20,
    audio: alpha(theme.palette.customColors.antzNotes, 0.4),
    pdf: theme.palette.customColors.Tertiary20,
    doc: alpha(theme.palette.customColors.addPrimary, 0.1),
    xls: '#E8F5E9',
    ppt: '#FFF3E0',
    document: '#F5F5F5',
    other: '#F5F5F5'
  })

  const getFileType = (url = '') => {
    const ext = url.split('.').pop()?.toLowerCase()
    if (!ext) return 'other'
    if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) return 'video'
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) return 'image'
    if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio'
    if (['pdf'].includes(ext)) return 'pdf'
    if (['doc', 'docx'].includes(ext)) return 'doc'
    if (['xls', 'xlsx'].includes(ext)) return 'xls'
    if (['ppt', 'pptx'].includes(ext)) return 'ppt'
    if (['txt'].includes(ext)) return 'document'

    return 'other'
  }

  const type = getFileType(fileUrl)
  const [loadError, setLoadError] = useState(false)

  const renderMedia = () => {
    if (loadError || ['pdf', 'doc', 'xls', 'ppt', 'audio', 'other'].includes(type)) {
      return (
        <Box
          sx={{
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: bgColors[type] || bgColors.other,
            borderRadius: 1
          }}
        >
          {defaultIcons[type] || defaultIcons.other}
        </Box>
      )
    }

    switch (type) {
      case 'image':
        return (
          <CardMedia
            component='img'
            height={height}
            image={fileUrl}
            alt={fileName || 'File preview'}
            sx={{ objectFit: 'cover', borderRadius: 1 }}
            onError={() => setLoadError(true)}
          />
        )

      case 'video':
        return (
          <Box
            sx={{
              position: 'relative',
              height,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1,
              overflow: 'hidden',
              bgcolor: '#000'
            }}
          >
            <video
              src={fileUrl}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              muted
              controls
              onError={() => setLoadError(true)}
            />
          </Box>
        )

      default:
        return (
          <Box
            sx={{
              height,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: bgColors.other,
              borderRadius: 1
            }}
          >
            {defaultIcons.other}
          </Box>
        )
    }
  }

  return (
    <Box
      sx={{
        width,
        borderRadius: 1,
        overflow: 'hidden',
        border: `0.5px solid ${theme.palette.customColors.OutlineVariant}`,
        p: fileName || user ? 3 : 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        ...cardStyle
      }}
    >
      {fileName && (
        <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}>
          {fileName}
        </Typography>
      )}
      {renderMedia()}
      {user && (
        <UserAvatarDetails
          date={user?.date}
          user_name={user?.name}
          profile_image={user?.image}
          size='medium'
          show_time
        />
      )}
    </Box>
  )
}

export default FilePreviewCard
