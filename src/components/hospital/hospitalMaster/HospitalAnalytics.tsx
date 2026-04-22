'use client'

import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Grid,
  useTheme,
  CircularProgress,
  useMediaQuery
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import styled from '@emotion/styled'

interface HospitalAnalyticsProps {
  isHospitalStatsLoading?: boolean
  hospitalDetails?: any
}

const HospitalAnalytics = ({ isHospitalStatsLoading, hospitalDetails }: HospitalAnalyticsProps) => {
  const { t } = useTranslation()
  const theme: any = useTheme()
  const isBelowMd = useMediaQuery(theme.breakpoints.down('md')) // screen width < 900px
  const isBelowSm = useMediaQuery(theme.breakpoints.down('sm')) // screen width < 600px

  const StatBox = ({ label, value }: { label: string; value: any }) => (
    <Box>
      <StyledTypography>{label}</StyledTypography>
      {isHospitalStatsLoading ? (
        <CircularProgress size={20} />
      ) : (
        <StyledTypography color={theme.palette.customColors.OnSurfaceVariant} fontSize={'1rem'} fontWeight={500}>
          {value ?? '-'}
        </StyledTypography>
      )}
    </Box>
  )

  return (
    <Card
      sx={{
        borderRadius: '8px',
        boxShadow: 'none',
        backgroundColor: theme.palette.customColors.Surface
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
        <Grid container spacing={6} alignItems='center' justifyContent={isBelowMd ? 'space-between' : undefined}>
          {isBelowMd ? (
            <Grid size={{ xs: 12, sm: 12 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 2
                }}
              >
                {/* Hospital Name */}
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
                      width: 64,
                      height: 64,
                      backgroundColor: theme.palette.customColors.antzNotes80,
                      borderRadius: '8px',
                      p: 3
                    }}
                    slotProps={{
                      img: {
                        style: { objectFit: 'contain' }
                      }
                    }}
                  />
                  <Box>
                    <StyledTypography>{t('hospital_module.hospital_name')}</StyledTypography>
                    {isHospitalStatsLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <TextEllipsisWithModal
                        enableDialog={false}
                        text={hospitalDetails?.hospital_name ?? '-'}
                        style={{
                          color: theme.palette.customColors.OnSurfaceVariant,
                          fontSize: '1rem',
                          fontWeight: 500,
                          maxWidth: { xs: '220px', sm: '240px' }
                        }}
                      />
                    )}
                  </Box>
                </Box>

                {/* User Avatar beside Hospital Name */}
                <Box>
                  {isHospitalStatsLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <>
                      {isBelowMd && !isBelowSm && (
                        <UserAvatarDetails
                          user_name={
                            hospitalDetails?.updated_by_name
                              ? hospitalDetails?.updated_by_name
                              : hospitalDetails?.created_by_name ?? '-'
                          }
                          date={
                            hospitalDetails?.updated_by
                              ? hospitalDetails?.updated_at
                              : hospitalDetails?.created_at ?? '-'
                          }
                          show_time={false}
                          size='medium'
                          profile_image={
                            hospitalDetails?.updated_by_name
                              ? hospitalDetails?.updated_user_profile_pic
                              : hospitalDetails?.profile_pic ?? '-'
                          }
                          dateType={hospitalDetails?.updated_by ? 'updated' : 'created'}
                        />
                      )}
                    </>
                  )}
                </Box>
              </Box>
            </Grid>
          ) : (
            <>
              <Grid size={{ xs: 12, sm: 12, md: 3.4 }}>
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
                      width: 64,
                      height: 64,
                      backgroundColor: theme.palette.customColors.antzNotes80,
                      borderRadius: '8px',
                      p: 3
                    }}
                    slotProps={{
                      img: {
                        style: { objectFit: 'contain' }
                      }
                    }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <StyledTypography>{t('hospital_module.hospital_name')}</StyledTypography>
                    {isHospitalStatsLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <TextEllipsisWithModal
                        enableDialog={false}
                        text={hospitalDetails?.hospital_name ?? '-'}
                        style={{
                          color: theme.palette.customColors.OnSurfaceVariant,
                          fontSize: '1rem',
                          fontWeight: 500,
                          maxWidth: '100%'
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </Grid>
            </>
          )}

          {/* Stats Section */}
          <Grid size={{ xs: 6, sm: 2, md: 1.3 }}>
            <StatBox label={(t('hospital_module.rooms') as string)} value={hospitalDetails?.active_room_count ?? '-'} />
          </Grid>

          <Grid size={{ xs: 6, sm: 2, md: 1.3 }}>
            <StatBox label={(t('hospital_module.enclosures') as string)} value={hospitalDetails?.active_bed_count ?? '-'} />
          </Grid>

          <Grid size={{ xs: 6, sm: 2, md: 1.3 }}>
            <StatBox label={(t('hospital_module.occupied') as string)} value={hospitalDetails?.no_of_occupied ?? '-'} />
          </Grid>

          <Grid size={{ xs: 6, sm: 3, md: 1.9 }}>
            <Typography
              sx={{
                color: theme.palette.customColors.neutralSecondary,
                fontSize: '0.875rem'
              }}
            >
              {t('hospital_module.site')}
            </Typography>
            {isHospitalStatsLoading ? (
              <CircularProgress size={20} />
            ) : (
              <TextEllipsisWithModal
                enableDialog={false}
                text={hospitalDetails?.site_name ?? '-'}
                style={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontSize: '1rem',
                  fontWeight: 500,
                  maxWidth: '100%'
                }}
              />
            )}
          </Grid>

          {/* User Avatar Details for large screens only */}
          {(!isBelowMd || isBelowSm) && (
            <Grid size={{ xs: 12, sm: 3, md: 2.8 }}>
              {isHospitalStatsLoading ? (
                <CircularProgress size={20} />
              ) : (
                <UserAvatarDetails
                  user_name={
                    hospitalDetails?.updated_by
                      ? hospitalDetails?.updated_by_name
                      : hospitalDetails?.created_by_name ?? '-'
                  }
                  date={hospitalDetails?.updated_by ? hospitalDetails?.updated_at : hospitalDetails?.created_at ?? '-'}
                  show_time={false}
                  size='medium'
                  profile_image={
                    hospitalDetails?.updated_by
                      ? hospitalDetails?.updated_user_profile_pic
                      : hospitalDetails?.profile_pic ?? '-'
                  }
                  dateType={hospitalDetails?.updated_by ? 'updated' : 'created'}
                />
              )}
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default HospitalAnalytics

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color, sx }: any) => ({
  fontSize: fontSize || '0.875rem',
  fontWeight: fontWeight || 400,
  color: color || theme.palette.customColors.neutralSecondary,
  ...sx
}))
