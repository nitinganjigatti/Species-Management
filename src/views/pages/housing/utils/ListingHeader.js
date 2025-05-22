import { Box, Typography } from '@mui/material'
import React from 'react'

const ListingHeader = ({ title = 'Listing', totalCount = 0 }) => {
  return (
    <Box p={2}>
      <Typography variant='h6'>
        {title} ({totalCount})
      </Typography>
    </Box>
  )
}

export default React.memo(ListingHeader)
