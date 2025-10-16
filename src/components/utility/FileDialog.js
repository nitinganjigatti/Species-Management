import React, { useState } from 'react'
import { Dialog, DialogTitle, DialogContent, IconButton, Typography, Box, useTheme } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { LoadingButton } from '@mui/lab'

// FileDialog component for previewing and downloading various file types
const FileDialog = ({ open, onClose, src, title, type }) => {
  const theme = useTheme()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle download with loading effect
  const handleDownload = e => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate a short loading delay before closing dialog
    setTimeout(() => {
      setIsSubmitting(false)
      onClose()
    }, 500)
  }

  // Renders preview content based on file type
  const renderContent = () => {
    switch (type) {
      case 'pdf':
        return (
          <iframe src={src} title={title || 'PDF Preview'} width='100%' height='500px' style={{ border: 'none' }} />
        )
      case 'image':
        return (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <img
              src={src}
              alt={title || 'Image Preview'}
              style={{
                width: '100%',
                maxHeight: '70vh',
                objectFit: 'contain'
              }}
            />
          </Box>
        )
      case 'video':
        return (
          <Box sx={{ backgroundColor: theme.palette.primary.deepDark, textAlign: 'center' }}>
            <video
              src={src}
              controls
              autoPlay
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
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <audio src={src} controls style={{ width: '100%' }} />
          </Box>
        )
      default:
        // Fallback for other types — show download button
        return (
          <Box sx={{ p: 8, textAlign: 'center' }}>
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

  // Dialog UI with title and content
  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle
        sx={{ display: 'flex', alignItems: 'center', backgroundColor: theme.palette.customColors.displaybgPrimary }}
      >
        <Typography variant='h6' component='div' sx={{ mx: 'auto' }}>
          {title || 'File Preview'}
        </Typography>
        <IconButton aria-label='close' onClick={onClose}>
          <Icon icon='mdi:close' />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>{renderContent()}</DialogContent>
    </Dialog>
  )
}

export default FileDialog

/**
 * FileDialog displays a modal to preview or download files based on their type (image, video, pdf, audio, etc).
 * === FileDialog Props ===
 *
 * === Control Props ===
 * - open: boolean — Controls whether the dialog is open
 * - onClose: function — Callback to close the dialog
 *
 * === Content Props ===
 * - src: string — Source URL of the file to preview or download
 * - title?: string — Optional title shown at the top of the dialog
 * - type: string — File type ('pdf', 'image', 'video', 'audio', or fallback)
 */
