'use client'

import { Box } from '@mui/material'
import { useParams } from 'next/navigation'
import EnclosureDetailsPage from 'src/components/housing/pages/EnclosureDetailsPage'

const HousingEnclosureDetailsPage = () => {
  const params = useParams<{ id: string }>()
  const id = params?.id

  if (!id) return null

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <EnclosureDetailsPage id={id} />
    </Box>
  )
}

export default HousingEnclosureDetailsPage
