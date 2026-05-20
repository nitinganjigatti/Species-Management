// Service Worker for handling push notifications
// Listens for push events and displays notifications even when tab is closed

const SW_VERSION = '3.0'
const CACHE_VERSION = 'antz-v3'

console.log('[SW] Service worker loaded - Version:', SW_VERSION)
const CACHE_URLS = ['/', '/manifest.json']

// Install event — cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(CACHE_URLS).catch(() => {
        console.log('[SW] Cache initialization completed (some assets may have failed)')
      })
    })
  )
  self.skipWaiting()
})

// Activate event — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_VERSION)
          .map((cacheName) => caches.delete(cacheName))
      )
    })
  )
  self.clients.claim()
})

// Push event — show notification and notify all open clients
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received')

  if (!event.data) {
    console.log('[SW] Push event with no data')
    return
  }

  let notification = {}
  try {
    notification = event.data.json()
  } catch (e) {
    notification = {
      title: 'Notification',
      body: event.data.text()
    }
  }

  const { title, body, data = {} } = notification
  const options = {
    body,
    badge: '/branding/antz/Antz_logomark_h_color.svg',
    icon: '/branding/antz/Antz_logomark_h_color.svg',
    tag: data.message_id || data.conversation_id || 'notification',
    data,
    // Group notifications by conversation
    renotify: data.event === 'dm_message' || data.event === 'group_message',
    requireInteraction: false
  }

  // Silent notifications for message edits/deletes
  if (data.event === 'message_edited' || data.event === 'message_deleted') {
    options.silent = true
  }

  event.waitUntil(
    self.registration
      .showNotification(title || 'Notification', options)
      .then(() => {
        // Notify all open clients about the notification
        return self.clients.matchAll({ type: 'window' }).then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'PUSH_NOTIFICATION',
              notification: { title, body, data }
            })
          })
        })
      })
  )
})

// Notification click event — route to appropriate conversation/page
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.notification.tag)
  console.log('[SW] Notification data:', event.notification.data)

  event.notification.close()

  const { data } = event.notification
  const conversationId = data && data.conversation_id ? data.conversation_id : null

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Prioritize: Look for an already open chat window first
        for (const client of windowClients) {
          if (client.url.includes('/chat') && 'focus' in client) {
            client.focus()
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              conversationId: conversationId
            })
            return client
          }
        }
        // If no chat window, use any existing window and navigate it
        if (windowClients.length > 0 && 'focus' in windowClients[0]) {
          windowClients[0].focus()
          windowClients[0].postMessage({
            type: 'NOTIFICATION_CLICK',
            conversationId: conversationId
          })
          return windowClients[0]
        }
        // Only open new window if no windows exist at all
        if (clients.openWindow) {
          const targetUrl = conversationId ? `/chat?conversationId=${conversationId}` : '/chat'
          return clients.openWindow(targetUrl)
        }
        return null
      })
  )
})

// Notification close event — optional logging
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag)
})

// Handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[SW] Message received from client:', event.data?.type)

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  // Handle test notification request
  if (event.data && event.data.type === 'SHOW_TEST_NOTIFICATION') {
    const { title, options } = event.data
    self.registration.showNotification(title || 'Test Notification', options || {
      body: 'Test notification from Antz',
      badge: '/branding/antz/Antz_logomark_h_color.svg',
      icon: '/branding/antz/Antz_logomark_h_color.svg',
      tag: 'test-notification',
    }).catch((err) => {
      console.error('[SW] Failed to show test notification:', err)
    })
  }
})

// Fetch event — network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip API calls — let them go directly to network
  if (event.request.url.includes('/api/')) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const responseClone = response.clone()
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // Fallback to cache on network error
        return caches
          .match(event.request)
          .then((cachedResponse) => {
            return cachedResponse || new Response('Offline', { status: 503 })
          })
      })
  )
})

// Keep service worker alive for periodic checks
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications())
  }
})

async function syncNotifications() {
  // Placeholder for background sync logic
  console.log('[SW] Background sync triggered')
}
