/**
 * /callback — dual purpose:
 *   1. WSO2 login redirect with `?code=...&state=...`
 *        → client.handleCallback() exchanges code for tokens
 *        → hydrateBackendSession() bootstraps the Antz session via /api/v2/auth/session
 *        → push user + userData into AuthContext state (prevents AuthGuard spinner-lock)
 *        → redirect to returnUrl
 *
 *   2. WSO2 post-logout landing (no `code` param)
 *        → skip token exchange
 *        → redirect straight to /login
 *
 * WSO2 Console currently has only /callback registered as an Authorized Redirect URL,
 * so postLogoutRedirectUri = NEXT_PUBLIC_WSO2_REDIRECT_URI (see wso2Client.js).
 * This page disambiguates based on whether the URL has a `code` query param.
 */
import { useEffect, useRef, useState } from 'react'
import { useSafeRouter } from 'src/hooks/useSafeRouter'
import BlankLayout from 'src/@core/layouts/BlankLayout'
import Spinner from 'src/@core/components/spinner'
import client from 'src/lib/auth/wso2Client'
import { hydrateBackendSession } from 'src/lib/auth/wso2Hydrate'
import { useAuth } from 'src/hooks/useAuth'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { readAsync } from 'src/lib/windows/utils'
import toast from 'react-hot-toast'

const CallbackPage = () => {
  const router = useSafeRouter()
  const auth = useAuth()
  const { setSelectedPharmacy } = usePharmacyContext()
  const [error, setError] = useState(null)

  // React 18 Strict Mode mounts effects twice in dev — and OAuth authorization
  // codes are single-use. A second handleCallback() would 400 invalid_grant
  // and bounce the user to /login with an error.
  const didRun = useRef(false)

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true
    async function complete() {
      if (typeof window === 'undefined') return

      const params = new URLSearchParams(window.location.search)
      const authError = params.get('error')
      const errorDescription = params.get('error_description')
      const hasAuthCode = params.has('code')

      // 1. WSO2 returned an error (user denied consent, invalid client, etc.)
      //    e.g. /callback?error=access_denied&error_description=...
      if (authError) {
        const msg = errorDescription || authError
        console.error('[callback] WSO2 returned error:', authError, errorDescription)
        setError(msg)
        toast.error(msg)
        setTimeout(() => router.replace(`/login?error=${encodeURIComponent(msg)}`), 2000)

        return
      }

      // 2. Post-logout landing: no `code`, no `error` → bounce to /login.
      if (!hasAuthCode) {
        router.replace('/login')

        return
      }

      // 3. Normal login callback — exchange code for tokens, then hydrate backend.
      //
      // Two stages with separate error handling, matching the sample-nextjs-
      // client-antz-auth behavior: handleCallback() success means the user is
      // signed in at WSO2 level, regardless of whether the Antz backend
      // bootstrap succeeds. Failing hydrate should NOT bounce the user back
      // to /login — that loses the just-completed WSO2 session and creates a
      // "I signed in but get sent back to login" UX. Instead, log the hydrate
      // error and proceed; AuthContext.initAuthWso2 will re-attempt hydrate
      // when the user actually navigates somewhere that needs it.
      try {
        await client.handleCallback()
        console.info('[callback] handleCallback succeeded — tokens written to storage')
      } catch (err) {
        console.error('[callback] handleCallback failed:', err)
        const msg = err instanceof Error ? err.message : 'Authentication failed'
        setError(msg)
        toast.error(msg)
        setTimeout(() => router.replace(`/login?error=${encodeURIComponent(msg)}`), 2000)

        return
      }

      // Stage 2 — populate AuthContext.user via the backend bootstrap. If it
      // fails, the user has a valid WSO2 session but cannot establish an Antz
      // session (backend down, user not mapped in antz_users.wso2_id, etc.).
      // Letting them in on id_token claims alone hides the failure and gives
      // them a fake "admin" role — instead, terminate the WSO2 session so
      // they're forced to re-auth (and we don't loop on the next visit).
      try {
        const { userData, resData } = await hydrateBackendSession()
        // Sync pharmacy context BEFORE setting user — nav renders immediately
        // after setUser and reads selectedPharmacy from context. Without this,
        // reconcilePharmacyStorage (called inside hydrateBackendSession) only
        // writes localStorage but never updates the React context, so the nav
        // renders with empty selectedPharmacy and shows only master items.
        const storedPharmacy = await readAsync('selectedStore')
        if (storedPharmacy) setSelectedPharmacy(storedPharmacy)
        if (auth?.setUser) auth.setUser({ ...userData })
        if (auth?.setUserData) auth.setUserData({ ...resData })
        console.info('[callback] hydrate ok, auth.user set:', userData?.email)
      } catch (err) {
        console.error('[callback] hydrate failed — logging out:', err?.message)
        const msg = err instanceof Error ? err.message : 'Could not establish session'
        toast.error(msg)
        try {
          await client.logout()
        } catch (e) {
          console.error('[callback] client.logout failed during hydrate-failure cleanup:', e)
          router.replace('/login')
        }

        return
      }

      if (auth?.setLoading) auth.setLoading(false)

      const returnUrl = sessionStorage.getItem('returnUrl') || '/'
      sessionStorage.removeItem('returnUrl')
      console.info('[callback] redirecting to:', returnUrl)
      router.replace(returnUrl)
    }

    complete()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return (
      <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: '#d32f2f' }}>Error: {error}</p>
      </main>
    )
  }

  return <Spinner />
}

CallbackPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
CallbackPage.guestGuard = true
CallbackPage.authGuard = false

export default CallbackPage
