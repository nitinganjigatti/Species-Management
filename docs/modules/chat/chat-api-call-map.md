# Chat — complete call map (SDK call → wrapper → caller → processing)

Exhaustive reference of how every `@antzsoft/chat-core` capability is wired in this app.
Pattern everywhere: **SDK method** is reached via a thin **wrapper in `src/lib/chat/api.ts`** (gated by `requireClient()`), invoked by a **Redux thunk in `src/store/apps/chat/index.ts`** or directly by a **component**, and the result flows into Redux via a **reducer**. Components read Redux + the SDK Zustand store (`useChatStore`) for presence/lastRead.

Line numbers are approximate (they drift with edits) — search by symbol.

---

## 1. Connection lifecycle — `src/contexts/ChatClientContext.tsx`

| Step | What runs | Processing |
|---|---|---|
| Init | `getChatClient({accessToken,userId,tenantId,avatar})` (`client.ts`) → `new AntzChatClient` singleton | Builds REST client with **`authToken`** (seeds the SDK auth store the REST interceptor reads — `authProvider` is NOT invoked in 1.2.6), `platformUploadFn`, `platformUploadPartFn`, `platformCompressFn`, `transitEncryption`, upload caps. Socket token comes from `getAccessToken` passed to `connectSocket`. |
| Profile push | `updateChatProfile()` + `syncAvatar()` (fire-and-forget) | Pushes name/avatar to chat server once per session. |
| Connect | `connectSocket(resolvedSocketConfig, getAccessToken)` | SDK does `fetchServerKeys` (`/crypto/pubkey`) + REST/socket transit handshake (`/crypto/session`). On resolve → `attachListeners(s)` + `setSocket`. |
| Listeners | `onConnect`/`onConnectError`/`onDisconnect`/`onReconnect` | connect→`connected=true`; connect_error→`setError`+`refreshSocketAuth`; reconnect→`connected=true`+`flushOutbox`. |
| Visibility | `onVisibilityChange` | hidden→`disconnectSocket()`; visible→`reconnectFresh` (refreshSocketAuth + connectSocket → fresh handshake → re-wire + flushOutbox). |
| Network | `onOnline`/`onOffline` | offline→teardown; online→`reconnectFresh`. Covers wifi while tab focused. |
| Deactivation | `getAuthStore().useAuthStore.subscribe` | true→false transition → `window.dispatchEvent('session-expired')`. |
| Cleanup/logout | `disconnectSocket()` + `disposeChatClient()` | Also fired first in `AuthContext.handleLogout` (before token clear). |

Status surfaced via `onSocketStatus`/`getSocketStatus` in **`AppChat.tsx`** → drives `chatConnected`, the **reconnecting banner**, and the socket-event subscription gate.

---

## 2. Conversations

| SDK (`client.conversations.*`) | Wrapper (`api.ts`) | Invoked by | Processing |
|---|---|---|---|
| `list(params?)` | `listConversations` | `fetchChatsContacts` thunk (no params → all) | → `sdkConversationToChat` adapter → `state.chat.chats`; `extractContactsFromConversations` → `state.chat.contacts`. Dispatched on connect by **ChatLauncher** (global) + **AppChat**. |
| `get(id)` | `getConversation` | `fetchConversation` thunk | adapter → `addOrReplaceChat`. Used after mute/pin/exit to reconcile. |
| `createDirect` | `createDirectConversation` | `materializeDraftIfNeeded` thunk | Draft DM → real conv on first send; `materializeDraft` reducer swaps draft id. |
| `createGroup` | `createGroupConversation` | `createGroupChat` thunk | `addOrReplaceChat` + `selectChat`; then `uploadGroupIcon` if file picked. |
| `update` | `updateConversation` | `updateGroupChat` thunk | name/description → `addOrReplaceChat`. |
| `delete` | `deleteConversation` | `deleteConversation` thunk (DM "Delete chat" / group "Delete group") | `removeChatFromList`. Multi-device echo: `conversation_deleted` socket → `removeChatFromList`. |
| `leave(id)` | `leaveConversation` | `UserProfileRight.performExit` → then `getConversation` → `addOrReplaceChat` (read-only state) | Server doesn't echo to leaver → REST refetch of that one conv. |
| `leave(id, true)` | `leaveAndDeleteConversation` | `UserProfileRight.performExitAndDelete` | `removeChatFromList` + `fetchChatsContacts`. |
| `addParticipants(+role)` | `addParticipants` | `addParticipantsToGroup` thunk | Optimistic "You added X" via `patchOptimisticLastMessage` → real conv → `addOrReplaceChat`. |
| `removeParticipant` | `removeParticipant` | `removeParticipantFromGroup` thunk | Optimistic "You removed X" → `addOrReplaceChat`. |
| `updateParticipantRole` | `updateParticipantRole` | `updateParticipantRoleInGroup` thunk | Optimistic "You made X admin" → `addOrReplaceChat`. |
| `mute`/`unmute` | `muteConversation`/`unmuteConversation` | `muteConversation`/`unmuteConversation` thunks | `updateChatFlags({isMuted})`. |
| `pin`/`unpin` | `pinConversation`/`unpinConversation` | `pinConversation`/`unpinConversation` thunks | `updateChatFlags({isPinned})`. **Pin-limit (max 5)** gated in `UserProfileRight` via `getAppConfig()`→`maxPinnedConversations`. |
| `getMembers` | `getConversationMembers` | `getGroupMembers` thunk | returns `Participant[]` for member UI. |
| `getUnreadSummary` / `getUnreadCount` | `getUnreadSummary` / `getConversationUnreadCount` | available for badge resync | (socket keeps counts live otherwise). |
| `uploadIcon` / `removeIcon` | `uploadConversationIcon`/`removeConversationIcon` (+ `client.uploadIcon`) | `uploadGroupIcon` thunk | optimistic blob preview → `client.uploadIcon` (presign→upload→set) → `addOrReplaceChat` + `fetchChatsContacts`. |
| `clearChat` | `clearChatOverSocket` (socket) / `clearConversationHistory` (REST, unused) | `clearChatHistory` thunk | socket emit → `clearChatLocal` (wipe messages + lastMessage). |

---

## 3. Messages

| SDK | Wrapper | Invoked by | Processing |
|---|---|---|---|
| `messages.list` | `listMessages` | `selectChat` (latest 50), `loadOlderMessages` (`direction:'before'`), `jumpToMessage` (before+after+target) | reversed → `sdkMessageToMessage` → `setChatMessages`/`prependChatMessages`. Filters deleted-for-me ids. |
| `messages.get` | `getMessage` | `enrichLastMessageSenders`, `jumpToMessage` | resolve sender / single message. |
| `socketEmit.sendMessage` | `sendMessageOverSocket` | `sendMsg` thunk + `forwardMessage` | ack → `sdkMessageToMessage` → `receiveMessage` (dedupe by id). On failure → `addToOutbox`. |
| `socketEmit.updateMessage` | `updateMessageOverSocket` | `SendMsgForm` edit | broadcast `message_updated` → `applyMessageUpdate`. |
| `socketEmit.deleteMessage` (fire-and-forget) | `deleteMessageOverSocket` | `MessageActions` | broadcast `message_deleted` → `applyMessageDelete` (tombstone). |
| `socketEmit.deleteMessageForMe` | `deleteMessageForMeOverSocket` | `MessageActions` (5s undo) | `applyMessageDeleteForMe` + `addDeletedForMeId` cache; undo → `restoreDeletedMessage`. |
| `messages.search` | `searchMessages` | `ChatContent` search drawer | debounced; results highlight in `ChatLog`. |
| `socketEmit.addReaction`/`removeReaction` | `addReactionOverSocket`/`removeReactionOverSocket` | `MessageActions`/`toggleSingleReaction` | broadcast `reaction_updated` → `applyReactionUpdate`. |
| `socketEmit.pinMessage`/`unpinMessage` | `pinMessageOverSocket`/`unpinMessageOverSocket` | `MessageActions` | broadcast `message_pin_updated` → `applyMessagePin`. `listPinnedMessages` → `PinnedMessagesStrip`. |
| `messages.star`/`unstar`/`getStarred` | `starMessage`/`unstarMessage`/`listStarredMessages` | `MessageActions` + `StarredMessagesDrawer` | optimistic `setMessageStarred`; personal-only. |
| `messages.getReceipts` | `getMessageReceipts` | `MessageInfoDialog` | read/delivered buckets w/ profiles; live updates via `read_receipt`/`message_delivered`. |
| `messages.getLastRead` | `getLastRead` | `selectChat` | seeds `useChatStore.setLastRead` → unread divider. |
| `socketEmit.markRead` | `markReadOverSocket` | `selectChat`, `AppChat` (on open msg) | server broadcasts `read_receipt`. |
| edit/delete windows | `editWindowSeconds`/`deleteWindowSeconds` on the chat | `MessageActions` gates Edit / Delete-for-everyone | fallback 900s / 216000s. |

---

## 4. Users — `client.users.*`
`list`→`listUsers`/`searchUsers` (ComposePopover, CreateGroupDrawer, AddMembersDrawer, UserProfileRight) · `getById`→`getUserById` (`startDirectChat` draft) · `getLastSeen`→`getUserLastSeen` (`ChatContent`/`AppChat` presence cold-seed → `useChatStore.setLastSeen`) · `updateProfile`→`updateChatProfile` (provider) · `getPreferences`/`updatePreferences`.

---

## 5. Files — `src/lib/chat/api.ts` + `client.ts`
- **Send attachments:** `SendMsgForm` → `uploadChatFiles` → `sdkUploadBatch(files, platformUploadFn, conv, _, platformCompressFn, cfg, platformUploadPartFn)` → presign → direct-to-storage (POST S3/local, PUT Azure; **chunked multipart ≥10MB** via `platformUploadPartFn`) → confirm → `SendMessageAttachment[]` → `sendMsg`.
- **Compression:** `platformCompressFn` gzips text docs only (images pre-compressed in `SendMsgForm`/`GroupIconEditor`).
- **Group icon:** `client.uploadIcon` (same pipeline).
- **Media/links/docs drawer:** `getConversationFiles`.

---

## 6. Socket events — inbound (subscribed in `AppChat.tsx`, 16 handlers)
`new_message`→`receiveMessage` · `message_delivered`/`messages_delivered`→`applyDeliveryReceipt` · `read_receipt`→`applyReadReceiptEntry`+`updateMessagesFeedback` · `conversation_updated`→`patchConversationFromEvent` | `addOrReplaceChat` (slim vs full via `isFullConversationPayload`) · `unread_count_changed`→`setUnseenCount` · `conversation_created`→`addOrReplaceChat`/`fetchChatsContacts`+`joinChatRoom` · `conversation_deleted`→`removeChatFromList` · `reaction_updated`→`applyReactionUpdate` · `message_updated`→`applyMessageUpdate` · `message_deleted`→`applyMessageDelete` · `message_deleted_for_me`→`applyMessageDeleteForMe` · `message_pin_updated`→`applyMessagePin` · `participant_joined`→`applyParticipantJoined`(+synthetic "added you") · `participant_left`→`applyParticipantLeft`(+synthetic "you left") · `typing_indicator`→local `typingUsers`.
Presence cold-seed: `getOnlineUsersOverSocket` on connect; `user_offline`→`getUserLastSeen`→`useChatStore.setLastSeen`.

## 7. Realtime processing notes (reducers)
- **Tick computation:** group delivered = `computeGroupDelivered` (all active participants ∈ deliveredTo∪readBy); `pendingFeedback` buffers receipts arriving before the message; monotonic merge in `patchConversationFromEvent` (ticks never downgrade).
- **Membership:** `applyParticipantLeft`/`Joined` flip `isCurrentUserActive`; localStorage caches (`kick-actor`, `self-left`) for cold-load copy; guards drop post-kick broadcasts.
- **Outbox:** `addToOutbox`/`removeFromOutbox`/`flushPendingOutbox` (replayed on reconnect).

## 8. Adapters & caches (`api.ts`)
`sdkConversationToChat` · `sdkMessageToMessage` · `sdkUserToProfile`/`Contact` · `extractContactsFromConversations` · localStorage: kick-actor, deleted-for-me, self-left · `isFullConversationPayload`.

---

## Known intentional deviations
1. **`conversations.list()` filters** — fetch-all + client-side filter (not server-side `ConversationListParams`). See [conversation-list-fetch-model.md](./conversation-list-fetch-model.md).
2. **Auto-join** — we call `joinChatRoom` explicitly though the server auto-joins (idempotent, belt-and-suspenders).
3. **`refreshSocketAuth` on token-refresh** — no refresh flow (long-lived token); called on visible/online/connect_error instead.
