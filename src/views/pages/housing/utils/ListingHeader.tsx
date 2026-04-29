import React from 'react'
import { Box, Typography } from '@mui/material'
import type { ListingHeaderProps } from 'src/types/housing'

const ListingHeader: React.FC<ListingHeaderProps> = ({ title = 'Listing', totalCount = 0 }) => {
  return (
    <Box
      sx={{
        p: 2,
        mt: 2
      }}
    >
      <Typography variant='h6'>
        {title} {totalCount ? `(${totalCount})` : null}
      </Typography>
    </Box>
  )
}

export default React.memo(ListingHeader)
