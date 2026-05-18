'use client'

import { useChatClient } from 'src/hooks/useChatClient'

/**
 * Single global init point for the `@antzsoft/chat-core` SDK.
 *
 * Mounted once at app root inside <AuthProvider> in both routers
 * (providers.tsx for App Router, _app.js for Pages Router). `useChatClient`
 * watches auth state and creates / connects / disconnects / disposes the
 * SDK accordingly.
 *
 * Renders nothing — pure side effect.
 */
const ChatBoot = () => {
  useChatClient()

  return null
}

export default ChatBoot
