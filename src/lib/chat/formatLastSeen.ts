// Shared formatter for "last seen X" copy. Consumed by the chat header
// ([ChatContent.tsx]) and the DM profile drawer ([UserProfileRight.tsx]).
//
// Returns `null` when the ISO string is missing or unparseable — callers
// fall back to alternative copy (role label, generic name, etc.).
//
// 12-hour clock with AM/PM is forced (not locale-dependent) for visual
// consistency across browsers / system locales.
//
// Output shape:
//   today      → "last seen today at 2:30 PM"
//   yesterday  → "last seen yesterday at 11:05 AM"
//   older      → "last seen 12/04/2026 at 9:14 PM"

export function formatLastSeen(iso?: string | null): string | null {
  if (!iso) return null
  const seen = new Date(iso)
  if (Number.isNaN(seen.getTime())) return null

  const now = new Date()
  const sameDay =
    seen.getFullYear() === now.getFullYear() &&
    seen.getMonth() === now.getMonth() &&
    seen.getDate() === now.getDate()

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    seen.getFullYear() === yesterday.getFullYear() &&
    seen.getMonth() === yesterday.getMonth() &&
    seen.getDate() === yesterday.getDate()

  const time = seen.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })

  if (sameDay) return `last seen today at ${time}`
  if (isYesterday) return `last seen yesterday at ${time}`

  return `last seen ${seen.toLocaleDateString()} at ${time}`
}
