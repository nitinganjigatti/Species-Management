import { useAntzAuth } from '@antzsoft/wso2-auth-web/react'
import client from 'src/lib/auth/wso2Client'
import { useAuth } from 'src/hooks/useAuth'

// Mounted once at the AuthProvider root.
// Handles both session expiry scenarios via SDK callbacks — no status watching.
//
// onSessionExpired   — refresh token already dead (tab reopen after expiry).
//                      SDK has already cleared tokens before this fires.
// onDailyExpiryWarning — refresh token still alive but expiring within 24 h
//                        (daily 5 AM check). Must call logout() to revoke first.
//
// Both paths: set logout_reason so the login page shows the inline expiry
// message, then call auth.logout() (AuthContext) which runs the full chain:
// queryClient clear → localStorage cleanup → client.logout() → WSO2 redirect.
const Wso2SessionWatcher = () => {
  const { logout: authLogout } = useAuth()

  useAntzAuth(client, {
    onSessionExpired: () => {
      localStorage.setItem('logout_reason', 'session_expired')
      authLogout()
    },
    onDailyExpiryWarning: () => {
      localStorage.setItem('logout_reason', 'session_expired')
      authLogout()
    }
  })

  return null
}

export default Wso2SessionWatcher
