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

const GuestGuard = props => {
  const { children, fallback } = props
  const auth = useAuth()
  const router = useSafeRouter()
  const wso2 = isWso2AuthEnabled()

  // Hook always runs; result only consumed in WSO2 mode.
  const { status } = useAntzAuth(client)

  useEffect(() => {
    if (!router.isReady) return

    // Wait for silent-restore before deciding to redirect — otherwise an
    // already-logged-in user briefly sees the login form on /login.
    if (wso2 && (status === 'idle' || status === 'loading')) return

    const hasSession = wso2
      ? status === 'authenticated'
      : !!window.localStorage.getItem('userData')

    if (hasSession) {
      router.replace('/')
    }
  }, [router.isReady, router.route, status, wso2])

  // While WSO2 is restoring, show fallback so the legacy login form doesn't
  // flash before the redirect-to-/ kicks in for an authenticated user.
  if (wso2 && (status === 'idle' || status === 'loading')) return fallback
  if (auth.loading || (!auth.loading && auth.user !== null)) return fallback

  return <>{children}</>
}

export default GuestGuard
