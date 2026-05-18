# `@antzsoft/chat-core` — Integration Status

Tracks which SDK methods are wired into the app today and which still need work. The full SDK reference (signatures, types, examples) lives in [antzsoft-chat-core.md](./antzsoft-chat-core.md); architecture overview in [chat-core-starter.md](./chat-core-starter.md).

**Currently on `@antzsoft/chat-core@1.0.6`** (path-prefix socket bug fixed → custom socket wrapper deleted; SDK handles connect / disconnect / reconnect natively; new lightweight ack shape `{success, messageId}` is handled by synthesizing a Message from the request payload).

Legend: ✅ wired (used by app) · 🔌 exposed in `api.ts` facade but no UI consumer yet · ☐ neither · ⚠️ partial / known gap

---

## Architecture (`src/lib/chat/`)

```
api.ts          ← single facade for every SDK call + SDK→app adapters
client.ts       ← AntzChatClient singleton + persistStorage + platformUploadFn
socketLogger.ts ← console-only "connected / disconnected" lifecycle logs
```

Nothing outside `src/lib/chat/` imports from `@antzsoft/chat-core` directly. Everything flows through `api.ts`.

---

## Auth API (`authApi`)

| Method | Status | Where / Notes |
|---|---|---|
| `getMe` | ✅ | `fetchUserProfile` thunk — [src/store/apps/chat/index.ts](../../../src/store/apps/chat/index.ts) |
| `syncAvatar` | ✅ | `fetchUserProfile` thunk — pushes avatar URL post-login |
| `uploadAvatar` | 🔌 | Exposed in `api.ts`. Builtin-auth mode only; we use WSO2 SSO so unused. |
| `login` | ☐ | Not used — WSO2 owns auth, JWT is passed via `authToken` config |
| `register` | ☐ | Same as above |
| `refresh` | ⚠️ | Not wired. SDK's internal refresh hits `/auth/refresh` (doesn't exist on our chat backend). The new `refreshSocketAuth()` only handles the socket side. |
| `logout` / `logoutAll` | ☐ | — |

---

## Conversations API (`conversationsApi`)

| Method | Status | Where / Notes |
|---|---|---|
| `list` | ✅ | `fetchChatsContacts` thunk — calls `listConversations()` with **no `page`/`limit`** so server returns all matching (per SDK doc Step 6 "Pagination is optional"). Auto re-fired on socket connect and on `new_message` for an unknown conversation. Accepts full `ConversationListParams` for future server-side filtering (type / isPinned / isMuted / hasUnread / search / role / hasAttachments / attachmentType / notificationsEnabled). |
| `get` | ✅ | `fetchConversation` thunk — refresh single conversation by id |
| `createGroup` | ✅ | `createGroupChat` thunk; dispatched from `CreateGroupDrawer`. **SDK 1.0.6 breaking change:** `icon` field was removed from `CreateGroupData`. Group icon must now be uploaded **after** create via `uploadConversationIcon(groupId, fileId)` — not yet wired in UI. |
| `createDirect` | ✅ | `startDirectChat` thunk — idempotent, fired from compose popover |
| `update` | ✅ | `updateGroupChat` thunk; inline edit of group name + description in [UserProfileRight.tsx](../../../src/views/apps/chat/UserProfileRight.tsx) (admin-only). **SDK 1.0.6 breaking change:** `icon` removed from `UpdateConversationData`. |
| `delete` | ✅ | `deleteConversation` thunk; "Delete group" in danger zone (admin-only on backend) |
| `addParticipants` | ✅ | `addParticipantsToGroup` thunk; "Add" flow uses `searchUsers` |
| `removeParticipant` | ⚠️ | `removeParticipantFromGroup` thunk wired; member-row kebab → "Remove from group". **Known bug:** UI does not refresh after backend confirms — see "Risks" |
| `updateParticipantRole` | ✅ | `updateParticipantRoleInGroup` thunk; member-row kebab → "Make admin / Demote to member" |
| `mute` / `unmute` | ✅ | `muteConversation` / `unmuteConversation` thunks; toggle in group actions |
| `pin` / `unpin` | ✅ | `pinConversation` / `unpinConversation` thunks; toggle in group actions |
| `leave` | ✅ | `leaveGroupChat` thunk; "Leave group" in danger zone, uses shared `ConfirmationDialog` |
| `getMembers` | ✅ | `getGroupMembers` thunk; raw return — no consumer in UI yet (member list still derived from `conv.participants`) |
| `getUnreadCount(id)` | 🔌 | Exposed as `getConversationUnreadCount` — single-conversation badge refresh after foreground / reconnect |
| `getUnreadSummary()` | 🔌 | Exposed in `api.ts`. Source of truth for cold-start / post-reconnect unread totals across all conversations |
| `uploadIcon(id, fileId)` | 🔌 | Exposed as `uploadConversationIcon`. Two-step: `uploadChatFiles([file], groupId)` → returned `fileId` → this call. CreateGroupDrawer still collects an icon URL but it's currently inert post-1.0.6. |

---

## Users API (`usersApi`)

**SDK 1.0.6 breaking change:** user search moved from `conversationsApi.searchUsers(query)` (removed) to `usersApi.list({ query })`. Our `searchUsers` wrapper unwraps the new `PaginatedResponse<User>.data` shape.

| Method | Status | Where / Notes |
|---|---|---|
| `list({ query })` | ✅ | Wrapped as `searchUsers(query)` — used by Compose popover, CreateGroupDrawer member picker, and group "Add members" flow. Debounced 300ms; empty string returns full user list. Full paginated variant `listUsers(params)` also exposed. |
| `getById(userId)` | 🔌 | `getUserById` in `api.ts` — no UI consumer yet |
| `getLastSeen(userId)` | 🔌 | `getUserLastSeen` in `api.ts` — needed for DM "last seen" UI (not yet wired). Pairs with `useChatStore.lastSeen` which the SDK auto-hydrates from `user_offline` events. |
| `getPreferences()` / `updatePreferences(prefs)` | 🔌 | `getUserPreferences` / `updateUserPreferences` in `api.ts` — needed for notification settings UI |

---

## Devices API (`devicesApi`) — push notifications

The SDK exports `devicesApi` at module level (not on the `AntzChatClient` instance). Both wrappers gate on SDK initialization via `requireClient()` but call `sdkDevicesApi` directly.

| Method | Status | Where / Notes |
|---|---|---|
| `register(payload)` | 🔌 | `registerDevice` in `api.ts`. Supports mobile (`expo` / `fcm` / `apns`) and web (`web-push` with VAPID `endpoint` / `p256dh` / `auth`). Not yet called — needs OS-level token acquisition flow. |
| `remove(deviceId)` | 🔌 | `removeDevice` — call on logout to stop push delivery |

---

## Messages API (`messagesApi`)

| Method | Status | Where / Notes |
|---|---|---|
| `list` | ✅ | `selectChat` thunk — limit 50, reversed for chronological render |
| `get(messageId)` | 🔌 | `getMessage` in `api.ts` — useful for deep-link → fetch single message |
| `send` (REST) | 🔌 | We use socket `socketEmit.sendMessage` instead. REST `send` is not wrapped (no consumer would need it). |
| `update(messageId, text)` | ✅ | Wired via socket `updateMessageOverSocket` — invoked from `MessageActions` 3-dot → Edit. Composer enters edit mode (banner + prefilled text), submits via socket. `message_updated` event → `applyMessageUpdate` reducer → bubble shows `(edited)`. REST `updateMessage` also exposed. |
| `delete(messageId)` | ✅ | Wired via socket `deleteMessageOverSocket` — invoked from `MessageActions` 3-dot → Delete for everyone. Confirmation via shared `ConfirmationDialog`. `message_deleted` event → `applyMessageDelete` reducer → bubble shows "This message was deleted" tombstone. **Works on text and all attachment types** (audio / video / image / document) — same `MessageActions` component everywhere. REST `deleteMessage` also exposed. |
| `deleteForMe(messageId)` | ✅ | Wired via socket `deleteMessageForMeOverSocket` — invoked from `MessageActions` 3-dot → Delete for me. `message_deleted_for_me` event → `applyMessageDeleteForMe` reducer → message removed from local thread only. REST `deleteMessageForMe` also exposed. |
| `addReaction` / `removeReaction` | ✅ | Wired via socket `addReactionOverSocket` / `removeReactionOverSocket`. Reaction picker popover in `MessageActions` (6 quick emojis: 👍 ❤️ 😂 😮 😢 🙏). Reaction chips render below bubble; click chip = toggle your reaction. `reaction_updated` event → `applyReactionUpdate` reducer (full array replace, server is authoritative). |
| `star` / `unstar` | ✅ | Wired via REST `starMessage` / `unstarMessage` — invoked from `MessageActions` 3-dot. Optimistic local toggle via `setMessageStarred` reducer with revert on failure. Star icon renders inline on bubble. No server broadcast event (personal flag). |
| `getStarred` | 🔌 | `listStarredMessages` in `api.ts`. No starred-messages view in UI yet. |
| `search(params)` | 🔌 | `searchMessages` in `api.ts`. Sidebar search currently filters loaded chats only; this would power proper server-side message search. |
| `getLastRead(conversationId)` | ✅ | `selectChat` thunk seeds `useChatStore.lastRead` via this on every chat open. Powers the future unread-divider + jump-to-first-unread UI. |
| `markAsRead` | ✅ | `selectChat` thunk + `new_message` socket handler (when chat is open) |
| `pin` / `unpin` | ✅ | Wired via socket `pinMessageOverSocket` / `unpinMessageOverSocket` — invoked from `MessageActions` 3-dot. Gating: DM both sides can pin; group admin-only. `message_pin_updated` event → `applyMessagePin` reducer. Pinned strip renders above ChatLog showing the latest pinned message + count; click jumps + flashes. REST `pinMessage` / `unpinMessage` also exposed. |
| `getPinned` | 🔌 | `listPinnedMessages` in `api.ts`. Currently the pinned strip derives from `chat.messages.filter(m => m.isPinned)`; could swap to a dedicated query for very long threads. |

---

## Storage API (`storageApi`)

| Method | Status | Where / Notes |
|---|---|---|
| `uploadFiles` (via `client.uploadFiles`) | ✅ | Wrapped as `uploadChatFiles(files, convId)` in `api.ts`. Used by `SendMsgForm` for attachment send. Orchestrates presigned → `platformUploadFn` → confirm internally. |
| `platformUploadFn` (XHR adapter) | ✅ | Provided in [src/lib/chat/client.ts](../../../src/lib/chat/client.ts). Browser XHR with progress events. |
| `requestPresignedUrl` / `requestPresignedUrlBatch` | ☐ | Low-level — not exposed; `uploadChatFiles` handles batching internally |
| `confirmUpload` | ☐ | Low-level — handled inside `uploadChatFiles` |
| `getFile` / `getFileUrl` | ☐ | Not exposed yet — useful when a signed URL expires mid-render |
| `deleteFile` | ☐ | No delete-attachment UI |
| `getConversationFiles` | ☐ | Could power a "Media / Files" tab in group info |
| `getMyFiles` | ☐ | — |

---

## Socket — connection

| Surface | Status | Where / Notes |
|---|---|---|
| `connectSocket(config, getToken, userId, tenantId)` | ✅ | [src/hooks/useChatClient.ts](../../../src/hooks/useChatClient.ts) — called directly (not via `client.connect()`, which doesn't forward userId/tenantId to the handshake). Reads token fresh from localStorage on every (re)connect. |
| `disconnectSocket()` | ✅ | Returned from `useChatClient`'s `useEffect` cleanup |
| `getSocket()` | ✅ | Used by AppChat to attach event listeners; surfaced via `getChatSocket()` in `api.ts` |
| `getSocketStatus()` / `onSocketStatus(listener)` | ✅ | Re-exported as `getChatSocketStatus` / `onChatSocketStatus` in `api.ts` |
| `reconnectSocket(token, userId, tenantId)` | ✅ | Re-exported as `reconnectChatSocket(...)` — available but no caller yet |
| `refreshSocketAuth()` | ✅ | Fired automatically inside the `connect_error` handler in `useChatClient` (SDK doc's recommended recipe) |
| `socketEmit.joinRoom(id)` | ✅ | AppChat calls `joinChatRoom(id)` for every chat id whenever the list changes |
| `socketEmit.leaveRoom(id)` | ☐ | Not strictly needed; disconnect on logout cleans rooms |

---

## Socket — inbound events

| Event | Status | Where / Notes |
|---|---|---|
| `new_message` | ✅ | AppChat → `receiveMessage` reducer (dedupes by id, uses `isOwn` flag from `evt.tempId`). If the conversation isn't in our list yet → triggers `fetchChatsContacts()` to refresh. |
| `message_ack` | ☐ | Needed for optimistic-send → real-id reconciliation |
| `message_delivered` / `messages_delivered` | ✅ | AppChat → `updateMessagesFeedback({isDelivered: true})`. Includes a **pending-feedback buffer** in the slice — if delivery fires before the ack callback adds the message to Redux (Socket.IO can deliver event packets ahead of the ack), the receipt is buffered by `messageId` and drained when the message is appended. Also includes a **presence cross-check** that logs `⚠ BACKEND-SUSPICIOUS` when delivery fires but no recipient is online per `useChatStore.onlineUsers`. |
| `read_receipt` | ✅ | AppChat → `updateMessagesFeedback({isSeen: true})`. **DM vs group semantics**: for DMs any read = full read (only one recipient); for groups only `fullyReadMessageIds` flips the green tick (partial reads via `updatedMessageIds` / bare `messageId` are deliberately ignored). Same buffering + presence cross-check as delivery. |
| `unread_count_changed` | ✅ | AppChat → `setUnreadCount` reducer; keeps the sidebar badge in sync across devices/tabs without REST refetch |
| `conversation_created` | ✅ | AppChat refreshes list and emits `joinRoom` so realtime events flow for newly-added conversations without reload |
| `conversation_deleted` | ✅ | AppChat refreshes list so the stale row disappears |
| `message_updated` | ☐ | Needs edit feature |
| `message_deleted` / `message_deleted_for_me` | ☐ | Needs delete feature |
| `reaction_updated` | ☐ | Needs reactions feature |
| `typing` | ⚠️ | Logged to console, not wired to UI |
| `user_status` | ⚠️ | Logged to console, not wired to UI (avatar status dots are static) |

> The temporary `socket.onAny(...)` and `[chat:trace]` / `[chat:avatar]` / `[chat:handshake]` debug logs have been removed. Only `[chat:receipt]` instrumentation remains — these are the targeted receipt-flow diagnostics described in the "Receipt flow" section below.

---

## Socket — outbound emits (`socketEmit`)

| Emit | Status | Where / Notes |
|---|---|---|
| `joinRoom` | ✅ | `joinChatRoom(id)` from api.ts; fired per chat in AppChat |
| `leaveRoom` | 🔌 | `leaveChatRoom(id)` exposed. Not strictly needed — disconnect on logout cleans rooms. |
| `sendMessage` | ✅ | `sendMessageOverSocket(payload)` from api.ts; called by `sendMsg` thunk |
| `updateMessage` | 🔌 | `updateMessageOverSocket(messageId, text)` exposed |
| `deleteMessage` | 🔌 | `deleteMessageOverSocket(messageId)` exposed |
| `deleteMessageForMe` | 🔌 | `deleteMessageForMeOverSocket(messageId)` exposed |
| `markRead` (socket variant) | 🔌 | `markReadOverSocket(convId, messageId?)` exposed. Currently using REST `markAsRead`; can switch to socket-only with this. |
| `typing` | 🔌 | `typingOverSocket(convId, isTyping)` exposed. No typing UI consumer yet. |
| `addReaction` / `removeReaction` | 🔌 | `addReactionOverSocket` / `removeReactionOverSocket` exposed |
| `pinMessage` / `unpinMessage` | 🔌 | `pinMessageOverSocket` / `unpinMessageOverSocket` exposed |
| `getOnlineUsers` | 🔌 | `getOnlineUsersOverSocket(userIds)` exposed |
| `getTypingUsers` | ☐ | Not wrapped |

---

## UI status — group info drawer ([UserProfileRight.tsx](../../../src/views/apps/chat/UserProfileRight.tsx))

| Affordance | Status | Notes |
|---|---|---|
| Group name / description display | ✅ | |
| Inline edit (pencil → TextField → Save) | ✅ | Admin-only; uses `updateGroupChat` |
| Member list with real **Admin** badge | ✅ | Driven by `adminIds` from adapter |
| "Add" button next to Members count | ✅ | Admin-only; opens search-driven picker via `searchUsers` |
| Member-row kebab (admin-only, non-self) | ✅ | Menu anchored by mouse position (anchorPosition / clientX,Y) to dodge an `e.currentTarget` invalidation issue under the Sidebar wrapper |
| ↳ Make admin / Demote | ✅ | `updateParticipantRoleInGroup` |
| ↳ Remove from group | ⚠️ | Server returns 200 but UI doesn't refresh — see "Risks" |
| Mute / Pin toggles | ✅ | Wired to `muteConversation` / `unmuteConversation` / `pinConversation` / `unpinConversation`; state read from adapter (`isMuted` / `isPinned`) |
| Danger zone: Leave / Delete | ✅ | Both use shared [`ConfirmationDialog`](../../../src/components/confirmation-dialog/index.js) (no more `window.confirm`) |

---

## Receipt flow (delivered + seen ticks)

### Tick semantics

Monotonic — once a state is true it never goes back. The recipient logging out does **not** undeliver a message; opening another chat doesn't "unsee" what was already read. Identical to WhatsApp / Telegram.

| State | Meaning | When it flips |
|---|---|---|
| Single grey tick (`isSent`) | Server accepted the message | `sendMsg.fulfilled` reducer pushes the new message |
| Double grey tick (`isDelivered`) | At least one recipient device received it | `message_delivered` event arrives **AND** at least one recipient is online per SDK presence |
| Double green tick (`isSeen`) | Read by **every** participant (groups) / the **recipient** (DMs) | `read_receipt` event arrives |

### Delivery skip policy (added 2026-05-18d)

The backend emits `message_delivered` prematurely — fires even when no recipient device is online. To avoid false "delivered" ticks, the `onMessageDelivered` / `onMessagesDelivered` handlers **skip** the dispatch when no recipient is online per `useChatStore.onlineUsers`. The tick stays at single grey ✓ until either:

- A genuine delivery event fires while a recipient is online → advances to double grey ✓✓
- A `read_receipt` event arrives → reducer sets `isSeen=true` AND `isDelivered=true` in one mutation, so the tick jumps from single ✓ straight to double-green ✓✓ (skipping the double-grey state)

This means **read_receipt is the authoritative signal**. Look for `[chat:receipt] ⚠ D1 SKIPPED` in the console when the policy fires.

### Where ticks are computed

- `sdkMessageToMessage` in [api.ts](../../../src/lib/chat/api.ts) maps `Message.status` + `Message.deliveryStatus` → `{ isSent, isDelivered, isSeen }`.
- Live updates come through `updateMessagesFeedback` in the slice. The reducer searches **all chats** by `messageId` (not the event's `conversationId`, which is unreliable — the server sometimes emits a mismatched `conversationId` for receipts).

### Send-side pipeline

1. `SendMsgForm.onSubmit` → `dispatch(sendMsg(...))`.
2. `sendMsg` thunk → `sendMessageOverSocket(payload)` → server `socketEmit.sendMessage` (ack).
3. Ack arrives in any of these shapes — `sendMessageOverSocket` normalizes them:
   - `{ message: Message }` / `{ data: Message }` / bare `Message` → unwrap directly
   - `{ success: true, messageId: string }` → synthesize a `Message` from the request payload + returned id (current server shape)
4. `sendMsg.fulfilled` reducer pushes the message and **drains any pending feedback** keyed by the new id.
5. The dedupe path also merges feedback monotonically (`existing.isDelivered || newMsg.feedback.isDelivered`) — handles the case where the broadcast echo beats the ack.

### Read-side pipeline

1. `new_message` arrives → `receiveMessage` reducer appends (with feedback merge on dedupe + pending feedback drain).
2. If the message is in the open chat → fire-and-forget `markConversationRead(conversationId)` (REST).
3. Server broadcasts `read_receipt` to participants whose own messages were read.
4. `onReadReceipt` in AppChat splits the event:
   - `fullyReadMessageIds` → always flips green
   - `updatedMessageIds` / bare `messageId` → flips green **only for DMs** (one recipient = "any read = full read")
   - Group partial reads are deliberately ignored

### Pending-feedback buffer

`state.pendingFeedback: Record<messageId, { isDelivered?, isSeen? }>` solves a Socket.IO timing race: event packets (`message_delivered`, `read_receipt`) can arrive in the same network frame as the `send_message` ack but be processed **before** the ack promise resolves. The receipt then misses because the message isn't in Redux yet. Without the buffer the tick stays single forever.

Drained at two points:
- `sendMsg.fulfilled` — when our own ack lands
- `receiveMessage` — when a broadcast appends a new message

### Diagnostic logs

All filtered by the `[chat:receipt]` prefix. They form a complete end-to-end trace for one send → delivered → read cycle.

**Full catalog with file:line references, payload shapes, and diagnostic shortcuts:** [receipt-logs-reference.md](./receipt-logs-reference.md).

Summary table:

| Tag | Where | Fires when |
|---|---|---|
| `A0` | `sendMsg` thunk | We just received the ack and resolved the new message id |
| `B0` / `B1` / `B2` | `selectChat` thunk + receive-in-open-chat handler | We sent (or skipped) `markConversationRead` (REST) → triggers server's read_receipt broadcast |
| `D1` / `D1b` | `onMessageDelivered` / `onMessagesDelivered` in AppChat | Server emitted delivery event |
| `S0` / `S1` / `S2` / `S2a` / `S3` | `onReadReceipt` in AppChat | Server emitted read_receipt; `S2` shows DM vs group split |
| `R0` / `R2` / `R2a` / `R3` | `updateMessagesFeedback` reducer | Match across all chats; `R2a` = buffered into pending; `R3` = open chat mirrored |
| `7d.drain` / `R1.drain` / `7c.feedback-merge` / `R1c.feedback-merge` | Slice reducers | Buffered feedback applied or merged |
| `⚠ … BACKEND-SUSPICIOUS` | Delivery / receipt handlers | Server emitted delivery/read while no recipient is online per SDK presence — likely server semantic bug |

### Known server-side quirks (we work around)

1. **Ack is lightweight.** Server returns `{success: true, messageId}` not a full `Message`. We synthesize.
2. **`read_receipt.conversationId` is sometimes wrong.** Reducer searches across all chats by `messageId` instead of trusting the event field.
3. **`fullyReadMessageIds` empty in DMs.** Backend sends ids only in `messageId` for DM receipts. We accept any field for DMs because there's only one recipient.
4. **Delivery events may fire even when recipient is offline.** Flagged by the presence cross-check warning — server semantic bug to file with backend if it appears.

---

## Environment

| Env var | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_CHAT_API_URL` | ✅ | REST base URL, e.g. `https://genai-api.dev.antzsystems.com/chat-api/api/v1`. The socket URL is derived from this (strip `/api/vN`). |
| `NEXT_PUBLIC_CHAT_WS_URL` | — | Removed. WS URL is now auto-derived from `NEXT_PUBLIC_CHAT_API_URL`. |

---

## Risks / Known gaps

- **`removeParticipant` UI doesn't refresh.** The backend soft-deletes by flipping `isActive: false` on the participant entry (it stays in the array). Adapter now filters by `isActive !== false`, and the thunk dispatches `addOrReplaceChat` with the adapted result — but the member list still shows the removed user. Likely root cause: `addOrReplaceChat` reducer replaces `state.chats[idx]` but `state.selectedChat.contact` keeps the old reference. Next step is to also sync `selectedChat.contact` whenever the replaced chat is the open one, or have the thunk dispatch `setSelectedChat(chatId)` after the replace.
- **`getMembers` has no consumer.** The thunk is wired but the member list is still built from the embedded `conv.participants` array via the adapter. Could swap to `getMembers` if we want full User objects (avatars, statuses) for member rows.
- **WSO2 access-token rotation.** SDK seeds its token store from `authToken` at construction. We do call `refreshSocketAuth()` inside `connect_error` for the socket, but the REST axios instance still holds the original token until the singleton is re-created. Next step: when AuthContext emits a fresh token, call `disposeChatClient()` + re-init.
- **`status: "active"` on messages.** Backend returns a richer `status` enum than the SDK types; `deliveryStatus` is the real source of truth for ticks. Adapter handles this.
- **Participant shape.** Backend returns `displayName` / `username` flat on `participant`, SDK types model them under `participant.user`. Adapter normalises both shapes. Also filters `isActive === false` participants out of `participantIds`, `adminIds`, and the derived contact directory.
- **`senderId` mismatch.** Server sometimes returns the numeric WSO2 user_id on `senderId` while `userProfile.id` is the chat backend's ObjectId. `sendMsg` thunk overrides `senderId` to the current user's profile id; `receiveMessage` accepts an `isOwn` flag (set when `evt.tempId` is present) to do the same for socket echoes. `sendMsg.fulfilled` also reconciles by id if the broadcast wins the race.
- **Message-time fallback.** Socket acks occasionally lack `sentAt`/`createdAt` — adapter falls back to `new Date().toISOString()` so date formatters don't choke.
- **ID widening.** `ChatEntityId = string | number` during the migration. Once mock seed data is fully retired this can narrow to `string`.
- **`createGroup` doesn't filter current user.** The picker in `CreateGroupDrawer` shows the current user in the list. Backend auto-adds the creator anyway, but UX-wise we should filter them out.

---

## SDK 1.0.6 breaking changes (the ones we already absorbed)

| Change | Impact | Our handling |
|---|---|---|
| `searchUsers` moved from `conversationsApi` → `usersApi.list({ query })` | Runtime `TypeError` on any user search | `api.ts` `searchUsers` rewrapped over `users.list({ query }).data`. Same `(query) => User[]` signature for callers. |
| `Conversation.icon` field removed (only `iconUrl` remains) | TS error `Property 'icon' does not exist on Conversation` | Dropped from `sdkConversationToChat` and from `ChatsArrType` assignment. Avatar resolution uses `iconUrl` only. |
| `CreateGroupData.icon` removed | TS error on `createGroupConversation({ icon })` | Dropped from `createGroupChat` thunk. CreateGroupDrawer still **collects** an icon URL but it's not sent server-side. Proper icon flow now needs separate `uploadConversationIcon(groupId, fileId)` after group creation — not wired yet. |
| `UpdateConversationData.icon` removed | TS error on `updateConversation({ icon })` | Dropped from `updateGroupChat` thunk. Icon updates also need `uploadConversationIcon`. |
| Socket `connectSocket` arity reduced to `(config, getToken)` | Server rejected handshake with `"userId is required"` | `useChatClient` now passes `userId` + `tenantId` inside the `config` object instead of as positional args. |
| `devicesApi` is module-level export, not on `AntzChatClient` | TS error `Property 'devices' does not exist on AntzChatClient` | `registerDevice` / `removeDevice` in `api.ts` import `sdkDevicesApi` directly; `requireClient()` still gates on SDK initialization. |

---

## Changelog

- **2026-05-18d** — Policy change: **`read_receipt` is now the authoritative signal for tick advancement.** `message_delivered` / `messages_delivered` events are now **skipped** when no recipient is online per `useChatStore.onlineUsers` (the backend over-eagerly stamps delivered even with no recipient device active). Tick stays single ✓ until a real `read_receipt` arrives, at which point it jumps directly to double-green ✓✓ (reducer sets `isSeen=true` AND `isDelivered=true` in one mutation). Console: look for `[chat:receipt] ⚠ D1 SKIPPED` when the policy fires.
- **2026-05-18c** — Receipt-flow verified end-to-end on a live two-user test (A↔B DM and a group). Full trace logs captured: send anchor (A0) → delivery race with buffered drain (D1 → R2 0/1 → R2a buffered → A0 → 7d.drain) → read receipt with DM-vs-group split (S1 → S2 → S3 → R2 1/1 → R3). Temporary `[chat:receipt] V1 renderMsgFeedback` log removed from `ChatLog.tsx` after confirming green-tick render works. New deep-dive log catalog: [receipt-logs-reference.md](./receipt-logs-reference.md).
- **2026-05-18b** — Doc accuracy + SDK 1.0.6 breaking-change absorption:
  - `api.ts` reorganized into clearly-labeled sections per SDK module (auth / conversations / messages / users / devices / storage / socket-emit / socket-status / adapters).
  - Added **REST wrappers** for previously-unexposed SDK endpoints (no UI consumers yet, but discoverable from the facade): `uploadAvatar`, `getConversationUnreadCount`, `getUnreadSummary`, `uploadConversationIcon`, `getMessage`, `updateMessage`, `deleteMessage`, `deleteMessageForMe`, `addMessageReaction`, `removeMessageReaction`, `starMessage`, `unstarMessage`, `listStarredMessages`, `searchMessages`, `getLastRead`, `pinMessage`, `unpinMessage`, `listPinnedMessages`, `listUsers`, `getUserById`, `getUserLastSeen`, `getUserPreferences`, `updateUserPreferences`, `registerDevice`, `removeDevice`.
  - Added **socket-emit wrappers** alongside REST equivalents: `typingOverSocket`, `markReadOverSocket`, `updateMessageOverSocket`, `deleteMessageOverSocket`, `deleteMessageForMeOverSocket`, `addReactionOverSocket`, `removeReactionOverSocket`, `pinMessageOverSocket`, `unpinMessageOverSocket`, `getOnlineUsersOverSocket`.
  - Re-exported the missing SDK types: `ConversationListParams`, `ConversationUnreadCount`, `UnreadSummary`, `SearchParams`, `UserPreferences`, `FileResponse`, `FileType`, `PresignedUrlRequest`, `PresignedUrlResponse`, `RegisterDeviceTokenPayload`, `MobileDeviceToken`, `WebPushDeviceToken`.
  - `fetchChatsContacts` no longer caps at `{ page: 1, limit: 50 }` — calls `listConversations()` so server returns all matching conversations in one response (per SDK doc Step 6 "Pagination is optional"). Users with >50 chats no longer lose anything.
  - `listConversations` signature widened to accept full `ConversationListParams` (server-side filters: type / isPinned / isMuted / hasUnread / search / role / hasAttachments / attachmentType / notificationsEnabled). Still unused by UI (sidebar filters remain client-side) but available.
  - Stale comments in `ComposePopover` / `CreateGroupDrawer` updated to reference `users.list({ query })` instead of the removed `conversations.searchUsers`.
  - **Socket userId fix** — `useChatClient` was passing `userId` / `tenantId` as positional args to `connectSocket(config, getToken, userId, tenantId)` but the SDK signature is only `(config, getToken)`. Server rejected handshake with `"userId is required"`. Moved both fields **into** `config`; removed the extra positional args.
  - Added end-to-end `[chat:receipt]` verification logs covering A0 (send anchor) → B1/B2 (markConversationRead) → S1/S2/S2a/S3 (read_receipt inbound + DM/group split) → R0/R2/R2a/R3 (reducer match + drain into pendingFeedback + selectedChat mirror) → D1/D1b (delivery events). Filter with `chat:receipt` in DevTools to trace one send → delivered → read cycle.
- **2026-05-18** — Receipt-flow hardening on SDK `1.0.6`:
  - `sendMessageOverSocket` now handles the lightweight `{success, messageId}` ack shape by synthesizing a Message from the request payload.
  - New `state.pendingFeedback` buffer in the slice — receipts that arrive before the ack callback are stored by `messageId` and drained when the message lands. Fixes the "tick stuck on single" timing race.
  - `updateMessagesFeedback` reducer searches all chats by `messageId` instead of trusting the event's `conversationId` (which the backend sometimes emits wrong).
  - Dedupe paths in `receiveMessage` and `sendMsg.fulfilled` now **merge** feedback monotonically instead of dropping it on the echo.
  - `onReadReceipt` splits DM vs group semantics: groups use only `fullyReadMessageIds` for the green tick; DMs accept any read id (single recipient = full read).
  - Added `useChatStore.lastRead` seeding via `getLastRead()` in `selectChat` (powers future jump-to-first-unread UI).
  - Added `conversation_created` / `conversation_deleted` socket listeners — runtime group membership changes now reflect without page reload.
  - Added `unread_count_changed` listener + `setUnreadCount` reducer — multi-device unread badge sync.
  - Added presence cross-check (`useChatStore.onlineUsers`) on delivery / read events; logs `⚠ BACKEND-SUSPICIOUS` when server fires receipts while recipient is offline.
  - Removed `onAny` debug listener, `[chat:trace]`, `[chat:avatar]`, `[chat:handshake]`, `[chat:lastRead]` debug logs. Only `[chat:receipt]` instrumentation remains.
- **2026-05-16** — Upgraded SDK `1.0.0` → `1.0.2`. Deleted `src/lib/chat/socket.ts` wrapper (path-prefix bug fixed natively). Merged `adapters.ts` into `api.ts`. Send now goes via socket (`sendMessageOverSocket`) instead of REST. Wired `refreshSocketAuth()` on `connect_error`. Conversation list auto-refreshes on socket connect + on `new_message` for unknown conversations. Dropped `NEXT_PUBLIC_CHAT_WS_URL` env var (derived from API URL).
