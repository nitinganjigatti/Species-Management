'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import PatientDetails from 'src/components/hospital/PatientDetails/PatientDetails'

const DischargeDetails = () => {
  const params = useParams()
  return <PatientDetails category='Discharged' params={{ id: params?.id }} />
}

export default DischargeDetails
