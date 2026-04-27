'use client'

import { ReactNode } from 'react'

import UserLayout from 'src/layouts/UserLayout'
import Spinner from 'src/@core/components/spinner'
import AuthGuard from 'src/@core/components/auth/AuthGuard'
import AclGuard from 'src/@core/components/auth/AclGuard'
import { defaultACLObj } from 'src/configs/acl'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthGuard fallback={<Spinner sx={{}} />}>
      <AclGuard aclAbilities={defaultACLObj} authGuard guestGuard={false}>
        <UserLayout contentHeightFixed={false}>{children}</UserLayout>
      </AclGuard>
    </AuthGuard>
  )
}
