'use client'

import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'

// ** MUI Imports
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** PDF preview — dynamic + ssr:false because `react-pdf` / `pdfjs-dist`
// touch `DOMMatrix` at module-evaluation time, which crashes Next.js SSR
// with `DOMMatrix is not defined`. Loading the renderer only on the client
// sidesteps that without losing the canvas-based rendering.
const PdfPreview = dynamic(() => import('src/views/apps/chat/PdfPreview'), {
  ssr: false
})

// ** Spreadsheet preview — handles CSV / XLSX / XLS via the existing
// `xlsx` (SheetJS) dependency. Dynamic so the ~600KB SheetJS parser only
// loads when the user actually opens a spreadsheet file.
const SpreadsheetPreview = dynamic(() => import('src/views/apps/chat/SpreadsheetPreview'), {
  ssr: false
})

// ** DOCX preview — uses `mammoth` to convert .docx bytes to HTML on the
// client. Dynamic + ssr:false; mammoth ships JSZip + xmldom that aren't
// SSR-friendly. Only loads on first DOCX preview of a session.
const DocxPreview = dynamic(() => import('src/views/apps/chat/DocxPreview'), {
  ssr: false
})

// ** Types
import type { ChatAttachmentType } from 'src/types/apps/chatTypes'

interface Props {
  attachment: ChatAttachmentType | null
  open: boolean
  onClose: () => void
  /** Pass the full list of images to enable prev/next carousel navigation. */
  attachments?: ChatAttachmentType[]
  /** Index within `attachments` to open first. */
  initialIndex?: number
}

/**
 * WhatsApp-Web-style in-page attachment preview.
 *
 *  - Fullscreen overlay, dark backdrop
 *  - Image: pinch / button zoom (50%–400%), rotate, drag (when zoomed)
 *  - Carousel: prev/next arrows + counter when `attachments` has >1 item
 *  - Video: native controls with download + playback-rate hidden
 *  - PDF: native viewer iframe with toolbar hidden (Chromium hash flag)
 *  - Other docs: file info card, no preview path
 *  - Blocks Ctrl+S / Ctrl+P keyboard shortcuts while open
 *  - Blocks right-click save, image drag-out, text selection
 *
 *  No download buttons anywhere; the user can only view.
 */
const AttachmentPreviewDialog = ({ attachment, open, onClose, attachments, initialIndex = 0 }: Props) => {
  const hasCarousel = attachments && attachments.length > 1
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  // Reset index and transforms whenever the dialog opens to a new attachment.
  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex, open])

  // Resolve the current attachment — carousel mode uses the list, else fallback to single.
  const current = hasCarousel ? attachments[currentIndex] : attachment

  const isPdf = current?.mimeType === 'application/pdf' || /\.pdf$/i.test(current?.filename ?? '')

  // Spreadsheet detection — handled by the single `SpreadsheetPreview`
  // component (SheetJS reads both CSV text and XLSX/XLS binary). The mime
  // check covers Excel; the extension check covers CSV + .xls variants
  // where the server omits the MIME.
  const isSpreadsheet =
    current?.mimeType === 'text/csv' ||
    current?.mimeType === 'application/vnd.ms-excel' ||
    current?.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    /\.(csv|xlsx?|xlsm|xlsb)$/i.test(current?.filename ?? '')

  // DOCX detection — mammoth only supports the modern `.docx` zip format.
  // Legacy binary `.doc` still falls through to the file-info card; no
  // reliable client-side parser exists for that format.
  const isDocx =
    current?.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    /\.docx$/i.test(current?.filename ?? '')

  // Image transform state — reset whenever the viewed attachment changes.
  const [zoom, setZoom] = useState(1)
  const [rotate, setRotate] = useState(0)
  useEffect(() => {
    setZoom(1)
    setRotate(0)
  }, [current?.id])

  // Block Ctrl/Cmd + S (save) and Ctrl/Cmd + P (print) while the dialog is open.
  // Also handle left/right arrow keys for carousel navigation. Plus block
  // DevTools / View-source / Save / Print keystrokes while the preview is
  // open. Scope is the dialog only: listener is attached on `open === true`
  // and removed on close — no impact on the rest of the app.
  //
  // Why `e.code` instead of `e.key` for the inspect shortcuts: on macOS,
  // holding Option mutates the typed character (Option+I → "ˆ", Option+J →
  // "∆", Option+C → "ç", Option+U → "¨"). The physical key stays the same,
  // so `e.code === 'KeyI'` reliably matches regardless of OS or modifier.
  //
  // Shortcuts covered:
  //   • F12                          → DevTools (Win / Linux / Chromebook)
  //   • Ctrl+Shift+I / Cmd+Opt+I     → DevTools Inspect (Win/Linux / Mac)
  //   • Ctrl+Shift+J / Cmd+Opt+J     → DevTools Console
  //   • Ctrl+Shift+C / Cmd+Opt+C     → DevTools Pick-element
  //   • Ctrl+U / Cmd+Opt+U           → View page source
  //   • Ctrl/Cmd + S                 → Save page
  //   • Ctrl/Cmd + P                 → Print
  //
  // Hard limit: client-side cannot disable the browser's application menu
  // (View → Developer → Inspect) nor hide URLs from the Network tab. This
  // is a friction layer, not a guarantee.
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      const cmdOrCtrl = e.ctrlKey || e.metaKey
      const optOrShift = e.altKey || e.shiftKey

      // Save / Print
      if (cmdOrCtrl && (e.code === 'KeyS' || e.code === 'KeyP')) {
        e.preventDefault()
        e.stopPropagation()

        return
      }

      // DevTools (F12, Ctrl+Shift+I/J/C, Cmd+Opt+I/J/C)
      const isDevTools =
        e.code === 'F12' ||
        (cmdOrCtrl && optOrShift && (e.code === 'KeyI' || e.code === 'KeyJ' || e.code === 'KeyC'))
      if (isDevTools) {
        e.preventDefault()
        e.stopPropagation()

        return
      }

      // View page source (Ctrl+U / Cmd+Opt+U)
      if (cmdOrCtrl && e.code === 'KeyU') {
        e.preventDefault()
        e.stopPropagation()

        return
      }

      // Carousel nav
      if (hasCarousel) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          setCurrentIndex(i => Math.max(0, i - 1))
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          setCurrentIndex(i => Math.min((attachments?.length ?? 1) - 1, i + 1))
        }
      }
    }
    window.addEventListener('keydown', handler, true)

    return () => window.removeEventListener('keydown', handler, true)
  }, [open, hasCarousel, attachments?.length])

  const sizeKb = useMemo(() => {
    if (!current?.size) return null

    return current.size >= 1024 * 1024
      ? `${(current.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(current.size / 1024).toFixed(0)} KB`
  }, [current?.size])

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
            bgcolor: 'rgba(0, 0, 0, 0.95)',
            position: 'relative',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            color: 'common.white'
          },
          onContextMenu: (e: any) => e.preventDefault()
        }
      }}
    >
      {/* Header: filename + size + counter + close */}
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
            {current?.filename ?? 'Preview'}
          </Typography>
          {sizeKb ? (
            <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {sizeKb}
            </Typography>
          ) : null}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          {hasCarousel && (
            <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 36, textAlign: 'center' }}>
              {currentIndex + 1} / {attachments.length}
            </Typography>
          )}
          <IconButton size='medium' onClick={onClose} aria-label='Close preview' sx={{ color: 'common.white' }}>
            <Icon icon='mdi:close' fontSize='1.5rem' />
          </IconButton>
        </Box>
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
        {!current ? null : current.type === 'image' ? (
          <Box
            component='img'
            src={current.url}
            alt={current.filename}
            draggable={false}
            onContextMenu={(e: any) => e.preventDefault()}
            sx={
              {
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                transform: `scale(${zoom}) rotate(${rotate}deg)`,
                transition: 'transform 200ms ease',
                cursor: zoom > 1 ? 'move' : 'zoom-in',
                userSelect: 'none',
                WebkitUserDrag: 'none',
                pointerEvents: 'auto'
              } as any
            }
            onClick={() => (zoom === 1 ? handleZoomIn() : null)}
          />
        ) : current.type === 'video' ? (
          <Box
            component='video'
            src={current.url}
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
          // PDF rendered to <canvas> via the dynamic PdfPreview component —
          // no <iframe>, so the browser's native PDF viewer chrome (with
          // its Save/Print/Inspect context menu) never enters the DOM.
          // Component is dynamic + ssr:false because react-pdf / pdfjs-dist
          // touches DOMMatrix at module-evaluation time (SSR-incompatible).
          <PdfPreview url={current.url} attachmentId={current.id} />
        ) : isSpreadsheet ? (
          // CSV / XLSX / XLS — parsed client-side via SheetJS and rendered
          // as a plain MUI <Table>. No iframe, no native viewer chrome.
          <SpreadsheetPreview
            url={current.url}
            filename={current.filename}
            attachmentId={current.id}
          />
        ) : isDocx ? (
          // DOCX — converted to HTML client-side via mammoth and rendered
          // inside a sanitized container. Legacy .doc binary falls through
          // to the file-info card (no client-side parser exists).
          <DocxPreview url={current.url} attachmentId={current.id} />
        ) : (
          // Non-image, non-video, non-audio, non-PDF document → file-info card.
          <Box sx={{ textAlign: 'center', color: 'common.white', maxWidth: 360 }}>
            <Icon icon='mdi:file-document-outline' fontSize='4rem' />
            <Typography sx={{ mt: 2, fontWeight: 600 }}>{current.filename}</Typography>
            {sizeKb ? (
              <Typography variant='caption' sx={{ display: 'block', opacity: 0.7, mt: 0.5 }}>
                {sizeKb}
              </Typography>
            ) : null}
            <Typography variant='caption' sx={{ display: 'block', opacity: 0.7, mt: 1 }}>
              Preview not available for this file type
            </Typography>
          </Box>
        )}
      </Box>

      {/* Carousel prev/next arrows — shown only when carousel is active */}
      {hasCarousel && (
        <>
          <IconButton
            aria-label='Previous'
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            sx={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'common.white',
              bgcolor: 'rgba(255,255,255,0.12)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
              '&.Mui-disabled': { color: 'rgba(255,255,255,0.2)' },
              zIndex: 3
            }}
          >
            <Icon icon='mdi:chevron-left' fontSize='2rem' />
          </IconButton>
          <IconButton
            aria-label='Next'
            onClick={() => setCurrentIndex(i => Math.min(attachments.length - 1, i + 1))}
            disabled={currentIndex === attachments.length - 1}
            sx={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'common.white',
              bgcolor: 'rgba(255,255,255,0.12)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
              '&.Mui-disabled': { color: 'rgba(255,255,255,0.2)' },
              zIndex: 3
            }}
          >
            <Icon icon='mdi:chevron-right' fontSize='2rem' />
          </IconButton>
        </>
      )}

      {/* Footer: image controls (zoom + rotate). Only for image previews. */}
      {current?.type === 'image' ? (
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
            <IconButton size='medium' onClick={handleRotate} sx={{ color: 'common.white' }} aria-label='Rotate'>
              <Icon icon='mdi:rotate-right' fontSize='1.5rem' />
            </IconButton>
          </Tooltip>
        </Box>
      ) : null}
    </Dialog>
  )
}

export default AttachmentPreviewDialog
