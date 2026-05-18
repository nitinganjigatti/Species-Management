# `[chat:receipt]` log reference

Complete catalog of the diagnostic logs that trace the send → delivered → read-receipt pipeline. Filter your browser console with `chat:receipt` to see only these.

These logs are intentional and kept in production — they're cheap, low-volume per cycle, and invaluable when debugging tick state across two users.

Companion doc: [api-integration-status.md](./api-integration-status.md) (overall integration map). Backend quirks the logs help diagnose are listed there under "Known server-side quirks."

---

## Quick map by namespace

| Prefix | Meaning |
|---|---|
| `A` — Anchor | Your client just acked an outbound message |
| `B` — read **B**roadcast trigger | You're telling the server you read messages (REST `mark-as-read`) |
| `D` — **D**elivered | Server told us our messages reached a recipient's device |
| `S` — **S**een (read_receipt inbound) | Server told us someone read our messages |
| `R` — **R**educer | State mutation (match / mirror / drain / merge) |
| `⚠ … BACKEND-SUSPICIOUS` | Presence cross-check flagged a server-side timing/semantic issue |

---

## Send-side: A — outbound anchor

| Tag | File:line | Fires when | Key payload |
|---|---|---|---|
| `A0 sent message anchor` | [src/store/apps/chat/index.ts:619](../../../src/store/apps/chat/index.ts) | `sendMsg` thunk received the socket ack and resolved a real `messageId` for our outbound message | `{ id, conversationId, initialFeedback, text }` |

The `id` here is what you'll search for in subsequent `D1` / `S1` / `R2` logs.

---

## Send-side: B — mark-as-read trigger

| Tag | File:line | Fires when | Notes |
|---|---|---|---|
| `B0 message arrived for background chat — NOT marking read` | [src/views/apps/chat/AppChat.tsx](../../../src/views/apps/chat/AppChat.tsx) | A `new_message` for a chat that's **not currently open** | We only increment the unread badge; we don't call `markConversationRead` |
| `B1 markConversationRead → request for <chatId> (no messageId = mark all)` | [src/store/apps/chat/index.ts:528](../../../src/store/apps/chat/index.ts) (chat open) + [src/views/apps/chat/AppChat.tsx](../../../src/views/apps/chat/AppChat.tsx) (msg-in-open-chat) | REST `POST /conversations/:id/read` is being sent | Empty `{}` body = "mark up to latest" |
| `B2 markConversationRead ← OK for <chatId>` | same | REST returned 200 | Server should now broadcast `read_receipt` to other participants |
| `B2 markConversationRead FAILED for <chatId>` | same | REST returned error | Receipt won't propagate; investigate auth / payload / response code |

---

## Receive-side: D — delivery events

Server → us, about **messages we sent** that just landed on a recipient device.

| Tag | File:line | Fires when | Key payload |
|---|---|---|---|
| `D1 message_delivered ← event` | [src/views/apps/chat/AppChat.tsx](../../../src/views/apps/chat/AppChat.tsx) | Single-message delivery event arrived | `{ messageId, conversationId, presence }` |
| `D1b messages_delivered ← event` | same | Batch delivery (catch-up when a recipient comes back online) | `{ conversationId, count, messageIds }` |
| `⚠ D1 SKIPPED` | same | Server stamped delivered but no recipient is online per `useChatStore.onlineUsers`. Handler **skips** the dispatch — tick stays single until a `read_receipt` arrives (which sets `isSeen=true` AND `isDelivered=true` in one mutation). Policy adopted 2026-05-18d. | `{ messageId, offlineRecipients }` |
| `⚠ D1b SKIPPED` | same | Same skip, batch variant | |

---

## Receive-side: S — read-receipt inbound

Server → us, about **OTHERS reading the messages we sent**.

| Tag | File:line | Fires when | Key payload |
|---|---|---|---|
| `S0 read_receipt ← null/undefined event, ignoring` | [src/views/apps/chat/AppChat.tsx:327](../../../src/views/apps/chat/AppChat.tsx) | Event arrived with no body | Should never happen in practice |
| `S1 read_receipt ← raw event` | [src/views/apps/chat/AppChat.tsx:332](../../../src/views/apps/chat/AppChat.tsx) | Receipt arrived | `{ conversationId, readerUserId, readAt, messageId, updatedMessageIds, fullyReadMessageIds, presence }` |
| `⚠ S1 BACKEND-SUSPICIOUS` | [src/views/apps/chat/AppChat.tsx:352](../../../src/views/apps/chat/AppChat.tsx) | Reader is **not** in `useChatStore.onlineUsers` | Reader logged out before propagation, or backend timing. Doesn't break the tick. |
| `S2 split` | [src/views/apps/chat/AppChat.tsx:397](../../../src/views/apps/chat/AppChat.tsx) | Handler classified the receipt | `{ isGroupConversation, resolvedConvId, fullyReadIds, partiallyReadIds, note }` |
| `S2a no read ids to apply — green tick not flipped this event` | [src/views/apps/chat/AppChat.tsx:408](../../../src/views/apps/chat/AppChat.tsx) | After classification, no ids qualify for `isSeen = true` | Common for groups when only one of N members has read — partial reads are correctly ignored |
| `S3 dispatching updateMessagesFeedback (isSeen=true) for <N> ids` | [src/views/apps/chat/AppChat.tsx:412](../../../src/views/apps/chat/AppChat.tsx) | About to fire the reducer | |

### DM vs group classification in `S2`

The receipt's own `conversationId` is unreliable (backend sometimes emits a mismatched value). We resolve the actual conversation by **looking up any messageId from the event in our local state**, then read `isGroup` from the resolved chat. Fallback: if no message lookup hits, we read `isGroup` from the event's `conversationId` if present; default `false` (DM) otherwise.

| Conversation type | `fullyReadIds` source | `partiallyReadIds` |
|---|---|---|
| **DM** | All read-id fields (`messageId` + `updatedMessageIds` + `fullyReadMessageIds`) — one recipient = any read counts | always empty |
| **Group** | `fullyReadMessageIds` only — "seen by every participant" semantic | the rest, **logged only, never dispatched** |

---

## Reducer: R — state mutation

| Tag | File:line | Fires when | Key payload |
|---|---|---|---|
| `R0 updateMessagesFeedback ← payload` | [src/store/apps/chat/index.ts:780](../../../src/store/apps/chat/index.ts) | Reducer entered | `{ conversationId, messageIds, isDelivered, isSeen }` |
| `R0 reducer skipped — state.chats is null` | [src/store/apps/chat/index.ts:775](../../../src/store/apps/chat/index.ts) | No chats loaded yet | Shouldn't happen post-fetch |
| `R2 reducer: matched M/N messages` | [src/store/apps/chat/index.ts:809](../../../src/store/apps/chat/index.ts) | After scanning **all chats** by messageId | `{ matchedIds, missedIds, touchedChats, eventConversationId }`. `M < N` is normal during the send-ack race. |
| `R2a missed ids — buffered into pendingFeedback` | [src/store/apps/chat/index.ts:831](../../../src/store/apps/chat/index.ts) | Receipt arrived before the message landed in state | Drained by `7d.drain` (own send) or `R1.drain` (broadcast echo) |
| `R3 mirrored into selectedChat (panel will re-render)` | [src/store/apps/chat/index.ts:848](../../../src/store/apps/chat/index.ts) | At least one matched message lives in the open chat → new `selectedChat` ref pushed | Triggers React re-render |
| `R1.drain applied pendingFeedback to <id>` | [src/store/apps/chat/index.ts:934](../../../src/store/apps/chat/index.ts) | An incoming `new_message` brought in a message whose receipts had been buffered earlier | `{ before, pending, after }` |
| `R1c.feedback-merge dedupe + upgraded feedback for <id>` | [src/store/apps/chat/index.ts:899](../../../src/store/apps/chat/index.ts) | Broadcast echo beat the ack — monotonic feedback merge applied | `{ before, after }`. Monotonic = `isSent / isDelivered / isSeen` use `||`, never go back to false. |
| `7d.drain applied pendingFeedback to <id>` | [src/store/apps/chat/index.ts:1090](../../../src/store/apps/chat/index.ts) | `sendMsg.fulfilled` landed and drained buffered receipts for the new id | `{ before, pending, after }` |
| `7c.feedback-merge` | [src/store/apps/chat/index.ts:1053](../../../src/store/apps/chat/index.ts) | Send ack arrived after the echo — dedup with monotonic merge | |

---

## Why the buffer (`pendingFeedback`) exists

Socket.IO can deliver an event packet (e.g. `message_delivered`) **before** the ack callback for the same send resolves — both can land in one network frame. Without buffering, the `R2` match fails (the message isn't in Redux yet), and the `isDelivered: true` flag is lost. The buffer parks these flags by `messageId`, and `sendMsg.fulfilled` / `receiveMessage` drain them when the message arrives.

You'll see this race in almost every send:

```
[chat:receipt] D1 message_delivered ← event
[chat:receipt] R0 updateMessagesFeedback ← payload (isDelivered: true)
[chat:receipt] R2 reducer: matched 0/1               ← message not in state yet
[chat:receipt] R2a missed ids — buffered into pendingFeedback
...
[chat:receipt] A0 sent message anchor                 ← ack finally landed
[chat:receipt] 7d.drain applied pendingFeedback       ← isDelivered re-applied
```

---

## Full traces

### Happy path: outbound message → delivered → read

Sender's console:

```
[chat:trace] 1. SendMsgForm dispatch
[chat:trace] 2. sendMsg thunk start
[chat:trace] 3. socketEmit.sendMessage emit
[chat:event] message_ack          ← from onAny debug listener
[chat:event] conversation_updated
[chat:event] message_delivered
[chat:receipt] D1 message_delivered ← event
[chat:receipt] R0 updateMessagesFeedback (isDelivered: true)
[chat:receipt] R2 reducer: matched 0/1                ← race; expected
[chat:receipt] R2a buffered into pendingFeedback
[chat:trace] 4. socketEmit.sendMessage ack ← { success, messageId }
[chat:trace] 5. unwrapped Message
[chat:trace] 6. sendMsg ← ack received
[chat:receipt] A0 sent message anchor: { id: <X> }
[chat:trace] 7. sendMsg.fulfilled reducer
[chat:trace] 7d. pushing new message into thread <X>
[chat:receipt] 7d.drain applied pendingFeedback        ← delivered flag re-applied
[chat:trace] 7e. selectedChat synced
```

Tick state at this point: **double-grey** ✓✓ (delivered, not seen).

Later, when the recipient opens the chat:

```
[chat:receipt] S1 read_receipt ← raw event
[chat:receipt] S2 split: { isGroupConversation, fullyReadIds: [<X>], ... }
[chat:receipt] S3 dispatching updateMessagesFeedback (isSeen=true)
[chat:receipt] R0 (isSeen: true)
[chat:receipt] R2 reducer: matched 1/1
[chat:receipt] R3 mirrored into selectedChat
```

Tick state: **double-green** ✓✓.

### Recipient's console — when they open a chat with unread messages

```
[chat:receipt] B1 markConversationRead → request for <chatId>
[chat:receipt] B2 markConversationRead ← OK for <chatId>
```

The server then broadcasts `read_receipt` to other participants.

---

## Diagnostic shortcuts

| Symptom | First log to search for | Likely cause |
|---|---|---|
| Tick stuck on single grey (sender side) | `D1` | No delivery event arriving — server isn't broadcasting, or recipient hasn't come online |
| Tick stuck on double grey (sender side) | `S1` | No receipt arriving — recipient hasn't opened chat, OR server isn't broadcasting receipts |
| Got `S1` but tick still grey, DM | `S2` then `R2` | Check `S2 isGroupConversation` — if wrongly `true` for a DM, conversation type detection failed. If `false` and `fullyReadIds: []`, backend payload issue. |
| Got `S1` but tick still grey, group | `S2` partial vs full | If `fullyReadIds: []` and `partiallyReadIds: [...]` — **correct**. Only one of N members has read; tick will flip when everyone has. |
| `R2 matched 0/1` and **no** subsequent `7d.drain` or `R1.drain` | `A0` or `R1` | The message never arrived in state — check the send pipeline didn't error |
| Got `R3 mirrored` but UI still grey | (no log) | CSS / theme — `success.main` should be `#72E128`. Inspect computed style on the tick icon in DevTools. |
| `⚠ BACKEND-SUSPICIOUS` fires every time | (note, don't act) | Backend-side timing or semantic — file with backend team. Doesn't break ticks. |

---

## Tag → file:line cheat sheet

| Tag | Source |
|---|---|
| `A0` | [src/store/apps/chat/index.ts:619](../../../src/store/apps/chat/index.ts) |
| `B0` `B1` `B2` | [src/store/apps/chat/index.ts:528](../../../src/store/apps/chat/index.ts), [src/views/apps/chat/AppChat.tsx](../../../src/views/apps/chat/AppChat.tsx) |
| `D1` `D1b` (+ BACKEND-SUSPICIOUS) | [src/views/apps/chat/AppChat.tsx:269](../../../src/views/apps/chat/AppChat.tsx) |
| `S0` `S1` `S2` `S2a` `S3` (+ BACKEND-SUSPICIOUS) | [src/views/apps/chat/AppChat.tsx:325](../../../src/views/apps/chat/AppChat.tsx) |
| `R0` `R2` `R2a` `R3` | [src/store/apps/chat/index.ts:780](../../../src/store/apps/chat/index.ts) |
| `R1.drain` | [src/store/apps/chat/index.ts:934](../../../src/store/apps/chat/index.ts) |
| `R1c.feedback-merge` | [src/store/apps/chat/index.ts:899](../../../src/store/apps/chat/index.ts) |
| `7d.drain` | [src/store/apps/chat/index.ts:1090](../../../src/store/apps/chat/index.ts) |
| `7c.feedback-merge` | [src/store/apps/chat/index.ts:1053](../../../src/store/apps/chat/index.ts) |

---

## Notes

- The `[chat:trace]` prefix is the send-pipeline trace (1 → 7e). It runs in parallel with `[chat:receipt]` and is kept separate so each can be filtered cleanly.
- The `[chat:event]` prefix is the `socket.onAny` debug listener — fires for every server event before any handler runs. Useful to confirm an event reached the socket layer even if no handler is wired.
- A temporary `[chat:receipt] V1 renderMsgFeedback` log existed in `ChatLog.tsx` to verify what `feedback` value reached the DOM. **Removed 2026-05-18** after the pipeline was confirmed end-to-end on a real two-user test.
