import React from 'react'
import { Box, Card, CardContent, Typography, Avatar, Grid, useTheme } from '@mui/material'

const HospitalAnalytics = () => {
  const theme = useTheme()

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto' }}>
      <Card
        sx={{
          borderRadius: '10px',
          overflow: 'visible'
        }}
      >
        <CardContent sx={{ p: 4, mr: { md:'80px' } }}>
          <Grid container spacing={4} alignItems='center' justifyContent='space-between'>
            {/* Hospital Info Section */}
            <Grid item xs={12} md={3}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3
                }}
              >
                <Avatar
                  src='/images/hospital/hospital-icon.svg'
                  alt='Hospital Icon'
                  sx={{
                    width: 56,
                    height: 56,
                    backgroundColor: theme.palette.customColors.antzNotes80,
                    borderRadius: '7px',
                    p: '8px'
                  }}
                  slotProps={{
                    img: {
                      style: { objectFit: 'contain' }
                    }
                  }}
                />
                <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                  <Typography
                    variant='h6'
                    sx={{
                      mb: 0.5,
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontWeight: 500,
                      fontSize: '20px'
                    }}
                  >
                    Feline care hospital
                  </Typography>
                  <Typography
                    variant='body2'
                    sx={{
                      color: theme.palette.customColors.neutralSecondary,
                      fontSize: '14px'
                    }}
                  >
                    Hospital
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Metrics Section */}
            {/* Total Rooms */}
            <Grid item xs={4} md={2}>
              <Box>
                <Typography
                  sx={{
                    mb: 1,
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontWeight: 600,
                    fontSize: '16px'
                  }}
                >
                  12
                </Typography>
                <Typography
                  sx={{
                    color: theme.palette.customColors.neutralSecondary,
                    fontSize: '14px'
                  }}
                >
                  Total rooms
                </Typography>
              </Box>
            </Grid>

            {/* Available */}
            <Grid item xs={4} md={2}>
              <Box>
                <Typography
                  sx={{
                    mb: 1,
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontWeight: 600,
                    fontSize: '16px'
                  }}
                >
                  4
                </Typography>
                <Typography
                  variant='body2'
                  sx={{
                    color: theme.palette.customColors.neutralSecondary,
                    fontSize: '14px'
                  }}
                >
                  Available
                </Typography>
              </Box>
            </Grid>

            {/* Occupied */}
            <Grid item xs={4} md={2}>
              <Box>
                <Typography
                  sx={{
                    mb: 1,
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontWeight: 600,
                    fontSize: '16px'
                  }}
                >
                  8
                </Typography>
                <Typography
                  variant='body2'
                  sx={{
                    color: theme.palette.customColors.neutralSecondary,
                    fontSize: '14px'
                  }}
                >
                  Occupied
                </Typography>
              </Box>
            </Grid>

            {/* Site Information */}
            <Grid item xs={12} md={3}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Typography
                  sx={{
                    mb: 1,
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontWeight: 600,
                    fontSize: '16px'
                  }}
                >
                  R&Rsite
                </Typography>
                <Typography
                  variant='body2'
                  sx={{
                    color: theme.palette.customColors.neutralSecondary,
                    fontSize: '14px'
                  }}
                >
                  Site
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
}

export default HospitalAnalytics
