import React, { ReactElement } from 'react'

interface NavTitle {
  sectionTitle: string
}

interface NavItem {
  title: string
  path: string
  icon?: ReactElement | string
  activeIcon?: ReactElement | string
}

type NavigationItem = NavTitle | NavItem

const composePariveshNavigation = (): NavigationItem[] => {
  const Title: NavTitle = {
    sectionTitle: 'Parivesh'
  }

  const parivesh: NavItem = {
    title: 'Home',
    path: '/parivesh/home/',
    icon: <img src='/icons/home_black.svg' alt='Grocery Icon' />,
    activeIcon: <img src='/icons/home_white.png' alt='Grocery Icon' />
  }

  const species: NavItem = {
    title: 'Species',
    path: '/parivesh/species/',
    icon: 'mdi:rabbit-variant-outline'
  }

  return [Title, parivesh, species]
}

const pariveshNavigation = (): NavigationItem[] => composePariveshNavigation()

export default pariveshNavigation
