import React, { useState, FC, memo, ReactNode } from 'react'
import { Box, Card, Typography, Tooltip, alpha, Skeleton, IconButton, useTheme, Theme } from '@mui/material'
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import Icon from 'src/@core/components/icon'
import AnimalCard from 'src/views/utility/AnimalCard'
import Utility from 'src/utility'
import { useRouter } from 'next/router'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'

interface UserProfile {
  name?: string
  user_name?: string
}

interface MortalityData {
  request_id?: string
  discovered_date?: string
  caracass_condition?: string
  user_full_name?: string
  reported_by?: string
  created_at?: string
  user_mobile_number?: string
  age?: string | number
  [key: string]: any
}

interface NecropsyData {
  user_profile?: UserProfile
  modified_at?: string
  created_at?: string
}

interface InfoItemProps {
  label: string
  value: string
  icon: ReactNode
  iconBgColor: string
  theme: Theme
}

interface NecropsyAnimalInfoCardProps {
  mortalityData?: MortalityData | null
  necropsyData?: NecropsyData | null
  status?: string
  loading?: boolean
  requestId?: string
  onEditClick?: () => void
  onDownloadClick?: () => void
  onDeleteClick?: () => void
  onTimelineClick?: () => void
  onBack?: () => void
  downloadLoading?: boolean
}

const InfoItemSkeleton: FC = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    <Skeleton variant='rectangular' width={44} height={44} sx={{ borderRadius: 1 }} />
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Skeleton variant='text' width={120} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
      <Skeleton variant='text' width={80} height={16} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
    </Box>
  </Box>
)

const AnimalCardSkeleton: FC = () => (
  <Box sx={{ display: 'flex', gap: 3, width: '100%' }}>
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <Skeleton variant='circular' width={44} height={44} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
      <Skeleton variant='rounded' width={24} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
    </Box>
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Skeleton variant='text' width='70%' height={20} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
      <Skeleton variant='text' width='50%' height={18} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
      <Skeleton variant='text' width='40%' height={16} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
      <Skeleton variant='text' width='60%' height={16} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
    </Box>
  </Box>
)

const InfoItem: FC<InfoItemProps> = ({ label, value, icon, iconBgColor, theme }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    <Box
      sx={{
        background: (theme.palette as any).customColors?.OnPrimary,
        borderRadius: 1
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '44px',
          width: '44px',
          minWidth: '44px',
          borderRadius: 1,
          background: iconBgColor
        }}
      >
        {icon}
      </Box>
    </Box>
    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <Tooltip title={value || ''}>
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            color: (theme.palette as any).customColors?.OnPrimary,
            maxWidth: '200px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {value}
        </Typography>
      </Tooltip>
      <Typography
        sx={{
          fontSize: '12px',
          fontWeight: 400,
          color: alpha((theme.palette as any).customColors?.OnPrimary || '#fff', 0.7)
        }}
      >
        {label}
      </Typography>
    </Box>
  </Box>
)

const NecropsyAnimalInfoCard: FC<NecropsyAnimalInfoCardProps> = ({
  mortalityData,
  necropsyData,
  status,
  loading = false,
  requestId,
  onEditClick,
  onDownloadClick,
  onDeleteClick,
  onTimelineClick,
  downloadLoading
}) => {
  const theme = useTheme<Theme>()
  const router = useRouter()
  const [copied, setCopied] = useState<boolean>(false)
  const [showMobileNumber, setShowMobileNumber] = useState<boolean>(false)

  const rusticRed = (theme.palette as any).customColors?.rusticRed

  const handleCopyNumber = (number: string): void => {
    navigator.clipboard.writeText(number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <Card sx={{ boxShadow: 'none', overflow: 'hidden' }}>
        <Box sx={{ backgroundColor: rusticRed, p: 4 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              mb: 4,
              pb: 3,
              borderBottom: `1px solid ${alpha('#fff', 0.2)}`
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Skeleton variant='circular' width={24} height={24} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Skeleton variant='text' width={140} height={24} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
                  <Skeleton
                    variant='rounded'
                    width={50}
                    height={22}
                    sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 1 }}
                  />
                </Box>
                <Skeleton variant='text' width={220} height={18} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Skeleton variant='circular' width={32} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
              <Skeleton variant='circular' width={32} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
            <Box
              sx={{
                flex: { md: '1 1 300px' },
                backgroundColor: alpha('#000', 0.15),
                borderRadius: 1,
                p: 3
              }}
            >
              <AnimalCardSkeleton />
            </Box>
            <Box
              sx={{
                flex: { md: '1 1 200px' },
                display: 'flex',
                flexDirection: { xs: 'row', md: 'column' },
                gap: 3,
                justifyContent: { xs: 'flex-start', md: 'center' }
              }}
            >
              <InfoItemSkeleton />
              <InfoItemSkeleton />
            </Box>
          </Box>
        </Box>
        <Box sx={{ backgroundColor: rusticRed }}>
          <Box sx={{ background: alpha('#000', 0.15), px: 4, py: 3 }}>
            <Skeleton variant='text' width={80} height={16} sx={{ bgcolor: 'rgba(255,255,255,0.15)', mb: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant='circular' width={40} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
                <Box>
                  <Skeleton variant='text' width={150} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
                  <Skeleton variant='text' width={100} height={16} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Skeleton variant='circular' width={36} height={36} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
                <Skeleton variant='circular' width={36} height={36} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
              </Box>
            </Box>
          </Box>
        </Box>
      </Card>
    )
  }

  if (!mortalityData) return null

  const displayRequestId = requestId || mortalityData?.request_id

  const infoFields = [
    {
      label: 'Date and Time of Death',
      value: mortalityData.discovered_date
        ? `${Utility.convertUtcToLocalReadableDate(mortalityData.discovered_date)} • ${Utility.convertUTCToLocaltime(
            mortalityData.discovered_date
          )}`
        : '-',
      icon: <Icon icon='mdi:calendar-outline' fontSize={24} color={(theme.palette as any).customColors?.Tertiary} />,
      iconBgColor: alpha((theme.palette as any).customColors?.Tertiary, 0.2)
    },
    {
      label: 'Carcass Condition',
      value: mortalityData.caracass_condition || '-',
      icon: <Icon icon='mdi:clipboard-text-outline' fontSize={24} color={(theme.palette as any).customColors?.Tertiary} />,
      iconBgColor: alpha((theme.palette as any).customColors?.Notes, 0.5)
    }
  ]

  return (
    <Card sx={{ boxShadow: 'none', overflow: 'hidden' }}>
      <Box sx={{ backgroundColor: rusticRed, p: 4 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: ' space-between',
            gap: 2,
            mb: 4,
            pb: 3,
            borderBottom: `1px solid ${alpha((theme.palette as any).customColors?.OnPrimary || '#fff', 0.2)}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => router.back()}
              sx={{
                p: 0,
                color: (theme.palette as any).customColors?.OnPrimary,
                '&:hover': { backgroundColor: 'transparent' }
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 24 }} />
            </IconButton>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography
                  sx={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: (theme.palette as any).customColors?.OnPrimary
                  }}
                >
                  {displayRequestId || 'Necropsy Request'}
                </Typography>
                {status?.toUpperCase() === 'DRAFT' && (
                  <Box
                    sx={{
                      px: 4,
                      py: 1,
                      borderRadius: 0.5,
                      backgroundColor: (theme.palette as any).customColors?.antzNotes
                    }}
                  >
                    <Typography sx={{ fontSize: '12px', fontWeight: 600, color: (theme.palette as any).customColors?.Tertiary }}>
                      Draft
                    </Typography>
                  </Box>
                )}
              </Box>
              {necropsyData?.user_profile &&
                (status?.toUpperCase() === 'DRAFT' || status?.toUpperCase() === 'COMPLETED') && (
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 400,
                      color: alpha((theme.palette as any).customColors?.OnPrimary || '#fff', 0.8)
                    }}
                  >
                    {status?.toUpperCase() === 'DRAFT' ? 'Saved by ' : 'Updated by '}
                    {necropsyData?.user_profile?.name || necropsyData?.user_profile?.user_name}
                    {' • '}
                    {Utility.formatDisplayDate(necropsyData?.modified_at || necropsyData?.created_at)}
                    {' • '}
                    {Utility.convertUTCToLocaltime(necropsyData?.modified_at || necropsyData?.created_at)}
                  </Typography>
                )}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {onEditClick && (
              <IconButton onClick={onEditClick}>
                <Icon icon={'tabler:pencil'} color={(theme.palette as any).customColors?.OnPrimary} />
              </IconButton>
            )}
            {onDownloadClick && (
              <IconButton onClick={onDownloadClick}>
                <Icon icon={'material-symbols:download-rounded'} color={(theme.palette as any).customColors?.OnPrimary} />
              </IconButton>
            )}
            {onDeleteClick && (
              <IconButton onClick={onDeleteClick}>
                <Icon icon={'ri:delete-bin-6-line'} color={(theme.palette as any).customColors?.OnPrimary} />
              </IconButton>
            )}
            {onTimelineClick && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={onTimelineClick}>
                <Icon icon={'pepicons-pop:rewind-time'} color={(theme.palette as any).customColors?.OnPrimary} />
                <Typography sx={{ color: (theme.palette as any).customColors?.OnPrimary, fontSize: '16px', fontWeight: 500 }}>
                  See timeline
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        <Box
          sx={{
            display: 'flex',
            gap: 8,
            flexDirection: { xs: 'column', md: 'row' }
          }}
        >
          <Box
            sx={{
              flex: { md: '1 1 300px' },
              width: { xs: '100%', md: 'auto' },
              backgroundColor: alpha((theme.palette as any).customColors?.deepDark, 0.2),
              borderRadius: 1,
              py: 4,
              px: 6
            }}
          >
            {(() => {
              const { age, ...animalData } = mortalityData || {}

              return <AnimalCard data={animalData} valueColor={(theme.palette as any).customColors?.OnPrimary} />
            })()}
          </Box>

          <Box
            sx={{
              flex: { md: '1 1 200px' },
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row', md: 'column' },
              gap: 5,
              justifyContent: { xs: 'flex-start', md: 'center' }
            }}
          >
            {infoFields?.map((field, index) => (
              <Box key={index} sx={{ flex: { sm: 1, md: 'unset' } }}>
                <InfoItem
                  label={field.label}
                  value={field.value}
                  icon={field.icon}
                  iconBgColor={field.iconBgColor}
                  theme={theme}
                />
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <Box sx={{ backgroundColor: (theme.palette as any).customColors?.rusticRed }}>
        <Box sx={{ background: alpha((theme.palette as any).customColors?.deepDark, 0.2), px: 4, py: 3 }}>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 400,
              color: alpha((theme.palette as any).customColors?.OnPrimary, 0.8),
              mb: 1
            }}
          >
            Reported by
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <UserAvatarDetails
              user_name={mortalityData?.user_full_name || mortalityData?.reported_by || '-'}
              date={mortalityData?.created_at}
              show_time
              text_color={(theme.palette as any).customColors?.OnPrimary}
            />
            <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 2 }}>
              {mortalityData?.user_mobile_number && (
                <IconButton
                  onClick={() => window.open(`tel:${mortalityData.user_mobile_number}`, '_self')}
                  sx={{
                    backgroundColor: rusticRed,
                    color: (theme.palette as any).customColors?.OnPrimary,
                    '&:hover': { backgroundColor: alpha(rusticRed, 0.85) }
                  }}
                >
                  <Icon icon='mdi:phone' fontSize={20} />
                </IconButton>
              )}
              {mortalityData?.user_mobile_number && (
                <IconButton
                  onClick={() => window.open(`sms:${mortalityData.user_mobile_number}`, '_self')}
                  sx={{
                    backgroundColor: rusticRed,
                    color: (theme.palette as any).customColors?.OnPrimary,
                    '&:hover': { backgroundColor: alpha(rusticRed, 0.85) }
                  }}
                >
                  <Icon icon='mdi:message-text' fontSize={20} />
                </IconButton>
              )}
            </Box>
            {mortalityData?.user_mobile_number && (
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                <IconButton
                  size='small'
                  onClick={() => setShowMobileNumber(prev => !prev)}
                  sx={{
                    color: (theme.palette as any).customColors?.OnPrimary,
                    '&:hover': { backgroundColor: alpha((theme.palette as any).customColors?.OnPrimary || '#fff', 0.1) }
                  }}
                >
                  <Icon icon='mdi:phone' fontSize={18} />
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
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: (theme.palette as any).customColors?.OnPrimary,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {mortalityData.user_mobile_number}
                  </Typography>
                  <Tooltip title={copied ? 'Copied!' : 'Copy number'}>
                    <IconButton
                      size='small'
                      onClick={() => handleCopyNumber(mortalityData.user_mobile_number!)}
                      sx={{
                        color: (theme.palette as any).customColors?.OnPrimary,
                        '&:hover': { backgroundColor: alpha((theme.palette as any).customColors?.OnPrimary || '#fff', 0.1) }
                      }}
                    >
                      <Icon icon={copied ? 'mdi:check' : 'mdi:content-copy'} fontSize={18} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Card>
  )
}

export default memo(NecropsyAnimalInfoCard)
