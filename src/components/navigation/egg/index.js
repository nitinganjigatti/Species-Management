const composeEggNavigation = () => {
  const title = {
    sectionTitle: 'Egg Module'
  }

  const dashboard = {
    title: 'Dashboard',
    path: '/egg/dashboard',
    icon: 'material-symbols:inventory-2-outline'
  }

  const nursery = {
    title: 'Nursery',
    path: '/egg/nursery',
    icon: 'material-symbols:inventory-2-outline'
  }

  const incubatorRoom = {
    title: 'Incubator Rooms',
    path: '/egg/incubator-rooms',
    icon: <img src='/icons/ingredient.png' alt='Grocery Icon' />,
    activeIcon: <img src='/icons/icon_ingredient_white.png' alt='Grocery Icon' />
  }

  const incubators = {
    title: 'Incubator',
    path: '/egg/incubators',
    icon: <img src='/icons/icon_diet_black.png' alt='Grocery Icon' />,
    activeIcon: <img src='/icons/icon_diet_white.png' alt='Grocery Icon' />
  }

  const eggs = {
    title: 'Eggs',
    path: '/egg/eggs',
    icon: <img src='/icons/icon_diet_black.png' alt='Grocery Icon' />,
    activeIcon: <img src='/icons/icon_diet_white.png' alt='Grocery Icon' />
  }

  const dietNavigation = [title, dashboard, nursery, incubatorRoom, incubators, eggs]

  return dietNavigation
}

const eggNavigation = () => composeEggNavigation()

export default eggNavigation
