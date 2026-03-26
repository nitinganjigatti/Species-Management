import React, { ReactElement } from 'react'

interface NavTitle {
  sectionTitle: string
}

interface NavItem {
  title: string
  path: string
  icon?: ReactElement
  activeIcon?: ReactElement
  children?: NavItem[]
}

type NavigationItem = NavTitle | NavItem

const composeHousingNavigation = (includeClusters: boolean): NavigationItem[] => {
  const Title: NavTitle = {
    sectionTitle: 'Housing'
  }

  const housingParent: NavItem = {
    title: 'Housing',
    path: '/parivesh/housing',
    icon: <img src='/icons/home_black.svg' alt='Grocery Icon' />,
    children: []
  }

  const dashboard: NavItem = {
    title: 'dashboard',
    path: '/housing/dashboard'
  }

  const sites: NavItem = {
    title: 'Sites',
    path: '/housing/sites',
    icon: <img style={{ width: '20px', height: '20px' }} src='/icons/site.svg' alt='Site Icon' />,
    activeIcon: <img style={{ width: '16px', height: '16px' }} src='/icons/site_active.svg' alt='Site Icon' />
  }

  const clusters: NavItem = {
    title: 'Clusters',
    icon: <img style={{ width: '20px', height: '20px' }} src='/icons/cluster.svg' alt='Cluster Icon' />,
    activeIcon: <img style={{ width: '20px', height: '20px' }} src='/icons/cluster_active.svg' alt='Cluster Icon' />,
    path: '/housing/cluster'
  }

  const sections: NavItem = {
    title: 'Sections',
    path: '/housing/sections'
  }

  // housingParent.children.push(dashboard)
  housingParent.children!.push(sites)

  if (includeClusters) housingParent.children!.push(clusters)

  // housingParent.children.push(sections)

  const housingNavigationArray: NavigationItem[] = []

  housingNavigationArray.push(Title)
  housingNavigationArray.push(housingParent)

  return housingNavigationArray
}

const housingNavigation = (includeClusters: boolean): NavigationItem[] => composeHousingNavigation(includeClusters)

export default housingNavigation
