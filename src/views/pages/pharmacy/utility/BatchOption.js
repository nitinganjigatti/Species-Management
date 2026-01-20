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
      key={option.value}
      sx={{
        padding: '0px !important',
        margin: '5px',
        Width: '100%!important'
      }}
    >
      <Box
        sx={{
          padding: '8px !important',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}
      >
        <Typography
          sx={{
            color: 'customColors.OnSurfaceVariant',
            fontSize: '14px',
            fontWeight: '600',
            lineHeight: '16.94px'
          }}
        >
          {option.label}
        </Typography>
        <Typography
          sx={{
            fontSize: '12px',
            fontWeight: '400',
            lineHeight: '14.52px',
            color: 'customColors.neutralSecondary'
          }}
        >
          Expiry Date: {Utility.formatDisplayDate(option.expiry_date)}
        </Typography>
        <Typography
          sx={{
            color: 'primary.main',
            fontSize: '0.875rem',
            fontWeight: 400
          }}
        >
          Availability: {option.available_item_qty}
        </Typography>
      </Box>
    </Box>
  )
}

export default React.memo(BatchOption)
