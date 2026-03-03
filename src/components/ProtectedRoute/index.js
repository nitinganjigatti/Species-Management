import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { AuthContext } from 'src/context/AuthContext'
import { useAuth } from 'src/hooks/useAuth'

export default function enforceModuleAccess(PageComponent, moduleKey) {
  return function Wrapper(props) {
    const authData = useAuth(AuthContext)
    const router = useRouter()

    // Support both single key (string) and multiple keys (array) with OR logic
    const checkAccess = () => {
      if (Array.isArray(moduleKey)) {
        return moduleKey.some(key => authData?.userData?.roles?.settings?.[key])
      }

      return authData?.userData?.roles?.settings?.[moduleKey]
    }

    const accessAllowed = checkAccess()

    useEffect(() => {
      if (!accessAllowed) {
        router.replace('/404') // Custom 404 page
      }
    }, [accessAllowed])

    if (!accessAllowed) return null // Don't flash the page

    return <PageComponent {...props} />
  }
}
