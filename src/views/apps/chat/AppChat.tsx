'use client'

// ** React Imports
import { useEffect, useRef, useState } from 'react'

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
  updateMessagesFeedback
} from 'src/store/apps/chat'

// ** Adapters
import { joinChatRoom, markConversationRead, sdkMessageToMessage } from 'src/lib/chat/api'
import type { MessageDeliveredEvent, MessagesDeliveredEvent, ReadReceiptEvent } from 'src/lib/chat/api'
import { useChatStore as sdkChatStore } from '@antzsoft/chat-core'

// ** Types
import reduxStore, { RootState, AppDispatch } from 'src/store'
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
import { useChatClient } from 'src/hooks/useChatClient'

const AppChat = () => {
  // ** States
  const [userStatus, setUserStatus] = useState<StatusType>('online')
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(false)
  const [userProfileLeftOpen, setUserProfileLeftOpen] = useState<boolean>(false)
  const [userProfileRightOpen, setUserProfileRightOpen] = useState<boolean>(false)

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
  const hidden = useMediaQuery(theme.breakpoints.down('lg'))
  const store = useSelector((state: RootState) => state.chat)

  // ** Vars
  const { skin } = settings
  const smAbove = useMediaQuery(theme.breakpoints.up('sm'))
  const sidebarWidth = smAbove ? 370 : 300
  const mdAbove = useMediaQuery(theme.breakpoints.up('md'))
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
  const { client: chatClient, socket: chatSocket, connected: chatConnected, error: chatError } = useChatClient()

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
        // This call is what tells the server "I read this" → server then
        // broadcasts read_receipt to the SENDER so their tick turns green.
        markConversationRead(raw.conversationId).catch(err =>
          console.warn('[chat] markConversationRead failed on receive for', raw.conversationId, err)
        )
      }
    }
    // Helper: look up which other participants of a conversation are
    // currently online per the SDK's auto-maintained presence store.
    // Used to detect backend semantic bugs where `message_delivered` fires
    // even though no recipient was online at the time.
    type PresenceInfo = {
      onlineUsers: string[]
      others: string[]
      onlineOthers: string[]
      offlineOthers: string[]
      error?: string
    }
    const presenceSnapshot = (convId: string): PresenceInfo => {
      try {
        const sdkState = sdkChatStore.getState()
        const onlineUsers: string[] = sdkState.onlineUsers ?? []
        const me = userProfileIdRef.current ? String(userProfileIdRef.current) : null
        const chats = reduxStore.getState().chat.chats ?? []
        const chat = chats.find(c => c.id === convId)
        const others = ((chat?.participantIds as string[]) ?? []).filter(id => id !== me)
        const onlineOthers = others.filter(id => onlineUsers.includes(id))
        const offlineOthers = others.filter(id => !onlineUsers.includes(id))

        return { onlineUsers, others, onlineOthers, offlineOthers }
      } catch (err) {
        return { onlineUsers: [], others: [], onlineOthers: [], offlineOthers: [], error: String(err) }
      }
    }

    // Single-message delivered (other side received it).
    const onMessageDelivered = (evt: MessageDeliveredEvent) => {
      if (!evt) return
      const presence = presenceSnapshot(evt.conversationId)
      console.log('[chat:receipt] D1 message_delivered ← event:', {
        messageId: evt.messageId,
        conversationId: evt.conversationId,
        presence
      })
      // POLICY: read_receipt is the source of truth for tick state.
      // The backend stamps `message_delivered` prematurely (fires even when
      // no recipient device is actually online). To keep the tick honest:
      //   - If no recipient is online → skip; tick stays single ✓
      //   - When the recipient actually reads, `read_receipt` arrives and the
      //     reducer sets both `isSeen=true` AND `isDelivered=true` in one go,
      //     so the tick jumps from single ✓ straight to double-green ✓✓
      if (presence.others.length > 0 && presence.onlineOthers.length === 0) {
        console.warn(
          '[chat:receipt] ⚠ D1 SKIPPED — message_delivered fired but no recipient is online. Waiting for read_receipt to advance tick.',
          { messageId: evt.messageId, offlineRecipients: presence.offlineOthers }
        )

        return
      }
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
      const presence = presenceSnapshot(evt.conversationId)
      console.log('[chat:receipt] D1b messages_delivered ← event:', {
        conversationId: evt.conversationId,
        count: evt.messageIds.length,
        messageIds: evt.messageIds,
        presence
      })
      // Same policy as onMessageDelivered — defer to read_receipt when no
      // recipient is online. See comment there.
      if (presence.others.length > 0 && presence.onlineOthers.length === 0) {
        console.warn(
          '[chat:receipt] ⚠ D1b SKIPPED — batch messages_delivered fired but no recipient is online. Waiting for read_receipt to advance tick.',
          { count: evt.messageIds.length, offlineRecipients: presence.offlineOthers }
        )

        return
      }
      dispatch(
        updateMessagesFeedback({
          conversationId: evt.conversationId,
          messageIds: evt.messageIds,
          isDelivered: true
        })
      )
    }

    // Read receipt — flips the ✓✓ ticks green/blue. The seen indicator MUST
    // only fire when EVERY participant has read the message — that's the
    // `fullyReadMessageIds` field on the SDK's ReadReceiptEvent. The other
    // fields (`updatedMessageIds`, `messageId`, `userId`) describe which
    // single user just read which messages — that's a partial-read signal,
    // not "seen by everyone". Flipping the tick on a partial read would be
    // wrong for group chats (tick goes green as soon as one of N people
    // reads). For DMs both fields contain the same id, so behavior is
    // unchanged there.
    const onReadReceipt = (evt: ReadReceiptEvent) => {
      if (!evt) {
        console.warn('[chat:receipt] S0 read_receipt ← null/undefined event, ignoring')

        return
      }
      const sPresence = presenceSnapshot(evt.conversationId)
      console.log('[chat:receipt] S1 read_receipt ← raw event:', {
        conversationId: evt.conversationId,
        readerUserId: (evt as any).userId,
        readAt: (evt as any).readAt,
        messageId: evt.messageId,
        updatedMessageIds: evt.updatedMessageIds,
        fullyReadMessageIds: evt.fullyReadMessageIds,
        presence: sPresence
      })

      // TEMPORARY DIAGNOSTIC: print our current state for the message id in the
      // event so we can see (a) which conversation it actually lives in,
      // (b) its current feedback, (c) whether selectedChat is the same chat.
      const debugIds = [
        ...(evt.fullyReadMessageIds ?? []),
        ...(evt.updatedMessageIds ?? []),
        ...(evt.messageId ? [evt.messageId] : [])
      ]
      const stateSnap = reduxStore.getState().chat
      const located = debugIds.map(id => {
        const owner = (stateSnap.chats ?? []).find(c => c.chat?.messages?.some(m => m.id === id))
        const msg = owner?.chat?.messages?.find(m => m.id === id)

        return {
          id,
          foundInChat: owner?.id ?? null,
          isGroup: owner?.isGroup ?? null,
          currentFeedback: msg?.feedback ?? null
        }
      })
      console.log('[chat:receipt] S1b local-state lookup for each id:', {
        located,
        selectedChatId: stateSnap.selectedChat?.contact?.id ?? null,
        eventConversationId: evt.conversationId
      })
      const readerUserId = (evt as any).userId
      const me = userProfileIdRef.current ? String(userProfileIdRef.current) : null
      // Suppress when the reader is us — the SDK's `onlineUsers` list excludes
      // the current user by design, so "self not in list" is expected, not a
      // backend bug. Only warn when an OTHER user is the reader but appears offline.
      if (readerUserId && readerUserId !== me && !sPresence.onlineUsers.includes(readerUserId)) {
        console.warn(
          '[chat:receipt] ⚠ S1 BACKEND-SUSPICIOUS — read_receipt fired but reader is NOT in SDK onlineUsers. Either reader logged out before receipt propagated or backend timing issue.',
          { readerUserId, onlineUsers: sPresence.onlineUsers }
        )
      }

      // Determine whether this conversation is a DM or a group. The receipt's
      // own `conversationId` is unreliable (backend bug — sometimes mismatched),
      // so we look up the conversation from any known message id in the event.
      const candidateIds = [
        ...(evt.fullyReadMessageIds ?? []),
        ...(evt.updatedMessageIds ?? []),
        ...(evt.messageId ? [evt.messageId] : [])
      ]
      let isGroupConversation = false
      let resolvedConvId: string | undefined = evt.conversationId
      const chats = reduxStore.getState().chat.chats ?? []
      for (const id of candidateIds) {
        const owner = chats.find(c => c.chat?.messages?.some(m => m.id === id))
        if (owner) {
          isGroupConversation = Boolean(owner.isGroup)
          resolvedConvId = owner.id as string
          break
        }
      }
      // Fall back to the event's conversationId if we couldn't locate the
      // message yet (race condition where receipt arrives before the message).
      if (!resolvedConvId || resolvedConvId === evt.conversationId) {
        const direct = chats.find(c => c.id === evt.conversationId)
        if (direct) isGroupConversation = Boolean(direct.isGroup)
      }

      // For groups: only `fullyReadMessageIds` counts as "seen by everyone".
      // For DMs:    there's only one other participant, so ANY read is a
      //             full read — backend may put the id in `messageId` /
      //             `updatedMessageIds` / `fullyReadMessageIds`, all are valid.
      const fullyReadIds = isGroupConversation ? evt.fullyReadMessageIds ?? [] : candidateIds
      const partiallyReadIds = isGroupConversation
        ? [...(evt.updatedMessageIds ?? []), ...(evt.messageId ? [evt.messageId] : [])].filter(
            id => !(evt.fullyReadMessageIds ?? []).includes(id)
          )
        : []

      console.log('[chat:receipt] S2 split:', {
        isGroupConversation,
        resolvedConvId,
        fullyReadIds,
        partiallyReadIds,
        note: isGroupConversation
          ? 'GROUP: only fullyReadMessageIds flips green; partial reads are ignored'
          : 'DM: any read = fully read (only one recipient)'
      })

      if (!fullyReadIds.length) {
        console.log('[chat:receipt] S2a no read ids to apply — green tick not flipped this event')

        return
      }
      console.log('[chat:receipt] S3 dispatching updateMessagesFeedback (isSeen=true) for', fullyReadIds.length, 'ids')
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

    // When a conversation is updated (metadata change, last message, etc.),
    // refresh the conversation list so the sidebar reflects the change.
    const onConversationUpdated = (evt: any) => {
      const convId = evt?.conversationId
      if (convId && !knownChatIdsRef.current.has(convId)) {
        dispatch(fetchChatsContacts()).then(() => {
          joinChatRoom(convId)
        })
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
      />
    </Box>
  )
}

export default AppChat
