import React from 'react'
import { Controller } from 'react-hook-form'
import get from 'lodash/get'
import { TextField } from '@mui/material'

const ControlledTextArea = ({
  name,
  label,
  control,
  errors,
  required = false,
  fullWidth = true,
  disabled = false,
  readOnly = false,
  rows = 4,
  maxRows,
  minRows,
  placeholder,
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
          value={field.value || ''}
          label={label}
          placeholder={placeholder}
          multiline
          rows={rows}
          maxRows={maxRows}
          minRows={minRows}
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

export default React.memo(ControlledTextArea)
