'use client'
import { ReactNode, useEffect, Suspense } from 'react'
import { notFound } from 'next/navigation'
import { useAuth } from 'src/hooks/useAuth'
import useSafeRouter from 'src/hooks/useSafeRouter'
import Spinner from 'src/@core/components/spinner'
interface NecropsyLayoutProps {
  children: ReactNode
}
const LoadingFallback = () => <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
export default function NecropsyLayout({ children }: NecropsyLayoutProps) {
  const authData = useAuth()
  const router = useSafeRouter()
  const userData = authData?.userData as any
  const enableAddNecropsyReport = userData?.roles?.settings?.enable_add_necropsy_report
  const allowCarcassCollection = userData?.roles?.settings?.allow_carcass_collection
  const hasPermissionToAddNecropsyCenter = userData?.permission?.user_settings?.add_necropsy_center
  const hasNecropsyAccess = enableAddNecropsyReport || allowCarcassCollection || hasPermissionToAddNecropsyCenter
  useEffect(() => {
    if (!authData.loading && !hasNecropsyAccess) {
      notFound()
    }
  }, [authData.loading, hasNecropsyAccess, router])
  if (authData.loading) {
    return <Spinner sx={{}} />
  }
  if (!hasNecropsyAccess) {
    notFound()
  }
  return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
}
