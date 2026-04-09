'use client'

import {
  Card,
  Typography,
  Box,
  styled,
  CardContent,
  alpha,
  Skeleton,
  Button,
  Tooltip,
  CircularProgress,
  FormControl,
  Select,
  MenuItem
} from '@mui/material'
import { Grid } from '@mui/material'
import React, { useState } from 'react'
import { useTheme } from '@emotion/react'
import AnimalCard from 'src/views/utility/AnimalCard'
import { VisitType } from './hospitalSnippets'
import AdmissionStatusCard from '../inpatient/AdmissionStatusCard'
import MenuWithDots from 'src/components/MenuWithDots'
import EditPatientDrawer from 'src/components/hospital/drawer/EditPatientDrawer'
import AddPatientDrawer from 'src/components/hospital/drawer/AddPatientDrawer'
import { getPatientDischargeSummary, updateAnimalHealthStatus } from 'src/lib/api/hospital/inpatient'
import Utility, { downloadPDF } from 'src/utility'
import Toaster from 'src/components/Toaster'
import Icon from 'src/@core/components/icon'
import PatientVisitSummaryFilterDrawer from 'src/components/hospital/drawer/PatientVisitSummaryFilterDrawer'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import { useForm } from 'react-hook-form'
import AssessmentDrawer from 'src/components/housing/animals/AssessmentDrawer'

const PatientCard = ({ patientData, animalData, loading, refetch, category, totalVisitCount }) => {
  const theme = useTheme()

  const isPatientDischarged = patientData?.status === 'discharge' ? true : false

  const [openEditPatientDrawer, setOpenEditPatientDrawer] = useState(null)
  const [openAddAnimalDrawer, setOpenAddAnimalDrawer] = useState(false)
  const [dischargeSummaryLoading, setDischargeSummaryLoading] = useState(false)
  const [openVisitSummaryFilterDrawer, setOpenVisitSummaryFilterDrawer] = useState(false)
  const [assessmentDrawerOpen, setAssessmentDrawerOpen] = useState(false)
  // Add this state variable inside PatientCard component
  const [healthStatus, setHealthStatus] = useState(patientData?.health_status || 'stable')

  const healthStatusOptions = [
    { label: 'Stable', value: 'stable' },
    { label: 'Critical', value: 'critical' }
  ]

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

  const { control } = useForm({
    defaultValues: {
      healthStatus: patientData?.health_status || 'stable'
    }
  })

  const getDischargeSummary = async () => {
    setDischargeSummaryLoading(true)
    try {
      // const response = await getPatientDischargeSummary({ hospital_case_id: patientData?.hospital_case_id })
      // if (response?.success) {
      //   console.log(response?.data?.download_url, 'Discharge Summary')

      //   Utility.downloadFileFromURL(response?.data?.download_url)
      //   Toaster({ type: 'success', message: response?.message })
      //   setDischargeSummaryLoading(false)
      // }

      const params = {
        hospital_case_id: patientData?.hospital_case_id
      }

      await downloadPDF({
        apiCall: getPatientDischargeSummary,
        params,
        fileName: `Discharge_Summary${Date.now()}.pdf`
      })
    } catch (error) {
      console.error('Error fetching discharge summary:', error)
      setDischargeSummaryLoading(false)
    } finally {
      setDischargeSummaryLoading(false)
    }
  }

  const handleHealthStatusChange = async (e) => {
    setHealthStatus(e.target.value)
    const newStatus = e.target.value;
    try {
      const payload = {
        health_status: newStatus,
        hospital_case_id: patientData?.hospital_case_id
      }
      const response = await updateAnimalHealthStatus(payload);
      if (response?.success) {
        Toaster({ type: 'success', message: response?.message });
        setHealthStatus(newStatus);
        if (refetch) refetch();
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to update health status' });
      }
    } catch (error) {
      console.error('Error updating health status:', error);
      Toaster({ type: 'error', message: 'An error occurred while updating health status' });
    }
  }

  const getMenuOptions = () => {
    const options = []

    if (true) {
      options.push({
        label: (
          <Tooltip title='Hospital Visit Summary'>
            <Typography>Hospital Visit Summary</Typography>
          </Tooltip>
        ),
        icon: <Icon icon='hugeicons:download-square-02' />,
        action: () => {
          setOpenVisitSummaryFilterDrawer(true)
        }
      })
    }

    if (isPatientDischarged) {
      options.push({
        label: (
          <Tooltip title='Discharge Summary'>
            <Typography>Discharge Summary</Typography>
          </Tooltip>
        ),
        icon: dischargeSummaryLoading ? <CircularProgress size={18} /> : <Icon icon='hugeicons:download-square-02' />,
        action: () => getDischargeSummary()
      })
    }

    if (!isPatientDischarged) {
      options.push({
        label: (
          <Tooltip title='Edit Details'>
            <Typography>Edit Patient</Typography>
          </Tooltip>
        ),
        icon: <Icon icon='mynaui:edit-one' />,
        action: () => {
          setOpenEditPatientDrawer(true)
        }
      })
    }

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
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                gap: 2,
                flexWrap: { xs: 'wrap', md: 'nowrap' }
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  flexWrap: 'wrap',
                  flex: 1
                }}
              >
                {loading ? (
                  <Skeleton variant='text' width={120} height={30} />
                ) : (
                  <StyledTypography fontSize={'20px'} fontWeight={500}>
                    {patientData?.medical_record_code}
                  </StyledTypography>
                )}

                {loading ? (
                  <Skeleton variant='rounded' width={100} height={30} />
                ) : (
                  <>
                    {patientData?.status === 'discharge' ? (
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: theme.palette.customColors.Tertiary,
                          px: 2,
                          py: 1,
                          background: alpha(theme.palette.customColors.Tertiary, 0.3),
                          borderRadius: 0.5,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textTransform: 'uppercase'
                        }}
                      >
                        DISCHARGED
                      </Typography>
                    ) : (
                      <VisitType title={patientData?.treatment_type} />
                    )}
                  </>
                )}

                {loading ? (
                  <Skeleton variant='rounded' width={100} height={40} />
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: "4px 8px",
                      background: theme.palette.customColors.Background,
                      borderRadius: '4px'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                      <Typography
                        sx={{ fontSize: '12px', fontWeight: 600, color: theme.palette.customColors.OnPrimaryContainer }}
                      >
                        {patientData?.visit_label}
                      </Typography>
                      {patientData?.is_current_visit === '1' && (
                        <>
                          <Box sx={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: theme.palette.primary.main }} />
                          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: theme.palette.primary.main }}>
                            Current
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Right side - Health Status and Menu */}
              <Box
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  flexShrink: 0
                }}
              >
                {loading ? (
                  <Skeleton variant='rounded' width={150} height={40} />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Typography 
                      sx={{ 
                        fontSize: '16px', 
                        color: theme.palette.customColors.OnSurfaceVariant,
                        display: { xs: 'flex', sm: 'block' },
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'center', sm: 'center' },
                        gap: { xs: '4px', sm: '0' }
                      }}
                    >
                      Health Status
                    </Typography>
                    <FormControl size='small' sx={{ minWidth: 120 }}>
                      <Select
                        value={healthStatus}
                        onChange={handleHealthStatusChange}
                        sx={{
                          borderRadius: '4px',
                          fontSize: '16px',
                          color: healthStatus === 'critical'
                            ? theme.palette.customColors.Tertiary
                            : theme.palette.customColors.OnSurfaceVariant,
                          fontWeight: 500,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'transparent'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.divider
                          },
                          '& .MuiSelect-select': {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }
                        }}
                        renderValue={(value) => (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Box
                              sx={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                backgroundColor: value === 'critical'
                                  ? alpha(theme.palette.error.main, 0.2)
                                  : theme.palette.customColors.OnBackground,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}
                            >
                              <Box
                                sx={{
                                  width: '10px',
                                  height: '10px',
                                  borderRadius: '50%',
                                  backgroundColor: value === 'critical'
                                    ? theme.palette.customColors.Tertiary
                                    : theme.palette.primary.main
                                }}
                              />
                            </Box>
                            <span>{value === 'critical' ? 'Critical' : 'Stable'}</span>
                          </Box>
                        )}
                      >
                        <MenuItem value='stable' sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500 }}>
                          Stable
                        </MenuItem>
                        <MenuItem value='critical' sx={{ color: theme.palette.customColors.Tertiary, fontWeight: 500 }}>
                          Critical
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                )}

                {loading ? (
                  <Skeleton variant='rounded' width={40} height={40} />
                ) : (
                  getMenuOptions()?.length > 0 && <MenuWithDots options={getMenuOptions()} />
                )}
              </Box>
            </Box>

            {/* Second Row: Hospital Case ID, Chief Veterinarian, Admit Button */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                flexWrap: { xs: 'wrap', md: 'nowrap' }
              }}
            >
              {/* Left side - Case ID and Veterinarian */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  flexWrap: 'wrap',
                  flex: 1
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
                            display: { xs: 'none', md: 'block' },
                            height: '4px',
                            width: '4px',
                            borderRadius: '50%',
                            background: theme.palette.customColors.OnSurfaceVariant
                          }}
                        />
                      </>
                    )}
                    <Box sx={{ maxWidth: { xs: '100%', md: '450px', lg: '600px' } }}>
                      <Tooltip title={patientData?.attend_by_full_name || ''}>
                        <Typography
                          sx={{
                            fontSize: '1rem',
                            fontWeight: 400,
                            color: theme.palette.customColors.OnSurfaceVariant,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            cursor: 'pointer'
                          }}
                        >
                          Chief veterinarian : {patientData?.attend_by_full_name}
                        </Typography>
                      </Tooltip>
                    </Box>
                  </>
                )}
              </Box>

              {/* Right side - Admit Button */}
              {loading ? (
                <Skeleton variant='rounded' width={120} height={45} />
              ) : category === 'Outpatients' ? (
                <Button
                  variant='outlined'
                  sx={{
                    border: `1px solid ${theme.palette.primary.main}`,
                    height: 45,
                    fontWeight: 600,
                    fontSize: '16px',
                    color: theme.palette.primary.main,
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => setOpenAddAnimalDrawer(true)}
                >
                  Admit Animal
                </Button>
              ) : null}
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
                  <AnimalCard data={animalData} onWeightClick={() => setAssessmentDrawerOpen(true)} maxWidth={"auto"} />
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
          refetch={refetch}
        />
      )}
      {openVisitSummaryFilterDrawer && (
        <PatientVisitSummaryFilterDrawer
          open={openVisitSummaryFilterDrawer}
          onClose={() => setOpenVisitSummaryFilterDrawer(false)}
          caseId={patientData?.hospital_case_id}
          animalId={animalData?.animal_id}
        />
      )}
      <AssessmentDrawer
        open={assessmentDrawerOpen}
        onClose={() => setAssessmentDrawerOpen(false)}
        animalData={animalData}
        initialTabName='Weight'
      />
    </>
  )
}

export default PatientCard

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 400,
  color: theme.palette.customColors.OnSurfaceVariant
}))
