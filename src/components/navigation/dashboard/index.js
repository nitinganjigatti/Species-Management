const composeLabNavigation = () => {
  const Title = {
    sectionTitle: 'Dashboard'
  }

  const dashboard = {
    title: 'Dashboard',
    path: '/dashboard',
    icon: 'lets-icons:home-duotone'
  }

  const dashboardNavigationArray = []

  dashboardNavigationArray.push(Title)

  dashboardNavigationArray.push(dashboard)

  return dashboardNavigationArray
}

const dashboardNavigation = () => composeLabNavigation()

export default dashboardNavigation
