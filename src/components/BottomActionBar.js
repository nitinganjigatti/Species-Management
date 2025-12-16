import React from 'react'
import { Box, Button, useTheme } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useSettings } from 'src/@core/hooks/useSettings'
import themeConfig from 'src/configs/themeConfig'
import useMediaQuery from '@mui/material/useMediaQuery'

const BottomActionBar = ({
  children,
  onCancel,
  onSubmit,
  loading = false,
  disabled = false,
  cancelLabel = 'CANCEL',
  submitLabel = 'ADMIT',
  showCancel = true,
  showSubmit = true,

  submitBtnStyle = {},
  cancelBtnStyle = {},
  submitBtnVariant = 'contained',
  cancelBtnVariant = 'outlined',
  layoutStyle = {},
  submitBtnProps = {},
  cancelBtnProps = {}
}) => {
  const theme = useTheme()
  const { settings } = useSettings()
  const { navCollapsed } = settings
  const { navigationSize, collapsedNavigationSize } = themeConfig
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'))

  // Calculate left offset based on navigation state
  const leftOffset = isMobile ? 0 : navCollapsed ? collapsedNavigationSize : navigationSize

  const renderButtons = () => {
    return (
      <>
        {showCancel && (
          <Button
            variant={cancelBtnVariant}
            sx={{
              borderColor: theme.palette.customColors.Outline,
              borderRadius: 0.5,
              minHeight: '56px',
              minWidth: '160px',
              ...cancelBtnStyle
            }}
            onClick={onCancel}
            disabled={loading}
            {...cancelBtnProps}
          >
            {cancelLabel}
          </Button>
        )}
        {showSubmit && (
          <LoadingButton
            loading={loading}
            disabled={disabled}
            variant={submitBtnVariant}
            sx={{
              backgroundColor: theme.palette.primary.main,
              borderRadius: 0.5,
              minHeight: '56px',
              minWidth: '160px',
              ...submitBtnStyle
            }}
            onClick={onSubmit}
            {...submitBtnProps}
          >
            {submitLabel}
          </LoadingButton>
        )}
      </>
    )
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        left: `${leftOffset}px`,
        backgroundColor: theme.palette.customColors.OnPrimary,
        py: 4,
        px: 6,
        boxShadow: `0px -2px 8px ${theme.palette.customColors.shadowColor}`,
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 100,
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        transition: 'left 0.3s ease-in-out'
      }}
    >
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', ...layoutStyle }}>
        {children}
        {renderButtons()}
      </Box>
    </Box>
  )
}

export default BottomActionBar
