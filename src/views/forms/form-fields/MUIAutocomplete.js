import React, { useMemo } from 'react'
import { Autocomplete, TextField, FormControl, Checkbox, FormHelperText } from '@mui/material'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'

const MUIAutocomplete = ({
  name,
  label,
  value,
  onChange,
  error = null,
  helperText = '',
  options = [],
  loading = false,
  required = false,
  fullWidth = true,
  multiple = false,
  disabled = false,
  onKeyUp = () => {},
  onClear = () => {},
  onBlur = () => {},
  onInputChange = () => {},
  getOptionLabel = option => option?.label || option?.name || '',
  isOptionEqualToValue = (option, value) => option?.value === value?.value || option?.id === value?.id,
  renderOption = null,
  textFieldProps = {},
  autocompleteProps = {},
  inputBackgroundColor = 'inherit',
  valueType = 'object', // 'object' or 'id'
  size = 'small',
  sx = {}
}) => {
  const effectiveValue = useMemo(() => {
    if (!options || options?.length === 0) return multiple ? [] : null

    if (multiple) {
      if (valueType === 'id') {
        return Array.isArray(value) ? options?.filter(opt => value.some(v => opt.value === v || opt.id === v)) : []
      }

      return value || []
    } else {
      if (valueType === 'id') {
        return options?.find(opt => opt.value === value || opt.id === value) || null
      }

      return value ?? null
    }
  }, [value, valueType, multiple, options])

  // ✅ Icons outside renderOption for performance
  const icon = <CheckBoxOutlineBlankIcon fontSize='small' />
  const checkedIcon = <CheckBoxIcon fontSize='small' />

  // ✅ Handle selection
  const handleChange = (event, newValue, reason) => {
    if (reason === 'clear') onClear()

    if (valueType === 'id') {
      if (multiple) {
        const selectedIds = newValue?.map(v => v.value || v.id) || []
        onChange(selectedIds)
      } else {
        onChange(newValue?.value || newValue?.id || null)
      }
    } else {
      onChange(newValue)
    }
  }

  // ✅ Handle search input
  const handleInputChange = (event, newValue, reason) => {
    if (reason === 'input') onInputChange(newValue)
  }

  // ✅ If no options, still render empty Autocomplete (no hook issue)
  return (
    <FormControl fullWidth={fullWidth} error={Boolean(error)}>
      <Autocomplete
        size={size}
        name={name}
        options={options || []}
        getOptionLabel={getOptionLabel}
        value={effectiveValue}
        isOptionEqualToValue={isOptionEqualToValue}
        onChange={handleChange}
        onInputChange={handleInputChange}
        onKeyUp={onKeyUp}
        onBlur={onBlur}
        loading={loading}
        disabled={disabled}
        multiple={multiple}
        disableCloseOnSelect={multiple}
        noOptionsText='Type to search'
        renderOption={
          renderOption
            ? renderOption
            : (props, option, { selected }) => (
                <li {...props}>
                  {multiple && (
                    <Checkbox icon={icon} checkedIcon={checkedIcon} checked={selected} style={{ marginRight: 8 }} />
                  )}
                  {getOptionLabel(option)}
                </li>
              )
        }
        sx={{
          '& .MuiInputBase-root': {
            backgroundColor: inputBackgroundColor
          },
          ...sx
        }}
        {...autocompleteProps}
        renderInput={params => (
          <TextField
            {...params}
            label={label}
            placeholder='Search & Select'
            required={required}
            error={Boolean(error)}
            helperText={error ? helperText || error : helperText}
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
                ...params.InputProps,
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
      {error && !helperText && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  )
}

export default React.memo(MUIAutocomplete)
