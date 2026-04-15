const composeComponentLibraryNavigation = () => {
  const Title = {
    sectionTitle: 'Developer Tools'
  }

  const componentLibrary = {
    title: 'Component Library',
    path: '/component-library/',
    icon: 'mdi:puzzle-outline'
  }

  return [Title, componentLibrary]
}

const componentLibraryNavigation = () => composeComponentLibraryNavigation()

export default componentLibraryNavigation
