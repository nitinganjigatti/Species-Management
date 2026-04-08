'use client'

import { useCallback, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

/**
 * Syncs a selected tab with the URL search param `tab`.
 * URL is the single source of truth — no local state.
 *
 * @param defaultTab - Fallback when `?tab=` is absent from the URL
 * @param availableTabs - When provided, resets to first available if current tab is filtered out
 */
export function useTabSync(defaultTab: string, availableTabs?: string[]) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const tabFromUrl = searchParams?.get('tab') || defaultTab

  // Derive effective tab: reset if current tab was filtered out
  const selectedTab =
    availableTabs?.length && !availableTabs.includes(tabFromUrl)
      ? availableTabs[0]
      : tabFromUrl

  const setSelectedTab = useCallback(
    (tab: string) => {
      const params = new URLSearchParams(searchParams?.toString())
      params.set('tab', tab)
      router.replace(`${pathname}?${params.toString()}`)
    },
    [searchParams, pathname, router]
  )

  // Correct URL when derived tab differs from URL (reset kicked in)
  useEffect(() => {
    if (selectedTab !== tabFromUrl) {
      setSelectedTab(selectedTab)
    }
  }, [selectedTab, tabFromUrl, setSelectedTab])

  return [selectedTab, setSelectedTab] as const
}

export default useTabSync
