// ** React Imports
import { useEffect } from 'react'

// ** Next Import
import { useSafeRouter } from 'src/hooks/useSafeRouter'

// ** Hooks Import
import { useAuth } from 'src/hooks/useAuth'

const GuestGuard = props => {
  const { children, fallback } = props
  const auth = useAuth()
  const router = useSafeRouter()
  useEffect(() => {
    if (!router.isReady) {
      return
    }

    const userData = window.localStorage.getItem('userData')
    if (userData) {
      router.replace('/')
    }
  }, [router.isReady, router.route])

  if (auth.loading || (!auth.loading && auth.user !== null)) {
    return fallback
  }

  return <>{children}</>
}

export default GuestGuard
