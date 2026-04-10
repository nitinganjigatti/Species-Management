import React from 'react'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import AddSymptoms from 'src/components/hospital/inpatient/AddSymptoms'

function AddSymptomsPage() {
  return <AddSymptoms category = 'Follow Up'/>
}

export default enforceModuleAccess(AddSymptomsPage, 'add_hospital')
