'use client'

import { Box } from '@mui/material'
import { useParams } from 'next/navigation'
import AnimalDetailsPage from 'src/components/housing/pages/AnimalDetailsPage'

const HousingAnimalDetailsPage = () => {
  const params = useParams<{ id: string }>()
  const id = params?.id

  if (!id) return null

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AnimalDetailsPage id={id} />
    </Box>
  )
}

export default HousingAnimalDetailsPage
