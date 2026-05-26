# System-Message Perspective Rewriting

How the chat module renders system messages (membership / role / metadata changes) from each viewer's perspective — sender, receiver (target), and bystander — using a single server-stored message, across three surfaces (sidebar preview, in-chat pill, composer-area banner) and two paths (live socket events, cold-load REST refresh).

## Socket-Driven Architecture (the most important thing in this doc)

**Every state mutation in the chat slice is triggered by a socket event handler.** REST calls are used only to *issue* actions to the server; the resulting state change always reaches the client through a socket broadcast and a corresponding reducer.

### Event → handler → reducer mapping

| Socket event | Handler (AppChat.tsx) | Reducer (store/apps/chat/index.ts) | State touched |
| --- | --- | --- | --- |
| `new_message` | `onNewMessage` | `receiveMessage` | `chat.messages` (append) + `chat.lastMessage` (for system events, with full metadata) + kick-of-me derivation |
| `participant_joined` | `onParticipantJoined` | `applyParticipantJoined` | `participants`, `participantIds`, `adminIds`; clears `removedBy` + localStorage caches on self re-add |
| `participant_left` | `onParticipantLeft` | `applyParticipantLeft` (+ synthesis for kicked/leaver) | `participants`, `isCurrentUserActive`, `removedBy`, `removedByName`, `chat.lastMessage`; writes localStorage caches |
| `conversation_updated` (slim) | `onConversationUpdated` | `patchConversationFromEvent` | `chat.lastMessage` (preserves system metadata on same-id merge; resolves `senderId` from participants when slim payload omits it); `unseenMsgs`; bubble-to-top |
| `conversation_updated` (full Conversation) | `onConversationUpdated` | `addOrReplaceChat` | Full chat entry with time-checked `lastMessage` merge |
| `conversation_created` | dedicated handler | `addOrReplaceChat` | New chat prepended to list |
| `conversation_deleted` | dedicated handler | `removeChat` | Chat removed from list |
| `message_updated` | dedicated handler | `applyMessageUpdate` | Message text + `isEdited` + `editedAt` |
| `message_deleted` | dedicated handler | `applyMessageDelete` | Tombstone state |
| `message_deleted_for_me` | dedicated handler | `applyMessageDeleteForMe` | Per-user tombstone |
| `message_pin_updated` | dedicated handler | `applyMessagePinUpdate` | `isPinned` |
| `reaction_updated` | dedicated handler | `applyReactionUpdate` | `reactions` array |
| `message_delivered` / `messages_delivered` / `read_receipt` | dedicated handlers | `updateMessagesFeedback` | `isDelivered` / `isSeen` |
| `typing_indicator` | `handleTypingEvent` | local typing state | typing users list |
| `user_online` / `user_offline` | dedicated handlers | direct SDK store sync | presence map, `lastSeen` |

### What client → server emits

| Client emit | Channel | Server response |
| --- | --- | --- |
| `sendMessage` | socket emit | Broadcasts `new_message` to all room members |
| `markRead` | socket emit | Broadcasts `read_receipt` to other members |
| `typing_indicator` | socket emit | Broadcasts `typing_indicator` |
| `joinRoom` | socket emit | Server adds the socket to the room |
| Member-management actions (remove / add / promote / demote / leave / create / rename / mute / pin) | REST | Broadcasts the matching socket event(s) listed above |
| Message edits / deletes / reactions / pin / star | REST | Broadcasts `message_updated` / `message_deleted` / `reaction_updated` / `message_pin_updated` |

REST is the issue mechanism. **State syncing is socket-only.** Optimistic UI updates pre-paint for instant feel; the socket broadcast that follows is the authoritative source of truth.

### What optimistic updates do (and don't)

`patchOptimisticLastMessage` is dispatched by the three admin-action thunks BEFORE the REST call returns:
- Writes only to `chat.lastMessage` (never `chat.messages`) — no risk of duplicating the in-chat pill when the real `new_message` arrives.
- The `addOrReplaceChat` time-check protects it from being reverted by the REST response (which carries the pre-action lastMessage).
- The real socket events (`new_message`, `participant_left/joined`, `conversation_updated`) then reconcile the state with the server's authoritative payload.

### What localStorage caches do (and don't)

Two flags (`antz-chat:kick-actor`, `antz-chat:self-left`) survive page refresh so the cold-load adapter can hydrate `contact.removedBy` / `removedByName` / `selfLeft` immediately — eliminating the flash through generic placeholder text before `setChatMessages` derivation runs.

These caches are **not** a substitute for socket events:
- They're **written** by the same reducers that run from socket events (`applyParticipantLeft`, `receiveMessage` derivation, `setChatMessages` derivation).
- They're **cleared** by `applyParticipantJoined` (also driven from a socket event).
- They're only **read** by the adapter at cold-load time when no live state exists yet.

If localStorage is disabled or empty, the system degrades gracefully: cold-load shows the generic placeholder until messages.list completes and the socket-event-driven derivation populates the real text.

---

## Background

System messages fire whenever a group changes shape: a member joins, leaves, is removed, is promoted, the group is renamed, etc. The server stores **one** canonical text per event (e.g. `"Anil Rathod removed Ajay Antony"`) and broadcasts it to every room member. WhatsApp-Web UX expects each viewer to see that single event from their own perspective:

| Viewer | Server-stored text | Rendered text |
| --- | --- | --- |
| Anil (sender / actor) | `Anil Rathod removed Ajay Antony` | `You removed Ajay Antony` |
| Ajay (receiver / target) | `Anil Rathod removed Ajay Antony` | `Anil Rathod removed you` |
| Saket (bystander) | `Anil Rathod removed Ajay Antony` | `Anil Rathod removed Ajay Antony` |

Same logic applies to every membership and role event. This doc covers how the client renders that perspective without ever modifying the server-stored text.

## Single Source Of Truth — [src/lib/chat/systemMessagePerspective.ts](../../src/lib/chat/systemMessagePerspective.ts)

Before this module existed, the same ID-based actor/target detection + per-event-type switch was duplicated in four files:

- `src/views/apps/chat/ChatLog.tsx` (in-chat pill)
- `src/views/apps/chat/SidebarLeft.tsx` (sidebar preview)
- `src/views/apps/chat/ChatContent.tsx` (banner)
- `src/views/apps/chat/AppChat.tsx` (synthesis fallbacks for the kicked socket — see [kicked-user-fix.md](./kicked-user-fix.md))

Drift between the four copies was the root cause of "sidebar shows raw text while the pill is rewritten correctly" bugs. The shared module exports three things:

```ts
// 1. Pure ID-based perspective detection.
resolvePerspective(msg, ctx): 'actor' | 'target' | 'bystander'

// 2. Declarative template table — keyed by systemOperationType.
SYSTEM_MESSAGE_TEMPLATES: Record<string, TemplateFn>

// 3. Main resolver — combines templates + fallback chain.
resolveSystemMessageText(msg, ctx): string
```

Consumers pass any `MessageType` plus the current user's `{ meId, meName }` context and get back the final display string. To add a new event type: add **one** entry to `SYSTEM_MESSAGE_TEMPLATES` and all three surfaces auto-update.

### Templates currently registered

```ts
user_removed / participant_removed
user_added / participant_added
user_left / participant_left / member_left
admin_promoted
admin_demoted
group_created
group_renamed
group_description_changed
group_icon_changed
```

Aliases (`participant_removed` → `user_removed`, etc.) reflect what the backend has historically shipped — keeping them is cheap insurance against future renames.

### Resolution chain inside `resolveSystemMessageText`

1. **Structured template** — if the message has a `systemOperationType` that's registered, run the template function. If it returns a value, use it.
2. **Actor-prefix replace** — for actor perspective, if `senderName` is set and `message` starts with `"<senderName> "`, replace the prefix with `"You "`. Covers events the server emits with `"Anil Rathod created group X"` style text where no template fires.
3. **Target-name replace** — for target perspective, if `targetUserName` is explicitly provided, replace it inline with `"you"`.
4. **Legacy verb-regex** — for non-actor perspectives without a `targetUserId`, scan the text for `\b(removed|added|made|invited|kicked|dismissed)\s+<meName>\b` and rewrite the matched name to `"you"`. Handles the cold-load case where REST conversation list strips system metadata.
5. **Raw text passthrough** — bystander default; nothing matched.

### Perspective resolution (`resolvePerspective`)

| Signal | Maps to |
| --- | --- |
| `senderId === meId` | `actor` |
| `senderId === '' && senderName === meName` | `actor` (slim-event fallback) |
| `targetUserId === meId` | `target` |
| `targetUserId === '' && targetUserName === meName` | `target` (slim-event fallback) |
| Neither match | `bystander` |

The name-based fallback exists because the slim `conversation_updated` socket payload carries `senderName` but no `senderId`. Without the fallback, the sender's sidebar would flash through `bystander` perspective in the brief window before `new_message` arrives with the full metadata.

## Three Surfaces × Three Perspectives — End-To-End Matrix

| # | Event | Sender (actor) | Receiver (target) | Bystander |
| --- | --- | --- | --- | --- |
| 1 | Self-exit | "You left the group" | — | "Anil left the group" |
| 2 | Admin kick | "You removed Ajay" | "Anil removed you" | "Anil removed Ajay" |
| 3 | Admin add | "You added Ajay" | "Anil added you" | "Anil added Ajay" |
| 4 | Promote | "You made Ajay an admin" | "You're now an admin" | "Anil made Ajay an admin" |
| 5 | Demote | "You dismissed Ajay as admin" | "You're no longer an admin" | "Anil dismissed Ajay as admin" |
| 6 | Group created | "You created group X" (actor-prefix) | — | "Anil created group X" |
| 7 | Group renamed | "You changed the subject to X" (actor-prefix) | — | Raw |
| 8 | Description / icon changed | "You changed …" (actor-prefix) | — | Raw |

All three surfaces (sidebar / in-chat pill / banner) call the same resolver, so they always agree.

## Data Flow

```
[Admin clicks Remove on Ajay]
   │
   ├─► Optimistic patchOptimisticLastMessage → sidebar: "You removed Ajay" ✓
   │
   ├─► REST apiRemoveParticipant (background)
   │     ↓ ack
   │   addOrReplaceChat (time-checked merge — won't revert optimistic)
   │
   ▼
Server broadcasts to ALL members:
   ├─ participant_left           → applyParticipantLeft (participants array)
   ├─ new_message (system, full metadata)
   │     ↓
   │   onNewMessage → receiveMessage
   │     • appends to chat.messages (in-chat pill)
   │     • writes FULL message to chat.lastMessage (sidebar)
   │     • runs kick derivation for target perspective
   └─ conversation_updated (slim)
         ↓
       patchConversationFromEvent
         • preserves system metadata on same-message-id merge
         • resolves senderId from participants when slim payload omits it
```

## Consumers

### In-chat pill — [src/views/apps/chat/ChatLog.tsx](../../src/views/apps/chat/ChatLog.tsx)

```tsx
<Typography>
  {resolveSystemMessageText(message, {
    meId: String(data.userContact.id ?? ''),
    meName: data.userContact.fullName ?? ''
  })}
</Typography>
```

### Sidebar preview — [src/views/apps/chat/SidebarLeft.tsx](../../src/views/apps/chat/SidebarLeft.tsx)

Same resolver call for `lastMessage`. The `senderPrefix` block ("You: …", "Anil Rathod: …") runs only for non-system messages (`contentType !== 'system'`) so it never collides with the perspective rewrite. Full names (not first names) used in the prefix for parity with Telegram-style sidebars.

### Banner — [src/views/apps/chat/ChatContent.tsx](../../src/views/apps/chat/ChatContent.tsx)

Composer-area banner (shown when `canInteract === false`) uses the helper `isSelfLeftMessage` plus the cached `contact.selfLeft` flag to pick between:

- "You left the group." (self-exit)
- "You're no longer a member of this group." (generic / admin-kick fallback)

The in-chat removal pill rendered by ChatLog already shows the active-voice `"Anil Rathod removed you"`, so the banner intentionally uses neutral wording to avoid duplicating the line just above it.

## Live-Path Plumbing (so the resolver always has the right data)

Several reducers in [src/store/apps/chat/index.ts](../../src/store/apps/chat/index.ts) were tightened to keep the resolver fed:

### `receiveMessage` — writes system messages to `lastMessage` (not just `messages`)

When a system event arrives via `new_message`, the reducer now also writes the FULL stored message to `chat.lastMessage` (including `systemOperationType`, `targetUserId`, `targetUserName`). Without this, the sidebar resolver had no metadata to match against and fell through to raw text until the slim `conversation_updated` event arrived and patchConversationFromEvent (incorrectly) overwrote the rich message with a stripped version.

Kick-of-me path (`targetIsMe` true for `user_removed`) additionally:
- Sets `chatEntry.removedBy` / `chatEntry.removedByName` (drives the banner)
- Rewrites `chat.lastMessage.message` to active-voice `"<Actor> removed you"`
- Mirrors actor fields onto `selectedChat.contact`
- Persists `removedByName` to the localStorage kick-actor cache

### `patchConversationFromEvent` — preserves system metadata + smart `senderId` resolution

Slim `conversation_updated` events arrive with only `{ messageId, contentPreview, senderName, sentAt }` — no `senderId`, no system metadata. The handler now:

1. **Preserves system metadata when `sameMessage`** — carries over `contentType`, `systemOperationType`, `targetUserId`, `targetUserName` from existing lastMessage when the patch's `messageId` matches. Stops the slim event from stripping the rich metadata that `receiveMessage` just wrote.
2. **Resolves `senderId` from `senderName`** — for different-message-id patches, looks up the sender in this priority order:
   - `sameMessage` → keep existing senderId
   - `senderName === userProfile.fullName` → use my own id (resolver detects 'actor')
   - Lookup `chatEntry.participants` by `displayName` / `username` → use participant id
   - Fall back to `state.contacts` lookup
   - Else → empty string (no stale carry-over from unrelated previous sender)

The participants lookup is what restores the "Saket: hello" / "Anil: hello" sidebar prefix for incoming group messages. Without it, the slim event left `senderId` empty and the `senderPrefix` block was skipped.

### `addOrReplaceChat` — time-checked merge

Used by participant-mutation thunks after REST returns. Before this fix, it unconditionally overwrote `chat.lastMessage` with the response's lastMessage — which carries the PRE-action message, **reverting** any optimistic preview we just wrote on click. Now:

1. If `existing.lastMessage.time > incoming.lastMessage.time` → keep existing.
2. Same message id → field-by-field merge (preserves senderId, senderName, contentType, system metadata).
3. Different id, incoming newer → use incoming.

### `fetchChatsContacts.fulfilled` — same field-by-field merge

After every system event, `onNewMessage` re-dispatches `fetchChatsContacts` so `adminIds` / `participants` stay in sync. The merge previously preserved only `senderId` / `senderName` from cached state — now preserves the full system metadata too, so the resolver doesn't lose its inputs after every refetch.

### `applyParticipantLeft` — idempotent active-voice text

When the current user is kicked, this reducer used to always write the generic `"You were removed from this group"` to `lastMessage`. A duplicate `participant_left` fire (StrictMode dev double-run or socket re-delivery) would reset the text and the synthesis dedupe ref would prevent re-fixing it. Now writes active-voice text directly when `removedByName` is available:

- `removedBy` absent → `"You left the group"` (self-exit)
- `removedBy` + `removedByName` → `"<Actor> removed you"`
- `removedBy` + no name → `"You were removed from this group"` (degraded fallback)

Repeat fires produce the same output → no flash.

## Optimistic Updates For Admin Actions

`patchOptimisticLastMessage` reducer + integration in three thunks:

- `removeParticipantFromGroup` → "You removed Ajay Antony" appears in sidebar on click
- `addParticipantsToGroup` → "You added Ajay Antony" appears on click
- `updateParticipantRoleInGroup` → "You made Ajay an admin" / "You dismissed Ajay as admin" appears on click

The optimistic write touches **only** `chat.lastMessage`. It never appends to `chat.messages`, so the eventual real `new_message` broadcast doesn't duplicate the in-chat pill — it just refines the sidebar with the real server id/timestamp via `receiveMessage`. The time-check in `addOrReplaceChat` ensures the REST response can't revert the optimistic text.

## Cold-Load Persistence

Two localStorage flags in [src/lib/chat/api.ts](../../src/lib/chat/api.ts) survive refresh and are read by `sdkConversationToChat`:

| Flag | Key | Written when | Cleared when | Effect |
| --- | --- | --- | --- | --- |
| Kick actor | `antz-chat:kick-actor` | `applyParticipantLeft` (admin-kick) + `receiveMessage` derivation + `setChatMessages` derivation | `applyParticipantJoined` (re-add) | Sidebar + banner show `"<Actor> removed you"` instantly on cold refresh — no flash through generic placeholder |
| Self-left | `antz-chat:self-left` | `applyParticipantLeft` (self-exit) | `applyParticipantJoined` (re-add) | Sidebar shows `"You left the group"` and banner shows `"You left the group."` instantly on cold refresh |

The adapter reads both when `isGroup && !isCurrentUserActive` and surfaces the resolved values on the contact (`removedBy`, `removedByName`, `selfLeft`). Consumers (banner) check the cached flag in addition to the live lastMessage signal.

## Cold-Load Sidebar Hydration

`enrichLastMessageSenders` thunk previously fired N parallel `getMessage(id)` REST calls — one per group whose `lastMessage.senderName` was missing — so an admin in many groups saw the sidebar visibly hydrate row-by-row.

Now uses a fast-path:
1. For each target with a known `senderId`, look up the sender in the chat's local `participants` array → use `displayName` / `username`. Zero network calls.
2. Only chats whose sender isn't in participants (rare — e.g. removed member who hasn't been cached) fall back to the per-message REST fetch.

Result: sidebar populates with all prefixes in one paint.

## Side-Effects Audit

| Area | Status |
| --- | --- |
| Regular text messages (DM + group) | Unaffected — resolver returns raw text when `systemOperationType` absent |
| Deleted-for-everyone tombstones | Unaffected — tombstone branch fires before resolver |
| Forwarded messages | Unaffected — `isForwarded()` check happens before perspective rewrite |
| Attachment messages | Unaffected — attachment-render branch fires before resolver |
| MessageInfo / Forward / Reaction-details dialogs | Unaffected — read original Redux state, not the resolved string |
| Pin / Edit / Reaction reducers | Unaffected — don't read system-message text |
| DM perspective rewrite | Returns raw text — no `senderName` startsWith match, no `targetUserName` |
| Multi-device re-add | Cleared via `participant_joined` socket event. If the device is offline during re-add, REST conversation list reports `isCurrentUserActive=true` on next refresh; adapter only reads localStorage caches when `isCurrentUserActive=false`, so stale entries are inert. |
| StrictMode double-fire of socket handlers | `applyParticipantLeft` writes idempotent text. `syntheticKickFiredRef` blocks duplicate pill synthesis. |
| Optimistic update on action failure | Optimistic text stays until next socket event reconciles — REST failure is rare; no rollback is intentionally implemented to keep the code simple. |

## Recommended Backend Improvements

To remove the remaining legacy verb-regex fallback and the localStorage caches:

| Field | Purpose |
| --- | --- |
| `targetUserId` / `targetUserName` on every system event metadata | Already present for most — extend to all (`group_renamed`, `group_description_changed`, etc.) so structured rewrite fires uniformly. |
| Full system metadata on `conversation_updated` slim payload | Would eliminate the metadata-preservation merge in `patchConversationFromEvent` |
| Full system metadata on `listConversations` `lastMessage` | Would eliminate the localStorage kick-actor / self-left caches |
| Deliver the `user_removed` `new_message` event to the kicked socket | Would eliminate the client-side synthesis in `onParticipantLeft` (see [kicked-user-fix.md](./kicked-user-fix.md)) |

## Related Files

- [src/lib/chat/systemMessagePerspective.ts](../../src/lib/chat/systemMessagePerspective.ts) — resolver module + template table
- [src/lib/chat/api.ts](../../src/lib/chat/api.ts) — adapter + localStorage caches
- [src/store/apps/chat/index.ts](../../src/store/apps/chat/index.ts) — reducers + action thunks
- [src/views/apps/chat/ChatLog.tsx](../../src/views/apps/chat/ChatLog.tsx) — in-chat pill consumer
- [src/views/apps/chat/SidebarLeft.tsx](../../src/views/apps/chat/SidebarLeft.tsx) — sidebar preview consumer
- [src/views/apps/chat/ChatContent.tsx](../../src/views/apps/chat/ChatContent.tsx) — banner consumer
- [src/views/apps/chat/AppChat.tsx](../../src/views/apps/chat/AppChat.tsx) — socket handlers + synthesis
- [kicked-user-fix.md](./kicked-user-fix.md) — companion doc covering the kicked-user UX path
- [api-integration-status.md](./api-integration-status.md) — backend quirks list
