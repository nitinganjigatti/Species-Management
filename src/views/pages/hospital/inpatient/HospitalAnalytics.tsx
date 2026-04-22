'use client'

import React from 'react'
import { Box, Card, CardContent, Typography, Avatar, Grid, useTheme } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useHospital } from 'src/context/HospitalContext'
import HospitalDropdown from 'src/components/hospital/inpatient/HospitalDropdown'

interface ShimmerBoxProps {
  width?: string | number
  height?: string | number
  mb?: number
  borderRadius?: string | number
}

const ShimmerBox = ({ width = '100%', height = '20px', mb = 0, borderRadius = '4px' }: ShimmerBoxProps) => (
  <Box
    sx={{
      width,
      height,
      mb,
      backgroundColor: (theme: any) => theme.palette.grey[300],
      borderRadius,
      animation: 'pulse 1.5s ease-in-out infinite',
      '@keyframes pulse': {
        '0%': { opacity: 0.6 },
        '50%': { opacity: 0.8 },
        '100%': { opacity: 0.6 }
      }
    }}
  />
)

interface HospitalAnalyticsProps {
  disabled?: boolean
}

const HospitalAnalytics = ({ disabled = false }: HospitalAnalyticsProps) => {
  const { t } = useTranslation()
  const theme: any = useTheme()
  const { selectedHospital, hospitalStats, isHospitalStatsLoading }: any = useHospital()

  return (
    <Box sx={{ margin: '0 auto' }}>
      <Card
        sx={{
          borderRadius: '10px',
          overflow: 'visible'
        }}
      >
        <CardContent sx={{ p: 4, mr: { md: '80px' } }}>
          <Grid container spacing={4} alignItems='center' justifyContent='space-between'>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Avatar
                  src='/images/hospital/hospital-icon.svg'
                  alt='Hospital Icon'
                  sx={{
                    width: 56,
                    height: 56,
                    backgroundColor: theme.palette.customColors.antzNotes80,
                    borderRadius: '8px',
                    p: '8px'
                  }}
                  slotProps={{
                    img: {
                      style: { objectFit: 'contain' }
                    }
                  }}
                />
                <Box
                  sx={{
                    textAlign: { md: 'left' }
                  }}
                >
                  <HospitalDropdown disabled={disabled} />
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 4, md: 2 }}>
              <Box>
                {isHospitalStatsLoading ? (
                  <ShimmerBox width='60px' height='24px' mb={1} />
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
                  {t('hospital_module.total_enclosures')}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 4, md: 2 }}>
              <Box>
                {isHospitalStatsLoading ? (
                  <ShimmerBox width='60px' height='24px' mb={1} />
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
                  {t('hospital_module.available')}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 4, md: 2 }}>
              <Box>
                {isHospitalStatsLoading ? (
                  <ShimmerBox width='60px' height='24px' mb={1} />
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
                  {t('hospital_module.occupied')}
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
