import React, { useState, useEffect, useRef } from 'react'
import { Dialog, DialogTitle, DialogContent, IconButton, Typography, Box, useTheme, Button } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { LoadingButton } from '@mui/lab'
import SignedMediaPlayer from './SignedMediaPlayer'
import TextEllipsisWithModal from '../TextEllipsisWithModal'
import { Grid } from '@mui/system'

const isIOS =
  typeof window !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
    (navigator.userAgent.includes('Mac') && 'ontouchend' in document))

// FileDialog component for previewing and downloading various file types
const FileDialog = ({ open, onClose, src, title, type, fileIcon }) => {
  const theme = useTheme()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isError, setIsError] = useState(false)

  const handleDownload = e => {
    e.preventDefault()
    if (!src) return

    setIsSubmitting(true)

    // Create a temporary link to trigger download
    const link = document.createElement('a')
    link.href = src
    link.download = title || 'file'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Simulate a short loading delay before closing dialog
    setTimeout(() => {
      setIsSubmitting(false)
      onClose()
    }, 500)
  }

  // const getImages = async src => {
  //   try {
  //     const response = await fetch(src)

  //     //  {
  //     //   method: 'GET',

  //     //   // Important for Safari + signed URLs
  //     //   headers: {
  //     //     Range: 'bytes=0-'
  //     //   },
  //     //   credentials: 'omit'
  //     // })

  //     // Accept both 200 and 206
  //     if (!response.ok && response.status !== 206) {
  //       throw new Error(`HTTP error! status: ${response.status}`)
  //     }

  //     const contentType = response.headers.get('content-type')

  //     if (!contentType) {
  //       throw new Error('Missing Content-Type header')
  //     }

  //     // Optional: validate media type
  //     if (!contentType.startsWith('image/') && !contentType.startsWith('video/')) {
  //       throw new Error(`Unsupported media type: ${contentType}`)
  //     }

  //     const blob = await response.blob()

  //     // Create a local object URL (Safari-safe)
  //     return URL.createObjectURL(blob)
  //   } catch (error) {
  //     console.error('Error fetching media:', error)

  //     return null
  //   }
  // }

  const renderFallback = () => {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: fileIcon?.bg_color || theme.palette.action.hover,
          minHeight: '300px',
          width: '100%',
          p: 10,
          gap: 4
        }}
      >
        {type == 'image' ? (
          <Icon icon='mdi:image-off-outline' fontSize={80} color={theme.palette.text.secondary} />
        ) : fileIcon?.image_path ? (
          <Box
            component='img'
            src={fileIcon?.image_path}
            alt='file icon'
            sx={{ width: 100, height: 100, objectFit: 'contain' }}
          />
        ) : (
          <Icon
            icon={fileIcon?.icon || 'mdi:file'}
            fontSize={80}
            color={fileIcon?.icon_color || theme.palette.primary.main}
          />
        )}
        <Typography variant='body1' color='text.secondary' sx={{ fontWeight: 500 }}>
          Preview not available
        </Typography>
      </Box>
    )
  }

  // Renders preview content based on file type
  const renderContent = () => {
    if (isError) return renderFallback()

    switch (type) {
      case 'pdf':
        // Standard PDF parameters for better browser compatibility
        const pdfUrl = `${src}#view=FitH`

        return (
          <Box
            sx={{
              height: '70vh',
              width: '100%',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <iframe
              src={pdfUrl}
              title={title || 'PDF Preview'}
              scrolling='yes'
              width='100%'
              height='100%'
              onError={() => {
                setIsError(true)
              }}
              style={{
                border: 'none',
                width: '100%',
                height: '100%',
                minHeight: '70vh',
                display: 'block'
              }}
            />
          </Box>
        )
      case 'image':
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%'
            }}
          >
            <img
              src={src}
              alt={title || 'Image Preview'}
              style={{
                width: '100%',
                maxHeight: '70vh',
                objectFit: 'contain'
              }}
              onError={() => {
                setIsError(true)
              }}
            />
          </Box>
        )
      case 'video':
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%'
            }}
          >
            <SignedMediaPlayer
              src={src}
              preload='auto'
              type='video'
              onError={() => setIsError(true)}
              style={{
                width: '100%',
                maxHeight: '70vh',
                objectFit: 'contain'
              }}
            />
          </Box>
        )

      case 'audio':
        return (
          <Box sx={{ p: 10 }}>
            <SignedMediaPlayer controls src={src} preload='auto' height='auto' onError={() => setIsError(true)} />
          </Box>
        )
      default:
        // Fallback for other types — show download button
        return (
          <Box sx={{ p: 10, textAlign: 'center' }}>
            <LoadingButton
              variant='contained'
              loading={isSubmitting}
              onClick={handleDownload}
              endIcon={<Icon icon='mdi:download' width={24} height={24} />}
              sx={{
                px: 8,
                py: 2,
                borderRadius: '6px',
                textTransform: 'none',
                letterSpacing: 1,
                fontSize: '1rem'
              }}
            >
              Download File
            </LoadingButton>
          </Box>
        )
    }
  }

  // Reset error state when modal opens or src changes
  useEffect(() => {
    if (open) {
      setIsError(false)
    }
  }, [open, src])

  // Dialog UI with title and content
  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: theme.palette.customColors.displaybgPrimary,
          padding: '6px 24px'
        }}
      >
        <Grid container spacing={2} sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
          <Grid
            size={{ sm: type == 'pdf' ? 8 : 11, md: type == 'pdf' ? 9 : 11 }}
            sx={{ display: 'flex', justifyContent: 'center' }}
          >
            <TextEllipsisWithModal
              enableDialog={false}
              text={title || 'File Preview'}
              style={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '1.25rem',
                fontWeight: 500,
                maxWidth: '100%'
              }}
            />
          </Grid>

          <Grid
            size={{ sm: type == 'pdf' ? 4 : 1, md: type == 'pdf' ? 3 : 1 }}
            sx={{ display: 'flex', justifyContent: 'end', gap: 3 }}
          >
            {type == 'pdf' && (
              <Button
                variant='contained'
                onClick={() => window.open(src, '_blank')}
                endIcon={<Icon icon='mdi:eye-outline' width={24} height={24} />}
                sx={{
                  px: 4,
                  py: 1,
                  borderRadius: '6px',
                  fontSize: '1rem',
                  textTransform: 'none'
                }}
              >
                Full View
              </Button>
            )}
            <IconButton aria-label='close' onClick={onClose}>
              <Icon icon='mdi:close' />
            </IconButton>
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>{renderContent()}</DialogContent>
    </Dialog>
  )
}

export default FileDialog

/**
 * FileDialog displays a modal to preview or download files based on their type (image, video, pdf, audio, etc).
 *
 * - open: boolean — Controls whether the dialog is open
 * - onClose: function — Callback to close the dialog
 * - src: string — Source URL of the file to preview or download
 * - title?: string — Optional title shown at the top of the dialog
 * - type: string — File type ('pdf', 'image', 'video', 'audio', or fallback)
 */
