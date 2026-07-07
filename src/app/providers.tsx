'use client'

import { ReactNode, useEffect } from 'react'

// ** Emotion SSR registry (App Router) — supplies the Emotion cache AND flushes inserted
// styles into <head> via useServerInsertedHTML. Without it, Emotion renders <style> tags
// inline in the tree during SSR (compat mode) but not on the client → hydration mismatch
// (the FallbackSpinner "css-global" error). ThemeRegistry replaces the bare CacheProvider.
import ThemeRegistry from './ThemeRegistry'

// ** Third Party Import
import { Toaster } from 'react-hot-toast'

// ** Prismjs (must be in Client Component - uses browser APIs)
import 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'

// ** Iconify bundle (must be in Client Component - uses class components)
import 'src/iconify-bundle/icons-bundle-react'

// ** Navigation Progress for App Router
// import NavigationProgress from './components/NavigationProgress'

// ** Component Imports
import ThemeComponent from 'src/@core/theme/ThemeComponent'

// ** Contexts
import { AuthProvider } from 'src/context/AuthContext'
import { SettingsConsumer, SettingsProvider } from 'src/@core/context/settingsContext'

// ** Styled Components
import ReactHotToast from 'src/@core/styles/libs/react-hot-toast'

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
import { QueryClientProvider } from '@tanstack/react-query'
import { HospitalProvider } from 'src/context/HospitalContext'
import { NecropsyProvider } from 'src/context/NecropsyContext'

// Shared instances (same as Page Router)
import { queryClient } from 'src/lib/shared/queryClient'
import { LanguageProvider } from 'src/context/LanguageContext'

// Single mount point for the @antzsoft/chat-core lifecycle (socket connect /
// disconnect + REST client). The provider runs the effect once and exposes
// `{ client, socket, connected, error }` to all descendants via
// `useChatClient()`. Internally gated by the tenant's ENABLE_CHAT_MODULE flag.
import { ChatClientProvider } from 'src/contexts/ChatClientContext'

// Push Notifications
import { PushNotificationProvider } from 'src/lib/notifications/PushNotificationProvider'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  // Register service worker for push notifications
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      console.log('[SW] Service Worker not supported')
      return
    }

    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        console.log('[SW] ✅ Registered:', reg.scope)
      })
      .catch(err => {
        console.error('[SW] ❌ Failed:', err.message)
      })
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ThemeRegistry>
          <HospitalProvider>
            <NecropsyProvider>
              <PariveshProvider>
                <AnimalProvider>
                  <PharmacyProvider>
                    <DynamicStatesProvider>
                      <EggProvider>
                        <ForgotPasswordProvider>
                          <AuthProvider>
                            <PushNotificationProvider>
                              <ChatClientProvider>
                                <LanguageProvider>
                                <SettingsProvider pageSettings={null}>
                                  <SettingsConsumer>
                                    {({ settings }) => {
                                      return (
                                        <ThemeComponent settings={settings}>
                                          {/* <Suspense fallback={null}>
                                            <NavigationProgress />
                                          </Suspense> */}
                                          {children}
                                          <ReactHotToast>
                                            <Toaster
                                              position={settings.toastPosition as any}
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
                              </ChatClientProvider>
                            </PushNotificationProvider>
                          </AuthProvider>
                        </ForgotPasswordProvider>
                      </EggProvider>
                    </DynamicStatesProvider>
                  </PharmacyProvider>
                </AnimalProvider>
              </PariveshProvider>
            </NecropsyProvider>
          </HospitalProvider>
        </ThemeRegistry>
      </Provider>
    </QueryClientProvider>
  )
}