import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Box, Grid, Typography, Button, useMediaQuery } from '@mui/material'
import AnimalDetails from 'src/views/pages/hospital/symptoms/AnimalDetails'
import { useTheme } from '@mui/material/styles'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
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
  getIntervalList,
  getMedicineBatches,
  getPrescriptionDetails,
  getPrescriptions,
  getSideEffectMedicines,
  stopPrescription
} from 'src/lib/api/hospital/prescription'
import Utility from 'src/utility'
import moment from 'moment'
import Toaster from 'src/components/Toaster'
import { useHospital } from 'src/context/HospitalContext'
import { useDynamicStateContext } from 'src/context/DynamicStatesContext'
import dayjs from 'dayjs'
import AnimalInfoCard from 'src/views/pages/hospital/inpatient/AnimalInfoCard'
import BottomActionBar from 'src/views/utility/BottomActionBar'
import ConfirmationDialog from 'src/components/confirmation-dialog'

const STORAGE_KEY = 'medical_record_data'

export default function AddMedicineToPrescription() {
  const theme = useTheme()
  const router = useRouter()
  const { id, medicine_edit_id, discharge_tab, fromPage, date, prescriptionId } = router.query

  const { data, updateState } = useDynamicStateContext()
  const medicalRecordData = data[STORAGE_KEY] || {}

  const editingMedicine = useMemo(() => {
    const list = discharge_tab === 'TransferEnclosure' ? data.enclosure_medicines : data.transfer_medicines

    if (!list) return null

    // fallback to id matching
    if (medicine_edit_id) {
      const result = list.find(med => med.id?.toString() === medicine_edit_id?.toString())

      return result
    }

    return null
  }, [data, medicine_edit_id, discharge_tab])

  // Form validation schema
  const prescriptionSchema = yup.object({
    // Common fields for both Schedule and Direct Administer
    selectedMedicineId: yup.string(),

    selectedMedicine: yup.object().nullable(),

    selectMedicineType: yup
      .string()
      .oneOf(['Schedule', 'Direct Administer'], 'Please select medicine type')
      .required('Please select medicine type'),
    frequency: yup.string().required('Please select a frequency'),
    interval: yup.string().when(['selectMedicineType', 'frequency'], {
      is: frequency => {
        const isOneTime = frequency === '2' || frequency === 2

        return !isOneTime
      },
      then: schema => schema.required('Please select a interval'),
      otherwise: schema => schema.nullable().notRequired()
    }),

    schedules: yup
      .array()
      .of(
        yup.object({
          time: yup
            .string()
            .required('Time is required')
            .test('valid-time-for-today', function (value) {
              const { selectMedicineType, frequency, prescriptionStartDate } = this.from[1].value

              // Only validate for Direct Administer + One Time + Today
              if (selectMedicineType !== 'Direct Administer') {
                return true
              }

              const isOneTime = frequency === '2' || frequency === 2
              if (!isOneTime) {
                return true
              }

              if (!value || !prescriptionStartDate) {
                return true
              }

              const selectedDate = moment(prescriptionStartDate)
              const today = moment()

              // Only validate if selected date is today
              if (!selectedDate.isSame(today, 'day')) {
                return true
              }

              const selectedTime = moment(value)
              const now = moment()

              // Check if selected time is in the future
              if (selectedTime.isAfter(now)) {
                return this.createError({
                  message: "Time cannot be in the future for today's date"
                })
              }

              return true
            }),
          quantity: yup
            .number()
            .typeError('Quantity is required')
            .moreThan(0, 'Quantity must be greater than 0')
            .max(100000, 'Quantity cannot exceed 100000')
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
            const timeStr = moment(schedule.time).format('HH:mm')

            return timeStr
          })
          .filter(Boolean)

        const uniqueTimes = new Set(times)
        if (times.length !== uniqueTimes.size) {
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

    prescriptionStartDate: yup
      .string()
      .required('Start date is required')
      .test('valid-direct-admin-date', function (value) {
        const { selectMedicineType, frequency, prescriptionEndDate } = this.parent

        // Only validate for Direct Administer with regular intervals (not one-time)
        const isOneTime = frequency === '2' || frequency === 2
        if (selectMedicineType !== 'Direct Administer' || isOneTime) {
          return true
        }

        if (!value || !prescriptionEndDate) {
          return true // Let required validation handle empty values
        }

        const startDate = moment(value)
        const endDate = moment(prescriptionEndDate)
        const admittedDate = moment(medicalRecordData?.animal_admitted_date)

        // Check if start date is before admitted date
        if (startDate.isBefore(admittedDate, 'day')) {
          return this.createError({
            message: `Start date cannot be before admission date (${admittedDate.format('DD MMM YYYY')})`
          })
        }

        // Check if start date is after end date
        if (startDate.isAfter(endDate, 'day')) {
          return this.createError({
            message: 'Start date cannot be after end date'
          })
        }

        return true
      }),

    prescriptionEndDate: yup.string().when(['selectMedicineType', 'frequency'], {
      is: (selectMedicineType, frequency) => {
        const isOneTime = frequency === '2' || frequency === 2

        return selectMedicineType === 'Direct Administer' && !isOneTime
      },
      then: schema => schema.required('End date is required'),
      otherwise: schema => schema.nullable().notRequired()
    }),

    dosageDuration: yup.object().when(['frequency', 'selectMedicineType'], {
      is: (frequency, selectMedicineType) => {
        const isOneTime = frequency === '2' || frequency === 2

        // Make dosageDuration NOT required for Direct Administer with regular intervals
        const isDirectAdministerRegular = selectMedicineType === 'Direct Administer' && !isOneTime

        return !isOneTime && !isDirectAdministerRegular
      },
      then: schema =>
        schema
          .shape({
            value: yup
              .number()
              .transform((value, originalValue) => (originalValue === '' ? undefined : value))
              .min(1, 'Duration must be at least 1')
              .max(100000, 'Duration cannot exceed 100000')
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
    interval: '',

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
    prescriptionEndDate: null,
    dosageDuration: {
      value: 0,
      unit: null
    },
    notes: '',
    wastageQuantity: null,
    wastageUOM: null,
    batchNumber: null,
    wastageNotes: null,
    batchImage: null
  }

  const animal_id = medicalRecordData?.animal_id
  const medical_record_id = medicalRecordData?.medical_record_id

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    getValues,
    reset,
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
  const [intervalList, setIntervalList] = useState([])
  const [batchList, setBatchList] = useState([])
  const [batchSearchQuery, setBatchSearchQuery] = useState('')
  const [batchLoading, setBatchLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPrescriptionListLoading, setIsPrescriptionListLoading] = useState(false)
  const [medicationData, setMedicationData] = useState([])
  const [endsOn, setEndsOn] = useState(null)
  const [cancelOrCloseText, setCancelOrCloseText] = useState('CANCEL')
  const [medicineDetail, setMedicineDetail] = useState(null)
  const [sideEffectMedicinesLoading, setSideEffectMedicinesLoading] = useState(false)
  const [showSideEffectWarning, setShowSideEffectWarning] = useState(false)
  const [warningMedicine, setWarningMedicine] = useState(null)
  const [sideEffectMedicinesCache, setSideEffectMedicinesCache] = useState(null)

  const { selectedHospital: hospital } = useHospital()

  // Watch frequency to determine if it's "one_time"
  const selectedFrequency = watch('frequency')
  const isOneTimeFrequency = selectedFrequency === '2' || selectedFrequency === 2

  // Watch for changes in start date and duration to calculate end date
  const prescriptionStartDate = watch('prescriptionStartDate')
  const prescriptionEndDate = watch('prescriptionEndDate')
  const dosageDuration = watch('dosageDuration')
  const intervalItem = watch('interval')
  const selectMedicineType = watch('selectMedicineType')

  const isSmallerDevices = useMediaQuery(theme.breakpoints.down('sm'))

  // Helper function to calculate duration dynamically
  function calculateDynamicDuration(startDate, endDate) {
    if (!startDate || !endDate) {
      return '1 days' // Default fallback
    }

    // Convert to dayjs objects ignoring time
    const start = dayjs(startDate).startOf('day')
    const end = dayjs(endDate).startOf('day')

    // If dates are the same, return "1 days"
    if (start.isSame(end, 'day')) {
      return '1 days'
    }

    // Calculate difference in days
    const diffDays = end.diff(start, 'day') + 1 // +1 to include both start and end dates

    // Return formatted duration
    return `${diffDays} days`
  }

  // Calculate and update endsOn whenever relevant fields change
  useEffect(() => {
    if (prescriptionStartDate && !isOneTimeFrequency && selectMedicineType === 'Schedule') {
      // For regular intervals (not one-time) in Schedule mode
      if (dosageDuration?.value && dosageDuration?.unit) {
        // Schedule: Calculate END date (forward from start date)
        const calculatedEndDate = calculateEndDate(prescriptionStartDate, dosageDuration, intervalItem)
        if (calculatedEndDate) {
          const formattedDate = moment(calculatedEndDate).format('DD MMM YYYY')
          setEndsOn(formattedDate)
        } else {
          setEndsOn(null)
        }
      } else {
        setEndsOn(null)
      }
    } else {
      setEndsOn(null)
    }
  }, [
    prescriptionStartDate,
    prescriptionEndDate,
    dosageDuration?.value,
    dosageDuration?.unit,
    isOneTimeFrequency,
    selectMedicineType,
    intervalItem
  ])

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

  function getTimeDayjs(timeStr) {
    if (!timeStr) return dayjs()

    // If timeStr is already in "11:30 AM" format
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      return dayjs(timeStr, ['hh:mm A', 'h:mm A'])
    }

    // If timeStr is in "12:28:00" format
    const [hours, minutes] = timeStr.split(':').map(Number)

    return dayjs()
      .hour(hours)
      .minute(minutes || 0)
      .second(0)
  }

  const handleSetDefaultValues = data => {
    const frequency = frequencyData?.find(item => item?.string_id == data.prescription_frequency)
    const interval = intervalList?.find(item => item?.interval_string_id == data.interval_string_id)

    const deliveryRoute = medicalMasterData?.prescriptionDeliveryRoute?.find(
      item => item?.string_id == data.delivery_route_string_id
    )

    reset({
      frequency: frequency?.id || data.frequency || '',
      interval: interval?.id || data.interval || '',
      deliveryRoute: deliveryRoute?.value || '',

      prescriptionStartDate: data?.stop_date ? dayjs(data.stop_date) : null,

      dosageDuration: {
        value: data?.duration_qty || '0',
        unit: data?.duration?.split(' ')[1] || ''
      },

      notes: data.notes || '',

      wastageQuantity: '',
      wastageUOM: '',
      wastageNotes: '',

      batchNumber: '',
      batchImage: [],

      schedules:
        data.medicine_timings?.map(schedule => ({
          oldTime: getTimeDayjs(schedule.scheduled_time),
          createdAt: schedule.created_at,
          time: schedule.scheduled_time ? getTimeDayjs(schedule.scheduled_time) : dayjs(),
          quantity: schedule.scheduled_quantity || '',
          unit: schedule.scheduled_unit_name?.toLowerCase() || '',
          scheduled_dose_id: schedule?.scheduled_dose_id
        })) || [],
      selectMedicineType: 'Schedule'
    })
  }

  useEffect(() => {
    if (medicineDetail && medicalMasterData && frequencyData && fromPage === 'prescriptionDetail' && intervalList) {
      handleSetDefaultValues(medicineDetail)
      handleMedicineSelect({ id: medicineDetail?.medicine_id, name: medicineDetail?.medicine_name })
      setApiMedicineList([{ id: medicineDetail?.medicine_id, name: medicineDetail?.medicine_name }])
    }
  }, [fromPage, medicalMasterData, medicineDetail])

  const getDetails = async (data = {}) => {
    try {
      setMedicineLoading(true)

      const payload = {
        prescription_id: data?.id,
        date: date || '',
        group_prescription_id: data?.id
      }

      const response = await getPrescriptionDetails(payload)

      if (response?.success) {
        setMedicineDetail(response?.data)
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {
      Toaster({ type: 'error', message: error || 'Something went wrong' })
    } finally {
      setMedicineLoading(false)
    }
  }

  const fetchSideEffectMedicines = async () => {
    try {
      setSideEffectMedicinesLoading(true)

      const payload = {
        animal_id: JSON.stringify([animal_id])
      }

      const response = await getSideEffectMedicines(payload)

      if (response?.data) {
        return response?.data
      }
    } catch (error) {
      Toaster({ type: 'error', message: error || 'Something went wrong' })
      router.back()
    } finally {
      setSideEffectMedicinesLoading(false)
    }
  }

  // Helper function to check for side effects
  const checkForSideEffects = (sideEffectMedicines, selectedMedicineId) => {
    if (!sideEffectMedicines || !sideEffectMedicines.result) return false

    // Extract all medicine_ids from the result array
    const medicineIdsWithSideEffects = sideEffectMedicines.result
      .map(item => (item.medicine_id ? item.medicine_id.toString() : null))
      .filter(id => id !== null)

    // Check if selected medicine ID is in the list
    return medicineIdsWithSideEffects.includes(selectedMedicineId.toString())
  }

  const handleMedicineSelect = async medicine => {
    if (medicine) {
      if (fromPage === 'prescriptionDetail' || editingMedicine) {
        proceedWithMedicineSelection(medicine)

        return
      }

      let sideEffectMedicines

      // Use cached data if available, otherwise fetch
      if (sideEffectMedicinesCache !== null) {
        sideEffectMedicines = sideEffectMedicinesCache
      } else {
        sideEffectMedicines = await fetchSideEffectMedicines()

        // Cache the data for future use
        setSideEffectMedicinesCache(sideEffectMedicines)
      }

      // Check if selected medicine has caused side effects
      const hasSideEffects = checkForSideEffects(sideEffectMedicines, medicine.id)

      if (hasSideEffects) {
        // Show warning modal
        setShowSideEffectWarning(true)
        setWarningMedicine(medicine)

        return // Don't proceed with selection until user confirms
      } else {
        proceedWithMedicineSelection(medicine)
      }
    }
  }

  // Function to proceed with medicine selection after confirmation
  const proceedWithMedicineSelection = medicine => {
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

  // Function to handle user confirmation from modal
  const handleSideEffectConfirm = () => {
    if (warningMedicine) {
      proceedWithMedicineSelection(warningMedicine)
    }
    setShowSideEffectWarning(false)
    setWarningMedicine(null)
  }

  const handleSideEffectCancel = () => {
    setShowSideEffectWarning(false)
    setWarningMedicine(null)
    router.back()
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
        fetchIntervals()
        setMedicalMasterData({
          ...response?.data,

          // prescriptionFrequency: frequencyData || [],
          intervalList: [],
          prescriptionFrequency: [],
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

  const fetchIntervals = async () => {
    try {
      const response = await getIntervalList()
      if (response?.success) {
        setIntervalList(
          response?.data?.map(item => ({
            ...item,
            value: item.id
          })) || []
        )
        setMedicalMasterData(prevData => ({
          ...prevData,
          intervalList: response?.data?.map(item => ({
            ...item,
            value: item.id
          }))
        }))
      } else {
        setIntervalList([])
      }
    } catch (error) {
      console.error('Error fetching medical master data:', error.message)
    }
  }

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
    if (fromPage === 'prescriptionDetail' || medicine_edit_id) {
      return
    } else {
      setMedicineSearchQuery(value)
      debouncedSearch(value)
    }
  }

  const handleClearSearch = () => {
    setMedicineSearchQuery('')
    setPage(1)
    if (isSmallerDevices) {
      if (fromPage === 'prescriptionDetail' || medicine_edit_id) {
        return
      }
      setSelectedMedicine(null)
      setTemporarilySelectedMedicine(null)
    }
    if (fromPage === 'prescriptionDetail' || medicine_edit_id) {
      return
    } else {
      fetchMedicines('', 1, false)
    }
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
    if (fromPage === 'prescriptionDetail') {
      getDetails({
        id: prescriptionId
      })
    } else {
      fetchMedicines('', 1, true)
    }
    fetchMedicalMasterData()
  }, [])

  useEffect(() => {
    const getPatientInfo = async () => {
      setPatientLoading(true)
      try {
        await getPatientDetails(id).then(res => {
          if (res?.success === true) {
            setPatientData(res?.data)

            if (
              hospital?.id &&
              res.data?.animal_detail?.animal_id &&
              id &&
              res.data?.medical_record_id &&
              fromPage !== 'prescriptionDetail'
            ) {
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
      if (key === 'selectMedicineType') {
        setValue(key, watch('selectMedicineType'))
      } else {
        setValue(key, defaultValues[key])
      }
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
      const interval = medicalMasterData?.intervalList?.find(item => item?.value === data?.interval)
      const frequency = medicalMasterData?.prescriptionFrequency?.find(item => item?.id == data.frequency)

      const deliveryRoute = medicalMasterData?.prescriptionDeliveryRoute?.find(
        item => item?.route_abbr === data.deliveryRoute
      )

      const prescriptionDuration = medicalMasterData?.prescriptionDuration?.find(
        item => item?.value === data.dosageDuration?.unit
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
            frequency: frequency?.label || '',
            frequency_string_id: frequency?.translation_string_id || '',

            schedule_doses: scheduleDoses,

            interval: interval?.label || '',
            interval_id: interval?.id || '',
            interval_string_id: interval?.interval_string_id || '',

            duration_qty: frequency?.string_id === 'at_regular_intervals' ? data.dosageDuration?.value?.toString() : 0,
            duration_id: frequency?.string_id === 'at_regular_intervals' ? prescriptionDuration?.id : '2',
            duration: data.dosageDuration?.value
              ? `${data?.dosageDuration?.value} ${data?.dosageDuration?.unit}`
              : '0 days',
            duration_string_id:
              frequency?.string_id === 'at_regular_intervals'
                ? prescriptionDuration?.string_id
                : 'antz-prescription.days',
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
              : calculateEndDate(data.prescriptionStartDate, data.dosageDuration, interval?.value),

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

      // Calculate duration dynamically for Direct Administer with regular intervals
      let calculatedDuration = calculateDynamicDuration(data.prescriptionStartDate, data.prescriptionEndDate)

      const frequency = medicalMasterData?.prescriptionFrequency?.find(item => item?.id == data.frequency)

      const deliveryRoute = medicalMasterData?.prescriptionDeliveryRoute?.find(
        item => item?.route_abbr === data.deliveryRoute
      )
      const interval = medicalMasterData?.intervalList?.find(item => item?.value === data?.interval)

      // const prescriptionDuration = medicalMasterData?.prescriptionDuration?.find(
      //   item => item?.value === data.dosageDuration?.unit
      // )

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
      const batchListPayload =
        data.batchNumber?.batch_no || data.batchNumber
          ? [
              {
                id: selectedBatch?.id,
                label: '',
                selectedAnimal: [
                  {
                    animal_id: animal_id,
                    selectType: 'animal'
                  }
                ],
                expiryDate: selectedBatch?.expiry_date,
                batchNumber: typeof data.batchNumber === 'object' ? data.batchNumber?.batch_no : data.batchNumber,
                wastage: data.wastageQuantity,
                wastageUnit: data.wastageUOM,
                notes: data.wastageNotes,
                frequencyValue: data.frequency,
                frequencyId: frequency?.id,

                totalAnimal: []
              }
            ]
          : []

      const payload = {
        record_date: toISTISOString(new Date()).replace('T', ' ').slice(0, 19),

        // record_date:
        //   toISTISOString(data.prescriptionStartDate)?.replace('T', ' ').slice(0, 19) ||
        //   toISTISOString(new Date()).replace('T', ' ').slice(0, 19),
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

            interval: interval?.label || '',
            interval_id: interval?.id || '',
            interval_string_id: interval?.interval_string_id || '',

            duration_qty: calculatedDuration?.toString()?.split(' ')[0] || '1',
            duration_id: '2',
            duration: calculatedDuration,
            duration_string_id: 'antz-prescription.days',
            duration_type: 'Days',

            // duration_qty: frequency?.string_id === 'at_regular_intervals' ? data.dosageDuration?.value?.toString() : 1,
            // duration_id: frequency?.string_id === 'at_regular_intervals' ? prescriptionDuration?.id : '2',
            // duration: data.dosageDuration?.value
            //   ? `${data?.dosageDuration?.value} ${data?.dosageDuration?.unit}`
            //   : '1 days',
            // duration_string_id:
            //   frequency?.string_id === 'at_regular_intervals'
            //     ? prescriptionDuration?.string_id
            //     : 'antz-prescription.days',
            // duration_type: data.dosageDuration?.unit
            //   ? data.dosageDuration.unit.charAt(0).toUpperCase() + data.dosageDuration.unit.slice(1)
            //   : 'Days',

            notes: data.notes || '',

            delivery_route_name: data?.deliveryRoute || '',
            delivery_route_id: deliveryRoute?.id || '',
            delivery_route_string_id: deliveryRoute?.string_id || '',

            start_date: toISTISOString(data.prescriptionStartDate),
            end_date:
              isOneTimeFrequency || data.prescriptionStartDate.split('T')[0] === data.prescriptionEndDate.split('T')[0]
                ? toISTISOString(data.prescriptionStartDate)
                : toISTISOString(data.prescriptionEndDate),

            restart_reason: '',
            stop_reason: '',
            will_restart: false,
            side_effect: false,
            created_for: 'DIRECT_ADMINISTER',
            administer_date: toISTISOString(data.prescriptionStartDate)?.slice(0, 10) || '',

            batch_list: batchListPayload,
            request_from: 'hospital_module',
            dose_type: 'fixed_dose',
            files: data.batchImage ? data.batchImage : [],
            1: data.batchImage ? data.batchImage : []
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
          setCancelOrCloseText('CLOSE')
          resetForm()
        }
      }
    } catch (error) {
      console.error('🚨 Error in submitHandler:', error)
    }
  })

  function formatDateWithCurrentTime(date) {
    // Parse the input date
    const originalDate = new Date(date) // "Mon, 15 Dec 2025 00:37:06 GMT"

    // Get current date in local timezone
    const now = new Date()

    // Create new date with original date + current LOCAL time
    const result = new Date(
      originalDate.getUTCFullYear(), // Year from original GMT date
      originalDate.getUTCMonth(), // Month from original GMT date
      originalDate.getUTCDate(), // Date from original GMT date
      now.getHours(), // Current LOCAL hours (IST)
      now.getMinutes(), // Current LOCAL minutes (IST)
      now.getSeconds(), // Current LOCAL seconds (IST)
      now.getMilliseconds() // Current LOCAL milliseconds (IST)
    )

    return result.toISOString()
  }

  const handleRestartMedicine = async data => {
    try {
      setIsSubmitting(true)
      const interval = medicalMasterData?.intervalList?.find(item => item?.value === data?.interval)
      const frequency = medicalMasterData?.prescriptionFrequency?.find(item => item?.id == data.frequency)

      const deliveryRoute = medicalMasterData?.prescriptionDeliveryRoute?.find(
        item => item?.route_abbr === data.deliveryRoute
      )

      const scheduleDoses = data.schedules.map((schedule, index) => ({
        id: schedule?.scheduled_dose_id,
        time: schedule?.time ? convertUTCToLocaltime(schedule.time) : '',
        quantity: schedule.quantity,
        unit_id: getUnitIdFromName(schedule?.unit, medicalMasterData),
        old_time: schedule?.oldTime ? convertUTCToLocaltime(schedule.oldTime) : '',
        unit_name: schedule.unit,
        string_id: getStringIdFromUnitName(schedule?.unit, medicalMasterData),
        created_at: schedule?.createdAt
      }))

      const payload = {
        medical_record_id: medicineDetail?.medical_record_id,
        prescription_id: medicineDetail?.medicine_id,
        type: 'prescription',
        status: 'restart',
        note: data?.notes,
        medicine_details: {
          id: medicineDetail?.medicine_id,
          label: medicineDetail?.medicine_name,
          name: medicineDetail?.medicine_name,

          frequency_key: frequency?.string_id || '',
          frequency_id: frequency?.id || '',
          frequency: data?.frequency,
          frequency_string_id: frequency?.translation_string_id || '',

          schedule_doses: scheduleDoses,

          interval: interval?.label || '',
          interval_id: interval?.id || '',
          interval_string_id: interval?.interval_string_id || '',

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

          start_date: isOneTimeFrequency
            ? toISTISOString(data.prescriptionStartDate)
            : toISTISOString(data.prescriptionStartDate).replace('+05:30', 'Z'),
          end_date: isOneTimeFrequency
            ? toISTISOString(data.prescriptionStartDate)
            : formatDateWithCurrentTime(
                calculateEndDate(data.prescriptionStartDate, data.dosageDuration, interval?.value)
              ),

          restart_reason: '',
          stop_reason: '',
          side_effect: false,
          group_prescription_id: medicineDetail?.group_prescription_id || medicineDetail?.prescription_id
        }
      }
      const response = await stopPrescription(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message })
        router.back()
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {
      console.error('Error in handleRestartMedicine:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const prescriptionSubmitHandler = handleSubmit(async data => {
    const interval = medicalMasterData?.intervalList?.find(item => item?.value === data?.interval)
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

          interval: interval?.label || '',
          interval_id: interval?.id || '',
          interval_string_id: interval?.interval_string_id || '',

          duration_qty: data.dosageDuration?.value?.toString(),
          duration_id: interval?.id || '',

          // duration: `${data?.dosageDuration?.value} ${data?.dosageDuration?.unit}`,
          duration: data.dosageDuration?.value
            ? `${data?.dosageDuration?.value} ${data?.dosageDuration?.unit}`
            : '1 days',
          duration_string_id: interval?.string_id || '',

          //   duration_type: data.dosageDuration.unit.charAt(0).toUpperCase() + data.dosageDuration.unit.slice(1),
          duration_type: data.dosageDuration?.unit
            ? data.dosageDuration.unit.charAt(0).toUpperCase() + data.dosageDuration.unit.slice(1)
            : 'Days',

          notes: data?.notes || '',

          delivery_route_name: data?.deliveryRoute || '',
          delivery_route_id: deliveryRoute?.id || '',
          delivery_route_string_id: deliveryRoute?.string_id || '',
          delivery_route_label: deliveryRoute?.label, //new added

          start_date: toISTISOString(data.prescriptionStartDate),

          //  end_date: calculateEndDate(data.prescriptionStartDate, data.dosageDuration),
          end_date: isOneTimeFrequency
            ? toISTISOString(data.prescriptionStartDate)
            : calculateEndDate(data.prescriptionStartDate, data.dosageDuration, intervalItem),

          restart_reason: '',
          stop_reason: '',
          will_restart: false,
          side_effect: false,
          created_for: 'SINGLE',

          administer_date: toISTISOString(data.prescriptionStartDate),

          batch_list: [],

          //     dose_type: data.doseType,
          dose_type: 'fixed_dose',
          selectMedicineType: 'Schedule'
        }
      ]
    }

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
      router.back()

      return
    } else if (fromPage === 'prescriptionDetail') {
      handleRestartMedicine(data)
    } else {
      submitHandler(data)
    }
  })

  // Prefill form when editing a medicine from discharge
  useEffect(() => {
    if (!editingMedicine) return
    handleMedicineSelect(editingMedicine)
  }, [editingMedicine])

  // useEffect(() => {
  //   if (!fromPage) return
  //   if (fromPage === 'prescriptionDetail') handleMedicineSelect(editingMedicine)
  // }, [editingMedicine])

  const getUnitIdFromName = (unitName, medicalMasterData) => {
    const unit = medicalMasterData?.prescriptionDosageMeasurementType?.find(
      item => item.unit_name === unitName || item.uom_abbr === unitName
    )

    return unit?.id || ''
  }

  const getStringIdFromUnitName = (unitName, medicalMasterData) => {
    const unit = medicalMasterData?.prescriptionDosageMeasurementType?.find(
      item => item.unit_name === unitName || item.uom_abbr === unitName
    )

    return unit?.string_id || ''
  }

  const calculateEndDate = (startDate, dosageDuration, interval) => {
    if (!startDate || !dosageDuration?.value) return ''

    const start = moment(startDate.toISOString ? startDate.toISOString() : startDate)
    let endDate = start.clone()
    const durationValue = parseInt(dosageDuration.value)
    const intervalValue = parseInt(interval)

    // Handle special case for duration 0 - it should be same as start date
    if (durationValue === 0) {
      endDate = start.clone()
    } else {
      switch (dosageDuration.unit) {
        case 'days':
          endDate = start.add(durationValue - 1, 'days')
          break
        case 'weeks':
          endDate = start.add(7 * durationValue - 1, 'days')
          break
        case 'months':
          endDate = start.add(durationValue, 'months').subtract(1, 'day')
          break
        case 'years':
          endDate = start.add(durationValue, 'years').subtract(1, 'day')
          break
        default:
          endDate = start.add(durationValue - 1, 'days')
      }
    }

    return endDate.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
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
      <AnimalInfoCard
        backgroundColor={theme.palette.customColors.OnPrimary}
        image={patientData?.animal_detail?.default_icon}
        name={patientData?.animal_detail?.common_name}
        scientificName={patientData?.animal_detail?.complete_name}
        age={`${patientData?.animal_detail?.age}`}
        gender={`${patientData?.animal_detail?.sex}`}
        additionalFields={[
          { label: 'AID', value: patientData?.animal_detail?.animal_id },
          { label: 'Admitted days', value: patientData?.admitted_for_day },
          { label: 'Location', value: `${patientData?.bed_name}, ${patientData?.room_name}` },
          { label: 'Consulting Veterinarian', value: patientData?.attend_by_full_name }
        ]}
        isLoading={patientLoading}
      />
      <Box
        sx={{
          backgroundColor: theme.palette.common.white,
          borderRadius: '8px',
          p: 6,
          mt: 6,
          background: theme.palette.common.white
        }}
      >
        <Grid container spacing={5} className='match-height' sx={{ alignItems: 'center' }}>
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
          {!discharge_tab && !fromPage && (
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
          )}
        </Grid>
        <Grid container spacing={5} className='match-height' sx={{ pt: 6 }}>
          <Grid size={{ xs: 12, md: 6, lg: 6 }}>
            <PrescriptionMedicineList
              medicineList={apiMedicineList.length > 0 ? apiMedicineList : []}
              temporarilySelectedMedicine={temporarilySelectedMedicine}

              // selectedMedicine={selectedMedicine ? selectedMedicine.label : null}
              selectedMedicine={selectedMedicine ? selectedMedicine?.id : null}
              onSelect={handleMedicineSelect}
              searchQuery={
                fromPage === 'prescriptionDetail' || medicine_edit_id
                  ? temporarilySelectedMedicine?.name
                  : medicineSearchQuery
              }
              handleSearchChange={handleMedicineSearch}
              handleClearSearch={handleClearSearch}
              isDirectAdminister={watch('selectMedicineType') === 'Direct Administer'}
              handleScroll={handleScroll}
              loading={medicineLoading}
              searching={searching}
              error={errors.selectedMedicine?.message || errors.selectedMedicineId?.message}
              prescribedMedicines={medicationData}
              control={control}
              errors={errors}
              setValue={setValue}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 6 }}>
            <ScheduleMedicine
              medicalMasterData={medicalMasterData}
              control={control}
              setValue={setValue}
              getValues={getValues}
              errors={errors}
              isMedicineSelected={temporarilySelectedMedicine?.id || sideEffectMedicinesLoading}
              selectedMedicineTo={watch('selectMedicineType')}
              batchList={batchList}
              batchLoading={batchLoading}
              handleBatchSearch={handleBatchSearch}
              isControlledSubstance={temporarilySelectedMedicine?.controlled_substance === 1}
              isOneTimeFrequency={isOneTimeFrequency}
              endsOn={endsOn}
              stopDate={medicineDetail?.stop_date}
              reset={reset}
              loadingSideEffects={sideEffectMedicinesLoading}
            />
          </Grid>
        </Grid>
      </Box>

      <BottomActionBar
        submitLabel={
          fromPage === 'prescriptionDetail'
            ? 'Restart Medicine'
            : watch('selectMedicineType') === 'Direct Administer'
            ? 'Administer'
            : 'Schedule'
        }
        cancelLabel={cancelOrCloseText}
        onSubmit={prescriptionSubmitHandler}
        loading={isSubmitting}
        disabled={temporarilySelectedMedicine?.id ? false : true}
        cancelBtnStyle={{
          borderColor: theme.palette.customColors.OnSurfaceVariant,
          color: theme.palette.customColors.OnSurfaceVariant,
          borderRadius: 0.5,
          minHeight: '50px',
          minWidth: '200px'
        }}
        submitBtnStyle={{
          backgroundColor: theme.palette.primary.main,
          borderRadius: 0.5,
          minWidth: '200px',
          minHeight: '50px'
        }}
        onCancel={handleCancel}
      />
      {showSideEffectWarning && warningMedicine && (
        <ConfirmationDialog
          dialogBoxStatus={showSideEffectWarning && warningMedicine}
          onClose={handleSideEffectCancel}
          title={'Caused adverse side effects, Do you want to add?'}
          cancelText={'No'}
          confirmBtnStyle={{ background: theme.palette.primary.main, py: 2 }}
          image={'/images/warning-icon.svg'}
          imgStyle={{ background: theme.palette.customColors.mdAntzNeutral, p: 4 }}
          confirmAction={handleSideEffectConfirm} // Run actual add logic here
          loading={sideEffectMedicinesLoading}
          ConfirmationText={'YES'}
          description={''}
        />
      )}
    </Box>
  )
}
