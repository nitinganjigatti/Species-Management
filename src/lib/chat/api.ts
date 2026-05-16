// Facade for every `@antzsoft/chat-core` call the app makes.
// Every function throws if the SDK isn't initialized; callers wrap in try/catch.

import type {
  AntzChatClient,
  Conversation,
  CreateDirectData,
  CreateGroupData,
  CursorPaginatedResponse,
  ListMessagesParams,
  Message,
  MessageDeletedEvent,
  MessageDeletedForMeEvent,
  MessageDeliveredEvent,
  MessagesDeliveredEvent,
  MessageUpdatedEvent,
  NewMessageEvent,
  PaginatedResponse,
  Participant,
  ReactionUpdatedEvent,
  ReadReceiptEvent,
  SendMessagePayload,
  TypingIndicatorEvent,
  UpdateConversationData,
  User,
  UserStatusEvent
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
  Conversation,
  CreateDirectData,
  CreateGroupData,
  ListMessagesParams,
  Message,
  MessageDeletedEvent,
  MessageDeletedForMeEvent,
  MessageDeliveredEvent,
  MessagesDeliveredEvent,
  MessageUpdatedEvent,
  NewMessageEvent,
  ReactionUpdatedEvent,
  ReadReceiptEvent,
  SendMessagePayload,
  TypingIndicatorEvent,
  UpdateConversationData,
  User,
  UserStatusEvent
}

// ── Socket ───────────────────────────────────────────────────────────────────

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

export async function sendMessageOverSocket(payload: SendMessagePayload): Promise<Message> {
  console.log('[chat:trace] 3. socketEmit.sendMessage emit →', payload)
  const response = await sdkSocketEmit.sendMessage(payload)
  console.log('[chat:trace] 4. socketEmit.sendMessage ack ←', response)

  // Server may wrap as `{success, data: Message}` / `{message: Message}` /
  // `{error: '...'}` — normalize before returning.
  const r = response as { error?: string; message?: Message; data?: Message } | Message
  if (r && typeof r === 'object' && 'error' in r && (r as { error?: string }).error) {
    throw new Error((r as { error: string }).error)
  }
  const msg =
    (r as { message?: Message }).message ??
    (r as { data?: Message }).data ??
    (r as Message)
  console.log('[chat:trace] 5. unwrapped Message →', msg?.id, msg?.content?.text)

  return msg
}

export function joinChatRoom(conversationId: string): void {
  sdkSocketEmit.joinRoom(conversationId)
}

export function leaveChatRoom(conversationId: string): void {
  sdkSocketEmit.leaveRoom(conversationId)
}

// ── Internal ─────────────────────────────────────────────────────────────────

function requireClient(method: string) {
  const c = getChatClientOrNull()
  if (!c) throw new Error(`[chat-api] ${method}: SDK not initialized`)

  return c
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export function getMe(): Promise<User> {
  return requireClient('getMe').auth.getMe()
}

// ── Conversations ────────────────────────────────────────────────────────────

export function listConversations(params?: {
  page?: number
  limit?: number
}): Promise<PaginatedResponse<Conversation>> {
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

export function searchUsers(query: string): Promise<User[]> {
  return requireClient('searchUsers').conversations.searchUsers(query)
}

// ── Messages ─────────────────────────────────────────────────────────────────

export function listMessages(
  conversationId: string,
  params?: ListMessagesParams
): Promise<CursorPaginatedResponse<Message>> {
  return requireClient('listMessages').messages.list(conversationId, params)
}

export function markConversationRead(conversationId: string, messageId?: string): Promise<void> {
  return requireClient('markConversationRead').messages.markAsRead(conversationId, messageId)
}

// ── Adapters (SDK types → app types) ─────────────────────────────────────────

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

  return {
    id: msg.id,
    message: msg.content?.text ?? '',
    time,
    senderId: msg.senderId,
    feedback: {
      isSent: msg.status !== 'failed' && deliveryStatus !== 'failed',
      isDelivered: deliveryStatus === 'delivered' || deliveryStatus === 'read',
      isSeen: deliveryStatus === 'read'
    }
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

  const avatar = isGroup ? conv.iconUrl ?? conv.icon ?? '' : other?.avatarUrl ?? ''

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
    icon: conv.icon,
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
