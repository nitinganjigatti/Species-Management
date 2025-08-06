import React from 'react'
import { Box } from '@mui/material'
import { useTheme, alpha } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'

const IconButton = ({
    icon,
    onClick,
    color = 'primary',
    backgroundColor,
    borderColor,
    marginLeft = '0px',
    disabled = false
  }) => {
    const theme = useTheme()
    
    // Default colors based on the color prop
    const getColors = () => {
      switch (color) {
        case 'error':
          return {
            bg: alpha(theme.palette.customColors.Error, 0.1),
            iconColor: theme.palette.customColors.Error,
            border: theme.palette.customColors.Error
          }
        case 'primary':
        default:
          return {
            bg: theme.palette.customColors.Surface,
            iconColor: theme.palette.primary.main,
            border: theme.palette.primary.main
          }
      }
    }
  
    const colors = getColors()
  
    return (
      <Box
        sx={{
          display: 'flex',
          justifyItems: 'center',
          alignItems: 'center',
          marginLeft
        }}
      >
        <Icon
          style={{
            backgroundColor: backgroundColor || colors.bg,
            color: colors.iconColor,
            height: '42px',
            width: '42px',
            border: `1px solid ${borderColor || colors.border}`,
            borderRadius: '8px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1
          }}
          onClick={disabled ? undefined : onClick}
          icon={icon}
        />
      </Box>
    )
  }

  export default IconButton