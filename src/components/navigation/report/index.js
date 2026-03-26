// import { AuthContext } from 'src/context/AuthContext'
// import { useContext } from 'react'

const ComposeReportNavigation = ({
  reports_module,
  enable_animal_report,
  enable_daily_report,
  enable_specie_report,
  enable_animal_assessment_report
}) => {
  const reportTitle = {
    sectionTitle: 'Report'
  }

  const animalList = {
    title: 'Animal List Report',
    path: '/report/animalList',
    icon: 'mdi:paw-outline'
  }

  const animalAssessment = {
    title: 'Animal Assessment',
    path: '/report/animalAssessment',
    icon: 'mdi:paw-outline'
  }

  const animal = {
    title: 'Daily Report',
    path: '/report/daily',
    icon: 'mdi:paw-outline'
  }

  const report = {
    title: 'Species Report',
    path: '/report/species',
    icon: 'mdi:rabbit-variant-outline'
  }

  const keyinsights = {
    title: 'Key Insights',
    path: '/reports/keyinsights/',
    icon: 'mdi:chart-bar',
    openInNewTab: true
  }

  const userReports = {
    title: 'User Reports',
    path: '/reports/users/',
    icon: 'mdi:chart-bar',
    openInNewTab: true
  }

  const assessmentDashboard = {
    title: 'Assessment Dashboard',
    path: '/reports/assessment-dashboard/',
    icon: 'mdi:chart-bar',
    openInNewTab: true
  }

  const caretakerReport = {
    title: 'Animal Keeper Report',
    path: '/report/caretaker-report',
    icon: 'mdi:account-group-outline'
  }

  const reportNavigationArray = []
  if (enable_specie_report || enable_daily_report || enable_animal_report) {
    reportNavigationArray.push(reportTitle)
  }

  if (enable_specie_report) {
    reportNavigationArray.push(report)
  }
  if (enable_daily_report) {
    reportNavigationArray.push(animal)
  }

  if (enable_animal_report) {
    reportNavigationArray.push(animalList)
  }

  if (enable_animal_assessment_report) {
    reportNavigationArray.push(animalAssessment)
  }
  if (enable_specie_report) {
    reportNavigationArray.push(keyinsights)
  }
  if (enable_daily_report) {
    reportNavigationArray.push(userReports)
  }
  if (enable_animal_assessment_report) {
    reportNavigationArray.push(assessmentDashboard)
  }

  // Always show caretaker report
  reportNavigationArray.push(caretakerReport)

  return reportNavigationArray
}

const reportNavigation = ({
  reports_module,
  enable_animal_report,
  enable_daily_report,
  enable_specie_report,
  enable_animal_assessment_report
}) =>
  ComposeReportNavigation({
    reports_module,
    enable_animal_report,
    enable_daily_report,
    enable_specie_report,
    enable_animal_assessment_report
  })

export default reportNavigation
