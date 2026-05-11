<<<<<<< HEAD
import { useMemo, useCallback } from 'react'

/**
 * Safe router hook that works in both Page Router and App Router contexts.
 * Falls back to window.location for redirects if router is not available.
 */
export const useSafeRouter = () => {
  // Try to use Page Router
  let pageRouterInstance = null
  let isPageRouter = false

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { useRouter } = require('next/router')
    // eslint-disable-next-line react-hooks/rules-of-hooks
    pageRouterInstance = useRouter()

    // Check if we're actually in Page Router context
    if (pageRouterInstance && pageRouterInstance.pathname !== undefined) {
      isPageRouter = true
    }
  } catch (e) {
    // Not in Page Router context or router not mounted
    isPageRouter = false
  }

  // Try to use App Router
  let appRouterInstance = null
  let appPathname = null
  let appSearchParams = null
  let appParams = null
  let isAppRouter = false

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { useRouter, usePathname, useSearchParams, useParams } = require('next/navigation')
    // eslint-disable-next-line react-hooks/rules-of-hooks
    appRouterInstance = useRouter()
    // eslint-disable-next-line react-hooks/rules-of-hooks
    appPathname = usePathname()
    // eslint-disable-next-line react-hooks/rules-of-hooks
    appSearchParams = useSearchParams()
    // eslint-disable-next-line react-hooks/rules-of-hooks
    appParams = useParams()

    if (appRouterInstance && appPathname !== null) {
      isAppRouter = true
    }
  } catch (e) {
    // Not in App Router context
    isAppRouter = false
  }

  const push = useCallback(
    url => {
      if (isPageRouter && pageRouterInstance) {
        pageRouterInstance.push(url)
      } else if (isAppRouter && appRouterInstance) {
        appRouterInstance.push(url)
      } else {
        // Fallback to window.location
        if (typeof window !== 'undefined') {
          window.location.href = url
        }
      }
    },
    [isPageRouter, pageRouterInstance, isAppRouter, appRouterInstance]
  )

  const replace = useCallback(
    url => {
      if (isPageRouter && pageRouterInstance) {
        pageRouterInstance.replace(url)
      } else if (isAppRouter && appRouterInstance) {
        appRouterInstance.replace(url)
      } else {
        // Fallback to window.location
        if (typeof window !== 'undefined') {
          window.location.replace(url)
        }
      }
    },
    [isPageRouter, pageRouterInstance, isAppRouter, appRouterInstance]
  )

  const back = useCallback(() => {
    if (isPageRouter && pageRouterInstance) {
      pageRouterInstance.back()
    } else if (isAppRouter && appRouterInstance) {
      appRouterInstance.back()
    } else {
      if (typeof window !== 'undefined') {
        window.history.back()
      }
    }
  }, [isPageRouter, pageRouterInstance, isAppRouter, appRouterInstance])

  // Build query object
  const query = useMemo(() => {
    if (isPageRouter && pageRouterInstance) {
      return pageRouterInstance.query || {}
    }
    if (isAppRouter && appSearchParams) {
      const queryObj = {}

      // Include dynamic route params (e.g., [id]) so path matching works like page router
      if (appParams) {
        Object.keys(appParams).forEach(key => {
          queryObj[key] = appParams[key]
        })
      }

      appSearchParams.forEach((value, key) => {
        queryObj[key] = value
      })

      return queryObj
    }

    // Fallback: parse from window.location
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const queryObj = {}
      params.forEach((value, key) => {
        queryObj[key] = value
      })

      return queryObj
    }

    return {}
  }, [isPageRouter, pageRouterInstance, isAppRouter, appSearchParams, appParams])

  // Get pathname
  const pathname = useMemo(() => {
    if (isPageRouter && pageRouterInstance) {
      return pageRouterInstance.pathname || ''
    }
    if (isAppRouter && appPathname) {
      // Strip trailing slash to match page router behavior (page router never includes trailing slash in pathname)
      return appPathname !== '/' && appPathname.endsWith('/') ? appPathname.slice(0, -1) : appPathname
    }
    if (typeof window !== 'undefined') {
      return window.location.pathname
    }

    return ''
  }, [isPageRouter, pageRouterInstance, isAppRouter, appPathname])

  // Get asPath
  const asPath = useMemo(() => {
    if (isPageRouter && pageRouterInstance) {
      return pageRouterInstance.asPath || ''
    }
    if (isAppRouter && appPathname) {
      const search = appSearchParams ? appSearchParams.toString() : ''
      // Strip trailing slash to normalize path matching for handleURLQueries
      const normalizedPath = appPathname !== '/' && appPathname.endsWith('/') ? appPathname.slice(0, -1) : appPathname

      return normalizedPath + (search ? '?' + search : '')
=======
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
>>>>>>> diet-dev-approuter
    }
    if (typeof window !== 'undefined') {
      return window.location.pathname + window.location.search
    }
<<<<<<< HEAD

    return ''
  }, [isPageRouter, pageRouterInstance, isAppRouter, appPathname, appSearchParams])
=======
    return ''
  }, [appPathname, appSearchParams])
>>>>>>> diet-dev-approuter

  return useMemo(
    () => ({
      push,
      replace,
      back,
      query,
      pathname,
      asPath,
<<<<<<< HEAD
      isReady: true,
      isPageRouter,
      isAppRouter
    }),
    [push, replace, back, query, pathname, asPath, isPageRouter, isAppRouter]
=======
      isReady,
      isPageRouter: false,
      isAppRouter: true
    }),
    [push, replace, back, query, pathname, asPath, isReady]
>>>>>>> diet-dev-approuter
  )
}

export default useSafeRouter
<<<<<<< HEAD
 
=======
>>>>>>> diet-dev-approuter
