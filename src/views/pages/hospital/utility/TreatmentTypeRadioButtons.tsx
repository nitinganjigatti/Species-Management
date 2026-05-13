'use client'

import { Box, SxProps, Theme, Typography, useTheme } from '@mui/material'

type RadioSize = 'small' | 'medium' | 'large'
type RadioPosition = 'left' | 'right'

const radioSizes: Record<RadioSize, number> = {
  small: 16,
  medium: 20,
  large: 24
}

const fontSizes: Record<RadioSize, string> = {
  small: '0.875rem',
  medium: '1rem',
  large: '1.125rem'
}

interface TreatmentTypeRadioButtonsProps {
  label?: string
  isSelected?: boolean
  onClick?: () => void
  radioPosition?: RadioPosition
  backgroundColor?: string
  selectedBackgroundColor?: string
  selectedBorderColor?: string
  textColor?: string
  selectedFontColor?: string
  radioColor?: string
  disabled?: boolean
  size?: RadioSize
  borderColor?: string
  sx?: SxProps<Theme>
}

const TreatmentTypeRadioButtons = ({
  label,
  isSelected = false,
  onClick = () => {},
  radioPosition = 'left',
  backgroundColor = '#FFF',
  selectedBackgroundColor = '#f0f9f4',
  selectedBorderColor = '#10b981',
  textColor = '#374151',
  selectedFontColor = '',
  radioColor = '#10b981',
  disabled = false,
  size = 'medium',
  borderColor,
  sx = {}
}: TreatmentTypeRadioButtonsProps) => {
  const theme: any = useTheme()
  const radioDiameter = radioSizes[size]
  const fontSize = fontSizes[size]

  return (
    <Box
      onClick={disabled ? undefined : onClick}
      sx={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        px: 4,
        py: 4,
        width: '100%',
        borderRadius: 0.5,
        border: 1,
        borderColor: isSelected ? selectedBorderColor : borderColor,
        backgroundColor: isSelected ? selectedBackgroundColor : backgroundColor,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        '&:hover': {
          borderColor: disabled ? selectedBorderColor : selectedBorderColor
        },
        gap: 4,
        ...(sx as object)
      }}
    >
      <Typography
        sx={{
          fontSize,
          fontWeight: 500,
          color: isSelected ? selectedFontColor : textColor,
          textAlign: 'left',
          flex: 1,
          userSelect: 'none',
          order: radioPosition === 'right' ? 0 : 1
        }}
      >
        {label}
      </Typography>

      <Box
        sx={{
          position: 'relative',
          width: radioDiameter,
          height: radioDiameter,
          borderRadius: '50%',
          border: `2px solid ${isSelected ? radioColor : theme.palette.grey[400]}`,
          bgcolor: 'background.paper',
          transition: 'border-color 0.2s, background-color 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          order: radioPosition === 'right' ? 1 : 0,
          ml: radioPosition === 'right' ? 'auto' : 0
        }}
      >
        {isSelected && (
          <Box
            sx={{
              width: radioDiameter / 2,
              height: radioDiameter / 2,
              borderRadius: '50%',
              bgcolor: radioColor,
              transition: 'background-color 0.2s'
            }}
          />
        )}
      </Box>
    </Box>
  )
}

export default TreatmentTypeRadioButtons
