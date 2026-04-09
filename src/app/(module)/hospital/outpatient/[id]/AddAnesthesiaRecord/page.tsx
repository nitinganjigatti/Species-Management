'use client'

import { Suspense } from 'react'
import AddAnesthesiaRecordPage from 'src/components/hospital/outpatient/AddAnesthesiaRecordPage'


function AddAnesthesiaRecordPageWrapper() {
  return <AddAnesthesiaRecordPage />
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddAnesthesiaRecordPageWrapper />
    </Suspense>
  )
}
