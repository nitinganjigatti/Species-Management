import React from 'react'
import Box from '@mui/material/Box'

const FormFieldSubtitle = ({ text, variant = 'subtitle1', sx = {}, ...props }) => {
  const defaultStyles = {
    color: 'customColors.customTextColorGray2',
    fontWeight: 500,
    fontSize: variant === 'subtitle1' ? '0.875rem' : '0.8125rem',
    ...sx
  }

  return (
    <Box sx={defaultStyles} {...props}>
      {text}
    </Box>
  )
}

export default React.memo(FormFieldSubtitle)
