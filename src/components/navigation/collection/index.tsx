import { ROUTES } from 'src/constants/routes'
import type { NavItem, NavSection, NavigationItem } from 'src/types/navigation'

const composeCollectionNavigation = (): NavigationItem[] => {
  const Title: NavSection = {
    sectionTitle: 'Collection'
  }

  const collection: NavItem = {
    title: 'Species',
    path: ROUTES.collection.species,
    icon: <img src='/images/collection/species_colored.svg' alt='Species Icon' />,
    activeIcon: <img src='/images/housing/species.svg' alt='Species Icon' />
  }

  const collectionNavigationArray: NavigationItem[] = []

  collectionNavigationArray.push(Title)
  collectionNavigationArray.push(collection)

  return collectionNavigationArray
}

const collectionNavigation = (): NavigationItem[] => composeCollectionNavigation()

export default collectionNavigation
