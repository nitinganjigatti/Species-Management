'use client'

import React from 'react'
import { Box, CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'

interface CustomButtonsProps {
  primaryLabel?: React.ReactNode
  onPrimaryClick?: (e?: any) => void
  isPrimaryLoading?: boolean
  isPrimaryDisabled?: boolean
  primaryVariant?: 'primary' | 'danger' | string
  secondaryLabel?: React.ReactNode
  onSecondaryClick?: (e?: any) => void
  isSecondaryLoading?: boolean
  isSecondaryDisabled?: boolean
  secondaryVariant?: 'secondary' | 'danger' | string
  width?: string | number
  height?: string | number
  reverseOrder?: boolean
}

const CustomButtons = React.memo(({
  // Primary button props (Add/Update)
  primaryLabel = 'Add',
  onPrimaryClick,
  isPrimaryLoading = false,
  isPrimaryDisabled = false,
  primaryVariant = 'primary', // 'primary' | 'danger'

  // Secondary button props (Cancel/Delete)
  secondaryLabel = 'Cancel',
  onSecondaryClick,
  isSecondaryLoading = false,
  isSecondaryDisabled = false,
  secondaryVariant = 'secondary', // 'secondary' | 'danger'

  // Layout props
  width = '100%',
  height = '44px',
  reverseOrder = false // If true, primary button comes first
}: CustomButtonsProps) => {
  const theme: any = useTheme()

  const getButtonStyles = (variant: string) => {
    const variantStyles: any = {
      primary: {
        backgroundColor: theme.palette.customColors.OnPrimaryContainer,
        color: theme.palette.common.white,
        border: 'none',
        '&:hover:not(:disabled)': {
          backgroundColor: theme.palette.customColors.OnPrimaryContainer,
          opacity: 0.9
        },
        variant: 'contained'
      },
      secondary: {
        backgroundColor: 'transparent',
        color: theme.palette.customColors.OnPrimaryContainer,
        border: `1px solid ${theme.palette.customColors.OnPrimaryContainer}`,
        '&:hover:not(:disabled)': {
          backgroundColor: theme.palette.action.hover
        }
      },
      danger: {
        backgroundColor: 'transparent',
        color: theme.palette.customColors.Error,
        border: `1px solid ${theme.palette.customColors.Error}`,
        '&:hover:not(:disabled)': {
            backgroundColor: theme.palette.action.hover
        }
      }
    }

    return variantStyles[variant] || variantStyles.primary
  }

  const buttons = [
    {
      label: secondaryLabel,
      onClick: onSecondaryClick,
      loading: isSecondaryLoading,
      disabled: isSecondaryDisabled,
      variant: secondaryVariant,
      key: 'secondary'
    },
    {
      label: primaryLabel,
      onClick: onPrimaryClick,
      loading: isPrimaryLoading,
      disabled: isPrimaryDisabled,
      variant: primaryVariant,
      key: 'primary'
    }
  ]

  // Reverse order if needed
  if (reverseOrder) {
    buttons.reverse()
  }

  return (
    <Box
      sx={{
        position: 'sticky',
        bottom: 1,
        backgroundColor: theme.palette.common.white,
        display: 'flex',
        gap: 4
      }}
    >
      {buttons.map((button) => (
        <Box
          key={button.key}
          component='button'
          onClick={button.onClick}
          disabled={button.disabled || button.loading}
          sx={{
            flex: 1,
            width,
            height,
            borderRadius: '8px',
            fontWeight: 500,
            fontSize: '15px',
            cursor: (button.disabled || button.loading) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            padding: '8px',
            letterSpacing: '0.46px',
            opacity: (button.disabled || button.loading) ? 0.6 : 1,
            transition: 'all 0.2s ease-in-out',
            ...getButtonStyles(button.variant)
          }}
        >
          {button.loading ? <CircularProgress size={20} color='inherit' /> : button.label}
        </Box>
      ))}
    </Box>
  )
})

export default CustomButtons
