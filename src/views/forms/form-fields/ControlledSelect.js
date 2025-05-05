import React from 'react'
import { Controller } from 'react-hook-form'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material'

const ControlledSelect = ({
  name,
  label,
  control,
  errors,
  options = [],
  required = false,
  fullWidth = true,
  getOptionLabel = option => option,
  getOptionValue = option => option,
  isOptionDisabled = () => false,
  onChangeExtra = () => {},
  disabled = false
}) => {
  return (
    <FormControl fullWidth={fullWidth} error={Boolean(errors?.[name])}>
      <InputLabel
        id={`${name}-label`}
        sx={{
          color: errors?.[name] ? 'error.main' : 'text.primary',
          '&.Mui-focused': {
            color: errors?.[name] ? 'error.main' : 'primary.main'
          }
        }}
      >
        {label}
      </InputLabel>
      <Controller
        name={name}
        control={control}
        rules={{ required }}
        render={({ field }) => (
          <Select
            {...field}
            labelId={`${name}-label`}
            label={label}
            disabled={disabled}
            error={Boolean(errors?.[name])}
            onChange={e => {
              field.onChange(e)
              onChangeExtra(e)
            }}
          >
            {options.map((option, index) => (
              <MenuItem
                key={index}
                value={getOptionValue(option)}
                disabled={isOptionDisabled(option)}
              >
                {getOptionLabel(option)}
              </MenuItem>
            ))}
          </Select>
        )}
      />
      {errors?.[name] && (
        <FormHelperText>{errors[name]?.message}</FormHelperText>
      )}
    </FormControl>
  )
}

export default React.memo(ControlledSelect)
