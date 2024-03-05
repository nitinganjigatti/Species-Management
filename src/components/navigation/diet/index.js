const composeDietNavigation = () => {
  const pharmacyTitle = {
    sectionTitle: 'Diet'
  }

  const feedTypes = {
    title: 'Feed Types',
    path: '/diet/feed',
    icon: 'material-symbols:inventory-2-outline'
  }

  const dietNavigation = [pharmacyTitle, feedTypes]

  return dietNavigation
}

const dietNavigation = () => composeDietNavigation()

export default dietNavigation
