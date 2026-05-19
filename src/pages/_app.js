// ** Next Imports
import Head from 'next/head'
import { Router } from 'next/router'

// ** Loader Import
import NProgress from 'nprogress'

// ** Emotion Imports
import { CacheProvider } from '@emotion/react'

// ** Config Imports
import 'src/configs/i18n'
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
// createEmotionCache is now imported from shared module

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
import { LanguageProvider } from 'src/context/LanguageContext'
// Global init point for @antzsoft/chat-core
import ChatBoot from 'src/components/chat/ChatBoot'
import ChatLauncher from 'src/components/chat/ChatLauncher'

// Redux
import { Provider } from 'react-redux'
import store from 'src/store/store'

// Tanstack query
import { QueryClientProvider } from '@tanstack/react-query'
import { HospitalProvider } from 'src/context/HospitalContext'
import { NecropsyProvider } from 'src/context/NecropsyContext'

// Shared instances for both Page Router and App Router
import { queryClient } from 'src/lib/shared/queryClient'
import { clientSideEmotionCache } from 'src/lib/shared/emotionCache'

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
            <NecropsyProvider>
              <PariveshProvider>
                <AnimalProvider>
                  <PharmacyProvider>
                    <DynamicStatesProvider>
                      <EggProvider>
                        <ForgotPasswordProvider>
                          <AuthProvider>
                            <ChatBoot />
                            <LanguageProvider>
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
                                            <ChatLauncher />
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
                            </LanguageProvider>
                          </AuthProvider>
                        </ForgotPasswordProvider>
                      </EggProvider>
                    </DynamicStatesProvider>
                  </PharmacyProvider>
                </AnimalProvider>
              </PariveshProvider>
            </NecropsyProvider>
          </HospitalProvider>
        </CacheProvider>
      </Provider>
    </QueryClientProvider>
  )
}

export default App
