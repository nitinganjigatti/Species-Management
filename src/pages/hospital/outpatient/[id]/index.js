import React from 'react'
import PatientDetails from 'src/components/hospital/PatientDetails/PatientDetails'
import enforceModuleAccess from 'src/components/ProtectedRoute'

const OutpatientDetails = () => {
  return <PatientDetails category='Outpatients' />
}

export default enforceModuleAccess(OutpatientDetails, 'add_hospital')
