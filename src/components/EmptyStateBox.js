import React from 'react'
import { Box, Avatar, Typography } from '@mui/material'

const EmptyStateBox = ({ text, imageSrc }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '300px',
        textAlign: 'center'
      }}
    >
      <Avatar
        variant='square'
        alt=''
        src={imageSrc}
        sx={{
          width: '120px',
          height: '120px',
          mb: 4
        }}
      />
      <Typography
        variant='body1'
        sx={{
          fontSize: '14px',
          fontWeight: 400,
          color: 'primary.light'
        }}
      >
        {text}
      </Typography>
    </Box>
  )
}

export default EmptyStateBox
