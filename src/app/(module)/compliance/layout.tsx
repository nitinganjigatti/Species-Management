'use client'

import { ReactNode, useEffect, Suspense } from 'react'
import { notFound } from 'next/navigation'
import { useAuth } from 'src/hooks/useAuth'
import useSafeRouter from 'src/hooks/useSafeRouter'
import Spinner from 'src/@core/components/spinner'

interface ComplianceLayoutProps {
  children: ReactNode
}

const LoadingFallback = () => <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>

export default function ComplianceLayout({ children }: ComplianceLayoutProps) {
  const authData = useAuth()
  const router = useSafeRouter()
  const userData = authData?.userData as any
  const hasComplianceAccess = userData?.roles?.settings?.compliance_module

  useEffect(() => {
    if (!authData.loading && !hasComplianceAccess) {
      notFound()
    }
  }, [authData.loading, hasComplianceAccess, router])

  if (authData.loading) {
    return <Spinner sx={{}} />
  }

  if (!hasComplianceAccess) {
    notFound()
  }

  return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
}
