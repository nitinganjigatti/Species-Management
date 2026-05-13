'use client'

import { createContext, useContext } from 'react'
import { useSearchParams } from 'next/navigation'

const SearchParamsContext = createContext(null)

/**
* Inner component that calls useSearchParams().
* Must be rendered inside a <Suspense> boundary.
*/
function SearchParamsInner({ children }) {
  const searchParams = useSearchParams()

  return (
    <SearchParamsContext.Provider value={searchParams}>
      {children}
    </SearchParamsContext.Provider>
  )
}

export { SearchParamsInner, SearchParamsContext }

/**
* Hook to access search params from context.
* Returns null during SSR/suspense, URLSearchParams on client.
*/
export function useSafeSearchParams() {
  return useContext(SearchParamsContext)
}
 