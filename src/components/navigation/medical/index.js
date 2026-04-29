const composeMedicalNavigation = ({ userSettings, medicalAccess }) => {
  const Title = {
    sectionTitle: 'Medical'
  }

  const mastersMedicalParent = {
    title: 'Masters',
    path: '/medical/masters/',
    icon: 'uil:setting',
    key: 'medical-masters',
    children: []
  }

  const complaints = {
    title: 'Symptoms',
    path: '/medical/masters/complaints'
  }

  const diagnosis = {
    title: 'Clinical assessment',
    path: '/medical/masters/diagnosis'
  }

  const recordsItem = {
    title: 'Records',
    path: '/medical/records',
    icon: 'tabler:stethoscope'
  }

  const Monitoring = {
    title: 'Monitoring',
    path: '/medical/masters/monitor'
  }

  const Treatment = {
    title: 'Treatment',
    path: '/medical/masters/treatment'
  }

  const DeliveryRoute = {
    title: 'Delivery Route',
    path: '/medical/masters/delivery-route'
  }

  const ClinPath = {
    title: 'Clin Path',
    path: '/medical/masters/clinical-path'
  }

  const PurposeOfAnaesthesia = {
    title: 'Purpose of Anaesthesia',
    path: '/medical/masters/purpose-of-anaesthesia'
  }

  const UOM = {
    title: 'UOM',
    path: '/medical/masters/uom'
  }
  const medicalNavigationArray = []

  if (medicalAccess || userSettings?.medical_add_complaints || userSettings?.medical_add_diagnosis) {
    medicalNavigationArray.push(Title)
  }
  if (medicalAccess) {
    medicalNavigationArray.push(recordsItem)
  }
  if (userSettings?.medical_add_complaints) {
    mastersMedicalParent.children.push(complaints)
  }
  if (userSettings?.medical_add_diagnosis) {
    mastersMedicalParent.children.push(diagnosis)
  }
  if (userSettings?.medical_add_complaints) {
    mastersMedicalParent.children.push(Monitoring)
    mastersMedicalParent.children.push(Treatment)
    mastersMedicalParent.children.push(DeliveryRoute)
    mastersMedicalParent.children.push(ClinPath)
    mastersMedicalParent.children.push(PurposeOfAnaesthesia)
    // mastersMedicalParent.children.push(UOM)
  }

  medicalNavigationArray.push(mastersMedicalParent)

  return medicalNavigationArray
}

const medicalNavigation = ({ userSettings, medicalAccess }) => composeMedicalNavigation({ userSettings, medicalAccess })

export default medicalNavigation
