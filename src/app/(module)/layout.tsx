'use client'

<<<<<<< HEAD
import { ReactNode, useEffect } from 'react'
import { useAuth } from 'src/hooks/useAuth'
import { useRouter } from 'next/navigation'

// ** Layout Import
import UserLayout from 'src/layouts/UserLayout'

// ** Spinner Import
import Spinner from 'src/@core/components/spinner'

// ** ACL Guard for App Router
import AclGuard from 'src/configs/AclGuard'
=======
import { ReactNode } from 'react'

import UserLayout from 'src/layouts/UserLayout'
import Spinner from 'src/@core/components/spinner'
import AuthGuard from 'src/@core/components/auth/AuthGuard'
import AclGuard from 'src/@core/components/auth/AclGuard'
import { defaultACLObj } from 'src/configs/acl'
>>>>>>> diet-dev-approuter

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
<<<<<<< HEAD
  const auth = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!auth.loading && !auth.user) {
      router.push('/login/')
    }
  }, [auth.loading, auth.user, router])

  if (auth.loading) {
    return <Spinner sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }} />
  }

  if (!auth.user) {
    return <Spinner sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }} />
  }

  return (
    <AclGuard>
      <UserLayout contentHeightFixed={false}>{children}</UserLayout>
    </AclGuard>
=======
  return (
    <AuthGuard fallback={<Spinner sx={{}} />}>
      <AclGuard aclAbilities={defaultACLObj} authGuard guestGuard={false}>
        <UserLayout contentHeightFixed={false}>{children}</UserLayout>
      </AclGuard>
    </AuthGuard>
>>>>>>> diet-dev-approuter
  )
}
