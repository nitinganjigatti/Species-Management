'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import PatientDetails from 'src/components/hospital/PatientDetails/PatientDetails'

const InpatientDetails = () => {
  const params = useParams()
  return <PatientDetails category='Inpatient' params={{ id: params?.id }} />
}

export default InpatientDetails
