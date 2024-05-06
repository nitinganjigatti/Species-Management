import { useContext } from 'react'
import { AuthContext } from 'src/context/AuthContext'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import pharmacyNavigation from 'src/components/navigation/pharmacy'
import labNavigation from 'src/components/navigation/lab'
import dashboardNavigation from 'src/components/navigation/dashboard'
import dietNavigation from 'src/components/navigation/diet'

const ComposeNavigation = () => {
  const authData = useContext(AuthContext)
  const pharmacyList = authData?.userData?.modules?.pharmacy_data?.pharmacy
  const pharmacyRole = authData?.userData?.roles?.settings?.add_pharmacy
  const labRole = authData?.userData?.roles?.settings?.add_lab
  const labList = authData?.userData?.modules?.lab_data?.lab

  // console.log('labList', labList)
  const { selectedPharmacy } = usePharmacyContext()

  const navigationArray = []
  const dashboardNav = dashboardNavigation()
  navigationArray.push(...dashboardNav)

  if (pharmacyList?.length > 0 || pharmacyRole) {
    const pharmacyNav = pharmacyNavigation({ pharmacyList, pharmacyRole, selectedPharmacy: selectedPharmacy })
    navigationArray.push(...pharmacyNav)
  }

  if (labList?.length > 0 || labRole) {
    const labNav = labNavigation()
    navigationArray.push(...labNav)
  }

  const dietNav = dietNavigation()
  navigationArray.push(...dietNav)

  return navigationArray
}

const navigation = () => ComposeNavigation()

export default navigation
