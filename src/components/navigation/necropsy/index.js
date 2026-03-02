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
    icon: <img src='/images/necropsy/necropsy_dark.svg' alt='Necropsy Icon' />,
    activeIcon: <img src='/images/necropsy/necropsy_white.svg' alt='Necropsy Icon' />
  }

  const carcassTransfer = {
    title: 'Carcass Transfer',
    path: '/necropsy/carcass-transfer',
    icon: <img src='/images/necropsy/carcass_transfer_dark.svg' alt='Carcass Transfer Icon' />,
    activeIcon: <img src='/images/necropsy/carcass_transfer_white.svg' alt='Carcass Transfer Icon' />
  }

  const NecropsyMasterParent = {
    title: 'Masters',
    key: 'necropsy-masters',
    path: '/necropsy/masters',
    icon: 'tabler:settings',
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
