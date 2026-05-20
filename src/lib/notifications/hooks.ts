/**
 * Notification Hooks
 * Extracted from main notifications module
 */

import { useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useSafeRouter } from 'src/hooks/useSafeRouter'
import { useDispatch, useSelector } from 'react-redux'
import { addNotification, markAsRead } from './index'
import type { PushNotification, AppNotification } from './index'
import type { AppDispatch, RootState } from 'src/store/store'
import { useSearchParams } from 'next/navigation'
import notificationService from './index'
import { setSelectedConversationId } from 'src/store/apps/chat'

const playNotificationSound = async () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const response = await fetch('/sounds/mac.wav')
    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    const source = audioContext.createBufferSource()
    source.buffer = audioBuffer
    source.connect(audioContext.destination)
    source.start(0)
  } catch (error) {
    // Sound playback failed silently
  }
}

export const usePushNotifications = () => {
  const { user, userData } = useAuth()
  const { handleNotification } = useNotificationHandler()
  const syncAttemptedRef = { current: false }

  useEffect(() => {
    if (!user || !userData) {
      syncAttemptedRef.current = false
      return
    }

    if (syncAttemptedRef.current) {
      return
    }

    const syncNotifications = async () => {
      try {
        syncAttemptedRef.current = true
        await notificationService.syncPushSubscription()
      } catch (error) {
        // Sync failed silently
      }
    }

    syncNotifications()
  }, [user, userData])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PUSH_NOTIFICATION') {
        handleNotification(event.data.notification)
      } else if (event.data?.type === 'NOTIFICATION_CLICK') {
        if (event.data.conversationId) {
          const targetUrl = `/chat?conversationId=${event.data.conversationId}`
          if (typeof window !== 'undefined') {
            window.location.href = targetUrl
          }
        }
      }
    }

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage as any)
    }
  }, [handleNotification])

  return {
    isReady: !!user && !!userData,
    enableNotifications: notificationService.enablePushNotifications.bind(notificationService),
    disableNotifications: notificationService.disablePushNotifications.bind(notificationService)
  }
}

export const useNotificationHandler = () => {
  const router = useSafeRouter()
  const dispatch = useDispatch<AppDispatch>()
  const searchParams = useSearchParams()
  const currentRoute = router.pathname

  const handleNotification = useCallback(
    (notification: PushNotification) => {
      const { title, body, data } = notification

      const isSilent = data.event === 'message_edited' || data.event === 'message_deleted'
      if (!isSilent) {
        const currentConversationId = searchParams?.get('conversationId') || null
        const isViewingConversation =
          currentRoute === '/chat' &&
          !!currentConversationId &&
          String(currentConversationId) === String(data.conversation_id)

        const appNotification: AppNotification = {
          id: crypto.randomUUID(),
          title,
          subtitle: body,
          meta: 'Just now',
          timestamp: Date.now(),
          read: isViewingConversation,
          avatarText: data.sender_name || data.group_name || 'A',
          avatarColor: getAvatarColor(data.event),
          conversationId: data.conversation_id || data.contact_id || data.sender_id || undefined
        }
        dispatch(addNotification(appNotification))
        if (appNotification.conversationId) {
          dispatch(setSelectedConversationId(String(appNotification.conversationId)))
          localStorage.setItem('selectedChatConversationId', String(appNotification.conversationId))
        }
        playNotificationSound()
      }
    },
    [router, dispatch, searchParams, currentRoute]
  )

  return { handleNotification }
}

const getAvatarColor = (event: string): AppNotification['avatarColor'] => {
  switch (event) {
    case 'dm_message':
    case 'reply':
    case 'dm_reaction':
      return 'primary'
    case 'group_message':
    case 'mention':
    case 'group_reaction':
      return 'secondary'
    case 'group_invite':
      return 'success'
    case 'group_removed':
    case 'group_role_changed':
      return 'error'
    default:
      return 'info'
  }
}

// Import useAuth from the actual location
import { useAuth } from 'src/hooks/useAuth'
