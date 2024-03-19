const composeLabNavigation = () => {
  const labTitle = {
    sectionTitle: 'Lab'
  }

  const lab = {
    title: 'My Lab',
    path: '/lab/lab-list',
    icon: 'icon-park-outline:traditional-chinese-medicine'
  }

  const request = {
    title: 'Lab Request',
    path: '/lab/request',
    icon: 'solar:clipboard-list-line-duotone'
  }

  const labNavigationArray = []

  labNavigationArray.push(labTitle)

  labNavigationArray.push(lab, request)

  return labNavigationArray
}

const labNavigation = () => composeLabNavigation()

export default labNavigation
