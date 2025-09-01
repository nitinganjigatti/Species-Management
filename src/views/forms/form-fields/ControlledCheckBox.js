import React from 'react'
import { Controller } from 'react-hook-form'
import { FormControl, Box, Typography } from '@mui/material'
import get from 'lodash/get'
import CustomAvatar from 'src/@core/components/mui/avatar'
import MUICheckbox from './MUICheckbox'

/**
 * Props:
 * - name: string (required) — The name of the field in the form
 * - label: string | ReactNode — The label text/content displayed next to the checkbox
 * - control: object (required) — React Hook Form's `control` object
 * - errors: object — React Hook Form's `formState.errors` for validation messages
 * - required: boolean (default: false) — Adds a required validation rule (if not disabled)
 * - disabled: boolean (default: false) — Disables the checkbox interaction
 * - labelPlacement: 'start' | 'end' | 'top' | 'bottom' (default: 'end') — Position of label relative to checkbox
 * - size: 'small' | 'medium' (default: 'medium') — Checkbox size
 * - checkBoxColor: 'primary' | 'secondary' | 'error' | 'default' | 'success' | 'info' | 'warning'
 * - gap: number — Space between checkbox and label (MUI `sx` spacing)
 * - sx: object — Custom style object for outer wrapper (`Box`)
 * - onChangeOverride: function — Extra callback function triggered on value change `(value, event) => {}`
 * - labelColor: string (default: 'customColors.OnSurfaceVariant') — Typography color of label
 * - labelStyle: object — Custom style object for the label `Typography`
 * - rules: object — Validation rules passed to React Hook Form
 * - image: string — Optional avatar image URL shown before the label
 * - imageAlt: string — Alt text for the avatar image (default: `'avatar'`)
 * - imageBg: string (default: 'secondary.main') — Background color for the avatar (used if image not available)
 * - imageTextColor: string (default: 'text.primary') — Text color inside the avatar (used if initials are shown)
 * - imageSize: number (default: 32) — Size (width and height) of the avatar
 * - defaultValue: boolean (default: false) — Initial checked state of the checkbox
 */

const ControlledCheckBox = ({
  name,
  control,
  errors = {},
  required = false,
  disabled = false,
  label,
  labelPlacement = 'end',
  size = 'medium',
  checkBoxColor = 'primary',
  gap,
  sx = {},
  onChangeOverride = () => {},
  labelStyle = {},
  checkboxStyle = {},
  rules = {},
  image = '',
  imageAlt = '',
  imageBg = 'secondary.main',
  imageTextColor = 'text.primary',
  imageSize = 32,
  defaultValue = false
}) => {
  const fieldError = get(errors, name)
  const errorMessage = fieldError?.message

  const composedLabel = (
    <Box display='flex' alignItems='center' gap={2}>
      {image && (
        <CustomAvatar
          src={image}
          alt={imageAlt || 'avatar'}
          sx={{
            width: imageSize,
            height: imageSize,
            fontSize: imageSize * 0.5,
            backgroundColor: imageBg,
            color: imageTextColor
          }}
        />
      )}

      <Typography
        component='span'
        sx={{
          fontSize: '1rem',
          fontWeight: 600,
          color: 'customColors.OnSurfaceVariant',
          ...labelStyle
        }}
      >
        {label} {required ? '*' : ''}
      </Typography>
    </Box>
  )

  return (
    <FormControl fullWidth={true} error={Boolean(fieldError)}>
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue}
        rules={{ ...rules }}
        render={({ field }) => (
          <MUICheckbox
            checked={!!field.value}
            onChange={e => {
              const isChecked = e.target.checked
              field.onChange(isChecked)
              onChangeOverride(isChecked)
            }}
            disabled={disabled}
            size={size}
            checkBoxColor={checkBoxColor}
            checkboxStyle={checkboxStyle}
            labelPlacement={labelPlacement}
            gap={gap}
            label={composedLabel}
            error={Boolean(errorMessage)}
            helperText={errorMessage}
            sx={sx}
          />
        )}
      />
    </FormControl>
  )
}

export default React.memo(ControlledCheckBox)
