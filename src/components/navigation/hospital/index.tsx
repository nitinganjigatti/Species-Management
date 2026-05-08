interface NavTitle {
  sectionTitle: string
}

interface NavItem {
  title: string
  path?: string
  key?: string
  icon?: string
  children?: NavItem[]
}

type NavigationItem = NavTitle | NavItem

const composeHospitalNavigation = (havePermissionToAddHospital: boolean): NavigationItem[] => {
  const Title: NavTitle = {
    sectionTitle: 'Hospital'
  }

  const patientsParent: NavItem = {
    title: 'Patient',
    path: '/hospital/patients',
    icon: 'tabler:align-box-top-left',
    children: []
  }

  const incoming: NavItem = {
    title: 'Incoming',
    path: '/hospital/incoming'
  }

  const inpatient: NavItem = {
    title: 'Inpatient',
    path: '/hospital/inpatient'
  }

  const outpatient: NavItem = {
    title: 'Outpatients',
    path: '/hospital/outpatient'
  }

  const discharged: NavItem = {
    title: 'Discharged',
    path: '/hospital/discharged'
  }

  const mortality: NavItem = {
    title: 'Mortality',
    path: '/hospital/mortality'
  }

  const followUp: NavItem = {
    title: 'Follow Up',
    path: '/hospital/followup'
  }

  const doctorsANdStaffs: NavItem = {
    title: 'Doctors & Staffs',
    path: '/hospital/doctors-and-staffs',
    icon: 'tabler:align-box-top-left'
  }

  const hospitalMastersParent: NavItem = {
    title: 'Masters',
    key: 'hospital-masters',
    path: '/hospital/masters',
    icon: 'tabler:align-box-top-left',
    children: []
  }

  const surgeryMaster: NavItem = {
    title: 'Surgery',
    path: '/hospital/masters/surgery'
  }

  const hospitalMaster: NavItem = {
    title: 'Hospital',
    path: '/hospital/masters/hospital'
  }

  patientsParent.children!.push(incoming, inpatient, outpatient, discharged, mortality, followUp)
  hospitalMastersParent.children!.push(surgeryMaster)

  if (havePermissionToAddHospital) {
    hospitalMastersParent.children!.push(hospitalMaster)
  }

  return [Title, patientsParent, doctorsANdStaffs, hospitalMastersParent]
}

const hospitalNavigation = (havePermissionToAddHospital: boolean): NavigationItem[] =>
  composeHospitalNavigation(havePermissionToAddHospital)

export default hospitalNavigation
