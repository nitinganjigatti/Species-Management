'use client'

import { ReactNode, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from 'src/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useAntzAuth } from '@antzsoft/wso2-auth-web/react'

// ** Layout Import
import UserLayout from 'src/layouts/UserLayout'

// ** Spinner Import
import Spinner from 'src/@core/components/spinner'

// ** ACL Guard for App Router
import AclGuard from 'src/configs/AclGuard'

// ** WSO2 Auth Client + Flag
import client from 'src/lib/auth/wso2Client'
import { isWso2AuthEnabled } from 'src/lib/auth/authMode'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const auth = useAuth()
  const router = useRouter()
  const wso2 = isWso2AuthEnabled()

  // Hook always runs; result only consumed in WSO2 mode. In non-SSO it goes
  // idle→unauthenticated quickly with no side effects.
  const { status } = useAntzAuth(client)

  // Mid-session auto-logout — see AuthGuard.js for the same pattern.
  // Route through AuthContext.handleLogout (NOT the package's logout) so the
  // auto-logout clears app-specific localStorage keys (accessToken/role/
  // selectedStore/userData/userDetails) in addition to antz_auth_*.
  const wasAuthRef = useRef(false)
  const firedRef = useRef(false)
  useEffect(() => {
    if (!wso2) return
    if (status === 'authenticated') {
      wasAuthRef.current = true
    } else if (status === 'unauthenticated' && wasAuthRef.current && !firedRef.current) {
      firedRef.current = true
      toast.error('Your session has expired. Please log in again.', { duration: 2500 })
      auth.logout()
    }
  }, [wso2, status, auth])

  useEffect(() => {
    // Wait for silent-restore before redirecting — otherwise a returning user
    // is bounced to /login before tokens are pulled from sessionStorage.
    if (wso2 && (status === 'idle' || status === 'loading')) return
    if (!auth.loading && !auth.user) {
      router.push('/login/')
    }
  }, [auth.loading, auth.user, router, status, wso2])

  // Hold the spinner only during the FIRST silent-restore (idle / loading
  // before we've ever been authenticated). Once we've been authenticated
  // once, ignore subsequent 'loading' transitions during silent token
  // refresh — otherwise every refresh tears down all children, remounts
  // dashboard components, and refires every React Query.
  const isInitialAuthLoading = wso2 && (status === 'idle' || (status === 'loading' && !wasAuthRef.current))
  if (isInitialAuthLoading) {
    return <Spinner sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }} />
  }

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
  )
}