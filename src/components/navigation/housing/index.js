const composeHousingNavigation = () => {
  const Title = {
    sectionTitle: 'Housing'
  }

  // const housing = {
  //   title: 'Housing' ,
  //   path:'/parivesh/housing',
  //   icon: <img src='/icons/home_black.svg' alt='Grocery Icon' />,
  // }

  const dashboard = {
    title: 'dashboard',
    path: '',
    icon: <img src='/icons/home_black.svg' alt='Grocery Icon' />,
    activeIcon: <img src='/icons/home_white.png' alt='Grocery Icon' />
  }

  const sites = {
    title: 'Sites',
    path: '',
    icon: 'mdi:rabbit-variant-outline'
  }
  const sections = {
    title: 'Sections',
    path: '',
    icon: 'mdi:rabbit-variant-outline'
  }

  const housingNavigationArray = []

  housingNavigationArray.push(Title)
  housingNavigationArray.push(dashboard, sites, sections)

  return housingNavigationArray
}

const housingNavigation = () => composeHousingNavigation()

export default housingNavigation
