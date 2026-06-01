'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

import { connectSocket, disconnectSocket, getSocket, refreshSocketAuth } from '@antzsoft/chat-core'

import { useAuth } from 'src/hooks/useAuth'
import { getChatClient, disposeChatClient } from 'src/lib/chat/client'
import authConfig from 'src/configs/auth'
import { CHAT_TRANSIT_ENCRYPTION } from 'src/configs/chat'
import type { AntzChatClient, ChatSocket } from 'src/lib/chat/api'
import { updateChatProfile, syncAvatar } from 'src/lib/chat/api'
import { attachSocketLifecycleLogs } from 'src/lib/chat/socketLogger'

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
  const [client, setClient] = useState<AntzChatClient | null>(null)
  const [socket, setSocket] = useState<ChatSocket | null>(null)
  const [connected, setConnected] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  // Tenant gate — short-circuit to a passthrough when either
  // `ENABLE_CHAT_MODULE` or `ENABLE_CHAT_MODULE_IN_WEB` is off so we don't
  // fetch profile / open a socket / register listeners for tenants that
  // don't have chat enabled on the web client.
  const enableChatModule = Boolean(
    auth?.userData?.settings?.ENABLE_CHAT_MODULE && auth?.userData?.settings?.ENABLE_CHAT_MODULE_IN_WEB
  )

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
      // [chat:socket-trace] Connection established — captures the
      // socket.id + visibility / online state so we can correlate
      // recovery with whether the user is actively looking at the tab.
      try {
        const live = getSocket()
        console.log('[chat:socket-trace] connect ✓', {
          socketId: live?.id,
          visibility: typeof document !== 'undefined' ? document.visibilityState : 'n/a',
          online: typeof navigator !== 'undefined' ? navigator.onLine : 'n/a',
          at: new Date().toISOString()
        })
      } catch {
        /* swallow */
      }
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

      return /transit\s*encryption|transitEphemeralPub|transitAlgo/i.test(msg)
    }
    const recoverFromStuckSocket = (reason: string) => {
      // Only when the tab is actively visible — keeps background tabs
      // quiet, matches user's explicit "fire on visible" requirement.
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        console.log('[chat:socket-trace] recovery skipped — tab not visible', { reason })

        return
      }
      const now = Date.now()
      if (now - lastRecoveryAt < RECOVERY_COOLDOWN_MS) {
        console.log('[chat:socket-trace] recovery skipped — cooldown active', {
          reason,
          msSinceLast: now - lastRecoveryAt
        })

        return
      }
      lastRecoveryAt = now
      console.warn('[chat:socket-trace] recovery → tear down + fresh connectSocket', {
        reason,
        at: new Date().toISOString()
      })
      try {
        // Full teardown. `disconnectSocket()` clears the singleton so
        // the next `connectSocket()` rebuilds with fresh ephemeral keys
        // and a new handshake. The .then/.catch surfaces success/failure
        // under the same trace prefix so we can verify recovery worked.
        disconnectSocket()
        connectSocket(resolvedSocketConfig, getAccessToken)
          .then(() => {
            console.log('[chat:socket-trace] recovery ✓ — fresh handshake succeeded', {
              at: new Date().toISOString()
            })
          })
          .catch(e => {
            console.error('[chat:socket-trace] recovery ✗ — fresh handshake failed', {
              message: (e as Error)?.message,
              at: new Date().toISOString()
            })
          })
      } catch (e) {
        console.error('[chat:socket-trace] recovery threw', e)
      }
    }

    const onConnectError = (err: Error) => {
      setError(err)
      // [chat:socket-trace] Auth or reachability failure. `active`
      // tells us whether Socket.IO is still trying — if false, it has
      // exhausted reconnectionAttempts and given up.
      try {
        const live = getSocket()
        console.warn('[chat:socket-trace] connect_error', {
          message: err?.message,
          stillTrying: !!(live as { active?: boolean } | null)?.active,
          visibility: typeof document !== 'undefined' ? document.visibilityState : 'n/a',
          online: typeof navigator !== 'undefined' ? navigator.onLine : 'n/a',
          at: new Date().toISOString()
        })
      } catch {
        /* swallow */
      }
      // Forward-compat guard: `refreshSocketAuth` is an SDK API. A
      // future major version could remove or rename it. Wrap so a sync
      // throw doesn't crash the connect_error handler — recovery below
      // still runs and is the real fallback.
      try {
        refreshSocketAuth()
      } catch (e) {
        console.warn('[chat:socket-trace] refreshSocketAuth threw', e)
      }
      // Targeted recovery: only the verified transit-encryption-on-
      // reconnect failure triggers a full teardown + fresh handshake.
      // Every other connect_error keeps the existing behavior unchanged.
      if (isTransitHandshakeFailure(err?.message)) {
        // Small delay so refreshSocketAuth() lands first.
        setTimeout(() => recoverFromStuckSocket('connect_error:transit'), 500)
      }
    }
    const onDisconnect = (reason: string) => {
      console.log('[chat:socket] disconnected —', reason)
      // [chat:socket-trace] Captures the disconnect reason + whether
      // Socket.IO will auto-retry. Per the Socket.IO docs, two reasons
      // disable auto-retry entirely:
      //   • 'io server disconnect' — server explicitly disconnected us
      //   • 'io client disconnect' — we (the client) called disconnect()
      // For everything else (transport close/error, ping timeout), the
      // SDK config of reconnectionAttempts:10 will retry; if those 10
      // attempts fail, we see `reconnect_failed` (logged below).
      try {
        const live = getSocket()
        console.warn('[chat:socket-trace] disconnect ✗', {
          reason,
          willAutoReconnect: reason !== 'io server disconnect' && reason !== 'io client disconnect',
          stillTrying: !!(live as { active?: boolean } | null)?.active,
          visibility: typeof document !== 'undefined' ? document.visibilityState : 'n/a',
          online: typeof navigator !== 'undefined' ? navigator.onLine : 'n/a',
          at: new Date().toISOString()
        })
      } catch {
        /* swallow */
      }
      setConnected(false)
    }
    const onReconnect = () => {
      // [chat:socket-trace] Built-in retry succeeded. Without this we
      // can't tell whether the auto-reconnect actually got us back —
      // only that the `connect` event fired (which would fire after a
      // page refresh too).
      try {
        const live = getSocket()
        console.log('[chat:socket-trace] reconnect ✓ (auto)', {
          socketId: live?.id,
          at: new Date().toISOString()
        })
      } catch {
        /* swallow */
      }
      setConnected(true)
    }

    // [chat:socket-trace] Socket.IO manager events — fire on EVERY
    // retry attempt and when the retry loop gives up.
    const onIoReconnectAttempt = (attempt: number) => {
      console.log('[chat:socket-trace] reconnect_attempt', {
        attempt,
        visibility: typeof document !== 'undefined' ? document.visibilityState : 'n/a',
        at: new Date().toISOString()
      })
    }
    const onIoReconnectError = (err: Error) => {
      console.warn('[chat:socket-trace] reconnect_error', {
        message: err?.message,
        at: new Date().toISOString()
      })
    }
    const onIoReconnectFailed = () => {
      console.error('[chat:socket-trace] reconnect_failed — Socket.IO gave up. Triggering manual recovery.', {
        visibility: typeof document !== 'undefined' ? document.visibilityState : 'n/a',
        online: typeof navigator !== 'undefined' ? navigator.onLine : 'n/a',
        at: new Date().toISOString()
      })
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
      console.log('[chat:socket-trace] tab active', {
        source,
        connected: live.connected,
        stillTrying,
        at: new Date().toISOString()
      })
      // Only recover if the SDK has truly given up. Don't interrupt an
      // in-flight retry — let Socket.IO finish its backoff window first.
      if (!stillTrying) {
        recoverFromStuckSocket(`${source}:active`)
      }
    }
    const onVisibilityChange = () => checkSocketOnTabActive('visibility')
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
      console.log('[chat:socket-trace] auth token refreshed in another tab → recover', {
        at: new Date().toISOString()
      })
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
        // [chat:socket-trace] Manager-level events go through `s.io`.
        s.io?.on?.('reconnect_attempt', onIoReconnectAttempt)
        s.io?.on?.('reconnect_error', onIoReconnectError)
        s.io?.on?.('reconnect_failed', onIoReconnectFailed)
      })
      .catch(setError)

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
        console.warn('[chat:socket-trace] disconnectSocket threw on cleanup', e)
      }
      try {
        disposeChatClient()
      } catch (e) {
        console.warn('[chat:socket-trace] disposeChatClient threw on cleanup', e)
      }
      setConnected(false)
      setClient(null)
      setSocket(null)
    }
    // Watch BOTH paths — whichever populates first triggers init.
  }, [enableChatModule, auth?.userData?.user?.user_id, auth?.userData?.user?.id, auth?.user?.id, auth?.user?.email])

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
