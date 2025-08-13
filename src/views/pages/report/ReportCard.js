import React from 'react'
import { Box, Typography, Button } from '@mui/material'
import { useTheme } from '@emotion/react'

const ReportCard = ({ subtitle, description, buttonText, addHandler }) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        border: `1px dotted ${theme.palette.primary.main}`,
        borderRadius: '8px',
        backgroundColor: theme.palette.customColors.Surface,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 330
      }}
    >
      <img
        src='/images/cat-swimming.png' // Make sure this matches the path to your image
        alt='No animal selected'
        style={{ width: 160, height: 160 }}
      />
      <Typography
        sx={{
          fontSize: '20px',
          fontFamily: 'Inter',
          fontWeight: 500,
          color: theme.palette.customColors.OnSurfaceVariant
        }}
      >
        {subtitle}
      </Typography>
      <Box sx={{ width: '100%', maxWidth: 350, textAlign: 'center' }}>
        <Typography
          sx={{
            fontSize: '14px',
            color: theme.palette.customColors.secondaryBg,
            fontWeight: 400,
            fontFamily: 'Inter',
            mt: 1,
            wordBreak: 'break-word',
            whiteSpace: 'pre-line'
          }}
        >
          {description}
        </Typography>
      </Box>
      <Box sx={{ mt: 6 }}>
        <Button variant='contained' onClick={addHandler} size='large'>
          {buttonText}
        </Button>
      </Box>
    </Box>
  )
}

export default ReportCard
