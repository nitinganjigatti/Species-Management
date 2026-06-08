# Socket Recovery — Transit-Encryption-on-Reconnect Fix

> ⚠️ **HISTORICAL (removed 2026-06-04).** The recovery layer described here —
> `recoverFromStuckSocket`, the long-sleep self-heal reinit, the receipt-sync-on-focus
> workaround, and the reactive transit-403 interceptor — has been **removed** from
> `ChatClientContext.tsx`. The provider now follows the `@antzsoft/chat-core` integration
> guide's connection lifecycle instead (REST token via `authToken`; disconnect-on-hidden;
> `refreshSocketAuth()` + reconnect-on-visible, which re-runs the transit handshake). See
> [chat-client-context.md](./chat-client-context.md) for the current behavior. This document
> is kept for historical context on the 1.2.6 transit-session-on-reconnect issue.

How the chat socket recovers from the SDK + server interaction bug where Socket.IO's built-in auto-reconnect succeeds at the transport layer but is then immediately rejected by the server because of stale transit-encryption ephemeral keys — leaving the socket permanently dead until the user refreshes the page.

All code lives in [src/contexts/ChatClientContext.tsx](../../../src/contexts/ChatClientContext.tsx).

## TL;DR

| Question | Answer |
| --- | --- |
| What's the bug? | After a brief network blip, the SDK's auto-reconnect reuses stale transit-encryption ephemeral keys; the server rejects the handshake with `"Transit encryption required: missing transitEphemeralPub/transitAlgo in handshake auth"`; Socket.IO marks the socket as "given up" (`active === false`) and never tries again. |
| Why does it matter? | Users see a "disconnected" badge that never clears. Sending a message fails with `[AntzChat] Socket reconnect timeout`. Only a page refresh restores chat. |
| Where's the fix? | Client-side workaround in `ChatClientContext.tsx` — detects the failure pattern and forces a fresh `disconnectSocket()` + `connectSocket()` cycle, which re-runs `fetchServerKeys()` + `performHandshake()` with new ephemeral keys. |
| Is it permanent? | No — this is a workaround until the SDK natively regenerates ephemeral keys on reconnect. Marked for removal once that ships. |
| Can it loop / leak? | No — visibility-gated, 10-second cooldown, every SDK call wrapped in try/catch, every event listener has a matching cleanup. |

---

## The bug

### Sequence that breaks

```
T+0    Initial connect
       Client: generates ephemeral key A
       Sends pubA in handshake auth
       Server: matches with its ephemeral key B, derives session Kab
       ✓ Encrypted channel ready

T+30s  Network blip (Wi-Fi hiccup, transport close)
       Socket dies
       Server forgets ephemeral key B (session is gone)
       Client still holds ephemeral key A in memory

T+31s  Socket.IO built-in auto-retry kicks in
       Reconnects at the WebSocket layer
       BUT reuses the same auth payload from T+0
       Sends stale pubA

T+32s  Server response
       "I don't have a matching session for pubA — REJECT"
       Error: "Transit encryption required: missing
              transitEphemeralPub/transitAlgo in handshake auth"

T+32s  Socket.IO sees the fatal connect_error after reconnect
       Marks the socket as "given up" (`active === false`)
       Stops trying forever
       
T+32s+ User sees disconnected, has to refresh the page to recover
```

### Why each component is "correct in isolation"

Three independent components, none of them buggy on their own, combine into the bug:

| Component | What it does | What it ASSUMES |
| --- | --- | --- |
| **Server** | Drops ephemeral keys when the socket disconnects | "Client will generate new keys on reconnect" |
| **Socket.IO** | Auto-reconnects with the same auth payload it was given at construction time | "Auth payload is stable across reconnects" (true for plain JWT auth, NOT true for ephemeral keys) |
| **chat-core SDK** | Generates ephemeral keys ONCE during initial `connectSocket()` | "Socket.IO will trigger a fresh handshake if needed" — but it doesn't |

The bug emerges only when all three meet during a reconnect cycle.

### Trace evidence (2026-06-01)

Real console output captured the moment the bug fired:

```
[chat:socket-trace] disconnect ✗ {reason: 'transport close', willAutoReconnect: true, ...}
[chat:socket-trace] reconnect_attempt {attempt: 1, ...}
[chat:socket-trace] reconnect_attempt {attempt: 2, ...}
[chat:socket-trace] reconnect_attempt {attempt: 3, ...}
[chat:socket-trace] reconnect ✓ (auto) {socketId: undefined, ...}
[chat:socket-trace] connect_error {
  message: "Transit encryption required: missing transitEphemeralPub/transitAlgo in handshake auth",
  stillTrying: false,            ← SDK has given up
  visibility: 'visible',          ← user IS actively looking
  online: true                    ← network IS back
}
```

`stillTrying: false` is the smoking gun — Socket.IO's built-in retry has stopped, the socket is permanently dead until something else kicks it.

---

## The fix — `recoverFromStuckSocket`

### Single recovery function, four triggers

```ts
const recoverFromStuckSocket = (reason: string) => {
  // Only when the tab is visible — matches "fire on visible" requirement
  if (document.visibilityState !== 'visible') return

  // 10-second cooldown — prevents tight loops if recovery itself fails
  if (Date.now() - lastRecoveryAt < 10000) return
  lastRecoveryAt = Date.now()

  try {
    disconnectSocket()                                      // tear down stale singleton
    connectSocket(resolvedSocketConfig, getAccessToken)     // fresh handshake
      .then(() => /* recovery ✓ — fresh handshake succeeded */)
      .catch(e => /* recovery ✗ — fresh handshake failed */)
  } catch (e) {
    /* recovery threw */
  }
}
```

Calling `disconnectSocket()` clears the SDK singleton. The next `connectSocket()` re-runs:
- `fetchServerKeys(apiUrl)` — gets the server's current public key
- `performHandshake()` — generates a brand-new ephemeral key pair
- `io(socketOrigin, { auth: socketHandshakeAuth })` — connects with FRESH `transitEphemeralPub` + `transitAlgo`

Server accepts the new handshake. Socket is alive again.

### Four independent triggers

| # | Trigger | When it fires | Recovery cause |
| --- | --- | --- | --- |
| 1 | `connect_error` with transit pattern | Server rejects handshake with `transit`/`transitEphemeralPub`/`transitAlgo` in the message | The exact verified bug |
| 2 | `reconnect_failed` | Socket.IO exhausted all 10 retry attempts for ANY reason | Belt-and-suspenders for non-transit failures |
| 3 | `visibilitychange → visible` | User returns to the tab and socket is dead | Catches network drops longer than the retry window |
| 4 | `window.focus` | User alt-tabs back from another app | Same as #3 but for tab/app switching |
| 5 | `storage` event on auth token | Another tab refreshed the JWT | Cross-tab token-refresh recovery |

All five funnel through `recoverFromStuckSocket` → same teardown + reconnect logic.

### Token refresh — handled automatically

`getAccessToken` is a **function**, not a static value:

```ts
const getAccessToken = (): string =>
  typeof window !== 'undefined' ? localStorage.getItem(authConfig.storageTokenKeyName) ?? '' : ''
```

It re-reads `localStorage` on every call. So whenever `connectSocket(resolvedSocketConfig, getAccessToken)` runs (initial + every recovery), it picks up the latest token. Same-tab token refresh needs no special handling. Cross-tab refresh is caught by the `storage` event listener (trigger #5).

---

## Safety guarantees

### Visibility-gating

Background tabs never trigger recovery. Saves CPU/network when the user isn't looking.

```ts
if (document.visibilityState !== 'visible') return
```

Also re-checked inside `checkSocketOnTabActive` because `window.focus` can fire while the document is hidden in some browser states (e.g. devtools as a popout).

### Cooldown (10 seconds)

`lastRecoveryAt` is scoped per `useEffect` lifecycle. Resets on logout/login (effect re-init). Within a session, at most one recovery attempt per 10 seconds — caps the worst case at 6 attempts/minute if recovery itself keeps failing.

### Forward-compat — every SDK call wrapped

| SDK call | Where | Guard |
| --- | --- | --- |
| `connectSocket(...)` initial | Main effect | `.catch(setError)` |
| `connectSocket(...)` recovery | Inside `recoverFromStuckSocket` | Outer `try/catch` + `.then`/`.catch` on the promise |
| `disconnectSocket()` recovery | Inside `recoverFromStuckSocket` | Outer `try/catch` |
| `disconnectSocket()` cleanup | Effect cleanup | `try/catch` |
| `disposeChatClient()` cleanup | Effect cleanup | `try/catch` |
| `refreshSocketAuth()` | `onConnectError` | `try/catch` |
| `getSocket()` in `checkSocketOnTabActive` | Tab-active handler | `try/catch` (returns null on throw) |
| `getSocket()` in lifecycle log blocks | Trace blocks | Existing `try/catch` |

12 `try` blocks, 12 `catch` blocks across the file. No unbalanced try, no unprotected SDK call.

### Event listener parity

```
DOM:    3 addEventListener  ↔  3 removeEventListener
        visibilitychange (document)
        focus            (window)
        storage          (window)

Socket: 7 on  ↔  7 off
        connect, connect_error, disconnect           (socket)
        reconnect, reconnect_attempt, reconnect_error, reconnect_failed   (socket.io manager)
```

Every listener has a matching cleanup on the same target with the same handler reference. No orphaned listeners on unmount.

### What an SDK update CAN'T break

| SDK change | Our behavior |
| --- | --- |
| Error message wording changes | Specific-pattern trigger silent; layered fallbacks (`reconnect_failed`, visibility, focus, storage) still fire recovery |
| `refreshSocketAuth` removed | `try/catch` logs and continues; recovery still runs via other triggers |
| `disconnectSocket` removed/renamed | Cleanup logs and continues; React state still resets to null; no leak |
| `getSocket` throws in new lifecycle state | Caught, treated as "no socket to inspect"; no false recovery |
| Bug fixed natively in SDK | Error patterns never match; recovery never fires; code is silent dead weight (harmless) |
| Socket.IO Manager event names change | `reconnect_failed` trigger silent; visibility/focus/connect_error still cover |

### What an SDK update WOULD break (and it's the right place to break)

| SDK change | Why |
| --- | --- |
| `connectSocket` signature changes | TS error at compile time → caught before deploy |
| `import { connectSocket } from '@antzsoft/chat-core'` removed | Build fails immediately → can't ship |

These are **compile-time failures**, not silent runtime stranding.

---

## What the trace logs look like

All prefixed `[chat:socket-trace]` — removable with `grep -rln "chat:socket-trace" src/` once the recovery is verified in production.

### Healthy connection (no action needed)

```
[chat:socket-trace] connect ✓ {socketId: "xyz", visibility: 'visible', online: true}
```

### Brief blip with self-recovery (no action needed)

```
[chat:socket-trace] disconnect ✗ {reason: 'transport close', willAutoReconnect: true}
[chat:socket-trace] reconnect_attempt {attempt: 1}
[chat:socket-trace] reconnect ✓ (auto) {socketId: "..."}
```

### The bug we fixed — recovery fires successfully

```
[chat:socket-trace] disconnect ✗ {reason: 'transport close', willAutoReconnect: true}
[chat:socket-trace] reconnect_attempt {attempt: 1, 2, 3}
[chat:socket-trace] reconnect ✓ (auto) {socketId: undefined}
[chat:socket-trace] connect_error {message: "Transit encryption required...", stillTrying: false}
[chat:socket-trace] recovery → tear down + fresh connectSocket {reason: 'connect_error:transit'}
[chat:socket-trace] recovery ✓ — fresh handshake succeeded
[chat:socket-trace] connect ✓ {socketId: "new-id"}
```

### Cooldown / visibility gates skipping recovery (expected behavior)

```
[chat:socket-trace] recovery skipped — tab not visible {reason: 'visibility:active'}
[chat:socket-trace] recovery skipped — cooldown active {reason: 'reconnect_failed', msSinceLast: 3200}
```

### Red flags — paste back if you see these

| Pattern | Meaning |
| --- | --- |
| `recovery ✗ — fresh handshake failed` (repeated) | Recovery itself is failing — needs investigation, the workaround isn't enough |
| `recovery skipped — cooldown active` repeated many times in a row | Recovery is in a loop; cooldown is the only thing preventing CPU/network burn — root cause is something else |
| Multiple `connect_error` without matching `recovery →` | New error pattern not covered by our regex — extend the regex or add a new trigger |
| Socket stuck disconnected for >30s with tab visible | Recovery isn't firing for some reason — paste the full trace |

---

## End-to-end flow with the fix

```
                  ┌──────────────────┐
                  │  Initial connect │
                  │  fetchServerKeys │
                  │  performHandshake│
                  │  io({auth: ...}) │
                  └────────┬─────────┘
                           ↓
                    ┌─────────────┐
                    │  ✓ connect  │ ← happy path, transit-encryption working
                    └──────┬──────┘
                           ↓
                    [user uses chat normally]
                           ↓
              ┌──────────────────────────────┐
              │   Network blip / Wi-Fi hop   │
              └────────────────┬─────────────┘
                               ↓
                ┌────────────────────────────┐
                │ Socket.IO auto-retry × 10  │ ← built-in, no user code involved
                └─────────┬──────────────────┘
                          ↓
              ┌──────────────────────────┐
              │ Reconnect at TCP/WS layer │
              │ BUT stale ephemeral key   │
              └──────────────┬───────────┘
                             ↓
            ┌──────────────────────────────────┐
            │ Server rejects: "Transit         │
            │ encryption required: missing..." │
            └──────────┬───────────────────────┘
                       ↓
              ┌─────────────────────┐
              │ SDK gives up        │  ← BEFORE: stuck forever
              │ active = false      │
              └──────┬──────────────┘
                     ↓
            ╔════════════════════════════════════╗
            ║  ChatClientContext recovery fires  ║  ← NEW
            ║  • visibility check                ║
            ║  • cooldown check                  ║
            ║  • disconnectSocket()              ║
            ║  • connectSocket(...)              ║
            ║    → fresh fetchServerKeys         ║
            ║    → fresh performHandshake        ║
            ║    → new ephemeral key pair        ║
            ║    → server accepts                ║
            ╚════════════════════════════════════╝
                            ↓
                    ┌──────────────┐
                    │ ✓ connect    │ ← user sees chat working again
                    │ (no refresh) │   within ~1-2 seconds
                    └──────────────┘
```

---

## Removal — when the SDK ships a native fix

The chat-core SDK should regenerate ephemeral keys on auto-reconnect. When that fix ships:

1. Test that brief network drops + long network drops both recover without the client-side workaround
2. Remove the `recoverFromStuckSocket` helper + all 4 triggers from [ChatClientContext.tsx](../../../src/contexts/ChatClientContext.tsx)
3. Optionally keep the `[chat:socket-trace]` logs as permanent diagnostics, or grep them out:
   ```bash
   grep -rln "chat:socket-trace" src/
   ```
4. Run `npx tsc --noEmit` to confirm nothing else depended on the recovery primitives

Until then, this workaround is **safe to ship and leave running** — it's a no-op when the bug doesn't manifest, and the only code that activates is the SDK-call wrappers (try/catch on functions we'd be calling anyway).

---

## Upstream SDK issue text

For when you file this with the chat-core maintainers:

> **`connectSocket` does not regenerate transit-encryption ephemeral keys on Socket.IO auto-reconnect**
>
> ### Repro
> 1. Connect with `transitEncryption: true`
> 2. Use the chat normally (initial handshake succeeds)
> 3. Trigger a transport-layer disconnect (kill Wi-Fi for 30+ seconds, restore)
> 4. Socket.IO's built-in retry reconnects at the WS layer
> 5. Server rejects the handshake: `"Transit encryption required: missing transitEphemeralPub/transitAlgo in handshake auth"`
> 6. Socket marked as `active === false` — permanently stuck
>
> ### Root cause
> `connectSocket()` calls `performHandshake()` ONCE during initial connect and stores the ephemeral public key in the auth payload. Socket.IO's auto-reconnect reuses the same auth payload, but the server has discarded the matching session on disconnect.
>
> ### Expected
> On reconnect, the SDK should regenerate the ephemeral key pair and re-run the handshake so the server has a fresh session to accept.
>
> ### Current workaround (client-side)
> Detect the specific `connect_error` message → call `disconnectSocket()` + `connectSocket()` to force a fresh handshake cycle.

---

## Related Files

- [src/contexts/ChatClientContext.tsx](../../../src/contexts/ChatClientContext.tsx) — recovery layer + all four triggers + SDK guard try/catches
- [src/configs/chat.ts](../../../src/configs/chat.ts) — `CHAT_TRANSIT_ENCRYPTION` flag (controls whether the SDK runs the handshake at all)
- [src/lib/chat/client.ts](../../../src/lib/chat/client.ts) — `AntzChatClient` factory; passes `transitEncryption: CHAT_TRANSIT_ENCRYPTION`
- [api-integration-status.md](./api-integration-status.md) — issue #9 (transit encryption client/server flag matching)
- [chat-core-starter.md](./chat-core-starter.md) — overall SDK integration playbook
