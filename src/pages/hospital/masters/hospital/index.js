import React from 'react'
import HospitalDetails from 'src/components/hospital/hospitalMaster/HospitalDetails'
import enforceModuleAccess from 'src/components/ProtectedRoute'

const Hospital = () => {
  return (
    <div>
      <HospitalDetails />
    </div>
  )
}

export default enforceModuleAccess(Hospital, 'add_hospital')
