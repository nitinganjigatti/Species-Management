// components/form-fields/ControlledDatePicker.js
import React from 'react'
import { Controller } from 'react-hook-form'
import MUIDatePicker from './MUIDatePicker'

const ControlledDatePicker = ({
  name,
  control,
  label = 'Select Date',
  required = false,
  minDate,
  maxDate,
  views,
  disabled = false,
  sx = {}
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: required ? 'This field is required' : false }}
      render={({ field, fieldState: { error } }) => (
        <MUIDatePicker
          value={field.value || null}
          onChange={field.onChange}
          label={label}
          minDate={minDate}
          maxDate={maxDate}
          views={views}
          disabled={disabled}
          error={!!error}
          helperText={error?.message}
          sx={sx}
        />
      )}
    />
  )
}

export default ControlledDatePicker
