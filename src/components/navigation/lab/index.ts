import { AuthContext } from 'src/context/AuthContext'
import { useContext } from 'react'
import type { LabNavItem, LabNavigationProps } from 'src/types/lab'

const ComposeLabNavigation = ({ labRole }: LabNavigationProps): LabNavItem[] => {
  const labTitle: LabNavItem = {
    sectionTitle: 'Lab'
  }

  const lab: LabNavItem = {
    title: 'My Lab',
    path: '/lab/lab-list',
    icon: 'icon-park-outline:traditional-chinese-medicine'
  }

  const request: LabNavItem = {
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

  const mastersLabParent: LabNavItem = {
    title: 'Lab Master',
    path: '/lab/master/',
    icon: 'uil:setting',
    children: []
  }

  const authData = useContext(AuthContext) as any

  // External LIMS short-circuit: when the tenant has LAB_LIMS_REQUIRED on
  // we replace the in-app lab module entirely with a single nav entry
  // that opens the configured LIMS URL in a new tab. All other
  // role/permission checks are skipped — every user on the tenant gets
  // the same single link.
  const labLimsRequired = authData?.userData?.settings?.LAB_LIMS_REQUIRED
  if (labLimsRequired) {
    const limsUrl = process.env.NEXT_PUBLIC_LIMS_BASE_URL
    if (!limsUrl) {
      console.warn('[lab-nav] LAB_LIMS_REQUIRED is true but NEXT_PUBLIC_LIMS_BASE_URL is not configured')

      return []
    }

    return [
      labTitle,
      {
        title: 'Lab',
        path: limsUrl,
        icon: 'icon-park-outline:traditional-chinese-medicine',
        openInNewTab: true
      }
    ]
  }

  const addlabPermission = authData?.userData?.roles?.settings?.add_lab
  const labList = authData?.userData?.modules?.lab_data?.lab
  const medical_add_samples = authData?.userData?.permission?.user_settings?.medical_add_samples
  const medical_add_tests = authData?.userData?.permission?.user_settings?.medical_add_tests
  const medical_add_mortality_reasons = authData?.userData?.permission?.user_settings?.medical_add_mortality_reasons

  const labNavigationArray: LabNavItem[] = []

  if (
    (labList?.length ?? 0) > 0 ||
    addlabPermission ||
    medical_add_samples ||
    medical_add_tests ||
    medical_add_mortality_reasons
  ) {
    labNavigationArray.push(labTitle)

    mastersLabParent.children = []

    if ((labList?.length ?? 0) > 0 || addlabPermission) {
      labNavigationArray.push(lab)
    }

    if ((labList?.length ?? 0) > 0) {
      labNavigationArray.push(request)
    }

    if (medical_add_samples) {
      mastersLabParent.children.push(labSample)
    }

    if (medical_add_tests) {
      mastersLabParent.children.push(labTest)
    }

    if (medical_add_mortality_reasons) {
      mastersLabParent.children.push(mortalityReason)
    }

    labNavigationArray.push(mastersLabParent)
  }

  return labNavigationArray
}

const labNavigation = ({ labRole }: LabNavigationProps): LabNavItem[] => ComposeLabNavigation({ labRole })

export default labNavigation
