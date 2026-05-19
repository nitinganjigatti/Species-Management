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
  removeSelectedChat,
  receiveMessage,
  setUnreadCount,
  applyReactionUpdate,
  applyMessageUpdate,
  applyMessageDelete,
  applyMessageDeleteForMe,
  applyMessagePin,
  updateMessagesFeedback
} from 'src/store/apps/chat'

// ** Adapters
import { joinChatRoom, markReadOverSocket, sdkMessageToMessage } from 'src/lib/chat/api'
import type { MessageDeliveredEvent, MessagesDeliveredEvent, ReadReceiptEvent } from 'src/lib/chat/api'
// ** Types
import { RootState, AppDispatch } from 'src/store'
import { StatusObjType, StatusType } from 'src/types/apps/chatTypes'

// ** Hooks
import { useSettings } from 'src/@core/hooks/useSettings'

// ** Utils Imports
import { getInitials } from 'src/@core/utils/get-initials'
import { formatDateToMonthShort } from 'src/@core/utils/format'

// ** Chat App Components Imports
import SidebarLeft from 'src/views/apps/chat/SidebarLeft'
import ChatContent from 'src/views/apps/chat/ChatContent'

// ** @antzsoft/chat-core smoke test — verifies the SDK can connect to the
// backend without touching the existing Redux/mock data path. Logs to console.
// Becomes a no-op when NEXT_PUBLIC_CHAT_API_URL is not set.
import { getSocketStatus, onSocketStatus, tryGetSocket, type SocketStatus } from '@antzsoft/chat-core'
import { getChatClientOrNull } from 'src/lib/chat/client'

// Optional `compact` flag forces single-pane mobile-style layout regardless
// of viewport width. ChatLauncher passes this when AppChat is rendered inside
// the narrow floating dock — the panel is always too small for the desktop
// two-pane layout, so we want the sidebar to act as a slide-in drawer.
type AppChatProps = {
  compact?: boolean
}

const AppChat = ({ compact = false }: AppChatProps = {}) => {
  // ** States
  const [userStatus, setUserStatus] = useState<StatusType>('online')
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(false)
  const [userProfileLeftOpen, setUserProfileLeftOpen] = useState<boolean>(false)
  const [userProfileRightOpen, setUserProfileRightOpen] = useState<boolean>(false)

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
  const mdAbove = !compact && useMediaQuery(theme.breakpoints.up('md'))
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

  useEffect(() => {
    if (!chatClient) return

    // Fetch profile first so `fetchChatsContacts` can use its id to identify
    // the "other" participant in direct conversations.
    const run = async () => {
      await dispatch(fetchUserProfile({ fallbackAvatarUrl }))
      dispatch(fetchChatsContacts())
    }
    run()
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

  // Refresh the conversation list whenever the socket transitions to
  // connected — picks up conversations created while we were offline.
  useEffect(() => {
    if (!chatClient || !chatConnected) return
    dispatch(fetchChatsContacts())
  }, [chatClient, chatConnected, dispatch])

  // Auto-select the first conversation on initial load so the chat panel
  // isn't blank when the user lands on /chat. Skips if a chat is already
  // selected (e.g. user already clicked one) or the list is empty.
  const autoSelectedRef = useRef(false)
  useEffect(() => {
    if (autoSelectedRef.current) return
    if (store?.selectedChat) {
      autoSelectedRef.current = true

      return
    }
    const first = store?.chats?.[0]
    if (!first) return

    autoSelectedRef.current = true
    dispatch(selectChat(first.id))
  }, [store?.chats, store?.selectedChat, dispatch])

  // Stable ref pointing at the currently open conversation id. Read inside the
  // socket handler so we can detect "message arrived in the chat I'm looking at"
  // without resubscribing the socket on every chat switch.
  const selectedChatIdRef = useRef<string | number | null>(null)
  useEffect(() => {
    selectedChatIdRef.current = store?.selectedChat?.contact.id ?? null
  }, [store?.selectedChat?.contact.id])

  // Stable ref for the current user's profile id — used inside socket handlers
  // to determine if a message is "ours" (instead of relying on tempId, which
  // the server broadcasts to everyone).
  const userProfileIdRef = useRef<string | number | null>(null)
  useEffect(() => {
    userProfileIdRef.current = store?.userProfile?.id ?? null
  }, [store?.userProfile?.id])

  // Stable ref of the chat id set. Used inside the new_message handler so we
  // can detect events for conversations we don't yet have (e.g. someone just
  // created a DM with us) and pull a fresh list via `fetchChatsContacts`.
  const knownChatIdsRef = useRef<Set<string | number>>(new Set())
  useEffect(() => {
    knownChatIdsRef.current = new Set(store?.chats?.map(c => c.id) ?? [])
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

      // TEMP DIAG — when investigating whether the backend emits a system
      // message on group-icon change, this surfaces only system-typed
      // messages so the console isn't drowned by regular chat traffic.
      // Filter by `[chat:system]`. Remove once verified.
      if (raw.content?.type === 'system') {
        // eslint-disable-next-line no-console
        console.log('[chat:system] new system message', {
          messageId: raw.id,
          conversationId: raw.conversationId,
          text: raw.content?.text,
          metadata: raw.content,
          full: raw
        })
      }

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

    // Authoritative unread count from the server. Fires whenever the server
    // recalculates this user's unread for a conversation — including mark-read
    // from another device — so the sidebar badge stays consistent across
    // tabs/devices without a REST refetch.
    const onUnreadCountChanged = (evt: any) => {
      const convId = evt?.conversationId
      const count = typeof evt?.unreadCount === 'number' ? evt.unreadCount : null
      if (!convId || count === null) return
      dispatch(setUnreadCount({ chatId: convId, count }))
    }

    // When a conversation is updated (metadata change, pin/unpin, mute, etc.),
    // refresh the conversation list so the sidebar reflects the change.
    const onConversationUpdated = (evt: any) => {
      const convId = evt?.conversationId
      if (!convId) return

      if (!knownChatIdsRef.current.has(convId)) {
        dispatch(fetchChatsContacts()).then(() => {
          joinChatRoom(convId)
        })
      } else {
        dispatch(fetchChatsContacts())
      }
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

    // When a conversation is deleted (admin action, leave-and-delete), remove
    // it from the sidebar so the stale row doesn't linger.
    const onConversationDeleted = (evt: any) => {
      const convId = evt?.conversationId ?? evt?.id
      if (!convId) return
      dispatch(fetchChatsContacts())
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

    // TEMPORARY: log every server event before our specific handlers run, so
    // we can verify event-name matches. Remove once read-receipt flow is
    // verified end-to-end on staging.
    const onAnyDebug = (eventName: string, ...args: unknown[]) => {
      // Highlight read-related events to make them easy to spot in the console.
      const isReadLike = /read|receipt|seen/i.test(eventName)
      const prefix = isReadLike ? '[chat:event ★ READ-LIKE]' : '[chat:event]'
      console.log(prefix, eventName, args)
    }

    chatSocket.onAny(onAnyDebug)
    chatSocket.on('new_message', onNewMessage)
    chatSocket.on('message_delivered', onMessageDelivered)
    chatSocket.on('messages_delivered', onMessagesDelivered)
    chatSocket.on('read_receipt', onReadReceipt)
    chatSocket.on('unread_count_changed', onUnreadCountChanged)
    chatSocket.on('conversation_updated', onConversationUpdated)
    chatSocket.on('conversation_created', onConversationCreated)
    chatSocket.on('conversation_deleted', onConversationDeleted)
    chatSocket.on('reaction_updated', onReactionUpdated)
    chatSocket.on('message_updated', onMessageUpdated)
    chatSocket.on('message_deleted', onMessageDeleted)
    chatSocket.on('message_deleted_for_me', onMessageDeletedForMe)
    chatSocket.on('message_pin_updated', onMessagePinUpdated)
    chatSocket.on('typing_indicator', handleTypingEvent)

    return () => {
      chatSocket.offAny(onAnyDebug)
      chatSocket.off('new_message', onNewMessage)
      chatSocket.off('message_delivered', onMessageDelivered)
      chatSocket.off('messages_delivered', onMessagesDelivered)
      chatSocket.off('read_receipt', onReadReceipt)
      chatSocket.off('unread_count_changed', onUnreadCountChanged)
      chatSocket.off('conversation_updated', onConversationUpdated)
      chatSocket.off('conversation_created', onConversationCreated)
      chatSocket.off('conversation_deleted', onConversationDeleted)
      chatSocket.off('reaction_updated', onReactionUpdated)
      chatSocket.off('message_updated', onMessageUpdated)
      chatSocket.off('message_deleted', onMessageDeleted)
      chatSocket.off('message_deleted_for_me', onMessageDeletedForMe)
      chatSocket.off('message_pin_updated', onMessagePinUpdated)
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
        borderRadius: 1,
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
        typingUsers={
          store?.selectedChat?.contact?.id
            ? typingUsers[String(store.selectedChat.contact.id)] ?? []
            : []
        }
      />
    </Box>
  )
}

export default AppChat
