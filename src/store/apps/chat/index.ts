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
  MessageReplyRef,
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
  syncAvatar,
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
  getLastRead,
  getMessage,
  listMessages,
  markReadOverSocket,
  sendMessageOverSocket,
  sdkUserToProfile,
  sdkConversationToChat,
  sdkMessageToMessage,
  extractContactsFromConversations
} from 'src/lib/chat/api'

import { useChatStore } from '@antzsoft/chat-core'

// ----------------------------------------------------------------------
// Async Thunks — talk to the chat backend via @antzsoft/chat-core.
// If the SDK isn't initialized yet (auth not resolved or env vars missing)
// thunks resolve with empty state so the UI stays consistent.
// ----------------------------------------------------------------------

/**
 * Fetch the current user's chat profile via `GET /users/me`.
 */
export const fetchUserProfile = createAsyncThunk<
  ProfileUserType | null,
  { fallbackAvatarUrl?: string } | void
>('appChat/fetchUserProfile', async arg => {
  const client = getChatClientOrNull()
  if (!client) return null

  try {
    const sdkUser = await getMe()
    const profile = sdkUserToProfile(sdkUser)
    const fallback = arg && 'fallbackAvatarUrl' in arg ? arg.fallbackAvatarUrl : undefined

    // Chat backend's /users/me has no avatarUrl yet → push ours via the
    // explicit `POST /users/me/avatar/sync` so OTHER participants will see
    // it in their conversation list (the socket handshake also carries it,
    // but this is the deterministic REST path the server commits).
    if (!profile.avatar && fallback) {
      try {
        const synced = await syncAvatar({ url: fallback })
        profile.avatar = synced.avatarUrl || fallback
      } catch (syncErr) {
        console.warn('[chat] syncAvatar failed — using local fallback only:', syncErr)
        profile.avatar = fallback
      }
    }

    return profile
  } catch (err) {
    console.error('[chat] fetchUserProfile failed:', err)

    return null
  }
})

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
    // Omit page+limit: SDK returns all matching conversations in one response
    // (per @antzsoft/chat-core 1.0.6 doc Step 6). Pagination is opt-in.
    const resp = await listConversations()
    const conversations = resp.data ?? []

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
      // NOTE: SDK 1.0.6 dropped `icon` from CreateGroupData. Group icons are
      // now set via the separate `uploadConversationIcon(groupId, fileId)` flow
      // after creation. The CreateGroupDrawer still collects an icon URL but
      // it's no longer sent here — wire the post-create upload separately.
      const conv = await createGroupConversation({
        name: payload.name,
        description: payload.description,
        participantIds: payload.participantIds.map(String)
      })

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
  { chatId: ChatEntityId; name?: string; description?: string }
>('appChat/updateGroupChat', async ({ chatId, name, description }, { dispatch, getState }) => {
  const client = getChatClientOrNull()
  if (!client || typeof chatId !== 'string') return

  try {
    // SDK 1.0.6 dropped `icon` from UpdateConversationData. Icon updates go
    // through `uploadConversationIcon(groupId, fileId)` instead.
    const conv = await updateConversation(chatId, { name, description })
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

    // Seed the SDK's useChatStore.lastRead in parallel with the message fetch.
    // Pure side-effect into Zustand — does not gate or alter the message
    // pipeline, so a failure or slow response here cannot affect live
    // messaging. Powers the unread divider + jump-to-first-unread UI.
    getLastRead(chatId)
      .then(({ lastReadMessageId, lastReadAt }) => {
        if (lastReadMessageId && lastReadAt) {
          useChatStore.getState().setLastRead(chatId, lastReadMessageId, lastReadAt)
        }
      })
      .catch(err => {
        console.warn('[chat] getLastRead failed for', chatId, err)
      })

    try {
      const resp = await listMessages(chatId, { limit: 50 })
      const sdkMessages = resp.data ?? []

      // SDK returns newest-first; the UI renders top-to-bottom oldest-to-newest.
      const messages = [...sdkMessages].reverse().map(sdkMessageToMessage)

      dispatch(
        setChatMessages({
          chatId,
          messages,
          oldestCursor: resp.meta?.nextCursor ?? null,
          hasMoreOlder: resp.meta?.hasMore ?? false
        })
      )

      // Mark via socket so the server broadcasts read_receipt to the sender.
      // The REST markAsRead endpoint does NOT trigger a socket broadcast.
      markReadOverSocket(chatId)
    } catch (err) {
      console.error('[chat] selectChat failed to load messages:', err)
    }
  }
)

/**
 * Load the next older page of messages for the currently visible chat.
 *
 * Uses cursor pagination from the SDK — the cursor we send is the
 * `oldestCursor` saved from the previous response's `meta.nextCursor`. We pass
 * `direction: 'before'` so the SDK returns messages older than the cursor.
 *
 * Guards inside the reducer prevent stacked calls; this thunk also short-
 * circuits if pagination state says there's nothing more to load.
 */
export const loadOlderMessages = createAsyncThunk<void, ChatEntityId>(
  'appChat/loadOlderMessages',
  async (chatId, { dispatch, getState }) => {
    const client = getChatClientOrNull()
    if (!client || typeof chatId !== 'string') return

    const state = getState() as { chat?: ChatStoreType }
    const chatEntry = state.chat?.chats?.find(c => c.id === chatId)
    if (!chatEntry) return
    if (chatEntry.chat.loadingOlder) return
    if (chatEntry.chat.hasMoreOlder === false) return
    if (!chatEntry.chat.oldestCursor) return

    dispatch(setLoadingOlder({ chatId, loading: true }))

    try {
      const resp = await listMessages(chatId, {
        cursor: chatEntry.chat.oldestCursor,
        direction: 'before',
        limit: 50
      })
      const sdkMessages = resp.data ?? []

      // SDK returns newest-first within the page; reverse for chronological order.
      const messages = [...sdkMessages].reverse().map(sdkMessageToMessage)

      dispatch(
        prependChatMessages({
          chatId,
          messages,
          oldestCursor: resp.meta?.nextCursor ?? null,
          hasMoreOlder: resp.meta?.hasMore ?? false
        })
      )
    } catch (err) {
      console.error('[chat] loadOlderMessages failed:', err)
      dispatch(setLoadingOlder({ chatId, loading: false }))
    }
  }
)

/**
 * Replace the loaded message window with a context window centered on a
 * specific message. Used by the chat-details search flow when the selected
 * match is outside the currently-loaded slice of history.
 *
 * Fetches `limit` messages before and after the target plus the target
 * itself, dedupes, and chronologically sorts. The new `oldestCursor` /
 * `hasMoreOlder` flags come from the "before" page so upward pagination
 * continues to work from this new position. Forward pagination is not
 * supported yet — to get back to the very latest messages, the user reopens
 * the chat.
 */
export const jumpToMessage = createAsyncThunk<
  void,
  { chatId: ChatEntityId; messageId: string }
>('appChat/jumpToMessage', async ({ chatId, messageId }, { dispatch }) => {
  const client = getChatClientOrNull()
  if (!client || typeof chatId !== 'string' || !messageId) return

  try {
    const [before, after, target] = await Promise.all([
      listMessages(chatId, { cursor: messageId, direction: 'before', limit: 25 }),
      listMessages(chatId, { cursor: messageId, direction: 'after', limit: 25 }),
      getMessage(messageId)
    ])

    // SDK returns each page newest-first; reverse so the merged array reads
    // oldest → target → newest, matching how ChatLog renders.
    const olderMessages = [...(before.data ?? [])].reverse().map(sdkMessageToMessage)
    const newerMessages = [...(after.data ?? [])].reverse().map(sdkMessageToMessage)
    const targetMessage = sdkMessageToMessage(target)

    // Dedupe — cursor pagination semantics around the cursor message itself
    // are SDK-defined, so the target id can appear in either the before /
    // after page in addition to our explicit getMessage call.
    const merged = [...olderMessages, targetMessage, ...newerMessages]
    const seen = new Set<string>()
    const messages = merged.filter(m => {
      if (!m.id) return true
      if (seen.has(m.id)) return false
      seen.add(m.id)

      return true
    })

    dispatch(
      setChatMessages({
        chatId,
        messages,
        oldestCursor: before.meta?.nextCursor ?? null,
        hasMoreOlder: before.meta?.hasMore ?? false
      })
    )
  } catch (err) {
    console.error('[chat] jumpToMessage failed:', err)
  }
})

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
    const conversationId = obj.contact?.id ?? obj.chat?.id
    const client = getChatClientOrNull()

    if (!client || typeof conversationId !== 'string') {
      console.error('[chat] sendMsg precondition failed', {
        client: client ? 'ready' : 'null',
        conversationId
      })
      throw new Error('[chat] sendMsg requires an initialized SDK and a real conversation id')
    }

    const state = getState() as { chat?: ChatStoreType }
    const currentUserId = state.chat?.userProfile?.id ?? ''

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    // Map app-side ChatAttachmentType → SDK SendMessageAttachment (uses fileId).
    const attachments = obj.attachments?.length
      ? obj.attachments.map(a => ({
          fileId: a.id,
          type: a.type,
          url: a.url,
          thumbnailUrl: a.thumbnailUrl,
          filename: a.filename,
          mimeType: a.mimeType,
          size: a.size
        }))
      : undefined

    // Reply: include the original message id so the server attaches a
    // `replyTo` reference. Cleared from Redux at the end of this thunk.
    const replyToId = state.chat?.replyingTo?.messageId

    let sent
    try {
      sent = await sendMessageOverSocket({
        conversationId,
        text: obj.message,
        tempId,
        ...(attachments ? { attachments } : {}),
        ...(replyToId ? { replyTo: replyToId } : {})
      })
    } catch (err) {
      console.error('[chat] sendMessageOverSocket threw:', err)
      throw err
    }

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
    if (!newMsg.attachments?.length && obj.attachments?.length) {
      newMsg.attachments = obj.attachments
    }
    // Stamp the reply ref locally — the ack often doesn't echo it back. The
    // server's eventual broadcast will overwrite with the canonical preview.
    if (!newMsg.replyTo && state.chat?.replyingTo) {
      newMsg.replyTo = state.chat.replyingTo
    }

    // Anchor for the receipt flow: this id is what we expect to see come
    // back in a future read_receipt event when the other user opens the chat.
    console.log('[chat:receipt] A0 sent message anchor:', {
      id: newMsg.id,
      conversationId,
      initialFeedback: newMsg.feedback,
      text: newMsg.message?.slice(0, 40)
    })

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
  activeFilter: 'all',
  loadingMessages: false,
  pendingFeedback: {},
  replyingTo: null,
  editingMessage: null
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

      // Keep selectedChat.contact in sync so the UI reflects the change
      if (state.selectedChat?.contact?.id === chatId) {
        if (isMuted !== undefined) state.selectedChat.contact.isMuted = isMuted
        if (isPinned !== undefined) state.selectedChat.contact.isPinned = isPinned
        if (isFavourite !== undefined) state.selectedChat.contact.isFavourite = isFavourite
      }
      if (state.selectedChat?.contact.id === chatId) {
        state.selectedChat.contact = chatEntry
      }
    },
    // Authoritative unread count from the server — pushed via the
    // `unread_count_changed` socket event whenever the server recalculates
    // the count for this user (mark-read from any device, message
    // deletion-for-me, etc.). Replaces our local count rather than
    // incrementing, because the server is the source of truth.
    setUnreadCount: (
      state,
      action: PayloadAction<{ chatId: ChatEntityId; count: number }>
    ) => {
      if (!state.chats) return
      const { chatId, count } = action.payload
      const chatEntry = state.chats.find(c => c.id === chatId)
      if (!chatEntry) return
      chatEntry.chat.unseenMsgs = count
      if (state.selectedChat?.contact.id === chatId) {
        state.selectedChat = {
          chat: { ...chatEntry.chat },
          contact: chatEntry
        }
      }
    },
    // Composer reply state — set by clicking "Reply" on a bubble, cleared by
    // the composer's cancel button or by sendMsg.fulfilled.
    setReplyingTo: (state, action: PayloadAction<MessageReplyRef | null>) => {
      state.replyingTo = action.payload
    },
    // Composer edit state — set by clicking "Edit" on an own bubble; cleared
    // when the edit completes or the user cancels.
    setEditingMessage: (
      state,
      action: PayloadAction<{ messageId: string; originalText: string } | null>
    ) => {
      state.editingMessage = action.payload
    },
    // Pin — server-broadcast on `message_pin_updated`. Visible to all
    // participants of the conversation.
    applyMessagePin: (
      state,
      action: PayloadAction<{ messageId: string; isPinned: boolean }>
    ) => {
      if (!state.chats) return
      const { messageId, isPinned } = action.payload
      let touched: ChatEntityId | null = null
      state.chats.forEach(chat => {
        chat.chat.messages.forEach(m => {
          if (m.id === messageId) {
            m.isPinned = isPinned
            touched = chat.id
          }
        })
      })
      if (touched && state.selectedChat?.contact.id === touched) {
        const openChat = state.chats.find(c => c.id === touched)
        if (openChat) {
          state.selectedChat = {
            chat: { ...openChat.chat, messages: [...openChat.chat.messages] },
            contact: openChat
          }
        }
      }
    },
    // Star — personal flag. No server broadcast; we toggle locally and call
    // REST. The thunk-level call is fire-and-forget; if the network fails the
    // UI is slightly off until the next refresh.
    setMessageStarred: (
      state,
      action: PayloadAction<{ messageId: string; isStarred: boolean }>
    ) => {
      if (!state.chats) return
      const { messageId, isStarred } = action.payload
      let touched: ChatEntityId | null = null
      state.chats.forEach(chat => {
        chat.chat.messages.forEach(m => {
          if (m.id === messageId) {
            m.isStarred = isStarred
            touched = chat.id
          }
        })
      })
      if (touched && state.selectedChat?.contact.id === touched) {
        const openChat = state.chats.find(c => c.id === touched)
        if (openChat) {
          state.selectedChat = {
            chat: { ...openChat.chat, messages: [...openChat.chat.messages] },
            contact: openChat
          }
        }
      }
    },
    // Apply a server-broadcast "delete for everyone". We don't remove the
    // message — we mark it as deleted so the placeholder ("This message was
    // deleted") renders in-place. Matches WhatsApp/Telegram behavior.
    applyMessageDelete: (state, action: PayloadAction<{ messageId: string }>) => {
      if (!state.chats) return
      const { messageId } = action.payload
      let touched: ChatEntityId | null = null
      state.chats.forEach(chat => {
        chat.chat.messages.forEach(m => {
          if (m.id === messageId) {
            m.isDeletedForEveryone = true
            m.message = ''
            m.attachments = undefined
            m.reactions = undefined
            touched = chat.id
          }
        })
      })
      if (touched && state.selectedChat?.contact.id === touched) {
        const openChat = state.chats.find(c => c.id === touched)
        if (openChat) {
          state.selectedChat = {
            chat: { ...openChat.chat, messages: [...openChat.chat.messages] },
            contact: openChat
          }
        }
      }
    },
    // Apply a "delete for me" — removes the message entirely from local state.
    // Fires only on the device that called the action (server emits this only
    // to that user's socket).
    applyMessageDeleteForMe: (state, action: PayloadAction<{ messageId: string }>) => {
      if (!state.chats) return
      const { messageId } = action.payload
      let touched: ChatEntityId | null = null
      state.chats.forEach(chat => {
        const before = chat.chat.messages.length
        chat.chat.messages = chat.chat.messages.filter(m => m.id !== messageId)
        if (chat.chat.messages.length !== before) touched = chat.id
      })
      if (touched && state.selectedChat?.contact.id === touched) {
        const openChat = state.chats.find(c => c.id === touched)
        if (openChat) {
          state.selectedChat = {
            chat: { ...openChat.chat, messages: [...openChat.chat.messages] },
            contact: openChat
          }
        }
      }
    },
    // Apply a server-broadcast edit. Updates `message`, `isEdited` and
    // `editedAt` on whichever message matches.
    applyMessageUpdate: (
      state,
      action: PayloadAction<{ messageId: string; text: string; editedAt?: string }>
    ) => {
      if (!state.chats) return
      const { messageId, text, editedAt } = action.payload
      let touched: ChatEntityId | null = null
      state.chats.forEach(chat => {
        chat.chat.messages.forEach(m => {
          if (m.id === messageId) {
            m.message = text
            m.isEdited = true
            if (editedAt) m.editedAt = editedAt
            touched = chat.id
          }
        })
      })
      if (touched && state.selectedChat?.contact.id === touched) {
        const openChat = state.chats.find(c => c.id === touched)
        if (openChat) {
          state.selectedChat = {
            chat: { ...openChat.chat, messages: [...openChat.chat.messages] },
            contact: openChat
          }
        }
      }
    },
    // Apply a server-broadcast reactions update to a single message. The
    // server's `reactions` array is authoritative — replace, don't merge.
    applyReactionUpdate: (
      state,
      action: PayloadAction<{ messageId: string; reactions: { emoji: string; userIds: string[]; count?: number }[] }>
    ) => {
      if (!state.chats) return
      const { messageId, reactions } = action.payload
      const normalized = reactions.map(r => ({
        emoji: r.emoji,
        userIds: r.userIds ?? [],
        count: r.count ?? r.userIds?.length ?? 0
      }))

      let touched: ChatEntityId | null = null
      state.chats.forEach(chat => {
        chat.chat.messages.forEach(m => {
          if (m.id === messageId) {
            m.reactions = normalized
            touched = chat.id
          }
        })
      })
      if (touched && state.selectedChat?.contact.id === touched) {
        const openChat = state.chats.find(c => c.id === touched)
        if (openChat) {
          state.selectedChat = {
            chat: { ...openChat.chat, messages: [...openChat.chat.messages] },
            contact: openChat
          }
        }
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
      if (!state.chats) {
        console.warn('[chat:receipt] R0 reducer skipped — state.chats is null')

        return
      }
      const { conversationId, messageIds, isDelivered, isSeen } = action.payload
      console.log('[chat:receipt] R0 updateMessagesFeedback ← payload:', {
        conversationId,
        messageIds,
        isDelivered,
        isSeen
      })

      // Search ALL chats for matching message ids — don't trust the event's
      // `conversationId` because the backend sometimes emits a `read_receipt`
      // with a mismatched conversationId (derived from the reader's
      // perspective rather than the message's actual home). Message ids are
      // globally unique ObjectIds, so finding by id is authoritative.
      const idSet = new Set(messageIds)
      const matchedIds: string[] = []
      const touchedChatIds = new Set<ChatEntityId>()
      state.chats.forEach(chat => {
        chat.chat.messages.forEach(m => {
          if (!m.id || !idSet.has(m.id)) return
          if (isDelivered === true) m.feedback.isDelivered = true
          if (isSeen === true) {
            m.feedback.isSeen = true
            m.feedback.isDelivered = true // read implies delivered
          }
          matchedIds.push(m.id)
          touchedChatIds.add(chat.id)
        })
      })

      const missed = messageIds.filter(id => !matchedIds.includes(id))
      console.log(
        `[chat:receipt] R2 reducer: matched ${matchedIds.length}/${messageIds.length} messages`,
        {
          matchedIds,
          missedIds: missed,
          touchedChats: Array.from(touchedChatIds),
          eventConversationId: conversationId
        }
      )
      if (missed.length) {
        // Buffer pending feedback for messages we haven't appended yet.
        // Drained by sendMsg.fulfilled / receiveMessage. This handles the
        // common race where `message_delivered` arrives BEFORE the send ack
        // callback resolves (Socket.IO can deliver event packets ahead of the
        // ack callback for the same network frame).
        missed.forEach(id => {
          const existing = state.pendingFeedback[id] ?? {}
          state.pendingFeedback[id] = {
            isDelivered: existing.isDelivered || isDelivered === true,
            isSeen: existing.isSeen || isSeen === true
          }
        })
        console.warn(
          '[chat:receipt] R2a missed ids — buffered into pendingFeedback:',
          missed,
          'current buffer:',
          state.pendingFeedback
        )
      }

      // Mirror into selectedChat if any of the matched messages live in the
      // currently open chat (so the panel re-renders).
      if (state.selectedChat && touchedChatIds.has(state.selectedChat.contact.id)) {
        const openChat = state.chats.find(c => c.id === state.selectedChat!.contact.id)
        if (openChat) {
          state.selectedChat = {
            chat: { ...openChat.chat, messages: [...openChat.chat.messages] },
            contact: openChat
          }
          console.log('[chat:receipt] R3 mirrored into selectedChat (panel will re-render)')
        }
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

      if (!state.chats) {
        console.warn('[chat] receiveMessage dropped: no chats in state yet')

        return
      }

      const chatEntry = state.chats.find(c => c.id === conversationId)
      if (!chatEntry) {
        console.warn('[chat] receiveMessage dropped: no chat entry for', conversationId)

        return
      }

      if (message.id) {
        const existingIdx = chatEntry.chat.messages.findIndex(m => m.id === message.id)
        if (existingIdx >= 0) {
          // Dedupe but MERGE feedback — the broadcast echo may carry a
          // stronger delivery status than the ack we already stored
          // (e.g. ack returned `sent` but by the time the broadcast
          // round-tripped, server flipped to `delivered`). isSent/isDelivered/isSeen
          // are monotonic: once true, they stay true.
          const existing = chatEntry.chat.messages[existingIdx]
          const mergedFeedback = {
            isSent: existing.feedback.isSent || message.feedback.isSent,
            isDelivered: existing.feedback.isDelivered || message.feedback.isDelivered,
            isSeen: existing.feedback.isSeen || message.feedback.isSeen
          }
          const feedbackChanged =
            mergedFeedback.isSent !== existing.feedback.isSent ||
            mergedFeedback.isDelivered !== existing.feedback.isDelivered ||
            mergedFeedback.isSeen !== existing.feedback.isSeen
          if (feedbackChanged) {
            chatEntry.chat.messages[existingIdx] = { ...existing, feedback: mergedFeedback }
            console.log('[chat:receipt] R1c.feedback-merge dedupe + upgraded feedback for', message.id, {
              before: existing.feedback,
              after: mergedFeedback
            })
            // Touch selectedChat so the bubble re-renders
            if (state.selectedChat?.contact.id === conversationId) {
              state.selectedChat = {
                chat: { ...chatEntry.chat, messages: [...chatEntry.chat.messages] },
                contact: chatEntry
              }
            }
          } else {
          }

          return
        }
      }

      // Force senderId to the current user's id when this is an echo of
      // our own send. Server's broadcast `senderId` is sometimes the
      // numeric WSO2 user id, which mismatches the chat backend's ObjectId
      // we use as `userProfile.id`.
      const stored: MessageType =
        isOwn && state.userProfile ? { ...message, senderId: state.userProfile.id } : message

      // Drain pending feedback if any receipts arrived before this broadcast.
      if (stored.id && state.pendingFeedback[stored.id]) {
        const pf = state.pendingFeedback[stored.id]
        const before = { ...stored.feedback }
        stored.feedback = {
          isSent: stored.feedback.isSent,
          isDelivered: stored.feedback.isDelivered || Boolean(pf.isDelivered) || Boolean(pf.isSeen),
          isSeen: stored.feedback.isSeen || Boolean(pf.isSeen)
        }
        delete state.pendingFeedback[stored.id]
        console.log('[chat:receipt] R1.drain applied pendingFeedback to', stored.id, {
          before,
          pending: pf,
          after: stored.feedback
        })
      }

      const newMessages = [...chatEntry.chat.messages, stored]
      chatEntry.chat.messages = newMessages
      chatEntry.chat.lastMessage = stored

      // Move this chat to the top of the list so the sidebar reflects
      // the most recent activity.
      const idx = state.chats.indexOf(chatEntry)
      if (idx > 0) {
        state.chats.splice(idx, 1)
        state.chats.unshift(chatEntry)
      }

      const isOpen = state.selectedChat?.contact.id === conversationId
      if (isOpen) {
        // Explicitly create a new selectedChat object so React detects the
        // change — Immer can miss mutations when selectedChat.chat and
        // chats[i].chat share the same base reference.
        state.selectedChat = {
          chat: { ...chatEntry.chat, messages: newMessages },
          contact: chatEntry
        }
      } else {
        const isMine =
          isOwn || (state.userProfile != null && message.senderId === state.userProfile.id)
        if (!isMine) chatEntry.chat.unseenMsgs += 1
      }
    },
    // Replaces the messages array for a chat. Dispatched by the `selectChat`
    // thunk after `messages.list()` resolves. Also carries the cursor
    // pagination meta so the next "load older" call has somewhere to start.
    setChatMessages: (
      state,
      action: PayloadAction<{
        chatId: ChatEntityId
        messages: MessageType[]
        oldestCursor?: string | null
        hasMoreOlder?: boolean
      }>
    ) => {
      if (!state.chats) return
      const { chatId, messages, oldestCursor, hasMoreOlder } = action.payload

      const chatEntry = state.chats.find(c => c.id === chatId)
      if (!chatEntry) return

      chatEntry.chat.messages = messages
      chatEntry.chat.lastMessage = messages[messages.length - 1]
      if (oldestCursor !== undefined) chatEntry.chat.oldestCursor = oldestCursor
      if (hasMoreOlder !== undefined) chatEntry.chat.hasMoreOlder = hasMoreOlder
      chatEntry.chat.loadingOlder = false

      if (state.selectedChat && state.selectedChat.contact.id === chatId) {
        state.selectedChat.chat = chatEntry.chat
      }
    },
    // Prepend an older page of messages to the chat. Updates the cursor /
    // hasMore flags so subsequent pages chain correctly, and clears the
    // loading flag. Always re-creates `selectedChat.chat.messages` as a new
    // array so React's reference check fires.
    prependChatMessages: (
      state,
      action: PayloadAction<{
        chatId: ChatEntityId
        messages: MessageType[]
        oldestCursor: string | null
        hasMoreOlder: boolean
      }>
    ) => {
      if (!state.chats) return
      const { chatId, messages, oldestCursor, hasMoreOlder } = action.payload

      const chatEntry = state.chats.find(c => c.id === chatId)
      if (!chatEntry) return

      // Dedupe — in rare races a page boundary message could already exist.
      const existingIds = new Set(chatEntry.chat.messages.map(m => m.id).filter(Boolean) as string[])
      const incoming = messages.filter(m => !m.id || !existingIds.has(m.id))

      chatEntry.chat.messages = [...incoming, ...chatEntry.chat.messages]
      chatEntry.chat.oldestCursor = oldestCursor
      chatEntry.chat.hasMoreOlder = hasMoreOlder
      chatEntry.chat.loadingOlder = false

      if (state.selectedChat && state.selectedChat.contact.id === chatId) {
        state.selectedChat = {
          chat: { ...chatEntry.chat, messages: [...chatEntry.chat.messages] },
          contact: chatEntry
        }
      }
    },
    // Toggle the `loadingOlder` flag for a chat. The thunk sets it true before
    // the network call; the prepend reducer (or the thunk's catch branch)
    // clears it.
    setLoadingOlder: (
      state,
      action: PayloadAction<{ chatId: ChatEntityId; loading: boolean }>
    ) => {
      if (!state.chats) return
      const { chatId, loading } = action.payload
      const chatEntry = state.chats.find(c => c.id === chatId)
      if (!chatEntry) return
      chatEntry.chat.loadingOlder = loading

      if (state.selectedChat && state.selectedChat.contact.id === chatId) {
        state.selectedChat = {
          chat: { ...chatEntry.chat },
          contact: chatEntry
        }
      }
    }
  },
  extraReducers: builder => {
    builder.addCase(selectChat.pending, state => {
      state.loadingMessages = true
    })
    builder.addCase(selectChat.fulfilled, state => {
      state.loadingMessages = false
    })
    builder.addCase(selectChat.rejected, state => {
      state.loadingMessages = false
    })
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

      // Clear the composer reply state after a successful send (regardless of
      // whether the chats array is in a state to accept the message).
      if (state.replyingTo) state.replyingTo = null

      if (!state.chats || contactId == null) {
        console.warn('[chat] sendMsg.fulfilled dropped: missing chats or contactId')

        return
      }

      const chatEntry = state.chats.find(c => c.id === contactId)
      if (!chatEntry) {
        console.warn('[chat] sendMsg.fulfilled dropped: no chat entry for contactId', contactId)

        return
      }

      if (newMsg.id) {
        const existingIdx = chatEntry.chat.messages.findIndex(m => m.id === newMsg.id)
        if (existingIdx >= 0) {
          // Broadcast echo beat our ack into Redux. Merge senderId AND the
          // stronger feedback flags so we don't lose delivered/seen state.
          const existing = chatEntry.chat.messages[existingIdx]
          const mergedFeedback = {
            isSent: existing.feedback.isSent || newMsg.feedback.isSent,
            isDelivered: existing.feedback.isDelivered || newMsg.feedback.isDelivered,
            isSeen: existing.feedback.isSeen || newMsg.feedback.isSeen
          }
          console.log('[chat:receipt] 7c.feedback-merge ack: dedupe + merged feedback for', newMsg.id, {
            existing: existing.feedback,
            ackProvided: newMsg.feedback,
            merged: mergedFeedback
          })
          chatEntry.chat.messages[existingIdx] = {
            ...existing,
            senderId: newMsg.senderId,
            feedback: mergedFeedback
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

      // Drain any pending feedback (delivered/seen) that arrived before this
      // ack callback resolved. Apply to the message we're about to push so the
      // tick state is correct from the first render.
      if (newMsg.id && state.pendingFeedback[newMsg.id]) {
        const pf = state.pendingFeedback[newMsg.id]
        const before = { ...newMsg.feedback }
        if (pf.isDelivered) newMsg.feedback.isDelivered = true
        if (pf.isSeen) {
          newMsg.feedback.isSeen = true
          newMsg.feedback.isDelivered = true
        }
        delete state.pendingFeedback[newMsg.id]
        console.log('[chat:receipt] 7d.drain applied pendingFeedback to', newMsg.id, {
          before,
          pending: pf,
          after: newMsg.feedback
        })
      }
      const newMessages = [...chatEntry.chat.messages, newMsg]
      chatEntry.chat.messages = newMessages
      chatEntry.chat.lastMessage = newMsg

      // Move this chat to the top of the list.
      const idx = state.chats.indexOf(chatEntry)
      if (idx > 0) {
        state.chats.splice(idx, 1)
        state.chats.unshift(chatEntry)
      }

      if (state.selectedChat && state.selectedChat.contact.id === contactId) {
        state.selectedChat = {
          chat: { ...chatEntry.chat, messages: newMessages },
          contact: chatEntry
        }
      }
    })
  }
})

export const {
  setSelectedChat,
  setChatMessages,
  prependChatMessages,
  setLoadingOlder,
  receiveMessage,
  updateMessagesFeedback,
  addOrReplaceChat,
  updateChatFlags,
  setUnreadCount,
  setReplyingTo,
  setEditingMessage,
  applyMessageUpdate,
  applyMessageDelete,
  applyMessageDeleteForMe,
  setMessageStarred,
  applyMessagePin,
  applyReactionUpdate,
  removeChatFromList,
  removeSelectedChat,
  setActiveFilter
} = appChatSlice.actions

export default appChatSlice.reducer

export type AppChatReducer = ChatStoreType
