const composeNecropsyNavigation = hasPermissionToAddNecropsyCenter => {
  const Title = {
    sectionTitle: 'Necropsy'
  }

  const necropsyListing = {
    title: 'Necropsy',
    path: '/necropsy/',
    icon: 'tabler:align-box-top-left'
  }

  const necropsyNavigationArray = []

  necropsyNavigationArray.push(Title)
  necropsyNavigationArray.push(necropsyListing)

  return necropsyNavigationArray
}

const necropsyNavigation = hasPermissionToAddNecropsyCenter =>
  composeNecropsyNavigation(hasPermissionToAddNecropsyCenter)

export default necropsyNavigation
