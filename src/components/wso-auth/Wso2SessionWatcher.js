import { useEffect } from 'react'
import { useAntzAuth } from '@antzsoft/wso2-auth-web/react'
import client, { setDailyExpiryWarningHandler } from 'src/lib/auth/wso2Client'
import { useAuth } from 'src/hooks/useAuth'

// Mounted once at the AuthProvider root.
// Handles both session expiry scenarios — no status watching.
//
// --- v1.4.5 SDK change ---
// onDailyExpiryWarning moved from useAntzAuth() options → AntzAuthClient config.
// This watcher now wires authLogout into the client singleton via
// setDailyExpiryWarningHandler() on mount so the plain-JS client can call
// the React logout function without importing hooks directly.
//
// onSessionExpired   — refresh token already dead (tab reopen after expiry).
//                      SDK has already cleared tokens before this fires.
//                      Stays in useAntzAuth() options (unchanged from v1.3.6).
//
// onDailyExpiryWarning — refresh token still alive but expiring within 24 h
//                        (daily 5 AM check). Now handled via client config
//                        bridge (setDailyExpiryWarningHandler) below.
//                        Must call logout() to revoke before redirecting.
//
// Both paths: set logout_reason so the login page shows the inline expiry
// message, then call auth.logout() (AuthContext) which runs the full chain:
// queryClient clear → localStorage cleanup → client.logout() → WSO2 redirect.
const Wso2SessionWatcher = () => {
  const { logout: authLogout } = useAuth()

  // --- v1.4.5: wire onDailyExpiryWarning into the client singleton ---
  // setDailyExpiryWarningHandler registers authLogout so the AntzAuthClient
  // config callback (_onDailyExpiryWarning in wso2Client.js) can call it
  // when the daily 5 AM expiry check fires. Cleared on unmount so a stale
  // reference is never held after this component is destroyed.
  useEffect(() => {
    setDailyExpiryWarningHandler(() => {
      localStorage.setItem('logout_reason', 'session_expired')
      authLogout()
    })

    // Cleanup: reset to no-op so the singleton doesn't hold a stale closure
    return () => setDailyExpiryWarningHandler(() => {})
  }, [authLogout])

  // onSessionExpired stays in useAntzAuth() — no change from v1.3.6.
  // Fires when RT is already dead (e.g. tab reopen after long idle);
  // SDK has already cleared antz_auth_* tokens before this fires.
  useAntzAuth(client, {
    onSessionExpired: () => {
      localStorage.setItem('logout_reason', 'session_expired')
      authLogout()
    }

    // v1.3.6 — onDailyExpiryWarning was here; moved to AntzAuthClient config in v1.4.5:
    // onDailyExpiryWarning: () => {
    //   localStorage.setItem('logout_reason', 'session_expired')
    //   authLogout()
    // }
  })

  return null
}

export default Wso2SessionWatcher
