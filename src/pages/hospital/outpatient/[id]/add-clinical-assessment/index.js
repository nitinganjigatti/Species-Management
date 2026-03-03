import React from 'react'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import AddClinicalAssessment from 'src/components/hospital/inpatient/AddClinicalAssessment'

function AddClinicalAssessmentPage() {
  return <AddClinicalAssessment from='outPatient' />
}

export default enforceModuleAccess(AddClinicalAssessmentPage, 'add_hospital')
