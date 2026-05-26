# Chat Module Documentation

## Overview

The Chat module is the standard Materio chat template ported into the Antz Web Dashboard. It renders a full-page chat UI (sidebar with chats + contacts on the left, conversation pane on the right) backed by Redux state.

**Current status (May 2026)**: scaffolded with **mock data**. UI is fully interactive, but there is no backend, no realtime layer, and several UI affordances are visually present but not functionally wired. See [What works now](#what-works-now) and [What still needs to be done](#what-still-needs-to-be-done).

### Related docs

- [antzsoft-chat-core.md](./antzsoft-chat-core.md) — Full `@antzsoft/chat-core` SDK reference (the data layer for when the chat backend lands)
- [chat-core-starter.md](./chat-core-starter.md) — Integration playbook for when the chat backend URL arrives
- [integration-api-reference.md](./integration-api-reference.md) — Antz Chat Integration API v1.0 (server-to-server adapter the chat backend consumes; browser never calls these)
- [system-message-perspective.md](./system-message-perspective.md) — Three-perspective (sender / receiver / bystander) rendering across sidebar / in-chat pill / banner. Documents the shared resolver module + declarative template table + cold-load localStorage caches + optimistic admin actions.
- [kicked-user-fix.md](./kicked-user-fix.md) — Kicked-user UX path: synthesis for the kicked socket (server doesn't deliver `user_removed` `new_message` to it), idempotent `applyParticipantLeft`, and the four-guard defense that keeps post-kick activity out of the kicked user's UI.
- [api-integration-status.md](./api-integration-status.md) — Backend quirks list (v1.2.1 gaps the client compensates for)

## Module Location

| Layer | Path |
|---|---|
| App Router route | `src/app/(module)/chat/page.tsx` |
| App Router layout (height container) | `src/app/(module)/chat/layout.tsx` |
| Orchestrator component | `src/views/apps/chat/AppChat.tsx` |
| View components | `src/views/apps/chat/SidebarLeft.tsx`, `ChatContent.tsx`, `ChatLog.tsx`, `SendMsgForm.tsx`, `UserProfileLeft.tsx`, `UserProfileRight.tsx` |
| Redux slice (mock data + thunks) | `src/store/apps/chat/index.ts` |
| Types | `src/types/apps/chatTypes.ts` |
| Side menu entry | `src/components/navigation/chat/index.ts` |
| Route constant | `src/constants/routes.ts` → `ROUTES.chat.root = '/chat'` |
| TS shims (for untyped JS @core components) | `src/@core/components/mui/avatar/index.d.ts`, `src/@core/components/sidebar/index.d.ts` |

## Wiring Chain

```
src/app/providers.tsx              → mounts <Provider store={store}> at the React root
src/store/store.ts                 → registers `chat: chatReducer`
src/navigation/vertical/index.js   → appends chatNavigation() to the side menu
src/app/(module)/layout.tsx        → auth gate + UserLayout (unchanged)
src/app/(module)/chat/layout.tsx   → chat-only fixed-height wrapper
src/app/(module)/chat/page.tsx     → renders <AppChat />
src/views/apps/chat/AppChat.tsx    → dispatches initial fetches, renders SidebarLeft + ChatContent
```

## Side Menu

`src/components/navigation/chat/index.ts` adds:

```
─── Chat ───
💬 Chat → /chat
```

No permission gate — always visible.

## Layout & Height

The chat needs a definite height for its flex layout to work (so sidebars + the centered "Start Conversation" empty state size correctly). Since the global `(module)/layout.tsx` uses `contentHeightFixed={false}`, the chat provides its own:

- `chat/layout.tsx`: `<Box sx={{ height: 'calc(100vh - 10.5rem)', mt: 6 }}>`
- `AppChat` root Box: `height: '100%'` fills the wrapper

**The offset math**: AppBar (~4rem) + ContentWrapper top padding (3rem) + bottom padding (3rem) + the chat's own top margin (`mt: 6` = 3rem) ≈ **10.5rem** reserved.

> The `AppChat.contentHeightFixed = true` Pages-Router convention does **not** work in App Router (no `_app.js` to read it). The `chat/layout.tsx` wrapper is the App Router replacement.

## Pages Router → App Router Adaptations

| Original Materio code | Replaced with |
|---|---|
| `import { useRouter } from 'next/router'` (SidebarLeft) | `import { usePathname } from 'next/navigation'` |
| `router.events.on('routeChangeComplete', cleanup)` | `useEffect(() => return cleanup, [pathname])` |
| `AppChat.contentHeightFixed = true` (read by `_app.js`) | `chat/layout.tsx` height wrapper |
| _(implicit)_ | `'use client'` on every component (state + Redux usage) |

## What Works Now

With the mock data shipped in `src/store/apps/chat/index.ts`:

- ✅ Render side menu link → `/chat` opens the chat UI
- ✅ Left sidebar shows: user avatar + status, search box, 2 seeded chats, 8 seeded contacts
- ✅ Search filters chats + contacts by `fullName` (client-side)
- ✅ Click a chat → conversation opens, log scrolls to bottom
- ✅ Click a contact → fresh chat created, added to chats list, opens conversation
- ✅ Type + Send → message appears immediately in the log
- ✅ User profile drawer (left, click own avatar) — status radio works locally
- ✅ Contact profile drawer (right, click conversation header) — read-only display
- ✅ Responsive: drawer collapses to temporary mode below `lg` breakpoint, opens via hamburger
- ✅ Layout: chat card sits centered with equal top/bottom margins
- ✅ Date formatting: short format like "May 14" or "2:30 PM" via `formatDateToMonthShort`; empty string when no last message (no more GMT bug)

## Mock Data

The slice ships with hardcoded seed data so the UI is demoable without a backend.

| Mock | Where | Notes |
|---|---|---|
| `userProfile` | `chatsSeed` → constant in slice | id=11, "John Doe", admin, online |
| 2 chats | `chatsSeed` | Felecia Rower (1 unseen), Adalberto Granzin (read) |
| 8 contacts | `contactsSeed` | Felecia Rower, Adalberto Granzin, Joaquina Weisenborn, Verla Morgano, Margot Henschke, Sal Piggee, Miguel Guelff, Mauro Elenbaas |
| `fetchUserProfile` | thunk | Resolves immediately with `userProfile` |
| `fetchChatsContacts` | thunk | Resolves immediately with `chatsSeed` + `contactsSeed` |
| `sendMsg` | thunk | Appends to `state.chats[i].chat.messages` in Redux only — no network call |

All sent messages are **lost on refresh** (the slice resets to initial state on every page load).

Avatar paths reference `/images/avatars/1.png` … `/images/avatars/8.png`. Verify those exist in `public/images/avatars/`; otherwise the `<CustomAvatar>` initials fallback renders instead.

## What Still Needs To Be Done

### 🟡 Backend integration (when the chat server is ready)

| Thunk | Current | Should become |
|---|---|---|
| `fetchUserProfile` | Returns hardcoded user | `GET /api/chat/me` |
| `fetchChatsContacts` | Returns hardcoded chats + contacts | `GET /api/chat/conversations` + `GET /api/chat/contacts` |
| `sendMsg` | Pushes to Redux only | `POST /api/chat/messages` (and emit via socket for live delivery) |

Add these reducers when the server starts pushing events:
- `receiveMsg` — append an incoming message to the matching chat
- `markDelivered` — flip `isDelivered: true` on a message
- `markSeen` — flip `isSeen: true` on a message
- `updatePresence` — patch `state.contacts[i].status` on presence change

### 🟠 Realtime layer (socket.io / Pusher / Firebase)

Not wired. Sketch when adding:

1. `src/lib/socket.ts` — singleton `io(process.env.NEXT_PUBLIC_CHAT_WS_URL)` connection
2. `useEffect` in `AppChat` to register `socket.on('message' | 'delivered' | 'seen' | 'presence', …)` listeners → dispatch matching reducers
3. `socket.disconnect()` on unmount / logout

See [Frontend chat answer in conversation history] for the full plan if needed.

### 🔴 UI affordances that exist but do nothing

These are visual only right now and need handlers wired regardless of backend status.

#### `ChatContent.tsx` — conversation header (top right)
- 📞 Phone icon — no `onClick`
- 📹 Video icon — no `onClick`
- 🔍 Magnify (in-chat search) — no `onClick`
- ⋮ OptionsMenu items: "View Contact", "Mute Notifications", "Block Contact", "Clear Chat", "Report" — all dead clicks

#### `SendMsgForm.tsx`
- 🎤 Microphone — no recording logic
- 📎 Attachment — `<input type='file'>` captures the file but nothing reads or uploads it

#### `UserProfileLeft.tsx` (own profile drawer)
- Status radio → updates local React state, doesn't persist
- "Two-step Verification" / "Notification" switches — `defaultChecked`, no state binding
- "Invite Friends" / "Delete Account" — dead clicks
- "Logout" button — no `onClick`

#### `UserProfileRight.tsx` (contact's profile drawer)
- "Add Tag", "Important Contact", "Shared Media", "Delete Contact", "Block Contact" — all dead clicks
- Email / phone / hours fields are **hardcoded** ("josephGreen@email.com", etc.) — should come from the contact data when the schema is finalized

### ✨ UX polish (frontend-only, no backend dependency)

| Item | Current | Suggested |
|---|---|---|
| **Send on Enter (Shift+Enter newline)** | Click button only | Add `onKeyDown` to the message TextField |
| **Auto-scroll behavior** | Always scrolls log to bottom on update | Detect if user has scrolled up; show "new messages ↓" pill instead of yanking |
| **Loading state** | None — UI shows empty until Redux resolves | Skeleton loaders for the chat list during initial fetch |
| **Error handling** | Thunks have no `.rejected` handlers | Toast on failure once real APIs are integrated |
| **Empty chat list** | "No Chats Found" only after a search | Friendly empty state when no chats at all |
| **Mobile UX** | Tap a contact → drawer closes | Could add swipe-to-close gesture |
| **Accessibility** | Icon buttons lack `aria-label` | Add labels for screen readers on phone/video/magnify/dots etc. |
| **Avatar fallback** | Refers to `/images/avatars/N.png` | Verify those exist in `public/`; otherwise drop the `avatar` field so initials render |
| **`InputProps` MUI v7 deprecation** | TS hint on SidebarLeft.tsx line 415 | Migrate to `slotProps.input` |

### 🌐 Internationalization (i18n)

No translations wired yet. ~25 hardcoded strings:

- Side menu titles: "Chat" (section + item)
- Sidebar headings: "Chats", "Contacts", "No Chats Found", "No Contacts Found"
- Search placeholder: "Search for contact..."
- Empty state: "Start Conversation"
- Message composer: "Type your message here…", "Send"
- OptionsMenu items: "View Contact", "Mute Notifications", "Block Contact", "Clear Chat", "Report"
- User profile drawer: "About", "Status", "Settings", "Online", "Away", "Do not Disturb", "Offline", "Two-step Verification", "Notification", "Invite Friends", "Delete Account", "Logout"
- Contact profile drawer: "About", "Personal Information", "Options", "Add Tag", "Important Contact", "Shared Media", "Delete Contact", "Block Contact"

When wiring, add a `chat` namespace (e.g. `chat.chats_heading`, `chat.start_conversation`) under `public/locales/en-IN/common.json` and replace each literal with `t('chat.…')` calls.

### 🚀 Feature parity (out of scope right now)

If you ever want WhatsApp / Slack-level features:

- Edit / delete a message
- Reply / quote
- Emoji reactions
- Group chats — **TODO: design first, then build**.
  - Design needed: "+ New Group" entry point placement in `SidebarLeft` (sidebar header `+` icon, FAB, or per-section button), creation drawer layout (group name, optional icon/description, member multi-select), group conversation header variant in `ChatContent`, member-management screen.
  - Implementation: SDK already supports the data layer — `conversationsApi.createGroup({ name, description?, icon?, participantIds })`, plus `addParticipants`, `removeParticipant`, `updateParticipantRole`, `leave`.
  - Build alongside chat-backend rollout (no point shipping the UI before the backend can persist groups).
- Pinned messages
- Image / file preview inline in the log
- @mentions / #channels
- Link previews
- Code blocks / markdown rendering
- Voice notes (mic button exists, no recording)
- Typing indicator
- Push notifications

## Type Safety

- Zero TypeScript errors in any chat file.
- 2 small `.d.ts` shims added to type the JS `@core` components used by chat:
  - `src/@core/components/mui/avatar/index.d.ts` — `CustomAvatar` (`skin`, `color`, `children`)
  - `src/@core/components/sidebar/index.d.ts` — `Sidebar` (`show`, `direction`, `backDropClick`, etc.)
- `chatTypes.ts` inlines its own `ThemeColor` type since the project doesn't expose `src/@core/layouts/types`.

## Known Issues / Risks

| Issue | Severity | Notes |
|---|---|---|
| All messages lost on refresh | Expected | Inherent to mock data — fixed when backend lands |
| Avatar paths assume `/images/avatars/1.png … 8.png` | Low | Falls back to initials if missing |
| Height offset (`10.5rem`) is a magic number | Low | Tweak if AppBar height changes |
| `InputProps` deprecation on TextField (SidebarLeft) | Low | Pre-existing MUI v7 deprecation hint, not breaking |
| `sendMsg` doesn't update `lastMessage` for the SidebarLeft list until next render cycle | Very low | Reducer pushes to `messages[]` and updates `lastMessage`, but the SidebarLeft only re-reads on selector change. Functioning correctly in practice |

## Minimum Frontend Work To Call It "Done"

Without touching the data layer, the highest-leverage tasks are:

1. **Wire the unwired UI** — at least Logout, file upload, send-on-Enter
2. **i18n** — add chat strings to `common.json` and replace hardcoded text
3. **Avatar fallback** — either ship the avatar images or rely on initials
4. **Loading + error states** — skeleton during fetch, toast on failure
5. **Smarter auto-scroll** — don't yank the user when they're reading history

When the backend comes online, the swap is roughly:

1. Replace the 3 thunks with real fetch calls
2. Add `receiveMsg` / `markDelivered` / `markSeen` / `updatePresence` reducers
3. Wire socket.io listeners in `AppChat` to dispatch them
4. Drop the seed data and the auto-attached `lastMessage`

Most of the UI does **not** need to change.

## Rollback

Full removal of the chat module:

```bash
git rm -rf src/app/\(module\)/chat/
git rm -rf src/views/apps/chat/
git rm -rf src/store/apps/chat/
git rm src/types/apps/chatTypes.ts
git rm -rf src/components/navigation/chat/
```

Then in `src/navigation/vertical/index.js` remove the `chatNavigation` import + invocation, and in `src/store/store.ts` remove the `chatReducer` import + reducer registration.

The two `.d.ts` shims (`avatar/index.d.ts`, `sidebar/index.d.ts`) can stay — they're harmless general improvements to the JS @core components.
