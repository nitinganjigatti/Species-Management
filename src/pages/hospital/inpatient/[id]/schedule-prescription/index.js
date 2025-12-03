import React from 'react'
import AddMedicineToPrescription from 'src/components/hospital/prescriptionMonitoring/AddMedicineToPrescription'
import enforceModuleAccess from 'src/components/ProtectedRoute'

function AddPrescription() {
  return <AddMedicineToPrescription />
}

export default enforceModuleAccess(AddPrescription, 'add_hospital')