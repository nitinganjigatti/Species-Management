'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const SpeciesManagementIndex = () => {
  const router = useRouter()
  useEffect(() => {
    router.replace('/species-management/dashboard/')
  }, [router])

  return null
}

export default SpeciesManagementIndex
