import React from 'react'
import { Controller } from 'react-hook-form'
import {
  Box,
  FormControl,
  InputLabel,
  OutlinedInput,
  Select,
  MenuItem,
  FormHelperText,
  Tooltip,
  Typography
} from '@mui/material'
import get from 'lodash/get'

const ControlledSelectWithTextField = ({
  textFieldName,
  selectFieldName,
  secondSelectFieldName = '',
  control,
  errors,
  label,

  placeholder = 'Enter value',
  required = false,
  type = 'number',
  readOnly = false,
  disabled = false,
  fullWidth = true,

  options = [],
  secondOptions = [],
  getOptionLabel = option => option,
  getOptionValue = option => option,
  getSecondOptionLabel = option => option,
  getSecondOptionValue = option => option,
  isOptionDisabled = () => false,
  isSecondOptionDisabled = () => false,

  showEmptyMenuItem = true,
  emptyMenuItemLabel = 'Select',
  showEmptyMenuItemLabel = true,

  onChangeOverride,
  onKeyDown,
  onPaste,
  onInput,

  size = 'normal',
  sx = {},
  inputSx = {},
  selectSx = {},
  secondSelectSx = {},
  selectTypographySx = {},
  isBackgroundColor,
  hideNumberSpinners = true,

  selectWidth = 80,
  secondSelectWidth = 80,
  separator = '| per',
  menuExtraWidth = 10,
  maxDecimals,

  inputProps = {}
}) => {
  const getError = name => get(errors, name)?.message
  const errorText = getError(textFieldName) || getError(selectFieldName) || getError(secondSelectFieldName)

  const getSelectSx = width => ({
    width: typeof width === 'number' ? `${width}px` : width,
    '& .MuiSelect-select.MuiSelect-select': {
      minWidth: '0 !important',
      textAlign: 'end'
    },
    ...selectSx
  })

  const renderValue = (value, options, getLabel, getValue, width) => {
    const selected = options?.find(opt => getValue(opt) === value)

    const display = selected ? getLabel(selected) : showEmptyMenuItemLabel ? emptyMenuItemLabel : ''

    return (
      <Tooltip title={display} arrow placement='top'>
        <Typography
          noWrap
          sx={{
            maxWidth: typeof width === 'number' ? `${width}px` : width,
            marginLeft: '6px',
            textAlign: 'right',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            ...selectTypographySx
          }}
        >
          {display}
        </Typography>
      </Tooltip>
    )
  }

  return (
    <FormControl fullWidth={fullWidth} error={Boolean(errorText)} variant='outlined' sx={sx}>
      <InputLabel htmlFor={textFieldName}>{label}</InputLabel>
      <Controller
        name={textFieldName}
        control={control}
        rules={{ required }}
        render={({ field }) => (
          <OutlinedInput
            {...field}
            id={textFieldName}
            type={type}
            label={label}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            size={size}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onInput={onInput}
            onChange={e => {
              const newValue = e.target.value
              let validatedValue = newValue

              // Apply decimal validation for number type if maxDecimals is specified
              if (type === 'number' && maxDecimals !== undefined) {
                const decimalPattern = new RegExp(`^\\d*\\.?\\d{0,${maxDecimals}}$`)

                // Allow empty string, or numbers with up to maxDecimals decimal places
                if (newValue === '' || decimalPattern.test(newValue)) {
                  validatedValue = newValue
                }

                // If user types more decimals than allowed, truncate to maxDecimals
                else if (new RegExp(`^\\d*\\.\\d{${maxDecimals + 1},}$`).test(newValue)) {
                  const parts = newValue.split('.')
                  validatedValue = parts[0] + '.' + parts[1].substring(0, maxDecimals)
                } else {
                  return
                }
              }

              if (onChangeOverride) {
                onChangeOverride(e, field, validatedValue)
              } else {
                field.onChange(validatedValue)
              }
            }}
            inputProps={{
              readOnly,
              min: type === 'number' ? 0 : undefined,
              pattern: type === 'number' && maxDecimals !== undefined ? `^\\d*(\\.\\d{0,${maxDecimals}})?$` : undefined,
              ...inputProps
            }}
            sx={{
              backgroundColor: isBackgroundColor || 'transparent',
              ...inputSx,
              ...(hideNumberSpinners && {
                '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0
                },
                '& input[type=number]': {
                  MozAppearance: 'textfield'
                }
              })
            }}
            endAdornment={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* ---------- FIRST SELECT ---------- */}
                <Controller
                  name={selectFieldName}
                  control={control}
                  render={({ field: selectField }) => (
                    <Select
                      {...selectField}
                      variant='standard'
                      disableUnderline
                      displayEmpty={showEmptyMenuItem}
                      disabled={disabled || readOnly}
                      sx={getSelectSx(selectWidth)}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            width: typeof selectWidth === 'number' ? selectWidth + menuExtraWidth : selectWidth
                          }
                        }
                      }}
                      renderValue={value => renderValue(value, options, getOptionLabel, getOptionValue, selectWidth)}
                    >
                      {showEmptyMenuItem && (
                        <MenuItem value='' disabled>
                          <Typography noWrap>{emptyMenuItemLabel}</Typography>
                        </MenuItem>
                      )}

                      {options?.map((opt, i) => (
                        <MenuItem key={i} value={getOptionValue(opt)} disabled={isOptionDisabled(opt)}>
                          <Tooltip title={getOptionLabel(opt)} arrow placement='top'>
                            <Typography noWrap>{getOptionLabel(opt)}</Typography>
                          </Tooltip>
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />

                {/* ---------- SEPARATOR ---------- */}
                {secondSelectFieldName && (
                  <Typography sx={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{separator}</Typography>
                )}

                {/* ---------- SECOND SELECT ---------- */}
                {secondSelectFieldName && (
                  <Controller
                    name={secondSelectFieldName}
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        variant='standard'
                        disableUnderline
                        displayEmpty={showEmptyMenuItem}
                        disabled={disabled || readOnly}
                        sx={{
                          ...getSelectSx(secondSelectWidth),
                          ...secondSelectSx
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              width:
                                typeof secondSelectWidth === 'number'
                                  ? secondSelectWidth + menuExtraWidth
                                  : secondSelectWidth
                            }
                          }
                        }}
                        renderValue={value =>
                          renderValue(
                            value,
                            secondOptions,
                            getSecondOptionLabel,
                            getSecondOptionValue,
                            secondSelectWidth
                          )
                        }
                      >
                        {showEmptyMenuItem && (
                          <MenuItem value='' disabled>
                            <Typography noWrap>{emptyMenuItemLabel}</Typography>
                          </MenuItem>
                        )}

                        {secondOptions?.map((opt, i) => (
                          <MenuItem key={i} value={getSecondOptionValue(opt)} disabled={isSecondOptionDisabled(opt)}>
                            <Tooltip title={getSecondOptionLabel(opt)} arrow placement='top'>
                              <Typography noWrap>{getSecondOptionLabel(opt)}</Typography>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                )}
              </Box>
            }
          />
        )}
      />

      {errorText && <FormHelperText>{errorText}</FormHelperText>}
    </FormControl>
  )
}

export default React.memo(ControlledSelectWithTextField)

/**
 *
 * Combines a text input with one or two inline dropdown selects
 *
 * === Form Integration ===
 * - textFieldName: string (required) — Name of the text input field
 * - selectFieldName: string (required) — Name of the first select field
 * - secondSelectFieldName?: string — Optional second select field name (e.g. for "per unit" scenarios)
 * - control: object (required) — The `control` object from react-hook-form
 * - errors?: object — The `errors` object from react-hook-form for showing validation messages
 *
 * === Labeling & Behavior ===
 * - label?: string — Floating label for the text field
 * - placeholder?: string — Placeholder for the text input
 * - required?: boolean — Marks the text field as required for validation
 * - type?: string — Input type for the text field (e.g. "text", "number")
 * - readOnly?: boolean — Makes the text input read-only
 * - disabled?: boolean — Disables the entire component (input + selects)
 * - fullWidth?: boolean — If true, stretches the component to 100% width (default: true)
 *
 * === Options ===
 * - options: array — Options for the first select
 * - secondOptions?: array — Options for the optional second select
 * - getOptionLabel: function — Returns label for a first select option (default: identity)
 * - getOptionValue: function — Returns value for a first select option (default: identity)
 * - getSecondOptionLabel?: function — Label extractor for second select (default: identity)
 * - getSecondOptionValue?: function — Value extractor for second select (default: identity)
 * - isOptionDisabled?: function — Disables specific options in the first select (default: false)
 * - isSecondOptionDisabled?: function — Disables options in second select (default: false)
 * - showEmptyMenuItem?: boolean — If true, adds an empty/default item to the selects (default: true)
 * - emptyMenuItemLabel?: string — Label for the empty/default select option (default: "Select")
 * - showEmptyMenuItemLabel?: boolean - Whether to show the label for the empty/default select option (default: true)
 *
 * === Event Handlers ===
 * - onChangeOverride?: function — Optional override for text input's `onChange` handler
 * - onKeyDown?: function — Key down event handler for text input
 * - onPaste?: function — Paste event handler for text input
 * - onInput?: function — Input event handler for text input
 *
 * === Styling ===
 * - size?: 'small' | 'normal' — Size for input and selects (default: 'normal')
 * - sx?: object — MUI `sx` prop for root container
 * - inputSx?: object — `sx` for the text input
 * - selectSx?: object — `sx` for the first select
 * - secondSelectSx?: object — `sx` for the second select
 * - selectTypographySx?: object — Custom styles for select text display
 * - isBackgroundColor?: string — Background color used for input
 * - selectWidth?: number | string — Width for the first select (default: 80)
 * - secondSelectWidth?: number | string — Width for the second select (default: 80)
 * - menuExtraWidth?: number — Extra width for dropdown menu (default: 10)
 * - separator?: string — Separator string shown between selects (default: '| per'; pass '' to hide)
 *
 */
