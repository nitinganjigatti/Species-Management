'use client'

import { useEffect, useState } from 'react'

import { connectSocket, disconnectSocket, getSocket, refreshSocketAuth } from '@antzsoft/chat-core'

import { useAuth } from 'src/hooks/useAuth'
import { getChatClient, disposeChatClient } from 'src/lib/chat/client'
import authConfig from 'src/configs/auth'
import type { AntzChatClient, ChatSocket } from 'src/lib/chat/api'
import { attachSocketLifecycleLogs } from 'src/lib/chat/socketLogger'

interface UseChatClientResult {
  client: AntzChatClient | null
  socket: ChatSocket | null
  connected: boolean
  error: Error | null
}

export function useChatClient(): UseChatClientResult {
  const auth = useAuth() as any
  const [client, setClient] = useState<AntzChatClient | null>(null)
  const [socket, setSocket] = useState<ChatSocket | null>(null)
  const [connected, setConnected] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
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
      typeof window !== 'undefined'
        ? localStorage.getItem(authConfig.storageTokenKeyName) ?? ''
        : ''
    const accessToken = getAccessToken()

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
      socketOrigin,
      socketPath,
      userId,
      tenantId,
      avatar: { url: avatarUrl }
    } as Parameters<typeof connectSocket>[0]

    connectSocket(resolvedSocketConfig, getAccessToken).catch(setError)

    const s = getSocket()
    setSocket(s)
    const detachLifecycleLogs = attachSocketLifecycleLogs(s)

    const onConnect = () => {
      setConnected(true)
      setError(null)
    }
    const onConnectError = (err: Error) => {
      setError(err)
      refreshSocketAuth()
    }
    const onDisconnect = () => setConnected(false)
    const onReconnect = () => setConnected(true)

    s.on('connect', onConnect)
    s.on('connect_error', onConnectError)
    s.on('disconnect', onDisconnect)
    s.io?.on?.('reconnect', onReconnect)

    return () => {
      s.off('connect', onConnect)
      s.off('connect_error', onConnectError)
      s.off('disconnect', onDisconnect)
      s.io?.off?.('reconnect', onReconnect)
      detachLifecycleLogs()
      disconnectSocket()
      disposeChatClient()
      setConnected(false)
      setClient(null)
      setSocket(null)
    }
    // Watch BOTH paths — whichever populates first triggers init.
  }, [auth?.userData?.user?.user_id, auth?.userData?.user?.id, auth?.user?.id, auth?.user?.email])

  return { client, socket, connected, error }
}
