import {
  Breadcrumbs,
  Typography,
  Box,
  Card,
  CardHeader,
  CardContent,
  Grid,
  Button,
  alpha,
  IconButton,
  useTheme,
  Tooltip
} from '@mui/material'
import { useRouter } from 'next/router'
import React, { useContext, useEffect, useState } from 'react'
import RenderUtility from 'src/utility/render'
import TreatmentTypeRadioButtons from 'src/views/pages/hospital/utility/TreatmentTypeRadioButtons'
import Icon from 'src/@core/components/icon'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import AnimalDrawer from 'src/views/pages/compliance/reports/observation/AnimalDrawer'
import { getHospitalRoomsList, getRoomsAndEnclosures } from 'src/lib/api/hospital/roomsAndEnclosures'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import DoctorsDrawer from '../PatientAdmissionForm/DoctorsDrawer'
import AnimalCard from 'src/views/utility/AnimalCard'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import { getAnimalMedicalIds } from 'src/lib/api/hospital/hospitalMaster'
import { addHospitalPatient } from 'src/lib/api/hospital/inpatient'
import { debounce } from 'lodash'
import Toaster from 'src/components/Toaster'
import { LoadingButton } from '@mui/lab'
import { useHospital } from 'src/context/HospitalContext'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import dayjs from 'dayjs'
import moment from 'moment'
import AddPatientFiltersDrawer from '../inpatient/AddPatientFiltersDrawer'
import SortBottomSheet from '../inpatient/SortBottomSheet'
import { getHospitalBedStats } from 'src/lib/api/hospital/hospitalAnalytics'
import AddRoomDrawer from '../PatientAdmissionForm/AddRoomDrawer'
import AddBedsDrawer from '../PatientAdmissionForm/AddBedsDrawer'
import { AuthContext } from 'src/context/AuthContext'
import BottomActionBar from 'src/views/utility/BottomActionBar'

// import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'

const defaultValues = {
  treatmentType: 'inpatient',
  purposeOfVisit: '',
  visitType: '',
  medicalRecordId: '',
  holdingEnclosure: null,
  medicalRecordChoice: 'new',
  selectedAnimal: null,
  selectedDoctor: null,
  admission_date: dayjs(),
  admission_time: dayjs(),
  room: null
}

const treatmentType = [
  { label: 'OPD(outpatient)', value: 'opd' },
  { label: 'Hospital Admission(inpatient)', value: 'inpatient' }
]

const medicalRecordType = [
  { label: 'Create a new ID', value: 'new' },
  { label: 'Add to existing ID', value: 'existing' }
]

const visitTypes = [
  { label: 'Check Up', value: 'checkup' },
  { label: 'Emergency', value: 'emergency' },
  { label: 'Outpatient', value: 'opd' },
  { label: 'Follow up', value: 'follow_up' },
  { label: 'Planned', value: 'planned' }
]

// Updated schema to validate form fields directly
const schema = yup.object().shape({
  treatmentType: yup.string().required('Treatment Type is Required'),
  purposeOfVisit: yup.string().required('Purpose of Visit is Required'),
  visitType: yup.string().required('Visit type is required'),
  medicalRecordId: yup.string().when('medicalRecordChoice', {
    is: 'existing',
    then: schema => schema.required('Medical id is required'),
    otherwise: schema => schema.notRequired()
  }),
  holdingEnclosure: yup.object().required('Holding Enclosure is required'),
  selectedAnimal: yup.mixed().nullable().required('Animal is required'),
  selectedDoctor: yup.mixed().nullable().required('Doctor is required'),
  room: yup.object().required('Room is required')
})

const AddPatientForm = () => {
  const theme = useTheme()
  const router = useRouter()
  const authData = useContext(AuthContext)
  const havePermissionToAddHospital = authData?.userData?.permission?.user_settings?.add_hospital_permission

  const { selectedHospital, updateHospitalStats, hospitalStats, isHospitalStatsLoading } = useHospital()

  const [medicalId, setMedicalId] = useState([])
  const [holdingEnclosures, setHoldingEnclosures] = useState([])
  const [openAnimalDrawer, setAnimalDrawer] = useState(false)
  const [selectedAnimal, setSelectedAnimal] = useState(null)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [doctorDrawerOpen, setDoctorDrawerOpen] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [currentSort, setCurrentSort] = useState({ column: 'animal_id', sort: 'asc' })
  const [bedsLoading, setBedsLoading] = useState(false)
  const [searchEnclosure, setSearchEnclosure] = useState('')
  const [rooms, setRooms] = useState([])
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const [filterCount, setFilterCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isSortBottomSheetOpen, setIsSortBottomSheetOpen] = useState(false)
  const [searchRoom, setSearchRoom] = useState('')
  const [openAddRoomDrawer, setOpenAddRoomDrawer] = useState(false)
  const [openAddBedsDrawer, setOpenAddBedsDrawer] = useState(false)

  const [selectedOptions, setSelectedOptions] = useState({
    Gender: [],
    Species: [],
    Site: [],
    Section: [],
    Enclosure: []
  })

  const applyFilters = selectedOptions => {
    setSelectedOptions(selectedOptions)
    setOpenFilterDrawer(false)
  }

  const handleFilterClick = async () => {
    setOpenFilterDrawer(true)
  }

  const handleSortClick = async () => {
    setIsSortBottomSheetOpen(true)
  }

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
    clearErrors,
    reset
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const watchMedicalChoice = watch('medicalRecordChoice')
  const watchTreatmentType = watch('treatmentType')

  useEffect(() => {
    const getHospitalRooms = async () => {
      setRoomsLoading(true)
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
            setRoomsLoading(false)
          } else {
            setRooms([])
            setRoomsLoading(false)
          }
        })
      } catch (error) {
        console.error(error, 'cannot Fetch hospital rooms listing')
      }
    }

    getHospitalRooms()
  }, [selectedHospital, searchRoom, hospitalStats?.available_rooms])

  const selectedRoom = watch('room')

  useEffect(() => {
    const getHospitalBeds = async () => {
      if (!selectedRoom?.value) return
      setBedsLoading(true)
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
        setBedsLoading(false)
      } finally {
        setBedsLoading(false)
      }
    }

    getHospitalBeds()
  }, [selectedRoom, selectedHospital, searchEnclosure, hospitalStats?.available_rooms])

  const debouncedSearch = React.useMemo(() => debounce(val => setSearchRoom(val), 1000), [])

  const debouncedEnclosureSearch = React.useMemo(() => debounce(val => setSearchEnclosure(val), 1000), [])

  useEffect(() => {
    const getAnimalIds = async () => {
      try {
        await getAnimalMedicalIds(selectedAnimal?.animal_id).then(res => {
          if (res?.success === true) {
            setMedicalId(
              res?.data?.result?.map(item => ({
                label: item?.medical_record_code,
                value: item?.id
              }))
            )
          }
        })
      } catch (error) {
        console.log(error, 'Cannot Fetch Animal Medical Ids')
      }
    }

    if (selectedAnimal?.animal_id) {
      getAnimalIds()
    }
  }, [selectedAnimal?.animal_id])

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
    const valid = await trigger()
    if (!valid) {
      setSubmitLoader(false)

      return
    }
    setSubmitLoader(true)
    try {
      const params = {
        source_id: selectedAnimal?.site_id,
        source_type: 'site',
        destination_id: selectedHospital?.id,
        destination_type: 'hospital',
        transfer_type: selectedAnimal?.site_id === selectedHospital?.id ? 'intra' : 'inter',
        reason_for_transfer: data?.purposeOfVisit,
        ref_ids: JSON.stringify([
          {
            ref_id: data?.medicalRecordId,
            entity_ids: [String(selectedAnimal?.animal_id)]
          }
        ]),
        transfer_entity_type: 'medical_record',
        entitiy_item_type: 'animal',
        request_from: 'web',
        module: 'hospital_transfer',
        visit_type: data?.visitType,
        additional_info: JSON.stringify({
          treatment_type: data?.treatmentType,
          doctor_id: String(selectedDoctor?.id),
          holding_enclosure_id: String(data?.holdingEnclosure?.value),
          room_id: String(data?.room?.value),
          admit_date: moment(data?.admission_date).format('YYYY-MM-DD'),
          admit_time: dayjs(data?.admission_time).format('HH:mm')
        })
      }

      const res = await addHospitalPatient(params)

      if (res?.success === true) {
        Toaster({ type: 'success', message: res?.message })
        if (watchTreatmentType === 'opd') {
          router.push({
            pathname: `/hospital/outpatient`
          })
        } else if (watchTreatmentType === 'inpatient') {
          router.back()
        }
        fetchAndUpdateHospitalStats(selectedHospital?.id)
      } else {
        throw res
      }
      setSubmitLoader(false)
    } catch (error) {
      Toaster({ type: 'error', message: error?.message })
      console.error(error?.message, 'Cannot Add-Patient')
      setSubmitLoader(false)
    }
  }

  const handleAnimalSelection = animal => {
    setSelectedAnimal(animal)
    setValue('selectedAnimal', animal)
    clearErrors('selectedAnimal')
  }

  const handleDoctorSelection = doctor => {
    setSelectedDoctor(doctor)
    setValue('selectedDoctor', doctor)
    clearErrors('selectedDoctor')
  }

  const handleRemoveAnimal = () => {
    reset(defaultValues, {
      keepErrors: false,
      keepDirty: false,
      keepTouched: false
    })
    setSelectedAnimal(null)
    setValue('selectedAnimal', null)
    setMedicalId([])
    setValue('medicalRecordChoice', 'new')
  }

  const handleRemoveDoctor = () => {
    setSelectedDoctor(null)
    setValue('selectedDoctor', null)
  }

  const handleCloseFilterDrawer = () => {
    setOpenFilterDrawer(false)
  }

  return (
    <>
      <Box>
        {/* <DynamicBreadcrumbs
          pageItems={[
            { title: 'Hospital' },
            { title: 'Patients' },
            { title: 'Inpatient', onClick: () => router.back() },
            { title: 'Add Patient', active: true }
          ]}
        /> */}
        <Card sx={{ mb: 4 }}>
          <CardHeader sx={{ pb: 1, px: 6, pt: 6 }} title={RenderUtility.pageTitle('Add Patient')} />
          <CardContent sx={{ px: 6, pb: 6 }}>
            <form
              onSubmit={handleSubmit(onSubmit, errors => {
                if (Object.keys(errors).length > 0) {
                  const firstError = Object.keys(errors)[0]
                  const element = document.querySelector(`[name="${firstError}"]`)
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }
                }
              })}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  mb: 7
                }}
              >
                <Typography
                  sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  Select Patient
                </Typography>
                {selectedAnimal !== null ? (
                  <>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 6,
                        background: theme.palette.customColors.displaybgPrimary,
                        borderRadius: 1,
                        cursor: submitLoader ? 'not-allowed' : 'pointer',
                        opacity: submitLoader ? 0.6 : 1,
                        pointerEvents: submitLoader ? 'not-allowed' : 'auto'
                      }}
                    >
                      <AnimalCard data={selectedAnimal} />
                      <IconButton onClick={handleRemoveAnimal}>
                        <Icon icon='charm:cross' fontSize={24} color={theme.palette.customColors.Error} />
                      </IconButton>
                    </Box>
                  </>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: errors.selectedAnimal
                        ? ` 1px solid ${theme.palette.customColors.Error}`
                        : `1px solid ${theme.palette.customColors.OutlineVariant}`,
                      borderRadius: 1,
                      p: 4,
                      background: theme.palette.customColors.Surface,
                      cursor: 'pointer'
                    }}
                    onClick={() => setAnimalDrawer(true)}
                  >
                    <Typography
                      sx={{
                        fontSize: '16px',
                        fontWeight: 400,
                        color: errors.selectedAnimal
                          ? theme.palette.error.main
                          : theme.palette.customColors.OnPrimaryContainer
                      }}
                    >
                      Select Animal
                    </Typography>
                    <Icon icon={'simple-line-icons:plus'} color={theme.palette.customColors.addPrimary} />
                  </Box>
                )}
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
                  Select treatment type
                </Typography>
                <Controller
                  name='treatmentType'
                  control={control}
                  render={({ field }) => (
                    <Grid container spacing={4}>
                      {treatmentType?.map((item, index) => (
                        <Grid key={index} size={{ xs: 12, sm: 6, md: 6 }}>
                          <TreatmentTypeRadioButtons
                            label={item?.label}
                            isSelected={field.value === item?.value}
                            onClick={() => field.onChange(item?.value)}
                            backgroundColor={theme.palette.customColors.OnPrimary}
                            borderColor={theme.palette.customColors.OutlineVariant}
                            selectedBorderColor={theme.palette.primary.main}
                            selectedBackgroundColor={theme.palette.customColors.OnPrimary}
                            sx={{ fontSize: '1rem', width: '100%' }}
                            disabled={submitLoader}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  )}
                />
              </Box>

              <Grid container spacing={6} sx={{ mt: 7 }}>
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12 }}>
                    <Typography
                      sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      Date and Time
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <ControlledDatePicker
                      control={control}
                      name={'admission_date'}
                      label='Date'
                      defaultValue={dayjs()}
                      disabled={submitLoader}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <ControlledTimePicker
                      control={control}
                      name={'admission_time'}
                      label='Time'
                      disabled={submitLoader}
                    />
                  </Grid>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name='medicalRecordChoice'
                    control={control}
                    render={({ field }) => (
                      <Grid
                        container
                        spacing={4}
                        sx={{
                          background: alpha(theme.palette.customColors.SecondaryContainer, 0.16),
                          p: 6,
                          borderRadius: 1
                        }}
                      >
                        <Grid size={{ xs: 12 }}>
                          <Typography
                            sx={{
                              fontSize: '20px',
                              fontWeight: 500,
                              color: theme.palette.customColors.OnSurfaceVariant
                            }}
                          >
                            Medical Record ID
                          </Typography>
                        </Grid>
                        {medicalRecordType?.map((item, index) => (
                          <Grid key={index} size={{ xs: 12, sm: 6 }}>
                            <TreatmentTypeRadioButtons
                              label={item?.label}
                              radioPosition='right'
                              backgroundColor={theme.palette.customColors.OnPrimary}
                              borderColor={theme.palette.customColors.Outline}
                              isSelected={field.value === item?.value}
                              onClick={() => field.onChange(item?.value)}
                              selectedBackgroundColor={theme.palette.customColors.OnPrimaryContainer}
                              selectedFontColor={theme.palette.customColors.OnPrimary}
                              selectedBorderColor='none'
                              disabled={submitLoader}
                            />
                          </Grid>
                        ))}
                        {watchMedicalChoice === 'existing' && (
                          <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Typography
                              sx={{
                                fontSize: '16px',
                                fontWeight: 500,
                                color: theme.palette.customColors.OnSurfaceVariant
                              }}
                            >
                              Select ID
                            </Typography>
                            <ControlledSelect
                              control={control}
                              name={'medicalRecordId'}
                              errors={errors}
                              label={'Select ID'}
                              options={
                                !selectedAnimal
                                  ? [{ label: ' Select Animal first', value: '' }]
                                  : medicalId.length > 0
                                  ? medicalId
                                  : [{ label: 'No medical IDs available', value: '' }]
                              }
                              getOptionLabel={option => option.label}
                              getOptionValue={option => option.value}
                              sx={{ background: theme.palette.customColors.Surface }}
                              disabled={!selectedAnimal || submitLoader}
                            />
                          </Grid>
                        )}
                      </Grid>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography
                    sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                  >
                    Visit Type
                  </Typography>
                  <ControlledSelect
                    control={control}
                    name={'visitType'}
                    errors={errors}
                    label={'Select Visit Type'}
                    options={visitTypes}
                    getOptionLabel={option => option.label}
                    getOptionValue={option => option.value}
                    disabled={submitLoader}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography
                      sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      Attending chief Veterinarian
                    </Typography>
                    {selectedDoctor === null ? (
                      <Box
                        sx={{
                          // background: theme.palette.customColors.Surface,
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
                          Select chief Veterinarian
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
                          <IconButton onClick={handleRemoveDoctor} disabled={submitLoader}>
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
                <Grid size={{ xs: 12 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography
                    sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                  >
                    Purpose of visit
                  </Typography>
                  <ControlledTextArea
                    control={control}
                    name={'purposeOfVisit'}
                    errors={errors}
                    sx={{ borderRadius: 1 }}
                    label={'Enter Enter'}
                    disabled={submitLoader}
                  />
                </Grid>
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
                    loading={roomsLoading}
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
                      No available beds, All beds are occupied
                    </Typography>
                  )}
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
                    loading={bedsLoading}
                    disabled={submitLoader}
                    endAdornment={() =>
                      havePermissionToAddHospital && (
                        <Tooltip title='Add Beds/Enclosures'>
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
            </form>
          </CardContent>
        </Card>
      </Box>
      <BottomActionBar
        onCancel={() => {
          reset(defaultValues, {
            keepErrors: false,
            keepDirty: false,
            keepTouched: false
          })
          setSelectedAnimal(null)
          setValue('selectedAnimal', null)
          setMedicalId([])
          setValue('medicalRecordChoice', 'new')
          router.back()
        }}
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
      />
      {openAnimalDrawer && (
        <AnimalDrawer
          open={openAnimalDrawer}
          onClose={() => {
            setAnimalDrawer(false)
          }}
          btnText='ADD'
          showAnimalFilter={false}
          handleAnimalClick={handleAnimalSelection}
          showFilterAndSort
          handleFilterClick={handleFilterClick}
          handleSortClick={handleSortClick}
          module='hospital'
          filters={selectedOptions}
          sortType={currentSort}
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
      {isSortBottomSheetOpen && (
        <SortBottomSheet
          open={isSortBottomSheetOpen}
          onClose={() => setIsSortBottomSheetOpen(false)}
          currentSort={currentSort.sort === 'asc' ? 'recent' : 'oldest'}
          onSortChange={sortObj => setCurrentSort(sortObj)}
        />
      )}
      <AddPatientFiltersDrawer
        openFilterDrawer={openFilterDrawer}
        onCloseFilterDrawer={handleCloseFilterDrawer}
        onSubmitLoading={loading}
        onApplyFilters={applyFilters}
        setFilterCount={setFilterCount}
        filterCount={filterCount}
        initialSelectedOptions={selectedOptions}
      />
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

export default AddPatientForm
