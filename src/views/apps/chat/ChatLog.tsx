'use client'

// ** React Imports
import { useRef, useEffect, useLayoutEffect, useCallback, useState, Fragment, Ref, MouseEvent, UIEvent } from 'react'

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

// ** SDK last-read pointer — drives the WhatsApp-Web "N unread messages"
// divider in the message list. Seeded by `selectChat` thunk on open via
// `getLastRead(chatId)` → `useChatStore.setLastRead(...)`.
import { useChatStore } from '@antzsoft/chat-core'

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
import ReactionsRow from 'src/views/apps/chat/ReactionsRow'

// ** Forward marker helpers — treat a marker-only payload as "no text"
// so forwarded attachment-only messages route to the attachment-only
// render path (with its own actions menu + reaction picker) and pick up
// the <ForwardedTag /> next to the attachment column.
import { isForwarded, hasDisplayableText, stripForwardMarker } from 'src/lib/chat/forwardMarker'

// ** Single source of truth for system-message perspective rewriting.
// See src/lib/chat/systemMessagePerspective.ts for the full template
// table + resolution chain.
import { resolveSystemMessageText } from 'src/lib/chat/systemMessagePerspective'

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

  // ── Unread-divider anchor (WhatsApp-Web style "N unread messages") ───────
  // We snapshot the `lastReadMessageId` from the SDK store ONCE per chat
  // open. Doing it via a ref + state pair (not just reading the store on
  // every render) is critical because `selectChat` thunk also dispatches
  // `markReadOverSocket` → server responds → `useChatStore.lastRead` shifts
  // to the latest message id. If we read live, the divider would vanish the
  // instant the user opens the chat. Freezing the anchor at open keeps the
  // divider stable until the user navigates away and comes back.
  const lastReadFromSdk = useChatStore(s => s.lastRead)
  const selectedChatId = data?.contact?.id ? String(data.contact.id) : null
  const unreadAnchorRef = useRef<string | null>(null)
  const lastSnapshottedChatIdRef = useRef<string | null>(null)
  const [unreadAnchor, setUnreadAnchor] = useState<string | null>(null)
  // Frozen count — set once when the divider first appears, never updated by
  // new incoming messages. Mirrors mobile's static `unreadCount` nav prop.
  const frozenUnreadCountRef = useRef<number>(0)

  // Marks the current chat id as awaiting its initial render — consumed by
  // the data effect below to differentiate "first sight of this chat" from
  // "subsequent live update". Cleared once consumed; reset on chat switch.
  const firstRenderForChatRef = useRef<string | null>(null)

  // Cooldown window (ms timestamp) during which `triggerLoadOlder` is
  // suppressed. PSB fires `onYReachStart` as a side-effect of our own
  // smooth-scroll landing near the top of the viewport (most visible in
  // short DMs where the unread divider sits within the first viewport);
  // without this guard PSB auto-prepends older messages and the user sees
  // the chat "scroll up" right after the unread-divider land.
  const ignoreLoadOlderUntilRef = useRef<number>(0)
  // Timestamp of the unread-scroll landing. Drives the time-windowed
  // guard inside `doScroll` so queued bottom-scrolls from the initial
  // mount don't yank the user past the divider, while still allowing
  // genuine live-message / own-send scroll-to-bottom calls afterwards.
  const unreadScrollAtRef = useRef<number>(0)

  // Reset the anchor whenever the user switches to a different chat. Uses
  // refs so the reset itself doesn't trigger an extra render cycle.
  useEffect(() => {
    if (lastSnapshottedChatIdRef.current !== selectedChatId) {
      unreadAnchorRef.current = null
      frozenUnreadCountRef.current = 0
      lastSnapshottedChatIdRef.current = selectedChatId
      firstRenderForChatRef.current = selectedChatId
      setUnreadAnchor(null)
    }
  }, [selectedChatId])

  // Snapshot the lastRead pointer the FIRST time unread messages are present.
  // After that, ignore further changes — the server flipping it to "latest"
  // mid-session must NOT erase our divider position.
  //
  // KEY RULE (mirrors mobile): only arm the divider when there are genuinely
  // unread messages from others already present in the loaded window at the
  // moment lastRead changes. We do NOT include data.chat.messages in deps —
  // doing so caused a false-positive: when a new live message is appended,
  // the effect would re-run with the PREVIOUS lastRead (not yet advanced by
  // the server's markRead response), find the new message sitting after the
  // anchor, and arm the divider. By reacting only to lastRead changes, the
  // anchor check runs only when the server has already processed markRead
  // and advanced lastRead to the latest message — at which point there are
  // no messages after the anchor, so we don't arm.
  useEffect(() => {
    if (!selectedChatId) return
    if (unreadAnchorRef.current) return
    const entry = lastReadFromSdk[selectedChatId]
    const id = entry?.messageId
    if (!id) return

    const msgs = data?.chat?.messages ?? []
    const myId = String(data?.userContact?.id ?? '')
    const anchorIdx = msgs.findIndex(m => m.id === id)

    if (anchorIdx >= 0) {
      // Anchor is in the loaded window — only arm if there are messages
      // from others AFTER it. If there are none, the chat was opened with
      // 0 unread (or markRead just advanced lastRead to the latest message)
      // — don't set the anchor so live messages never trigger the divider.
      const hasUnreadAfterAnchor = msgs
        .slice(anchorIdx + 1)
        .some(m => m.id && String(m.senderId) !== myId)
      if (!hasUnreadAfterAnchor) return
    }
    // anchorIdx < 0: anchor is in an older page not yet loaded.
    // Let it through — the jump-to-message path will load the context window.

    unreadAnchorRef.current = id
    setUnreadAnchor(id)
    // Pre-arm the load-older cooldown. The unread-scroll smooth-scrolls
    // the divider to the top of the viewport, and PSB can fire
    // `onYReachStart` as a side-effect of that motion crossing near
    // zero (most visible in short DMs). Setting the cooldown the
    // moment we know we'll be landing near the top guarantees the
    // ref is armed BEFORE any such event could possibly arrive.
    ignoreLoadOlderUntilRef.current = Date.now() + 1500
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChatId, lastReadFromSdk])

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
    // Cooldown — PSB fires onYReachStart as a side-effect of our own
    // smooth-scroll landing near the top (most visible in short DMs where
    // the unread divider sits within the first viewport). Without this
    // guard PSB auto-prepends older messages and the user sees the chat
    // "scroll up" right after the unread-divider land.
    if (Date.now() < ignoreLoadOlderUntilRef.current) return
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

  // Pre-compute the first-unread message id + count once per
  // (messages, anchor) change. We walk the messages array forward from
  // the anchor and pick the first message that is (a) AFTER the anchor
  // by index and (b) NOT sent by the current user. The "not from me"
  // check matches WhatsApp — the divider is meaningful only when the
  // next bubble belongs to someone else (your own send wouldn't be
  // "unread" by definition). Needed both by the render path (divider
  // injection) and by the auto-scroll effect below — declared here so
  // both can see it.
  const firstUnreadInfo = (() => {
    if (!unreadAnchor) return { id: null as string | null, count: 0 }
    const msgs = data?.chat?.messages ?? []
    const anchorIdx = msgs.findIndex(m => m.id === unreadAnchor)
    if (anchorIdx < 0) return { id: null, count: 0 }
    const myId = String(data?.userContact?.id ?? '')
    for (let i = anchorIdx + 1; i < msgs.length; i++) {
      const m = msgs[i]
      if (!m.id) continue
      if (String(m.senderId) === myId) continue

      return { id: m.id, count: msgs.length - i }
    }

    return { id: null, count: 0 }
  })()

  // Freeze the count the first time it resolves to a non-zero value.
  // After that, new messages arriving while the chat is open must NOT
  // increase the number — mirrors mobile's static `unreadCount` nav prop
  // which is captured once at screen open and never mutated.
  if (firstUnreadInfo.count > 0 && frozenUnreadCountRef.current === 0) {
    frozenUnreadCountRef.current = firstUnreadInfo.count
  }
  const unreadDisplayCount = frozenUnreadCountRef.current || firstUnreadInfo.count

  // ── Unread-divider auto-scroll + jump-load (WhatsApp parity) ─────────────
  // Gap 1: when the first-unread message is in the loaded window, scroll
  // its bubble into view so the user lands at the divider, not at bottom.
  // Gap 2: when the lastRead anchor is OLDER than the loaded window, the
  // anchor index returns -1 and the divider can't render. Request a jump
  // (context window centered on the anchor) so the divider can appear in
  // the next render cycle.
  //
  // Both guarded by per-anchor refs so they each fire exactly once. Reset
  // happens via the `selectedChatId` reset effect above where the anchor
  // itself resets — that path is already in place.
  const scrolledToUnreadRef = useRef<string | null>(null)
  const requestedUnreadJumpRef = useRef<string | null>(null)
  // Direct DOM ref on the unread divider element so we scroll TO it
  // (block: 'start') instead of centering the first-unread bubble — the
  // bubble-centering approach pushes the divider off-screen above.
  const unreadDividerRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!selectedChatId) return
    if (scrolledToUnreadRef.current !== null && scrolledToUnreadRef.current !== unreadAnchor) {
      scrolledToUnreadRef.current = null
    }
    if (requestedUnreadJumpRef.current !== null && requestedUnreadJumpRef.current !== unreadAnchor) {
      requestedUnreadJumpRef.current = null
    }
  }, [selectedChatId, unreadAnchor])

  useEffect(() => {
    // Need an anchor to do anything.
    if (!unreadAnchor) return

    // CRITICAL: don't treat an empty messages array as "anchor not in
    // window". On chat open the SDK calls `getLastRead` and
    // `listMessages` in parallel — `getLastRead` can resolve first and
    // populate `unreadAnchor` while `data.chat.messages` is still []
    // mid-render. If we fired `jumpToMessage` here we'd replace the
    // about-to-arrive normal page with a context window, looking to
    // the user like the chat reloaded right after opening.
    const msgs = data.chat.messages
    if (msgs.length === 0) return

    // Anchor not in current window → request a context-window load
    // (Gap 2). Same pattern as the search-jump effect at line ~389:
    // dispatch once, wait for messages to swap, effect re-runs and
    // either finds the anchor (then Gap 1 scrolls) or gives up.
    const anchorIdx = msgs.findIndex(m => m.id === unreadAnchor)
    if (anchorIdx < 0) {
      if (requestedUnreadJumpRef.current === unreadAnchor) return
      if (!onJumpToMessage) return
      requestedUnreadJumpRef.current = unreadAnchor
      onJumpToMessage(unreadAnchor)

      return
    }

    // Anchor IS in window. Land EXACTLY at the divider — that's the
    // "first unread starts here" position. We scroll TO the divider's
    // own DOM ref (not the bubble below it) so the pill sits at the
    // top of the viewport. Without this, centering the first-unread
    // bubble would push the divider off-screen above.
    if (!firstUnreadInfo.id) return
    if (scrolledToUnreadRef.current === unreadAnchor) return // already done

    const dividerEl = unreadDividerRef.current
    if (!dividerEl) return // divider not yet mounted — effect re-runs

    const container = getScrollContainer()
    if (container) {
      const elRect = dividerEl.getBoundingClientRect()
      const cRect = container.getBoundingClientRect()
      const target = Math.max(0, container.scrollTop + (elRect.top - cRect.top))
      smoothScrollTo(target)
    } else {
      dividerEl.scrollIntoView({ block: 'start' })
    }
    scrolledToUnreadRef.current = unreadAnchor
    unreadScrollAtRef.current = Date.now()
    // Reinforce the load-older cooldown after the actual scroll fires.
    // The smooth-scroll animation takes ~300ms, and PSB can fire
    // `onYReachStart` from any frame whose `scrollTop` dips near zero —
    // extending the window past the animation settle keeps us covered.
    ignoreLoadOlderUntilRef.current = Date.now() + 800

    // Sync newest-id ref so the scroll-to-bottom effect doesn't yank us
    // away after this one runs.
    const lastId = data.chat.messages[data.chat.messages.length - 1]?.id
    lastSeenNewestIdRef.current = lastId
  }, [unreadAnchor, firstUnreadInfo.id, data.chat.messages, onJumpToMessage, getScrollContainer, smoothScrollTo])

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
  //
  // `force` bypasses the unread-divider hold so own-send always scrolls to
  // bottom (matches WhatsApp — your own message should land in view).
  const scrollToBottom = (force = false) => {
    const doScroll = () => {
      if (!chatArea.current) return
      // Hold at the unread divider — `scrollToBottom` queues delayed
      // scrolls (rAF / 120ms / 350ms); any still pending when the
      // unread-scroll lands would yank the user back to the bottom.
      // Time-window the block (1s) so genuine new-message scroll calls
      // fired AFTER the divider has settled flow through. `force`
      // (own-send) bypasses unconditionally.
      if (!force && scrolledToUnreadRef.current && Date.now() - unreadScrollAtRef.current < 1000) return
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
        // Forwarded for system-message perspective rewrite — see render
        // branch below ("You created group …", "Anil removed you", etc.)
        ...(msg.senderId ? { senderId: msg.senderId } : {}),
        ...(msg.senderName ? { senderName: msg.senderName } : {}),
        // Structured system-message metadata from the server. Lets the
        // perspective rewrite resolve actor / target by ID (robust to
        // display-name drift) and render specific text per event type
        // (e.g. "You're now an admin" for `admin_promoted`).
        ...(msg.targetUserId ? { targetUserId: msg.targetUserId } : {}),
        ...(msg.targetUserName ? { targetUserName: msg.targetUserName } : {}),
        ...(msg.systemOperationType ? { systemOperationType: msg.systemOperationType } : {}),
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

      // Unread-divider boundary — flush the active group and inject a
      // synthetic 'unread' separator BEFORE the first-unread bubble.
      // Emitting at the top level (not nested inside a sender row) lets
      // the pill span the FULL chat width and center — same pattern as
      // the date / system separators. Guarded so it fires exactly once
      // per render even if formattedChatData runs multiple times.
      if (firstUnreadInfo.id && msg.id === firstUnreadInfo.id) {
        flushGroup()
        formattedChatLog.push({
          senderId: 'unread',
          messages: [
            {
              id: `unread-divider-${firstUnreadInfo.id}`,
              msg:
                unreadDisplayCount === 1
                  ? '1 unread message'
                  : `${unreadDisplayCount} unread messages`,
              time: msg.time,
              feedback: { isSent: true, isDelivered: false, isSeen: false }
            }
          ]
        })
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
    const newest = data.chat.messages[data.chat.messages.length - 1]
    const newestId = newest?.id
    if (newestId === lastSeenNewestIdRef.current) return

    // `firstRenderForChatRef` is set to `selectedChatId` on chat switch
    // and consumed here — the first time we see a non-empty messages
    // array for that chat is the "initial render". Distinguishes the
    // open-chat path (may need to hold at unread divider) from the
    // live-update path (only follow if user is at/near bottom).
    const isInitialRender = firstRenderForChatRef.current === selectedChatId
    lastSeenNewestIdRef.current = newestId

    // A `jumpToMessage` dispatch replaces the messages array with a context
    // window centered on the search target. The newest id of that window is
    // not the conversation's newest id, so the check above would otherwise
    // trip and yank the user to the bottom. Skip — the search-scroll effect
    // will land us on the right bubble instead.
    if (pendingJumpForIdRef.current) return

    // Own-send ALWAYS scrolls to bottom. Matches WhatsApp — your own
    // message should land in view regardless of where you were reading.
    // `force=true` bypasses the unread-divider hold inside `doScroll`.
    const myId = String(data?.userContact?.id ?? '')
    const isOwnSend = newest && String(newest.senderId) === myId
    if (isOwnSend) {
      firstRenderForChatRef.current = null
      scrollToBottom(true)

      return
    }

    if (isInitialRender) {
      firstRenderForChatRef.current = null
      // Has known unread → defer to the unread-scroll effect; it will
      // land the user at the divider instead of the bottom.
      if (selectedChatId) {
        const lastReadId = lastReadFromSdk[selectedChatId]?.messageId
        if (lastReadId && lastReadId !== newestId) return
      }
      scrollToBottom()

      return
    }

    // Subsequent live updates — only auto-scroll if the user is at/near
    // the bottom. Matches WhatsApp: a new message while reading older
    // history must NOT yank you down (the FAB counter exposes it instead).
    const c = getScrollContainer()
    if (c) {
      const distFromBottom = c.scrollHeight - c.scrollTop - c.clientHeight
      if (distFromBottom > 200) return
    }

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
      const isUnreadGroup = item.senderId === 'unread'

      // Unread divider — centered pill spanning full chat width. Top-level
      // group (not nested in a speaker row), so it isn't constrained by
      // the sender column's 65–75% maxWidth. `formattedChatData` emits
      // this exactly once at the boundary before the first-unread bubble.
      if (isUnreadGroup) {
        return (
          <Box
            key={`unread-divider-${firstUnreadInfo.id}`}
            ref={unreadDividerRef}
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
                fontWeight: 600,
                textAlign: 'center'
              }}
            >
              {item.messages[0]?.msg}
            </Typography>
          </Box>
        )
      }

      // System messages — centered, small bubble (WhatsApp style)
      if (isSystemGroup) {
        // Show the group-created card after the "X created group Y" system
        // message, identified by content — independent of pagination state so
        // the card stays visible even when more messages load later.
        const isGroupCreationMsg =
          !groupCardInjected && groupCreatedCard !== null && item.messages.some(m => /created group/i.test(m.msg))
        if (isGroupCreationMsg) groupCardInjected = true

        // When showing the group-created card, skip the redundant system
        // message ("X created group Y") — the card conveys the same info.
        // Outer `.map` requires each returned element to carry a key, so
        // use Fragment with an explicit key instead of a bare `<>`.
        if (isGroupCreationMsg) return <Fragment key={`grp-card-${index}`}>{groupCreatedCard}</Fragment>

        // WhatsApp-style perspective rewrite — delegated to the
        // shared resolver so ChatLog, SidebarLeft, and ChatContent all
        // produce identical text for the same event. The resolver
        // handles structured ops, actor-prefix fallback, target-name
        // replace, and the legacy verb-regex cold-load fallback. See
        // src/lib/chat/systemMessagePerspective.ts.
        const perspectiveCtx = {
          meId: String(data.userContact.id ?? ''),
          meName: data.userContact.fullName ?? ''
        }

        return (
          <Fragment key={`sys-grp-${index}`}>
            {item.messages.map((chat, msgIdx) => (
              <Box key={`sys-${index}-${msgIdx}`} sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
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
                  {resolveSystemMessageText(
                    {
                      message: chat.msg,
                      senderId: chat.senderId,
                      senderName: chat.senderName,
                      targetUserId: chat.targetUserId,
                      targetUserName: chat.targetUserName,
                      systemOperationType: chat.systemOperationType
                    } as MessageType,
                    perspectiveCtx
                  )}
                </Typography>
              </Box>
            ))}
          </Fragment>
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
            {isGroupChat && !isSender ? (
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
            ) : (
              <Box
                sx={{ width: '2rem', height: '2rem', ml: isSender ? 4 : undefined, mr: !isSender ? 4 : undefined }}
              />
            )}
          </div>

          <Box className='chat-body' sx={{ maxWidth: ['calc(100% - 5.75rem)', '75%', '65%'] }}>
            {item.messages.map((chat: ChatLogChatType, index: number) => {
              const time = new Date(chat.time)
              const isMatch = chat.id ? searchResultSet.has(chat.id) : false
              const isActiveMatch = isMatch && chat.id === activeResultId

              return (
                <Fragment key={chat.id ?? `msg-${index}`}>
                  <Box
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
                      {chat.attachments?.length && !chat.isDeletedForEveryone ? (
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
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxWidth: '100%' }}>
                            <Box
                              sx={{
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0,
                                maxWidth: '280px',
                                backgroundColor: isSender ? '#1F515B' : 'background.paper',
                                // Set the card text color so the time footer + filename
                                // captions inside (which use `color: 'inherit'`) read
                                // correctly against the dark sender bubble. Mirrors
                                // what MessageBubble does on its text card.
                                color: isSender ? 'common.white' : 'text.primary',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                boxShadow: 1,
                                p: theme => theme.spacing(2)
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
                                      // DM: both sides can always pin. Group:
                                      // any active member can pin (matches
                                      // WhatsApp). Kicked members blocked.
                                      const isGroup = data.contact.isGroup === true
                                      if (!isGroup) return true

                                      return data.contact.isCurrentUserActive !== false
                                    })()}
                                    showEdit={false}
                                    showCopyText={false}
                                  />
                                </Box>
                              ) : null}
                              {isForwarded(chat.msg) ? <ForwardedTag isSender={isSender} /> : null}
                              {chat.replyTo ? (
                                <Box
                                  sx={{
                                    borderLeft: '3px solid',
                                    borderColor: isSender ? 'rgba(255,255,255,0.6)' : 'primary.main',
                                    pl: 1.5,
                                    mb: 1.5,
                                    cursor: chat.replyTo.messageId ? 'pointer' : 'default',
                                    borderRadius: '0 4px 4px 0',
                                    backgroundColor: isSender ? 'rgba(255,255,255,0.1)' : 'action.hover',
                                    py: 0.5,
                                    pr: 1
                                  }}
                                  onClick={() => chat.replyTo?.messageId && onJumpToReply?.(chat.replyTo.messageId)}
                                >
                                  <Typography
                                    variant='caption'
                                    sx={{ display: 'block', fontWeight: 600, color: isSender ? 'rgba(255,255,255,0.9)' : 'primary.main' }}
                                  >
                                    {chat.replyTo.senderName ?? 'Replied message'}
                                  </Typography>
                                  <Typography
                                    variant='caption'
                                    noWrap
                                    sx={{ display: 'block', color: 'inherit', opacity: 0.8 }}
                                  >
                                    {chat.replyTo.textPreview || (chat.replyTo.hasAttachment ? '📎 Attachment' : 'Original message')}
                                  </Typography>
                                </Box>
                              ) : null}
                              {(() => {
                                // All images are grouped first as a single grid, then non-image
                                // attachments (video / audio / document) follow in their original order.
                                const images = chat.attachments.filter(a => a.type === 'image')
                                const others = chat.attachments.filter(a => a.type !== 'image')
                                const imgCount = images.length
                                const bubbleCorners = {
                                  borderTopLeftRadius: !isSender ? 0 : undefined,
                                  borderTopRightRadius: isSender ? 0 : undefined
                                }

                                const imgCell = (att: ChatAttachmentType, cellH: number, extraCount = 0) => (
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
                                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                        e.currentTarget.style.display = 'none'
                                      }}
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
                                    return (
                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {images.map(att => (
                                          <Box
                                            key={att.id}
                                            sx={{
                                              boxShadow: 'none',
                                              borderRadius: 'none',
                                              overflow: 'hidden',
                                              cursor: 'zoom-in',
                                              lineHeight: 0,
                                              width: '100%'
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
                                              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                                const wrapper = e.currentTarget.parentElement
                                                if (wrapper) wrapper.style.display = 'none'
                                              }}
                                              sx={{
                                                maxWidth: '100%',
                                                maxHeight: 280,
                                                display: 'block',
                                                userSelect: 'none',
                                                width: '100%'
                                              }}
                                            />
                                          </Box>
                                        ))}
                                      </Box>
                                    )
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
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {renderImages()}
                                    {others.map(att => (
                                      <Box
                                        key={att.id}
                                        sx={{
                                          boxShadow: 'none',
                                          borderRadius: 0,
                                          overflow: 'hidden',
                                          backgroundColor: 'transparent',
                                          color: isSender ? 'common.white' : 'text.primary',
                                          width: '100%',
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
                                  </Box>
                                )
                              })()}
                              {/* Caption text — shown when the message has both an
                              attachment and typed text (WhatsApp-style caption). */}
                              {hasDisplayableText(chat.msg) ? (
                                <Typography
                                  sx={{
                                    fontSize: '0.875rem',
                                    color: 'inherit',
                                    mt: 1,
                                    wordBreak: 'break-word',
                                    whiteSpace: 'pre-wrap'
                                  }}
                                >
                                  {stripForwardMarker(chat.msg)}
                                </Typography>
                              ) : null}
                              {/* Time footer. Inherits the card's `color` so it's white
                              on sender / dark on incoming without a per-isSender branch. */}
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-end',
                                  gap: 0.5,
                                  mt: 1,
                                  color: 'inherit'
                                }}
                              >
                                {chat.isPinned ? (
                                  <Box component='span' sx={{ display: 'inline-flex', color: 'inherit', opacity: 0.8 }}>
                                    <Icon icon='mdi:pin' fontSize='0.875rem' />
                                  </Box>
                                ) : null}
                                {chat.isStarred ? (
                                  <Box component='span' sx={{ display: 'inline-flex', color: 'inherit', opacity: 0.8 }}>
                                    <Icon icon='mdi:star' fontSize='0.875rem' />
                                  </Box>
                                ) : null}
                                <Typography
                                  variant='caption'
                                  sx={{ fontSize: '0.75rem', opacity: 0.8, color: 'inherit' }}
                                >
                                  {new Date(chat.time).toLocaleString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
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
                            {/* Reactions chip row sits OUTSIDE the attachment card but
                              INSIDE the inner column (same shape as MessageBubble for
                              text bubbles) so it stacks directly below the card with
                              the negative top margin in ReactionsRow tucking it
                              slightly onto the card edge. */}
                            <ReactionsRow chat={chat} isSender={isSender} canInteract={canInteract} />
                          </Box>
                          {canInteract ? <MessageReactionPicker chat={chat} isSender={isSender} /> : null}
                        </Box>
                      ) : null}
                      {(chat.isDeletedForEveryone || (!chat.attachments?.length && hasDisplayableText(chat.msg))) ? (
                        <Box sx={{ ml: isSender ? 'auto' : undefined, width: 'fit-content', maxWidth: '100%' }}>
                          <MessageBubble
                            chat={chat}
                            isSender={isSender}
                            senderName={isSender ? data.userContact.fullName : data.contact.fullName}
                            senderId={item.senderId}
                            canPin={(() => {
                              // DM: both participants can pin any message
                              // (their own or received). Group: any active
                              // member can pin (matches WhatsApp behavior).
                              // Kicked members are blocked.
                              const isGroup = data.contact.isGroup === true
                              if (!isGroup) return true

                              return data.contact.isCurrentUserActive !== false
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
                  </Box>
                </Fragment>
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
    const memberCount =
      data.contact.participants?.filter(p => p.isActive).length ?? data.contact.participantIds?.length ?? 0
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
                background: theme =>
                  `linear-gradient(135deg, ${theme.palette.secondary.light}, ${theme.palette.secondary.main})`,
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
          {isAdmin && (
            <Button
              variant='text'
              startIcon={<Icon icon='mdi:account-plus-outline' />}
              onClick={onAddMember}
              sx={{
                mt: 0.5,
                width: '100%',
                borderRadius: 2,
                backgroundColor: 'customColors.antzSecondaryBg',
                color: 'secondary.main',
                fontWeight: 600,
                '&:hover': { backgroundColor: 'customColors.antzSecondaryBg', filter: 'brightness(0.96)' }
              }}
            >
              Add Member
            </Button>
          )}
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
            zIndex: 5,
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: '#1F515B',
            color: 'common.white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(31, 81, 91, 0.4)',
            transition: 'transform 0.15s, background-color 0.15s',
            '&:hover': {
              backgroundColor: '#1a3f47',
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
