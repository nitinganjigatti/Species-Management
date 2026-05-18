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
  let msg = ((r as { message?: Message }).message ?? (r as { data?: Message }).data) as
    | Message
    | undefined

  // Fall back: if the ack is just `{success, messageId}`, synthesize a Message
  // from the request payload + returned id so downstream code (Redux + receipt
  // matching) has a real `id` to work with.
  if (!msg && r && typeof r === 'object' && 'messageId' in r && (r as any).messageId) {
    const ack = r as { success?: boolean; messageId: string }
    const now = new Date().toISOString()
    msg = {
      id: ack.messageId,
      tenantId: '',
      conversationId: payload.conversationId,
      senderId: '',
      content: {
        type: 'text',
        text: payload.text,
        attachments: (payload.attachments as any) ?? undefined
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

export function deleteMessageOverSocket(messageId: string): Promise<unknown> {
  return sdkSocketEmit.deleteMessage(messageId)
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

export function updateConversation(
  conversationId: string,
  data: UpdateConversationData
): Promise<Conversation> {
  return requireClient('updateConversation').conversations.update(conversationId, data)
}

export function deleteConversation(conversationId: string): Promise<void> {
  return requireClient('deleteConversation').conversations.delete(conversationId)
}

export function addParticipants(conversationId: string, userIds: string[]): Promise<Conversation> {
  return requireClient('addParticipants').conversations.addParticipants(conversationId, userIds)
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

export function getConversationMembers(conversationId: string): Promise<User[]> {
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
export async function uploadChatFiles(
  files: UploadableFile[],
  conversationId: string
): Promise<UploadChatFilesResult> {
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

  return { attachments, failed: result.failed }
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
  avatarUrl?: string
  status?: string
}

function participantToUser(p: ParticipantWithFlatUser): User {
  if (p.user) return p.user

  return {
    id: p.userId,
    tenantId: '',
    email: p.email ?? '',
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

  return {
    id: msg.id,
    message: msg.content?.text ?? '',
    time,
    senderId: msg.senderId,
    feedback: {
      isSent: msg.status !== 'failed' && deliveryStatus !== 'failed',
      isDelivered: deliveryStatus === 'delivered' || deliveryStatus === 'read',
      isSeen: deliveryStatus === 'read'
    },
    ...(attachments && attachments.length ? { attachments } : {}),
    ...(reactions ? { reactions } : {}),
    ...(replyTo ? { replyTo } : {}),
    ...(msg.isPinned ? { isPinned: true } : {}),
    ...(msg.isStarred ? { isStarred: true } : {}),
    ...(msg.isEdited ? { isEdited: true } : {}),
    ...(msg.editedAt ? { editedAt: msg.editedAt } : {})
  }
}

export function sdkConversationToChat(conv: Conversation, currentUserId: ChatEntityId): ChatsArrType {
  const isGroup = conv.conversationType === 'group'

  // Backend soft-deletes removed members via isActive=false; filter them out.
  const activeParticipants = ((conv.participants ?? []) as ParticipantWithFlatUser[]).filter(
    p => p.isActive !== false
  )

  const otherParticipant = isGroup
    ? undefined
    : activeParticipants.find(p => p.userId !== String(currentUserId))
  const other = otherParticipant ? participantToUser(otherParticipant) : undefined

  const fullName = isGroup
    ? conv.name ?? 'Unnamed group'
    : other?.displayName || other?.username || other?.email || 'Unknown user'

  const avatar = isGroup ? conv.iconUrl ?? '' : other?.avatarUrl ?? ''

  const lastMessage = conv.lastMessage ? sdkMessageToMessage(conv.lastMessage) : undefined

  return {
    id: conv.id,
    fullName,
    avatar,
    role: '',
    about: conv.description ?? '',
    status: other ? normalizeStatus(other.status) : 'online',
    isGroup,
    description: conv.description,
    participantIds: activeParticipants.map(p => p.userId),
    adminIds: activeParticipants.filter(p => p.role === 'admin').map(p => p.userId),
    isMuted: conv.isMuted ?? false,
    isPinned: conv.isPinned ?? false,
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
