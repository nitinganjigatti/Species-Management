import React, { useRef } from 'react'
import { Controller } from 'react-hook-form'
import { Autocomplete, TextField, FormControl, FormHelperText, CircularProgress } from '@mui/material'
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
  endAdornment = null,
  showLoader = false

  // clearOnBlur = false
}) => {
  const searchInputRef = useRef('') // Store the search input value

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

  const handleOnBlur = (event, item) => {
    if (!searchInputRef.current) return
    if (!item?.value && searchInputRef.current) {
      onInputChange('')
      searchInputRef.current = ''
    } else if (
      item?.value &&
      searchInputRef.current &&
      item?.label?.toLowerCase()?.trim() != searchInputRef.current?.toLowerCase()?.trim()
    ) {
      onInputChange(item?.label)
      searchInputRef.current = item?.label?.toLowerCase()?.trim()
    }
    onBlur(event)
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
            // clearOnBlur={true}
            handleHomeEndKeys
            options={options}
            getOptionLabel={getOptionLabel}
            value={field.value ?? null}
            isOptionEqualToValue={isOptionEqualToValue}
            onChange={(e, value, reason) => {
              let normalizedValue = normalizeValue(value)

              if (reason === 'clear') {
                onItemClear()
                normalizedValue = null
              }

              field.onChange(normalizedValue)
              if (reason === 'clear' && !value) return
              onChangeOverride(normalizedValue)

              if (reason === 'createOption' && value) {
                onInputChange(typeof value === 'string' ? value : value?.label || '')
              }
            }}
            onInputChange={(e, value, reason) => {
              if (reason === 'clear' && !value) return

              // Store the current search input value only when typing or clearing
              if (reason === 'input' || reason === 'clear') {
                searchInputRef.current = value || ''
              }

              if (reason === 'input') {
                onInputChange(value, reason)
              }
              if (reason === 'reset' && typeof value === 'string' && value !== '') {
                onInputChange(value, reason)
              }
              if (reason === 'clear') {
                onItemClear()

                // Don't trigger API call on clear - just pass empty string
                onInputChange('', reason)
              }
            }}
            onKeyUp={onKeyUp}
            onBlur={e => handleOnBlur(e, field.value)}
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

              const defaultAdornment = (
                <>
                  {params.InputProps?.endAdornment}
                  {externalEndAdornment}
                  {additionalEndAdornment}
                </>
              )

              const combinedEndAdornment =
                showLoader && loading ? (
                  <>
                    <CircularProgress size={18} />
                    {defaultAdornment}
                  </>
                ) : (
                  defaultAdornment
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
