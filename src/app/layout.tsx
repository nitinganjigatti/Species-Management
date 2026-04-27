import { ReactNode, Suspense } from 'react'

import { SearchParamsInner } from 'src/context/SearchParamsContext'
import Providers from './providers'

import '../../styles/globals.css'
import '../../styles/custom.css'
import 'prismjs/themes/prism-tomorrow.css'
import 'react-perfect-scrollbar/dist/css/styles.css'

export const metadata = {
  title: 'Antz Web Dashboard',
  description: 'Antz Web Dashboard',
  icons: {
    icon: '/images/branding/Antz_logomark_h_color.svg',
    apple: '/images/branding/Antz_logomark_h_color.svg'
  }
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en-IN'>
      <head>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' />
        <link
          rel='stylesheet'
          href='https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
        />
      </head>
      <body>
        <Suspense fallback={null}>
          <SearchParamsInner>
            <Providers>{children}</Providers>
          </SearchParamsInner>
        </Suspense>
      </body>
    </html>
  )
}
