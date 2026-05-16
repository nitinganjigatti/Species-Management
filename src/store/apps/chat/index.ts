// ** Redux Imports
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

// ** Types
import type {
  ChatStoreType,
  ChatsArrType,
  ContactType,
  ProfileUserType,
  ChatType,
  MessageType,
  SendMsgParamsType,
  ChatFilterType,
  ChatEntityId,
  CreateGroupPayload
} from 'src/types/apps/chatTypes'

// ** Chat SDK — all `@antzsoft/chat-core` calls go through this facade.
//    See src/lib/chat/api.ts for the full SDK surface in one place.
import { getChatClientOrNull } from 'src/lib/chat/client'
import {
  getMe,
  listConversations,
  getConversation,
  createGroupConversation,
  createDirectConversation,
  updateConversation,
  deleteConversation as apiDeleteConversation,
  addParticipants as apiAddParticipants,
  removeParticipant as apiRemoveParticipant,
  updateParticipantRole as apiUpdateParticipantRole,
  muteConversation as apiMuteConversation,
  unmuteConversation as apiUnmuteConversation,
  pinConversation as apiPinConversation,
  unpinConversation as apiUnpinConversation,
  leaveConversation,
  getConversationMembers,
  listMessages,
  markConversationRead,
  sendMessageOverSocket,
  sdkUserToProfile,
  sdkConversationToChat,
  sdkMessageToMessage,
  extractContactsFromConversations
} from 'src/lib/chat/api'

// ----------------------------------------------------------------------
// Async Thunks — talk to the chat backend via @antzsoft/chat-core.
// If the SDK isn't initialized yet (auth not resolved or env vars missing)
// thunks resolve with empty state so the UI stays consistent.
// ----------------------------------------------------------------------

/**
 * Fetch the current user's chat profile via `GET /users/me`.
 */
export const fetchUserProfile = createAsyncThunk<ProfileUserType | null>(
  'appChat/fetchUserProfile',
  async () => {
    const client = getChatClientOrNull()
    if (!client) return null

    try {
      const sdkUser = await getMe()
      const profile = sdkUserToProfile(sdkUser)
      console.log('[chat] fetchUserProfile ← SDK:', profile)

      return profile
    } catch (err) {
      console.error('[chat] fetchUserProfile failed:', err)

      return null
    }
  }
)

/**
 * Fetch the user's conversation list + a derived contact directory.
 *
 * - chats: `GET /conversations` → `Conversation[]` → adapter → `ChatsArrType[]`
 * - contacts: deduped participants from the same conversation list
 *   (the SDK has no "list all users" endpoint exposed, so we bootstrap
 *   contacts from people the user already chats with).
 */
export const fetchChatsContacts = createAsyncThunk<{
  chatsContacts: ChatsArrType[]
  contacts: ContactType[]
}>('appChat/fetchChatsContacts', async (_, { getState }) => {
  const client = getChatClientOrNull()
  if (!client) return { chatsContacts: [], contacts: [] }

  // Use the authenticated user's id (set by fetchUserProfile) so the adapter
  // can identify the "other" participant in each direct conversation.
  const state = getState() as { chat?: ChatStoreType }
  const currentUserId = state.chat?.userProfile?.id ?? ''

  try {
    const resp = await listConversations({ page: 1, limit: 50 })
    const conversations = resp.data ?? []
    console.log('[chat] fetchChatsContacts ← SDK:', conversations.length, 'conversations')

    const chatsContacts = conversations.map(c => sdkConversationToChat(c, currentUserId))
    const contacts = extractContactsFromConversations(conversations, currentUserId)

    return { chatsContacts, contacts }
  } catch (err) {
    console.error('[chat] fetchChatsContacts failed:', err)

    return { chatsContacts: [], contacts: [] }
  }
})

/**
 * Start (or reopen) a direct conversation with another user.
 *
 * The backend's `POST /conversations/direct` is idempotent — if a direct
 * conversation between the two users already exists, the same one comes back.
 * Flow:
 *   1. Call `client.conversations.createDirect({ userId })`.
 *   2. Map the returned Conversation through our adapter and dispatch
 *      `addOrReplaceChat` so it appears in the sidebar (or moves to the top).
 *   3. Dispatch `selectChat` so the panel opens with messages loaded.
 */
export const startDirectChat = createAsyncThunk<void, ChatEntityId>(
  'appChat/startDirectChat',
  async (userId, { dispatch, getState }) => {
    const client = getChatClientOrNull()
    if (!client) return

    try {
      const conv = await createDirectConversation({ userId: String(userId) })
      console.log('[chat] startDirectChat ← SDK:', conv.id, 'with user', userId)

      const state = getState() as { chat?: ChatStoreType }
      const currentUserId = state.chat?.userProfile?.id ?? ''
      const chat = sdkConversationToChat(conv, currentUserId)

      dispatch(addOrReplaceChat(chat))
      dispatch(selectChat(conv.id))
    } catch (err) {
      console.error('[chat] startDirectChat failed:', err)
    }
  }
)

/**
 * Create a new group conversation.
 *
 * Calls `POST /conversations/group` with `{ name, description, icon, participantIds }`
 * and inserts the returned Conversation at the top of the sidebar via
 * `addOrReplaceChat`, then opens it via `selectChat`.
 *
 * The SDK's `CreateGroupData.participantIds` is `string[]` — coerce here since
 * our local `CreateGroupPayload` uses `ChatEntityId[]`.
 */
export const createGroupChat = createAsyncThunk<void, CreateGroupPayload>(
  'appChat/createGroupChat',
  async (payload, { dispatch, getState }) => {
    const client = getChatClientOrNull()
    if (!client) {
      console.warn('[chat] createGroupChat: SDK not ready')

      return
    }

    try {
      const conv = await createGroupConversation({
        name: payload.name,
        description: payload.description,
        icon: payload.icon,
        participantIds: payload.participantIds.map(String)
      })
      console.log('[chat] createGroupChat ← SDK:', conv.id, conv.name)

      const state = getState() as { chat?: ChatStoreType }
      const currentUserId = state.chat?.userProfile?.id ?? ''
      const chat = sdkConversationToChat(conv, currentUserId)

      dispatch(addOrReplaceChat(chat))
      dispatch(selectChat(conv.id))
    } catch (err) {
      console.error('[chat] createGroupChat failed:', err)
    }
  }
)

/**
 * Add one or more participants to an existing group.
 *
 * `POST /conversations/{id}/participants` → returns the updated Conversation
 * which we feed through the adapter and dispatch via `addOrReplaceChat`. The
 * reducer preserves any cached messages locally.
 */
export const addParticipantsToGroup = createAsyncThunk<
  void,
  { groupId: ChatEntityId; userIds: ChatEntityId[] }
>('appChat/addParticipantsToGroup', async ({ groupId, userIds }, { dispatch, getState }) => {
  const client = getChatClientOrNull()
  if (!client) {
    console.warn('[chat] addParticipantsToGroup: SDK not ready')

    return
  }
  if (typeof groupId !== 'string') {
    console.warn('[chat] addParticipantsToGroup: groupId must be a real conversation id')

    return
  }

  try {
    const conv = await apiAddParticipants(groupId, userIds.map(String))
    console.log('[chat] addParticipantsToGroup ← SDK:', groupId, '+', userIds.length, 'members')

    const state = getState() as { chat?: ChatStoreType }
    const currentUserId = state.chat?.userProfile?.id ?? ''
    const chat = sdkConversationToChat(conv, currentUserId)

    dispatch(addOrReplaceChat(chat))
  } catch (err) {
    console.error('[chat] addParticipantsToGroup failed:', err)
  }
})

/**
 * Leave a group conversation.
 *
 * `POST /conversations/{id}/leave` — server removes the user from the group.
 * On success we remove the chat row from the sidebar and clear `selectedChat`
 * if it was the one being viewed.
 */
export const leaveGroupChat = createAsyncThunk<void, ChatEntityId>(
  'appChat/leaveGroupChat',
  async (groupId, { dispatch }) => {
    const client = getChatClientOrNull()
    if (!client) {
      console.warn('[chat] leaveGroupChat: SDK not ready')

      return
    }
    if (typeof groupId !== 'string') {
      console.warn('[chat] leaveGroupChat: groupId must be a real conversation id')

      return
    }

    try {
      await leaveConversation(groupId)
      console.log('[chat] leaveGroupChat ← SDK:', groupId)
      dispatch(removeChatFromList(groupId))
    } catch (err) {
      console.error('[chat] leaveGroupChat failed:', err)
    }
  }
)

/**
 * Delete a conversation (admin-only on the backend).
 *
 * `DELETE /conversations/{id}` — server tears the group down for everyone.
 * On success we remove the chat row from the sidebar locally. Non-admin
 * callers will get a 403 which is logged but doesn't break the UI.
 */
export const deleteConversation = createAsyncThunk<void, ChatEntityId>(
  'appChat/deleteConversation',
  async (chatId, { dispatch }) => {
    const client = getChatClientOrNull()
    if (!client) {
      console.warn('[chat] deleteConversation: SDK not ready')

      return
    }
    if (typeof chatId !== 'string') {
      console.warn('[chat] deleteConversation: chatId must be a real conversation id')

      return
    }

    try {
      await apiDeleteConversation(chatId)
      console.log('[chat] deleteConversation ← SDK:', chatId)
      dispatch(removeChatFromList(chatId))
    } catch (err) {
      console.error('[chat] deleteConversation failed:', err)
    }
  }
)

/**
 * Fetch a single conversation by id and reconcile it into the sidebar.
 * Useful after operations that don't echo back the updated Conversation
 * (eg. mute/pin) and we want the source-of-truth state.
 */
export const fetchConversation = createAsyncThunk<void, ChatEntityId>(
  'appChat/fetchConversation',
  async (chatId, { dispatch, getState }) => {
    const client = getChatClientOrNull()
    if (!client || typeof chatId !== 'string') return

    try {
      const conv = await getConversation(chatId)
      const state = getState() as { chat?: ChatStoreType }
      const currentUserId = state.chat?.userProfile?.id ?? ''
      dispatch(addOrReplaceChat(sdkConversationToChat(conv, currentUserId)))
    } catch (err) {
      console.error('[chat] fetchConversation failed:', err)
    }
  }
)

/**
 * Update group metadata (name / description / icon).
 * Server returns the updated Conversation; we reconcile via `addOrReplaceChat`.
 */
export const updateGroupChat = createAsyncThunk<
  void,
  { chatId: ChatEntityId; name?: string; description?: string; icon?: string }
>('appChat/updateGroupChat', async ({ chatId, name, description, icon }, { dispatch, getState }) => {
  const client = getChatClientOrNull()
  if (!client || typeof chatId !== 'string') return

  try {
    const conv = await updateConversation(chatId, { name, description, icon })
    console.log('[chat] updateGroupChat ← SDK:', chatId)
    const state = getState() as { chat?: ChatStoreType }
    const currentUserId = state.chat?.userProfile?.id ?? ''
    dispatch(addOrReplaceChat(sdkConversationToChat(conv, currentUserId)))
  } catch (err) {
    console.error('[chat] updateGroupChat failed:', err)
  }
})

/**
 * Remove a participant from a group (admin-only on the backend).
 */
export const removeParticipantFromGroup = createAsyncThunk<
  void,
  { groupId: ChatEntityId; userId: ChatEntityId }
>('appChat/removeParticipantFromGroup', async ({ groupId, userId }, { dispatch, getState }) => {
  const client = getChatClientOrNull()
  if (!client || typeof groupId !== 'string') return

  try {
    const conv = await apiRemoveParticipant(groupId, String(userId))
    console.log('[chat] removeParticipantFromGroup ← SDK:', groupId, 'removed', userId)
    const state = getState() as { chat?: ChatStoreType }
    const currentUserId = state.chat?.userProfile?.id ?? ''
    dispatch(addOrReplaceChat(sdkConversationToChat(conv, currentUserId)))
  } catch (err) {
    console.error('[chat] removeParticipantFromGroup failed:', err)
  }
})

/**
 * Promote / demote a participant within a group (admin-only).
 */
export const updateParticipantRoleInGroup = createAsyncThunk<
  void,
  { groupId: ChatEntityId; userId: ChatEntityId; role: 'admin' | 'member' }
>('appChat/updateParticipantRoleInGroup', async ({ groupId, userId, role }, { dispatch, getState }) => {
  const client = getChatClientOrNull()
  if (!client || typeof groupId !== 'string') return

  try {
    const conv = await apiUpdateParticipantRole(groupId, String(userId), role)
    console.log('[chat] updateParticipantRoleInGroup ← SDK:', groupId, userId, '→', role)
    const state = getState() as { chat?: ChatStoreType }
    const currentUserId = state.chat?.userProfile?.id ?? ''
    dispatch(addOrReplaceChat(sdkConversationToChat(conv, currentUserId)))
  } catch (err) {
    console.error('[chat] updateParticipantRoleInGroup failed:', err)
  }
})

/**
 * Mute / unmute a conversation. `mute` accepts an optional ISO `mutedUntil`
 * date — omit it for an indefinite mute.
 */
export const muteConversation = createAsyncThunk<
  void,
  { chatId: ChatEntityId; mutedUntil?: string }
>('appChat/muteConversation', async ({ chatId, mutedUntil }, { dispatch }) => {
  const client = getChatClientOrNull()
  if (!client || typeof chatId !== 'string') return

  try {
    await apiMuteConversation(chatId, mutedUntil)
    console.log('[chat] muteConversation ← SDK:', chatId)
    dispatch(updateChatFlags({ chatId, isMuted: true }))
  } catch (err) {
    console.error('[chat] muteConversation failed:', err)
  }
})

export const unmuteConversation = createAsyncThunk<void, ChatEntityId>(
  'appChat/unmuteConversation',
  async (chatId, { dispatch }) => {
    const client = getChatClientOrNull()
    if (!client || typeof chatId !== 'string') return

    try {
      await apiUnmuteConversation(chatId)
      console.log('[chat] unmuteConversation ← SDK:', chatId)
      dispatch(updateChatFlags({ chatId, isMuted: false }))
    } catch (err) {
      console.error('[chat] unmuteConversation failed:', err)
    }
  }
)

/**
 * Pin / unpin a conversation. Both return void from the backend, so we update
 * local state optimistically.
 */
export const pinConversation = createAsyncThunk<void, ChatEntityId>(
  'appChat/pinConversation',
  async (chatId, { dispatch }) => {
    const client = getChatClientOrNull()
    if (!client || typeof chatId !== 'string') return

    try {
      await apiPinConversation(chatId)
      console.log('[chat] pinConversation ← SDK:', chatId)
      dispatch(updateChatFlags({ chatId, isPinned: true }))
    } catch (err) {
      console.error('[chat] pinConversation failed:', err)
    }
  }
)

export const unpinConversation = createAsyncThunk<void, ChatEntityId>(
  'appChat/unpinConversation',
  async (chatId, { dispatch }) => {
    const client = getChatClientOrNull()
    if (!client || typeof chatId !== 'string') return

    try {
      await apiUnpinConversation(chatId)
      console.log('[chat] unpinConversation ← SDK:', chatId)
      dispatch(updateChatFlags({ chatId, isPinned: false }))
    } catch (err) {
      console.error('[chat] unpinConversation failed:', err)
    }
  }
)

/**
 * Fetch the full User profiles of every participant in a group.
 * Returns the array directly — callers can use the result to render richer
 * member rows (avatars, statuses) than what the embedded `participants` array
 * carries.
 */
export const getGroupMembers = createAsyncThunk<
  Awaited<ReturnType<NonNullable<ReturnType<typeof getChatClientOrNull>>['conversations']['getMembers']>>,
  ChatEntityId
>('appChat/getGroupMembers', async chatId => {
  const client = getChatClientOrNull()
  if (!client || typeof chatId !== 'string') return []
  try {
    return await getConversationMembers(chatId)
  } catch (err) {
    console.error('[chat] getGroupMembers failed:', err)

    return []
  }
})

/**
 * Open a chat and load its messages.
 *
 * Two phases:
 *   1. Sync: dispatch `setSelectedChat(id)` so the panel opens immediately
 *      with whatever messages are already cached on the chat entry.
 *   2. Async: `messages.list()` to load the latest page (newest-first, we
 *      reverse for chronological render) and `markAsRead` to clear the
 *      server-side unread badge.
 */
export const selectChat = createAsyncThunk<void, ChatEntityId>(
  'appChat/selectChat',
  async (chatId, { dispatch }) => {
    // Phase 1 — open immediately
    dispatch(setSelectedChat(chatId))

    // Phase 2 — load real messages
    const client = getChatClientOrNull()
    if (!client) return
    if (typeof chatId !== 'string') return

    try {
      const resp = await listMessages(chatId, { limit: 50 })
      const sdkMessages = resp.data ?? []
      console.log('[chat] selectChat ← SDK:', sdkMessages.length, 'messages for', chatId)

      // SDK returns newest-first; the UI renders top-to-bottom oldest-to-newest.
      const messages = [...sdkMessages].reverse().map(sdkMessageToMessage)

      dispatch(setChatMessages({ chatId, messages }))

      // Clear the server-side unread badge. Fire-and-forget — a failure here
      // just means the badge sticks around, not a UX-breaking error.
      markConversationRead(chatId).catch(err => {
        console.warn('[chat] markAsRead failed for', chatId, err)
      })
    } catch (err) {
      console.error('[chat] selectChat failed to load messages:', err)
    }
  }
)

/**
 * Send a message via the **Socket.IO `send_message` event** with an ack.
 *
 * Mirrors what `socketEmit.sendMessage` in the SDK does, but on our own
 * path-fixed socket. Server pipeline:
 *   1. Our emit hits `send_message` with `{ conversationId, text, tempId }`.
 *   2. Server persists the Message and acks us with the saved record.
 *   3. Server also broadcasts `new_message` to everyone in the room — our
 *      own client receives that echo too, but `receiveMessage` dedupes by
 *      `message.id` so the row doesn't double up.
 *
 * `tempId` is a client-generated correlation id. We don't currently render
 * an optimistic row before the ack — once we do, the ack handler will
 * reconcile by tempId.
 */
export const sendMsg = createAsyncThunk(
  'appChat/sendMsg',
  async (obj: SendMsgParamsType & { contact?: ChatsArrType }, { getState }) => {
    console.log('[chat:trace] 2. sendMsg thunk start →', obj)

    const conversationId = obj.contact?.id ?? obj.chat?.id
    const client = getChatClientOrNull()

    if (!client || typeof conversationId !== 'string') {
      console.error('[chat:trace] sendMsg precondition failed', {
        client: client ? 'ready' : 'null',
        conversationId
      })
      throw new Error('[chat] sendMsg requires an initialized SDK and a real conversation id')
    }

    const state = getState() as { chat?: ChatStoreType }
    const currentUserId = state.chat?.userProfile?.id ?? ''

    const chatsList = state.chat?.chats ?? []
    const found = chatsList.some(c => c.id === conversationId)
    console.log('[chat:trace] 2a. conversationId in state.chats?', found, `(${chatsList.length} total)`)

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    let sent
    try {
      sent = await sendMessageOverSocket({
        conversationId,
        text: obj.message,
        tempId
      })
    } catch (err) {
      console.error('[chat:trace] sendMessageOverSocket threw:', err)
      throw err
    }
    console.log('[chat:trace] 6. sendMsg ← ack received, msg id:', sent.id, '(tempId:', tempId, ')')

    // Defensive overrides:
    //  - The ack payload occasionally omits `content.text` — fall back to the
    //    text the user actually typed so the bubble is never blank.
    //  - The ack's `senderId` can be the server-side numeric id (WSO2 user_id)
    //    instead of the chat backend's ObjectId, which mismatches
    //    `userProfile.id` (set by `getMe`) and causes our own message to
    //    render on the LEFT side. We know this thunk fires only for OUR sends,
    //    so force the local senderId to match the current user's profile id.
    const newMsg = sdkMessageToMessage(sent)
    if (!newMsg.message) newMsg.message = obj.message
    if (currentUserId) newMsg.senderId = currentUserId

    return { newMsg, contactId: conversationId }
  }
)

// ----------------------------------------------------------------------
// Slice
// ----------------------------------------------------------------------

const initialState: ChatStoreType = {
  chats: null,
  contacts: null,
  userProfile: null,
  selectedChat: null,
  activeFilter: 'all'
}

export const appChatSlice = createSlice({
  name: 'appChat',
  initialState,
  reducers: {
    removeSelectedChat: state => {
      state.selectedChat = null
    },
    setActiveFilter: (state, action: PayloadAction<ChatFilterType>) => {
      state.activeFilter = action.payload
    },
    // Synchronous "open this chat" reducer. Called by the `selectChat` thunk
    // first so the chat panel opens immediately (with whatever messages are
    // already in state), then the thunk loads fresh messages from the SDK.
    setSelectedChat: (state, action: PayloadAction<ChatEntityId>) => {
      if (!state.chats) return

      const chatId = action.payload

      // Try existing chat first
      let chatEntry = state.chats.find(c => c.id === chatId)

      // Otherwise build a fresh chat from a contact
      if (!chatEntry) {
        const contact = state.contacts?.find(c => c.id === chatId)
        if (!contact) return
        const newChat: ChatType = { id: chatId, unseenMsgs: 0, messages: [] }
        chatEntry = { ...contact, chat: newChat } as ChatsArrType
        state.chats.push(chatEntry)
      }

      // Reset unseen count when opening
      if (chatEntry.chat.unseenMsgs > 0) chatEntry.chat.unseenMsgs = 0

      state.selectedChat = { chat: chatEntry.chat, contact: chatEntry }
    },
    // Apply a partial flag update to a chat — used by void-returning SDK calls
    // (mute/unmute/pin/unpin) that don't return a full Conversation we can
    // round-trip through `addOrReplaceChat`.
    updateChatFlags: (
      state,
      action: PayloadAction<{
        chatId: ChatEntityId
        isMuted?: boolean
        isPinned?: boolean
        isFavourite?: boolean
      }>
    ) => {
      if (!state.chats) return
      const { chatId, isMuted, isPinned, isFavourite } = action.payload
      const chatEntry = state.chats.find(c => c.id === chatId)
      if (!chatEntry) return
      if (isMuted !== undefined) chatEntry.isMuted = isMuted
      if (isPinned !== undefined) chatEntry.isPinned = isPinned
      if (isFavourite !== undefined) chatEntry.isFavourite = isFavourite
      if (state.selectedChat?.contact.id === chatId) {
        state.selectedChat.contact = chatEntry
      }
    },
    // Remove a chat from the sidebar list and clear selectedChat if it was open.
    // Dispatched by `leaveGroupChat` / `deleteConversation` thunks after the
    // server confirms the action.
    removeChatFromList: (state, action: PayloadAction<ChatEntityId>) => {
      const chatId = action.payload
      if (state.chats) {
        state.chats = state.chats.filter(c => c.id !== chatId)
      }
      if (state.selectedChat?.contact.id === chatId) {
        state.selectedChat = null
      }
    },
    // Insert a chat at the top of the list, or replace if it already exists by id.
    // Used by `startDirectChat` after `createDirect` so the new (or surfaced)
    // conversation appears in the sidebar immediately.
    addOrReplaceChat: (state, action: PayloadAction<ChatsArrType>) => {
      const incoming = action.payload
      if (!state.chats) {
        state.chats = [incoming]

        return
      }
      const idx = state.chats.findIndex(c => c.id === incoming.id)
      if (idx >= 0) {
        // Preserve any messages already cached locally; the incoming row has empty messages.
        const existing = state.chats[idx]
        state.chats[idx] = {
          ...incoming,
          chat: {
            ...incoming.chat,
            messages: existing.chat.messages,
            lastMessage: incoming.chat.lastMessage ?? existing.chat.lastMessage
          }
        }
      } else {
        state.chats.unshift(incoming)
      }
    },
    // Update feedback flags on one or more messages by id within a single
    // conversation. Dispatched by AppChat's `delivered` / `read_receipt`
    // socket handlers — `isSeen: true` implies `isDelivered: true`. Unknown
    // message ids are ignored.
    updateMessagesFeedback: (
      state,
      action: PayloadAction<{
        conversationId: ChatEntityId
        messageIds: string[]
        isDelivered?: boolean
        isSeen?: boolean
      }>
    ) => {
      if (!state.chats) return
      const { conversationId, messageIds, isDelivered, isSeen } = action.payload

      const chatEntry = state.chats.find(c => c.id === conversationId)
      if (!chatEntry) return

      const idSet = new Set(messageIds)
      chatEntry.chat.messages.forEach(m => {
        if (!m.id || !idSet.has(m.id)) return
        if (isDelivered === true) m.feedback.isDelivered = true
        if (isSeen === true) {
          m.feedback.isSeen = true
          m.feedback.isDelivered = true // read implies delivered
        }
      })

      // Mirror into selectedChat if it's the open one (so the panel re-renders).
      if (state.selectedChat?.contact.id === conversationId) {
        state.selectedChat.chat = chatEntry.chat
      }
    },
    // Live-incoming message from the socket. Dispatched by AppChat's
    // `new_message` handler. The same event fires for our own sends (server
    // echo), so we dedupe by id — `sendMsg.fulfilled` will have already
    // pushed the message into state by the time the echo arrives (or vice
    // versa). `isOwn` is set by the caller when the broadcast was an echo
    // of our own send (NewMessageEvent.tempId is present) so we can render
    // the bubble on the right even if the server's senderId field doesn't
    // match `userProfile.id`.
    receiveMessage: (
      state,
      action: PayloadAction<{ conversationId: ChatEntityId; message: MessageType; isOwn?: boolean }>
    ) => {
      const { conversationId, message, isOwn } = action.payload
      console.log('[chat:trace] R1. receiveMessage reducer →', {
        conversationId,
        msgId: message.id,
        isOwn,
        chatsLen: state.chats?.length ?? 0
      })

      if (!state.chats) {
        console.warn('[chat:trace] R1a. dropped: no chats in state yet')

        return
      }

      const chatEntry = state.chats.find(c => c.id === conversationId)
      if (!chatEntry) {
        console.warn('[chat:trace] R1b. dropped: no chat entry for', conversationId)

        return
      }

      if (message.id && chatEntry.chat.messages.some(m => m.id === message.id)) {
        console.log('[chat:trace] R1c. dedupe: message already present')

        return
      }

      // Force senderId to the current user's id when this is an echo of
      // our own send. Server's broadcast `senderId` is sometimes the
      // numeric WSO2 user id, which mismatches the chat backend's ObjectId
      // we use as `userProfile.id`.
      const stored: MessageType =
        isOwn && state.userProfile ? { ...message, senderId: state.userProfile.id } : message

      const newMessages = [...chatEntry.chat.messages, stored]
      chatEntry.chat.messages = newMessages
      chatEntry.chat.lastMessage = stored

      const isOpen = state.selectedChat?.contact.id === conversationId
      if (isOpen) {
        // Explicitly create a new selectedChat object so React detects the
        // change — Immer can miss mutations when selectedChat.chat and
        // chats[i].chat share the same base reference.
        state.selectedChat = {
          chat: { ...chatEntry.chat, messages: newMessages },
          contact: chatEntry
        }
        console.log('[chat:trace] R1d. pushed + synced selectedChat (new ref, len=' + newMessages.length + ')')
      } else {
        const isMine =
          isOwn || (state.userProfile != null && message.senderId === state.userProfile.id)
        if (!isMine) chatEntry.chat.unseenMsgs += 1
        console.log('[chat:trace] R1e. pushed (background); unread =', chatEntry.chat.unseenMsgs)
      }
    },
    // Replaces the messages array for a chat. Dispatched by the `selectChat`
    // thunk after `messages.list()` resolves.
    setChatMessages: (
      state,
      action: PayloadAction<{ chatId: ChatEntityId; messages: MessageType[] }>
    ) => {
      if (!state.chats) return
      const { chatId, messages } = action.payload

      const chatEntry = state.chats.find(c => c.id === chatId)
      if (!chatEntry) return

      chatEntry.chat.messages = messages
      chatEntry.chat.lastMessage = messages[messages.length - 1]

      if (state.selectedChat && state.selectedChat.contact.id === chatId) {
        state.selectedChat.chat = chatEntry.chat
      }
    }
  },
  extraReducers: builder => {
    builder.addCase(fetchUserProfile.fulfilled, (state, action) => {
      if (action.payload) state.userProfile = action.payload
    })
    builder.addCase(fetchChatsContacts.fulfilled, (state, action) => {
      const incoming = action.payload.chatsContacts
      state.contacts = action.payload.contacts

      if (!state.chats || state.chats.length === 0) {
        // First load — nothing to merge, just assign.
        state.chats = incoming
      } else {
        // Merge: preserve locally cached messages & lastMessage that the
        // server response doesn't carry (it only returns conversation
        // metadata, not full message history).
        const existingById = new Map<ChatEntityId, ChatsArrType>(state.chats.map(c => [c.id, c]))

        state.chats = incoming.map(inc => {
          const prev = existingById.get(inc.id)
          if (!prev) return inc

          return {
            ...inc,
            chat: {
              ...inc.chat,
              messages: prev.chat.messages.length > 0 ? prev.chat.messages : inc.chat.messages,
              lastMessage: inc.chat.lastMessage ?? prev.chat.lastMessage
            }
          }
        })
      }

      // Keep selectedChat in sync with the updated chats array.
      if (state.selectedChat) {
        const selectedId = state.selectedChat.contact.id
        const updated = state.chats.find(c => c.id === selectedId)
        if (updated) {
          state.selectedChat = { chat: updated.chat, contact: updated }
        }
      }
    })
    builder.addCase(sendMsg.fulfilled, (state, action) => {
      const { newMsg, contactId } = action.payload
      console.log('[chat:trace] 7. sendMsg.fulfilled reducer →', {
        contactId,
        newMsgId: newMsg.id,
        chatsLen: state.chats?.length ?? 0
      })

      if (!state.chats || contactId == null) {
        console.warn('[chat:trace] 7a. dropped: missing chats or contactId')

        return
      }

      const chatEntry = state.chats.find(c => c.id === contactId)
      if (!chatEntry) {
        console.warn('[chat:trace] 7b. dropped: no chat entry for contactId', contactId)

        return
      }

      if (newMsg.id) {
        const existingIdx = chatEntry.chat.messages.findIndex(m => m.id === newMsg.id)
        if (existingIdx >= 0) {
          console.log('[chat:trace] 7c. dedupe: broadcast beat the ack, updating senderId only')
          chatEntry.chat.messages[existingIdx] = {
            ...chatEntry.chat.messages[existingIdx],
            senderId: newMsg.senderId
          }
          if (state.selectedChat && state.selectedChat.contact.id === contactId) {
            state.selectedChat = {
              chat: { ...chatEntry.chat, messages: [...chatEntry.chat.messages] },
              contact: chatEntry
            }
          }

          return
        }
      }

      console.log('[chat:trace] 7d. pushing new message into thread', newMsg.id)
      const newMessages = [...chatEntry.chat.messages, newMsg]
      chatEntry.chat.messages = newMessages
      chatEntry.chat.lastMessage = newMsg
      if (state.selectedChat && state.selectedChat.contact.id === contactId) {
        state.selectedChat = {
          chat: { ...chatEntry.chat, messages: newMessages },
          contact: chatEntry
        }
        console.log('[chat:trace] 7e. selectedChat synced (new ref)')
      }
    })
  }
})

export const {
  setSelectedChat,
  setChatMessages,
  receiveMessage,
  updateMessagesFeedback,
  addOrReplaceChat,
  updateChatFlags,
  removeChatFromList,
  removeSelectedChat,
  setActiveFilter
} = appChatSlice.actions

export default appChatSlice.reducer

export type AppChatReducer = ChatStoreType
