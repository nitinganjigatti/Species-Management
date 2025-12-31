/* eslint-disable lines-around-comment */
import React from 'react'
import { Controller } from 'react-hook-form'
import { Autocomplete, TextField, FormControl, Checkbox, FormHelperText } from '@mui/material'
import get from 'lodash/get'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'

const ControlledAutocomplete = ({
  name,
  label,
  control,
  errors,
  options = [],
  loading = false,
  required = false,
  fullWidth = true,
  multiple = false,

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
  const icon = <CheckBoxOutlineBlankIcon fontSize='small' />
  const checkedIcon = <CheckBoxIcon fontSize='small' />

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
            // value={field.value ?? null} // ensures Autocomplete is always controlled
            value={multiple ? (field?.value ? field?.value : []) : field?.value ?? null}
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
            // renderOption={renderOption}
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
            multiple={multiple} // ✅ enable multi select
            disableCloseOnSelect={multiple} // ✅ keep list open
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
      {fieldError && <FormHelperText>{fieldError?.message || fieldError?.value?.message}</FormHelperText>}
    </FormControl>
  )
}

export default React.memo(ControlledAutocomplete)

// Updated code

// import React from 'react'
// import { Controller } from 'react-hook-form'
// import { Autocomplete, TextField, FormControl, FormHelperText } from '@mui/material'

// const ControlledAutocomplete = ({
//   name,
//   label,
//   control,
//   errors,
//   options = [],
//   loading = false,
//   required = false,
//   fullWidth = true,
//   onChangeOverride = () => {},
//   onKeyUp = () => {},
//   onItemClear = () => {},
//   onBlur = () => {},
//   onInputChange = () => {},
//   getOptionLabel = option => option.label || '',
//   isOptionEqualToValue = (option, value) => option.value === value?.value,
//   renderOption = null,
//   textFieldProps = {},
//   autocompleteProps = {},
//   formHelperTextBackgroundColor = 'inherit',
//   inputBackgroundColor = 'inherit',
//   sx = {},
//   textFieldSx = {}
// }) => {
//   if (!options) return

//   return (
//     <FormControl fullWidth={fullWidth}>
//       <Controller
//         name={name}
//         control={control}
//         rules={{ required }}
//         render={({ field, fieldState }) => {
//           const fieldError = fieldState.error
//           const helperText = fieldError?.message || fieldError?.value?.message ||''
//           console.log('fieldError', fieldError)

//           return (
//             <>
//               <Autocomplete
//                 {...field}
//                 options={options}
//                 getOptionLabel={getOptionLabel}
//                 value={field.value ?? null} // ensures Autocomplete is always controlled
//                 isOptionEqualToValue={isOptionEqualToValue}
//                 onChange={(e, value, reason) => {
//                   field.onChange(value)
//                   onChangeOverride(value)
//                   if (reason === 'clear') {
//                     onItemClear()
//                   }
//                 }}
//                 onInputChange={(e, value, reason) => {
//                   if (reason === 'input') {
//                     onInputChange(value)
//                   }
//                 }}
//                 onKeyUp={onKeyUp}
//                 onBlur={onBlur}
//                 loading={loading}
//                 noOptionsText='Type to search'
//                 renderOption={renderOption}
//                 sx={{
//                   '& .MuiInputBase-root': {
//                     backgroundColor: inputBackgroundColor
//                   },
//                   ...sx
//                 }}
//                 {...autocompleteProps}
//                 renderInput={params => (
//                   <TextField
//                     {...params}
//                     label={label}
//                     placeholder='Search & Select'
//                     error={Boolean(fieldError)}
//                     {...textFieldProps}
//                     slotProps={{
//                       ...textFieldProps.slotProps,
//                       input: {
//                         ...params.InputProps, // ensures dropdown arrow and anchor remain
//                         ...(textFieldProps?.slotProps?.input || {}),
//                         sx: {
//                           ...params.InputProps?.sx,
//                           ...textFieldProps?.slotProps?.input?.sx
//                         }
//                       },
//                       inputLabel: {
//                         ...params.InputLabelProps,
//                         ...(textFieldProps?.slotProps?.inputLabel || {}),
//                         sx: {
//                           ...params.InputLabelProps?.sx,
//                           ...textFieldProps?.slotProps?.inputLabel?.sx
//                         }
//                       }
//                     }}
//                     sx={{ ...textFieldSx }}
//                   />
//                 )}
//               />
//               {helperText && (
//                 <FormHelperText error sx={{ ml: '14px' }}>
//                   {helperText}
//                 </FormHelperText>
//               )}
//             </>
//           )
//         }}
//       />
//     </FormControl>
//   )
// }

// export default React.memo(ControlledAutocomplete)
