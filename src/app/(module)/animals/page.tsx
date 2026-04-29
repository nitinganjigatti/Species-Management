'use client'

import { Box } from '@mui/material'
import AnimalsListing from 'src/components/animals/AnimalsListing'

const AnimalsPage = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh'
      }}
    >
      <AnimalsListing />
    </Box>
  )
}

export default AnimalsPage
