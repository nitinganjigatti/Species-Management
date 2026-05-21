# Forward Message — Implementation Plan

Single-target message forwarding from the 3-dot menu, with a "Forwarded" label on the destination bubble.

## Decisions locked

1. **Single-target** — pick one destination chat at a time. No multi-select in v1.
2. **"Forwarded" label** on the resulting message — visible on both sender's and recipient's view.
3. **Forward attachments by reusing `fileId`** — map source `Attachment.id` → `SendMessageAttachment.fileId`. Assumes the backend accepts an existing storage `fileId` from another conversation. **Needs backend verification.**
4. **Entry point**: new "Forward" `MenuItem` in `MessageActions`, placed directly below "Reply".

## Constraints from the SDK

- `SendMessagePayload` has no `forwardedFromMessageId` / `isForwarded` field ([chat-core dist/index.d.ts:368-374](node_modules/@antzsoft/chat-core/dist/index.d.ts#L368-L374)).
- The `Message` type has no `isForwarded` flag either ([chat-core dist/index.d.ts:112-140](node_modules/@antzsoft/chat-core/dist/index.d.ts#L112-L140)).
- There is no backend "forward" RPC — we re-send via the existing `sendMessageOverSocket` flow.
- `SendMessageAttachment.fileId` is the storage id (`FileResponse.id`). We're assuming `sourceMessage.attachments[].id` is the same value. If it isn't, attachment forwarding fails until the backend exposes the file id on received attachments (or we re-upload).

## Open issues to flag

- **Attachment fileId reuse** is unconfirmed. Mitigation: try it; if the socket ack rejects with a missing-file error, surface a toast and fall back to text-only forward.
- **Forward marker portability**: the marker text is parsed client-side. Any client running an older build of the codebase will render the literal marker as plain text. Acceptable for the web app rollout if all active clients pull from this codebase; flag for native/mobile alignment if/when those exist.

---

## Plan

### A. Forwarded-marker mechanism

The marker is a sentinel inside the message text so both sender and recipient render the label consistently without backend support.

```
FORWARD_MARKER = "​[fwd]​"   // zero-width-bracketed; invisible if a renderer fails to strip it
```

- **Send**: prefix `${FORWARD_MARKER}\n` to the outgoing text. If the source message had no text (attachment-only), the outgoing text is just `FORWARD_MARKER` (a single zero-width-wrapped tag).
- **Render**: when `chat.msg?.startsWith(FORWARD_MARKER)`, strip the marker + leading newline before display and render a `<ForwardedTag />` above the bubble.

Defined once in a single module — e.g. `src/lib/chat/forwardMarker.ts` exporting `FORWARD_MARKER`, `isForwarded(text)`, and `stripForwardMarker(text)`. Both bubble + attachment-only render paths use these helpers.

### B. Forward dialog

New file: `src/views/apps/chat/ForwardMessageDialog.tsx`.

- MUI `Dialog`, fixed width (~480px), full-height list with sticky header/footer.
- **Source preview** at top — small read-only bubble showing the message being forwarded:
  - Text content (with the marker stripped if the source was itself forwarded; otherwise raw).
  - Attachment chips/thumbnails (from `sourceMessage.attachments`).
- **Search field** — filters the conversation list by `contact.fullName` and `staffId`.
- **Single-select chat list** — driven by existing `state.chat.chats`. Radio behavior; clicking a row selects, clicking again or another row replaces.
- **Footer**: Cancel + Forward button. Forward disabled until a target is selected. Spinner while the thunk is in-flight.
- Closes on success; stays open with error toast on failure.

Data source: `state.chat.chats` — already populated; no new API call.

### C. `forwardMessage` thunk

[src/store/apps/chat/index.ts](src/store/apps/chat/index.ts)

```
forwardMessage({ sourceMessage, targetChatId, openTargetAfter = true })
```

Behavior:

1. Build `SendMessagePayload`:
   - `conversationId: targetChatId`
   - `text`: `FORWARD_MARKER` + (`\n` + sourceMessage.msg) if source had text
   - `attachments`: `(sourceMessage.attachments ?? []).map(a => ({ fileId: a.id, type: a.type, url: a.url, thumbnailUrl: a.thumbnailUrl, filename: a.filename, mimeType: a.mimeType, size: a.size, duration: a.duration }))`
   - `tempId`: new UUID
2. Call `sendMessageOverSocket(payload)`. (Same path as a normal send — gives us delivery + read receipts + dedupe for free.)
3. On success:
   - Toast: "Message forwarded".
   - If `openTargetAfter` is `true`, dispatch `selectChat(targetChatId)` so the user lands in the destination chat with the new message visible (matches WhatsApp).
4. On failure:
   - Toast: "Forward failed".
   - Log to console with structured context.

No optimistic UI for v1 — `sendMessageOverSocket` already handles the optimistic insert when the chat is open. Since we may not be in the target chat at send-time, the new message arrives via the standard `new_message` broadcast.

### D. Marker render — `<ForwardedTag />`

New file: `src/views/apps/chat/ForwardedTag.tsx` — tiny presentational component:

- Icon: `mdi:share` (rotated 180° to point upper-left, WhatsApp-style) or `mdi:arrow-right-top` — pick one.
- Italic small caption: "Forwarded".
- Color: `text.secondary` on light bubbles, `rgba(255,255,255,0.85)` on the sender's primary-color bubble.

Usage:

- [src/views/apps/chat/MessageBubble.tsx](src/views/apps/chat/MessageBubble.tsx): after the reply snippet, before the body text. Gated on `isForwarded(chat.msg)`. Strip via `stripForwardMarker` before rendering the body.
- [src/views/apps/chat/ChatLog.tsx](src/views/apps/chat/ChatLog.tsx): same logic for the attachment-only path (bubbles with no `msg` but with attachments and a marker-only text payload that the renderer normally ignores).

### E. Entry point wiring

[src/views/apps/chat/MessageActions.tsx](src/views/apps/chat/MessageActions.tsx)

- Add `handleForward` directly below `handleReply`:
  ```tsx
  const handleForward = () => {
    handleMenuClose()
    if (!chat.id) return
    dispatch(setForwardingMessage({
      messageId: chat.id,
      messageText: chat.msg,
      attachments: chat.attachments,
      senderName,
      senderId,
    }))
  }
  ```
- Add `<MenuItem onClick={handleForward}>` with `mdi:share-outline` icon, immediately after the Reply item.
- The dialog itself is mounted in [src/views/apps/chat/ChatContent.tsx](src/views/apps/chat/ChatContent.tsx) (sibling-of-shell pattern, matching `setInfoMessage` / `MessageInfoDialog`), gated on `state.chat.forwardingMessage` being non-null.

### F. Redux state

[src/store/apps/chat/index.ts](src/store/apps/chat/index.ts) + [src/types/apps/chatTypes.ts](src/types/apps/chatTypes.ts)

- New state field: `forwardingMessage: ForwardingMessageRef | null` — mirrors the existing `infoMessage` / `replyingTo` shape.
- New reducers: `setForwardingMessage(payload)`, `clearForwardingMessage()`.
- New thunk: `forwardMessage` (from §C).

Type:
```ts
type ForwardingMessageRef = {
  messageId: string
  messageText?: string
  attachments?: ChatAttachmentType[]
  senderName?: string
  senderId?: string | number
}
```

---

## Files touched (estimate)

- **New**:
  - `src/lib/chat/forwardMarker.ts` — constants + helpers.
  - `src/views/apps/chat/ForwardMessageDialog.tsx` — the picker.
  - `src/views/apps/chat/ForwardedTag.tsx` — the label component.
- **Modified**:
  - `src/store/apps/chat/index.ts` — state + reducers + `forwardMessage` thunk.
  - `src/types/apps/chatTypes.ts` — `ForwardingMessageRef`, state field.
  - `src/views/apps/chat/MessageActions.tsx` — Forward menu item.
  - `src/views/apps/chat/MessageBubble.tsx` — render `<ForwardedTag />` + strip marker.
  - `src/views/apps/chat/ChatLog.tsx` — same for attachment-only bubbles.
  - `src/views/apps/chat/ChatContent.tsx` — mount the dialog.

## Suggested rollout order

1. **A** — marker module. Pure utility, no UI.
2. **F + C** — state shape + thunk. Verifies the send path works (using a temporary test trigger) before any picker UI exists.
3. **D** — `<ForwardedTag />` + render integration. Make the marker visually correct on the sender's own message after thunk completes.
4. **B + E** — dialog + menu item. End-to-end UX.
5. Verify attachment forwarding works on a real backend; if `fileId` reuse fails, fall back to text-only sends + a toast: "Attachments couldn't be forwarded".

## Manual test matrix

- Forward text-only message to another DM → marker visible as italic "Forwarded" above the body on both sides.
- Forward to a group → same.
- Forward an image-only message → image appears in target chat with "Forwarded" tag, no body text.
- Forward a text + multi-attachment message → both forwarded together.
- Forward to same chat → allowed (matches WhatsApp). Verifies marker on own outgoing message too.
- Forward, target chat not currently open → after thunk resolves, the destination opens automatically.
- Forward while offline / socket disconnected → toast "Forward failed", dialog stays open.
- Forward an already-forwarded message → outgoing text contains only one marker (we don't double-prefix; sender re-uses the stripped body when constructing the new text).
- Receiving end on a client running an old build → would see the literal marker. Flag this for staged rollout if relevant.
