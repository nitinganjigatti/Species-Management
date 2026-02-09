import React from 'react'
import { Box, Card, CardContent, Grid, Typography, Tooltip, alpha, Skeleton, IconButton, useTheme } from '@mui/material'
import {
  CalendarMonth as CalendarIcon,
  MedicalInformation as MedicalIcon,
  Inventory as InventoryIcon,
  Scale as ScaleIcon,
  LocalShipping as ShippingIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material'
import AnimalCard from 'src/views/utility/AnimalCard'
import Utility from 'src/utility'
import { useRouter } from 'next/router'

const InfoItemSkeleton = ({ theme }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
    <Skeleton variant='rectangular' width={48} height={48} sx={{ borderRadius: 1 }} />
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Skeleton variant='text' width={80} height={20} />
      <Skeleton variant='text' width={120} height={22} />
    </Box>
  </Box>
)

const AnimalCardSkeleton = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%' }}>
    <Skeleton variant='circular' width={80} height={80} />
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Skeleton variant='text' width='60%' height={28} />
      <Skeleton variant='text' width='40%' height={20} />
      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <Skeleton variant='rounded' width={60} height={24} sx={{ borderRadius: '12px' }} />
        <Skeleton variant='rounded' width={80} height={24} sx={{ borderRadius: '12px' }} />
      </Box>
    </Box>
  </Box>
)

const InfoItem = ({ label, value, icon, iconBgColor, theme }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: iconBgColor,
        height: '48px',
        width: '48px',
        minWidth: '48px',
        borderRadius: 1
      }}
    >
      {icon}
    </Box>
    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <Typography
        sx={{
          fontSize: '14px',
          fontWeight: 400,
          color: theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary
        }}
      >
        {label}
      </Typography>
      <Tooltip title={value || ''}>
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary,
            maxWidth: '300px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {value}
        </Typography>
      </Tooltip>
    </Box>
  </Box>
)

const NecropsyAnimalInfoCard = ({ mortalityData, loading = false, requestId }) => {
  const theme = useTheme()
  const router = useRouter()

  if (loading) {
    return (
      <Card sx={{ boxShadow: 'none' }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 3,
              pb: 2,
              gap: 4
            }}
          >
            <Skeleton variant='rectangular' width={28} height={28} />
            <Skeleton variant='rectangular' width={180} height={32} sx={{ borderRadius: 1 }} />
          </Box>

          <Grid container spacing={8} alignItems='stretch'>
            <Grid
              size={{ xs: 12, sm: 12, md: 5 }}
              sx={{
                background: `linear-gradient(90deg, ${alpha(
                  theme.palette.customColors?.SecondaryContainer || theme.palette.primary.light,
                  0.25
                )}, ${alpha(theme.palette.customColors?.TertiaryContainer || theme.palette.secondary.light, 0.25)})`,
                py: 4,
                px: 6,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                minHeight: 'fit-content'
              }}
            >
              <AnimalCardSkeleton />
            </Grid>

            <Grid
              size={{ xs: 12, sm: 12, md: 7 }}
              sx={{ display: 'flex', alignItems: 'center', minHeight: 'fit-content' }}
            >
              <Grid container spacing={2} columnSpacing={4} rowSpacing={4}>
                {[1, 2, 3, 4, 5, 6].map(item => (
                  <Grid key={item} size={{ xs: 12, sm: 6 }}>
                    <InfoItemSkeleton theme={theme} />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    )
  }

  if (!mortalityData) return null

  const infoFields = [
    {
      label: 'Discovered Date',
      value: mortalityData.discovered_date
        ? `${Utility.convertUtcToLocalReadableDate(
            mortalityData.discovered_date
          )} \u2022 ${Utility.convertUTCToLocaltime(mortalityData.discovered_date)}`
        : '-',
      icon: <CalendarIcon sx={{ fontSize: 26, color: theme.palette.success.main }} />,
      iconBgColor: theme.palette.customColors?.OnBackground || alpha(theme.palette.success.main, 0.1)
    },
    {
      label: 'Manner of Death',
      value: mortalityData.manner_of_death || '-',
      icon: <MedicalIcon sx={{ fontSize: 26, color: theme.palette.success.main }} />,
      iconBgColor: theme.palette.customColors?.OnBackground || alpha(theme.palette.success.main, 0.1)
    },
    {
      label: 'Carcass Condition',
      value: mortalityData.caracass_condition || '-',
      icon: <InventoryIcon sx={{ fontSize: 26, color: theme.palette.warning.main }} />,
      iconBgColor: alpha(theme.palette.customColors?.Notes || theme.palette.warning.main, 0.6)
    },
    {
      label: 'Carcass Weight',
      value: mortalityData.carcass_weight
        ? `${mortalityData.carcass_weight} ${mortalityData.uom_abbr || mortalityData.carcass_weight_uom || ''}`.trim()
        : '-',
      icon: <ScaleIcon sx={{ fontSize: 26, color: theme.palette.warning.main }} />,
      iconBgColor: alpha(theme.palette.customColors?.Notes || theme.palette.warning.main, 0.6)
    },
    {
      label: 'Carcass Disposition',
      value: mortalityData.carcass_disposition_name || mortalityData.carcass_disposition || '-',
      icon: (
        <ShippingIcon sx={{ fontSize: 26, color: theme.palette.customColors?.Tertiary || theme.palette.error.main }} />
      ),
      iconBgColor: alpha(theme.palette.customColors?.TertiaryContainer || theme.palette.error.light, 0.4)
    },
    {
      label: 'Reported By',
      value: mortalityData.user_full_name || mortalityData.reported_by || '-',
      icon: (
        <PersonIcon sx={{ fontSize: 26, color: theme.palette.customColors?.Tertiary || theme.palette.error.main }} />
      ),
      iconBgColor: alpha(theme.palette.customColors?.TertiaryContainer || theme.palette.error.light, 0.4)
    }
  ]

  const displayRequestId = requestId || mortalityData?.request_id

  return (
    <Card sx={{ boxShadow: 'none' }}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 3,
            pb: 2,
            gap: 4
          }}
        >
          <IconButton
            onClick={() => {
              router.back()
            }}
            sx={{
              p: 0,
              '&:hover': {
                backgroundColor: 'transparent'
              }
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 28, color: theme.palette.text.primary }} />
          </IconButton>

          {displayRequestId ? (
            <Typography
              sx={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              {displayRequestId}
            </Typography>
          ) : (
            <Typography
              sx={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              Pending Necropsy Details
            </Typography>
          )}
        </Box>

        <Grid container spacing={8} alignItems='stretch'>
          <Grid
            size={{ xs: 12, sm: 12, md: 5 }}
            sx={{
              background: `linear-gradient(90deg, ${alpha(
                theme.palette.customColors?.SecondaryContainer || theme.palette.primary.light,
                0.25
              )}, ${alpha(theme.palette.customColors?.TertiaryContainer || theme.palette.secondary.light, 0.25)})`,
              py: 4,
              px: 6,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              minHeight: 'fit-content'
            }}
          >
            <AnimalCard data={mortalityData} />
          </Grid>

          <Grid
            size={{ xs: 12, sm: 12, md: 7 }}
            sx={{ display: 'flex', alignItems: 'center', minHeight: 'fit-content' }}
          >
            <Grid container spacing={2} columnSpacing={4} rowSpacing={4}>
              {infoFields.map((field, index) => (
                <Grid key={index} size={{ xs: 12, sm: 6 }}>
                  <InfoItem
                    label={field.label}
                    value={field.value}
                    icon={field.icon}
                    iconBgColor={field.iconBgColor}
                    theme={theme}
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default NecropsyAnimalInfoCard
