'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import PatientDetails from 'src/components/hospital/PatientDetails/PatientDetails'

const FollowUpDetails = () => {
  const params = useParams()
  return <PatientDetails category='Follow Up' params={{ id: params?.id }} />
}

export default FollowUpDetails
