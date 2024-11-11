import { AuthContext } from 'src/context/AuthContext'
import { useContext } from 'react'

const ComposeLabNavigation = ({ labRole }) => {
  console.log(labRole, 'labRole')

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

  const labSample = {
    title: 'Lab Samples',
    path: '/lab/master/lab-sample'
  }

  const labTest = {
    title: 'Lab Tests',
    path: '/lab/master/lab-test'
  }

  const mortalityReason = {
    title: 'Mortality Reason',
    path: '/lab/master/mortality-reason'
  }

  const mastersLabParent = {
    title: 'Lab Master',
    path: '/lab/master/',
    icon: 'uil:setting',
    children: []
  }

  const authData = useContext(AuthContext)

  const addlabPermission = authData?.userData?.roles?.settings?.add_lab
  const labList = authData?.userData?.modules?.lab_data?.lab
  const medical_add_samples = authData?.userData?.permission?.user_settings?.medical_add_samples
  const medical_add_tests = authData?.userData?.permission?.user_settings?.medical_add_tests
  const medical_add_mortality_reasons = authData?.userData?.permission?.user_settings?.medical_add_mortality_reasons

  const labNavigationArray = []

  if (medical_add_samples || medical_add_tests || medical_add_mortality_reasons) {
    labNavigationArray.push(labTitle)

    // if (medical_add_samples || medical_add_tests || medical_add_mortality_reasons) {
    mastersLabParent.children = []
    // }

    if (medical_add_samples && medical_add_tests) {
      mastersLabParent.children.push(labSample, labTest)
    }

    if (medical_add_mortality_reasons) {
      mastersLabParent.children.push(mortalityReason)
    }

    labNavigationArray.push(lab, request, mastersLabParent)
  } else if (addlabPermission) {
    labNavigationArray.push(labTitle)
    labNavigationArray.push(lab)
  }

  return labNavigationArray
}

const labNavigation = ({ labRole }) => ComposeLabNavigation({ labRole })

export default labNavigation
