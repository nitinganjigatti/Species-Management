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
  TextField,
  Typography
} from '@mui/material'
import { alpha, useTheme } from '@mui/system'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { MedicalIdChip, VisitType } from 'src/views/pages/hospital/utility/hospitalSnippets'
import TreatmentTypeRadioButtons from 'src/views/pages/hospital/utility/TreatmentTypeRadioButtons'
import AnimalCard from 'src/views/utility/AnimalCard'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import * as yup from 'yup'
import Icon from 'src/@core/components/icon'
import DoctorsDrawer from './DoctorsDrawer'
import { admitHospitalPatient, getPatientDetails } from 'src/lib/api/hospital/incomingPatient'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import { getHospitalRoomsList, getRoomsAndEnclosures } from 'src/lib/api/hospital/roomsAndEnclosures'
import Toaster from 'src/components/Toaster'
import { LoadingButton } from '@mui/lab'
import HospitalAnalytics from 'src/views/pages/hospital/inpatient/HospitalAnalytics'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import dayjs from 'dayjs'
import moment from 'moment'
import { useHospital } from 'src/context/HospitalContext'
import { debounce } from 'lodash'

const treatmentType = [
  { label: 'OPD (outpatient)', value: 'opd' },
  { label: 'Hospital Admission (inpatient)', value: 'inpatient' }
]

const defaultValues = {
  treatmentType: 'inpatient',
  holdingEnclosure: null,
  room: null,
  admission_date: dayjs(),
  admission_time: dayjs()
}

const schema = yup.object().shape({
  treatmentType: yup.string().required('Treatment Type is Required'),
  selectedDoctor: yup.mixed().nullable().required('Doctor is required'),
  holdingEnclosure: yup.object().required('Holding Enclosure is required'),
  room: yup.object().required('Room is required'),
  admission_date: yup.date().required('Admission date is required'),
  admission_time: yup.string().required('Admission time is required')
})

const PatientAdmitForm = () => {
  const theme = useTheme()
  const router = useRouter()

  const { selectedHospital } = useHospital()

  const { id } = router.query

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors,
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
  const [isRejecting, setIsRejecting] = useState(false)
  const [isRejectLoading, setIsSubmitLoading] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rooms, setRooms] = useState([])
  const [searchRoom, setSearchRoom] = useState('')
  const [searchEnclosure, setSearchEnclosure] = useState('')

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
    const getHospitalRooms = async () => {
      try {
        await getHospitalRoomsList({
          hospital_id: selectedHospital?.id,
          page: 1,
          per_page: 20,
          q: searchRoom,
          availability: 'available'
        }).then(res => {
          if (res?.success === true) {
            setRooms(
              res?.data?.records?.map(item => ({
                label: item?.room_name,
                value: item?.id
              }))
            )
          }
        })
      } catch (error) {
        console.error(error, 'cannot Fetch hospital rooms listing')
      }
    }

    getHospitalRooms()
  }, [selectedHospital, searchRoom])

  const selectedRoom = watch('room')

  useEffect(() => {
    const getHospitalBeds = async () => {
      if (!selectedRoom?.value) return
      try {
        const res = await getRoomsAndEnclosures({
          hospital_id: selectedHospital?.id,
          room_id: selectedRoom.value,
          page: 1,
          is_occupied: 'available',
          q: searchEnclosure
        })
        if (res?.success === true) {
          setHoldingEnclosures(
            res?.data?.records?.map(item => ({
              label: item?.bed_name,
              value: item?.id
            }))
          )
        }
      } catch (error) {
        console.error('Cannot fetch hospital beds listing', error)
      }
    }

    getHospitalBeds()
  }, [selectedRoom, selectedHospital, searchEnclosure])

  const onSubmit = async data => {
    setSubmitLoader(true)
    try {
      const params = {
        action: 'admit',
        treatment_type: data?.treatmentType,
        attend_by: selectedDoctor?.id,
        holding_enclosure: data?.holdingEnclosure?.value,
        hospital_case_id: patientData?.hospital_case_id,
        admit_date: moment(data?.admission_date).format('YYYY-MM-DD'),
        admit_time: moment(data?.admission_time).format('HH:mm'),
        room_id: data?.room?.value
      }

      await admitHospitalPatient(params).then(res => {
        if (res?.success === true) {
          Toaster({ type: 'success', message: res?.message })
          router.push({
            pathname: `/hospital/inpatient`
          })
          setSubmitLoader(false)
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
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Icon icon='mdi:arrow-left' fontSize={24} onClick={() => router.back()} style={{ cursor: 'pointer' }} />
      <Typography sx={{ fontWeight: 500, fontSize: '24px', color: theme.palette.customColors.customTextColorGray2 }}>
        Patient Admission Form
      </Typography>
    </Box>
  )

  const handleDoctorSelection = doctor => {
    setSelectedDoctor(doctor)
    setValue('selectedDoctor', doctor)
    clearErrors('selectedDoctor')
  }

  const handlePatientRejection = async () => {
    setIsSubmitLoading(true)
    try {
      const params = {
        action: 'reject',
        hospital_case_id: patientData?.hospital_case_id,
        reject_reason: rejectionReason
      }
      await admitHospitalPatient(params).then(res => {
        if (res?.success === true) {
          Toaster({ type: 'success', message: res?.message })
          setIsSubmitLoading(false)
          setIsRejecting(false)
          router.push({
            pathname: `/hospital/incoming`
          })
        } else {
          Toaster({ type: 'error', message: res?.message })
          setIsSubmitLoading(false)
        }
      })
    } catch (error) {
      console.error('Cannot Reject Patient', error)
    }
  }

  const debouncedSearch = React.useMemo(() => debounce(val => setSearchRoom(val), 1000), [])

  const debouncedEnclosureSearch = React.useMemo(() => debounce(val => setSearchEnclosure(val), 1000), [])

  return (
    <>
      <Box>
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
          <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Hospital</Typography>
          <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Patients</Typography>
          <Typography onClick={() => router.back()} sx={{ cursor: 'pointer', color: 'text.primary' }}>
            Incoming
          </Typography>
          <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Patient Admission Form</Typography>
        </Breadcrumbs>
        <HospitalAnalytics disabled />
        <Card sx={{ mb: 4, mt: 4 }}>
          <CardHeader sx={{ pb: 1, px: 6, pt: 6 }} title={headerTitle} />
          <CardContent sx={{ px: 6, pb: 6 }}>
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
                        <VisitType title={patientData?.visit_type} />
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
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4
                  }}
                >
                  <Typography
                    sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
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
                            backgroundColor={theme.palette.customColors.OnPrimary}
                            borderColor={theme.palette.customColors.OutlineVariant}
                            selectedBorderColor={theme.palette.primary.main}
                            selectedBackgroundColor={theme.palette.customColors.OnPrimary}
                          />
                        ))}
                      </Box>
                    )}
                  />
                </Box>
                <Grid container spacing={6}>
                  <Grid item size={{ sm: 6, xs: 12 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography
                      sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      Admitting date and Time
                    </Typography>
                    <Grid container spacing={6}>
                      <Grid size={{ sm: 6, xs: 6 }}>
                        <ControlledTimePicker control={control} name={'admission_time'} label='Time' />
                      </Grid>
                      <Grid size={{ sm: 6, xs: 6 }}>
                        <ControlledDatePicker
                          control={control}
                          name={'admission_date'}
                          label='Date'
                          defaultValue={dayjs()}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item size={{ sm: 6, xs: 12 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                            border: errors.selectedDoctor
                              ? ` 1px solid ${theme.palette.customColors.Error}`
                              : `1px solid ${theme.palette.customColors.OutlineVariant}`,
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
                              color: errors.selectedDoctor
                                ? theme.palette.customColors.Error
                                : theme.palette.customColors.OnSurfaceVariant
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
                    </Box>
                    {errors.selectedDoctor && (
                      <Typography
                        sx={{
                          color: theme.palette.error.main,
                          mt: '3px',
                          mx: '14px',
                          fontSize: '0.75rem',
                          fontWeight: 400
                        }}
                      >
                        {errors.selectedDoctor.message}
                      </Typography>
                    )}
                  </Grid>
                </Grid>
                <Grid container spacing={6}>
                  <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography
                      sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      Room
                    </Typography>
                    <ControlledAutocomplete
                      name='room'
                      label='Select Room'
                      control={control}
                      errors={errors}
                      options={rooms}
                      getOptionValue={option => option.value || ''}
                      getOptionLabel={option => option.label || ''}
                      isOptionEqualToValue={(option, value) => option.value === value?.value}
                      required
                      onInputChange={val => debouncedSearch(val)}
                      sx={{ background: theme.palette.customColors.Surface, borderRadius: 1 }}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography
                      sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      Holding Unit
                    </Typography>
                    <ControlledAutocomplete
                      name='holdingEnclosure'
                      label='Select Holding Unit'
                      control={control}
                      errors={errors}
                      options={holdingEnclosures}
                      getOptionValue={option => option.value || ''}
                      getOptionLabel={option => option.label || ''}
                      isOptionEqualToValue={(option, value) => option.value === value?.value}
                      required
                      onInputChange={val => debouncedEnclosureSearch(val)}
                      sx={{ background: theme.palette.customColors.Surface, borderRadius: 1 }}
                      fullWidth
                    />
                  </Grid>
                </Grid>
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
          zIndex: 100,
          borderTopLeftRadius: 1,
          borderTopRightRadius: 1
        }}
      >
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Button
            variant='contained'
            sx={{
              backgroundColor: theme.palette.customColors.Error,
              borderRadius: 0.5,
              minHeight: '56px',
              minWidth: '160px'
            }}
            onClick={() => setIsRejecting(true)}
          >
            REJECT
          </Button>
          <LoadingButton
            variant='contained'
            sx={{ backgroundColor: theme.palette.primary.main, borderRadius: 0.5, minWidth: '160px' }}
            onClick={handleSubmit(onSubmit)}
            loading={submitLoader}
          >
            ADMIT
          </LoadingButton>
        </Box>
      </Box>
      {doctorDrawerOpen && (
        <DoctorsDrawer open={doctorDrawerOpen} setOpen={setDoctorDrawerOpen} onSelectDoctor={handleDoctorSelection} />
      )}
      {isRejecting && (
        <ConfirmationDialog
          dialogBoxStatus={isRejecting}
          onClose={() => setIsRejecting(false)}
          title={'Reject Incoming patient'}
          cancelText={'CANCEL'}
          cancelBtnStyle={{
            borderColor: theme.palette.customColors.OnPrimaryContainer,
            color: theme.palette.customColors.OnPrimaryContainer
          }}
          confirmBtnStyle={{ background: theme.palette.customColors.Error, py: 2 }}
          image={'/images/warning-icon.svg'}
          imgStyle={{ background: theme.palette.customColors.TertiaryLight, p: 4 }}
          confirmAction={handlePatientRejection}
          loading={isRejectLoading}
          ConfirmationText={'SUBMIT'}
          description={"Once rejected, the animal can't be admitted again."}
          formComponent={
            <TextField
              label='Enter Rejection Reason'
              multiline
              rows={4}
              fullWidth
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              sx={{
                '& .MuiInputBase-root': {
                  backgroundColor: '#FFD3D3'
                },
                '& .MuiInputLabel-root': {
                  color: '#E93353',
                  fontSize: '14px',
                  fontWeight: 400
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#E93353'
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#E93353'
                  },
                  '&:hover fieldset': {
                    borderColor: '#E93353'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#E93353'
                  }
                }
              }}
            />
          }
        />
      )}
    </>
  )
}

export default PatientAdmitForm
