import React from 'react'
import PatientDetails from 'src/components/hospital/PatientDetails/PatientDetails'
import enforceModuleAccess from 'src/components/ProtectedRoute'

const MortalityDetails = () => {
  return <PatientDetails category='Mortality' />
}

export default enforceModuleAccess(MortalityDetails, 'add_hospital')
