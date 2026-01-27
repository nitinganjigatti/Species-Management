import React from 'react'
import { styled } from '@mui/material/styles'
import Switch from '@mui/material/Switch'

import { FormControlLabel, Typography } from '@mui/material'

// const sizes = {
//   small: { width: 32, height: 18, thumbSize: 14, translateX: 12 },
//   medium: { width: 40, height: 24, thumbSize: 20, translateX: 14 },
//   large: { width: 50, height: 28, thumbSize: 24, translateX: 20 }
// }

const sizes = {
  small: { width: 30, height: 18, thumbSize: 14, translateX: 12 },
  medium: { width: 38, height: 24, thumbSize: 20, translateX: 14 },
  large: { width: 50, height: 28, thumbSize: 24, translateX: 22 }
}

const StyledSwitch = styled(({ switchColor, size = 'medium', padding = 0, ...rest }) => <Switch {...rest} />)(
  ({ theme, switchColor, size }) => {
    const currentSize = sizes[size] || sizes.medium
    const trackColor = switchColor || theme.palette.primary.main

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
          color: theme.palette.customColors?.OnPrimary,
          '& + .MuiSwitch-track': {
            backgroundColor: trackColor,
            opacity: 1
          },
          '&.Mui-disabled + .MuiSwitch-track': {
            opacity: 0.5
          }
        },
        '&.Mui-disabled + .MuiSwitch-track': {
          opacity: 0.7
        }
      },
      '& .MuiSwitch-thumb': {
        width: currentSize.thumbSize,
        height: currentSize.thumbSize,
        backgroundColor: theme.palette.customColors?.OnPrimary
      },
      '& .MuiSwitch-track': {
        borderRadius: 20,
        backgroundColor: theme.palette.customColors?.OutlineVariant,
        opacity: 1,
        transition: theme.transitions.create(['background-color'], {
          duration: 500
        })
      }
    }
  }
)

function MUISwitch(props) {
  const { switchColor, label, size = 'medium', labelStyle = {}, ...rest } = props
  if (label) {
    return (
      <FormControlLabel
        control={<StyledSwitch switchColor={switchColor} size={size} {...rest} />}
        label={
          <Typography
            component='span'
            sx={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'customColors.OnSurfaceVariant',
              pl: 3,
              ...labelStyle
            }}
          >
            {label}
          </Typography>
        }
      />
    )
  }

  return <StyledSwitch switchColor={switchColor} size={size} {...rest} />
}

export default React.memo(MUISwitch)
