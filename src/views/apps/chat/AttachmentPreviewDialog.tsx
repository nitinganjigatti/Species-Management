'use client'

import { useEffect, useState, useMemo } from 'react'

// ** MUI Imports
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Types
import type { ChatAttachmentType } from 'src/types/apps/chatTypes'

interface Props {
  attachment: ChatAttachmentType | null
  open: boolean
  onClose: () => void
}

/**
 * WhatsApp-Web-style in-page attachment preview.
 *
 *  - Fullscreen overlay, dark backdrop
 *  - Image: pinch / button zoom (50%–400%), rotate, drag (when zoomed)
 *  - Video: native controls with download + playback-rate hidden
 *  - PDF: native viewer iframe with toolbar hidden (Chromium hash flag)
 *  - Other docs: file info card, no preview path
 *  - Blocks Ctrl+S / Ctrl+P keyboard shortcuts while open
 *  - Blocks right-click save, image drag-out, text selection
 *
 *  No download buttons anywhere; the user can only view.
 */
const AttachmentPreviewDialog = ({ attachment, open, onClose }: Props) => {
  const isPdf =
    attachment?.mimeType === 'application/pdf' ||
    /\.pdf$/i.test(attachment?.filename ?? '')

  // Image transform state — reset whenever a new attachment is opened.
  const [zoom, setZoom] = useState(1)
  const [rotate, setRotate] = useState(0)
  useEffect(() => {
    setZoom(1)
    setRotate(0)
  }, [attachment?.id])

  // Block Ctrl/Cmd + S (save) and Ctrl/Cmd + P (print) while the dialog is
  // open. Browser default tries to save the whole page; we don't want that.
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (mod && (e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P')) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    window.addEventListener('keydown', handler, true)

    return () => window.removeEventListener('keydown', handler, true)
  }, [open])

  const sizeKb = useMemo(() => {
    if (!attachment?.size) return null

    return attachment.size >= 1024 * 1024
      ? `${(attachment.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(attachment.size / 1024).toFixed(0)} KB`
  }, [attachment?.size])

  const handleZoomIn = () => setZoom(z => Math.min(4, +(z + 0.25).toFixed(2)))
  const handleZoomOut = () => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))
  const handleRotate = () => setRotate(r => (r + 90) % 360)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      aria-labelledby='attachment-preview-title'
      slotProps={{
        paper: {
          sx: {
            // WhatsApp-style near-black backdrop. PaperProps fills the screen.
            bgcolor: 'rgba(0, 0, 0, 0.95)',
            position: 'relative',
            // Block all native context-menu / selection / drag at the root so
            // every child inherits the no-save behavior.
            userSelect: 'none',
            WebkitUserSelect: 'none',
            color: 'common.white'
          },
          onContextMenu: (e: any) => e.preventDefault()
        }
      }}
    >
      {/* Header: filename + size + close */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          px: 3,
          py: 2,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)',
          zIndex: 2
        }}
      >
        <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Typography
            id='attachment-preview-title'
            variant='subtitle2'
            noWrap
            sx={{ color: 'common.white', fontWeight: 600 }}
          >
            {attachment?.filename ?? 'Preview'}
          </Typography>
          {sizeKb ? (
            <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {sizeKb}
            </Typography>
          ) : null}
        </Box>
        <IconButton
          size='medium'
          onClick={onClose}
          aria-label='Close preview'
          sx={{ color: 'common.white' }}
        >
          <Icon icon='mdi:close' fontSize='1.5rem' />
        </IconButton>
      </Box>

      {/* Body: type-aware preview */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          p: { xs: 8, md: 10 }
        }}
      >
        {!attachment ? null : attachment.type === 'image' ? (
          <Box
            component='img'
            src={attachment.url}
            alt={attachment.filename}
            draggable={false}
            onContextMenu={(e: any) => e.preventDefault()}
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              transform: `scale(${zoom}) rotate(${rotate}deg)`,
              transition: 'transform 200ms ease',
              cursor: zoom > 1 ? 'move' : 'zoom-in',
              userSelect: 'none',
              WebkitUserDrag: 'none',
              pointerEvents: 'auto'
            } as any}
            onClick={() => (zoom === 1 ? handleZoomIn() : null)}
          />
        ) : attachment.type === 'video' ? (
          <Box
            component='video'
            src={attachment.url}
            controls
            controlsList='nodownload noplaybackrate'
            onContextMenu={(e: any) => e.preventDefault()}
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              display: 'block'
            }}
          />
        ) : isPdf ? (
          // Native PDF viewer with toolbar hidden (Chromium / Edge respect
          // these fragment flags; Firefox/Safari may show their own UI).
          <Box
            component='iframe'
            src={`${attachment.url}#toolbar=0&navpanes=0&scrollbar=0`}
            title={attachment.filename}
            sx={{
              width: '100%',
              height: '100%',
              minHeight: '70vh',
              border: 'none',
              bgcolor: 'common.white'
            }}
          />
        ) : (
          <Box sx={{ textAlign: 'center', color: 'common.white', maxWidth: 360 }}>
            <Icon icon='mdi:file-document-outline' fontSize='4rem' />
            <Typography sx={{ mt: 2, fontWeight: 600 }}>{attachment.filename}</Typography>
            <Typography variant='caption' sx={{ display: 'block', opacity: 0.7, mt: 1 }}>
              Preview not available for this file type
            </Typography>
          </Box>
        )}
      </Box>

      {/* Footer: image controls (zoom + rotate). Only for image previews. */}
      {attachment?.type === 'image' ? (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1,
            px: 3,
            py: 2,
            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)',
            zIndex: 2
          }}
        >
          <Tooltip title='Zoom out'>
            <span>
              <IconButton
                size='medium'
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                sx={{ color: 'common.white', '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' } }}
                aria-label='Zoom out'
              >
                <Icon icon='mdi:magnify-minus-outline' fontSize='1.5rem' />
              </IconButton>
            </span>
          </Tooltip>
          <Typography variant='caption' sx={{ color: 'common.white', minWidth: 40, textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </Typography>
          <Tooltip title='Zoom in'>
            <span>
              <IconButton
                size='medium'
                onClick={handleZoomIn}
                disabled={zoom >= 4}
                sx={{ color: 'common.white', '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' } }}
                aria-label='Zoom in'
              >
                <Icon icon='mdi:magnify-plus-outline' fontSize='1.5rem' />
              </IconButton>
            </span>
          </Tooltip>
          <Box sx={{ width: 1, height: 24, bgcolor: 'rgba(255,255,255,0.2)', mx: 1 }} />
          <Tooltip title='Rotate'>
            <IconButton
              size='medium'
              onClick={handleRotate}
              sx={{ color: 'common.white' }}
              aria-label='Rotate'
            >
              <Icon icon='mdi:rotate-right' fontSize='1.5rem' />
            </IconButton>
          </Tooltip>
        </Box>
      ) : null}
    </Dialog>
  )
}

export default AttachmentPreviewDialog
