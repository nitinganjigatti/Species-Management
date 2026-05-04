import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { useAntzAuth } from '@antzsoft/wso2-auth-web/react'
import client from 'src/lib/auth/wso2Client'
import { useAuth } from 'src/hooks/useAuth'

// Mounted once at the AuthProvider root. Detects the tab-reopen case
// (loading → unauthenticated) where the WSO2 silent restore failed because
// the refresh_token was revoked/expired, and fires an auto-logout.
//
// Routes through AuthContext.handleLogout (not the package's logout) so the
// auto-logout runs the same chain as the manual button:
//   - clear React + queryClient state
//   - client.logout() (revoke + _clearTokens of antz_auth_* keys)
//   - explicit removal of accessToken/role/userData/userDetails/selectedStore/selectedParivesh
//   - browser-redirect to WSO2 /oidc/logout so commonAuthId is actually killed
const Wso2SessionWatcher = () => {
  const { status } = useAntzAuth(client)
  const { logout } = useAuth()
  const prevStatus = useRef('idle')
  const firedRef = useRef(false)
  const toaster = async () => {
    await toast.error('Your session has expired. Please log in again.')
  }
  useEffect(() => {
    const wasLoading = prevStatus.current === 'loading'
    prevStatus.current = status

    if (firedRef.current) return
    if (!wasLoading || status !== 'unauthenticated') return
    if (typeof window === 'undefined') return

    // Manual logout already in progress — handleLogout sets this flag before
    // calling client.logout(). Skip the toast + auto-logout to avoid a
    // duplicate "session expired" message and a redundant second logout.
    if (sessionStorage.getItem('antz_manual_logout') === '1') {
      sessionStorage.removeItem('antz_manual_logout')
      firedRef.current = true

      return
    }

    const path = window.location.pathname || ''
    const search = window.location.search || ''
    const isOAuthFlow =
      path.includes('/callback') || path.includes('/change-password') || /[?&](code|state)=/.test(search)
    if (isOAuthFlow) return

    if (!localStorage.getItem('antz_auth_id_token')) return
    // toast.error('Your session has expired. Please log in again.')
    // toaster()

    firedRef.current = true

    // Single call — handleLogout chain already invokes client.logout() internally,
    // alongside React + queryClient + localStorage cleanup and the WSO2 redirect.
    localStorage.setItem('logout_reason', 'session_expired')
    // debugger
    logout()
  }, [status, logout])

  return null
}

export default Wso2SessionWatcher
