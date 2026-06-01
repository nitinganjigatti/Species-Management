# Delete-For-Me — WhatsApp-Style Undo

How the chat module gives the user a 5-second window to undo a per-user "Delete for me" — and why the implementation defers the server commit instead of firing immediately.

## What the user sees

1. User clicks **Delete for me** on a message bubble → confirmation dialog.
2. On confirm → the bubble **disappears instantly** + a toast pops up at the bottom:
   ```
   Message deleted     UNDO
   ```
3. The toast stays visible for **5 seconds**.
4. If the user clicks **UNDO** during that window → the message snaps back into the chat at its exact original time-sorted position. No server call is made.
5. If the user does nothing (or navigates away) → the toast auto-dismisses and the deletion is committed to the server.

Same pattern WhatsApp Web uses for its own delete-for-me action.

## Why we defer the server call

The local optimistic UI is easy — the trick is making the **server commit reversible**. Two ways to do it:

| Option | Approach | Trade-off |
| --- | --- | --- |
| A. Eager commit | Call server immediately, locally restore on undo | Server has already accepted the delete → an "undo" only works while you're still online + in this session. Refresh loses it. |
| B. Deferred commit | Optimistic local remove + 5 s timer that fires the server call last | Undo never has to "un-delete" on the server — it just **cancels the timer**. Clean, no backend round-trip on undo. |

We use **B**. The same `deleteMessageForMeOverSocket(messageId)` call still fires — it's just been moved inside a `setTimeout(5000)`.

## Implementation — two changes, surgical scope

### 1. New reducer — `restoreDeletedMessage`

[src/store/apps/chat/index.ts](../../src/store/apps/chat/index.ts) — purely additive, called from exactly ONE place (the Undo button click).

```ts
restoreDeletedMessage: (state, action: PayloadAction<{ chatId: ChatEntityId; message: MessageType }>) => {
  // idempotent: if the id is already present, no-op
  if (chatEntry.chat.messages.some(m => m.id === message.id)) return

  // insert at time-sorted position
  const restoredTime = new Date(message.time).getTime()
  const insertAt = chatEntry.chat.messages.findIndex(m => new Date(m.time).getTime() > restoredTime)
  // splice into place

  // bring sidebar preview back if the restored message is the newest
  if (restoredTime >= lastTime) chatEntry.chat.lastMessage = message

  // sync selectedChat
}
```

**Why time-sorted insertion, not by index:** during the 5-second window, new messages may arrive (`new_message`) and shift indices. Re-locating by `time` is stable.

**Why idempotent:** in a race where the server broadcast `message_deleted_for_me` lands after the user clicks Undo, `applyMessageDeleteForMe` would run again — but on a non-existent id, it's a no-op (`filter` keeps everything). The Undo restore stays.

### 2. `handleConfirmDelete` in MessageActions — `'me'` branch only

[src/views/apps/chat/MessageActions.tsx](../../src/views/apps/chat/MessageActions.tsx) — the `'everyone'` branch is byte-identical to before. Only the `'me'` branch was rewritten.

```ts
// Delete-for-me — WhatsApp-style optimistic remove + 5s Undo window.
const messageSnapshot = { /* full message data — id, msg, time, feedback, attachments, ... */ }

setConfirmingDelete(null)
dispatch(applyMessageDeleteForMe({ messageId }))   // optimistic local remove

let cancelled = false
const commitTimer = setTimeout(() => {
  if (cancelled) return
  deleteMessageForMeOverSocket(messageId).catch(...)
}, 5000)

toast(
  (t) => (
    <span>
      Message deleted
      <button onClick={() => {
        cancelled = true
        clearTimeout(commitTimer)
        dispatch(restoreDeletedMessage({ chatId, message: messageSnapshot }))
        toast.dismiss(t.id)
      }}>UNDO</button>
    </span>
  ),
  { duration: 5000 }
)
```

**The `cancelled` flag is closure-scoped.** Each delete has its own closure, so stacking multiple delete-for-me's in quick succession works — each toast has its own timer, undo state, and snapshot.

**Window-bound `setTimeout`** — survives navigation. If the user leaves the chat or even the chat module before 5s elapse, the commit still fires and the server gets the same call it would have gotten immediately before this change.

## End-to-end timeline

| T | Event |
| --- | --- |
| 0 ms | User clicks Delete for me → confirm |
| ~5 ms | `applyMessageDeleteForMe` dispatch → bubble disappears |
| ~5 ms | Toast renders with UNDO + 5s timer set |
| ~5 ms | Server commit `setTimeout(5000)` armed |
| 5000 ms | Timer fires → `deleteMessageForMeOverSocket` → server processes → broadcasts `message_deleted_for_me` back |
| 5000 ms | Toast auto-dismisses |
| Echo arrives | `applyMessageDeleteForMe` runs again — no-op (already removed) |

If the user clicks Undo at any time during the 5s window: `cancelled = true` + `clearTimeout` + `restoreDeletedMessage`. The server is never told.

## Edge cases handled

| Case | Behavior |
| --- | --- |
| Undo clicked after server already committed (timer fired) | Can't happen via the UI — toast is dismissed by then, button is gone. |
| Multiple delete-for-me's pending undo simultaneously | Each has its own toast + closure-scoped timer + cancelled flag. Independent. |
| User navigates away during the 5s window | Timer is window-bound → fires → server commits. Consistent. |
| Server echo arrives after Undo click | `applyMessageDeleteForMe` is idempotent on a missing id. Undo wins. |
| Restored message already present (race) | `restoreDeletedMessage` early-return on duplicate id — no double-insert. |
| `currentChatId` somehow missing | Falls back to immediate server delete (legacy path) — defensive, no undo offered. |
| `confirmingDelete === 'everyone'` | Untouched — same call, no undo (matches WhatsApp; delete-for-everyone has no undo). |

## Important caveat — backend interaction

Per [the backend ticket filed for delete-for-me](./api-integration-status.md), the chat server currently **returns deleted-for-me messages in `messages.list` for the same user** on subsequent fetches. That means even after the 5s commit, refreshing the chat re-introduces the message.

This is a **separate** backend issue and not something the Undo feature fixes or causes. The Undo's job is the immediate 5-second reversal — that works correctly regardless of the backend bug.

Once the backend filters deleted-for-me messages properly on `messages.list`, the commit will be durable across refreshes — and the Undo continues to work exactly as documented.

## What is NOT touched

- **Delete-for-everyone** path (`'everyone'` branch) — byte-identical to before this feature.
- **Socket handler `onMessageDeletedForMe`** — unchanged. Still dispatches `applyMessageDeleteForMe`, which is idempotent.
- **Existing `applyMessageDeleteForMe` reducer** — unchanged.
- **All other reducers, components, socket handlers, REST calls** — untouched.

## Related Files

- [src/views/apps/chat/MessageActions.tsx](../../src/views/apps/chat/MessageActions.tsx) — the `handleConfirmDelete` `'me'` branch + Undo toast UI
- [src/store/apps/chat/index.ts](../../src/store/apps/chat/index.ts) — `restoreDeletedMessage` reducer (additive) + existing `applyMessageDeleteForMe`
- [src/lib/chat/api.ts](../../src/lib/chat/api.ts) — `deleteMessageForMeOverSocket` (the deferred commit target — unchanged)
- [api-integration-status.md](./api-integration-status.md) — the related server-side filter bug (separate backend ticket)
