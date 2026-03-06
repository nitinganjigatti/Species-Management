import React from 'react'
import PatientDetails from 'src/components/hospital/PatientDetails/PatientDetails'
import enforceModuleAccess from 'src/components/ProtectedRoute'

const FollowUpDetails = () => {
  return <PatientDetails category='Follow Up' />
}

export default enforceModuleAccess(FollowUpDetails, 'add_hospital')
