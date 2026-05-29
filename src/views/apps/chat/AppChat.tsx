'use client'

// ** React Imports
import { useCallback, useEffect, useRef, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

// ** Store & Actions Imports
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from 'src/hooks/useAuth'
import {
  sendMsg,
  selectChat,
  fetchUserProfile,
  fetchChatsContacts,
  enrichLastMessageSenders,
  removeSelectedChat,
  receiveMessage,
  applyReactionUpdate,
  applyMessageUpdate,
  applyMessageDelete,
  applyMessageDeleteForMe,
  applyMessagePin,
  applyParticipantLeft,
  applyParticipantJoined,
  updateMessagesFeedback,
  addOrReplaceChat,
  patchConversationFromEvent,
  removeChatFromList,
  updateChatFlags
} from 'src/store/apps/chat'

// ** Adapters
import {
  joinChatRoom,
  markReadOverSocket,
  sdkConversationToChat,
  sdkMessageToMessage,
  getUserLastSeen,
  getOnlineUsersOverSocket
} from 'src/lib/chat/api'
import type { MessageDeliveredEvent, MessagesDeliveredEvent, ReadReceiptEvent } from 'src/lib/chat/api'
import toast from 'react-hot-toast'
// ** Types
import { RootState, AppDispatch } from 'src/store'
import { StatusObjType, StatusType } from 'src/types/apps/chatTypes'

// ** Hooks
import { useSettings } from 'src/@core/hooks/useSettings'
import { useSafeRouter } from 'src/hooks/useSafeRouter'

// ** Utils Imports
import { getInitials } from 'src/@core/utils/get-initials'
import { formatDateToMonthShort } from 'src/@core/utils/format'
import { useSearchParams } from 'next/navigation'
import { markConversationAsRead } from 'src/lib/notifications'

// ** Chat App Components Imports
import SidebarLeft from 'src/views/apps/chat/SidebarLeft'
import ChatContent from 'src/views/apps/chat/ChatContent'

// ** @antzsoft/chat-core smoke test — verifies the SDK can connect to the
// backend without touching the existing Redux/mock data path. Logs to console.
// Becomes a no-op when NEXT_PUBLIC_CHAT_API_URL is not set.
import { getSocketStatus, onSocketStatus, tryGetSocket, useChatStore, type SocketStatus } from '@antzsoft/chat-core'
import { getChatClientOrNull } from 'src/lib/chat/client'

// Optional `compact` flag forces single-pane mobile-style layout regardless
// of viewport width. ChatLauncher passes this when AppChat is rendered inside
// the narrow floating dock — the panel is always too small for the desktop
// two-pane layout, so we want the sidebar to act as a slide-in drawer.
type AppChatProps = {
  compact?: boolean
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

const AppChat = ({ compact = false, isFullscreen = false, onToggleFullscreen }: AppChatProps = {}) => {
  // ** States
  const [userStatus, setUserStatus] = useState<StatusType>('online')
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(Boolean(compact))
  const [userProfileLeftOpen, setUserProfileLeftOpen] = useState<boolean>(false)
  const [userProfileRightOpen, setUserProfileRightOpen] = useState<boolean>(false)

  // ** Router
  const router = useSafeRouter()

  // ** Typing indicator state — keyed by conversationId → array of typing users
  type TypingUser = { userId: string; displayName: string }
  const [typingUsers, setTypingUsers] = useState<Record<string, TypingUser[]>>({})
  const typingTimers = useRef<Record<string, Record<string, ReturnType<typeof setTimeout>>>>({})

  const handleTypingEvent = useCallback((raw: any) => {
    // Server may send a single object or an array
    const evt = Array.isArray(raw) ? raw[0] : raw
    if (!evt) return

    const convId = evt?.conversationId
    const userId = evt?.userId
    const displayName = evt?.displayName || evt?.username || 'Someone'
    const isTyping = evt?.isTyping !== false

    if (!convId || !userId) return
    // Ignore own typing events
    if (userId === String(userProfileIdRef.current)) return

    if (isTyping) {
      setTypingUsers(prev => {
        const existing = prev[convId] ?? []
        const alreadyExists = existing.some(u => u.userId === userId)

        return { ...prev, [convId]: alreadyExists ? existing : [...existing, { userId, displayName }] }
      })

      // Auto-clear after 4s if no new typing event
      if (!typingTimers.current[convId]) typingTimers.current[convId] = {}
      if (typingTimers.current[convId][userId]) clearTimeout(typingTimers.current[convId][userId])
      typingTimers.current[convId][userId] = setTimeout(() => {
        setTypingUsers(prev => ({
          ...prev,
          [convId]: (prev[convId] ?? []).filter(u => u.userId !== userId)
        }))
      }, 4000)
    } else {
      setTypingUsers(prev => ({
        ...prev,
        [convId]: (prev[convId] ?? []).filter(u => u.userId !== userId)
      }))
      if (typingTimers.current[convId]?.[userId]) {
        clearTimeout(typingTimers.current[convId][userId])
      }
    }
  }, [])

  // ** Hooks
  const theme = useTheme()
  const { settings } = useSettings()
  const dispatch = useDispatch<AppDispatch>()
  const auth = useAuth() as any
  const searchParams = useSearchParams()
  const fallbackAvatarUrl: string | undefined =
    auth?.userData?.user?.profile_pic ??
    auth?.userData?.user?.user_profile_pic ??
    auth?.userData?.user?.profile_image ??
    auth?.userData?.user?.avatar ??
    auth?.userData?.user?.avatar_url ??
    undefined
  // `compact` (set by the floating ChatLauncher) forces mobile-style single-pane
  // layout even on desktop viewports — the panel is always too narrow for the
  // two-pane layout. Otherwise fall back to the viewport-based media query.
  const isViewportNarrow = useMediaQuery(theme.breakpoints.down('lg'))
  const hidden = compact || isViewportNarrow
  const store = useSelector((state: RootState) => state.chat)

  // ** Vars
  const { skin } = settings
  const smAbove = useMediaQuery(theme.breakpoints.up('sm'))
  const sidebarWidth = smAbove ? 370 : 300
  // When `compact` is set, force narrow-viewport semantics so the sidebar
  // drawer auto-closes on chat select and ChatContent's hamburger appears.
  const mdQuery = useMediaQuery(theme.breakpoints.up('md'))
  const mdAbove = compact ? false : mdQuery
  const statusObj: StatusObjType = {
    busy: 'error',
    away: 'warning',
    online: 'success',
    offline: 'secondary'
  }

  useEffect(() => {
    dispatch(fetchUserProfile({ fallbackAvatarUrl }))
  }, [dispatch, fallbackAvatarUrl])

  // ── @antzsoft/chat-core wiring ─────────────────────────────────────────────
  // Initializes the SDK (REST) + our path-fixed socket.io-client wrapper.
  // When `client` becomes non-null, we re-dispatch `fetchUserProfile` so
  // Redux swaps the mock seed profile for the real one from `GET /auth/me`.
  // See: docs/modules/chat/chat-core-starter.md
  const [socketStatus, setSocketStatus] = useState<SocketStatus>(() => {
    try {
      return getSocketStatus()
    } catch {
      return 'disconnected'
    }
  })
  useEffect(() => onSocketStatus(setSocketStatus), [])

  const chatClient = getChatClientOrNull()
  const chatSocket = socketStatus === 'disconnected' ? null : tryGetSocket()
  const chatConnected = socketStatus === 'connected'
  const chatError = socketStatus === 'error' ? new Error('chat socket error') : null

  // Mark conversation notifications as read when conversation is opened
  useEffect(() => {
    const conversationId = store?.selectedChat?.contact?.id
    if (conversationId) {
      dispatch(markConversationAsRead(String(conversationId)))
    }
  }, [store?.selectedChat?.contact?.id, dispatch])

  useEffect(() => {
    if (!chatClient) return

    // Bootstrap on mount: ensure profile is loaded (the adapter needs `me`
    // to identify the other participant in DMs), fetch the conversation
    // list only if Redux doesn't already have it (ChatLauncher may have
    // already populated it while the user was elsewhere in the app — soft
    // navigation should not re-hit the API; `conversation_updated` keeps
    // the cache fresh). Then kick off `enrichLastMessageSenders` so each
    // group's lastMessage carries `senderName` for the "Saket: …" prefix
    // (the conv-list endpoint omits this). Fire-and-forget; failures
    // are silent.
    const alreadyLoaded = Boolean(store?.chats)
    const run = async () => {
      await dispatch(fetchUserProfile({ fallbackAvatarUrl }))
      if (!alreadyLoaded) await dispatch(fetchChatsContacts())
      dispatch(enrichLastMessageSenders())
    }
    run()
    // Intentionally omit `store?.chats` from deps — we only want this to
    // fire on initial mount / chatClient change, not on every chats mutation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatClient, dispatch, fallbackAvatarUrl])

  // Join every conversation's Socket.IO room so the server pushes that room's
  // `new_message` (and delivery/read) events to us. The SDK doc says the server
  // auto-joins all existing rooms on connect, but the deployed server doesn't
  // appear to do that — sends don't broadcast and incoming events don't arrive
  // unless we explicitly join. Re-joining is idempotent on Socket.IO; emitting
  // again on every list change is fine.
  useEffect(() => {
    if (!chatSocket || !chatConnected) return
    if (!store?.chats) return

    const roomIds = store.chats.filter(c => typeof c.id === 'string').map(c => c.id)
    roomIds.forEach(id => joinChatRoom(id as string))
  }, [chatSocket, chatConnected, store?.chats])

  // Connect-time refetch lives in ChatLauncher (mounted persistently in
  // the app shell). AppChat no longer refetches on mount — it would
  // re-fire on every FAB open (since `{open && <Box>}` unmounts/remounts
  // AppChat) and that fetch is redundant: Redux already holds the list
  // and is kept fresh by `new_message` + `conversation_updated` socket
  // events. Cold start and socket-reconnect refetches are both owned by
  // ChatLauncher's persistent effects.

  // ── Presence cold-seed via `getOnlineUsers` ───────────────────────────────
  // After a page refresh `useChatStore.onlineUsers` starts empty (in-memory
  // only), and the server doesn't reliably re-push `user_online` events
  // for already-connected peers on a fresh socket connection. Without a
  // cold-seed the chat header / sidebar wrongly falls through to the
  // "last seen" branch even when peer is currently online.
  //
  // One shot of `socketEmit.getOnlineUsers([all DM peer ids])` on connect
  // asks the server "who from this list is currently online?" — purely a
  // socket query, no fabrication. Result is Set-merged into
  // `useChatStore.onlineUsers` (don't replace — `user_online` events that
  // arrived during the round-trip mustn't be clobbered).
  //
  // Ref-gated so it fires exactly once per connection; reset on
  // disconnect so a reconnect re-seeds with current data.
  const seededOnlineUsersRef = useRef<boolean>(false)
  useEffect(() => {
    if (!chatConnected) {
      seededOnlineUsersRef.current = false

      return
    }
    if (seededOnlineUsersRef.current) return
    if (!store?.chats) return

    const me = String(store?.userProfile?.id ?? '')
    const peerIds = new Set<string>()
    store.chats.forEach(c => {
      if (c.isGroup === true) return
      c.participants?.forEach(p => {
        if (p.isActive !== false && String(p.userId) !== me) peerIds.add(String(p.userId))
      })
    })
    if (peerIds.size === 0) return

    seededOnlineUsersRef.current = true
    getOnlineUsersOverSocket(Array.from(peerIds))
      .then(online => {
        const presenceStore = useChatStore.getState()
        const merged = Array.from(new Set([...presenceStore.onlineUsers, ...online]))
        presenceStore.setOnlineUsers(merged)
      })
      .catch(err => {
        console.warn('[chat:presence] getOnlineUsers seed failed:', err)
        seededOnlineUsersRef.current = false
      })
  }, [chatConnected, store?.chats, store?.userProfile?.id])

  // ── Refresh `lastSeen` on every live `user_offline` event ─────────────────
  // The server's `user_offline` payload currently omits `lastSeenAt`, so the
  // SDK's `if (e.lastSeenAt) store.setLastSeen(...)` short-circuits and the
  // UI keeps showing whatever was cached from the earlier cold-seed.
  //
  // Workaround: listen to `user_offline` ourselves and refetch via the
  // existing `getUserLastSeen` REST endpoint — same source of truth the
  // cold-seed uses, no client-side timestamp fabrication. Server's
  // authoritative value lands in `useChatStore.lastSeen[userId]` and the
  // chat header / profile drawer re-render automatically.
  //
  // Dedupes the per-room fanout we observed (one `user_offline` per joined
  // room — same userId, ~80ms apart): swallows duplicates within 1s.
  const lastOfflineFetchedAtRef = useRef<Record<string, number>>({})
  useEffect(() => {
    if (!chatSocket || !chatConnected) return

    const onUserOffline = (evt: { userId: string; lastSeenAt?: string }) => {
      if (!evt?.userId) return
      const userId = String(evt.userId)
      const now = Date.now()
      const lastAt = lastOfflineFetchedAtRef.current[userId] ?? 0
      if (now - lastAt < 1000) return
      lastOfflineFetchedAtRef.current[userId] = now

      // If the server eventually starts sending `lastSeenAt` in the payload,
      // trust it directly. Otherwise fall back to refetching via REST.
      if (evt.lastSeenAt) {
        useChatStore.getState().setLastSeen(userId, evt.lastSeenAt)

        return
      }
      getUserLastSeen(userId)
        .then(res => {
          if (!res?.lastSeenAt) return
          useChatStore.getState().setLastSeen(userId, res.lastSeenAt)
        })
        .catch(err => console.warn('[chat:presence] live getUserLastSeen failed:', err))
    }

    chatSocket.on('user_offline', onUserOffline)

    return () => {
      chatSocket.off('user_offline', onUserOffline)
    }
  }, [chatSocket, chatConnected])

  const selectedConversationIdFromRedux = useSelector((state: RootState) => state.chat.selectedConversationId)

  // Compact mode (FAB panel): hydrate selectedChat from Redux/localStorage
  // whenever it's missing — runs on every panel open, on chats arriving
  // after the ID was already restored, and after anything that clears
  // selectedChat. URL changes are ignored in compact mode.
  useEffect(() => {
    if (!compact) return
    if (typeof window === 'undefined') return
    if (!store?.chats || store.chats.length === 0) return

    // selectedChat already hydrated — nothing to do.
    if (store?.selectedChat?.contact?.id) return

    const savedId = selectedConversationIdFromRedux || localStorage.getItem('selectedChatConversationId')
    if (!savedId) return

    const chatToSelect = store.chats.find(c => String(c.id) === String(savedId))
    if (chatToSelect) {
      dispatch(selectChat(chatToSelect.id))
    }
  }, [compact, store?.chats, store?.selectedChat?.contact?.id, selectedConversationIdFromRedux, dispatch])

  // Full-page mode: hydrate selectedChat whenever it's missing.
  // Source priority: URL `?conversationId=` → first chat in the list.
  // No refs / once-only guards — re-runs whenever selectedChat clears so
  // any path that wipes it (removeChatFromList, race with route cleanup,
  // etc.) self-heals on the next render. URL → selectedChat sync is the
  // job of the URL-update effect below, so we don't fight it here when
  // selectedChat is already set.
  useEffect(() => {
    if (compact) return
    if (typeof window === 'undefined') return
    if (!searchParams) return
    if (!store?.chats || store.chats.length === 0) return

    if (store?.selectedChat?.contact?.id) return

    const conversationId = searchParams.get('conversationId')
    if (conversationId) {
      const chatToSelect = store.chats.find(c => String(c.id) === String(conversationId))
      if (chatToSelect) {
        dispatch(selectChat(chatToSelect.id))

        return
      }
    }

    const first = store.chats[0]
    if (first) dispatch(selectChat(first.id))
  }, [compact, store?.chats, store?.selectedChat?.contact?.id, searchParams, dispatch])

  // Stable ref pointing at the currently open conversation id. Read inside the
  // socket handler so we can detect "message arrived in the chat I'm looking at"
  // without resubscribing the socket on every chat switch.
  const selectedChatIdRef = useRef<string | number | null>(null)
  useEffect(() => {
    selectedChatIdRef.current = store?.selectedChat?.contact.id ?? null
  }, [store?.selectedChat?.contact.id])

  // Update URL when selectedChat changes due to sidebar click (not from URL change)
  // Track previous conversationId to detect actual changes
  const prevConversationIdRef = useRef<string | number | null>(null)
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return
    if (!searchParams) return

    const currentConversationId = store?.selectedChat?.contact?.id ?? null
    const urlConversationId = searchParams.get('conversationId')

    // Only update URL if the selection changed AND it's not matching the URL
    // (i.e., user clicked sidebar, not clicked a notification)
    // Skip URL push when in compact mode (floating panel)
    if (
      currentConversationId &&
      currentConversationId !== prevConversationIdRef.current &&
      String(currentConversationId) !== urlConversationId
    ) {
      prevConversationIdRef.current = currentConversationId
      if (!compact && !isFullscreen) {
        router.replace(`/chat?conversationId=${currentConversationId}`)
      }
    } else {
      prevConversationIdRef.current = currentConversationId
    }
  }, [store?.selectedChat?.contact?.id, searchParams, router, compact])

  // Stable ref for the current user's profile id — used inside socket handlers
  // to determine if a message is "ours" (instead of relying on tempId, which
  // the server broadcasts to everyone).
  const userProfileIdRef = useRef<string | number | null>(null)
  useEffect(() => {
    userProfileIdRef.current = store?.userProfile?.id ?? null
  }, [store?.userProfile?.id])

  // Stable ref for the current user's display name — needed by the
  // synthesized kick system message (targetUserName) on the kicked socket.
  const userProfileNameRef = useRef<string>('')
  useEffect(() => {
    userProfileNameRef.current = store?.userProfile?.fullName ?? ''
  }, [store?.userProfile?.fullName])

  // Synthesis guard — set of conversationIds for which we've already
  // synthesized a "kicked-me" pill this session. Prevents duplicate pills
  // when `participant_left` double-fires (observed in StrictMode dev runs
  // and possible on socket reconnects).
  const syntheticKickFiredRef = useRef<Set<string>>(new Set())

  // Stable ref of the chat id set. Used inside the new_message handler so we
  // can detect events for conversations we don't yet have (e.g. someone just
  // created a DM with us) and pull a fresh list via `fetchChatsContacts`.
  const knownChatIdsRef = useRef<Set<string | number>>(new Set())
  const chatsRef = useRef(store?.chats ?? null)
  useEffect(() => {
    knownChatIdsRef.current = new Set(store?.chats?.map(c => c.id) ?? [])
    chatsRef.current = store?.chats ?? null
  }, [store?.chats])

  useEffect(() => {
    if (chatError) return
    if (!chatSocket || !chatConnected) return

    // Live incoming message → adapt + push into Redux. The receiveMessage
    // reducer dedupes by id, so the server-echo of our own `sendMsg` is a
    // no-op (sendMsg.fulfilled has already added the row).
    // `tempId` on the event = this is the server echoing our own send back
    // to us — flag it so the reducer renders the bubble on OUR side even
    // when the server's senderId doesn't match userProfile.id.
    const onNewMessage = (evt: any) => {
      // The server may send the message in different shapes:
      //   { message: Message, tempId? }   — wrapped
      //   Message                         — directly (has .id + .conversationId)
      //   { data: Message, tempId? }      — alt wrapper
      const raw = evt?.message ?? evt?.data ?? (evt?.conversationId ? evt : null)

      if (!raw || !raw.conversationId) {
        console.warn('[chat] new_message — could not extract message from event:', evt)

        return
      }

      // System message — handle silently without special logging

      // Determine if this is our own message by comparing senderId with our
      // profile id — tempId is unreliable because the server broadcasts it
      // to all participants, not just the sender.
      const isOwn = Boolean(userProfileIdRef.current && raw.senderId === String(userProfileIdRef.current))

      if (!knownChatIdsRef.current.has(raw.conversationId)) {
        dispatch(fetchChatsContacts()).then(() => {
          dispatch(
            receiveMessage({
              conversationId: raw.conversationId,
              message: sdkMessageToMessage(raw),
              isOwn
            })
          )
        })

        return
      }

      dispatch(
        receiveMessage({
          conversationId: raw.conversationId,
          message: sdkMessageToMessage(raw),
          isOwn
        })
      )

      // System messages signal structural changes (role promoted/demoted,
      // member added/removed, group renamed). Refresh conversation metadata
      // so adminIds / participants stay in sync without a page reload.
      if (raw.content?.type === 'system') {
        dispatch(fetchChatsContacts())
      }

      const isOpen = selectedChatIdRef.current === raw.conversationId
      if (isOpen) {
        // Mark via socket so the server broadcasts read_receipt to the sender.
        // The REST markAsRead endpoint does NOT trigger a socket broadcast.
        markReadOverSocket(raw.conversationId)
      }
    }

    // Single-message delivered (other side received it).
    const onMessageDelivered = (evt: MessageDeliveredEvent) => {
      if (!evt) return
      dispatch(
        updateMessagesFeedback({
          conversationId: evt.conversationId,
          messageIds: [evt.messageId],
          isDelivered: true
        })
      )
    }

    // Batch delivered — used when a user comes back online and the server
    // catches them up on multiple acknowledgements at once.
    const onMessagesDelivered = (evt: MessagesDeliveredEvent) => {
      if (!evt?.messageIds?.length) return
      dispatch(
        updateMessagesFeedback({
          conversationId: evt.conversationId,
          messageIds: evt.messageIds,
          isDelivered: true
        })
      )
    }

    // Read receipt — blue tick only for fullyReadMessageIds (read by ALL
    // participants). Per SDK docs: updatedMessageIds = one user read,
    // fullyReadMessageIds = everyone read → show blue tick.
    const onReadReceipt = (evt: ReadReceiptEvent) => {
      if (!evt) return

      const fullyReadIds = evt.fullyReadMessageIds ?? []
      if (!fullyReadIds.length) return

      dispatch(
        updateMessagesFeedback({
          conversationId: evt.conversationId,
          messageIds: fullyReadIds,
          isSeen: true
        })
      )
    }

    // `conversation_updated` carries one of two payload shapes per the
    // server contract:
    //   Case 1: new message arrived. Slim — { id, lastMessage, unreadCount,
    //           updatedAt }. PATCH only those fields.
    //   Case 2: metadata changed (rename/avatar/participants/role/settings).
    //           Full Conversation object. REPLACE via sdkConversationToChat.
    // Discriminate by `participants` + `settings` presence.
    const onConversationUpdated = (evt: any) => {
      const convId = evt?.id ?? evt?.conversationId
      if (!convId) return

      const isFullConversation = Array.isArray(evt?.participants) && evt?.settings !== undefined
      if (isFullConversation) {
        // Brand-new conversation surfaced via this event (rare — usually
        // covered by `conversation_created`): we still need to join the
        // socket room to receive future new_message events.
        if (!knownChatIdsRef.current.has(convId)) {
          joinChatRoom(convId)
        }
        const myId = userProfileIdRef.current ?? ''
        const chat = sdkConversationToChat(evt, myId)
        dispatch(addOrReplaceChat(chat))

        return
      }

      dispatch(
        patchConversationFromEvent({
          chatId: convId,
          lastMessage: evt?.lastMessage,
          unreadCount: typeof evt?.unreadCount === 'number' ? evt.unreadCount : undefined
        })
      )
    }

    // Fires when a new conversation is created OR when the current user is
    // added to one at runtime. Per SDK doc Step 7, the server does NOT
    // auto-join the user's socket to the new room — only the personal
    // conversation_created event is emitted to that user. We must:
    //   1. Add the conversation to the sidebar (via fetchChatsContacts refresh)
    //   2. Emit `joinRoom` so the socket subscribes to new_message etc. for that room
    // Without this, the user would receive no realtime events for the new chat
    // until the next page reload.
    const onConversationCreated = (evt: any) => {
      const conv = evt?.conversation ?? evt?.data ?? evt
      const convId = conv?.id ?? evt?.conversationId
      if (!convId) return
      dispatch(fetchChatsContacts()).then(() => {
        joinChatRoom(convId)
      })
    }

    // Multi-device sync — `conversation_deleted` fires on this user's
    // OTHER sessions when they delete a chat elsewhere (per chat-core docs:
    // `conversationsApi.delete()` is per-user, never broadcast to other
    // participants). Drop the row + close it if it was open, using the
    // SAME reducer the local "Delete chat" / "Exit and Delete" paths use
    // — instant, no REST refetch, idempotent on unknown ids.
    const onConversationDeleted = (evt: any) => {
      const convId = evt?.conversationId ?? evt?.id
      if (!convId) return
      dispatch(removeChatFromList(convId))
    }

    // Reactions — server broadcasts the full `reactions` array for one
    // message. We replace (not merge) since the server is authoritative.
    const onReactionUpdated = (evt: any) => {
      const messageId = evt?.messageId ?? evt?.message?.id
      const reactions = evt?.reactions ?? evt?.message?.reactions ?? []
      if (!messageId) return
      dispatch(applyReactionUpdate({ messageId, reactions }))
    }

    // Edit — server broadcasts the new text + isEdited stamp.
    const onMessageUpdated = (evt: any) => {
      const messageId = evt?.messageId ?? evt?.message?.id
      const text = evt?.text ?? evt?.message?.content?.text ?? ''
      const editedAt = evt?.editedAt ?? evt?.message?.editedAt
      if (!messageId) return
      dispatch(applyMessageUpdate({ messageId, text, editedAt }))
    }

    // Delete-for-everyone — keep the bubble in place, render the
    // "This message was deleted" placeholder.
    const onMessageDeleted = (evt: any) => {
      const messageId = evt?.messageId ?? evt?.message?.id
      if (!messageId) return
      dispatch(applyMessageDelete({ messageId }))
    }

    // Delete-for-me — server only emits this to the user who initiated.
    // Remove the message entirely from local state.
    const onMessageDeletedForMe = (evt: any) => {
      const messageId = evt?.messageId ?? evt?.message?.id
      if (!messageId) return
      dispatch(applyMessageDeleteForMe({ messageId }))
    }

    // Pin — broadcast to all participants. Server toggles state both directions
    // (pin and unpin both arrive via `message_pin_updated`).
    const onMessagePinUpdated = (evt: any) => {
      const messageId = evt?.messageId ?? evt?.message?.id
      // Default to true if the server omits the flag — `pinMessage` is the
      // common pattern; unpins usually include `isPinned: false` explicitly.
      const isPinned = typeof evt?.isPinned === 'boolean' ? evt.isPinned : true
      if (!messageId) return
      dispatch(applyMessagePin({ messageId, isPinned }))
    }

    // Participant left or was removed from a group — fires for ALL members
    // of the conversation. Payload (v1.1.3):
    //   { conversationId, userId, displayName, removedBy?, removedByName? }
    // When `userId === currentUser`, the reducer flips
    // `isCurrentUserActive=false`, which the composer + interaction gates
    // (`canInteract` in ChatContent, `isCurrentUserActive` in
    // UserProfileRight) react to immediately — no refresh required.
    // For other participants, their entry's `isActive` flips to false so
    // member counts and avatars update too.
    //
    // v1.1.3 distinguishes self-exit from admin-removal via the optional
    // `removedBy` field. When present AND the leaver is us, we surface
    // a toast and the reducer snapshots the admin's id/name so the
    // composer placeholder reads "You were removed by …" instead of the
    // generic copy. Field names are read defensively because the server
    // event isn't strongly typed in the SDK.
    // New participant added to a group — mirror of `participant_left`.
    // Payload (per v1.1.3): { conversationId, userId, displayName?,
    // avatarUrl?, username?, role? }. Reducer flips `isActive` back to
    // true on an existing soft-deleted entry OR pushes a new one,
    // patches `participantIds` / `adminIds` (if role=admin), and — when
    // the joiner is US — restores `isCurrentUserActive` and clears any
    // prior `removedBy` snapshot so the composer unlocks instantly.
    const onParticipantJoined = (evt: any) => {
      const conversationId = evt?.conversationId
      const userId = evt?.userId
      if (!conversationId || !userId) return
      const displayName: string | undefined = evt?.displayName ?? evt?.user?.displayName
      const username: string | undefined = evt?.username ?? evt?.user?.username
      const avatarUrl: string | undefined = evt?.avatarUrl ?? evt?.user?.avatarUrl
      const role: 'admin' | 'member' | undefined =
        evt?.role === 'admin' || evt?.role === 'member' ? evt.role : undefined
      dispatch(
        applyParticipantJoined({
          chatId: conversationId,
          userId,
          ...(displayName ? { displayName } : {}),
          ...(username ? { username } : {}),
          ...(avatarUrl ? { avatarUrl } : {}),
          ...(role ? { role } : {})
        })
      )

      // Re-add clears the synthesis dedupe for this conversation so a
      // future re-kick can synthesize a fresh pill (otherwise the ref
      // would block synthesis on the second kick).
      const meId = userProfileIdRef.current !== null ? String(userProfileIdRef.current) : ''
      if (meId && String(userId) === meId) {
        syntheticKickFiredRef.current.delete(String(conversationId))
      }
    }

    const onParticipantLeft = (evt: any) => {
      const conversationId = evt?.conversationId
      const userId = evt?.userId
      if (!conversationId || !userId) return
      const removedBy = evt?.removedBy
      let removedByName: string | undefined =
        evt?.removedByName ?? evt?.removedByDisplayName ?? evt?.removedBy?.displayName

      // Backend (v1.2.1) emits `participant_left` with `removedBy` (id) but
      // omits `removedByName`. The actor is still a group member (they're
      // the one who issued the kick), so their display name lives in our
      // cached `participants` array — same source SidebarLeft / ChatLog
      // read from for member names.
      if (!removedByName && removedBy) {
        const chat = chatsRef.current?.find(c => String(c.id) === String(conversationId))
        const actor = chat?.participants?.find(p => String(p.userId) === String(removedBy))
        removedByName = actor?.displayName ?? actor?.username
      }

      dispatch(
        applyParticipantLeft({
          chatId: conversationId,
          userId,
          ...(removedBy !== undefined && removedBy !== null ? { removedBy } : {}),
          ...(removedByName ? { removedByName } : {})
        })
      )

      // Removal toast intentionally suppressed — the inline composer
      // placeholder ("<Actor> removed you") already conveys the state
      // via the reducer snapshot of `removedBy`. The reducer below still
      // flips `isCurrentUserActive=false` and clears the pin so all
      // active UI signals reflect the removal without a toast.
      const me = userProfileIdRef.current !== null ? String(userProfileIdRef.current) : ''
      const leaverIsMe = me !== '' && String(userId) === me

      // Backend (v1.2.1) does NOT deliver the `user_removed` system
      // `new_message` event to the kicked socket — only `participant_left`
      // reaches us. So the in-chat removal pill never appears unless we
      // synthesize it client-side. Build a system message that mirrors the
      // shape the sender's UI receives (senderId/senderName = actor,
      // targetUserId/targetUserName = me) and route it through
      // `receiveMessage` so:
      //   1. The pill appears at the bottom of ChatLog ("<Actor> removed you")
      //   2. The kick-derivation logic in `receiveMessage` writes
      //      sidebar.lastMessage + removedBy/removedByName in one pass.
      // Deterministic id (`synthetic-kick-<conversationId>`) makes
      // re-dispatch idempotent — second call is dropped by the id-dedupe
      // branch in `receiveMessage`. Also harmless on later refresh: the
      // real server message replaces it via `setChatMessages`.
      if (leaverIsMe) {
        const convKey = String(conversationId)
        if (!syntheticKickFiredRef.current.has(convKey)) {
          syntheticKickFiredRef.current.add(convKey)
          const myName = userProfileNameRef.current
          const myId = userProfileIdRef.current
          const now = new Date()
          const isAdminKick = removedBy !== undefined && removedBy !== null
          // Use ISO timestamp — ChatLog's `toDateKey` / `formatDateLabel`
          // do `new Date(msg.time)` and expect a parseable value, NOT a
          // short HH:MM display string. Real messages from the adapter
          // use `msg.sentAt ?? msg.createdAt ?? new Date().toISOString()`,
          // so we match that exactly to keep the date-divider logic happy.
          //
          // Two synthesis shapes, picked by the kick-vs-leave discriminator:
          //   • Admin kick   → sender = actor, target = me, op = user_removed
          //   • Self-exit    → sender = me,    target = me, op = user_left
          // ChatLog + SidebarLeft rewrite each into the correct
          // perspective-specific copy ("Anil Rathod removed you" vs
          // "You left the group").
          const syntheticMessage = isAdminKick
            ? {
                id: `synthetic-kick-${convKey}-${now.getTime()}`,
                message: removedByName ? `${removedByName} removed you` : 'You were removed',
                time: now.toISOString(),
                senderId: String(removedBy),
                ...(removedByName ? { senderName: removedByName } : {}),
                feedback: { isSent: true, isDelivered: true, isSeen: true },
                contentType: 'system' as const,
                systemOperationType: 'user_removed',
                targetUserId: String(userId),
                ...(myName ? { targetUserName: myName } : {})
              }
            : {
                id: `synthetic-leave-${convKey}-${now.getTime()}`,
                message: 'You left the group',
                time: now.toISOString(),
                senderId: myId != null ? String(myId) : String(userId),
                ...(myName ? { senderName: myName } : {}),
                feedback: { isSent: true, isDelivered: true, isSeen: true },
                contentType: 'system' as const,
                systemOperationType: 'user_left',
                targetUserId: String(userId),
                ...(myName ? { targetUserName: myName } : {})
              }
          dispatch(
            receiveMessage({
              conversationId,
              message: syntheticMessage as any,
              isOwn: false
            })
          )
        }
      }

      // If the current user was removed from a pinned group, clear the pin
      // locally. The API call would be rejected since the user is no longer
      // a member, so we update Redux state directly — the server's own
      // membership removal already handles the server-side pin state.
      if (leaverIsMe) {
        const chat = chatsRef.current?.find(c => String(c.id) === String(conversationId))
        if (chat?.isPinned) {
          dispatch(updateChatFlags({ chatId: conversationId, isPinned: false }))
        }
      }
    }

    // Socket event handlers below
    chatSocket.on('new_message', onNewMessage)
    chatSocket.on('message_delivered', onMessageDelivered)
    chatSocket.on('messages_delivered', onMessagesDelivered)
    chatSocket.on('read_receipt', onReadReceipt)
    chatSocket.on('conversation_updated', onConversationUpdated)
    chatSocket.on('conversation_created', onConversationCreated)
    chatSocket.on('conversation_deleted', onConversationDeleted)
    chatSocket.on('reaction_updated', onReactionUpdated)
    chatSocket.on('message_updated', onMessageUpdated)
    chatSocket.on('message_deleted', onMessageDeleted)
    chatSocket.on('message_deleted_for_me', onMessageDeletedForMe)
    chatSocket.on('message_pin_updated', onMessagePinUpdated)
    chatSocket.on('participant_joined', onParticipantJoined)
    chatSocket.on('participant_left', onParticipantLeft)
    chatSocket.on('typing_indicator', handleTypingEvent)

    return () => {
      chatSocket.off('new_message', onNewMessage)
      chatSocket.off('message_delivered', onMessageDelivered)
      chatSocket.off('messages_delivered', onMessagesDelivered)
      chatSocket.off('read_receipt', onReadReceipt)
      chatSocket.off('conversation_updated', onConversationUpdated)
      chatSocket.off('conversation_created', onConversationCreated)
      chatSocket.off('conversation_deleted', onConversationDeleted)
      chatSocket.off('reaction_updated', onReactionUpdated)
      chatSocket.off('message_updated', onMessageUpdated)
      chatSocket.off('message_deleted', onMessageDeleted)
      chatSocket.off('message_deleted_for_me', onMessageDeletedForMe)
      chatSocket.off('message_pin_updated', onMessagePinUpdated)
      chatSocket.off('participant_joined', onParticipantJoined)
      chatSocket.off('participant_left', onParticipantLeft)
      chatSocket.off('typing_indicator', handleTypingEvent)
    }
  }, [chatSocket, chatConnected, chatError, chatClient, dispatch])

  const handleLeftSidebarToggle = () => setLeftSidebarOpen(!leftSidebarOpen)
  const handleUserProfileLeftSidebarToggle = () => setUserProfileLeftOpen(!userProfileLeftOpen)
  const handleUserProfileRightSidebarToggle = () => setUserProfileRightOpen(!userProfileRightOpen)

  return (
    <Box
      className='app-chat'
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        // borderRadius: 0,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: 'background.paper',
        boxShadow: skin === 'bordered' ? 0 : 6,
        ...(skin === 'bordered' && { border: `1px solid ${theme.palette.divider}` })
      }}
    >
      <SidebarLeft
        store={store}
        hidden={hidden}
        mdAbove={mdAbove}
        dispatch={dispatch}
        statusObj={statusObj}
        userStatus={userStatus}
        selectChat={selectChat}
        getInitials={getInitials}
        sidebarWidth={sidebarWidth}
        setUserStatus={setUserStatus}
        leftSidebarOpen={leftSidebarOpen}
        removeSelectedChat={removeSelectedChat}
        userProfileLeftOpen={userProfileLeftOpen}
        formatDateToMonthShort={formatDateToMonthShort}
        handleLeftSidebarToggle={handleLeftSidebarToggle}
        handleUserProfileLeftSidebarToggle={handleUserProfileLeftSidebarToggle}
        compact={compact}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
      />
      <ChatContent
        store={store}
        hidden={hidden}
        sendMsg={sendMsg}
        mdAbove={mdAbove}
        dispatch={dispatch}
        statusObj={statusObj}
        getInitials={getInitials}
        sidebarWidth={sidebarWidth}
        userProfileRightOpen={userProfileRightOpen}
        handleLeftSidebarToggle={handleLeftSidebarToggle}
        handleUserProfileRightSidebarToggle={handleUserProfileRightSidebarToggle}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
        typingUsers={store?.selectedChat?.contact?.id ? typingUsers[String(store.selectedChat.contact.id)] ?? [] : []}
      />
    </Box>
  )
}

export default AppChat
