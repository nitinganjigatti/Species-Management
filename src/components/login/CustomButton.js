import React from 'react'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

const CustomButton = ({
  children,
  onClick,
  type = 'button',
  fullWidth = false,
  size = 'medium',
  sx = {},
  loading = false, // Added loading prop
  ...rest
}) => {
  return (
    <Button
      type={type}
      fullWidth={fullWidth}
      size={size}
      variant='contained'
      onClick={onClick}
      sx={{
        height: 56,
        backgroundColor: '#000000',
        '&:hover': {
          backgroundColor: '#333333'
        },
        ...sx
      }}
      {...rest}
      // disabled={loading} // Disable button when loading
    >
      {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : children}
    </Button>
  )
}

export default CustomButton
