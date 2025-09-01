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

  const doctorsANdStaffs = {
    title: 'Doctors And Staffs',
    path: '/hospital/doctors-and-staffs',
    icon: 'tabler:align-box-top-left'
  }

  const roomsAndEnclosures = {
    title: 'Rooms/Enclosures',
    path: '/hospital/rooms-and-enclosures',
    icon: 'tabler:align-box-top-left'
  }

  const hospitalMastersParent = {
    title: 'Masters',
    path: '/hospital/masters',
    icon: 'tabler:align-box-top-left',
    children: []
  }

  const monitoringMaster = {
    title: 'Monitoring',
    path: '/hospital/masters/monitoring'
  }

  const anesthesiaMaster = {
    title: 'Anesthesia',
    path: '/hospital/masters/anesthesia'
  }

  const hospitalMaster = {
    title: 'Hospital',
    path: '/hospital/masters/hospital'
  }

  patientsParent.children.push(incoming)
  patientsParent.children.push(inpatient)

  hospitalMastersParent.children.push(monitoringMaster)
  hospitalMastersParent.children.push(anesthesiaMaster)
  hospitalMastersParent.children.push(hospitalMaster)

  const hospitalNavigationArray = []

  hospitalNavigationArray.push(Title)
  hospitalNavigationArray.push(patientsParent, roomsAndEnclosures, doctorsANdStaffs, hospitalMastersParent)

  return hospitalNavigationArray
}

const hospitalNavigation = () => composeHospitalNavigation()

export default hospitalNavigation
