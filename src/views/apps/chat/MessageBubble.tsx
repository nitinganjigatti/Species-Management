'use client'

import { ReactNode } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Per-message interaction surfaces.
// MessageActions = chevron menu inside the bubble (top-right).
// MessageReactionPicker = 😀 trigger outside the bubble (vertically centered).
import MessageActions from 'src/views/apps/chat/MessageActions'
import MessageReactionPicker from 'src/views/apps/chat/MessageReactionPicker'
import ForwardedTag from 'src/views/apps/chat/ForwardedTag'
import ReactionsRow from 'src/views/apps/chat/ReactionsRow'

// ** Forward marker — strip the sentinel for display and detect the
// "Forwarded" state so we can render <ForwardedTag /> above the body.
import { isForwarded, stripForwardMarker, hasDisplayableText } from 'src/lib/chat/forwardMarker'

// ** Auto-detected URLs / mailto / tel links inside the body text.
// Per-text-segment callback keeps search-highlight scoped to non-link
// portions so we never wrap a <Box component='a'> in a highlight span.
import LinkifyText from 'src/lib/chat/linkify'

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
  // Tombstone for "delete for everyone".
  if (chat.isDeletedForEveryone) {
    return (
      <Box
        sx={{
          boxShadow: 1,
          borderRadius: '8px',
          maxWidth: '100%',
          width: 'fit-content',
          p: theme => theme.spacing(2.5, 4),
          borderTopLeftRadius: !isSender ? '0px' : '8px',
          borderTopRightRadius: isSender ? '0px' : '8px',
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
            borderRadius: '8px',
            maxWidth: '100%',
            width: 'fit-content',
            p: theme => theme.spacing(3, 4),
            pr: isSender ? '12px' : theme => theme.spacing(4),
            borderTopLeftRadius: !isSender ? '0px' : '8px',
            borderTopRightRadius: isSender ? '0px' : '8px',
            color: isSender ? 'common.white' : 'text.primary',
            backgroundColor: isSender ? '#1F515B' : 'background.paper',
            ...(isActiveSearchMatch && {
              outline: theme => `3px solid ${theme.palette.warning.main}`,
              outlineOffset: '3px',
              boxShadow: theme => `0 0 0 6px ${theme.palette.warning.main}33`
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
                borderLeft: theme => `3px solid ${isSender ? theme.palette.common.white : '#1F515B'}`,
                pl: 1.5,
                py: 0.5,
                mb: 1,
                opacity: 0.85
              }}
            >
              <Typography variant='caption' sx={{ display: 'block', fontWeight: 600, color: 'inherit' }}>
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
                {chat.replyTo.textPreview || (chat.replyTo.hasAttachment ? '📎 Attachment' : 'Original message')}
              </Typography>
            </Box>
          ) : null}
          {forwarded ? <ForwardedTag isSender={isSender} /> : null}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography sx={{ fontSize: '0.875rem', wordWrap: 'break-word', color: 'inherit' }}>
              <LinkifyText
                text={displayText}
                isSender={isSender}
                renderText={isSearchMatch ? (s: string) => highlightText(s, !!isActiveSearchMatch) : undefined}
              />
              {chat.isPinned ? (
                <Box
                  component='span'
                  sx={{
                    ml: 1,
                    display: 'inline-flex',
                    verticalAlign: 'middle',
                    color: 'inherit'
                  }}
                  aria-label='pinned'
                >
                  <Icon icon='mdi:pin' fontSize='1rem' />
                </Box>
              ) : null}
              {chat.isStarred ? (
                <Box
                  component='span'
                  sx={{
                    ml: 1,
                    display: 'inline-flex',
                    verticalAlign: 'middle',
                    color: 'inherit'
                  }}
                  aria-label='starred'
                >
                  <Icon icon='mdi:star' fontSize='1rem' />
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
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                justifyContent: 'flex-end'
              }}
            >
              <Typography variant='caption' sx={{ fontSize: '0.75rem', opacity: 0.8, color: 'inherit' }}>
                {new Date(chat.time).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </Typography>
              {isSender ? (
                chat.feedback.isSent && !chat.feedback.isDelivered ? (
                  <Box component='span' sx={{ display: 'inline-flex', '& svg': { color: 'inherit' } }}>
                    <Icon icon='mdi:check' fontSize='0.875rem' />
                  </Box>
                ) : chat.feedback.isSent && chat.feedback.isDelivered ? (
                  <Box
                    component='span'
                    sx={{
                      display: 'inline-flex',
                      '& svg': { color: chat.feedback.isSeen ? 'success.main' : 'inherit' }
                    }}
                  >
                    <Icon icon='mdi:check-all' fontSize='0.875rem' />
                  </Box>
                ) : null
              ) : null}
            </Box>
          </Box>
        </Box>

        <ReactionsRow chat={chat} isSender={isSender} canInteract={canInteract} />
      </Box>

      {canInteract ? <MessageReactionPicker chat={chat} isSender={isSender} /> : null}
    </Box>
  )
}

export default MessageBubble
