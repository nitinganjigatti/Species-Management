import { Card, Typography, Box, IconButton, styled, CardContent, alpha } from '@mui/material'
import { Grid } from '@mui/material'
import React from 'react'
import { useTheme } from '@emotion/react'
import { useRouter } from 'next/router'
import Icon from 'src/@core/components/icon'

import AnimalCard from 'src/views/utility/AnimalCard'
import { StatusCard, VisitType } from './hospitalSnippets'
import AdmissionStatusCard from '../inpatient/AdmissionStatusCard'

const admissionData = [
  { type: 'admitted_on', value: '2:30 pm • 1 Jan 2025' },
  { type: 'admitted_by', value: 'Nihal Mehta' },
  { type: 'admitted_for', value: '4 days' },
  { type: 'holding_location', value: 'Cage 1, Patient Wing 2' },
  { type: 'discharged_on', value: '12:10 pm • 12 Jan 2025' },
  { type: 'admitted_by', value: 'Nihal Mehta' }
]

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

  return (
    <>
      <Card
        sx={{
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          borderBottom: `0.5px solid ${theme.palette.customColors.OutlineVariant}`
        }}
      >
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box
            sx={{
              display: { xs: 'flex', sm: 'none' },
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 3,
                background: theme.palette.customColors.Background,
                borderRadius: 1,
                gap: 5
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                <Typography
                  sx={{ fontSize: '1rem', fontWeight: 600, color: theme.palette.customColors.OnPrimaryContainer }}
                >
                  2nd Visit
                </Typography>
                <Typography sx={{ fontSize: '12px', fontWeight: 600, color: theme.palette.primary.main }}>
                  Current visit
                </Typography>
              </Box>
              <Icon icon={'mingcute:down-fill'} color={theme.palette.customColors.OnPrimaryContainer} />
            </Box>
            <Box>
              <IconButton>
                <Icon icon={'pepicons-pop:dots-y'} />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'flex-start',
                  gap: 3
                }}
              >
                <StyledTypography fontSize={'20px'} fontWeight={500}>
                  MED - 12345/69
                </StyledTypography>
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <VisitType title={'INPATIENT'} />
                  <VisitType title={'Check up'} />
                </Box>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { md: 'row', sm: 'column', xs: 'column' },
                  alignItems: { sm: 'flex-start', md: 'center', xs: 'flex-start' },
                  justifyContent: 'flex-start',
                  gap: 2
                }}
              >
                <StyledTypography>Hospital Case Id : HOS-12345 </StyledTypography>
                <Box
                  sx={{
                    display: { xs: 'none', sm: 'none', md: 'block' },
                    height: '4px',
                    width: '4px',
                    borderRadius: '50%',
                    background: theme.palette.customColors.OnSurfaceVariant
                  }}
                />
                <StyledTypography>Chief veterinarian : Nihal Mehta</StyledTypography>
              </Box>
            </Box>
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 3,
                  background: theme.palette.customColors.Background,
                  borderRadius: 1,
                  gap: 5
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                  <Typography
                    sx={{ fontSize: '1rem', fontWeight: 600, color: theme.palette.customColors.OnPrimaryContainer }}
                  >
                    2nd Visit
                  </Typography>
                  <Typography sx={{ fontSize: '12px', fontWeight: 600, color: theme.palette.primary.main }}>
                    Current visit
                  </Typography>
                </Box>
                <Icon icon={'mingcute:down-fill'} color={theme.palette.customColors.OnPrimaryContainer} />
              </Box>
              <Box>
                <IconButton>
                  <Icon icon={'pepicons-pop:dots-y'} />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
      <Card sx={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <CardContent>
          <Grid container spacing={8} alignItems='stretch'>
            <Grid
              size={{ xs: 12, sm: 12, md: 5 }}
              sx={{
                background: `linear-gradient(90deg, ${alpha(
                  theme.palette.customColors.SecondaryContainer,
                  0.6
                )}, ${alpha(theme.palette.customColors.TertiaryContainer, 0.6)})`,
                py: 4,
                px: 6,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                minHeight: 'fit-content'
              }}
            >
              <AnimalCard data={animalData} />
            </Grid>
            <Grid
              size={{ xs: 12, sm: 12, md: 7 }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                minHeight: 'fit-content'
              }}
            >
              <Grid container spacing={2} columnSpacing={4} rowSpacing={4}>
                {admissionData.map((item, index) => (
                  <Grid key={index} size={{ xs: 12, sm: 6 }}>
                    <AdmissionStatusCard type={item?.type} value={item?.value} />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </>
  )
}

export default PatientCard

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 400,
  color: theme.palette.customColors.OnSurfaceVariant
}))
