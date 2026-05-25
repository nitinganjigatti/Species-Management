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
- **Banner copy:** the placeholder text reads "You were removed from this group" regardless of self-exit vs admin-removal. `applyParticipantLeft` already records `removedBy` / `removedByName` separately for the ChatContent banner; the sidebar placeholder is intentionally generic.

## Related Files

- [src/lib/chat/api.ts](../../src/lib/chat/api.ts) — adapter
- [src/store/apps/chat/index.ts](../../src/store/apps/chat/index.ts) — reducers
- [src/views/apps/chat/ChatContent.tsx](../../src/views/apps/chat/ChatContent.tsx) — banner + composer gate via `canInteract`
- [src/views/apps/chat/SidebarLeft.tsx](../../src/views/apps/chat/SidebarLeft.tsx) — system-message rendering branch
- [api-integration-status.md](./api-integration-status.md) — quirk #11 (server doesn't unsubscribe kicked sockets)
