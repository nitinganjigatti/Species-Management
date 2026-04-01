import React from 'react'
import AddPatientForm from 'src/components/hospital/AddPatientForm/AddPatientForm'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import { Breadcrumbs, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'

const AddPatient = () => {
  const router = useRouter()

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

export default enforceModuleAccess(AddPatient, 'add_hospital')
