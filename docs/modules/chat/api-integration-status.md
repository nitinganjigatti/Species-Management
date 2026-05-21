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
| `addParticipants(id, ids, role?)` | ✅ | `addParticipantsToGroup` thunk; "Add" flow uses `searchUsers`. v1.1.3 `role?: 'admin' \| 'member'` wired — UI has an "Add as admin" Switch (default member). |
| `removeParticipant` | ⚠️ | `removeParticipantFromGroup` thunk wired; member-row kebab → "Remove from group". **Known bug:** UI does not refresh after backend confirms — see "Risks" |
| `updateParticipantRole` | ✅ | `updateParticipantRoleInGroup` thunk; member-row kebab → "Make admin / Demote to member" |
| `mute` / `unmute` | ✅ | `muteConversation` / `unmuteConversation` thunks; toggle in group actions |
| `pin` / `unpin` | ✅ | `pinConversation` / `unpinConversation` thunks; toggle in group actions. **v1.1.3 max-5 cap** gated client-side via `getAppConfig()` before the dispatch — toast shown instead of letting the server 400. |
| `leave(id, andDelete?)` | ✅ | Three-tier UI in danger zone: **Exit group** → `leaveConversation(id)` + refetch; **Exit and delete** → `leaveAndDeleteConversation(id)` (= `leave(id, true)`) + `removeChatFromList` + `fetchChatsContacts`; **Delete group** (gated by `!isCurrentUserActive`) → existing `deleteConversation` thunk. |
| `getMembers` | ✅ | `getGroupMembers` thunk; raw return — no consumer in UI yet (member list still derived from `conv.participants`) |
| `getUnreadCount(id)` | 🔌 | Exposed as `getConversationUnreadCount` — single-conversation badge refresh after foreground / reconnect |
| `getUnreadSummary()` | 🔌 | Exposed in `api.ts`. Source of truth for cold-start / post-reconnect unread totals across all conversations |
| `uploadIcon(id, fileId)` | ✅ | Wired through `GroupIconEditor` → `uploadGroupIcon` thunk → `client.uploadIcon` (presigned-URL + S3 + setIcon in one shot). Triggered from the WhatsApp-style avatar menu's "Upload photo" item. |
| `removeIcon(id)` | ✅ | New `removeConversationIcon` wrapper. Triggered from the avatar menu's "Remove photo" item → custom minimal confirm Dialog → response feeds `addOrReplaceChat` + `clearChatAvatar` (explicit clear is necessary because the addOrReplaceChat merge preserves the existing icon when the server response omits iconUrl). |

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

## App config API (`appConfigApi`)

| Method | Status | Where / Notes |
|---|---|---|
| `get()` | ✅ | Wired via [`getAppConfig`](../../../src/lib/chat/api.ts) (module-level cache). Returns `{ maxPinnedConversations }`. Used by `UserProfileRight` to gate the Pin-to-top Switch before the server can 400 on a 6th pin. |

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

> **REST vs socket split — by SDK design.** The SDK only exposes socket emits for **message-level operations** (send, edit, delete, react, pin, mark-read, typing, presence query) plus room subscription. **Conversation- and participant-level mutations** (add/remove participant, leave, delete conversation, upload/remove icon, update group name/description, mute, pin chat) are **REST-only** — there are no `add_participant` / `remove_participant` / `leave_conversation` / `delete_conversation` / `upload_icon` / `remove_icon` / `update_conversation` socket emits anywhere in the SDK source (verified against `node_modules/@antzsoft/chat-core/dist/index.js` lines 1205-1265). The flow for those operations is intentional: client → REST → server → **server broadcasts** the result to all members over socket (`participant_joined`, `participant_left`, `conversation_updated`, `conversation_created`, `conversation_deleted`). Our actor-side update comes from the REST response; other members update via the broadcast → existing listeners in [`AppChat`](../../../src/views/apps/chat/AppChat.tsx). Don't try to synthesize socket emits for these — they will be silently dropped on the server.

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

## UI status — per-message interactions

WhatsApp-Web layout — the chevron 3-dot menu sits **INSIDE** the bubble's top-right corner, and the reaction picker (😀) sits **OUTSIDE** the bubble, vertically centered on the inside-facing edge. The two surfaces are split into two components so callers can position them independently:

- [src/views/apps/chat/MessageActions.tsx](../../../src/views/apps/chat/MessageActions.tsx) — chevron menu + delete confirmation dialog.
- [src/views/apps/chat/MessageReactionPicker.tsx](../../../src/views/apps/chat/MessageReactionPicker.tsx) — standalone 😀 trigger + 6-emoji quick-pick popover.

Both share the same `.msg-actions` CSS class so the parent reveals them together on bubble hover (`&:hover .msg-actions { opacity: 1; pointer-events: auto }`).

| Affordance | Status | Notes |
|---|---|---|
| Chevron menu inside bubble top-right (text) | ✅ | Absolutely positioned at `top: 2, right: 2` inside the text bubble in [`MessageBubble`](../../../src/views/apps/chat/MessageBubble.tsx). Bubble has `pr: 7` to reserve space so the chevron doesn't overlap text. |
| Chevron menu inside attachment top-right | ✅ | Same pattern in [`ChatLog`](../../../src/views/apps/chat/ChatLog.tsx) attachment-only branch. Audio container uses `pt: 5` so the chevron sits cleanly above the audio control row. |
| Chevron contrast on green / white-audio bg | ✅ | Chevron icon is `common.white` with a translucent dark circle backdrop (`rgba(0,0,0,0.32)` sender / `rgba(0,0,0,0.45)` receiver) so it reads against the bubble color AND any embedded white element (audio control, PDF preview, light image). |
| Reaction picker outside bubble (centered) | ✅ | `MessageReactionPicker` rendered as a flex sibling of the bubble column. Outer row uses `flex-direction: isSender ? 'row-reverse' : 'row'` so the 😀 visually sits on the LEFT of sender (green) bubbles and the RIGHT of receiver (white) bubbles — i.e. always on the inside-facing edge. |
| Reaction chips below bubble | ✅ | Chip per emoji, count visible, highlighted if user reacted. Click chip = toggle. |
| Reply (composer banner + bubble snippet) | ✅ | `setReplyingTo` Redux state. Banner with cancel ✕ above the input. Inside reply bubble: left accent + sender name + 2-line preview, click snippet scrolls + flashes original (`msg-flash` CSS in [custom.css](../../../styles/custom.css)). |
| Edit (own text messages only) | ✅ | `setEditingMessage` Redux state. Warning-color banner above input prefilled with original. Submit branches to `updateMessageOverSocket` (no REST fallback). Bubble shows `(edited)` after broadcast. **Hidden once `editWindowSeconds` elapses since send** — see "Time-window gating" below. |
| Star / Unstar | ✅ | Personal (no server broadcast). Optimistic local toggle. Star icon renders inline on bubble. |
| Pin / Unpin | ✅ | DM: both sides; group: admin-only. Pinned strip renders above ChatLog showing latest pinned + count, click jumps. |
| Copy text | ✅ | Hidden for attachment-only bubbles via `showCopyText={false}`. |
| Delete for me | ✅ | Same `MessageActions` for all message types. Shared `ConfirmationDialog`. Removes from local thread only. **Always available** (no time gate). |
| Delete for everyone (own messages) | ✅ | Same flow. Server broadcasts → tombstone "This message was deleted" replaces the bubble for all participants. Works on text and all attachment types. **Hidden once `deleteWindowSeconds` elapses since send.** |
| Reactions toggle (add + remove) | ✅ | Single `addReactionOverSocket` call drives both — the server treats a re-emit with the same emoji as a toggle. State on every participant lands via `reaction_updated` broadcast → `applyReactionUpdate` reducer. No `remove_reaction` socket emit and no REST fallback needed. |

#### Time-window gating ([MessageActions.tsx:74-98](../../../src/views/apps/chat/MessageActions.tsx#L74-L98))

The backend returns `Conversation.settings.messageConfig` with two seconds-since-send windows: `editWindowSeconds` (e.g. `900` = 15 min) and `deleteWindowSeconds` (e.g. `216000` = 60 hr). Tenant-tunable on the server.

- Adapter maps them onto `ChatsArrType.editWindowSeconds` / `.deleteWindowSeconds` ([api.ts:744-751](../../../src/lib/chat/api.ts#L744-L751)).
- `MessageActions` reads both from `selectedChat.contact` via Redux and computes `canEdit` / `canDeleteForEveryone` by comparing `chat.time` against `Date.now()` with the per-window offset.
- Backwards-safe: `undefined` window → no restriction → action always allowed (same as legacy behavior).
- Fail-closed on malformed `chat.time` (NaN parse → treat as expired) so we don't enable an action on bogus data.
- The check evaluates on render — if the menu is held open past the cutoff, the item stays clickable. Server still enforces its own policy on `update_message` / `delete_message` and the existing `.catch` toasts on rejection. Gate is purely UX.

### Component map

```
MessageBubble                              ← outer flex row, position: relative
  ├─ bubble Box (position: relative)       ← rounded message box
  │    ├─ MessageActions (abs top-right)   ← chevron menu INSIDE bubble
  │    ├─ reply snippet                    ← optional
  │    ├─ text + inline pin/star/edited
  │    └─ reactions chips row
  └─ MessageReactionPicker                 ← 😀 OUTSIDE bubble, centered

ChatLog (attachment-only path)             ← outer flex row, position: relative
  ├─ attachment column (position: relative)
  │    ├─ MessageActions (abs top-right)   ← chevron menu INSIDE first attachment
  │    └─ attachment Box(es)               ← image / video / audio / document
  └─ MessageReactionPicker                 ← 😀 OUTSIDE column, centered
```

### Voice messages

Recording happens inline in [SendMsgForm.tsx](../../../src/views/apps/chat/SendMsgForm.tsx):

1. Click 🎤 button — calls `navigator.mediaDevices.getUserMedia({ audio: true })`
2. `MediaRecorder` picks the best supported MIME from a priority list: `audio/webm;codecs=opus` → `audio/webm` → `audio/mp4` → `audio/ogg;codecs=opus` (Safari falls through to `audio/mp4`)
3. Composer overlays a recording UI: pulsing red dot + `mm:ss` timer + ⏹ Stop + ✕ Cancel
4. On Stop, the Blob's reported mimeType is normalized — strip everything after `;` so `audio/webm;codecs=opus` becomes `audio/webm` (server allow-lists reject the codec suffix)
5. Recording becomes a regular `File` and enters the `pending[]` strip with `kind: 'audio'` — shows an inline `<audio controls>` preview chip
6. Click Send → flows through `uploadChatFiles` like any other attachment (no audio-specific code path)
7. On the receive side, `ChatLog` renders incoming audio attachments with `<audio controls controlsList='nodownload noplaybackrate'>` at a fixed 280px width on a light-tinted background (so the browser's dark default audio controls remain legible inside the green sender bubble)

### Attachment preview — view-only, no downloads

WhatsApp-Web-style in-page preview for image / video / PDF / other documents. New component: [src/views/apps/chat/AttachmentPreviewDialog.tsx](../../../src/views/apps/chat/AttachmentPreviewDialog.tsx). Clicking any attachment bubble in `ChatLog` opens this fullscreen overlay instead of routing the user to the raw S3 URL in a new tab.

**No download paths are surfaced to the user.** Every casual save route is blocked at the client level:

| Surface | Blocked? | How |
|---|---|---|
| App-level download button | ✅ | No `<a href download>` / no anchor wrappers anywhere in `ChatLog`; clicks open the dialog instead |
| Video `<video controls>` overflow → Download | ✅ | `controlsList='nodownload noplaybackrate'` |
| Audio `<audio controls>` overflow → Download | ✅ | `controlsList='nodownload noplaybackrate'` |
| PDF viewer toolbar (Chrome/Edge) | ✅ | `#toolbar=0&navpanes=0&scrollbar=0` URL fragment appended to the iframe src — hides toolbar, download, print, navpanes, scrollbar |
| Right-click → "Save image as" | ✅ | `onContextMenu={e => e.preventDefault()}` at the Dialog root + on every media element |
| Image drag-to-desktop | ✅ | `draggable={false}` + `WebkitUserDrag: none` |
| Text/image selection in dialog | ✅ | `userSelect: none` on Dialog root |
| Keyboard `Ctrl/Cmd + S` (save page) | ✅ | `window.keydown` listener with `preventDefault()` while dialog is open |
| Keyboard `Ctrl/Cmd + P` (print) | ✅ | Same listener |
| DevTools → Network → Save resource | ❌ unblockable | Inherent web limitation — same as WhatsApp Web. Would require DRM or server-streamed bytes without exposing the URL. |
| Firefox / Safari PDF viewer toolbar | ⚠️ partial | Those browsers use their own PDF viewers that ignore `#toolbar=0`. Bundling PDF.js (~1MB) would fix this; not done. |

**UX details — modelled on WhatsApp Web:**

- Fullscreen Dialog (`fullScreen` MUI prop), near-black backdrop (`rgba(0,0,0,0.95)`)
- Header overlay (gradient): filename + file size + close ✕
- **Image**: centered, fits viewport, click toggles zoom in. Floating bottom toolbar with Zoom out / `Math.round(zoom * 100)%` / Zoom in (50%–400% range, 25% steps) and Rotate (90° increments). Transform applies via CSS `transform: scale() rotate()` with 200ms ease.
- **Video**: centered, native controls with download + playback-rate hidden, right-click suppressed
- **PDF**: iframe with `#toolbar=0&navpanes=0&scrollbar=0`
- **Other documents** (.docx, .xlsx, etc.): file-info card with icon + filename + "Preview not available for this file type" — no link, no download, no fallback open-in-new-tab

**Wiring in [ChatLog.tsx](../../../src/views/apps/chat/ChatLog.tsx):**

```ts
const [previewAttachment, setPreviewAttachment] = useState<ChatAttachmentType | null>(null)
const openPreview = (att) => setPreviewAttachment(att)

// Each attachment Box now uses onClick={() => openPreview(att)}
// (replacing the previous <a target='_blank'> / <a download> wrappers).
// One <AttachmentPreviewDialog> mounted at the bottom of ChatLog.
```

### ChatLog scroll-container stability

[`ChatLog`](../../../src/views/apps/chat/ChatLog.tsx) used to define an inner `ScrollWrapper` component **inside** its render function. Because the function reference was new on every render, React's reconciler treated each `<ScrollWrapper>` element as a different component type and unmounted + remounted the entire `PerfectScrollbar` subtree on every Redux state change (sends, receipts, reactions, edits, deletes, pins, stars). Each remount reset `scrollTop` to 0 and the `scrollToBottom` raf passes then yanked the chat back down — the visible effect was a brief flash-to-top on every send.

Fix: the `hidden ? <Box> : <PerfectScrollbar>` conditional is now inlined directly in `ChatLog`'s return statement. React sees the same `<PerfectScrollbar>` element type across renders and reuses the instance. Side benefits:

- `chatArea.current` ref stays stable → `scrollToBottom`, `triggerLoadOlder`, pagination anchor restoration all work reliably.
- `messageRefs` Map of `msg-id → DOM element` is no longer cleared and rebuilt every render → search "jump to match" scrolls reliably.
- ~50 message bubbles are no longer re-created from scratch on every Redux update — measurable perf win on active chats.

General rule: never define a React component inside another component's render. The two look similar but trigger a full remount of the inner subtree on every outer render.

### Lightweight ack normalization

When the server returns `{success: true, messageId: '...'}` instead of a full `Message`, [`sendMessageOverSocket`](../../../src/lib/chat/api.ts) synthesizes a Message from the request payload. The `SendMessageAttachment[]` payload uses `fileId`, so we map `fileId → id` while building the synthetic `content.attachments` — otherwise every newly-sent attachment would land in Redux with `id: undefined`, breaking React keys, reactions, pin, and any other operation that addresses an attachment by id.

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
5. **Some socket emits process successfully but never send an ack frame.** Affects `delete_message` (and previously `remove_reaction`). The SDK's `withAck` rejects with `"Socket ack timeout: <event>"` even though the broadcast for that event fans out correctly. We work around by emitting **fire-and-forget** on the raw socket for these specific events instead of going through the SDK's ack-based emitter. State for both sender and receivers still lands via the corresponding `*_updated` / `*_deleted` broadcast. Reactions sidestep this entirely by using `add_reaction` as a toggle (no `remove_reaction` emit needed).
6. **`message_deleted` is broadcast only, not stored as a query-able event.** On REST re-fetch (refresh / pagination), the server returns the deleted row with `status: 'deleted'` and (presumably) null content. Our adapter detects this status and produces the same tombstone state that `applyMessageDelete` produces live.
7. **`conversation_updated` is not broadcast for icon-only changes.** We work around by dispatching the updated `Conversation` from `client.uploadIcon`'s response straight into `addOrReplaceChat` (which now also syncs `selectedChat`). Other participants get the change via `conversation_updated` if/when the server emits it, or on their next `fetchChatsContacts`.
8. **`GET /conversations` omits `senderId` + `sender.displayName` on `lastMessage`.** Returns `senderId: ''` (empty string) and no `sender` object. Sidebar's WhatsApp-style "Saket: …" prefix can't render on a hard refresh without this. We work around by firing `enrichLastMessageSenders` thunk after every `fetchChatsContacts` — fetches full message details via `getMessage(id)` per group in parallel and backfills via `patchLastMessageSender`. Module-level cache prevents refetching the same message across the session. **Cleanup**: when backend ships sender details on the list response, the `enrichLastMessageSenders` thunk self-deprecates (targets filter to empty).
9. **`SDK 1.0.7` defaults `transitEncryption: true` but the server doesn't honor it.** Passing `false` explicitly to `AntzChatClient` in [client.ts](../../../src/lib/chat/client.ts) is required until `TRANSIT_ENCRYPTION_ENABLED=true` on the backend.
10. **`Participant-mutation endpoints (`addParticipants`, `removeParticipant`, `updateRole`, `updateConversation`) sometimes omit `iconUrl` in the response.** `addOrReplaceChat` reducer at [store/apps/chat/index.ts:1196+](../../../src/store/apps/chat/index.ts) falls back to `existing.avatar` when `incoming.avatar` is empty. Same shape used for `lastMessage` sender-fields same-id merging.

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
- **`platformCompressFn` intentionally NOT registered on the SDK client.** SDK signature is `(file: UploadableFile, options: ResolvedCompressionConfig) => Promise<CompressedFile>` where `UploadableFile` is `{ uri, name, type, size }` — i.e. no binary, the SDK passes a uri. Our `maybeCompressImage` operates on `File` directly. Adapting the SDK callback would require fetching the blob from the uri on every upload, defeating the point. Instead we compress manually in each caller (`SendMsgForm`, `GroupIconEditor`, `CreateGroupDrawer`) BEFORE wrapping the result into `UploadableFile`. The SDK still falls back to "upload original if compressed is larger" internally; we just don't surface compression metadata via the formal hook. Re-evaluate if the SDK ever exposes a `File`-shaped variant.

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

- **2026-05-21** — v1.1.3 leave/delete + per-chat drafts + audio duration + pin cap + add-as-admin + WhatsApp group-icon UX + component extractions + live presence + presence cold-seed + group-header member list + DM "Delete chat" reappear flow + `participant_joined` socket listener + server-side sidebar search + ChatLog Fragment key fix:
  - **Presence cold-seed via `getOnlineUsers`** ([`AppChat`](../../../src/views/apps/chat/AppChat.tsx)). Without this, `useChatStore.onlineUsers` starts empty on socket connect and only fills as peers happen to change state — so green dots are absent for already-online peers until they reconnect. New effect fires once per socket connection (ref-gated): gathers all DM peer userIds from `store.chats`, dispatches `socketEmit.getOnlineUsers([ids])` via existing `getOnlineUsersOverSocket` wrapper, merges the response into `useChatStore.onlineUsers` (Set union — does NOT replace, so any `user_online` events that arrived during the round-trip aren't clobbered). Ref resets on `chatConnected === false` so reconnects re-seed. Error path also resets the ref to allow a retry on the next list refresh. Sidebar / chat header / DM profile pick up the seeded state automatically since they all read from the same SDK store.
  - **`participant_joined` socket listener.** New `applyParticipantJoined` reducer mirrors `applyParticipantLeft`. Triggered when admin adds someone to a group (or when a previously-removed user is re-added). Updates `participants` (flips existing inactive entry's `isActive: true` OR pushes new), `participantIds` (deduped Set merge), `adminIds` (if role==='admin'). When the joiner is the CURRENT user, also flips `isCurrentUserActive: true` AND clears `removedBy` / `removedByName` snapshots so the composer un-locks instantly and the read-only placeholder reverts. Defensive payload extraction in [`AppChat`](../../../src/views/apps/chat/AppChat.tsx) `onParticipantJoined` reads `evt.displayName ?? evt.user?.displayName`, same for username/avatarUrl/role. Pure addition — `applyParticipantLeft` byte-identical, all other 14 listeners untouched.
  - **DM "Delete chat" reappear flow** ([`UserProfileRight`](../../../src/views/apps/chat/UserProfileRight.tsx)). Un-commented the "Delete chat" button at the bottom of the DM profile drawer. Rewrote the confirm copy to be accurate per v1.1.3 — *"This removes the chat from your list. The other person is not affected. If they message you again, the chat will reappear."* (was misleading "This will permanently delete the conversation"). Added a `toast.success('Chat deleted')` after dispatch. Reappear path was already wired: the existing `onConversationCreated` listener in [`AppChat`](../../../src/views/apps/chat/AppChat.tsx) dispatches `fetchChatsContacts()` + `joinChatRoom(convId)` — when the peer sends a new message, the server emits `conversation_created` to the deleter and the chat re-enters the sidebar. No thunk changes — same `deleteConversation` thunk as the group "Delete group" path.
  - **Server-side sidebar search** ([`SidebarLeft`](../../../src/views/apps/chat/SidebarLeft.tsx)). Replaced the client-side `fullName.toLowerCase().includes(query)` substring filter (only matched display names) with a debounced server query via existing `listConversations({ search })` wrapper. 300ms idle → server returns matches by MongoDB text index across name + description → adapted via `sdkConversationToChat` → stored in component-local `searchResults` (NOT in Redux — `store.chats` stays canonical for live socket updates). Empty query falls back to today's path (filter on `store.chats`). Tab filter (Unread / Groups / Favourites) still composes client-side on top. Failed search → empty list (not full unfiltered) → matches WhatsApp's "No results" UX. No new API exports — uses functions already shipped in `api.ts`.
  - **`ChatLog` Fragment key warning fix.** Two bare `<>...</>` shorthand fragments inside the outer `formattedChatData().map(...)` callback couldn't accept React's `key` prop, producing console warnings. Converted both to `<Fragment key={...}>...</Fragment>` and imported `Fragment` from React. No DOM / behavior change — purely silences the warning.
  - **Live presence (green dot + last seen)** — SDK auto-updates `useChatStore.onlineUsers` and `useChatStore.lastSeen` from `user_online` / `user_offline` socket events; we now subscribe in 3 places. **Sidebar** ([`SidebarLeft`](../../../src/views/apps/chat/SidebarLeft.tsx)): green dot on DM avatars ONLY when the peer is in `onlineUsers` (replaces the static `chat.status` default that always rendered an "online" dot). **Chat header** ([`ChatContent`](../../../src/views/apps/chat/ChatContent.tsx)): same green-dot logic on the header avatar, plus a status line beneath the name — green **"online"** when in `onlineUsers`, grey **"last seen today at 14:30"** / "yesterday at …" / "DD/MM/YYYY at …" derived from `lastSeen[peerId]`. **DM profile** ([`UserProfileRight`](../../../src/views/apps/chat/UserProfileRight.tsx)): same presence line below the role label. Peer userId derived from `chat.participants.find(p => p.userId !== me)`. Groups have no presence (spec — DMs only). `lastSeen` is seeded once per DM open via existing `getUserLastSeen(userId)` wrapper → `useChatStore.setLastSeen` (effect is idempotent — skips when the store already has a value). Both `ChatContent` and `UserProfileRight` seed defensively so deep-linking straight into the profile drawer still works.
  - **Group-header member name list** ([`ChatContent`](../../../src/views/apps/chat/ChatContent.tsx)). Replaced the bare "N members" status line under the group name with a comma-separated list of member display names, "You" pinned first — matches WhatsApp Web ("You, Alice, Bob"). CSS-truncated (`noWrap` + `maxWidth: 480`) for wide groups. Falls back to the legacy "N members" copy when `participants` is missing (mid-fetch / legacy chats). DM header line unchanged — still presence-driven.
  - **v1.1.3 three-tier group leave/delete UI** in [`UserProfileRight`](../../../src/views/apps/chat/UserProfileRight.tsx). Replaced the single "Leave group" button with:
    - **Exit group** — `leaveConversation(id)` (single-arg form). Server flips `participants[me].isActive = false`; sidebar row stays as read-only. Server does NOT broadcast `participant_left` back to the leaver's own socket, so on success we refetch `getConversation(id)` and dispatch the result through `sdkConversationToChat` + `addOrReplaceChat` — exactly what a hard refresh would do, just instant.
    - **Exit and delete** — new adapter `leaveAndDeleteConversation(id)` calls `conversations.leave(id, true)` (atomic exit + remove from list per v1.1.3). On success we optimistically dispatch `removeChatFromList` then fire `fetchChatsContacts` as a safety-net resync.
    - **Delete group** — gating changed from admin-only → `!isCurrentUserActive`. Per v1.1.3 spec, `delete()` is "any participant after they've exited" — admin role is irrelevant. Existing `deleteConversation` thunk unchanged.
    - Legacy `leaveGroupChat` thunk is no longer wired but kept exported for safety.
  - **`participant_left` socket branches on `removedBy`** in [`AppChat`](../../../src/views/apps/chat/AppChat.tsx) + [`applyParticipantLeft` reducer](../../../src/store/apps/chat/index.ts). Payload's optional `removedBy` / `removedByName` are extracted defensively, the reducer snapshots them on the chat (new optional `ChatsArrType.removedBy` / `removedByName` fields). When current user is the leaver AND `removedBy` is present → toast `"You were removed from this group by <Name>"` AND the read-only composer placeholder in [`ChatContent`](../../../src/views/apps/chat/ChatContent.tsx) flips from generic "You're no longer a member" to "You were removed from this group by <Name>". Self-exit path unchanged.
  - **Audio / video `duration` on send** ([`SendMsgForm`](../../../src/views/apps/chat/SendMsgForm.tsx)). v1.1.3 spec says receivers need duration for the player UI. Added optional `duration?: number` to `ChatAttachmentType` + `PendingFile.durationSec`. Sources: voice notes pull from the recording timer (`Date.now() - recordingStartRef.current`); picked audio/video probed via a hidden `<audio>` / `<video>` element with a 3 s safety timeout so a slow decode never blocks the send. Matched back to upload results by `filename + size` after the SDK returns `SendMessageAttachment[]`; `sendMsg` thunk forwards `duration` only for `type === 'audio' | 'video'`. Images / docs unchanged (always undefined).
  - **Conversation pin cap gate (max 5)** in [`UserProfileRight`](../../../src/views/apps/chat/UserProfileRight.tsx). New `getAppConfig()` wrapper in [`api.ts`](../../../src/lib/chat/api.ts) hits `sdkAppConfigApi.get()` with a module-level cache (one fetch per session). On mount, we hydrate `maxPinned` state (default 5). Both pin Switches (group + DM) short-circuit with `toast.error("You can pin up to 5 chats. Unpin one first.")` when `chats.filter(c => c.isPinned).length >= maxPinned` — prevents the silent 400 the server returns on a 6th pin. Unpin path never gated. **NB:** the limit is for sidebar/conversation pins; message-pin (inside a chat) remains unlimited per spec.
  - **Per-chat drafts (WhatsApp-style)** wired through Redux ([`setDraft` reducer](../../../src/store/apps/chat/index.ts), new `state.chat.drafts: Record<conversationId, text>`). [`SendMsgForm`](../../../src/views/apps/chat/SendMsgForm.tsx) saves the current text as a draft for the PREVIOUS conversation on chat switch via a `prevConvIdRef` + `msgRef` pattern (avoids depending on `msg` in the effect deps), and restores the new chat's draft into the composer. Empty/whitespace text removes the draft entry. Cleared on send. [`SidebarLeft`](../../../src/views/apps/chat/SidebarLeft.tsx) renders a red **`Draft:`** prefix preview that overrides the lastMessage line. Drafts live in-memory only (no localStorage) — survive chat switches, not hard refresh; matches "WhatsApp does not sync drafts across devices" semantics.
  - **Reply / edit refs cleared on chat switch.** Same effect that handles drafts now dispatches `setReplyingTo(null)` + `setEditingMessage(null)` when the conversation id changes (and only then — not on initial mount, so deep-linking into a chat with a pre-set reply still works). Fixes the leak where a Reply pill from chat A would appear in chat B's composer.
  - **WhatsApp Web group-icon UX** — extracted into new [`GroupIconEditor`](../../../src/views/apps/chat/GroupIconEditor.tsx) component. Click the avatar (admin only) → MUI Menu with `View photo` (opens `AttachmentPreviewDialog` with a synthesized image attachment) + `Upload photo` (existing picker → `uploadGroupIcon` thunk) + `Remove photo` (red, opens a custom minimal Dialog with left-aligned title "Remove this group's icon?" and right-aligned Cancel / Remove buttons, matching the WhatsApp design — distinct from the shared centered `ConfirmationDialog`). Hover shows a translucent dark overlay with image icon + "Change group icon" label. Replaces the previous corner camera + × IconButtons. Component is self-contained: owns its own state (`menuAnchor`, `viewingPhoto`, `confirmingRemove`, `uploading`, file input ref), its own dispatches, its own confirm dialog. `UserProfileRight` just renders `<GroupIconEditor>` once with chatId / avatar / fullName / isAdmin / currentUserId / size / getInitials props. Cleaned up ~180 lines of avatar / menu / dialog JSX + 4 state hooks + 2 handlers + 6 orphan imports from `UserProfileRight`.
  - **`removeConversationIcon` SDK wrapper** in [`api.ts`](../../../src/lib/chat/api.ts) calls `client.conversations.removeIcon(id)`. New focused reducer `clearChatAvatar({ chatId })` in [`store/apps/chat/index.ts`](../../../src/store/apps/chat/index.ts) explicitly drops `chat.avatar` — required because `addOrReplaceChat`'s defensive `avatar: incoming.avatar || existing.avatar` fallback (added 2026-05-20 for participant-mutation iconUrl omissions) would otherwise keep the old icon when removeIcon legitimately returns `iconUrl: undefined`. Order on remove: `removeConversationIcon` → `addOrReplaceChat(adapted)` → `clearChatAvatar({ chatId })`. Failure rollback refetches the conversation via `getConversation(id)` so the avatar visibly returns if the delete didn't actually happen.
  - **`addParticipants` with role param** ([`api.ts`](../../../src/lib/chat/api.ts) wrapper + [`addParticipantsToGroup` thunk](../../../src/store/apps/chat/index.ts)). SDK signature `addParticipants(id, ids, role?)` exposed via optional third arg; new members default to `'member'`. "Add as admin" Switch added to the add-members panel in [`UserProfileRight`](../../../src/views/apps/chat/UserProfileRight.tsx), shown only when at least one contact is selected (WhatsApp pattern). Toggles between `role: 'admin'` and omitting `role` entirely so existing two-arg callers keep working unchanged.
  - **`PinnedMessagesStrip` extracted** to [`src/views/apps/chat/PinnedMessagesStrip.tsx`](../../../src/views/apps/chat/PinnedMessagesStrip.tsx) (~210 lines out of ChatContent). Redesigned to match WhatsApp Web: indicator bars on the left for multi-pin position, clicking the strip cycles to the next pinned message and scrolls to it, chevron-down on the right opens a 2-item dropdown (Unpin + Go to message — applies to currently displayed pinned message). Owns its own `pinnedIndex` + `pinnedListAnchor` state and effects; parent passes `selectedChat` + `userProfile` + `onScrollToMessage`. Replaced the up/down arrow navigation entirely.
  - **`MediaLinksDocsDrawer` doc rows are now view-only.** Trailing icon changed from `mdi:download-outline` to `mdi:eye-outline`; clicking opens `AttachmentPreviewDialog` (with the doc list as the gallery) instead of `<a href target='_blank'>` (which downloaded or opened the URL in a new tab). Matches the in-chat doc preview UX. Image / video tab unchanged.

- **2026-05-20** — Connection fix, sidebar sender prefix, live participant-removal, group icon optimistic update, doc previews, getInitials hardening:
  - **SDK 1.0.7 transitEncryption mismatch.** `connectSocket` now starts with `transitEncryption: false` ([client.ts](../../../src/lib/chat/client.ts)). The SDK default is `true` (ECDH + AES-256-GCM on every HTTP body and socket payload), and the deployed server doesn't have `TRANSIT_ENCRYPTION_ENABLED=true` — handshake was failing silently and the socket was never registered, causing `"Socket not initialized. Call connectSocket first."` on app boot.
  - **`useChatClient` waits for connect to resolve before reading socket.** `connectSocket` is async and only assigns `_socket = io(...)` AFTER `fetchServerKeys` resolves — calling `getSocket()` synchronously on the next line was throwing. Listener attach now lives inside the `.then()` ([useChatClient.ts:119-167](../../../src/hooks/useChatClient.ts#L119-L167)) with a `cancelled` flag for clean re-mount handling.
  - **WhatsApp-style sender prefix in sidebar (`"Saket: hello"` / `"You: hello"`)** for group chats. Implemented in [`SidebarLeft`](../../../src/views/apps/chat/SidebarLeft.tsx) with a four-layer resolution chain (most stable first): (1) current-user id match → `"You: "`, (2) `lastMessage.senderName` snapshotted by the adapter from SDK `msg.sender.displayName`, (3) `store.contacts` lookup, (4) no prefix as graceful degrade. Skipped for DMs, system messages, and deleted tombstones — matches WhatsApp exactly.
  - **Sender prefix sticks across refreshes.** Added new `senderName?: string` field to `MessageType` ([chatTypes.ts](../../../src/types/apps/chatTypes.ts)). Multiple coverage layers: adapter snapshots `msg.sender.displayName`, `sdkConversationToChat` backfills `senderName` from `conv.participants` when the lastMessage itself omits it ([api.ts:746-764](../../../src/lib/chat/api.ts#L746-L764)), `sendMsg.fulfilled` stamps `userProfile.id` + `userProfile.fullName` on the synthesized stub message ([store/apps/chat/index.ts:1559+](../../../src/store/apps/chat/index.ts)), and `fetchChatsContacts.fulfilled` + `addOrReplaceChat` reducers use a **same-id merge** so server responses missing sender fields don't wipe stamped data.
  - **`enrichLastMessageSenders` thunk** ([store/apps/chat/index.ts](../../../src/store/apps/chat/index.ts)) — backend's `GET /conversations` returns `lastMessage` with `senderId: ''` (empty) and no `sender` object, so the sidebar prefix can't render on a hard refresh. This thunk fires after `fetchChatsContacts` on app boot, scans group chats for `lastMessage.id` without `senderName`, and dispatches `getMessage(id)` in parallel to backfill via `patchLastMessageSender`. Module-level `Set<string>` cache prevents refetches across `fetchChatsContacts` invocations. Self-deprecates once the backend includes sender details on the conversation-list response (targets list filters to empty automatically).
  - **Live participant removal (`participant_left` socket event)** — when an admin removes a user from a group (or a user voluntarily leaves), the server fires `participant_left` with `{ conversationId, userId, displayName, removedBy? }` to all participants. New listener in [AppChat.tsx](../../../src/views/apps/chat/AppChat.tsx) → dispatches new `applyParticipantLeft` reducer ([store/apps/chat/index.ts](../../../src/store/apps/chat/index.ts)). For the removed user: `participants[me].isActive = false`, `participantIds` strips them, `isCurrentUserActive = false` — composer + 3-dot menu + reactions + Leave-group all hide INSTANTLY via the existing `canInteract` gate in ChatContent ([ChatContent.tsx:178-186](../../../src/views/apps/chat/ChatContent.tsx#L178-L186)). For remaining members: leaver disappears from member count + avatars list. No refresh needed.
  - **Group icon upload during create.** [`CreateGroupDrawer`](../../../src/views/apps/chat/CreateGroupDrawer.tsx) now captures both the picked File and the preview URL. `handleCreate` builds the SDK `UploadableFile` shape (`{ uri, name, type, size }`) and passes it as `iconFile` in the payload. `createGroupChat` thunk creates the group first, then **if** an icon was picked, dispatches `uploadGroupIcon({ chatId: conv.id, file: iconFile })` — sequential so the icon attaches to the real group id, not a half-created placeholder.
  - **Optimistic icon update for the uploader.** New focused reducer `setChatAvatarOptimistic` ([store/apps/chat/index.ts:1142+](../../../src/store/apps/chat/index.ts)) patches just `chat.avatar` on the open chat. `uploadGroupIcon` thunk now snapshots `previousAvatar`, dispatches the optimistic swap to the local blob URL BEFORE calling `client.uploadIcon`, then either lets the server's real `iconUrl` overwrite (on success) or reverts to `previousAvatar` (on failure). Sidebar tile + chat header + Group info drawer all show the new icon instantly without waiting for the upload round-trip.
  - **`addOrReplaceChat` preserves the existing icon when server omits `iconUrl`.** Participant-mutation endpoints (add member, remove member, role change, rename) return the updated `Conversation` but sometimes drop `iconUrl` — the reducer at [store/apps/chat/index.ts:1196+](../../../src/store/apps/chat/index.ts) now falls back via `avatar: incoming.avatar || existing.avatar` to keep the previously-known icon. Same shape used for `lastMessage.senderId` / `senderName` same-id merging.
  - **lastMessage stays in sync with chat-window state** after destructive actions. Three new reducer paths: `applyMessageDelete` (delete-for-everyone) clones the lastMessage with `isDeletedForEveryone: true` if the deleted message IS the last one; `applyMessageDeleteForMe` falls back to the new last message in the array; `applyMessageUpdate` (edit) propagates the new text + `isEdited` flag to lastMessage. Sidebar now renders "**This message was deleted**" in italic for tombstoned last messages — new branch in [SidebarLeft.tsx](../../../src/views/apps/chat/SidebarLeft.tsx).
  - **Synthesized "X created group Y" sidebar preview** for groups without any real `lastMessage`. Resolved at the SidebarLeft render layer using `store.contacts` + `chat.createdBy` (new field on `ChatsArrType`). Falls back to nothing when creator isn't in contacts cache (better than showing "Someone"). `createdBy` exposed by the adapter from `conv.createdBy`.
  - **`getInitials` strips parenthesized decorations.** [`get-initials.js`](../../../src/@core/utils/get-initials.js) — `"Anil Rathod (You)"` previously produced `"AR("` (taking `(` as a word). Now returns `"AR"`. Strictly additive — names without parens produce identical output (45 callsites unaffected). Triggered by the self-chat suffix; future decorations like `"(Manager)"` benefit automatically.
  - **Sidebar + chat header now render group icons.** Both surfaces had hardcoded `mdi:account-group` glyphs for groups. [`SidebarLeft`](../../../src/views/apps/chat/SidebarLeft.tsx) and [`ChatContent`](../../../src/views/apps/chat/ChatContent.tsx) chat-header now use `chat.avatar ? <MuiAvatar src=…> : <CustomAvatar><Icon mdi:account-group/></CustomAvatar>` — the same pattern as the Group info drawer.
  - **In-app document previews — no native viewers, no URL leak.**
    - **PDF**: rendered via `react-pdf` to `<canvas>` ([`PdfPreview`](../../../src/views/apps/chat/PdfPreview.tsx)). Loaded via `next/dynamic({ ssr: false })` because `pdfjs-dist` touches `DOMMatrix` at module-evaluation time (Node-incompatible). Worker pulled from `unpkg.com`. Pagination + responsive width (`innerWidth - 32` on mobile, `- 200` on desktop).
    - **CSV / XLSX / XLS** via the existing `xlsx` (SheetJS) dependency ([`SpreadsheetPreview`](../../../src/views/apps/chat/SpreadsheetPreview.tsx)). Multi-sheet workbooks get a tab selector. Same SSR-safe dynamic pattern.
    - **DOCX** via `docx-preview` ([`DocxPreview`](../../../src/views/apps/chat/DocxPreview.tsx)) — chosen over `mammoth` (lower bundle, higher fidelity). Renders to DOM via `renderAsync` (no `dangerouslySetInnerHTML`). Click guard on anchor links rejects `javascript:` / `data:` URIs and adds `rel='noopener noreferrer'` to legitimate external links. Legacy `.doc` binary falls through to file-info card.
    - **DevTools / inspect shortcuts blocked** while the preview dialog is open ([`AttachmentPreviewDialog`](../../../src/views/apps/chat/AttachmentPreviewDialog.tsx)) — F12, Cmd+Opt+I/J/C (Mac), Ctrl+Shift+I/J/C (Win/Linux), Cmd/Ctrl+U (view source). Mac quirk handled via `e.code === 'KeyI'` instead of `e.key` (Option+I produces `ˆ`). Honest disclosure: cannot block the browser's menu (View → Developer) — friction layer only.

- **2026-05-19c** — Delete-for-everyone persistence + false-negative toast fix:
  - **Adapter now reads `status: 'deleted'`.** SDK marks a soft-deleted message with `MessageStatus = 'deleted'`. `sdkMessageToMessage` ([api.ts:653-685](../../../src/lib/chat/api.ts#L653-L685)) now: (a) detects this on REST re-fetch, (b) sets `isDeletedForEveryone: true`, (c) blanks `message`, (d) drops `attachments` and `reactions` so the tombstone renders identically to the live-broadcast path. Before this fix, refreshing the tab would resurrect the deleted message's original content because `applyMessageDelete` only ran in response to the `message_deleted` socket event. Live and refresh paths now produce identical state.
  - **`delete_message` socket emit is now fire-and-forget.** Same server quirk as `remove_reaction`: backend processes the deletion AND broadcasts `message_deleted` to all participants, but doesn't send an ack frame within 5s. The SDK's ack-based `withAck` was rejecting the Promise with `"Socket ack timeout: delete_message"`, producing a false `"Delete failed"` toast even on successful deletes. `deleteMessageOverSocket` ([api.ts:234-249](../../../src/lib/chat/api.ts#L234-L249)) now emits directly on the raw socket without waiting for ack. State still lands on every participant via the `message_deleted` broadcast → `applyMessageDelete` reducer. Same pattern as the SDK's own choice for `typing` and `mark_read` (also ack-less).

- **2026-05-19b** — Reactions / leave-group / group identity / self-chat / group-icon upload / time-window gating:
  - **Reactions toggle via single socket emit.** Earlier we had `addReactionOverSocket` + `removeReactionOverSocket`. Server's `remove_reaction` consistently failed to ack within 5 s, surfacing `"Socket ack timeout: remove_reaction"` even though the operation often succeeded. Backend now treats `add_reaction` as a toggle (re-emitting the same emoji removes it), so the client calls **only `addReactionOverSocket` for both add and remove**. State for both sides lands via the `reaction_updated` broadcast → `applyReactionUpdate` reducer. The duplicate `handleToggleReaction` in [`MessageBubble`](../../../src/views/apps/chat/MessageBubble.tsx) and [`MessageReactionPicker`](../../../src/views/apps/chat/MessageReactionPicker.tsx) both use the same call; `alreadyReacted` is kept only for any future UI branching.
  - **Leave-group hidden when `isCurrentUserActive: false`.** Adapter computes `isCurrentUserActive` from `participants[me].isActive` ([api.ts:725-727](../../../src/lib/chat/api.ts#L725-L727)). [`UserProfileRight`](../../../src/views/apps/chat/UserProfileRight.tsx) reads it and gates both the "Leave group" ListItem and the "Danger zone" header. "Pin to top" stays available so the user can keep the chat at the top of their sidebar after leaving. DMs unaffected (`isCurrentUserActive` is always `true` for DMs).
  - **Group sender identity in ChatLog.** Incoming bubbles in groups now resolve the actual sender via `state.chat.contacts` (deduped from all conversations' participants). [`ChatLog`](../../../src/views/apps/chat/ChatLog.tsx) reads `state.chat.contacts` via `useSelector`, builds a `senderById` Map, and replaces the group's icon/name with the actual sender's avatar/name/color. A colored sender-name `Typography` is rendered above the first bubble in each speaker's run. Falls back to "Unknown" if the sender is no longer in the contacts cache (e.g., removed from the group).
  - **Self-chat ("Message yourself"). [`api.ts:686-705`](../../../src/lib/chat/api.ts#L686-L705)** — direct conversations where `activeParticipants.every(p => p.userId === currentUserId)` resolve `other` to the current user's own entry, and `fullName` renders as `` `${displayName} (You)` `` instead of "Unknown user". Id-based check (immutable to name/email changes); falls back to normal peer lookup if anyone else ever joins.
  - **Group icon upload.** New thunk `uploadGroupIcon` ([store/apps/chat/index.ts](../../../src/store/apps/chat/index.ts)) calls SDK `client.uploadIcon(chatId, file)` — which runs presigned-url + S3 upload + `conversations.uploadIcon` in one shot and returns the updated `Conversation`. We pipe it through `sdkConversationToChat` and `addOrReplaceChat`. UI: admin-only camera IconButton overlay on the 80×80 avatar in [`UserProfileRight`](../../../src/views/apps/chat/UserProfileRight.tsx) Group info → opens a hidden `<input type='file' accept='image/*'>` → wraps the picked File in an `UploadableFile` (`{ uri: createObjectURL(file), name, type, size }` — without `name` the presigned-url request returns 400) → dispatches the thunk → revokes the blob URL in `finally`.
  - **`addOrReplaceChat` now syncs `selectedChat`.** Reducer ([store/apps/chat/index.ts:1095-1102](../../../src/store/apps/chat/index.ts#L1095-L1102)) now keeps `state.selectedChat` in sync when the replaced chat is the currently-open one — mirroring the same sync `fetchChatsContacts.fulfilled` already does. This means group icon upload (and rename, add/remove members, role change, etc.) instantly refreshes the chat header + Group info drawer for the currently-open conversation, not just the sidebar tile.
  - **Sidebar + chat header now render the group icon.** Both surfaces had a hardcoded `mdi:account-group` glyph for groups, ignoring `chat.avatar`. [`SidebarLeft`](../../../src/views/apps/chat/SidebarLeft.tsx) and [`ChatContent`](../../../src/views/apps/chat/ChatContent.tsx) now use the same `chat.avatar ? <MuiAvatar src=…> : <CustomAvatar><Icon mdi:account-group/></CustomAvatar>` pattern as the Group info drawer.
  - **Backend gap: `conversation_updated` is NOT broadcast for icon changes / system messages.** Listener is wired ([AppChat.tsx](../../../src/views/apps/chat/AppChat.tsx)) but the broadcast itself only fires for some metadata changes. Uploader's local state updates atomically via the thunk; other participants get it via `conversation_updated` if/when the server emits it, or by next `fetchChatsContacts`. File with backend team if real-time fan-out is needed across all metadata changes.
  - **Time-window gating for Edit and Delete-for-everyone.** Backend returns `Conversation.settings.messageConfig.{editWindowSeconds, deleteWindowSeconds}` (e.g. `900` and `216000`). Adapter exposes them on `ChatsArrType`. [`MessageActions`](../../../src/views/apps/chat/MessageActions.tsx) reads via `useSelector(state.chat.selectedChat.contact.editWindowSeconds)` and gates the menu items by comparing `chat.time` against `Date.now()`. Defensive: `undefined` window = no restriction (legacy fallback), NaN `chat.time` = treat as expired (fail-closed). Server is still the source of truth — the gate is purely UX.
  - **Self-chat detection is `every()` over active participants.** Subtle but important: `activeParticipants.every(p => p.userId === meIdStr)` correctly returns `false` for a 2-participant DM where one is me, but `true` for a 1-participant DM where the only participant is me.
  - **Cleanup of diagnostic logs.** Removed `[chat:icons]` from `fetchChatsContacts.fulfilled`, `onAnyDebug` (`[chat:event]` / `[chat:event ★ READ-LIKE]`) from `AppChat`, and lingering `[chat:att]` IIFE log from `ChatLog`. The `[chat:icon-upload]` log in `uploadGroupIcon` thunk and `[chat:system]` log in `onNewMessage` are intentionally kept while we investigate whether the backend emits a system message for group icon changes.

- **2026-05-19** — WhatsApp-Web message-affordance layout + ChatLog scroll-container fix:
  - **Split MessageActions into two components** so the chevron and the reaction picker can be positioned independently:
    - [`MessageActions`](../../../src/views/apps/chat/MessageActions.tsx) — now only the chevron menu trigger + Menu + delete `ConfirmationDialog`. All reaction-picker code (`Popover`, `QUICK_REACTIONS`, `addReactionOverSocket`/`removeReactionOverSocket`, `useSelector` for `currentUserId`) extracted.
    - [`MessageReactionPicker`](../../../src/views/apps/chat/MessageReactionPicker.tsx) — new standalone 😀 trigger + 6-emoji quick-pick popover.
  - **Chevron INSIDE the bubble, reaction picker OUTSIDE.** [`MessageBubble`](../../../src/views/apps/chat/MessageBubble.tsx) renders the chevron `MessageActions` absolutely at `top: 2, right: 2` inside the bubble Box (which now has `position: relative` + `pr: 7` to reserve space for the icon). The `MessageReactionPicker` is a flex sibling of the bubble column, vertically centered, on the inside-facing edge (LEFT of green sender bubbles, RIGHT of receiver bubbles) via `flex-direction: row-reverse` on the outer row.
  - **Same pattern in the attachment-only branch of [`ChatLog`](../../../src/views/apps/chat/ChatLog.tsx).** The attachment column got `position: relative`; the chevron sits absolute at `top: 4, right: 4` over the top-right of the first attachment. Audio container changed from uniform `p: 2` to `pt: 5, pb: 2, px: 2` so the chevron sits above the audio control row instead of overlapping the volume button.
  - **Chevron contrast fix for audio + image + PDF previews.** The chevron icon was previously `rgba(255,255,255,0.85)` with no backdrop and disappeared on top of the white `<audio>` control strip. Now it's `common.white` with a translucent dark circle (`bgcolor: rgba(0,0,0,0.32)` on sender bubbles, `rgba(0,0,0,0.45)` on receiver) that contrasts against both the green bubble color AND any embedded white element underneath.
  - **Hover reveal.** Both icons share `className='msg-actions'` (opacity 0 / pointer-events: none by default). Each outer row has `&:hover .msg-actions { opacity: 1; pointer-events: auto }` so they appear together when the row is hovered.
  - **ChatLog flash-to-top on send — root cause + fix.** `ChatLog` defined an inner `ScrollWrapper` component inside its render function; React saw a new component type on every ChatLog render and unmounted + remounted the entire `PerfectScrollbar` subtree on every Redux state change. This reset `scrollTop` to 0, then the `scrollToBottom` raf passes yanked the chat back down — visible as a flash to top on every send / receipt / reaction. Fix: removed the inner `ScrollWrapper` and inlined the `hidden ? <Box> : <PerfectScrollbar>` conditional in the return statement. React now reuses the same `<PerfectScrollbar>` instance across renders; `scrollTop`, `chatArea.current`, `messageRefs`, and pagination anchor restoration all stay valid. Also dropped the unused `ReactNode` import.
- **2026-05-18f** — Attachment preview is now **view-only, no downloads**:
  - New `AttachmentPreviewDialog` — fullscreen WhatsApp-Web-style overlay.
  - Replaced every `<a href target='_blank'>` and `<a download>` anchor in `ChatLog` with `onClick={() => openPreview(att)}`. Image / video / pdf / document all open in-page.
  - **Image** — fits viewport, zoom in/out (50–400% in 25% steps), rotate (90° increments). Bottom toolbar shows current zoom %.
  - **Video** — native controls with `controlsList='nodownload noplaybackrate'` + right-click prevented.
  - **PDF** — iframe with `#toolbar=0&navpanes=0&scrollbar=0` URL fragment so Chrome/Edge hide their built-in toolbar (download + print + overflow). Firefox/Safari ignore these flags and still show their viewer UI — would need PDF.js to fully cover them.
  - **Other docs** — fallback card with file info; no link, no download, no fallback "Open in new tab".
  - **Blocked at the Dialog root**: `onContextMenu` (no right-click Save), `userSelect: none` (no drag-out), `draggable={false}` + `WebkitUserDrag: none` on images, `window.keydown` listener suppressing `Ctrl/Cmd+S` and `Ctrl/Cmd+P` while open.
  - Audio bubbles already had `controlsList='nodownload'` from the voice-message work — unchanged.
  - Removed the temporary `[chat:att]` and `[chat:sdk-att]` diagnostic logs from `ChatLog.tsx` and `api.ts` now that audio render is verified.
- **2026-05-18e** — Per-message interactions + voice messages, all 8 phases shipped:
  - **Phase 0 — types + adapter:** extended `MessageType` and `ChatLogChatType` with `replyTo`, `reactions`, `isPinned`, `isStarred`, `isEdited`, `editedAt`, `isDeletedForEveryone`. Added `ReactionEntry` and `MessageReplyRef` types. `sdkMessageToMessage` now maps SDK fields (reactions / replyTo / isPinned / isStarred / isEdited / editedAt).
  - **Phase 1 — MessageBubble shell:** new component for text bubbles with 3-dot menu, hover-revealed icons.
  - **Phase 2 — Reply:** `replyingTo` Redux state, composer banner with cancel, inside-bubble reply snippet, scroll-to-original with `.msg-flash` CSS keyframes.
  - **Phase 3 — Reactions:** popover picker (6 hardcoded emojis), reactions chip row under bubble with toggle-on-click, `reaction_updated` socket listener + `applyReactionUpdate` reducer (full array replacement, server authoritative).
  - **Phase 4 — Edit:** `editingMessage` Redux state, composer warning banner with prefilled text, submit branches to `updateMessageOverSocket`, `message_updated` socket listener + `applyMessageUpdate` reducer, `(edited)` marker on bubble.
  - **Phase 5 — Delete:** for me + for everyone via socket, shared `ConfirmationDialog` for both variants, `applyMessageDelete` / `applyMessageDeleteForMe` reducers, "This message was deleted" tombstone for the everyone-delete path.
  - **Phase 6 — Star:** personal flag with optimistic local toggle + revert on failure, inline star icon on bubble.
  - **Phase 7 — Pin:** DM both-sides / group admin-only gating, `applyMessagePin` reducer, pinned-messages strip above ChatLog showing latest pinned + count.
  - **MessageActions refactor:** extracted the 3-dot menu + reaction picker + delete dialog into a single shared component used by both `MessageBubble` (text) and `ChatLog` (attachment-only bubbles) — audio / video / image / document now have the same delete / star / pin / react / reply flow as text. One delete operation removes the entire message including any attachments via the same SDK functions (`deleteMessageOverSocket(chat.id)` and `deleteMessageForMeOverSocket(chat.id)`).
  - **Voice messages:** mic button in composer opens MediaRecorder (priority list of MIME types for cross-browser support, Safari falls through to `audio/mp4`). Recording overlay with pulsing dot, `mm:ss` timer, ⏹ Stop, ✕ Cancel. Stop → File enters the pending strip with inline `<audio>` preview. Send → flows through existing `uploadChatFiles`. Receive side renders `<audio controls controlsList='nodownload noplaybackrate'>` at 280px width.
  - **MIME normalization:** strip codec suffix from MediaRecorder output (`audio/webm;codecs=opus` → `audio/webm`) before constructing the File. Server allow-list rejects the codec-decorated form.
  - **Lightweight ack attachment-id fix:** in `sendMessageOverSocket`, when synthesizing a Message from `{success, messageId}` ack, map `payload.attachments[].fileId → .id` so downstream code addresses attachments by a defined id.
  - **SidebarLeft active highlight sync:** removed local `active` React state, now derives from `state.chat.selectedChat.contact.id`. Single source of truth fixes the highlight when chats are opened via auto-select, deep-link, or programmatic `selectChat` dispatch.
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
