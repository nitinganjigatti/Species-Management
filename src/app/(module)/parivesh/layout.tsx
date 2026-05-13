'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from 'src/hooks/useAuth'

interface PariveshLayoutProps {
  children: ReactNode
}

export default function PariveshLayout({ children }: PariveshLayoutProps) {
  const auth = useAuth() as any
  const router = useRouter()

  const accessAllowed = auth?.userData?.roles?.settings?.enable_parivesh

  useEffect(() => {
    if (!auth.loading && !accessAllowed) {
      router.replace('/404')
    }
  }, [auth.loading, accessAllowed, router])

  if (auth.loading || !accessAllowed) return null

  return <>{children}</>
}
