'use client'

import { Box } from '@mui/material'
import { useParams } from 'next/navigation'
import ClusterDetailsPage from 'src/components/housing/pages/ClusterDetailsPage'

const HousingClusterDetailsPage = () => {
  const params = useParams<{ id: string }>()
  const id = params?.id

  if (!id) return null

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <ClusterDetailsPage id={id} />
    </Box>
  )
}

export default HousingClusterDetailsPage
