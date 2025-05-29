import React from 'react'
import { Controller } from 'react-hook-form'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material'
import get from 'lodash/get'

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
  const fieldError = get(errors, name)

  return (
    <FormControl fullWidth={fullWidth} error={Boolean(fieldError)}>
      <InputLabel
        id={`${name}-label`}
        sx={{
          color: fieldError ? 'error.main' : 'text.primary',
          '&.Mui-focused': {
            color: fieldError ? 'error.main' : 'primary.main'
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
            error={Boolean(fieldError)}
            onChange={e => {
              field.onChange(e)
              onChangeExtra(e)
            }}
          >
            {options.map((option, index) => (
              <MenuItem key={index} value={getOptionValue(option)} disabled={isOptionDisabled(option)}>
                {getOptionLabel(option)}
              </MenuItem>
            ))}
          </Select>
        )}
      />
      {fieldError && <FormHelperText>{fieldError?.message}</FormHelperText>}
    </FormControl>
  )
}

export default React.memo(ControlledSelect)
