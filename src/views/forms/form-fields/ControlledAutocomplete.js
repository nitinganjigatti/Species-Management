import React from 'react'
import { Controller } from 'react-hook-form'
import { Autocomplete, TextField, FormControl } from '@mui/material'
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
  onBlur = () => {},
  getOptionLabel = option => option.label || '',
  isOptionEqualToValue = (option, value) => option.value === value?.value,
  renderOption = null,
  textFieldProps = {},
  autocompleteProps = {},
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
            onChange={(e, value) => {
              field.onChange(value)
              onChangeOverride(value)
            }}
            onKeyUp={onKeyUp}
            onBlur={onBlur}
            loading={loading}
            noOptionsText='Type to search'
            renderOption={renderOption}
            sx={sx}
            {...autocompleteProps}
            renderInput={params => (
              <TextField
                {...params}
                label={label}
                placeholder='Search & Select'
                error={Boolean(fieldError)}
                helperText={fieldError?.value?.message || fieldError?.label?.message || fieldError?.message}
                {...textFieldProps}
                InputProps={{
                  ...params.InputProps, // ensures dropdown arrow and anchor remain
                  ...(textFieldProps?.InputProps || {}),
                  sx: {
                    ...params.InputProps?.sx,
                    ...textFieldProps?.InputProps?.sx
                  }
                }}
                InputLabelProps={{
                  ...params.InputLabelProps,
                  ...(textFieldProps?.InputLabelProps || {}),
                  sx: {
                    ...params.InputLabelProps?.sx,
                    ...textFieldProps?.InputLabelProps?.sx
                  }
                }}
              />
            )}
          />
        )}
      />
    </FormControl>
  )
}

export default React.memo(ControlledAutocomplete)
