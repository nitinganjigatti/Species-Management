'use client'

// ** React Imports
import { Fragment, useEffect, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Popover from '@mui/material/Popover'
import Typography from '@mui/material/Typography'

// ** Toast
import toast from 'react-hot-toast'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Chat API
import { unpinMessageOverSocket } from 'src/lib/chat/api'

// ** Types
import type { SelectedChatType } from 'src/types/apps/chatTypes'

interface PinnedMessagesStripProps {
  selectedChat: NonNullable<SelectedChatType>
  onScrollToMessage: (messageId: string) => void
}

/**
 * WhatsApp-Web style pinned-messages strip that sits above the chat log.
 *
 *  - Shows the current pinned message preview with a pin icon on the left.
 *  - When there are multiple pinned messages, vertical indicator bars are
 *    rendered next to the pin icon. Clicking the strip cycles to the next
 *    pinned message and scrolls the chat to it.
 *  - The chevron on the right opens a small dropdown with two actions for
 *    the CURRENTLY displayed pinned message: Unpin + Go to message.
 *
 * Unpin permission mirrors the per-bubble menu — DMs always allow either
 * side; groups allow any active member (matches WhatsApp behavior).
 */
const PinnedMessagesStrip = ({ selectedChat, onScrollToMessage }: PinnedMessagesStripProps) => {
  const [pinnedIndex, setPinnedIndex] = useState<number>(0)
  const [pinnedListAnchor, setPinnedListAnchor] = useState<HTMLElement | null>(null)

  const pinned = selectedChat.chat.messages.filter(m => m.isPinned && m.id)
  const pinnedCount = pinned.length

  // Snap to the latest pinned message whenever the count changes — covers
  // both "new pin arrived" and "current pin was removed" cases. Without
  // this, the index could be stranded past the end of the array.
  useEffect(() => {
    if (pinnedCount === 0) {
      setPinnedIndex(0)

      return
    }
    setPinnedIndex(pinnedCount - 1)
  }, [pinnedCount])

  // Reset when the selected conversation changes — each chat has its own
  // pinned list, and the count effect re-snaps to latest after.
  useEffect(() => {
    setPinnedIndex(0)
  }, [selectedChat.contact.id])

  if (!pinnedCount) return null

  // Clamp the index against a race between unpin → reducer → re-render.
  const safeIndex = Math.max(0, Math.min(pinnedIndex, pinnedCount - 1))
  const current = pinned[safeIndex]
  const hasMultiple = pinnedCount > 1

  const isGroupChat = selectedChat.contact.isGroup === true
  // Any active group member can pin/unpin. DMs always allow it. Kicked
  // members (isCurrentUserActive === false) cannot — the composer + other
  // interaction gates already block them, this keeps pin parity.
  const canPin = isGroupChat ? selectedChat.contact.isCurrentUserActive !== false : true

  const scrollToCurrent = () => {
    if (current.id) onScrollToMessage(current.id)
  }

  const cycleAndScroll = () => {
    const nextIndex = hasMultiple ? (safeIndex + 1) % pinnedCount : safeIndex
    const target = pinned[nextIndex]
    if (hasMultiple) setPinnedIndex(nextIndex)
    if (target.id) onScrollToMessage(target.id)
  }

  const handleUnpinCurrent = () => {
    if (!current.id) return
    unpinMessageOverSocket(current.id).catch(err => {
      console.error('[chat] unpin from strip failed:', err)
      toast.error('Failed to unpin message')
    })
  }

  return (
    <Fragment>
      <Box
        onClick={cycleAndScroll}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 4,
          py: 1.25,
          borderBottom: theme => `1px solid ${theme.palette.divider}`,
          backgroundColor: 'customColors.Surface',
          position: 'relative',
          cursor: 'pointer',
          '&:hover': { backgroundColor: 'action.hover' }
        }}
      >
        {hasMultiple ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'stretch' }}>
            {pinned.map((_, i) => (
              <Box
                key={`pinbar-${i}`}
                sx={{
                  width: '3px',
                  height: `${Math.max(6, 18 / pinnedCount)}px`,
                  borderRadius: '2px',
                  backgroundColor: i === safeIndex ? 'primary.main' : 'text.disabled',
                  opacity: i === safeIndex ? 1 : 0.7
                }}
              />
            ))}
          </Box>
        ) : null}
        <Icon icon='mdi:pin' fontSize='1.125rem' />
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant='caption' noWrap sx={{ display: 'block', color: 'text.secondary' }}>
            {current.message || (current.attachments?.length ? '📎 Attachment' : '')}
          </Typography>
        </Box>
        <IconButton
          size='small'
          aria-label='Pinned message actions'
          onClick={e => {
            e.stopPropagation()
            setPinnedListAnchor(prev => (prev ? null : e.currentTarget))
          }}
          sx={{ p: 0.5, color: 'text.primary' }}
        >
          <Icon icon={pinnedListAnchor ? 'mdi:chevron-up' : 'mdi:chevron-down'} fontSize='1.5rem' />
        </IconButton>
      </Box>

      <Popover
        open={Boolean(pinnedListAnchor)}
        anchorEl={pinnedListAnchor}
        onClose={() => setPinnedListAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              minWidth: 200,
              py: 0.5,
              borderRadius: 1,
              boxShadow: 3
            }
          }
        }}
      >
        {canPin ? (
          <Box
            onClick={() => {
              setPinnedListAnchor(null)
              handleUnpinCurrent()
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 1,
              cursor: 'pointer',
              color: 'text.primary',
              '&:hover': { backgroundColor: 'action.hover' }
            }}
          >
            <Icon icon='mdi:pin-off-outline' fontSize='1.375rem' />
            <Typography variant='body2'>Unpin</Typography>
          </Box>
        ) : null}
        <Box
          onClick={() => {
            setPinnedListAnchor(null)
            scrollToCurrent()
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1,
            cursor: 'pointer',
            color: 'text.primary',
            '&:hover': { backgroundColor: 'action.hover' }
          }}
        >
          <Icon icon='mdi:arrow-right-thin' fontSize='1.375rem' />
          <Typography variant='body2'>Go to message</Typography>
        </Box>
      </Popover>
    </Fragment>
  )
}

export default PinnedMessagesStrip
