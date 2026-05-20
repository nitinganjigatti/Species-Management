'use client'

// ** React Imports
import { useEffect, useMemo, useState } from 'react'

// ** Redux
import { useDispatch, useSelector } from 'react-redux'

// ** Auth
import { useAuth } from 'src/hooks/useAuth'

// ** MUI Imports
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import Fab from '@mui/material/Fab'
import Zoom from '@mui/material/Zoom'

// ** Icon
import Icon from 'src/@core/components/icon'

// ** Chat module
import AppChat from 'src/views/apps/chat/AppChat'

// ** Store
import type { RootState, AppDispatch } from 'src/store'
import { fetchChatsContacts, fetchUserProfile, receiveMessage, setUnreadCount } from 'src/store/apps/chat'

// ** Chat API
import { getChatSocket, sdkMessageToMessage } from 'src/lib/chat/api'

// Floating chat launcher: a FAB anchored at the bottom-right of every
// authenticated page. Clicking it pops a compact panel that hosts the full
// <AppChat /> module. We rely on AppChat's existing responsive behaviour
// (sidebar collapses below `lg`) to make the layout fit the narrow panel.
//
// To keep the FAB's unread badge live even when the panel is closed, we
// subscribe to the two socket events that affect the badge (`new_message` and
// `unread_count_changed`) and dispatch into the same Redux reducers AppChat
// uses. AppChat owns the rest of the event surface (typing, receipts, pin,
// edit, delete, etc.) — duplicating only the unread-count path avoids any
// reducer-double-fire risk and stays minimal.
//
// We hide the launcher entirely on the dedicated `/chat` route because
// AppChat is already mounted there; rendering a second AppChat inside the
// panel would double-subscribe socket handlers.

const PANEL_WIDTH = 480
const PANEL_HEIGHT = 640

const ChatLauncher = () => {
  // useAuth is typed loosely (null user, generic userData) — cast to any so
  // we can probe the zoo-settings flag without TS friction. Same pattern as
  // AppChat.tsx:112.
  const auth = useAuth() as any
  const enableChatModule = Boolean(auth?.userData?.settings?.ENABLE_CHAT_MODULE)
  const dispatch = useDispatch<AppDispatch>()
  const [open, setOpen] = useState(false)

  const chats = useSelector((state: RootState) => state.chat.chats)
  const userProfileId = useSelector((state: RootState) => state.chat.userProfile?.id)

  // Total unread across all conversations — sum-reduce in a memo so we don't
  // create a fresh number identity on every render and trigger Badge re-renders.
  const totalUnread = useMemo(() => {
    if (!chats?.length) return 0

    return chats.reduce((sum, c) => sum + (c.chat?.unseenMsgs || 0), 0)
  }, [chats])

  // Bootstrap the user's profile + conversation list once, so the FAB badge
  // can show the right number even before the user opens the panel. Skip
  // entirely when chat is disabled for this tenant.
  useEffect(() => {
    if (!enableChatModule) return
    dispatch(fetchUserProfile())
    dispatch(fetchChatsContacts())
  }, [dispatch, enableChatModule])

  // Subscribe to the two socket events that affect unread counts. AppChat
  // owns the full event surface on /chat — we hide there to avoid overlap,
  // so this listener is the only path off-/chat. Skip when chat is disabled.
  useEffect(() => {
    if (!enableChatModule) return
    const socket = getChatSocket()
    if (!socket) return

    const onNewMessage = (evt: any) => {
      const raw = evt?.message ?? evt?.data ?? (evt?.conversationId ? evt : null)
      if (!raw || !raw.conversationId) return

      const isOwn = Boolean(userProfileId && raw.senderId === String(userProfileId))

      dispatch(
        receiveMessage({
          conversationId: raw.conversationId,
          message: sdkMessageToMessage(raw),
          isOwn
        })
      )
    }

    const onUnreadCountChanged = (evt: any) => {
      const convId = evt?.conversationId
      const count = typeof evt?.unreadCount === 'number' ? evt.unreadCount : null
      if (!convId || count === null) return
      dispatch(setUnreadCount({ chatId: convId, count }))
    }

    socket.on('new_message', onNewMessage)
    socket.on('unread_count_changed', onUnreadCountChanged)

    return () => {
      socket.off('new_message', onNewMessage)
      socket.off('unread_count_changed', onUnreadCountChanged)
    }
  }, [dispatch, userProfileId, enableChatModule])

  // Don't show the launcher on guest / login pages — there's no user yet, so
  // the panel would be empty and the badge would be 0. Also gate on the zoo
  // settings flag — tenants without the chat module shouldn't see anything.
  // The /chat-route guard lives in the App Router layout, not here, because
  // Pages Router doesn't have a /chat route and shouldn't need to know about it.
  if (!auth?.user) return null
  if (!enableChatModule) return null

  const toggleOpen = () => setOpen(o => !o)

  return (
    <>
      <Zoom in={open} unmountOnExit>
        <Box
          sx={{
            position: 'fixed',
            bottom: 96,
            right: 24,
            width: { xs: 'calc(100vw - 32px)', sm: PANEL_WIDTH },
            height: { xs: 'calc(100vh - 120px)', sm: `min(${PANEL_HEIGHT}px, calc(100vh - 120px))` },
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: theme => theme.shadows[10],
            zIndex: 1200,
            backgroundColor: 'background.paper',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <AppChat compact />
        </Box>
      </Zoom>

      <Fab
        color='primary'
        onClick={toggleOpen}
        aria-label={open ? 'Close chat' : 'Open chat'}
        sx={{
          position: 'fixed',
          bottom: 100,
          right: 24,
          zIndex: 1201
        }}
      >
        <Badge
          color='error'
          max={99}
          badgeContent={totalUnread}
          invisible={open || totalUnread === 0}
          overlap='circular'
        >
          <Icon icon={open ? 'mdi:close' : 'mdi:chat'} fontSize='1.5rem' />
        </Badge>
      </Fab>
    </>
  )
}

export default ChatLauncher
