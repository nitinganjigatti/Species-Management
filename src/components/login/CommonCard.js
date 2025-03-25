import React from 'react'
import { alpha, Box, Card, Typography } from '@mui/material'
import Image from 'next/image'

const CommonCard = ({ children, bgImage, logoVantara, logoAntz, title, subtitle, sx = {} }) => {
  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `url(${bgImage || '/images/login/Login_Bg_Image.svg'})`,
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
          {process.env.NEXT_PUBLIC_BRANDING === 'vantara' ? (
            <Image
              src={'/images/login/Vantara_Logo_registered.svg' || logoVantara}
              width={160}
              height={36}
              alt='Logo'
            />
          ) : (
            <Image src={'/branding/antz/Antz_logo_h_color.svg' || logoAntz} width={160} height={60} alt='Logo' />
          )}
          {/* <Image src={logoAlt || logoSrc} width={160} height={36} alt='Logo' /> */}
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
