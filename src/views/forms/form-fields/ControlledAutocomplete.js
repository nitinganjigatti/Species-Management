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
  getOptionLabel = option => option.label || '',
  isOptionEqualToValue = (option, value) => option.value === value?.value,
  renderOption = null,
  textFieldProps = {},
  autocompleteProps = {},
  formHelperTextBackgroundColor = 'inherit',
  inputBackgroundColor = 'inherit',
  sx = {}
}) => {
  if (!options) return

  const fieldError = get(errors, name)

  return (
    <FormControl fullWidth={fullWidth} error={Boolean(fieldError)}>
      <Controller
        name={name}
        control={control}
        rules={{ required }}
        render={({ field }) => (
          <Autocomplete
            {...field}
            options={options}
            getOptionLabel={getOptionLabel}
            value={field.value ?? null} // ensures Autocomplete is always controlled
            isOptionEqualToValue={isOptionEqualToValue}
            onChange={(e, value, reason) => {
              field.onChange(value)
              onChangeOverride(value)
              if (reason === 'clear') {
                onItemClear()
              }
            }}
            onInputChange={(e, value, reason) => {
              if (reason === 'input') {
                onInputChange(value)
              }
            }}
            onKeyUp={onKeyUp}
            onBlur={onBlur}
            loading={loading}
            noOptionsText='Type to search'
            renderOption={renderOption}
            sx={{
              '& .MuiInputBase-root': {
                backgroundColor: inputBackgroundColor,
              },
              ...sx
            }}
            {...autocompleteProps}
            renderInput={params => (
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
                  input: {
                    ...params.InputProps, // ensures dropdown arrow and anchor remain
                    ...(textFieldProps?.slotProps?.input || {}),
                    sx: {
                      ...params.InputProps?.sx,
                      ...textFieldProps?.slotProps?.input?.sx
                    }
                  },
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
            )}
          />
        )}
      />
      {fieldError && <FormHelperText>{fieldError?.message}</FormHelperText>}
    </FormControl>
  )
}

export default React.memo(ControlledAutocomplete)
