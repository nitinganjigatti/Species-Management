import React, { useState } from 'react'
import { Box, ToggleButtonGroup, ToggleButton } from '@mui/material'
import PropTypes from 'prop-types'

const CustomSwitchTabs = ({ options = [], defaultValue, onChange, className = '' }) => {
  const [selected, setSelected] = useState(defaultValue || (options.length > 0 ? options[0].value : ''))

  const handleChange = (event, newValue) => {
    if (newValue !== null) {
      setSelected(newValue)
      if (onChange) {
        onChange(newValue)
      }
    }
  }

  if (options.length === 0) {
    return null
  }

  return (
    <Box className={className} sx={{ display: 'inline-block' }}>
      <ToggleButtonGroup
        value={selected}
        exclusive
        onChange={handleChange}
        aria-label='switch tabs'
        sx={{
          bgcolor: '#F1F3F5',
          borderRadius: '16px',
          p: 1,
          border: 'none',
          gap: '4px',
          '& .MuiToggleButtonGroup-grouped': {
            border: 'none',
            borderRadius: '12px !important',
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: 600,
            px: 0,
            py: 0.25,
            color: '#A0A4A8',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            margin: 0,
            minWidth: '120px',
            '&.Mui-selected': {
              bgcolor: 'white',
              color: '#0F9D8E',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              '&:hover': {
                bgcolor: 'white',
                color: '#0F9D8E'
              }
            },
            '&:not(.Mui-selected):hover': {
              bgcolor: 'transparent',
              color: '#6B7280'
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
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  defaultValue: PropTypes.string,
  onChange: PropTypes.func,
  className: PropTypes.string
}

export default CustomSwitchTabs
