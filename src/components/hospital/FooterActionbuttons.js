import React from 'react'
import { useTheme } from '@mui/material/styles'
import { Box, Button, useMediaQuery } from '@mui/material'

export default function ActionButtons() {
  const theme = useTheme()
  const isSmallDevice = useMediaQuery(theme.breakpoints.down('lg'))
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: isSmallDevice ? '0px' : '295px',
        right: 0,
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 4,
        p: 6,
        background: theme.palette.common.white,
        borderRadius: '6px 6px 0 0',
        zIndex: 1200,
        mt: 4,
        width: isSmallDevice ? '100%' : '82%'
      }}
    >
      <Button
        variant='outlined'
        sx={{
          borderRadius: '8px',
          textTransform: 'uppercase',
          fontWeight: 500,
          fontSize: '15px',
          color: theme.palette.customColors.OnSurfaceVariant,
          borderColor: theme.palette.customColors.OnSurfaceVariant,
          px: 24,
          py: 3
        }}
      >
        Cancel
      </Button>

      <Button
        variant='contained'
        sx={{
          borderRadius: '8px',
          textTransform: 'uppercase',
          fontWeight: 500,
          fontSize: '15px',
          px: 28
        }}
      >
        Add
      </Button>
    </Box>
  )
}
