'use client'

import { ChangeEvent, KeyboardEvent } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import InputBase from '@mui/material/InputBase'
import CircularProgress from '@mui/material/CircularProgress'

// ** Icon
import Icon from 'src/@core/components/icon'

// ** Sidebar primitive (same one UserProfileRight uses)
import Sidebar from 'src/@core/components/sidebar'

// Lightweight projection of an SDK Message — only the fields we render
// in the result list. ChatContent does this adaptation when building
// the `results` prop so this component stays display-only.
export type SearchResultItem = {
  id: string
  text: string
  senderId?: string
  senderName?: string
  sentAt?: string
  hasAttachment?: boolean
}

interface SearchMessagesDrawerProps {
  open: boolean
  onClose: () => void
  peerName: string
  query: string
  onQueryChange: (q: string) => void
  results: SearchResultItem[]
  loading: boolean
  /** Fires when the user clicks a result row. ChatContent reuses
   *  the existing `scrollTargetMessageId` mechanism to jump + flash. */
  onResultClick: (messageId: string) => void
  /** ID of the currently-focused result (drives the "active" highlight
   *  in the list). Optional — when omitted the list shows no focus. */
  activeMessageId?: string | null
  /** Width passed by the parent so the drawer can match the
   *  UserProfileRight width on the same viewport. */
  width?: number
}

/**
 * WhatsApp-Web-style right-side drawer for searching messages inside
 * a conversation. The drawer is "controlled" — ChatContent owns the
 * search state so the in-bubble highlight in ChatLog (which reads
 * `searchQuery` + `searchResultIds`) stays in sync. The drawer only
 * renders the input + result list.
 */
const SearchMessagesDrawer = ({
  open,
  onClose,
  peerName,
  query,
  onQueryChange,
  results,
  loading,
  onResultClick,
  activeMessageId,
  width = 370
}: SearchMessagesDrawerProps) => {
  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  // Format a sentAt ISO into compact WhatsApp-Web-style time:
  //   today → "3:42 PM"
  //   yesterday → "Yesterday"
  //   older → "DD/MM/YYYY"
  const formatResultTime = (iso?: string): string => {
    if (!iso) return ''
    const t = new Date(iso)
    if (Number.isNaN(t.getTime())) return ''
    const now = new Date()
    const sameDay =
      t.getFullYear() === now.getFullYear() && t.getMonth() === now.getMonth() && t.getDate() === now.getDate()
    if (sameDay) return t.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const isYesterday =
      t.getFullYear() === yesterday.getFullYear() &&
      t.getMonth() === yesterday.getMonth() &&
      t.getDate() === yesterday.getDate()
    if (isYesterday) return 'Yesterday'

    return t.toLocaleDateString()
  }

  return (
    <Sidebar
      direction='right'
      show={open}
      backDropClick={onClose}
      sx={{
        zIndex: 9,
        height: '100%',
        width,
        borderTopRightRadius: theme => theme.shape.borderRadius,
        borderBottomRightRadius: theme => theme.shape.borderRadius,
        '& + .MuiBackdrop-root': {
          zIndex: 8,
          borderRadius: 1
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'background.paper' }}>
        {/* Header — × close + "Search messages" title (left-aligned to
            match the WhatsApp Web design). */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 3,
            py: 3.5,
            borderBottom: theme => `1px solid ${theme.palette.divider}`,
            flexShrink: 0
          }}
        >
          <IconButton size='small' onClick={onClose} sx={{ color: 'text.secondary' }}>
            <Icon icon='mdi:close' fontSize='1.25rem' />
          </IconButton>
          <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>Search messages</Typography>
        </Box>

        {/* Search input — pill style with a leading magnifier. */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 3,
            py: 2,
            flexShrink: 0
          }}
        >
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 1,
              borderRadius: 999,
              backgroundColor: 'action.hover'
            }}
          >
            <Icon icon='mdi:magnify' fontSize='1.125rem' color='customColors.Outline' />
            <InputBase
              autoFocus
              placeholder='Search'
              value={query}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onQueryChange(e.target.value)}
              onKeyDown={handleKey}
              sx={{ flex: 1, fontSize: '0.875rem' }}
            />
            {query ? (
              <IconButton size='small' onClick={() => onQueryChange('')} sx={{ p: 0.25 }}>
                <Icon icon='mdi:close-circle' fontSize='1rem' color='customColors.Outline' />
              </IconButton>
            ) : null}
          </Box>
        </Box>

        {/* Body — empty state / spinner / results list. */}
        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {!query.trim() ? (
            <Box sx={{ pt: 6, textAlign: 'center', px: 3 }}>
              <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                Search for messages with {peerName || 'this chat'}.
              </Typography>
            </Box>
          ) : loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
              <CircularProgress size={24} />
            </Box>
          ) : results.length === 0 ? (
            <Box sx={{ pt: 6, textAlign: 'center', px: 3 }}>
              <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                No messages found
              </Typography>
            </Box>
          ) : (
            <Box>
              {results.map(r => {
                const isActive = activeMessageId === r.id

                return (
                  <Box
                    key={r.id}
                    onClick={() => onResultClick(r.id)}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                      px: 3,
                      py: 1.5,
                      cursor: 'pointer',
                      borderBottom: theme => `1px solid ${theme.palette.divider}`,
                      backgroundColor: isActive ? 'action.selected' : 'transparent',
                      '&:hover': { backgroundColor: 'action.hover' },
                      transition: 'background-color 150ms'
                    }}
                  >
                    {/* Top line: sender on left, time on right */}
                    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1 }}>
                      <Typography
                        variant='caption'
                        sx={{
                          fontWeight: 600,
                          color: 'customColors.OnSurfaceVariant',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          minWidth: 0
                        }}
                      >
                        {r.senderName || 'Unknown'}
                      </Typography>
                      <Typography variant='caption' sx={{ color: 'text.secondary', flexShrink: 0 }}>
                        {formatResultTime(r.sentAt)}
                      </Typography>
                    </Box>
                    {/* Snippet — highlight the matched substring. Falls
                        back to "📎 Attachment" when the match is in an
                        attachment-only message. */}
                    <Typography
                      variant='body2'
                      sx={{
                        color: 'customColors.OnSurfaceVariant',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        wordBreak: 'break-word'
                      }}
                    >
                      {r.text ? (
                        <SearchHighlight text={r.text} query={query} />
                      ) : r.hasAttachment ? (
                        '📎 Attachment'
                      ) : (
                        ''
                      )}
                    </Typography>
                  </Box>
                )
              })}
            </Box>
          )}
        </Box>
      </Box>
    </Sidebar>
  )
}

/**
 * Wraps occurrences of `query` (case-insensitive) inside `text` with a
 * highlighted `<mark>` so the user sees what matched in the snippet.
 * Falls back to plain text when the query isn't present (e.g. the match
 * was in a different field on the server side).
 */
const SearchHighlight = ({ text, query }: { text: string; query: string }) => {
  const q = query.trim()
  if (!q) return <>{text}</>
  const lowerText = text.toLowerCase()
  const lowerQ = q.toLowerCase()
  const idx = lowerText.indexOf(lowerQ)
  if (idx < 0) return <>{text}</>

  return (
    <>
      {text.slice(0, idx)}
      <Box
        component='mark'
        sx={{ backgroundColor: 'warning.light', color: 'inherit', borderRadius: 0.5, px: 0.25 }}
      >
        {text.slice(idx, idx + q.length)}
      </Box>
      {text.slice(idx + q.length)}
    </>
  )
}

export default SearchMessagesDrawer
