'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from 'src/hooks/useAuth'

interface HousingLayoutProps {
  children: ReactNode
}

export default function HousingLayout({ children }: HousingLayoutProps) {
  const auth = useAuth() as any
  const router = useRouter()

  const accessAllowed = auth?.userData?.roles?.settings?.enable_housing_in_web

  useEffect(() => {
    if (!auth.loading && !accessAllowed) {
      router.replace('/404')
    }
  }, [auth.loading, accessAllowed, router])

  if (auth.loading || !accessAllowed) return null

  return <>{children}</>
}
