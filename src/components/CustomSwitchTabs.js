import React, { useState } from 'react'
import { Box, ToggleButtonGroup, ToggleButton, useTheme } from '@mui/material'
import PropTypes from 'prop-types'

const CustomSwitchTabs = ({ options = [], value, onChange, className = '' }) => {
  const theme = useTheme()

  if (options.length === 0) {
    return null
  }

  return (
    <Box className={className} sx={{ display: 'inline-block' }}>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={onChange}
        aria-label='switch tabs'
        sx={{
          bgcolor: theme.palette.customColors.Background,
          borderRadius: 1.5,

          p: 0,
          height: '48px',
          border: 'none',
          gap: '4px',
          '& .MuiToggleButtonGroup-grouped': {
            border: 'none',
            borderRadius: 1.5,
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: 600,
            px: 1,
            py: 0.5,

            // color: '#A0A4A8',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            margin: 0,
            minWidth: '120px',
            '&.Mui-selected': {
              bgcolor: theme.palette.customColors.OnPrimaryContainer,
              color: theme.palette.customColors.OnPrimary,
              borderRadius: 1.5,
              fontSize: '0.875rem',
              fontWeight: 600
            },
            '&:not(.Mui-selected):hover': {
              bgcolor: 'transparent'
            },
            '&:focus': {
              outline: 'none'
            }
          }
        }}
      >
        {options.map(option => (
          <ToggleButton key={option.value} value={option.value} disableRipple>
            {option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  )
}

CustomSwitchTabs.propTypes = {
  options: PropTypes.array.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func
}

export default CustomSwitchTabs
