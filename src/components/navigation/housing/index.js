const composeHousingNavigation = () => {
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
    path: '/housing/sites'

    // icon: 'mdi:rabbit-variant-outline'
  }

  const clusters = {
    title: 'Clusters',
    path: '/housing/cluster'
  }

  const sections = {
    title: 'Sections',
    path: '/housing/sections'

    // icon: 'mdi:rabbit-variant-outline'
  }

  housingParent.children.push(dashboard)
  housingParent.children.push(sites)
  housingParent.children.push(clusters)

  // housingParent.children.push(sections)

  const housingNavigationArray = []

  housingNavigationArray.push(Title)
  housingNavigationArray.push(housingParent)

  return housingNavigationArray
}

const housingNavigation = () => composeHousingNavigation()

export default housingNavigation
