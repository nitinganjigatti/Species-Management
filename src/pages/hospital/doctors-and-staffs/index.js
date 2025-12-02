import React from 'react'
import DoctorsList from 'src/components/hospital/DoctorsAndStaffs/DoctorsList'
import enforceModuleAccess from 'src/components/ProtectedRoute'

const DoctorsAndStaffs = () => {
  return <DoctorsList />
}

export default enforceModuleAccess(DoctorsAndStaffs, 'add_hospital')
