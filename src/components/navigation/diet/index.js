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
    icon: <img src='/icons/ingredient.png' alt='Grocery Icon' />,
    activeIcon: <img src='/icons/icon_ingredient_white.png' alt='Grocery Icon' />
  }

  const dietList = {
    title: 'Diet',
    path: '/diet/diet',
    icon: <img src='/icons/icon_diet_black.png' alt='Grocery Icon' />,
    activeIcon: <img src='/icons/icon_diet_white.png' alt='Grocery Icon' />
  }

  const recipeList = {
    title: 'Recipe',
    path: '/diet/recipe',
    icon: <img src='/icons/icon_recipe_black.png' alt='Grocery Icon' />,
    activeIcon: <img src='/icons/icon_recipe_white.png' alt='Grocery Icon' />
  }

  const settingsParent = {
    title: 'Setting',
    path: '/diet/settings',
    icon: 'uil:setting',
    children: []
  }

  const preparationTypes = {
    title: 'Preparation Types',
    path: '/diet/settings/preparation-types'
  }

  settingsParent.children.push(preparationTypes)
  const dietNavigation = [pharmacyTitle, feedTypes, ingredientsList, dietList, recipeList, settingsParent]

  return dietNavigation
}

const dietNavigation = () => composeDietNavigation()

export default dietNavigation
