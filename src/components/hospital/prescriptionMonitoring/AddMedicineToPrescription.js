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
import {
  addDirectAdministerPrescription,
  addPrescription,
  getFrequency,
  getMedicineBatches,
  getPrescriptions
} from 'src/lib/api/hospital/prescription'
import Utility from 'src/utility'
import moment from 'moment'
import Toaster from 'src/components/Toaster'
import { useHospital } from 'src/context/HospitalContext'
import { useDynamicStateContext } from 'src/context/DynamicStatesContext'

const STORAGE_KEY = 'medical_record_data'

export default function AddMedicineToPrescription() {
  const theme = useTheme()
  const { data, updateState } = useDynamicStateContext()
  const medicalRecordData = data[STORAGE_KEY] || {}

  // Form validation schema
  const prescriptionSchema = yup.object({
    // Common fields for both Schedule and Direct Administer
    selectedMedicineId: yup.string().trim().required('Please select a medicine'),

    selectedMedicine: yup
      .object()
      .nullable()
      .required('Please select a medicine')
      .test('is-valid-medicine', 'Please select a valid medicine', value => !!(value && value.id)),

    selectMedicineType: yup
      .string()
      .oneOf(['Schedule', 'Direct Administer'], 'Please select medicine type')
      .required('Please select medicine type'),
    frequency: yup.string().required('Please select a frequency'),

    schedules: yup
      .array()
      .of(
        yup.object({
          time: yup.string().required('Time is required'),
          quantity: yup
            .number()
            .typeError('Quantity must be a number')
            .min(1, 'Quantity must be at least 1')
            .max(100, 'Quantity cannot exceed 100')
            .required('Quantity is required'),
          unit: yup.string().required('Please select a unit')
        })
      )
      .min(1, 'At least one schedule time is required')
      .required('Schedules are required')
      .test('unique-times', 'Duplicate times are not allowed', function (schedules) {
        if (!schedules || schedules.length <= 1) return true

        const times = schedules
          .map(schedule => {
            if (!schedule?.time) return null

            // Convert to standard format for comparison (HH:mm)
            const timeStr = moment(schedule.time).format('HH:mm')

            return timeStr
          })
          .filter(Boolean)

        const uniqueTimes = new Set(times)
        if (times.length !== uniqueTimes.size) {
          // Find the duplicate time index
          const seenTimes = new Map()
          for (let i = 0; i < times.length; i++) {
            if (seenTimes.has(times[i])) {
              return this.createError({
                path: `schedules[${i}].time`,
                message: 'This time is already selected'
              })
            }
            seenTimes.set(times[i], i)
          }
        }

        return true
      }),

    deliveryRoute: yup.string().required('Please select a delivery route'),

    prescriptionStartDate: yup.string().required('Start date is required'),

    dosageDuration: yup.object().when('frequency', {
      is: frequency => {
        // Make dosageDuration optional when frequency is "one_time" (id: 2)
        return frequency !== '2' && frequency !== 2
      },
      then: schema =>
        schema
          .shape({
            value: yup
              .number()
              .transform((value, originalValue) => (originalValue === '' ? undefined : value))
              .min(1, 'Duration must be at least 1')
              .max(365, 'Duration cannot exceed 365')
              .required('Duration value is required'),
            unit: yup.string().required('Please select duration unit')
          })
          .required('Dosage duration is required'),
      otherwise: schema =>
        schema
          .shape({
            value: yup.number().nullable().notRequired(),
            unit: yup.string().nullable().notRequired()
          })
          .nullable()
          .notRequired()
    }),

    notes: yup.string().trim().max(10000, 'Notes cannot exceed 500 characters').notRequired(),

    // Fields specific to Direct Administer

    wastageQuantity: yup
      .string()
      .nullable()
      .trim()
      .test('is-number', 'Quantity must be a number', value => {
        if (!value) return true // allow empty

        return /^[0-9]*$/.test(value)
      })
      .test('positive', 'Quantity must be greater than 0', value => {
        if (!value) return true // allow empty

        return Number(value) > 0
      })
      .test('max', 'Quantity cannot exceed 100', value => {
        if (!value) return true // allow empty

        return Number(value) <= 100
      }),

    wastageUOM: yup.string().when('wastageQuantity', {
      is: value => value && Number(value) > 0,
      then: schema => schema.required('Please select unit'),
      otherwise: schema => schema.notRequired()
    }),

    batchNumber: yup.mixed().when(['selectedMedicine', 'selectMedicineType'], {
      is: (selectedMedicine, selectMedicineType) =>
        selectMedicineType === 'Direct Administer' && selectedMedicine?.controlled_substance === 1,
      then: schema => schema.required('Batch number is required for controlled substances'),
      otherwise: schema => schema.nullable().notRequired()
    }),

    batchImage: yup.mixed().nullable().notRequired(),

    wastageNotes: yup.string().nullable().trim().max(10000, 'Notes cannot exceed 500 characters').notRequired()
  })

  const defaultValues = {
    selectedMedicineId: '',
    selectedMedicine: null,
    selectMedicineType: 'Schedule',
    frequency: '',

    // doseType: '',
    schedules: [
      {
        time: '',
        quantity: '',
        unit: ''
      }
    ],
    deliveryRoute: '',
    prescriptionStartDate: null,
    dosageDuration: {
      value: 5,
      unit: null
    },
    notes: '',
    wastageQuantity: null,
    wastageUOM: null,
    batchNumber: null,
    wastageNotes: null,
    batchImage: null
  }
  const router = useRouter()

  const { id, discharge_tab } = router.query
  const animal_id = medicalRecordData?.animal_id
  const medical_record_id = medicalRecordData?.medical_record_id

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    getValues,
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
  const [frequencyData, setFrequencyData] = useState([])
  const [batchList, setBatchList] = useState([])
  const [batchSearchQuery, setBatchSearchQuery] = useState('')
  const [batchLoading, setBatchLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPrescriptionListLoading, setIsPrescriptionListLoading] = useState(false)
  const [medicationData, setMedicationData] = useState([])
  const [endsOn, setEndsOn] = useState(null)

  const { selectedHospital: hospital } = useHospital()

  // Watch frequency to determine if it's "one_time"
  const selectedFrequency = watch('frequency')
  const isOneTimeFrequency = selectedFrequency === '2' || selectedFrequency === 2

  // Watch for changes in start date and duration to calculate end date
  const prescriptionStartDate = watch('prescriptionStartDate')
  const dosageDuration = watch('dosageDuration')
  const selectMedicineType = watch('selectMedicineType')

  // Calculate and update endsOn whenever relevant fields change
  useEffect(() => {
    if (prescriptionStartDate && !isOneTimeFrequency) {
      // For regular intervals (not one-time)
      if (dosageDuration?.value && dosageDuration?.unit) {
        if (selectMedicineType === 'Direct Administer') {
          // Direct Administer: Calculate START date (backward from end date)
          const calculatedStartDate = calculateStartDate(prescriptionStartDate, dosageDuration)
          if (calculatedStartDate) {
            const formattedDate = moment(calculatedStartDate).format('DD MMM YYYY')
            setEndsOn(formattedDate)
          } else {
            setEndsOn(null)
          }
        } else {
          // Schedule: Calculate END date (forward from start date)
          const calculatedEndDate = calculateEndDate(prescriptionStartDate, dosageDuration)
          if (calculatedEndDate) {
            const formattedDate = moment(calculatedEndDate).format('DD MMM YYYY')
            setEndsOn(formattedDate)
          } else {
            setEndsOn(null)
          }
        }
      } else {
        setEndsOn(null)
      }
    } else if (isOneTimeFrequency && prescriptionStartDate) {
      // For one-time frequency, end date is same as start date
      const formattedDate = moment(prescriptionStartDate).format('DD MMM YYYY')
      setEndsOn(formattedDate)
    } else {
      setEndsOn(null)
    }
  }, [prescriptionStartDate, dosageDuration?.value, dosageDuration?.unit, isOneTimeFrequency, selectMedicineType])

  const debouncedBatchSearch = useCallback(
    debounce(async (medicineId, query = '') => {
      if (!medicineId) {
        setBatchList([])

        return
      }

      try {
        setBatchLoading(true)

        const params = {
          medicine_id: medicineId,
          q: query
        }

        const response = await getMedicineBatches(params)
        if (response?.success) {
          setBatchList(response?.data?.result || [])
        } else {
          setBatchList([])
        }
      } catch (error) {
        console.error('Error fetching medicine batches:', error.message)
        setBatchList([])
      } finally {
        setBatchLoading(false)
      }
    }, 500),
    []
  )

  const fetchMedicineBatches = useCallback(
    (medicineId, query = '') => {
      debouncedBatchSearch(medicineId, query)
    },
    [debouncedBatchSearch]
  )

  const handleMedicineSelect = medicine => {
    if (medicine) {
      setValue('selectedMedicineId', medicine.id, { shouldValidate: true })
      setValue('selectedMedicine', medicine, { shouldValidate: true })
      setTemporarilySelectedMedicine({ ...medicine })
      setSelectedMedicine({ ...medicine })

      // Reset batch number when medicine changes
      setValue('batchNumber', null)
      setBatchSearchQuery('')

      // Only fetch batches if Direct Administer is selected
      if (watch('selectMedicineType') === 'Direct Administer') {
        fetchMedicineBatches(medicine.id, '')
      }
    }
  }

  // Add this after the cleanup useEffect
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'selectMedicineType') {
        if (value.selectMedicineType !== 'Direct Administer') {
          // Clear batches when switching away from Direct Administer
          setBatchList([])
          setValue('batchNumber', null)
          setBatchSearchQuery('')
        } else if (temporarilySelectedMedicine?.id) {
          // Fetch batches when switching to Direct Administer
          debouncedBatchSearch(temporarilySelectedMedicine.id, '')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [watch, temporarilySelectedMedicine?.id, debouncedBatchSearch, setValue])

  // Add batch search handler
  // Add batch search handler - wrap in useCallback to maintain debounce
  const handleBatchSearch = useCallback(
    value => {
      setBatchSearchQuery(value)
      if (temporarilySelectedMedicine?.id) {
        fetchMedicineBatches(temporarilySelectedMedicine.id, value)
      }
    },
    [temporarilySelectedMedicine?.id, fetchMedicineBatches]
  )

  const fetchMedicalMasterData = useCallback(async () => {
    try {
      const response = await getMedicalMasterData()
      if (response?.success) {
        fetchFrequencies()
        setMedicalMasterData({
          ...response?.data,

          // prescriptionFrequency: frequencyData || [],
          prescriptionDosageMeasurementType:
            response?.data?.prescriptionDosageMeasurementType?.map(item => ({
              ...item,
              value: item.key,
              unit_name: item.label,
              uom_abbr: item.key
            })) || [],
          prescriptionDuration: response?.data?.prescriptionDuration?.map(item => ({ ...item, value: item.key })) || [],
          prescriptionMeasurementType:
            response?.data?.prescriptionMeasurementType?.map(item => ({
              ...item,
              label: item.unit_name,
              value: item.uom_abbr
            })) || [],
          prescriptionDeliveryRoute:
            response?.data?.prescriptionDeliveryRoute?.map(item => ({
              ...item,
              label: item.delivery,
              value: item.route_abbr
            })) || []
        })
      } else {
        setMedicalMasterData([])
      }
    } catch (error) {
      console.error('Error fetching medical master data:', error.message)
    }
  }, [])

  const fetchFrequencies = useCallback(async () => {
    try {
      const response = await getFrequency()
      if (response?.success) {
        setFrequencyData(response?.data?.map(item => ({ ...item, value: item.id })) || [])
        setMedicalMasterData(prevData => ({
          ...prevData,
          prescriptionFrequency: response?.data?.map(item => ({
            ...item,
            value: item.id
          }))
        }))
      } else {
        setFrequencyData([])
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

  const handleCancel = () => {
    router.back() // goes to previous page
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

            if (hospital?.id && res.data?.animal_detail?.animal_id && id && res.data?.medical_record_id) {
              getPrescriptionList(res.data?.animal_detail?.animal_id, res.data?.medical_record_id)
            }
            updateState(STORAGE_KEY, {
              ...medicalRecordData,
              animal_id: res.data?.animal_detail?.animal_id,
              medical_record_id: res.data?.medical_record_id,
              animal_admitted_date: res.data?.admitted_at
            })
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

  const getPrescriptionList = async (animalId, medicalRecordId) => {
    console.log('Fetching prescription list with params:', animalId, medicalRecordId)
    try {
      setIsPrescriptionListLoading(true)

      const payload = {
        hospital_id: hospital?.id || '',
        animal_id: animal_id || animalId || '',
        medical_type: 'prescription',
        type: 'active',
        generate_for_date: new Date().toISOString().split('T')[0],
        medical_record_id: medical_record_id || medicalRecordId || '',
        hospital_case_id: id || ''
      }

      const response = await getPrescriptions(payload)

      if (response?.success) {
        const prescriptions = response?.data?.prescriptions?.map(item => ({
          ...item,
          status: item?.status ? item?.status?.toLowerCase() : null
        }))
        setMedicationData(prescriptions)
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {
      console.error('Error fetching prescription list:', error)

      Toaster({ type: 'error', message: error || 'Something went wrong' })
    } finally {
      setIsPrescriptionListLoading(false)
    }
  }

  // Add this after the existing useEffect for getPatientInfo
  useEffect(() => {
    return () => {
      debouncedBatchSearch.cancel()
      debouncedSearch.cancel()
    }
  }, [debouncedBatchSearch, debouncedSearch])

  function toISTISOString(date) {
    if (!date) return ''

    return moment(date).utcOffset('+05:30').format('YYYY-MM-DDTHH:mm:ss.SSSZ')
  }

  function convertUTCToLocaltime(date) {
    if (!date) return ''
    const stillUtc = moment.utc(date).toDate()

    const local = moment(stillUtc).local(true).format('hh : mm : A') // 👈 adds leading zero + spaces around colons

    return local
  }

  const resetForm = useCallback(() => {
    Object.keys(defaultValues).forEach(key => {
      setValue(key, defaultValues[key])
    })
    setSelectedMedicine(null)
    setTemporarilySelectedMedicine(null)
  }, [setValue])

  // Then call resetForm() after successful submission

  const handleScheduledPrescription = async (
    data,
    medicalMasterData,
    medical_record_id,
    temporarilySelectedMedicine
  ) => {
    try {
      setIsSubmitting(true)
      const interval = medicalMasterData?.prescriptionDuration?.find(item => item?.value === data?.dosageDuration?.unit)
      const frequency = medicalMasterData?.prescriptionFrequency?.find(item => item?.id == data.frequency)

      const deliveryRoute = medicalMasterData?.prescriptionDeliveryRoute?.find(
        item => item?.route_abbr === data.deliveryRoute
      )

      // Prepare schedule doses array
      const scheduleDoses = data.schedules.map((schedule, index) => ({
        id: '',
        time: schedule?.time ? convertUTCToLocaltime(schedule.time) : '',
        quantity: schedule.quantity,
        unit_id: getUnitIdFromName(schedule?.unit, medicalMasterData),
        unit_name: schedule.unit,
        string_id: getStringIdFromUnitName(schedule?.unit, medicalMasterData)
      }))

      // Prepare the main payload
      const payload = {
        medical_record_id: medical_record_id,
        request_from: 'hospital',
        hospital_case_id: id,
        data: JSON.stringify([
          {
            id: temporarilySelectedMedicine?.id, // Prescription id
            // fields addeda as api was not working as expected
            label: temporarilySelectedMedicine?.name,
            name: temporarilySelectedMedicine?.name,
            total_qty: temporarilySelectedMedicine?.total_qty || 0,
            total_central_store_qty: temporarilySelectedMedicine?.total_central_store_qty || 0,
            total_local_store_qty: temporarilySelectedMedicine?.total_local_store_qty || 0,

            frequency_key: frequency?.string_id || '',
            frequency_id: frequency?.id || '',
            frequency: data?.frequency,
            frequency_string_id: frequency?.translation_string_id || '',

            schedule_doses: scheduleDoses,

            interval: interval?.value || '',
            interval_id: interval?.id || '',
            interval_string_id: interval?.string_id || '',

            duration_qty: data.dosageDuration?.value?.toString() || '1',
            duration_id: interval?.id || '',
            duration: data.dosageDuration?.value
              ? `${data?.dosageDuration?.value} ${data?.dosageDuration?.unit}`
              : '1 days',
            duration_string_id: interval?.string_id || '',
            duration_type: data.dosageDuration?.unit
              ? data.dosageDuration.unit.charAt(0).toUpperCase() + data.dosageDuration.unit.slice(1)
              : 'Days',

            notes: data?.notes || '',

            delivery_route_name: data?.deliveryRoute || '',
            delivery_route_id: deliveryRoute?.id || '',
            delivery_route_string_id: deliveryRoute?.string_id || '',

            start_date: toISTISOString(data.prescriptionStartDate),
            end_date: isOneTimeFrequency
              ? toISTISOString(data.prescriptionStartDate)
              : calculateEndDate(data.prescriptionStartDate, data.dosageDuration),

            restart_reason: '',
            stop_reason: '',
            will_restart: false,
            side_effect: false,
            created_for: 'SINGLE',

            administer_date: toISTISOString(data.prescriptionStartDate),

            batch_list: [],
            dose_type: 'fixed_dose'

            // controlled_substance: temporarilySelectedMedicine?.controlled_substance || 0,
            // side_effect: false,
            // medical_record_id: medical_record_id,
            // created_for: 'medical',
            // dose_type: data.doseType,
            // status: 'active',
            // will_restart: false,
            // dosage: null
          }
        ])
      }

      // API call to add prescription
      // Uncomment and use your actual API function
      const response = await addPrescription(payload)

      // For now, just log the payload
      if (response?.success) {
        Toaster({ type: 'success', message: response?.message })

        // Reset form values to default after successful submission
        resetForm()

        // Refresh prescription list
        await getPrescriptionList()

        return response
      } else {
        Toaster({ type: 'error', message: response?.message })

        return null
      }
    } catch (error) {
      console.error('Error in handleScheduledPrescription:', error)

      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDirectAdminister = async (data, medicalMasterData, medical_record_id, temporarilySelectedMedicine) => {
    try {
      setIsSubmitting(true)
      const frequency = medicalMasterData?.prescriptionFrequency?.find(item => item?.id == data.frequency)

      const deliveryRoute = medicalMasterData?.prescriptionDeliveryRoute?.find(
        item => item?.route_abbr === data.deliveryRoute
      )
      const interval = medicalMasterData?.prescriptionDuration?.find(item => item?.value === data?.dosageDuration?.unit)

      // Find the selected batch from batchList
      const selectedBatch = batchList?.find(item => {
        const batchNo = typeof data.batchNumber === 'object' ? data.batchNumber?.batch_no : data.batchNumber

        return item?.batch_no === batchNo
      })

      // Map schedule doses from form data
      const scheduleDoses = data.schedules.map((schedule, index) => ({
        id: '',
        time: schedule?.time ? convertUTCToLocaltime(schedule.time) : '',
        quantity: schedule.quantity,
        unit_id: getUnitIdFromName(schedule?.unit, medicalMasterData),
        unit_name: schedule.unit,
        string_id: getStringIdFromUnitName(schedule?.unit, medicalMasterData)
      }))

      // Construct batch list for payload
      const batchListPayload = [
        {
          id: selectedBatch?.id,
          label: '',
          selectedAnimal: [
            {
              animal_id: animal_id,
              selectType: 'animal'
            }
          ],
          expiryDate: selectedBatch?.expiry_date || '',
          batchNumber: typeof data.batchNumber === 'object' ? data.batchNumber?.batch_no : data.batchNumber || '',
          wastage: data.wastageQuantity || '',
          wastageUnit: data.wastageUOM || '',
          notes: data.wastageNotes || '',
          frequencyValue: data.frequency || '',
          frequencyId: frequency?.id || '',

          totalAnimal: []
        }
      ]

      const payload = {
        record_date:
          toISTISOString(data.prescriptionStartDate)?.replace('T', ' ').slice(0, 19) ||
          toISTISOString(new Date()).replace('T', ' ').slice(0, 19),
        case_type: 1,
        medical_record_type: 'SINGLE',
        animal_id: animal_id ? JSON.stringify([animal_id]) : JSON.stringify([]),
        created_for: 'DIRECT_ADMINISTER',
        note: data.notes || '',
        request_from: 'hospital_module',
        medical_record_id: medical_record_id,
        hospital_case_id: id,
        prescription: JSON.stringify([
          {
            id: temporarilySelectedMedicine?.id,
            label: temporarilySelectedMedicine?.name,
            name: temporarilySelectedMedicine?.name,
            total_qty: temporarilySelectedMedicine?.total_qty || 0,
            total_central_store_qty: temporarilySelectedMedicine?.total_central_store_qty || 0,
            total_local_store_qty: temporarilySelectedMedicine?.total_local_store_qty || 0,

            frequency_key: frequency?.string_id || '',
            frequency_id: frequency?.id || '',
            frequency: data?.frequency,
            frequency_string_id: frequency?.translation_string_id || '',

            schedule_doses: scheduleDoses,

            interval: interval?.value || '',
            interval_id: interval?.id || '',
            interval_string_id: interval?.string_id || '',

            duration_qty: data.dosageDuration?.value?.toString() || '1',
            duration_id: interval?.id || '',
            duration: data.dosageDuration?.value
              ? `${data?.dosageDuration?.value} ${data?.dosageDuration?.unit}`
              : '1 days',
            duration_string_id: interval?.string_id || '',
            duration_type: data.dosageDuration?.unit
              ? data.dosageDuration.unit.charAt(0).toUpperCase() + data.dosageDuration.unit.slice(1)
              : 'Days',

            notes: data.wastageNotes || '',

            delivery_route_name: data?.deliveryRoute || '',
            delivery_route_id: deliveryRoute?.id || '',
            delivery_route_string_id: deliveryRoute?.string_id || '',

            start_date: isOneTimeFrequency
              ? toISTISOString(data.prescriptionStartDate)
              : calculateStartDate(data.prescriptionStartDate, data.dosageDuration),
            end_date: toISTISOString(data.prescriptionStartDate),

            restart_reason: '',
            stop_reason: '',
            will_restart: false,
            side_effect: false,
            created_for: 'DIRECT_ADMINISTER',
            administer_date: toISTISOString(data.prescriptionStartDate)?.slice(0, 10) || '',

            batch_list: batchListPayload,
            request_from: 'hospital_module',
            dose_type: 'fixed_dose',
            files: data.batchImage ? [data.batchImage] : [],
            1: data?.attachment?.[0] && data?.attachment[0]
          }
        ])
      }

      const response = await addDirectAdministerPrescription(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Direct administer record added successfully' })
        resetForm()

        // Refresh prescription list
        await getPrescriptionList()

        return response
      } else {
        Toaster({ type: 'error', message: response?.message })
        console.error('Failed to add direct administer record')

        return null
      }
    } catch (error) {
      console.error('Error in handleDirectAdminister:', error)

      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitHandler = handleSubmit(async data => {
    try {
      const isDirectAdminister = data.selectMedicineType === 'Direct Administer'
      let response = null
      if (isDirectAdminister) {
        response = await handleDirectAdminister(data, medicalMasterData, medical_record_id, temporarilySelectedMedicine)
      } else {
        response = await handleScheduledPrescription(
          data,
          medicalMasterData,
          medical_record_id,
          temporarilySelectedMedicine
        )
      }

      if (response?.success) {
        if (response?.success) {
          // Reset form values to default after successful submission
          resetForm()
        }
      }
    } catch (error) {
      console.error('🚨 Error in submitHandler:', error)
    }
  })

  const prescriptionSubmitHandler = handleSubmit(async data => {
    const interval = medicalMasterData?.prescriptionDuration?.find(item => item?.value === data?.dosageDuration?.unit)
    const frequency = medicalMasterData?.prescriptionFrequency?.find(item => item?.id == data.frequency)

    const deliveryRoute = medicalMasterData?.prescriptionDeliveryRoute?.find(
      item => item?.route_abbr === data.deliveryRoute
    )

    // Prepare schedule doses array
    const scheduleDoses = data.schedules.map((schedule, index) => ({
      id: '',
      time: schedule?.time ? convertUTCToLocaltime(schedule.time) : '',
      quantity: schedule.quantity,
      unit_id: getUnitIdFromName(schedule?.unit, medicalMasterData),
      unit_name: schedule.unit,
      string_id: getStringIdFromUnitName(schedule?.unit, medicalMasterData)
    }))

    const payload = {
      medical_record_id: medical_record_id,
      request_from: 'hospital',
      hospital_case_id: id,
      data: [
        {
          id: temporarilySelectedMedicine?.id, // Prescription id
          label: temporarilySelectedMedicine?.name,
          name: temporarilySelectedMedicine?.name,
          generic_name: temporarilySelectedMedicine?.generic_name, //new added
          total_qty: temporarilySelectedMedicine?.total_qty || 0,
          total_central_store_qty: temporarilySelectedMedicine?.total_central_store_qty || 0,
          total_local_store_qty: temporarilySelectedMedicine?.total_local_store_qty || 0,

          frequency_key: frequency?.string_id || '',
          frequency_id: frequency?.id || '',
          frequency: data?.frequency,
          frequency_string_id: frequency?.translation_string_id || '',
          frequency_name: frequency?.label, //new added

          schedule_doses: scheduleDoses,

          interval: interval?.value || '',
          interval_id: interval?.id || '',
          interval_string_id: interval?.string_id || '',

          duration_qty: data.dosageDuration?.value?.toString(),
          duration_id: interval?.id || '',
          duration: `${data?.dosageDuration?.value} ${data?.dosageDuration?.unit}`,
          duration_string_id: interval?.string_id || '',
          duration_type: data.dosageDuration.unit.charAt(0).toUpperCase() + data.dosageDuration.unit.slice(1),

          notes: data?.notes || '',

          delivery_route_name: data?.deliveryRoute || '',
          delivery_route_id: deliveryRoute?.id || '',
          delivery_route_string_id: deliveryRoute?.string_id || '',
          delivery_route_label: deliveryRoute?.label, //new added

          start_date: toISTISOString(data.prescriptionStartDate),
          end_date: calculateEndDate(data.prescriptionStartDate, data.dosageDuration),

          restart_reason: '',
          stop_reason: '',
          will_restart: false,
          side_effect: false,
          created_for: 'SINGLE',

          administer_date: toISTISOString(data.prescriptionStartDate),

          batch_list: [],
          dose_type: data.doseType
        }
      ]
    }
    console.log('payload', payload)

    if (discharge_tab === 'TransferHospital' || discharge_tab === 'TransferEnclosure') {
      const newMedicine = payload.data[0]

      // Determine which context key to use
      const tempKey = discharge_tab === 'TransferHospital' ? 'transfer_temp_medicines' : 'enclosure_temp_medicines'

      // Get the existing array from context
      const existing = data[tempKey] || []
      const alreadyExists = existing.some(med => med.id === newMedicine.id)

      // Merge new medicine into list (avoid duplicates)
      const updatedList = alreadyExists
        ? existing.map(med => (med.id === newMedicine.id ? newMedicine : med))
        : [newMedicine, ...existing]

      // Save to context under the correct key
      updateState(tempKey, updatedList)

      setTimeout(() => {
        router.push({
          pathname: `/hospital/inpatient/${id}`,
          query: { ...router.query, discharge_tab, tab: 'discharge' }
        })
      }, 0)

      return
    } else {
      submitHandler(data)
    }
  })

  const getUnitIdFromName = (unitName, medicalMasterData) => {
    const unit = medicalMasterData?.prescriptionDosageMeasurementType?.find(
      item => item.unit_name === unitName || item.uom_abbr === unitName
    )

    return unit?.id || '8' // Default to 8 if not found
  }

  const getStringIdFromUnitName = (unitName, medicalMasterData) => {
    const unit = medicalMasterData?.prescriptionDosageMeasurementType?.find(
      item => item.unit_name === unitName || item.uom_abbr === unitName
    )

    return unit?.string_id || 'antz-prescription-dosage.t'
  }

  const calculateEndDate = (startDate, dosageDuration) => {
    if (!startDate || !dosageDuration?.value) return ''

    const start = moment(startDate)
    let endDate = moment(startDate)

    const durationValue = parseInt(dosageDuration.value)

    switch (dosageDuration.unit) {
      case 'days':
        endDate = start.add(durationValue, 'days')
        break
      case 'weeks':
        endDate = start.add(durationValue, 'weeks')
        break
      case 'months':
        endDate = start.add(durationValue, 'months')
        break
      case 'years':
        endDate = start.add(durationValue, 'years')
        break
      default:
        endDate = start.add(durationValue, 'days')
    }

    // Return proper ISO 8601 UTC string
    return endDate.toISOString()
  }

  const calculateStartDate = (endDate, dosageDuration) => {
    if (!endDate || !dosageDuration?.value) return ''

    const end = moment(endDate)
    let startDate = moment(endDate)

    const durationValue = parseInt(dosageDuration.value)

    switch (dosageDuration.unit) {
      case 'days':
        startDate = end.subtract(durationValue, 'days')
        break
      case 'weeks':
        startDate = end.subtract(durationValue, 'weeks')
        break
      case 'months':
        startDate = end.subtract(durationValue, 'months')
        break
      case 'years':
        startDate = end.subtract(durationValue, 'years')
        break
      default:
        startDate = end.subtract(durationValue, 'days')
    }

    // Return proper ISO 8601 UTC string
    return startDate.toISOString()
  }

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
            prescribedMedicines={medicationData}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 5, lg: 5 }}>
          <ScheduleMedicine
            medicalMasterData={medicalMasterData}
            control={control}
            setValue={setValue}
            getValues={getValues}
            errors={errors}
            isMedicineSelected={temporarilySelectedMedicine?.id}
            selectedMedicineTo={watch('selectMedicineType')}
            batchList={batchList}
            batchLoading={batchLoading}
            handleBatchSearch={handleBatchSearch}
            isControlledSubstance={temporarilySelectedMedicine?.controlled_substance === 1}
            isOneTimeFrequency={isOneTimeFrequency}
            endsOn={endsOn}
          />
        </Grid>
      </Grid>

      <ActionButtons
        cancelLabel='CANCEL'
        addLabel={watch('selectMedicineType') === 'Direct Administer' ? 'Administer' : 'Schedule'}
        onCancel={handleCancel}
        isSubmitLoading={isSubmitting}
        onAdd={prescriptionSubmitHandler}
        width={200}
        height={50}
      />
    </Box>
  )
}
