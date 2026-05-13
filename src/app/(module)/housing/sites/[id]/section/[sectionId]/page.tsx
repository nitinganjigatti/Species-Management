'use client'

import { Box } from '@mui/material'
import { useParams } from 'next/navigation'
import SectionDetailsPage from 'src/components/housing/pages/SectionDetailsPage'

const HousingSectionDetailsPage = () => {
  const params = useParams<{ id: string; sectionId: string }>()
  const sectionId = params?.sectionId

  if (!sectionId) return null

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <SectionDetailsPage id={sectionId} siteId={params?.id} />
    </Box>
  )
}

export default HousingSectionDetailsPage
