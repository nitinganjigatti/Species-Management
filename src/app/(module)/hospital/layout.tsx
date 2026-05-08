'use client'

import { ReactNode, useEffect, Suspense } from 'react'
import { useAuth } from 'src/hooks/useAuth'
import useSafeRouter from 'src/hooks/useSafeRouter'
import Spinner from 'src/@core/components/spinner'

interface HospitalLayoutProps {
  children: ReactNode
}

const LoadingFallback = () => <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>

export default function HospitalLayout({ children }: HospitalLayoutProps) {
  const authData = useAuth()
  const router = useSafeRouter()

  const hasHospitalAccess = (authData?.userData as any)?.roles?.settings?.add_hospital

  useEffect(() => {
    if (!authData.loading && !hasHospitalAccess) {
      // router.replace('/404')
    }
  }, [authData.loading, hasHospitalAccess, router])

  if (authData.loading) {
    return <Spinner sx={{}} />
  }

  if (!hasHospitalAccess) {
    return null
  }

  return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
}
