'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from 'src/hooks/useAuth'

interface LabLayoutProps {
  children: ReactNode
}

export default function LabLayout({ children }: LabLayoutProps) {
  const authData = useAuth() as any
  const router = useRouter()

  const hasLabAccess =
    (authData?.userData?.modules?.lab_data?.lab?.length ?? 0) > 0 ||
    authData?.userData?.roles?.settings?.add_lab ||
    authData?.userData?.permission?.user_settings?.medical_add_samples ||
    authData?.userData?.permission?.user_settings?.medical_add_tests ||
    authData?.userData?.permission?.user_settings?.medical_add_mortality_reasons

  useEffect(() => {
    if (!authData.loading && !hasLabAccess) {
      router.replace('/404')
    }
  }, [authData.loading, hasLabAccess, router])

  if (authData.loading || !hasLabAccess) return null

  return <>{children}</>
}
