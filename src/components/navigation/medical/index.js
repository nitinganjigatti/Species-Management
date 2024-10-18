const composeMedicalNavigation = () => {
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
    title: 'Complaints',
    path: '/medical/masters/complaints'
  }
  const diagnosis = {
    title: 'Diagnosis',
    path: '/medical/masters/diagnosis'
  }

  const medicalNavigationArray = []

  medicalNavigationArray.push(Title)
  mastersMedicalParent.children.push(complaints, diagnosis)
  medicalNavigationArray.push(mastersMedicalParent)

  return medicalNavigationArray
}

const medicalNavigation = () => composeMedicalNavigation()

export default medicalNavigation
