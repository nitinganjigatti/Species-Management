// ** Next Imports
import Head from 'next/head'
import { Router } from 'next/router'

// ** Loader Import
import NProgress from 'nprogress'

// ** Emotion Imports
import { CacheProvider } from '@emotion/react'

// ** Config Imports
// import 'src/configs/i18n'
import { defaultACLObj } from 'src/configs/acl'
import themeConfig from 'src/configs/themeConfig'

// ** Fake-DB Import
// import 'src/@fake-db'

// ** Third Party Import
import { Toaster } from 'react-hot-toast'

// ** Component Imports
import UserLayout from 'src/layouts/UserLayout'
import AclGuard from 'src/@core/components/auth/AclGuard'
import ThemeComponent from 'src/@core/theme/ThemeComponent'
import AuthGuard from 'src/@core/components/auth/AuthGuard'
import GuestGuard from 'src/@core/components/auth/GuestGuard'

// ** Spinner Import
import Spinner from 'src/@core/components/spinner'

// ** Contexts
import { AuthProvider } from 'src/context/AuthContext'
import { SettingsConsumer, SettingsProvider } from 'src/@core/context/settingsContext'

// ** Styled Components
import ReactHotToast from 'src/@core/styles/libs/react-hot-toast'

// ** Utils Imports
import { createEmotionCache } from 'src/@core/utils/create-emotion-cache'

// ** Prismjs Styles
import 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'

// ** React Perfect Scrollbar Style
import 'react-perfect-scrollbar/dist/css/styles.css'
import 'src/iconify-bundle/icons-bundle-react'

// ** Global css styles
import '../../styles/globals.css'
import '../../styles/custom.css'

import { PharmacyProvider } from 'src/context/PharmacyContext'
import { DynamicStatesProvider } from 'src/context/DynamicStatesContext'
import { EggProvider } from 'src/context/EggContext'
import { PariveshProvider } from 'src/context/PariveshContext'
import { AnimalProvider } from 'src/context/AnimalContext'
import { ForgotPasswordProvider } from 'src/context/ForgotPasswordContext'

// Redux
import { Provider } from 'react-redux'
import store from 'src/store/store'

// Tanstack query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HospitalProvider } from 'src/context/HospitalContext'

// Configure QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes (data will be considered fresh for 5 minutes)
      gcTime: 10 * 60 * 1000, // 10 minutes (cache data will be garbage collected after 10 minutes of inactivity)
      refetchOnWindowFocus: false, // Prevent refetching on window focus
      retry: false // Disable retrying failed queries
    }
  }
})

const clientSideEmotionCache = createEmotionCache()

// ** Pace Loader
if (themeConfig.routingLoader) {
  Router.events.on('routeChangeStart', () => {
    NProgress.start()
  })
  Router.events.on('routeChangeError', () => {
    NProgress.done()
  })
  Router.events.on('routeChangeComplete', () => {
    NProgress.done()
  })
}

const Guard = ({ children, authGuard, guestGuard }) => {
  if (guestGuard) {
    return <GuestGuard fallback={<Spinner />}>{children}</GuestGuard>
  } else if (!guestGuard && !authGuard) {
    return <>{children}</>
  } else {
    return <AuthGuard fallback={<Spinner />}>{children}</AuthGuard>
  }
}

// ** Configure JSS & ClassName
const App = props => {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props

  // Variables
  const contentHeightFixed = Component.contentHeightFixed ?? false

  const getLayout =
    Component.getLayout ?? (page => <UserLayout contentHeightFixed={contentHeightFixed}>{page}</UserLayout>)
  const setConfig = Component.setConfig ?? undefined
  const authGuard = Component.authGuard ?? true
  const guestGuard = Component.guestGuard ?? false
  const aclAbilities = Component.acl ?? defaultACLObj

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <CacheProvider value={emotionCache}>
          <Head>
            <title>{`${themeConfig.templateName}`}</title>
            <meta name='description' content={`${themeConfig.templateName}`} />
            <meta name='viewport' content='initial-scale=1, width=device-width' />
          </Head>
          <HospitalProvider>
            <PariveshProvider>
              <AnimalProvider>
                <PharmacyProvider>
                  <DynamicStatesProvider>
                    <EggProvider>
                      <ForgotPasswordProvider>
                        <AuthProvider>
                          <SettingsProvider {...(setConfig ? { pageSettings: setConfig() } : {})}>
                            <SettingsConsumer>
                              {({ settings }) => {
                                return (
                                  <ThemeComponent settings={settings}>
                                    <Guard authGuard={authGuard} guestGuard={guestGuard}>
                                      <AclGuard
                                        aclAbilities={aclAbilities}
                                        guestGuard={guestGuard}
                                        authGuard={authGuard}
                                      >
                                        {getLayout(<Component {...pageProps} />)}
                                      </AclGuard>
                                    </Guard>
                                    <ReactHotToast>
                                      <Toaster
                                        position={settings.toastPosition}
                                        containerClassName='react-hot-toast-container'
                                        toastOptions={{ className: 'react-hot-toast' }}
                                      />
                                    </ReactHotToast>
                                  </ThemeComponent>
                                )
                              }}
                            </SettingsConsumer>
                          </SettingsProvider>
                        </AuthProvider>
                      </ForgotPasswordProvider>
                    </EggProvider>
                  </DynamicStatesProvider>
                </PharmacyProvider>
              </AnimalProvider>
            </PariveshProvider>
          </HospitalProvider>
        </CacheProvider>
      </Provider>
    </QueryClientProvider>
  )
}

export default App
