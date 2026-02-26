import React, { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  useTheme,
  Button,
  CircularProgress,
  Grid
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import { LoadingButton } from '@mui/lab'
import SignedMediaPlayer from './SignedMediaPlayer'
import TextEllipsisWithModal from '../TextEllipsisWithModal'
import Utility from 'src/utility'

const FileDialog = ({ open, onClose, src, title, type, fileIcon }) => {
  const theme = useTheme()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errorType, setErrorType] = useState(null) // broken | unsupported

  const handleDownload = async e => {
    e.preventDefault()
    if (!src) return

    setIsSubmitting(true)
    try {
      await Utility.downloadFileFromURLWithBlob(src, title)
      onClose()
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Checks whether the file URL is reachable
  const checkURLExists = async url => {
    try {
      const response = await fetch(url)

      return response.ok
    } catch {
      return false
    }
  }

  // Determines if the error is due to a broken URL or unsupported preview format
  const handleLoadError = async () => {
    setIsLoading(false)

    const exists = await checkURLExists(src)

    if (exists) {
      setErrorType('unsupported')
    } else {
      setErrorType('broken')
    }

    setIsError(true)
  }

  const renderFallback = () => {
    //  Unsupported URL shows only Download button
    if (errorType === 'unsupported') {
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

    return (
      <Box
        sx={{
          minHeight: '300px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.palette.action.hover,
          p: 10,
          gap: 4
        }}
      >
        {type == 'image' ? (
          <Icon icon='mdi:image-off-outline' fontSize={80} color={theme.palette.text.secondary} />
        ) : type == 'video' ? (
          <Icon icon='mdi:video-off-outline' fontSize={80} color={theme.palette.text.secondary} />
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

  // Loader
  const loadingOverlay = (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        backgroundColor: theme.palette.background.paper
      }}
    >
      <CircularProgress />
    </Box>
  )

  // Renders preview content based on file type
  const renderContent = () => {
    if (isError) return renderFallback()

    switch (type) {
      case 'pdf':
        // Ensures the PDF fits the iframe width for consistent preview across browsers and iPad
        // const pdfUrl = `${src}#view=FitH`
        const pdfUrl = src

        return (
          <Box sx={{ width: '100%', height: '70vh', position: 'relative', overflow: 'hidden' }}>
            {isLoading && loadingOverlay}
            {!isError && (
              <iframe
                src={pdfUrl}
                title={title || 'PDF Preview'}
                style={{
                  border: 'none',
                  width: '100%',
                  height: '100%'
                }}
              />
            )}
          </Box>
        )
      case 'image':
        return (
          <Box
            sx={{
              width: '100%',
              minHeight: '300px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isLoading && loadingOverlay}
            <img
              src={src}
              alt={title || 'Image Preview'}
              onLoad={() => setIsLoading(false)}
              onError={handleLoadError}
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain'
              }}
            />
          </Box>
        )
      case 'video':
        return (
          <Box
            sx={{
              width: '100%',
              minHeight: '300px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isLoading && loadingOverlay}
            <SignedMediaPlayer
              src={src}
              preload='auto'
              type='video'
              onLoad={() => setIsLoading(false)}
              onError={handleLoadError}
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
          <Box sx={{ p: 10, position: 'relative', height: '150px' }}>
            {isLoading && loadingOverlay}
            <SignedMediaPlayer
              controls
              src={src}
              preload='auto'
              height='auto'
              onLoad={() => setIsLoading(false)}
              onError={handleLoadError}
            />
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

  // Resets loading and error state whenever dialog opens or file source changes
  useEffect(() => {
    if (open) {
      setIsError(false)
      setIsLoading(true)
      setErrorType(null)
    }
  }, [open, src])

  // Pre-check PDF accessibility to detect broken links before rendering preview
  useEffect(() => {
    if (!open || type !== 'pdf' || !src) return

    let active = true

    const validatePdf = async () => {
      setIsLoading(true)

      const exists = await checkURLExists(src)

      if (!exists && active) {
        setErrorType('broken')
        setIsError(true)
        setIsLoading(false)
      } else if (active) {
        setIsLoading(false)
      }
    }

    validatePdf()

    return () => {
      active = false
    }
  }, [open, src, type])

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
        <Grid
          container
          spacing={2}
          sx={{ mr: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'nowrap' }}
        >
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
 * - fileIcon: object - containing icon and bg_color for the file
 */