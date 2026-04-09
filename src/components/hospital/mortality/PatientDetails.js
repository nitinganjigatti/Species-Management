'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import PatientDetails from 'src/components/hospital/PatientDetails/PatientDetails'

const MortalityDetails = () => {
  const params = useParams()
  return <PatientDetails category='Mortality' params={{ id: params?.id }} />
}

export default MortalityDetails
