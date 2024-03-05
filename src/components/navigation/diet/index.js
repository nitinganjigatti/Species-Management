const composeDietNavigation = () => {
  const dietTitle = {
    sectionTitle: 'Diet'
  }

  const diet = {
    title: 'Feed Type',
    path: '/diet/feed',
    icon: 'icon-park-outline:traditional-chinese-medicine'
  }

  const request = {
    title: 'Diet',
    path: '/diet/diet-list',
    icon: 'solar:clipboard-list-line-duotone'
  }

  const dietNavigationArray = []

  dietNavigationArray.push(dietTitle)

  dietNavigationArray.push(diet, request)

  return dietNavigationArray
}

const dietNavigation = () => composeDietNavigation()

export default dietNavigation
