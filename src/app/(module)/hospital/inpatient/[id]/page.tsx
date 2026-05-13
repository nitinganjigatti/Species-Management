'use client'

import { useParams } from 'next/navigation'
import PatientDetails from 'src/components/hospital/PatientDetails/PatientDetails'

export default function Page() {
  const params = useParams()
  return <PatientDetails category='Inpatient' params={{ id: params?.id }} />
}
