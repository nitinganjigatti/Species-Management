<<<<<<< HEAD
import { ReactNode } from 'react'
import { Providers } from './providers'

// ** Global css styles (CSS imports are safe in Server Components)
import '../../styles/globals.css'
import '../../styles/custom.css'

// ** React Perfect Scrollbar Style
import 'react-perfect-scrollbar/dist/css/styles.css'

// NOTE: prismjs and iconify-bundle are imported in providers.tsx (Client Component)
// because they contain browser-only code / class components

export const metadata = {
  title: 'Antz Dashboard',
=======
import { ReactNode, Suspense } from 'react'

import { SearchParamsInner } from 'src/context/SearchParamsContext'
import Providers from './providers'

import '../../styles/globals.css'
import '../../styles/custom.css'
import 'prismjs/themes/prism-tomorrow.css'
import 'react-perfect-scrollbar/dist/css/styles.css'

export const metadata = {
  title: 'Antz Web Dashboard',
>>>>>>> diet-dev-approuter
  description: 'Antz Web Dashboard',
  icons: {
    icon: '/images/branding/Antz_logomark_h_color.svg',
    apple: '/images/branding/Antz_logomark_h_color.svg'
  }
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
<<<<<<< HEAD
    <html lang='en'>
      <head>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
=======
    <html lang='en-IN'>
      <head>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' />
>>>>>>> diet-dev-approuter
        <link
          rel='stylesheet'
          href='https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
        />
      </head>
<<<<<<< HEAD
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
=======
      <body>
        <Suspense fallback={null}>
          <SearchParamsInner>
            <Providers>{children}</Providers>
          </SearchParamsInner>
        </Suspense>
>>>>>>> diet-dev-approuter
      </body>
    </html>
  )
}
