'use client'

import { ReactNode, useEffect } from 'react'
import { useAuth } from 'src/hooks/useAuth'
import useSafeRouter from 'src/hooks/useSafeRouter'
import Spinner from 'src/@core/components/spinner'

interface HospitalLayoutProps {
  children: ReactNode
}

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

  return <>{children}</>
}
