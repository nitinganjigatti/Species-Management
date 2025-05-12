import React from 'react'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Utility from 'src/utility'

const BatchOption = ({ option, ...props }) => {
  const theme = useTheme()

  return (
    <Box
      component='li'
      {...props}
      sx={{
        border: '1px solid transparent',
        '&:last-child': {
          borderBottom: 'none'
        },
        m: 3,
        '&:hover': {
          border: `1px solid ${theme.palette.customColors.neutral05}`
        },
        borderRadius: '2px'
      }}
    >
      <Box sx={{ p: 1 }}>
        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }} color='customColors.customHeadingTextColor'>
          {option.label}
        </Typography>
        <Typography sx={{ fontSize: '0.875rem', fontWeight: 400 }} color='customColors.neutralSecondary'>
          Expiry Date: {Utility.formatDisplayDate(option.expiry_date)}
        </Typography>
        <Typography sx={{ fontSize: '0.875rem', fontWeight: 400 }} color='primary.main'>
          Availability: {option.available_item_qty}
        </Typography>
      </Box>
    </Box>
  )
}

export default React.memo(BatchOption)
