import { Box, Button, CircularProgress, Drawer, Grid, IconButton, Tooltip, Typography, useTheme } from '@mui/material'
import { debounce } from 'lodash'
import React, { useContext, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Icon from 'src/@core/components/icon'
import { useHospital } from 'src/context/HospitalContext'
import { getHospitalRoomsList, getRoomsAndEnclosures } from 'src/lib/api/hospital/roomsAndEnclosures'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import DoctorsDrawer from '../PatientAdmissionForm/DoctorsDrawer'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import AnimalCard from 'src/views/utility/AnimalCard'
import dayjs from 'dayjs'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import { MedicalIdChip } from 'src/views/pages/hospital/utility/hospitalSnippets'
import moment from 'moment'
import Toaster from 'src/components/Toaster'
import { useRouter } from 'next/router'
import Utility from 'src/utility'
import { editAnimalAdmissionDetails } from 'src/lib/api/hospital/inpatient'
import AddRoomDrawer from '../PatientAdmissionForm/AddRoomDrawer'
import AddBedsDrawer from '../PatientAdmissionForm/AddBedsDrawer'
import { AuthContext } from 'src/context/AuthContext'
import ControlledSwitch from 'src/views/forms/form-fields/ControlledSwitch'

const defaultValues = {
  holdingEnclosure: null,
  selectedDoctor: null,
  admission_date: dayjs(),
  admission_time: dayjs(),
  room: null,
  reason: '',
  patient_status: false
}

const schema = yup.object().shape({
  room: yup.object().required('Room is required'),
  holdingEnclosure: yup.object().required('Holding Enclosure is required'),
  selectedDoctor: yup.mixed().nullable().required('Doctor is required'),
  admission_date: yup.date().required('Admission date is required'),
  admission_time: yup.string().required('Admission time is required'),
  reason: yup.string().required('Reason for admission is required'),
  patient_status: yup.boolean().required('Patient status is required')
})

const AddPatientDrawer = ({ open, onClose, patientData, animalData, refetch }) => {
  const theme = useTheme()
  const authData = useContext(AuthContext)
  const havePermissionToAddHospital = authData?.userData?.permission?.user_settings?.add_hospital_permission
  const { selectedHospital, updateHospitalStats, hospitalStats, isHospitalStatsLoading } = useHospital()
  const router = useRouter()

  const [doctorDrawerOpen, setDoctorDrawerOpen] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [holdingEnclosures, setHoldingEnclosures] = useState([])
  const [enclosureLoading, setEnclosureLoading] = useState(false)
  const [roomLoading, setRoomLoading] = useState(false)
  const [rooms, setRooms] = useState([])
  const [searchRoom, setSearchRoom] = useState('')
  const [searchEnclosure, setSearchEnclosure] = useState('')
  const [openAddRoomDrawer, setOpenAddRoomDrawer] = useState(false)
  const [openAddBedsDrawer, setOpenAddBedsDrawer] = useState(false)

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    clearErrors,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  useEffect(() => {
    if (patientData) {
      const doctorData = {
        name: patientData?.attend_by_full_name,
        default_icon: patientData?.attend_by_profile_pic,
        id: patientData?.attend_by,
        role_name: patientData?.attend_by_role
      }
      reset({
        holdingEnclosure: {
          label: patientData?.bed_name,
          value: patientData?.bed_id
        },
        room: {
          label: patientData?.room_name,
          value: patientData?.room_id
        },
        selectedDoctor: doctorData,
        admission_date: dayjs(),
        admission_time: dayjs()
      })
      setSelectedDoctor(doctorData)
    }
  }, [patientData, reset])

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
        setRoomLoading(false)
      }
    }

    getHospitalRooms()
  }, [selectedHospital, searchRoom, hospitalStats?.available_rooms])

  const selectedRoom = watch('room')
  const watchPatientStatus = watch('patient_status')

  useEffect(() => {
    const getHospitalBeds = async () => {
      if (!selectedRoom?.value) return
      setEnclosureLoading(true)
      try {
        const res = await getRoomsAndEnclosures({
          hospital_id: selectedHospital?.id,
          room_id: selectedRoom.value,
          status: 'active',
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
          setEnclosureLoading(false)
        }
      } catch (error) {
        console.error('Cannot fetch hospital beds listing', error)
        setEnclosureLoading(false)
      }
    }

    getHospitalBeds()
  }, [selectedRoom, selectedHospital, searchEnclosure, hospitalStats?.available_rooms])

  const debouncedSearch = React.useMemo(() => debounce(val => setSearchRoom(val), 1000), [])

  const debouncedEnclosureSearch = React.useMemo(() => debounce(val => setSearchEnclosure(val), 1000), [])

  const handleDoctorSelection = doctor => {
    setSelectedDoctor(doctor)
    setValue('selectedDoctor', doctor)
    clearErrors('selectedDoctor')
  }

  const handleRemoveDoctor = () => {
    setSelectedDoctor(null)
    setValue('selectedDoctor', null)
  }

  const onSubmit = async data => {
    setSubmitLoader(true)
    try {
      const payload = {
        action: 'status_change',
        hospital_case_id: patientData?.hospital_case_id,
        treatment_type: 'inpatient',
        attend_by: data?.selectedDoctor?.id,
        holding_enclosure: data?.holdingEnclosure?.value,
        room_id: data?.room?.value,
        admit_date: moment(data?.admission_date).format('YYYY-MM-DD'),
        admit_time: moment(data?.admission_time).format('HH:mm'),
        reason_for_admission: data?.reason
      }

      await editAnimalAdmissionDetails(payload).then(res => {
        if (res?.success === true) {
          setSubmitLoader(false)
          Toaster({ type: 'success', message: res?.message })
          onClose()

          router.push({
            pathname: `/hospital/inpatient`
          })

          // refetch()
        } else {
          Toaster({ type: 'error', message: res?.message })
          setSubmitLoader(false)
        }
      })
    } catch (error) {
      console.error('Error admitting patient:', error)
      setSubmitLoader(false)
    }
  }

  const selectedDate = watch('admission_date')

  const createdAtLocal = dayjs(Utility.convertUTCToLocal(patientData?.admitted_at))

  const minDate = createdAtLocal.startOf('day')

  let minTime = null

  if (selectedDate) {
    const isCreatedDate = dayjs(selectedDate).isSame(createdAtLocal, 'day')

    if (isCreatedDate) {
      minTime = createdAtLocal
    }
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: '80%', md: 560 },

              // height: '100vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: theme.palette.customColors.OnPrimary,
              p: 0
            }
          }
        }}
      >
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            pb: 0,
            p: 6,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography sx={{ fontWeight: 500, fontSize: '24px', color: theme.palette.customColors.OnSurfaceVariant }}>
              Admit Patient
            </Typography>
            <Typography sx={{ fontWeight: 400, fontSize: '16px', color: theme.palette.customColors.neutralSecondary }}>
              Admitting animal to the hospital
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            background: theme.palette.customColors.OnPrimary,
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            minHeight: 0,
            p: 6
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography
                sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}
              >
                Admitting Animal
              </Typography>
              <MedicalIdChip leftImage={true} medId={patientData?.medical_record_code} />
            </Box>
            <Box sx={{ background: theme.palette.customColors.displaybgPrimary, borderRadius: 1, p: 3 }}>
              <AnimalCard data={animalData} />
            </Box>
          </Box>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography
                    sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}
                  >
                    Attending Chief Doctor
                  </Typography>
                  {selectedDoctor === null ? (
                    <Box
                      sx={{
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
                          color: errors?.selectedDoctor
                            ? theme.palette.error.main
                            : theme.palette.customColors.OnSurfaceVariant
                        }}
                      >
                        Select doctor
                      </Typography>
                      <Icon icon='mdi:chevron-down' fontSize={24} color={theme.palette.customColors.OnSurfaceVariant} />
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
                        <IconButton onClick={handleRemoveDoctor}>
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
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography
                  sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  Admitting Date & Time
                </Typography>
                <Grid container spacing={6}>
                  <Grid size={{ sm: 6, xs: 6 }}>
                    <ControlledDatePicker
                      control={control}
                      name={'admission_date'}
                      label='Date'
                      defaultValue={dayjs()}
                      minDate={minDate}
                    />
                  </Grid>
                  <Grid size={{ sm: 6, xs: 6 }}>
                    <ControlledTimePicker control={control} name={'admission_time'} label='Time' minTime={minTime} />
                  </Grid>
                </Grid>
              </Box>
              <Box
                sx={{
                  display: 'none',
                  justifyContent: 'space-between',
                  alignItem: 'center',
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                  borderRadius: 1,
                  p: 3
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
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography
                  sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}
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
                  sx={{ borderRadius: 1, background: theme.palette.customColors.Surface }}
                  fullWidth
                  loading={roomLoading}
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
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography
                  sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  Holding Enclosure
                </Typography>
                <ControlledAutocomplete
                  name='holdingEnclosure'
                  label='Select Holding Enclosure'
                  control={control}
                  errors={errors}
                  options={holdingEnclosures}
                  getOptionValue={option => option.value || ''}
                  getOptionLabel={option => option.label || ''}
                  isOptionEqualToValue={(option, value) => option.value === value?.value}
                  required
                  onInputChange={val => debouncedEnclosureSearch(val)}
                  sx={{ borderRadius: 1, background: theme.palette.customColors.Surface }}
                  fullWidth
                  loading={enclosureLoading}
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
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography
                  sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  Reason for Admission
                </Typography>
                <ControlledTextArea
                  control={control}
                  errors={errors}
                  placeholder={'Enter Reason for Admission'}
                  name={'reason'}
                  rows={4}
                  sx={{ borderRadius: 1, background: theme.palette.customColors.Surface }}
                />
              </Box>
            </Box>
          </form>
        </Box>
        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            left: 0,
            width: '100%',
            p: 5,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            zIndex: 1,
            boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.06)',
            flexShrink: 0,
            display: 'flex',
            gap: 4
          }}
        >
          <Button
            variant='outlined'
            fullWidth
            color='primary'
            sx={{
              p: 3,
              fontWeight: 600,
              color: theme.palette.customColors.OnPrimaryContainer,
              borderColor: theme.palette.customColors.OnPrimaryContainer
            }}
            onClick={() => {
              reset()
              onClose()
            }}
          >
            CANCEL
          </Button>
          <Button
            variant='contained'
            fullWidth
            color='primary'
            sx={{ p: 3, fontWeight: 600, backgroundColor: theme.palette.customColors.OnPrimaryContainer }}
            onClick={handleSubmit(onSubmit)}
          >
            {submitLoader ? <CircularProgress size={24} /> : 'ADMIT TO HOSPITAL'}
          </Button>
        </Box>
      </Drawer>
      {doctorDrawerOpen && (
        <DoctorsDrawer
          open={doctorDrawerOpen}
          setOpen={setDoctorDrawerOpen}
          onSelectDoctor={handleDoctorSelection}
          hospitalId={selectedHospital?.id}
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

export default AddPatientDrawer
