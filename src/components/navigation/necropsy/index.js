const composeNecropsyNavigation = (
  hasPermissionToAddNecropsyCenter,
  allowCarcassCollection,
  enableAddNecropsyReport
) => {
  const Title = {
    sectionTitle: 'Necropsy'
  }

  const necropsyListing = {
    title: 'Necropsy Dashboard',
    path: '/necropsy/necropsy',
    icon: 'streamline-ultimate:laboratory-drug-file'
  }

  const carcassTransfer = {
    title: 'Carcass Transfer',
    path: '/necropsy/carcass-transfer',
    icon: 'tabler:transfer',
    icon: <img src='/icons/egg_module_icons/Dashboard_Dark.svg' alt='Dashboard Icon' />,
    activeIcon: <img src='/icons/egg_module_icons/Dashboard_White.svg' alt='Dashboard Icon' />
  }

  const NecropsyMasterParent = {
    title: 'Masters',
    key: 'necropsy-masters',
    path: '/necropsy/masters',
    icon: <img src='/icons/egg_module_icons/Dashboard_Dark.svg' alt='Dashboard Icon' />,
    activeIcon: <img src='/icons/egg_module_icons/Dashboard_White.svg' alt='Dashboard Icon' />,
    children: []
  }

  const necropsyCenter = {
    title: 'Necropsy Center',
    path: '/necropsy/masters/necropsy-center'
  }

  const necropsyNavigationArray = []

  necropsyNavigationArray.push(Title)

  // Only show Necropsy listing when user has enableAddNecropsyReport permission
  if (enableAddNecropsyReport) {
    necropsyNavigationArray.push(necropsyListing)
  }

  // Show Carcass Transfer when user has allowCarcassCollection permission
  if (allowCarcassCollection) {
    necropsyNavigationArray.push(carcassTransfer)
  }

  if (hasPermissionToAddNecropsyCenter) {
    NecropsyMasterParent.children.push(necropsyCenter)
    necropsyNavigationArray.push(NecropsyMasterParent)
  }

  return necropsyNavigationArray
}

const necropsyNavigation = (hasPermissionToAddNecropsyCenter, allowCarcassCollection, enableAddNecropsyReport) =>
  composeNecropsyNavigation(hasPermissionToAddNecropsyCenter, allowCarcassCollection, enableAddNecropsyReport)

export default necropsyNavigation
