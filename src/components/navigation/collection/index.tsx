import { ReactNode } from 'react'

interface NavTitle {
  sectionTitle: string
}

interface NavItem {
  title: string
  path: string
  icon?: string | ReactNode
  activeIcon?: ReactNode
}

type NavigationItem = NavTitle | NavItem

const composeCollectionNavigation = (): NavigationItem[] => {
  const Title: NavTitle = {
    sectionTitle: 'Collection'
  }

  const collection: NavItem = {
    title: 'Species',
    path: '/collection/species',
    icon: <img src='/images/housing/species_colored.svg' alt='Species Icon' />,
    activeIcon: <img src='/images/housing/species.svg' alt='Species Icon' />
  }

  const collectionNavigationArray: NavigationItem[] = []

  collectionNavigationArray.push(Title)
  collectionNavigationArray.push(collection)

  return collectionNavigationArray
}

const collectionNavigation = (): NavigationItem[] => composeCollectionNavigation()

export default collectionNavigation
