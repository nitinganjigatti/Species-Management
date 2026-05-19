'use client'

import { useState, ReactNode } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

// ** Redux (for "did I react?" highlighting on chips)
import { useSelector } from 'react-redux'
import type { RootState } from 'src/store'

// ** SDK
import { addReactionOverSocket, removeReactionOverSocket } from 'src/lib/chat/api'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Per-message interaction surface (3-dot menu, picker, dialog).
import MessageActions from 'src/views/apps/chat/MessageActions'

// ** Types
import type { ChatLogChatType } from 'src/types/apps/chatTypes'

interface MessageBubbleProps {
  chat: ChatLogChatType
  isSender: boolean
  senderName?: string
  senderId?: string | number
  canPin?: boolean
  isSearchMatch?: boolean
  isActiveSearchMatch?: boolean
  searchQuery?: string
}

/**
 * Text bubble + reply snippet + reactions row. The 3-dot menu and reaction
 * picker live in <MessageActions />, which is reused by ChatLog for
 * attachment-only bubbles too.
 */
const MessageBubble = ({ chat, isSender, senderName, senderId, canPin, isSearchMatch, isActiveSearchMatch, searchQuery }: MessageBubbleProps) => {
  const [hovered, setHovered] = useState(false)
  const currentUserId = useSelector((s: RootState) => s.chat?.userProfile?.id ?? null)

  // Tombstone for "delete for everyone".
  if (chat.isDeletedForEveryone) {
    return (
      <Box
        sx={{
          boxShadow: 1,
          borderRadius: 1,
          maxWidth: '100%',
          width: 'fit-content',
          p: theme => theme.spacing(2.5, 4),
          borderTopLeftRadius: !isSender ? 0 : undefined,
          borderTopRightRadius: isSender ? 0 : undefined,
          backgroundColor: 'background.paper',
          color: 'text.secondary',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Icon icon='mdi:cancel' fontSize='0.875rem' />
        <Typography variant='body2' sx={{ fontStyle: 'italic', color: 'inherit' }}>
          This message was deleted
        </Typography>
      </Box>
    )
  }

  // Highlights search query matches within text
  const highlightText = (text: string, isActive: boolean): ReactNode => {
    if (!searchQuery?.trim()) return text
    const q = searchQuery.toLowerCase()
    const parts: ReactNode[] = []
    let lastIdx = 0
    let pos = text.toLowerCase().indexOf(q, 0)
    let key = 0
    while (pos !== -1) {
      if (pos > lastIdx) parts.push(text.slice(lastIdx, pos))
      parts.push(
        <Box
          component='span'
          key={key++}
          sx={{
            backgroundColor: isActive ? 'warning.main' : 'warning.light',
            color: 'warning.contrastText',
            borderRadius: '2px',
            px: '2px'
          }}
        >
          {text.slice(pos, pos + q.length)}
        </Box>
      )
      lastIdx = pos + q.length
      pos = text.toLowerCase().indexOf(q, lastIdx)
    }
    if (lastIdx < text.length) parts.push(text.slice(lastIdx))

    return <>{parts}</>
  }

  if (!chat.msg) return null

  // Click the reply snippet → scroll the original bubble into view + flash.
  const handleReplySnippetClick = () => {
    if (!chat.replyTo?.messageId) return
    const el = document.querySelector(`[data-msg-id="${chat.replyTo.messageId}"]`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('msg-flash')
    setTimeout(() => el.classList.remove('msg-flash'), 1200)
  }

  // Toggle our reaction with `emoji` on this message (used when clicking an
  // existing chip below the bubble — the popover picker lives in MessageActions).
  const handleToggleReaction = (emoji: string) => {
    if (!chat.id) return
    const me = currentUserId != null ? String(currentUserId) : ''
    const existing = chat.reactions?.find(r => r.emoji === emoji)
    const alreadyReacted = !!(existing && me && existing.userIds.includes(me))
    const fn = alreadyReacted ? removeReactionOverSocket : addReactionOverSocket
    fn(chat.id, emoji).catch(err => {
      console.error('[chat] toggle reaction failed:', err)
    })
  }

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        flexDirection: isSender ? 'row-reverse' : 'row',
        gap: 1
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxWidth: '100%' }}>
        <Box
          data-msg-id={chat.id ?? undefined}
          sx={{
            boxShadow: 1,
            borderRadius: 1,
            maxWidth: '100%',
            width: 'fit-content',
            p: theme => theme.spacing(3, 4),
            borderTopLeftRadius: !isSender ? 0 : undefined,
            borderTopRightRadius: isSender ? 0 : undefined,
            color: isSender ? 'common.white' : 'text.primary',
            backgroundColor: isSender ? 'primary.main' : 'background.paper',
            ...(isActiveSearchMatch && {
              outline: theme => `2px solid ${theme.palette.warning.main}`,
              outlineOffset: '2px'
            })
          }}
        >
          {chat.replyTo ? (
            <Box
              onClick={handleReplySnippetClick}
              sx={{
                cursor: chat.replyTo.messageId ? 'pointer' : 'default',
                borderLeft: theme =>
                  `3px solid ${isSender ? theme.palette.common.white : theme.palette.primary.main}`,
                pl: 1.5,
                py: 0.5,
                mb: 1,
                opacity: 0.85
              }}
            >
              <Typography
                variant='caption'
                sx={{ display: 'block', fontWeight: 600, color: 'inherit' }}
              >
                {chat.replyTo.senderName ?? 'Replied message'}
              </Typography>
              <Typography
                variant='caption'
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  color: 'inherit'
                }}
              >
                {chat.replyTo.textPreview ||
                  (chat.replyTo.hasAttachment ? '📎 Attachment' : 'Original message')}
              </Typography>
            </Box>
          ) : null}
          <Typography sx={{ fontSize: '0.875rem', wordWrap: 'break-word', color: 'inherit' }}>
            {isSearchMatch ? highlightText(chat.msg, !!isActiveSearchMatch) : chat.msg}
            {chat.isPinned ? (
              <Box
                component='span'
                sx={{
                  ml: 1,
                  display: 'inline-flex',
                  verticalAlign: 'middle',
                  color: 'inherit',
                  opacity: 0.85
                }}
                aria-label='pinned'
              >
                <Icon icon='mdi:pin' fontSize='0.875rem' />
              </Box>
            ) : null}
            {chat.isStarred ? (
              <Box
                component='span'
                sx={{
                  ml: 1,
                  display: 'inline-flex',
                  verticalAlign: 'middle',
                  color: 'inherit',
                  opacity: 0.85
                }}
                aria-label='starred'
              >
                <Icon icon='mdi:star' fontSize='0.875rem' />
              </Box>
            ) : null}
            {chat.isEdited ? (
              <Typography
                component='span'
                variant='caption'
                sx={{ ml: 1, opacity: 0.7, fontStyle: 'italic', color: 'inherit' }}
              >
                (edited)
              </Typography>
            ) : null}
          </Typography>
        </Box>

        {chat.reactions && chat.reactions.length > 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.5,
              ml: isSender ? 'auto' : 0,
              mr: isSender ? 0 : 'auto',
              mt: 0.25
            }}
          >
            {chat.reactions.map(r => {
              const me = currentUserId != null ? String(currentUserId) : ''
              const youReacted = !!(me && r.userIds.includes(me))

              return (
                <Chip
                  key={r.emoji}
                  size='small'
                  onClick={() => handleToggleReaction(r.emoji)}
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
                    cursor: 'pointer',
                    borderColor: theme => (youReacted ? theme.palette.primary.main : theme.palette.divider),
                    backgroundColor: theme =>
                      youReacted ? theme.palette.action.selected : theme.palette.background.paper,
                    '&:hover': { backgroundColor: theme => theme.palette.action.hover },
                    '& .MuiChip-label': { px: 0.75 }
                  }}
                  variant='outlined'
                />
              )
            })}
          </Box>
        ) : null}
      </Box>

      <MessageActions
        chat={chat}
        isSender={isSender}
        senderName={senderName}
        senderId={senderId}
        canPin={canPin}
        alwaysVisible={hovered}
        showEdit
        showCopyText
      />
    </Box>
  )
}

export default MessageBubble
