// ** React Imports
import { createContext, useEffect, useState } from 'react'
import { read, readAsync, write } from '../lib/windows/utils'
import { callRefreshToken } from 'src/lib/api/auth'
import { verifyGeofence } from 'src/lib/api/geofence'

import { usePharmacyContext } from './PharmacyContext'
import { usePariveshContext } from './PariveshContext'

// ** Next Import - Use safe router for both Page Router and App Router compatibility
import { useSafeRouter } from 'src/hooks/useSafeRouter'

// ** Axios
import axios from 'axios'

// ** Config
import authConfig from 'src/configs/auth'
import i18n from 'src/configs/i18n'
import { useQueryClient } from '@tanstack/react-query'
import { useHospital } from './HospitalContext'
import { useLanguage } from './LanguageContext'
import { getDeviceInfo, setLastLoggedUser, saveDeviceId } from 'src/utility/deviceInfo'

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
  // const dispatch = useDispatch()

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

  // ** Hooks
  const router = useSafeRouter()
  useEffect(() => {
    const initAuth = async () => {
      //   const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
      //   if (storedToken) {
      //     setLoading(true)
      //     await axios
      //       .get(authConfig.meEndpoint, {
      //         headers: {
      //           Authorization: storedToken
      //         }
      //       })
      //       .then(async response => {
      //         setLoading(false)
      //         setUser({ ...response.data.userData })
      //       })
      //       .catch(() => {
      //         localStorage.removeItem('userData')
      //         localStorage.removeItem('refreshToken')
      //         localStorage.removeItem('accessToken')
      //         setUser(null)
      //         setLoading(false)
      //         if (authConfig.onTokenExpiration === 'logout' && !router.pathname.includes('login')) {
      //           router.replace('/login')
      //         }
      //       })
      //   } else {
      //     setLoading(false)
      //   }
      // }
      // initAuth()
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const storedToken = window.localStorage.getItem(authConfig?.storageTokenKeyName)
      if (storedToken) {
        // setLoading(true)
        const userObj = read('userData')
        if (userObj) {
          try {
            const resData = await callRefreshToken()
            setLoading(false)
            if (resData.token) {
              const options = resData?.modules?.pharmacy_data?.pharmacy
              const storedPharmacy = await readAsync('selectedStore')

              const foundStored = () => {
                if (options?.length > 0 && storedPharmacy !== undefined) {
                  return options.some(item => item?.id === storedPharmacy?.id)
                }

                return false
              }

              const findSelectedPharmacy = () => {
                let foundPharmacy = ''
                if (options?.length > 0 && storedPharmacy !== undefined) {
                  foundPharmacy = options.find(item => item.id === storedPharmacy?.id)
                }

                const areArraysEqual =
                  JSON.stringify(foundPharmacy?.permission) === JSON.stringify(storedPharmacy?.permission)

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

                // findSelectedPharmacy()
              }

              const userData = {
                email: resData?.user?.user_email,
                fullName: resData?.user?.user_first_name,
                lastName: resData?.user?.user_last_name,
                role: 'admin',
                id: resData?.roles?.role_id,

                // role: resData.roles.role_name,
                username: resData?.user?.user_first_name
              }
              write('userDetails', resData)
              write('role', resData?.roles?.role_name)
              write('userData', userData)

              setUser({ ...userData })
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
    initAuth()

    const handleSessionExpired = () => {
      localStorage.setItem('session_expired', 'true')
      handleLogout()
    }

    window.addEventListener('session-expired', handleSessionExpired)

    return () => {
      window.removeEventListener('session-expired', handleSessionExpired)
    }
  }, [])

  const logOutUser = async () => {
    // localStorage.removeItem('userData')
    // localStorage.removeItem('userDetails')
    // localStorage.removeItem('refreshToken')
    // localStorage.removeItem('accessToken')
    // localStorage.removeItem('provider')
    // localStorage.removeItem('selectedStore')
    // localStorage.removeItem('selectedParivesh')

    // 1. Cancel all ongoing queries FIRST and clear the cache (prevents race conditions)
    await queryClient.cancelQueries()
    queryClient.clear()

    // 2. Clear ALL TanStack Query cache (queries + mutations) -> Fallback
    queryClient.getQueryCache().clear()
    queryClient.getMutationCache().clear()

    // 3. Clear localStorage and sessionStorage (preserve device data)
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

    // 4. Clear all state
    setUser(null)
    setUserData(null)
    setSelectedPharmacy('')
    setSelectedParivesh('')
    setOrganizationList([])
    setLoading(false)
    updateSelectedHospital(null)
    updateHospitalStats(null)

    // 5. Remove the specific auth token (optional, but good for consistency)
    window.localStorage.removeItem(authConfig.storageTokenKeyName)

    // 6. Reset language to default (mirrors mobile app logout behavior)
    await resetLanguage()
  }

  const handleLogin = async (params, errorCallback) => {
    // dispatch(fetchData(params))
    setLoginLoading(true)

    const url = `${base_url}v1/auth/login`

    // Get device details for login tracking
    let deviceDetails = {}
    try {
      deviceDetails = await getDeviceInfo(params?.email)
    } catch (err) {
      console.error('Failed to get device info:', err)
    }

    const loginParams = {
      ...params
      // device_details: deviceDetails
    }
    console.log('device details for login:', deviceDetails)
    axios
      .post(url, loginParams)
      .then(async response => {
        setLoginLoading(false)

        if (
          response?.data?.message !== 'Invalid Username/Email or Password' &&
          response?.data?.message !== 'This Account Has Been Suspended !!' &&
          response?.data?.success !== false
        ) {
          console.log('login response', response?.data)
          window.localStorage.setItem(authConfig?.storageTokenKeyName, response?.data?.token)
          const returnUrl = router.query.returnUrl

          // setUser({ ...response.data.data.providerProfile })
          const resData = response?.data
          write('userDetails', resData)

          const userData = {
            email: resData?.user?.user_email,
            fullName: resData?.user?.user_first_name,
            lastName: resData?.user?.user_last_name,
            role: 'admin',
            id: resData?.roles?.role_id,

            // role: resData.roles.role_name,
            username: resData?.user?.user_first_name
          }
          write('role', resData?.roles?.role_name)
          write('userData', userData)
          setUserData({ ...resData })
          setUser({ ...userData })

          // Fetch API translations now that user is authenticated
          loadLanguage(i18n.language || 'en-IN')

          // Save device ID (plain text hash) and last logged user (encrypted) ONLY after successful login
          await Promise.all([saveDeviceId(), setLastLoggedUser(resData?.user?.user_id, resData?.user?.user_email)])

          // ******** Pharmcy
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

            const areArraysEqual =
              JSON.stringify(foundPharmacy?.permission) === JSON.stringify(storedPharmacy?.permission)

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
            setSelectedPharmacy(storedPharmacy)
          }

          /*********pharmacy */

          // Geofence verification: must succeed before the user enters the app.
          // On rejection we do a MINIMAL cleanup — wipe only the freshly-written
          // auth state. We deliberately DON'T call the full logOutUser() because:
          //   - There's no real session to log out of (verify ran post-login,
          //     before the user ever entered the app).
          //   - logOutUser() does heavy cascade work: localStorage.clear,
          //     TanStack cache flush, language reset, pharmacy/parivesh/hospital
          //     resets — none of which is needed when nothing was loaded yet.
          //   - It also dispatches `session_expired` semantics which would show
          //     the wrong toast on the login page.
          // 401 (real token failure) is the only thing that triggers full logout.
          let geofenceOk = true
          const rejectGeofence = async payload => {
            geofenceOk = false
            // Discard the just-written token + user state. Keep everything else.
            localStorage.removeItem(authConfig.storageTokenKeyName)
            localStorage.removeItem('userData')
            localStorage.removeItem('userDetails')
            setUser(null)
            setUserData(null)
            setGeofenceLoginError(payload)
            if (errorCallback) errorCallback(payload)
          }

          try {
            const verifyRes = await verifyGeofence()
            if (verifyRes?.success === false) {
              await rejectGeofence({
                kind: 'geofence',
                code: verifyRes?.error || 'geofence_failed',
                message: verifyRes?.message || 'Geofence check failed',
                data: verifyRes?.data || {}
              })
            }
          } catch (e) {
            // GPS error (permission denied / timeout / unsupported) — same outcome
            await rejectGeofence({
              kind: 'geofence',
              code: e?.code || 'gps_error',
              message: e?.message || 'Could not verify your location',
              data: {}
            })
          }

          if (geofenceOk) {
            setGeofenceLoginError(null)
            const redirectURL = returnUrl && returnUrl !== '/' ? returnUrl : '/'
            router.replace(redirectURL)
          }
        } else {
          if (errorCallback) errorCallback(response?.data?.message)
        }
      })
      .catch(err => {
        setLoginLoading(false)
        if (errorCallback) errorCallback(err)
      })
  }

  const handleLogout = async () => {
    try {
      // 1. Cancel all ongoing queries FIRST and clear the cache (prevents race conditions)
      await queryClient.cancelQueries()
      queryClient.clear()

      // 2. Clear ALL TanStack Query cache (queries + mutations)
      queryClient.getQueryCache().clear()
      queryClient.getMutationCache().clear()

      // 3. Clear localStorage and sessionStorage
      // Preserve device_id (plain text hash) and last_logged_user (encrypted)
      // Cookie fallback survives localStorage.clear() automatically
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

      // 4. Clear all state
      setUser(null)
      setUserData(null)
      setSelectedPharmacy('')
      setSelectedParivesh('')
      setOrganizationList([])
      updateSelectedHospital(null)
      updateHospitalStats(null)

      // 5. Remove the specific auth token (optional, but good for consistency)
      window.localStorage.removeItem(authConfig.storageTokenKeyName)

      // 6. Reset language to default (mirrors mobile app logout behavior)
      await resetLanguage()

      // 7. Navigate to login
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

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider }
