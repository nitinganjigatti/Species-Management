'use client'

import { Box } from '@mui/material'
import { useParams } from 'next/navigation'
import SectionDetailsPage from 'src/components/housing/pages/SectionDetailsPage'

const HousingSectionDetailsPage = () => {
  const params = useParams<{ id: string }>()
  const id = params?.id

  if (!id) return null

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <SectionDetailsPage id={id} />
    </Box>
  )
}

export default HousingSectionDetailsPage
