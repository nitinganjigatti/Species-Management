import React from 'react'
import HospitalRoomDetails from 'src/components/hospital/hospitalMaster/HospitalRoomDetails'
import enforceModuleAccess from 'src/components/ProtectedRoute'

function hospitalRoomDetail() {
  return <HospitalRoomDetails />
}

export default enforceModuleAccess(hospitalRoomDetail, 'add_hospital')
