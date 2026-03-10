import { Box, Typography } from '@mui/material'
import React from 'react'

interface AnimalAssessmentProps {
  selectedTab?: string
  setSelectedTab?: (tab: string) => void
  animalDetails?: any
  enclosureDetails?: any
}

const AnimalAssessment: React.FC<AnimalAssessmentProps> = ({
  selectedTab,
  setSelectedTab,
  animalDetails,
  enclosureDetails
}) => {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant='h6' sx={{ mb: 3 }}>
        Assessment
      </Typography>
      <Typography color='text.secondary'>
        Assessment tab content - To be implemented (similar to mobile measurements tab)
      </Typography>
    </Box>
  )
}

export default AnimalAssessment
