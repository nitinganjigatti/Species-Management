'use client'

import { ReactNode, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { Provider as ReduxProvider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import ThemeRegistry from './ThemeRegistry'
import PagesRouterShim from './PagesRouterShim'
import ThemeComponent from 'src/@core/theme/ThemeComponent'
import ReactHotToast from 'src/@core/styles/libs/react-hot-toast'
import { SettingsConsumer, SettingsProvider } from 'src/@core/context/settingsContext'

import store from 'src/store/store'
import { AuthProvider } from 'src/context/AuthContext'
import { LanguageProvider } from 'src/context/LanguageContext'
import { HospitalProvider } from 'src/context/HospitalContext'
import { NecropsyProvider } from 'src/context/NecropsyContext'
import { PariveshProvider } from 'src/context/PariveshContext'
import { AnimalProvider } from 'src/context/AnimalContext'
import { PharmacyProvider } from 'src/context/PharmacyContext'
import { DynamicStatesProvider } from 'src/context/DynamicStatesContext'
import { EggProvider } from 'src/context/EggContext'
import { ForgotPasswordProvider } from 'src/context/ForgotPasswordContext'

import 'src/configs/i18n'
import 'src/iconify-bundle/icons-bundle-react'

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: false
          }
        }
      })
  )

  return (
    <ThemeRegistry>
      <PagesRouterShim>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <ReduxProvider store={store}>
              <HospitalProvider>
                <NecropsyProvider>
                  <PariveshProvider>
                    <AnimalProvider>
                      <PharmacyProvider>
                        <DynamicStatesProvider>
                          <EggProvider>
                            <ForgotPasswordProvider>
                              <AuthProvider>
                                <SettingsProvider pageSettings={undefined}>
                                  <SettingsConsumer>
                                    {({ settings }: any) => (
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
                                    )}
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
            </ReduxProvider>
          </LanguageProvider>
        </QueryClientProvider>
      </PagesRouterShim>
    </ThemeRegistry>
  )
}
