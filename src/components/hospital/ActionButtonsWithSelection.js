import React from 'react'
import { useTheme } from '@mui/material/styles'
import { Box, Button, CircularProgress, Typography, useMediaQuery } from '@mui/material'

export default function ActionButtonsWithSelection({ 
  selectedCount = 0,
  cancelLabel, 
  addLabel, 
  onCancel, 
  onAdd, 
  width, 
  height, 
  isSubmitLoading 
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
        justifyContent: 'space-between',
        alignItems: 'center',
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
      {/* Selection Counter */}
      <Typography
        sx={{
          fontSize: '20px',
          fontWeight: 500,
          color: theme.palette.customColors.OnSurface,
        }}
      >
        Selected - {selectedCount}
      </Typography>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 4 }}>
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
          disabled={isSubmitLoading}
          sx={{
            borderRadius: '8px',
            textTransform: 'uppercase',
            fontWeight: 500,
            fontSize: '15px',
            width,
            height,
            display: 'flex',
            gap: 2,
            backgroundColor: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: '#45a049'
            }
          }}
        >
          {isSubmitLoading ? <CircularProgress size={20} color='inherit' /> : addLabel}
        </Button>
      </Box>
    </Box>
  )
}