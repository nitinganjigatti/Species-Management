const composeDietNavigation = () => {
  const pharmacyTitle = {
    sectionTitle: 'Diet'
  }

  const feedTypes = {
    title: 'Feed Types',
    path: '/diet/feed',
    icon: <img src='/icons/feedtypes_dark.svg' alt='Grocery Icon' />,
    activeIcon: <img src='/icons/feedtypes_white.svg' alt='Grocery Icon' />,
    activeWhen: ['/diet/feed', '/diet/feed/add-feed']
  }

  const ingredientsList = {
    title: 'Item',
    path: '/diet/ingredient',
    icon: <img src='/icons/ingredient.png' alt='Grocery Icon' />,
    activeIcon: <img src='/icons/icon_ingredient_white.png' alt='Grocery Icon' />,
    activeWhen: ['/diet/ingredient', '/diet/ingredient/add-ingredient']
  }

  const dietList = {
    title: 'Diet',
    path: '/diet/diet',
    icon: <img src='/icons/icon_diet_black.png' alt='Grocery Icon' />,
    activeIcon: <img src='/icons/icon_diet_white.png' alt='Grocery Icon' />,
    activeWhen: ['/diet/diet', '/diet/add-diet']
  }

  const speciesDietList = {
    title: 'Diet List',
    path: '/diet/species-diet',
    icon: <img src='/icons/icon_species_diet.png' alt='Grocery Icon' />,
    activeIcon: <img src='/icons/icon_species_diet_white.png' alt='Grocery Icon' />
  }

  const recipeList = {
    title: 'Recipe',
    path: '/diet/recipe',
    icon: <img src='/icons/icon_recipe_black.png' alt='Grocery Icon' />,
    activeIcon: <img src='/icons/icon_recipe_white.png' alt='Grocery Icon' />,
    activeWhen: ['/diet/recipe', '/diet/recipe/add-recipe']
  }

  const comboList = {
    title: 'Mix',
    path: '/diet/combo',
    icon: <img src='/icons/icon_recipe_black.png' alt='Grocery Icon' />,
    activeIcon: <img src='/icons/icon_recipe_white.png' alt='Grocery Icon' />,
    activeWhen: ['/diet/combo', '/diet/combo/add-combo']
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

  const dropPoints = {
    title: 'Drop Points',
    path: '/diet/settings/drop-points'
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

  const mealGroupReport = {
    title: 'Meal Group Report',
    path: '/diet/kitchen/meal-group-report'
  }

  kitchenParent.children.push(dietReport, mealGroupReport)

  settingsParent.children.push(preparationTypes, cutSize, dietCategory, dropPoints)

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
