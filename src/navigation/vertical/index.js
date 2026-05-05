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
import hospitalNavigation from 'src/components/navigation/hospital'
import settingsNavigation from 'src/components/navigation/settings'
import necropsyNavigation from 'src/components/navigation/necropsy'
import announcementsNavigation from 'src/components/navigation/announcements'
import notesNavigation from 'src/components/navigation/notes'

import animalsNavigation from 'src/components/navigation/animals'
import componentLibraryNavigation from 'src/components/navigation/component-library'
import vmsNavigation from 'src/components/navigation/vms'
import collectionNavigation from 'src/components/navigation/collection'

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

  const housingModuleWeb = authData?.userData?.roles?.settings?.enable_housing_in_web
  const housingModule = authData?.userData?.roles?.settings?.enable_housing
  const housingModuleCluster = authData?.userData?.roles?.settings?.manage_cluster_permission

  const hospitalModule = authData?.userData?.roles?.settings?.add_hospital
  const havePermissionToAddHospital = authData?.userData?.permission?.user_settings?.add_hospital_permission

  const userRole = authData?.userData?.roles?.role_name

  const enableAddNecropsyReport = authData?.userData?.roles?.settings?.enable_add_necropsy_report
  const allowCarcassCollection = authData?.userData?.roles?.settings?.allow_carcass_collection
  const hasPermissionToAddNecropsyCenter = authData?.userData?.permission?.user_settings?.add_necropsy_center
  const medicalAccess = authData?.userData?.roles?.settings?.medical_records

  const enableCollectionInWeb = authData?.userData?.roles?.settings?.enable_collection_in_web

  // console.log('labList', labList)
  const { selectedPharmacy } = usePharmacyContext()

  const navigationArray = []
  const dashboardNav = dashboardNavigation({ userRole })
  navigationArray.push(...dashboardNav)

  // Announcements module (App Router)
  const announcementsNav = announcementsNavigation()
  navigationArray.push(...announcementsNav)

  // Notes module (App Router)
  const notesNav = notesNavigation()
  navigationArray.push(...notesNav)

  // Animals module (App Router)
  const animalsNav = animalsNavigation()
  navigationArray.push(...animalsNav)

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

  if (housingModuleWeb) {
    const housingNav = housingNavigation(housingModuleCluster)
    navigationArray.push(...housingNav)
  }
  if (hospitalModule) {
    const hospitalNav = hospitalNavigation(havePermissionToAddHospital)
    navigationArray.push(...hospitalNav)
  }

  const medicalNav = medicalNavigation({
    userSettings,
    medicalAccess
  })
  navigationArray.push(...medicalNav)

  if (complianceModule) {
    const complianceNav = complianceNavigation()
    navigationArray.push(...complianceNav)
  }

  if (enableAddNecropsyReport || allowCarcassCollection || hasPermissionToAddNecropsyCenter) {
    const necropsyNav = necropsyNavigation(
      hasPermissionToAddNecropsyCenter,
      allowCarcassCollection,
      enableAddNecropsyReport
    )
    navigationArray.push(...necropsyNav)
  }

  // VMS module (temporarily showing all nav items for development)
  const vmsNav = vmsNavigation({ vmsPassView: true, vmsScan: true, vmsReports: true, vmsGadgetsManage: true })
  navigationArray.push(...vmsNav)

  if (housingModule || housingModuleWeb) {
    const settingsNav = settingsNavigation({ userRole })
    navigationArray.push(...settingsNav)
  }

  // Collection module (App Router)
  if (enableCollectionInWeb) {
    const collectionNav = collectionNavigation()
    navigationArray.push(...collectionNav)
  }

  // Component Library (Developer Tools)
  const componentLibraryNav = componentLibraryNavigation()
  navigationArray.push(...componentLibraryNav)

  return navigationArray
}

const navigation = () => ComposeNavigation()

export default navigation
