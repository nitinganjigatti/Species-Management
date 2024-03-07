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

  const testscroll = {
    title: 'Scroll test',
    path: '/diet/feed/scroll',
    icon: 'material-symbols:inventory-2-outline'
  }

  const dietNavigation = [pharmacyTitle, feedTypes, feedDetails, testscroll]

  return dietNavigation
}

const dietNavigation = () => composeDietNavigation()

export default dietNavigation
