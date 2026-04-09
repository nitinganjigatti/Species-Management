'use client'

import { Suspense } from 'react'
import Followup from 'src/components/hospital/followup/Followup'

export const dynamic = 'force-dynamic'

function FollowupContent() {
  return <Followup />
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FollowupContent />
    </Suspense>
  )
}
