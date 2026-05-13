import React from 'react'
import AddMedicineToPrescription from 'src/components/hospital/prescriptionMonitoring/AddMedicineToPrescription'

interface AddPrescriptionProps {
  params?: any
}

function AddPrescription({ params }: AddPrescriptionProps) {
  return <AddMedicineToPrescription from='inPatient' params={params} />
}

export default AddPrescription
