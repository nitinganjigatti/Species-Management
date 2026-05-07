'use client'

import { Box, Button, CircularProgress, Drawer, Grid, IconButton, Tooltip, Typography, useTheme } from '@mui/material'
import { debounce } from 'lodash'
import React, { useContext, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
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
import useSafeRouter from 'src/hooks/useSafeRouter'
import Utility from 'src/utility'
import { editAnimalAdmissionDetails } from 'src/lib/api/hospital/inpatient'
import AddRoomDrawer from '../PatientAdmissionForm/AddRoomDrawer'
import AddBedsDrawer from '../PatientAdmissionForm/AddBedsDrawer'
import { AuthContext } from 'src/context/AuthContext'
import type { BaseDrawerProps } from 'src/types/hospital'

interface AddPatientDrawerProps extends BaseDrawerProps {
  patientData?: any
  animalData?: any
  refetch?: () => void
}

interface FormValues {
  holdingEnclosure: any
  selectedDoctor: any
  admission_date: any
  admission_time: any
  room: any
  reason: string
}

const defaultValues: FormValues = {
  holdingEnclosure: null,
  selectedDoctor: null,
  admission_date: dayjs(),
  admission_time: dayjs(),
  room: null,
  reason: ''

  // patient_status: false
}

const createSchema = (t: any, patientData?: any) => yup.object().shape({
  room: yup.object().required(t('hospital_module.room_is_required') || 'Room is required'),
  holdingEnclosure: yup.object().required(t('hospital_module.holding_enclosure_is_required') || 'Holding Enclosure is required'),
  selectedDoctor: yup.mixed().nullable().required(t('hospital_module.doctor_is_required') || 'Doctor is required'),

  // Must not be in the future and must not be before the admitted date
  admission_date: yup
    .date()
    .typeError(t('hospital_module.invalid_date') || 'Invalid date')
    .nullable()
    .required(t('hospital_module.date_is_required') || 'Date is required')

    // Must not be a future date (after today)
    .test('not-future-date', t('hospital_module.date_cannot_be_in_future') || 'Date cannot be in the future', function (value) {
      if (!value) return true
      const now = dayjs()
      if (dayjs(value).isAfter(now, 'day')) {
        return this.createError({ message: t('hospital_module.date_cannot_be_in_future') || 'Date cannot be in the future' })
      }

      return true
    })

    // Must not be before the admitted date
    .test('not-before-admitted', t('hospital_module.date_cannot_be_before_admitted') || 'Date cannot be before the admitted date', function (value) {
      const admittedAt = patientData?.admitted_at ? dayjs(Utility.convertUTCToLocal(patientData?.admitted_at)) : null
      if (!value || !admittedAt) return true
      if (dayjs(value).isBefore(admittedAt, 'day')) {
        return this.createError({
          message: `${t('hospital_module.date_cannot_be_before_admitted')} (${admittedAt.format('DD MMM YYYY')})`
        })
      }

      return true
    }),

  // Must not be in the future and must not be before the admitted time
  admission_time: yup
    .date()
    .typeError(t('hospital_module.invalid_time') || 'Invalid time')
    .nullable()
    .required(t('hospital_module.time_is_required') || 'Time is required')
    .test('is-valid-time', t('hospital_module.time_is_invalid') || 'Time is invalid', function (value) {
      const { admission_date } = this.parent
      const admittedAt = patientData?.admitted_at ? dayjs(Utility.convertUTCToLocal(patientData?.admitted_at)) : null
      if (!value || !admission_date) return true

      const now = dayjs()

      const selectedTime = dayjs(admission_date)
        .startOf('day')
        .set('hour', dayjs(value).hour())
        .set('minute', dayjs(value).minute())
        .set('second', 0)

      // Must not be before the admitted time (on the same day)
      if (admittedAt && dayjs(admission_date).isSame(admittedAt, 'day')) {
        if (selectedTime.isBefore(admittedAt)) {
          return this.createError({
            message: `${t('hospital_module.time_cannot_be_before_admitted')} (${admittedAt.format('hh:mm A')})`
          })
        }
      }

      // Must not be in the future (on today)
      if (dayjs(admission_date).isSame(now, 'day')) {
        if (selectedTime.isAfter(now)) {
          return this.createError({ message: t('hospital_module.time_cannot_be_in_future') || 'Time cannot be in the future' })
        }
      }

      return true
    }),
  reason: yup.string().required(t('hospital_module.reason_for_admission_is_required') || 'Reason for admission is required')

    // patient_status: yup.boolean().required('Patient status is required')
})

const AddPatientDrawer = ({ open, onClose, patientData, animalData, refetch }: AddPatientDrawerProps) => {
  const { t } = useTranslation()
  const theme: any = useTheme()
  const authData: any = useContext(AuthContext)
  const havePermissionToAddHospital = authData?.userData?.permission?.user_settings?.add_hospital_permission
  const { selectedHospital, updateHospitalStats, hospitalStats, isHospitalStatsLoading } = useHospital() as any
  const router: any = useSafeRouter()

  const [doctorDrawerOpen, setDoctorDrawerOpen] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null)
  const [holdingEnclosures, setHoldingEnclosures] = useState<any[]>([])
  const [enclosureLoading, setEnclosureLoading] = useState(false)
  const [roomLoading, setRoomLoading] = useState(false)
  const [rooms, setRooms] = useState<any[]>([])
  const [searchRoom, setSearchRoom] = useState('')
  const [searchEnclosure, setSearchEnclosure] = useState('')
  const [openAddRoomDrawer, setOpenAddRoomDrawer] = useState(false)
  const [openAddBedsDrawer, setOpenAddBedsDrawer] = useState(false)

  const validationSchema = createSchema(t, patientData)

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    clearErrors,
    watch,
    trigger,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(validationSchema) as any,
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
      } as any)
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
          q: searchRoom

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
  }, [selectedHospital, searchRoom, hospitalStats?.available_rooms])

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
          room_id: selectedRoom.value,
          status: 'active',
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

  const debouncedSearch = React.useMemo(() => debounce((val: string) => setSearchRoom(val), 1000), [])

  const debouncedEnclosureSearch = React.useMemo(() => debounce((val: string) => setSearchEnclosure(val), 1000), [])

  const handleDoctorSelection = (doctor: any) => {
    setSelectedDoctor(doctor)
    setValue('selectedDoctor', doctor)
    clearErrors('selectedDoctor')
  }

  const handleRemoveDoctor = () => {
    setSelectedDoctor(null)
    setValue('selectedDoctor', null)
  }

  const onSubmit = async (data: FormValues) => {
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

      await editAnimalAdmissionDetails(payload).then((res: any) => {
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

  const createdAtLocal: any = patientData?.admitted_at ? dayjs(Utility.convertUTCToLocal(patientData?.admitted_at)) : null
  const now = dayjs()

  const minDate = createdAtLocal?.startOf('day')
  const maxDate = now.endOf('day')

  let minTime: any = null
  let maxTime: any = null

  if (selectedDate) {
    const isCreatedDate = createdAtLocal && dayjs(selectedDate).isSame(createdAtLocal, 'day')
    const isToday = dayjs(selectedDate).isSame(now, 'day')

    if (isCreatedDate) {
      minTime = createdAtLocal
    }
    if (isToday) {
      maxTime = now
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
              {t('hospital_module.admit_patient')}
            </Typography>
            <Typography sx={{ fontWeight: 400, fontSize: '16px', color: theme.palette.customColors.neutralSecondary }}>
              {t('hospital_module.admitting_animal_to_hospital')}
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
                {t('hospital_module.admitting_animal')}
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
                    {t('hospital_module.attending_chief_doctor')}
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
                        {t('hospital_module.select_doctor')}
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
                    {errors.selectedDoctor.message as any}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography
                  sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  {t('hospital_module.admitting_date_time')}
                </Typography>
                <Grid container spacing={6}>
                  <Grid size={{ sm: 6, xs: 6 }}>
                    <ControlledDatePicker
                      control={control}
                      name={'admission_date'}
                      label={(t('date') as string)}
                      defaultValue={dayjs()}
                      minDate={minDate}
                      maxDate={maxDate}
                      onChangeOverride={() => {
                        trigger('admission_time')
                      }}
                    />
                  </Grid>
                  <Grid size={{ sm: 6, xs: 6 }}>
                    <ControlledTimePicker
                      control={control}
                      name={'admission_time'}
                      label={(t('time') as string)}
                      minTime={minTime}
                      maxTime={maxTime}
                    />
                  </Grid>
                </Grid>
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
              </Box> */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography
                  sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  {t('hospital_module.room')}
                </Typography>
                <ControlledAutocomplete
                  name='room'
                  label={(t('hospital_module.select_room') as string)}
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
                      <Tooltip title={(t('hospital_module.add_room') as string)}>
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
                  {t('hospital_module.holding_enclosure')}
                </Typography>
                <ControlledAutocomplete
                  name='holdingEnclosure'
                  label={(t('hospital_module.select_holding_enclosure_required') as string)}
                  control={control}
                  errors={errors}
                  options={holdingEnclosures}
                  getOptionValue={(option: any) => option.value || ''}
                  getOptionLabel={(option: any) => option.label || ''}
                  isOptionEqualToValue={(option: any, value: any) => option.value === value?.value}
                  required
                  onInputChange={(val: string) => debouncedEnclosureSearch(val)}
                  sx={{ borderRadius: 1, background: theme.palette.customColors.Surface }}
                  fullWidth
                  loading={enclosureLoading}
                  endAdornment={() =>
                    havePermissionToAddHospital && (
                      <Tooltip title={(t('hospital_module.add_enclosure') as string)}>
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
                    {t('hospital_module.no_available_enclosures')}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography
                  sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  {t('hospital_module.reason_for_admission')}
                </Typography>
                <ControlledTextArea
                  control={control}
                  errors={errors}
                  placeholder={(t('hospital_module.enter_reason_for_admission') as string)}
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
            {t('cancel')}
          </Button>
          <Button
            variant='contained'
            fullWidth
            color='primary'
            sx={{ p: 3, fontWeight: 600, backgroundColor: theme.palette.customColors.OnPrimaryContainer }}
            onClick={handleSubmit(onSubmit)}
          >
            {submitLoader ? <CircularProgress size={24} /> : t('hospital_module.admit_to_hospital')}
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
