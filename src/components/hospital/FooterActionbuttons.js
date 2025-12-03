import React from 'react'
import { useTheme } from '@mui/material/styles'
import { Box, Button, CircularProgress, useMediaQuery } from '@mui/material'

export default function ActionButtons({
  cancelLabel,
  addLabel,
  onCancel,
  onAdd,
  width,
  height,
  isSubmitLoading,
  isAddDisabled
}) {
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
        boxShadow: '0 -4px 6px rgba(0,0,0,0.1)',
        width: isSmallDevice ? '100%' : 'auto'
      }}
    >
      <Button
        variant='outlined'
        onClick={onCancel}
        sx={{
          borderRadius: '8px',
          textTransform: 'uppercase',
          fontWeight: 500,
          fontSize: '15px',
          color: theme.palette.customColors.OnSurfaceVariant,
          borderColor: theme.palette.customColors.OnSurfaceVariant,
          width,
          height
        }}
      >
        {cancelLabel}
      </Button>

      <Button
        variant='contained'
        onClick={onAdd}
        disabled={isSubmitLoading || isAddDisabled}
        sx={{
          borderRadius: '8px',
          textTransform: 'uppercase',
          fontWeight: 500,
          fontSize: '15px',
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          opacity: isAddDisabled ? 0.7 : 1
        }}
      >
        {isSubmitLoading ? <CircularProgress size={20} color='inherit' /> : addLabel}
      </Button>
    </Box>
  )
}
