'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'

import { useAuth } from 'src/hooks/useAuth'

interface ChatLayoutProps {
  children: ReactNode
}

// Chat needs a fixed-height container so the flex layout inside <AppChat />
// can size the left sidebar, message area, and the centered "Start
// Conversation" empty state correctly. All other routes use auto height
// from the parent (module) layout — this wrapper is chat-only.
export default function ChatLayout({ children }: ChatLayoutProps) {
  const router = useRouter()
  const auth = useAuth() as any
  const enableChatModule = Boolean(
    auth?.userData?.settings?.ENABLE_CHAT_MODULE && auth?.userData?.settings?.ENABLE_CHAT_MODULE_IN_WEB
  )

  // `mounted` ensures the first render (both SSR and the matching client
  // hydration) renders the same tree — the Box wrapper — regardless of
  // client-only auth state. Only after the post-mount effect runs do we let
  // the gate evaluate. Without this guard the conditional null-return below
  // can flip between server and client and cause hydration mismatches that
  // cascade up to the parent (module) layout's auth spinner branch.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Tenants without the chat zoo-settings flag shouldn't be able to deep-link
  // / bookmark into the /chat route. Wait for mount + auth resolution so we
  // don't bounce a returning user mid-restore, then send them home.
  useEffect(() => {
    if (!mounted) return
    if (auth?.loading) return
    if (!auth?.user) return
    if (!enableChatModule) router.replace('/')
  }, [mounted, auth?.loading, auth?.user, enableChatModule, router])

  if (mounted && auth?.user && !enableChatModule) return null

  // mt: 3 → 24px (1.5rem) explicit top margin above the chat card.
  // Height shaves an extra 1.5rem so the bottom edge stays inside the page padding.
  return <Box sx={{ height: 'calc(100vh - 10.5rem)', mt: 6 }}>{children}</Box>
}
