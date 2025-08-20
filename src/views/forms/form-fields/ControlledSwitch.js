import React from 'react'
import { Box, Typography, FormControlLabel, FormHelperText, Switch } from '@mui/material'
import { Controller } from 'react-hook-form'
import { styled } from '@mui/material/styles'
import { get } from 'lodash'

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
 * - readOnly: boolean (default: false) — If true, disables toggle interaction
 * - labelPosition: 'start' | 'end' | 'top' | 'bottom' (default: 'end') — Label placement
 * - size: 'small' | 'medium' | 'large' (default: 'medium') — Size of the switch
 * - switchColor: string (default: 'primary.main') — Active switch track color
 * - gap: number (default: 2) — Gap between label and switch
 * - sx: object — Custom styles for the wrapper box
 * - showErrorBelow: boolean (default: true) — Whether to show error below the switch
 * - onChangeExtra: function — Extra callback on switch toggle
 * - labelStyle: object — Custom style for the label text
 * - defaultChecked: boolean (default: false) — Initial checked state
 * - rules: object — Validation rules for React Hook Form
 * - spaceBetween: boolean (default: false) — Justify label and switch to ends
 */

const IOSSwitch = styled(
  props => {
    const { size = 'medium', ...rest } = props

    return <Switch focusVisibleClassName='.Mui-focusVisible' disableRipple {...rest} />
  },
  {
    shouldForwardProp: prop => prop !== 'ownerState'
  }
)(({ theme, ownerState }) => {
  const size = ownerState.size || 'medium'
  const switchColor = ownerState.switchColor || theme.palette.primary.main

  const sizes = {
    small: {
      width: 32,
      height: 18,
      thumbSize: 14,
      translateX: 12
    },
    medium: {
      width: 40,
      height: 24,
      thumbSize: 20,
      translateX: 14
    },
    large: {
      width: 50,
      height: 28,
      thumbSize: 24,
      translateX: 20
    }
  }

  const currentSize = sizes[size] || sizes.medium

  return {
    width: currentSize.width,
    height: currentSize.height,
    padding: 0,
    '& .MuiSwitch-switchBase': {
      padding: 0,
      margin: 2,
      transitionDuration: '300ms',
      '&.Mui-checked': {
        transform: `translateX(${currentSize.translateX}px)`,
        color: theme.palette.customColors.OnPrimary,
        '& + .MuiSwitch-track': {
          backgroundColor: switchColor,
          opacity: 1
        },
        '&.Mui-disabled + .MuiSwitch-track': {
          opacity: 0.5
        }
      },
      '&.Mui-focusVisible .MuiSwitch-thumb': {
        color: switchColor
      },
      '&.Mui-disabled .MuiSwitch-thumb': {
        color: theme.palette.grey[100]
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.7
      }
    },
    '& .MuiSwitch-thumb': {
      boxSizing: 'border-box',
      width: currentSize.thumbSize,
      height: currentSize.thumbSize,
      backgroundColor: theme.palette.customColors.OnPrimary
    },
    '& .MuiSwitch-track': {
      borderRadius: 20,
      backgroundColor: theme.palette.customColors.OutlineVariant,
      opacity: 1,
      transition: theme.transitions.create(['background-color'], {
        duration: 500
      })
    }
  }
})

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
  showErrorBelow = true,
  onChangeExtra = () => {},
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
                <IOSSwitch
                  {...field}
                  checked={!!field.value}
                  onChange={e => {
                    const value = e.target.checked
                    field.onChange(value)
                    onChangeExtra(value, e)
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
            {hasError && showErrorBelow && <FormHelperText error>{error?.message}</FormHelperText>}
          </>
        )}
      />
    </Box>
  )
}

export default React.memo(ControlledSwitch)
