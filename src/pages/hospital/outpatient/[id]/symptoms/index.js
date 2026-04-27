import React from 'react'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import AddSymptoms from 'src/components/hospital/inpatient/AddSymptoms'

function AddSymptomsPage() {
  return (
  <>
  <AddSymptoms category='Outpatients' />
  </>)
}

export default enforceModuleAccess(AddSymptomsPage, 'add_hospital')
