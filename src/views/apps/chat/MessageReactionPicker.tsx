'use client'

import { useState, MouseEvent } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Popover from '@mui/material/Popover'
import toast from 'react-hot-toast'

// ** Redux
import { useSelector } from 'react-redux'
import type { RootState } from 'src/store'

// ** SDK — only `add_reaction` is documented as ack'd. The chat backend
// treats a re-emit with the same emoji as a toggle (server removes if the
// user already reacted), so both ADD and REMOVE go through this one call.
// State for both sides lands via the `reaction_updated` broadcast.
import { addReactionOverSocket } from 'src/lib/chat/api'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Types
import type { ChatLogChatType } from 'src/types/apps/chatTypes'

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

interface Props {
  chat: ChatLogChatType
  isSender: boolean
  // Use to keep the icon visible while the parent bubble is hovered. CSS
  // `.msg-actions { opacity: 0 }` plus parent `:hover .msg-actions { opacity: 1 }`
  // also works, and is the path used by callers.
}

/**
 * Standalone WhatsApp-style reaction trigger — a single 😀 icon outside the
 * bubble. Click opens a 6-emoji quick-pick popover. Reused by:
 *   - MessageBubble (text messages)
 *   - ChatLog (attachment-only messages)
 *
 * Decoupled from the main 3-dot menu so the parent can position them
 * independently (emoji icon outside, chevron inside the bubble).
 */
const MessageReactionPicker = ({ chat, isSender }: Props) => {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)
  const open = Boolean(anchor)
  const currentUserId = useSelector((s: RootState) => s.chat?.userProfile?.id ?? null)

  const handleOpen = (e: MouseEvent<HTMLButtonElement>) => setAnchor(e.currentTarget)
  const handleClose = () => setAnchor(null)

  const handleToggleReaction = (emoji: string) => {
    handleClose()
    if (!chat.id) return
    const me = currentUserId != null ? String(currentUserId) : ''
    const existing = chat.reactions?.find(r => r.emoji === emoji)
    const alreadyReacted = !!(existing && me && existing.userIds.includes(me))
    // Single call for both add and remove — server-side toggle. The
    // `alreadyReacted` check is kept above only so future code can still
    // branch UI behaviour on it if needed.
    void alreadyReacted
    addReactionOverSocket(chat.id, emoji).catch((err: unknown) => {
      console.error('[chat] toggle reaction failed:', err)
      toast.error('Reaction failed')
    })
  }

  return (
    <>
      <IconButton
        size='small'
        aria-label='React to message'
        className='msg-actions'
        data-open={open ? 'true' : 'false'}
        onClick={handleOpen}
        disabled={!chat.id}
        sx={{
          // Hidden by default; parent `&:hover .msg-actions { opacity: 1 }`
          // reveals on bubble hover. Inline override keeps it visible while
          // the popover is open.
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 150ms ease',
          color: 'customColors.Outline',
          bgcolor: 'background.paper',
          boxShadow: 1,
          '&:hover': { bgcolor: 'background.paper' }
        }}
      >
        <Icon icon='mdi:emoticon-happy-outline' fontSize='1.125rem' />
      </IconButton>

      <Popover
        anchorEl={anchor}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: isSender ? 'right' : 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: isSender ? 'right' : 'left' }}
        slotProps={{ paper: { sx: { px: 1, py: 0.5, borderRadius: 999 } } }}
      >
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {QUICK_REACTIONS.map(emoji => (
            <IconButton
              key={emoji}
              size='small'
              aria-label={`React with ${emoji}`}
              onClick={() => handleToggleReaction(emoji)}
              sx={{ fontSize: '1.25rem' }}
            >
              <span>{emoji}</span>
            </IconButton>
          ))}
        </Box>
      </Popover>
    </>
  )
}

export default MessageReactionPicker
