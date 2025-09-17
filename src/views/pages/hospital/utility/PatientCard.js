import { Card, Typography, Box, IconButton, styled, CardContent, alpha } from '@mui/material'
import { Grid } from '@mui/material'
import React from 'react'
import { useTheme } from '@emotion/react'
import Icon from 'src/@core/components/icon'
import AnimalCard from 'src/views/utility/AnimalCard'
import { VisitType } from './hospitalSnippets'
import AdmissionStatusCard from '../inpatient/AdmissionStatusCard'

const getVisitTypeLabel = title => {
  if (title === 'checkup') return 'Check up'
  if (title === 'emergency') return 'Emergency'
  if (title === 'follow_up') return 'Follow-up'
  if (title === 'outpatient') return 'OUTPATIENT'
  if (title === 'opd') return 'OUTPATIENT'
  if (title === 'planned') return 'Planned'
  if (title === 'inpatient') return 'INPATIENT'
}

const PatientCard = ({ patientData, animalData, loading }) => {
  const theme = useTheme()

  const admissionData = [
    { type: 'admitted_on', value: patientData?.admitted_at },
    { type: 'admitted_by', value: patientData?.admitted_by_full_name },
    { type: 'admitted_for', value: patientData?.admitted_for_day },
    { type: 'holding_location', value: patientData?.bed_name }
  ]

  return (
    <>
      <Box>
        <Card
          sx={{
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,

            borderBottom: `0.5px solid ${theme.palette.divider}`,
            elevation: 'none',
            boxShadow: 'none'
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
                    {patientData?.medical_record_code}
                  </StyledTypography>
                  <Box sx={{ display: 'flex', gap: 3 }}>
                    <VisitType title={getVisitTypeLabel(patientData?.treatment_type)} />
                    <VisitType title={getVisitTypeLabel(patientData?.visit_type)} />
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
                  {patientData?.case_code && (
                    <>
                      <StyledTypography>Hospital Case Id : {patientData?.case_code} </StyledTypography>
                      <Box
                        sx={{
                          display: { xs: 'none', sm: 'none', md: 'block' },
                          height: '4px',
                          width: '4px',
                          borderRadius: '50%',
                          background: theme.palette.customColors.OnSurfaceVariant
                        }}
                      />
                    </>
                  )}

                  <StyledTypography>Chief veterinarian : {patientData?.attend_by_full_name}</StyledTypography>
                </Box>
              </Box>
              <Box
                sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}
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
                      {patientData?.visit_label}
                    </Typography>
                    {patientData?.is_current_visit === '1' && (
                      <Typography sx={{ fontSize: '12px', fontWeight: 600, color: theme.palette.primary.main }}>
                        Current visit
                      </Typography>
                    )}
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
        <Card sx={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, boxShadow: 'none', elevation: 'none' }}>
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
      </Box>
    </>
  )
}

export default PatientCard

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 400,
  color: theme.palette.customColors.OnSurfaceVariant
}))
