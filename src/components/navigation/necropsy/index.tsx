import { ReactNode } from 'react'

interface NavItem {
  title: string
  path?: string
  icon?: string | ReactNode
  activeIcon?: ReactNode
  key?: string
  children?: NavItem[]
}

interface NavSection {
  sectionTitle: string
}

type NavigationItem = NavItem | NavSection

const composeNecropsyNavigation = (
  hasPermissionToAddNecropsyCenter: boolean,
  allowCarcassCollection: boolean,
  enableAddNecropsyReport: boolean
): NavigationItem[] => {
  const Title: NavSection = {
    sectionTitle: 'Necropsy'
  }

  const necropsyListing: NavItem = {
    title: 'Necropsy Dashboard',
    path: '/necropsy/necropsy/',
    icon: <img src='/images/necropsy/necropsy_dark.svg' alt='Necropsy Icon' />,
    activeIcon: <img src='/images/necropsy/necropsy_white.svg' alt='Necropsy Icon' />
  }

  const carcassTransfer: NavItem = {
    title: 'Carcass Transfer',
    path: '/necropsy/carcass-transfer/',
    icon: <img src='/images/necropsy/carcass_transfer_dark.svg' alt='Carcass Transfer Icon' />,
    activeIcon: <img src='/images/necropsy/carcass_transfer_white.svg' alt='Carcass Transfer Icon' />
  }

  const NecropsyMasterParent: NavItem = {
    title: 'Masters',
    key: 'necropsy-masters',
    path: '/necropsy/masters',
    icon: 'tabler:settings',
    children: []
  }

  const necropsyCenter: NavItem = {
    title: 'Necropsy Center',
    path: '/necropsy/masters/necropsy-center/'
  }

  const necropsyNavigationArray: NavigationItem[] = []

  necropsyNavigationArray.push(Title)

  // Only show Necropsy listing when user has enableAddNecropsyReport permission
  if (enableAddNecropsyReport) {
    necropsyNavigationArray.push(necropsyListing)
  }

  // Show Carcass Transfer when user has allowCarcassCollection permission
  if (allowCarcassCollection) {
    necropsyNavigationArray.push(carcassTransfer)
  }

  if (hasPermissionToAddNecropsyCenter) {
    NecropsyMasterParent.children?.push(necropsyCenter)
    necropsyNavigationArray.push(NecropsyMasterParent)
  }

  return necropsyNavigationArray
}

const necropsyNavigation = (
  hasPermissionToAddNecropsyCenter: boolean,
  allowCarcassCollection: boolean,
  enableAddNecropsyReport: boolean
): NavigationItem[] =>
  composeNecropsyNavigation(hasPermissionToAddNecropsyCenter, allowCarcassCollection, enableAddNecropsyReport)

export default necropsyNavigation
