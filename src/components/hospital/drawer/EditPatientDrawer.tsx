'use client'

import { Box, Button, CircularProgress, Drawer, IconButton, Tooltip, Typography, useTheme } from '@mui/material'
import React, { useContext, useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'
import DoctorsDrawer from '../PatientAdmissionForm/DoctorsDrawer'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import { useForm } from 'react-hook-form'
import { getHospitalRoomsList, getRoomsAndEnclosures } from 'src/lib/api/hospital/roomsAndEnclosures'
import { debounce } from 'lodash'
import { useHospital } from 'src/context/HospitalContext'
import { editAnimalAdmissionDetails } from 'src/lib/api/hospital/inpatient'
import Toaster from 'src/components/Toaster'
import AddRoomDrawer from '../PatientAdmissionForm/AddRoomDrawer'
import AddBedsDrawer from '../PatientAdmissionForm/AddBedsDrawer'
import { AuthContext } from 'src/context/AuthContext'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import Utility from 'src/utility'
import dayjs from 'dayjs'
import type { BaseDrawerProps } from 'src/types/hospital'

interface EditPatientDrawerProps extends BaseDrawerProps {
  patientData?: any
  refetch?: () => void
}

interface FormValues {
  holdingEnclosure: any
  selectedDoctor: any
  admissionDate: any
  admissionTime: any
  room?: any
}

const defaultValues: FormValues = {
  holdingEnclosure: null,
  selectedDoctor: null,
  admissionDate: null,
  admissionTime: null

  // patient_status: false
}

const EditPatientDrawer = ({ open, onClose, patientData, refetch }: EditPatientDrawerProps) => {
  const theme: any = useTheme()
  const authData: any = useContext(AuthContext)
  const havePermissionToAddHospital = authData?.userData?.permission?.user_settings?.add_hospital_permission
  const { selectedHospital, updateHospitalStats, hospitalStats, isHospitalStatsLoading } = useHospital() as any

  const [doctorDrawerOpen, setDoctorDrawerOpen] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null)
  const [holdingEnclosures, setHoldingEnclosures] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [roomLoading, setRoomLoading] = useState(false)
  const [rooms, setRooms] = useState<any[]>([])
  const [searchEnclosure, setSearchEnclosure] = useState('')
  const [enclosureLoading, setEnclosureLoading] = useState(false)
  const [openAddRoomDrawer, setOpenAddRoomDrawer] = useState(false)
  const [openAddBedsDrawer, setOpenAddBedsDrawer] = useState(false)
  const [previousRoomId, setPreviousRoomId] = useState<any>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues,
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })


  // Calculate min and max date for validation
  const getMinMaxDate = () => {
    let minDate: any = null
    const maxDate = dayjs() // Current date/time

    if (patientData?.transfer_created_at) {
      const localMinDateTime = Utility.convertUTCToLocal(patientData.transfer_created_at)
      minDate = dayjs(localMinDateTime, 'YYYY-MM-DD HH:mm:ss')
    }

    return { minDate, maxDate }
  }

  const { minDate: minDateTime, maxDate: maxDateTime } = getMinMaxDate()

  useEffect(() => {
    if (patientData) {
      const doctorData = {
        name: patientData?.attend_by_full_name,
        default_icon: patientData?.attend_by_profile_pic,
        id: patientData?.attend_by,
        role_name: patientData?.attend_by_role
      }

      // Convert UTC admission date to local and split into date and time
      let admissionDateValue: any = null
      let admissionTimeValue: any = null

      if (patientData?.admitted_at) {
        const localDateTime = Utility.convertUTCToLocal(patientData.admitted_at)
        const dayjsObj = dayjs(localDateTime, 'YYYY-MM-DD HH:mm:ss')
        admissionDateValue = dayjsObj
        admissionTimeValue = dayjsObj
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
        admissionDate: admissionDateValue,
        admissionTime: admissionTimeValue
      } as any)
      setSelectedDoctor(doctorData)
      setPreviousRoomId(patientData?.room_id)
      setIsInitialLoad(true)
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
          q: search

          // availability: 'available'
        }).then((res: any) => {
          if (res?.success === true) {
            const filteredRooms = res?.data?.records
              ?.filter((item: any) => item?.status !== '0')
              ?.map((item: any) => ({
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
  }, [selectedHospital, search, hospitalStats?.available_rooms])

  const selectedRoom = watch('room')

  // const watchPatientStatus = watch('patient_status')

  useEffect(() => {
    // Reset holding enclosure when room changes
    // setValue('holdingEnclosure', null)
    // setHoldingEnclosures([])

    const getHospitalBeds = async () => {
      if (!selectedRoom?.value) return
      setEnclosureLoading(true)
      try {
        const res: any = await getRoomsAndEnclosures({
          hospital_id: selectedHospital?.id,
          status: 'active',
          room_id: selectedRoom.value,
          page: 1,

          // is_occupied: 'available',
          q: searchEnclosure
        })
        if (res?.success === true) {
          setHoldingEnclosures(
            res?.data?.records?.map((item: any) => ({
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

  const debouncedSearch = React.useMemo(() => debounce((val: string) => setSearch(val), 1000), [])

  const debouncedEnclosureSearch = React.useMemo(() => debounce((val: string) => setSearchEnclosure(val), 1000), [])

  const handleDoctorSelection = (doctor: any) => {
    setSelectedDoctor(doctor)
    setValue('selectedDoctor', doctor)
  }

  const handleRemoveDoctor = () => {
    setSelectedDoctor(null)
    setValue('selectedDoctor', null)
  }

  const onSubmit = async (data: FormValues) => {
    setSubmitLoader(true)
    try {
      // Validate date/time if both are provided
      if (data?.admissionDate && data?.admissionTime) {
        const selectedDate = dayjs(data.admissionDate)
        const selectedTime = dayjs(data.admissionTime)
        const selectedDateTime = selectedDate.hour(selectedTime.hour()).minute(selectedTime.minute())

        // Check if selected datetime is before transfer_created_at
        if (minDateTime && selectedDateTime.isBefore(minDateTime)) {
          setSubmitLoader(false)
          Toaster({
            type: 'error',
            message: `Admission date and time cannot be before ${minDateTime.format('YYYY-MM-DD HH:mm')}`
          })
          return
        }

        // Check if selected datetime is after current time
        if (selectedDateTime.isAfter(maxDateTime)) {
          setSubmitLoader(false)
          Toaster({
            type: 'error',
            message: 'Admission date and time cannot be in the future'
          })
          return
        }
      }

      const payload: any = {
        action: 'edit',
        hospital_case_id: patientData?.hospital_case_id,
        room_id: data?.room?.value || '',
        holding_enclosure: data?.holdingEnclosure?.value || '',
        attend_by: data?.selectedDoctor?.id || ''
      }

      // Format and add date and time if provided
      if (data?.admissionDate) {
        payload.admit_date = dayjs(data.admissionDate).format('YYYY-MM-DD')
      }

      if (data?.admissionTime) {
        payload.admit_time = dayjs(data.admissionTime).format('HH:mm')
      }

      await editAnimalAdmissionDetails(payload).then((res: any) => {
        if (res?.success === true) {
          setSubmitLoader(false)
          Toaster({ type: 'success', message: res?.message })
          onClose()
          refetch?.()
        } else {
          Toaster({ type: 'error', message: res?.message })
          setSubmitLoader(false)
        }
      })
    } catch (error) {
      console.error('Error updating patient details:', error)
      setSubmitLoader(false)
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
          <Typography
            variant='h6'
            sx={{ fontWeight: 500, fontSize: '24px', color: theme.palette.customColors.OnSurfaceVariant }}
          >
            Edit Patient Details
          </Typography>
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Typography sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>
              Attending Chief Doctor
            </Typography>
            {selectedDoctor === null ? (
              <Box
                sx={{
                  // background: theme.palette.customColors.Surface,
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>
              Room
            </Typography>
            <ControlledAutocomplete
              name='room'
              label='Select Room'
              control={control}
              errors={errors}
              options={rooms}
              getOptionValue={(option: any) => option.value || ''}
              getOptionLabel={(option: any) => option.label || ''}
              isOptionEqualToValue={(option: any, value: any) => option.value === value?.value}
              required
              onInputChange={(val: string) => debouncedSearch(val)}
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Typography sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>
              Holding Enclosure
            </Typography>
            <ControlledAutocomplete
              name='holdingEnclosure'
              label='Select area/cell/enclosure'
              control={control}
              errors={errors}
              options={holdingEnclosures}
              getOptionValue={(option: any) => option.value || ''}
              getOptionLabel={(option: any) => option.label || ''}
              isOptionEqualToValue={(option: any, value: any) => option.value === value?.value}
              required
              onInputChange={(val: string) => debouncedEnclosureSearch(val)}
              sx={{ borderRadius: 1 }}
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
            {selectedRoom?.value && !enclosureLoading && holdingEnclosures.length === 0 && (
              <Typography
                sx={{
                  color: theme.palette.error.main,
                  mt: '0px',
                  mx: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 400
                }}
              >
                No active/available enclosures available for this Room
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>
              Admission Date
            </Typography>
            <ControlledDatePicker
              name='admissionDate'
              label='Select Admission Date'
              control={control}
              errors={errors}
              sx={{ borderRadius: 1, background: theme.palette.customColors.Surface }}
              fullWidth
              minDate={minDateTime}
              maxDate={maxDateTime}
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>
              Admission Time
            </Typography>
            <ControlledTimePicker
              name='admissionTime'
              label='Select Admission Time'
              control={control}
              errors={errors}
              sx={{ borderRadius: 1, background: theme.palette.customColors.Surface }}
              fullWidth
            />
          </Box>
          {/* <Box
            sx={{
              display: 'none',
              justifyContent: 'space-between',
              alignItem: 'center',
              border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
              borderRadius: 1,
              p: 3
            }}
          >
            <Typography sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
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
          </Box> */}
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
            onClick={onClose}
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
            {submitLoader ? <CircularProgress size={24} /> : 'SAVE'}
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

export default EditPatientDrawer
