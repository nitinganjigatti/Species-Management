import React from 'react'
import { Controller } from 'react-hook-form'
import { FormControl, Box, FormLabel, FormHelperText } from '@mui/material'
import get from 'lodash/get'
import MUIRadio from './MUIRadio'

const ControlledRadioGroup = ({
  name,
  control,
  errors = {},
  options = [],
  label,
  required = false,
  disabled = false,
  row = false,
  radioColor = 'primary',
  labelPlacement = 'end',
  rules = {},
  gap = 2,
  sx = {},
  onChangeOverride = () => {},
  labelStyle = {},
  radioStyle = {},
  defaultValue
}) => {
  const fieldError = get(errors, name)
  const errorMessage = fieldError?.message

  return (
    <FormControl fullWidth error={!!fieldError} sx={{ ...sx }}>
      {label && (
        <FormLabel sx={{ mb: 1, fontWeight: 500, fontSize: '1rem' }}>
          {label} {required ? '*' : ''}
        </FormLabel>
      )}

      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue ?? options[0]?.value ?? ''}
        rules={{
          required: required ? 'This field is required' : undefined,
          ...rules
        }}
        render={({ field }) => (
          <Box
            display='flex'
            flexDirection={row ? 'row' : 'column'}
            gap={gap}
            alignItems={row ? 'center' : 'flex-start'} // Align items nicely in row
          >
            {options.map((option, index) => (
              <MUIRadio
                key={option.value ?? index}
                checked={field.value === option.value}
                value={option.value}
                onChange={e => {
                  field.onChange(option.value)
                  onChangeOverride(option.value, e)
                }}
                disabled={disabled}
                radioColor={radioColor}
                labelPlacement={labelPlacement}
                label={option.label}
                radioStyle={radioStyle}
                labelStyle={labelStyle}
              />
            ))}
          </Box>
        )}
      />

      {errorMessage && (
        <FormHelperText error sx={{ ml: 2, mt: 1 }}>
          {errorMessage}
        </FormHelperText>
      )}
    </FormControl>
  )
}

export default React.memo(ControlledRadioGroup)

/**
 * Props:
 * - name: string (required) — field name for react-hook-form
 * - control: object (required) — react-hook-form control
 * - errors: object — react-hook-form errors
 * - options: array of { label, value } — radio options
 * - label: string | ReactNode — group label
 * - required: boolean — marks field as required
 * - disabled: boolean — disables all radio buttons
 * - row: boolean — horizontal layout
 * - radioColor: 'primary' | 'secondary' | 'error' | 'default' | 'success' | 'info' | 'warning'
 * - labelPlacement: 'start' | 'end' | 'top' | 'bottom'
 * - rules: object — react-hook-form validation rules
 * - gap: number — spacing between radios
 * - sx: object — styles for FormControl
 * - onChangeOverride: function(value, event) — additional callback on change
 * - labelStyle: object — styles for radio label
 * - radioStyle: object — styles for radio button
 * - defaultValue: string | number — initial selected value
 *
 * Example Usage:
 * <ControlledRadioGroup
 *   name="gender"
 *   control={control}
 *   errors={errors}
 *   label="Select Gender"
 *   required
 *   options={[
 *     { label: 'Male', value: 'male' },
 *     { label: 'Female', value: 'female' },
 *     { label: 'Other', value: 'other' }
 *   ]}
 *   row
 *   radioColor="primary"
 *   labelPlacement="end"
 *   gap={4}
 *   rules={{ validate: value => !!value || 'Please select a gender' }}
 *   onChangeOverride={(value) => console.log('Selected:', value)}
 *   defaultValue="female"
 * />
 */
