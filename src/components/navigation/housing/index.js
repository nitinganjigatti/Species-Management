const composeHousingNavigation = includeClusters => {
  const Title = {
    sectionTitle: 'Housing'
  }

  const housingParent = {
    title: 'Housing',
    path: '/parivesh/housing',
    icon: <img src='/icons/home_black.svg' alt='Grocery Icon' />,
    children: []
  }

  const dashboard = {
    title: 'dashboard',
    path: '/housing/dashboard'

    // icon: <img src='/icons/home_black.svg' alt='Grocery Icon' />,
    // activeIcon: <img src='/icons/home_white.png' alt='Grocery Icon' />
  }

  const sites = {
    title: 'Sites',
    path: '/housing/sites',
    icon: <img style={{ width: '20px', height: '20px' }} src='/icons/site.svg' alt='Site Icon' />,
    activeIcon: <img style={{ width: '16px', height: '16px' }} src='/icons/site_active.svg' alt='Site Icon' />
  }

  const clusters = {
    title: 'Clusters',
    icon: <img style={{ width: '20px', height: '20px' }} src='/icons/cluster.svg' alt='Cluster Icon' />,
    activeIcon: <img style={{ width: '20px', height: '20px' }} src='/icons/cluster_active.svg' alt='Cluster Icon' />,
    path: '/housing/cluster'
  }

  const sections = {
    title: 'Sections',
    path: '/housing/sections'

    // icon: 'mdi:rabbit-variant-outline'
  }

  // housingParent.children.push(dashboard)
  housingParent.children.push(sites)

  if (includeClusters) housingParent.children.push(clusters)

  // housingParent.children.push(sections)

  const housingNavigationArray = []

  housingNavigationArray.push(Title)
  housingNavigationArray.push(housingParent)

  return housingNavigationArray
}

const housingNavigation = includeClusters => composeHousingNavigation(includeClusters)

export default housingNavigation
