import React from 'react'
import { Box, Typography, FormControlLabel, FormHelperText } from '@mui/material'
import { Controller } from 'react-hook-form'
import { get } from 'lodash'
import MUISwitch from './MUISwitch'

/**
 * ControlledSwitch
 *
 * Props:
 * - name: string (required) — The name of the field in the form
 * - label: string | ReactNode — The label to display next to the switch
 * - control: object (required) — React Hook Form control object
 * - errors: object — Errors object from React Hook Form
 * - required: boolean (default: false) — Whether the field is required
 * - disabled: boolean (default: false) — Whether the switch is disabled
 * - labelPosition: 'start' | 'end' | 'top' | 'bottom' (default: 'end') — Label placement
 * - size: 'small' | 'medium' | 'large' (default: 'medium') — Size of the switch
 * - switchColor: string (default: 'primary.main') — Active switch track color
 * - gap: number (default: 2) — Gap between label and switch
 * - sx: object — Custom styles for the wrapper box
 * - onChangeOverride: function — Extra callback on switch toggle
 * - labelStyle: object — Custom style for the label text
 * - defaultChecked: boolean (default: false) — Initial checked state
 * - rules: object — Validation rules for React Hook Form
 * - spaceBetween: boolean (default: false) — Justify label and switch to ends
 */

const ControlledSwitch = ({
  name,
  label,
  control,
  errors = {},
  required = false,
  disabled = false,
  labelPosition = 'end',
  size = 'medium',
  switchColor = 'primary.main',
  sx = {},
  onChangeOverride = () => {},
  labelStyle = {},
  defaultChecked = false,
  rules = {},
  gap = 2,
  spaceBetween = false
}) => {
  const error = get(errors, name)
  const hasError = Boolean(error)

  const labelNode = (
    <Typography
      component='span'
      sx={{
        fontSize: labelStyle?.fontSize || '1rem',
        fontWeight: labelStyle?.fontWeight || 500,
        color: labelStyle?.color || 'customColors.OnSurfaceVariant',
        ...(labelPosition === 'end' && gap && { pl: gap }),
        ...(labelPosition === 'start' && gap && { pr: gap }),
        ...labelStyle
      }}
    >
      {label}
    </Typography>
  )

  return (
    <Box sx={sx}>
      <Controller
        name={name}
        control={control}
        defaultValue={defaultChecked}
        rules={{
          ...(required ? { required: 'This field is required' } : {}),
          ...rules
        }}
        render={({ field }) => (
          <>
            <FormControlLabel
              control={
                <MUISwitch
                  {...field}
                  checked={!!field.value}
                  onChange={e => {
                    const value = e.target.checked
                    field.onChange(value)
                    onChangeOverride(value, e)
                  }}
                  disabled={disabled}
                  ownerState={{ size, switchColor }}
                />
              }
              label={labelNode}
              labelPlacement={labelPosition}
              sx={{
                marginLeft: 0,
                ...(spaceBetween && {
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                })
              }}
            />
            {hasError && <FormHelperText error>{error?.message}</FormHelperText>}
          </>
        )}
      />
    </Box>
  )
}

export default React.memo(ControlledSwitch)
