import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from '@mui/material'
import React from 'react'

const MUISelect = ({
  // required * prop
  value,
  onChange,
  options = [],

  // optional but recommended
  label = '',
  size = 'small',

  // optional prop
  sx = {},
  fullWidth = true,
  disabled = false,
  error = false,
  SelectSx = {},
  MenuProps = {},
  helperText = '',
  multiple = false,
  variant = 'outlined',
  InputLabelStyle = {}
}) => {
  return (
    <FormControl sx={sx} fullWidth={fullWidth} error={error} variant={variant} size={size}>
      <InputLabel sx={InputLabelStyle}>{label}</InputLabel>
      <Select
        multiple={multiple}
        sx={SelectSx}
        MenuProps={MenuProps}
        value={value}
        label={label}
        onChange={onChange}
        disabled={disabled}
      >
        {options?.map(option => (
          <MenuItem key={option.id} value={option.id}>
            {option.name}
          </MenuItem>
        ))}
      </Select>

      {error && (
        <FormHelperText error={error} sx={{ ml: 1.75 }}>
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  )
}

export default MUISelect

// Options Prop Example
//options={[
//  { id: 'all', name: 'All' },
//  { id: 'high', name: 'High' },
//{ id: 'Emergency', name: 'High' }
// ]}

// Api
//options={ApiOptionName}
