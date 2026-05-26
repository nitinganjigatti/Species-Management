# Kicked-User Sidebar & ChatLog Fix

How the chat module prevents post-kick group messages from leaking into a removed user's UI.

## The Problem

When a user is removed from a group, the chat backend continues to surface group activity to them via three channels:

1. `GET /conversations` returns the kicked group with the **live** `lastMessage` (the current latest, post-kick included).
2. `GET /messages` returns the **full** message list with no membership-window filtering.
3. Socket broadcasts (`new_message`, `conversation_updated`) still fire on kicked users' sockets.

Without client-side defense, this produces a confusing UI:

- The sidebar preview keeps updating with new group activity (e.g. "Anil: hii").
- The ChatLog appends new messages live, even though the composer is disabled and the banner says "You're no longer a member of this group."

This is documented as backend quirk #11 in [api-integration-status.md](./api-integration-status.md). The full fix requires the server to honor per-user membership windows — until then, the client filters content locally.

## Why The Client Couldn't Cope (Pre-Fix)

Four different code paths wrote group activity into Redux state. None of them checked the current user's membership status:

| Path | Trigger | What it wrote |
| --- | --- | --- |
| `sdkConversationToChat` adapter | REST cold-load (`fetchChatsContacts`, `fetchConversation`, etc.) | Mapped server's live `lastMessage` directly into `chat.chat.lastMessage` |
| `patchConversationFromEvent` reducer | Slim `conversation_updated` socket event | Overwrote `chat.chat.lastMessage` with the broadcast preview |
| `setChatMessages` reducer | `selectChat` thunk's REST `messages.list` resolves | Replaced `chat.chat.messages` AND `chat.chat.lastMessage` |
| `receiveMessage` reducer | Live `new_message` socket event | Appended to `chat.chat.messages` |

Each one was correct in isolation. The missing concept was "this conversation belongs to a kicked user — content from the server is no longer trustworthy for me."

## The Fix — Four Coordinated Guards

A single condition (`chat.isGroup === true && chat.isCurrentUserActive === false`) is checked at every write site. `isCurrentUserActive` is already computed by the adapter from the server's `participants[me].isActive` and synchronised by `applyParticipantLeft` on live kick events.

### 1. Adapter placeholder — [src/lib/chat/api.ts](../../src/lib/chat/api.ts)

```ts
const sidebarLastMessage =
  isGroup && !isCurrentUserActive && lastMessage
    ? { ...lastMessage, message: 'You were removed from this group', contentType: 'system' as const }
    : lastMessage
```

For kicked groups, the cold-load adapter writes a frozen placeholder instead of the server's live `lastMessage`. The sidebar renders the placeholder via the existing `contentType === 'system'` branch.

### 2. Live conversation updates — [src/store/apps/chat/index.ts](../../src/store/apps/chat/index.ts) (`patchConversationFromEvent`)

```ts
if (chatEntry.isGroup && chatEntry.isCurrentUserActive === false) return
```

Slim `conversation_updated` events for kicked groups are dropped before any state mutation. Sidebar preview stays pinned to the placeholder.

### 3. Live new messages — [src/store/apps/chat/index.ts](../../src/store/apps/chat/index.ts) (`receiveMessage`)

```ts
if (chatEntry.isGroup && chatEntry.isCurrentUserActive === false) return
```

Live `new_message` events for kicked groups are dropped before append. ChatLog never grows.

### 4. REST messages.list — [src/store/apps/chat/index.ts](../../src/store/apps/chat/index.ts) (`setChatMessages`)

```ts
const isKickedGroup = chatEntry.isGroup && chatEntry.isCurrentUserActive === false
const skipMessagesWrite = isKickedGroup && chatEntry.chat.messages.length > 0
if (!skipMessagesWrite) {
  chatEntry.chat.messages = messages
}
if (!isKickedGroup) {
  chatEntry.chat.lastMessage = messages[messages.length - 1]
}
```

Three-way logic:

- **First open after kick** (`messages.length === 0`) → write everything. The user sees their full pre-kick history. The few latest entries may include post-kick text from the server, but that is an acceptable one-time limitation without server-side filtering.
- **Subsequent calls** (cache already populated) → skip the `messages[]` write. Any re-fetch triggered by socket events cannot surface new post-kick messages.
- **`lastMessage`** is always skipped for kicked groups so the sidebar placeholder set by the adapter is never overwritten.

## End-to-End Behavior

| Step | Behavior |
| --- | --- |
| Hard refresh, kicked group auto-opens | ChatLog populates with pre-kick history (first `setChatMessages` allowed). Sidebar shows placeholder. |
| Sender posts a new message live | `receiveMessage` blocked. ChatLog doesn't grow. |
| Live `conversation_updated` slim event arrives | `patchConversationFromEvent` blocked. Sidebar preview stays. |
| Socket activity triggers a re-fetch of `messages.list` | `setChatMessages` second call skipped (`messages.length > 0`). ChatLog stays frozen. |
| Banner | "You're no longer a member of this group." (existing behavior). |
| Composer | Disabled via `canInteract` gate (existing behavior). |

## Tracing & Diagnosis Notes

The fix was identified using temporary `[kicked-trace]` console logs placed at every write site. Two findings drove the final implementation:

1. **`fetchChatsContacts` runs twice on hard refresh** — once before `userProfile.id` loads (so the adapter sees `meId: ''` and can't identify the current user) and once after. The first run could pollute state with the live `lastMessage` until the second run replaced it with the placeholder.
2. **`setChatMessages` runs more than once per chat open** — initial open writes the message list, then live socket events trigger `useEffect` chains in `AppChat.tsx` that re-dispatch `selectChat`, which calls `setChatMessages` again. The second call was the path responsible for "123 reset"-style post-kick leaks in the ChatLog.

All trace logs were removed once the fix was confirmed.

## Known Limitations

- **Offline kicks with intervening activity:** if the user is kicked while offline and other members post messages before the user refreshes, those post-kick messages will appear in the ChatLog on first open because the server returns them in `messages.list` and the client has no `leftAt` timestamp to filter against. Live updates after the first open are still blocked.
- **Frozen state is per-session:** `messages[]` is preserved in Redux memory, not persisted. After a hard refresh, the first `setChatMessages` call writes whatever the server returns.

## Live-Kick Actor Resolution (v1.2.1)

Backend v1.2.1 has two relevant gaps that the client must compensate for so the kicked user sees a complete, WhatsApp-style removal experience instantly (no refresh required):

1. **`participant_left` socket event omits `removedByName`.** Payload carries `removedBy` (actor user id) but no display-name field. Confirmed via `[kick-live]` trace: `removedByName: undefined`.
2. **`new_message` system event (`user_removed`) is not delivered to the kicked socket.** Other members receive the broadcast and ChatLog appends the pill via the normal path; the kicked socket only sees `participant_left`. Confirmed via `[kick-live]` trace.

Without compensation, the kicked user would see no actor name in the banner or sidebar, and no removal pill in chat — they would need a refresh for the data to populate via `setChatMessages` derivation.

### Client compensation — [src/views/apps/chat/AppChat.tsx](../../src/views/apps/chat/AppChat.tsx) `onParticipantLeft`

```ts
// 1. Resolve actor name from local participants (they're still a member).
if (!removedByName && removedBy) {
  const chat = chatsRef.current?.find(c => String(c.id) === String(conversationId))
  const actor = chat?.participants?.find(p => String(p.userId) === String(removedBy))
  removedByName = actor?.displayName ?? actor?.username
}

// 2. Synthesize the user_removed system message and route it through
// receiveMessage — same shape other members receive from the server.
if (leaverIsMe && removedBy && !syntheticKickFiredRef.current.has(convKey)) {
  syntheticKickFiredRef.current.add(convKey)
  dispatch(receiveMessage({
    conversationId,
    message: {
      id: `synthetic-kick-${convKey}-${Date.now()}`,
      senderId: String(removedBy),
      senderName: removedByName,
      contentType: 'system',
      systemOperationType: 'user_removed',
      targetUserId: String(userId),       // == me
      targetUserName: userProfileNameRef.current,
      // ...
    },
    isOwn: false
  }))
}
```

`receiveMessage` then:
- Appends the synthetic message to `chat.messages` → ChatLog renders pill via existing perspective rewrite ("Anil Rathod removed you").
- Triggers the kicked-me derivation block (added alongside this fix) → sets `chatEntry.removedBy` / `removedByName` and rewrites `chat.lastMessage` to "Anil Rathod removed you".
- Mirrors to `state.selectedChat.contact` so the open chat's banner re-renders without waiting for a re-select.

### Refresh path unchanged

`messages.list` still returns the real server kick message with full metadata; `setChatMessages` derivation reads it the same way it did before. The synthetic message (if any) is replaced by the real one when the user refreshes, since `setChatMessages` writes the fresh array verbatim.

### Dedupe

A `syntheticKickFiredRef` (Set<conversationId>) prevents duplicate pills from StrictMode's double-fire of socket handlers. The entry is cleared when `applyParticipantJoined` fires for the same user, so a future re-kick can synthesize a fresh pill.

### Recommended backend fix

Either delivering the `new_message` system event to the kicked socket (preferred — single source of truth) or including `removedByName` in `participant_left` would remove the need for the synthesis path. The participants-lookup fallback for the actor name is small and harmless to keep regardless.

## Banner copy

Banner copy is driven by `removedByName` resolved from any of: (a) `applyParticipantLeft` payload, (b) participants-lookup fallback, (c) `setChatMessages` derivation from messages.list, (d) `receiveMessage` derivation from the synthesized (or, on refresh, real) system message. Active voice "<Actor> removed you" matches the in-chat pill and sidebar preview.

For self-exit (no `removedBy`), the banner uses `"You left the group."` — detected via either:
- `selectedChat.chat.lastMessage` carrying `systemOperationType: 'user_left'` with `senderId === me` (live path), OR
- `selectedChat.contact.selfLeft === true` (cold-load path, hydrated from localStorage cache)

## Cold-Load Persistence

Two localStorage flags survive page refresh so the sidebar + banner show the right copy instantly on cold load — no flash through generic placeholders while waiting for `setChatMessages` derivation. See [system-message-perspective.md](./system-message-perspective.md#cold-load-persistence) for the full cache table.

| Key | Hydrated by adapter when | Cleared on |
| --- | --- | --- |
| `antz-chat:kick-actor` | Admin-kick — sets `contact.removedBy` / `removedByName` | Re-add via `applyParticipantJoined` |
| `antz-chat:self-left` | Self-exit — sets `contact.selfLeft = true` | Re-add via `applyParticipantJoined` |

Both are written from the live socket path (`applyParticipantLeft` + `receiveMessage` derivation) so a kick that happens in the current session populates the cache before the user has a chance to refresh.

## Idempotent `applyParticipantLeft`

The reducer writes the most specific copy available based on the event payload:

| Condition | `chat.lastMessage.message` |
| --- | --- |
| Self-exit (no `removedBy`) | `"You left the group"` |
| Admin-kick + `removedByName` resolved | `"<Actor> removed you"` |
| Admin-kick + no `removedByName` | `"You were removed from this group"` (degraded fallback) |

Idempotency matters because `participant_left` can fire more than once (StrictMode dev double-run, socket re-delivery). The active-voice text matches what `receiveMessage` synthesis writes, so a duplicate fire after synthesis has already executed (and `syntheticKickFiredRef` blocks re-synthesis) doesn't reset the sidebar to the generic copy.

## Optimistic Admin Actions

For the admin's side, the kick action goes through `removeParticipantFromGroup` thunk which now dispatches `patchOptimisticLastMessage` BEFORE the REST call. The sidebar updates to `"You removed Ajay Antony"` instantly on click — no waiting for the REST round-trip + socket broadcast. The optimistic write touches only `chat.lastMessage` (not `chat.messages`) so the eventual real `new_message` broadcast doesn't duplicate the in-chat pill. The `addOrReplaceChat` time-check then prevents the REST response from reverting the optimistic text.

Same pattern applies to `addParticipantsToGroup` and `updateParticipantRoleInGroup` (promote/demote).

## Related Files

- [src/lib/chat/api.ts](../../src/lib/chat/api.ts) — adapter + localStorage caches
- [src/lib/chat/systemMessagePerspective.ts](../../src/lib/chat/systemMessagePerspective.ts) — shared resolver consumed by sidebar + pill + banner
- [src/store/apps/chat/index.ts](../../src/store/apps/chat/index.ts) — reducers + optimistic-update thunks
- [src/views/apps/chat/AppChat.tsx](../../src/views/apps/chat/AppChat.tsx) — socket handlers + synthesis
- [src/views/apps/chat/ChatContent.tsx](../../src/views/apps/chat/ChatContent.tsx) — banner + composer gate via `canInteract`
- [src/views/apps/chat/SidebarLeft.tsx](../../src/views/apps/chat/SidebarLeft.tsx) — system-message rendering branch
- [system-message-perspective.md](./system-message-perspective.md) — companion doc on the shared resolver architecture
- [api-integration-status.md](./api-integration-status.md) — quirk #11 (server doesn't unsubscribe kicked sockets)
