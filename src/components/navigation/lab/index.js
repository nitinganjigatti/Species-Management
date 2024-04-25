import { AuthContext } from 'src/context/AuthContext'
import { useContext } from 'react'

const ComposeLabNavigation = () => {
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

  const authData = useContext(AuthContext)
  const addlabPermission = authData?.userData?.roles?.settings?.add_lab
  const labList = authData?.userData?.modules?.lab_data?.lab
  console.log('addlabPermission', addlabPermission)

  const labNavigationArray = []

  if (labList?.length > 0) {
    labNavigationArray.push(labTitle)
    labNavigationArray.push(lab, request)
  } else if (addlabPermission) {
    labNavigationArray.push(labTitle)
    labNavigationArray.push(lab)
  }

  return labNavigationArray
}

const labNavigation = () => ComposeLabNavigation()

export default labNavigation
