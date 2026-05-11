import { useMemo, useCallback } from 'react'

const isUrlObject = url => url && typeof url === 'object' && ('pathname' in url || 'query' in url)

const appendQueryParam = (params, key, value) => {
  if (value === undefined || value === null) return

  if (Array.isArray(value)) {
    value.forEach(item => appendQueryParam(params, key, item))

    return
  }

  params.append(key, String(value))
}

const getStringHref = url => {
  if (!isUrlObject(url)) return String(url)

  const pathname = url.pathname || ''
  const query = url.query || {}
  const params = new URLSearchParams()

  Object.keys(query).forEach(key => appendQueryParam(params, key, query[key]))

  const queryString = params.toString()

  return queryString ? `${pathname}?${queryString}` : pathname
}

const getAppRouterOptions = options => {
  if (!options || typeof options.scroll === 'undefined') return undefined

  return { scroll: options.scroll }
}

const shouldNormalizeHospitalUrlObject = (url, currentPathname) => {
  if (!isUrlObject(url)) return false

  const targetPathname = url.pathname ? String(url.pathname) : ''
  const currentPath = currentPathname ? String(currentPathname) : ''

  return targetPathname.startsWith('/hospital') || currentPath.startsWith('/hospital')
}

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
    (url, as, options) => {
      if (isPageRouter && pageRouterInstance) {
        pageRouterInstance.push(url, as, options)
      } else if (isAppRouter && appRouterInstance) {
        const href = shouldNormalizeHospitalUrlObject(url, appPathname) ? getStringHref(url) : url

        appRouterInstance.push(href, getAppRouterOptions(options))
      } else {
        // Fallback to window.location
        if (typeof window !== 'undefined') {
          window.location.href = shouldNormalizeHospitalUrlObject(url, appPathname) ? getStringHref(url) : url
        }
      }
    },
    [isPageRouter, pageRouterInstance, isAppRouter, appRouterInstance, appPathname]
  )

  const replace = useCallback(
    (url, as, options) => {
      if (isPageRouter && pageRouterInstance) {
        pageRouterInstance.replace(url, as, options)
      } else if (isAppRouter && appRouterInstance) {
        const href = shouldNormalizeHospitalUrlObject(url, appPathname) ? getStringHref(url) : url

        appRouterInstance.replace(href, getAppRouterOptions(options))
      } else {
        // Fallback to window.location
        if (typeof window !== 'undefined') {
          window.location.replace(shouldNormalizeHospitalUrlObject(url, appPathname) ? getStringHref(url) : url)
        }
      }
    },
    [isPageRouter, pageRouterInstance, isAppRouter, appRouterInstance, appPathname]
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
    }
    if (typeof window !== 'undefined') {
      return window.location.pathname + window.location.search
    }

    return ''
  }, [isPageRouter, pageRouterInstance, isAppRouter, appPathname, appSearchParams])

  return useMemo(
    () => ({
      push,
      replace,
      back,
      query,
      pathname,
      asPath,
      isReady: true,
      isPageRouter,
      isAppRouter
    }),
    [push, replace, back, query, pathname, asPath, isPageRouter, isAppRouter]
  )
}

export default useSafeRouter
 