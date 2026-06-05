# `ChatClientContext` — single-mount socket lifecycle

Single React Context Provider that owns the `@antzsoft/chat-core` SDK lifecycle for the entire app. Replaces the previous `useChatClient()` side-effect hook pattern with a single mount at the app root.

**File:** [`src/contexts/ChatClientContext.tsx`](../../../src/contexts/ChatClientContext.tsx)

> **Updated 2026-06-04 — aligned to the `@antzsoft/chat-core` integration guide.**
> The connection lifecycle now follows the SDK's recommended pattern: **disconnect-on-hidden** + **`refreshSocketAuth()` + reconnect-on-visible**
>
> **Token: use `authToken`, NOT `authProvider`.** In chat-core 1.2.6's headless core the REST request interceptor reads the token from the SDK auth store (seeded by `authToken`); `config.authProvider` is **not invoked** in this build. Passing `authProvider` instead left the store unseeded → every REST call threw `AntzChatAuthError: Authorization header missing`. The socket gets its token separately (`ChatClientContext` passes `getAccessToken` into `connectSocket`), so socket tokens stay fresh regardless.
> (the reconnect re-runs the transit handshake `/crypto/pubkey` + `/crypto/session`, so REST and
> socket get a fresh session). The previous client-side recovery stack — `recoverFromStuckSocket`,
> the long-sleep self-heal reinit, the receipt-sync-on-focus workaround, and the reactive transit-403
> interceptor — was **removed**. Those were workarounds for the 1.2.6 SDK no longer refreshing its
> REST transit session on reconnect; the guide's disconnect/reconnect-on-visibility handles it
> directly. [socket-recovery.md](./socket-recovery.md) describes that removed layer and is now
> historical. Trade-off: a *foreground* laptop lid-close (no `visibilitychange` event) relies on
> Socket.IO's built-in auto-reconnect — same as any app following the guide.

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
| Token delivery | **REST:** `authToken` in [`src/lib/chat/client.ts`](../../../src/lib/chat/client.ts) seeds the SDK auth store the REST interceptor reads. (`authProvider` is NOT invoked in chat-core 1.2.6 — using it caused `Authorization header missing`.) **Socket:** `getAccessToken` passed into `connectSocket` (re-reads `localStorage` each connect → fresh). |
| Tab visibility lifecycle | **HIDDEN** → `disconnectSocket()`. **VISIBLE** → `refreshSocketAuth()` then `connectSocket()`. The reconnect re-runs the transit handshake (`/crypto/pubkey` + `/crypto/session`), giving REST + socket a fresh session — this is what prevents `403 "Transit encryption required"` after a sleep/tab-switch. Matches the SDK integration guide's `ChatProvider` pattern. |
| Auto-reconnect | Native Socket.IO built-in retry handles network drops. `onConnect` / `onReconnect` flip `connected`; `connect_error` calls `refreshSocketAuth()` so the next built-in retry uses a current token. No custom recovery layer. |
| Outbox flush on reconnect | `onReconnect` dispatches `flushPendingOutbox` so messages queued by `sendMsg.rejected` while the socket was dead get replayed automatically. Idempotent — empty outbox is a no-op. |
| Deactivation → logout | A `getAuthStore()` subscriber bridges a server-side account deactivation (auth store `isAuthenticated` flips true→false) to the app's existing `session-expired` event, so an idle chat user still gets logged out. |

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

Socket.IO's built-in auto-reconnect runs. Our `onReconnect` listener flips `connected` back to true and flushes the pending outbox. The Provider is not involved in retries — the SDK owns the retry logic.

### Tab hidden / visible (the SDK guide's pattern)

```
1. Tab hidden (other tab / minimize):
   - onVisibilityChange → disconnectSocket() + setConnected(false)
   - Console: [chat:socket] ❌ DISCONNECTED  reason: io client disconnect
2. Tab visible again:
   - refreshSocketAuth() (re-reads the socket token via getAccessToken)
   - connectSocket(...) → fresh transit handshake:
       GET  /crypto/pubkey   (often 304)
       POST /crypto/session  (new session)
   - Console: [chat:socket] ✅ CONNECTED  id: <new-id>
   - Subsequent chat REST calls use the fresh session → no 403
```

While hidden, the socket is closed, so no live messages arrive in the background (they load on the reconnect). Background delivery relies on web push. This is the integration guide's intended behavior.

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

# connectSocket call sites — both inside ChatClientContext (initial connect +
# reconnect-on-visible). No other file calls it.
grep -rln "connectSocket(" src/                # → 1 file: ChatClientContext.tsx

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
