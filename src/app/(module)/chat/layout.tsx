'use client'

import { ReactNode } from 'react'
import Box from '@mui/material/Box'

interface ChatLayoutProps {
  children: ReactNode
}

// Chat needs a fixed-height container so the flex layout inside <AppChat />
// can size the left sidebar, message area, and the centered "Start
// Conversation" empty state correctly. All other routes use auto height
// from the parent (module) layout — this wrapper is chat-only.
export default function ChatLayout({ children }: ChatLayoutProps) {
  // mt: 3 → 24px (1.5rem) explicit top margin above the chat card.
  // Height shaves an extra 1.5rem so the bottom edge stays inside the page padding.
  return <Box sx={{ height: 'calc(100vh - 10.5rem)', mt: 6 }}>{children}</Box>
}
