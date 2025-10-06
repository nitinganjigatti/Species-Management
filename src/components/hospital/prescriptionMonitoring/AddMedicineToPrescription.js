import React, { useState, useEffect, useCallback } from 'react'
import { Box, Grid, Typography, Button } from '@mui/material'
import AnimalDetails from 'src/views/pages/hospital/symptoms/AnimalDetails'
import { useTheme } from '@mui/material/styles'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import ActionButtons from 'src/components/hospital/FooterActionbuttons'
import TreatmentTypeRadioButtons from 'src/views/pages/hospital/utility/TreatmentTypeRadioButtons'
import PrescriptionMedicineList from 'src/views/pages/hospital/prescription-monitoring/PrescriptionMedicineList'
import ScheduleMedicine from 'src/views/pages/hospital/prescription-monitoring/ScheduleMedicine'
import { getSymptomsListForAdding, addSymptoms } from 'src/lib/api/hospital/symptoms'
import { getPatientDetails } from 'src/lib/api/hospital/incomingPatient'
import { useRouter } from 'next/router'
import { getMedicineList } from 'src/lib/api/hospital/medicineList'
import { debounce } from 'lodash'
import { getMedicalMasterData } from 'src/lib/api/hospital/medicalMaster'

export default function AddMedicineToPrescription() {
  const theme = useTheme()

  // Form validation schema
  const prescriptionSchema = yup.object({
    selectedMedicineId: yup
      .string()
      .trim()
      .required('Please select a medicine')
      .test('is-selected', 'Please select a medicine', value => value && value.length > 0),
    selectedMedicine: yup
      .object()
      .nullable()
      .required('Please select a medicine')
      .test('is-valid-medicine', 'Please select a valid medicine', value => value && value.id && value.label),
    selectMedicineType: yup.string().oneOf(['Schedule', 'Direct Administer']).required('Please select medicine type'),

    // Schedule form data
    frequency: yup.string().when('selectMedicineType', {
      is: 'Schedule',
      then: () => yup.string().required('Please select a frequency')
    }),
    doseType: yup.string().when('selectMedicineType', {
      is: 'Schedule',
      then: () => yup.string().required('Please select a dose type')
    }),
    schedules: yup.array().when('selectMedicineType', {
      is: 'Schedule',
      then: () =>
        yup
          .array()
          .of(
            yup.object({
              time: yup.string().required('Time is required'),
              quantity: yup
                .string()
                .required('Quantity is required')
                .matches(/^[0-9]*$/, 'Quantity must be a number')
                .test('positive', 'Quantity must be greater than 1', value => Number(value) > 1)
                .test('max', 'Quantity cannot exceed 100', value => Number(value) <= 100),
              unit: yup.string().required('Please select a unit')
            })
          )
          .min(1, 'At least one schedule time is required')
    }),

    deliveryRoute: yup.string().required('Please select a delivery route'),
    prescriptionStartDate: yup.string().required('Start date is required'),
    dosageDuration: yup
      .object({
        value: yup
          .number()
          .transform((value, originalValue) => (originalValue === '' ? undefined : value))
          .min(1, 'Duration must be at least 1')
          .max(365, 'Duration cannot exceed 365')
          .required('Duration value is required'),
        unit: yup.string().required('Please select duration unit')
      })
      .required('Dosage duration is required'),

    notes: yup.string().max(500, 'Notes cannot exceed 500 characters').required('Notes are required'),

    // Clinical assessment data
    clinicalAssessment: yup.string(),
    prognosisValue: yup.string(),
    chronicValue: yup.string(),
    medicineStatus: yup.string()
  })

  const defaultValues = {
    selectedMedicineId: '',
    selectedMedicine: null,
    selectMedicineType: 'Schedule',
    frequency: 'everyday',
    doseType: 'fixed-dose',
    schedules: [
      {
        time: '',
        quantity: '',
        unit: ''
      }
    ],
    deliveryRoute: 'oral',
    prescriptionStartDate: null,
    dosageDuration: {
      value: 5,
      unit: 'days'
    },
    notes: '',
    clinicalAssessment: '',
    prognosisValue: '',
    chronicValue: 'No',
    medicineStatus: '',
    controlSubstanceFiles: []
  }
  const router = useRouter()

  const { id, animal_id, medical_record_id } = router.query

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(prescriptionSchema),
    mode: 'onBlur',
    shouldUnregister: false
  })

  // Only one medicine can be selected at a time
  const [selectedMedicine, setSelectedMedicine] = useState(null)
  const [temporarilySelectedMedicine, setTemporarilySelectedMedicine] = useState(null)
  const [patientData, setPatientData] = useState(null)
  const [patientLoading, setPatientLoading] = useState(false)

  // Pagination and search states for medicines
  const [apiMedicineList, setApiMedicineList] = useState([])
  const [medicineSearchQuery, setMedicineSearchQuery] = useState('')
  const [medicineLoading, setMedicineLoading] = useState(false)
  const [totalMedicines, setTotalMedicines] = useState(0)
  const [searching, setSearching] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [resetPagination, setResetPagination] = useState(false)
  const [page, setPage] = useState(1)

  const [medicalMasterData, setMedicalMasterData] = useState([])

  // Select a medicine to add details (single-select)
  const handleMedicineSelect = medicine => {
    if (medicine) {
      setValue('selectedMedicineId', medicine.id, { shouldValidate: true })
      setValue('selectedMedicine', medicine, { shouldValidate: true })
      setTemporarilySelectedMedicine({ id: medicine.id, name: medicine.name })
      setSelectedMedicine({ id: medicine.id, name: medicine.name })

      // setMedicineDrawerOpen(true)
    }
  }

  // Remove the selected medicine
  const removeMedicine = () => {
    setValue('selectedMedicineId', '', { shouldValidate: true })
    setValue('selectedMedicine', null, { shouldValidate: true })
    setSelectedMedicine(null)
    setTemporarilySelectedMedicine(null)
  }

  // Add medicine details to the selected medicine (if needed)
  const addMedicineDetails = details => {
    setSelectedMedicine({ ...temporarilySelectedMedicine, ...details })
    setTemporarilySelectedMedicine(null)

    // setMedicineDrawerOpen(false)
  }

  const fetchMedicalMasterData = useCallback(async () => {
    try {
      const response = await getMedicalMasterData()
      if (response?.success) {
        setMedicalMasterData(response?.data)
      } else {
        setMedicalMasterData([])
      }
    } catch (error) {
      console.error('Error fetching medical master data:', error.message)
    }
  }, [])

  const fetchMedicines = useCallback(
    async (query = '', pageNo = 1, append = false) => {
      try {
        // setMedicineLoading(true)
        if (pageNo === 1) {
          setSearching(true)
        } else {
          setMedicineLoading(true)
        }

        const params = {
          q: query,
          page_no: pageNo,
          screen: 'Medicine'

          // limit: 10
        }
        const response = await getMedicineList({ params })
        if (response?.success) {
          const medicines = response.data.brand_name.result || []
          const totalCount = parseInt(response.data.brand_name.count) || 0
          const newResults = response.data.brand_name.result || []
          const totalRecords = parseInt(response.data.brand_name.count) || 0

          setApiMedicineList(prev => (append ? [...prev, ...newResults] : newResults))
          setTotalMedicines(totalRecords)
          setHasMore(pageNo * 20 < totalRecords)
        }
      } catch (error) {
        console.error('Error fetching medicines:', error)

        return []
      } finally {
        setMedicineLoading(false)
        setSearching(false)
        setResetPagination(false)
      }
    },
    [apiMedicineList.length]
  )

  // Handle search query changes
  // const handleMedicineSearch = useCallback(
  //   searchQuery => {
  //     setMedicineSearchQuery(searchQuery)
  //     setCurrentPage(1)
  //     setApiMedicineList([])
  //     fetchMedicines(searchQuery, 1, true)
  //   },
  //   [fetchMedicines]
  // )

  const debouncedSearch = useCallback(
    debounce(query => {
      setResetPagination(true)
      setPage(1)
      fetchMedicines(query, 1, false)
    }, 500),
    []
  )

  const handleMedicineSearch = e => {
    const value = e.target.value
    setMedicineSearchQuery(value)
    debouncedSearch(value)
  }

  const handleClearSearch = () => {
    setMedicineSearchQuery('')
    setPage(1)
    fetchMedicines('', 1, false)
  }

  const handleScroll = e => {
    if (resetPagination || medicineLoading || !hasMore) return
    const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 50

    if (bottom) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchMedicines(medicineSearchQuery, nextPage, true)
    }
  }

  // Load more medicines for pagination
  // const loadMoreMedicines = useCallback(async () => {
  //   if (!medicineLoading && hasMoreData) {
  //     const nextPage = currentPage + 1
  //     setCurrentPage(nextPage)
  //     await fetchMedicines(medicineSearchQuery, nextPage, false)
  //   }
  // }, [currentPage, medicineSearchQuery, medicineLoading, hasMoreData, fetchMedicines])

  useEffect(() => {
    fetchMedicines('', 1, true)
    fetchMedicalMasterData()
  }, [])

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

  return (
    <Box sx={{ p: 3 }}>
      <AnimalDetails
        image={patientData?.animal_detail?.default_icon}
        name={patientData?.animal_detail?.common_name}
        scientificName={patientData?.animal_detail?.complete_name}
        identifierValue={patientData?.animal_detail?.local_identifier_value}
        identifierName={patientData?.animal_detail?.local_identifier_name}
        admittedDays={patientData?.admitted_for_day}
        location={patientData?.bed_name || 'N/A'}
        vet={patientData?.attend_by_full_name || 'N/A'}
        ageGender={`${patientData?.animal_detail?.age || 'N/A'}${
          patientData?.animal_detail?.sex ? ` . ${patientData?.animal_detail?.sex}` : ''
        }`}
        isLoading={patientLoading}
      />

      <Grid
        container
        spacing={5}
        className='match-height'
        sx={{ mt: 5, mb: 8, background: theme.palette.common.white, px: 6, py: 4, borderRadius: '8px' }}
      >
        <Grid size={{ xs: 12, md: 4, lg: 4 }}>
          <Typography variant='h6' sx={{ mb: 2 }}>
            Select the medicine to
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 4, lg: 4 }}>
          <TreatmentTypeRadioButtons
            label='Schedule'
            isSelected={watch('selectMedicineType') === 'Schedule'}
            sx={{
              borderColor: `${theme.palette.customColors.OutlineVariant}`
            }}
            onClick={() => setValue('selectMedicineType', 'Schedule')}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4, lg: 4 }}>
          <TreatmentTypeRadioButtons
            label='Direct Administer'
            isSelected={watch('selectMedicineType') === 'Direct Administer'}
            sx={{
              borderColor: `${theme.palette.customColors.OutlineVariant}`
            }}
            onClick={() => setValue('selectMedicineType', 'Direct Administer')}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 7, lg: 7 }}>
          <PrescriptionMedicineList
            medicineList={apiMedicineList.length > 0 ? apiMedicineList : []}
            temporarilySelectedMedicine={temporarilySelectedMedicine}
            // selectedMedicine={selectedMedicine ? selectedMedicine.label : null}
            selectedMedicine={selectedMedicine ? selectedMedicine?.id : null}
            onSelect={handleMedicineSelect}
            searchQuery={medicineSearchQuery}
            handleSearchChange={handleMedicineSearch}
            handleClearSearch={handleClearSearch}
            handleScroll={handleScroll}
            loading={medicineLoading}
            searching={searching}
            error={errors.selectedMedicine?.message || errors.selectedMedicineId?.message}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 5, lg: 5 }}>
          <ScheduleMedicine
            medicalMasterData={medicalMasterData}
            control={control}
            errors={errors}
            selectedMedicineTo={watch('selectMedicineType')}
          />
        </Grid>
      </Grid>

      <ActionButtons
        cancelLabel='CANCEL'
        addLabel={watch('selectMedicineType') === 'Direct Administer' ? 'Administer' : 'Schedule'}
        onCancel={() => console.log('Cancelled')}
        onAdd={handleSubmit(data => {
          console.log('Form data to submit:', data)
        })}
        width={200}
        height={50}
      />
    </Box>
  )
}
