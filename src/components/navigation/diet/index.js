const composeDietNavigation = () => {
  const pharmacyTitle = {
    sectionTitle: 'Diet'
  }

  const feedTypes = {
    title: 'Feed Types',
    path: '/diet/feed',
    icon: 'material-symbols:inventory-2-outline'
  }

  const feedDetails = {
    title: 'Feed Details',
    path: '/diet/feed/feed-details',
    icon: 'material-symbols:inventory-2-outline'
  }

  const ingredientsList = {
    title: 'Ingredient',
    path: '/diet/ingredient/ingredients-list',
    icon: 'arcticons:recipe-keeper'
  }

  const dietNavigation = [pharmacyTitle, feedTypes, feedDetails, ingredientsList]

  return dietNavigation
}

const dietNavigation = () => composeDietNavigation()

export default dietNavigation
