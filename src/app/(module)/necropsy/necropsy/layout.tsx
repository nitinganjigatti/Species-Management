'use client'
import { ReactNode, useEffect, Suspense } from 'react'
import { notFound } from 'next/navigation'
import { useAuth } from 'src/hooks/useAuth'
import useSafeRouter from 'src/hooks/useSafeRouter'
import Spinner from 'src/@core/components/spinner'
interface NecropsyDashboardLayoutProps {
  children: ReactNode
}
const LoadingFallback = () => <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
export default function NecropsyDashboardLayout({ children }: NecropsyDashboardLayoutProps) {
  const authData = useAuth()
  const router = useSafeRouter()
  const hasNecropsyDashboardAccess = (authData?.userData as any)?.roles?.settings?.enable_add_necropsy_report
  useEffect(() => {
    if (!authData.loading && !hasNecropsyDashboardAccess) {
      notFound()
    }
  }, [authData.loading, hasNecropsyDashboardAccess, router])
  if (authData.loading) {
    return <Spinner sx={{}} />
  }
  if (!hasNecropsyDashboardAccess) {
    notFound()
  }
  return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
}
