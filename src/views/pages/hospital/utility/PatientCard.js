import { Card, Typography, Box, IconButton } from '@mui/material'
import { Grid } from '@mui/material'
import React from 'react'
import Icon from 'src/@core/components/icon'
import AnimalCard from '../../lab/AnimalCard'
import { useTheme } from '@emotion/react'
import { useRouter } from 'next/router'
import {
  MoreVert as MoreVertIcon,
  KeyboardArrowDown as ArrowDownIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material'
import { StatusCard, VisitType } from 'src/views/utility/render-snippets'
import { rgbaToHex } from 'src/@core/utils/rgba-to-hex'

const PatientCard = ({ patientData }) => {
  const theme = useTheme()
  const router = useRouter()

  return (
    <Card sx={{ mt: 6, p: { xs: 3, md: 5 } }}>
      <Grid
        container
        gap={2}
        alignItems='center'
        justifyContent='space-between'
        mb={4}
        sx={{
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          py: 4,
          px: 6
        }}
      >
        <Grid
          size={{ xs: 8 }}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            <Typography
              variant='h6'
              sx={{
                fontWeight: 600,
                color: '#1F515B',
                fontSize: { xs: '1.1rem', md: '1.5rem' }
              }}
            >
              Case ID: 12345/25
            </Typography>
            <VisitType title={'Emergency'} />
            <VisitType title={'Check up'} />
          </Box>
          <Typography
            variant='body2'
            sx={{
              color: '#44544A',
              fontSize: '1rem',
              mt: 1
            }}
          >
            Chief veterinarian: Nihal Mehta
          </Typography>
        </Grid>

        <Grid
          size={{ xs: 3 }}
          sx={{
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                borderRadius: '999px',
                backgroundColor: '#1F515B',
                px: 4,
                py: 3,
                minWidth: 180,
                position: 'relative'
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <Typography
                  sx={{
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '1rem'
                  }}
                >
                  1st Follow Up
                </Typography>

                <Typography
                  sx={{
                    color: '#6EFFA1',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    mt: 0.3
                  }}
                >
                  Current visit
                </Typography>
              </Box>
              <Icon icon={'mdi-chevron-down'} color='white' fontSize={34} />
            </Box>
            <IconButton>
              <Icon icon={'mdi-dots-vertical'} fontSize={30} color='#44544A' />
            </IconButton>
          </Box>
        </Grid>
      </Grid>
      <Grid container gap={2} sx={{ px: 6, py: 4, alignItems: 'center', justifyContent: 'space-between' }}>
        <Grid size={{ sm: 4 }}>
          <AnimalCard textColor={theme.palette.customColors.OnSurfaceVariant} />
        </Grid>
        <Grid size={{ sm: 7 }}>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <StatusCard
                icon={PersonIcon}
                title={'Admitted on'}
                subtitle={'12 Aug 2024'}
                iconColor={theme.palette.primary.dark}
                iconBgColor={theme.palette.customColors.OnBackground}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <StatusCard
                icon={PersonIcon}
                title={'Admitted By'}
                subtitle={'Nihal Kishor'}
                iconColor={theme.palette.primary.dark}
                iconBgColor={theme.palette.customColors.OnBackground}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <StatusCard
                icon={ScheduleIcon}
                title={'Admitted For'}
                subtitle={'4 days'}
                iconColor={theme.palette.customColors.moderateSecondary}
                iconBgColor={'#FCF4AE99'}
                subtitleSx={{ fontWeight: 600 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <StatusCard
                icon={HomeIcon}
                title={'Holding Location'}
                subtitle={'Cage 1, Patient Wing 2'}
                iconColor={theme.palette.customColors.moderateSecondary}
                iconBgColor={'#FCF4AE99'}
                subtitleSx={{ fontWeight: 600 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <StatusCard
                icon={HomeIcon}
                title={'Discharged On'}
                subtitle={'12 Aug 2024'}
                iconColor={'#FA6140'}
                iconBgColor={'#FFBDA866'}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <StatusCard
                icon={HomeIcon}
                title={'Discharged By'}
                subtitle={'Nihal Mehta'}
                iconColor={'#FA6140'}
                iconBgColor={'#FFBDA866'}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Card>
  )
}

export default PatientCard
