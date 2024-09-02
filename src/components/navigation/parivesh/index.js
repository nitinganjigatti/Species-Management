const composeLabNavigation = () => {
  const Title = {
    sectionTitle: 'Parivesh'
  }

  const housing = {
    title: 'Housing' , 
    path:'/parivesh/housing',
    icon: <img src='/icons/home_black.svg' alt='Grocery Icon' />,
  }

  const parivesh = {
    title: 'Home',
    path: '/parivesh/home',
    icon: <img src='/icons/home_black.svg' alt='Grocery Icon' />,
    activeIcon: <img src='/icons/home_white.png' alt='Grocery Icon' />
  }

  const species = {
    title: 'Species',
    path: '/parivesh/species',
    icon: 'mdi:rabbit-variant-outline'
  }

  const pariveshNavigationArray = []

  pariveshNavigationArray.push(Title)
  pariveshNavigationArray.push(housing , parivesh, species)

  return pariveshNavigationArray
}

const pariveshNavigation = () => composeLabNavigation()

export default pariveshNavigation
