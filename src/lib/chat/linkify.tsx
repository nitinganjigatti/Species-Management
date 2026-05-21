'use client'

// Detects URLs / emails / `+`-prefixed phone numbers in a message body
// and renders them as clickable anchors. Inline regex (no dependency)
// so the matcher stays auditable and supply-chain-free.
//
// Phone heuristic is conservative — only matches numbers that explicitly
// start with `+`, avoiding false-positives on staff IDs, quantities, and
// serial numbers. Bare local numbers stay as plain text.
//
// The renderer threads an optional `renderText` callback so callers can
// keep existing per-text-segment processing (e.g. search-match highlighting)
// without having it accidentally wrap link segments.

import { Fragment, ReactNode } from 'react'
import Box from '@mui/material/Box'

export type LinkKind = 'url' | 'email' | 'tel'

export type LinkSegment =
  | { kind: 'text'; value: string }
  | { kind: LinkKind; value: string; href: string }

// One alternation pattern so a single regex scan finds the first hit at
// every position. Group order maps to the kind detection below.
//   1: http(s):// URL
//   2: www. URL (auto-prefixed to https:// for href)
//   3: email
//   4: + phone (international format, allows spaces/dashes/parens)
const SMART_LINK_RE =
  /(https?:\/\/[^\s<>"']+)|(www\.[^\s<>"']+\.[^\s<>"']+)|([A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+)|(\+\d[\d\s\-().]{6,}\d)/g

// Trailing punctuation that's almost always sentence-level, not part of
// the URL/email/phone itself. Strip it from the matched value so the
// link target is clean (and so we keep the punctuation in plain text).
const TRAILING_PUNCT_RE = /[.,;:!?]+$/

// Strip an unmatched closing paren — "(see https://example.com)" should
// not include the trailing `)` in the link. Only strip if there's no
// matching `(` already inside the captured value.
const stripUnmatchedTrailingParen = (s: string): string => {
  if (!s.endsWith(')')) return s
  const opens = (s.match(/\(/g) ?? []).length
  const closes = (s.match(/\)/g) ?? []).length

  return closes > opens ? s.slice(0, -1) : s
}

const cleanMatch = (raw: string): string => {
  let v = raw.replace(TRAILING_PUNCT_RE, '')
  v = stripUnmatchedTrailingParen(v)

  return v
}

const buildHref = (kind: LinkKind, value: string): string => {
  if (kind === 'email') return `mailto:${value}`
  if (kind === 'tel') return `tel:${value.replace(/[\s\-().]/g, '')}`
  // url
  if (/^https?:\/\//i.test(value)) return value

  return `https://${value}`
}

export const tokenizeLinks = (text: string): LinkSegment[] => {
  if (!text) return []
  const out: LinkSegment[] = []
  let lastIndex = 0

  SMART_LINK_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = SMART_LINK_RE.exec(text)) !== null) {
    const fullMatch = m[0]
    // Determine kind from which capture group fired.
    let kind: LinkKind
    if (m[1]) kind = 'url'
    else if (m[2]) kind = 'url'
    else if (m[3]) kind = 'email'
    else kind = 'tel'

    const cleaned = cleanMatch(fullMatch)
    const matchStart = m.index
    const matchEnd = matchStart + cleaned.length

    // Push the text before the match.
    if (matchStart > lastIndex) {
      out.push({ kind: 'text', value: text.slice(lastIndex, matchStart) })
    }

    out.push({ kind, value: cleaned, href: buildHref(kind, cleaned) })

    // Rewind the regex cursor past the cleaned value so any stripped
    // trailing punctuation lands back in the following text segment.
    lastIndex = matchEnd
    SMART_LINK_RE.lastIndex = matchEnd
  }

  if (lastIndex < text.length) {
    out.push({ kind: 'text', value: text.slice(lastIndex) })
  }

  return out
}

interface LinkifyTextProps {
  text: string
  // Per-text-segment renderer. Used to keep existing transforms (e.g.
  // search-match highlighting) confined to non-link segments. Defaults
  // to identity.
  renderText?: (segment: string) => ReactNode
  // When the text sits on the sender's primary-colored bubble we use a
  // white-ish underline rather than primary.main, which would clash.
  isSender?: boolean
}

const LinkifyText = ({ text, renderText, isSender = false }: LinkifyTextProps) => {
  const segments = tokenizeLinks(text)
  const renderSegment = renderText ?? ((s: string) => s)

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.kind === 'text') {
          return <Fragment key={i}>{renderSegment(seg.value)}</Fragment>
        }

        const isExternal = seg.kind === 'url'

        return (
          <Box
            component='a'
            key={i}
            href={seg.href}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            // Anchor inherits bubble text color so it reads correctly on
            // both incoming (dark text) and outgoing (white text) bubbles.
            // Underline is the only consistent visual affordance across
            // both backgrounds.
            sx={{
              color: 'inherit',
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
              cursor: 'pointer',
              fontWeight: 500,
              '&:hover': {
                textDecoration: 'underline',
                opacity: isSender ? 0.85 : 1,
                color: isSender ? 'inherit' : 'primary.main'
              }
            }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {seg.value}
          </Box>
        )
      })}
    </>
  )
}

export default LinkifyText
