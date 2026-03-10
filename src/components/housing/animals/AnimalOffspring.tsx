import { Box, Typography } from '@mui/material'
import React from 'react'

interface AnimalOffspringProps {
  selectedTab?: string
  setSelectedTab?: (tab: string) => void
  animalDetails?: any
  enclosureDetails?: any
}

const AnimalOffspring: React.FC<AnimalOffspringProps> = ({
  selectedTab,
  setSelectedTab,
  animalDetails,
  enclosureDetails
}) => {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant='h6' sx={{ mb: 3 }}>
        Offspring
      </Typography>
      <Typography color='text.secondary'>
        Offspring tab content - To be implemented (similar to mobile offspring tab)
      </Typography>
    </Box>
  )
}

export default AnimalOffspring
