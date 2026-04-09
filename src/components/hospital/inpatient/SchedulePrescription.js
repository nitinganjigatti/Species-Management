import React from 'react'
import AddMedicineToPrescription from 'src/components/hospital/prescriptionMonitoring/AddMedicineToPrescription'

function AddPrescription({ params }) {
  return <AddMedicineToPrescription from='inPatient' params={params} />
}

export default AddPrescription
