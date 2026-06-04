'use client'

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'

import { useDispatch } from 'react-redux'

import { connectSocket, disconnectSocket, getSocket, refreshSocketAuth, getAuthStore } from '@antzsoft/chat-core'

import { useAuth } from 'src/hooks/useAuth'
import { getChatClient, getChatClientOrNull, disposeChatClient } from 'src/lib/chat/client'
import authConfig from 'src/configs/auth'
import { CHAT_TRANSIT_ENCRYPTION } from 'src/configs/chat'
import type { AntzChatClient, ChatSocket } from 'src/lib/chat/api'
import { updateChatProfile, syncAvatar } from 'src/lib/chat/api'
import { attachSocketLifecycleLogs } from 'src/lib/chat/socketLogger'
import { flushPendingOutbox, fetchChatsContacts } from 'src/store/apps/chat'
import type { AppDispatch } from 'src/store'

/**
 * Single-mount React Context for the `@antzsoft/chat-core` SDK lifecycle.
 *
 * Replaces the previous hook-based `useChatClient` pattern. The provider
 * runs the connect / disconnect effect exactly ONCE (at the app root inside
 * `providers.tsx` for App Router, `_app.js` for Pages Router), regardless
 * of how many chat surfaces (`<AppChat>`,
 * `<ChatLauncher>`, notification badges, etc.) consume the result. This
 * guarantees a single socket connection and a single REST client across
 * the whole app, with no risk of duplicate `connectSocket` calls when
 * additional chat surfaces are added later.
 *
 * Reconnection behavior is unchanged from the previous hook implementation:
 * Socket.IO's built-in auto-reconnect handles network drops; `connect_error`
 * triggers `refreshSocketAuth()`; the `connected` flag flips back to true
 * via the SDK's `reconnect` event.
 *
 * Consumers call `useChatClient()` to read `{ client, socket, connected, error }`.
 * Calling `useChatClient()` OUTSIDE a `<ChatClientProvider>` returns a
 * benign default (`connected: false`, everything null) — no throw — so
 * components that may render before / outside the provider don't crash.
 */
interface ChatClientState {
  client: AntzChatClient | null
  socket: ChatSocket | null
  connected: boolean
  error: Error | null
}

const DEFAULT_STATE: ChatClientState = {
  client: null,
  socket: null,
  connected: false,
  error: null
}

const ChatClientContext = createContext<ChatClientState>(DEFAULT_STATE)

interface ChatClientProviderProps {
  children: ReactNode
}

export function ChatClientProvider({ children }: ChatClientProviderProps) {
  const auth = useAuth() as any
  const dispatch = useDispatch<AppDispatch>()
  const [client, setClient] = useState<AntzChatClient | null>(null)
  const [socket, setSocket] = useState<ChatSocket | null>(null)
  const [connected, setConnected] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  // ── Self-heal (Phase #3) ──────────────────────────────────────────────────
  // When the tab is hidden long enough (laptop sleep, system idle, etc.) the
  // chat SDK can end up in a stuck state: the socket reconnect path may have
  // succeeded but the SDK singleton can be null OR the server-side session
  // can be stale. The next chat REST call then explodes with
  // "[chat-api] X: SDK not initialized" (Phase #2 made these gracefully
  // reject instead of crashing; this phase makes them not happen at all).
  //
  // Mechanism — when the tab becomes visible after >5 min hidden AND the
  // SDK client is null, bump `reinitCounter` to re-fire the main init
  // useEffect (which idempotently rebuilds the client + socket). Same-tab
  // token refresh is already handled by the existing `getAccessToken`
  // closure that re-reads localStorage on every connectSocket call.
  //
  // What this DOESN'T fix: long sleeps where the access token itself has
  // expired. AuthContext doesn't auto-refresh; only app init + explicit
  // login refresh it. If the token is expired, the re-init will fail with
  // a 401/403 and `error` will surface — the existing global axios
  // interceptor will dispatch `session-expired` → logout flow takes over.
  // That's the safe fallback; no chat-specific 401 handler needed.
  const lastHiddenAtRef = useRef<number | null>(null)
  const reinitInFlightRef = useRef(false)
  const reinitAttemptsRef = useRef(0)
  const reinitBackoffTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [reinitCounter, setReinitCounter] = useState(0)
  /** Cooldown tracker for the receipt-sync-on-focus workaround. */
  const lastReceiptSyncAtRef = useRef<number | null>(null)
  /**
   * Pending retry timeout for the receipt-sync fetch. Used when the first
   * attempt fails with a network/5xx error — common right after a system
   * wake when the backend isn't fully warmed up yet. Cleared on unmount.
   */
  const receiptSyncRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /** Long-sleep threshold: shorter returns are noise; longer matches real sleep / laptop-close. */
  const LONG_SLEEP_THRESHOLD_MS = 5 * 60 * 1000
  /** Backoff schedule for failed re-init attempts (silent retry). */
  const REINIT_BACKOFF_MS = [5_000, 10_000, 20_000]
  const MAX_REINIT_ATTEMPTS = REINIT_BACKOFF_MS.length
  /**
   * Receipt-sync workaround thresholds. The backend doesn't reliably emit
   * read_receipt / message_delivered / conversation_updated socket events
   * to the sender when the recipient reads a DM, so when the user returns
   * focus to the chat tab we silently re-fetch the conversation list to
   * pull in missed feedback. Threshold filters out quick alt-tabs; cooldown
   * prevents spam during rapid focus changes.
   * REMOVE ONCE BACKEND emits those events reliably.
   */
  const RECEIPT_SYNC_THRESHOLD_MS = 5_000
  const RECEIPT_SYNC_COOLDOWN_MS = 30_000
  /** Retry delay for a failed receipt-sync fetch (system-wake → backend not warm yet). */
  const RECEIPT_SYNC_RETRY_DELAY_MS = 3_000
  /**
   * Delay before the INITIAL receipt-sync fetch fires after a focus return.
   * Gives the transit ECDH session time to (re)establish post-reconnect
   * BEFORE we hit chat REST endpoints — backend's `@PreTransit()` coverage
   * is incomplete (only `/users/me`, `/users/me/devices`, and
   * `/storage/files/upload` are marked as of SDK 1.2.5), so REST calls
   * fired during the transit-setup window return `403 Transit session
   * required` on every other endpoint. A short upfront wait dodges that
   * race in practice.
   * REMOVE ONCE BACKEND extends @PreTransit() to all chat REST endpoints.
   */
  const RECEIPT_SYNC_INITIAL_DELAY_MS = 2_000

  // Tenant gate — short-circuit to a passthrough when either
  // `ENABLE_CHAT_MODULE` or `ENABLE_CHAT_MODULE_IN_WEB` is off so we don't
  // fetch profile / open a socket / register listeners for tenants that
  // don't have chat enabled on the web client.
  const enableChatModule = Boolean(
    auth?.userData?.settings?.ENABLE_CHAT_MODULE && auth?.userData?.settings?.ENABLE_CHAT_MODULE_IN_WEB
  )

  // ── Account-deactivation auto-logout (SDK Step 6b, external-auth path) ──────
  // When the current user is deactivated server-side, the chat server revokes
  // tokens and the SDK's axios interceptor clears them → its auth store flips
  // `isAuthenticated` to false. The app's own 401 interceptor already covers
  // the common case (any main-app API call triggers `session-expired`), but a
  // user sitting IDLE on a chat surface (no main-app calls) would otherwise
  // never be logged out. This bridges that gap by reusing the SAME
  // `session-expired` event the app already handles — NOT a new logout path.
  //
  // Safety guards against spurious full-app logout on transient flips:
  //   • Only fire on a real true→false TRANSITION (must have observed `true`
  //     at least once first — ignores the initial/hydration false).
  //   • Skip on the login page.
  //   • `session-expired` is itself idempotent (AuthContext guards re-entry).
  const sawAuthenticatedRef = useRef(false)
  useEffect(() => {
    if (!enableChatModule) return
    if (typeof window === 'undefined') return

    let store: ReturnType<typeof getAuthStore> | null = null
    try {
      store = getAuthStore()
    } catch (e) {
      // Forward-compat: if the SDK ever changes/removes getAuthStore, the
      // app's own 401 interceptor remains the fallback — no crash here.
      console.warn('[chat:auth] getAuthStore unavailable — skipping deactivation bridge', e)

      return
    }

    const evaluate = (isAuthenticated: boolean) => {
      if (isAuthenticated) {
        sawAuthenticatedRef.current = true

        return
      }
      // false: only act if we had previously seen an authenticated session
      // (true→false transition), and we're not already on the login page.
      if (!sawAuthenticatedRef.current) return
      const path = window.location.pathname
      if (path === '/login' || path === '/login/') return
      sawAuthenticatedRef.current = false
      console.warn('[chat:auth] chat session invalidated (likely deactivation) — triggering session-expired')
      window.dispatchEvent(new Event('session-expired'))
    }

    // Seed from the current value, then subscribe to future changes.
    evaluate(store.useAuthStore.getState().isAuthenticated)
    const unsubscribe = store.useAuthStore.subscribe(state => evaluate(state.isAuthenticated))

    return () => unsubscribe()
  }, [enableChatModule])

  // Self-heal listener — separate from the existing socket-recovery
  // visibility handler (which only triggers when the SOCKET is stuck).
  // This one fires when the tab returns after a long hidden interval
  // AND the SDK CLIENT itself is null (e.g., disposed during a prior
  // cleanup and never re-initialized because nothing forced the main
  // useEffect to re-run).
  //
  // Bump `reinitCounter` to trigger the main init effect again — its dep
  // list includes `reinitCounter`, so a bump runs cleanup (no-op when
  // client is already null) then runs init (rebuilds client + socket).
  useEffect(() => {
    if (!enableChatModule) return
    if (typeof document === 'undefined') return

    const onSelfHealVisibility = () => {
      const visible = document.visibilityState === 'visible'
      if (!visible) {
        lastHiddenAtRef.current = Date.now()

        return
      }
      const hiddenAt = lastHiddenAtRef.current
      lastHiddenAtRef.current = null
      if (hiddenAt == null) return
      const hiddenDuration = Date.now() - hiddenAt

      // SHORT-sleep return (>RECEIPT_SYNC_THRESHOLD_MS): backend doesn't
      // always emit read_receipt / message_delivered / conversation_updated
      // socket events to the sender when the recipient reads a DM (verified
      // missing in test). The backend DOES record the read state — visible
      // because a page refresh shows the correct tick. Workaround: when
      // the user returns attention to the tab after being away >5s, silently
      // refresh the conversation list so the sidebar picks up any missed
      // receipts/feedback without a page reload.
      //
      // Cooldown via `lastReceiptSyncAtRef` prevents spam if the user is
      // rapidly switching tabs. Independent from the long-sleep SDK re-init
      // path below — receipt sync fires for short returns, re-init fires
      // for long returns + dead SDK.
      //
      // REMOVE ONCE BACKEND emits read_receipt / message_delivered /
      // conversation_updated reliably for DM reads.
      if (hiddenDuration >= RECEIPT_SYNC_THRESHOLD_MS && getChatClientOrNull()) {
        const now = Date.now()
        const sinceLastSync = now - (lastReceiptSyncAtRef.current ?? 0)
        if (sinceLastSync >= RECEIPT_SYNC_COOLDOWN_MS) {
          lastReceiptSyncAtRef.current = now
          // Defer the initial fetch so the transit ECDH session has time
          // to (re)establish after socket reconnect. See the constant's
          // docstring for the @PreTransit() backend gap this works around.
          if (receiptSyncRetryTimeoutRef.current) {
            clearTimeout(receiptSyncRetryTimeoutRef.current)
          }
          receiptSyncRetryTimeoutRef.current = setTimeout(() => {
            receiptSyncRetryTimeoutRef.current = null
            // Guard: the user might have closed the tab during the 2s window.
            if (!getChatClientOrNull()) return
            dispatch(fetchChatsContacts())
              .unwrap()
              .catch(e => {
                // Initial (delayed) attempt failed — most often a transient
                // backend hiccup after system-wake (502 / Network Error
                // when the chat service is still warming up, OR the
                // transit-setup race the 2s delay didn't fully dodge).
                // Retry once after a short delay; if that also fails, log
                // + move on (next focus return after cooldown will try
                // again).
                console.warn('[chat:receipt-sync] refresh failed, retrying in 3s', e)
                if (receiptSyncRetryTimeoutRef.current) {
                  clearTimeout(receiptSyncRetryTimeoutRef.current)
                }
                receiptSyncRetryTimeoutRef.current = setTimeout(() => {
                  receiptSyncRetryTimeoutRef.current = null
                  if (!getChatClientOrNull()) return
                  dispatch(fetchChatsContacts())
                    .unwrap()
                    .catch(e2 => console.warn('[chat:receipt-sync] retry also failed (non-fatal)', e2))
                }, RECEIPT_SYNC_RETRY_DELAY_MS)
              })
          }, RECEIPT_SYNC_INITIAL_DELAY_MS)
        }
      }

      if (hiddenDuration < LONG_SLEEP_THRESHOLD_MS) return
      // Long-sleep return. Healthy SDK → no-op (receipt sync above already
      // covered the missed-event case).
      if (getChatClientOrNull()) return
      // SDK is dead → force a re-init cycle.
      if (reinitInFlightRef.current) return
      console.warn('[chat:selfheal] long-sleep return + SDK dead → bumping reinitCounter', {
        hiddenSec: Math.round(hiddenDuration / 1000)
      })
      reinitInFlightRef.current = true
      reinitAttemptsRef.current = 0
      setReinitCounter(c => c + 1)
    }

    document.addEventListener('visibilitychange', onSelfHealVisibility)

    return () => {
      document.removeEventListener('visibilitychange', onSelfHealVisibility)
      if (reinitBackoffTimeoutRef.current) {
        clearTimeout(reinitBackoffTimeoutRef.current)
        reinitBackoffTimeoutRef.current = null
      }
      if (receiptSyncRetryTimeoutRef.current) {
        clearTimeout(receiptSyncRetryTimeoutRef.current)
        receiptSyncRetryTimeoutRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableChatModule])

  useEffect(() => {
    if (!enableChatModule) return
    // Accept either `auth.userData.user` (full backend resData) or `auth.user`
    // (the slim user object that `(module)/layout.tsx` already waits for).
    // The WSO2 hydrate path sometimes lands `auth.user` before / without
    // populating a nested `auth.userData.user` — fall back so we don't get
    // stuck on the gate.
    const sourceUser = auth?.userData?.user ?? auth?.user
    if (!sourceUser) {
      console.log('[chat:gate] no auth user yet — waiting')

      return
    }
    if (!process.env.NEXT_PUBLIC_CHAT_API_URL) {
      console.warn('[chat:gate] NEXT_PUBLIC_CHAT_API_URL not set')

      return
    }

    const userIdRaw = sourceUser.user_id ?? sourceUser.id ?? sourceUser.email
    const userId = userIdRaw !== undefined && userIdRaw !== null ? String(userIdRaw) : null
    const tenantId =
      sourceUser.zoos?.[0]?.zoo_id?.toString() ??
      auth?.userData?.user?.zoos?.[0]?.zoo_id?.toString() ??
      auth?.userData?.zoos?.[0]?.zoo_id?.toString()
    const avatarUrl =
      sourceUser.profile_pic ??
      sourceUser.user_profile_pic ??
      sourceUser.profile_image ??
      sourceUser.avatar ??
      sourceUser.avatar_url ??
      undefined

    if (!userId) {
      console.warn('[chat:gate] no userId derivable from auth', sourceUser)

      return
    }
    console.log('[chat:gate] initializing with', { userId, tenantId, hasAvatar: Boolean(avatarUrl) })

    const getAccessToken = (): string =>
      typeof window !== 'undefined' ? localStorage.getItem(authConfig.storageTokenKeyName) ?? '' : ''
    const accessToken = getAccessToken()

    // Final safety gate — refuse to connect without a valid access token in
    // localStorage. `handleLogout` removes the token before disposing the
    // chat client; this gate makes sure stale auth state can't trigger a
    // reconnect on the login page (legacy path doesn't clear React user
    // state, so this is belt-and-suspenders).
    if (!accessToken) {
      console.log('[chat:gate] no access token — refusing to connect')

      return
    }

    let c: AntzChatClient
    try {
      c = getChatClient({
        accessToken,
        userId,
        tenantId,
        avatar: { url: avatarUrl }
      })
    } catch (e) {
      setError(e as Error)

      return
    }
    setClient(c)

    // Push the logged-in user's name to the chat server once per session.
    // The name isn't editable inside this app — it arrives in the login
    // auth response (`user_first_name` / `user_last_name`) and can change
    // externally. Without this, the chat server only refreshes the name via
    // its ~2-hour background sync, so other participants would see a stale
    // name. REST-only (the SDK has no socket path for profile updates).
    //
    // Fully isolated from the socket connect below: wrapped in try/catch
    // (guards against a synchronous throw from `requireClient`, which the
    // promise `.catch` alone wouldn't trap) AND the promise has its own
    // `.catch`. Either way a profile-push failure can NEVER prevent the
    // socket from connecting. Guarded on a real name so we don't overwrite
    // the server's copy with empty strings.
    try {
      const profileFirstName = sourceUser.user_first_name ?? sourceUser.fullName
      const profileLastName = sourceUser.user_last_name ?? sourceUser.lastName
      const profileDisplayName = [profileFirstName, profileLastName].filter(Boolean).join(' ').trim()
      if (profileDisplayName) {
        updateChatProfile({
          ...(profileFirstName ? { firstName: String(profileFirstName) } : {}),
          ...(profileLastName ? { lastName: String(profileLastName) } : {}),
          displayName: profileDisplayName
        }).catch(err => {
          console.warn('[chat] updateChatProfile failed — name will sync on the server cycle:', err)
        })
      }

      // Push the avatar too. The client init + socket handshake already
      // carry `avatar.url` (server dedups by hash), but this explicit REST
      // sync is the deterministic path that guarantees a CHANGED avatar
      // propagates this session instead of waiting for the server cycle.
      // Same isolation as the name push — fire-and-forget, never blocks.
      if (avatarUrl) {
        syncAvatar({ url: avatarUrl }).catch(err => {
          console.warn('[chat] syncAvatar failed — avatar will sync on the server cycle:', err)
        })
      }
    } catch (profileErr) {
      console.warn('[chat] profile/avatar push threw synchronously — skipped:', profileErr)
    }

    const apiUrl = process.env.NEXT_PUBLIC_CHAT_API_URL ?? ''
    const socketBase = apiUrl.replace(/\/api\/v\d+\/?$/, '').replace(/\/$/, '')
    let socketOrigin = socketBase
    let socketPath = '/socket.io'
    try {
      const parsed = new URL(socketBase)
      socketOrigin = parsed.origin
      const pathname = parsed.pathname.replace(/\/$/, '')
      if (pathname && pathname !== '/') socketPath = `${pathname}/socket.io`
    } catch {
      /* surfaced by connectSocket */
    }

    const resolvedSocketConfig = {
      apiUrl,
      socketOrigin,
      socketPath,
      userId,
      tenantId,
      avatar: { url: avatarUrl },
      // Single source of truth: src/configs/chat.ts (same constant used by
      // the REST client in lib/chat/client.ts — keeps the two surfaces in
      // sync, MUST match the server's TRANSIT_ENCRYPTION_ENABLED).
      transitEncryption: CHAT_TRANSIT_ENCRYPTION
    } as Parameters<typeof connectSocket>[0]

    // SDK's `connectSocket` is async — it does `fetchServerKeys` BEFORE
    // creating the socket (`_socket = io(...)` runs at the end of the
    // async function in the SDK). Calling `getSocket()` synchronously on
    // the next line throws `"Socket not initialized. Call connectSocket
    // first."` because the socket truly isn't there yet. Attach listeners
    // only after the connect Promise resolves. `cancelled` + nullable
    // refs let the cleanup function detach safely even if the effect
    // re-runs before the connect resolves.

    const onConnect = () => {
      setConnected(true)
      setError(null)
    }
    // ── Stuck-socket recovery (transit-encryption-on-reconnect) ──────────
    // Verified failure pattern from runtime trace 2026-06-01:
    //   1. transport close → built-in retry succeeds at WS layer
    //   2. server immediately rejects handshake with
    //      "Transit encryption required: missing transitEphemeralPub /
    //      transitAlgo in handshake auth"
    //   3. Socket.IO sees this as a fatal connect_error and gives up
    //      (`active === false`) → socket stays dead until page refresh.
    //
    // Root cause: SDK's auto-reconnect reuses the original handshake
    // auth payload, but transit-encryption ephemeral keys are short-
    // lived / session-scoped server-side. On reconnect the server expects
    // fresh keys but receives stale/missing ones.
    //
    // Workaround: when we see this specific error AND the user is
    // actively looking at the tab, tear down the socket and call
    // `connectSocket()` again — that runs a fresh `fetchServerKeys()`
    // + `performHandshake()` pair, producing new ephemeral keys the
    // server will accept. Visibility-gated so we don't burn CPU on
    // background tabs. 10-second cooldown prevents tight loops if the
    // recovery itself fails repeatedly.
    let lastRecoveryAt = 0
    const RECOVERY_COOLDOWN_MS = 10000
    const isTransitHandshakeFailure = (msg: string | undefined): boolean => {
      if (!msg) return false

      // Catches all known server-side transit-related handshake rejections
      // that indicate the ephemeral session is stale and a tear-down +
      // fresh connectSocket is required. Variants seen in the wild:
      //   • "Transit encryption required: missing transitEphemeralPub/transitAlgo in handshake auth"
      //   • "Transit session not found or expired — reconnect to create a new session"
      // Add new variants here as the backend introduces them — the
      // recovery action is the same for all.
      return /transit\s*encryption|transitEphemeralPub|transitAlgo|transit\s+session/i.test(msg)
    }
    const recoverFromStuckSocket = (reason: string) => {
      // Only when the tab is actively visible — keeps background tabs
      // quiet, matches user's explicit "fire on visible" requirement.
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      const now = Date.now()
      if (now - lastRecoveryAt < RECOVERY_COOLDOWN_MS) return
      lastRecoveryAt = now
      console.warn('[chat:socket] recovery → tear down + fresh connectSocket', { reason })
      try {
        // Full teardown. `disconnectSocket()` clears the singleton so
        // the next `connectSocket()` rebuilds with fresh ephemeral keys
        // and a new handshake. The .then/.catch surfaces success/failure
        // under the same trace prefix so we can verify recovery worked.
        disconnectSocket()
        connectSocket(resolvedSocketConfig, getAccessToken)
          .then(() => {
            // Replay any sends queued by `sendMsg.rejected` while the
            // socket was dead. `flushPendingOutbox` is a no-op when the
            // outbox is empty, so it's safe to fire after every recovery
            // without a pre-check.
            dispatch(flushPendingOutbox())
              .unwrap()
              .catch(e => {
                console.warn('[chat:outbox] flush after recovery failed', e)
              })
          })
          .catch(e => {
            console.error('[chat:socket] recovery failed', (e as Error)?.message)
          })
      } catch (e) {
        console.error('[chat:socket] recovery threw', e)
      }
    }

    const onConnectError = (err: Error) => {
      setError(err)
      // Forward-compat guard: `refreshSocketAuth` is an SDK API. A
      // future major version could remove or rename it. Wrap so a sync
      // throw doesn't crash the connect_error handler — recovery below
      // still runs and is the real fallback.
      try {
        refreshSocketAuth()
      } catch (e) {
        console.warn('[chat:socket] refreshSocketAuth threw', e)
      }
      // Targeted recovery: only the verified transit-encryption-on-
      // reconnect failure triggers a full teardown + fresh handshake.
      // Every other connect_error keeps the existing behavior unchanged.
      if (isTransitHandshakeFailure(err?.message)) {
        // Small delay so refreshSocketAuth() lands first.
        setTimeout(() => recoverFromStuckSocket('connect_error:transit'), 500)
      }
    }
    const onDisconnect = (_reason: string) => {
      setConnected(false)
    }
    const onReconnect = () => {
      setConnected(true)
      // Belt-and-suspenders: drain the pendingOutbox even when the
      // socket recovered WITHOUT going through our `recoverFromStuckSocket`
      // path (i.e., Socket.IO auto-reconnected cleanly and the handshake
      // succeeded without the transit-encryption bug). The recovery path
      // already calls `flushPendingOutbox` directly in its .then() — this
      // is the fallback for the clean-reconnect case so queued sends
      // don't get stuck waiting for a bug-triggered recovery.
      //
      // Timing note: `reconnect ✓ (auto)` fires the instant the TCP/WS
      // hand is back; the server's handshake-level transit-encryption
      // check (which sometimes rejects with stillTrying:false) arrives a
      // beat later as a `connect_error`. If we flush before that error
      // lands, the flush's first `sendMessageOverSocket` will throw and
      // re-queue itself via `sendMsg.rejected` — the loop stops on first
      // failure, and the subsequent `recoverFromStuckSocket` will flush
      // again successfully. So firing here is safe even when the
      // handshake is about to fail; worst case is a harmless extra log.
      //
      // Idempotent: empty outbox → no-op.
      dispatch(flushPendingOutbox())
        .unwrap()
        .then(result => {
          if (result.total > 0) {
            console.log('[chat:outbox] flush after auto-reconnect —', result.succeeded, 'of', result.total)
          }
        })
        .catch(e => {
          console.warn('[chat:outbox] flush after auto-reconnect failed', e)
        })
    }

    // Socket.IO manager events — no-op handlers kept for API parity with
    // the on()/off() lifecycle (would have logged each retry / error
    // during diagnostic phase; trimmed now to keep production console
    // clean — reconnect_failed below is the only one that survives
    // because it ALSO triggers our recoverFromStuckSocket fallback).
    const onIoReconnectAttempt = (_attempt: number) => {
      /* no-op */
    }
    const onIoReconnectError = (_err: Error) => {
      /* no-op */
    }
    const onIoReconnectFailed = () => {
      console.error('[chat:socket] reconnect_failed — Socket.IO gave up. Triggering manual recovery.')
      // Belt-and-suspenders — if all 10 built-in attempts fail for ANY
      // reason (not just transit-encryption), try one fresh handshake
      // when the tab is visible. Same cooldown-guarded path.
      recoverFromStuckSocket('reconnect_failed')
    }

    // Shared "tab is now active, check the socket" handler. Fires for
    // both `visibilitychange` (tab swap inside the same window) and
    // `window.focus` (alt-tab to a different app on Mac/Linux, returning
    // from devtools, returning from another browser window). Covers the
    // edge cases where one event fires but the other doesn't.
    const checkSocketOnTabActive = (source: 'visibility' | 'focus') => {
      // Only when truly visible. `focus` can fire while document is
      // hidden in odd browser states (e.g. opening devtools as a popup).
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      // Forward-compat guard: `getSocket()` throws synchronously per the
      // SDK ("Socket not initialized. Call connectSocket first.") in
      // some lifecycle states. A future SDK version could also rename
      // `.active` or change the singleton API. Treat any sync throw as
      // "no live socket to inspect" and fall through silently.
      let live: ChatSocket | null = null
      try {
        live = getSocket()
      } catch {
        return
      }
      if (!live) return
      if (live.connected) return
      const stillTrying = !!(live as { active?: boolean }).active
      // Only recover if the SDK has truly given up. Don't interrupt an
      // in-flight retry — let Socket.IO finish its backoff window first.
      if (!stillTrying) {
        recoverFromStuckSocket(`${source}:active`)
      }
    }
    // Connection lifecycle on tab visibility — the SDK's recommended pattern:
    // DISCONNECT when the tab goes hidden, and on RETURN re-auth + reconnect.
    // The reconnect re-runs the full transit handshake (/crypto/pubkey +
    // /crypto/session) so REST + socket both get a FRESH session — which is
    // what prevents the post-gap "Transit encryption required" 403 on 1.2.6
    // (it never refreshes the REST session on its own). We have no external
    // token-refresh, so `getAccessToken` (re-reads localStorage on connect)
    // supplies the latest token.
    const onVisibilityChange = () => {
      if (typeof document === 'undefined') return
      if (document.visibilityState === 'hidden') {
        try {
          disconnectSocket()
        } catch (e) {
          console.warn('[chat:socket] disconnect on hidden threw', e)
        }
        setConnected(false)

        return
      }
      // Tab visible again → fresh auth + reconnect (fresh handshake).
      try {
        refreshSocketAuth()
      } catch (e) {
        console.warn('[chat:socket] refreshSocketAuth on visible threw', e)
      }
      connectSocket(resolvedSocketConfig, getAccessToken)
        .then(() => setConnected(true))
        .catch(e => console.warn('[chat:socket] reconnect on visible failed', (e as Error)?.message))
    }
    // Kept as a lightweight complement for the alt-tab-to-another-app case
    // (window focus without a visibilitychange) — only acts if the socket is
    // actually down, so it won't double-reconnect after onVisibilityChange.
    const onWindowFocus = () => checkSocketOnTabActive('focus')

    // Cross-tab token refresh. The `storage` event fires in OTHER tabs
    // when localStorage changes — so if a different tab refreshes the
    // auth token, this tab notices and rebuilds the socket so future
    // emits use the new token. Same-tab token refresh is handled
    // automatically because `getAccessToken` re-reads localStorage every
    // time `connectSocket` is called (recovery path included).
    const onStorageChange = (evt: StorageEvent) => {
      if (evt.key !== authConfig.storageTokenKeyName) return
      // Empty newValue means logout — let the auth flow handle teardown.
      if (!evt.newValue) return
      recoverFromStuckSocket('token-refresh')
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', onWindowFocus)
    window.addEventListener('storage', onStorageChange)

    let s: ChatSocket | null = null
    let detachLifecycleLogs: (() => void) | null = null
    let cancelled = false

    connectSocket(resolvedSocketConfig, getAccessToken)
      .then(() => {
        if (cancelled) return
        s = getSocket()
        setSocket(s)
        detachLifecycleLogs = attachSocketLifecycleLogs(s)

        s.on('connect', onConnect)
        s.on('connect_error', onConnectError)
        s.on('disconnect', onDisconnect)
        s.io?.on?.('reconnect', onReconnect)
        // [chat:socket] Manager-level events go through `s.io`.
        s.io?.on?.('reconnect_attempt', onIoReconnectAttempt)
        s.io?.on?.('reconnect_error', onIoReconnectError)
        s.io?.on?.('reconnect_failed', onIoReconnectFailed)

        // Self-heal: if this init was triggered by a reinitCounter bump
        // (long-sleep return + dead SDK), reset the in-flight flag + the
        // attempts counter so future bumps are accepted, then replay the
        // conversation list so the sidebar reflects any messages that
        // arrived while the SDK was down. The first init of the session
        // also lands here harmlessly — counter is already 0 and the flag
        // was already false, so we skip the replay then (the initial
        // mount fetch is owned by ChatLauncher / AppChat, not this).
        if (reinitInFlightRef.current) {
          console.log('[chat:selfheal] re-init ✓ — SDK + socket restored', {
            attempts: reinitAttemptsRef.current + 1
          })
          // Replay: refresh conversation list. Sidebar will reflect any
          // chats that received messages during the dead-SDK window.
          // Active-chat data (messages, presence, lastSeen) refreshes
          // lazily via per-component useEffects on next interaction —
          // anything urgent will also push via socket since the new
          // connectSocket above already wired the event listeners.
          dispatch(fetchChatsContacts())
            .unwrap()
            .catch(e => {
              console.warn('[chat:selfheal] replay failed (non-fatal)', e)
            })
        }
        reinitInFlightRef.current = false
        reinitAttemptsRef.current = 0
        if (reinitBackoffTimeoutRef.current) {
          clearTimeout(reinitBackoffTimeoutRef.current)
          reinitBackoffTimeoutRef.current = null
        }
      })
      .catch(err => {
        setError(err)
        if (cancelled) return
        // Self-heal failure path — only triggers backoff when this init
        // was driven by a self-heal bump (not the first init of the
        // session, where a failure should surface to the user via the
        // existing `error` state without a silent retry loop).
        if (!reinitInFlightRef.current) return
        const attempt = reinitAttemptsRef.current
        if (attempt >= MAX_REINIT_ATTEMPTS) {
          console.error('[chat:selfheal] re-init failed after max attempts — giving up', {
            attempts: attempt,
            message: (err as Error)?.message
          })
          reinitInFlightRef.current = false

          return
        }
        const backoffMs = REINIT_BACKOFF_MS[attempt]
        reinitAttemptsRef.current = attempt + 1
        console.warn('[chat:selfheal] re-init failed — backoff before retry', {
          attempt: attempt + 1,
          backoffMs,
          message: (err as Error)?.message
        })
        if (reinitBackoffTimeoutRef.current) clearTimeout(reinitBackoffTimeoutRef.current)
        reinitBackoffTimeoutRef.current = setTimeout(() => {
          reinitBackoffTimeoutRef.current = null
          // Bump again to retry. `reinitInFlightRef` stays true so
          // concurrent visibility events don't fire a parallel cycle.
          setReinitCounter(c => c + 1)
        }, backoffMs)
      })

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', onWindowFocus)
      window.removeEventListener('storage', onStorageChange)
      if (s) {
        s.off('connect', onConnect)
        s.off('connect_error', onConnectError)
        s.off('disconnect', onDisconnect)
        s.io?.off?.('reconnect', onReconnect)
        s.io?.off?.('reconnect_attempt', onIoReconnectAttempt)
        s.io?.off?.('reconnect_error', onIoReconnectError)
        s.io?.off?.('reconnect_failed', onIoReconnectFailed)
      }
      detachLifecycleLogs?.()
      // Forward-compat guards on the teardown SDK calls. If a future
      // SDK version removes / renames these, the cleanup still runs to
      // completion and we still reset the local React state — so a
      // half-broken SDK update can't strand a stale client/socket ref.
      try {
        disconnectSocket()
      } catch (e) {
        console.warn('[chat:socket] disconnectSocket threw on cleanup', e)
      }
      try {
        disposeChatClient()
      } catch (e) {
        console.warn('[chat:socket] disposeChatClient threw on cleanup', e)
      }
      setConnected(false)
      setClient(null)
      setSocket(null)
    }
    // Watch BOTH paths — whichever populates first triggers init.
    // `reinitCounter` is bumped by the self-heal visibility listener
    // above when the tab returns from long sleep with a dead SDK. Adding
    // it to the dep list makes the bump re-run this whole init effect
    // (cleanup → fresh init). Other deps remain the canonical triggers
    // (enable flag + auth identity).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableChatModule, auth?.userData?.user?.user_id, auth?.userData?.user?.id, auth?.user?.id, auth?.user?.email, reinitCounter])

  return (
    <ChatClientContext.Provider value={{ client, socket, connected, error }}>{children}</ChatClientContext.Provider>
  )
}

/**
 * Read the chat client state from the nearest `<ChatClientProvider>`.
 * Returns the default benign state when called outside a provider — no
 * throw, so components that may render before / outside the provider
 * (e.g., during tenant chat-module-disabled passthrough) don't crash.
 */
export function useChatClient(): ChatClientState {
  return useContext(ChatClientContext)
}
