// Facade for every `@antzsoft/chat-core` call the app makes.
// One thin wrapper per SDK method. Every function throws if the SDK isn't
// initialized; callers wrap in try/catch.
//
// Layout matches the SDK module boundaries:
//   - Socket: connection state + outbound emit wrappers
//   - REST: auth / conversations / messages / users / devices
//   - Adapters: SDK types → app types

import type {
  AntzChatClient,
  BatchUploadResult,
  Conversation,
  ConversationListParams,
  ConversationUnreadCount,
  CreateDirectData,
  CreateGroupData,
  CursorPaginatedResponse,
  FileResponse,
  FileType,
  ListMessagesParams,
  Message,
  MessageDeletedEvent,
  MessageDeletedForMeEvent,
  MessageDeliveredEvent,
  MessageReceiptsResponse,
  MessagesDeliveredEvent,
  MessageUpdatedEvent,
  MobileDeviceToken,
  NewMessageEvent,
  PaginatedResponse,
  Participant,
  PresignedUrlRequest,
  PresignedUrlResponse,
  ReactionUpdatedEvent,
  ReadReceiptEvent,
  RegisterDeviceTokenPayload,
  SearchParams,
  SendMessageAttachment,
  SendMessagePayload,
  TypingIndicatorEvent,
  UnreadSummary,
  UpdateConversationData,
  UpdateProfilePayload,
  UploadableFile,
  User,
  UserPreferences,
  UserStatusEvent,
  WebPushDeviceToken
} from '@antzsoft/chat-core'

import type {
  ChatEntityId,
  ChatsArrType,
  ContactType,
  MessageType,
  ProfileUserType,
  StatusType
} from 'src/types/apps/chatTypes'

import {
  devicesApi as sdkDevicesApi,
  socketEmit as sdkSocketEmit,
  getSocket as sdkGetSocket,
  getSocketStatus as sdkGetSocketStatus,
  onSocketStatus as sdkOnSocketStatus,
  reconnectSocket as sdkReconnectSocket,
  refreshSocketAuth as sdkRefreshSocketAuth,
  appConfigApi as sdkAppConfigApi,
  uploadBatch as sdkUploadBatch,
  type AppConfig,
  type SocketStatus
} from '@antzsoft/chat-core'

// Platform upload fns live in client.ts (passed to AntzChatConfig). We
// import them here because `client.uploadFiles` in chat-core 1.2.4 does
// NOT forward `platformUploadPartFn` to its internal uploadBatch — so we
// bypass it and call `uploadBatch` directly with BOTH fns to get chunked
// multipart uploads for large files (≥ 10 MB).
import { platformUploadFn, platformUploadPartFn } from './client'

import { getChatClientOrNull } from './client'

export type ChatSocket = ReturnType<typeof sdkGetSocket>
export type ChatSocketStatus = SocketStatus
export type ParticipantRole = 'admin' | 'member'

export type {
  AntzChatClient,
  BatchUploadResult,
  Conversation,
  ConversationListParams,
  ConversationUnreadCount,
  CreateDirectData,
  CreateGroupData,
  FileResponse,
  FileType,
  ListMessagesParams,
  Message,
  MessageDeletedEvent,
  MessageDeletedForMeEvent,
  MessageDeliveredEvent,
  MessageReceiptsResponse,
  MessagesDeliveredEvent,
  MessageUpdatedEvent,
  MobileDeviceToken,
  NewMessageEvent,
  PaginatedResponse,
  PresignedUrlRequest,
  PresignedUrlResponse,
  ReactionUpdatedEvent,
  ReadReceiptEvent,
  RegisterDeviceTokenPayload,
  SearchParams,
  SendMessageAttachment,
  SendMessagePayload,
  TypingIndicatorEvent,
  UnreadSummary,
  UpdateConversationData,
  UpdateProfilePayload,
  UploadableFile,
  User,
  UserPreferences,
  UserStatusEvent,
  WebPushDeviceToken
}

// ── Internal ─────────────────────────────────────────────────────────────────

function requireClient(method: string) {
  const c = getChatClientOrNull()
  if (!c) throw new Error(`[chat-api] ${method}: SDK not initialized`)

  return c
}

// ─────────────────────────────────────────────────────────────────────────────
// Socket — connection state
// ─────────────────────────────────────────────────────────────────────────────

export const getChatSocket = (): ChatSocket | null => {
  try {
    return sdkGetSocket()
  } catch {
    return null
  }
}

export const onChatSocketStatus = sdkOnSocketStatus
export const getChatSocketStatus = sdkGetSocketStatus

export function reconnectChatSocket(token: string, userId: string, tenantId?: string): void {
  sdkReconnectSocket(token, userId, tenantId)
}

export function refreshChatSocketAuth(): boolean {
  return sdkRefreshSocketAuth()
}

// ─────────────────────────────────────────────────────────────────────────────
// Socket — outbound emits
// ─────────────────────────────────────────────────────────────────────────────

export function joinChatRoom(conversationId: string): void {
  sdkSocketEmit.joinRoom(conversationId)
}

export function leaveChatRoom(conversationId: string): void {
  sdkSocketEmit.leaveRoom(conversationId)
}

export async function sendMessageOverSocket(payload: SendMessagePayload): Promise<Message> {
  const response = await sdkSocketEmit.sendMessage(payload)

  // Server may return any of these shapes:
  //   {error: '...'}                          ← failure
  //   <Message>                                ← full message
  //   {message: <Message>}                     ← wrapped
  //   {data: <Message>}                        ← wrapped
  //   {success: true, messageId: '...'}        ← lightweight ack (current server)
  const r = response as
    | { error?: string; message?: Message; data?: Message; success?: boolean; messageId?: string }
    | Message
  if (r && typeof r === 'object' && 'error' in r && (r as { error?: string }).error) {
    throw new Error((r as { error: string }).error)
  }

  // Try the wrapped/full shapes first.
  let msg = ((r as { message?: Message }).message ?? (r as { data?: Message }).data) as Message | undefined

  // Fall back: if the ack is just `{success, messageId}`, synthesize a Message
  // from the request payload + returned id so downstream code (Redux + receipt
  // matching) has a real `id` to work with.
  if (!msg && r && typeof r === 'object' && 'messageId' in r && (r as any).messageId) {
    const ack = r as { success?: boolean; messageId: string }
    const now = new Date().toISOString()
    // Map SendMessageAttachment (`fileId`) → SDK Attachment-ish (`id`). Without
    // this normalization, our local message attachments end up with
    // `id: undefined`, which breaks React keys + downstream lookups (reactions,
    // pin, etc.).
    const normalizedAttachments = payload.attachments?.map(a => ({
      id: a.fileId,
      type: a.type,
      url: a.url,
      thumbnailUrl: a.thumbnailUrl,
      filename: a.filename,
      mimeType: a.mimeType,
      size: a.size
    }))
    msg = {
      id: ack.messageId,
      tenantId: '',
      conversationId: payload.conversationId,
      senderId: '',
      content: {
        type: 'text',
        text: payload.text,
        attachments: (normalizedAttachments as any) ?? undefined
      },
      reactions: [],
      status: 'sent',
      deliveryStatus: 'sent',
      isEdited: false,
      sentAt: now,
      createdAt: now,
      updatedAt: now
    } as unknown as Message
  } else if (!msg) {
    // Last-resort fallback: treat the response itself as a Message.
    msg = r as Message
  }

  return msg
}

export function typingOverSocket(conversationId: string, isTyping: boolean): void {
  sdkSocketEmit.typing(conversationId, isTyping)
}

export function markReadOverSocket(conversationId: string, messageId?: string): void {
  sdkSocketEmit.markRead(conversationId, messageId)
}

export function updateMessageOverSocket(messageId: string, text: string): Promise<unknown> {
  return sdkSocketEmit.updateMessage(messageId, text)
}

// `delete_message` is emitted fire-and-forget instead of via the SDK's
// ack-based `sdkSocketEmit.deleteMessage`. The chat backend processes the
// removal and broadcasts `message_deleted` to all participants, but does
// NOT send an ack frame back for this event — the 5s ack timeout would
// otherwise reject with `"Socket ack timeout: delete_message"` even
// though the deletion succeeded, producing a false "Delete failed" toast.
// State for both sender and receivers lands via the `message_deleted`
// broadcast handler in AppChat → `applyMessageDelete` reducer.
export function deleteMessageOverSocket(messageId: string): Promise<unknown> {
  const socket = getChatSocket()
  if (!socket) return Promise.reject(new Error('[chat-api] deleteMessageOverSocket: socket not connected'))
  socket.emit('delete_message', { messageId })

  return Promise.resolve()
}

export function deleteMessageForMeOverSocket(messageId: string): Promise<unknown> {
  return sdkSocketEmit.deleteMessageForMe(messageId)
}

export function addReactionOverSocket(messageId: string, emoji: string): Promise<unknown> {
  return sdkSocketEmit.addReaction(messageId, emoji)
}

export function removeReactionOverSocket(messageId: string, emoji: string): Promise<unknown> {
  return sdkSocketEmit.removeReaction(messageId, emoji)
}

export function pinMessageOverSocket(messageId: string): Promise<unknown> {
  return sdkSocketEmit.pinMessage(messageId)
}

export function unpinMessageOverSocket(messageId: string): Promise<unknown> {
  return sdkSocketEmit.unpinMessage(messageId)
}

export function getOnlineUsersOverSocket(userIds: string[]): Promise<string[]> {
  return sdkSocketEmit.getOnlineUsers(userIds)
}

// ─────────────────────────────────────────────────────────────────────────────
// REST — auth
// ─────────────────────────────────────────────────────────────────────────────

export function getMe(): Promise<User> {
  return requireClient('getMe').auth.getMe()
}

// Pushes the avatar to the chat backend via `POST /users/me/avatar/sync`.
// Server fetches the URL, dedups, and stores it on the user record so OTHER
// participants see it in their `listConversations` response. The socket
// handshake also carries `avatarUrl`, but this REST call is the deterministic
// way to confirm the backend has it.
export function syncAvatar(source: { url?: string; base64?: string }): Promise<{ avatarUrl: string }> {
  return requireClient('syncAvatar').auth.syncAvatar(source)
}

/**
 * Push the current user's basic profile fields (name) to the chat server.
 * Works in builtin AND non-builtin auth modes — lets the host app reflect
 * a profile change immediately instead of waiting for the server's
 * background sync from the external auth system. The new `displayName`
 * is what other participants see (drives `sdkUserToProfile.fullName`).
 * REST-only — the SDK has no socket path for profile updates.
 */
export function updateChatProfile(payload: UpdateProfilePayload): Promise<User> {
  return requireClient('updateChatProfile').users.updateProfile(payload)
}

// App-wide tenant config — exposes server-enforced limits like
// `maxPinnedConversations`. The result is stable per tenant, so we
// cache it at module level after the first successful fetch. Callers
// receive the cached value synchronously on subsequent calls without
// hitting the network. SDK doc notes its own `['app-config']` cache
// with `staleTime: Infinity`; this local cache adds zero-cost reuse
// for non-React callers and a deterministic fallback when offline.
let cachedAppConfig: AppConfig | null = null
export async function getAppConfig(): Promise<AppConfig> {
  if (cachedAppConfig) return cachedAppConfig
  requireClient('getAppConfig')
  const config = await sdkAppConfigApi.get()
  cachedAppConfig = config

  return config
}

// Builtin auth mode only — uploads a binary avatar file. We use external SSO
// so this is unused today, but exposed for completeness.
export function uploadAvatar(file: File | Blob, mimeType?: string): Promise<{ avatarUrl: string }> {
  return requireClient('uploadAvatar').auth.uploadAvatar(file, mimeType)
}

// ─────────────────────────────────────────────────────────────────────────────
// REST — conversations
// ─────────────────────────────────────────────────────────────────────────────

export function listConversations(params?: ConversationListParams): Promise<PaginatedResponse<Conversation>> {
  return requireClient('listConversations').conversations.list(params)
}

export function getConversation(conversationId: string): Promise<Conversation> {
  return requireClient('getConversation').conversations.get(conversationId)
}

export function createGroupConversation(data: CreateGroupData): Promise<Conversation> {
  return requireClient('createGroupConversation').conversations.createGroup(data)
}

export function createDirectConversation(data: CreateDirectData): Promise<Conversation> {
  return requireClient('createDirectConversation').conversations.createDirect(data)
}

export function updateConversation(conversationId: string, data: UpdateConversationData): Promise<Conversation> {
  return requireClient('updateConversation').conversations.update(conversationId, data)
}

export function deleteConversation(conversationId: string): Promise<void> {
  return requireClient('deleteConversation').conversations.delete(conversationId)
}

export function addParticipants(
  conversationId: string,
  userIds: string[],
  role?: ParticipantRole
): Promise<Conversation> {
  // v1.1.3 — server accepts an optional `role` argument so admins can be
  // promoted on the same call (default = 'member'). Forwarded only when
  // provided so existing two-arg callers keep working unchanged.
  return requireClient('addParticipants').conversations.addParticipants(
    conversationId,
    userIds,
    ...(role ? [role] as const : [])
  )
}

export function removeParticipant(conversationId: string, userId: string): Promise<Conversation> {
  return requireClient('removeParticipant').conversations.removeParticipant(conversationId, userId)
}

export function updateParticipantRole(
  conversationId: string,
  userId: string,
  role: ParticipantRole
): Promise<Conversation> {
  return requireClient('updateParticipantRole').conversations.updateParticipantRole(conversationId, userId, role)
}

export function muteConversation(conversationId: string, mutedUntil?: string): Promise<void> {
  return requireClient('muteConversation').conversations.mute(conversationId, mutedUntil)
}

export function unmuteConversation(conversationId: string): Promise<void> {
  return requireClient('unmuteConversation').conversations.unmute(conversationId)
}

export function pinConversation(conversationId: string): Promise<void> {
  return requireClient('pinConversation').conversations.pin(conversationId)
}

export function unpinConversation(conversationId: string): Promise<void> {
  return requireClient('unpinConversation').conversations.unpin(conversationId)
}

export function leaveConversation(conversationId: string): Promise<void> {
  return requireClient('leaveConversation').conversations.leave(conversationId)
}

// v1.1.3 atomic "Exit and Delete" — server exits the group AND removes the
// conversation from the caller's list in a single write. Distinct from
// `leaveConversation` (stays in list, read-only) and `deleteConversation`
// (only valid after the user has already exited). The SDK's `conversations.leave`
// accepts an optional second boolean for this atomic path; passing `true`
// opts in. Other callers of `leaveConversation` stay on the single-arg
// path untouched.
export function leaveAndDeleteConversation(conversationId: string): Promise<void> {
  return requireClient('leaveAndDeleteConversation').conversations.leave(conversationId, true)
}

export function getConversationMembers(conversationId: string): Promise<Participant[]> {
  return requireClient('getConversationMembers').conversations.getMembers(conversationId)
}

// Single-conversation unread count. Use after app foreground or socket
// reconnect to refresh one row's badge without fetching the whole list.
export function getConversationUnreadCount(conversationId: string): Promise<ConversationUnreadCount> {
  return requireClient('getConversationUnreadCount').conversations.getUnreadCount(conversationId)
}

// Total + per-conversation unread breakdown. Source of truth on cold start /
// foreground resume / post-reconnect — the socket keeps counts live otherwise.
export function getUnreadSummary(): Promise<UnreadSummary> {
  return requireClient('getUnreadSummary').conversations.getUnreadSummary()
}

// Set the group icon from an already-uploaded file (admin only). The `fileId`
// comes from `uploadChatFiles()` — same pipeline as message attachments.
export function uploadConversationIcon(conversationId: string, fileId: string): Promise<Conversation> {
  return requireClient('uploadConversationIcon').conversations.uploadIcon(conversationId, fileId)
}

// Remove the group icon (admin only). Server deletes the stored asset and
// clears `iconMeta`; the returned Conversation has `iconUrl: undefined`,
// which the adapter maps onto `chat.avatar = undefined` so the sidebar /
// header / profile drawer fall back to the initials avatar.
export function removeConversationIcon(conversationId: string): Promise<Conversation> {
  return requireClient('removeConversationIcon').conversations.removeIcon(conversationId)
}

// ─────────────────────────────────────────────────────────────────────────────
// REST — messages
// ─────────────────────────────────────────────────────────────────────────────

export function listMessages(
  conversationId: string,
  params?: ListMessagesParams
): Promise<CursorPaginatedResponse<Message>> {
  return requireClient('listMessages').messages.list(conversationId, params)
}

export function getMessage(messageId: string): Promise<Message> {
  return requireClient('getMessage').messages.get(messageId)
}

/**
 * Fetch read/delivered receipts for a message with sender profiles
 * (displayName + avatarUrl) already resolved server-side. Use for the
 * Message Info screen — no secondary user lookup needed. Added in
 * chat-core 1.2.3.
 */
export function getMessageReceipts(messageId: string): Promise<MessageReceiptsResponse> {
  return requireClient('getMessageReceipts').messages.getReceipts(messageId)
}

export function updateMessage(messageId: string, text: string): Promise<Message> {
  return requireClient('updateMessage').messages.update(messageId, text)
}

export function deleteMessage(messageId: string): Promise<void> {
  return requireClient('deleteMessage').messages.delete(messageId)
}

export function deleteMessageForMe(messageId: string): Promise<void> {
  return requireClient('deleteMessageForMe').messages.deleteForMe(messageId)
}

export function addMessageReaction(messageId: string, emoji: string): Promise<Message> {
  return requireClient('addMessageReaction').messages.addReaction(messageId, emoji)
}

export function removeMessageReaction(messageId: string, emoji: string): Promise<Message> {
  return requireClient('removeMessageReaction').messages.removeReaction(messageId, emoji)
}

export function starMessage(messageId: string): Promise<void> {
  return requireClient('starMessage').messages.star(messageId)
}

export function unstarMessage(messageId: string): Promise<void> {
  return requireClient('unstarMessage').messages.unstar(messageId)
}

export function listStarredMessages(params?: {
  page?: number
  limit?: number
  conversationId?: string
}): Promise<PaginatedResponse<Message>> {
  return requireClient('listStarredMessages').messages.getStarred(params)
}

export function searchMessages(params: SearchParams): Promise<PaginatedResponse<Message>> {
  return requireClient('searchMessages').messages.search(params)
}

// Returns the user's last-read pointer for a conversation. Use this with
// `listMessages({ cursor: lastReadMessageId, direction: 'after' })` to power
// "jump to first unread" + the unread divider.
export function getLastRead(
  conversationId: string
): Promise<{ lastReadMessageId: string | null; lastReadAt: string | null }> {
  return requireClient('getLastRead').messages.getLastRead(conversationId)
}

export function markConversationRead(conversationId: string, messageId?: string): Promise<void> {
  return requireClient('markConversationRead').messages.markAsRead(conversationId, messageId)
}

export function pinMessage(messageId: string): Promise<Message> {
  return requireClient('pinMessage').messages.pin(messageId)
}

export function unpinMessage(messageId: string): Promise<Message> {
  return requireClient('unpinMessage').messages.unpin(messageId)
}

export function listPinnedMessages(conversationId: string): Promise<Message[]> {
  return requireClient('listPinnedMessages').messages.getPinned(conversationId)
}

// ─────────────────────────────────────────────────────────────────────────────
// REST — users
// ─────────────────────────────────────────────────────────────────────────────

export function listUsers(params?: {
  query?: string
  page?: number
  limit?: number
}): Promise<PaginatedResponse<User>> {
  return requireClient('listUsers').users.list(params)
}

// Query-only shortcut over `listUsers` — unwraps `.data` so callers get
// `User[]` directly. Used by ComposePopover / CreateGroupDrawer / UserProfileRight.
export async function searchUsers(query: string): Promise<User[]> {
  const { data } = await requireClient('searchUsers').users.list({ query })

  return data
}

export function getUserById(userId: string): Promise<User> {
  return requireClient('getUserById').users.getById(userId)
}

export function getUserLastSeen(userId: string): Promise<{ lastSeenAt: string | null }> {
  return requireClient('getUserLastSeen').users.getLastSeen(userId)
}

export function getUserPreferences(): Promise<UserPreferences | null> {
  return requireClient('getUserPreferences').users.getPreferences()
}

export function updateUserPreferences(prefs: UserPreferences): Promise<User> {
  return requireClient('updateUserPreferences').users.updatePreferences(prefs)
}

// ─────────────────────────────────────────────────────────────────────────────
// REST — devices (push notifications)
// ─────────────────────────────────────────────────────────────────────────────

export function registerDevice(payload: RegisterDeviceTokenPayload): Promise<void> {
  requireClient('registerDevice')

  return sdkDevicesApi.register(payload)
}

export function removeDevice(deviceId: string): Promise<void> {
  requireClient('removeDevice')

  return sdkDevicesApi.remove(deviceId)
}

// ─────────────────────────────────────────────────────────────────────────────
// REST — storage / attachments
// ─────────────────────────────────────────────────────────────────────────────

export type UploadChatFilesResult = {
  attachments: SendMessageAttachment[]
  failed: BatchUploadResult['failed']
}

// Uploads files via the SDK (presign → platformUploadFn → confirm) and maps
// each successful FileResponse into a SendMessageAttachment ready to pass to
// `sendMessageOverSocket({ attachments })`.
export async function uploadChatFiles(files: UploadableFile[], conversationId: string): Promise<UploadChatFilesResult> {
  // Ensure the SDK is initialized (uploadBatch uses the API-client + socket
  // singletons under the hood). We deliberately do NOT use
  // `client.uploadFiles` — in chat-core 1.2.4 it omits `platformUploadPartFn`
  // when calling uploadBatch, so files ≥ 10 MB skip the multipart path and
  // 400 on the single-shot fallback. Calling uploadBatch directly with both
  // platform fns fixes large-file uploads.
  requireClient('uploadChatFiles')
  const result = await sdkUploadBatch(
    files,
    platformUploadFn,
    conversationId,
    undefined, // onProgress — not surfaced here
    undefined, // platformCompressFn — compression not configured
    undefined, // compressionConfig
    platformUploadPartFn // ← the arg client.uploadFiles drops; enables chunked multipart
  )

  const attachments: SendMessageAttachment[] = result.successful.map(f => ({
    fileId: f.id,
    type: f.type,
    url: f.url,
    thumbnailUrl: f.thumbnailUrl,
    filename: f.filename,
    mimeType: f.mimeType,
    size: f.size
  }))
  console.log('[chat-api] uploadChatFiles: attachments ready', attachments)
  return { attachments, failed: result.failed }
}

export async function getConversationFiles(
  conversationId: string,
  params?: { page?: number; limit?: number; type?: FileType }
): Promise<{ items: FileResponse[]; total: number; page: number; totalPages: number }> {
  const client = requireClient('getConversationFiles')
  const res = (await client.storage.getConversationFiles(conversationId, params)) as any
  // Actual response shape: { files: FileResponse[], total, page, limit }
  const items: FileResponse[] = res.files ?? res.data ?? res.items ?? []
  const total: number = res.total ?? res.meta?.total ?? 0
  const page: number = res.page ?? res.meta?.page ?? 1
  const limit: number = res.limit ?? res.meta?.limit ?? params?.limit ?? 30
  const totalPages: number = res.totalPages ?? res.meta?.totalPages ?? (Math.ceil(total / limit) || 1)
  return { items, total, page, totalPages }
}

// ─────────────────────────────────────────────────────────────────────────────
// Adapters (SDK types → app types)
// ─────────────────────────────────────────────────────────────────────────────

// Backend returns participants with displayName / username / avatarUrl flat
// alongside userId, but SDK types nest them under `user`. Coerce both shapes.
type ParticipantWithFlatUser = Participant & {
  displayName?: string
  username?: string
  email?: string
  phone?: string
  avatarUrl?: string
  status?: string
}

function participantToUser(p: ParticipantWithFlatUser): User {
  if (p.user) return p.user

  return {
    id: p.userId,
    tenantId: '',
    email: p.email ?? '',
    phone: p.phone ?? '',
    username: p.username ?? '',
    displayName: p.displayName ?? '',
    avatarUrl: p.avatarUrl,
    status: (p.status as User['status']) ?? 'online',
    createdAt: p.joinedAt ?? '',
    updatedAt: p.joinedAt ?? ''
  }
}

function normalizeStatus(raw: string | undefined): StatusType {
  switch (raw) {
    case 'online':
    case 'offline':
    case 'away':
    case 'busy':
      return raw
    case 'active':
      return 'online'
    case 'inactive':
      return 'offline'
    default:
      return 'online'
  }
}

export function sdkUserToProfile(user: User): ProfileUserType {
  return {
    id: user.id,
    fullName: user.displayName || user.username || user.email,
    avatar: user.avatarUrl ?? '',
    role: '',
    about: '',
    status: normalizeStatus(user.status),
    settings: {
      isTwoStepAuthVerificationEnabled: false,
      isNotificationsOn: true
    }
  }
}

export function sdkUserToContact(user: User): ContactType {
  return {
    id: user.id,
    fullName: user.displayName || user.username || user.email,
    avatar: user.avatarUrl,
    role: '',
    about: '',
    status: normalizeStatus(user.status)
  }
}

export function sdkMessageToMessage(msg: Message): MessageType {
  const deliveryStatus = msg.deliveryStatus

  // Socket acks occasionally lack timestamps — fall back to "now".
  const time = msg.sentAt ?? msg.createdAt ?? new Date().toISOString()

  const attachments = msg.content?.attachments?.map(a => ({
    id: a.id,
    type: a.type,
    url: a.url,
    thumbnailUrl: a.thumbnailUrl,
    filename: a.filename,
    mimeType: a.mimeType,
    size: a.size,
    isUploading: a.isUploading,
    uploadProgress: a.uploadProgress
  }))

  // Reactions — copy through; default count from userIds length so the UI
  // can render the chip without recounting.
  const reactions = msg.reactions?.length
    ? msg.reactions.map(r => ({
        emoji: r.emoji,
        userIds: r.userIds ?? [],
        count: r.count ?? r.userIds?.length ?? 0
      }))
    : undefined

  // Reply reference — SDK may stash the original id under `.messageId` or
  // `.id`, and the preview under `.contentPreview` or `.content.text`.
  // Normalize so the bubble renderer has one shape to read.
  const replyTo = msg.replyTo
    ? (() => {
        const r = msg.replyTo as typeof msg.replyTo & { id?: string; content?: { text?: string } }
        const messageId = r?.messageId ?? r?.id
        if (!messageId) return undefined

        return {
          messageId,
          senderId: '' as string, // not provided in the ref; bubble falls back to senderName
          senderName: r?.senderName ?? r?.sender?.displayName,
          textPreview: r?.contentPreview ?? r?.content?.text ?? '',
          hasAttachment: Boolean(r?.content?.attachments?.length)
        }
      })()
    : undefined

  // SDK marks a "delete for everyone" message with `status: 'deleted'`
  // — the server still returns the row on subsequent `listMessages` calls
  // so the tombstone renders in place. Without surfacing this, refreshing
  // the tab would resurrect the original text + attachments + reactions
  // because `applyMessageDelete` only runs in response to the live
  // `message_deleted` socket event (not on REST re-fetch).
  const isDeletedForEveryone = msg.status === 'deleted'

  // Snapshot the sender's display name from the SDK Message if it's there.
  // The SDK populates `msg.sender.displayName` on most recently-returned
  // messages; capturing it here means the sidebar's "Saket: hello" prefix
  // doesn't depend on the global contacts cache (which can lose entries
  // when a member leaves the group).
  // Falls back to `msg.senderName` (top-level field the server includes
  // on broadcast system messages, e.g. participant_removed events).
  const senderName =
    (msg as typeof msg & { sender?: { displayName?: string; username?: string } }).sender?.displayName ??
    (msg as typeof msg & { sender?: { displayName?: string; username?: string } }).sender?.username ??
    (msg as typeof msg & { senderName?: string }).senderName

  // Structured system-message metadata. Backend sends this alongside the
  // free-text `content.text` for membership / admin events so the client
  // can resolve actor/target by ID (robust to display-name changes).
  // Used by ChatLog + SidebarLeft perspective rewrites.
  // Backend uses inconsistent metadata field names across event types:
  //   • admin_promoted / admin_demoted  → `targetUserId`  / `targetUserName`
  //   • user_removed                    → `removedUserId` / `removedUserName`
  //   • user_added                      → `addedUserId`   / `addedUserName`
  // Normalize all variants into our canonical `targetUserId` /
  // `targetUserName` so downstream consumers (ChatLog, SidebarLeft,
  // adapter sidebar override) don't need to know about the source field.
  const systemMeta = (
    msg as typeof msg & {
      metadata?: {
        targetUserId?: string
        targetUserName?: string
        removedUserId?: string
        removedUserName?: string
        addedUserId?: string
        addedUserName?: string
        affectedUserId?: string
        affectedUserName?: string
        systemOperationType?: string
      }
    }
  ).metadata
  const normalizedTargetUserId =
    systemMeta?.targetUserId ??
    systemMeta?.removedUserId ??
    systemMeta?.addedUserId ??
    systemMeta?.affectedUserId
  const normalizedTargetUserName =
    systemMeta?.targetUserName ??
    systemMeta?.removedUserName ??
    systemMeta?.addedUserName ??
    systemMeta?.affectedUserName

  return {
    id: msg.id,
    // Blank the body on tombstones so the rendered bubble matches what the
    // live-broadcast path produces (applyMessageDelete also blanks `m.message`).
    message: isDeletedForEveryone ? '' : msg.content?.text ?? '',
    time,
    senderId: msg.senderId,
    ...(senderName ? { senderName } : {}),
    feedback: {
      isSent: msg.status !== 'failed' && deliveryStatus !== 'failed',
      isDelivered: deliveryStatus === 'delivered' || deliveryStatus === 'read',
      isSeen: deliveryStatus === 'read'
    },
    // Skip attachments + reactions on tombstones — the placeholder is the
    // only thing that should render. Matches applyMessageDelete reducer.
    ...(!isDeletedForEveryone && attachments && attachments.length ? { attachments } : {}),
    // Normalize contentType — REST sometimes strips `content.type` from
    // `conv.lastMessage` in the listConversations response, leaving it
    // undefined. When `systemOperationType` IS present, we know it's a
    // system message regardless of what content.type says (it must be
    // 'system' for the metadata to exist). Forcing the field here means
    // every downstream consumer (sidebar prefix guard, ChatLog system
    // pill branch, banner logic) gets a single reliable signal — no
    // duplicate "Anil Rathod: Anil Rathod dismissed you as admin"
    // because the sidebar prefix block thought it was a regular message.
    ...(msg.content?.type
      ? { contentType: msg.content.type }
      : systemMeta?.systemOperationType
        ? { contentType: 'system' as const }
        : {}),
    ...(normalizedTargetUserId ? { targetUserId: normalizedTargetUserId } : {}),
    ...(normalizedTargetUserName ? { targetUserName: normalizedTargetUserName } : {}),
    ...(systemMeta?.systemOperationType
      ? { systemOperationType: systemMeta.systemOperationType }
      : {}),
    ...(!isDeletedForEveryone && reactions ? { reactions } : {}),
    ...(replyTo ? { replyTo } : {}),
    ...(msg.isPinned ? { isPinned: true } : {}),
    ...(msg.isStarred ? { isStarred: true } : {}),
    ...(msg.isEdited ? { isEdited: true } : {}),
    ...(msg.editedAt ? { editedAt: msg.editedAt } : {}),
    ...(isDeletedForEveryone ? { isDeletedForEveryone: true } : {}),
    // Receipts — copy through for the "Message info" dialog. Skipped for
    // tombstones since deleted messages don't show info anyway.
    ...(!isDeletedForEveryone && msg.readBy?.length ? { readBy: msg.readBy } : {}),
    ...(!isDeletedForEveryone && msg.deliveredTo?.length ? { deliveredTo: msg.deliveredTo } : {})
  }
}

// ─── Kicked-actor localStorage cache ───────────────────────────────────────
// The cold-load adapter has no way to know who removed the current user from
// a group, because the REST conversation list strips system-message metadata
// from `lastMessage` (only `senderName` and `text` survive — neither
// reliable, since lastMessage may be a later non-kick event). Without a
// cache, the sidebar shows "You were removed from this group" until
// messages.list runs and `setChatMessages` derivation kicks in — a
// noticeable flash.
//
// This cache is populated by the live socket path (`applyParticipantLeft`
// in chat slice) and by the refresh path (`setChatMessages` derivation),
// and cleared on re-add (`applyParticipantJoined`). On subsequent refreshes
// the adapter hydrates `removedBy` / `removedByName` from the cache
// instantly, so the sidebar shows "<Actor> removed you" with zero flash.
//
// Per-tab via sessionStorage would also work, but localStorage means even
// the first refresh in a brand-new tab (after a kick from a previous
// session) renders correctly.
const KICK_ACTOR_KEY = 'antz-chat:kick-actor'
type KickActorCache = Record<string, { id?: string; name: string }>

function readKickActorCache(): KickActorCache {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(KICK_ACTOR_KEY)
    return raw ? (JSON.parse(raw) as KickActorCache) : {}
  } catch {
    return {}
  }
}

function writeKickActorCache(cache: KickActorCache): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KICK_ACTOR_KEY, JSON.stringify(cache))
  } catch {
    /* quota / disabled storage — silent no-op, falls back to flash */
  }
}

export function readKickActor(chatId: string | number): { id?: string; name: string } | undefined {
  return readKickActorCache()[String(chatId)]
}

export function writeKickActor(chatId: string | number, info: { id?: string; name: string }): void {
  const cache = readKickActorCache()
  cache[String(chatId)] = info
  writeKickActorCache(cache)
}

export function clearKickActor(chatId: string | number): void {
  const cache = readKickActorCache()
  delete cache[String(chatId)]
  writeKickActorCache(cache)
}

// ─── Deleted-for-me localStorage cache ────────────────────────────────────
// CLIENT-SIDE WORKAROUND for the backend gap where `messages.list` returns
// the message back to the user who deleted it. Tracing on 2026-06-01
// captured this live: after deleting a message, a subsequent
// `setChatMessages` arrived from the server WITH the deleted id back in
// the list (newlyAppearedIds contained the just-deleted id). Without the
// cache, the UI re-renders and the user sees the "deleted" message reappear.
//
// Strategy:
//   • On `applyMessageDeleteForMe` → write id into a Set (capped FIFO).
//   • On `restoreDeletedMessage` (Undo) → remove id from Set so it can come
//     back legitimately.
//   • On `setChatMessages` → filter incoming messages.list to drop any id
//     present in the Set BEFORE writing to Redux state.
//
// The Set is keyed per-user (the cache key includes userProfile.id) so
// switching accounts doesn't leak deletions across users.
//
// REMOVE ONCE BACKEND ships server-side filtering on messages.list for
// deleted-for-me. Until then, this prevents the user-visible reappearance.
const DELETED_FOR_ME_KEY = 'antz-chat:deleted-for-me'

// Hard cap to bound localStorage growth. 5000 ids ≈ ~120KB JSON.
// FIFO eviction (oldest first) — matches the kick-actor cache pattern.
const DELETED_FOR_ME_CAP = 5000

type DeletedForMeCache = Record<string, string[]>

function readDeletedForMeCache(): DeletedForMeCache {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(DELETED_FOR_ME_KEY)

    return raw ? (JSON.parse(raw) as DeletedForMeCache) : {}
  } catch {
    return {}
  }
}

function writeDeletedForMeCache(cache: DeletedForMeCache): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(DELETED_FOR_ME_KEY, JSON.stringify(cache))
  } catch {
    /* quota / disabled storage — silent no-op */
  }
}

export function readDeletedForMeIds(userId: string | number): Set<string> {
  const key = String(userId ?? '')
  if (!key) return new Set()

  return new Set(readDeletedForMeCache()[key] ?? [])
}

export function addDeletedForMeId(userId: string | number, messageId: string): void {
  const key = String(userId ?? '')
  if (!key || !messageId) return
  const cache = readDeletedForMeCache()
  const existing = cache[key] ?? []
  if (existing.includes(messageId)) return
  existing.push(messageId)
  // FIFO trim — drop oldest entries when over cap.
  if (existing.length > DELETED_FOR_ME_CAP) {
    existing.splice(0, existing.length - DELETED_FOR_ME_CAP)
  }
  cache[key] = existing
  writeDeletedForMeCache(cache)
}

export function removeDeletedForMeId(userId: string | number, messageId: string): void {
  const key = String(userId ?? '')
  if (!key || !messageId) return
  const cache = readDeletedForMeCache()
  const existing = cache[key]
  if (!existing) return
  const idx = existing.indexOf(messageId)
  if (idx === -1) return
  existing.splice(idx, 1)
  cache[key] = existing
  writeDeletedForMeCache(cache)
}

// ─── Self-left localStorage flag ───────────────────────────────────────────
// Mirrors the kick-actor cache: persists across refresh so the banner and
// sidebar can show "You left the group" / "You left the group." instantly
// on cold-load, instead of falling back to the generic "You're no longer
// a member" copy when REST conversation list strips system metadata.
// Single Set serialized as a JSON array.
const SELF_LEFT_KEY = 'antz-chat:self-left'

function readSelfLeftSet(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(SELF_LEFT_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function writeSelfLeftSet(set: Set<string>): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SELF_LEFT_KEY, JSON.stringify(Array.from(set)))
  } catch {
    /* quota / disabled storage — silent no-op */
  }
}

export function hasSelfLeft(chatId: string | number): boolean {
  return readSelfLeftSet().has(String(chatId))
}

export function markSelfLeft(chatId: string | number): void {
  const set = readSelfLeftSet()
  set.add(String(chatId))
  writeSelfLeftSet(set)
}

export function clearSelfLeft(chatId: string | number): void {
  const set = readSelfLeftSet()
  set.delete(String(chatId))
  writeSelfLeftSet(set)
}

export function sdkConversationToChat(conv: Conversation, currentUserId: ChatEntityId): ChatsArrType {
  const isGroup = conv.conversationType === 'group'

  const rawParticipants = (conv.participants ?? []) as ParticipantWithFlatUser[]

  // Backend soft-deletes removed members via isActive=false; filter them out
  // for the active-only views (sidebar previews, "X members" counts, etc.).
  const activeParticipants = rawParticipants.filter(p => p.isActive !== false)

  // Self-chat detection — direct conversation where the only participant is
  // the current user (WhatsApp's "Message yourself"). Without this, the
  // peer lookup below would resolve to `undefined` → "Unknown user" + empty
  // avatar. Falls back to the current user's own entry so the sidebar and
  // header show their own name + avatar. This branch is the only behavior
  // change in this function; non-self DMs and groups take the original
  // paths unchanged.
  const meIdStr = String(currentUserId ?? '')
  const isSelfChat = !isGroup && activeParticipants.length > 0 && activeParticipants.every(p => p.userId === meIdStr)

  const otherParticipant = isGroup
    ? undefined
    : isSelfChat
    ? activeParticipants[0]
    : activeParticipants.find(p => p.userId !== meIdStr)
  const other = otherParticipant ? participantToUser(otherParticipant) : undefined

  const fullName = isGroup
    ? conv.name ?? 'Unnamed group'
    : isSelfChat
    ? `${other?.displayName || other?.username || 'You'} (You)`
    : other?.displayName || other?.username || other?.email || 'Unknown user'

  const avatar = isGroup ? conv.iconUrl ?? '' : other?.avatarUrl ?? ''

  // Build lastMessage. Backfill `senderName` from the conversation's
  // participants array when the server omits `sender.displayName` on the
  // embedded message but we still have a `senderId` to look up.
  //
  // KNOWN BACKEND GAP: the `GET /conversations` list endpoint returns
  // `lastMessage` with `senderId: ''` (empty string) and no `sender`
  // object. We can't backfill without an id, so the sidebar's "Saket: …"
  // prefix won't render on a cold hard-refresh. As soon as any new
  // message arrives via the `new_message` socket event, `receiveMessage`
  // stores the proper senderId/senderName and the prefix appears for
  // that conv. File with chat-core team to include sender details on
  // conversation-list responses for a full fix.
  let lastMessage = conv.lastMessage ? sdkMessageToMessage(conv.lastMessage) : undefined
  if (lastMessage && !lastMessage.senderName && lastMessage.senderId) {
    const senderInList = rawParticipants.find(p => String(p.userId) === String(lastMessage!.senderId))
    const resolvedName = senderInList?.displayName || senderInList?.username
    if (resolvedName) {
      lastMessage = { ...lastMessage, senderName: resolvedName }
    }
  }

  // Full participants list (incl. isActive=false) so callers can distinguish
  // "removed from group" from "never a member". DMs don't carry isActive
  // semantics — both sides are always active.
  const participants = rawParticipants.map(p => {
    const u = p.user ?? p
    return {
      userId: p.userId,
      isActive: p.isActive !== false,
      role: p.role ?? 'member',
      displayName: (u as any).displayName || (u as any).username || undefined,
      username: (u as any).username || undefined,
      avatarUrl: (u as any).avatarUrl || undefined
    }
  })

  // Convenience flag for the composer / chat-actions gate. For DMs the user
  // is always considered active. For groups, look up the current user in the
  // unfiltered participants and read their isActive directly.
  const meId = String(currentUserId ?? '')
  const ownEntry = meId ? rawParticipants.find(p => p.userId === meId) : undefined
  const isCurrentUserActive = isGroup ? ownEntry?.isActive !== false : true

  // Freeze the sidebar preview for kicked groups. The server keeps returning
  // the live `lastMessage` (post-kick) in `listConversations`, which would
  // otherwise leak into the sidebar after a hard refresh. Override the text
  // with a removal placeholder; downstream renderers branch on
  // `contentType === 'system'` to style it as a system pill.
  //
  // When `lastMessage` IS the kick system event about the current user
  // (matched by metadata.systemOperationType + targetUserId), prefer the
  // WhatsApp-style "<Actor> removed you" wording — same form the in-chat
  // pill uses — so refresh stays consistent with the live UX. Falls back
  // to the generic placeholder for any other post-kick content.
  // Cached actor (id + display name) populated by previous live-kick /
  // messages.list derivation passes. Read once here so we can use it for
  // both the sidebar copy AND the banner snapshot below.
  const cachedKickActor = isGroup && !isCurrentUserActive ? readKickActor(conv.id) : undefined
  // Parallel cache for self-exit so the banner can show "You left the
  // group." on cold-load (no kick actor present, but we still know the
  // user walked out themselves).
  const cachedSelfLeft = isGroup && !isCurrentUserActive ? hasSelfLeft(conv.id) : false

  const sidebarLastMessage = (() => {
    if (!(isGroup && !isCurrentUserActive && lastMessage)) return lastMessage
    // Accept both naming conventions ("user_*" / "participant_*") so the
    // detection is resilient to backend renaming.
    const op = lastMessage.systemOperationType
    const isRemovalEvent = op === 'user_removed' || op === 'participant_removed'
    const isKickAboutMe =
      isRemovalEvent && lastMessage.targetUserId !== undefined && String(lastMessage.targetUserId) === meId
    if (isKickAboutMe && lastMessage.senderName) {
      return {
        ...lastMessage,
        message: `${lastMessage.senderName} removed you`,
        contentType: 'system' as const
      }
    }
    // Self-exit cold-load: localStorage marker tells us the user left
    // voluntarily. Show "You left the group" instead of the generic
    // "You were removed from this group" placeholder.
    if (cachedSelfLeft) {
      return {
        ...lastMessage,
        message: 'You left the group',
        contentType: 'system' as const
      }
    }
    // localStorage cache fallback — eliminates the cold-load flash by
    // using the actor name persisted from the prior session's kick
    // event. Cleared on re-add.
    if (cachedKickActor?.name) {
      return {
        ...lastMessage,
        message: `${cachedKickActor.name} removed you`,
        contentType: 'system' as const
      }
    }

    return { ...lastMessage, message: 'You were removed from this group', contentType: 'system' as const }
  })()

  return {
    id: conv.id,
    fullName,
    avatar,
    role: '',
    about: conv.description ?? '',
    status: other ? normalizeStatus(other.status) : 'online',
    email: other?.email || undefined,
    phone: other?.phone || undefined,
    isGroup,
    description: conv.description,
    participantIds: activeParticipants.map(p => p.userId),
    adminIds: activeParticipants.filter(p => p.role === 'admin').map(p => p.userId),
    participants,
    isCurrentUserActive,
    isMuted: conv.isMuted ?? false,
    isPinned: conv.isPinned ?? false,
    // Tenant-tunable message-mutation windows. Backend returns seconds;
    // `undefined` lets the UI treat the action as always allowed (existing
    // behavior). Consumed by MessageActions to gate Edit / Delete-for-
    // everyone menu items once the window expires.
    editWindowSeconds: conv.settings?.messageConfig?.editWindowSeconds,
    deleteWindowSeconds: conv.settings?.messageConfig?.deleteWindowSeconds,
    // Creator id — used by the sidebar to resolve the creator's display
    // name from `state.chat.contacts` when no real lastMessage exists.
    createdBy: conv.createdBy,
    createdAt: conv.createdAt,
    // Banner snapshot — hydrate from localStorage cache on cold load so
    // ChatContent's banner shows the right copy immediately (otherwise it
    // would wait for setChatMessages derivation and flash through the
    // generic placeholder).
    ...(cachedKickActor?.name ? { removedByName: cachedKickActor.name } : {}),
    ...(cachedKickActor?.id ? { removedBy: cachedKickActor.id } : {}),
    ...(cachedSelfLeft ? { selfLeft: true } : {}),
    chat: {
      id: conv.id,
      unseenMsgs: conv.unreadCount ?? 0,
      messages: [],
      lastMessage: sidebarLastMessage
    }
  }
}

export function extractContactsFromConversations(
  conversations: Conversation[],
  currentUserId: ChatEntityId
): ContactType[] {
  const seen = new Map<string, ContactType>()
  conversations.forEach(conv => {
    ;(conv.participants as ParticipantWithFlatUser[] | undefined)?.forEach(p => {
      if (p.isActive === false) return
      if (p.userId === String(currentUserId)) return
      if (seen.has(p.userId)) return
      seen.set(p.userId, sdkUserToContact(participantToUser(p)))
    })
  })

  return Array.from(seen.values())
}
