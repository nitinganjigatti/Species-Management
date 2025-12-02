import React from 'react'
import PatientDetails from 'src/components/hospital/PatientDetails/PatientDetails'
import enforceModuleAccess from 'src/components/ProtectedRoute'

const DischargeDetails = () => {
  return <PatientDetails category='Discharged' />
}

export default enforceModuleAccess(DischargeDetails, 'add_hospital')
