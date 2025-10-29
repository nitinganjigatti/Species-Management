import React from 'react'
import { Checkbox, FormControlLabel, Box, Typography, FormHelperText } from '@mui/material'

/**
 * Props:
 * - checked: boolean (required)
 * - onChange: function (required) — (checked, event) => {}
 * - label: string | ReactNode
 * - disabled: boolean
 * - size: 'small' | 'medium'
 * - checkBoxColor: 'primary' | 'secondary' | 'error' | 'default' | 'success' | 'info' | 'warning'
 * - labelPlacement: 'start' | 'end' | 'top' | 'bottom'
 * - gap: number
 * - required: boolean
 * - sx: object
 * - checkboxStyle: object
 * - labelStyle: object
 */

const MUICheckbox = ({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'medium',
  checkBoxColor = 'primary',
  labelPlacement = 'end',
  gap,
  required = false,
  sx = {},
  checkboxStyle,
  labelStyle,
  error = false,
  helperText = ''
}) => {
  return (
    <Box sx={{ ...sx }}>
      <FormControlLabel
        control={
          <Checkbox
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            size={size}
            color={checkBoxColor}
            sx={{ p: 0, ...checkboxStyle }}
          />
        }
        label={
          <Typography
            component='span'
            sx={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'customColors.OnSurfaceVariant',
              pl: label ? 3 : 0,
              ...labelStyle
            }}
          >
            {label} {required ? '*' : ''}
          </Typography>
        }
        labelPlacement={labelPlacement}
        sx={{
          gap,
          m: 0
        }}
      />
      {error && (
        <FormHelperText error={true} sx={{ ml: 1.75 }}>
          {helperText}
        </FormHelperText>
      )}
    </Box>
  )
}

export default React.memo(MUICheckbox)
