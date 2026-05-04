// ** React Imports
import { createContext, useEffect, useState } from 'react'
import { read, readAsync, write } from '../lib/windows/utils'
import { callRefreshToken } from 'src/lib/api/auth'

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

import { useQueryClient } from '@tanstack/react-query'
import { useHospital } from './HospitalContext'
import { useLanguage } from './LanguageContext'
import { getDeviceInfo, setLastLoggedUser, saveDeviceId } from 'src/utility/deviceInfo'
import { legacyLogin } from 'src/lib/api/login'
import { useAntzAuth } from '@antzsoft/wso2-auth-web/react'

const base_url = `${process.env.NEXT_PUBLIC_API_BASE_URL}`

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
  const { setSelectedParivesh, setOrganizationList } = usePariveshContext()
  const { selectedPharmacy, setSelectedPharmacy } = usePharmacyContext()
  const { updateSelectedHospital, updateHospitalStats } = useHospital()
  const { resetLanguage } = useLanguage()

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
            debugger
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
          router.replace('/login')
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
    debugger
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
      setUserData({ ...data })
      setUser({ ...nextUser })

      await Promise.all([saveDeviceId(), setLastLoggedUser(data?.user?.user_id, data?.user?.user_email)])
      await reconcilePharmacy(data)

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
      // Tell Wso2SessionWatcher to skip its expiry toast/auto-logout —
      // wso2HookLogout flips package status through 'unauthenticated'
      // which would otherwise fire a duplicate "session expired" toast.
      try {
        sessionStorage.setItem('antz_manual_logout', '1')
      } catch {}

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

      try {
        preserveDeviceInfo()
      } catch {}
      sessionStorage.clear()
      setUser(null)
      setUserData(null)
      router.push('/login')
    }
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
    logout: handleLogout
  }

  return (
    <AuthContext.Provider value={values}>
      {isWso2AuthEnabled() && <Wso2SessionWatcher />}
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext, AuthProvider }
