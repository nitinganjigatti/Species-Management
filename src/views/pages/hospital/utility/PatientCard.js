import { Card, Typography, Box, IconButton } from '@mui/material'
import { Grid } from '@mui/material'
import React from 'react'
import Icon from 'src/@core/components/icon'
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

import AnimalCard from 'src/views/utility/AnimalCard'
import { StatusCard, VisitType } from './hospitalSnippets'

const animalData = {
  sex: 'male',
  animal_id: '6666/66',
  common_name: 'Leopard',
  scientific_name: 'Panthera pardus',
  user_enclosure_name: 'Enclosure 4',
  section_name: 'Leopard section',
  site_name: 'Feline site'
}

const PatientCard = ({ patientData }) => {
  const theme = useTheme()
  const router = useRouter()

  const handleclick = () => {
    router.push('/hospital/symptoms')
  }

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
      </Grid>
      <Grid
        container
        spacing={8}
        sx={{
          px: { xs: 2, sm: 6 },
          py: { xs: 2, sm: 4 },
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Grid
          item
          size={{ xs: 12, sm: 4 }}
          sx={{
            px: { xs: 2, sm: 8 },
            py: { xs: 3, sm: 6 },
            borderRadius: 1,
            background: 'linear-gradient(90deg, rgba(175,239,235,0.6), rgba(255,189,168,0.6))'
          }}
        >
          <AnimalCard data={animalData} />
        </Grid>
        <Grid item size={{ xs: 12, sm: 8 }}>
          <Grid container spacing={4}>
            <Grid item size={{ xs: 6, sm: 6 }}>
              <StatusCard
                icon={PersonIcon}
                title='Admitted on'
                subtitle='12 Aug 2024'
                iconColor={theme.palette.primary.dark}
                iconBgColor={theme.palette.customColors.OnBackground}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 6 }}>
              <StatusCard
                icon={PersonIcon}
                title='Admitted By'
                subtitle='Nihal Kishor'
                iconColor={theme.palette.primary.dark}
                iconBgColor={theme.palette.customColors.OnBackground}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 6 }}>
              <StatusCard
                icon={ScheduleIcon}
                title='Admitted For'
                subtitle='4 days'
                iconColor={theme.palette.customColors.moderateSecondary}
                iconBgColor='#FCF4AE99'
                subtitleSx={{ fontWeight: 600 }}
              />
            </Grid>
            <Grid item size={{ xs: 6, sm: 6 }}>
              <StatusCard
                icon={HomeIcon}
                title='Holding Location'
                subtitle='Cage 1, Patient Wing 2'
                iconColor={theme.palette.customColors.moderateSecondary}
                iconBgColor='#FCF4AE99'
                subtitleSx={{ fontWeight: 600 }}
              />
            </Grid>
            <Grid item size={{ xs: 6, sm: 6 }}>
              <StatusCard
                icon={HomeIcon}
                title='Discharged On'
                subtitle='12 Aug 2024'
                iconColor='#FA6140'
                iconBgColor='#FFBDA866'
              />
            </Grid>
            <Grid item size={{ xs: 6, sm: 6 }}>
              <StatusCard
                icon={HomeIcon}
                title='Discharged By'
                subtitle='Nihal Mehta'
                iconColor='#FA6140'
                iconBgColor='#FFBDA866'
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Card>
  )
}

export default PatientCard
