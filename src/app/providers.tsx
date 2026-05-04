'use client'

import { ReactNode, Suspense } from 'react'

// ** Emotion Imports
import { CacheProvider } from '@emotion/react'

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
import NavigationProgress from './components/NavigationProgress'

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

// Search Params Provider (isolates useSearchParams in its own Suspense boundary)
import { SearchParamsInner } from 'src/context/SearchParamsContext'

// Shared instances (same as Page Router)
import { queryClient } from 'src/lib/shared/queryClient'
import { clientSideEmotionCache } from 'src/lib/shared/emotionCache'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Suspense fallback={null}>
      <SearchParamsInner>
        <QueryClientProvider client={queryClient}>
          <Provider store={store}>
            <CacheProvider value={clientSideEmotionCache}>
              <HospitalProvider>
                <NecropsyProvider>
                  <PariveshProvider>
                    <AnimalProvider>
                      <PharmacyProvider>
                        <DynamicStatesProvider>
                          <EggProvider>
                            <ForgotPasswordProvider>
                              <AuthProvider>
                                <SettingsProvider pageSettings={null}>
                                  <SettingsConsumer>
                                    {({ settings }) => {
                                      return (
                                        <ThemeComponent settings={settings}>
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
      </SearchParamsInner>
    </Suspense>
  )
}
