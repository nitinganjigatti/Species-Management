# `@antzsoft/chat-core` — Integration Status

Tracks which SDK methods are wired into the app today and which still need work. The full SDK reference (signatures, types, examples) lives in [antzsoft-chat-core.md](./antzsoft-chat-core.md); architecture overview in [chat-core-starter.md](./chat-core-starter.md).

**Currently on `@antzsoft/chat-core@1.0.2`** (path-prefix socket bug fixed → custom socket wrapper deleted; SDK handles connect / disconnect / reconnect natively).

Legend: ✅ wired · ☐ pending (needs UI or no consumer yet) · ⚠️ partial / known gap

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
| `login` | ☐ | Not used — WSO2 owns auth, JWT is passed via `authToken` config |
| `register` | ☐ | Same as above |
| `refresh` | ⚠️ | Not wired. SDK's internal refresh hits `/auth/refresh` (doesn't exist on our chat backend). The new `refreshSocketAuth()` only handles the socket side. |
| `logout` / `logoutAll` | ☐ | — |

---

## Conversations API (`conversationsApi`)

| Method | Status | Where / Notes |
|---|---|---|
| `list` | ✅ | `fetchChatsContacts` thunk — fetches `{ page: 1, limit: 50 }`. Auto re-fired on socket connect and on `new_message` for an unknown conversation. |
| `get` | ✅ | `fetchConversation` thunk — refresh single conversation by id |
| `createGroup` | ✅ | `createGroupChat` thunk; dispatched from `CreateGroupDrawer` |
| `createDirect` | ✅ | `startDirectChat` thunk — idempotent, fired from compose popover |
| `update` | ✅ | `updateGroupChat` thunk; inline edit of group name + description in [UserProfileRight.tsx](../../../src/views/apps/chat/UserProfileRight.tsx) (admin-only) |
| `delete` | ✅ | `deleteConversation` thunk; "Delete group" in danger zone (admin-only on backend) |
| `addParticipants` | ✅ | `addParticipantsToGroup` thunk; "Add" flow uses `searchUsers` |
| `removeParticipant` | ⚠️ | `removeParticipantFromGroup` thunk wired; member-row kebab → "Remove from group". **Known bug:** UI does not refresh after backend confirms — see "Risks" |
| `updateParticipantRole` | ✅ | `updateParticipantRoleInGroup` thunk; member-row kebab → "Make admin / Demote to member" |
| `mute` / `unmute` | ✅ | `muteConversation` / `unmuteConversation` thunks; toggle in group actions |
| `pin` / `unpin` | ✅ | `pinConversation` / `unpinConversation` thunks; toggle in group actions |
| `leave` | ✅ | `leaveGroupChat` thunk; "Leave group" in danger zone, uses shared `ConfirmationDialog` |
| `getMembers` | ✅ | `getGroupMembers` thunk; raw return — no consumer in UI yet (member list still derived from `conv.participants`) |
| `searchUsers` | ✅ | Used by Compose popover, CreateGroupDrawer member picker, and group "Add members" flow. Debounced 300ms; empty string returns full user list |

---

## Messages API (`messagesApi`)

| Method | Status | Where / Notes |
|---|---|---|
| `list` | ✅ | `selectChat` thunk — limit 50, reversed for chronological render |
| `get` | ☐ | — |
| `send` | ✅ | **Now via Socket.IO** (`socketEmit.sendMessage`), not REST. `sendMsg` thunk → `sendMessageOverSocket(payload)` → ack-based promise. tempId generated client-side for dedup against the broadcast echo. |
| `update` | ☐ | No edit UI yet |
| `delete` | ☐ | No delete UI yet |
| `addReaction` / `removeReaction` | ☐ | No reaction picker UI |
| `star` / `unstar` / `getStarred` | ☐ | No star UI |
| `search` | ☐ | Sidebar search currently filters loaded chats only |
| `markAsRead` | ✅ | `selectChat` thunk + `new_message` socket handler (when chat is open) |
| `pin` / `unpin` / `getPinned` | ☐ | No pin UI |

---

## Storage API (`storageApi`)

| Method | Status | Where / Notes |
|---|---|---|
| `requestPresignedUrl` | ☐ | No attachment send UI |
| `requestPresignedUrlBatch` | ☐ | — |
| `confirmUpload` | ☐ | Required after every binary upload completes |
| `getFile` | ☐ | — |
| `getFileUrl` | ☐ | Refresh expired signed URL for existing file |
| `deleteFile` | ☐ | No delete-attachment UI |
| `getConversationFiles` | ☐ | Could power a "Media / Files" tab in group info |
| `getMyFiles` | ☐ | — |
| `uploadBatch` (helper) | ☐ | Orchestrates presigned + XHR + confirm; calls our `platformUploadFn` |
| `platformUploadFn` (XHR adapter) | ✅ | Provided in [src/lib/chat/client.ts](../../../src/lib/chat/client.ts) — wired but unexercised until upload UI exists |

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
| `message_delivered` / `messages_delivered` | ✅ | AppChat → `updateMessagesFeedback({isDelivered: true})` |
| `read_receipt` | ✅ | AppChat → `updateMessagesFeedback({isSeen: true})`; handles single / `updatedMessageIds[]` / `fullyReadMessageIds[]` shapes |
| `message_updated` | ☐ | Needs edit feature |
| `message_deleted` / `message_deleted_for_me` | ☐ | Needs delete feature |
| `reaction_updated` | ☐ | Needs reactions feature |
| `typing` | ⚠️ | Logged to console, not wired to UI |
| `user_status` | ⚠️ | Logged to console, not wired to UI (avatar status dots are static) |

> Temporary `socket.onAny(...)` debug listener is active in [AppChat.tsx](../../../src/views/apps/chat/AppChat.tsx) — remove once all event names are confirmed in production.

---

## Socket — outbound emits (`socketEmit`)

| Emit | Status | Where / Notes |
|---|---|---|
| `joinRoom` | ✅ | `joinChatRoom(id)` from api.ts; fired per chat in AppChat |
| `leaveRoom` | ☐ | Not strictly needed |
| `sendMessage` | ✅ | `sendMessageOverSocket(payload)` from api.ts; called by `sendMsg` thunk |
| `updateMessage` / `deleteMessage` / `deleteMessageForMe` | ☐ | — |
| `markRead` (socket variant) | ☐ | Currently using REST `markAsRead` |
| `typing` | ☐ | — |
| `addReaction` / `removeReaction` | ☐ | — |
| `pinMessage` / `unpinMessage` | ☐ | — |
| `getOnlineUsers` / `getTypingUsers` | ☐ | — |

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
- **`onAny` debug listener** still active in AppChat. Remove once event names are confirmed in prod.

---

## Changelog

- **2026-05-16** — Upgraded SDK `1.0.0` → `1.0.2`. Deleted `src/lib/chat/socket.ts` wrapper (path-prefix bug fixed natively). Merged `adapters.ts` into `api.ts`. Send now goes via socket (`sendMessageOverSocket`) instead of REST. Wired `refreshSocketAuth()` on `connect_error`. Conversation list auto-refreshes on socket connect + on `new_message` for unknown conversations. Dropped `NEXT_PUBLIC_CHAT_WS_URL` env var (derived from API URL).
