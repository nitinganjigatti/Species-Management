import React from 'react'
import { Box, Card, CardContent, Typography, Avatar, Grid, useTheme, CircularProgress } from '@mui/material'
import { useHospital } from 'src/context/HospitalContext'
import HospitalDropdown from 'src/components/hospital/inpatient/HospitalDropdown'

const HospitalAnalytics = () => {
  const theme = useTheme()
  const { selectedHospital, hospitalStats, isHospitalStatsLoading } = useHospital()

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto' }}>
      <Card
        sx={{
          borderRadius: '10px',
          overflow: 'visible'
        }}
      >
        <CardContent sx={{ p: 4, mr: { md: '80px' } }}>
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
                <Box sx={{ textAlign: { md: 'left' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HospitalDropdown />
                  </Box>
                  <Typography
                    variant='body2'
                    sx={{
                      color: theme.palette.customColors.neutralSecondary,
                      fontSize: '14px',
                      pl: 1
                    }}
                  >
                    {selectedHospital ? selectedHospital.location : '-'}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Metrics Section */}
            {/* Total Beds */}
            <Grid item xs={4} md={2}>
              <Box>
                {isHospitalStatsLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <Typography
                    sx={{
                      mb: 1,
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontWeight: 600,
                      fontSize: '16px'
                    }}
                  >
                    {hospitalStats ? hospitalStats.total_beds : '-'}
                  </Typography>
                )}
                <Typography
                  sx={{
                    color: theme.palette.customColors.neutralSecondary,
                    fontSize: '14px'
                  }}
                >
                  Total beds
                </Typography>
              </Box>
            </Grid>

            {/* Available Beds */}
            <Grid item xs={4} md={2}>
              <Box>
                {isHospitalStatsLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <Typography
                    sx={{
                      mb: 1,
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontWeight: 600,
                      fontSize: '16px'
                    }}
                  >
                    {hospitalStats ? hospitalStats.available_beds : '-'}
                  </Typography>
                )}
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

            {/* Occupied Beds */}
            <Grid item xs={4} md={2}>
              <Box>
                {isHospitalStatsLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <Typography
                    sx={{
                      mb: 1,
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontWeight: 600,
                      fontSize: '16px'
                    }}
                  >
                    {hospitalStats ? hospitalStats.occupied_beds : '-'}
                  </Typography>
                )}
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
              <Box>
                {isHospitalStatsLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <Typography
                    sx={{
                      mb: 1,
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontWeight: 600,
                      fontSize: '16px'
                    }}
                  >
                    {selectedHospital?.site_id || '-'}
                  </Typography>
                )}
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
