import { Card, Typography, Box, styled, CardContent, alpha, Skeleton, Button } from '@mui/material'
import { Grid } from '@mui/material'
import React, { useState } from 'react'
import { useTheme } from '@emotion/react'
import AnimalCard from 'src/views/utility/AnimalCard'
import { VisitType } from './hospitalSnippets'
import AdmissionStatusCard from '../inpatient/AdmissionStatusCard'
import MenuWithDots from 'src/components/MenuWithDots'
import EditPatientDrawer from 'src/components/hospital/drawer/EditPatientDrawer'
import AddPatientDrawer from 'src/components/hospital/drawer/AddPatientDrawer'

const PatientCard = ({ patientData, animalData, loading, refetch }) => {
  const theme = useTheme()

  const isPatientDischarged = patientData?.status === 'discharge' ? true : false

  const [openEditPatientDrawer, setOpenEditPatientDrawer] = useState(null)
  const [openAddAnimalDrawer, setOpenAddAnimalDrawer] = useState(false)

  const admissionData = [
    { type: 'admitted_on', value: patientData?.admitted_at },
    { type: 'admitted_by', value: patientData?.admitted_by_full_name },
    { type: 'admitted_for', value: patientData?.admitted_for_day },
    { type: 'holding_location', value: `${patientData?.bed_name}, ${patientData?.room_name}` }
  ]
  if (isPatientDischarged) {
    admissionData.push(
      { type: 'discharged_on', value: patientData?.discharge_at },
      { type: 'discharged_by', value: patientData?.discharge_by_full_name }
    )
  }

  const getMenuOptions = () => {
    const options = []

    if (!isPatientDischarged) {
      options.push({
        label: 'Edit Details',
        action: () => {
          setOpenEditPatientDrawer(true)
        }
      })
    }

    options.push({
      label: 'Print',
      action: () => {
        console.log('Print action triggered')
      }
    })

    return options
  }

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
            {/* Header Section */}
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
                  {loading ? (
                    <Skeleton variant='text' width={120} height={30} />
                  ) : (
                    <StyledTypography fontSize={'20px'} fontWeight={500}>
                      {patientData?.medical_record_code}
                    </StyledTypography>
                  )}

                  <Box sx={{ display: 'flex', gap: 3 }}>
                    {loading ? (
                      <>
                        <Skeleton variant='rounded' width={80} height={30} />
                        <Skeleton variant='rounded' width={80} height={30} />
                      </>
                    ) : (
                      <>
                        <VisitType title={patientData?.treatment_type} />
                        <VisitType title={patientData?.visit_type} />
                      </>
                    )}
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
                  {loading ? (
                    <Skeleton variant='text' width={200} />
                  ) : (
                    <>
                      {patientData?.case_code && (
                        <>
                          <StyledTypography>Hospital Case Id : {patientData?.case_code}</StyledTypography>
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
                    </>
                  )}
                </Box>
              </Box>

              <Box
                sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}
              >
                {loading ? (
                  <Skeleton variant='rounded' width={100} height={40} />
                ) : patientData?.visit_type === 'opd' && patientData?.status === 'pending' ? (
                  <Button
                    variant='outlined'
                    sx={{
                      border: `1px solid ${theme.palette.primary.main}`,
                      height: 45,
                      fontWeight: 600,
                      fontSize: '16px',
                      color: theme.palette.primary.main
                    }}
                    onClick={() => setOpenAddAnimalDrawer(true)}
                  >
                    Admit Animal
                  </Button>
                ) : null}
                {loading ? (
                  <Skeleton variant='rounded' width={100} height={40} />
                ) : (
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
                          {/* hardcoded */}
                          Current visit
                        </Typography>
                      )}
                    </Box>
                    {/* <Icon icon={'mingcute:down-fill'} color={theme.palette.customColors.OnPrimaryContainer} /> */}
                  </Box>
                )}
                {loading ? (
                  <Skeleton variant='rounded' width={40} height={40} />
                ) : (
                  <MenuWithDots options={getMenuOptions()} />
                )}
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
                    0.25
                  )}, ${alpha(theme.palette.customColors.TertiaryContainer, 0.25)})`,
                  py: 4,
                  px: 6,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  minHeight: 'fit-content'
                }}
              >
                {loading ? (
                  <Skeleton variant='rectangular' width='100%' height={140} sx={{ borderRadius: 1 }} />
                ) : (
                  <AnimalCard data={animalData} />
                )}
              </Grid>

              <Grid
                size={{ xs: 12, sm: 12, md: 7 }}
                sx={{ display: 'flex', alignItems: 'center', minHeight: 'fit-content' }}
              >
                <Grid container spacing={2} columnSpacing={4} rowSpacing={4}>
                  {loading
                    ? Array.from(new Array(4)).map((_, i) => (
                        <Grid key={i} size={{ xs: 12, sm: 6 }}>
                          <Skeleton variant='rectangular' width='100%' height={60} sx={{ borderRadius: 1 }} />
                        </Grid>
                      ))
                    : admissionData.map((item, index) => (
                        <Grid key={index} size={{ xs: 12, sm: 6 }}>
                          <AdmissionStatusCard
                            type={item?.type}
                            value={item?.value}
                            isPatientDischarged={isPatientDischarged}
                          />
                        </Grid>
                      ))}
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
      {openEditPatientDrawer && (
        <EditPatientDrawer
          open={openEditPatientDrawer}
          onClose={() => setOpenEditPatientDrawer(false)}
          patientData={patientData}
          refetch={refetch}
        />
      )}
      {openAddAnimalDrawer && (
        <AddPatientDrawer
          open={openAddAnimalDrawer}
          onClose={() => setOpenAddAnimalDrawer(false)}
          patientData={patientData}
          animalData={animalData}
        />
      )}
    </>
  )
}

export default PatientCard

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 400,
  color: theme.palette.customColors.OnSurfaceVariant
}))
