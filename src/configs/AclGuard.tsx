'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

// ** Context Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'

// ** Config Import
// @ts-ignore
import { buildAbilityFor, defaultACLObj } from 'src/configs/acl'

// ** Component Import
import Spinner from 'src/@core/components/spinner'
// @ts-ignore
import BlankLayout from 'src/@core/layouts/BlankLayout'

// ** Hooks
import { useAuth } from 'src/hooks/useAuth'

interface AclGuardProps {
  children: ReactNode
  aclAbilities?: {
    action: string
    subject: string
  }
}

const AclGuard = ({ children, aclAbilities = defaultACLObj }: AclGuardProps) => {
  const auth = useAuth() as any
  const router = useRouter()
  const pathname = usePathname()

  // Build ability for the user based on their role
  const ability = auth.user ? buildAbilityFor(auth.user.role, aclAbilities.subject) : null

  useEffect(() => {
    // Redirect to dashboard if user is on root path
    if (auth.user && auth.user.role && pathname === '/') {
      router.replace('/dashboard/')
    }
  }, [auth.user, pathname, router])

  // Show spinner while loading
  if (auth.loading) {
    return <Spinner sx={{}} />
  }

  // If user is logged in and ability is built
  if (auth.user && ability) {
    // Check if user has permission
    if (ability.can(aclAbilities.action, aclAbilities.subject)) {
      return <AbilityContext.Provider value={ability as any}>{children}</AbilityContext.Provider>
    }

    // User doesn't have permission - show 401
    return (
      <BlankLayout>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column'
        }}>
          <h1>401</h1>
          <p>You are not authorized to access this page.</p>
        </div>
      </BlankLayout>
    )
  }

  // User not logged in - this shouldn't happen as dashboard layout handles auth
  return <Spinner sx={{}} />
}

export default AclGuard
