// Shared navigation item shapes for the vertical sidebar.
// All nav modules (collection/, housing/, necropsy/, animals/, ...) should import these
// instead of redeclaring local copies.

import type { ReactNode } from 'react'

export interface NavSection {
  sectionTitle: string
}

export interface NavItem {
  title: string
  path?: string
  key?: string
  icon?: string | ReactNode
  activeIcon?: ReactNode
  children?: NavItem[]
}

export type NavigationItem = NavSection | NavItem
