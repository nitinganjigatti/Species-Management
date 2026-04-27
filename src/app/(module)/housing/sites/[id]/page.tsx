'use client'

import { Box } from '@mui/material'
import { useParams } from 'next/navigation'
import SiteDetailsPage from 'src/components/housing/pages/SiteDetailsPage'

const HousingSiteDetailsPage = () => {
  const params = useParams<{ id: string }>()
  const id = params?.id

  if (!id) return null

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <SiteDetailsPage id={id} />
    </Box>
  )
}

export default HousingSiteDetailsPage
