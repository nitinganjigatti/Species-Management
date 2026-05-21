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
  type AppConfig,
  type SocketStatus
} from '@antzsoft/chat-core'

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
  const client = requireClient('uploadChatFiles')
  const result = await client.uploadFiles(files, conversationId)

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
  const senderName =
    (msg as typeof msg & { sender?: { displayName?: string; username?: string } }).sender?.displayName ??
    (msg as typeof msg & { sender?: { displayName?: string; username?: string } }).sender?.username

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
    ...(msg.content?.type ? { contentType: msg.content.type } : {}),
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
    chat: {
      id: conv.id,
      unseenMsgs: conv.unreadCount ?? 0,
      messages: [],
      lastMessage
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
