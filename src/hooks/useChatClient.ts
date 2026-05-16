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
    if (!auth?.userData?.user) return
    if (!process.env.NEXT_PUBLIC_CHAT_API_URL) return

    const userIdRaw =
      auth.userData.user.user_id ?? auth.userData.user.id ?? auth.userData.user.email
    const userId = userIdRaw !== undefined && userIdRaw !== null ? String(userIdRaw) : null
    const tenantId = auth.userData.user.zoos?.[0]?.zoo_id?.toString()
    const avatarUrl =
      auth.userData.user.profile_image ??
      auth.userData.user.avatar ??
      auth.userData.user.avatar_url ??
      undefined

    if (!userId) return

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
      avatar: { url: avatarUrl }
    } as Parameters<typeof connectSocket>[0]

    // Log what we're about to send in the handshake so we can verify the
    // avatar (and other auth fields) are populated. The actual handshake
    // payload includes: token (Bearer), userId, tenantId, avatarUrl.
    console.log('[chat:handshake] connect →', {
      socketOrigin,
      socketPath,
      userId,
      tenantId,
      avatarUrl: avatarUrl ?? '(none — auth.userData.user has no profile_image / avatar / avatar_url)',
      hasToken: Boolean(accessToken)
    })

    connectSocket(resolvedSocketConfig, getAccessToken, userId, tenantId).catch(setError)

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
  }, [auth?.userData?.user?.id])

  return { client, socket, connected, error }
}
