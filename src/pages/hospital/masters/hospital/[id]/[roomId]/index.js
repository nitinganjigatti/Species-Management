import React from 'react'
import HospitalBedDetails from 'src/components/hospital/hospitalMaster/HospitalBedDetails'
import enforceModuleAccess from 'src/components/ProtectedRoute'

function hospitalBed() {
  return (
    <div>
      <HospitalBedDetails />
    </div>
  )
}

export default enforceModuleAccess(hospitalBed, 'add_hospital')
