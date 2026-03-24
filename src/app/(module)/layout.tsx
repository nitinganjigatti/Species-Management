'use client'

import { ReactNode, useEffect } from 'react'
import { useAuth } from 'src/hooks/useAuth'
import { useRouter } from 'next/navigation'

// ** Layout Import
import UserLayout from 'src/layouts/UserLayout'

// ** Spinner Import
import Spinner from 'src/@core/components/spinner'

// ** ACL Guard for App Router
import AclGuard from 'src/app/components/AclGuard'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const auth = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!auth.loading && !auth.user) {
      router.push('/login/')
    }
  }, [auth.loading, auth.user, router])

  if (auth.loading) {
    return <Spinner sx={{}} />
  }

  if (!auth.user) {
    return <Spinner sx={{}} />
  }

  return (
    <AclGuard>
      <UserLayout contentHeightFixed={false}>{children}</UserLayout>
    </AclGuard>
  )
}
