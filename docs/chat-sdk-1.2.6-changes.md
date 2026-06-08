# Chat — `@antzsoft/chat-core` v1.2.6 Alignment & Fixes

Branch: `vantara-chat` · SDK: `@antzsoft/chat-core@1.2.6`

This document summarizes the chat work done to align the web dashboard with the
`@antzsoft/chat-core` v1.2.6 documentation + release notes, plus a few fixes
surfaced along the way. Every change was type-checked (`tsc --noEmit`, 0 errors)
and written to be **additive / fall back to existing behavior** so nothing
regresses.

---

## 1. SDK v1.2.6 doc-gap fixes

### #1 — `unread_count_changed` socket event (cross-device unread sync)
The server pushes the authoritative unread count to **all** of a user's devices.
We weren't listening, so reading a chat on another device wouldn't clear the
badge here.

- **New reducer** `setUnseenCount` — touches **only** `chat.unseenMsgs` (keeps 0
  while the chat is open; ignores kicked groups). Isolated from
  `patchConversationFromEvent` so it can't affect other flows.
  - `src/store/apps/chat/index.ts`
- **Listener** `onUnreadCountChanged` → dispatches `setUnseenCount`, registered
  alongside the other socket handlers (+ matching `.off()` cleanup).
  - `src/views/apps/chat/AppChat.tsx`

### #2 — Account-deactivation auto-logout (external-auth path)
When the current user is deactivated server-side, the chat session is revoked.
The app's own 401 interceptor already covers the common case, but an **idle
chat screen** (no app API calls) would never log out.

- Subscribes to the SDK auth store (`getAuthStore().useAuthStore`); on a
  **guarded `true → false` transition** (must have seen `true` first, skips the
  login page) it dispatches the **existing** `session-expired` event — reusing
  the app's tested logout path, not a new redirect. Wrapped in try/catch for
  forward-compat.
  - `src/contexts/ChatClientContext.tsx`

### #3 — Typed error handling (better toasts)
The SDK throws typed `AntzChatError` subclasses (`.code`, `.retryable`,
`.fields`). We surfaced them as friendlier messages.

- **New helper** `chatErrorMessage(err, fallback)` — maps
  `PermissionError` (403) → "no permission", `ValidationError` (400/422) → server
  field errors, `AuthError` → session-expired copy, network/server → "try again",
  and **falls back to the existing string** for anything else (never regresses).
  Plus `isRetryableChatError()`.
  - `src/lib/chat/errors.ts` *(new)*
- **Adopted at** existing-toast, permission/validation-prone sites (message-only
  change, no new toasts): delete-for-everyone / delete-for-me, pin toggle
  (`MessageActions.tsx`), group icon upload/remove (`GroupIconEditor.tsx`),
  forward (`ForwardMessageDialog.tsx`).

### #4 — Document-only gzip via `platformCompressFn`
Images are **already** compressed upstream (`maybeCompressImage` in
`SendMsgForm` / `GroupIconEditor`), so wiring image compression would
double-process. Only **text documents** were missing compression.

- **New `platformCompressFn`** — gzips only text-based docs (`text/*`,
  json/xml/yaml/csv/rtf/sql, svg) via the browser `CompressionStream`. **Skips
  images / media / binary docs.** Falls back to original bytes on any error or
  if gzip ends up larger → can never block or corrupt an upload.
  - `src/lib/chat/client.ts`
- Wired into `uploadChatFiles` with `{ enabled: true, compressDocuments: true }`.
  - `src/lib/chat/api.ts`

---

## 2. v1.2.6 release-note items

### Clear Chat (`conversations.clearChat`)
Clears all messages **for the calling user only**; the conversation stays in the
list, other participants unaffected.

> ⚠️ The release note's example showed `messagesApi.clearChat`, but the method
> actually lives on **`conversations`** (verified against the SDK types) — same
> accessor as `leave`/`mute`. Noted in code.

- **API**: `clearConversationHistory()` → `client.conversations.clearChat()`
  - `src/lib/chat/api.ts`
- **Store**: `clearChatHistory` thunk (calls API → dispatches local clear,
  re-throws for toast) + `clearChatLocal` reducer (wipes `messages`, suppresses
  `lastMessage`, resets unread/cursor — mirrors the server contract; idempotent).
  - `src/store/apps/chat/index.ts`
- **UI**: wired into the info drawer alongside the existing destructive actions
  (**not** the commented-out header menu, which would expose unimplemented
  View Contact / Block / Report). Added "Clear chat" to both the **group** action
  list (active members) and the **DM** view, with a confirm dialog.
  - `src/views/apps/chat/UserProfileRight.tsx`
- **UX**: no success toast (the emptied thread is feedback enough), closes the
  drawer after clearing, error toast on failure.

#### "You created this group" card survives Clear chat (WhatsApp parity)
The group-created card is **client-derived** from conversation metadata
(`createdAt` / `createdBy` / `participants`), which `clearChatLocal` never
touches — but it was only *rendered* at the position of the group_created
system message. After clearing (message gone) it would vanish.

- Added a **fallback** in `renderChats`: when the group_created message isn't in
  the list **and** we're at the true beginning (`!hasMoreOlder`), the card is
  prepended at the top. Normal case (message present) is unchanged — no
  duplicate (guarded by `groupCardInjected`).
  - `src/views/apps/chat/ChatLog.tsx`
- **Approach: metadata-based** (chosen over preserving the system message),
  because metadata is always available — survives clear, refresh, pagination,
  and per-member history; preserving the message would vanish on refresh since
  the server clears all messages.

### Member-count hardening — `participantCount`
Release-note guidance: use `conversation.participantCount` for count **display**,
not `participants.length` (stays accurate even if the participants array is ever
returned partially for large groups).

- Added `participantCount?: number` to `ChatsArrType`.
  - `src/types/apps/chatTypes.ts`
- Adapter exposes it: `conv.participantCount ?? activeParticipants.length`.
  - `src/lib/chat/api.ts`
- Count **displays** prefer it (fall back to length — identical today): group
  subtitle, members header, sidebar group rows (`UserProfileRight.tsx`), chat
  header (`ChatContent.tsx`). Participant **list rendering** still uses the
  `isActive`-filtered list (already correct per the frozen-state note).

> #2 (Inactive/Reactivate) and #3 (Frozen group state) from the release notes
> were already correctly handled (`participant_left` / `user_offline` listeners,
> `isActive !== false` filtering) — no changes needed.

---

## 3. Fixes surfaced during the work

### Add-members failure feedback
`addParticipantsToGroup` previously logged failures silently (e.g. a 403 for a
non-admin gave no feedback).

- Thunk now **re-throws** on error (no extraReducer reacts to it, so
  non-unwrapping callers are unaffected).
  - `src/store/apps/chat/index.ts`
- Both call sites toast via `chatErrorMessage`: `AddMembersDrawer.tsx`,
  `UserProfileRight.tsx`.

### Info-drawer scroll jumps to top (scroll-position bug)
`ScrollWrapper` was defined **inside** the `UserProfileRight` component body, so
React treated it as a new component type on every render and **remounted
`PerfectScrollbar`** — resetting `scrollTop` to 0 on any re-render (presence /
"last seen" / socket updates).

- Moved `ScrollWrapper` to **module level** (stable type; takes `hidden` as a
  prop). Behavior identical — only the React identity is now stable, so scroll
  position holds. Same pattern ChatLog already documents.
  - `src/views/apps/chat/UserProfileRight.tsx`

### Divider above Clear / Delete (DM view)
Added an always-shown `<Divider>` before the destructive actions (the old
commented-out one only appeared when groups-in-common existed).
- `src/views/apps/chat/UserProfileRight.tsx`

### Receipt handlers crashed on undecrypted transit events
Encrypted socket envelopes (`{ v, iv, tag, ct }`) sometimes reached handlers
**undecrypted** (transit race right after connect / SDK-level). `onMessageDelivered`
then threw `Cannot read properties of undefined (reading 'userId')`.

- Added **defensive guards** that bail when required fields are missing — only
  checks fields every legit event always carries, so real receipts are
  unaffected; malformed/encrypted ones are skipped instead of crashing:
  - `onMessageDelivered` — `conversationId` + `messageId` + `deliveredTo.userId`
  - `onMessagesDelivered` — added `conversationId` + `deliveredTo`
  - `onReadReceipt` — `conversationId`
  - `src/views/apps/chat/AppChat.tsx`

> **Root cause is SDK/transit-level** (the SDK should decrypt socket events
> before emitting). These guards stop the crash + console noise; the
> decryption race should be raised with the chat-core team. Possible follow-up:
> verify `CHAT_TRANSIT_ENCRYPTION` matches the server's setting.

---

## Files touched

| File | Change |
|---|---|
| `src/store/apps/chat/index.ts` | `setUnseenCount`, `clearChatLocal` reducers; `clearChatHistory` thunk; add-members re-throw |
| `src/views/apps/chat/AppChat.tsx` | `unread_count_changed` listener; receipt-handler guards |
| `src/contexts/ChatClientContext.tsx` | deactivation auto-logout subscription |
| `src/lib/chat/errors.ts` *(new)* | `chatErrorMessage` / `isRetryableChatError` |
| `src/lib/chat/client.ts` | document gzip `platformCompressFn`; `ScrollWrapper` n/a |
| `src/lib/chat/api.ts` | `clearConversationHistory`; `participantCount` in adapter; wire `platformCompressFn` |
| `src/types/apps/chatTypes.ts` | `participantCount` field |
| `src/views/apps/chat/UserProfileRight.tsx` | Clear chat UI; `participantCount` displays; `ScrollWrapper` → module level; divider; add-members toast |
| `src/views/apps/chat/ChatLog.tsx` | group-created card fallback render |
| `src/views/apps/chat/ChatContent.tsx` | `participantCount` in header |
| `src/views/apps/chat/MessageActions.tsx` · `GroupIconEditor.tsx` · `ForwardMessageDialog.tsx` · `AddMembersDrawer.tsx` | `chatErrorMessage` adoption |

## Known follow-ups (not done)
- **Transit decryption race** for incoming socket events — SDK/backend level.
- **No-preview sidebar rows** (e.g. cleared DMs) keep the name **top-aligned**;
  WhatsApp centers it. Left as-is per request — small conditional `alignItems`
  change if desired later.
- **ESLint** can't run standalone (`.eslintrc.js` circular-config crash under
  ESLint 8.36) — pre-existing, unrelated to these changes.
