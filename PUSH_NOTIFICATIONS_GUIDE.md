# Push Notifications Complete Guide

## Overview

The Antz Web Dashboard has a complete push notification system that allows users to receive real-time notifications about messages, group events, and other activities. Notifications work whether the app is open in a browser tab or closed entirely.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (API)                            │
│  - Sends push notifications via Web Push Protocol               │
│  - Manages device token registration                            │
│  - Handles subscription management                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    Push Notification
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SERVICE WORKER (sw.js)                         │
│  - Receives push events from browser                            │
│  - Displays browser notifications                               │
│  - Handles notification clicks                                  │
│  - Routes to existing app windows                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
    ┌──────────────────┐    ┌──────────────────────┐
    │  App Open        │    │  App Closed          │
    │  (Tab exists)    │    │  (No windows open)   │
    └────────┬─────────┘    └──────────┬───────────┘
             │                         │
             │ Message to existing     │ Opens new tab
             │ window                  │
             │                         │
             ▼                         ▼
    ┌──────────────────────────────────────────┐
    │  React App (AppChat.tsx)                 │
    │  - Receives message from Service Worker  │
    │  - Navigates to /chat?conversationId=... │
    │  - Updates Redux notification state      │
    └──────────────────────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────────────┐
    │  User sees chat with correct person      │
    │  Notification marked as read            │
    └──────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. **Notification Module** (`src/lib/notifications/`)

#### `index.ts` (350+ lines - Consolidated)
Contains everything notification-related:

**Types:**
- `AppNotification` — In-app notification object
- `PushNotification` — Browser push payload
- `NotificationPreferences` — User notification settings

**NotificationService Class (Singleton):**
- `syncPushSubscription()` — Syncs existing device subscription with backend
- `enablePushNotifications()` — Requests permission & subscribes device
- `disablePushNotifications()` — Unsubscribes & removes device from backend
- `getPreferences() / setPreferences()` — Manages localStorage settings
- `sendTestNotification()` — Shows test browser notification

**Redux Slice:**
```typescript
State: {
  items: AppNotification[]          // List of notifications
  unreadCount: number               // Count of unread notifications
}

Actions:
- addNotification(notification)     // Add new notification, increment count
- markAllRead()                     // Mark all as read, reset count
- markAsRead(id)                    // Mark single notification as read
- markConversationAsRead(convoId)   // Mark all notifications from conversation as read
- clearAll()                        // Clear all notifications
```

#### `hooks.ts`
**usePushNotifications():**
- Initializes push notifications on app startup
- Syncs subscription with backend
- Listens for service worker messages
- Handles `PUSH_NOTIFICATION` events (from background)
- Handles `NOTIFICATION_CLICK` events (user clicked browser notification)

**useNotificationHandler():**
- Receives incoming push notifications
- Creates app notification object
- Dispatches to Redux
- Determines if notification should be auto-read (if user is viewing that conversation)

#### `PushNotificationProvider.tsx`
Wrapper component that initializes notifications:
```jsx
export const PushNotificationProvider = ({ children }) => {
  usePushNotifications()  // Initialize on mount
  return <>{children}</>
}
```

### 2. **Service Worker** (`public/sw.js`)

Handles push notifications even when app is closed.

**Push Event Flow:**
1. Backend sends push notification
2. Service worker intercepts `push` event
3. Shows browser notification
4. Posts message to all open app windows about the notification

**Notification Click Flow:**
1. User clicks browser notification
2. Service worker intercepts `notificationclick` event
3. Looks for existing app windows:
   - ✅ If `/chat` window exists → Focus it, send message
   - ✅ If any app window exists → Focus it, send message  
   - ❌ If no windows → Open new window with `/chat?conversationId=...`
4. Closes notification

Key code:
```javascript
// Find existing windows
clients.matchAll({ type: 'window', includeUncontrolled: true })
  .then((windowClients) => {
    // Prioritize chat window
    for (const client of windowClients) {
      if (client.url.includes('/chat')) {
        client.focus()
        client.postMessage({ type: 'NOTIFICATION_CLICK', conversationId })
        return client
      }
    }
    // Use any window
    if (windowClients.length > 0) {
      windowClients[0].focus()
      windowClients[0].postMessage({ type: 'NOTIFICATION_CLICK', conversationId })
      return windowClients[0]
    }
    // Open new window only if none exist
    return clients.openWindow(targetUrl)
  })
```

### 3. **UI Components**

#### **NotificationDropdown** (`src/@core/layouts/components/shared-components/NotificationDropdown.js`)

Shows unread notifications in a dropdown menu:
- Bell icon with badge showing unread count
- List of unread notifications
- Click notification → calls `onNotificationClick(notification)`
- "Read All" button → calls `onReadAll()`

Props:
```javascript
{
  settings,                           // Theme settings
  notifications,                      // Array of AppNotification objects
  onNotificationClick: (notification) => {},  // Navigation handler
  onReadAll: () => {}                 // Mark all as read handler
}
```

#### **UserDropdown** (`src/@core/layouts/components/shared-components/UserDropdown.js`)

User profile dropdown with notification settings:
- Enable/Disable Notifications button
- Checks push status on mount
- Shows "Enabling..." / "Disabling..." loading states
- Shows toast on success/error

#### **AppBarContent** (Vertical & Horizontal)

Wires everything together:
```jsx
// Vertical: src/layouts/components/vertical/AppBarContent.js
// Horizontal: src/layouts/components/horizontal/AppBarContent.js

const notifications = useSelector(state => state.notifications.items)
const dispatch = useDispatch()
const router = useSafeRouter()

const handleNotificationClick = (notification) => {
  dispatch(markAsRead(notification.id))
  if (notification.conversationId) {
    router.push(`/chat?conversationId=${notification.conversationId}`)
  } else {
    router.push('/chat')
  }
}

const handleReadAll = () => {
  dispatch(markAllRead())
}

return (
  <>
    <NotificationDropdown
      notifications={notifications}
      onNotificationClick={handleNotificationClick}
      onReadAll={handleReadAll}
    />
    <UserDropdown />
  </>
)
```

### 4. **Chat Integration** (`src/views/apps/chat/AppChat.tsx`)

Auto-reads notifications when user views a conversation:

```javascript
// When user selects chat from sidebar
useEffect(() => {
  if (store?.selectedChat?.contact?.id) {
    dispatch(markConversationAsRead(String(conversationId)))
  }
}, [store?.selectedChat?.contact?.id])

// When notification click routes to chat
useEffect(() => {
  if (searchParams?.get('conversationId')) {
    const conversationId = searchParams.get('conversationId')
    dispatch(markConversationAsRead(String(conversationId)))
    // Auto-select that chat
  }
}, [searchParams])
```

---

## Complete Flow: Step-by-Step

### **Scenario 1: User Receives Notification (App Open)**

1. **Backend** sends push notification
2. **Service Worker** receives `push` event
3. Service Worker posts message to all open app windows:
   ```javascript
   client.postMessage({
     type: 'PUSH_NOTIFICATION',
     notification: { title, body, data }
   })
   ```
4. **usePushNotifications hook** (in app) receives message
5. Calls `useNotificationHandler()` which:
   - Creates AppNotification object
   - Checks if user is viewing that conversation
   - If yes: marks `read: true`
   - If no: marks `read: false`, increments unreadCount
   - Dispatches `addNotification(appNotification)`
6. **Redux store** updates notification items
7. **NotificationDropdown** re-renders with new notification and updated badge
8. **Toast** shows (optional)

### **Scenario 2: User Clicks Browser Notification (App Open)**

1. **User clicks** browser notification while app is open
2. **Service Worker** intercepts `notificationclick` event
3. Service Worker looks for existing windows:
   - Finds app window (already open)
   - Focuses it
   - Posts message:
   ```javascript
   client.postMessage({
     type: 'NOTIFICATION_CLICK',
     conversationId: 'abc123'
   })
   ```
4. **usePushNotifications hook** receives message
5. Executes:
   ```javascript
   window.location.href = `/chat?conversationId=abc123`
   ```
6. **AppChat.tsx** receives URL parameter
7. AppChat effect triggers:
   ```javascript
   const conversationId = searchParams.get('conversationId')
   dispatch(markConversationAsRead(conversationId))
   // Auto-selects that chat
   ```
8. **User sees** chat with that person
9. Notification is marked as read

### **Scenario 3: User Clicks Browser Notification (App Closed)**

1. **User clicks** browser notification (app tab closed)
2. **Service Worker** intercepts `notificationclick` event
3. Looks for existing windows → finds none
4. Opens new window:
   ```javascript
   clients.openWindow(`/chat?conversationId=abc123`)
   ```
5. **App loads** with URL parameter
6. **usePushNotifications** initializes
7. **AppChat.tsx** reads URL and auto-selects chat
8. **User sees** fresh app with correct conversation loaded

### **Scenario 4: User Clicks "Read All" in Dropdown**

1. **User clicks** "Read All Notifications" button
2. **AppBarContent** handler fires:
   ```javascript
   dispatch(markAllRead())
   ```
3. **Redux** updates:
   - All `notification.read = true`
   - `unreadCount = 0`
4. **NotificationDropdown** re-renders:
   - Badge disappears (unreadCount === 0)
   - Dropdown still shows list but all marked as read

### **Scenario 5: User Clicks Notification in Dropdown**

1. **User clicks** notification item in dropdown
2. **NotificationDropdown** calls:
   ```javascript
   onNotificationClick(notification)
   ```
3. **AppBarContent** handler:
   ```javascript
   dispatch(markAsRead(notification.id))
   router.push(`/chat?conversationId=${notification.conversationId}`)
   ```
4. **Notification** marked as read in Redux
5. **Badge count** decreases by 1
6. **Dropdown closes**
7. **App navigates** to chat

---

## Device Registration Flow

### **First Time: User Enables Notifications**

```
User clicks "Enable Notifications" in profile menu
        ↓
UserDropdown.handleEnableNotifications() called
        ↓
notificationService.enablePushNotifications()
        ↓
navigator.permissions.query() 
  → Check if already granted
        ↓
Notification.requestPermission()
  → Show browser permission prompt
        ↓
navigator.serviceWorker.ready
  → Wait for service worker
        ↓
registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: VAPID_PUBLIC_KEY
})
  → Create subscription
        ↓
Extract subscription keys:
  - p256dh
  - auth
  - endpoint
        ↓
Extract device identifier:
  - userId from localStorage
  - Generate device ID
        ↓
POST /api/chat/push-tokens/register {
  device_id: 'antz_...',
  user_id: '123',
  subscription_keys: {...},
  user_agent: navigator.userAgent
}
  → Register with backend
        ↓
✅ isPushEnabled = true
✅ Toast: "Notifications enabled"
```

### **Ongoing: Sync Subscription**

On every app load, `usePushNotifications` hook:
```javascript
if (!syncAttemptedRef.current) {
  await notificationService.syncPushSubscription()
}
```

This syncs the current device's subscription with the backend (in case it changed).

### **Disable: User Disables Notifications**

```
User clicks "Disable Notifications"
        ↓
UserDropdown.handleDisableNotifications()
        ↓
notificationService.disablePushNotifications()
        ↓
registration.pushManager.getSubscription()
  → Get current subscription
        ↓
subscription.unsubscribe()
  → Unsubscribe locally
        ↓
devicesApi.remove(deviceId)
  → Remove device from backend
        ↓
✅ isPushEnabled = false
✅ Toast: "Notifications disabled"
```

---

## Redux State Management

### **Initial State**
```javascript
{
  notifications: {
    items: [],
    unreadCount: 0
  }
}
```

### **After Receiving Notification**
```javascript
{
  notifications: {
    items: [
      {
        id: 'uuid-1',
        title: 'New message',
        subtitle: 'Hey, how are you?',
        meta: 'Just now',
        timestamp: 1234567890000,
        read: false,
        avatarText: 'John',
        avatarColor: 'primary',
        conversationId: 'conv-123'
      },
      // ... more notifications
    ],
    unreadCount: 1
  }
}
```

### **After Marking as Read**
```javascript
{
  notifications: {
    items: [
      {
        // ... same object, but:
        read: true  // ← changed
      }
    ],
    unreadCount: 0  // ← decremented
  }
}
```

---

## File Locations Quick Reference

| Purpose | File |
|---------|------|
| **Core Logic** | `src/lib/notifications/index.ts` |
| **Hooks** | `src/lib/notifications/hooks.ts` |
| **Provider** | `src/lib/notifications/PushNotificationProvider.tsx` |
| **Service Worker** | `public/sw.js` |
| **Bell Icon Dropdown** | `src/@core/layouts/shared-components/NotificationDropdown.js` |
| **Profile Menu** | `src/@core/layouts/shared-components/UserDropdown.js` |
| **Header Integration** | `src/layouts/components/vertical/AppBarContent.js` |
| **Chat Page** | `src/views/apps/chat/AppChat.tsx` |
| **Store Setup** | `src/store/store.ts` |

---

## Environment Setup

### **.env Variables Required**
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=xxxxx  // Public VAPID key (from backend)
NEXT_PUBLIC_API_URL=https://api.dev.antzsystems.com  // Backend URL
```

### **Backend VAPID Keys**
Generated once and stored on backend:
- Public key: Sent to frontend for subscription
- Private key: Kept on backend for signing push messages

---

## Testing Notifications

### **Test 1: Enable Notifications**
1. Click user profile menu
2. Click "Enable Notifications"
3. Allow browser permission
4. Toast shows "Notifications enabled"

### **Test 2: Receive Notification (App Open)**
1. Have app open on Dashboard
2. Trigger a message from another user
3. Bell icon shows badge with number
4. Notification appears in dropdown
5. Notification auto-reads if viewing that conversation

### **Test 3: Receive Notification (App Closed)**
1. Close app tab completely
2. Trigger a message
3. Browser notification appears
4. Click browser notification
5. App opens and shows correct chat

### **Test 4: Browser Notification Click (App Open)**
1. App open on any page (not chat)
2. Trigger notification
3. Browser notification appears
4. Click it
5. App focuses, navigates to chat
6. Notification reads in dropdown

### **Test 5: Read All**
1. Get multiple unread notifications
2. Click "Read All" button in dropdown
3. All marked as read
4. Badge disappears

---

## Key Behaviors

| Scenario | Behavior |
|----------|----------|
| **App open, viewing conversation A, notification from A arrives** | Shows toast, marks as read immediately, no unread badge |
| **App open on Dashboard, notification arrives** | Shows toast, unread badge appears in bell icon |
| **App open, user clicks notification in dropdown** | Navigates to chat, marks as read |
| **App open on any page, browser notification clicked** | Reuses existing window, navigates to chat |
| **App closed, notification arrives** | Browser shows notification silently |
| **App closed, browser notification clicked** | Opens new window with chat loaded |
| **User disables notifications** | Unsubscribes from push, backend removes device |

---

## Common Issues & Solutions

### **Issue: Always opens new tab**
**Cause:** Service worker not finding existing windows  
**Fix:** Check that app is open before clicking browser notification

### **Issue: Notifications not appearing**
**Cause:** Service worker not installed  
**Fix:** Hard refresh (Cmd+Shift+R), check DevTools → Application → Service Workers

### **Issue: "Enable Notifications" button stuck loading**
**Cause:** Browser permission denied or network error  
**Fix:** Check browser console, allow notifications in browser settings

### **Issue: Notification not auto-reading**
**Cause:** URL parameter not synced  
**Fix:** Ensure AppChat.tsx has useSearchParams hook imported correctly

---

## Architecture Decisions

1. **Consolidated Module** — All notification logic in `src/lib/notifications/` for easier maintenance
2. **Redux Store** — Unread count and notification history persisted across page navigations
3. **Service Worker Messages** — Used instead of `client.navigate()` for better control
4. **Window Reuse** — Service worker prefers existing windows to avoid tab clutter
5. **Auto-Read** — Notifications auto-marked as read when user views that conversation

---

**Last Updated:** May 20, 2026  
**System Version:** 3.0
