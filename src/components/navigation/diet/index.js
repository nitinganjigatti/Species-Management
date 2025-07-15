const composeDietNavigation = () => {
  const pharmacyTitle = {
    sectionTitle: 'Diet'
  }

  const feedTypes = {
    title: 'Feed Types',
    path: '/diet/feed',
    icon: <img src='/icons/feedtypes_dark.svg' alt='Grocery Icon' />,
    activeIcon: <img src='/icons/feedtypes_white.svg' alt='Grocery Icon' />
  }

  const ingredientsList = {
    title: 'Item',
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

  const speciesDietList = {
    title: 'Species Diet List',
    path: '/diet/species-diet',
    icon: <img src='/icons/icon_species_diet.png' alt='Grocery Icon' />,
    activeIcon: <img src='/icons/icon_species_diet_white.png' alt='Grocery Icon' />
  }

  const recipeList = {
    title: 'Recipe',
    path: '/diet/recipe',
    icon: <img src='/icons/icon_recipe_black.png' alt='Grocery Icon' />,
    activeIcon: <img src='/icons/icon_recipe_white.png' alt='Grocery Icon' />
  }

  const comboList = {
    title: 'Combo',
    path: '/diet/combo',
    icon: <img src='/icons/icon_recipe_black.png' alt='Grocery Icon' />,
    activeIcon: <img src='/icons/icon_recipe_white.png' alt='Grocery Icon' />
  }

  const mealGroups = {
    title: 'Meal Groups',
    path: '/diet/meal-groups',
    icon: <img src='/icons/icon_diet_black.png' alt='Grocery Icon' />,
    activeIcon: <img src='/icons/icon_diet_white.png' alt='Grocery Icon' />
  }

  const settingsParent = {
    title: 'Settings',
    path: '/diet/settings',
    icon: 'uil:setting',
    children: []
  }

  const preparationTypes = {
    title: 'Preparation Types',
    path: '/diet/settings/preparation-types'
  }

  const cutSize = {
    title: 'Cut Sizes',
    path: '/diet/settings/cut-sizes'
  }

  const dietCategory = {
    title: 'Diet Category',
    path: '/diet/settings/diet-category'
  }

  const kitchenParent = {
    title: 'Kitchen',
    path: '/diet/kitchen/diet-report',
    icon: 'uil:box',
    children: []
  }

  const dietReport = {
    title: 'Diet Report',
    path: '/diet/kitchen/diet-report'
  }

  kitchenParent.children.push(dietReport)

  settingsParent.children.push(preparationTypes, cutSize, dietCategory)

  const dietNavigation = [
    pharmacyTitle,
    speciesDietList,
    feedTypes,
    ingredientsList,
    dietList,
    recipeList,
    comboList,
    mealGroups,
    kitchenParent,
    settingsParent
  ]

  return dietNavigation
}

const dietNavigation = () => composeDietNavigation()

export default dietNavigation
