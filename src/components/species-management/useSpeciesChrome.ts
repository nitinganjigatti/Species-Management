'use client'

import { useEffect } from 'react'

/**
 * Species-management page chrome — applied consistently to every screen in the module (dashboard,
 * list, detail), scoped to it and fully restored on unmount so nothing leaks elsewhere:
 *   1. Hide the top app bar (it only carries the profile avatar) — no sticky profile header.
 *   2. Full width — override the layout's "boxed" max-width cap so content fills the viewport and
 *      every species screen is the same width.
 *   3. Trim the page gutter and collapse the toolbar's reserved top padding (the bar is hidden).
 *
 * Everything is done at the DOM level on purpose. The settings-context flags for this (`appBar`,
 * `contentWidth`) revert unpredictably across navigation (appBar is a "static" setting; contentWidth
 * gets clobbered by the provider's restore on SPA transitions), which left detail/dashboard boxed.
 * Inline styles beat the layout's emotion classes/media-queries and are immune to that timing.
 */
export const useSpeciesChrome = () => {
  useEffect(() => {
    const navbar = document.querySelector('.layout-navbar') as HTMLElement | null
    const content = document.querySelector('.layout-page-content') as HTMLElement | null
    const prev = {
      navDisplay: navbar?.style.display ?? '',
      maxWidth: content?.style.maxWidth ?? '',
      padTop: content?.style.paddingTop ?? '',
      padLeft: content?.style.paddingLeft ?? '',
      padRight: content?.style.paddingRight ?? ''
    }

    if (navbar) navbar.style.display = 'none'
    if (content) {
      content.style.maxWidth = 'none' // beat the boxed @media max-width cap (inline > class rule)
      content.style.paddingTop = '24px'
      content.style.paddingLeft = '16px'
      content.style.paddingRight = '16px'
    }

    return () => {
      if (navbar) navbar.style.display = prev.navDisplay
      if (content) {
        content.style.maxWidth = prev.maxWidth
        content.style.paddingTop = prev.padTop
        content.style.paddingLeft = prev.padLeft
        content.style.paddingRight = prev.padRight
      }
    }
  }, [])
}
