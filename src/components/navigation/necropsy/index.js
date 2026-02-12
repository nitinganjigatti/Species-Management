const composeNecropsyNavigation = hasPermissionToAddNecropsyCenter => {
  const Title = {
    sectionTitle: 'Necropsy'
  }

  const necropsyListing = {
    title: 'Necropsy',
    path: '/necropsy/',
    icon: 'tabler:align-box-top-left'
  }

  const NecropsyMasterParent = {
    title: 'Masters',
    key: 'necropsy-masters',
    path: '/necropsy/masters',
    icon: 'tabler:align-box-top-left',
    children: []
  }

  const necropsyCenter = {
    title: 'Necropsy Center',
    path: '/necropsy/masters/necropsy-center'
  }

  const necropsyNavigationArray = []

  necropsyNavigationArray.push(Title)
  necropsyNavigationArray.push(necropsyListing)

  if (hasPermissionToAddNecropsyCenter) {
    NecropsyMasterParent.children.push(necropsyCenter)
    necropsyNavigationArray.push(NecropsyMasterParent)
  }

  return necropsyNavigationArray
}

const necropsyNavigation = hasPermissionToAddNecropsyCenter =>
  composeNecropsyNavigation(hasPermissionToAddNecropsyCenter)

export default necropsyNavigation
