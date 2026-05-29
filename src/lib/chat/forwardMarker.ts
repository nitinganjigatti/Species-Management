// Client-side forwarded-message marker.
//
// The chat SDK has no `isForwarded` field on Message and no
// `forwardedFromMessageId` on SendMessagePayload, so we encode the
// "Forwarded" state inside the message text itself. Both sender and
// recipient clients running this codebase parse the marker, strip it
// from the displayed body, and render <ForwardedTag /> above the bubble.
//
// The sentinel is zero-width-bracketed so any client that fails to strip
// it (e.g. an older build) renders an invisible glyph rather than a
// jarring "[fwd]" label.
//
// Mobile uses [ANTZ_FWD] (no zero-width padding). We recognise and strip
// all known variants so cross-platform forwards render correctly.

export const FORWARD_MARKER = '​[fwd]​'

// Regex matching any known forward marker at the start of a message,
// tolerating zero-width wrapper characters the server emits around [fwd].
// Recognised patterns (case-insensitive):
//   ​[fwd]​ — web sentinel (ZW-wrapped)
//   [ANTZ_FWD]        — mobile sentinel
//   [fwd]             — server bare form
//   [forwarded]       — server alternate
//   [forward]         — server alternate
// Zero-width chars: ZWSP U+200B, ZWNJ U+200C, ZWJ U+200D, WJ U+2060, BOM U+FEFF, SHY U+00AD
const ZW_CHARS = '​‌‍⁠﻿­'
const FORWARD_PREFIX_RE = new RegExp(
  `^[${ZW_CHARS}]*\\[(fwd|forwarded|forward|antz_fwd)\\][${ZW_CHARS}]*`,
  'i'
)

// True when the given message text starts with any known forward marker.
// Safe on undefined / null / empty inputs.
export const isForwarded = (text?: string | null): boolean => {
  if (!text) return false

  return FORWARD_PREFIX_RE.test(text)
}

// Returns the displayable body for a forwarded message. Strips the marker
// (and any zero-width wrappers + one optional leading newline) from the start.
// If the input carries no recognised marker, returns it unchanged.
export const stripForwardMarker = (text?: string | null): string => {
  if (!text) return ''
  const match = text.match(FORWARD_PREFIX_RE)
  if (!match) return text
  const rest = text.slice(match[0].length)

  return rest.startsWith('\n') ? rest.slice(1) : rest
}

// Compose the outgoing text for a forward. Always emits exactly one
// marker — re-forwarding an already-forwarded message strips the
// existing marker first so we don't stack them.
export const composeForwardedText = (sourceText?: string | null): string => {
  const body = stripForwardMarker(sourceText).trim()
  if (!body) return FORWARD_MARKER

  return `${FORWARD_MARKER}\n${body}`
}

// True when the message text has a visible body after the marker is
// stripped. Used for routing decisions in ChatLog / MessageBubble — a
// marker-only payload (forwarded attachment-only message) should be
// treated as "no text" so the attachment-only render path kicks in.
export const hasDisplayableText = (text?: string | null): boolean => {
  return stripForwardMarker(text).trim().length > 0
}
