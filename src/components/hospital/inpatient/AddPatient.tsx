'use client'
import React from 'react'
import AddPatientForm from 'src/components/hospital/AddPatientForm/AddPatientForm'
import { Breadcrumbs, Typography } from '@mui/material'
import useSafeRouter from 'src/hooks/useSafeRouter'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'

const AddPatient = () => {
  const router: any = useSafeRouter()

  return (
    <>
      <DynamicBreadcrumbs
          pageItems={[
            { title: 'Hospital' },
            { title: 'Patients' },
            { title: 'Inpatient', onClick: () => router.back() },
            { title: 'Add Patient' },
          ]}/>
      <AddPatientForm defaultTreatmentType='inpatient' />
    </>
  )
}

export default AddPatient
