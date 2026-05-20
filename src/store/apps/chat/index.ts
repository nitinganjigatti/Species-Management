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
 * Backend gap workaround — the conversation-list endpoint doesn't include
 * `senderId` / `sender.displayName` on `lastMessage`, so the sidebar's
 * WhatsApp-style "Saket: hello" prefix can't render on a cold page load.
 * This thunk runs after `fetchChatsContacts`, scans group chats for
 * lastMessages that have an `id` (so we can address them) but no
 * `senderName`, and fetches the full message via `getMessage(id)` to
 * resolve the sender. Results land via `patchLastMessageSender`.
 *
 * Throttled by a module-level Set of already-fetched message ids so we
 * never refetch the same message — useful when `fetchChatsContacts` runs
 * repeatedly (every `conversation_updated`, focus, etc.). Failures are
 * silent — the prefix falls back to "no prefix", same as before.
 */
const enrichedLastMessageIds = new Set<string>()
export const enrichLastMessageSenders = createAsyncThunk<void, void>(
  'appChat/enrichLastMessageSenders',
  async (_, { dispatch, getState }) => {
    const client = getChatClientOrNull()
    if (!client) return

    const state = getState() as { chat?: ChatStoreType }
    const chats = state.chat?.chats ?? []

    // Pick group chats whose lastMessage is missing sender info AND has an id
    // we haven't already enriched in this session.
    const targets = chats
      .filter(c => c.isGroup)
      .map(c => ({
        chatId: c.id,
        messageId: c.chat.lastMessage?.id,
        hasSender: Boolean(c.chat.lastMessage?.senderName)
      }))
      .filter(t => t.messageId && !t.hasSender && !enrichedLastMessageIds.has(t.messageId))

    if (targets.length === 0) return

    await Promise.all(
      targets.map(async t => {
        if (!t.messageId) return
        enrichedLastMessageIds.add(t.messageId)
        try {
          const msg = await getMessage(t.messageId)
          const senderId = (msg as { senderId?: string }).senderId ?? ''
          const senderName =
            (msg as { sender?: { displayName?: string; username?: string } }).sender?.displayName ??
            (msg as { sender?: { displayName?: string; username?: string } }).sender?.username
          if (senderId || senderName) {
            dispatch(
              patchLastMessageSender({
                chatId: t.chatId,
                senderId,
                senderName
              })
            )
          }
        } catch (err) {
          // Silent — prefix degrades to "no prefix" which is what it was before.
          // eslint-disable-next-line no-console
          console.warn('[chat] enrichLastMessageSenders failed for', t.messageId, err)
        }
      })
    )
  }
)

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
      // SDK 1.0.6 dropped `icon` from CreateGroupData — create the group
      // first (no icon), then if the user picked one, upload it via the
      // existing `uploadGroupIcon` thunk. Sequential so the icon attaches
      // to the real group id, not a half-created placeholder.
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

      // Step 2 — group icon upload (only when the drawer captured a File).
      // Fire-and-forget from the thunk's perspective: the user is already
      // looking at the new group; the icon will pop in once the upload +
      // `addOrReplaceChat` cycle inside uploadGroupIcon completes (~1-2s).
      // We don't await this because a slow upload shouldn't block the
      // selectChat above.
      if (payload.iconFile) {
        dispatch(uploadGroupIcon({ chatId: conv.id, file: payload.iconFile }))
      }
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
 * Upload a new group icon. The SDK's `client.uploadIcon(conversationId, file)`
 * runs the presigned-url + S3 upload + conversations.uploadIcon flow in one
 * call and returns the updated Conversation (with a fresh `iconUrl`). We
 * pipe that Conversation through the adapter and `addOrReplaceChat` so the
 * sidebar tile picks up the new avatar immediately. Other participants get
 * the change via the `conversation_updated` socket broadcast handled in
 * AppChat. `file` must be an SDK `UploadableFile` — `{ uri, name, type, size }`
 * — wrapped in a blob URL on the web.
 */
export const uploadGroupIcon = createAsyncThunk<
  void,
  { chatId: ChatEntityId; file: { uri: string; name: string; type: string; size: number } }
>('appChat/uploadGroupIcon', async ({ chatId, file }, { dispatch, getState }) => {
  // eslint-disable-next-line no-console
  console.log('[chat:icon-upload] thunk start', { chatId, fileName: file?.name, fileType: file?.type, fileSize: file?.size })

  const client = getChatClientOrNull()
  if (!client || typeof chatId !== 'string') {
    // eslint-disable-next-line no-console
    console.warn('[chat:icon-upload] aborted', { hasClient: !!client, chatId })

    return
  }

  // Snapshot the current avatar so we can revert if the upload fails.
  const state = getState() as { chat?: ChatStoreType }
  const previousAvatar = state.chat?.chats?.find(c => c.id === chatId)?.avatar ?? ''

  // Optimistic swap — push the local blob URL into Redux immediately so
  // the sidebar tile, chat header, and Group info drawer reflect the new
  // image without waiting for the upload + signed-URL round-trip. The
  // server's authoritative `iconUrl` overwrites this when the upload
  // resolves below.
  if (file.uri) {
    dispatch(setChatAvatarOptimistic({ chatId, avatar: file.uri }))
  }

  try {
    const conv = await client.uploadIcon(chatId, file)

    // TEMP DIAG — surfaces whether the SDK's response actually carries the
    // fresh `iconUrl`. Filter console by `[chat:icon-upload]`.
    // eslint-disable-next-line no-console
    console.log('[chat:icon-upload] uploadIcon response', {
      id: conv?.id,
      iconUrl: conv?.iconUrl,
      hasIconUrl: !!conv?.iconUrl,
      full: conv
    })

    const currentUserId = (getState() as { chat?: ChatStoreType }).chat?.userProfile?.id ?? ''
    dispatch(addOrReplaceChat(sdkConversationToChat(conv, currentUserId)))

    // Belt-and-suspenders: always re-fetch the list so the sidebar picks up
    // a fresh signed `iconUrl` even if the immediate response had a stale
    // or missing URL. Server's `conversation_updated` broadcast will also
    // run this, but the uploader shouldn't have to wait for that echo.
    dispatch(fetchChatsContacts())
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[chat:icon-upload] FAILED:', err)
    // Roll back the optimistic preview so the UI shows the previous icon
    // (or the default glyph) instead of the now-stale blob URL.
    dispatch(setChatAvatarOptimistic({ chatId, avatar: previousAvatar }))
    throw err
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
  editingMessage: null,
  infoMessage: null
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
    // "Message info" drawer state — opens the right-side panel showing
    // per-recipient Read + Delivered receipts. Mounted at the chat shell
    // root (ChatContent) so the `position: absolute` Sidebar lays out
    // against the chat panel, not against the message bubble it was
    // triggered from. Dispatched by MessageActions when the user picks
    // "Info" from the chevron menu; cleared when the drawer closes.
    setInfoMessage: (
      state,
      action: PayloadAction<
        | {
            messageId: string
            messageText?: string
            readBy?: Array<{ userId: string; readAt: string }>
            deliveredTo?: Array<{ userId: string; deliveredAt: string }>
          }
        | null
      >
    ) => {
      state.infoMessage = action.payload
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

        // Keep the sidebar preview (`chat.lastMessage`) in sync when the
        // deleted message IS the last one. Without this, the sidebar
        // would keep showing the now-deleted message's original text
        // until the next refresh.
        if (chat.chat.lastMessage?.id === messageId) {
          chat.chat.lastMessage = {
            ...chat.chat.lastMessage,
            isDeletedForEveryone: true,
            message: '',
            attachments: undefined,
            reactions: undefined
          }
        }
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

        // If the just-removed message was the sidebar preview, fall back
        // to the new last message in the array (or undefined if empty).
        // Without this, the sidebar would keep showing the gone message.
        if (chat.chat.lastMessage?.id === messageId) {
          chat.chat.lastMessage = chat.chat.messages[chat.chat.messages.length - 1]
        }
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

        // Keep the sidebar preview in sync if the edited message IS the
        // last one. Without this, the sidebar would keep showing the
        // pre-edit text.
        if (chat.chat.lastMessage?.id === messageId) {
          chat.chat.lastMessage = {
            ...chat.chat.lastMessage,
            message: text,
            isEdited: true,
            ...(editedAt ? { editedAt } : {})
          }
        }
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
    // Optimistic avatar update — used by `uploadGroupIcon` to swap the
    // sidebar/header icon to the local blob URL the instant the user
    // picks a file, BEFORE the network upload completes. Keeps the
    // sidebar tile + chat header + Group info drawer in sync (mirrors
    // the selectedChat sync that addOrReplaceChat does). The real signed
    // URL from the server overwrites this when the upload resolves.
    setChatAvatarOptimistic: (
      state,
      action: PayloadAction<{ chatId: ChatEntityId; avatar: string }>
    ) => {
      if (!state.chats) return
      const { chatId, avatar } = action.payload
      const idx = state.chats.findIndex(c => c.id === chatId)
      if (idx < 0) return
      state.chats[idx] = { ...state.chats[idx], avatar }
      if (state.selectedChat && state.selectedChat.contact.id === chatId) {
        state.selectedChat = {
          chat: state.selectedChat.chat,
          contact: state.chats[idx]
        }
      }
    },
    // Mark a participant as no longer active in a group — fires from the
    // server's `participant_left` socket event (covers both voluntary leave
    // and admin-removal). Immediately flips:
    //   • chat.participants[matched].isActive → false
    //   • chat.participantIds / adminIds → strip the leaver
    //   • chat.isCurrentUserActive → false when it's the current user
    // Drives the composer/interaction gate (`canInteract` in ChatContent
    // and `isCurrentUserActive` in UserProfileRight) so a removed user is
    // locked out without waiting for the next `fetchChatsContacts`.
    applyParticipantLeft: (
      state,
      action: PayloadAction<{ chatId: ChatEntityId; userId: ChatEntityId }>
    ) => {
      if (!state.chats) return
      const { chatId, userId } = action.payload
      const idx = state.chats.findIndex(c => c.id === chatId)
      if (idx < 0) return
      const userIdStr = String(userId)
      const chat = state.chats[idx]

      // Update participants array (preserved with isActive=false for history).
      const updatedParticipants = (chat.participants ?? []).map(p =>
        String(p.userId) === userIdStr ? { ...p, isActive: false } : p
      )
      const updatedParticipantIds = (chat.participantIds ?? []).filter(
        id => String(id) !== userIdStr
      )
      const updatedAdminIds = (chat.adminIds ?? []).filter(id => String(id) !== userIdStr)
      const meIsLeaver = String(state.userProfile?.id ?? '') === userIdStr

      state.chats[idx] = {
        ...chat,
        participants: updatedParticipants,
        participantIds: updatedParticipantIds,
        adminIds: updatedAdminIds,
        // Flip the current-user flag iff THIS event is about us.
        ...(meIsLeaver ? { isCurrentUserActive: false } : {})
      }

      // Mirror into selectedChat so the open chat's composer + Group info
      // drawer re-render immediately.
      if (state.selectedChat && state.selectedChat.contact.id === chatId) {
        state.selectedChat = {
          chat: state.selectedChat.chat,
          contact: state.chats[idx]
        }
      }
    },
    // Patch a chat's `lastMessage` with sender info that wasn't included
    // in the conversation-list response. Used by the `enrichLastMessageSenders`
    // thunk after it fetches full message details via `getMessage(id)` to
    // resolve the WhatsApp-style "Saket: …" sidebar prefix on cold load.
    patchLastMessageSender: (
      state,
      action: PayloadAction<{ chatId: ChatEntityId; senderId: ChatEntityId; senderName?: string }>
    ) => {
      if (!state.chats) return
      const { chatId, senderId, senderName } = action.payload
      const idx = state.chats.findIndex(c => c.id === chatId)
      if (idx < 0) return
      const chat = state.chats[idx]
      if (!chat.chat.lastMessage) return
      chat.chat.lastMessage = {
        ...chat.chat.lastMessage,
        senderId: chat.chat.lastMessage.senderId || senderId,
        senderName: chat.chat.lastMessage.senderName ?? senderName
      }
      if (state.selectedChat && state.selectedChat.contact.id === chatId) {
        state.selectedChat = {
          chat: { ...state.selectedChat.chat, lastMessage: chat.chat.lastMessage },
          contact: chat
        }
      }
    },
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

        // Same merge logic as fetchChatsContacts.fulfilled — if the
        // incoming lastMessage refers to the SAME message but is missing
        // `senderId` / `senderName` (server's participant-mutation
        // responses sometimes drop those), keep the previous values so
        // the sidebar's "You: …" / "Saket: …" prefix doesn't vanish.
        let mergedLastMessage = incoming.chat.lastMessage ?? existing.chat.lastMessage
        if (
          incoming.chat.lastMessage &&
          existing.chat.lastMessage &&
          incoming.chat.lastMessage.id &&
          incoming.chat.lastMessage.id === existing.chat.lastMessage.id
        ) {
          mergedLastMessage = {
            ...incoming.chat.lastMessage,
            senderId: incoming.chat.lastMessage.senderId || existing.chat.lastMessage.senderId,
            senderName: incoming.chat.lastMessage.senderName ?? existing.chat.lastMessage.senderName
          }
        }

        state.chats[idx] = {
          ...incoming,
          // Preserve the previously-known group icon when the server's
          // response omits `iconUrl`. The participant-mutation endpoints
          // (add member / remove member / role change / rename) return
          // the updated conversation but sometimes drop the iconUrl
          // (server quirk). Without this, the sidebar avatar flickers to
          // the default glyph after every member edit.
          avatar: incoming.avatar || existing.avatar,
          chat: {
            ...incoming.chat,
            messages: existing.chat.messages,
            lastMessage: mergedLastMessage
          }
        }
      } else {
        state.chats.unshift(incoming)
      }

      // Keep selectedChat in sync so the currently-open chat's header + Group
      // info drawer + ChatLog fallback avatar pick up the new metadata (icon,
      // name, description, members) instantly — without waiting for the
      // `conversation_updated` socket echo. Mirrors the same sync that
      // `fetchChatsContacts.fulfilled` already does at the bottom of this file.
      if (state.selectedChat && state.selectedChat.contact.id === incoming.id) {
        const updated = state.chats.find(c => c.id === incoming.id)
        if (updated) state.selectedChat = { chat: updated.chat, contact: updated }
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

          // Merge lastMessage carefully — the server's conversation-list
          // response sometimes returns `lastMessage` WITHOUT
          // `sender.displayName` (or `senderId` is the WSO2 numeric id
          // instead of the ObjectId). If we naively use `inc.lastMessage`,
          // the sidebar's "You: …" / "Saket: …" prefix vanishes because
          // the prefix lookup depends on those fields. When the incoming
          // and previous lastMessage refer to the same message id, fall
          // back to the previous values for any field the server omits.
          let mergedLastMessage = inc.chat.lastMessage ?? prev.chat.lastMessage
          if (
            inc.chat.lastMessage &&
            prev.chat.lastMessage &&
            inc.chat.lastMessage.id &&
            inc.chat.lastMessage.id === prev.chat.lastMessage.id
          ) {
            mergedLastMessage = {
              ...inc.chat.lastMessage,
              senderId: inc.chat.lastMessage.senderId || prev.chat.lastMessage.senderId,
              senderName: inc.chat.lastMessage.senderName ?? prev.chat.lastMessage.senderName
            }
          }

          return {
            ...inc,
            chat: {
              ...inc.chat,
              messages: prev.chat.messages.length > 0 ? prev.chat.messages : inc.chat.messages,
              lastMessage: mergedLastMessage
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
      // Stamp the current user's id + display name on the synthesized
      // message before it lands in state. `sendMessageOverSocket` returns
      // a stub with `senderId: ''` when the server gives a lightweight
      // `{success, messageId}` ack — without this rewrite, the sidebar's
      // "You: …" prefix can't resolve (it matches by `senderId === userProfile.id`)
      // and the previous sender's prefix would visibly disappear when we
      // send a new message. Same fix shape as `receiveMessage` does for
      // isOwn echoes.
      const stampedMsg: MessageType =
        state.userProfile
          ? {
              ...newMsg,
              senderId: newMsg.senderId || state.userProfile.id,
              senderName: newMsg.senderName ?? state.userProfile.fullName
            }
          : newMsg

      const newMessages = [...chatEntry.chat.messages, stampedMsg]
      chatEntry.chat.messages = newMessages
      chatEntry.chat.lastMessage = stampedMsg

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
  setChatAvatarOptimistic,
  patchLastMessageSender,
  applyParticipantLeft,
  setInfoMessage,
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
