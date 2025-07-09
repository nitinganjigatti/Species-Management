const composeHospitalNavigation = () => {
  const Title = {
    sectionTitle: 'Hospital'
  }

  const patientsParent = {
    title: 'Patient',
    path: '/hospital/patients',
    icon: 'tabler:align-box-top-left',
    children: []
  }

  const incoming = {
    title: 'Incoming',
    path: '/hospital/incoming'
  }

  const inpatient = {
    title: 'Inpatient',
    path: '/hospital/inpatient'
  }

  patientsParent.children.push(incoming)
  patientsParent.children.push(inpatient)

  const hospitalNavigationArray = []

  hospitalNavigationArray.push(Title)
  hospitalNavigationArray.push(patientsParent)

  return hospitalNavigationArray
}

const hospitalNavigation = () => composeHospitalNavigation()

export default hospitalNavigation
