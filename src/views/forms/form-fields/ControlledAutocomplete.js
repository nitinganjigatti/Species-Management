import React from 'react'
import { Controller } from 'react-hook-form'
import { Autocomplete, TextField, FormControl, FormHelperText } from '@mui/material'
import get from 'lodash/get'

const ControlledAutocomplete = ({
  name,
  label,
  control,
  errors,
  options = [],
  loading = false,
  required = false,
  fullWidth = true,
  onChangeOverride = () => {},
  onKeyUp = () => {},
  onItemClear = () => {},
  onBlur = () => {},
  onInputChange = () => {},
  getOptionLabel = option => (typeof option === 'string' ? option : option?.label || ''),
  isOptionEqualToValue = (option, value) => {
    if (!option || !value) return false
    const optionValue = typeof option === 'string' ? option : option.value
    const compareValue = typeof value === 'string' ? value : value.value

    return optionValue === compareValue
  },
  renderOption = null,
  textFieldProps = {},
  autocompleteProps = {},
  formHelperTextBackgroundColor = 'inherit',
  inputBackgroundColor = 'inherit',
  sx = {},
  showIcons = true,
  disabled = false,
  endAdornment = null
}) => {
  if (!options) return null

  const fieldError = get(errors, name)

  const normalizeValue = val => {
    if (!val) return null
    if (typeof val === 'string') {
      return {
        label: val,
        value: val
      }
    }

    if (typeof val === 'object') {
      return val
    }

    return {
      label: String(val),
      value: String(val)
    }
  }

  return (
    <FormControl fullWidth={fullWidth} error={Boolean(fieldError)}>
      <Controller
        name={name}
        control={control}
        rules={{ required }}
        render={({ field }) => (
          <Autocomplete
            {...field}
            freeSolo={showIcons}
            disabled={disabled}
            selectOnFocus
            clearOnBlur={false}
            handleHomeEndKeys
            options={options}
            getOptionLabel={getOptionLabel}
            value={field.value ?? null} // ensures Autocomplete is always controlled
            isOptionEqualToValue={isOptionEqualToValue}
            onChange={(e, value, reason) => {
              let normalizedValue = normalizeValue(value)

              if (reason === 'clear') {
                onItemClear()
                normalizedValue = null
              }

              field.onChange(normalizedValue)
              onChangeOverride(normalizedValue)

              if (reason === 'createOption' && value) {
                onInputChange(typeof value === 'string' ? value : value?.label || '')
              }
            }}
            onInputChange={(e, value, reason) => {
              if (reason === 'input') {
                onInputChange(value, reason)
              }
              if (reason === 'reset' && typeof value === 'string' && value !== '') {
                onInputChange(value, reason)
              }
              if (reason === 'clear') {
                onItemClear()
                onInputChange('', reason)
              }
            }}
            onKeyUp={onKeyUp}
            onBlur={onBlur}
            loading={loading}
            noOptionsText='Type to search'
            renderOption={renderOption}
            sx={{
              '& .MuiInputBase-root': {
                backgroundColor: inputBackgroundColor
              },
              ...sx
            }}
            {...autocompleteProps}
            renderInput={params => {
              const additionalEndAdornment = typeof endAdornment === 'function' ? endAdornment(params) : endAdornment
              const externalEndAdornment = textFieldProps?.slotProps?.input?.endAdornment
              const combinedEndAdornment = (
                <>
                  {params.InputProps?.endAdornment}
                  {externalEndAdornment}
                  {additionalEndAdornment}
                </>
              )

              const inputSlotProps = {
                ...params.InputProps, // ensures dropdown arrow and anchor remain
                ...(textFieldProps?.slotProps?.input || {}),
                endAdornment: combinedEndAdornment,
                sx: {
                  ...params.InputProps?.sx,
                  ...textFieldProps?.slotProps?.input?.sx
                }
              }

              return (
                <TextField
                  {...params}
                  label={label}
                  placeholder='Search & Select'
                  error={Boolean(fieldError)}
                  {...textFieldProps}
                  slotProps={{
                    ...textFieldProps.slotProps,
                    formHelperText: {
                      sx: {
                        margin: 0,
                        px: '14px',
                        pt: '3px',
                        ...textFieldProps.slotProps?.formHelperText?.sx
                      },
                      ...textFieldProps.slotProps?.formHelperText
                    },
                    input: inputSlotProps,
                    inputLabel: {
                      ...params.InputLabelProps,
                      ...(textFieldProps?.slotProps?.inputLabel || {}),
                      sx: {
                        ...params.InputLabelProps?.sx,
                        ...textFieldProps?.slotProps?.inputLabel?.sx
                      }
                    }
                  }}
                />
              )
            }}
          />
        )}
      />
      {fieldError && <FormHelperText>{fieldError?.message}</FormHelperText>}
    </FormControl>
  )
}

export default React.memo(ControlledAutocomplete)
