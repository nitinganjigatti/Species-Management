# Chat-Core Starter Plan

> **Status (May 2026)**: `@antzsoft/chat-core@1.0.0` is installed. No integration code yet. This doc is the **starting playbook** — what to ask the backend team, and the first concrete steps to wire it up when answers come back.
>
> Companion to:
> - [README.md](./README.md) — current Materio mock setup
> - [antzsoft-chat-core.md](./antzsoft-chat-core.md) — complete SDK reference

---

## TL;DR

Three things must happen before any code is written:

1. **Confirm the chat backend exists** (or get an ETA)
2. **Get the API URL + endpoint contract** from backend
3. **Confirm WSO2 token compatibility** (does the chat server accept your existing access token?)

Once those are settled, the actual frontend work is small (~3 files, ~150 lines).

---

## Step 0 — Questions to ask the backend team

Send this list to whoever owns the chat backend. Without answers, frontend cannot proceed.

### Connectivity
- [ ] **API base URL** for dev / staging / prod? (e.g. `https://chat-api.dev.antzsystems.com/api/v1`)
- [ ] **Socket.IO URL** if different from API URL? (SDK defaults to `apiUrl` with `/api/vN` stripped, namespace `/chat`)
- [ ] Is the chat backend behind the same CORS allowlist as the rest of the app?

### Authentication
- [ ] **Does the chat server accept WSO2-issued JWTs directly?** (We send `Authorization: Bearer <wso2-access-token>`)
- [ ] If not, is there a **token-exchange endpoint** that swaps WSO2 token → chat token?
- [ ] Is there a separate chat-side login (`/auth/login` with email + password) that we need to use instead?
- [ ] How is **multi-tenancy** keyed? The SDK sends `X-Tenant-ID` — should we pass our `zoo_id`, the `tenantId` from WSO2, or something else?

### Resource model
- [ ] How are **users provisioned**? Are existing WSO2 users auto-created on first chat login, or does the chat server need to be pre-seeded?
- [ ] What is the **user identity field** that the chat server returns? (Our app keys users by `user_id` in WSO2 — does the chat server use the same id or its own?)
- [ ] Are **conversations** auto-created (e.g. one per zoo, one per team), or do users create them on demand?

### Real-time behaviour
- [ ] On reconnect, does the server **replay missed messages**, or do we need to fetch via REST after `socket.connected`?
- [ ] Is there a **typing-timeout** convention (e.g. server auto-clears typing after Ns of silence) or must the client emit `typing(false)`?

### Files
- [ ] Which **storage backend** powers presigned URLs — S3, GCS, Azure Blob? (Affects whether platformUploadFn uses PUT or multipart POST)
- [ ] Are there **file-size or type restrictions** the server enforces (so we mirror them in `UploadConfig`)?

### Push notifications
- [ ] Is **push notification** delivery active on the backend yet? If yes, which provider — FCM / APNs / Web Push / Expo?

### Encryption
- [ ] What `encryptionMode` does the server run in — `none` or `server`? (Client must match)

---

## Step 1 — Environment setup

### Dev (configured 2026-05-16, verified working)

```bash
# .env.development
NEXT_PUBLIC_CHAT_API_URL='https://genai-api.dev.antzsystems.com/chat-api/api/v1'
NEXT_PUBLIC_CHAT_WS_URL='https://genai-api.dev.antzsystems.com/chat-api'
```

### UAT / Production

```bash
# .env.uat / .env.production (when ready)
NEXT_PUBLIC_CHAT_API_URL='https://<prod-host>/chat-api/api/v1'
NEXT_PUBLIC_CHAT_WS_URL='https://<prod-host>/chat-api'
```

### Why both vars are set explicitly

The SDK claims it auto-derives `socketUrl` from `apiUrl` by stripping `/api/vN`. That part works.

But the SDK does **not** auto-derive the Socket.IO engine path from the socketUrl prefix (this is a bug — see [Architecture](#architecture--how-the-connection-is-actually-wired) below). We work around it by:

1. Passing `socketUrl` explicitly so it includes the `/chat-api` prefix
2. Bypassing the SDK's socket layer entirely with our own thin wrapper in [`src/lib/chat/socket.ts`](../../../src/lib/chat/socket.ts)

The wrapper splits `socketUrl` into origin + engine path:

| Input | Parsed |
|---|---|
| `https://genai-api.dev.antzsystems.com/chat-api` | origin `https://genai-api.dev.antzsystems.com` + engine path `/chat-api/socket.io` |
| `https://chat.example.com` (no prefix) | origin `https://chat.example.com` + engine path `/socket.io` |

Resulting WebSocket connection URL in dev:
```
wss://genai-api.dev.antzsystems.com/chat-api/socket.io/?EIO=4&transport=websocket
```

---

## Architecture — how the connection is actually wired

```
                                  ┌──────────────────────────────────┐
                                  │  AuthContext (existing app auth) │
                                  │  • userData.user.user_id         │
                                  │  • userData.user.zoos[0].zoo_id  │
                                  │  • localStorage 'accessToken'    │
                                  └──────────┬───────────────────────┘
                                             │
                       ┌─────────────────────┴────────────────────┐
                       │                                          │
                       ▼                                          ▼
            ┌────────────────────────┐              ┌──────────────────────────┐
            │ src/lib/chat/client.ts │              │ src/lib/chat/socket.ts   │
            │ (singleton REST client)│              │ (singleton socket.io     │
            │ uses @antzsoft/chat-   │              │  client wrapper — bypass │
            │  core's AntzChatClient │              │  for SDK v1.0.0 path-    │
            │                        │              │  prefix bug)             │
            └───────────┬────────────┘              └────────┬─────────────────┘
                        │                                    │
                        │   getChatClient(opts)              │  openChatSocket(opts)
                        │                                    │
                        ▼                                    ▼
            ┌────────────────────────┐              ┌──────────────────────────┐
            │ AntzChatClient         │              │ socket.io-client `io()`  │
            │ • client.auth          │              │ with explicit `path`     │
            │ • client.messages      │              │ option from URL prefix   │
            │ • client.conversations │              │                          │
            │ • client.storage       │              │ Namespace `/chat`        │
            │ • client.uploadFiles() │              │ Auth: { token, userId,   │
            │                        │              │   tenantId, avatarUrl }  │
            │ All REST → POST/GET to │              │                          │
            │ {apiUrl}/auth, ...     │              │ Engine endpoint:         │
            │                        │              │   {origin}{prefix}/      │
            │                        │              │   socket.io/             │
            └────────────────────────┘              └──────────────────────────┘
                        │                                    │
                        └──────────────┬─────────────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────────┐
                        │ src/hooks/useChatClient.ts   │
                        │ React hook combining both    │
                        │                              │
                        │ Returns { client, socket,    │
                        │           connected, error } │
                        └───────────────┬──────────────┘
                                        │
                                        ▼
                          src/views/apps/chat/AppChat.tsx
                          (consumes the hook, wires UI)
```

### Why we bypass the SDK socket

`@antzsoft/chat-core@1.0.0` calls `io(\`${socketUrl}/chat\`, { ... })` without passing a `path` option. Socket.IO then:

- Treats the URL pathname (`/chat-api/chat`) as the **namespace**
- Uses the default engine path `/socket.io/` (not `/chat-api/socket.io/`)

Result: WebSocket connects to `wss://host/socket.io/...` → 404, no matter what `socketUrl` is set to. The SDK's docs claim auto-derivation but the bundled code doesn't implement it.

Our wrapper at `src/lib/chat/socket.ts` does the right thing:
```ts
const url = new URL(opts.socketUrl)
const origin = `${url.protocol}//${url.host}`
const enginePath = `${url.pathname.replace(/\/$/, '')}/socket.io`

io(`${origin}/chat`, {
  path: enginePath,          // ← the missing option
  transports: ['websocket', 'polling'],
  auth: { token, userId, tenantId, avatarUrl }
})
```

**When the SDK ships a fix** (likely v1.0.2+), the wrapper can be deleted and the hook can switch to `client.socket.on/emit/off` — that's the only swap required.

### Handshake auth payload

What we send in `socket.auth` matches the SDK's contract so the backend sees the same shape:

```ts
{
  token: 'Bearer <wso2-access-token>',
  userId: '<user_id from AuthContext>',
  tenantId: '<zoo_id from AuthContext>',
  avatarUrl: '<profile_image from AuthContext, if any>'
}
```

The chat backend validates the Bearer token by calling `/chat-integration/auth/validate-token` on the main Antz API (see [integration-api-reference.md](./integration-api-reference.md)).

> **No URL = no chat.** Don't try to scaffold the client until this is set.

---

## Step 2 — Singleton REST client

**File**: [`src/lib/chat/client.ts`](../../../src/lib/chat/client.ts)

Wraps `AntzChatClient` from `@antzsoft/chat-core` as a singleton for the REST surface (auth, messages, conversations, storage). The `connect()` method is **not called** by anything — the socket layer is handled separately because of the SDK bug.

Key exports:
- `getChatClient(opts)` — returns the singleton, creates on first call. Opts: `authProvider`, `userId` (required for WSO2/external auth), `tenantId`, `avatar`.
- `disposeChatClient()` — clears the singleton on logout.
- `defaultAuthProvider` — reads the access token from `localStorage[authConfig.storageTokenKeyName]`.

Adapters embedded in the file:
- `persistStorage` — wraps `localStorage` (SSR-safe via `typeof window` check).
- `platformUploadFn` — XHR upload to presigned URLs with progress reporting.

## Step 2b — Singleton socket wrapper

**File**: [`src/lib/chat/socket.ts`](../../../src/lib/chat/socket.ts)

Thin wrapper around `socket.io-client` that exists **only because of the SDK's path-prefix bug** (see [Architecture](#architecture--how-the-connection-is-actually-wired)).

Key exports:
- `openChatSocket(opts)` — opens the socket with the correct `path` option. Idempotent. Opts: `socketUrl`, `getToken`, `userId`, `tenantId`, `avatar`.
- `getChatSocket()` — returns the current socket if open.
- `closeChatSocket()` — disconnects + clears singleton.
- `refreshChatSocketAuth(opts)` — swaps the auth payload (for token refresh) and reconnects.

When the SDK fix lands (probably v1.0.2), this file can be deleted and the hook can swap back to `client.socket.on/emit/off`.

## Step 3 — React hook wiring everything

**File**: [`src/hooks/useChatClient.ts`](../../../src/hooks/useChatClient.ts)

```ts
const { client, socket, connected, error } = useChatClient()
```

What the hook does:

1. Waits for `auth.userData.user` to be populated by `AuthContext`.
2. Bails out (with a console warning) if `NEXT_PUBLIC_CHAT_API_URL` is not set.
3. Resolves `userId` from `auth.userData.user.user_id` (falls back to `id`, then `email`).
4. Resolves `tenantId` from `auth.userData.user.zoos[0].zoo_id`.
5. Resolves `avatarUrl` from `profile_image` / `avatar` / `avatar_url`.
6. Initializes the REST `client` via `getChatClient()`.
7. Opens the `socket` via `openChatSocket()` with the same identity.
8. Attaches `connect`/`connect_error`/`disconnect`/`reconnect` listeners → updates `connected` + logs.
9. On unmount: detaches listeners + `closeChatSocket()` + `disposeChatClient()`.

Console signals to watch for:
- `[chat] connected to backend ✓` — handshake succeeded
- `[chat] connect_error: <message>` — backend rejected (token, userId, tenantId, etc.)
- `[chat] disconnected: <reason>` — server or network dropped us
- `[chat] reconnected ✓` — recovered after a drop

---

## Step 4 — Smoke test (UI unchanged)

In `src/views/apps/chat/AppChat.tsx`, add **just** this at the top of the component (don't touch the existing render):

```ts
import { useChatClient } from 'src/hooks/useChatClient'

const AppChat = () => {
  const { client, connected, error } = useChatClient()

  useEffect(() => {
    if (!client || !connected) return
    console.log('[chat] connected to backend ✓')
    const onNew = (evt: any) => console.log('[chat] new_message:', evt)
    client.socket.on('new_message', onNew)
    return () => client.socket.off('new_message', onNew)
  }, [client, connected])

  // … existing AppChat code unchanged (still uses Redux mock data) …
}
```

Open `/chat` in the browser, watch the console:

| Console message | Meaning |
|---|---|
| `[chat] connected to backend ✓` | SDK is healthy. Move to Step 5. |
| `[chat] connect failed: <reason>` | Backend rejected the connection. Common causes below. |
| `NEXT_PUBLIC_CHAT_API_URL not set` | You skipped Step 1. |
| Nothing logged | Auth not ready (`auth.userData.user` still null). Refresh after login. |

### Common connection failures

| Error | Likely cause | Fix |
|---|---|---|
| `Network Error` / `ERR_CONNECTION_REFUSED` | Backend not running or URL wrong | Verify URL with backend team |
| `401 Unauthorized` | Token format/issuer mismatch | Token exchange likely needed — talk to backend team |
| `403 Forbidden` | Tenant ID rejected | Check `X-Tenant-ID` value vs backend expectation |
| CORS error in console | Origin not in allowlist | Backend must add your origin to CORS |
| `socket.io connection timeout` | WS URL wrong or WS port blocked | Check `socketUrl` env var |

---

## Step 5 — Replace thunks one at a time

Only proceed when Step 4 shows `[chat] connected to backend ✓`.

### Order matters — start with read paths

1. **`fetchUserProfile`** — call `client.auth.getMe()`. UI shows your real name + avatar. If this works, REST + auth are healthy.
2. **`fetchChatsContacts`** — call `client.conversations.list()`. Map results into the Materio `ChatsArrType` shape (write an adapter in `src/lib/chat/adapters.ts`).
3. **`selectChat`** (when user clicks a contact) — call `client.conversations.createDirect({ userId })` instead of building locally.
4. **`sendMsg`** — replace with `client.socket.emit.sendMessage(...)`. UI gets real-time delivery via the `new_message` socket event.

Each step is independently testable. If one breaks, revert just that thunk to the mock version.

### Add new reducers / Zustand state for incoming events

After the four thunk swaps, add socket listeners for:

| Event | What to do |
|---|---|
| `new_message` | Append to chat messages (new `receiveMsg` reducer) |
| `message_updated` | Replace message text |
| `message_deleted` | Remove from messages |
| `reaction_updated` | Replace reactions array |
| `typing_indicator` | `useChatStore.addTypingUser` / `removeTypingUser` |
| `user_status` | `useChatStore.setUserOnline` / `setUserOffline` |
| `read_receipt` | Flip `isSeen` on messages |
| `message_ack` | Replace optimistic `tempId` with real `messageId` |
| `messages_delivered` | Flip `isDelivered` on messages |

The SDK already ships `useChatStore` for the transient state (typing, presence). Use it directly — don't duplicate in Redux.

---

## Step 6 — Cleanup

Once all four thunks use the real API and socket events are wired:

- Delete the mock seed data (`chatsSeed`, `contactsSeed`, `userProfile` constants) from `src/store/apps/chat/index.ts`
- Delete the `loadServerRows` synthesis / `lastMessage` attach loop
- Update [README.md](./README.md) "Mock Data" section to "Real Backend"

---

## Decision matrix — Do this now or later?

| Question | Now if… | Later if… |
|---|---|---|
| Wire `useChatClient` hook | Backend URL known | Backend URL unknown |
| Add socket listeners | Backend emits events | Backend WS not ready |
| Replace `fetchUserProfile` | `/auth/me` endpoint works | REST not ready |
| Replace `sendMsg` | Socket emit `sendMessage` works | Socket not ready |
| Push notifications | FCM/APNs/Web Push pipeline live | No push backend |
| File uploads | Storage backend deployed | Storage not ready |

You can implement **any subset** — the mock data stays as fallback for anything not yet swapped.

---

## Working backwards — what does success look like?

When fully integrated, the chat module should:

- ✅ Show the logged-in user's real name + avatar in the left sidebar
- ✅ List real conversations from the chat backend, sorted by `lastMessage.sentAt`
- ✅ Open a conversation → fetch history via cursor pagination
- ✅ Send a message → optimistic UI render → real `message_ack` arrives → tempId swapped to real id
- ✅ See typing indicator when another user is typing (from `typing_indicator` event)
- ✅ See online/offline dots update in real time (from `user_status` event)
- ✅ Receive new messages from other users without refreshing (from `new_message` event)
- ✅ Read receipts flip `✓` → `✓✓` (from `read_receipt` event)
- ✅ Upload an image → presign → blob upload → confirm → message includes attachment
- ✅ Survive token refresh — SDK auto-refreshes on 401

---

## Files involved (full picture)

| Phase | File | Purpose | Status |
|---|---|---|---|
| 1 | `.env.development` / `.env.uat` / `.env.production` | API + WS URLs | ✅ dev set |
| 2  | `src/lib/chat/client.ts` | Singleton REST client (`AntzChatClient`) | ✅ built |
| 2b | `src/lib/chat/socket.ts` | Singleton `socket.io-client` wrapper (workaround for SDK v1.0.0 path bug) | ✅ built |
| 3  | `src/hooks/useChatClient.ts` | React hook combining REST + socket + auth | ✅ built |
| 4  | `src/views/apps/chat/AppChat.tsx` | Smoke-test effect — logs incoming events | ✅ wired |
| 5  | `src/store/apps/chat/index.ts` | Thunk replacements, new reducers | ☐ pending |
| 5  | `src/lib/chat/adapters.ts` | Map SDK types → Materio types | ☐ pending |
| 6  | cleanup of `src/store/apps/chat/index.ts`, `README.md` | Delete seeds, update docs | ☐ pending |

Six new files, one mock slice rewritten, zero changes to UI components.

---

## Status today

✅ Package installed (`@antzsoft/chat-core@1.0.0` in `package.json`)
✅ Materio mock chat UI works
✅ Full SDK reference doc available — [antzsoft-chat-core.md](./antzsoft-chat-core.md)
☐ Backend confirmation pending — see Step 0 questions
☐ Env vars set
☐ Singleton client / hook scaffolded
☐ Smoke test green
☐ Thunks replaced
☐ Mock seeds removed
