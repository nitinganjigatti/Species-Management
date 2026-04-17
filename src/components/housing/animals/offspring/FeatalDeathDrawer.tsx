import React, { useState } from 'react'
import { Box, Card, CardContent, Drawer, IconButton, Skeleton, Tooltip, Typography, useTheme } from '@mui/material'
import { styled, alpha } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import AnimalCard from 'src/views/utility/AnimalCard'
import { useQuery } from '@tanstack/react-query'

import type { StyledTypographyProps } from 'src/types/housing/hospitalTransfer'
import { useTranslation } from 'react-i18next'
import { getFetusDetails } from 'src/lib/api/housing'

type FetalDeathDrawerProps = {
  open: boolean
  onClose: () => void
  fetusId: number
}
const FetalDeathDrawer: React.FC<FetalDeathDrawerProps> = ({ open, onClose, fetusId }) => {
  const theme = useTheme()
  const { t } = useTranslation()
  const [showMobileNumber, setShowMobileNumber] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)

  const handleCopyNumber = (number: string): void => {
    navigator.clipboard.writeText(number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const { data: fetusDetails, isFetching: isFetusDetailsFetching } = useQuery({
    queryKey: ['fetus-details', fetusId],
    queryFn: () => getFetusDetails({ fetusId: fetusId as number }),
    enabled: !!fetusId
  })
  const fetusDetailsData = (fetusDetails?.data?.fetus_details?.[0] || {}) as any

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: '80%', md: 560 },
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: theme.palette.customColors?.OnPrimary,
              p: 0
            }
          }
        }}
      >
        {isFetusDetailsFetching ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Header Section */}
            <Box
              sx={{
                position: 'sticky',
                top: 0,
                zIndex: 1,
                backgroundColor: theme.palette.customColors?.OnPrimaryContainer,
                color: theme.palette.customColors?.OnPrimary
              }}
            >
              <Box
                sx={{
                  p: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'inherit',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.action.hover, 0.04)
                  },
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  mb: 2
                }}
              >
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 4
                    }}
                  >
                    <Typography>{t('animals_module.aborted')}</Typography>
                  </Box>
                  <AnimalCard data={fetusDetailsData} cardType='fetus' />
                </Box>
              </Box>

              {/* User / Contact Information */}
              <Box
                sx={{
                  p: 4,
                  backgroundColor: alpha(theme.palette.customColors?.deepDark || '#000', 0.12),
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                  }}
                >
                  <StyledTypography
                    fontSize={'12px'}
                    color={alpha(theme.palette.customColors?.OnPrimary || theme.palette.text.primary, 0.8)}
                  >
                    {t('animals_module.reported_by')}
                  </StyledTypography>
                  <UserAvatarDetails
                    user_name={fetusDetailsData?.user_full_name}
                    profile_image={fetusDetailsData?.user_profile_pic}
                    date={fetusDetailsData?.created_at}
                    show_time
                    size='medium'
                    text_color={theme.palette.customColors?.OnPrimary}
                  />
                </Box>
                {fetusDetailsData?.user_mobile_number && (
                  <>
                    <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 2 }}>
                      <IconButton
                        sx={{
                          backgroundColor: alpha(theme.palette.customColors?.deepDark || 'rgba(0, 0, 0, 0.3)', 0.3),
                          color: theme.palette.customColors?.OnPrimary,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.customColors?.deepDark || 'rgba(0, 0, 0, 0.5)', 0.5)
                          }
                        }}
                        onClick={() => window.open(`tel:${fetusDetailsData?.user_mobile_number}`, '_self')}
                      >
                        <Icon icon='mdi:phone' fontSize={20} />
                      </IconButton>
                      <IconButton
                        sx={{
                          backgroundColor: alpha(theme.palette.customColors?.deepDark || 'rgba(0, 0, 0, 0.3)', 0.3),
                          color: theme.palette.customColors?.OnPrimary,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.customColors?.deepDark || 'rgba(0, 0, 0, 0.5)', 0.5)
                          }
                        }}
                        onClick={() => window.open(`sms:${fetusDetailsData?.user_mobile_number}`, '_self')}
                      >
                        <Icon icon='mdi:message-text' fontSize={20} />
                      </IconButton>
                    </Box>
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                      <IconButton
                        size='small'
                        onClick={() => setShowMobileNumber(prev => !prev)}
                        sx={{
                          color: theme.palette.customColors?.OnPrimary,
                          '&:hover': {
                            backgroundColor: alpha(
                              theme.palette.customColors?.OnPrimary || theme.palette.text.primary,
                              0.1
                            )
                          }
                        }}
                      >
                        <Icon icon='mdi:phone' fontSize={20} />
                      </IconButton>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          overflow: 'hidden',
                          maxWidth: showMobileNumber ? '200px' : '0px',
                          opacity: showMobileNumber ? 1 : 0,
                          transition: 'max-width 0.3s ease-in-out, opacity 0.3s ease-in-out'
                        }}
                      >
                        <StyledTypography
                          fontWeight={500}
                          fontSize={'14px'}
                          color={theme.palette.customColors?.OnPrimary}
                        >
                          {fetusDetailsData?.user_mobile_number}
                        </StyledTypography>
                        <Tooltip title={copied ? 'Copied!' : 'Copy number'}>
                          <IconButton
                            size='small'
                            onClick={() => handleCopyNumber(fetusDetailsData?.user_mobile_number || '')}
                            sx={{
                              color: theme.palette.customColors?.OnPrimary,
                              '&:hover': {
                                backgroundColor: alpha(
                                  theme.palette.customColors?.OnPrimary || theme.palette.text.primary,
                                  0.1
                                )
                              }
                            }}
                          >
                            <Icon icon={copied ? 'mdi:check' : 'mdi:content-copy'} fontSize={20} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </>
                )}
              </Box>
            </Box>

            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                background: theme.palette.customColors?.OnPrimary,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0
              }}
            ></Box>
          </>
        )}
      </Drawer>
    </>
  )
}

export default React.memo(FetalDeathDrawer)

const StyledTypography = styled(Typography)<StyledTypographyProps>(({ theme, fontWeight, fontSize, color, sx }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 400,
  color: color || (theme as any).palette?.customColors?.OnSurfaceVariant || (theme as any).palette?.text?.primary,
  ...(sx as any)
}))

// Loading Skeleton UI
function LoadingSkeleton() {
  const theme = useTheme()

  return (
    <>
      <Box
        sx={{
          backgroundColor: theme.palette.customColors?.OnPrimaryContainer,
          p: 6,
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton variant='text' width={140} height={28} />
          <Skeleton variant='circular' width={32} height={32} />
        </Box>
        <Skeleton variant='text' width={180} height={28} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Skeleton variant='circular' width={16} height={16} />
            <Skeleton variant='text' width={160} height={22} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Skeleton variant='circular' width={16} height={16} />
            <Skeleton variant='text' width={140} height={22} />
          </Box>
        </Box>
        <Box
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.15)',
            borderRadius: 1,
            p: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Skeleton variant='circular' width={40} height={40} />
            <Box>
              <Skeleton variant='text' width={100} height={18} />
              <Skeleton variant='text' width={70} height={14} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Skeleton variant='circular' width={36} height={36} />
            <Skeleton variant='circular' width={36} height={36} />
          </Box>
        </Box>
      </Box>

      <Box sx={{ flex: 1, p: 6, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <Card sx={{ overflow: 'visible' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Skeleton variant='circular' width={24} height={24} />
              <Skeleton variant='text' width={120} height={22} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
              <Skeleton variant='rounded' width={60} height={60} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant='text' width='60%' height={20} />
                <Skeleton variant='text' width='40%' height={16} />
                <Skeleton variant='text' width='30%' height={16} />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ overflow: 'visible' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Skeleton variant='circular' width={24} height={24} />
              <Box>
                <Skeleton variant='text' width={140} height={22} />
                <Skeleton variant='text' width={80} height={16} />
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ overflow: 'visible' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Skeleton variant='circular' width={24} height={24} />
              <Box>
                <Skeleton variant='text' width={140} height={22} />
                <Skeleton variant='text' width={80} height={16} />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ overflow: 'visible' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Skeleton variant='circular' width={24} height={24} />
              <Skeleton variant='text' width={100} height={22} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Skeleton variant='rounded' width='100%' height={40} />
              <Skeleton variant='circular' width={40} height={40} />
            </Box>
            {[1, 2].map(i => (
              <Box key={i} sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 2 }}>
                <Skeleton variant='text' width='90%' height={18} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Skeleton variant='circular' width={28} height={28} />
                  <Skeleton variant='text' width={100} height={14} />
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>
      <Box
        sx={{
          p: 5,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper
        }}
      >
        <Skeleton variant='rounded' width='100%' height={48} />
      </Box>
    </>
  )
}
