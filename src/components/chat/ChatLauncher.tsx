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
import { fetchChatsContacts, fetchUserProfile, receiveMessage, setUnreadCount, setSelectedConversationId } from 'src/store/apps/chat'

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
  const [panelWidth, setPanelWidth] = useState(PANEL_WIDTH)
  const [panelHeight, setPanelHeight] = useState(PANEL_HEIGHT)
  const [isResizing, setIsResizing] = useState(false)

  const chats = useSelector((state: RootState) => state.chat.chats)
  const userProfileId = useSelector((state: RootState) => state.chat.userProfile?.id)
  const selectedChat = useSelector((state: RootState) => state.chat.selectedChat)
  const selectedConversationId = useSelector((state: RootState) => state.chat.selectedConversationId)

  // Total unread across all conversations — sum-reduce in a memo so we don't
  // create a fresh number identity on every render and trigger Badge re-renders.
  const totalUnread = useMemo(() => {
    if (!chats?.length) return 0

    return chats.reduce((sum, c) => sum + (c.chat?.unseenMsgs || 0), 0)
  }, [chats])

  // Restore selected conversation from localStorage on app load
  useEffect(() => {
    if (!enableChatModule) return
    const savedConversationId = localStorage.getItem('selectedChatConversationId')
    if (savedConversationId) {
      dispatch(setSelectedConversationId(savedConversationId))
    }
  }, [dispatch, enableChatModule])

  // Sync selectedChat to Redux and localStorage
  useEffect(() => {
    if (!selectedChat?.contact?.id) return
    const conversationId = String(selectedChat.contact.id)
    if (conversationId !== selectedConversationId) {
      dispatch(setSelectedConversationId(conversationId))
    }
    localStorage.setItem('selectedChatConversationId', conversationId)
  }, [selectedChat?.contact?.id, selectedConversationId, dispatch])

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

    // Conversation metadata changed (rename, avatar, mute, pin from another
    // device, etc.). Refresh the conversation list so the sidebar reflects
    // the change while the user is off-/chat. AppChat owns the same listener
    // on /chat — they're mutually exclusive by route, so no double-dispatch.
    const onConversationUpdated = (evt: any) => {
      const convId = evt?.conversationId
      if (!convId) return
      dispatch(fetchChatsContacts())
    }

    socket.on('new_message', onNewMessage)
    socket.on('unread_count_changed', onUnreadCountChanged)
    socket.on('conversation_updated', onConversationUpdated)

    return () => {
      socket.off('new_message', onNewMessage)
      socket.off('unread_count_changed', onUnreadCountChanged)
      socket.off('conversation_updated', onConversationUpdated)
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

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = panelWidth
    const startHeight = panelHeight

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY
      setPanelWidth(Math.max(320, startWidth + deltaX))
      setPanelHeight(Math.max(400, startHeight + deltaY))
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleLeftResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    const startX = e.clientX
    const startWidth = panelWidth

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX
      setPanelWidth(Math.max(320, startWidth - deltaX))
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <>
      <Zoom in={open} unmountOnExit>
        <Box
          sx={{
            position: 'fixed',
            bottom: 96,
            right: 24,
            width: { xs: 'calc(100vw - 32px)', sm: `${panelWidth}px` },
            height: { xs: 'calc(100vh - 120px)', sm: `min(${panelHeight}px, calc(100vh - 120px))` },
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: theme => theme.shadows[10],
            zIndex: 1200,
            backgroundColor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            userSelect: isResizing ? 'none' : 'auto'
          }}
        >
          <AppChat compact />

          {/* Resize handle on left side */}
          <Box
            onMouseDown={handleLeftResizeMouseDown}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '8px',
              height: '100%',
              cursor: 'ew-resize',
              backgroundColor: 'primary.main',
              opacity: 0.4,
              '&:hover': {
                opacity: 0.8
              },
              transition: 'opacity 0.2s'
            }}
          />

          {/* Resize handle in bottom-right corner */}
          <Box
            onMouseDown={handleResizeMouseDown}
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '20px',
              height: '20px',
              cursor: 'nwse-resize',
              backgroundColor: 'primary.main',
              borderRadius: '2px 0 0 0',
              opacity: 0.6,
              '&:hover': {
                opacity: 1
              },
              transition: 'opacity 0.2s'
            }}
          />
        </Box>
      </Zoom>

      <Fab
        color='primary'
        onClick={toggleOpen}
        aria-label={open ? 'Close chat' : 'Open chat'}
        sx={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
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
