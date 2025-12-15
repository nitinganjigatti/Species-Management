import React, { useState } from 'react'
import { Controller } from 'react-hook-form'
import {
  InputLabel,
  OutlinedInput,
  Select,
  MenuItem,
  FormHelperText,
  Tooltip,
  Typography,
  Box,
  useMediaQuery
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import get from 'lodash/get'

// Responsive prop resolver (handles breakpoint-based props)
function useResponsivePropValue(prop, fallback = true) {
  const theme = useTheme()

  const matches = {
    xs: useMediaQuery(theme.breakpoints.only('xs')),
    sm: useMediaQuery(theme.breakpoints.only('sm')),
    md: useMediaQuery(theme.breakpoints.only('md')),
    lg: useMediaQuery(theme.breakpoints.only('lg')),
    xl: useMediaQuery(theme.breakpoints.only('xl'))
  }

  if (typeof prop !== 'object') return prop ?? fallback

  const breakpoints = ['xl', 'lg', 'md', 'sm', 'xs']

  for (const bp of breakpoints) {
    if (prop[bp] !== undefined && matches[bp]) {
      return prop[bp]
    }
  }

  return fallback
}

function ControlledSelectWithTextField({
  textFieldName,
  selectFieldName,
  secondSelectFieldName = '',
  control,
  errors,
  label,
  placeholder = 'Enter value',
  required = false,
  type = 'text',
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
  selectWidth = 80,
  secondSelectWidth = 80,
  separator = '| per',
  menuExtraWidth = 10,
  inputProps = {}
}) {
  const theme = useTheme()
  const [isFocused, setIsFocused] = useState(false)

  // Resolve responsive props for menu item display
  const resolvedShowEmptyMenuItem = useResponsivePropValue(showEmptyMenuItem, true)
  const resolvedShowEmptyMenuItemLabel = useResponsivePropValue(showEmptyMenuItemLabel, true)

  // Handle field-level validation errors
  const getErrorMessage = name => get(errors, name)?.message
  const textError = getErrorMessage(textFieldName)
  const selectError = getErrorMessage(selectFieldName)
  const secondSelectError = getErrorMessage(secondSelectFieldName)
  const hasError = Boolean(textError || selectError || secondSelectError)

  // Common styles for select inputs
  const getSelectSx = width => ({
    width: typeof width === 'number' ? `${width}px` : width, // applies the width of the collapsed Select box
    '& .MuiSelect-select.MuiSelect-select': {
      minWidth: '0 !important',
      textAlign: 'end'
    }
  })

  // Common base styles for select option display and Typography styles
  const baseTypographySx = {
    color: theme.palette.customColors?.OnSurfaceVarient || theme.palette.text.primary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  }

  // Styles for selected option text (in collapsed state)
  const getTypographySx = width => ({
    ...baseTypographySx,
    maxWidth: typeof width === 'number' ? `calc(${width}px - 25px)` : `calc(${width} - 25px)`, // applies the width of the typography (25px avoid overflow on arrow icon)
    ...selectTypographySx
  })

  // Styles for select menu items
  const selectOptionTypographySx = { ...baseTypographySx }

  // Mimics MUI floating label behavior
  const getLabelSx = (shouldShrink, isBackgroundColor) => ({
    position: 'absolute',
    left: '14px',

    // top: shouldShrink ? '-11px' : '50%',
    top: shouldShrink
      ? '-11px'
      : hasError
      ? { xs: '40%', sm: '35%', md: '35%', lg: '40%' }
      : { xs: '50%', sm: '45%', md: '45%', lg: '50%' },
    transform: shouldShrink ? 'translateY(0) scale(0.75)' : 'translateY(-50%) scale(1)',
    transformOrigin: 'left center',
    pointerEvents: 'none',
    zIndex: 1,

    // backgroundColor: shouldShrink ? theme.palette.background.paper : 'transparent',
    backgroundColor: isBackgroundColor ? 'transparent' : theme.palette.background.paper,
    padding: shouldShrink ? '0 5px' : '0',
    transition: theme.transitions.create(['transform', 'color', 'top', 'padding'], {
      duration: theme.transitions.duration.shorter,
      easing: theme.transitions.easing.easeOut
    }),
    color: hasError
      ? theme.palette.error.main
      : isFocused
      ? theme.palette.primary.main
      : theme.palette.customColors.Outline
  })

  // Prevent scroll wheel on number inputs
  const handleWheel = e => {
    if (type === 'number') e.target.blur()
  }

  // Blur event handler to reset focus state
  const handleBlur = field => e => {
    setIsFocused(false)
    field.onBlur?.(e)
  }

  // Reusable Select Renderer
  const RenderSelect = ({ name, error, width, sx = {}, options, valueFn, labelFn, isDisabled }) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Select
          {...field}
          variant='standard'
          disableUnderline
          displayEmpty
          disabled={disabled}
          error={Boolean(error)}
          sx={{ ...getSelectSx(width), ...sx }}
          MenuProps={{
            PaperProps: {
              sx: {
                width:
                  typeof width === 'number' ? `${width + menuExtraWidth}px` : `calc(${width} + ${menuExtraWidth}px)` // applies width of the dropdown menu
              }
            }
          }}
          renderValue={selected => {
            const selectedOption = options.find(opt => valueFn(opt) === selected)

            // Display selected option label; if none, show empty label if allowed, else first option's label or empty string
            let display
            if (selectedOption) {
              display = labelFn(selectedOption)
            } else if (resolvedShowEmptyMenuItemLabel) {
              display = emptyMenuItemLabel
            } else if (!resolvedShowEmptyMenuItemLabel && options?.length > 0) {
              display = labelFn(options[0])
            } else {
              display = ''
            }

            return (
              <Tooltip title={display} arrow placement='top'>
                <Typography sx={getTypographySx(width)}>{display}</Typography>
              </Tooltip>
            )
          }}
        >
          {resolvedShowEmptyMenuItem && (
            <MenuItem value='' disabled>
              <Typography sx={selectOptionTypographySx}>{emptyMenuItemLabel}</Typography>
            </MenuItem>
          )}
          {options.map((option, index) => (
            <MenuItem key={index} value={valueFn(option)} disabled={isDisabled(option)}>
              <Tooltip title={labelFn(option)} arrow placement='top'>
                <Typography sx={selectOptionTypographySx}>{labelFn(option)}</Typography>
              </Tooltip>
            </MenuItem>
          ))}
        </Select>
      )}
    />
  )

  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto', position: 'relative', ...sx }}>
      {/* Controlled text input with floating label and embedded selects */}
      <Controller
        required={required}
        name={textFieldName}
        control={control}
        render={({ field }) => {
          const hasValue = field.value !== '' && field.value !== null && field.value !== undefined
          const shouldShrink = hasValue || isFocused

          return (
            <>
              {/* Floating Label animation styles (Mimics MUI InputLabel behavior manually)*/}
              <InputLabel
                htmlFor={`${textFieldName}-input`}
                error={hasError}
                shrink={shouldShrink}
                sx={getLabelSx(shouldShrink, isBackgroundColor, hasError, isFocused)}
              >
                {/* If label is floating AND input has a background color, render a background */}
                {shouldShrink && isBackgroundColor ? (
                  <Box
                    component='span'
                    sx={{
                      position: 'relative',
                      display: 'inline-block',
                      px: '4px',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: '48%',
                        left: 0,
                        right: 0,
                        height: '3px',
                        backgroundColor: theme.palette.background.paper, // background to simulate border cutout
                        transform: 'translateY(-50%)',
                        zIndex: -1
                      }
                    }}
                  >
                    {label}
                  </Box>
                ) : (
                  label
                )}
              </InputLabel>

              {/* Main Input Field */}
              <OutlinedInput
                {...field}
                id={`${textFieldName}-input`}
                type={type}
                placeholder={shouldShrink ? placeholder : ''}
                disabled={disabled}
                onFocus={() => setIsFocused(true)}
                onBlur={handleBlur(field)}
                onKeyDown={onKeyDown}
                onPaste={onPaste}
                onInput={onInput}
                error={hasError}
                fullWidth={fullWidth}
                size={size}
                onChange={e => {
                  const newValue = e.target.value

                  // For number type, validate against 2 decimal pattern
                  if (type === 'number') {
                    const twoDecimalPattern = /^\d*\.?\d{0,2}$/

                    // Allow empty string, or numbers with up to 2 decimals
                    if (newValue === '' || twoDecimalPattern.test(newValue)) {
                      field.onChange(newValue)
                    }

                    // If user types a third decimal, truncate to 2
                    else if (/^\d*\.\d{3,}$/.test(newValue)) {
                      const parts = newValue.split('.')
                      const truncated = parts[0] + '.' + parts[1].substring(0, 2)
                      field.onChange(truncated)
                    }
                  } else {
                    field.onChange(newValue)
                  }
                }}
                inputProps={{
                  readOnly,
                  min: 1,
                  pattern: type === 'number' ? '^d*(.d{0,2})?$' : undefined, // Regex for max 2 decimals
                  ...inputProps
                }}
                onWheel={handleWheel} // Prevent number input from changing value on mouse scroll
                endAdornment={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RenderSelect
                      name={selectFieldName}
                      error={selectError}
                      width={selectWidth}
                      sx={selectSx}
                      options={options}
                      valueFn={getOptionValue}
                      labelFn={getOptionLabel}
                      isDisabled={isOptionDisabled}
                    />
                    {/* Optional separator between selects (e.g. "| per") */}
                    {secondSelectFieldName && (
                      <Typography
                        component='span'
                        sx={{
                          fontWeight: 400,
                          fontSize: '0.875rem',
                          display: 'inline-block',
                          textAlign: 'center',
                          minWidth: '2.5rem',
                          color: theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary
                        }}
                      >
                        {separator}
                      </Typography>
                    )}
                    {secondSelectFieldName && (
                      <RenderSelect
                        name={secondSelectFieldName}
                        error={secondSelectError}
                        width={secondSelectWidth}
                        sx={secondSelectSx}
                        options={secondOptions}
                        valueFn={getSecondOptionValue}
                        labelFn={getSecondOptionLabel}
                        isDisabled={isSecondOptionDisabled}
                      />
                    )}
                  </Box>
                }
                sx={{
                  // border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                  borderRadius: '5px',
                  paddingRight: 0,
                  backgroundColor: isBackgroundColor || 'transparent',
                  ...inputSx,

                  //  prevent scroll changes on number
                  '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0
                  },
                  '& input[type=number]': {
                    MozAppearance: 'textfield'
                  }
                }}
              />
            </>
          )
        }}
      />

      {/* Display combined error message if any field has error */}
      {hasError && (
        <FormHelperText error sx={{ marginTop: '1px', marginX: '0.875rem' }}>
          {textError || selectError || secondSelectError}
        </FormHelperText>
      )}
    </Box>
  )
}

export default React.memo(ControlledSelectWithTextField)

/**
 *
 * Combines a text input with one or two inline dropdown selects
 *
 * PROPS:
 *
 * === Form Integration ===
 * - textFieldName: string (required) — Name of the text input field for react-hook-form
 * - selectFieldName: string (required) — Name of the first select field for react-hook-form
 * - secondSelectFieldName?: string — Optional second select field name (e.g. for "per unit" scenarios)
 * - control: object (required) — The `control` object from react-hook-form
 * - errors?: object — The `errors` object from react-hook-form for showing validation messages
 *
 * === Labeling & Behavior ===
 * - label?: string — Floating label for the text field
 * - placeholder?: string — Placeholder for the text input (shows only when field is focused or filled)
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
