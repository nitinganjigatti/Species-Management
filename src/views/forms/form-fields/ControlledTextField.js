import React from 'react'
import { Controller } from 'react-hook-form'
import get from 'lodash/get'
import { TextField } from '@mui/material'
import Utility from 'src/utility'

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
  dateReader = false, // for reading date in field
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
          value={dateReader && field.value ? Utility?.formatDisplayDate(field.value) : field.value}
          type={type}
          label={label}
          onWheel={event => event.target.blur()}
          disabled={disabled}
          error={Boolean(error)}
          helperText={helperText}
          onChange={e => {
            field.onChange(e)
            if (onChangeOverride) onChangeOverride(e)
          }}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onInput={onInput}
          sx={sx}
          slotProps={{
            input: { readOnly },
            htmlInput: inputProps
          }}
        />
      )}
    />
  )
}

export default React.memo(ControlledTextField)
