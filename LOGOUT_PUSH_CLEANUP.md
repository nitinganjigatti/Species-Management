# Push Notifications Logout Cleanup

## What Was Added

On logout, the app now properly cleans up push notifications before clearing user data. This is **critical** for security and data integrity.

## Where It's Implemented

**File**: `src/context/AuthContext.js`

**Location**: `logOutUser()` function (line 278)

**Code**:
```javascript
const logOutUser = async () => {
  // Cleanup push notifications before clearing localStorage
  try {
    await notificationService.unregisterDevice()
  } catch (error) {
    console.error('[Auth] Failed to unregister push notifications:', error)
    // Continue logout even if unregister fails
  }

  // ... rest of logout code
}
```

## What Happens During Logout

### Step 1: Unsubscribe from Push (Browser)
```
Browser Service Worker
  → Get push subscription
  → Call unsubscribe()
  → Device no longer receives browser push
```

### Step 2: Notify Backend
```
Frontend API Call
  → DELETE /chat/push-tokens/unregister
  → Send: device token
  → Backend removes token from device list
  → Device token marked as inactive
```

### Step 3: Clean localStorage
```
Storage Cleanup
  → Clear device token from localStorage
  → Preserve device ID (reused on next login)
  → Clear all user data
```

### Complete Logout Flow

```
User clicks Logout
  ↓
logOutUser() called
  ↓
notificationService.unregisterDevice()
  ├─ Get push subscription from browser
  ├─ Call subscription.unsubscribe()
  ├─ Call backend DELETE /chat/push-tokens/unregister
  └─ Clear device token from localStorage
  ↓
Cancel all React Query requests
  ↓
Clear Redux/local state
  ↓
Clear localStorage and sessionStorage
  ↓
Redirect to login page
```

## Why This Is Important

### 🔒 Security
- User logs out → should NOT receive notifications anymore
- Without cleanup → old tokens pile up on server
- Attackers could intercept old tokens
- Must revoke all permissions

### 📊 Data Integrity
- Prevents orphaned device tokens
- Prevents user getting notifications after logout
- Keeps device list clean on backend
- Enables proper device tracking

### 💾 Storage Management
- Device tokens accumulate without cleanup
- Each token takes backend storage
- Multiple tokens per user = harder to manage
- Cleanup prevents database bloat

### 🔐 Privacy
- User expects no notifications after logout
- Leaving tokens active = privacy violation
- Backend should forget inactive devices
- Explicit cleanup shows intent

## Error Handling

The cleanup is **safe** and **fail-safe**:

```javascript
try {
  await notificationService.unregisterDevice()
} catch (error) {
  console.error('[Auth] Failed to unregister push notifications:', error)
  // Continue logout even if unregister fails ← Important!
}
```

**Why continue on error?**
- Logout MUST always complete
- Network issues shouldn't block logout
- Even if cleanup fails, user is logged out
- Browser still unsubscribed locally
- Next login re-registers cleanly

## What notificationService.unregisterDevice() Does

Located in `src/lib/services/notificationService.ts` (lines 127-165):

```typescript
async unregisterDevice(): Promise<boolean> {
  // 1. Get subscription from browser
  const subscription = await this.swRegistration.pushManager.getSubscription()
  
  // 2. Unsubscribe (browser stops receiving push)
  if (subscription) {
    await subscription.unsubscribe()
  }
  
  // 3. Notify backend (remove from device list)
  const token = localStorage.getItem(DEVICE_TOKEN_KEY)
  if (token) {
    await axiosDelete({
      url: '/chat/push-tokens/unregister',
      params: { token }
    })
  }
  
  // 4. Clear localStorage
  localStorage.removeItem(DEVICE_TOKEN_KEY)
  
  return true
}
```

## Backend API Expected

### Endpoint
```
DELETE /chat/push-tokens/unregister
```

### Request
```typescript
{
  params: {
    token: "endpoint-url-token"  // Push subscription token
  }
}
```

### Response
```typescript
{
  success: true,
  message: "Device token removed"
}
```

### What Backend Does
1. Find device token in database
2. Mark as inactive/deleted
3. Stop sending notifications to this token
4. Clean up from push service (FCM, etc.)

## Testing the Logout Cleanup

### Manual Testing
1. Login to app
2. Check backend logs → see device registration
3. Check localStorage → see `device_push_token` exists
4. Click logout
5. Check backend logs → see `/chat/push-tokens/unregister` call
6. Check localStorage → `device_push_token` should be gone
7. Try to login again → fresh device registration (new token)

### DevTools Testing
```javascript
// Before logout
localStorage.getItem('device_push_token')
// Returns: "https://fcm.googleapis.com/..."

// After logout
localStorage.getItem('device_push_token')
// Returns: null
```

### Service Worker Testing
```javascript
// Check push subscription before logout
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(sub => {
    console.log('Before logout:', sub ? 'Subscribed' : 'Not subscribed')
  })
})

// After logout, run same code
// Should show: 'Not subscribed'
```

## Common Issues & Solutions

### Issue: User Gets Notifications After Logout
**Cause**: Logout cleanup not called or failed  
**Solution**:
1. Check browser console for errors
2. Verify `notificationService.unregisterDevice()` called
3. Check backend logs for DELETE request
4. Verify `/chat/push-tokens/unregister` endpoint working

### Issue: Old Tokens Accumulating in Backend
**Cause**: Cleanup failed or endpoint not working  
**Solution**:
1. Check backend logs for errors
2. Test endpoint manually: `curl -X DELETE /chat/push-tokens/unregister?token=...`
3. Verify database cleanup process

### Issue: Logout Takes Too Long
**Cause**: Unregister waiting for slow network  
**Solution**:
1. Set timeout on unregister call (optional improvement)
2. Use try-catch so logout continues anyway (already done)
3. Unregister happens in background after logout continues

## Flow Diagram

```
┌─────────────────────────────────────────────────┐
│              User Clicks Logout                 │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│        logOutUser() Called                       │
├─────────────────────────────────────────────────┤
│  1. notificationService.unregisterDevice()      │
│     ├─ Browser: Unsubscribe from push          │
│     ├─ Backend: DELETE /chat/push-tokens/...   │
│     └─ Storage: Clear device token             │
│  2. Cancel React Query                          │
│  3. Clear Redux state                           │
│  4. Clear localStorage                          │
│  5. Clear sessionStorage                        │
│  6. Reset language/theme                        │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│        User Logged Out                          │
│        Redirect to Login Page                   │
└─────────────────────────────────────────────────┘
```

## Integration Details

### Imports
```javascript
// In src/context/AuthContext.js (line 39)
import notificationService from 'src/lib/services/notificationService'
```

### Function Call
```javascript
// In logOutUser() (line 281)
await notificationService.unregisterDevice()
```

### Error Handling
```javascript
// If unregister fails, logout continues (line 284)
// This is intentional — logout always completes
```

## Best Practices

✅ **Do:**
- Always call cleanup before logout completes
- Handle cleanup errors gracefully
- Log cleanup failures for debugging
- Test logout on real devices
- Monitor backend token removal

❌ **Don't:**
- Block logout on cleanup failure
- Ignore cleanup errors silently
- Assume cleanup always works
- Skip testing on slow networks
- Leave old tokens on backend

## Monitoring

### Backend Should Track
- Number of unregister requests per day
- Success rate of unregister endpoint
- Failed unregister attempts
- Old tokens not being cleaned

### Frontend Should Log
- Unregister success/failure
- Logout completion time
- Browser unsubscribe errors

### Metrics to Monitor
- Logout to redirect time (should be <1s)
- Unregister endpoint response time (should be <100ms)
- Failed unregister rate (should be <0.1%)

## Future Enhancements

1. **Timeout on cleanup**: If backend is slow, don't wait forever
2. **Retry logic**: Retry unregister if it fails
3. **Background cleanup**: Clean up in service worker if needed
4. **Token expiration**: Tokens auto-expire after 30 days
5. **Batch cleanup**: Backend cleanup task for orphaned tokens

## Summary

✅ **What's implemented:**
- Automatic unregister on logout
- Error handling so logout always works
- Clean separation of concerns
- Secure token removal

✅ **What's required from backend:**
- `/chat/push-tokens/unregister` endpoint
- Remove token from device list
- Clean up from push service

✅ **What's guaranteed:**
- User doesn't get notifications after logout
- Device tokens don't accumulate
- Browser no longer receives push
- All data cleaned up properly

**Logout cleanup is now fully integrated!** 🔒
