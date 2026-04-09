'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import PatientDetails from 'src/components/hospital/PatientDetails/PatientDetails'

const OutpatientDetails = () => {
  const params = useParams()
  return <PatientDetails category='Outpatients' params={{ id: params?.id }} />
}

export default OutpatientDetails
