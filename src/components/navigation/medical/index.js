const composeMedicalNavigation = ({ userSettings }) => {
  const Title = {
    sectionTitle: 'Medical'
  }

  const mastersMedicalParent = {
    title: 'Masters',
    path: '/medical/masters/',
    icon: 'uil:setting',
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

  const medicalNavigationArray = []

  if (userSettings?.medical_add_complaints || userSettings?.medical_add_diagnosis) {
    medicalNavigationArray.push(Title)
  }

  if (userSettings?.medical_add_complaints) {
    mastersMedicalParent.children.push(complaints)
  }
  if (userSettings?.medical_add_diagnosis) {
    mastersMedicalParent.children.push(diagnosis)
  }

  // medicalNavigationArray.push(Title)
  // mastersMedicalParent.children.push(complaints, diagnosis)
  medicalNavigationArray.push(mastersMedicalParent)

  return medicalNavigationArray
}

const medicalNavigation = ({ userSettings }) => composeMedicalNavigation({ userSettings })

export default medicalNavigation
