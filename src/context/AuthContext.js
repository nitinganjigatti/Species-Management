// ** React Imports
import { createContext, useEffect, useState } from 'react'
import { read, readAsync, write } from '../lib/windows/utils'
import { callRefreshToken } from 'src/lib/api/auth'
import { verifyGeofence } from 'src/lib/api/geofence'

import { usePharmacyContext } from './PharmacyContext'
import { usePariveshContext } from './PariveshContext'

// ** Next Import - Use safe router for both Page Router and App Router compatibility
import { useSafeRouter } from 'src/hooks/useSafeRouter'

// ** Config
import authConfig from 'src/configs/auth'

// ** WSO2 Auth Client
import client from 'src/lib/auth/wso2Client'
import { isWso2AuthEnabled } from 'src/lib/auth/authMode'
import { hydrateBackendSession } from 'src/lib/auth/wso2Hydrate'
import Wso2SessionWatcher from 'src/components/wso-auth/Wso2SessionWatcher'

import i18n from 'src/configs/i18n'
import { useQueryClient } from '@tanstack/react-query'
import { useHospital } from './HospitalContext'
import { useLanguage } from './LanguageContext'
import { getDeviceInfo, setLastLoggedUser, saveDeviceId } from 'src/utility/deviceInfo'
import { legacyLogin } from 'src/lib/api/login'
import { useAntzAuth } from '@antzsoft/wso2-auth-web/react'

// Chat-core disconnect helpers — called at the top of handleLogout so the
// socket dies cleanly before either WSO2 hand-off or legacy router.push.
// Belt-and-suspenders: `useChatClient`'s effect cleanup also runs when
// `auth.userData.user` clears, but the WSO2 path navigates the page before
// React cleanup finishes and the legacy happy path doesn't flip auth state.
import { disconnectSocket as chatDisconnectSocket } from '@antzsoft/chat-core'
import { disposeChatClient as chatDisposeClient } from 'src/lib/chat/client'

const base_url = `${process.env.NEXT_PUBLIC_API_BASE_URL}`
// const base_url = process.env.NODE_ENV === 'development' ? '/api/' : `${process.env.NEXT_PUBLIC_API_BASE_URL}`

// ** Defaults
const defaultProvider = {
  user: null,
  userData: null,
  loading: true,
  loginLoading: false,
  setUserData: () => null,
  setUser: () => null,
  setLoading: () => Boolean,
  setLoginLoading: () => Boolean,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve()
}
const AuthContext = createContext(defaultProvider)

const AuthProvider = ({ children }) => {
  // ** States
  const [user, setUser] = useState(defaultProvider.user)
  const [userData, setUserData] = useState(defaultProvider.userData)
  const [loading, setLoading] = useState(defaultProvider.loading)
  const [loginLoading, setLoginLoading] = useState(defaultProvider.loginLoading)
  // Geofence soft-lock: token is still valid, but the user isn't physically inside the fence.
  // AuthGuard renders the lock banner; on successful re-verify the flag clears and the user
  // continues without re-authenticating.
  const [geofenceLocked, setGeofenceLocked] = useState(false)
  const [geofenceLockReason, setGeofenceLockReason] = useState(null)

  // Geofence rejection at login time. Survives the GuestGuard fallback swap that happens
  // when setUser briefly goes truthy then back to null during the verify→logOutUser flow.
  const [geofenceLoginError, setGeofenceLoginError] = useState(null)
  const { setSelectedParivesh, setOrganizationList } = usePariveshContext()
  const { selectedPharmacy, setSelectedPharmacy } = usePharmacyContext()
  const { updateSelectedHospital, updateHospitalStats } = useHospital()
  const { loadLanguage, resetLanguage } = useLanguage()

  const queryClient = useQueryClient()

  // Package hook's logout — flips status/user/accessToken in the package's
  // React state AND calls client.logout() (revoke + /oidc/logout + _clearTokens).
  // Used in handleLogout below for full package state cleanup.
  const { logout: wso2HookLogout } = useAntzAuth(client)

  // ** Hooks
  const router = useSafeRouter()

  // WSO2 session/auto-logout is handled by <Wso2SessionWatcher /> mounted
  // inside AuthGuard — it only runs after the user is authenticated, so
  // useAntzAuth sees tokens on mount and its proactive refresh timer actually
  // starts (mirrors the sample-nextjs-client-antz-auth dashboard pattern).

  const reconcilePharmacy = async resData => {
    const options = resData?.modules?.pharmacy_data?.pharmacy
    const storedPharmacy = await readAsync('selectedStore')

    const foundStored = () => {
      if (options?.length > 0 && storedPharmacy !== undefined && storedPharmacy !== null) {
        return options.some(item => item?.id === storedPharmacy?.id)
      }

      return false
    }

    const findSelectedPharmacy = () => {
      let foundPharmacy = ''
      if (options?.length > 0 && storedPharmacy !== undefined && storedPharmacy !== null) {
        foundPharmacy = options.find(item => item.id === storedPharmacy?.id)
      }

      const areArraysEqual = JSON.stringify(foundPharmacy?.permission) === JSON.stringify(storedPharmacy?.permission)

      if (areArraysEqual === false) {
        write('selectedStore', foundPharmacy)
        setSelectedPharmacy(foundPharmacy)
      }
    }

    findSelectedPharmacy()
    if (storedPharmacy === '' || foundStored() === false) {
      if (options?.length > 0) {
        write('selectedStore', options[0])
        setSelectedPharmacy(options[0])
      } else {
        localStorage.removeItem('selectedStore')
      }
    } else {
      setSelectedPharmacy(await readAsync('selectedStore'))
    }
  }

  useEffect(() => {
    const initAuthWso2 = async () => {
      if (client.isAuthenticated()) {
        // SSO equivalent of legacy callRefreshToken: always re-bootstrap on
        // page refresh so the backend Antz JWT in userDetails.token is fresh
        // and the user payload reflects current backend state (roles, modules,
        // etc. may have changed since last load).
        try {
          const { userData: userObj, resData } = await hydrateBackendSession()
          await reconcilePharmacy(resData)
          setUser({ ...userObj })
          setUserData({ ...resData })
          setLoading(false)
        } catch (err) {
          console.error('SSO refresh: hydrate failed:', err)
          clearLocalState()
          setLoading(false)
          // Terminate the WSO2 session too, otherwise the next /authorize
          // silently re-auths and the bootstrap loops forever. wso2HookLogout
          // delegates to client.logout() which does revoke + _clearTokens +
          // browser-redirect to /oidc/logout?id_token_hint=...
          try {
            await wso2HookLogout()
            // router.push('/login', {
            //   query: { returnUrl: router.asPath, message: 'Your session has expired. Please log in again.' }
            // })
          } catch (e) {
            console.error('wso2 hook logout failed during hydrate-failure cleanup:', e)
            router.replace('/login')
          }

          return
        }
      } else {
        setLoading(false)
        const path = router.pathname || ''
        if (!path.includes('login') && !path.includes('callback') && !path.includes('forgot-password')) {
          const asPath = router.asPath || ''
          router.replace(asPath && asPath !== '/' ? { pathname: '/login', query: { returnUrl: asPath } } : '/login')
        }
      }
    }

    const initAuthLegacy = async () => {
      const storedToken = window.localStorage.getItem(authConfig?.storageTokenKeyName)
      if (storedToken) {
        const userObj = read('userData')
        if (userObj) {
          try {
            const resData = await callRefreshToken()
            setLoading(false)
            if (resData.token) {
              await reconcilePharmacy(resData)

              const nextUser = {
                email: resData?.user?.user_email,
                fullName: resData?.user?.user_first_name,
                lastName: resData?.user?.user_last_name,
                role: 'admin',
                id: resData?.roles?.role_id,
                username: resData?.user?.user_first_name
              }
              write('userDetails', resData)
              write('role', resData?.roles?.role_name)
              write('userData', nextUser)

              setUser({ ...nextUser })
              setUserData({ ...resData })

              // Fetch API translations now that user is authenticated
              loadLanguage(i18n.language || 'en-IN')

              // Re-verify geofence on session restore. Token is valid, so we don't
              // log the user out — we soft-lock the UI via the AuthGuard. The user can
              // walk back inside and tap "Recheck location" to dismiss the lock without
              // re-authenticating. Verify runs in the background; failure flips the flag.
              try {
                const verifyRes = await verifyGeofence()
                if (verifyRes?.success === false) {
                  setGeofenceLockReason({
                    code: verifyRes?.error || 'geofence_failed',
                    message: verifyRes?.message || 'Geofence check failed',
                    data: verifyRes?.data || {}
                  })
                  setGeofenceLocked(true)
                }
              } catch (e) {
                setGeofenceLockReason({
                  code: e?.code || 'gps_error',
                  message: e?.message || 'Could not verify your location',
                  data: {}
                })
                setGeofenceLocked(true)
              }
            } else {
              logOutUser()
              router.replace('/login')
            }
          } catch (e) {
            console.log(e)
            logOutUser()
            router.replace('/login')
          }
        } else {
          logOutUser()
          if (authConfig.onTokenExpiration === 'logout' && !router.pathname.includes('login')) {
            router.replace('/login')
          }
        }
      } else {
        setLoading(false)
        logOutUser()
        router.replace('/login')
      }
    }

    if (isWso2AuthEnabled()) {
      initAuthWso2()
    } else {
      initAuthLegacy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps

    const handleSessionExpired = () => {
      localStorage.setItem('session_expired', 'true')
      handleLogout()
    }

    window.addEventListener('session-expired', handleSessionExpired)

    return () => {
      window.removeEventListener('session-expired', handleSessionExpired)
    }
  }, [])

  const clearLocalState = () => {
    setUser(null)
    setUserData(null)
    setSelectedPharmacy('')
    setSelectedParivesh('')
    setOrganizationList([])
    updateSelectedHospital(null)
    updateHospitalStats(null)
  }

  const logOutUser = async () => {
    await queryClient.cancelQueries()
    queryClient.clear()
    queryClient.getQueryCache().clear()
    queryClient.getMutationCache().clear()

    let deviceId
    try {
      deviceId = read('antz_device_id')
    } catch {
      deviceId = localStorage.getItem('antz_device_id')
    }
    const lastLoggedUser = localStorage.getItem('antz_last_logged_user')
    localStorage.clear()
    if (deviceId) write('antz_device_id', deviceId)
    if (lastLoggedUser) localStorage.setItem('antz_last_logged_user', lastLoggedUser)
    sessionStorage.clear()

    clearLocalState()
    setLoading(false)
    window.localStorage.clear()

    window.localStorage.removeItem(authConfig.storageTokenKeyName)
    await resetLanguage()
  }

  const handleLoginWso2 = async email => {
    const returnUrl = router.query?.returnUrl || '/'
    sessionStorage.setItem('returnUrl', returnUrl)
    await client.login({ loginHint: email })
    // await client.login()
  }

  // TEMPORARY: original handleLoginLegacy commented out due to CORS errors
  // when calling base_url directly. Replaced by handleLoginLegacyProxy below
  // which routes through legacyLogin against a same-origin relative path
  // (proxied via the next.config.js /api/* rewrite). Restore once CORS is fixed.
  // const handleLoginLegacy = async (params, errorCallback) => {
  //   setLoginLoading(true)
  //   const url = `${base_url}v1/auth/login`
  //
  //   let deviceDetails = {}
  //   try {
  //     deviceDetails = await getDeviceInfo(params?.email)
  //   } catch (err) {
  //     console.error('Failed to get device info:', err)
  //   }
  //
  //   const loginParams = { ...params }
  //   console.log('device details for login:', deviceDetails)
  //
  //   axios
  //     .post(url, loginParams)
  //     .then(async response => {
  //       setLoginLoading(false)
  //
  //       if (
  //         response?.data?.message !== 'Invalid Username/Email or Password' &&
  //         response?.data?.message !== 'This Account Has Been Suspended !!' &&
  //         response?.data?.success !== false
  //       ) {
  //         window.localStorage.setItem(authConfig?.storageTokenKeyName, response?.data?.token)
  //         const returnUrl = router.query.returnUrl
  //         const resData = response?.data
  //         write('userDetails', resData)
  //
  //         const nextUser = {
  //           email: resData?.user?.user_email,
  //           fullName: resData?.user?.user_first_name,
  //           lastName: resData?.user?.user_last_name,
  //           role: 'admin',
  //           id: resData?.roles?.role_id,
  //           username: resData?.user?.user_first_name
  //         }
  //         write('role', resData?.roles?.role_name)
  //         write('userData', nextUser)
  //         setUserData({ ...resData })
  //         setUser({ ...nextUser })
  //
  //         await Promise.all([saveDeviceId(), setLastLoggedUser(resData?.user?.user_id, resData?.user?.user_email)])
  //
  //         await reconcilePharmacy(resData)
  //
  //         const redirectURL = returnUrl && returnUrl !== '/' ? returnUrl : '/'
  //         router.replace(redirectURL)
  //       } else {
  //         if (errorCallback) errorCallback(response?.data?.message)
  //       }
  //     })
  //     .catch(err => {
  //       setLoginLoading(false)
  //       if (errorCallback) errorCallback(err)
  //     })
  // }

  const handleLoginLegacy = async (params, errorCallback) => {
    setLoginLoading(true)

    let deviceDetails = {}
    try {
      deviceDetails = await getDeviceInfo(params?.email)
    } catch (err) {
      console.error('Failed to get device info:', err)
    }
    console.log('device details for login:', deviceDetails)

    // Same-origin path — proxied to NEXT_PUBLIC_BASE_URL via next.config.js
    // rewrite (/api/:path* → ${backend}/api/:path*). Avoids CORS in dev.

    try {
      const data = await legacyLogin({
        email: params?.email,
        password: params?.password
      })
      setLoginLoading(false)

      // Only proceed when backend explicitly confirms success.
      if (data?.success !== true) {
        if (errorCallback) errorCallback(data?.message || 'Login failed')

        return
      }

      window.localStorage.setItem(authConfig?.storageTokenKeyName, data?.token)
      const returnUrl = router.query.returnUrl
      write('userDetails', data)

      const nextUser = {
        email: data?.user?.user_email,
        fullName: data?.user?.user_first_name,
        lastName: data?.user?.user_last_name,
        role: 'admin',
        id: data?.roles?.role_id,
        username: data?.user?.user_first_name
      }
      write('role', data?.roles?.role_name)
      write('userData', nextUser)
      await Promise.all([saveDeviceId(), setLastLoggedUser(data?.user?.user_id, data?.user?.user_email)])
      // reconcilePharmacy must run before setUser/setUserData — the nav renders
      // immediately after setUser and reads selectedPharmacy from context. If
      // pharmacy is reconciled after, the first render sees empty selectedPharmacy
      // and shows only master nav items (same issue as SSO login via /callback).
      await reconcilePharmacy(data)
      setUserData({ ...data })
      setUser({ ...nextUser })

      loadLanguage(i18n.language || 'en-IN')

      const redirectURL = returnUrl && returnUrl !== '/' ? returnUrl : '/'
      router.replace(redirectURL)
    } catch (err) {
      setLoginLoading(false)
      if (errorCallback) errorCallback(err)
    }
  }

  const handleLogin = (params, errorCallback) => {
    if (isWso2AuthEnabled()) {
      return handleLoginWso2(params?.email.trim())
    }

    return handleLoginLegacy(params, errorCallback)
  }

  const handleLogout = async () => {
    // debugger

    // Tear down the chat-core socket + SDK singleton before any other cleanup.
    // Runs synchronously so it completes before the WSO2 hand-off navigates
    // the page or the legacy path pushes /login. Defensive try/catch — chat
    // may not be initialized (e.g., user logging out while NEXT_PUBLIC_CHAT_API_URL
    // is missing) and we don't want a chat error to block the auth logout.
    try {
      chatDisconnectSocket()
    } catch (e) {
      console.warn('[auth] chat socket disconnect failed:', e)
    }
    try {
      chatDisposeClient()
    } catch (e) {
      console.warn('[auth] chat client dispose failed:', e)
    }

    const preserveDeviceInfo = () => {
      let deviceId
      try {
        deviceId = read('antz_device_id')
      } catch {
        deviceId = localStorage.getItem('antz_device_id')
      }
      const lastLoggedUser = localStorage.getItem('antz_last_logged_user')
      const logoutReason = localStorage.getItem('logout_reason')
      localStorage.clear()
      if (deviceId) write('antz_device_id', deviceId)
      if (lastLoggedUser) localStorage.setItem('antz_last_logged_user', lastLoggedUser)
      if (logoutReason) localStorage.setItem('logout_reason', logoutReason)
    }

    // WSO2 mode: package 1.2.7+ handles the full sign-out chain inside
    // client.logout() (revoke → _clearTokens → browser GET /oidc/logout
    // with id_token_hint → redirect to postLogoutRedirectUri). We just
    // do app-specific cleanup first and then hand off.
    if (isWso2AuthEnabled()) {
      // Clear React/cache state. None of these touch antz_auth_* tokens.
      try {
        await queryClient.cancelQueries()
        queryClient.clear()
        queryClient.getQueryCache().clear()
        queryClient.getMutationCache().clear()
        clearLocalState()
        await resetLanguage()
      } catch (e) {
        console.warn('Local cleanup before WSO2 logout failed:', e)
      }

      // Explicit removal of ONLY app-specific localStorage keys. We must NOT
      // call localStorage.clear() here — that would wipe antz_auth_refresh_token
      // and antz_auth_id_token before the package's logout can read them, and
      // the package would silently skip both the revoke POST and the GET
      // /oidc/logout navigation. antz_device_id and antz_last_logged_user are
      // intentionally not in this list, so they're preserved by default.
      try {
        ;['accessToken', 'role', 'selectedParivesh', 'selectedStore', 'userData', 'userDetails'].forEach(k =>
          localStorage.removeItem(k)
        )
      } catch {}

      sessionStorage.clear()

      // Hand off to the package — reads antz_auth_* (still present), revokes
      // the refresh token, clears antz_auth_* keys via _clearTokens(), then
      // browser-navigates to GET /oidc/logout?id_token_hint=... which actually
      // kills commonAuthId on WSO2.
      try {
        await wso2HookLogout()
      } catch (e) {
        console.warn('wso2 hook logout error (non-fatal):', e)
        window.location.href = '/login'
      }

      return
    }

    try {
      await queryClient.cancelQueries()
      queryClient.clear()
      queryClient.getQueryCache().clear()
      queryClient.getMutationCache().clear()

      preserveDeviceInfo()
      sessionStorage.clear()

      clearLocalState()

      await resetLanguage()

      window.localStorage.removeItem(authConfig.storageTokenKeyName)
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)

      // Fallback: Force clear everything even if something fails (preserve device data)
      let deviceId
      try {
        deviceId = read('antz_device_id')
      } catch {
        deviceId = localStorage.getItem('antz_device_id')
      }
      const lastLoggedUser = localStorage.getItem('antz_last_logged_user')
      localStorage.clear()
      if (deviceId) write('antz_device_id', deviceId)
      if (lastLoggedUser) localStorage.setItem('antz_last_logged_user', lastLoggedUser)
      sessionStorage.clear()
      setUser(null)
      setUserData(null)
      router.push('/login')
    }
  }

  // Re-run geofence verify (called from the lock banner's "Recheck location" button).
  // Throws on GPS errors so the banner can show a localized message; otherwise updates
  // the lock state silently and returns the verify response.
  const recheckGeofence = async () => {
    const verifyRes = await verifyGeofence()
    if (verifyRes?.success === false) {
      setGeofenceLockReason({
        code: verifyRes?.error || 'geofence_failed',
        message: verifyRes?.message || 'Geofence check failed',
        data: verifyRes?.data || {}
      })
      setGeofenceLocked(true)
    } else {
      setGeofenceLockReason(null)
      setGeofenceLocked(false)
    }

    return verifyRes
  }

  const values = {
    user,
    userData,
    loading,
    loginLoading,
    setUser,
    setUserData,
    setLoading,
    setLoginLoading,
    login: handleLogin,
    logout: handleLogout,
    geofenceLocked,
    geofenceLockReason,
    recheckGeofence,
    geofenceLoginError,
    setGeofenceLoginError,
    clearGeofenceLoginError: () => setGeofenceLoginError(null)
  }

  return (
    <AuthContext.Provider value={values}>
      {isWso2AuthEnabled() && <Wso2SessionWatcher />}
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext, AuthProvider }
