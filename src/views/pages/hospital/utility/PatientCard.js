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
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#E1F9ED',
                color: '#37BD69',
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24,
                px: 2,
                py: 1,
                borderRadius: 0.5,
                lineHeight: 1
              }}
            >
              INPATIENT
            </Box>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#AFEFEB4D',
                color: '#00AFD6',
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24,
                px: 2,
                py: 1,
                borderRadius: 0.5,
                lineHeight: 1
              }}
            >
              Check up
            </Box>
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box
                  sx={{
                    width: 45,
                    height: 45,
                    borderRadius: 0.4,
                    backgroundColor: '#e8f5e8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 1.5
                  }}
                >
                  <CalendarIcon sx={{ fontSize: 24, color: '#4caf50' }} />
                </Box>
                <Box>
                  <Typography
                    variant='caption'
                    sx={{
                      color: '#666',
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 400
                    }}
                  >
                    Admitted on
                  </Typography>
                  <Typography
                    variant='body2'
                    sx={{
                      fontWeight: 500,
                      color: '#333',
                      fontSize: '0.875rem'
                    }}
                  >
                    12 Aug 2024 • 2:30 pm
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box
                  sx={{
                    width: 45,
                    height: 45,
                    borderRadius: 0.4,
                    backgroundColor: '#e8f5e8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 1.5
                  }}
                >
                  <PersonIcon sx={{ fontSize: 24, color: '#4caf50' }} />
                </Box>
                <Box>
                  <Typography
                    variant='caption'
                    sx={{
                      color: '#666',
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 400
                    }}
                  >
                    Admitted by
                  </Typography>
                  <Typography
                    variant='body2'
                    sx={{
                      fontWeight: 500,
                      color: '#333',
                      fontSize: '0.875rem'
                    }}
                  >
                    Nihal Mehta
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box
                  sx={{
                    width: 45,
                    height: 45,
                    borderRadius: 0.4,
                    backgroundColor: '#fff3e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 1.5
                  }}
                >
                  <ScheduleIcon sx={{ fontSize: 24, color: '#ff9800' }} />
                </Box>
                <Box>
                  <Typography
                    variant='caption'
                    sx={{
                      color: '#666',
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 400
                    }}
                  >
                    Admitted for
                  </Typography>
                  <Typography
                    variant='body2'
                    sx={{
                      fontWeight: 600,
                      color: '#333',
                      fontSize: '0.875rem'
                    }}
                  >
                    4 days
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box
                  sx={{
                    width: 45,
                    height: 45,
                    borderRadius: 0.4,
                    backgroundColor: '#fff3e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 1.5
                  }}
                >
                  <HomeIcon sx={{ fontSize: 24, color: '#ff9800' }} />
                </Box>
                <Box>
                  <Typography
                    variant='caption'
                    sx={{
                      color: '#666',
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 400
                    }}
                  >
                    Holding Location
                  </Typography>
                  <Typography
                    variant='body2'
                    sx={{
                      fontWeight: 600,
                      color: '#333',
                      fontSize: '0.875rem'
                    }}
                  >
                    Cage 1, Patient Wing 2
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Card>
  )
}

export default PatientCard
