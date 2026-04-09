'use client'

import { Suspense } from 'react'
import Inpatient from 'src/components/hospital/inpatient/Inpatient'

export const dynamic = 'force-dynamic'

function InpatientContent() {
  return <Inpatient />
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InpatientContent />
    </Suspense>
  )
}
