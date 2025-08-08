import { useContext } from 'react'
import { AuthContext } from 'src/context/AuthContext'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import pharmacyNavigation from 'src/components/navigation/pharmacy'
import labNavigation from 'src/components/navigation/lab'
import dashboardNavigation from 'src/components/navigation/dashboard'
import dietNavigation from 'src/components/navigation/diet'
import complianceNavigation from 'src/components/navigation/compliance'
import mastersNavigation from 'src/components/navigation/masters'
import eggNavigation from 'src/components/navigation/egg'
import pariveshNavigation from 'src/components/navigation/parivesh/index'
import reportNavigation from 'src/components/navigation/report'
import medicalNavigation from 'src/components/navigation/medical'
import housingNavigation from 'src/components/navigation/housing'

const ComposeNavigation = () => {
  const authData = useContext(AuthContext)
  const pharmacyList = authData?.userData?.modules?.pharmacy_data?.pharmacy
  const pharmacyRole = authData?.userData?.roles?.settings?.add_pharmacy
  const labRole = authData?.userData?.roles?.settings?.add_lab
  const labList = authData?.userData?.modules?.lab_data?.lab
  const userSettings = authData?.userData?.permission?.user_settings

  const dietModule = authData?.userData?.roles?.settings?.diet_module
  const complianceModule = authData?.userData?.roles?.settings?.compliance_module
  const dietModuleAccess = authData?.userData?.roles?.settings?.diet_module_access

  const egg_nursery = authData?.userData?.permission?.user_settings?.add_nursery_permisson
  const egg_collection = authData?.userData?.roles?.settings?.enable_egg_collection_module

  const reports_module = authData?.userData?.roles?.settings?.enable_reports_module
  const enable_animal_report = authData?.userData?.permission?.user_settings?.enable_animal_report
  const enable_daily_report = authData?.userData?.permission?.user_settings?.enable_daily_report
  const enable_specie_report = authData?.userData?.permission?.user_settings?.enable_specie_report
  const enable_animal_assessment_report = authData?.userData?.permission?.user_settings?.enable_animal_assessment_report

  const pariveshAccess = authData?.userData?.roles?.settings?.enable_parivesh

  const housingModule = authData?.userData?.roles?.settings?.enable_housing_in_web
  const housingModuleCluster = authData?.userData?.roles?.settings?.manage_cluster_permission

  // console.log('labList', labList)
  const { selectedPharmacy } = usePharmacyContext()

  const navigationArray = []
  const dashboardNav = dashboardNavigation({ userRole })
  navigationArray.push(...dashboardNav)

  if (reports_module) {
    const reportNav = reportNavigation({
      reports_module,
      enable_specie_report,
      enable_daily_report,
      enable_animal_report,
      enable_animal_assessment_report
    })
    navigationArray.push(...reportNav)
  }

  if (pharmacyList?.length > 0 || pharmacyRole) {
    const pharmacyNav = pharmacyNavigation({ pharmacyList, pharmacyRole, selectedPharmacy: selectedPharmacy })
    navigationArray.push(...pharmacyNav)
  }

  if (labList?.length > 0 || labRole) {
    const labNav = labNavigation({ labRole })
    navigationArray.push(...labNav)
  }

  if (dietModule) {
    const dietNav = dietNavigation()
    navigationArray.push(...dietNav)

    // const masterNav = mastersNavigation()
    // navigationArray.push(...masterNav)
  }
  if (egg_nursery || egg_collection) {
    const eggNav = eggNavigation({ egg_nursery, egg_collection })
    navigationArray.push(...eggNav)
  }

  if (pariveshAccess) {
    const pariveshNav = pariveshNavigation()
    navigationArray.push(...pariveshNav)
  }

  if (housingModule) {
    const housingNav = housingNavigation(housingModuleCluster)
    navigationArray.push(...housingNav)
  }

  const medicalNav = medicalNavigation({
    userSettings
  })
  navigationArray.push(...medicalNav)

  if (complianceModule) {
    const complianceNav = complianceNavigation()
    navigationArray.push(...complianceNav)
  }

  return navigationArray
}

const navigation = () => ComposeNavigation()

export default navigation
