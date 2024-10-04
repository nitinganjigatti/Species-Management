// ** React Imports
import { createContext, useEffect, useState } from 'react'
import { read, readAsync, write } from '../lib/windows/utils'
import { callRefreshToken } from 'src/lib/api/auth'

import { usePharmacyContext } from './PharmacyContext'
import { usePariveshContext } from './PariveshContext'

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
  const { setSelectedParivesh, setOrganizationList } = usePariveshContext()
  const { selectedPharmacy, setSelectedPharmacy } = usePharmacyContext()

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
      const storedToken = window.localStorage.getItem(authConfig?.storageTokenKeyName)
      if (storedToken) {
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
                setSelectedPharmacy(storedPharmacy)
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
              write('role', resData?.roles?.role_name)
              write('userData', userData)

              setUser({ ...userData })
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
    localStorage.removeItem('selectedParivesh')

    debugger
    setUser(null)
    setUserData(null)
    setSelectedPharmacy('')
    setSelectedParivesh('')
    setOrganizationList([])
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
        if (response?.data?.message !== 'Invalid Username/Email or Password') {
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
          const redirectURL = returnUrl && returnUrl !== '/' ? returnUrl : '/'
          router.replace(redirectURL)
        } else {
          if (errorCallback) errorCallback(err)
        }
      })
      .catch(err => {
        if (errorCallback) errorCallback(err)
      })
  }

  const handleLogout = () => {
    setUser(null)
    setUserData(null)
    setSelectedPharmacy('')
    setSelectedParivesh('')
    setOrganizationList([])
    localStorage.removeItem('userData')
    localStorage.removeItem('userDetails')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('provider')
    localStorage.removeItem('selectedStore')
    localStorage.removeItem('selectedParivesh')
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
