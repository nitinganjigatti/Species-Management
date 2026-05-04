// ** React Imports
import { useEffect, useRef } from 'react'

// ** Next Import
import { useSafeRouter } from 'src/hooks/useSafeRouter'

// ** Hooks Import
import { useAuth } from 'src/hooks/useAuth'

// ** WSO2 Auth Client + Flag
import toast from 'react-hot-toast'
import { useAntzAuth } from '@antzsoft/wso2-auth-web/react'
import client from 'src/lib/auth/wso2Client'
import { isWso2AuthEnabled } from 'src/lib/auth/authMode'

const AuthGuard = props => {
  const { children, fallback } = props

  const auth = useAuth()
  const router = useSafeRouter()
  const wso2 = isWso2AuthEnabled()

  // Always call the hook (React rules) — only read its result in WSO2 mode.
  // In non-SSO mode, status flips to 'unauthenticated' quickly with no side
  // effects (no tokens to restore), so we ignore it.
  const { status } = useAntzAuth(client)

  // Mid-session auto-logout — equivalent to sample-nextjs-client-antz-auth's
  // dashboard pattern. AuthGuard's useAntzAuth instance mounts AFTER login
  // (when tokens exist), so its proactive refresh timer runs and its status
  // flips from 'authenticated' to 'unauthenticated' the moment the silent
  // refresh fails with invalid_grant. We catch that transition immediately
  // here — no polling delay, no waiting for expires_at to lapse.
  //
  // Route through AuthContext.handleLogout (NOT the package's logout) so the
  // auto-logout clears app-specific localStorage keys (accessToken/role/
  // selectedStore/userData/userDetails) in addition to antz_auth_*.
  const wasAuthRef = useRef(false)
  const firedRef = useRef(false)
  useEffect(() => {
    if (!wso2) return
    if (status === 'authenticated') {
      wasAuthRef.current = true
    } else if (status === 'unauthenticated' && wasAuthRef.current && !firedRef.current) {
      firedRef.current = true
      toast.error('Your session has expired. Please log in again.', { duration: 2500 })
      auth.logout()
    }
  }, [wso2, status, auth])

  useEffect(
    () => {
      if (!router.isReady) return

      // Wait for the package's silent-restore to finish before deciding.
      if (wso2 && (status === 'idle' || status === 'loading')) return

      const hasSession = wso2
        ? status === 'authenticated'
        : !!window.localStorage.getItem('userData')

      if (auth.user === null && !hasSession) {
        if (router.asPath !== '/') {
          router.replace({
            pathname: '/login',
            query: { returnUrl: router.asPath }
          })
        } else {
          router.replace('/login')
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.route, status]
  )

  // Hold the fallback while WSO2 silent-restore is in flight on FIRST load
  // (idle / loading before we've ever been authenticated). Once we've been
  // authenticated at least once, ignore subsequent 'loading' transitions —
  // they happen during silent token refresh every ~110s and unmounting
  // children would tear down all React Query observers and cause every
  // dashboard API to refetch on remount.
  const isInitialAuthLoading = wso2 && (status === 'idle' || (status === 'loading' && !wasAuthRef.current))
  if (isInitialAuthLoading) return fallback
  if (auth.loading || auth.user === null) return fallback

  return <>{children}</>
}

export default AuthGuard
