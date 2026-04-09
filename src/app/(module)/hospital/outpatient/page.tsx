'use client'

import { Suspense } from 'react'
import Outpatient from 'src/components/hospital/outpatient/Outpatient'

export const dynamic = 'force-dynamic'

function OutpatientContent() {
  return <Outpatient />
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OutpatientContent />
    </Suspense>
  )
}
