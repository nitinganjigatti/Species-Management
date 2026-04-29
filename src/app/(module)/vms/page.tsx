'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from 'src/hooks/useAuth'

const VmsHome = () => {
  const router = useRouter()
  const auth = useAuth()
  const settings = (auth as any)?.userData?.roles?.settings

  useEffect(() => {
    if (settings?.vms_reports) {
      router.replace('/vms/dashboard/')
    } else if (settings?.vms_scan) {
      router.replace('/vms/scan/')
    } else if (settings?.vms_pass_view) {
      router.replace('/vms/passes/')
    } else {
      router.replace('/404')
    }
  }, [settings, router])

  return null
}

export default VmsHome
