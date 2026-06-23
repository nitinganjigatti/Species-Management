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
        title: 'Species List',
        path: '/species-management/list',
        icon: 'mdi:format-list-bulleted',
        activeWhen: ['/species-management/list']
      }
    ]
  }

  return [speciesManagement]
}

const speciesManagementNavigation = () => composeSpeciesManagementNavigation()

export default speciesManagementNavigation
