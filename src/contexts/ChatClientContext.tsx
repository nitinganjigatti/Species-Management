'use client'

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'

import { useDispatch } from 'react-redux'

import { connectSocket, disconnectSocket, getSocket, refreshSocketAuth, getAuthStore } from '@antzsoft/chat-core'

import { useAuth } from 'src/hooks/useAuth'
import { getChatClient, disposeChatClient } from 'src/lib/chat/client'
import authConfig from 'src/configs/auth'
import { CHAT_TRANSIT_ENCRYPTION } from 'src/configs/chat'
import type { AntzChatClient, ChatSocket } from 'src/lib/chat/api'
import { updateChatProfile, syncAvatar } from 'src/lib/chat/api'
import { attachSocketLifecycleLogs } from 'src/lib/chat/socketLogger'
import { flushPendingOutbox } from 'src/store/apps/chat'
import type { AppDispatch } from 'src/store'

/**
 * Single-mount React Context for the `@antzsoft/chat-core` SDK lifecycle.
 *
 * The provider runs the connect / disconnect effect exactly ONCE (at the app
 * root inside `providers.tsx` for App Router, `_app.js` for Pages Router),
 * regardless of how many chat surfaces (`<AppChat>`, `<ChatLauncher>`, badges)
 * consume the result. This guarantees a single socket connection and a single
 * REST client across the whole app.
 *
 * Connection lifecycle follows the @antzsoft/chat-core integration guide:
 *   • Token is supplied via `authProvider` (configured in lib/chat/client.ts),
 *     read fresh on every connect/reconnect.
 *   • Tab HIDDEN  → `disconnectSocket()`.
 *   • Tab VISIBLE → `refreshSocketAuth()` then `connectSocket()` — the reconnect
 *     re-runs the transit handshake (/crypto/pubkey + /crypto/session), so REST
 *     + socket get a fresh session.
 *   • Network drops in between are handled by Socket.IO's built-in auto-reconnect.
 *
 * Consumers call `useChatClient()` to read `{ client, socket, connected, error }`.
 * Calling it OUTSIDE a `<ChatClientProvider>` returns a benign default
 * (`connected: false`, everything null) — no throw.
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

  // Tenant gate — short-circuit to a passthrough when either
  // `ENABLE_CHAT_MODULE` or `ENABLE_CHAT_MODULE_IN_WEB` is off so we don't
  // fetch profile / open a socket / register listeners for tenants that
  // don't have chat enabled on the web client.
  const enableChatModule = Boolean(
    auth?.userData?.settings?.ENABLE_CHAT_MODULE && auth?.userData?.settings?.ENABLE_CHAT_MODULE_IN_WEB
  )

  // ── Account-deactivation auto-logout (external-auth path) ──────────────────
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
    // reconnect on the login page.
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
    // The name isn't editable inside this app — it arrives in the login auth
    // response (`user_first_name` / `user_last_name`) and can change
    // externally. Without this, the chat server only refreshes the name via
    // its ~2-hour background sync, so other participants would see a stale
    // name. REST-only (the SDK has no socket path for profile updates).
    // Fully isolated: wrapped in try/catch AND the promise has its own
    // `.catch`, so a profile-push failure can NEVER block the socket connect.
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

      // Push the avatar too. The client init + socket handshake already carry
      // `avatar.url` (server dedups by hash), but this explicit REST sync is
      // the deterministic path that guarantees a CHANGED avatar propagates
      // this session. Same isolation — fire-and-forget, never blocks.
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
      // Single source of truth: src/configs/chat.ts (same constant used by the
      // REST client in lib/chat/client.ts — MUST match the server's
      // TRANSIT_ENCRYPTION_ENABLED).
      transitEncryption: CHAT_TRANSIT_ENCRYPTION
    } as Parameters<typeof connectSocket>[0]

    // Declared before the listener helpers so `reconnectFresh` can rebind them
    // onto a freshly-built socket. `cancelled` blocks the `.then()` bodies if
    // cleanup ran first (Strict Mode / fast effect re-run).
    let s: ChatSocket | null = null
    let detachLifecycleLogs: (() => void) | null = null
    let cancelled = false

    // ── 429 (throttle) retry ───────────────────────────────────────────────
    // The transit handshake (`POST /crypto/session`) is rate-limited
    // server-side. Because the connection lifecycle re-runs the handshake on
    // every tab switch, rapid switching can trip the throttler →
    // `ThrottlerException 429`, which rejects the connect Promise. Nothing else
    // recovers this: Socket.IO's built-in retry can't help (the failure is in
    // the REST handshake, before the websocket connects). So ON A 429 ONLY,
    // retry the fresh connect after 60s. If that attempt 429s again the same
    // path re-arms — up to MAX_THROTTLE_RETRIES times — then GIVES UP (a later
    // tab-focus / network change starts a fresh attempt with a fresh budget).
    // Non-429 failures keep their existing handling untouched.
    const MAX_THROTTLE_RETRIES = 4
    let throttleRetryTimer: ReturnType<typeof setTimeout> | null = null
    let throttleRetryCount = 0
    const isThrottled = (e: unknown): boolean => {
      const err = e as { status?: number; statusCode?: number; response?: { status?: number }; message?: string }
      const status = err?.status ?? err?.statusCode ?? err?.response?.status
      if (status === 429) return true

      return /\b429\b|too many requests|throttler/i.test(err?.message ?? '')
    }
    // Takes the retry callback as a param so it never references `reconnectFresh`
    // directly (avoids a circular declaration). Single timer — no stacking.
    const armThrottleRetry = (reason: string, retry: () => void) => {
      if (throttleRetryTimer) return
      if (throttleRetryCount >= MAX_THROTTLE_RETRIES) {
        console.warn(
          `[chat:socket] transit handshake still throttled (429) after ${MAX_THROTTLE_RETRIES} retries — giving up; will retry on next tab focus / network change`,
          { reason }
        )

        return
      }
      throttleRetryCount += 1
      console.warn(
        `[chat:socket] transit handshake throttled (429) — retry ${throttleRetryCount}/${MAX_THROTTLE_RETRIES} in 60s`,
        { reason }
      )
      throttleRetryTimer = setTimeout(() => {
        throttleRetryTimer = null
        if (cancelled) return
        if (getSocket()?.connected) return // already connected — nothing to do
        retry()
      }, 60_000)
    }

    // Replay sends queued by `sendMsg.rejected` while the socket was down.
    // Idempotent — empty outbox → no-op.
    const flushOutbox = (reason: string) => {
      dispatch(flushPendingOutbox())
        .unwrap()
        .then(result => {
          if (result.total > 0) {
            console.log('[chat:outbox] flush after', reason, '—', result.succeeded, 'of', result.total)
          }
        })
        .catch(e => console.warn('[chat:outbox] flush after', reason, 'failed', e))
    }

    // Socket lifecycle listeners. `connectSocket` is async (runs
    // `fetchServerKeys` before the socket exists), so they're attached after
    // the connect Promise resolves — via `attachListeners`, which is re-run on
    // every (re)connect so a rebuilt socket (visibility / wifi reconnect) stays
    // fully wired. `off` before `on` keeps it idempotent.
    const onConnect = () => {
      setConnected(true)
      setError(null)
    }
    const onConnectError = (err: Error) => {
      setError(err)
      // Re-read the latest token via authProvider so the next built-in
      // auto-reconnect attempt uses a current token. Forward-compat guarded.
      try {
        refreshSocketAuth()
      } catch (e) {
        console.warn('[chat:socket] refreshSocketAuth threw', e)
      }
    }
    const onDisconnect = (_reason: string) => {
      setConnected(false)
    }
    const onReconnect = () => {
      setConnected(true)
      flushOutbox('auto-reconnect')
    }
    const attachListeners = (sock: ChatSocket) => {
      sock.off('connect', onConnect)
      sock.on('connect', onConnect)
      sock.off('connect_error', onConnectError)
      sock.on('connect_error', onConnectError)
      sock.off('disconnect', onDisconnect)
      sock.on('disconnect', onDisconnect)
      sock.io?.off?.('reconnect', onReconnect)
      sock.io?.on?.('reconnect', onReconnect)
    }

    // Connection lifecycle — the integration guide's pattern, driven by both
    // tab visibility AND network (wifi) state:
    //   • tab HIDDEN  / went OFFLINE → tear the socket down.
    //   • tab VISIBLE / came ONLINE  → re-auth + fresh connect, which re-runs
    //     the full transit handshake (/crypto/pubkey + /crypto/session) so REST
    //     + socket get a FRESH session — then re-wire listeners and flush the
    //     outbox so messages queued while offline send the moment we're back.
    // The `online`/`offline` window events cover the wifi-toggle case that
    // `visibilitychange` misses (network changes while the tab stays focused).
    const reconnectFresh = (reason: string) => {
      // A genuine trigger (visible / online) starts a FRESH retry budget; only
      // the automatic 60s chain ('…:throttle-retry') counts toward the cap.
      if (!reason.includes('throttle-retry')) throttleRetryCount = 0
      try {
        refreshSocketAuth()
      } catch (e) {
        console.warn('[chat:socket] refreshSocketAuth threw', { reason, e })
      }
      connectSocket(resolvedSocketConfig, getAccessToken)
        .then(() => {
          if (cancelled) return
          throttleRetryCount = 0 // connected — clear the throttle budget
          s = getSocket()
          setSocket(s)
          detachLifecycleLogs?.()
          detachLifecycleLogs = attachSocketLifecycleLogs(s)
          attachListeners(s)
          setConnected(true)
          flushOutbox(reason)
        })
        .catch(e => {
          // 429 → retry this same fresh connect in 60s (self-recursive).
          if (isThrottled(e)) {
            armThrottleRetry(reason, () => reconnectFresh(`${reason}:throttle-retry`))

            return
          }
          console.warn('[chat:socket] reconnect failed', { reason, message: (e as Error)?.message })
        })
    }
    const teardown = (reason: string) => {
      try {
        disconnectSocket()
      } catch (e) {
        console.warn('[chat:socket] disconnect threw', { reason, e })
      }
      setConnected(false)
    }
    const onVisibilityChange = () => {
      if (typeof document === 'undefined') return
      if (document.visibilityState === 'hidden') {
        teardown('hidden')

        return
      }
      reconnectFresh('visible')
    }
    // Network (wifi) transitions. `offline` fires when the connection is lost,
    // `online` when it returns — both fire even if the tab never lost focus.
    const onOffline = () => teardown('offline')
    const onOnline = () => reconnectFresh('online')

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    connectSocket(resolvedSocketConfig, getAccessToken)
      .then(() => {
        if (cancelled) return
        throttleRetryCount = 0 // connected — clear the throttle budget
        s = getSocket()
        setSocket(s)
        detachLifecycleLogs = attachSocketLifecycleLogs(s)
        attachListeners(s)
      })
      .catch(err => {
        // 429 → retry via a fresh connect in 60s (same rule as reconnectFresh).
        if (isThrottled(err)) {
          armThrottleRetry('initial', () => reconnectFresh('initial:throttle-retry'))

          return
        }
        setError(err)
      })

    return () => {
      cancelled = true
      if (throttleRetryTimer) clearTimeout(throttleRetryTimer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      if (s) {
        s.off('connect', onConnect)
        s.off('connect_error', onConnectError)
        s.off('disconnect', onDisconnect)
        s.io?.off?.('reconnect', onReconnect)
      }
      detachLifecycleLogs?.()
      // Forward-compat guards on the teardown SDK calls so a half-broken SDK
      // update can't strand a stale client/socket ref.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableChatModule, auth?.userData?.user?.user_id, auth?.userData?.user?.id, auth?.user?.id, auth?.user?.email])

  return (
    <ChatClientContext.Provider value={{ client, socket, connected, error }}>{children}</ChatClientContext.Provider>
  )
}

/**
 * Read the chat client state from the nearest `<ChatClientProvider>`.
 * Returns the default benign state when called outside a provider — no throw.
 */
export function useChatClient(): ChatClientState {
  return useContext(ChatClientContext)
}
