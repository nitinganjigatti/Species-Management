import { yupResolver } from '@hookform/resolvers/yup'
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  IconButton,
  Skeleton,
  Typography
} from '@mui/material'
import { alpha, useTheme } from '@mui/system'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import { MedicalIdChip, VisitType } from 'src/views/pages/hospital/utility/hospitalSnippets'
import TreatmentTypeRadioButtons from 'src/views/pages/hospital/utility/TreatmentTypeRadioButtons'
import AnimalCard from 'src/views/utility/AnimalCard'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import * as yup from 'yup'
import Icon from 'src/@core/components/icon'
import DoctorsDrawer from './DoctorsDrawer'
import { admitHospitalPatient, getPatientDetails } from 'src/lib/api/hospital/incomingPatient'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import { getRoomsAndEnclosures } from 'src/lib/api/hospital/roomsAndEnclosures'
import Toaster from 'src/components/Toaster'

const treatmentType = [
  { label: 'OPD (outpatient)', value: 'opd' },
  { label: 'Hospital Admission (inpatient)', value: 'inpatient' }
]

const getVisitTypeLabel = title => {
  if (title === 'checkup') return 'Check up'
  if (title === 'emergency') return 'Emergency'
  if (title === 'followup') return 'Follow-up'
  if (title === 'outpatient') return 'OUTPATIENT'
  if (title === 'inpatient') return 'INPATIENT'
  if (title === 'planned') return 'Planned'
}

const defaultValues = {
  treatmentType: 'inpatient',
  holdingEnclosure: null
}

const schema = yup.object().shape({})

const PatientAdmitForm = () => {
  const theme = useTheme()
  const router = useRouter()

  const { id } = router.query

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const [holdingEnclosures, setHoldingEnclosures] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [doctorDrawerOpen, setDoctorDrawerOpen] = useState(false)
  const [patientData, setPatientData] = useState(null)
  const [patientLoading, setPatientLoading] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)

  useEffect(() => {
    const getPatientInfo = async () => {
      setPatientLoading(true)
      try {
        await getPatientDetails(id).then(res => {
          if (res?.success === true) {
            setPatientData(res?.data)
            setPatientLoading(false)
          } else {
            setPatientData(null)
            setPatientLoading(false)
          }
        })
      } catch (error) {
        console.error('Cannot Fetch Patient Details', error)
        setPatientLoading(false)
      }
    }

    getPatientInfo()
  }, [id])

  useEffect(() => {
    const getHospitalBeds = async () => {
      try {
        await getRoomsAndEnclosures({
          hospital_id: 1,
          page: 1
        }).then(res => {
          if (res?.success === true) {
            setHoldingEnclosures(
              res?.data?.records.map(item => {
                return {
                  label: item?.bed_name,
                  value: item?.id
                }
              })
            )
          }
        })
      } catch (error) {
        console.error(error, 'cannot Fetch hospital beds listing')
      }
    }

    getHospitalBeds()
  }, [])

  const onSubmit = async data => {
    setSubmitLoader(true)
    try {
      const params = {
        treatment_type: data?.treatmentType,
        attend_by: selectedDoctor?.id,
        holding_enclosure: data?.holdingEnclosure?.value,
        hospital_case_id: patientData?.hospital_case_id
      }
      await admitHospitalPatient(params).then(res => {
        if (res?.success === true) {
          Toaster({ type: 'success', message: res?.message })
          router.push({
            pathname: `/hospital/inpatient`
          })
        } else {
          Toaster({ type: 'error', message: res?.message })
          setSubmitLoader(false)
        }
      })
    } catch (error) {
      console.error(error, 'Cannot Admit Patient')
      setSubmitLoader(false)
    }
  }

  const headerTitle = (
    <Typography sx={{ fontWeight: 500, fontSize: '24px', color: theme.palette.customColors.customTextColorGray2 }}>
      Patient Admission Form
    </Typography>
  )

  return (
    <>
      <Box>
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
          <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Hospital</Typography>
          <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Patients</Typography>
          <Typography onClick={() => router.back()} sx={{ cursor: 'pointer', color: 'text.primary' }}>
            Incoming
          </Typography>
          <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>admit-patient</Typography>
        </Breadcrumbs>
        <Card sx={{ mb: 4 }}>
          <CardHeader sx={{ pb: 1.5 }} title={headerTitle} />
          <CardContent>
            <Grid container sx={{ mb: 6 }} spacing={0}>
              <Grid
                size={{ xs: 12, md: 4, sm: 5 }}
                sx={{
                  p: 6,
                  background: theme.palette.customColors.antzInfoLight,
                  borderTopLeftRadius: '8px',
                  borderBottomLeftRadius: { sm: '8px', xs: 0 },
                  borderTopRightRadius: { sm: 0, xs: '8px' },
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  height: 'auto'
                }}
              >
                {patientLoading ? (
                  <Skeleton variant='rectangular' height={150} />
                ) : (
                  <AnimalCard
                    data={{
                      default_icon: patientData?.animal_detail?.default_icon,
                      sex: patientData?.animal_detail?.sex,
                      type: patientData?.animal_detail?.type,
                      local_identifier_name: patientData?.animal_detail?.local_identifier_name,
                      local_identifier_value: patientData?.animal_detail?.local_identifier_value,
                      animal_id: patientData?.animal_detail?.animal_id,
                      common_name: patientData?.animal_detail?.common_name,
                      scientific_name: patientData?.animal_detail?.scientific_name,
                      age: patientData?.animal_detail?.age,
                      site_name: patientData?.animal_detail?.site_name,
                      section_name: patientData?.animal_detail?.section_name,
                      user_enclosure_name: patientData?.animal_detail?.user_enclosure_name
                    }}
                  />
                )}
              </Grid>

              <Grid
                size={{ xs: 12, md: 8, sm: 7 }}
                sx={{
                  p: 4,
                  background: alpha(theme.palette.customColors.SecondaryContainer, 0.08),
                  borderBottomLeftRadius: { sm: 0, xs: '8px' },
                  borderTopRightRadius: { sm: '8px', xs: 0 },
                  borderBottomRightRadius: '8px'
                }}
              >
                {patientLoading ? (
                  <>
                    <Skeleton variant='text' width={120} height={32} />
                    <Skeleton variant='rectangular' height={60} sx={{ mt: 2, mb: 2 }} />
                    <Skeleton variant='circular' width={40} height={40} />
                  </>
                ) : (
                  <>
                    <Typography
                      sx={{
                        fontSize: '16px',
                        fontWeight: 500,
                        color: theme.palette.customColors.OnPrimaryContainer,
                        mb: 3
                      }}
                    >
                      Purpose of visit
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 2.5 }}>
                        <MedicalIdChip
                          medId={patientData?.medical_record_code}
                          backgroundColor={theme.palette.customColors.mdAntzNeutral}
                        />
                        <VisitType title={getVisitTypeLabel(patientData?.visit_type)} />
                      </Box>
                      <Typography
                        sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnPrimaryContainer }}
                      >
                        {patientData?.purpose_of_visit}
                      </Typography>
                      <UserAvatarDetails
                        user_name={patientData?.created_by_full_name}
                        date={patientData?.created_at}
                        show_time
                        size='medium'
                        profile_image={patientData?.created_by_profile_pic}
                      />
                    </Box>
                  </>
                )}
              </Grid>
            </Grid>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Typography
                  sx={{ fontSize: '20px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  Enter below details
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    borderRadius: 1,
                    p: 6
                  }}
                >
                  <Typography
                    sx={{ fontSize: '20px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                  >
                    Select treatment type
                  </Typography>
                  <Controller
                    name='treatmentType'
                    control={control}
                    render={({ field }) => (
                      <Box sx={{ display: 'flex', flexDirection: { sm: 'row', xs: 'column' }, gap: 6 }}>
                        {treatmentType?.map((item, index) => (
                          <TreatmentTypeRadioButtons
                            key={index}
                            label={item?.label}
                            isSelected={field.value === item?.value}
                            onClick={() => field.onChange(item?.value)}
                            backgroundColor={theme.palette.customColors.Surface}
                            borderColor={theme.palette.customColors.SurfaceVariant}
                            selectedBorderColor={theme.palette.customColors.SurfaceVariant}
                            selectedBackgroundColor={theme.palette.customColors.Surface}
                          />
                        ))}
                      </Box>
                    )}
                  />
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    p: 6,
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    borderRadius: 1
                  }}
                >
                  <Grid container spacing={7}>
                    <Grid size={{ xs: 12 }}>
                      <Typography
                        sx={{ fontSize: '20px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                      >
                        Admission details
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Typography
                        sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                      >
                        Attending chief doctor
                      </Typography>
                      {selectedDoctor === null ? (
                        <Box
                          sx={{
                            background: theme.palette.customColors.Surface,
                            borderRadius: 1,
                            border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                            p: 3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            minHeight: '56px',
                            cursor: 'pointer'
                          }}
                          onClick={() => setDoctorDrawerOpen(true)}
                        >
                          <Typography
                            sx={{
                              fontSize: '1rem',
                              fontWeight: 400,
                              color: theme.palette.customColors.OnSurfaceVariant
                            }}
                          >
                            Select doctor
                          </Typography>
                          <Icon
                            icon='mdi:chevron-down'
                            fontSize={24}
                            color={theme.palette.customColors.OnSurfaceVariant}
                          />
                        </Box>
                      ) : (
                        <>
                          <Box
                            sx={{
                              background: theme.palette.customColors.OnPrimary,
                              borderRadius: 1,
                              border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                              px: 3,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              minHeight: '56px',
                              cursor: 'pointer'
                            }}
                          >
                            <UserAvatarDetails
                              profile_image={selectedDoctor?.default_icon}
                              user_name={selectedDoctor?.name}
                              role={selectedDoctor?.role_name}
                            />
                            <IconButton onClick={() => setSelectedDoctor(null)}>
                              <Icon icon='charm:cross' fontSize={24} color={theme.palette.customColors.Error} />
                            </IconButton>
                          </Box>
                        </>
                      )}
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Typography
                        sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                      >
                        Holding enclosure
                      </Typography>
                      <ControlledAutocomplete
                        name='holdingEnclosure'
                        label='Select area/cell/enclosure'
                        control={control}
                        errors={errors}
                        options={holdingEnclosures}
                        getOptionLabel={option => option.label || ''}
                        isOptionEqualToValue={(option, value) => option.value === value?.value}
                        required
                        sx={{ background: theme.palette.customColors.Surface }}
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          backgroundColor: theme.palette.customColors.OnPrimary,
          py: 4,
          px: 6,
          boxShadow: `0px -2px 8px ${theme.palette.customColors.shadowColor}`,
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 100
        }}
      >
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Button
            variant='outlined'
            sx={{ borderColor: theme.palette.customColors.Outline, py: '9px', px: 4, borderRadius: 0.5 }}
            onClick={() => router.back()}
          >
            CANCEL
          </Button>
          <Button
            variant='contained'
            sx={{ backgroundColor: theme.palette.primary.main, px: 4, py: '9px', borderRadius: 0.5 }}
            onClick={handleSubmit(onSubmit)}
          >
            ADMIT
          </Button>
        </Box>
      </Box>
      {doctorDrawerOpen && (
        <DoctorsDrawer
          open={doctorDrawerOpen}
          setOpen={setDoctorDrawerOpen}
          onSelectDoctor={doctor => setSelectedDoctor(doctor)}
        />
      )}
    </>
  )
}

export default PatientAdmitForm
