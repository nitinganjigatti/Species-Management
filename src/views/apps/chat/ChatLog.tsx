'use client'

// ** React Imports
import {
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useState,
  Ref,
  MouseEvent,
  UIEvent
} from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Components
import PerfectScrollbarComponent, { ScrollBarProps } from 'react-perfect-scrollbar'

// ** Custom Components Imports
import CustomAvatar from 'src/@core/components/mui/avatar'
import MessageBubble from 'src/views/apps/chat/MessageBubble'
import MessageActions from 'src/views/apps/chat/MessageActions'
import MessageReactionPicker from 'src/views/apps/chat/MessageReactionPicker'
import AttachmentPreviewDialog from 'src/views/apps/chat/AttachmentPreviewDialog'

// ** Types
import type { ChatAttachmentType } from 'src/types/apps/chatTypes'

// ** Utils Imports
import { getInitials } from 'src/@core/utils/get-initials'
import { getAttachmentVisual } from 'src/views/apps/chat/attachmentIcon'

// ** Types Imports
import {
  ChatLogType,
  MessageType,
  MsgFeedbackType,
  ChatLogChatType,
  MessageGroupType,
  FormattedChatsType
} from 'src/types/apps/chatTypes'

const PerfectScrollbar = styled(PerfectScrollbarComponent)<ScrollBarProps & { ref: Ref<unknown> }>(({ theme }) => ({
  padding: theme.spacing(5)
}))

// Date helpers for the day-separator pills (WhatsApp-style):
//   - Today / Yesterday for the two most recent days
//   - Weekday name for messages 2-6 days back
//   - Full date for anything older
// `toDateKey` is the equality key used to detect when two consecutive messages
// fall on different calendar days.
const toDateKey = (time: string | Date): string => {
  const d = new Date(time)

  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

const formatDateLabel = (time: string | Date): string => {
  const msgDay = new Date(time)
  msgDay.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysAgo = Math.round((today.getTime() - msgDay.getTime()) / 86400000)

  if (daysAgo === 0) return 'Today'
  if (daysAgo === 1) return 'Yesterday'
  if (daysAgo > 1 && daysAgo < 7) {
    return msgDay.toLocaleDateString('en-US', { weekday: 'long' })
  }

  return msgDay.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

const ChatLog = (props: ChatLogType) => {
  // ** Props
  const {
    data,
    hidden,
    searchQuery = '',
    searchResultIds = [],
    activeMatchIndex = 0,
    onLoadOlder,
    onJumpToMessage,
    canInteract = true
  } = props

  // ** Ref
  const chatArea = useRef(null)
  const messageRefs = useRef<Map<string, HTMLElement>>(new Map())

  // Pagination — surfaced via `data.chat` from Redux. ChatLog only triggers;
  // ChatContent owns the dispatch.
  const loadingOlder = data.chat.loadingOlder === true
  const hasMoreOlder = data.chat.hasMoreOlder !== false

  // Anchor-based visual-position preservation. We snapshot the topmost
  // currently-rendered message (id + its pixel offset within the viewport)
  // before the load fires. After React commits the prepended messages we find
  // that same DOM node by id and adjust `scrollTop` so it lands at the same
  // pixel offset — invariant to any other DOM size changes between renders
  // (topStatus toggling, scrollbar appearance, subpixel rounding, browser
  // auto-anchor, etc.).
  const anchorMessageIdRef = useRef<string | null>(null)
  const anchorViewportTopRef = useRef<number>(0)
  const isPrependingRef = useRef(false)

  // Native-overflow direction tracking (mobile fallback). PerfectScrollbar's
  // `onYReachStart` only fires at the top, so it's directional by definition.
  const lastNativeScrollTopRef = useRef<number>(Infinity)

  // Tracks the id of the newest message we've already auto-scrolled for. The
  // `data` prop is a fresh object literal on every parent render (ChatContent
  // does `{ ...selectedChat, ... }`), so the scroll-to-bottom effect fires on
  // every state change — including the `loadingOlder` toggle that runs during
  // pagination. Guarding on the actual newest-message id keeps us from
  // yanking the user to the bottom unless a real new message has landed.
  const lastSeenNewestIdRef = useRef<string | undefined>(undefined)

  // Prevents firing onJumpToMessage repeatedly for the same target while the
  // network round-trip is in flight, and prevents the post-jump messages
  // commit from triggering scrollToBottom (we want to land on the search
  // target, not the bottom of the new window).
  const pendingJumpForIdRef = useRef<string | null>(null)

  // Resolve the actual scroll container — PerfectScrollbar wraps the native
  // div; mobile uses the native div directly.
  const getScrollContainer = useCallback((): HTMLElement | null => {
    if (!chatArea.current) return null
    if (hidden) return chatArea.current as unknown as HTMLElement

    // @ts-ignore — PerfectScrollbar exposes the underlying div as `_container`
    return (chatArea.current._container as HTMLElement | undefined) ?? null
  }, [hidden])

  const triggerLoadOlder = useCallback(() => {
    if (!onLoadOlder) return
    if (loadingOlder) return
    if (!hasMoreOlder) return
    if (!data.chat.oldestCursor) return

    const c = getScrollContainer()
    if (!c) return

    // Snapshot the oldest currently-loaded message as the anchor — it's the
    // first message in our chronological array and survives the prepend
    // unchanged. Record where (in viewport-relative pixels) its top edge sits
    // so we can put it back at the same spot once new content lands above.
    const firstMsg = data.chat.messages[0]
    if (firstMsg?.id) {
      const el = messageRefs.current.get(firstMsg.id)
      if (el) {
        anchorMessageIdRef.current = firstMsg.id
        anchorViewportTopRef.current = el.getBoundingClientRect().top - c.getBoundingClientRect().top
      } else {
        anchorMessageIdRef.current = null
      }
    } else {
      anchorMessageIdRef.current = null
    }

    isPrependingRef.current = true
    onLoadOlder()
  }, [onLoadOlder, loadingOlder, hasMoreOlder, data.chat.oldestCursor, getScrollContainer, data.chat.messages])

  // Restore the anchor element to its captured viewport position. Runs
  // synchronously before paint, so the user never sees the in-between state.
  useLayoutEffect(() => {
    if (!isPrependingRef.current) return
    const c = getScrollContainer()
    if (!c) {
      isPrependingRef.current = false

      return
    }
    const anchorId = anchorMessageIdRef.current
    if (!anchorId) {
      isPrependingRef.current = false

      return
    }

    const el = messageRefs.current.get(anchorId)
    if (!el) {
      isPrependingRef.current = false
      anchorMessageIdRef.current = null

      return
    }

    // Compute how far the anchor has shifted since capture. Positive shift
    // means new content was added above; pushing scrollTop by exactly that
    // amount restores the original viewport-relative position.
    const currentTop = el.getBoundingClientRect().top - c.getBoundingClientRect().top
    const shift = currentTop - anchorViewportTopRef.current
    if (shift !== 0) c.scrollTop += shift

    // PerfectScrollbar needs an explicit re-measure after we set scrollTop
    // directly on its inner container.
    // @ts-ignore — react-perfect-scrollbar exposes updateScroll() on the ref.
    chatArea.current?.updateScroll?.()

    anchorMessageIdRef.current = null
    isPrependingRef.current = false
  }, [data.chat.messages.length, getScrollContainer])

  const setMessageRef = useCallback((msgId: string | undefined, el: HTMLElement | null) => {
    if (!msgId) return
    if (el) {
      messageRefs.current.set(msgId, el)
    } else {
      messageRefs.current.delete(msgId)
    }
  }, [])

  // Scroll to the active search match. If the match isn't in the currently-
  // loaded message window (cursor pagination keeps only ~50 messages around
  // the live position), ask ChatContent to load a context window via the
  // `jumpToMessage` thunk. The effect re-runs once Redux pushes the new
  // messages array down through `data`, at which point the ref will resolve.
  useEffect(() => {
    if (!searchResultIds.length) return
    const targetId = searchResultIds[activeMatchIndex]
    if (!targetId) return

    const el = messageRefs.current.get(targetId)
    if (el) {
      const wasJumping = pendingJumpForIdRef.current !== null
      pendingJumpForIdRef.current = null

      // When we land via a jump, the messages array was just replaced with a
      // historical context window — the scroll-to-bottom effect runs right
      // after this one and would otherwise yank the view away from the search
      // target because the window's "newest" id differs from what it last saw.
      // Sync that ref preemptively so it short-circuits.
      if (wasJumping) {
        const lastId = data.chat.messages[data.chat.messages.length - 1]?.id
        lastSeenNewestIdRef.current = lastId
      }

      el.scrollIntoView({ behavior: 'smooth', block: 'center' })

      return
    }

    // Target not in DOM. Fire one jump request per target id and wait for
    // the messages array to swap; this effect will re-run on that swap.
    if (pendingJumpForIdRef.current === targetId) return
    if (!onJumpToMessage) return
    pendingJumpForIdRef.current = targetId
    onJumpToMessage(targetId)
  }, [activeMatchIndex, searchResultIds, data.chat.messages, onJumpToMessage])

  // In-page preview state for image / video / pdf / other attachments.
  // Clicking an attachment opens the dialog; close button or backdrop closes.
  const [previewAttachment, setPreviewAttachment] = useState<ChatAttachmentType | null>(null)
  const openPreview = (att: ChatAttachmentType) => setPreviewAttachment(att)
  const closePreview = () => setPreviewAttachment(null)

  // ** Scroll to chat bottom — runs multiple passes so late-loading content
  // (images, embeds) doesn't leave us stuck mid-list. PerfectScrollbar's inner
  // div is `_container`. We also force a re-measure via PerfectScrollbar's
  // `update()` if available.
  const scrollToBottom = () => {
    const doScroll = () => {
      if (!chatArea.current) return
      if (hidden) {
        // @ts-ignore — native overflow div
        chatArea.current.scrollTop = chatArea.current.scrollHeight
      } else {
        // @ts-ignore — PerfectScrollbar exposes the underlying div as `_container`
        const c = chatArea.current._container
        if (c) c.scrollTop = c.scrollHeight
        // @ts-ignore — let PerfectScrollbar recompute its scrollbar after layout
        chatArea.current.updateScroll?.()
      }
    }

    // 1) immediately after the current frame paints
    requestAnimationFrame(doScroll)

    // 2) next frame — catches PerfectScrollbar's own measure cycle
    requestAnimationFrame(() => requestAnimationFrame(doScroll))

    // 3) after late content (images) settles
    setTimeout(doScroll, 120)
    setTimeout(doScroll, 350)
  }

  // ** Formats chat data — groups consecutive messages by sender, splits
  // groups on day boundaries, and emits a synthetic `senderId: 'date'` entry
  // at each boundary so the renderer can drop a date-pill into the stream.
  const formattedChatData = () => {
    let chatLog: MessageType[] | [] = []
    if (data.chat) {
      chatLog = data.chat.messages
    }

    const formattedChatLog: FormattedChatsType[] = []
    let msgGroup: MessageGroupType | null = null
    let prevDateKey: string | null = null

    const flushGroup = () => {
      if (msgGroup && msgGroup.messages.length) formattedChatLog.push(msgGroup)
      msgGroup = null
    }

    chatLog.forEach((msg: MessageType) => {
      const entry = {
        // Forward the id so future bubble-level actions (react, edit, delete,
        // pin, star, reply) have a stable target.
        id: msg.id,
        time: msg.time,
        msg: msg.message,
        feedback: msg.feedback,
        ...(msg.attachments?.length ? { attachments: msg.attachments } : {}),
        ...(msg.contentType ? { contentType: msg.contentType } : {}),
        // Interaction state — forwarded so the bubble renderer can decorate
        // without going back to Redux per message. Phase 0 only carries them;
        // no UI change yet.
        ...(msg.replyTo ? { replyTo: msg.replyTo } : {}),
        ...(msg.reactions?.length ? { reactions: msg.reactions } : {}),
        ...(msg.isPinned ? { isPinned: true } : {}),
        ...(msg.isStarred ? { isStarred: true } : {}),
        ...(msg.isEdited ? { isEdited: true } : {}),
        ...(msg.editedAt ? { editedAt: msg.editedAt } : {}),
        ...(msg.isDeletedForEveryone ? { isDeletedForEveryone: true } : {})
      }

      // Date boundary — flush the active group and inject a separator
      // BEFORE pushing this message, so the pill sits between the two days.
      if (msg.time) {
        const dateKey = toDateKey(msg.time)
        if (dateKey !== prevDateKey) {
          flushGroup()
          formattedChatLog.push({
            senderId: 'date',
            messages: [
              {
                id: `date-${dateKey}`,
                msg: formatDateLabel(msg.time),
                time: msg.time,
                feedback: { isSent: true, isDelivered: false, isSeen: false }
              }
            ]
          })
          prevDateKey = dateKey
        }
      }

      if (msg.contentType === 'system') {
        flushGroup()
        formattedChatLog.push({ senderId: 'system', messages: [entry] })

        return
      }

      if (msgGroup && msgGroup.senderId === msg.senderId) {
        msgGroup.messages.push(entry)
      } else {
        flushGroup()
        msgGroup = { senderId: msg.senderId, messages: [entry] }
      }
    })

    flushGroup()

    return formattedChatLog
  }

  const renderMsgFeedback = (isSender: boolean, feedback: MsgFeedbackType) => {
    if (isSender) {
      if (feedback.isSent && !feedback.isDelivered) {
        return (
          <Box component='span' sx={{ display: 'inline-flex', '& svg': { mr: 2, color: 'text.secondary' } }}>
            <Icon icon='mdi:check' fontSize='1rem' />
          </Box>
        )
      } else if (feedback.isSent && feedback.isDelivered) {
        return (
          <Box
            component='span'
            sx={{
              display: 'inline-flex',
              '& svg': { mr: 2, color: feedback.isSeen ? 'success.main' : 'text.secondary' }
            }}
          >
            <Icon icon='mdi:check-all' fontSize='1rem' />
          </Box>
        )
      } else {
        return null
      }
    }
  }

  useEffect(() => {
    if (!data?.chat?.messages.length) return

    // Only scroll when the NEWEST message id actually changed. This is true
    // for: initial chat open, switching chats, new live message, our own send
    // ack. It is NOT true for prepended older pages or any other state mutation
    // (loadingOlder toggle, feedback flags, pin/star/edit/delete, etc.), so
    // those won't yank the user to the bottom.
    const newestId = data.chat.messages[data.chat.messages.length - 1]?.id
    if (newestId === lastSeenNewestIdRef.current) return
    lastSeenNewestIdRef.current = newestId

    // A `jumpToMessage` dispatch replaces the messages array with a context
    // window centered on the search target. The newest id of that window is
    // not the conversation's newest id, so the check above would otherwise
    // trip and yank the user to the bottom. Skip — the search-scroll effect
    // will land us on the right bubble instead.
    if (pendingJumpForIdRef.current) return

    scrollToBottom()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  // Build a Set of matching IDs for O(1) lookup during render
  const searchResultSet = new Set(searchResultIds)
  const activeResultId = searchResultIds[activeMatchIndex] ?? null

  // ** Renders user chat
  const renderChats = () => {
    return formattedChatData().map((item: FormattedChatsType, index: number) => {
      const isSystemGroup = item.senderId === 'system'
      const isDateGroup = item.senderId === 'date'

      // System messages — centered, small bubble (WhatsApp style)
      if (isSystemGroup) {
        return item.messages.map((chat, msgIdx) => (
          <Box
            key={`sys-${index}-${msgIdx}`}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 4
            }}
          >
            <Typography
              variant='caption'
              sx={{
                px: 3,
                py: 1,
                borderRadius: 2,
                backgroundColor: theme => theme.palette.action.hover,
                color: 'text.secondary',
                maxWidth: '75%',
                textAlign: 'center'
              }}
            >
              {chat.msg}
            </Typography>
          </Box>
        ))
      }

      // Date separators — same centered pill as system messages, with a
      // slightly bolder weight so the day label reads as a heading.
      if (isDateGroup) {
        return item.messages.map((chat, msgIdx) => (
          <Box
            key={`date-${index}-${msgIdx}`}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 4,
              mt: 2
            }}
          >
            <Typography
              variant='caption'
              sx={{
                px: 3,
                py: 1,
                borderRadius: 2,
                backgroundColor: theme => theme.palette.action.hover,
                color: 'text.secondary',
                fontWeight: 600,
                textAlign: 'center'
              }}
            >
              {chat.msg}
            </Typography>
          </Box>
        ))
      }

      const isSender = item.senderId === data.userContact.id

      return (
        <Box
          key={index}
          sx={{
            display: 'flex',
            flexDirection: !isSender ? 'row' : 'row-reverse',
            mb: index !== formattedChatData().length - 1 ? 9.75 : undefined
          }}
        >
          <div>
            <CustomAvatar
              skin='light'
              color={(isSender ? undefined : data.contact.avatarColor) ?? 'primary'}
              sx={{
                width: '2rem',
                height: '2rem',
                fontSize: '0.875rem',
                ml: isSender ? 4 : undefined,
                mr: !isSender ? 4 : undefined
              }}
              {...(isSender
                ? data.userContact.avatar
                  ? { src: data.userContact.avatar, alt: data.userContact.fullName }
                  : {}
                : data.contact.avatar
                ? { src: data.contact.avatar, alt: data.contact.fullName }
                : {})}
            >
              {getInitials(isSender ? data.userContact.fullName ?? 'Me' : data.contact.fullName)}
            </CustomAvatar>
          </div>

          <Box className='chat-body' sx={{ maxWidth: ['calc(100% - 5.75rem)', '75%', '65%'] }}>
            {item.messages.map((chat: ChatLogChatType, index: number, { length }: { length: number }) => {
              const time = new Date(chat.time)
              const isMatch = chat.id ? searchResultSet.has(chat.id) : false
              const isActiveMatch = isMatch && chat.id === activeResultId

              return (
                <Box
                  key={index}
                  ref={(el: HTMLElement | null) => setMessageRef(chat.id, el)}
                  sx={{ '&:not(:last-of-type)': { mb: 3.5 } }}
                >
                  <Box
                    sx={{
                      ml: isSender ? 'auto' : undefined,
                      width: 'fit-content',
                      maxWidth: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1
                    }}
                  >
                    {/* Attachment-only messages get a MessageActions sibling so
                        delete/star/pin/react work on audio / video / document / image
                        the same as on text bubbles. Mixed (text + attachments) messages
                        keep their actions inside MessageBubble below — one menu per
                        message, not per attachment. */}
                    {chat.attachments?.length && !chat.msg && !chat.isDeletedForEveryone ? (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: isSender ? 'row-reverse' : 'row',
                          alignItems: 'center',
                          gap: 1,
                          // Reveal chevron (inside attachment bubble) + emoji
                          // picker (outside attachment column) on hover.
                          '&:hover .msg-actions': {
                            opacity: '1 !important',
                            pointerEvents: 'auto !important'
                          }
                        }}
                      >
                        <Box
                          sx={{
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            maxWidth: '100%'
                          }}
                        >
                          {/* Chevron lives INSIDE the attachment column,
                              absolutely positioned at the top-right — matches
                              the WhatsApp-Web pattern used for text bubbles. */}
                          {canInteract ? (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                zIndex: 2
                              }}
                            >
                              <MessageActions
                                chat={chat}
                                isSender={isSender}
                                senderName={isSender ? data.userContact.fullName : data.contact.fullName}
                                senderId={item.senderId}
                                canPin={(() => {
                                  const isGroup = data.contact.isGroup === true
                                  if (!isGroup) return true
                                  const me = String(data.userContact.id ?? '')
                                  const admins = data.contact.adminIds?.map(String) ?? []

                                  return admins.includes(me)
                                })()}
                                showEdit={false}
                                showCopyText={false}
                              />
                            </Box>
                          ) : null}
                          {chat.attachments.map(att => (
                            <Box
                              key={att.id}
                              sx={{
                                boxShadow: 1,
                                borderRadius: 1,
                                overflow: 'hidden',
                                borderTopLeftRadius: !isSender ? 0 : undefined,
                                borderTopRightRadius: isSender ? 0 : undefined,
                                backgroundColor: isSender ? 'primary.main' : 'background.paper',
                                color: isSender ? 'common.white' : 'text.primary'
                              }}
                            >
                              {att.type === 'image' ? (
                                <Box
                                  onClick={() => openPreview(att)}
                                  onContextMenu={(e: MouseEvent) => e.preventDefault()}
                                  sx={{ display: 'block', lineHeight: 0, cursor: 'zoom-in' }}
                                >
                                  <Box
                                    component='img'
                                    src={att.thumbnailUrl ?? att.url}
                                    alt={att.filename}
                                    loading='lazy'
                                    draggable={false}
                                    sx={{ maxWidth: 280, maxHeight: 280, display: 'block', userSelect: 'none' }}
                                  />
                                </Box>
                              ) : att.type === 'video' ? (
                                <Box
                                  component='video'
                                  src={att.url}
                                  controls
                                  controlsList='nodownload noplaybackrate'
                                  onContextMenu={(e: MouseEvent) => e.preventDefault()}
                                  sx={{ maxWidth: 280, maxHeight: 280, display: 'block', cursor: 'pointer' }}
                                  onClick={() => openPreview(att)}
                                />
                              ) : att.type === 'audio' ? (
                                <Box sx={{ pt: 5, pb: 2, px: 2, minWidth: 300 }}>
                                  <Box
                                    component='audio'
                                    src={att.url}
                                    controls
                                    controlsList='nodownload noplaybackrate'
                                    onContextMenu={(e: MouseEvent) => e.preventDefault()}
                                    sx={{
                                      display: 'block',
                                      width: 280,
                                      maxWidth: '100%',
                                      borderRadius: 1,
                                      bgcolor: isSender ? 'rgba(255,255,255,0.9)' : 'transparent'
                                    }}
                                  />
                                </Box>
                              ) : (
                                (() => {
                                  const visual = getAttachmentVisual(att.mimeType, att.filename)

                                  return (
                                    <Box
                                      onClick={() => openPreview(att)}
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        p: theme => theme.spacing(3, 4),
                                        color: 'inherit',
                                        textDecoration: 'none',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <Icon
                                        icon={visual.icon}
                                        color={isSender ? '#ffffff' : visual.color}
                                        fontSize='2rem'
                                      />
                                      <Box sx={{ minWidth: 0 }}>
                                        <Typography variant='caption' sx={{ color: 'inherit' }} noWrap>
                                          {att.filename}
                                        </Typography>
                                        <Typography variant='caption' sx={{ color: 'inherit', opacity: 0.8 }}>
                                          {(att.size / 1024).toFixed(0)} KB
                                        </Typography>
                                      </Box>
                                    </Box>
                                  )
                                })()
                              )}
                            </Box>
                          ))}
                        </Box>
                        {canInteract ? <MessageReactionPicker chat={chat} isSender={isSender} /> : null}
                      </Box>
                    ) : null}
                    {/* Mixed (attachments + text) and text-only paths: existing inline
                        attachments map below + MessageBubble. Skipped when attachment-only. */}
                    {chat.attachments?.length && (chat.msg || chat.isDeletedForEveryone)
                      ? chat.attachments.map(att => (
                          <Box
                            key={att.id}
                            sx={{
                              boxShadow: 1,
                              borderRadius: 1,
                              overflow: 'hidden',
                              borderTopLeftRadius: !isSender ? 0 : undefined,
                              borderTopRightRadius: isSender ? 0 : undefined,
                              backgroundColor: isSender ? 'primary.main' : 'background.paper',
                              color: isSender ? 'common.white' : 'text.primary'
                            }}
                          >
                            {/* TEMP DIAG — remove once audio render is verified. Logs every
                            attachment so we can see the actual type/url/mimeType the server
                            returned. Filter console by `[chat:att]`. */}
                            {(() => {
                              console.log('[chat:att]', {
                                id: att.id,
                                type: att.type,
                                mimeType: att.mimeType,
                                url: att.url,
                                filename: att.filename,
                                size: att.size
                              })

                              return null
                            })()}
                            {att.type === 'image' ? (
                              <Box
                                component='a'
                                href={att.url}
                                target='_blank'
                                rel='noopener noreferrer'
                                sx={{ display: 'block', lineHeight: 0 }}
                              >
                                <Box
                                  component='img'
                                  src={att.thumbnailUrl ?? att.url}
                                  alt={att.filename}
                                  loading='lazy'
                                  sx={{ maxWidth: 280, maxHeight: 280, display: 'block' }}
                                />
                              </Box>
                            ) : att.type === 'video' ? (
                              <Box
                                component='video'
                                src={att.url}
                                controls
                                sx={{ maxWidth: 280, maxHeight: 280, display: 'block' }}
                              />
                            ) : att.type === 'audio' ? (
                              <Box sx={{ p: 2, minWidth: 300 }}>
                                <Box
                                  component='audio'
                                  src={att.url}
                                  controls
                                  controlsList='nodownload noplaybackrate'
                                  onContextMenu={(e: MouseEvent) => e.preventDefault()}
                                  sx={{
                                    display: 'block',
                                    width: 280,
                                    maxWidth: '100%',
                                    // Light tint on green sender bubbles so the
                                    // browser's default-dark audio controls read.
                                    borderRadius: 1,
                                    bgcolor: isSender ? 'rgba(255,255,255,0.9)' : 'transparent'
                                  }}
                                />
                              </Box>
                            ) : (
                              (() => {
                                const visual = getAttachmentVisual(att.mimeType, att.filename)

                                return (
                                  <Box
                                    component='a'
                                    href={att.url}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    download={att.filename}
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 2,
                                      p: theme => theme.spacing(3, 4),
                                      color: 'inherit',
                                      textDecoration: 'none'
                                    }}
                                  >
                                    <Icon
                                      icon={visual.icon}
                                      color={isSender ? '#ffffff' : visual.color}
                                      fontSize='2rem'
                                    />
                                    <Box sx={{ minWidth: 0 }}>
                                      <Typography variant='caption' sx={{ display: 'block', color: 'inherit' }} noWrap>
                                        {att.filename}
                                      </Typography>
                                      <Typography variant='caption' sx={{ color: 'inherit', opacity: 0.8 }}>
                                        {(att.size / 1024).toFixed(0)} KB
                                      </Typography>
                                    </Box>
                                  </Box>
                                )
                              })()
                            )}
                          </Box>
                        ))
                      : null}
                    {chat.msg || chat.isDeletedForEveryone ? (
                      <Box sx={{ ml: isSender ? 'auto' : undefined, width: 'fit-content', maxWidth: '100%' }}>
                        <MessageBubble
                          chat={chat}
                          isSender={isSender}
                          senderName={isSender ? data.userContact.fullName : data.contact.fullName}
                          senderId={item.senderId}
                          canPin={(() => {
                            // DM: both participants can pin any message (their
                            // own or received). Group: still admin-only.
                            const isGroup = data.contact.isGroup === true
                            if (!isGroup) return true
                            const me = String(data.userContact.id ?? '')
                            const admins = data.contact.adminIds?.map(String) ?? []

                            return admins.includes(me)
                          })()}
                          isSearchMatch={isMatch}
                          isActiveSearchMatch={isActiveMatch}
                          searchQuery={searchQuery}
                          canInteract={canInteract}
                        />
                      </Box>
                    ) : null}
                  </Box>
                  <Box
                    sx={{
                      mt: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isSender ? 'flex-end' : 'flex-start'
                    }}
                  >
                    {/* Feedback ticks (sent/delivered/seen) only on the last
                        message of the group — same status applies to the whole
                        batch, so repeating ticks per bubble would just be noise. */}
                    {index + 1 === length ? renderMsgFeedback(isSender, chat.feedback) : null}
                    <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                      {time
                        ? new Date(time).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
                        : null}
                    </Typography>
                  </Box>
                </Box>
              )
            })}
          </Box>
        </Box>
      )
    })
  }

  // Native-overflow (mobile fallback) scroll handler. Triggers a load only on
  // upward motion near the top — downward / bottom scrolls never fire it.
  const handleNativeScroll = useCallback(
    (e: UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget
      const prevTop = lastNativeScrollTopRef.current
      lastNativeScrollTopRef.current = el.scrollTop

      // Only act on UPWARD motion (current < previous) AND when near the top.
      if (el.scrollTop >= prevTop) return
      if (el.scrollTop > 80) return
      triggerLoadOlder()
    },
    [triggerLoadOlder]
  )

  // Top-of-list status row — spinner while loading, optional "start of
  // conversation" caption once we've exhausted history. Rendered INSIDE the
  // scroll container so it participates in scroll geometry.
  const topStatus = (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 24, mb: 2 }}>
      {loadingOlder ? (
        <CircularProgress size={20} thickness={4} />
      ) : !hasMoreOlder && data.chat.messages.length > 0 ? (
        <Typography variant='caption' sx={{ color: 'text.disabled' }}>
          Beginning of conversation
        </Typography>
      ) : null}
    </Box>
  )

  // NOTE: do NOT extract this into a `ScrollWrapper` component defined inside
  // ChatLog — React would treat that as a brand-new component type on every
  // ChatLog render and unmount/remount PerfectScrollbar (and the entire
  // message subtree) every time. That remount resets scrollTop to 0 and
  // causes a visible flash-to-top on send / receipt updates. Keeping the
  // conditional inline means React sees the same `<PerfectScrollbar />`
  // element across renders and reuses the instance.
  return (
    <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
      {hidden ? (
        <Box
          ref={chatArea}
          onScroll={handleNativeScroll}
          sx={{ p: 5, height: '100%', overflowY: 'auto', overflowX: 'hidden' }}
        >
          {topStatus}
          {renderChats()}
        </Box>
      ) : (
        <PerfectScrollbar
          ref={chatArea}
          options={{ wheelPropagation: false }}
          onYReachStart={triggerLoadOlder}
        >
          {topStatus}
          {renderChats()}
        </PerfectScrollbar>
      )}
      <AttachmentPreviewDialog
        attachment={previewAttachment}
        open={previewAttachment !== null}
        onClose={closePreview}
      />
    </Box>
  )
}

export default ChatLog
