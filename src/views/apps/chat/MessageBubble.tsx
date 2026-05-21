'use client'

import { ReactNode } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

// ** Redux (for "did I react?" highlighting on chips)
import { useSelector } from 'react-redux'
import type { RootState } from 'src/store'

// ** SDK — only `add_reaction` is acked by the chat backend; a re-emit
// with the same emoji is treated as a toggle (server removes if the user
// already reacted). Both add and remove use this one call; state for both
// sides lands via the `reaction_updated` broadcast.
import { addReactionOverSocket } from 'src/lib/chat/api'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Per-message interaction surfaces.
// MessageActions = chevron menu inside the bubble (top-right).
// MessageReactionPicker = 😀 trigger outside the bubble (vertically centered).
import MessageActions from 'src/views/apps/chat/MessageActions'
import MessageReactionPicker from 'src/views/apps/chat/MessageReactionPicker'
import ForwardedTag from 'src/views/apps/chat/ForwardedTag'

// ** Forward marker — strip the sentinel for display and detect the
// "Forwarded" state so we can render <ForwardedTag /> above the body.
import { isForwarded, stripForwardMarker, hasDisplayableText } from 'src/lib/chat/forwardMarker'

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
  /**
   * When false, the action menu (Reply / Star / Copy / Delete) and reaction
   * toggles are hidden. ChatContent flips this off when the current user has
   * left / been removed from the group (isActive=false on their participant
   * entry). Defaults to true so DMs and other call sites are unaffected.
   */
  canInteract?: boolean
  /**
   * Fired when the user clicks the reply snippet. ChatContent uses this to
   * drive the same `scrollTargetMessageId` flow as the pinned-bar click —
   * needed because PerfectScrollbar's `overflow: hidden` wrapper makes
   * native `scrollIntoView` a no-op, and because the original message may
   * sit outside the loaded message window (pagination).
   */
  onJumpToReply?: (messageId: string) => void
}

/**
 * Text bubble + reply snippet + reactions row. The 3-dot menu and reaction
 * picker live in <MessageActions />, which is reused by ChatLog for
 * attachment-only bubbles too.
 */
const MessageBubble = ({
  chat,
  isSender,
  senderName,
  senderId,
  canPin,
  isSearchMatch,
  isActiveSearchMatch,
  searchQuery,
  canInteract = true,
  onJumpToReply
}: MessageBubbleProps) => {
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

  // Marker-only payloads (forwarded attachment-only messages) have a
  // truthy `chat.msg` but no visible body — let the attachment-only
  // render path in ChatLog handle them so the tag appears with the
  // attachment column instead of inside an empty text bubble.
  if (!hasDisplayableText(chat.msg)) return null

  const forwarded = isForwarded(chat.msg)
  const displayText = forwarded ? stripForwardMarker(chat.msg) : chat.msg ?? ''

  // Click the reply snippet → ask ChatContent to scroll + flash the original
  // bubble via the shared `scrollTargetMessageId` flow (same path as the
  // pinned-bar click). That handler also loads a context window via
  // `jumpToMessage` when the original sits outside the loaded slice.
  const handleReplySnippetClick = () => {
    const targetId = chat.replyTo?.messageId
    if (!targetId) return
    onJumpToReply?.(String(targetId))
  }

  // Toggle our reaction with `emoji` on this message (used when clicking an
  // existing chip below the bubble — the popover picker lives in MessageActions).
  const handleToggleReaction = (emoji: string) => {
    if (!chat.id) return
    const me = currentUserId != null ? String(currentUserId) : ''
    const existing = chat.reactions?.find(r => r.emoji === emoji)
    const alreadyReacted = !!(existing && me && existing.userIds.includes(me))
    // Single call for both add and remove — server treats a re-emit as a
    // toggle. `alreadyReacted` is kept only for any future UI branching.
    void alreadyReacted
    addReactionOverSocket(chat.id, emoji).catch((err: unknown) => {
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
        gap: 1,
        // Reveal the inside-bubble chevron + outside-bubble emoji trigger on
        // hover (WhatsApp-Web pattern). Both icons use `.msg-actions` and
        // start at opacity: 0 / pointer-events: none.
        '&:hover .msg-actions': {
          opacity: 1,
          pointerEvents: 'auto'
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxWidth: '100%' }}>
        <Box
          data-msg-id={chat.id ?? undefined}
          sx={{
            position: 'relative',
            boxShadow: 1,
            borderRadius: 1,
            maxWidth: '100%',
            width: 'fit-content',
            p: theme => theme.spacing(3, 4),
            // Reserve room for the absolutely-positioned chevron at top-right
            // so it doesn't overlap the message text.
            pr: theme => theme.spacing(7),
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
          {canInteract ? (
            <Box
              sx={{
                position: 'absolute',
                top: 2,
                right: 2,
                zIndex: 1
              }}
            >
              <MessageActions
                chat={chat}
                isSender={isSender}
                senderName={senderName}
                senderId={senderId}
                canPin={canPin}
                showEdit
                showCopyText
              />
            </Box>
          ) : null}
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
          {forwarded ? <ForwardedTag isSender={isSender} /> : null}
          <Typography sx={{ fontSize: '0.875rem', wordWrap: 'break-word', color: 'inherit' }}>
            {isSearchMatch ? highlightText(displayText, !!isActiveSearchMatch) : displayText}
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

        {canInteract && chat.reactions && chat.reactions.length > 0 ? (
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
                  // Click-to-toggle only when the current user can interact
                  // with this conversation. Removed-from-group users see
                  // existing reaction chips as static read-only labels.
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

      {canInteract ? <MessageReactionPicker chat={chat} isSender={isSender} /> : null}
    </Box>
  )
}

export default MessageBubble
