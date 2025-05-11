import React from 'react'
import { Controller } from 'react-hook-form'
import {
  Autocomplete,
  TextField,
  FormControl,
} from '@mui/material'

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
  renderOption = null
}) => {
  if (!options) return
  
  return (
    <FormControl fullWidth={fullWidth} error={Boolean(errors?.[name])}>
      <Controller
        name={name}
        control={control}
        rules={{ required }}
        render={({ field }) => (
          <Autocomplete
            {...field}
            options={options}
            getOptionLabel={getOptionLabel}
            value={field.value}
            isOptionEqualToValue={isOptionEqualToValue}
            onChange={(e, value) => {
              field.onChange(value)
              onChangeOverride(value)
            }}
            onKeyUp={e => onKeyUp(e)}
            onBlur={onBlur}
            loading={loading}
            noOptionsText='Type to search'
            renderInput={params => (
              <TextField
                {...params}
                label={label}
                placeholder='Search & Select'
                error={Boolean(errors?.[name])}
                helperText={
                  errors?.[name]?.value?.message ||
                  errors?.[name]?.label?.message ||
                  errors?.[name]?.message
                }
              />
            )}
            renderOption={renderOption}
          />
        )}
      />
    </FormControl>
  )
}

export default React.memo(ControlledAutocomplete)
