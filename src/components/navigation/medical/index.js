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
    path: '/masters/monitor'
  }

  const Treatment = {
    title: 'Treatment',
    path: '/masters/treatment'
  }

  const DeliveryRoute = {
    title: 'Delivery Route',
    path: '/masters/delivery-route'
  }

  const ClinicalPath = {
    title: 'Clinical Path',
    path: '/masters/clinical-path'
  }

  const PurposeOfAnaesthesia = {
    title: 'Purpose of Anaesthesia',
    path: '/masters/purpose-of-anaesthesia'
  }

  const UOM = {
    title: 'UOM',
    path: '/masters/uom'
  }
  const medicalNavigationArray = []

  if (userSettings?.medical_add_complaints || userSettings?.medical_add_diagnosis) {
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
  if (userSettings?.medical_add_diagnosis) {
    mastersMedicalParent.children.push(Monitoring)
  }
  if (userSettings?.medical_add_diagnosis) {
    mastersMedicalParent.children.push(Treatment)
  }
  if (userSettings?.medical_add_diagnosis) {
    mastersMedicalParent.children.push(DeliveryRoute)
  }
  if (userSettings?.medical_add_diagnosis) {
    mastersMedicalParent.children.push(ClinicalPath)
  }
  if (userSettings?.medical_add_diagnosis) {
    mastersMedicalParent.children.push(PurposeOfAnaesthesia)
  }
  if (userSettings?.medical_add_diagnosis) {
    mastersMedicalParent.children.push(UOM)
  }

  medicalNavigationArray.push(mastersMedicalParent)

  return medicalNavigationArray
}

const medicalNavigation = ({ userSettings, medicalAccess }) => composeMedicalNavigation({ userSettings, medicalAccess })

export default medicalNavigation
