# System-Message Perspective Rewriting

How the chat module renders system messages (membership / role changes) from each viewer's perspective — sender, receiver (target), and bystander — using a single server-stored message.

## Background

Some chat events generate system messages that the server stores and broadcasts to all room members:

- `participant_joined` → "Anil Rathod added Ajay Antony"
- `participant_left` → "Anil Rathod removed Ajay Antony"
- Role changes → "Anil Rathod made Ajay Antony an admin"
- Group creation → "Anil Rathod created group 'X'"

The server stores **one** canonical text per event with the actor's name baked into the message body. WhatsApp-style UX expects each viewer to see the same event from their own perspective ("You did X" if they're the actor, "X did to you" if they're the target). This doc covers how the client renders that perspective without changing the underlying server data.

## The Three Scenarios

For a single server-stored event like "Anil Rathod removed Ajay Antony", three viewer perspectives need to render correctly:

| Viewer | Role | Server-stored text | Rendered text |
| --- | --- | --- | --- |
| Anil | Sender (actor) | `Anil Rathod removed Ajay Antony` | `You removed Ajay Antony` |
| Ajay | Receiver (target) | `Anil Rathod removed Ajay Antony` | `Anil Rathod removed you` |
| Saket | Bystander | `Anil Rathod removed Ajay Antony` | `Anil Rathod removed Ajay Antony` |

The same logic applies to other verbs: `added`, `made`, `invited`, `kicked`, and to the group-created case ("You created group …" for the creator).

## Data Flow

```
[Admin action — e.g. Anil removes Ajay]
   │
   ▼
Server stores system message:
   { id: 'msg-…',
     contentType: 'system',
     senderId: '<anil's id>',
     content: { text: 'Anil Rathod removed Ajay Antony' },
     … }
   │
   ▼
Server broadcasts new_message socket event to all room members
   │
   ▼
Each client's onNewMessage handler in AppChat
   → dispatches receiveMessage reducer
   → appends to state.chats[i].chat.messages[]
   │
   ▼
ChatLog renders the message
   → applies perspective rewrite based on current user identity
   → displays the appropriate text for that viewer
```

The server is the single source of truth. Each client receives identical data over the socket and renders it differently based on `userProfile.id` and `userProfile.fullName`.

## Implementation

### Sidebar perspective rewrite — [src/views/apps/chat/SidebarLeft.tsx](../../src/views/apps/chat/SidebarLeft.tsx)

Applied where the sidebar renders `lastMessage.message`:

```ts
const actorIsMe = Boolean(
  meIdStrForRewrite &&
    ((lastMessage?.senderId && String(lastMessage.senderId) === meIdStrForRewrite) ||
      (chat.createdBy && String(chat.createdBy) === meIdStrForRewrite))
)
const isActorPrefixedSelfMessage = Boolean(
  actorIsMe && myNameForRewrite && lastMsgText.startsWith(myNameForRewrite + ' ')
)
const displayLastMessageText = isActorPrefixedSelfMessage
  ? 'You ' + lastMsgText.slice(myNameForRewrite.length + 1)
  : lastMsgText
```

When the lastMessage is a system event whose actor matches the current user, the sidebar preview renders "You" in place of the actor's name. The sender prefix (`You:` / `Name:`) is also suppressed when this rewrite fires so we don't get a redundant `"You: You created group X"`.

### ChatLog perspective rewrite — [src/views/apps/chat/ChatLog.tsx](../../src/views/apps/chat/ChatLog.tsx)

Applied inside the system-message render branch:

```ts
const rewriteSystemText = (text: string, msgSenderId?: string | number): string => {
  if (!text || !myNameForRewrite) return text || ''
  let result = text

  // (1) Actor perspective — replace actor name at start with "You"
  const actorIsMe = Boolean(msgSenderId) && String(msgSenderId) === meIdForRewrite
  if (actorIsMe && result.startsWith(myNameForRewrite + ' ')) {
    result = 'You ' + result.slice(myNameForRewrite.length + 1)
  }

  // (2) Target perspective — replace "<verb> <my name>" with "<verb> you"
  const verbList = 'removed|added|made|invited|kicked'
  const targetRe = new RegExp(`\\b(${verbList})\\s+${escapeRegExp(myNameForRewrite)}\\b`, 'g')
  result = result.replace(targetRe, '$1 you')

  return result
}
```

Used inside the centered system-pill render so each viewer sees the version appropriate to their identity.

## Signal Sources

| Field | Source | Role |
| --- | --- | --- |
| `msg.senderId` | Socket field on every message | Identifies the actor (high reliability — strict ID comparison) |
| `msg.content.text` / `msg.message` | Socket field on every message | Carries the rendered system text |
| `chat.createdBy` | Conversation field from REST + socket | Used as a fallback actor signal for group-created lastMessage in sidebar |
| `userProfile.id` / `userProfile.fullName` | Auth / `getMe()` REST | Identifies the current viewer |

Target detection currently relies on **text pattern matching** against the current user's full name — the server does not yet expose a `targetUserId` field for these system events. See [Known Limitations](#known-limitations) below.

## What Is And Isn't Modified

| Layer | Behavior |
| --- | --- |
| Server storage | Untouched — original text stays canonical |
| Socket broadcasts | Untouched — same payload reaches all clients |
| Redux state (`chat.messages[].message`) | Untouched — original text preserved for other consumers |
| Render layer | Perspective rewrite applied here only |

Because the transformation is render-time only, every reducer, selector, dialog, info panel, and forward action continues to see the unmodified server text.

## Behavior On Hard Refresh

Server-stored data drives the post-refresh state, and the render-time rewrite re-applies automatically once `userProfile` is loaded.

| Viewer | After refresh |
| --- | --- |
| Sender | Sees "You removed Ajay Antony" |
| Receiver | Sees "Anil Rathod removed you" |
| Bystander | Sees "Anil Rathod removed Ajay Antony" |

There is a brief render before `userProfile.id` is available during the auth bootstrap — during that window the unrewritten text may show for a few hundred milliseconds. Once userProfile lands the sidebar / ChatLog re-render and the perspective rewrite kicks in.

## Side Effects Audit

| Area | Status |
| --- | --- |
| Other chat surfaces (MessageInfo, Forward, Reaction details) | Unaffected — read original Redux state |
| Pin / Edit / Delete / Reaction reducers | Unaffected — don't read system-message text |
| Sidebar regular-text branch | Unaffected — perspective rewrite only fires when text starts with user's full name |
| Active group members (not involved in the event) | See the canonical text — no false positives because their name doesn't match |
| DMs | Unaffected — system events of this kind don't fire on DMs |
| Kicked-user guards | Unaffected — perspective rewrite is render-only, doesn't touch the guard conditions |

## Known Limitations

1. **Target detection is text-based.** Without a `targetUserId` field on the system message, the client matches the current user's full name against the message text. Edge cases:
   - Display-name changes (server-stored text may use an older name) — rewrite silently no-ops, original text shown.
   - Name partial overlaps (e.g. "Anil" vs "Anil Kumar") — mitigated by word-boundary regex, but rare ambiguities remain.
2. **Backend wording dependency.** The verb whitelist (`removed|added|made|invited|kicked`) reflects the server's current English text format. New server-emitted verbs (e.g. localised strings) won't be picked up until the regex is extended.
3. **No structured event type from the backend.** All system messages share `contentType: 'system'`; differentiating "added" vs "removed" vs "made admin" relies entirely on text content. A `systemEventType` enum on the message would simplify this and make the rewrite locale-agnostic.

## Recommended Backend Improvements

To make the perspective rewrite fully signal-driven and locale-safe:

| Field | Purpose |
| --- | --- |
| `targetUserId` | Direct ID-based target detection for participant / admin events |
| `systemEventType` | Enum (e.g. `participant_added`, `participant_removed`, `admin_granted`) — render text client-side from structured data instead of parsing strings |

With those in place the client could drop the text-parsing fallback entirely and render every system message from structured fields, eliminating all edge cases noted above.

## Related Files

- [src/views/apps/chat/SidebarLeft.tsx](../../src/views/apps/chat/SidebarLeft.tsx) — sidebar perspective rewrite for `lastMessage`
- [src/views/apps/chat/ChatLog.tsx](../../src/views/apps/chat/ChatLog.tsx) — ChatLog perspective rewrite for system pills
- [src/store/apps/chat/index.ts](../../src/store/apps/chat/index.ts) — `applyParticipantLeft` lastMessage placeholder for kicked self
- [kicked-user-fix.md](./kicked-user-fix.md) — companion doc covering the kicked-user UX path
- [api-integration-status.md](./api-integration-status.md) — quirk list including backend gaps referenced here
