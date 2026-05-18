// ** Types
import { Dispatch } from 'redux'

type ThemeColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'

export type StatusType = 'busy' | 'away' | 'online' | 'offline'

export type ChatFilterType = 'all' | 'unread' | 'favourites' | 'groups'

export type StatusObjType = {
  busy: ThemeColor
  away: ThemeColor
  online: ThemeColor
  offline: ThemeColor
}

export type ProfileUserType = {
  // Accepts both legacy numeric mock IDs and SDK ObjectId strings during the
  // chat-core migration. Will narrow to `string` once all contacts/messages
  // migrate off seed data.
  id: string | number
  role: string
  about: string
  avatar: string
  fullName: string
  status: StatusType
  settings: {
    isNotificationsOn: boolean
    isTwoStepAuthVerificationEnabled: boolean
  }
}

export type MsgFeedbackType = {
  isSent: boolean
  isSeen: boolean
  isDelivered: boolean
}

// IDs are `string | number` during the chat-core migration: numeric for legacy
// mock seed data, string (Mongo ObjectId) for real SDK data. Will narrow to
// `string` once all seeds are removed.
export type ChatEntityId = string | number

export type ChatAttachmentType = {
  id: string
  type: 'image' | 'video' | 'audio' | 'document'
  url: string
  thumbnailUrl?: string
  filename: string
  mimeType: string
  size: number
  isUploading?: boolean
  uploadProgress?: number
}

// One reaction bucket on a message — `userIds` is who reacted, `count` is its
// length cached for quick render. Mirrors the SDK's `MessageReaction`.
export type ReactionEntry = {
  emoji: string
  userIds: string[]
  count: number
}

// Lightweight reference embedded on a message that replies to another one.
// `textPreview` is the first ~80 chars of the original; full content lookup
// happens via id when the user clicks the snippet.
export type MessageReplyRef = {
  messageId: string
  senderId: ChatEntityId
  senderName?: string
  textPreview: string
  hasAttachment?: boolean
}

export type MessageType = {
  // Stable server id once known; absent for mock seed messages and pre-ack
  // optimistic sends. Used to dedupe socket echoes and update feedback ticks.
  id?: string
  time: string | Date
  message: string
  senderId: ChatEntityId
  feedback: MsgFeedbackType
  attachments?: ChatAttachmentType[]
  contentType?: 'text' | 'attachment' | 'system'
  // Interaction state — populated by the SDK adapter when the server includes
  // these, mutated by the new message-actions reducers. All optional so
  // existing send/receive paths don't need updates.
  replyTo?: MessageReplyRef
  reactions?: ReactionEntry[]
  isPinned?: boolean
  isStarred?: boolean
  isEdited?: boolean
  editedAt?: string
  isDeletedForEveryone?: boolean
}

export type ChatType = {
  id: ChatEntityId
  unseenMsgs: number
  messages: MessageType[]
  lastMessage?: MessageType
}

export type ContactType = {
  id: ChatEntityId
  role: string
  about: string
  avatar?: string
  fullName: string
  status: StatusType
  avatarColor?: ThemeColor
}

export type ChatsArrType = {
  id: ChatEntityId
  role: string
  about: string
  chat: ChatType
  avatar?: string
  fullName: string
  status: StatusType
  avatarColor?: ThemeColor
  email?: string
  phone?: string
  isGroup?: boolean
  isFavourite?: boolean
  description?: string
  icon?: string
  participantIds?: ChatEntityId[]
  /** Subset of participantIds that have the `admin` role server-side. */
  adminIds?: ChatEntityId[]
  /** Mirrors `Conversation.isMuted` from the SDK. */
  isMuted?: boolean
  /** Mirrors `Conversation.isPinned` from the SDK. */
  isPinned?: boolean
}

export interface CreateGroupPayload {
  name: string
  description?: string
  icon?: string
  participantIds: ChatEntityId[]
}

export type SelectedChatType = null | {
  chat: ChatType
  contact: ChatsArrType
}

export type ChatStoreType = {
  chats: ChatsArrType[] | null
  contacts: ContactType[] | null
  userProfile: ProfileUserType | null
  selectedChat: SelectedChatType
  activeFilter: ChatFilterType
  loadingMessages: boolean
  // Receipts (delivered/seen) that arrived BEFORE the corresponding message
  // landed in `chats`. Keyed by messageId. Drained in `sendMsg.fulfilled` and
  // `receiveMessage` once the message is appended.
  pendingFeedback: Record<string, { isDelivered?: boolean; isSeen?: boolean }>
  // The message currently being replied to. Set by clicking "Reply" on a
  // bubble; cleared by sending or by the composer's cancel button.
  replyingTo: MessageReplyRef | null
  // The message currently being edited. Set by clicking "Edit" on an own
  // bubble; cleared on save / cancel.
  editingMessage: { messageId: string; originalText: string } | null
}

export type SendMsgParamsType = {
  chat?: ChatType
  message: string
  contact?: ChatsArrType
  attachments?: ChatAttachmentType[]
}

export type ChatContentType = {
  store: ChatStoreType
  hidden: boolean
  mdAbove: boolean
  sendMsg: (params: SendMsgParamsType) => void
  dispatch: Dispatch<any>
  statusObj: StatusObjType
  getInitials: (string: string) => string
  sidebarWidth: number
  userProfileRightOpen: boolean
  handleLeftSidebarToggle: () => void
  handleUserProfileRightSidebarToggle: () => void
}

export type ChatSidebarLeftType = {
  store: ChatStoreType
  hidden: boolean
  mdAbove: boolean
  dispatch: Dispatch<any>
  statusObj: StatusObjType
  userStatus: StatusType
  selectChat: (id: ChatEntityId) => void
  getInitials: (string: string) => string
  sidebarWidth: number
  leftSidebarOpen: boolean
  removeSelectedChat: () => void
  userProfileLeftOpen: boolean
  setUserStatus: (status: StatusType) => void
  formatDateToMonthShort: (value: string, toTimeForCurrentDay?: boolean) => string
  handleLeftSidebarToggle: () => void
  handleUserProfileLeftSidebarToggle: () => void
}

export type UserProfileLeftType = {
  store: ChatStoreType
  hidden: boolean
  statusObj: StatusObjType
  userStatus: StatusType
  sidebarWidth: number
  setUserStatus: (status: StatusType) => void
  userProfileLeftOpen: boolean
  handleUserProfileLeftSidebarToggle: () => void
}

export type UserProfileRightType = {
  store: ChatStoreType
  hidden: boolean
  statusObj: StatusObjType
  getInitials: (string: string) => string
  sidebarWidth: number
  userProfileRightOpen: boolean
  handleUserProfileRightSidebarToggle: () => void
}

export type SendMsgComponentType = {
  store: ChatStoreType
  dispatch: Dispatch<any>
  sendMsg: (params: SendMsgParamsType) => void
}

export type ChatLogChatType = {
  // Stable id so the bubble can pass it to action handlers (react, edit,
  // delete, etc.). Optional during the mock-data migration window.
  id?: string
  msg: string
  time: string | Date
  feedback: MsgFeedbackType
  attachments?: ChatAttachmentType[]
  contentType?: 'text' | 'attachment' | 'system'
  // Forwarded from MessageType so the bubble renderer can show interaction
  // state without going back to Redux for each message.
  replyTo?: MessageReplyRef
  reactions?: ReactionEntry[]
  isPinned?: boolean
  isStarred?: boolean
  isEdited?: boolean
  editedAt?: string
  isDeletedForEveryone?: boolean
}

export type MessageGroupType = {
  senderId: ChatEntityId
  messages: ChatLogChatType[]
}

export type FormattedChatsType = MessageGroupType

export type ChatLogType = {
  hidden: boolean
  data: {
    chat: ChatType
    contact: ChatsArrType
    userContact: ProfileUserType
  }
  searchQuery?: string
  searchResultIds?: string[]
  activeMatchIndex?: number
}
