'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
// @ts-ignore
import NProgress from 'nprogress'

// Configure NProgress
NProgress.configure({ showSpinner: false })

// Note: avoid `useSearchParams()` here — it forces the surrounding subtree out of static rendering
// and requires a Suspense boundary, which causes an Emotion SSR/CSR hydration mismatch in this app
// (no useServerInsertedHTML registry is set up). Pathname changes are sufficient to drive NProgress.done().
export default function NavigationProgress() {
  const pathname = usePathname()

  useEffect(() => {
    NProgress.done()
  }, [pathname])

  // Start progress on link click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a')

      if (anchor) {
        const href = anchor.getAttribute('href')
        const isInternal = href && (href.startsWith('/') || href.startsWith('#'))
        const isSameOrigin = anchor.origin === window.location.origin

        if (isInternal || isSameOrigin) {
          // Check if it's not the current page
          if (href !== pathname && href !== `${pathname}${window.location.search}`) {
            NProgress.start()
          }
        }
      }
    }

    document.addEventListener('click', handleClick)

    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, [pathname])

  return null
}
