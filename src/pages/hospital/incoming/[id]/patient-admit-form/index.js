import PatientAdmitForm from 'src/components/hospital/PatientAdmissionForm/PatientAdmitForm'
import React from 'react'
import enforceModuleAccess from 'src/components/ProtectedRoute'

const AdmitPatientForm = () => {
  return <PatientAdmitForm />
}

export default enforceModuleAccess(AdmitPatientForm, 'add_hospital')
