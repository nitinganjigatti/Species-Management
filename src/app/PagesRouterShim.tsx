'use client'

import { ReactNode, useMemo } from 'react'
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime'
import { useRouter as useAppRouter, usePathname } from 'next/navigation'
import { useSafeSearchParams } from 'src/context/SearchParamsContext'

const buildUrl = (url: any): string => {
  if (typeof url === 'string') return url
  if (url && typeof url === 'object') {
    const pathname = url.pathname || ''
    if (url.query && typeof url.query === 'object') {
      const qs = new URLSearchParams(url.query).toString()

      return qs ? `${pathname}?${qs}` : pathname
    }
    if (typeof url.query === 'string') {
      return url.query ? `${pathname}?${url.query}` : pathname
    }

    return pathname
  }

  return String(url ?? '')
}

export default function PagesRouterShim({ children }: { children: ReactNode }) {
  const appRouter = useAppRouter()
  const pathname = usePathname() || ''
  const searchParams = useSafeSearchParams()

  const mockRouter = useMemo(() => {
    const query: Record<string, string> = {}
    if (searchParams) {
      searchParams.forEach((v: string, k: string) => {
        query[k] = v
      })
    }
    const searchString = searchParams ? searchParams.toString() : ''
    const asPath = pathname + (searchString ? `?${searchString}` : '')

    const noop = () => {}

    return {
      push: (url: any) => {
        try {
          appRouter?.push?.(buildUrl(url))
        } catch {
          if (typeof window !== 'undefined') window.location.href = buildUrl(url)
        }

        return Promise.resolve(true)
      },
      replace: (url: any) => {
        try {
          appRouter?.replace?.(buildUrl(url))
        } catch {
          if (typeof window !== 'undefined') window.location.replace(buildUrl(url))
        }

        return Promise.resolve(true)
      },
      back: () => appRouter?.back?.(),
      forward: () => appRouter?.forward?.(),
      prefetch: (url: any) => {
        try {
          appRouter?.prefetch?.(buildUrl(url))
        } catch {}

        return Promise.resolve()
      },
      reload: () => {
        if (typeof window !== 'undefined') window.location.reload()
      },
      beforePopState: noop,
      pathname,
      asPath,
      query,
      route: pathname,
      basePath: '',
      locale: undefined,
      locales: undefined,
      defaultLocale: undefined,
      domainLocales: undefined,
      isReady: true,
      isPreview: false,
      isFallback: false,
      isLocaleDomain: false,
      events: { on: noop, off: noop, emit: noop }
    }
  }, [appRouter, pathname, searchParams])

  return <RouterContext.Provider value={mockRouter as any}>{children}</RouterContext.Provider>
}
