# `ChatClientContext` — single-mount socket lifecycle

Single React Context Provider that owns the `@antzsoft/chat-core` SDK lifecycle for the entire app. Replaces the previous `useChatClient()` side-effect hook pattern with a single mount at the app root.

**File:** [`src/contexts/ChatClientContext.tsx`](../../../src/contexts/ChatClientContext.tsx)

---

## What it does

| Responsibility | Mechanism |
|---|---|
| Open the WebSocket | Calls SDK's `connectSocket(config, getAccessToken)` in a `useEffect` |
| Create the REST client | Calls `getChatClient({...})` from `src/lib/chat/client.ts` |
| Expose state to the React tree | `useChatClient()` returns `{ client, socket, connected, error }` via Context |
| Tear down on logout / unmount | Cleanup runs `disconnectSocket()` + `disposeChatClient()` |
| Gate on tenant flag | Early-returns when `auth.userData.settings.ENABLE_CHAT_MODULE === false` |
| Handle auth changes | Effect deps include user_id / id / email — login/logout/user-switch all reconnect correctly |
| Survive Strict Mode dev double-mount | `cancelled` closure flag blocks the `.then()` body if cleanup ran first |
| Auto-reconnect | Native Socket.IO behavior + `refreshSocketAuth()` on `connect_error` + **client-side recovery layer** for the transit-encryption-on-reconnect bug ([socket-recovery.md](./socket-recovery.md)). Four triggers: transit error pattern, `reconnect_failed`, `visibilitychange → visible`, `window.focus`, cross-tab `storage` token-refresh. Visibility-gated + 10s cooldown. Regex catches both `Transit encryption required: missing transitEphemeralPub/transitAlgo` AND `Transit session not found or expired` variants. |
| SDK self-heal on long sleep | Separate visibility listener — when tab returns from >5 min hidden AND `getChatClientOrNull()` is null, bumps `reinitCounter` to force a full SDK + socket rebuild via the main init effect. Idempotent (`reinitInFlightRef`), silent retry with backoff (5s → 10s → 20s), gives up after 3 attempts. On success dispatches `fetchChatsContacts` to replay the conversation list. |
| Receipt-sync workaround | On tab return from >5s hidden (and SDK alive), dispatches `fetchChatsContacts` after a 2s delay to pull missed read-receipts that the backend doesn't reliably emit via socket on DM reads. Retry once after 3s on failure. 30s cooldown. REMOVE once backend emits `read_receipt` / `message_delivered` / `conversation_updated` reliably to sender. |
| Outbox flush on (re)connect | Both `recovery ✓` (transit-encryption fix path) and `reconnect ✓ (auto)` (clean auto-reconnect) dispatch `flushPendingOutbox` so messages queued by `sendMsg.rejected` while the socket was dead get replayed automatically. Idempotent — empty outbox is a no-op. |

---

## Mount points

The Provider is mounted **exactly once per router**, wrapping the rest of the tree:

- App Router → [`src/app/providers.tsx`](../../../src/app/providers.tsx)
- Pages Router → [`src/pages/_app.js`](../../../src/pages/_app.js)

At runtime only one router handles any given route, so only one connection is ever live.

```tsx
<AuthProvider>
  <PushNotificationProvider>
    <ChatClientProvider>
      <LanguageProvider>
        {/* rest of the app */}
      </LanguageProvider>
    </ChatClientProvider>
  </PushNotificationProvider>
</AuthProvider>
```

---

## Public API

```ts
import { ChatClientProvider, useChatClient } from 'src/contexts/ChatClientContext'

// In a React component:
const { client, socket, connected, error } = useChatClient()
```

Called outside a Provider, `useChatClient()` returns a benign default (`{ client: null, socket: null, connected: false, error: null }`) — never throws. Safe to call from components that may render before the Provider is reached (e.g., during tenant chat-module-disabled passthrough).

---

## Relationship with `src/lib/chat/client.ts`

The two files cooperate — they are **NOT duplicates**.

| File | Owns | React-aware? | Reachable from non-React code? |
|---|---|---|---|
| [`src/lib/chat/client.ts`](../../../src/lib/chat/client.ts) | REST client singleton (`_client: AntzChatClient`), `platformUploadFn`, `persistStorage` adapters | ❌ Plain TS module | ✅ Yes via `getChatClientOrNull()` |
| [`src/contexts/ChatClientContext.tsx`](../../../src/contexts/ChatClientContext.tsx) | Lifecycle (when to connect / disconnect), Context with React state | ✅ Provider + hook | ❌ React-only |

```
┌─────────────────────────────────────┐
│  ChatClientContext.tsx (React)      │
│  ─────────────────────────────────  │
│  Provider effect:                   │
│   1. getChatClient({...})  ─────────┼──► reads/creates ─────┐
│   2. connectSocket({...})           │                       │
│                                     │                       ▼
│  Cleanup:                           │              ┌────────────────────┐
│   1. disconnectSocket()             │              │ client.ts          │
│   2. disposeChatClient()  ──────────┼──► clears ──►│   _client (REST)   │
│                                     │              │   AntzChatClient   │
└─────────────────────────────────────┘              └────────────────────┘
                                                              ▲
                                                              │ read by
                                                              │
                                            ┌─────────────────┴─────────────────┐
                                            │  api.ts                            │
                                            │  requireClient('xxx').foo.bar()   │
                                            └────────────────────────────────────┘
```

The Provider is the **only** code that calls `getChatClient(...)` / `disposeChatClient()`. Every other caller (api.ts wrappers, thunks, listeners) reads the singleton via `getChatClientOrNull()` synchronously, because they can't use React hooks.

---

## Socket API access stays global

All socket-API call sites reach the SDK's module-level `_socket` singleton via `sdkSocketEmit` — they do NOT depend on React context.

Verified independent files (6 in total):

| File | Reaches socket via |
|---|---|
| [`src/lib/chat/api.ts`](../../../src/lib/chat/api.ts) | `sdkSocketEmit.sendMessage`, `tryGetSocket()`, raw `socket.emit('delete_message', ...)` |
| [`src/store/apps/chat/index.ts`](../../../src/store/apps/chat/index.ts) | Calls `api.ts` wrappers (no direct SDK access) |
| [`src/views/apps/chat/AppChat.tsx`](../../../src/views/apps/chat/AppChat.tsx) | `tryGetSocket()` to attach `user_offline` / `participant_left` / etc. listeners |
| [`src/views/apps/chat/SendMsgForm.tsx`](../../../src/views/apps/chat/SendMsgForm.tsx) | Calls `sendMessageOverSocket` wrapper |
| [`src/views/apps/chat/ChatLog.tsx`](../../../src/views/apps/chat/ChatLog.tsx) | Receives data via Redux + adapter wrappers |

**Zero of them** import from `src/contexts/ChatClientContext`. The Provider controls the connection lifecycle; the SDK module-level singleton is what every wrapper actually talks to.

---

## Lifecycle traces

### Login

```
1. auth.user populates after successful login
2. Provider effect dep changes (user_id / id / email)
3. Effect cleanup runs (no-op since nothing was set up yet)
4. Effect body runs:
   - getChatClient({...}) creates REST client singleton
   - connectSocket({...}) opens WebSocket
5. Console: [chat:socket] ✅ CONNECTED  id: <socket-id>  at: HH:MM:SS (ISO)
```

### Logout

```
1. handleLogout removes token from localStorage, clears auth.user
2. Provider effect dep changes
3. Effect cleanup runs:
   - disconnectSocket() tears down WebSocket
   - disposeChatClient() nulls the REST singleton
4. Console: [chat:socket] ❌ DISCONNECTED  reason: io client disconnect
5. Effect body re-runs:
   - sourceUser undefined → early return
   - No reconnect on the login page
```

### Hard refresh

```
1. Browser unloads → React cleanup runs → disconnectSocket
   Console: [chat:socket] ❌ DISCONNECTED  reason: io client disconnect
2. Browser re-downloads assets (cache bypassed)
3. App boots → AuthProvider hydrates from localStorage token
4. ChatClientProvider mounts → effect runs:
   - Tick 1: auth not yet hydrated → "[chat:gate] no auth user yet — waiting"
   - Tick 2: auth populated → getChatClient + connectSocket
5. Console: [chat:socket] ✅ CONNECTED  id: <new-id>
```

Token persists across hard refresh (lives in localStorage). New socket id, same user identity.

### Cross-route navigation (`/chat` → `/necropsy` → `/chat`)

Socket stays alive — the Provider is at the app root, not in the chat page. No disconnect, no reconnect cost on every route change. New messages received in the background even while the user is on non-chat routes.

### Strict Mode (dev only)

React 18 Strict Mode mounts → cleans up → mounts again on first render to stress-test cleanups. Visible as an extra connect/disconnect pair in the dev console:

```
[chat:socket] ✅ CONNECTED   ← first mount
[chat:socket] ❌ DISCONNECTED ← strict mode cleanup
[chat:socket] ✅ CONNECTED   ← strict mode remount
```

Race protection via the `cancelled` closure flag — cleanup before `connectSocket().then()` resolves blocks listener attach. Production builds never do this.

### Network drop / reconnect

Socket.IO's built-in auto-reconnect runs. Our `onReconnect` listener flips `connected` back to true. The Provider is not involved in retries — the SDK owns the retry logic.

---

## Disconnect reason values

Logged by `attachSocketLifecycleLogs` ([`src/lib/chat/socketLogger.ts`](../../../src/lib/chat/socketLogger.ts)) as `reason:` on every `❌ DISCONNECTED` line.

| Reason | Cause |
|---|---|
| `io client disconnect` | Explicit `disconnect()` call (logout, refresh, tab close) |
| `io server disconnect` | Server closed the socket |
| `ping timeout` | Keepalive failed (network drop, laptop sleep) |
| `transport close` | TCP connection dropped (browser quit) |
| `transport error` | Network error mid-message |

---

## Verification

```bash
# Type-check clean
npx tsc --noEmit
# → exit 0

# No stale references to deleted files
grep -rn "ChatBoot" src/                       # → 0 hits
grep -rn "src/hooks/useChatClient" src/        # → 0 hits

# Exactly one connectSocket call site
grep -rn "connectSocket(" src/                 # → 1 hit (ChatClientContext.tsx:192)

# Provider mounted in exactly the two routers
grep -rn "<ChatClientProvider" src/            # → 2 JSX mounts
                                               #   (App Router + Pages Router)
```

Runtime smoke test:
1. Open the app → `[chat:socket] ✅ CONNECTED` fires once.
2. Send a message → bubble appears, no extra connect.
3. Navigate to another route → no disconnect.
4. Come back to chat → still connected, same socket id.
5. Hard refresh → exactly one `❌ DISCONNECTED` followed by one `✅ CONNECTED` (new id).
6. Logout → exactly one `❌ DISCONNECTED  reason: io client disconnect`. No reconnect on the login page.

---

## Why we kept `client.ts` separate

You can't fold `client.ts` into the Provider because:

1. **`api.ts` needs synchronous access** to the REST client from plain functions (thunks, listeners, helpers) — those can't call React hooks.
2. **SDK adapters** (`platformUploadFn`, `persistStorage`) are constructor args — plain functions that naturally live in a plain TS module.
3. **Matches the SDK's own design** — the SDK keeps its socket as a module-level singleton too (`_socket` inside `@antzsoft/chat-core`). Symmetric architecture.

So `client.ts` is the **storage / factory**, `ChatClientContext.tsx` is the **React-aware lifecycle manager**. They cooperate cleanly.
