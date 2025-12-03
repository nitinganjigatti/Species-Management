import { Box, Button, Typography, useTheme } from '@mui/material'
import Image from 'next/image'
import React from 'react'

const NoMedicalData = ({
  imgSrc = '/images/no-data/No_Medical_Data.png',
  text,
  btnText,
  btnAction = () => {},
  imgHeight = 200,
  imgWidth = 200,
  isDischarged = false
}) => {
  const theme = useTheme()

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: '100%' }}>
        <Image alt='No Medical Records Found' src={imgSrc} height={imgHeight} width={imgWidth} objectFit='contain' />
        <Typography sx={{ fontSize: '20px', fontWeight: 500, color: theme.palette.customColors.OnPrimaryContainer }}>
          {text}
        </Typography>
        {!isDischarged && (
          <Button variant='contained' onClick={btnAction} sx={{ height: '48px' }}>
            {btnText}
          </Button>
        )}
      </Box>
    </>
  )
}

export default NoMedicalData
