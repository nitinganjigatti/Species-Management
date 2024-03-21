const composeDietNavigation = () => {
  const pharmacyTitle = {
    sectionTitle: 'Diet'
  }

  const feedTypes = {
    title: 'Feed Types',
    path: '/diet/feed',
    icon: 'material-symbols:inventory-2-outline'
  }

  const ingredientsList = {
    title: 'Ingredient',
    path: '/diet/ingredient',
    icon: 'arcticons:recipe-keeper'
  }

  const recipeList = {
    title: 'Recipe',
    path: '/diet/recipe',
    icon: 'arcticons:recipe-keeper'
  }

  const dietNavigation = [pharmacyTitle, feedTypes, ingredientsList, recipeList]

  return dietNavigation
}

const dietNavigation = () => composeDietNavigation()

export default dietNavigation
