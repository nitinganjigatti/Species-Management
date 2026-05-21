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

export const FORWARD_MARKER = '​[fwd]​'

// True when the given message text starts with the forward marker.
// Safe on undefined / null / empty inputs.
export const isForwarded = (text?: string | null): boolean => {
  if (!text) return false

  return text.startsWith(FORWARD_MARKER)
}

// Returns the displayable body for a forwarded message. Strips the marker
// and a single leading newline (the separator we insert at send time).
// If the input doesn't carry the marker, returns it unchanged.
export const stripForwardMarker = (text?: string | null): string => {
  if (!text) return ''
  if (!text.startsWith(FORWARD_MARKER)) return text
  const rest = text.slice(FORWARD_MARKER.length)

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
