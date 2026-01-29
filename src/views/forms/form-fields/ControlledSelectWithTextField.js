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

  selectWidth,
  minSelectWidth = 40,
  maxSelectWidth = 130,
  menuItemWidth,
  minMenuItemWidth = 40,
  maxMenuItemWidth = 130,
  secondSelectWidth,
  minSecondSelectWidth = 40,
  maxSecondSelectWidth = 130,
  secondMenuItemWidth,
  minSecondMenuItemWidth = 40,
  maxSecondMenuItemWidth = 130,
  separator = '| per',
  menuMaxHeight = 300,
  maxDecimals,

  inputProps = {}
}) => {
  const getError = name => get(errors, name)?.message
  const errorText = getError(textFieldName) || getError(selectFieldName) || getError(secondSelectFieldName)

  const getSelectSx = (width, minWidth, maxWidth) => {
    const baseSx = {
      '& .MuiSelect-select.MuiSelect-select': {
        minWidth: '0 !important',
        textAlign: 'end'
      },
      ...selectSx
    }

    // If width is explicitly provided (ignores min/max)
    if (width !== undefined) {
      return {
        ...baseSx,
        width: typeof width === 'number' ? `${width}px` : width
      }
    }

    // If no width provided, use auto with min/max constraints
    return {
      ...baseSx,
      width: 'auto',
      minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth,
      maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth
    }
  }

  const getMenuSx = (menuWidth, minMenuWidth, maxMenuWidth) => {
    // If explicit menuItemWidth is provided (ignores min/max)
    if (menuWidth !== undefined) {
      return {
        width: typeof menuWidth === 'number' ? `${menuWidth}px` : menuWidth,
        maxHeight: menuMaxHeight
      }
    }

    // If auto mode, use menu-specific min/max
    return {
      minWidth: typeof minMenuWidth === 'number' ? `${minMenuWidth}px !important` : minMenuWidth,
      maxWidth: typeof maxMenuWidth === 'number' ? `${maxMenuWidth}px !important` : maxMenuWidth,
      maxHeight: menuMaxHeight
    }
  }

  const renderValue = (value, opts, getLabel, getValue) => {
    const selected = opts?.find(opt => getValue(opt) === value)
    const display = selected ? getLabel(selected) : showEmptyMenuItemLabel ? emptyMenuItemLabel : ''

    return (
      <Tooltip title={display} arrow placement='top'>
        <Typography
          noWrap
          sx={{
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
                      sx={getSelectSx(selectWidth, minSelectWidth, maxSelectWidth)}
                      MenuProps={{
                        PaperProps: {
                          sx: getMenuSx(menuItemWidth, minMenuItemWidth, maxMenuItemWidth)
                        },
                        anchorOrigin: {
                          vertical: 'bottom',
                          horizontal: 'right'
                        },

                        transformOrigin: {
                          vertical: 'top',
                          horizontal: 'right'
                        }
                      }}
                      renderValue={value => renderValue(value, options, getOptionLabel, getOptionValue)}
                    >
                      {showEmptyMenuItem && (
                        <MenuItem value='' disabled>
                          <Typography noWrap>{emptyMenuItemLabel}</Typography>
                        </MenuItem>
                      )}

                      {options?.map((opt, i) => (
                        <MenuItem
                          key={i}
                          value={getOptionValue(opt)}
                          disabled={isOptionDisabled(opt)}
                          sx={{ whiteSpace: 'normal' }}
                        >
                          <Typography
                            sx={{
                              wordBreak: 'break-word',
                              whiteSpace: 'normal',
                              width: '100%'
                            }}
                          >
                            {getOptionLabel(opt)}
                          </Typography>
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
                          ...getSelectSx(secondSelectWidth, minSecondSelectWidth, maxSecondSelectWidth),
                          ...secondSelectSx
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              ...getMenuSx(secondMenuItemWidth, minSecondMenuItemWidth, maxSecondMenuItemWidth)
                            }
                          },
                          anchorOrigin: {
                            vertical: 'bottom',
                            horizontal: 'right'
                          },
                          transformOrigin: {
                            vertical: 'top',
                            horizontal: 'right'
                          }
                        }}
                        renderValue={value =>
                          renderValue(value, secondOptions, getSecondOptionLabel, getSecondOptionValue)
                        }
                      >
                        {showEmptyMenuItem && (
                          <MenuItem value='' disabled>
                            <Typography noWrap>{emptyMenuItemLabel}</Typography>
                          </MenuItem>
                        )}

                        {secondOptions?.map((opt, i) => (
                          <MenuItem
                            key={i}
                            value={getSecondOptionValue(opt)}
                            disabled={isSecondOptionDisabled(opt)}
                            sx={{ whiteSpace: 'normal' }}
                          >
                            <Typography
                              sx={{
                                wordBreak: 'break-word',
                                whiteSpace: 'normal',
                                width: '100%'
                              }}
                            >
                              {getSecondOptionLabel(opt)}
                            </Typography>
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
 * Combines a text input with one or two inline dropdown selects
 *
 * === Form Integration ===
 * - textFieldName: string (required) — Name of the text input field
 * - selectFieldName: string (required) — Name of the first select field
 * - secondSelectFieldName?: string — Optional second select field name
 * - control: object (required) — The `control` object from react-hook-form
 * - errors?: object — The `errors` object from react-hook-form for showing validation messages
 *
 * === Labeling & Behavior ===
 * - label?: string — Floating label for the text field
 * - placeholder?: string — Placeholder for the text input
 * - required?: boolean — Marks the text field as required
 * - type?: string — Input type (e.g. "text", "number")
 * - readOnly?: boolean — Makes the text input read-only
 * - disabled?: boolean — Disables the entire component
 * - fullWidth?: boolean — Stretches component to 100% width (default: true)
 *
 * === Options ===
 * - options: array — Options for the first select
 * - secondOptions?: array — Options for the second select
 * - getOptionLabel: function — Returns label for first select option
 * - getOptionValue: function — Returns value for first select option
 * - getSecondOptionLabel?: function — Label extractor for second select
 * - getSecondOptionValue?: function — Value extractor for second select
 * - isOptionDisabled?: function — Disables specific options in first select
 * - isSecondOptionDisabled?: function — Disables options in second select
 * - showEmptyMenuItem?: boolean — Adds empty/default item to selects (default: true)
 * - emptyMenuItemLabel?: string — Label for empty select option (default: "Select")
 * - showEmptyMenuItemLabel?: boolean - Show label for empty option (default: true)
 *
 * === Event Handlers ===
 * - onChangeOverride?: function — Override for text input's onChange
 * - onKeyDown?: function — Key down event handler for text input
 * - onPaste?: function — Paste event handler for text input
 * - onInput?: function — Input event handler for text input
 *
 * === Styling ===
 * - size?: 'small' | 'normal' — Size for input and selects
 * - sx?: object — MUI sx prop for root container
 * - inputSx?: object — sx for the text input
 * - selectSx?: object — sx for the first select
 * - secondSelectSx?: object — sx for the second select
 * - selectTypographySx?: object — Custom styles for select text
 * - isBackgroundColor?: string — Background color for input
 * - menuMaxHeight?: number — Max height for dropdown menu (default: 300)
 * - separator?: string — Separator between selects (default: '| per'; pass '' to hide)
 * - maxDecimals?: number — Max decimal places for number input
 *
 * === WIDTH CONTROLS (Two Independent Systems) ===
 *
 * 1. SELECT BUTTON WIDTH (Overall select component width)
 * - selectWidth?: number | string — Fixed width for first select button
 * - minSelectWidth?: number — Min width for auto-sized first select (default: 40)
 * - maxSelectWidth?: number — Max width for auto-sized first select (default: 130)
 * - secondSelectWidth?: number | string — Fixed width for second select button
 * - minSecondSelectWidth?: number — Min width for auto-sized second select (default: 40)
 * - maxSecondSelectWidth?: number — Max width for auto-sized second select (default: 130)
 *
 * 2. MENU DROPDOWN WIDTH (Dropdown options list)
 * - menuItemWidth?: number | string — Fixed width for dropdown menu
 * - minMenuItemWidth?: number — Min width for auto-sized menu (default: 40)
 * - maxMenuItemWidth?: number — Max width for auto-sized menu (default: 130)
 * - secondMenuItemWidth?: number | string — Fixed width for second dropdown menu
 * - minSecondMenuItemWidth?: number — Min width for auto-sized second menu (default: 40)
 * - maxSecondMenuItemWidth?: number — Max width for auto-sized second menu (default: 130)
 *
 * === USAGE EXAMPLES ===
 *
 * Priority:
 * - If specific width prop is set → uses that fixed width
 * - If specific width prop is set and also min/max width prop is set → uses that fixed width (min/max width props are ignored)
 * - If not set → uses auto with respective min/max constraints
 */
