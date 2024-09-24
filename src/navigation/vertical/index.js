import { useContext } from 'react'
import { AuthContext } from 'src/context/AuthContext'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import pharmacyNavigation from 'src/components/navigation/pharmacy'
import labNavigation from 'src/components/navigation/lab'
import dashboardNavigation from 'src/components/navigation/dashboard'
import dietNavigation from 'src/components/navigation/diet'
import eggNavigation from 'src/components/navigation/egg'
import pariveshNavigation from 'src/components/navigation/parivesh/index'

const ComposeNavigation = () => {
  const authData = useContext(AuthContext)
  const pharmacyList = authData?.userData?.modules?.pharmacy_data?.pharmacy
  const pharmacyRole = authData?.userData?.roles?.settings?.add_pharmacy
  const labRole = authData?.userData?.roles?.settings?.add_lab
  const labList = authData?.userData?.modules?.lab_data?.lab

  const dietModule = authData?.userData?.roles?.settings?.diet_module
  const dietModuleAccess = authData?.userData?.roles?.settings?.diet_module_access

  const egg_nursery = authData?.userData?.permission?.user_settings?.add_nursery_permisson
  const egg_collection = authData?.userData?.roles?.settings?.enable_egg_collection_module

  const pariveshAccess = authData?.userData?.roles?.settings?.enable_parivesh

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

  if (dietModule) {
    const dietNav = dietNavigation()
    navigationArray.push(...dietNav)
  }
  if (egg_nursery || egg_collection) {
    const eggNav = eggNavigation({ egg_nursery, egg_collection })
    navigationArray.push(...eggNav)
  }

  if (pariveshAccess) {
    const pariveshNav = pariveshNavigation()
    navigationArray.push(...pariveshNav)
  }

  return navigationArray
}

const navigation = () => ComposeNavigation()

export default navigation
