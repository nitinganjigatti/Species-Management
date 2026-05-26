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
  /**
   * Length in seconds for audio/video attachments. v1.1.3 SDK spec says
   * this must be supplied on `socketEmit.sendMessage` so receivers can
   * render the duration in their player UI. Captured client-side when
   * the user records or picks the file (storage layer doesn't keep it).
   * Undefined for images / documents and for older messages from before
   * this field was wired.
   */
  duration?: number
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

// Snapshot of the message currently being forwarded, set when the user picks
// "Forward" from the message-actions menu. The ForwardMessageDialog reads
// this to render the source preview and to compose the outgoing payload.
// Cleared on send-success or dialog cancel.
export type ForwardingMessageRef = {
  messageId: string
  messageText?: string
  attachments?: ChatAttachmentType[]
  senderName?: string
  senderId?: ChatEntityId
}

export type MessageType = {
  // Stable server id once known; absent for mock seed messages and pre-ack
  // optimistic sends. Used to dedupe socket echoes and update feedback ticks.
  id?: string
  time: string | Date
  message: string
  senderId: ChatEntityId
  /**
   * Sender's display name snapshotted from the SDK message's `sender.displayName`
   * when available. Used by the sidebar to render the WhatsApp-style
   * "Saket: hello" prefix without depending on the global contacts cache
   * (which can lose entries when a member leaves the group). Falls back to
   * the contacts lookup, then to no prefix.
   */
  senderName?: string
  feedback: MsgFeedbackType
  attachments?: ChatAttachmentType[]
  contentType?: 'text' | 'attachment' | 'system'
  /**
   * Structured metadata for `contentType === 'system'` messages — the
   * server includes targetUserId / targetUserName / systemOperationType
   * on add/remove/admin events so the client can render perspective-aware
   * text without parsing the message body. Optional everywhere because
   * older messages and non-system messages don't carry them.
   */
  targetUserId?: ChatEntityId
  targetUserName?: string
  systemOperationType?: string
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
  /**
   * Per-recipient read receipts. Populated by the adapter from the SDK
   * Message's `readBy` array. Drives the WhatsApp-style "Message info"
   * dialog (list of who read + when).
   */
  readBy?: Array<{ userId: string; readAt: string }>
  /**
   * Per-recipient delivery receipts (reached the device, may not yet be
   * opened). Same shape as `readBy`.
   */
  deliveredTo?: Array<{ userId: string; deliveredAt: string }>
}

export type ChatType = {
  id: ChatEntityId
  unseenMsgs: number
  messages: MessageType[]
  lastMessage?: MessageType
  // Pagination state for "load older messages on scroll up". `oldestCursor` is
  // the SDK's nextCursor pointing at the next-older page; null means there is
  // no further page to load. `hasMoreOlder=false` means we've reached the
  // start of history.
  oldestCursor?: string | null
  hasMoreOlder?: boolean
  loadingOlder?: boolean
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
  /**
   * Raw participants array including soft-deleted (isActive=false) members.
   * Use this when callers need to distinguish "still in the group" from
   * "left/removed" for the current user — `participantIds` strips inactive
   * entries by design.
   */
  participants?: Array<{
    userId: string
    isActive: boolean
    role: string
    displayName?: string
    username?: string
    avatarUrl?: string
  }>
  /**
   * Convenience flag: true if the current user has an active participant
   * entry on the conversation. False for groups they've been removed from
   * (or have left). Always true for DMs. Populated by the adapter from the
   * `participants` array above.
   */
  isCurrentUserActive?: boolean
  /** Mirrors `Conversation.isMuted` from the SDK. */
  isMuted?: boolean
  /** Mirrors `Conversation.isPinned` from the SDK. */
  isPinned?: boolean
  /**
   * Time windows (seconds since send) during which the sender can edit or
   * delete-for-everyone their own messages. Sourced from
   * `Conversation.settings.messageConfig`. Tenant-tunable on the backend.
   * Undefined → no restriction (caller falls back to "always allowed").
   */
  editWindowSeconds?: number
  deleteWindowSeconds?: number
  /**
   * Creator of the conversation. Mirrors `Conversation.createdBy` from the
   * SDK. Used by the sidebar to render a "X created group Y" preview when
   * the server doesn't surface `lastMessage` for a freshly-created group.
   */
  createdBy?: ChatEntityId
  /** ISO timestamp when the conversation was created. Mirrors `Conversation.createdAt` from the SDK. */
  createdAt?: string
  /**
   * v1.1.3 `participant_left` distinguishes self-exit from admin-removal
   * by the presence of `removedBy` on the event payload. When the CURRENT
   * user was kicked, we snapshot the admin's userId here so the composer's
   * read-only placeholder can say "You were removed by …" instead of
   * the generic "You're no longer a member" copy.
   * Self-exit path leaves this field undefined.
   */
  removedBy?: ChatEntityId
  /** Display name of the admin who removed the current user, when supplied. */
  removedByName?: string
  /**
   * Self-exit flag — set when the current user left this group
   * voluntarily (vs being kicked by an admin). Drives banner copy
   * ("You left the group." vs "You're no longer a member of this
   * group."). Hydrated from a localStorage marker on cold refresh
   * so the signal survives REST conversation list stripping system
   * metadata. Cleared when the user re-joins.
   */
  selfLeft?: boolean
  /**
   * WhatsApp-style "draft" DM — the conversation only exists in local
   * state (no server `Conversation` record yet). Created by
   * `startDirectChat` when no DM exists yet for the chosen peer. The
   * `id` field is a `__draft__<userId>` placeholder. `sendMsg` materializes
   * the conversation by calling `createDirectConversation` on first send
   * and dispatches `materializeDraft` to swap the local state to a real
   * server-backed row. If the user navigates away before sending, the
   * draft just disappears — no server state is ever created.
   */
  isDraft?: boolean
}

export interface CreateGroupPayload {
  name: string
  description?: string
  /**
   * Local preview URL — UI-only, NOT sent to the server. SDK 1.0.6
   * dropped `icon` from CreateGroupData; the icon now uploads in a
   * separate step AFTER the group is created.
   */
  icon?: string
  /**
   * SDK `UploadableFile` shape captured by the CreateGroupDrawer when the
   * user picks an avatar. Used by `createGroupChat` to call
   * `client.uploadIcon(groupId, iconFile)` ONLY after `createGroupConversation`
   * has returned a real id — guarantees the icon attaches to the new
   * group, not a half-created one. Mirrors the existing edit-group-icon
   * flow in UserProfileRight.
   */
  iconFile?: { uri: string; name: string; type: string; size: number }
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
  // Selected conversation ID — persisted across page navigation
  selectedConversationId: string | null
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
  // The message currently shown in the "Message info" right-side drawer.
  // Set by clicking the chevron's "Info" item on a sender bubble; cleared
  // on close. Mounted at the AppChat root so the drawer panel overlays
  // the chat shell, not the bubble.
  infoMessage: {
    messageId: string
    messageText?: string
    readBy?: Array<{ userId: string; readAt: string }>
    deliveredTo?: Array<{ userId: string; deliveredAt: string }>
  } | null
  // The message currently being forwarded. Set by clicking "Forward" on a
  // bubble; cleared on send-success or by the dialog's cancel button.
  // Drives the ForwardMessageDialog mounted at the chat shell root.
  forwardingMessage: ForwardingMessageRef | null
  // WhatsApp-style per-conversation drafts. Keyed by conversationId.
  // Populated when the user types in the composer and switches chats
  // without sending; restored when they come back. Cleared on send.
  drafts: Record<string, string>
}

export type SendMsgParamsType = {
  chat?: ChatType
  message: string
  contact?: ChatsArrType
  attachments?: ChatAttachmentType[]
}

export type TypingUserInfo = { userId: string; displayName: string }

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
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
  typingUsers?: TypingUserInfo[]
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
  compact?: boolean
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
  /**
   * Optional callback to scroll the main ChatLog to a specific message
   * id. Used by StarredMessagesDrawer (and any future "jump to" UI)
   * to flash a bubble in the chat after the user clicks it in a list.
   * ChatContent wires this to its `setScrollTargetMessageId`.
   */
  onScrollToMessage?: (messageId: string) => void
  /** Opens the chat search drawer — wired by ChatContent to handleSearchToggle. */
  onOpenSearch?: () => void
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
  // System-message metadata — forwarded from MessageType so the
  // shared perspective resolver (src/lib/chat/systemMessagePerspective.ts)
  // can render the right text per viewer (sender / target / bystander)
  // for membership / role / metadata events.
  senderId?: ChatEntityId
  senderName?: string
  targetUserId?: ChatEntityId
  targetUserName?: string
  systemOperationType?: string
  // Forwarded from MessageType so the bubble renderer can show interaction
  // state without going back to Redux for each message.
  replyTo?: MessageReplyRef
  reactions?: ReactionEntry[]
  isPinned?: boolean
  isStarred?: boolean
  isEdited?: boolean
  editedAt?: string
  isDeletedForEveryone?: boolean
  // Receipts — forwarded from MessageType for the "Message info" dialog.
  readBy?: Array<{ userId: string; readAt: string }>
  deliveredTo?: Array<{ userId: string; deliveredAt: string }>
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
  // Fired when the user scrolls near the top and we should request the next
  // older page. ChatLog handles the trigger detection + scroll-position
  // preservation; ChatContent wires this to the `loadOlderMessages` thunk.
  onLoadOlder?: () => void
  // Fired when the active search match is not in the currently-loaded window
  // and we need to reload a context slice around that message. ChatContent
  // wires this to the `jumpToMessage` thunk.
  onJumpToMessage?: (messageId: string) => void
  // External scroll request (e.g. pinned-bar click). When set, ChatLog tries
  // to scroll to the message; if it's not in the loaded window it dispatches
  // `onJumpToMessage` and retries once the messages array swaps. Caller
  // should clear via `onScrollToTargetDone` once handled to allow re-clicks
  // on the same id.
  scrollTargetMessageId?: string | null
  onScrollToTargetDone?: () => void
  // Fired when the user clicks a reply snippet inside a bubble. ChatContent
  // routes this to the same `scrollTargetMessageId` flow used by the pinned
  // bar so it works with PerfectScrollbar + paginated history.
  onJumpToReply?: (messageId: string) => void
  // When false, per-message actions (Reply / Star / Copy / Delete) and
  // reaction toggles are suppressed. Set by ChatContent when the current
  // user has been removed from / has left a group. Defaults to true.
  canInteract?: boolean
  // Opens the group info / members panel — wired to handleUserProfileRightSidebarToggle
  // in ChatContent. Used by the "Add Member" button in the group-created card.
  onAddMember?: () => void
}
