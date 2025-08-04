const composeLabNavigation = ({ userRole }) => {
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
  if (userRole == 'Super Admin') {
    dashboardNavigationArray.push(analytics)
  }

  return dashboardNavigationArray
}

const dashboardNavigation = ({ userRole }) => composeLabNavigation({ userRole })

export default dashboardNavigation
