'use client'

// ** React Imports
import { useEffect, useRef, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

// ** Store & Actions Imports
import { useDispatch, useSelector } from 'react-redux'
import {
  sendMsg,
  selectChat,
  fetchUserProfile,
  fetchChatsContacts,
  removeSelectedChat,
  receiveMessage,
  updateMessagesFeedback
} from 'src/store/apps/chat'

// ** Adapters
import { joinChatRoom, markConversationRead, sdkMessageToMessage } from 'src/lib/chat/api'
import type {
  MessageDeliveredEvent,
  MessagesDeliveredEvent,
  ReadReceiptEvent
} from 'src/lib/chat/api'

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
    dispatch(fetchUserProfile())
  }, [dispatch])

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
      await dispatch(fetchUserProfile())
      dispatch(fetchChatsContacts())
    }
    run()
  }, [chatClient, dispatch])

  // Join every conversation's Socket.IO room so the server pushes that room's
  // `new_message` (and delivery/read) events to us. The SDK's `socketEmit.joinRoom`
  // would normally handle this, but we use our own socket wrapper (path-prefix
  // workaround). Re-joining is idempotent on Socket.IO; emitting again on
  // every list change is fine.
  useEffect(() => {
    if (!chatSocket || !chatConnected) return
    if (!store?.chats) return

    const roomIds = store.chats.filter(c => typeof c.id === 'string').map(c => c.id)
    console.log('[chat] joining rooms:', roomIds)
    roomIds.forEach(id => joinChatRoom(id as string))
  }, [chatSocket, chatConnected, store?.chats])

  // Refresh the conversation list whenever the socket transitions to
  // connected — picks up conversations created while we were offline.
  useEffect(() => {
    if (!chatClient || !chatConnected) return
    dispatch(fetchChatsContacts())
  }, [chatClient, chatConnected, dispatch])

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
        console.warn('[chat:trace] B0. new_message — could not extract message from event:', evt)

        return
      }

      // Determine if this is our own message by comparing senderId with our
      // profile id — tempId is unreliable because the server broadcasts it
      // to all participants, not just the sender.
      const isOwn = Boolean(
        userProfileIdRef.current && raw.senderId === String(userProfileIdRef.current)
      )

      console.log('[chat:trace] B1. socket on(new_message) →', {
        msgId: raw.id,
        conversationId: raw.conversationId,
        senderId: raw.senderId,
        currentUserId: userProfileIdRef.current,
        isOwn,
        knownConv: knownChatIdsRef.current.has(raw.conversationId)
      })

      if (!knownChatIdsRef.current.has(raw.conversationId)) {
        console.log('[chat:trace] B2. unknown conversation → fetchChatsContacts() then receive')
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
        console.log('[chat:trace] B3. message in open chat → markAsRead')
        markConversationRead(raw.conversationId).catch(err => {
          console.warn('[chat:trace] markAsRead on receive failed:', err)
        })
      }
    }
    // Single-message delivered (other side received it).
    const onMessageDelivered = (evt: MessageDeliveredEvent) => {
      if (!evt) return
      console.log('[chat] message_delivered:', evt.messageId)
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
      console.log('[chat] messages_delivered:', evt.messageIds.length, 'in', evt.conversationId)
      dispatch(
        updateMessagesFeedback({
          conversationId: evt.conversationId,
          messageIds: evt.messageIds,
          isDelivered: true
        })
      )
    }

    // Read receipt — flips the ✓✓ ticks blue. Server payload may carry a
    // single messageId, an `updatedMessageIds[]` partial-read set, or a
    // `fullyReadMessageIds[]` everyone-read set. We treat any of them as
    // "seen" for the purposes of the local UI.
    const onReadReceipt = (evt: ReadReceiptEvent) => {
      if (!evt) return
      const ids = [
        ...(evt.fullyReadMessageIds ?? []),
        ...(evt.updatedMessageIds ?? []),
        ...(evt.messageId ? [evt.messageId] : [])
      ]
      if (!ids.length) return
      console.log('[chat] read_receipt:', ids.length, 'in', evt.conversationId)
      dispatch(
        updateMessagesFeedback({
          conversationId: evt.conversationId,
          messageIds: ids,
          isSeen: true
        })
      )
    }

    const onTyping = (evt: unknown) => console.log('[chat] typing:', evt)
    const onUserStatus = (evt: unknown) => console.log('[chat] user_status:', evt)

    // When a conversation is created/updated (e.g. user added to a new group),
    // refresh the conversation list so the new chat appears in the sidebar and
    // we join its socket room (via the room-joining effect).
    const onConversationUpdated = (evt: any) => {
      console.log('[chat] conversation_updated:', evt)
      const convId = evt?.conversationId
      if (convId && !knownChatIdsRef.current.has(convId)) {
        console.log('[chat] new conversation detected → refreshing list + joining room')
        dispatch(fetchChatsContacts()).then(() => {
          joinChatRoom(convId)
        })
      }
    }

    // DEBUG: catch every event the server fires so we can confirm which
    // ones are arriving when two users are interacting.
    const onAny = (eventName: string, ...args: unknown[]) =>
      console.log('[chat:event]', eventName, args)

    chatSocket.on('new_message', onNewMessage)
    chatSocket.on('message_delivered', onMessageDelivered)
    chatSocket.on('messages_delivered', onMessagesDelivered)
    chatSocket.on('read_receipt', onReadReceipt)
    chatSocket.on('typing', onTyping)
    chatSocket.on('user_status', onUserStatus)
    chatSocket.on('conversation_updated', onConversationUpdated)
    chatSocket.onAny(onAny)

    return () => {
      chatSocket.off('new_message', onNewMessage)
      chatSocket.off('message_delivered', onMessageDelivered)
      chatSocket.off('messages_delivered', onMessagesDelivered)
      chatSocket.off('read_receipt', onReadReceipt)
      chatSocket.off('typing', onTyping)
      chatSocket.off('user_status', onUserStatus)
      chatSocket.off('conversation_updated', onConversationUpdated)
      chatSocket.offAny(onAny)
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
