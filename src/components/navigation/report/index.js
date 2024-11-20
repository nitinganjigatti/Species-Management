// import { AuthContext } from 'src/context/AuthContext'
// import { useContext } from 'react'

const ComposeReportNavigation = reports_module => {
  const reportTitle = {
    sectionTitle: 'Report'
  }

  const report = {
    title: 'Species Report',
    path: '/report/species',
    icon: 'mdi:rabbit-variant-outline'
  }

  const reportNavigationArray = []

  reportNavigationArray.push(reportTitle)
  reportNavigationArray.push(report)

  return reportNavigationArray
}

const reportNavigation = () => ComposeReportNavigation()

export default reportNavigation
