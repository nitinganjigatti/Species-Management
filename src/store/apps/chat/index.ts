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
  ForwardingMessageRef,
  ChatAttachmentType,
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
  getUserById,
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
  extractContactsFromConversations,
  writeKickActor,
  clearKickActor,
  markSelfLeft,
  clearSelfLeft,
  readDeletedForMeIds,
  addDeletedForMeId,
  removeDeletedForMeId
} from 'src/lib/chat/api'

import { useChatStore } from '@antzsoft/chat-core'

import { composeForwardedText, stripForwardMarker, isForwarded } from 'src/lib/chat/forwardMarker'

// ----------------------------------------------------------------------
// Async Thunks — talk to the chat backend via @antzsoft/chat-core.
// If the SDK isn't initialized yet (auth not resolved or env vars missing)
// thunks resolve with empty state so the UI stays consistent.
// ----------------------------------------------------------------------

/**
 * Fetch the current user's chat profile via `GET /users/me`.
 */
export const fetchUserProfile = createAsyncThunk<ProfileUserType | null, { fallbackAvatarUrl?: string } | void>(
  'appChat/fetchUserProfile',
  async arg => {
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

  // const state = getState() as { chat?: ChatStoreType }
  // const currentUserId = state.chat?.userProfile?.id ?? ''
  // can identify the "other" participant in each direct conversation.
  // If the profile hasn't landed in Redux yet (race on first load), fall back
  // to a live getMe() call — avoids showing the current user's own name in
  // every DM sidebar row.
  const state = getState() as { chat?: ChatStoreType }
  let currentUserId: string | number = state.chat?.userProfile?.id ?? ''
  if (!currentUserId) {
    try {
      const me = await getMe()
      currentUserId = me.id
    } catch {
      // proceed with empty id — sidebar will self-heal on next profile load
    }
  }

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
// REMOVE ONCE BACKEND ships `senderId` + `sender.displayName` +
// `deliveryStatus` on `lastMessage` in the `GET /conversations` response
// (api-integration-status.md backend issue #8). At that point both the
// thunk below and the `feedback` parameter on `patchLastMessageSender`
// become redundant — the conv-list response would supply everything the
// sidebar needs to render prefix + tick correctly on cold load.
const enrichedLastMessageIds = new Set<string>()
export const enrichLastMessageSenders = createAsyncThunk<void, void>(
  'appChat/enrichLastMessageSenders',
  async (_, { dispatch, getState }) => {
    const client = getChatClientOrNull()
    if (!client) return

    const state = getState() as { chat?: ChatStoreType }
    const chats = state.chat?.chats ?? []

    // Pick candidates whose lastMessage needs REST enrichment.
    //
    // Backend issue #8: conv-list endpoint returns lastMessage with
    //   • Groups: empty senderId, missing senderName, missing
    //     deliveryStatus → need BOTH sender enrichment (for the
    //     "Saket: …" prefix) AND feedback enrichment (for the tick).
    //   • DMs: senderId IS populated, senderName usually too — but
    //     deliveryStatus is STILL missing → need feedback enrichment
    //     only, so the tick can reflect the real sent/delivered/seen
    //     state on cold load instead of always showing single check.
    //
    // We now include BOTH chat kinds. The `feedbackIncomplete` heuristic
    // gates the DM path: only fires REST when the message is likely
    // own AND the adapter's default feedback hasn't been bumped past
    // the sent-only state yet.
    const myName = state.chat?.userProfile?.fullName ?? ''
    const myId = String(state.chat?.userProfile?.id ?? '')
    const allCandidates = chats.map(c => {
      const lm = c.chat.lastMessage
      // "Looks own" — covers both DMs (id match) and groups
      // (name match because group senderId is empty per issue #8).
      const looksOwn = Boolean(
        (lm?.senderId && myId && String(lm.senderId) === myId) ||
          (myName && lm?.senderName === myName)
      )
      const feedbackIncomplete = Boolean(
        looksOwn && lm?.feedback && !lm.feedback.isDelivered && !lm.feedback.isSeen
      )

      return {
        chatId: c.id,
        isGroup: Boolean(c.isGroup),
        fullName: c.fullName,
        messageId: lm?.id,
        senderId: lm?.senderId,
        senderName: lm?.senderName,
        // For groups we need senderName for the prefix. For DMs the
        // prefix is irrelevant, so `hasSender: true` (skip the
        // sender-missing trigger; only feedback can cause enrichment).
        hasSender: c.isGroup ? Boolean(lm?.senderName) : true,
        feedbackIncomplete,
        participants: c.participants ?? [],
        lastMessageText: lm?.message?.slice?.(0, 30)
      }
    })

    // [chat:enrich-trace] Per-candidate reason enrichment will or won't run.
    try {
      console.log(
        '[chat:enrich-trace] candidates',
        allCandidates.map(c => ({
          chatId: String(c.chatId),
          isGroup: c.isGroup,
          name: c.fullName,
          messageId: c.messageId,
          senderId: c.senderId,
          senderName: c.senderName,
          hasSender: c.hasSender,
          feedbackIncomplete: c.feedbackIncomplete,
          alreadyEnriched: c.messageId ? enrichedLastMessageIds.has(c.messageId) : false,
          participantCount: c.participants.length,
          willEnrich: Boolean(
            c.messageId &&
              (!c.hasSender || c.feedbackIncomplete) &&
              !enrichedLastMessageIds.has(c.messageId)
          ),
          lastMessageText: c.lastMessageText
        }))
      )
    } catch (e) {
      console.warn('[chat:enrich-trace] candidates log failed', e)
    }

    // Enrich when EITHER sender is missing OR feedback is incomplete on
    // a (likely) own message. The session-dedupe Set still applies so
    // we never refetch the same messageId twice.
    const targets = allCandidates.filter(
      t => t.messageId && (!t.hasSender || t.feedbackIncomplete) && !enrichedLastMessageIds.has(t.messageId)
    )

    if (targets.length === 0) {
      console.log('[chat:enrich-trace] no targets — nothing to enrich')

      return
    }

    // Fast path — for each target, try to resolve the sender's display
    // name from the chat's already-loaded `participants` array (matched
    // by `senderId`). Zero network calls. Solves the visible
    // "sidebar hydrates row-by-row" delay an admin sees on cold load
    // when they're in many groups — without this, every group would
    // fire its own `getMessage(id)` REST round-trip.
    const networkFallbackTargets: typeof targets = []
    for (const t of targets) {
      if (!t.messageId) continue
      if (t.senderId !== undefined && t.senderId !== '') {
        const senderIdStr = String(t.senderId)
        const found = t.participants.find(p => String(p.userId) === senderIdStr)
        const resolvedName = found?.displayName || found?.username
        console.log('[chat:enrich-trace] fast-path attempt', {
          chatId: String(t.chatId),
          name: t.fullName,
          senderIdFromList: t.senderId,
          foundInParticipants: Boolean(found),
          resolvedName
        })
        if (resolvedName) {
          enrichedLastMessageIds.add(t.messageId)
          dispatch(
            patchLastMessageSender({
              chatId: t.chatId,
              senderId: t.senderId,
              senderName: resolvedName
            })
          )
          continue
        }
      } else {
        console.log('[chat:enrich-trace] fast-path skipped — empty senderId', {
          chatId: String(t.chatId),
          name: t.fullName,
          senderIdFromList: t.senderId
        })
      }
      networkFallbackTargets.push(t)
    }

    if (networkFallbackTargets.length === 0) {
      console.log('[chat:enrich-trace] all resolved on fast path — done')

      return
    }
    console.log(
      '[chat:enrich-trace] slow-path (getMessage REST) needed for',
      networkFallbackTargets.map(t => ({ chatId: String(t.chatId), name: t.fullName, messageId: t.messageId }))
    )

    // Slow path — only chats whose sender isn't in `participants`
    // (shouldn't be common — happens if the sender has been removed
    // and we haven't cached their profile). One REST call per target.
    await Promise.all(
      networkFallbackTargets.map(async t => {
        if (!t.messageId) return
        enrichedLastMessageIds.add(t.messageId)
        try {
          const msg = await getMessage(t.messageId)
          const senderId = (msg as { senderId?: string }).senderId ?? ''
          const senderName =
            (msg as { sender?: { displayName?: string; username?: string } }).sender?.displayName ??
            (msg as { sender?: { displayName?: string; username?: string } }).sender?.username
          // Extract deliveryStatus so the sidebar tick reflects the
          // server-authoritative state (sent / delivered / read) on
          // cold load. Mirrors the same derivation the adapter does in
          // `sdkMessageToMessage`. Falls back to undefined → patch
          // omits feedback → no overwrite of any existing value.
          const deliveryStatus = (msg as { deliveryStatus?: string }).deliveryStatus
          const status = (msg as { status?: string }).status
          const feedback = deliveryStatus
            ? {
                isSent: status !== 'failed' && deliveryStatus !== 'failed',
                isDelivered: deliveryStatus === 'delivered' || deliveryStatus === 'read',
                isSeen: deliveryStatus === 'read'
              }
            : undefined
          console.log('[chat:enrich-trace] slow-path REST returned', {
            chatId: String(t.chatId),
            name: t.fullName,
            messageId: t.messageId,
            senderId,
            senderName,
            deliveryStatus,
            willPatch: Boolean(senderId || senderName || feedback)
          })
          if (senderId || senderName || feedback) {
            dispatch(
              patchLastMessageSender({
                chatId: t.chatId,
                senderId,
                senderName,
                ...(feedback ? { feedback } : {})
              })
            )
          }
        } catch (err) {
          console.warn('[chat:enrich-trace] slow-path REST failed for', t.messageId, err)
        }
      })
    )
  }
)

/**
 * Start (or reopen) a direct conversation with another user — WhatsApp-style
 * deferred creation. The flow no longer eagerly calls `createDirect`:
 *
 *   1. Look up `state.chats` for an existing DM with this peer
 *      (`participantIds` includes both me + the chosen user, not group).
 *   2. If found → just `selectChat(existingId)`. No API call.
 *   3. If not found → build a LOCAL draft chat (`isDraft: true`,
 *      placeholder id `__draft__<userId>`, populated from
 *      `getUserById(userId)` for name/avatar) and dispatch
 *      `setDraftChat`. The panel opens immediately with an empty
 *      message list, but NO server `Conversation` record exists yet.
 *      `sendMsg` materializes it via `createDirectConversation` on
 *      the first send. If the user navigates away without sending,
 *      the draft just disappears.
 */
export const startDirectChat = createAsyncThunk<void, ChatEntityId>(
  'appChat/startDirectChat',
  async (userId, { dispatch, getState }) => {
    const client = getChatClientOrNull()
    if (!client) return

    const state = getState() as { chat?: ChatStoreType }
    const currentUserId = String(state.chat?.userProfile?.id ?? '')
    const peerIdStr = String(userId)
    const isSelfChat = peerIdStr === currentUserId && currentUserId !== ''

    // (1) Existing DM lookup — short-circuit to the existing path. Self-chats
    // need a distinct predicate: their participants are entirely the current
    // user, so the generic `includes(peer) && includes(me)` check would
    // otherwise match any DM the current user is in.
    const existing = (state.chat?.chats ?? []).find(c => {
      if (c.isGroup === true) return false
      const ids = c.participantIds?.map(String) ?? []
      if (isSelfChat) {
        return ids.length > 0 && ids.every(id => id === currentUserId)
      }

      return ids.includes(peerIdStr) && ids.includes(currentUserId)
    })
    if (existing) {
      dispatch(selectChat(existing.id))

      return
    }

    // (2) No DM yet — build a local-only draft. No `createDirect` call;
    // sendMsg will materialize the conversation server-side on first send.
    try {
      const user = await getUserById(peerIdStr)
      const displayName = user?.displayName || user?.username || 'User'
      const avatarUrl = user?.avatarUrl

      const draft: ChatsArrType = {
        id: `__draft__${peerIdStr}`,
        role: '',
        about: '',
        fullName: displayName,
        ...(avatarUrl ? { avatar: avatarUrl } : {}),
        status: 'offline',
        isGroup: false,
        isDraft: true,
        participantIds: [currentUserId, peerIdStr],
        participants: [
          { userId: currentUserId, isActive: true, role: 'member' },
          { userId: peerIdStr, isActive: true, role: 'member', displayName, avatarUrl }
        ],
        isCurrentUserActive: true,
        chat: {
          id: `__draft__${peerIdStr}`,
          unseenMsgs: 0,
          messages: [],
          hasMoreOlder: false,
          loadingOlder: false
        }
      }

      dispatch(setDraftChat(draft))
    } catch (err) {
      console.error('[chat] startDirectChat (draft setup) failed:', err)
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
  // v1.1.3 — optional `role` lets the caller add new members directly
  // as admins. Omit/undefined → server defaults to 'member'. Existing
  // two-field callers ({ groupId, userIds }) keep working unchanged.
  { groupId: ChatEntityId; userIds: ChatEntityId[]; role?: 'admin' | 'member' }
>('appChat/addParticipantsToGroup', async ({ groupId, userIds, role }, { dispatch, getState }) => {
  const client = getChatClientOrNull()
  if (!client) {
    console.warn('[chat] addParticipantsToGroup: SDK not ready')

    return
  }
  if (typeof groupId !== 'string') {
    console.warn('[chat] addParticipantsToGroup: groupId must be a real conversation id')

    return
  }

  // Optimistic preview — sidebar updates to "You added X" instantly.
  // Touches only chat.lastMessage; the real server new_message will
  // overwrite when it lands. For multi-add we preview just the first
  // user (matches WhatsApp's "You added X" + "X and N others added"
  // sidebar collapse).
  const preState = getState() as { chat?: ChatStoreType }
  const me = preState.chat?.userProfile
  const firstUserId = userIds[0]
  const firstContact = preState.chat?.contacts?.find(c => String(c.id) === String(firstUserId))
  const firstName = firstContact?.fullName ?? ''
  if (me?.id !== undefined && me.fullName && firstName) {
    dispatch(
      patchOptimisticLastMessage({
        chatId: groupId,
        message: {
          id: `optimistic-add-${String(groupId)}-${Date.now()}`,
          message: `${me.fullName} added ${firstName}`,
          time: new Date().toISOString(),
          senderId: me.id,
          senderName: me.fullName,
          feedback: { isSent: true, isDelivered: false, isSeen: false },
          contentType: 'system',
          systemOperationType: 'user_added',
          targetUserId: firstUserId,
          targetUserName: firstName
        }
      })
    )
  }

  try {
    const conv = await apiAddParticipants(groupId, userIds.map(String), role)

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
export const updateGroupChat = createAsyncThunk<void, { chatId: ChatEntityId; name?: string; description?: string }>(
  'appChat/updateGroupChat',
  async ({ chatId, name, description }, { dispatch, getState }) => {
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
  }
)

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
  console.log('[chat:icon-upload] thunk start', {
    chatId,
    fileName: file?.name,
    fileType: file?.type,
    fileSize: file?.size
  })

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
 *
 * Optimistic update — sidebar + banner reflect the removal instantly,
 * BEFORE the REST round-trip + socket broadcast complete. Without this
 * the admin sees several hundred ms of "nothing happened" between click
 * and server echo. The optimistic write touches only `chat.lastMessage`
 * (not `chat.messages`) so the eventual server `new_message` doesn't
 * collide / duplicate the in-chat pill.
 */
export const removeParticipantFromGroup = createAsyncThunk<void, { groupId: ChatEntityId; userId: ChatEntityId }>(
  'appChat/removeParticipantFromGroup',
  async ({ groupId, userId }, { dispatch, getState }) => {
    const client = getChatClientOrNull()
    if (!client || typeof groupId !== 'string') return

    // Optimistic preview — derive target's display name from participants
    // (always present at this point since the admin just selected them).
    const preState = getState() as { chat?: ChatStoreType }
    const me = preState.chat?.userProfile
    const chat = preState.chat?.chats?.find(c => c.id === groupId)
    const target = chat?.participants?.find(p => String(p.userId) === String(userId))
    const targetName = target?.displayName ?? target?.username ?? ''
    if (me?.id !== undefined && me.fullName && targetName) {
      dispatch(
        patchOptimisticLastMessage({
          chatId: groupId,
          message: {
            id: `optimistic-remove-${String(groupId)}-${Date.now()}`,
            message: `${me.fullName} removed ${targetName}`,
            time: new Date().toISOString(),
            senderId: me.id,
            senderName: me.fullName,
            feedback: { isSent: true, isDelivered: false, isSeen: false },
            contentType: 'system',
            systemOperationType: 'user_removed',
            targetUserId: userId,
            targetUserName: targetName
          }
        })
      )
    }

    try {
      const conv = await apiRemoveParticipant(groupId, String(userId))
      const state = getState() as { chat?: ChatStoreType }
      const currentUserId = state.chat?.userProfile?.id ?? ''
      dispatch(addOrReplaceChat(sdkConversationToChat(conv, currentUserId)))
    } catch (err) {
      console.error('[chat] removeParticipantFromGroup failed:', err)
    }
  }
)

/**
 * Promote / demote a participant within a group (admin-only).
 */
export const updateParticipantRoleInGroup = createAsyncThunk<
  void,
  { groupId: ChatEntityId; userId: ChatEntityId; role: 'admin' | 'member' }
>('appChat/updateParticipantRoleInGroup', async ({ groupId, userId, role }, { dispatch, getState }) => {
  const client = getChatClientOrNull()
  if (!client || typeof groupId !== 'string') return

  // Optimistic preview — "You made X an admin" / "You dismissed X as admin"
  // shows in the sidebar instantly, before the REST round-trip + socket
  // broadcast return. Real server message reconciles via receiveMessage
  // shortly after.
  const preState = getState() as { chat?: ChatStoreType }
  const me = preState.chat?.userProfile
  const chat = preState.chat?.chats?.find(c => c.id === groupId)
  const target = chat?.participants?.find(p => String(p.userId) === String(userId))
  const targetName = target?.displayName ?? target?.username ?? ''
  if (me?.id !== undefined && me.fullName && targetName) {
    const op = role === 'admin' ? 'admin_promoted' : 'admin_demoted'
    const previewText =
      role === 'admin'
        ? `${me.fullName} made ${targetName} an admin`
        : `${me.fullName} dismissed ${targetName} as admin`
    dispatch(
      patchOptimisticLastMessage({
        chatId: groupId,
        message: {
          id: `optimistic-${op}-${String(groupId)}-${Date.now()}`,
          message: previewText,
          time: new Date().toISOString(),
          senderId: me.id,
          senderName: me.fullName,
          feedback: { isSent: true, isDelivered: false, isSeen: false },
          contentType: 'system',
          systemOperationType: op,
          targetUserId: userId,
          targetUserName: targetName
        }
      })
    )
  }

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
export const muteConversation = createAsyncThunk<void, { chatId: ChatEntityId; mutedUntil?: string }>(
  'appChat/muteConversation',
  async ({ chatId, mutedUntil }, { dispatch }) => {
    const client = getChatClientOrNull()
    if (!client || typeof chatId !== 'string') return

    try {
      await apiMuteConversation(chatId, mutedUntil)
      dispatch(updateChatFlags({ chatId, isMuted: true }))
    } catch (err) {
      console.error('[chat] muteConversation failed:', err)
    }
  }
)

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
export const selectChat = createAsyncThunk<void, ChatEntityId>('appChat/selectChat', async (chatId, { dispatch }) => {
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
})

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
export const jumpToMessage = createAsyncThunk<void, { chatId: ChatEntityId; messageId: string }>(
  'appChat/jumpToMessage',
  async ({ chatId, messageId }, { dispatch }) => {
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
/**
 * If the currently-selected chat is a WhatsApp-style draft DM (created
 * locally by `startDirectChat`, not yet on the server), materialize it
 * server-side via `createDirect` and return the REAL conversation id.
 * Idempotent — if already materialized (no draft in state), returns the
 * existing id from the argument. Used by both `sendMsg` and SendMsgForm's
 * attachment-upload path, since both need a real id to operate against.
 */
export const materializeDraftIfNeeded = createAsyncThunk<string, ChatsArrType>(
  'appChat/materializeDraftIfNeeded',
  async (contact, { dispatch, getState }) => {
    if (!contact.isDraft) return String(contact.id)

    const state = getState() as { chat?: ChatStoreType }
    const currentUserId = String(state.chat?.userProfile?.id ?? '')
    const ids = contact.participantIds?.map(String) ?? []
    const isSelfChat = ids.length > 0 && ids.every(id => id === currentUserId)
    const peerUserId = isSelfChat ? currentUserId : ids.find(id => id !== currentUserId)
    if (!peerUserId) throw new Error('[chat] draft chat is missing a peer userId')

    // CLIENT-SIDE DEFENSE — re-check state.chats at the last moment before
    // hitting `POST /conversations/direct`. The user may have clicked the
    // contact while `fetchChatsContacts` was still in flight (common when
    // opening the floating ChatLauncher panel — every toggle remounts
    // AppChat and re-runs the conversation list fetch). By the time
    // sendMsg fires the user has typed + clicked Send, so several hundred
    // ms have elapsed and the list has very likely populated.
    //
    // If the DM already exists in state, dispatch `materializeDraft` with
    // that entry (it swaps `selectedChat` from the draft to the real
    // conversation) and return its id — skipping the server create call
    // and preventing a duplicate row.
    //
    // Frontend band-aid for backend ticket #13 (api-integration-status.md).
    // Remove this block once `POST /conversations/direct` is find-or-create
    // server-side; until then, this prevents the launcher race from
    // producing duplicate DM conversations on the server.
    //
    // Note: this does NOT prevent cross-user races (e.g. you + peer both
    // opening a fresh DM at the same time) — only the server fix handles
    // that. But it eliminates the launcher-induced same-user race.
    const peerIdStr = String(peerUserId)
    const existingDM = (state.chat?.chats ?? []).find(c => {
      if (c.isGroup === true) return false
      if (c.isDraft === true) return false
      const partIds = c.participantIds?.map(String) ?? []
      if (isSelfChat) {
        return partIds.length > 0 && partIds.every(id => id === currentUserId)
      }

      return partIds.includes(peerIdStr) && partIds.includes(currentUserId)
    })
    if (existingDM && typeof existingDM.id === 'string' && !existingDM.id.startsWith('__draft__')) {
      dispatch(materializeDraft(existingDM))

      return String(existingDM.id)
    }

    const conv = await createDirectConversation({ userId: peerUserId })
    const realChat = sdkConversationToChat(conv, currentUserId)
    dispatch(materializeDraft(realChat))

    return conv.id
  }
)

export const sendMsg = createAsyncThunk(
  'appChat/sendMsg',
  async (obj: SendMsgParamsType & { contact?: ChatsArrType }, { dispatch, getState }) => {
    let conversationId = obj.contact?.id ?? obj.chat?.id
    const client = getChatClientOrNull()

    const state = getState() as { chat?: ChatStoreType }
    const currentUserId = state.chat?.userProfile?.id ?? ''

    // Draft chats: materialize server-side via shared thunk before sending.
    if (obj.contact?.isDraft) {
      conversationId = await dispatch(materializeDraftIfNeeded(obj.contact)).unwrap()
    }

    if (!client || typeof conversationId !== 'string') {
      console.error('[chat] sendMsg precondition failed', {
        client: client ? 'ready' : 'null',
        conversationId
      })
      throw new Error('[chat] sendMsg requires an initialized SDK and a real conversation id')
    }

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    // Map app-side ChatAttachmentType → SDK SendMessageAttachment (uses fileId).
    // `duration` is forwarded for audio/video so receivers can render the
    // length in their player UI (v1.1.3 spec). Other types leave it
    // undefined — the SDK field is optional.
    const attachments = obj.attachments?.length
      ? obj.attachments.map(a => ({
          fileId: a.id,
          type: a.type,
          url: a.url,
          thumbnailUrl: a.thumbnailUrl,
          filename: a.filename,
          mimeType: a.mimeType,
          size: a.size,
          ...(a.duration !== undefined && (a.type === 'audio' || a.type === 'video') ? { duration: a.duration } : {})
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

/**
 * Forward an existing message into another conversation.
 *
 * Implemented as a client-side composition because the SDK has no
 * forwarding primitive — we re-send the source content via the standard
 * `sendMessageOverSocket` path with a sentinel prefix on the text so both
 * sender and recipient render the "Forwarded" label. Attachments are
 * forwarded by reusing the source `Attachment.id` as the destination
 * `SendMessageAttachment.fileId`; this assumes the backend accepts an
 * already-uploaded fileId from another conversation. If that assumption
 * breaks, the socket ack will reject and the thunk surfaces a toast via
 * the dispatcher.
 *
 * On success, optionally dispatches `selectChat(targetChatId)` so the
 * user lands in the destination chat with the forwarded message visible.
 */
export const forwardMessage = createAsyncThunk<
  void,
  {
    sourceMessageId: string
    sourceText?: string
    sourceAttachments?: ChatAttachmentType[]
    targetChatId: ChatEntityId
    openTargetAfter?: boolean
    isOwnMessage?: boolean
  }
>('appChat/forwardMessage', async (params, { dispatch }) => {
  const { sourceText, sourceAttachments, targetChatId, openTargetAfter = true, isOwnMessage } = params
  const client = getChatClientOrNull()
  if (!client || typeof targetChatId !== 'string') {
    throw new Error('[chat] forwardMessage requires an initialized SDK and a real target chat id')
  }

  const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  // Map ChatAttachmentType → SendMessageAttachment. Same shape as sendMsg.
  const attachments = sourceAttachments?.length
    ? sourceAttachments.map(a => ({
        fileId: a.id,
        type: a.type,
        url: a.url,
        thumbnailUrl: a.thumbnailUrl,
        filename: a.filename,
        mimeType: a.mimeType,
        size: a.size
      }))
    : undefined

  // Add the [fwd] marker unless this is the user's own original message.
  // Exception: if the source already carries a forward marker (i.e. it was
  // itself a forwarded message), always preserve the marker — the content
  // originated from a third party regardless of who relayed it last.
  const text =
    isOwnMessage && !isForwarded(sourceText) ? stripForwardMarker(sourceText) : composeForwardedText(sourceText)

  try {
    await sendMessageOverSocket({
      conversationId: targetChatId,
      text,
      tempId,
      ...(attachments ? { attachments } : {})
    })
  } catch (err) {
    console.error('[chat] forwardMessage send failed:', err)
    throw err
  }

  dispatch(setForwardingMessage(null))

  if (openTargetAfter) {
    dispatch(selectChat(targetChatId))
  }
})

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
  infoMessage: null,
  forwardingMessage: null,
  selectedConversationId: null,
  drafts: {}
}

export const appChatSlice = createSlice({
  name: 'appChat',
  initialState,
  reducers: {
    removeSelectedChat: state => {
      state.selectedChat = null
    },
    setSelectedConversationId: (state, action: PayloadAction<string | null>) => {
      state.selectedConversationId = action.payload
    },
    setActiveFilter: (state, action: PayloadAction<ChatFilterType>) => {
      state.activeFilter = action.payload
    },
    // Per-conversation draft setter. Empty/whitespace text deletes the
    // entry so empty drafts don't accumulate or render in the sidebar.
    setDraft: (state, action: PayloadAction<{ conversationId: string; text: string }>) => {
      const { conversationId, text } = action.payload
      if (!conversationId) return
      if (text && text.trim().length) {
        state.drafts[conversationId] = text
      } else {
        delete state.drafts[conversationId]
      }
    },
    // Synchronous "open this chat" reducer. Called by the `selectChat` thunk
    // first so the chat panel opens immediately (with whatever messages are
    // already in state), then the thunk loads fresh messages from the SDK.
    setSelectedChat: (state, action: PayloadAction<ChatEntityId>) => {
      if (!state.chats) return

      const chatId = action.payload
      const chatIdStr = String(chatId)

      // Try existing chat first (compare as strings to handle type mismatches)
      let chatEntry = state.chats.find(c => String(c.id) === chatIdStr)

      // Otherwise build a fresh chat from a contact
      if (!chatEntry) {
        const contact = state.contacts?.find(c => String(c.id) === chatIdStr)
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
    // Case-1 patch for the `conversation_updated` socket event — when only
    // a new message arrived (no metadata change). Server sends a slim
    // payload with `lastMessage` (custom event shape, NOT the SDK Message),
    // `unreadCount`, and `updatedAt`. We patch only those fields on the
    // matching chat and move the chat to the top of the list. Case 2
    // (full conversation replace) goes through `addOrReplaceChat` instead.
    patchConversationFromEvent: (
      state,
      action: PayloadAction<{
        chatId: ChatEntityId
        lastMessage?: {
          messageId: string
          contentPreview?: string
          sentAt?: string
          senderName?: string
          hasAttachments?: boolean
          attachmentCount?: number
        }
        unreadCount?: number
      }>
    ) => {
      if (!state.chats) return
      const { chatId, lastMessage, unreadCount } = action.payload
      const chatEntry = state.chats.find(c => c.id === chatId)
      if (!chatEntry) return

      // Guard: don't let socket updates leak post-kick messages into the
      // sidebar for groups we've been removed from. The cold-load adapter
      // (`sdkConversationToChat`) sets a "You were removed…" placeholder;
      // this guard keeps it pinned even when the server (incorrectly)
      // continues broadcasts `conversation_updated` events to kicked
      // sockets (backend quirk #11). Active members are unaffected.
      if (chatEntry.isGroup && chatEntry.isCurrentUserActive === false) return

      if (lastMessage) {
        const existing = chatEntry.chat.lastMessage
        // Preserve the existing attachments array if the patch is about the
        // SAME message we already have — the event payload only signals
        // attachment presence (`hasAttachments`/`attachmentCount`), not the
        // per-attachment metadata (type, mimeType, filename) the sidebar
        // needs to pick an icon. Falling back keeps the existing icon
        // correct. For a different message id we drop the previous
        // attachments — re-arrives via `new_message` if needed.
        const sameMessage = existing?.id && existing.id === lastMessage.messageId
        // CRITICAL: also preserve system-message metadata
        // (`contentType`, `systemOperationType`, `targetUserId`,
        // `targetUserName`) when the patch is about the same message
        // we already have. The slim `conversation_updated` payload
        // does NOT carry these fields, so a naive overwrite strips
        // them — which then breaks the perspective rewrite (sidebar
        // would show raw "Anil removed Ajay" instead of "You removed
        // Ajay" or "Anil removed you", depending on viewer). When the
        // patch refers to a different message we let them default to
        // undefined — the next `new_message` (or messages.list refresh)
        // will repopulate them.
        // senderId resolution — the slim payload doesn't carry it.
        // Cases (in priority order):
        //   1. sameMessage: keep existing.senderId (correct — same msg).
        //   2. senderName matches userProfile.fullName: it's us → use
        //      our own profile id. Lets the sidebar resolver detect
        //      the 'actor' perspective immediately, so we don't flash
        //      raw "Anil Rathod removed Ajay Antony" before `new_message`
        //      arrives with the full metadata.
        //   3. Look up senderName in the chat's `participants` array —
        //      the message came from a current/past member, so their
        //      display name is recorded there. This restores the
        //      "Anil: hello" sidebar prefix for incoming group messages
        //      (and the in-bubble sender label, which also reads
        //      lastMessage.senderId). Falls back to `state.contacts`
        //      when participants is empty (cold DM cases).
        //   4. Otherwise: empty string. We deliberately do NOT carry
        //      the previous `existing.senderId` (which may belong to a
        //      completely different sender).
        const myFullName = state.userProfile?.fullName
        const myId = state.userProfile?.id
        const incomingSenderName = lastMessage.senderName
        let resolvedSenderId: ChatEntityId | '' = ''
        if (sameMessage) {
          resolvedSenderId = existing!.senderId ?? ''
        } else if (myFullName && incomingSenderName && incomingSenderName === myFullName && myId !== undefined) {
          resolvedSenderId = myId
        } else if (incomingSenderName) {
          const fromParticipants = (chatEntry.participants ?? []).find(
            p => p.displayName === incomingSenderName || p.username === incomingSenderName
          )
          if (fromParticipants?.userId !== undefined) {
            resolvedSenderId = fromParticipants.userId
          } else {
            const fromContacts = state.contacts?.find(c => c.fullName === incomingSenderName)
            if (fromContacts?.id !== undefined) {
              resolvedSenderId = fromContacts.id
            }
          }
        }

        chatEntry.chat.lastMessage = {
          id: lastMessage.messageId,
          time: lastMessage.sentAt ?? existing?.time ?? new Date().toISOString(),
          message: lastMessage.contentPreview ?? '',
          senderId: resolvedSenderId,
          senderName: lastMessage.senderName ?? existing?.senderName,
          feedback: existing?.feedback ?? { isSent: true, isDelivered: false, isSeen: false },
          attachments: sameMessage
            ? existing?.attachments
            : lastMessage.hasAttachments
            ? existing?.attachments
            : undefined,
          // System metadata — preserved when same message id. For
          // different message ids these stay undefined; the next
          // `new_message` (which arrives shortly after) refills them.
          ...(sameMessage && existing?.contentType ? { contentType: existing.contentType } : {}),
          ...(sameMessage && existing?.systemOperationType
            ? { systemOperationType: existing.systemOperationType }
            : {}),
          ...(sameMessage && existing?.targetUserId !== undefined ? { targetUserId: existing.targetUserId } : {}),
          ...(sameMessage && existing?.targetUserName ? { targetUserName: existing.targetUserName } : {})
        }
      }

      if (typeof unreadCount === 'number') {
        // If this conversation is currently open the user is actively reading it —
        // keep unseenMsgs at 0. The server's value is stale (it incremented before
        // our markRead socket call was processed). Mirrors mobile's behaviour where
        // the screen being focused means messages are immediately consumed.
        const isCurrentlyOpen = state.selectedChat?.contact.id === chatId
        chatEntry.chat.unseenMsgs = isCurrentlyOpen ? 0 : unreadCount
      }

      // New activity → bubble to the top of the list, matching how
      // `receiveMessage` already does for `new_message`-driven updates.
      if (lastMessage) {
        const idx = state.chats.indexOf(chatEntry)
        if (idx > 0) {
          state.chats.splice(idx, 1)
          state.chats.unshift(chatEntry)
        }
      }

      if (state.selectedChat && state.selectedChat.contact.id === chatId) {
        state.selectedChat = { chat: chatEntry.chat, contact: chatEntry }
      }
    },
    // Composer reply state — set by clicking "Reply" on a bubble, cleared by
    // the composer's cancel button or by sendMsg.fulfilled.
    setReplyingTo: (state, action: PayloadAction<MessageReplyRef | null>) => {
      state.replyingTo = action.payload
    },
    // Composer edit state — set by clicking "Edit" on an own bubble; cleared
    // when the edit completes or the user cancels.
    setEditingMessage: (state, action: PayloadAction<{ messageId: string; originalText: string } | null>) => {
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
      action: PayloadAction<{
        messageId: string
        messageText?: string
        readBy?: Array<{ userId: string; readAt: string }>
        deliveredTo?: Array<{ userId: string; deliveredAt: string }>
      } | null>
    ) => {
      state.infoMessage = action.payload
    },
    // "Forward message" picker state — set by clicking "Forward" on a
    // bubble; cleared on send-success or by the dialog's cancel button.
    // The dialog is mounted at the chat shell root (ChatContent) so it
    // overlays the chat panel.
    setForwardingMessage: (state, action: PayloadAction<ForwardingMessageRef | null>) => {
      state.forwardingMessage = action.payload
    },
    // Pin — server-broadcast on `message_pin_updated`. Visible to all
    // participants of the conversation.
    applyMessagePin: (state, action: PayloadAction<{ messageId: string; isPinned: boolean }>) => {
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
    setMessageStarred: (state, action: PayloadAction<{ messageId: string; isStarred: boolean }>) => {
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

      // Persist into the deleted-for-me localStorage cache so future
      // `setChatMessages` payloads (which may include this id again — the
      // backend currently does NOT filter messages.list for the user who
      // deleted) can filter it out before the bubble re-renders.
      // Keyed per-user so account switches don't leak deletions.
      // REMOVE ONCE BACKEND ships server-side filtering.
      const meId = state.userProfile?.id
      if (meId) addDeletedForMeId(meId, messageId)

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
    // WhatsApp-style "Undo" for a just-removed delete-for-me. Re-inserts
    // the snapshotted message back into `chat.messages` at its correct
    // time-sorted position so the bubble re-appears exactly where it
    // was. Used ONLY by the MessageActions undo toast click handler.
    // Idempotent — if a message with the same id is already present
    // (e.g., the server broadcast got back here first), the insert is a
    // no-op so we never duplicate.
    restoreDeletedMessage: (state, action: PayloadAction<{ chatId: ChatEntityId; message: MessageType }>) => {
      if (!state.chats) return
      const { chatId, message } = action.payload
      if (!message?.id) return

      // Undo wins over the deferred-commit timer + the localStorage cache.
      // Remove the id from the deleted-for-me cache so a fresh fetch
      // doesn't accidentally filter it out (the user explicitly un-deleted).
      const meId = state.userProfile?.id
      if (meId) removeDeletedForMeId(meId, String(message.id))

      const chatEntry = state.chats.find(c => c.id === chatId)
      if (!chatEntry) return
      if (chatEntry.chat.messages.some(m => m.id === message.id)) return

      const restoredTime = message.time ? new Date(message.time as string | Date).getTime() : 0
      // Find the first message whose time is strictly newer — insert
      // before it to preserve chronological order. If none, append.
      const insertAt = chatEntry.chat.messages.findIndex(m => {
        const t = m.time ? new Date(m.time as string | Date).getTime() : 0
        return t > restoredTime
      })
      if (insertAt < 0) {
        chatEntry.chat.messages = [...chatEntry.chat.messages, message]
      } else {
        chatEntry.chat.messages = [
          ...chatEntry.chat.messages.slice(0, insertAt),
          message,
          ...chatEntry.chat.messages.slice(insertAt)
        ]
      }

      // If the restored message is now the newest, bring the sidebar
      // preview back to it. Otherwise leave the current lastMessage alone.
      const lastTime = chatEntry.chat.lastMessage?.time
        ? new Date(chatEntry.chat.lastMessage.time as string | Date).getTime()
        : 0
      if (restoredTime >= lastTime) {
        chatEntry.chat.lastMessage = message
      }

      if (state.selectedChat && state.selectedChat.contact.id === chatId) {
        state.selectedChat = {
          chat: { ...chatEntry.chat, messages: [...chatEntry.chat.messages] },
          contact: chatEntry
        }
      }
    },
    // Apply a server-broadcast edit. Updates `message`, `isEdited` and
    // `editedAt` on whichever message matches.
    applyMessageUpdate: (state, action: PayloadAction<{ messageId: string; text: string; editedAt?: string }>) => {
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
    setChatAvatarOptimistic: (state, action: PayloadAction<{ chatId: ChatEntityId; avatar: string }>) => {
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
    // Explicit avatar clear — used after a successful
    // `conversationsApi.removeIcon` so the sidebar / header / profile
    // drawer drop back to the initials fallback. Necessary because
    // `addOrReplaceChat` defensively keeps the previous avatar when the
    // server response's `iconUrl` is undefined (a quirk of participant-
    // mutation endpoints). This reducer overrides that protection for
    // the explicit-removal case only.
    clearChatAvatar: (state, action: PayloadAction<{ chatId: ChatEntityId }>) => {
      if (!state.chats) return
      const { chatId } = action.payload
      const idx = state.chats.findIndex(c => c.id === chatId)
      if (idx < 0) return
      const next = { ...state.chats[idx] }
      delete next.avatar
      state.chats[idx] = next
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
    // Mirror of `applyParticipantLeft` for the `participant_joined`
    // socket event. Fires when a user is added to a group (admin-add
    // OR a previously-removed user being re-added). Updates:
    //   • chat.participants — pushes a new entry OR flips an existing
    //     soft-deleted entry's `isActive` back to true
    //   • chat.participantIds — adds the userId (deduped)
    //   • chat.adminIds — adds when role === 'admin'
    //   • chat.isCurrentUserActive — flips back to true when WE were
    //     re-added (so the composer + danger zone re-unlock)
    //   • chat.removedBy / removedByName — cleared when WE were re-
    //     added, so the "You were removed by …" placeholder goes away
    applyParticipantJoined: (
      state,
      action: PayloadAction<{
        chatId: ChatEntityId
        userId: ChatEntityId
        displayName?: string
        username?: string
        avatarUrl?: string
        role?: 'admin' | 'member'
      }>
    ) => {
      if (!state.chats) return
      const { chatId, userId, displayName, username, avatarUrl, role } = action.payload
      const idx = state.chats.findIndex(c => c.id === chatId)
      if (idx < 0) return
      const userIdStr = String(userId)
      const chat = state.chats[idx]

      // Participant entry — flip existing back to active or push new.
      const existing = (chat.participants ?? []).find(p => String(p.userId) === userIdStr)
      const updatedParticipants = existing
        ? (chat.participants ?? []).map(p =>
            String(p.userId) === userIdStr
              ? {
                  ...p,
                  isActive: true,
                  // Re-add can carry fresh display info; only overwrite
                  // when the event actually provides each field.
                  ...(displayName ? { displayName } : {}),
                  ...(username ? { username } : {}),
                  ...(avatarUrl ? { avatarUrl } : {}),
                  ...(role ? { role } : {})
                }
              : p
          )
        : [
            ...(chat.participants ?? []),
            {
              userId: userIdStr,
              isActive: true,
              role: role ?? 'member',
              displayName,
              username,
              avatarUrl
            }
          ]

      const participantIdSet = new Set((chat.participantIds ?? []).map(String))
      participantIdSet.add(userIdStr)
      const updatedParticipantIds = Array.from(participantIdSet)

      const adminIdSet = new Set((chat.adminIds ?? []).map(String))
      if (role === 'admin') adminIdSet.add(userIdStr)
      const updatedAdminIds = Array.from(adminIdSet)

      const meIsJoiner = String(state.userProfile?.id ?? '') === userIdStr

      // Clean slate for re-added current user — drop the "removed by"
      // snapshot so the placeholder reverts to the normal composer.
      const nextChat: ChatsArrType = {
        ...chat,
        participants: updatedParticipants,
        participantIds: updatedParticipantIds,
        adminIds: updatedAdminIds,
        ...(meIsJoiner ? { isCurrentUserActive: true } : {})
      }
      if (meIsJoiner) {
        delete nextChat.removedBy
        delete nextChat.removedByName
        // Drop both localStorage flags for this chat — actor cache AND
        // self-left marker — so a future cold refresh treats the chat
        // as a normal active membership.
        clearKickActor(chatId)
        clearSelfLeft(chatId)
        // Clear the stale "You were removed…" / "<Actor> removed you"
        // sidebar preview that was written by applyParticipantLeft +
        // receiveMessage derivation during the prior kick. Without this
        // the sidebar keeps showing kick text after re-add until the
        // next `conversation_updated` lands — and that event can be
        // dropped by `patchConversationFromEvent`'s isCurrentUserActive
        // guard if it arrives before this reducer flips the flag.
        // Wiping lastMessage here is safe: subsequent activity (new
        // messages, system events like user_added / admin_promoted)
        // will repopulate it via the normal receive paths.
        const currentMsg = nextChat.chat.lastMessage?.message
        const isKickPreview =
          nextChat.chat.lastMessage?.contentType === 'system' &&
          (currentMsg === 'You were removed from this group' ||
            (typeof currentMsg === 'string' && currentMsg.endsWith(' removed you')))
        if (isKickPreview) {
          nextChat.chat = { ...nextChat.chat, lastMessage: undefined }
        }
      }
      state.chats[idx] = nextChat

      if (state.selectedChat && state.selectedChat.contact.id === chatId) {
        state.selectedChat = {
          chat: state.chats[idx].chat,
          contact: state.chats[idx]
        }
      }
    },
    applyParticipantLeft: (
      state,
      action: PayloadAction<{
        chatId: ChatEntityId
        userId: ChatEntityId
        // v1.1.3 — when the leaver was kicked by an admin the socket event
        // carries `removedBy`. Optional fields so existing single-arg
        // callers (chatId+userId only) keep working unchanged.
        removedBy?: ChatEntityId
        removedByName?: string
      }>
    ) => {
      if (!state.chats) return
      const { chatId, userId, removedBy, removedByName } = action.payload
      const idx = state.chats.findIndex(c => c.id === chatId)
      if (idx < 0) return
      const userIdStr = String(userId)
      const chat = state.chats[idx]

      // Update participants array (preserved with isActive=false for history).
      const updatedParticipants = (chat.participants ?? []).map(p =>
        String(p.userId) === userIdStr ? { ...p, isActive: false } : p
      )
      const updatedParticipantIds = (chat.participantIds ?? []).filter(id => String(id) !== userIdStr)
      const updatedAdminIds = (chat.adminIds ?? []).filter(id => String(id) !== userIdStr)
      const meIsLeaver = String(state.userProfile?.id ?? '') === userIdStr

      // Only snapshot the admin who removed us when the event is about US
      // AND removedBy is actually present (admin-removal path). Self-exit
      // leaves these fields untouched so the placeholder defaults to
      // "You're no longer a member".
      const removalFields =
        meIsLeaver && removedBy !== undefined && removedBy !== null ? { removedBy, removedByName } : {}

      // When self is the leaver, overwrite chat.lastMessage so the
      // sidebar preview updates immediately. Use the most specific copy
      // available based on what the event payload carried:
      //   • self-exit (no removedBy)              → "You left the group"
      //   • admin-kick + removedByName resolved   → "<Actor> removed you"
      //     (matches what receiveMessage synthesis writes, so a duplicate
      //      `participant_left` fire — StrictMode dev double-run or
      //      socket re-delivery — doesn't reset the text just because
      //      the synthesis dedupe ref blocks a second synthesis.)
      //   • admin-kick + no removedByName         → "You were removed from this group"
      //     (degraded fallback; later receiveMessage derivation or
      //      kick-actor cache hydrate fills in the actor name.)
      const isSelfExit = meIsLeaver && (removedBy === undefined || removedBy === null)
      const meIsLeaverPreview = isSelfExit
        ? 'You left the group'
        : removedByName
        ? `${removedByName} removed you`
        : 'You were removed from this group'
      const updatedChatBlock = meIsLeaver
        ? {
            ...chat.chat,
            lastMessage: chat.chat.lastMessage
              ? {
                  ...chat.chat.lastMessage,
                  message: meIsLeaverPreview,
                  contentType: 'system' as const
                }
              : chat.chat.lastMessage
          }
        : chat.chat

      state.chats[idx] = {
        ...chat,
        participants: updatedParticipants,
        participantIds: updatedParticipantIds,
        adminIds: updatedAdminIds,
        ...(meIsLeaver ? { isCurrentUserActive: false } : {}),
        ...removalFields,
        chat: updatedChatBlock
      }

      // Persist actor info to localStorage so the next cold refresh
      // hydrates sidebar + banner with "<Actor> removed you" instantly.
      // Only fires for admin-kick (removedBy present) — self-exits use
      // the parallel selfLeft flag below instead.
      if (meIsLeaver && removedBy !== undefined && removedBy !== null && removedByName) {
        writeKickActor(chatId, { id: String(removedBy), name: removedByName })
      }
      // Persist self-exit flag so the next cold refresh shows "You left
      // the group" without needing REST to preserve system metadata.
      if (meIsLeaver && (removedBy === undefined || removedBy === null)) {
        markSelfLeft(chatId)
      }

      // Mirror into selectedChat so the open chat's composer + Group info
      // drawer re-render immediately.
      if (state.selectedChat && state.selectedChat.contact.id === chatId) {
        state.selectedChat = {
          chat: updatedChatBlock,
          contact: state.chats[idx]
        }
      }
    },
    // Patch a chat's `lastMessage` with sender info AND feedback that
    // weren't included in the conversation-list response. Used by the
    // `enrichLastMessageSenders` thunk after it fetches full message
    // details via `getMessage(id)` to resolve both the WhatsApp-style
    // "Saket: …" sidebar prefix AND the read-receipt tick on cold load.
    // REMOVE ONCE BACKEND issue #8 ships — the `feedback` field on the
    // payload becomes unnecessary; the action can revert to sender-only.
    patchLastMessageSender: (
      state,
      action: PayloadAction<{
        chatId: ChatEntityId
        senderId: ChatEntityId
        senderName?: string
        feedback?: { isSent: boolean; isDelivered: boolean; isSeen: boolean }
      }>
    ) => {
      if (!state.chats) return
      const { chatId, senderId, senderName, feedback } = action.payload
      const idx = state.chats.findIndex(c => c.id === chatId)
      if (idx < 0) return
      const chat = state.chats[idx]
      if (!chat.chat.lastMessage) return
      // Sender fields: keep what's already there if it's truthy; only
      // overwrite the empty/missing ones. Feedback: take the freshly-
      // fetched value when provided — it represents the authoritative
      // server state from the per-message REST. Falls back to the
      // existing feedback when not provided so the call site can
      // selectively patch sender-only or feedback-only.
      chat.chat.lastMessage = {
        ...chat.chat.lastMessage,
        senderId: chat.chat.lastMessage.senderId || senderId,
        senderName: chat.chat.lastMessage.senderName ?? senderName,
        ...(feedback ? { feedback } : {})
      }
      if (state.selectedChat && state.selectedChat.contact.id === chatId) {
        state.selectedChat = {
          chat: { ...state.selectedChat.chat, lastMessage: chat.chat.lastMessage },
          contact: chat
        }
      }
    },
    // Optimistic lastMessage write — used by action thunks (remove /
    // promote / demote / add member) to update the sidebar preview
    // BEFORE the REST round-trip + socket broadcast complete. Touches
    // only `chat.lastMessage` (not `chat.messages`) so the eventual
    // real `new_message` broadcast doesn't duplicate the in-chat pill.
    // The real broadcast will overwrite `chat.lastMessage` via
    // `receiveMessage` + `patchConversationFromEvent` shortly after,
    // reconciling any field differences.
    patchOptimisticLastMessage: (state, action: PayloadAction<{ chatId: ChatEntityId; message: MessageType }>) => {
      if (!state.chats) return
      const { chatId, message } = action.payload
      const idx = state.chats.findIndex(c => c.id === chatId)
      if (idx < 0) return
      const chat = state.chats[idx]
      chat.chat.lastMessage = message
      if (state.selectedChat && state.selectedChat.contact.id === chatId) {
        state.selectedChat = {
          chat: { ...state.selectedChat.chat, lastMessage: message },
          contact: chat
        }
      }
    },
    // WhatsApp-style "draft" DM — opens the chat panel locally without
    // creating a server-side conversation. Sets `selectedChat` from the
    // payload but DOES NOT add to `state.chats` (no sidebar row).
    // Materialized later by `materializeDraft` when the user actually
    // sends their first message.
    setDraftChat: (state, action: PayloadAction<ChatsArrType>) => {
      const draft = action.payload
      state.selectedChat = {
        chat: draft.chat,
        contact: draft
      }
    },
    // Swap a draft chat for the real server-backed conversation after
    // `createDirectConversation` resolves on first send. Inserts the real
    // row at the top of `state.chats` and, if the currently-open chat is
    // the draft, repoints `selectedChat` at the real conversation so the
    // open panel keeps working with the real id (sendMessageOverSocket
    // result lands in the right chat via the `sendMsg.fulfilled` reducer).
    materializeDraft: (state, action: PayloadAction<ChatsArrType>) => {
      const realChat = action.payload
      if (!state.chats) {
        state.chats = [realChat]
      } else {
        const idx = state.chats.findIndex(c => c.id === realChat.id)
        if (idx >= 0) {
          state.chats[idx] = realChat
        } else {
          state.chats.unshift(realChat)
        }
      }
      if (state.selectedChat && state.selectedChat.contact.isDraft) {
        state.selectedChat = {
          chat: realChat.chat,
          contact: realChat
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

        // Three-way merge for lastMessage:
        //   1. If existing.lastMessage is NEWER than incoming.lastMessage,
        //      keep existing. This protects optimistic previews (e.g.
        //      "You removed Ajay" set by patchOptimisticLastMessage just
        //      before this REST round-trip) from being reverted by the
        //      response (which carries the PRE-action lastMessage).
        //      Same-time → fall through to merge.
        //   2. Same message id → merge: carry over fields the participant-
        //      mutation responses tend to drop (senderId, senderName,
        //      contentType, system metadata).
        //   3. Different id, incoming newer → use incoming.
        const existingTimeMs = existing.chat.lastMessage?.time ? new Date(existing.chat.lastMessage.time).getTime() : 0
        const incomingTimeMs = incoming.chat.lastMessage?.time ? new Date(incoming.chat.lastMessage.time).getTime() : 0
        let mergedLastMessage = incoming.chat.lastMessage ?? existing.chat.lastMessage
        if (
          existing.chat.lastMessage &&
          (!incoming.chat.lastMessage || (existingTimeMs > 0 && incomingTimeMs > 0 && existingTimeMs > incomingTimeMs))
        ) {
          // Existing is newer (optimistic preview, live socket update,
          // etc.) — keep it. The follow-on socket broadcasts will land
          // shortly and overwrite via receiveMessage if needed.
          mergedLastMessage = existing.chat.lastMessage
        } else if (
          incoming.chat.lastMessage &&
          existing.chat.lastMessage &&
          incoming.chat.lastMessage.id &&
          incoming.chat.lastMessage.id === existing.chat.lastMessage.id
        ) {
          mergedLastMessage = {
            ...incoming.chat.lastMessage,
            senderId: incoming.chat.lastMessage.senderId || existing.chat.lastMessage.senderId,
            senderName: incoming.chat.lastMessage.senderName ?? existing.chat.lastMessage.senderName,
            contentType: incoming.chat.lastMessage.contentType ?? existing.chat.lastMessage.contentType,
            systemOperationType:
              incoming.chat.lastMessage.systemOperationType ?? existing.chat.lastMessage.systemOperationType,
            targetUserId: incoming.chat.lastMessage.targetUserId ?? existing.chat.lastMessage.targetUserId,
            targetUserName: incoming.chat.lastMessage.targetUserName ?? existing.chat.lastMessage.targetUserName
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
          // Keep lastMessage.feedback in sync so the sidebar tick is accurate.
          if (chat.chat.lastMessage?.id === m.id && chat.chat.lastMessage.feedback) {
            if (isDelivered === true) chat.chat.lastMessage.feedback.isDelivered = true
            if (isSeen === true) {
              chat.chat.lastMessage.feedback.isSeen = true
              chat.chat.lastMessage.feedback.isDelivered = true
            }
          }
          matchedIds.push(m.id)
          touchedChatIds.add(chat.id)
        })
      })

      const missed = messageIds.filter(id => !matchedIds.includes(id))
      console.log(`[chat:receipt] R2 reducer: matched ${matchedIds.length}/${messageIds.length} messages`, {
        matchedIds,
        missedIds: missed,
        touchedChats: Array.from(touchedChatIds),
        eventConversationId: conversationId
      })
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

      // Don't append regular messages to groups we've been removed from.
      // The server still broadcasts new_message to kicked sockets (backend
      // quirk #11); this guard drops them so ChatLog stays frozen at
      // pre-kick state. Active members + DMs take the normal path.
      // EXCEPTION: system messages (contentType === 'system') ARE allowed
      // through — so when the server eventually broadcasts pills like
      // "X removed you from the group", the kicked user sees them.
      const incomingContentType = (message as { contentType?: string }).contentType
      if (chatEntry.isGroup && chatEntry.isCurrentUserActive === false && incomingContentType !== 'system') {
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
      const stored: MessageType = isOwn && state.userProfile ? { ...message, senderId: state.userProfile.id } : message

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

      // System message handling — two jobs:
      //   1) Mirror the FULL system message (with metadata) into
      //      `chat.lastMessage` so the sidebar's three-perspective
      //      rewrite (SidebarLeft `sidebarStructuredRewrite`) has the
      //      `systemOperationType` / `senderId` / `targetUserId` fields
      //      it needs to render "You added X" / "X added you" /
      //      "X added Y" correctly. patchConversationFromEvent's slim
      //      payload doesn't carry these — without this write the
      //      sidebar would always show the raw bystander text for live
      //      system events.
      //   2) Live kick-of-me derivation. When the incoming system
      //      message is a user_removed/participant_removed event whose
      //      target IS the current user, mirror the actor info onto
      //      the chat entry so the banner and sidebar update immediately.
      if (stored.contentType === 'system') {
        const op = stored.systemOperationType
        const isRemoval = op === 'user_removed' || op === 'participant_removed'
        const myId = String(state.userProfile?.id ?? '')
        const targetIsMe =
          isRemoval && stored.targetUserId !== undefined && myId !== '' && String(stored.targetUserId) === myId
        if (targetIsMe) {
          if (stored.senderId) chatEntry.removedBy = stored.senderId
          if (stored.senderName) chatEntry.removedByName = stored.senderName
          // Kick-of-me path: rewrite the visible text to active voice
          // (sidebar shows "<Actor> removed you" instead of the raw
          // server text). Metadata still preserved via spread.
          chatEntry.chat.lastMessage = stored.senderName
            ? { ...stored, message: `${stored.senderName} removed you` }
            : stored
          // Mirror actor fields onto the open chat so the banner picks them
          // up without waiting for a re-select.
          if (state.selectedChat && state.selectedChat.contact.id === conversationId) {
            state.selectedChat.contact.removedBy = chatEntry.removedBy
            state.selectedChat.contact.removedByName = chatEntry.removedByName
          }
          // Persist to localStorage so the NEXT cold refresh hydrates
          // sidebar + banner with "<Actor> removed you" instantly — no
          // intermediate "You were removed from this group" flash.
          if (stored.senderName) {
            writeKickActor(conversationId, {
              name: stored.senderName,
              ...(stored.senderId ? { id: String(stored.senderId) } : {})
            })
          }
        } else {
          // All other system events (admin_promoted, admin_demoted,
          // user_added, user_removed for someone else, etc.) — write
          // the full message with metadata so the sidebar's structured
          // rewrite can fire. The raw text is preserved for bystanders.
          chatEntry.chat.lastMessage = stored
        }
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
      }
      // Note: we deliberately do NOT touch any conversation-list state here
      // (`unseenMsgs`, `lastMessage`, or list ordering). The conversation
      // list is driven exclusively by `conversation_updated` (handled in
      // `patchConversationFromEvent` and `addOrReplaceChat`). `new_message`
      // is used only to append the message to the open ChatLog.
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
      const { chatId, messages: rawMessages, oldestCursor, hasMoreOlder } = action.payload

      // Filter out messages this user previously deleted-for-me. The
      // server currently DOES NOT filter `messages.list` for the user
      // who deleted — after a delete + commit, a subsequent
      // setChatMessages arrives with the deleted id back in the list,
      // causing the bubble to reappear. Cache is per-user via
      // localStorage; gone is gone across refreshes.
      // REMOVE ONCE BACKEND ships server-side filtering on messages.list.
      const meIdForFilter = state.userProfile?.id
      const deletedForMeIds = meIdForFilter ? readDeletedForMeIds(meIdForFilter) : null
      const messages =
        deletedForMeIds && deletedForMeIds.size > 0
          ? rawMessages.filter(m => !deletedForMeIds.has(String(m.id)))
          : rawMessages

      const chatEntry = state.chats.find(c => c.id === chatId)
      if (!chatEntry) return

      // Kicked groups need special handling. The REST messages.list()
      // response still includes post-kick messages (server doesn't filter
      // by membership). Rules:
      //   • First open (messages cache empty) → write everything so the
      //     user sees their pre-kick history. The few latest entries may
      //     include post-kick text but that's an acceptable one-time
      //     limitation without server-side filtering.
      //   • Subsequent calls (cache already populated) → skip the write
      //     so a re-fetch triggered by live socket events doesn't surface
      //     post-kick messages that arrived after the first open.
      //   • Always skip the `lastMessage` write — adapter's placeholder
      //     ("You were removed from this group") must stay in the
      //     sidebar regardless.
      const isKickedGroup = chatEntry.isGroup && chatEntry.isCurrentUserActive === false
      const skipMessagesWrite = isKickedGroup && chatEntry.chat.messages.length > 0

      if (!skipMessagesWrite) {
        chatEntry.chat.messages = messages
      }

      // Kicked-group derivation pass — runs whether we wrote the messages
      // array fresh or kept the cached one. Two jobs:
      //   1) Make sure the kick system message about us is in the array
      //      (server may have stripped it from the REST conversation list
      //      entry, but messages.list returns the full version).
      //   2) Pull actor info (senderId + senderName) off the kick message
      //      and use it to set `chat.removedBy` / `chat.removedByName`
      //      (drives the banner) AND rewrite `chat.lastMessage` to the
      //      WhatsApp-style "<Actor> removed you" preview (drives the
      //      sidebar). Necessary because the REST conversation list
      //      endpoint returns `lastMessage` without metadata
      //      (contentType: 'text', no systemOperationType, no targetUserId),
      //      so the adapter can't classify it as a kick on cold-load.
      if (isKickedGroup) {
        const myId = String(state.userProfile?.id ?? '')
        const myName = state.userProfile?.fullName ?? ''
        // Walk backwards — we want the MOST RECENT kick about us.
        let kickMsg: MessageType | undefined
        for (let i = messages.length - 1; i >= 0; i--) {
          const m = messages[i] as MessageType
          if (m.contentType !== 'system') continue
          const op = m.systemOperationType
          if (op !== 'user_removed' && op !== 'participant_removed') continue
          const targetMatch = m.targetUserId !== undefined && myId !== '' && String(m.targetUserId) === myId
          const nameMatch = !targetMatch && myName !== '' && Boolean(m.message && m.message.includes(myName))
          if (targetMatch || nameMatch) {
            kickMsg = m
            break
          }
        }
        if (kickMsg) {
          // Append to messages if missing (only relevant when skipMessagesWrite)
          if (kickMsg.id && !chatEntry.chat.messages.some(m => m.id === kickMsg!.id)) {
            chatEntry.chat.messages = [...chatEntry.chat.messages, kickMsg]
          }
          // Sidebar preview — WhatsApp-style.
          if (kickMsg.senderName) {
            chatEntry.chat.lastMessage = {
              ...(chatEntry.chat.lastMessage ?? ({} as MessageType)),
              message: `${kickMsg.senderName} removed you`,
              contentType: 'system' as const
            }
          }
          // Banner snapshot — always refresh from the latest kick
          // message's senderId/senderName so the banner stays in sync
          // with the response (e.g., actor renamed since first kick).
          // Why: kickMsg is selected by walking back from the newest
          // message, so its senderId/senderName ARE the authoritative
          // actor identifiers for "who removed me", and we want the
          // banner to mirror them exactly — not a cached snapshot.
          if (kickMsg.senderId) {
            chatEntry.removedBy = kickMsg.senderId
          }
          if (kickMsg.senderName) {
            chatEntry.removedByName = kickMsg.senderName
          }
          // Persist to localStorage so subsequent cold refreshes hydrate
          // the sidebar + banner with "<Actor> removed you" instantly.
          if (kickMsg.senderName) {
            writeKickActor(chatId, {
              name: kickMsg.senderName,
              ...(kickMsg.senderId ? { id: String(kickMsg.senderId) } : {})
            })
          }
        }
      } else {
        chatEntry.chat.lastMessage = messages[messages.length - 1]
      }
      if (oldestCursor !== undefined) chatEntry.chat.oldestCursor = oldestCursor
      if (hasMoreOlder !== undefined) chatEntry.chat.hasMoreOlder = hasMoreOlder
      chatEntry.chat.loadingOlder = false

      if (state.selectedChat && state.selectedChat.contact.id === chatId) {
        state.selectedChat.chat = chatEntry.chat
        // Mirror the freshly-derived actor fields onto the open
        // chat's contact so the banner ("<Actor> removed you")
        // re-renders without waiting for the next selectChat.
        if (isKickedGroup) {
          state.selectedChat.contact.removedBy = chatEntry.removedBy
          state.selectedChat.contact.removedByName = chatEntry.removedByName
        }
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
    setLoadingOlder: (state, action: PayloadAction<{ chatId: ChatEntityId; loading: boolean }>) => {
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
            // Same message id — preserve every field the REST response
            // tends to drop:
            //   • senderId / senderName        (drives "You: …" prefix)
            //   • contentType                  (system-pill rendering)
            //   • systemOperationType          (perspective rewrite key)
            //   • targetUserId / targetUserName (perspective resolution)
            // Without this, a `fetchChatsContacts` triggered by a
            // system event (onNewMessage refetch for adminIds /
            // participants) would silently wipe the metadata that
            // SidebarLeft's perspective resolver depends on, causing
            // the sidebar to flash from "You removed Ajay" → raw
            // "Anil Rathod removed Ajay Antony" → back, depending on
            // when the next event lands.
            mergedLastMessage = {
              ...inc.chat.lastMessage,
              senderId: inc.chat.lastMessage.senderId || prev.chat.lastMessage.senderId,
              senderName: inc.chat.lastMessage.senderName ?? prev.chat.lastMessage.senderName,
              contentType: inc.chat.lastMessage.contentType ?? prev.chat.lastMessage.contentType,
              systemOperationType:
                inc.chat.lastMessage.systemOperationType ?? prev.chat.lastMessage.systemOperationType,
              targetUserId: inc.chat.lastMessage.targetUserId ?? prev.chat.lastMessage.targetUserId,
              targetUserName: inc.chat.lastMessage.targetUserName ?? prev.chat.lastMessage.targetUserName
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
          // The broadcast echo landed before the ack, so `receiveMessage` already
          // added the row. Merge back any fields the thunk stamped locally that the
          // server's broadcast payload may have omitted — most critically `replyTo`
          // (the server doesn't always echo it) and `attachments` (guard only —
          // the echo normally includes them). Without this merge, a reply sent
          // with an attachment loses its quote because the stamped replyTo from
          // the thunk is never applied to the already-existing row.
          chatEntry.chat.messages[existingIdx] = {
            ...existing,
            senderId: newMsg.senderId,
            feedback: mergedFeedback,
            ...(newMsg.replyTo && !existing.replyTo ? { replyTo: newMsg.replyTo } : {}),
            ...(newMsg.attachments?.length && !existing.attachments?.length ? { attachments: newMsg.attachments } : {})
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
      const stampedMsg: MessageType = state.userProfile
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
  setSelectedConversationId,
  setChatMessages,
  prependChatMessages,
  setLoadingOlder,
  receiveMessage,
  updateMessagesFeedback,
  addOrReplaceChat,
  setChatAvatarOptimistic,
  clearChatAvatar,
  patchLastMessageSender,
  patchOptimisticLastMessage,
  applyParticipantLeft,
  applyParticipantJoined,
  setInfoMessage,
  setForwardingMessage,
  updateChatFlags,
  patchConversationFromEvent,
  setReplyingTo,
  setEditingMessage,
  applyMessageUpdate,
  applyMessageDelete,
  applyMessageDeleteForMe,
  restoreDeletedMessage,
  setMessageStarred,
  applyMessagePin,
  applyReactionUpdate,
  removeChatFromList,
  removeSelectedChat,
  setActiveFilter,
  setDraft,
  setDraftChat,
  materializeDraft
} = appChatSlice.actions

export default appChatSlice.reducer

export type AppChatReducer = ChatStoreType
