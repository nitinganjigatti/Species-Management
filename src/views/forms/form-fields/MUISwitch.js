import { styled } from '@mui/material/styles'
import { Switch } from '@mui/material'

const MUISwitch = styled(
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
        color: theme.palette.customColors.neutral05
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

export default MUISwitch
