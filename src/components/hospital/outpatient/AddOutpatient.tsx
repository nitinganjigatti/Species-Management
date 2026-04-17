import React from 'react'
import AddPatientForm from 'src/components/hospital/AddPatientForm/AddPatientForm'
import useSafeRouter from 'src/hooks/useSafeRouter'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'

const AddPatient = () => {
  const router = useSafeRouter()

  return (
    <>
      <DynamicBreadcrumbs
        pageItems={[
          { title: 'Hospital' },
          { title: 'Patients' },
          { title: 'Outpatients', onClick: () => router.back() },
          { title: 'Add Patient' }
        ]}
      />
      <AddPatientForm defaultTreatmentType='opd' />
    </>
  )
}

export default AddPatient
