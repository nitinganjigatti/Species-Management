'use client'

import { useState, useMemo } from 'react'
import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Icon from 'src/@core/components/icon'
import FileDialog from 'src/components/utility/FileDialog'
import type { AnnouncementMediaProps, AnnouncementAttachment } from 'src/types/announcement'

const AnnouncementMedia = ({ attachments }: AnnouncementMediaProps) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const theme = useTheme()

  // Filter images - use startsWith to handle "image/jpeg", "image/png", etc.
  const images = useMemo(() => {
    return (
      attachments?.filter(
        att => att?.file_type?.toLowerCase()?.startsWith('image') || att?.file_type?.toLowerCase() === 'image'
      ) ?? []
    )
  }, [attachments])

  // Filter videos - use startsWith to handle "video/mp4", etc.
  const videos = useMemo(() => {
    return (
      attachments?.filter(
        att => att?.file_type?.toLowerCase()?.startsWith('video') || att?.file_type?.toLowerCase() === 'video'
      ) ?? []
    )
  }, [attachments])

  // Determine what to show: first image takes priority, then first video
  const mediaToShow = images.length > 0 ? images[0] : videos.length > 0 ? videos[0] : null

  const isImage = mediaToShow
    ? mediaToShow.file_type?.toLowerCase()?.startsWith('image') || mediaToShow.file_type?.toLowerCase() === 'image'
    : false

  if (!mediaToShow) return null

  const handleMediaClick = () => {
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
  }

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <>
      <Box
        onClick={handleMediaClick}
        sx={{
          position: 'relative',
          cursor: 'pointer',
          mx: 4,
          mb: 2,
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: theme.palette.customColors.SurfaceVariant
        }}
      >
        {isImage ? (
          // Render image
          imageError ? (
            <Box
              sx={{
                width: '100%',
                height: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.palette.customColors.displaybgSecondary
              }}
            >
              <Icon icon='mdi:image-off-outline' fontSize={48} color={theme.palette.customColors.neutralSecondary} />
            </Box>
          ) : (
            <img
              src={mediaToShow.file}
              alt={mediaToShow.file_orginal_name || 'Image'}
              style={{
                width: '100%',
                maxHeight: '400px',
                objectFit: 'cover',
                display: 'block'
              }}
              onError={handleImageError}
              loading='lazy'
            />
          )
        ) : (
          // Render video thumbnail with play button
          <Box sx={{ position: 'relative', width: '100%', backgroundColor: theme.palette.customColors.deepDark }}>
            <video
              src={mediaToShow.file}
              style={{
                width: '100%',
                maxHeight: '300px',
                objectFit: 'cover',
                display: 'block'
              }}
              preload='metadata'
              muted
              playsInline
            />
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icon icon='mdi:play' fontSize={32} color={theme.palette.customColors.OnPrimary} />
            </Box>
          </Box>
        )}
      </Box>

      {/* Media Preview Dialog */}
      <FileDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        src={mediaToShow?.file || ''}
        title={mediaToShow?.file_orginal_name || 'Media Preview'}
        type={isImage ? 'image' : 'video'}
        fileIcon={null}
      />
    </>
  )
}

export default AnnouncementMedia
