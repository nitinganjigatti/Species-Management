import React from 'react'
import AddPatientForm from 'src/components/hospital/AddPatientForm/AddPatientForm'
import enforceModuleAccess from 'src/components/ProtectedRoute'

const AddPatient = () => {
  return <AddPatientForm />
}

export default enforceModuleAccess(AddPatient, 'add_hospital')
