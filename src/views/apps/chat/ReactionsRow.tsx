'use client'

// ** MUI
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

// ** Redux — read current user id so we can highlight "you reacted" chips.
import { useSelector } from 'react-redux'
import type { RootState } from 'src/store'

// ** Types
import type { ChatLogChatType } from 'src/types/apps/chatTypes'
import toggleSingleReaction from 'src/views/apps/chat/toggleSingleReaction'

interface ReactionsRowProps {
  chat: ChatLogChatType
  isSender: boolean
  canInteract?: boolean
}

/**
 * Existing-reactions chip row. Rendered below a message bubble OR below
 * an attachment-only column. Lives in its own component so the
 * MessageBubble and the attachment-only path in ChatLog both render the
 * same chips — without that sharing, attachment-only messages (image /
 * pdf / video) silently swallowed their reactions because MessageBubble
 * returns `null` for them.
 */
const ReactionsRow = ({ chat, isSender, canInteract = true }: ReactionsRowProps) => {
  const currentUserId = useSelector((s: RootState) => s.chat?.userProfile?.id ?? null)

  if (!chat.reactions?.length) return null

  const handleToggleReaction = (emoji: string) => {
    if (!chat.id || !canInteract) return
    toggleSingleReaction({ chat, currentUserId, emoji }).catch((err: unknown) => {
      console.error('[chat] toggle reaction failed:', err)
    })
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.5,
        ml: isSender ? 'auto' : 0,
        mr: isSender ? 0 : 'auto',
        // Negative top margin pulls the row up so the chip overlaps the
        // bottom of the bubble / attachment column — gives the "tucked"
        // look where the chip peeks onto the card edge.
        mt: '-6px'
      }}
    >
      {chat.reactions.map(r => {
        const me = currentUserId != null ? String(currentUserId) : ''
        const youReacted = !!(me && r.userIds.includes(me))

        return (
          <Chip
            key={r.emoji}
            size='small'
            onClick={canInteract ? () => handleToggleReaction(r.emoji) : undefined}
            label={
              <Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                <span>{r.emoji}</span>
                <Typography component='span' variant='caption'>
                  {r.count}
                </Typography>
              </Box>
            }
            sx={{
              height: 22,
              cursor: canInteract ? 'pointer' : 'default',
              border: 0,
              backgroundColor: 'common.white',
              // Keep a faint "you reacted" hint via the count text without
              // re-introducing a border or coloured fill.
              fontWeight: youReacted ? 600 : 400,
              '&:hover': canInteract ? { backgroundColor: theme => theme.palette.grey[100] } : undefined,
              '& .MuiChip-label': { px: '8px' }
            }}
          />
        )
      })}
    </Box>
  )
}

export default ReactionsRow
