'use client'

// DOCX preview — uses `docx-preview` to render the .docx into a target
// container with much higher visual fidelity than mammoth (preserves
// fonts, indentation, page breaks, table styles, inline images).
//
// API shape: `renderAsync(data, container, styleContainer?, options?)` —
// the library writes DOM directly into the container we pass via ref.
// That's why this component manages a `containerRef` instead of holding
// HTML in state.
//
// Same dynamic + ssr:false wrapping in the parent dialog as PdfPreview /
// SpreadsheetPreview — docx-preview pulls in JSZip + DOM APIs that aren't
// SSR-safe.

import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'

import { renderAsync } from 'docx-preview'

interface Props {
  url: string
  /** Reset on attachment change so reopening a different doc clears the previous render. */
  attachmentId?: string
}

const DocxPreview = ({ url, attachmentId }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    // Clear the container before re-rendering for a new attachment.
    if (containerRef.current) containerRef.current.innerHTML = ''

    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)

        return r.arrayBuffer()
      })
      .then(buf => {
        if (cancelled) return null
        if (!containerRef.current) return null

        return renderAsync(buf, containerRef.current, undefined, {
          className: 'docx-preview-wrapper',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          experimental: false,
          useBase64URL: true
        })
      })
      .then(() => {
        if (cancelled) return
        setLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        // eslint-disable-next-line no-console
        console.error('[chat:docx] failed to load:', err)
        setError('Failed to load document')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [url, attachmentId])

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 900,
        maxHeight: '85vh',
        overflow: 'auto',
        bgcolor: 'common.white',
        color: 'text.primary',
        borderRadius: 1,
        p: 2,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        // docx-preview emits a wrapped <section class="docx"> with a default
        // page shadow + 1px outline + margin to simulate a Word page. Strip
        // those so the preview blends into our dialog (white-on-dark).
        '& .docx-preview-wrapper': { margin: '0 auto', background: 'transparent' },
        '& section.docx': {
          boxShadow: 'none !important',
          border: 'none !important',
          outline: 'none !important',
          margin: '0 auto 16px !important',
          padding: '16px !important',
          background: 'transparent !important'
        }
      }}
      onContextMenu={(e: any) => e.preventDefault()}
      // Click guard — `docx-preview` doesn't sanitize anchor href values
      // (neither did mammoth). A malicious `.docx` could embed
      // `<a href="javascript:...">` and execute in our page's context if a
      // user clicks. Block any anchor whose href isn't an http(s) or
      // mailto link before navigation happens. Scoped to the container so
      // legitimate external links still open in a new tab.
      onClick={(e: any) => {
        const anchor = (e.target as HTMLElement)?.closest?.('a') as HTMLAnchorElement | null
        if (!anchor) return
        const href = anchor.getAttribute('href') ?? ''
        const safe = /^(https?:|mailto:|#)/i.test(href)
        if (!safe) {
          e.preventDefault()
          e.stopPropagation()
        } else {
          // Open external links in a new tab without leaking the referrer
          // and without giving the new context access to `window.opener`.
          anchor.setAttribute('target', '_blank')
          anchor.setAttribute('rel', 'noopener noreferrer')
        }
      }}
    >
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      ) : null}
      {error ? (
        <Typography sx={{ textAlign: 'center', py: 4 }}>{error}</Typography>
      ) : null}
      <div ref={containerRef} />
    </Box>
  )
}

export default DocxPreview
