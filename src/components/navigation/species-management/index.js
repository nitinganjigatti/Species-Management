const composeSpeciesManagementNavigation = () => {
  const speciesManagement = {
    title: 'Species Management',
    icon: 'mdi:paw',
    children: [
      {
        title: 'Dashboard',
        path: '/species-management/dashboard',
        icon: 'mdi:view-dashboard-outline'
      },
      {
        title: 'Dashboard 2',
        path: '/species-management/dashboard-2',
        icon: 'mdi:view-dashboard-variant-outline'
      },
      {
        title: 'Species List',
        path: '/species-management/list',
        icon: 'mdi:format-list-bulleted',
        activeWhen: ['/species-management/list']
      },
      {
        title: 'Species List 2',
        path: '/species-management/list-2',
        icon: 'mdi:format-list-bulleted-square',
        activeWhen: ['/species-management/list-2']
      },
      {
        title: 'iPad 1',
        path: '/species-management/ipad-1/dashboard',
        icon: 'mdi:tablet',
        activeWhen: ['/species-management/ipad-1']
      },
      {
        title: 'iPad 2',
        path: '/species-management/ipad-2/dashboard',
        icon: 'mdi:tablet-dashboard',
        activeWhen: ['/species-management/ipad-2']
      },
      {
        title: 'iPad 3',
        path: '/species-management/ipad-3/dashboard',
        icon: 'mdi:tablet-cellphone',
        activeWhen: ['/species-management/ipad-3']
      }

      // Version-3 items hidden (2026-08-04) — uncomment to bring them back, pages still exist.
      // {
      //   title: 'Dashboard 3',
      //   path: '/species-management/dashboard-3',
      //   icon: 'mdi:view-dashboard-variant',
      //   activeWhen: ['/species-management/dashboard-3']
      // },
      // {
      //   title: 'Species List 3',
      //   path: '/species-management/list-3',
      //   icon: 'mdi:format-list-checkbox',
      //   activeWhen: ['/species-management/list-3']
      // }
    ]
  }

  return [speciesManagement]
}

const speciesManagementNavigation = () => composeSpeciesManagementNavigation()

export default speciesManagementNavigation
