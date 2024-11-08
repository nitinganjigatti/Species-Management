// import { AuthContext } from 'src/context/AuthContext'
// import { useContext } from 'react'

const ComposeReportNavigation = () => {
  const reportTitle = {
    sectionTitle: 'Report'
  }

  const report = {
    title: 'All Reports',
    path: '/report/species',
    icon: 'icon-park-outline:traditional-chinese-medicine'
  }

  const reportNavigationArray = []

  reportNavigationArray.push(reportTitle)
  reportNavigationArray.push(report)

  return reportNavigationArray
}

const reportNavigation = () => ComposeReportNavigation()

export default reportNavigation
