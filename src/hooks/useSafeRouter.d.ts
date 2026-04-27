import { ParsedUrlQuery } from 'querystring'

interface SafeRouterQuery {
  [key: string]: string | string[] | undefined
}

interface SafeRouter {
  push: (url: string | { pathname: string; query?: Record<string, any> }, as?: string, options?: { shallow?: boolean }) => void
  replace: (url: string | { pathname: string; query?: Record<string, any> }, as?: string, options?: { shallow?: boolean }) => void
  back: () => void
  query: SafeRouterQuery
  pathname: string
  asPath: string
  isReady: boolean
  isPageRouter: boolean
  isAppRouter: boolean
}

export declare const useSafeRouter: () => SafeRouter
export default useSafeRouter
