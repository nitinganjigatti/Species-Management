import { Box, Typography } from '@mui/material'
import React from 'react'

interface AnimalHospitalTransferProps {
  selectedTab?: string
  setSelectedTab?: (tab: string) => void
  animalDetails?: any
  enclosureDetails?: any
}

const AnimalHospitalTransfer: React.FC<AnimalHospitalTransferProps> = ({
  selectedTab,
  setSelectedTab,
  animalDetails,
  enclosureDetails
}) => {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant='h6' sx={{ mb: 3 }}>
        Hospital Transfer
      </Typography>
      <Typography color='text.secondary'>
        Hospital Transfer tab content - To be implemented (similar to mobile hospital transfer tab)
      </Typography>
    </Box>
  )
}

export default AnimalHospitalTransfer
