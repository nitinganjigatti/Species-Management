import React from 'react'
import AddPatientForm from 'src/components/hospital/AddPatientForm/AddPatientForm'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import { Breadcrumbs, Typography } from '@mui/material'
import { useRouter } from 'next/router'

const AddPatient = () => {
  const router = useRouter()

  return (
    <>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Hospital</Typography>
        <Typography onClick={() => router.back()} sx={{ cursor: 'pointer', color: 'text.primary' }}>
          Inpatients
        </Typography>
        <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Add Patient</Typography>
      </Breadcrumbs>
      <AddPatientForm />
    </>
  )
}

export default enforceModuleAccess(AddPatient, 'add_hospital')
