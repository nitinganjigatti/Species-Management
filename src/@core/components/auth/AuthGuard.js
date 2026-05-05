// ** React Imports
import { useEffect } from 'react'

// ** Next Import
import { useSafeRouter } from 'src/hooks/useSafeRouter'

// ** Hooks Import
import { useAuth } from 'src/hooks/useAuth'

// ** WSO2 Auth Client + Flag
import { useAntzAuth } from '@antzsoft/wso2-auth-web/react'
import client from 'src/lib/auth/wso2Client'
import { isWso2AuthEnabled } from 'src/lib/auth/authMode'

const AuthGuard = props => {
  const { children, fallback } = props

  const auth = useAuth()
  const router = useSafeRouter()
  const wso2 = isWso2AuthEnabled()

  // Always call the hook (React rules) — only read its result in WSO2 mode.
  // Session expiry is handled by Wso2SessionWatcher via onSessionExpired /
  // onDailyExpiryWarning callbacks — no status watching needed here.
  const { status } = useAntzAuth(client)

  useEffect(
    () => {
      if (!router.isReady) return

      // Wait for the package's silent-restore to finish before deciding.
      if (wso2 && (status === 'idle' || status === 'loading')) return

      // In WSO2 mode, ALL navigation to /login is handled elsewhere:
      //   - initAuthWso2  → initial load with no tokens
      //   - Wso2SessionWatcher.onSessionExpired → expired session
      //   - handleLogout → wso2HookLogout → window.location.href → WSO2 redirect
      // Redirecting here races with wso2HookLogout's window.location.href and
      // causes the login page to mount twice (client-side nav + full page reload).
      if (wso2) return

      const hasSession = !!window.localStorage.getItem('userData')

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
  const isInitialAuthLoading = wso2 && status === 'idle'
  if (isInitialAuthLoading) return fallback
  if (auth.loading || auth.user === null) return fallback

  return <>{children}</>
}

export default AuthGuard
