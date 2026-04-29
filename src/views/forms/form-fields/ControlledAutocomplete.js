import React, { useRef } from 'react'
import { Controller } from 'react-hook-form'
import {
  Autocomplete,
  TextField,
  FormControl,
  Checkbox,
  FormHelperText,
  CircularProgress,
  Chip,
  Box
} from '@mui/material'
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
  noOptionsText = 'Type to search',
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
  showLoader = false,

  //clearOnBlur = false,
  maxTagsHeight = null
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
    if (!searchInputRef.current || (!item?.value && !searchInputRef.current)) return
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
  const icon = <CheckBoxOutlineBlankIcon fontSize='small' />
  const checkedIcon = <CheckBoxIcon fontSize='small' />

  const scrollableRenderTags =
    multiple && maxTagsHeight
      ? (value, getTagProps) => (
          <Box
            sx={{
              maxHeight: maxTagsHeight,
              overflowY: 'auto',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.5,
              py: 0.5
            }}
          >
            {value?.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index })

              return <Chip key={key} {...tagProps} label={getOptionLabel(option)} size='small' />
            })}
          </Box>
        )
      : null

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
            // value={field.value ?? null} // ensures Autocomplete is always controlled
            value={multiple ? (field?.value ? field?.value : []) : field?.value ?? null}
            isOptionEqualToValue={isOptionEqualToValue}
            onChange={(e, value, reason) => {
              let normalizedValue = normalizeValue(value)

              if (reason === 'clear') {
                onItemClear()
                searchInputRef.current = ""
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
            noOptionsText={noOptionsText}
            // renderOption={renderOption}
            renderOption={
              renderOption
                ? renderOption
                : (props, option, { selected }) => (
                    <li {...props} key={option?.value}>
                      {multiple && (
                        <Checkbox icon={icon} checkedIcon={checkedIcon} checked={selected} style={{ marginRight: 8 }} />
                      )}
                      {getOptionLabel(option)}
                    </li>
                  )
            }
            multiple={multiple} // ✅ enable multi select
            disableCloseOnSelect={multiple} // ✅ keep list open
            {...(scrollableRenderTags ? { renderTags: scrollableRenderTags } : {})}
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
      {fieldError && <FormHelperText>{fieldError?.message || fieldError?.value?.message}</FormHelperText>}
    </FormControl>
  )
}

export default React.memo(ControlledAutocomplete)
