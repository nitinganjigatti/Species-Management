/**
 * Consolidated Notifications Module
 * Contains all notification types, services, Redux logic, and hooks
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { devicesApi } from '@antzsoft/chat-core'
import { read } from 'src/lib/windows/utils'

// ==================== TYPES ====================

export interface AppNotification {
  id: string
  title: string
  subtitle: string
  meta: string
  timestamp: number
  read: boolean
  avatarText: string
  avatarColor: 'primary' | 'success' | 'error' | 'warning' | 'info' | 'secondary'
  conversationId?: string
}

export interface PushNotification {
  title: string
  body: string
  data: {
    event: string
    conversation_id: string
    sender_name?: string
    group_name?: string
    sender_id?: string
    message_id?: string
    tenant_id?: string
    recipient_id?: string
    [key: string]: any
  }
}

export interface NotificationPreferences {
  notificationsEnabled: boolean
  sound: boolean
  showPreview: boolean
}

// ==================== NOTIFICATION SERVICE ====================

const NOTIFICATION_PREFS_KEY = 'notification_preferences'

function getDeviceId(): string {
  if (typeof window === 'undefined') return ''
  try {
    return read('antz_device_id') || ''
  } catch {
    return localStorage.getItem('antz_device_id') || ''
  }
}

function subToPayload(sub: PushSubscription, deviceId: string) {
  const b64 = (buf: ArrayBuffer | null) => (buf ? btoa(String.fromCharCode(...new Uint8Array(buf))) : '')
  return {
    deviceId,
    platform: 'web' as const,
    provider: 'web-push' as const,
    endpoint: sub.endpoint,
    p256dh: b64(sub.getKey('p256dh')),
    auth: b64(sub.getKey('auth')),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
  }
}

export class NotificationService {
  private static instance: NotificationService
  private swRegistration: ServiceWorkerRegistration | null | undefined = null
  private vapidPublicKey: string = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim()

  private constructor() {
    if (!this.vapidPublicKey) {
      console.warn('[Notifications] VAPID key not configured')
    }
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  private isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    )
  }

  private async ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.swRegistration) {
      this.swRegistration = await navigator.serviceWorker.ready
    }
    return this.swRegistration
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  async syncPushSubscription(): Promise<void> {
    if (!this.isSupported()) return
    try {
      const reg = await navigator.serviceWorker.ready
      if (!reg) return
      if (Notification.permission !== 'granted') return
      const existing = await reg.pushManager.getSubscription()
      if (!existing) return
      const deviceId = getDeviceId()
      try {
        await devicesApi.register(subToPayload(existing, deviceId))
        console.log('[Notifications] Push subscription synced')
      } catch (apiError: any) {
        if (apiError?.message?.includes('not initialized')) {
          console.log('[Notifications] API client not ready yet')
        } else {
          console.error('[Notifications] Failed to sync:', apiError)
        }
      }
    } catch (error) {
      console.error('[Notifications] Failed to sync subscription:', error)
    }
  }

  async enablePushNotifications(): Promise<boolean> {
    if (!this.isSupported()) return false
    try {
      const reg = await navigator.serviceWorker.ready
      if (!reg) return false
      if (!reg.active) {
        await new Promise(resolve => setTimeout(resolve, 500))
        const updatedReg = await navigator.serviceWorker.ready
        if (!updatedReg.active) return false
      }
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return false
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as BufferSource
      })
      const deviceId = getDeviceId()
      try {
        await devicesApi.register(subToPayload(sub, deviceId))
        console.log('[Notifications] Push notifications enabled')
      } catch (apiError: any) {
        if (!apiError?.message?.includes('not initialized')) {
          throw apiError
        }
      }
      return true
    } catch (error) {
      console.error('[Notifications] Failed to enable:', error)
      return false
    }
  }

  async disablePushNotifications(): Promise<boolean> {
    if (!this.isSupported()) return false
    try {
      const reg = await navigator.serviceWorker.ready
      if (!reg) return false
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
      }
      const deviceId = getDeviceId()
      if (deviceId) {
        try {
          await devicesApi.remove(deviceId)
        } catch (apiError: any) {
          // Ignore 403 (Forbidden) — user may have logged out already
          // Ignore "not initialized" errors
          const status = apiError?.response?.status
          const message = apiError?.message
          if (status !== 403 && !message?.includes('not initialized')) {
            console.error('[Notifications] Failed to remove device:', apiError)
          }
        }
      }
      console.log('[Notifications] Push notifications disabled')
      return true
    } catch (error) {
      console.error('[Notifications] Failed to disable:', error)
      return false
    }
  }

  getPreferences(): NotificationPreferences {
    if (typeof window === 'undefined') {
      return { notificationsEnabled: true, sound: true, showPreview: true }
    }
    try {
      const stored = localStorage.getItem(NOTIFICATION_PREFS_KEY)
      return stored ? JSON.parse(stored) : { notificationsEnabled: true, sound: true, showPreview: true }
    } catch {
      return { notificationsEnabled: true, sound: true, showPreview: true }
    }
  }

  setPreferences(prefs: NotificationPreferences): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve()
    try {
      localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs))
      return Promise.resolve()
    } catch {
      return Promise.reject(new Error('Failed to save preferences'))
    }
  }

  async sendTestNotification(): Promise<void> {
    if (!('serviceWorker' in navigator)) return
    try {
      const reg = await navigator.serviceWorker.ready
      if (!reg) return
      reg.showNotification('Test Notification', {
        body: 'This is a test notification from Antz',
        icon: '/branding/antz/Antz_logomark_h_color.svg',
        badge: '/branding/antz/Antz_logomark_h_color.svg'
      })
    } catch (error) {
      // Test notification failed
    }
  }
}

const notificationService = NotificationService.getInstance()

// ==================== REDUX SLICE ====================

export interface NotificationsState {
  items: AppNotification[]
  unreadCount: number
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0
}

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<AppNotification>) => {
      state.items.unshift(action.payload)
      if (!action.payload.read) {
        state.unreadCount += 1
      }
    },
    markAllRead: state => {
      state.items.forEach(item => {
        item.read = true
      })
      state.unreadCount = 0
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.items.find(item => item.id === action.payload)
      if (notification && !notification.read) {
        notification.read = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },
    markConversationAsRead: (state, action: PayloadAction<string>) => {
      let markedCount = 0
      state.items.forEach(item => {
        if (item.conversationId === action.payload && !item.read) {
          item.read = true
          markedCount += 1
        }
      })
      state.unreadCount = Math.max(0, state.unreadCount - markedCount)
    },
    clearAll: state => {
      state.items = []
      state.unreadCount = 0
    }
  }
})

export const { addNotification, markAllRead, markAsRead, markConversationAsRead, clearAll } = notificationsSlice.actions
export const notificationsReducer = notificationsSlice.reducer

export default notificationService
