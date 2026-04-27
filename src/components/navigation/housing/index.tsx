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

  const sites: NavItem = {
    title: 'Sites',
    path: '/housing/sites/',
    icon: <img style={{ width: '20px', height: '20px' }} src='/icons/site.svg' alt='Site Icon' />,
    activeIcon: <img style={{ width: '16px', height: '16px' }} src='/icons/site_active.svg' alt='Site Icon' />
  }

  const clusters: NavItem = {
    title: 'Clusters',
    icon: <img style={{ width: '20px', height: '20px' }} src='/icons/cluster.svg' alt='Cluster Icon' />,
    activeIcon: <img style={{ width: '20px', height: '20px' }} src='/icons/cluster_active.svg' alt='Cluster Icon' />,
    path: '/housing/cluster/'
  }

  const housingNavigationArray: NavigationItem[] = [Title, sites]

  if (includeClusters) housingNavigationArray.push(clusters)

  return housingNavigationArray
}

const housingNavigation = (includeClusters: boolean): NavigationItem[] => composeHousingNavigation(includeClusters)

export default housingNavigation
