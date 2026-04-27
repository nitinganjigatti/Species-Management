'use client'

import { yupResolver } from '@hookform/resolvers/yup'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Grid as MuiGrid,
  IconButton,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
  Autocomplete
} from '@mui/material'
const Grid: any = MuiGrid
import { alpha, useTheme } from '@mui/system'
import useSafeRouter from 'src/hooks/useSafeRouter'
import { useParams } from 'next/navigation'
import React, { useContext, useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

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
import HospitalAnalyticsRaw from 'src/views/pages/hospital/inpatient/HospitalAnalytics'
const HospitalAnalytics: any = HospitalAnalyticsRaw
import ConfirmationDialog from 'src/components/confirmation-dialog'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import dayjs from 'dayjs'
import moment from 'moment'
import { useHospital } from 'src/context/HospitalContext'
import { debounce } from 'lodash'
import Utility from 'src/utility'
import { getHospitalBedStats, getHospitalDetail } from 'src/lib/api/hospital/hospitalAnalytics'
import { getHospitalStaff } from 'src/lib/api/hospital/staff'
import { write } from 'src/lib/windows/utils'
import { useQueryClient } from '@tanstack/react-query'
import AddRoomDrawer from './AddRoomDrawer'
import AddBedsDrawer from './AddBedsDrawer'
import { AuthContext } from 'src/context/AuthContext'
import BottomActionBarRaw from 'src/views/utility/BottomActionBar'
const BottomActionBar: any = BottomActionBarRaw
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'

const PatientAdmitForm = () => {
  const { t } = useTranslation()
  const theme: any = useTheme()
  const router: any = useSafeRouter()
  const routerParams: any = useParams()
  const authData: any = useContext(AuthContext)
  const havePermissionToAddHospital = authData?.userData?.permission?.user_settings?.add_hospital_permission

  const { selectedHospital, updateSelectedHospital, updateHospitalStats, hospitalStats, isHospitalStatsLoading }: any =
    useHospital()

  const id = routerParams?.id || router.query?.id

  const [patientData, setPatientData] = useState<any>(null)
  const [patientLoading, setPatientLoading] = useState<boolean>(false)
  const [holdingEnclosures, setHoldingEnclosures] = useState<any[]>([])
  const [staffLoading, setStaffLoading] = useState<boolean>(false)
  const [attendingSelectedDoctors, setAttendingSelectedDoctors] = useState<any[]>([])

  const treatmentType = [
    { label: t('hospital_module.opd_outpatient'), value: 'opd' },
    { label: t('hospital_module.hospital_admission_inpatient'), value: 'inpatient' }
  ]

  const healthStatusOptions = [
    { label: t('hospital_module.stable'), value: 'stable' },
    { label: t('hospital_module.critical'), value: 'critical' }
  ]

  const defaultValues: any = {
    treatmentType: 'inpatient',
    healthStatus: 'stable',
    holdingEnclosure: null,
    room: null,
    admission_date: dayjs(),
    admission_time: dayjs()
  }

  const createdAt = patientData?.transfer_details?.created_at
    ? dayjs(Utility.convertUTCToLocal(patientData?.transfer_details?.created_at))
    : null

  const createSchema = (t: any, createdAt: any) => yup.object().shape({
    treatmentType: yup.string().required(t('hospital_module.treatment_type_required') || 'Treatment Type is Required'),
    healthStatus: yup.string().notRequired(),
    selectedDoctor: yup.mixed().nullable().required(t('hospital_module.doctor_is_required') || 'Doctor is required'),
    room: yup.object().required(t('hospital_module.room_is_required') || 'Room is required'),
    holdingEnclosure: yup.object().required(t('hospital_module.holding_enclosure_is_required') || 'Holding Enclosure is required'),

    admission_date: yup
      .date()
      .typeError(t('hospital_module.invalid_date') || 'Invalid date')
      .nullable()
      .required(t('hospital_module.date_is_required') || 'Date is required')

      .test('not-future-date', t('hospital_module.date_cannot_be_in_future') || 'Date cannot be in the future', function (value: any) {
        if (!value) return true
        const now = dayjs()
        if (dayjs(value).isAfter(now, 'day')) {
          return this.createError({ message: t('hospital_module.date_cannot_be_in_future') || 'Date cannot be in the future' })
        }

        return true
      })

      .test('not-before-transfer', t('hospital_module.date_cannot_be_before_transfer') || 'Date cannot be before the transfer request date', function (value: any) {
        if (!value || !createdAt) return true
        if (dayjs(value).isBefore(createdAt, 'day')) {
          return this.createError({
            message: `${t('hospital_module.date_cannot_be_before_transfer') || 'Date cannot be before the transfer request date'} (${createdAt.format('DD MMM YYYY')})`
          })
        }

        return true
      }),

    admission_time: yup
      .date()
      .typeError(t('hospital_module.invalid_time') || 'Invalid time')
      .nullable()
      .required(t('hospital_module.time_is_required') || 'Time is required')
      .test('is-valid-time', t('hospital_module.time_is_invalid') || 'Time is invalid', function (value: any) {
        const { admission_date } = (this as any).parent
        if (!value || !admission_date) return true

        const now = dayjs()

        const selectedTime = dayjs(admission_date)
          .startOf('day')
          .set('hour', dayjs(value).hour())
          .set('minute', dayjs(value).minute())
          .set('second', 0)

        if (createdAt && dayjs(admission_date).isSame(createdAt, 'day')) {
          const minAllowedTime = createdAt.subtract(1, 'minute')
          if (selectedTime.isBefore(minAllowedTime)) {
            return this.createError({
              message: `${t('hospital_module.time_cannot_be_before_transfer_time') || 'Time cannot be before the transfer request time'} (${minAllowedTime.format('hh:mm A')})`
            })
          }
        }

        if (dayjs(admission_date).isSame(now, 'day')) {
          if (selectedTime.isAfter(now)) {
            return this.createError({ message: t('hospital_module.time_cannot_be_in_future') || 'Time cannot be in the future' })
          }
        }

        return true
      })
  })

  const {
    control,
    handleSubmit,
    trigger,
    formState: { errors },
    setValue,
    clearErrors,
    watch
  } = useForm<any>({
    resolver: yupResolver(createSchema(t, createdAt)) as any,
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues
  })

  const [selectedDoctor, setSelectedDoctor] = useState<any>(null)
  const [doctorDrawerOpen, setDoctorDrawerOpen] = useState<boolean>(false)
  const [doctors, setDoctors] = useState<any[]>([])
  const [submitLoader, setSubmitLoader] = useState<boolean>(false)
  const [isRejecting, setIsRejecting] = useState<boolean>(false)
  const [isRejectLoading, setIsSubmitLoading] = useState<boolean>(false)
  const [rejectionReason, setRejectionReason] = useState<string>('')
  const [rooms, setRooms] = useState<any[]>([])
  const [roomLoading, setRoomLoading] = useState<boolean>(false)
  const [searchRoom, setSearchRoom] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [bedsLoading, setBedsLoading] = useState<boolean>(false)
  const [searchEnclosure, setSearchEnclosure] = useState<string>('')
  const [searchAttendDoctor, setSearchAttendDoctor] = useState<string>('')
  const [hasPermission, setHasPermission] = useState<any>(false)
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false)
  const [openAddRoomDrawer, setOpenAddRoomDrawer] = useState<boolean>(false)
  const [openAddBedsDrawer, setOpenAddBedsDrawer] = useState<boolean>(false)
  const [attendingDoctors, setAttendingDoctors] = useState<any[]>([])

  const [paginationModel, setPaginationModel] = useState<any>({
    page: 0,
    pageSize: 10
  })

  const queryClient = useQueryClient()

  useEffect(() => {
    const getPatientInfo = async () => {
      setPatientLoading(true)
      try {
        await getPatientDetailsByTransferId({
          transfer_id: id
        }).then((res: any) => {
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
          q: searchRoom
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
      }
    }

    getHospitalRooms()
  }, [selectedHospital, searchRoom, hospitalStats?.available_rooms])

  const selectedRoom = watch('room')
  const watchTreatmentType = watch('treatmentType')

  useEffect(() => {
    setValue('holdingEnclosure', {
      label: '',
      value: ''
    })
    setHoldingEnclosures([])

    const getHospitalBeds = async () => {
      if (!selectedRoom?.value) return
      setBedsLoading(true)
      try {
        const res: any = await getRoomsAndEnclosures({
          hospital_id: selectedHospital?.id,
          status: 'active',
          room_id: selectedRoom.value,
          page: 1,
          q: searchEnclosure
        })
        if (res?.success === true) {
          setHoldingEnclosures(
            res?.data?.records?.map((item: any) => ({
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

  const fetchAndUpdateHospitalStats = async (hospitalId: any) => {
    if (!hospitalId) return

    try {
      const statsResponse: any = await (getHospitalBedStats as any)(hospitalId)
      if (statsResponse?.success) {
        updateHospitalStats(statsResponse.data)
      }
    } catch (error) {
      console.error('Error fetching hospital stats:', error)
    }
  }

  const onSubmit = async (data: any) => {
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
        room_id: data?.room?.value,
        health_status: data?.healthStatus,
        co_attend_doctor: data?.coAttendDoctor?.length
          ? JSON.stringify(data.coAttendDoctor.map((doc: any) => String(doc.value)))
          : '[]'
      }

      const res: any = await admitHospitalPatient(params)
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
    } catch (error: any) {
      Toaster({ type: 'error', message: error?.message })
      console.error(error, 'Cannot Admit Patient')
      setSubmitLoader(false)
    }
  }

  const filteredAttendingDoctors = attendingDoctors.filter((item: any) => item.value !== selectedDoctor?.id)

  const getUserLists = async () => {
    setLoading(true)
    try {
      const res: any = await getHospitalStaff({
        params: {
          q: searchAttendDoctor,
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          hospital_id: selectedHospital?.id
        }
      })
      if (res?.success === true) {
        const chiefs = res?.data?.records
          .filter((item: any) => item?.is_hospital_chief_doctor === '1')
          .map((item: any) => ({
            name: item?.user_full_name,
            id: item?.user_id,
            default_icon: item?.user_profile_pic,
            role_name: item?.role_name
          }))

        if (chiefs.length === 1 && selectedHospital?.id) {
          const singleDoctor = chiefs[0]
          setSelectedDoctor(singleDoctor)
          setValue('selectedDoctor', singleDoctor)

          clearErrors('selectedDoctor')
        }
      } else {
        setDoctors([])
      }
    } catch (error) {
      console.log('user error', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    getUserLists()
  }, [])

  const getStaffList = async () => {
    try {
      const response: any = await getHospitalStaff({
        params: {
          q: searchAttendDoctor,
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          hospital_id: selectedHospital?.id
        }
      })

      if (response?.success && response?.data?.records) {
        const mappedData = response.data.records.map((item: any) => ({
          label: item.user_full_name,
          value: item.user_id
        }))

        setAttendingDoctors(mappedData)
      }
    } catch (error: any) {
      console.error('Error fetching hospital staff:', error?.message)
      setStaffLoading(false)
      Toaster({
        type: 'error',
        message: error?.response?.data?.message || error?.message || 'Failed to load hospital staff'
      })
    } finally {
      setStaffLoading(false)
    }
  }

  useEffect(() => {
    getStaffList()
  }, [searchAttendDoctor])

  const selectedDate = watch('admission_date')

  const createdAtLocal = dayjs(Utility.convertUTCToLocal(patientData?.transfer_details?.created_at))
  const now = dayjs()

  const minDate = createdAtLocal.startOf('day')
  const maxDate = now.endOf('day')

  let minTime: any = null
  let maxTime: any = null

  if (selectedDate) {
    const isCreatedDate = dayjs(selectedDate).isSame(createdAtLocal, 'day')
    const isToday = dayjs(selectedDate).isSame(now, 'day')

    if (isCreatedDate) {
      minTime = createdAtLocal.subtract(1, 'minute')
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

  const handleDoctorSelection = (doctor: any) => {
    setSelectedDoctor(doctor)
    setValue('selectedDoctor', doctor)
    clearErrors('selectedDoctor')

    setAttendingSelectedDoctors((prev: any[]) => {
      const filtered = prev.filter((item: any) => item.value !== doctor.id)
      setValue('coAttendDoctor', filtered)
      return filtered
    })
  }

  const handlePatientRejection = async () => {
    setIsSubmitLoading(true)
    try {
      const params = {
        action: 'reject',
        transfer_id: id,
        reject_reason: rejectionReason
      }
      await admitHospitalPatient(params).then((res: any) => {
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

  const fetchHospitalDetail = async (id: any) => {
    try {
      const response: any = await (getHospitalDetail as any)(id)

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

    queryClient.invalidateQueries(
      {
        queryKey: ['hospitals-listing-inpatient']
      } as any,
      {
        type: 'all'
      } as any
    )
    router.back()
  }

  useEffect(() => {
    if (selectedHospital?.id) {
      fetchHospitalDetail(selectedHospital?.id)
    }
  }, [selectedHospital?.id])

  const debouncedSearch = React.useMemo(() => debounce((val: string) => setSearchRoom(val), 1000), [])

  const debouncedEnclosureSearch = React.useMemo(() => debounce((val: string) => setSearchEnclosure(val), 1000), [])

  const debouncedAttendingVetSearch = React.useMemo(() => debounce((val: string) => setSearchAttendDoctor(val), 1000), [])

  useEffect(() => {
    if (selectedDoctor && doctors.length === 1) {
      handleDoctorSelection(doctors[0])
      setAttendingDoctors(doctors)
      setValue('doctors', doctors)
    }
  }, [doctors])

  return (
    <>
      <Box>
        <DynamicBreadcrumbs
          pageItems={[{ title: 'Hospital' }, { title: 'Patients' }, { title: 'Incoming', onClick: () => router.back() }, { title: 'Patient Admit Form' }]}
        />
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
                      render={({ field }: any) => (
                        <Box sx={{ display: 'flex', flexDirection: { sm: 'row', xs: 'column' }, gap: 6 }}>
                          {treatmentType?.map((item: any, index: number) => (
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
                      Health Status
                    </Typography>
                    <Controller
                      name='healthStatus'
                      control={control}
                      render={({ field }: any) => (
                        <Box sx={{ display: 'flex', flexDirection: { sm: 'row', xs: 'column' }, gap: 6 }}>
                          {healthStatusOptions?.map((item: any, index: number) => (
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
                            onChangeOverride={() => {
                              trigger('admission_time')
                            }}
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
                              border: (errors as any).selectedDoctor
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
                                color: (errors as any).selectedDoctor
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
                      {(errors as any).selectedDoctor && (
                        <Typography
                          sx={{
                            color: theme.palette.error.main,
                            mt: '3px',
                            mx: '14px',
                            fontSize: '0.75rem',
                            fontWeight: 400
                          }}
                        >
                          {(errors as any).selectedDoctor.message}
                        </Typography>
                      )}
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Typography
                          sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                        >
                          Attending Veterinarian
                        </Typography>
                        <Controller
                          name='coAttendDoctor'
                          control={control}
                          defaultValue={[]}
                          render={({ field }: any) => (
                            <Autocomplete
                              multiple
                              options={filteredAttendingDoctors}
                              value={attendingSelectedDoctors}
                              loading={staffLoading}
                              filterSelectedOptions
                              getOptionLabel={(option: any) => option?.label || ''}
                              isOptionEqualToValue={(option: any, value: any) => option.value === value?.value}
                              onChange={(event: any, newValue: any, reason: any) => {
                                setAttendingSelectedDoctors(newValue)
                                field.onChange(newValue)
                              }}
                              onInputChange={(event: any, value: any, reason: any) => {
                                if (reason === 'clear') {
                                  setAttendingSelectedDoctors([])
                                  field.onChange([])
                                  return
                                }
                                debouncedAttendingVetSearch(value)
                              }}
                              noOptionsText='No available attending vets...'
                              renderInput={(params: any) => (
                                <TextField {...params} label={t('hospital_module.select_attending_vet') as any} placeholder={t('hospital_module.search_and_select') as any} />
                              )}
                            />
                          )}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                  <Grid container spacing={6}>
                    <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Typography
                        sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                      >
                        {t('hospital_module.room')}
                      </Typography>
                      <ControlledAutocomplete
                        name='room'
                        label={t('hospital_module.select_room_required') as any}
                        control={control}
                        errors={errors}
                        options={rooms}
                        getOptionValue={(option: any) => option.value || ''}
                        getOptionLabel={(option: any) => option.label || ''}
                        isOptionEqualToValue={(option: any, value: any) => option.value === value?.value}
                        required
                        onInputChange={(val: string) => debouncedSearch(val)}
                        sx={{
                          background: theme.palette.customColors.Surface,
                          borderRadius: 1
                        }}
                        fullWidth
                        loading={roomLoading}
                        disabled={submitLoader}
                        endAdornment={() =>
                          havePermissionToAddHospital && (
                            <Tooltip title={t('hospital_module.add_room')}>
                              <IconButton
                                size='small'
                                onMouseDown={(e: any) => e.preventDefault()}
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
                          {t('hospital_module.no_available_enclosures')}
                        </Typography>
                      )}
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Typography
                        sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                      >
                        {t('hospital_module.holding_enclosure')}
                      </Typography>
                      <ControlledAutocomplete
                        name='holdingEnclosure'
                        label={t('hospital_module.select_holding_enclosure_required') as any}
                        control={control}
                        errors={errors}
                        options={holdingEnclosures}
                        getOptionValue={(option: any) => option.value || ''}
                        getOptionLabel={(option: any) => option.label || ''}
                        isOptionEqualToValue={(option: any, value: any) => option.value === value?.value}
                        required
                        onInputChange={(val: string) => debouncedEnclosureSearch(val)}
                        sx={{ background: theme.palette.customColors.Surface, borderRadius: 1 }}
                        fullWidth
                        loading={bedsLoading}
                        disabled={submitLoader}
                        endAdornment={() =>
                          havePermissionToAddHospital && (
                            <Tooltip title='Add Enclosures'>
                              <IconButton
                                size='small'
                                onMouseDown={(e: any) => e.preventDefault()}
                                onClick={() => setOpenAddBedsDrawer(true)}
                                sx={{ ml: 1, fontSize: 28 }}
                              >
                                <Icon icon='mdi:plus' color={theme.palette.primary.main} />
                              </IconButton>
                            </Tooltip>
                          )
                        }
                      />
                      {selectedRoom?.value && !bedsLoading && holdingEnclosures.length === 0 && (
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
          </Box>
        )}
      </Box>
      {hasPermission && (
        <BottomActionBar
          submitLabel='Admit'
          cancelLabel='Reject'
          onSubmit={handleSubmit(onSubmit, (errors: any) => {
            if (Object.keys(errors).length > 0) {
              const firstError = Object.keys(errors)[0]
              const element: any = document.querySelector(`[name="${firstError}"]`)
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
          title={'Reject Request'}
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
          formComponent={
            <TextField
              label='Enter Rejection Reason*'
              multiline
              rows={4}
              fullWidth
              value={rejectionReason}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRejectionReason(e.target.value)}
              sx={{
                width: { xs: '100%', sm: '400px' },
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
