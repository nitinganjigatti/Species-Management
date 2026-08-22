'use client'

// iPad route group — same auth behavior as the (module) layout, but NO UserLayout:
// pages under this group render full-screen and bring their own app shell (IpadShell).
// Keep this file's auth logic in sync with src/app/(module)/layout.tsx.

import { ReactNode, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from 'src/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useAntzAuth } from '@antzsoft/wso2-auth-web/react'

// ** Spinner Import
import Spinner from 'src/@core/components/spinner'

// ** ACL Guard for App Router
import AclGuard from 'src/configs/AclGuard'

// ** WSO2 Auth Client + Flag
import client from 'src/lib/auth/wso2Client'
import { isWso2AuthEnabled, isWso2DevIgnoreExpiry } from 'src/lib/auth/authMode'

interface IpadLayoutProps {
  children: ReactNode
}

export default function IpadLayout({ children }: IpadLayoutProps) {
  const [isHydrated, setIsHydrated] = useState(false)
  const auth = useAuth()
  const router = useRouter()
  const wso2 = isWso2AuthEnabled()

  const { status } = useAntzAuth(client)

  const wasAuthRef = useRef(false)
  const firedRef = useRef(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!wso2) return
    if (status === 'authenticated') {
      wasAuthRef.current = true
    } else if (status === 'unauthenticated' && wasAuthRef.current && !firedRef.current) {
      // TEMPORARY (2026-08-21): dev escape hatch — WSO2 dev tenant kills tokens
      // every ~150s; keep the app running on the backend JWT (see authMode.js).
      if (isWso2DevIgnoreExpiry()) return
      firedRef.current = true
      toast.error('Your session has expired. Please log in again.', { duration: 2500 })
      auth.logout()
    }
  }, [wso2, status, auth])

  useEffect(() => {
    if (wso2 && (status === 'idle' || status === 'loading')) return
    if (!auth.loading && !auth.user) {
      router.push('/login/')
    }
  }, [auth.loading, auth.user, router, status, wso2])

  const isInitialAuthLoading = wso2 && (status === 'idle' || (status === 'loading' && !wasAuthRef.current))

  if (!isHydrated) {
    return <AclGuard>{children}</AclGuard>
  }

  if (isInitialAuthLoading || auth.loading || !auth.user) {
    return <Spinner sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }} />
  }

  return <AclGuard>{children}</AclGuard>
}
