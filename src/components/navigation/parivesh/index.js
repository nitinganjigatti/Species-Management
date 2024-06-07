const composeLabNavigation = () => {
  const Title = {
    sectionTitle: 'Parivesh'
  }

  const parivesh = {
    title: 'Home',
    path: '/parivesh/home',
    icon: 'lets-icons:home-duotone'
  }

  const species = {
    title: 'Species',
    path: '/parivesh/species',
    icon: 'icon-park-outline:traditional-chinese-medicine'
  }

  const pariveshNavigationArray = []

  pariveshNavigationArray.push(Title)
  pariveshNavigationArray.push(parivesh, species)

  return pariveshNavigationArray
}

const pariveshNavigation = () => composeLabNavigation()

export default pariveshNavigation
