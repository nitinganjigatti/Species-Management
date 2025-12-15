import { Box, Button, Typography, useTheme } from '@mui/material'
import Image from 'next/image'
import React from 'react'

const NoMedicalData = ({
  imgSrc = '/images/no-data/No_Medical_Data.png',
  text,
  btnText,
  btnAction = () => {},
  imgHeight = 200,
  imgWidth = 'auto',
  isDischarged = false
}) => {
  const theme = useTheme()

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: '100%' }}>
        <Box
          sx={{
            width: '100%',
            maxWidth: imgWidth,
            height: imgHeight,
            position: 'relative'
          }}
        >
          <Image
            alt='No Medical Records Found'
            src={imgSrc}
            fill
            style={{ objectFit: 'contain' }}
            sizes='(max-width: 768px) 100vw, 50vw'
            priority
          />
        </Box>
        {/* <Typography sx={{ fontSize: '20px', fontWeight: 500, color: theme.palette.customColors.OnPrimaryContainer }}>
          {text}
        </Typography> */}
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
