const composeHospitalNavigation = havePermissionToAddHospital => {
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

  const outpatient = {
    title: 'Outpatients',
    path: '/hospital/outpatient'
  }

  const discharged = {
    title: 'Discharged',
    path: '/hospital/discharged'
  }

  const mortality = {
    title: 'Mortality',
    path: '/hospital/mortality'
  }

  const followUp = {
    title: 'Follow Up',
    path: '/hospital/followup'
  }

  const doctorsANdStaffs = {
    title: 'Doctors & Staffs',
    path: '/hospital/doctors-and-staffs',
    icon: 'tabler:align-box-top-left'
  }

  // const roomsAndEnclosures = {
  //   title: 'Rooms / Enclosures',
  //   path: '/hospital/rooms-and-enclosures',
  //   icon: 'tabler:align-box-top-left'
  // }

  const hospitalMastersParent = {
    title: 'Masters',
    key: 'hospital-masters',
    path: '/hospital/masters',
    icon: 'tabler:align-box-top-left',
    children: []
  }

  // const monitoringMaster = {
  //   title: 'Monitoring',
  //   path: '/hospital/masters/monitoring'
  // }

  // const anesthesiaMaster = {
  //   title: 'Anesthesia',
  //   path: '/hospital/masters/anesthesia'
  // }

  const surgeryMaster = {
    title: 'Surgery',
    path: '/hospital/masters/surgery'
  }

  const hospitalMaster = {
    title: 'Hospital',
    path: '/hospital/masters/hospital'
  }

  patientsParent.children.push(incoming)
  patientsParent.children.push(inpatient)
  patientsParent.children.push(outpatient)
  patientsParent.children.push(discharged)
  patientsParent.children.push(mortality)
  patientsParent.children.push(followUp)

  // hospitalMastersParent.children.push(monitoringMaster)
  // hospitalMastersParent.children.push(anesthesiaMaster)
  hospitalMastersParent.children.push(surgeryMaster)

  if (havePermissionToAddHospital) {
    hospitalMastersParent.children.push(hospitalMaster)
  }

  const hospitalNavigationArray = []

  hospitalNavigationArray.push(Title)
  hospitalNavigationArray.push(patientsParent, doctorsANdStaffs, hospitalMastersParent)

  return hospitalNavigationArray
}

const hospitalNavigation = havePermissionToAddHospital => composeHospitalNavigation(havePermissionToAddHospital)

export default hospitalNavigation
