'use client'

import { useChatClient } from 'src/hooks/useChatClient'
import { useAuth } from 'src/hooks/useAuth'

/**
 * Single global init point for the `@antzsoft/chat-core` SDK.
 *
 * Mounted once at app root inside <AuthProvider> in both routers
 * (providers.tsx for App Router, _app.js for Pages Router). `useChatClient`
 * watches auth state and creates / connects / disconnects / disposes the
 * SDK accordingly.
 *
 * The SDK is only initialized when the tenant's zoo-settings flag
 * `ENABLE_CHAT_MODULE` is true — otherwise the socket, REST client, and
 * profile fetch are all skipped. We split into an inner component because
 * hooks (`useChatClient`) can't be called conditionally; the outer wrapper
 * decides whether to mount the inner at all.
 *
 * Renders nothing — pure side effect.
 */
const ChatBootInner = () => {
  useChatClient()

  return null
}

const ChatBoot = () => {
  const auth = useAuth() as any
  const enableChatModule = Boolean(auth?.userData?.settings?.ENABLE_CHAT_MODULE)
  if (!enableChatModule) return null

  return <ChatBootInner />
}

export default ChatBoot
