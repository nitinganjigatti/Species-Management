import React from 'react'
import { Controller } from 'react-hook-form'
import {
  FormControl,
  OutlinedInput,
  InputAdornment,
  Select,
  MenuItem,
  FormHelperText,
  InputLabel,
  Typography,
  Tooltip,
  useTheme
} from '@mui/material'
import get from 'lodash/get'

/*
 * Props:
 *
 * - name: string (required) — The name of the field in the form; the value is an object `{ text, select }`
 * - control: object (required) — React Hook Form's `control` object used to register and control the field
 * - errors: object — React Hook Form's `formState.errors` object for displaying validation messages
 * - options: array (default: []) — Array of options for the select dropdown
 * - required: boolean (default: false) — Whether the combined field is required (applies to both input and select)
 * - fullWidth: boolean (default: true) — Whether the input should take the full width of its container
 * - placeholder: string — Placeholder text shown inside the text input field
 * - type: string (default: 'text') — The type attribute for the text input (e.g., 'text', 'number', etc.)
 * - disabled: boolean (default: false) — Disables both the text input and select dropdown when true
 * - readOnly: boolean (default: false) — Sets the text input to read-only while allowing interaction with the select
 * - onChangeOverride: function — Callback triggered after text input changes, receives the DOM `event`
 * - inputProps: object — Additional props to be spread onto the native input element inside the text field
 * - onKeyDown: function — Handler for keyboard events on the text input (`event => {}`)
 * - onPaste: function — Handler for paste events on the text input (`event => {}`)
 * - onInput: function — Handler for native input events on the text input (`event => {}`)
 * - sx: object — MUI `sx` style object applied to the root `OutlinedInput` component
 * - size: string (default: 'large') — The size of the FormControl (e.g., 'small', 'medium', 'large')
 * - label: string — Label text shown above the input; required for proper shrink and layout behavior
 * - formHelperTextBackgroundColor: string (default: 'inherit') — Background color for the helper or error text area
 * - getOptionLabel: function (default: `(option) => option`) — Function that returns the label to display from each option object
 * - getOptionValue: function (default: `(option) => option`) — Function that returns the value to use in the `<Select>` from each option object
 * - isOptionDisabled: function (default: `() => false`) — Function that determines if an option is disabled `(option) => boolean`
 * - onChangeExtra: function (default: `() => {}`) — Callback triggered when either the text input or select changes; receives the full `{ text, select }` value
 */
const ControlledSelectWithTextField = ({
  name,
  label,
  control,
  errors,
  options = [],
  required = false,
  disabled = false,
  getOptionLabel = option => option,
  getOptionValue = option => option,
  isOptionDisabled = () => false,
  fullWidth = true,
  placeholder = '',
  type = 'text',
  readOnly = false,
  onChangeOverride,
  inputProps = {},
  onKeyDown,
  onPaste,
  onInput,
  size = 'large',
  sx = {},
  formHelperTextBackgroundColor = 'inherit'
}) => {
  const theme = useTheme()
  const error = get(errors, name)
  const fieldError = Boolean(error)
  const helperText = fieldError?.message || ''

  const firstOptionValue = options.length > 0 ? getOptionValue(options[0]) : 'No options'

  const defaultValue = {
    text: '',
    select: firstOptionValue
  }

  return (
    <FormControl size={size} fullWidth={fullWidth} error={Boolean(fieldError)}>
      <InputLabel
        id={`${name}-label`}
        htmlFor={`${name}-input`}
        sx={{
          color: error ? 'error.main' : 'text.primary',
          '&.Mui-focused': {
            color: error ? 'error.main' : 'primary.main'
          }
        }}
      >
        {label}
      </InputLabel>

      <Controller
        name={name}
        control={control}
        rules={{ required }}
        label={label}
        defaultValue={defaultValue}
        render={({ field }) => (
          <OutlinedInput
            id={`${name}-input`}
            label={label}
            type={type}
            value={field.value?.text || ''}
            onChange={e => {
              const newValue = {
                ...field.value,
                text: e.target.value
              }
              field.onChange(newValue)
              if (onChangeOverride) onChangeOverride(e)
            }}
            placeholder={placeholder}
            disabled={disabled}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onInput={onInput}
            error={error}
            inputProps={{
              readOnly,
              ...inputProps
            }}
            endAdornment={
              <InputAdornment position='end'>
                <Select
                  value={field.value?.select || ''}
                  onChange={e => {
                    const newValue = {
                      ...field.value,
                      select: e.target.value
                    }
                    field.onChange(newValue)
                    if (onChangeOverride) onChangeOverride(e)
                  }}
                  variant='standard'
                  disableUnderline
                  displayEmpty
                  disabled={disabled}
                  sx={{
                    minWidth: 30,
                    maxWidth: 100,
                    '& .MuiSelect-select': { textAlign: 'center' }
                  }}
                >
                  {options.map((option, index) => (
                    <MenuItem key={index} value={getOptionValue(option)} disabled={isOptionDisabled(option)}>
                      <Tooltip title={getOptionLabel(option)} arrow placement='top'>
                        <Typography
                          sx={{
                            color: theme.palette.customColors.OnSurfaceVarient,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical'
                          }}
                        >
                          {getOptionLabel(option)}
                        </Typography>
                      </Tooltip>
                    </MenuItem>
                  ))}
                </Select>
              </InputAdornment>
            }
            sx={sx}
          />
        )}
      />
      {error && (
        <FormHelperText
          sx={{
            backgroundColor: formHelperTextBackgroundColor,
            margin: 0,
            px: '14px',
            pt: '3px'
          }}
        >
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  )
}

export default React.memo(ControlledSelectWithTextField)
