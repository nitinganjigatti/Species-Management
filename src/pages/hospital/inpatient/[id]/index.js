import React from 'react'
import PatientDetails from 'src/components/hospital/PatientDetails/PatientDetails'
import enforceModuleAccess from 'src/components/ProtectedRoute'

const InpatientDetails = () => {
  return <PatientDetails category='Inpatient' />
}

export default enforceModuleAccess(InpatientDetails, 'add_hospital')
