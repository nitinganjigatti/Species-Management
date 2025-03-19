import React from 'react'
import { alpha, Box, Card, Typography } from '@mui/material'
import Image from 'next/image'

const CommonCard = ({ children, bgImage, logoSrc, title, subtitle, sx = {} }) => {
  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `url(${bgImage || '/images/login/bg_image.png'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'bottom',
        padding: '1.25rem',
        ...sx
      }}
    >
      <Card
        sx={{
          background: 'transparent',
          border: '1px solid transparent',
          backgroundColor: alpha('#F2FFF8D9', 0.85),
          p: 6,
          width: { xs: '90%', md: 390 },
          borderRadius: '20px'
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mb: 6 }}>
          <Image src={logoSrc} width={160} height={36} alt='Logo' />
          <Typography sx={{ color: 'customColors.OnSurfaceVariant', fontSize: '20px', fontWeight: 500, mt: 2 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography
              sx={{
                color: 'customColors.OnSurfaceVariant',
                fontSize: '14px',
                fontWeight: 400,
                mt: 2,
                textAlign: 'center'
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        <>{children}</>
      </Card>
    </Box>
  )
}

export default CommonCard
