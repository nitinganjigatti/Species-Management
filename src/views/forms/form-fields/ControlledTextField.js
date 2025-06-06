import React from 'react'
import { Controller } from 'react-hook-form'
import get from 'lodash/get'
import { TextField } from '@mui/material'

const ControlledTextField = ({
  name,
  label,
  control,
  errors,
  required = false,
  fullWidth = true,
  type = 'text',
  disabled = false,
  readOnly = false,
  onChangeOverride,
  inputProps = {},
  onKeyDown,
  onPaste,
  onInput,
  sx = {}
}) => {
  const error = get(errors, name) //  safely access nested error
  const helperText = error?.message || ''

  return (
    <Controller
      name={name}
      control={control}
      rules={{ required }}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth={fullWidth}
          value={field.value}
          type={type}
          label={label}
          onWheel={event => event.target.blur()}
          disabled={disabled}
          InputProps={{ readOnly }}
          error={Boolean(error)}
          helperText={helperText}
          inputProps={inputProps}
          onChange={e => {
            field.onChange(e)
            if (onChangeOverride) onChangeOverride(e)
          }}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onInput={onInput}
          sx={sx}
        />
      )}
    />
  )
}

export default React.memo(ControlledTextField)
