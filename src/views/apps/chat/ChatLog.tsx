'use client'

// ** React Imports
import { useRef, useEffect, useLayoutEffect, useCallback, useState, Ref, MouseEvent, UIEvent } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import MuiAvatar from '@mui/material/Avatar'
import Paper from '@mui/material/Paper'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

// ** Redux — for resolving sender identities in group chats. `data.contact`
// is the GROUP (name + icon), so non-sender bubbles need a per-message
// lookup of who actually sent each message. We use the deduped contacts
// list populated by `fetchChatsContacts` / `extractContactsFromConversations`.
import { useSelector } from 'react-redux'
import type { RootState } from 'src/store'

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
import ForwardedTag from 'src/views/apps/chat/ForwardedTag'

// ** Forward marker helpers — treat a marker-only payload as "no text"
// so forwarded attachment-only messages route to the attachment-only
// render path (with its own actions menu + reaction picker) and pick up
// the <ForwardedTag /> next to the attachment column.
import { isForwarded, hasDisplayableText } from 'src/lib/chat/forwardMarker'

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
    scrollTargetMessageId = null,
    onScrollToTargetDone,
    canInteract = true,
    onJumpToReply,
    onAddMember
  } = props

  // Sender-resolution map for group chats. The avatar + name shown next to
  // each incoming bubble must reflect the MESSAGE'S SENDER (not the group),
  // so we look up `item.senderId` in the deduped contacts list. Falls back
  // to data.contact / 'Unknown' if the participant isn't in the cache
  // (e.g., they've been removed from the group and aren't in the active
  // conversation list anymore).
  const isGroupChat = data.contact.isGroup === true
  const contactsList = useSelector((s: RootState) => s.chat?.contacts) ?? []
  const senderById = (() => {
    const m = new Map<string, (typeof contactsList)[number]>()
    contactsList.forEach(c => m.set(String(c.id), c))

    return m
  })()

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

  // Cancels any in-flight smooth-scroll animation. Stored at hook scope so a
  // new scroll request during a previous animation can abort and restart.
  const scrollAnimRafRef = useRef<number | null>(null)

  // JS-animated scrollTop. Browser-native `scrollTo({behavior:'smooth'})`
  // doesn't reliably move PerfectScrollbar's `_container`, so we ease via
  // rAF and ping `updateScroll()` after each frame to keep its rails in sync.
  const smoothScrollTo = useCallback(
    (target: number, duration = 300) => {
      if (scrollAnimRafRef.current != null) cancelAnimationFrame(scrollAnimRafRef.current)
      const c = getScrollContainer()
      if (!c) return
      const start = c.scrollTop
      const delta = target - start
      if (Math.abs(delta) < 1) return
      const t0 = performance.now()
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / duration)
        c.scrollTop = start + delta * easeOutCubic(t)
        // @ts-ignore — re-measure PerfectScrollbar's rails each frame
        chatArea.current?.updateScroll?.()
        if (t < 1) {
          scrollAnimRafRef.current = requestAnimationFrame(tick)
        } else {
          scrollAnimRafRef.current = null
        }
      }
      scrollAnimRafRef.current = requestAnimationFrame(tick)
    },
    [getScrollContainer]
  )

  // Cancel any pending animation on unmount.
  useEffect(() => {
    return () => {
      if (scrollAnimRafRef.current != null) cancelAnimationFrame(scrollAnimRafRef.current)
    }
  }, [])

  // Center a found bubble inside the scrollable container using `smoothScrollTo`.
  // Falls back to native `scrollIntoView` for the `hidden` (non-PS) mode where
  // we don't have a PerfectScrollbar container to drive manually.
  const scrollMessageIntoView = useCallback(
    (el: HTMLElement) => {
      const c = getScrollContainer()
      if (!c) {
        el.scrollIntoView({ block: 'center' })

        return
      }
      const elRect = el.getBoundingClientRect()
      const cRect = c.getBoundingClientRect()
      const target = Math.max(0, c.scrollTop + (elRect.top - cRect.top) - (c.clientHeight - el.offsetHeight) / 2)
      smoothScrollTo(target)
    },
    [getScrollContainer, smoothScrollTo]
  )

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

      scrollMessageIntoView(el)

      return
    }

    // Target not in DOM. Fire one jump request per target id and wait for
    // the messages array to swap; this effect will re-run on that swap.
    if (pendingJumpForIdRef.current === targetId) return
    if (!onJumpToMessage) return
    pendingJumpForIdRef.current = targetId
    onJumpToMessage(targetId)
  }, [activeMatchIndex, searchResultIds, data.chat.messages, onJumpToMessage, scrollMessageIntoView])

  // External scroll target (pinned-bar click etc.). Mirrors the search-jump
  // effect: try the in-DOM ref first, otherwise ask the parent to load a
  // context window via onJumpToMessage and let this effect re-run once the
  // messages array swaps. PerfectScrollbar's wrapper computes
  // `overflow: hidden`, so native `scrollIntoView` no-ops — we set
  // scrollTop on the resolved container instead.
  const pendingExternalJumpRef = useRef<string | null>(null)
  useEffect(() => {
    if (!scrollTargetMessageId) return

    const el = messageRefs.current.get(scrollTargetMessageId)
    if (el) {
      pendingExternalJumpRef.current = null
      scrollMessageIntoView(el)
      el.classList.add('msg-flash')
      setTimeout(() => el.classList.remove('msg-flash'), 1200)
      onScrollToTargetDone?.()

      return
    }

    if (pendingExternalJumpRef.current === scrollTargetMessageId) return
    if (!onJumpToMessage) return
    pendingExternalJumpRef.current = scrollTargetMessageId
    onJumpToMessage(scrollTargetMessageId)
  }, [scrollTargetMessageId, data.chat.messages, onJumpToMessage, onScrollToTargetDone, scrollMessageIntoView])

  // In-page preview state for image / video / pdf / other attachments.
  // Clicking an attachment opens the dialog; close button or backdrop closes.
  // When `list` is provided, prev/next carousel is enabled in the dialog.
  const [previewState, setPreviewState] = useState<{
    attachment: ChatAttachmentType
    list?: ChatAttachmentType[]
    index: number
  } | null>(null)
  const openPreview = (att: ChatAttachmentType, list?: ChatAttachmentType[]) => {
    const idx = list
      ? Math.max(
          0,
          list.findIndex(a => a.id === att.id)
        )
      : 0
    setPreviewState({ attachment: att, list, index: idx })
  }
  const closePreview = () => setPreviewState(null)

  // ** Tracks whether the user is scrolled far enough from the bottom to show the FAB
  const [showScrollFab, setShowScrollFab] = useState(false)

  const checkScrollFab = useCallback(() => {
    const c = getScrollContainer()
    if (!c) {
      setShowScrollFab(false)

      return
    }
    const distFromBottom = c.scrollHeight - c.scrollTop - c.clientHeight
    setShowScrollFab(distFromBottom > 300)
  }, [getScrollContainer])

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

    // Hide FAB once we scroll to bottom
    setTimeout(() => setShowScrollFab(false), 400)
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
        ...(msg.isDeletedForEveryone ? { isDeletedForEveryone: true } : {}),
        // Receipts — forwarded to the bubble so MessageActions can open the
        // "Message info" dialog without going back to Redux per message.
        ...(msg.readBy?.length ? { readBy: msg.readBy } : {}),
        ...(msg.deliveredTo?.length ? { deliveredTo: msg.deliveredTo } : {})
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
    // Track whether we've already injected the group-created card so it only
    // appears once — right after the first system message in history.
    let groupCardInjected = false

    return formattedChatData().map((item: FormattedChatsType, index: number) => {
      const isSystemGroup = item.senderId === 'system'
      const isDateGroup = item.senderId === 'date'

      // System messages — centered, small bubble (WhatsApp style)
      if (isSystemGroup) {
        // Show the group-created card after the "X created group Y" system
        // message, identified by content — independent of pagination state so
        // the card stays visible even when more messages load later.
        const isGroupCreationMsg =
          !groupCardInjected &&
          groupCreatedCard !== null &&
          item.messages.some(m => /created group/i.test(m.msg))
        if (isGroupCreationMsg) groupCardInjected = true

        // When showing the group-created card, skip the redundant system
        // message ("X created group Y") — the card conveys the same info.
        if (isGroupCreationMsg) return <>{groupCreatedCard}</>

        return (
          <>
            {item.messages.map((chat, msgIdx) => (
              <Box
                key={`sys-${index}-${msgIdx}`}
                sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}
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
            ))}
          </>
        )
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

      // For group incoming messages, resolve the actual sender (their name +
      // avatar) instead of falling back to the group's icon/name. DM incoming
      // messages keep using `data.contact` since it IS the peer. Outgoing
      // messages always show the current user.
      const senderContact = !isSender && isGroupChat ? senderById.get(String(item.senderId)) : undefined
      const avatarSrc = isSender
        ? data.userContact.avatar
        : senderContact?.avatar ?? (isGroupChat ? undefined : data.contact.avatar)
      const avatarName = isSender
        ? data.userContact.fullName ?? 'Me'
        : senderContact?.fullName ?? (isGroupChat ? 'Unknown' : data.contact.fullName)
      const avatarColor = isSender ? 'primary' : senderContact?.avatarColor ?? data.contact.avatarColor ?? 'primary'

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
              color={avatarColor}
              sx={{
                width: '2rem',
                height: '2rem',
                fontSize: '0.875rem',
                ml: isSender ? 4 : undefined,
                mr: !isSender ? 4 : undefined
              }}
              {...(avatarSrc ? { src: avatarSrc, alt: avatarName } : {})}
            >
              {getInitials(avatarName)}
            </CustomAvatar>
          </div>

          <Box className='chat-body' sx={{ maxWidth: ['calc(100% - 5.75rem)', '75%', '65%'] }}>
            {/* Sender name label above the first bubble in a group's run of
                messages. Only for incoming messages in a group — DMs and
                outgoing messages don't need it (avatar already identifies
                the sender). */}
            {!isSender && isGroupChat ? (
              <Typography
                variant='caption'
                sx={{
                  display: 'block',
                  mb: 0.5,
                  ml: 0.5,
                  fontWeight: 600,
                  color: theme =>
                    theme.palette[(avatarColor as 'primary') ?? 'primary']?.main ?? theme.palette.primary.main
                }}
              >
                {avatarName}
              </Typography>
            ) : null}
            {item.messages.map((chat: ChatLogChatType, index: number) => {
              const time = new Date(chat.time)
              const isMatch = chat.id ? searchResultSet.has(chat.id) : false
              const isActiveMatch = isMatch && chat.id === activeResultId

              return (
                <Box
                  key={index}
                  ref={(el: HTMLElement | null) => setMessageRef(chat.id, el)}
                  data-msg-id={chat.id}
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
                    {chat.attachments?.length && !hasDisplayableText(chat.msg) && !chat.isDeletedForEveryone ? (
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
                            maxWidth: '280px'
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
                          {isForwarded(chat.msg) ? <ForwardedTag isSender={isSender} /> : null}
                          {(() => {
                            const images = chat.attachments.filter(a => a.type === 'image')
                            const others = chat.attachments.filter(a => a.type !== 'image')
                            const imgCount = images.length
                            const bubbleCorners = {
                              borderTopLeftRadius: !isSender ? 0 : undefined,
                              borderTopRightRadius: isSender ? 0 : undefined
                            }

                            const imgCell = (att: any, cellH: number, extraCount = 0) => (
                              <Box
                                sx={{
                                  position: 'relative',
                                  overflow: 'hidden',
                                  cursor: 'zoom-in',
                                  lineHeight: 0,
                                  width: '100%',
                                  height: cellH
                                }}
                                onClick={() => openPreview(att, images)}
                                onContextMenu={(e: MouseEvent) => e.preventDefault()}
                              >
                                <Box
                                  component='img'
                                  src={att.thumbnailUrl ?? att.url}
                                  alt={att.filename}
                                  loading='lazy'
                                  draggable={false}
                                  sx={{
                                    width: '100%',
                                    height: cellH,
                                    display: 'block',
                                    objectFit: 'cover',
                                    userSelect: 'none'
                                  }}
                                />
                                {extraCount > 0 && (
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      inset: 0,
                                      backgroundColor: 'rgba(0,0,0,0.55)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    <Typography sx={{ color: 'common.white', fontWeight: 700, fontSize: '1.375rem' }}>
                                      +{extraCount}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            )

                            const renderImages = () => {
                              if (imgCount === 0) return null
                              if (imgCount <= 2) {
                                return images.map((att, i) => (
                                  <Box
                                    key={att.id}
                                    sx={{
                                      boxShadow: 1,
                                      borderRadius: 1,
                                      overflow: 'hidden',
                                      ...(i === 0 ? bubbleCorners : {}),
                                      cursor: 'zoom-in',
                                      lineHeight: 0
                                    }}
                                    onClick={() => openPreview(att)}
                                    onContextMenu={(e: MouseEvent) => e.preventDefault()}
                                  >
                                    <Box
                                      component='img'
                                      src={att.thumbnailUrl ?? att.url}
                                      alt={att.filename}
                                      loading='lazy'
                                      draggable={false}
                                      sx={{ maxWidth: '100%', maxHeight: 280, display: 'block', userSelect: 'none' }}
                                    />
                                  </Box>
                                ))
                              }
                              const MAX_SHOW = 4
                              const visible = images.slice(0, MAX_SHOW)
                              const extra = imgCount > MAX_SHOW ? imgCount - MAX_SHOW : 0
                              const gridSx = {
                                boxShadow: 1,
                                borderRadius: 1,
                                overflow: 'hidden',
                                ...bubbleCorners,
                                width: '100%',
                                maxWidth: '280px'
                              }
                              if (imgCount === 3) {
                                return (
                                  <Box sx={{ ...gridSx, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    {imgCell(visible[0], 150)}
                                    <Box sx={{ display: 'flex', gap: '2px' }}>
                                      <Box sx={{ flex: 1 }}>{imgCell(visible[1], 130)}</Box>
                                      <Box sx={{ flex: 1 }}>{imgCell(visible[2], 130)}</Box>
                                    </Box>
                                  </Box>
                                )
                              }
                              return (
                                <Box sx={{ ...gridSx, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
                                  {visible.map((att, idx) => (
                                    <Box key={att.id}>
                                      {imgCell(att, 138, idx === MAX_SHOW - 1 && extra > 0 ? extra : 0)}
                                    </Box>
                                  ))}
                                </Box>
                              )
                            }

                            return (
                              <>
                                {renderImages()}
                                {others.map(att => (
                                  <Box
                                    key={att.id}
                                    sx={{
                                      boxShadow: 1,
                                      borderRadius: 1,
                                      overflow: 'hidden',
                                      borderTopLeftRadius: !isSender && imgCount === 0 ? 0 : undefined,
                                      borderTopRightRadius: isSender && imgCount === 0 ? 0 : undefined,
                                      backgroundColor: isSender ? 'primary.main' : 'background.paper',
                                      color: isSender ? 'common.white' : 'text.primary',
                                      alignSelf:
                                        att.type === 'audio' || att.type === 'video'
                                          ? isSender
                                            ? 'flex-end'
                                            : 'flex-start'
                                          : undefined
                                    }}
                                  >
                                    {att.type === 'video' ? (
                                      <Box
                                        component='video'
                                        src={att.url}
                                        controls
                                        controlsList='nodownload noplaybackrate'
                                        onContextMenu={(e: MouseEvent) => e.preventDefault()}
                                        sx={{ maxWidth: '100%', maxHeight: 280, display: 'block', cursor: 'pointer' }}
                                        onClick={() => openPreview(att)}
                                      />
                                    ) : att.type === 'audio' ? (
                                      <Box sx={{ p: 2, minWidth: 220, width: '100%', maxWidth: '312px' }}>
                                        <Box
                                          component='audio'
                                          src={att.url}
                                          controls
                                          controlsList='nodownload noplaybackrate'
                                          onContextMenu={(e: MouseEvent) => e.preventDefault()}
                                          sx={{
                                            display: 'block',
                                            width: '100%',
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
                                              cursor: 'pointer'
                                            }}
                                          >
                                            <Icon
                                              icon={visual.icon}
                                              color={isSender ? '#ffffff' : visual.color}
                                              fontSize='2rem'
                                            />
                                            <Box sx={{ minWidth: 0 }}>
                                              <Typography
                                                variant='caption'
                                                sx={{ display: 'block', color: 'inherit' }}
                                                noWrap
                                              >
                                                {att.filename}
                                              </Typography>
                                              <Typography
                                                variant='caption'
                                                sx={{ display: 'block', color: 'inherit', opacity: 0.8 }}
                                              >
                                                {(att.size / 1024).toFixed(0)} KB
                                              </Typography>
                                            </Box>
                                          </Box>
                                        )
                                      })()
                                    )}
                                  </Box>
                                ))}
                              </>
                            )
                          })()}
                        </Box>
                        {canInteract ? <MessageReactionPicker chat={chat} isSender={isSender} /> : null}
                      </Box>
                    ) : null}
                    {/* Mixed (attachments + text) and text-only paths: existing inline
                        attachments map below + MessageBubble. Skipped when attachment-only. */}
                    {chat.attachments?.length && (hasDisplayableText(chat.msg) || chat.isDeletedForEveryone)
                      ? (() => {
                          const images = chat.attachments.filter(a => a.type === 'image')
                          const others = chat.attachments.filter(a => a.type !== 'image')
                          const imgCount = images.length
                          const bubbleCorners = {
                            borderTopLeftRadius: !isSender ? 0 : undefined,
                            borderTopRightRadius: isSender ? 0 : undefined
                          }

                          const imgCell = (att: any, cellH: number, extraCount = 0) => (
                            <Box
                              sx={{
                                position: 'relative',
                                overflow: 'hidden',
                                cursor: 'zoom-in',
                                lineHeight: 0,
                                width: '100%',
                                height: cellH
                              }}
                              onClick={() => openPreview(att, images)}
                              onContextMenu={(e: MouseEvent) => e.preventDefault()}
                            >
                              <Box
                                component='img'
                                src={att.thumbnailUrl ?? att.url}
                                alt={att.filename}
                                loading='lazy'
                                draggable={false}
                                sx={{
                                  width: '100%',
                                  height: cellH,
                                  display: 'block',
                                  objectFit: 'cover',
                                  userSelect: 'none'
                                }}
                              />
                              {extraCount > 0 && (
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    backgroundColor: 'rgba(0,0,0,0.55)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <Typography sx={{ color: 'common.white', fontWeight: 700, fontSize: '1.375rem' }}>
                                    +{extraCount}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          )

                          const renderImages = () => {
                            if (imgCount === 0) return null
                            if (imgCount <= 2) {
                              return images.map((att, i) => (
                                <Box
                                  key={att.id}
                                  sx={{
                                    boxShadow: 1,
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    ...(i === 0 ? bubbleCorners : {}),
                                    cursor: 'zoom-in',
                                    lineHeight: 0
                                  }}
                                  onClick={() => openPreview(att)}
                                  onContextMenu={(e: MouseEvent) => e.preventDefault()}
                                >
                                  <Box
                                    component='img'
                                    src={att.thumbnailUrl ?? att.url}
                                    alt={att.filename}
                                    loading='lazy'
                                    draggable={false}
                                    sx={{ maxWidth: '100%', maxHeight: 280, display: 'block', userSelect: 'none' }}
                                  />
                                </Box>
                              ))
                            }
                            const MAX_SHOW = 4
                            const visible = images.slice(0, MAX_SHOW)
                            const extra = imgCount > MAX_SHOW ? imgCount - MAX_SHOW : 0
                            const gridSx = {
                              boxShadow: 1,
                              borderRadius: 1,
                              overflow: 'hidden',
                              ...bubbleCorners,
                              width: '100%',
                              maxWidth: '280px'
                            }
                            if (imgCount === 3) {
                              return (
                                <Box sx={{ ...gridSx, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  {imgCell(visible[0], 150)}
                                  <Box sx={{ display: 'flex', gap: '2px' }}>
                                    <Box sx={{ flex: 1 }}>{imgCell(visible[1], 130)}</Box>
                                    <Box sx={{ flex: 1 }}>{imgCell(visible[2], 130)}</Box>
                                  </Box>
                                </Box>
                              )
                            }
                            return (
                              <Box sx={{ ...gridSx, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
                                {visible.map((att, idx) => (
                                  <Box key={att.id}>
                                    {imgCell(att, 138, idx === MAX_SHOW - 1 && extra > 0 ? extra : 0)}
                                  </Box>
                                ))}
                              </Box>
                            )
                          }

                          return (
                            <>
                              {renderImages()}
                              {others.map(att => (
                                <Box
                                  key={att.id}
                                  sx={{
                                    boxShadow: 1,
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    borderTopLeftRadius: !isSender && imgCount === 0 ? 0 : undefined,
                                    borderTopRightRadius: isSender && imgCount === 0 ? 0 : undefined,
                                    backgroundColor: isSender ? 'primary.main' : 'background.paper',
                                    color: isSender ? 'common.white' : 'text.primary',
                                    alignSelf:
                                      att.type === 'audio' || att.type === 'video'
                                        ? isSender
                                          ? 'flex-end'
                                          : 'flex-start'
                                        : undefined
                                  }}
                                >
                                  {att.type === 'video' ? (
                                    <Box
                                      component='video'
                                      src={att.url}
                                      controls
                                      controlsList='nodownload noplaybackrate'
                                      onContextMenu={(e: MouseEvent) => e.preventDefault()}
                                      sx={{ maxWidth: '100%', maxHeight: 280, display: 'block', cursor: 'pointer' }}
                                      onClick={() => openPreview(att)}
                                    />
                                  ) : att.type === 'audio' ? (
                                    <Box sx={{ p: 2, minWidth: 220, width: '100%', maxWidth: '312px' }}>
                                      <Box
                                        component='audio'
                                        src={att.url}
                                        controls
                                        controlsList='nodownload noplaybackrate'
                                        onContextMenu={(e: MouseEvent) => e.preventDefault()}
                                        sx={{
                                          display: 'block',
                                          width: '100%',
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
                                            <Typography
                                              variant='caption'
                                              sx={{ display: 'block', color: 'inherit' }}
                                              noWrap
                                            >
                                              {att.filename}
                                            </Typography>
                                            <Typography
                                              variant='caption'
                                              sx={{ display: 'block', color: 'inherit', opacity: 0.8 }}
                                            >
                                              {(att.size / 1024).toFixed(0)} KB
                                            </Typography>
                                          </Box>
                                        </Box>
                                      )
                                    })()
                                  )}
                                </Box>
                              ))}
                            </>
                          )
                        })()
                      : null}
                    {hasDisplayableText(chat.msg) || chat.isDeletedForEveryone ? (
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
                          onJumpToReply={onJumpToReply}
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
                    {/* Feedback ticks per message — matches WhatsApp:
                        • single grey ✓ → isSent (server acked)
                        • double grey ✓✓ → isDelivered (recipient online / received)
                        • double green ✓✓ → isSeen (recipient opened the chat)
                        The data flows in from two paths that are kept in sync:
                        (1) REST `listMessages` → adapter reads `msg.deliveryStatus`
                            ('sent'|'delivered'|'read') and maps to the three flags;
                        (2) Live `message_delivered` / `read_receipt` socket events
                            patch flags via `updateMessagesFeedback`. */}
                    {renderMsgFeedback(isSender, chat.feedback)}
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

      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      setShowScrollFab(distFromBottom > 300)

      // Only act on UPWARD motion (current < previous) AND when near the top.
      if (el.scrollTop >= prevTop) return
      if (el.scrollTop > 80) return
      triggerLoadOlder()
    },
    [triggerLoadOlder]
  )

  // Top-of-list status row — spinner while loading, or "start of conversation"
  // marker once history is exhausted. For groups we render a rich card showing
  // the icon, creator, member count, creation date, and an Add Member button.
  const groupCreatedCard = (() => {
    if (!isGroupChat || !data.contact.createdAt) return null
    const me = String(data.userContact.id ?? '')
    const isAdmin = (data.contact.adminIds?.map(String) ?? []).includes(me)
    const creator = String(data.contact.createdBy ?? '')
    const creatorLabel =
      creator === me
        ? 'You created this group'
        : (() => {
            const found = data.contact.participants?.find(p => String(p.userId) === creator)
            const name = found?.displayName || found?.username
            return name ? `${name} created this group` : 'Group created'
          })()
    const memberCount = data.contact.participants?.filter(p => p.isActive).length ?? data.contact.participantIds?.length ?? 0
    const creationDate = new Date(data.contact.createdAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })

    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', px: 4, mb: 4 }}>
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
            px: 6,
            py: 5,
            borderRadius: '8px',
            backgroundColor: 'background.paper',
            border: theme => `1px solid ${theme.palette.divider}`,
            maxWidth: 360,
            width: '100%'
          }}
        >
          {data.contact.avatar ? (
            <MuiAvatar src={data.contact.avatar} alt={data.contact.fullName} sx={{ width: 72, height: 72 }} />
          ) : (
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: theme => `linear-gradient(135deg, ${theme.palette.secondary.light}, ${theme.palette.secondary.main})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icon icon='mdi:account-group' fontSize='2rem' style={{ color: '#fff' }} />
            </Box>
          )}
          <Typography variant='subtitle2' sx={{ fontWeight: 700, textAlign: 'center', color: 'text.primary' }}>
            {creatorLabel}
          </Typography>
          <Typography variant='caption' sx={{ color: 'text.secondary', textAlign: 'center' }}>
            {memberCount} {memberCount === 1 ? 'member' : 'members'} &bull; Group created on {creationDate}
          </Typography>
          {isAdmin && <Button
            variant='text'
            startIcon={<Icon icon='mdi:account-plus-outline' />}
            onClick={onAddMember}
            sx={{
              mt: 0.5,
              width: '100%',
              borderRadius: 2,
              backgroundColor: 'customColors.Surface',
              color: 'primary.main',
              fontWeight: 600,
              '&:hover': { backgroundColor: 'customColors.OnBackground' }
            }}
          >
            Add Member
          </Button>}
        </Paper>
      </Box>
    )
  })()

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
  const handleFabClick = useCallback(() => {
    const c = getScrollContainer()
    if (c) smoothScrollTo(c.scrollHeight, 350)
    setShowScrollFab(false)
  }, [getScrollContainer, smoothScrollTo])

  return (
    <Box sx={{ position: 'relative', flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
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
          onScrollY={checkScrollFab}
          onYReachEnd={() => setShowScrollFab(false)}
        >
          {topStatus}
          {renderChats()}
        </PerfectScrollbar>
      )}
      <AttachmentPreviewDialog
        attachment={previewState?.attachment ?? null}
        attachments={previewState?.list}
        initialIndex={previewState?.index ?? 0}
        open={previewState !== null}
        onClose={closePreview}
      />

      {/* Scroll-to-bottom FAB */}
      {showScrollFab && (
        <Box
          onClick={handleFabClick}
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            zIndex: 10,
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: 'primary.main',
            color: 'common.white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: theme => `0 2px 8px ${theme.palette.primary.main}66`,
            transition: 'transform 0.15s, background-color 0.15s',
            '&:hover': {
              backgroundColor: 'primary.dark',
              transform: 'scale(1.08)'
            },
            '&:active': { transform: 'scale(0.94)' }
          }}
        >
          <Icon icon='mdi:chevron-down' fontSize='1.375rem' />
        </Box>
      )}
    </Box>
  )
}

export default ChatLog
