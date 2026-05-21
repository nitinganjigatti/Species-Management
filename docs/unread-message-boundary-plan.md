# Unread Message Boundary — Implementation Plan

WhatsApp-style "unread messages" divider with cursor-paginated history around the user's last-read pointer.

## Behavior summary

| Scenario | Behavior |
| --- | --- |
| **0 unread** | Load latest 50 messages, scroll to bottom. (Current behavior, unchanged.) |
| **1–50 unread** | Load `before=25` + `after=50` around `lastReadMessageId`, render divider between them, scroll to divider. |
| **50–100+ unread** | Same — land right after the read boundary. User scrolls down to see more unread; each scroll near the bottom triggers `loadNewerMessages` until `hasMoreNewer === false`. |

The user never has to wait for 100+ messages to load. They land at the boundary and scroll down naturally.

## Decisions locked

1. **Live messages while in history mode (`hasMoreNewer === true`)**: dropped from the visible array. They'll be picked up by the next forward `loadNewerMessages` fetch. (`unseenMsgs` on non-open chats is still bumped — only the open chat with pending forward pages drops.)
2. **Mark-as-read timing**: on chat open (current behavior). `markReadOverSocket(chatId)` stays exactly where it is in `selectChat`. The divider in this session is rendered from a snapshot taken before the reset.
3. **Divider style**: static inline, "Unread messages · N", scrolls with content. Disappears on next chat open.
4. **`lastReadMessageId` is null**: fall back to "latest 50, no divider" (treat as 0-unread).

## Open question

**Context above the divider?** WhatsApp shows a few read messages above the divider so the user has context for what they're replying to. The current plan fetches `before=25` + `after=50` in parallel to provide this. A pure-`after` load would render the divider as the very top of the viewport with no context until pull-to-load-older. **Default: include the `before` slice unless we decide otherwise.**

---

## Current state (relevant code)

- `selectChat` always loads the latest 50 via `listMessages(chatId, { limit: 50 })` — never uses `after` (`src/store/apps/chat/index.ts:660-661`).
- `getLastRead` REST exists and its result is already seeded into the SDK's `useChatStore` (`src/store/apps/chat/index.ts:646-658`). The inline comment already says it's reserved for the unread-divider UI.
- `unseenMsgs` per chat is tracked + incremented on `receiveMessage` (`src/store/apps/chat/index.ts:1619`).
- **Backward pagination only.** `oldestCursor`, `hasMoreOlder`, `loadingOlder`, `loadOlderMessages` thunk, `prependChatMessages` reducer all exist. No `newestCursor` / `hasMoreNewer` / `loadingNewer` / `appendChatMessages` / `loadNewerMessages` yet.
- `markReadOverSocket(chatId)` fires immediately on `selectChat` (`src/store/apps/chat/index.ts:678`).
- `receiveMessage` unconditionally appends live messages to the loaded array.

---

## Implementation plan

### A. Store — forward pagination machinery

Files: `src/types/apps/chatTypes.ts`, `src/store/apps/chat/index.ts`

Add to `ChatType`:

- `newestCursor: string | null`
- `hasMoreNewer: boolean`
- `loadingNewer: boolean`
- `unreadBoundaryCount: number` — snapshot of `unseenMsgs` taken at `selectChat` time. Used only for the divider label so it survives the immediate mark-read reset.

New reducers (mirror existing older-side):

- `appendChatMessages({ chatId, messages, newestCursor, hasMoreNewer })` — dedupes, appends, updates cursor flags, clears `loadingNewer`.
- `setLoadingNewer({ chatId, loading })`.
- Extend `setChatMessages` to also accept optional `newestCursor` / `hasMoreNewer` / `unreadBoundaryCount` so the initial unread-boundary load can seed both sides at once.

New thunk:

- `loadNewerMessages(chatId)` — symmetric to `loadOlderMessages`:
  - Short-circuit if `loadingNewer`, `hasMoreNewer === false`, or `newestCursor` is null.
  - `listMessages(chatId, { cursor: newestCursor, direction: 'after', limit: 50 })`.
  - Reverse SDK newest-first response into chronological order.
  - Dispatch `appendChatMessages` with new `newestCursor` / `hasMoreNewer` from `resp.meta`.

### B. `selectChat` — branch on lastRead

File: `src/store/apps/chat/index.ts:635-682`

1. Snapshot `unseenMsgs` from the chat entry **before** anything mutates it. Pass it into `setChatMessages` as `unreadBoundaryCount`.
2. `await getLastRead(chatId)` instead of fire-and-forget — we need the result to decide the load shape. Keep the Zustand seed for `useChatStore.setLastRead`.
3. Branch on `(unseenMsgs, lastReadMessageId)`:
   - **`unseenMsgs === 0` OR `lastReadMessageId == null`** → existing path: `listMessages({ limit: 50 })`. `hasMoreNewer = false`, `unreadBoundaryCount = 0`. (Handles Q4 fallback.)
   - **Else (have unread + have pointer)** →
     ```
     Promise.all([
       listMessages(chatId, { cursor: lastReadMessageId, direction: 'before', limit: 25 }),
       listMessages(chatId, { cursor: lastReadMessageId, direction: 'after',  limit: 50 }),
     ])
     ```
     - Reverse each page into chronological order.
     - Merge `[...older, ...newer]`, dedupe by id (the cursor message can land in either page depending on SDK semantics — same dedupe shape as `jumpToMessage`).
     - Dispatch `setChatMessages` with both `oldestCursor` (from `before.meta.nextCursor`) and `newestCursor` (from `after.meta.nextCursor`), `hasMoreOlder`, `hasMoreNewer`, and the snapshotted `unreadBoundaryCount`.
4. Keep `markReadOverSocket(chatId)` exactly where it is.

### C. `receiveMessage` — drop while in history mode

File: `src/store/apps/chat/index.ts:1605-1620`

When `state.selectedChat?.contact.id === conversationId` AND `chatEntry.chat.hasMoreNewer === true`:

- **Skip** the push to `messages` / `selectedChat.chat.messages`.
- Still update `chatEntry.chat.lastMessage` for the sidebar preview.
- Still increment `unseenMsgs` if the chat is **not** open (existing branch already handles this).

When the user catches up (`loadNewerMessages` returns a response whose `meta.hasMore === false`), `hasMoreNewer` flips to `false` and normal append behavior resumes. The previously-dropped messages arrive in that forward-paginated fetch — no message loss.

### D. Unread divider — render + initial scroll

File: `src/views/apps/chat/ChatLog.tsx`

- Read `lastReadMessageId` for the open chat from the SDK's `useChatStore` (already seeded). Also read `unreadBoundaryCount` from the chat slice.
- In the message render loop, after rendering the message whose `id === lastReadMessageId`, render an inline divider:
  - Text: `Unread messages` + ` · ${unreadBoundaryCount}` when `unreadBoundaryCount > 0`.
  - `data-unread-divider="true"` attribute for lookup.
- Initial-mount effect (runs once per chat open, gated on `unreadBoundaryCount > 0`):
  - After first paint, find the divider node via the data attribute.
  - Call the existing `scrollMessageIntoView` helper on it (works with PerfectScrollbar's `overflow: hidden` wrapper — native `scrollIntoView` doesn't).
  - Fall back to scroll-to-bottom if the divider isn't in the DOM (covers Q4 edge cases).
- Render the divider once per chat-open session. If the user later scrolls past it the divider stays inline — matches WhatsApp.

### E. Forward-pagination trigger

Files: `src/views/apps/chat/ChatLog.tsx`, `src/views/apps/chat/ChatContent.tsx`

- Add a bottom sentinel + `IntersectionObserver` that mirrors the existing top sentinel pattern.
- When the sentinel intersects AND `hasMoreNewer === true` AND not `loadingNewer`, fire a new `onLoadNewer` prop.
- `ChatContent` wires `onLoadNewer={() => dispatch(loadNewerMessages(chatId))}`.
- **Scroll-anchoring during append**: appends grow content below the viewport, so no `scrollTop` adjustment is needed (unlike the older-side prepend). The existing `lastSeenNewestIdRef` mechanism that prevents scroll-to-bottom thrash on search jumps will need to be sync'd pre-emptively before each append so the bottom-snap effect short-circuits — same trick used in the search-jump path today.

### F. Cleanup of stale boundary

When the user exhausts forward pages (`hasMoreNewer` flips from `true` → `false` via a `loadNewerMessages` response):

- The boundary is "consumed" — the user has now seen everything that was unread.
- Leave the divider rendered inline so the user can still scroll back up to where they started.
- Live messages now append normally (the receiveMessage guard from §C only blocks while `hasMoreNewer === true`).

On the next `selectChat` call for this conversation, `lastReadMessageId` will (server-side) have moved to the newest message, so the divider naturally won't render. No manual cleanup needed.

---

## Files touched (estimate)

- `src/types/apps/chatTypes.ts` — new fields on `ChatType`, payload types for new reducers, new prop types for `ChatLogType`.
- `src/store/apps/chat/index.ts` — fields + reducers + thunk + `selectChat` branch + `receiveMessage` guard.
- `src/views/apps/chat/ChatLog.tsx` — divider render, initial-scroll-to-divider, bottom sentinel + `onLoadNewer` prop.
- `src/views/apps/chat/ChatContent.tsx` — wire `onLoadNewer`.

## Suggested rollout order

1. **A + B** first — store foundation, no UI surface yet. Verify via Redux DevTools that opening an unread chat fetches both sides and seeds all the new fields.
2. **D** — render the divider and initial-scroll to it. Now the 1–50 unread case is fully working.
3. **E** — bottom sentinel + `loadNewerMessages`. Unlocks the 50–100+ case.
4. **C** — `receiveMessage` guard. Last, because it's the easiest to reason about once the rest is in place and easy to verify by hand.
5. **F** is implicit — falls out of how `hasMoreNewer` is consumed by the guard in §C.

## Manual test matrix

- 0 unread → behavior unchanged.
- 1 unread → divider visible above 1 message, scrolls to divider.
- 30 unread → divider visible, all unread fit in `after=50`, `hasMoreNewer = false`.
- 80 unread → divider visible, first 50 shown, `hasMoreNewer = true`. Scroll near bottom → next 30 load, `hasMoreNewer = false`.
- 200 unread → same shape, multiple forward pages.
- Unread chat with `lastReadMessageId === null` → latest 50, no divider.
- Open unread chat, immediately receive a live message → not visible until forward pages exhausted.
- Catch up to the bottom → next live message appears as normal.
- Pull-to-load-older from the unread boundary → loads pages before the read context.
