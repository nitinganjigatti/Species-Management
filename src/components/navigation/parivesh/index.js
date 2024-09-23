const composePariveshNavigation = () => {
  const Title = {
    sectionTitle: 'Parivesh'
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
  pariveshNavigationArray.push(parivesh, species)

  return pariveshNavigationArray
}

const pariveshNavigation = () => composePariveshNavigation()

export default pariveshNavigation
