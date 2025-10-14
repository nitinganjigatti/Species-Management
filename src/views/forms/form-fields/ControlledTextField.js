import React from 'react'
import { Controller } from 'react-hook-form'
import { FormHelperText, TextField } from '@mui/material'
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
  dateReader = false,
  formHelperTextBackgroundColor = 'inherit',
  inputBackgroundColor = 'inherit',
  borderRadius = '10px',
  placeholder,
  sx = {},
  size = 'large'
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={{ required }}
      render={({ field, fieldState }) => {
        const error = fieldState.error
        const helperText = error?.message || ''

        return (
          <>
            <TextField
              {...field}
              fullWidth={fullWidth}
              value={dateReader && field.value ? Utility?.formatDisplayDate(field.value) : field.value}
              type={type}
              label={label}
              onWheel={event => event.target.blur()}
              disabled={disabled}
              error={Boolean(error)}
              onChange={e => {
                field.onChange(e)
                if (onChangeOverride) onChangeOverride(e)
              }}
              onKeyDown={onKeyDown}
              onPaste={onPaste}
              onInput={onInput}
              slotProps={{
                input: { readOnly },
                htmlInput: inputProps
              }}
              sx={{ borderRadius: '10px', ...sx }}
            />
            {helperText && (
              <FormHelperText error sx={{ ml: '14px' }}>
                {helperText}
              </FormHelperText>
            )}
          </>
        )
      }}
    />
  )
}

export default React.memo(ControlledTextField)
