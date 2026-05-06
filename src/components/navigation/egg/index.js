const composeEggNavigation = ({ egg_nursery, egg_collection, egg_view_insights }) => {
  const title = {
    sectionTitle: 'Egg Module'
  }

  const dashboard = {
    title: 'Dashboard',
    path: '/egg/dashboard',
    icon: <img src='/icons/egg_module_icons/Dashboard_Dark.svg' alt='Dashboard Icon' />,
    activeIcon: <img src='/icons/egg_module_icons/Dashboard_White.svg' alt='Dashboard Icon' />
  }

  const nursery = {
    title: 'Nursery',
    path: '/egg/nursery',
    icon: <img src='/icons/egg_module_icons/Nursery_Dark.svg' alt='Nursery Icon' />,
    activeIcon: <img src='/icons/egg_module_icons/Nursery_White.svg' alt='Nursery Icon' />
  }

  const incubatorRoom = {
    title: 'Incubator Rooms',
    path: '/egg/incubator-rooms',
    icon: <img src='/icons/egg_module_icons/Incubator_Room_Dark.svg' alt='IncubatorRoom Icon' />,
    activeIcon: <img src='/icons/egg_module_icons/Incubator_Room_White.svg' alt='IncubatorRoom Icon' />
  }

  const incubators = {
    title: 'Incubator',
    path: '/egg/incubators',

    icon: <img src='/icons/egg_module_icons/Incubator_Dark.svg' alt='Incubator Icon' />,
    activeIcon: <img src='/icons/egg_module_icons/Incubator_White.svg' alt='Incubator Icon' />
  }

  const eggs = {
    title: 'Eggs',
    path: '/egg/eggs',
    icon: <img src='/icons/egg_module_icons/Egg_Dark.svg' alt='Egg Icon' />,
    activeIcon: <img src='/icons/egg_module_icons/Egg_White.svg' alt='Egg Icon' />
  }

  let eggNavigation = []

  if (egg_nursery || egg_collection) {
    eggNavigation.push(title)
  }

  if (egg_nursery && !egg_collection && egg_view_insights) {
    eggNavigation.push(dashboard)
  }

  if (egg_nursery && !egg_collection) {
    eggNavigation.push(nursery, incubatorRoom, incubators)
  }

  if (egg_collection && egg_view_insights) {
    eggNavigation.push(dashboard)
  }

  if (egg_collection) {
    eggNavigation.push(nursery, incubatorRoom, incubators, eggs)
  }

  return eggNavigation
}

const eggNavigation = ({ egg_nursery, egg_collection, egg_view_insights }) =>
  composeEggNavigation({ egg_nursery, egg_collection, egg_view_insights })

export default eggNavigation
