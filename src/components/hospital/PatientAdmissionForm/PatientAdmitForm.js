import { yupResolver } from '@hookform/resolvers/yup'
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Grid,
  IconButton,
  Skeleton,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { alpha, useTheme } from '@mui/system'
import { useRouter } from 'next/router'
import React, { useContext, useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { MedicalIdChip, VisitType } from 'src/views/pages/hospital/utility/hospitalSnippets'
import TreatmentTypeRadioButtons from 'src/views/pages/hospital/utility/TreatmentTypeRadioButtons'
import AnimalCard from 'src/views/utility/AnimalCard'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import * as yup from 'yup'
import Icon from 'src/@core/components/icon'
import DoctorsDrawer from './DoctorsDrawer'
import { admitHospitalPatient, getPatientDetailsByTransferId } from 'src/lib/api/hospital/incomingPatient'
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
import Utility from 'src/utility'
import { getHospitalBedStats, getHospitalDetail } from 'src/lib/api/hospital/hospitalAnalytics'
import { write } from 'src/lib/windows/utils'
import { useQueryClient } from '@tanstack/react-query'
import AddRoomDrawer from './AddRoomDrawer'
import AddBedsDrawer from './AddBedsDrawer'
import { AuthContext } from 'src/context/AuthContext'
import BottomActionBar from 'src/views/utility/BottomActionBar'
import ControlledSwitch from 'src/views/forms/form-fields/ControlledSwitch'

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
  // patient_status: false
}

const schema = yup.object().shape({
  treatmentType: yup.string().required('Treatment Type is Required'),
  selectedDoctor: yup.mixed().nullable().required('Doctor is required'),
  holdingEnclosure: yup.object().required('Holding Enclosure is required'),
  room: yup.object().required('Room is required'),
  admission_date: yup.date().required('Admission date is required'),
  admission_time: yup.string().required('Admission time is required')
  // patient_status: yup.boolean().required('Patient Status is Required')
})

const PatientAdmitForm = () => {
  const theme = useTheme()
  const router = useRouter()
  const authData = useContext(AuthContext)
  const havePermissionToAddHospital = authData?.userData?.permission?.user_settings?.add_hospital_permission

  const { selectedHospital, updateSelectedHospital, updateHospitalStats, hospitalStats, isHospitalStatsLoading } =
    useHospital()

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
  const [roomLoading, setRoomLoading] = useState(false)
  const [searchRoom, setSearchRoom] = useState('')
  const [bedsLoading, setBedsLoading] = useState(false)
  const [searchEnclosure, setSearchEnclosure] = useState('')
  const [hasPermission, setHasPermission] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [openAddRoomDrawer, setOpenAddRoomDrawer] = useState(false)
  const [openAddBedsDrawer, setOpenAddBedsDrawer] = useState(false)

  const queryClient = useQueryClient()

  useEffect(() => {
    const getPatientInfo = async () => {
      setPatientLoading(true)
      try {
        await getPatientDetailsByTransferId({
          transfer_id: id
        }).then(res => {
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
      setRoomLoading(true)
      try {
        await getHospitalRoomsList({
          hospital_id: selectedHospital?.id,
          page: 1,
          per_page: 20,
          q: searchRoom,
          availability: 'available'
        }).then(res => {
          if (res?.success === true) {
            const filteredRooms = res?.data?.records
              ?.filter(item => item?.status !== '0')
              ?.map(item => ({
                label: item?.room_name,
                value: item?.id
              }))
            setRooms(filteredRooms)
            setRoomLoading(false)
          } else {
            setRooms([])
            setRoomLoading(false)
          }
        })
      } catch (error) {
        console.error(error, 'cannot Fetch hospital rooms listing')
      }
    }

    getHospitalRooms()
  }, [selectedHospital, searchRoom, hospitalStats?.available_rooms])

  const selectedRoom = watch('room')
  const watchTreatmentType = watch('treatmentType')
  // const watchPatientStatus = watch('patient_status')

  useEffect(() => {
    const getHospitalBeds = async () => {
      if (!selectedRoom?.value) return
      setBedsLoading(true)
      try {
        const res = await getRoomsAndEnclosures({
          hospital_id: selectedHospital?.id,
          status: 'active',
          room_id: selectedRoom.value,
          page: 1,

          // is_occupied: 'available',
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
        setBedsLoading(false)
      } finally {
        setBedsLoading(false)
      }
    }

    getHospitalBeds()
  }, [selectedRoom, selectedHospital, searchEnclosure, hospitalStats?.available_rooms])

  const fetchAndUpdateHospitalStats = async hospitalId => {
    if (!hospitalId) return

    try {
      const statsResponse = await getHospitalBedStats(hospitalId)
      if (statsResponse?.success) {
        updateHospitalStats(statsResponse.data)
      }
    } catch (error) {
      console.error('Error fetching hospital stats:', error)
    }
  }

  const onSubmit = async data => {
    setSubmitLoader(true)
    try {
      const params = {
        action: 'admit',
        transfer_id: id,
        treatment_type: data?.treatmentType,
        attend_by: selectedDoctor?.id,
        holding_enclosure: data?.holdingEnclosure?.value,
        admit_date: moment(data?.admission_date).format('YYYY-MM-DD'),
        admit_time: moment(data?.admission_time).format('HH:mm'),
        room_id: data?.room?.value
      }

      const res = await admitHospitalPatient(params)
      if (res?.success === true) {
        Toaster({ type: 'success', message: res?.message })
        if (watchTreatmentType === 'opd') {
          router.push({
            pathname: `/hospital/outpatient`
          })
        } else {
          router.push({
            pathname: `/hospital/inpatient`
          })
        }
        fetchAndUpdateHospitalStats(selectedHospital?.id)
        setSubmitLoader(false)
      } else {
        throw res
      }
    } catch (error) {
      Toaster({ type: 'error', message: error?.message })
      console.error(error, 'Cannot Admit Patient')
      setSubmitLoader(false)
    }
  }

  const selectedDate = watch('admission_date')

  const createdAtLocal = dayjs(Utility.convertUTCToLocal(patientData?.transfer_details?.created_at))
  const now = dayjs()

  const minDate = createdAtLocal.startOf('day')
  const maxDate = now.endOf('day')

  let minTime = null
  let maxTime = null

  if (selectedDate) {
    const isCreatedDate = dayjs(selectedDate).isSame(createdAtLocal, 'day')
    const isToday = dayjs(selectedDate).isSame(now, 'day')

    if (isCreatedDate) {
      minTime = createdAtLocal
    }
    if (isToday) {
      maxTime = now
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
        transfer_id: id,
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

  const fetchHospitalDetail = async id => {
    try {
      const response = await getHospitalDetail(id)

      if (response?.status) {
        if (response?.data?.has_permission == 1) {
          setHasPermission(response?.data?.has_permission)
        } else {
          setHasPermission(0)
          setShowConfirmation(true)
        }
      }
    } catch (error) {
      console.error('Error fetching hospital detail:', error)
    }
  }

  const handleAccessRestrictedConfirmation = () => {
    setShowConfirmation(false)
    updateSelectedHospital(null)
    write('selectedHospital', null)
    updateHospitalStats(null)

    // Invalidate ALL queries that start with 'hospitals-inpatient'
    queryClient.invalidateQueries(
      {
        queryKey: ['hospitals-listing-inpatient']
      },
      {
        type: 'all' // This will invalidate all queries with this prefix
      }
    )
    router.back()
  }

  useEffect(() => {
    if (selectedHospital?.id) {
      fetchHospitalDetail(selectedHospital?.id)
    }
  }, [selectedHospital?.id])

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
        {hasPermission ? (
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
                        default_icon: patientData?.entity_details?.[0]?.default_icon,
                        sex: patientData?.entity_details?.[0]?.sex,
                        type: patientData?.entity_details?.[0]?.type,
                        local_identifier_name: patientData?.entity_details?.[0]?.local_identifier_name,
                        local_identifier_value: patientData?.entity_details?.[0]?.local_identifier_value,
                        animal_id: patientData?.entity_details?.[0]?.animal_id,
                        common_name: patientData?.entity_details?.[0]?.common_name,
                        scientific_name: patientData?.entity_details?.[0]?.scientific_name,
                        age: patientData?.entity_details?.[0]?.age_formatted,
                        site_name: patientData?.entity_details?.[0]?.site_name,
                        section_name: patientData?.entity_details?.[0]?.section_name,
                        user_enclosure_name: patientData?.entity_details?.[0]?.user_enclosure_name
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
                            medId={patientData?.transfer_details?.transfer_reference_code}
                            backgroundColor={theme.palette.customColors.mdAntzNeutral}
                          />
                          <VisitType title={patientData?.transfer_details?.visit_type} />
                        </Box>
                        <Typography
                          sx={{
                            fontSize: '14px',
                            fontWeight: 400,
                            color: theme.palette.customColors.OnPrimaryContainer
                          }}
                        >
                          {patientData?.transfer_details?.reason_for_transfer
                            ? patientData?.transfer_details?.reason_for_transfer
                            : 'NA'}
                        </Typography>
                        <UserAvatarDetails
                          user_name={`${patientData?.transfer_details?.user_first_name} ${patientData?.transfer_details?.user_last_name}`}
                          date={patientData?.transfer_details?.created_at}
                          show_time
                          size='medium'
                          profile_image={patientData?.transfer_details?.user_profile_image}
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
                              disabled={submitLoader}
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
                          <ControlledDatePicker
                            control={control}
                            name={'admission_date'}
                            label='Date*'
                            defaultValue={dayjs()}
                            minDate={minDate}
                            maxDate={maxDate}
                            disabled={submitLoader}
                          />
                        </Grid>
                        <Grid size={{ sm: 6, xs: 6 }}>
                          <ControlledTimePicker
                            control={control}
                            name={'admission_time'}
                            label='Time*'
                            minTime={minTime}
                            maxTime={maxTime}
                            disabled={submitLoader}
                          />
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item size={{ sm: 6, xs: 12 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Typography
                          sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                        >
                          Attending chief Veterinarian
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
                              Select chief Veterinarian*
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
                                cursor: submitLoader ? 'not-allowed' : 'pointer',
                                opacity: submitLoader ? 0.6 : 1,
                                pointerEvents: submitLoader ? 'not-allowed' : 'auto'
                              }}
                            >
                              <Box
                                sx={{
                                  maxWidth: '260px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  opacity: submitLoader ? 0.7 : 1
                                }}
                              >
                                <UserAvatarDetails
                                  profile_image={selectedDoctor?.default_icon}
                                  user_name={selectedDoctor?.name}
                                  role={selectedDoctor?.role_name}
                                />
                              </Box>
                              <IconButton onClick={() => setSelectedDoctor(null)} disabled={submitLoader}>
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
                  {/* <Grid
                    size={{ xs: 12 }}
                    sx={{
                      display: 'none',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 3,
                      border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                      p: 3,
                      borderRadius: 1
                    }}
                  >
                    <Typography
                      sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      Patient Status
                    </Typography>
                    <ControlledSwitch
                      control={control}
                      name='patient_status'
                      errors={errors}
                      required
                      disabled={submitLoader}
                      label={watchPatientStatus ? 'Critical' : 'Normal'}
                      labelPosition='start'
                      spaceBetween
                    />
                  </Grid> */}
                  <Grid container spacing={6}>
                    <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Typography
                        sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                      >
                        Room
                      </Typography>
                      <ControlledAutocomplete
                        name='room'
                        label='Select Room*'
                        control={control}
                        errors={errors}
                        options={rooms}
                        getOptionValue={option => option.value || ''}
                        getOptionLabel={option => option.label || ''}
                        isOptionEqualToValue={(option, value) => option.value === value?.value}
                        required
                        onInputChange={val => debouncedSearch(val)}
                        sx={{
                          background: theme.palette.customColors.Surface,
                          borderRadius: 1
                        }}
                        fullWidth
                        loading={roomLoading}
                        disabled={submitLoader}
                        endAdornment={() =>
                          havePermissionToAddHospital && (
                            <Tooltip title='Add Rooms'>
                              <IconButton
                                size='small'
                                onMouseDown={e => e.preventDefault()}
                                onClick={() => setOpenAddRoomDrawer(true)}
                                sx={{ ml: 1, fontSize: 28 }}
                              >
                                <Icon icon='mdi:plus' color={theme.palette.primary.main} />
                              </IconButton>
                            </Tooltip>
                          )
                        }
                      />
                      {rooms.length === 0 && (
                        <Typography
                          sx={{
                            color: theme.palette.error.main,
                            mt: '0px',
                            mx: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 400
                          }}
                        >
                          No available Enclosures, All Enclosures are occupied
                        </Typography>
                      )}
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Typography
                        sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                      >
                        Holding Enclosure
                      </Typography>
                      <ControlledAutocomplete
                        name='holdingEnclosure'
                        label='Select Holding Enclosure*'
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
                        loading={bedsLoading}
                        disabled={submitLoader}
                        endAdornment={() =>
                          havePermissionToAddHospital && (
                            <Tooltip title='Add Enclosures'>
                              <IconButton
                                size='small'
                                onMouseDown={e => e.preventDefault()}
                                onClick={() => setOpenAddBedsDrawer(true)}
                                sx={{ ml: 1, fontSize: 28 }}
                              >
                                <Icon icon='mdi:plus' color={theme.palette.primary.main} />
                              </IconButton>
                            </Tooltip>
                          )
                        }
                      />
                    </Grid>
                  </Grid>
                </Box>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px',
              width: '100%',
              gap: 3
            }}
          >
            <CircularProgress
              size={60}
              sx={{
                color: theme.palette.primary.main
              }}
            />
            <Typography
              sx={{
                fontSize: '16px',
                fontWeight: 500,
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              Checking access permissions...
            </Typography>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 400,
                color: theme.palette.customColors.OnSurfaceVariant,
                textAlign: 'center',
                maxWidth: '500px'
              }}
            >
              Please wait while we verify your access to admit patients to this hospital
            </Typography>
          </Box>
        )}
      </Box>
      {hasPermission && (
        <BottomActionBar
          submitLabel='Admit'
          cancelLabel='Reject'
          onSubmit={handleSubmit(onSubmit, errors => {
            if (Object.keys(errors).length > 0) {
              const firstError = Object.keys(errors)[0]
              const element = document.querySelector(`[name="${firstError}"]`)
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            }
          })}
          loading={submitLoader}
          disabled={submitLoader}
          cancelBtnVariant='contained'
          cancelBtnStyle={{
            backgroundColor: theme.palette.customColors.Error,
            borderRadius: 0.5,
            minHeight: '56px',
            minWidth: '160px'
          }}
          submitBtnVariant='contained'
          submitBtnStyle={{ backgroundColor: theme.palette.primary.main, borderRadius: 0.5, minWidth: '160px' }}
          onCancel={() => setIsRejecting(true)}
        />
      )}
      {doctorDrawerOpen && (
        <DoctorsDrawer
          open={doctorDrawerOpen}
          setOpen={setDoctorDrawerOpen}
          onSelectDoctor={handleDoctorSelection}
          hospitalId={selectedHospital?.id}
        />
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
              label='Enter Rejection Reason*'
              multiline
              rows={4}
              fullWidth
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              sx={{
                '& .MuiInputBase-root': {
                  backgroundColor: theme.palette.customColors.ErrorContainer
                },
                '& .MuiInputLabel-root': {
                  color: theme.palette.customColors.Error,
                  fontSize: '14px',
                  fontWeight: 400
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: theme.palette.customColors.Error
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: theme.palette.customColors.Error
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.customColors.Error
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.customColors.Error
                  }
                }
              }}
            />
          }
        />
      )}
      {showConfirmation && (
        <ConfirmationDialog
          dialogBoxStatus={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          title={'Access Restricted'}
          // cancelText={'G'}
          cancelBtnStyle={{
            borderColor: theme.palette.grey[500],
            color: theme.palette.grey[700]
          }}
          confirmBtnStyle={{
            background: theme.palette.primary.main,
            py: 2
          }}
          image={'/images/warning-icon.svg'}
          imgStyle={{
            background: theme.palette.grey[200],
            p: 4
          }}
          confirmAction={handleAccessRestrictedConfirmation}
          ConfirmationText={'OK'}
          description={
            <Box>
              <Typography variant='body1' sx={{ mb: 1 }}>
                You don't have permission to admit patients to this hospital.
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Please contact your administrator or request access to proceed.
              </Typography>
            </Box>
          }
          allowCancel={false}
        />
      )}
      {openAddRoomDrawer && (
        <AddRoomDrawer
          open={openAddRoomDrawer}
          setOpen={setOpenAddRoomDrawer}
          selectedHospital={selectedHospital}
          hospitalStats={hospitalStats}
          isHospitalStatsLoading={isHospitalStatsLoading}
          updateHospitalStats={updateHospitalStats}
        />
      )}
      {openAddBedsDrawer && (
        <AddBedsDrawer
          open={openAddBedsDrawer}
          setOpen={setOpenAddBedsDrawer}
          selectedHospital={selectedHospital}
          hospitalStats={hospitalStats}
          isHospitalStatsLoading={isHospitalStatsLoading}
          updateHospitalStats={updateHospitalStats}
        />
      )}
    </>
  )
}

export default PatientAdmitForm
