'use client'

import React from 'react'
import { useTheme } from '@mui/material/styles'
import { Box, Button, CircularProgress, Typography, useMediaQuery } from '@mui/material'
import { useSettings } from 'src/@core/hooks/useSettings'
import themeConfig from 'src/configs/themeConfig'

export default function ActionButtonsWithSelection({
  selectedCount = 0,
  cancelLabel,
  addLabel,
  onCancel,
  onAdd,
  width,
  height,
  isSubmitLoading,
  isCancelLoading
}) {
  const theme = useTheme()
  const { settings } = useSettings()
  const { navCollapsed } = settings
  const { navigationSize, collapsedNavigationSize } = themeConfig
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'))

  const leftOffset = isMobile ? 0 : navCollapsed ? collapsedNavigationSize : navigationSize

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: `${leftOffset}px`,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 4,
        p: 6,
        background: theme.palette.common.white,
        borderRadius: '6px 6px 0 0',
        zIndex: 100,
        mt: 4,
        boxShadow: '0 -4px 6px rgba(0,0,0,0.1)'
      }}
    >
      {/* Selection Counter */}
      <Typography
        sx={{
          fontSize: '20px',
          fontWeight: 500,
          color: theme.palette.customColors.OnSurface
        }}
      >
        Selected - {selectedCount}
      </Typography>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 4 }}>
        <Button
          variant='outlined'
          disabled={isSubmitLoading || isCancelLoading}
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
          {isCancelLoading ? <CircularProgress size={20} color='inherit' /> : cancelLabel}
        </Button>

        <Button
          variant='contained'
          onClick={onAdd}
          disabled={isSubmitLoading || isCancelLoading}
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