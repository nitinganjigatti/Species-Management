'use client'

import { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { useAuth } from 'src/hooks/useAuth'
import Spinner from 'src/@core/components/spinner'
import type { AccessFlag } from 'src/constants/accessFlags'

interface RouteGuardProps {
  /**
   * Flag key under `auth.userData.roles.settings` that controls access.
   * Use values from `ACCESS_FLAGS` (src/constants/accessFlags.ts) so renames
   * surface as TS errors at every call site instead of silent runtime 404s.
   */
  accessFlag: AccessFlag
  children: ReactNode
}

/**
 * Route-level permission gate for App Router module layouts.
 * Renders a spinner while auth is loading, triggers the App Router 404 (`src/app/not-found.tsx`)
 * synchronously when the user lacks the named flag, and renders children once access is confirmed.
 *
 * Uses `notFound()` instead of `router.replace('/404')` to avoid a cross-router round-trip
 * (App Router → Pages Router `src/pages/404.js`) which causes a visible double-load.
 *
 * Usage:
 *   export default function CollectionLayout({ children }) {
 *     return <RouteGuard accessFlag={ACCESS_FLAGS.collection}>{children}</RouteGuard>
 *   }
 */
export default function RouteGuard({ accessFlag, children }: RouteGuardProps) {
  const auth = useAuth() as any
  const accessAllowed = auth?.userData?.roles?.settings?.[accessFlag]

  if (auth.loading) {
    return <Spinner sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }} />
  }

  if (!accessAllowed) notFound()

  return <>{children}</>
}
