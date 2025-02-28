const composeLabNavigation = () => {
  const Title = {
    sectionTitle: 'Dashboard'
  }

  const dashboard = {
    title: 'Dashboard',
    path: '/dashboard',
    icon: 'lets-icons:home-duotone'
  }

  const analytics = {
    title: 'Analytics',
    path: '/analytics',
    icon: 'mdi:home-analytics'
  }

  const dashboardNavigationArray = []

  dashboardNavigationArray.push(Title)

  dashboardNavigationArray.push(dashboard)
  dashboardNavigationArray.push(analytics)

  return dashboardNavigationArray
}

const dashboardNavigation = () => composeLabNavigation()

export default dashboardNavigation
