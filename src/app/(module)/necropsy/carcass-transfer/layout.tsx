'use client'
import { ReactNode, useEffect, Suspense } from 'react'
import { notFound } from 'next/navigation'
import { useAuth } from 'src/hooks/useAuth'
import useSafeRouter from 'src/hooks/useSafeRouter'
import Spinner from 'src/@core/components/spinner'
interface CarcassTransferLayoutProps {
  children: ReactNode
}
const LoadingFallback = () => <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
export default function CarcassTransferLayout({ children }: CarcassTransferLayoutProps) {
  const authData = useAuth()
  const router = useSafeRouter()
  const hasCarcassTransferAccess = (authData?.userData as any)?.roles?.settings?.allow_carcass_collection
  useEffect(() => {
    if (!authData.loading && !hasCarcassTransferAccess) {
      notFound()
    }
  }, [authData.loading, hasCarcassTransferAccess, router])
  if (authData.loading) {
    return <Spinner sx={{}} />
  }
  if (!hasCarcassTransferAccess) {
    notFound()
  }
  return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
}
