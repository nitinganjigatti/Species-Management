// import { AuthContext } from 'src/context/AuthContext'
// import { useContext } from 'react'

const ComposeReportNavigation = reports_module => {
  const reportTitle = {
    sectionTitle: 'Report'
  }

  const animalList = {
    title: 'Animal List Report',
    path: '/report/animalList',
    icon: 'mdi:paw-outline'
  }

  const animal = {
    title: 'Animal Report',
    path: '/report/animal',
    icon: 'mdi:paw-outline'
  }

  const report = {
    title: 'Species Report',
    path: '/report/species',
    icon: 'mdi:rabbit-variant-outline'
  }

  const reportNavigationArray = []

  reportNavigationArray.push(reportTitle)
  reportNavigationArray.push(report, animal, animalList)

  return reportNavigationArray
}

const reportNavigation = () => ComposeReportNavigation()

export default reportNavigation
