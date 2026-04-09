'use client'

import dynamicImport from 'next/dynamic'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

const Discharged = dynamicImport(() => import('src/components/hospital/discharged/Discharged'), {
  ssr: false,
  loading: () => <div>Loading...</div>
})

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Discharged />
    </Suspense>
  )
}
