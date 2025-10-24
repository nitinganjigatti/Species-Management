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
  CircularProgress
} from '@mui/material'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import RenderUtility from 'src/utility/render'
import TreatmentTypeRadioButtons from 'src/views/pages/hospital/utility/TreatmentTypeRadioButtons'
import Icon from 'src/@core/components/icon'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import AnimalDrawer from 'src/views/pages/compliance/reports/observation/AnimalDrawer'
import { getRoomsAndEnclosures } from 'src/lib/api/hospital/roomsAndEnclosures'
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
  admission_time: dayjs()
}

const treatmentType = [
  { label: 'OPD(outpatient)', value: 'opt' },
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
  selectedDoctor: yup.mixed().nullable().required('Doctor is required')
})

const AddPatientForm = () => {
  const theme = useTheme()
  const router = useRouter()

  const { selectedHospital } = useHospital()

  const [medicalId, setMedicalId] = useState([])
  const [holdingEnclosures, setHoldingEnclosures] = useState([])
  const [openAnimalDrawer, setAnimalDrawer] = useState(false)
  const [selectedAnimal, setSelectedAnimal] = useState(null)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [doctorDrawerOpen, setDoctorDrawerOpen] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [search, setSearch] = useState('')
  const [currentSort, setCurrentSort] = useState('recent')

  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const [filterCount, setFilterCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isSortBottomSheetOpen, setIsSortBottomSheetOpen] = useState(false)

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
    getValues,
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
    const getHospitalBeds = async () => {
      try {
        await getRoomsAndEnclosures({
          hospital_id: selectedHospital?.id,
          page: 1,
          per_page: 20,
          is_occupied: 'available',
          search
        }).then(res => {
          if (res?.success === true) {
            setHoldingEnclosures(
              res?.data?.records?.map(item => ({
                label: item?.bed_name,
                value: item?.id
              }))
            )
          }
        })
      } catch (error) {
        console.error(error, 'cannot Fetch hospital beds listing')
      }
    }

    getHospitalBeds()
  }, [search, selectedHospital?.id])

  const debouncedSearch = React.useMemo(() => debounce(val => setSearch(val), 1000), [])

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

  const onSubmit = async data => {
    const valid = await trigger()
    if (!valid) {
      setSubmitLoader(false)

      return
    }
    setSubmitLoader(true)
    try {
      const params = {
        entity_items: JSON.stringify([selectedAnimal?.animal_id]),
        source_id: selectedAnimal?.enclosure_id,
        source_type: 'enclosure',
        destination_id: selectedHospital?.id,
        destination_type: 'hospital',
        transfer_type: 'inter',
        visit_type: data?.visitType,
        holding_enclosure_id: data?.holdingEnclosure?.value,
        doctor_id: selectedDoctor?.id,
        treatment_type: data?.treatmentType,
        request_from: 'web',
        entitiy_item_type: 'animal',
        transfer_entity_type: 'hospital',
        ref_type: 'medical_record',
        ref_id: data?.medicalRecordId,
        source_site_id: selectedAnimal?.site_id,
        destination_site_id: selectedAnimal?.site_id,
        comments: data?.purposeOfVisit,
        admit_date: moment(data?.admission_date).format('YYYY-MM-DD'),
        admit_time: moment(data?.admission_time).format('HH:mm')
      }

      await addHospitalPatient(params).then(res => {
        if (res?.success === true) {
          Toaster({ type: 'success', message: res?.message })
          if (watchTreatmentType === 'inpatient') {
            router.back()
          } else if (watchTreatmentType === 'opt') {
            router.push('/hospital/outpatient')
          }
        } else {
          Toaster({ type: 'error', message: res?.message })
        }
        setSubmitLoader(false)
      })
    } catch (error) {
      console.error(error, 'Cannot Add-Patient')
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
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
          <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Hospital</Typography>
          <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Patients</Typography>
          <Typography onClick={() => router.back()} sx={{ cursor: 'pointer', color: 'text.primary' }}>
            Inpatient
          </Typography>
          <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Add Patient</Typography>
        </Breadcrumbs>
        <Card sx={{ mb: 4 }}>
          <CardHeader sx={{ pb: 1, px: 6, pt: 6 }} title={RenderUtility.pageTitle('Add Patient')} />
          <CardContent sx={{ px: 6, pb: 6 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
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
                        borderRadius: 1
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
                      border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                      borderRadius: 1,
                      p: 4,
                      background: theme.palette.customColors.Surface
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
                          />
                        </Grid>
                      ))}
                    </Grid>
                  )}
                />
              </Box>
              <Box
                sx={{
                  mt: 7,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}
              >
                <Grid container spacing={6} alignItems={'baseline'}>
                  <Grid size={{ xs: 12, md: 8 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography
                      sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      Date and Time
                    </Typography>
                    <Grid container spacing={6}>
                      <Grid size={{ xs: 6, sm: 6 }}>
                        <ControlledDatePicker
                          control={control}
                          name={'admission_date'}
                          label='Date'
                          defaultValue={dayjs()}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 6 }}>
                        <ControlledTimePicker control={control} name={'admission_time'} label='Time' />
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                    />
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
                    />
                  </Grid>
                </Grid>
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
                          sx={{ fontSize: '20px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
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
                            selectedFontColor='#FFF'
                            selectedBorderColor='none'
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
                          />
                        </Grid>
                      )}
                    </Grid>
                  )}
                />
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  mt: 7
                }}
              >
                <Grid container spacing={6}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Typography
                        sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                      >
                        Attending chief doctor
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
                      getOptionValue={option => option.value || ''}
                      getOptionLabel={option => option.label || ''}
                      isOptionEqualToValue={(option, value) => option.value === value?.value}
                      required
                      onInputChange={val => debouncedSearch(val)}
                      sx={{ borderRadius: 1 }}
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
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px'
        }}
      >
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Button
            variant='outlined'
            sx={{
              borderColor: theme.palette.customColors.Outline,
              borderRadius: 0.5,
              minHeight: '56px',
              minWidth: '160px'
            }}
            onClick={() => {
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
          >
            CANCEL
          </Button>
          <LoadingButton
            loading={submitLoader}
            disabled={submitLoader}
            variant='contained'
            sx={{ backgroundColor: theme.palette.primary.main, borderRadius: 0.5, minWidth: '160px' }}
            onClick={handleSubmit(onSubmit)}
          >
            ADMIT
          </LoadingButton>
        </Box>
      </Box>
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
        />
      )}
      {doctorDrawerOpen && (
        <DoctorsDrawer open={doctorDrawerOpen} setOpen={setDoctorDrawerOpen} onSelectDoctor={handleDoctorSelection} />
      )}
      {isSortBottomSheetOpen && (
        <SortBottomSheet
          open={isSortBottomSheetOpen}
          onClose={() => setIsSortBottomSheetOpen(false)}
          currentSort={currentSort}
          onSortChange={setCurrentSort}
        />
      )}
      <AddPatientFiltersDrawer
        openFilterDrawer={openFilterDrawer}
        onCloseFilterDrawer={handleCloseFilterDrawer}
        onSubmitLoading={loading}
        onApplyFilters={applyFilters}
        setFilterCount={setFilterCount}
        initialSelectedOptions={selectedOptions}
      />
    </>
  )
}

export default AddPatientForm
