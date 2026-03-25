import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Drawer,
  IconButton,
  Skeleton,
  Tooltip,
  Typography,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import { styled, alpha } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useQuery } from '@tanstack/react-query'

import Utility from 'src/utility'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import AnimalCard from 'src/views/utility/AnimalCard'
import { getFetusDetails } from 'src/lib/api/housing'
import type { StyledTypographyProps, FetalDeathDrawerProps } from 'src/types/housing/animalsOffspring'

const FetalDeathDrawer: React.FC<FetalDeathDrawerProps> = ({ open, onClose, fetusId }) => {
  const theme = useTheme() as any
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
  const fetusDetailsData = (fetusDetails?.data || {}) as any

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 560 },
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: theme.palette.customColors?.OnPrimary,
              p: 0,
              height: '100%'
            }
          }
        }}
      >
        {isFetusDetailsFetching ? (
          <LoadingSkeleton />
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              backgroundColor: theme.palette.customColors?.OnPrimary
            }}
          >
            <Box
              sx={{
                backgroundColor: alpha(theme.palette.customColors?.AntzTertiary, 0.5),
                color: theme.palette.customColors?.OnPrimary
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 4 }}>
                <StyledTypography fontWeight={500} fontSize={'20px'} color={theme.palette.customColors.rusticRed}>
                  Fetus Death Summary
                </StyledTypography>
                <IconButton onClick={onClose} sx={{ color: theme.palette.customColors.rusticRed }}>
                  <Icon icon='mdi:close' />
                </IconButton>
              </Box>
              <Box
                sx={{
                  p: 4,
                  mx: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: theme.palette.customColors?.ErrorContainer,
                  borderRadius: 2
                }}
              >
                <Box
                  sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    backgroundColor: theme.palette.customColors?.ErrorContainer
                  }}
                >
                  <Box
                    sx={{
                      px: '12px',
                      py: '6px',
                      borderRadius: '4px',
                      backgroundColor:
                        fetusDetailsData?.type_of_fetal_death === 'stillborn'
                          ? theme.palette.customColors.rusticRed
                          : theme.palette.customColors.Error,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 'fit-content'
                    }}
                  >
                    <StyledTypography
                      color={theme.palette.customColors.OnPrimary}
                      fontSize={'14px'}
                      sx={{ textTransform: 'capitalize' }}
                    >
                      {fetusDetailsData?.type_of_fetal_death}
                    </StyledTypography>
                  </Box>

                  <AnimalCard
                    data={{
                      local_identifier_name: 'FID',
                      local_identifier_value: fetusDetailsData?.display_fetus_code,
                      default_common_name: fetusDetailsData?.default_common_name,
                      complete_name: fetusDetailsData?.complete_name,
                      site_name: fetusDetailsData?.site_name,
                      section_name: fetusDetailsData?.section_name,
                      user_enclosure_name: fetusDetailsData?.user_enclosure_name,
                      default_icon: fetusDetailsData?.default_icon,
                      sex: fetusDetailsData?.sex
                    }}
                    valueColor={theme.palette.customColors.rusticRed}
                  />
                </Box>
              </Box>

              <Box
                sx={{
                  p: 4,
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
                  <StyledTypography color={theme.palette.customColors?.rusticRed} fontSize={'12px'}>
                    Reported by
                  </StyledTypography>
                  <UserAvatarDetails
                    user_name={fetusDetailsData?.user_full_name}
                    profile_image={fetusDetailsData?.user_profile_pic}
                    date={fetusDetailsData?.created_at}
                    show_time
                    size='medium'
                    text_color={theme.palette.customColors.rusticRed}
                  />
                </Box>
                {fetusDetailsData?.user_mobile_number && (
                  <>
                    <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 2 }}>
                      <IconButton
                        sx={{
                          backgroundColor: theme.palette.customColors?.ErrorContainer,
                          color: theme.palette.customColors?.rusticRed,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.customColors?.ErrorContainer, 0.9)
                          }
                        }}
                        onClick={() => window.open(`tel:${fetusDetailsData?.user_mobile_number}`, '_self')}
                      >
                        <Icon icon='mdi:phone' fontSize={20} />
                      </IconButton>
                      <IconButton
                        sx={{
                          backgroundColor: theme.palette.customColors?.ErrorContainer,
                          color: theme.palette.customColors?.rusticRed,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.customColors?.ErrorContainer, 0.9)
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
                          color: theme.palette.customColors?.rusticRed,
                          backgroundColor: theme.palette.customColors?.ErrorContainer,
                          '&:hover': {
                            backgroundColor: alpha(
                              theme.palette.customColors?.ErrorContainer || theme.palette.text.primary,
                              0.9
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
                          color={theme.palette.customColors?.rusticRed}
                        >
                          {fetusDetailsData?.user_mobile_number}
                        </StyledTypography>
                        <Tooltip title={copied ? 'Copied!' : 'Copy number'}>
                          <IconButton
                            size='small'
                            onClick={() => handleCopyNumber(fetusDetailsData?.user_mobile_number || '')}
                            sx={{
                              color: theme.palette.customColors?.rusticRed,
                              '&:hover': {
                                backgroundColor: alpha(
                                  theme.palette.customColors?.ErrorContainer || theme.palette.text.primary,
                                  0.9
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
                minHeight: 0,
                background: theme.palette.customColors?.displaybgPrimary
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  p: 4,
                  gap: 4
                }}
              >
                <Card sx={{ p: 4, boxShadow: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <StyledTypography fontSize={'14px'} color={theme.palette.customColors?.neutralSecondary}>
                      Obstetric estimate of gestation at delivery
                    </StyledTypography>
                    <StyledTypography fontSize={'14px'} fontWeight={500}>
                      {fetusDetailsData?.obstetric_estimate_of_gestation}
                      {fetusDetailsData?.obstetric_estimate_of_gestation_type}
                    </StyledTypography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <StyledTypography fontSize={'14px'} color={theme.palette.customColors?.neutralSecondary}>
                      Estimated date and time of fetal death
                    </StyledTypography>
                    <StyledTypography fontSize={'14px'} fontWeight={500}>
                      {Utility.convertUtcToLocalReadableDate(fetusDetailsData?.estimated_fetus_death_day_time)}{' '}
                      <span> &bull; </span>{' '}
                      {Utility.convertUTCToLocaltime(fetusDetailsData?.estimated_fetus_death_day_time)}
                    </StyledTypography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <StyledTypography fontSize={'14px'} color={theme.palette.customColors?.neutralSecondary}>
                      Date and time of discovery
                    </StyledTypography>
                    <StyledTypography fontSize={'14px'} fontWeight={500}>
                      {Utility.convertUtcToLocalReadableDate(fetusDetailsData?.discovery_of_fetus_death_day_time)}{' '}
                      <span> &bull; </span>{' '}
                      {Utility.convertUTCToLocaltime(fetusDetailsData?.discovery_of_fetus_death_day_time)}
                    </StyledTypography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <StyledTypography fontSize={'14px'} color={theme.palette.customColors?.neutralSecondary}>
                      Notes
                    </StyledTypography>
                    <StyledTypography fontSize={'14px'} fontWeight={500}>
                      {fetusDetailsData?.notes || '--'}
                    </StyledTypography>
                  </Box>
                </Card>

                <Card sx={{ p: 4, boxShadow: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Accordion
                    sx={{
                      boxShadow: 0,
                      '&:before': { display: 'none' },
                      m: 0
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ color: theme.palette.primary.main }} />}
                      aria-controls='panel1-content'
                      id='panel1-header'
                      sx={{
                        p: 0,
                        minHeight: 'unset',
                        '& .MuiAccordionSummary-content': {
                          m: 0
                        }
                      }}
                    >
                      <StyledTypography fontSize={'18px'} fontWeight={600}>
                        Parents
                      </StyledTypography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                      <Box
                        sx={{ border: `1px solid ${theme.palette.customColors?.customTableBorderBg}`, borderRadius: 1 }}
                      >
                        <Box
                          sx={{
                            backgroundColor: theme.palette.customColors.displaybgPrimary,
                            borderRadius: '8px 8px 0 0',
                            p: 3
                          }}
                        >
                          <StyledTypography fontWeight={600}>Mother</StyledTypography>
                        </Box>
                        {/* Mother List */}
                        {fetusDetailsData?.parent_list?.mother_list?.map((parent: any, index: number) => (
                          <Box key={`mother-${index}`} sx={{ p: 3 }}>
                            <AnimalCard data={parent} />
                          </Box>
                        ))}

                        {/* Father List */}
                        {fetusDetailsData?.parent_list?.father_list?.map((parent: any, index: number) => (
                          <Box key={`father-${index}`} sx={{ p: 3 }}>
                            <AnimalCard data={parent} />
                          </Box>
                        ))}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </Card>
              </Box>
            </Box>
          </Box>
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
