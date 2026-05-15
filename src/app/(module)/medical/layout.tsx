'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from 'src/hooks/useAuth'

interface MedicalLayoutProps {
  children: ReactNode
}

export default function MedicalLayout({ children }: MedicalLayoutProps) {
  const authData = useAuth() as any
  const router = useRouter()

  const userSettings = authData?.userData?.permission?.user_settings
  const hasMedicalAccess =
    authData?.userData?.roles?.settings?.medical_records ||
    userSettings?.medical_add_complaints ||
    userSettings?.medical_add_diagnosis

  useEffect(() => {
    if (!authData.loading && !hasMedicalAccess) {
      router.replace('/404')
    }
  }, [authData.loading, hasMedicalAccess, router])

  if (authData.loading || !hasMedicalAccess) return null

  return <>{children}</>
}
