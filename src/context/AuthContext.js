// ** React Imports
import { createContext, useEffect, useState } from 'react'
import { read, readAsync, write } from '../lib/windows/utils'
import { callRefreshToken } from 'src/lib/api/auth'

import { usePharmacyContext } from './PharmacyContext'

// ** Next Import
import { useRouter } from 'next/router'

// ** Axios
import axios from 'axios'

// ** Config
import authConfig from 'src/configs/auth'

const base_url = `${process.env.NEXT_PUBLIC_API_BASE_URL}`

// ** Defaults
const defaultProvider = {
  user: null,
  userData: null,
  loading: true,
  setUserData: () => null,
  setUser: () => null,
  setLoading: () => Boolean,
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

  const { selectedValue, setSelectedValue } = usePharmacyContext()

  // ** Hooks
  const router = useRouter()
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
      const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
      if (storedToken) {
        const userObj = read('userData')
        if (userObj) {
          const resData = await callRefreshToken()
          setLoading(false)
          if (resData.token) {
            // console.log('refreshed', resData?.modules?.pharmacy_data?.pharmacy)
            const options = resData?.modules?.pharmacy_data?.pharmacy
            const storedPharmacy = await readAsync('selectedStore')

            const foundStored = () => {
              return options.some(item => item?.id === storedPharmacy?.id)
            }
            if (storedPharmacy === '' || foundStored() === false) {
              write('selectedStore', options[0])

              setSelectedValue(options[0])
            } else {
              setSelectedValue(storedPharmacy)
            }

            const userData = {
              email: resData.user.user_email,
              fullName: resData.user.user_first_name,
              lastName: resData.user.user_last_name,
              role: 'admin',
              id: resData.roles.role_id,

              // role: resData.roles.role_name,
              username: resData.user.user_first_name
            }
            write('role', resData.roles.role_name)
            write('userData', userData)

            setUser({ ...userData })
            setUserData({ ...resData })
          } else {
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
      }
    }
    initAuth()
  }, [])

  const logOutUser = () => {
    localStorage.removeItem('userData')
    localStorage.removeItem('userDetails')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('provider')
    localStorage.removeItem('selectedStore')
    setUser(null)
    setUserData(null)
    setLoading(false)
  }

  const handleLogin = (params, errorCallback) => {
    // dispatch(fetchData(params))

    const url = `${base_url}v1/auth/login`

    //   axios
    //     .post(authConfig.loginEndpoint, params)
    //     .then(async response => {
    //       params.rememberMe
    //         ? window.localStorage.setItem(authConfig.storageTokenKeyName, response.data.accessToken)
    //         : null
    //       const returnUrl = router.query.returnUrl
    //       setUser({ ...response.data.userData })
    //       params.rememberMe ? window.localStorage.setItem('userData', JSON.stringify(response.data.userData)) : null
    //       const redirectURL = returnUrl && returnUrl !== '/' ? returnUrl : '/'
    //       router.replace(redirectURL)
    //     })
    //     .catch(err => {
    //       if (errorCallback) errorCallback(err)
    //     })
    // }
    axios
      .post(url, params)
      .then(async response => {
        console.log('login response', response.data)
        window.localStorage.setItem(authConfig.storageTokenKeyName, response.data.token)
        const returnUrl = router.query.returnUrl

        // setUser({ ...response.data.data.providerProfile })
        const resData = response.data
        write('userDetails', resData)

        const userData = {
          email: resData.user.user_email,
          fullName: resData.user.user_first_name,
          lastName: resData.user.user_last_name,
          role: 'admin',
          id: resData.roles.role_id,

          // role: resData.roles.role_name,
          username: resData.user.user_first_name
        }
        write('role', resData.roles.role_name)
        write('userData', userData)
        setUserData({ ...resData })
        setUser({ ...userData })

        const redirectURL = returnUrl && returnUrl !== '/' ? returnUrl : '/'
        router.replace(redirectURL)
      })
      .catch(err => {
        if (errorCallback) errorCallback(err)
      })
  }

  const handleLogout = () => {
    setUser(null)
    setUserData(null)
    localStorage.removeItem('userData')
    localStorage.removeItem('userDetails')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('provider')
    window.localStorage.removeItem(authConfig.storageTokenKeyName)
    router.push('/login')
  }

  const values = {
    user,
    userData,
    loading,
    setUser,
    setUserData,
    setLoading,
    login: handleLogin,
    logout: handleLogout
  }

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider }
