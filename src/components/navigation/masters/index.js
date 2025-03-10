import { AuthContext } from 'src/context/AuthContext'
import { useContext } from 'react'

const ComposeMasterNavigation = () => {
  const masterTitle = {
    sectionTitle: 'Masters'
  }

  const notes = {
    title: 'Note Types',
    path: '/masters/notes/',
    icon: 'icon-park-outline:traditional-chinese-medicine'
  }

  const taxonomy = {
    title: 'Taxonomy',
    path: '/masters/species/',
    icon: 'solar:clipboard-list-line-duotone'
  }

  const authData = useContext(AuthContext)
  const addmasterPermission = authData?.userData?.permission?.user_settings?.allow_masters
  console.log('addMasterPermission >>>', addmasterPermission)

  const masterNavigationArray = []

  if (addmasterPermission) {
    masterNavigationArray.push(masterTitle)
    masterNavigationArray.push(notes, taxonomy)
  }

  return masterNavigationArray
}

const mastersNavigation = () => ComposeMasterNavigation()

export default mastersNavigation
