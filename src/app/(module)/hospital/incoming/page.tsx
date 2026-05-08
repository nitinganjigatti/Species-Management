'use client'

import { Suspense } from 'react'
import Incoming from 'src/components/hospital/incoming/Incoming'

export const dynamic = 'force-dynamic'

function IncomingContent() {
  return <Incoming />
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <IncomingContent />
    </Suspense>
  )
}
