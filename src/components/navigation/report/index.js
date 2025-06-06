// import { AuthContext } from 'src/context/AuthContext'
// import { useContext } from 'react'

const ComposeReportNavigation = ({
  reports_module,
  enable_animal_report,
  enable_daily_report,
  enable_specie_report
}) => {
  const reportTitle = {
    sectionTitle: 'Report'
  }

  const animalList = {
    title: 'Animal List Report',
    path: '/report/animalList',
    icon: 'mdi:paw-outline'
  }

  const AnimalAssessment = {
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

  const reportNavigationArray = []
  if (enable_specie_report || enable_daily_report || enable_animal_report) {
    reportNavigationArray.push(reportTitle)
  }

  reportNavigationArray.push(reportTitle)
  reportNavigationArray.push(report, animal, animalList, AnimalAssessment)

  return reportNavigationArray
}

const reportNavigation = ({ reports_module, enable_animal_report, enable_daily_report, enable_specie_report }) =>
  ComposeReportNavigation({
    reports_module,
    enable_animal_report,
    enable_daily_report,
    enable_specie_report
  })

export default reportNavigation
