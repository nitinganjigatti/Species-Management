'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

import { connectSocket, disconnectSocket, getSocket, refreshSocketAuth } from '@antzsoft/chat-core'

import { useAuth } from 'src/hooks/useAuth'
import { getChatClient, disposeChatClient } from 'src/lib/chat/client'
import authConfig from 'src/configs/auth'
import type { AntzChatClient, ChatSocket } from 'src/lib/chat/api'
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

  // Tenant gate — short-circuit to a passthrough when `ENABLE_CHAT_MODULE`
  // is off so we don't fetch profile / open a socket / register listeners
  // for tenants that don't have chat enabled.
  const enableChatModule = Boolean(auth?.userData?.settings?.ENABLE_CHAT_MODULE)

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
      // Mirror the AntzChatClient constructor — without this, the SDK's
      // pre-socket handshake fetches `${apiUrl}/crypto/pubkey` and falls
      // back to a relative URL when apiUrl is missing, hitting the dev
      // server at `/login/undefined/crypto/pubkey` (404). Must also match
      // the server's TRANSIT_ENCRYPTION_ENABLED flag.
      transitEncryption: false
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
    const onConnectError = (err: Error) => {
      setError(err)
      refreshSocketAuth()
    }
    const onDisconnect = (reason: string) => {
      console.log('[chat:socket] disconnected —', reason)
      setConnected(false)
    }
    const onReconnect = () => setConnected(true)

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
      })
      .catch(setError)

    return () => {
      cancelled = true
      if (s) {
        s.off('connect', onConnect)
        s.off('connect_error', onConnectError)
        s.off('disconnect', onDisconnect)
        s.io?.off?.('reconnect', onReconnect)
      }
      detachLifecycleLogs?.()
      disconnectSocket()
      disposeChatClient()
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
