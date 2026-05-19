'use client'

// PDF preview component — isolated in its own file so it can be loaded via
// `next/dynamic({ ssr: false })` from the parent dialog. `pdfjs-dist` (which
// react-pdf wraps) calls `new DOMMatrix(...)` at module evaluation time;
// that API does not exist in Node.js and crashes SSR with
// `DOMMatrix is not defined`. Keeping the import here and importing this
// file dynamically guarantees the module only ever evaluates on the
// client.
//
// react-pdf README also notes the worker source must be set in the same
// module that imports `Document` / `Page` — module-execution order in
// Next.js can otherwise reset it. Both live here.

import { useState } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'

import Icon from 'src/@core/components/icon'

import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface Props {
  url: string
  // Stable key for resetting page state when the previewed attachment
  // changes. Passing the attachment id is the simplest source.
  attachmentId?: string
}

const PdfPreview = ({ url, attachmentId }: Props) => {
  const [pageNumber, setPageNumber] = useState(1)
  const [pageCount, setPageCount] = useState(0)

  return (
    <Box
      key={attachmentId}
      sx={{
        width: '100%',
        maxWidth: 960,
        maxHeight: '100%',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        bgcolor: 'rgba(255,255,255,0.04)',
        borderRadius: 1,
        p: 2,
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
      onContextMenu={(e: any) => e.preventDefault()}
    >
      <Document
        file={url}
        onLoadSuccess={({ numPages }) => {
          setPageCount(numPages)
          setPageNumber(1)
        }}
        loading={<CircularProgress size={32} sx={{ color: 'common.white', my: 4 }} />}
        error={
          <Typography sx={{ color: 'common.white', my: 4 }}>
            Failed to load PDF
          </Typography>
        }
      >
        <Page
          pageNumber={pageNumber}
          // Responsive width — small inset on mobile, larger inset on
          // desktop to leave room for the dialog's side gutters. Floors at
          // 280px so the page is always readable even on narrow phones.
          width={
            typeof window !== 'undefined'
              ? Math.max(280, Math.min(900, window.innerWidth - (window.innerWidth < 600 ? 32 : 200)))
              : 900
          }
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </Document>
      {pageCount > 1 ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'common.white' }}>
          <IconButton
            size='small'
            onClick={() => setPageNumber(p => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            sx={{ color: 'common.white', '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' } }}
            aria-label='Previous page'
          >
            <Icon icon='mdi:chevron-left' fontSize='1.5rem' />
          </IconButton>
          <Typography variant='caption'>
            Page {pageNumber} / {pageCount}
          </Typography>
          <IconButton
            size='small'
            onClick={() => setPageNumber(p => Math.min(pageCount, p + 1))}
            disabled={pageNumber >= pageCount}
            sx={{ color: 'common.white', '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' } }}
            aria-label='Next page'
          >
            <Icon icon='mdi:chevron-right' fontSize='1.5rem' />
          </IconButton>
        </Box>
      ) : null}
    </Box>
  )
}

export default PdfPreview
