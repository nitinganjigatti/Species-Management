'use client'
import { ReactNode, useEffect, Suspense } from 'react'
import { notFound } from 'next/navigation'
import { useAuth } from 'src/hooks/useAuth'
import useSafeRouter from 'src/hooks/useSafeRouter'
import Spinner from 'src/@core/components/spinner'
interface NecropsyCenterLayoutProps {
  children: ReactNode
}
const LoadingFallback = () => <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
export default function NecropsyCenterLayout({ children }: NecropsyCenterLayoutProps) {
  const authData = useAuth()
  const router = useSafeRouter()
  const hasNecropsyCenterAccess = (authData?.userData as any)?.permission?.user_settings?.add_necropsy_center
  useEffect(() => {
    if (!authData.loading && !hasNecropsyCenterAccess) {
      notFound()
    }
  }, [authData.loading, hasNecropsyCenterAccess, router])
  if (authData.loading) {
    return <Spinner sx={{}} />
  }
  if (!hasNecropsyCenterAccess) {
    notFound()
  }
  return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
}
