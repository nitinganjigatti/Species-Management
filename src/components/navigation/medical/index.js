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

  medicalNavigationArray.push(mastersMedicalParent)

  return medicalNavigationArray
}

const medicalNavigation = ({ userSettings, medicalAccess }) => composeMedicalNavigation({ userSettings, medicalAccess })

export default medicalNavigation
