'use client'

import { useState } from 'react'

// ** MUI
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// ** Redux — read current user id so we can highlight "you reacted" chips.
import { useSelector } from 'react-redux'
import type { RootState } from 'src/store'

// ** Types
import type { ChatLogChatType } from 'src/types/apps/chatTypes'
import toggleSingleReaction from 'src/views/apps/chat/toggleSingleReaction'
import ReactionDetailDialog from 'src/views/apps/chat/ReactionDetailDialog'

interface ReactionsRowProps {
  chat: ChatLogChatType
  isSender: boolean
  canInteract?: boolean
}

/**
 * Single combined reaction pill — shows all unique emojis + total count in one
 * rounded chip (WhatsApp-style), tucked into the bottom corner of the bubble.
 * Clicking the pill opens a detail dialog showing who reacted with what.
 */
const ReactionsRow = ({ chat, isSender, canInteract = true }: ReactionsRowProps) => {
  const currentUserId = useSelector((s: RootState) => s.chat?.userProfile?.id ?? null)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  if (!chat.reactions?.length) return null

  const totalCount = chat.reactions.reduce((sum, r) => sum + r.count, 0)

  const handleToggleReaction = (emoji: string) => {
    if (!chat.id || !canInteract) return
    toggleSingleReaction({ chat, currentUserId, emoji }).catch((err: unknown) => {
      console.error('[chat] toggle reaction failed:', err)
    })
  }

  return (
    <>
      <Box
        sx={{
          ml: isSender ? 'auto' : 0,
          mr: isSender ? 0 : 'auto',
          mt: '-5px',
          position: 'relative',
          zIndex: 1
        }}
      >
        <Box
          onClick={e => setAnchorEl(e.currentTarget)}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: '4px',
            borderRadius: 999,
            backgroundColor: 'common.white',
            // Outline in the chat background color punches a cutout gap between
            // the pill and the bubble — gives the floating separation effect.
            outline: '2.5px solid #D3EEEB',
            boxShadow: '0 2px 8px 0 rgba(0,0,0,0.15)',
            cursor: 'pointer',
            '&:hover': { backgroundColor: theme => theme.palette.grey[100] }
          }}
        >
          {chat.reactions.map(r => (
            <Box
              key={r.emoji}
              component='span'
              sx={{ fontSize: '1rem', lineHeight: 1, userSelect: 'none' }}
            >
              {r.emoji}
            </Box>
          ))}
          <Typography
            component='span'
            variant='caption'
            sx={{ fontWeight: 600, color: 'text.secondary', lineHeight: 1 }}
          >
            {totalCount}
          </Typography>
        </Box>
      </Box>

      <ReactionDetailDialog
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        reactions={chat.reactions}
        onToggleReaction={canInteract ? handleToggleReaction : undefined}
      />
    </>
  )
}

export default ReactionsRow
