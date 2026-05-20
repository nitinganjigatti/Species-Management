import { useEffect, useCallback, useRef } from 'react'
import { useAuth } from 'src/hooks/useAuth'
import notificationService from 'src/lib/notifications'
import { useNotificationHandler } from './useNotificationHandler'

/**
 * Hook to sync push notifications after login
 * Syncs existing subscription and listens for notification events
 */
export const usePushNotifications = () => {
  const { user, userData } = useAuth()
  const { handleNotification } = useNotificationHandler()
  const syncAttemptedRef = useRef(false)

  // Sync existing subscription on app init after login
  useEffect(() => {
    console.log('[Push Notifications] Effect triggered. User:', !!user, 'UserData:', !!userData)

    if (!user || !userData) {
      console.log('[Push Notifications] Skipping - no user or userData')
      syncAttemptedRef.current = false
      return
    }

    if (syncAttemptedRef.current) {
      console.log('[Push Notifications] Already attempted sync')
      return
    }

    const syncNotifications = async () => {
      try {
        syncAttemptedRef.current = true
        console.log('[Push Notifications] Starting sync...')

        // Sync any existing push subscription from browser
        // This re-registers if a subscription already exists (refreshes lastUsedAt)
        await notificationService.syncPushSubscription()
        console.log('[Push Notifications] Sync completed')
      } catch (error) {
        console.error('[Push Notifications] Failed to sync:', error)
      }
    }

    syncNotifications()
  }, [user, userData])

  // Handle service worker messages (notifications received and browser notification clicks)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      // Handle push notification received
      if (event.data?.type === 'PUSH_NOTIFICATION') {
        handleNotification(event.data.notification)
      }
      // Handle browser notification click
      else if (event.data?.type === 'NOTIFICATION_CLICK') {
        console.log('[usePushNotifications] Browser notification clicked, conversationId:', event.data.conversationId)
        if (event.data.conversationId) {
          // Use window.location for direct navigation from service worker context
          const targetUrl = `/chat?conversationId=${event.data.conversationId}`
          window.location.href = targetUrl
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
    disableNotifications: notificationService.disablePushNotifications.bind(notificationService),
  }
}

export default usePushNotifications
