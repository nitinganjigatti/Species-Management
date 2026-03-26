import React from 'react'
import { Radio, FormControlLabel, Box, Typography, FormHelperText, useTheme } from '@mui/material'

const MUIRadio = ({
  checked,
  onChange,
  value,
  label,
  disabled = false,
  size = 'medium',
  radioColor = 'primary',
  labelPlacement = 'end',
  gap,
  required = false,
  sx = {},
  radioStyle = {},
  labelStyle = {},
  error = false,
  helperText = ''
}) => {
  const theme = useTheme()

  return (
    <Box sx={{ ...sx }}>
      <FormControlLabel
        control={
          <Radio
            checked={checked}
            onChange={onChange}
            value={value}
            disabled={disabled}
            size={size}
            color={radioColor}
            sx={{ p: 0, ...radioStyle }}
          />
        }
        label={
          <Typography
            component='span'
            sx={{
              fontSize: '1rem',
              fontWeight: 400,
              color: theme.palette.customColors?.Outline || theme.palette.text.primary,
              pl: label ? 1 : 0,
              ...labelStyle
            }}
          >
            {label} {required ? '*' : ''}
          </Typography>
        }
        labelPlacement={labelPlacement}
        sx={{ gap, m: 0 }}
      />
      {error && helperText && (
        <FormHelperText error sx={{ ml: 2 }}>
          {helperText}
        </FormHelperText>
      )}
    </Box>
  )
}

export default React.memo(MUIRadio)

/**
 * Props:
 * - checked: boolean (required)
 * - onChange: function (required)
 * - value: string | number (required)
 * - label: string | ReactNode
 * - disabled: boolean
 * - size: 'small' | 'medium'
 * - radioColor: 'primary' | 'secondary' | 'error' | 'default' | 'success' | 'info' | 'warning'
 * - labelPlacement: 'start' | 'end' | 'top' | 'bottom'
 * - gap: number
 * - required: boolean
 * - sx: object
 * - radioStyle: object
 * - labelStyle: object
 * - error: boolean
 * - helperText: string
 *
 * Example Usage:
 *
 * <MUIRadio
 *   checked={selectedValue === 'male'}
 *   value="male"
 *   onChange={(e) => setSelectedValue(e.target.value)}
 *   label="Male"
 *   size="medium"
 *   radioColor="primary"
 *   labelPlacement="end"
 *   gap={2}
 *   error={Boolean(errorMessage)}
 *   helperText={errorMessage}
 * />
 */
