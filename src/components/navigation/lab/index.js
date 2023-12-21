const composeLabNavigation = () => {
  const LabType = 'central'

  const labTitle = {
    sectionTitle: 'Actions'
  }

  const lab = {
    title: 'Lab',
    path: '/lab/lab-list',
    icon: 'icon-park-outline:traditional-chinese-medicine'
  }

  const request = {
    title: 'Request',
    path: '/lab/request',
    icon: 'solar:clipboard-list-line-duotone'
  }

  const labNavigationArray = []

  labNavigationArray.push(labTitle)

  if (LabType === 'central') {
    labNavigationArray.push(lab, request)
  }

  // if (LabType === 'local') {
  //   requestParent.children.push(requestListing)
  //   returnParent.children.push(returnListing, addReturnRequest)
  //   stockParent.children.push(stockReport, stockReportByBatch, stockOut, expiredMedicine)

  //   labNavigationArray.push(requestParent, returnParent, stockParent)
  // }

  return labNavigationArray
}

const labNavigation = () => composeLabNavigation()

export default labNavigation
