import React from 'react'
import { Controller } from 'react-hook-form'
import { FormControl, FormControlLabel, Checkbox, FormHelperText } from '@mui/material'
import get from 'lodash/get'

const ControlledCheckbox = ({
  name,
  label,
  control,
  errors,
  required = false,
  disabled = false,
  onChangeExtra = () => {},
  checkedValue = true, // 👈 custom value when checked
  uncheckedValue = false, // 👈 custom value when unchecked
  sx = {},
  labelPlacement = 'end' // can be 'start', 'top', 'bottom', 'end'
}) => {
  const fieldError = get(errors, name)

  return (
    <FormControl error={Boolean(fieldError)} sx={sx}>
      <Controller
        name={name}
        control={control}
        rules={{ required }}
        render={({ field }) => (
          <FormControlLabel
            label={label}
            labelPlacement={labelPlacement}
            control={
              <Checkbox
                checked={field.value === checkedValue}
                onChange={e => {
                  const newValue = e.target.checked ? checkedValue : uncheckedValue
                  field.onChange(newValue)
                  onChangeExtra(newValue)
                }}
                disabled={disabled}
              />
            }
          />
        )}
      />
      {fieldError && <FormHelperText>{fieldError?.message}</FormHelperText>}
    </FormControl>
  )
}

export default React.memo(ControlledCheckbox)
