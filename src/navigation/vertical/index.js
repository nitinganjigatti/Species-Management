import { useContext } from 'react'
import { AuthContext } from 'src/context/AuthContext'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import pharmacyNavigation from 'src/components/navigation/pharmacy'
import dietNavigation from 'src/components/navigation/diet'

const ComposeNavigation = () => {
  const authData = useContext(AuthContext)
  const pharmacyList = authData?.userData?.modules?.pharmacy_data?.pharmacy
  const pharmacyRole = authData?.userData?.roles?.settings?.add_pharmacy
  const { selectedPharmacy } = usePharmacyContext()

  const navigationArray = []

  if (pharmacyList?.length > 0 || pharmacyRole) {
    const pharmacyNav = pharmacyNavigation({ pharmacyList, pharmacyRole, selectedPharmacy: selectedPharmacy })
    navigationArray.push(...pharmacyNav)
  }

  const dietNav = dietNavigation()

  navigationArray.push(...dietNav)

  return navigationArray
}

const navigation = () => ComposeNavigation()

export default navigation
