'use client'

import { useMemo, useCallback, useEffect, useState } from 'react'
import { useRouter as useAppRouter, usePathname } from 'next/navigation'
import { useSafeSearchParams } from 'src/context/SearchParamsContext'

/**
* Safe router hook for App Router with Pages Router API compatibility.
* Provides both new App Router and old Pages Router interfaces.
*/
export const useSafeRouter = () => {
  const appRouterInstance = useAppRouter()
  const appPathname = usePathname()
  const appSearchParams = useSafeSearchParams()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsReady(true)
  }, [])

  const push = useCallback(
    (url) => {
      // Support both Pages Router object format and string format
      let target = url

      if (typeof url === 'object' && url !== null) {
        // Pages Router format: { pathname: string, query?: object }
        let pathname = url.pathname || ''
        if (url.query && typeof url.query === 'object') {
          const queryStr = new URLSearchParams(url.query).toString()
          target = pathname + (queryStr ? `?${queryStr}` : '')
        } else if (typeof url.query === 'string') {
          target = pathname + (url.query ? `?${url.query}` : '')
        } else {
          target = pathname
        }
      }

      if (appRouterInstance) {
        appRouterInstance.push(target)
      } else if (typeof window !== 'undefined') {
        window.location.href = target
      }
    },
    [appRouterInstance]
  )

  const replace = useCallback(
    (url) => {
      let target = url

      if (typeof url === 'object' && url !== null) {
        let pathname = url.pathname || ''
        if (url.query && typeof url.query === 'object') {
          const queryStr = new URLSearchParams(url.query).toString()
          target = pathname + (queryStr ? `?${queryStr}` : '')
        } else if (typeof url.query === 'string') {
          target = pathname + (url.query ? `?${url.query}` : '')
        } else {
          target = pathname
        }
      }

      if (appRouterInstance) {
        appRouterInstance.replace(target)
      } else if (typeof window !== 'undefined') {
        window.location.replace(target)
      }
    },
    [appRouterInstance]
  )

  const back = useCallback(() => {
    if (appRouterInstance) {
      appRouterInstance.back()
    } else if (typeof window !== 'undefined') {
      window.history.back()
    }
  }, [appRouterInstance])

  // Build query object from search params only
  // Dynamic route params ([id]) should be obtained via useParams() hook directly in components
  const query = useMemo(() => {
    const queryObj = {}

    // Add search parameters from URL
    if (appSearchParams) {
      appSearchParams.forEach((value, key) => {
        queryObj[key] = value
      })
    }

    // Fallback: parse from window.location if no search params
    if (typeof window !== 'undefined' && Object.keys(queryObj).length === 0) {
      const params = new URLSearchParams(window.location.search)
      params.forEach((value, key) => {
        queryObj[key] = value
      })
    }

    return queryObj
  }, [appSearchParams])

  // Current pathname
  const pathname = appPathname || (typeof window !== 'undefined' ? window.location.pathname : '')

  // Full path with query string (like Pages Router asPath)
  const asPath = useMemo(() => {
    if (appPathname) {
      const search = appSearchParams ? appSearchParams.toString() : ''
      return appPathname + (search ? '?' + search : '')
    }
    if (typeof window !== 'undefined') {
      return window.location.pathname + window.location.search
    }
    return ''
  }, [appPathname, appSearchParams])

  return useMemo(
    () => ({
      push,
      replace,
      back,
      query,
      pathname,
      asPath,
      isReady,
      isPageRouter: false,
      isAppRouter: true
    }),
    [push, replace, back, query, pathname, asPath, isReady]
  )
}

export default useSafeRouter
