'use client'

import { Suspense } from 'react'
import Mortality from 'src/components/hospital/mortality/Mortality'

export const dynamic = 'force-dynamic'

function MortalityContent() {
  return <Mortality />
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MortalityContent />
    </Suspense>
  )
}
