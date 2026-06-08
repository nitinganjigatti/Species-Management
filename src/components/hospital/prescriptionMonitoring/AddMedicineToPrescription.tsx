'use client'

import React, { useState, useEffect, useCallback, useMemo, useContext, BaseSyntheticEvent } from 'react'
import { Box, Grid, Typography, useMediaQuery } from '@mui/material'
import { Theme, useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { FieldErrors, FieldValues, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import TreatmentTypeRadioButtons from 'src/views/pages/hospital/utility/TreatmentTypeRadioButtons'
import PrescriptionMedicineListRaw from 'src/views/pages/hospital/prescription-monitoring/PrescriptionMedicineList'
import ScheduleMedicineRaw from 'src/views/pages/hospital/prescription-monitoring/ScheduleMedicine'
const PrescriptionMedicineList: any = PrescriptionMedicineListRaw
const ScheduleMedicine: any = ScheduleMedicineRaw
import { getPatientDetails } from 'src/lib/api/hospital/incomingPatient'
import useSafeRouter from 'src/hooks/useSafeRouter'
import { useSearchParams } from 'next/navigation'
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
  stopPrescription,
  validatePrescriptionUpdate
} from 'src/lib/api/hospital/prescription'
import Utility from 'src/utility'
import moment from 'moment'
import Toaster from 'src/components/Toaster'
import { useHospital } from 'src/context/HospitalContext'
import { useDispatch, useSelector } from 'react-redux'
import { updateState } from 'src/store/slices/hospital/hospitalSlice'
import dayjs, { Dayjs } from 'dayjs'
import AnimalInfoCard from 'src/views/pages/hospital/inpatient/AnimalInfoCard'
import BottomActionBarRaw from 'src/views/utility/BottomActionBar'
import ConfirmationDialog from 'src/components/confirmation-dialog'
const BottomActionBar: any = BottomActionBarRaw
import { AuthContext } from 'src/context/AuthContext'
import { Id } from 'src/types/hospital'
import { DateRangeValue, PatientDetailsData } from 'src/types/hospital/models'
import { AddPrescriptionParamList, AddPrescriptionScheduleDose, DirectAdministerScheduleDose, MedicalCaseType, MedicineBatchList, PrescriptionDeliveryRoute, PrescriptionDetails, PrescriptionDosageMeasurementType, PrescriptionDurationOption, PrescriptionFrequencyList, PrescriptionIntervalList, PrescriptionList, PrescriptionMeasurementType } from 'src/types/hospital/models/prescription'
import { AddDirectAdministerParams, AddDirectAdministerResponse, AddPrescriptionParams, AddPrescriptionResponse, GetPrescriptionListParams, GetPrescriptionMedicineSideEffectResponse, RestartMedicineParams, UpdatePrescriptionParams } from 'src/types/hospital/api/PrescriptionMonitoring/prescription'
import { GetPrescriptionDetailsParams } from 'src/types/hospital/api/PrescriptionMonitoring/prescriptionDetails'
import { FilterDate } from 'src/types/medical'
import { SubmitHandler } from 'react-hook-form'
import { MedicineSideEffect } from 'src/types/housing'

const STORAGE_KEY = 'medical_record_data'

interface AddMedicineToPrescriptionProps {
  from?: any
  params?: any
}

export interface MedicineIdentifier {
  id: Id | null
}

export interface MedicineDetails {
  id: Id
  name?: string
  generic_name?: string
  total_qty?: number | string
  total_central_store_qty?: number | string
  total_local_store_qty?: number | string
  controlled_substance?: number | string
}

export interface ApiMedicineState {
  id: Id
  name: string
}

export interface MedicalMasterFormData {
  caseTypes?: MedicalCaseType[]
  prescriptionDeliveryRoute: PrescriptionDeliveryRouteType[]
  prescriptionFrequency: PrescriptionFrequencyType[]
  intervalList?: PrescriptionIntervalType[]
  prescriptionDuration: PrescriptionDurationType[]
  prescriptionDosageMeasurementType?: PrescriptionDosageMeasurementType[]
  prescriptionMeasurementType?: PrescriptionMeasurementType[]
}

export interface PrescriptionDeliveryRouteType extends PrescriptionDeliveryRoute {
  string_id?: string
  delivery_route_string_id?: string
  value: string
  label: string
}

export interface PrescriptionFrequencyType extends PrescriptionFrequencyList {
  id: Id
  frequency?: Id
  value: Id
  label: string
}

export interface PrescriptionIntervalType extends PrescriptionIntervalList {
  value: string
  interval?: string
}

export interface PrescriptionDurationType extends PrescriptionDurationOption {
  value: string
  dosageDuration?: {
    unit: string
    value: number
  }
}

export type DosageDuration = {
  unit: string
  value: number
}
export interface AddPrescriptionFormData extends PrescriptionDurationType {
  deliveryRoute: string
  prescriptionStartDate: string
  prescriptionEndDate: string
  schedules: MedicineScheduleDose[]
  interval: string
  frequency: string | number
  notes: string
  selectMedicineType: string
}

export interface DirectAdministerFormData {
  prescriptionStartDate: Date
  prescriptionEndDate: Date
  batchNumber?:
    | {
        batch_no?: string
      }
  schedules: DirectAdministerScheduleDose[]
  frequency: Id
  deliveryRoute: string
  interval: string
  wastageQuantity: number | string
  wastageUOM: string
  wastageNotes: string
  notes: string
  batchImage: File[] | string
  selectMedicineType: string
}

export type SubmitFormData = AddPrescriptionFormData & DirectAdministerFormData

export interface RestartMedicineFormData
  extends Omit<AddPrescriptionFormData, 'schedules'> {
  schedules: MedicineScheduleDose[]
}
export interface MedicineScheduleDose {
  scheduled_dose_id: Id
  oldTime: string
  createdAt: string
  time: string
  quantity: string | number
  unit: string 
}

export interface PrescriptionDefaultValues {
   selectedMedicineId: string
    selectedMedicine: MedicineIdentifier | null
    selectMedicineType: string
    frequency: string,
    interval: string,
    schedules: [
      {
        time: string,
        quantity: string,
        unit: string
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

export default function AddMedicineToPrescription({ from, params }: AddMedicineToPrescriptionProps) {
  const { t } = useTranslation()
  const theme: Theme = useTheme()
  const router: any = useSafeRouter()
  const searchParams = useSearchParams()
  const id = params?.id

  if (!searchParams) return
  const medicine_edit_id = searchParams.get('medicine_edit_id')
  const discharge_tab = searchParams.get('discharge_tab')
  const date = searchParams.get('date')
  const prescriptionId = searchParams.get('prescriptionId')
  const edit_id = searchParams.get('edit_id')
  const fromPage = searchParams.get('fromPage')

  const dispatch = useDispatch()
  const hospitalData: any = useSelector((state: any) => state.hospital.data)
  const medicalRecordData: any = hospitalData[STORAGE_KEY] || {}

  const editingMedicine = useMemo(() => {
    const list: any[] = discharge_tab === 'TransferEnclosure' ? hospitalData.enclosure_medicines : hospitalData.transfer_medicines

    if (!list) return null

    // Handle both medicine_edit_id (from EnclosureDischargeForm) and edit_id (from TransferDischargeForm)
    const idToFind = medicine_edit_id || edit_id
    if (idToFind) {
      const result = list.find((med: MedicineIdentifier) => med.id?.toString() === idToFind?.toString())

      return result
    }

    return null
  }, [hospitalData, medicine_edit_id, edit_id, discharge_tab])

  // Form validation schema
  const prescriptionSchema = yup.object({
    // Common fields for both Schedule and Direct Administer
    selectedMedicineId: yup.string(),

    selectedMedicine: yup.object().nullable(),

    selectMedicineType: yup
      .string()
      .oneOf(['Schedule', 'Direct Administer'], 'Please select medicine type')
      .required(t('hospital_module.please_select_medicine_type')),
    frequency: yup.string().required(t('hospital_module.please_select_a_frequency')),
    interval: yup.string().when(['selectMedicineType', 'frequency'], {
      is: (frequency: any) => {
        const isOneTime = frequency === '2' || frequency === 2

        return !isOneTime
      },
      then: (schema: any) => schema.required(t('hospital_module.please_select_an_interval')),
      otherwise: (schema: any) => schema.nullable().notRequired()
    } as any),

    schedules: yup
      .array()
      .of(
        yup.object({
          time: yup
            .string()
            .required(t('time_required'))
            .test('valid-time-for-today', function (value: any) {
              const { selectMedicineType, frequency, prescriptionStartDate } = (this as any).from[1].value

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
                  message: t('hospital_module.time_cannot_be_future_today') as string
                })
              }

              return true
            }),
          quantity: yup
            .number()
            .typeError('Quantity is required')
            .test(
              'quantity-format',
              t('hospital_module.quantity_must_have_eight_digits_four_decimals'),
              function (value: any) {
                if (value === undefined || value === null) return true
                const rawValue = String((this as any).originalValue ?? value).trim()
                return /^\d{1,8}(\.\d{1,4})?$/.test(rawValue)
              }
            )
            .moreThan(0, t('hospital_module.quantity_more_than_zero'))
            .required(t('hospital_module.quantity_required')),
          unit: yup.string().required(t('hospital_module.please_select_a_unit'))
        })
      )
      .min(1, t('hospital_module.at_least_one_schedule_time_required'))
      .required(t('hospital_module.schedules_are_required'))
      .test('unique-times', t('hospital_module.duplicate_times_not_allowed'), function (schedules: any) {
        if (!schedules || schedules.length <= 1) return true

        const times = schedules
          .map((schedule: any) => {
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
                message: t('hospital_module.this_time_already_selected') as string
              })
            }
            seenTimes.set(times[i], i)
          }
        }

        return true
      }),

    deliveryRoute: yup.string().required(t('hospital_module.please_select_a_delivery_route')),

    prescriptionStartDate: yup
      .string()
      .required(t('hospital_module.start_date_is_required'))
      .test('valid-direct-admin-date', function (value: any) {
        const { selectMedicineType, frequency, prescriptionEndDate } = (this as any).parent

        // Only validate for Direct Administer with regular intervals (not one-time)
        const isOneTime = frequency === '2' || frequency === 2
        if (selectMedicineType !== 'Direct Administer' || isOneTime) {
          return true
        }

        if (!value || !prescriptionEndDate) {
          return true
        }

        const startDate = moment(value)
        const endDate = moment(prescriptionEndDate)
        const admittedDate = moment(medicalRecordData?.animal_admitted_date)

        // Check if start date is before admitted date
        if (startDate.isBefore(admittedDate, 'day')) {
          return this.createError({
            message: `${t('hospital_module.start_date_before_admission')} (${admittedDate.format('DD MMM YYYY')})`
          })
        }

        // Check if start date is after end date
        if (startDate.isAfter(endDate, 'day')) {
          return this.createError({
            message: t('hospital_module.start_date_after_end_date') as string
          })
        }

        return true
      }),

    prescriptionEndDate: yup.string().when(['selectMedicineType', 'frequency'], {
      is: (selectMedicineType: any, frequency: any) => {
        const isOneTime = frequency === '2' || frequency === 2

        return selectMedicineType === 'Direct Administer' && !isOneTime
      },
      then: (schema: any) => schema.required('End date is required'),
      otherwise: (schema: any) => schema.nullable().notRequired()
    } as any),

    dosageDuration: yup.object().when(['frequency', 'selectMedicineType'], {
      is: (frequency: any, selectMedicineType: any) => {
        const isOneTime = frequency === '2' || frequency === 2

        // Make dosageDuration NOT required for Direct Administer with regular intervals
        const isDirectAdministerRegular = selectMedicineType === 'Direct Administer' && !isOneTime

        return !isOneTime && !isDirectAdministerRegular
      },
      then: (schema: any) =>
        schema
          .shape({
            value: yup
              .number()
              .transform((value: any, originalValue: any) => (originalValue === '' ? undefined : value))
              .min(1, t('hospital_module.duration_must_be_at_least_one'))
              .max(100000, t('hospital_module.duration_cannot_exceed_max'))
              .required(t('hospital_module.duration_value_is_required')),
            unit: yup.string().required('hospital_module.please_select_duration_unit')
          })
          .required(t('hospital_module.dosage_duration_required')),
      otherwise: (schema: any) =>
        schema
          .shape({
            value: yup.number().nullable().notRequired(),
            unit: yup.string().nullable().notRequired()
          })
          .nullable()
          .notRequired()
    } as any),

    notes: yup.string().trim().max(10000, t('hospital_module.notes_cannot_exceed_500')).notRequired(),

    // Fields specific to Direct Administer
    wastageQuantity: yup
      .string()
      .nullable()
      .trim()
      .test('is-number', t('hospital_module.quantity_must_be_a_number'), (value: any) => {
        if (!value) return true

        return /^[0-9]*$/.test(value)
      })
      .test('positive', t('hospital_module.quantity_more_than_zero'), (value: any) => {
        if (!value) return true

        return Number(value) > 0
      })
      .test('max', t('hospital_module.quantity_cannot_exceed_100'), (value: any) => {
        if (!value) return true

        return Number(value) <= 100
      }),

    wastageUOM: yup.string().when('wastageQuantity', {
      is: (value: any) => value && Number(value) > 0,
      then: (schema: any) => schema.required(t('hospital_module.please_select_unit')),
      otherwise: (schema: any) => schema.notRequired()
    } as any),

    batchNumber: yup.mixed().when(['selectedMedicine', 'selectMedicineType'], {
      is: (selectedMedicine: any, selectMedicineType: any) =>
        selectMedicineType === 'Direct Administer' && selectedMedicine?.controlled_substance === 1,
      then: (schema: any) => schema.required(t('hospital_module.batch_required')),
      otherwise: (schema: any) => schema.nullable().notRequired()
    } as any),

    batchImage: yup.mixed().nullable().notRequired(),

    wastageNotes: yup.string().nullable().trim().max(10000, t('hospital_module.notes_cannot_exceed_500')).notRequired()
  })

  const defaultValues: PrescriptionDefaultValues = {
    selectedMedicineId: '',
    selectedMedicine: null,
    selectMedicineType: 'Schedule',
    frequency: '',
    interval: '',
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
  } = useForm<any>({
    defaultValues,
    resolver: yupResolver(prescriptionSchema) as any,
    mode: 'onBlur',
    shouldUnregister: false
  })

  // Only one medicine can be selected at a time
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineIdentifier | null>(null)
  const [temporarilySelectedMedicine, setTemporarilySelectedMedicine] = useState<MedicineDetails | null>(null)
  const [patientData, setPatientData] = useState<PatientDetailsData | null>(null)
  const [patientLoading, setPatientLoading] = useState<boolean>(false)

  // Pagination and search states for medicines
  const [apiMedicineList, setApiMedicineList] = useState<ApiMedicineState[]>([])
  const [medicineSearchQuery, setMedicineSearchQuery] = useState<string>('')
  const [medicineLoading, setMedicineLoading] = useState<boolean>(false)
  const [totalMedicines, setTotalMedicines] = useState<number>(0)
  const [searching, setSearching] = useState<boolean>(false)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [resetPagination, setResetPagination] = useState<boolean>(false)
  const [page, setPage] = useState<number>(1)

  const [medicalMasterData, setMedicalMasterData] =
  useState<MedicalMasterFormData>(
    {
      caseTypes: [],
      prescriptionDosageMeasurementType: [],
      prescriptionDuration: [],
      prescriptionFrequency: [],
      prescriptionDeliveryRoute: [],
      intervalList: []
    }
  )
  const [medicalMasterDataLoading, setMedicalMasterDataLoading] = useState<boolean>(true)
  const [frequencyData, setFrequencyData] = useState<PrescriptionFrequencyList[]>([])
  const [intervalList, setIntervalList] = useState<PrescriptionIntervalList[]>([])
  const [batchList, setBatchList] = useState<MedicineBatchList[]>([])
  const [batchSearchQuery, setBatchSearchQuery] = useState<string>('')
  const [batchLoading, setBatchLoading] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isPrescriptionListLoading, setIsPrescriptionListLoading] = useState<boolean>(false)
  const [frequencyLoading, setFrequencyLoading] = useState<boolean>(true)
  const [intervalLoading, setIntervalLoading] = useState<boolean>(true)
  const [medicationData, setMedicationData] = useState<PrescriptionList[]>([])
  const [endsOn, setEndsOn] = useState<string | null>(null)
  const [cancelOrCloseText, setCancelOrCloseText] = useState<string>('CANCEL')
  const [medicineDetail, setMedicineDetail] = useState<PrescriptionDetails | null>(null)
  const [sideEffectMedicinesLoading, setSideEffectMedicinesLoading] = useState<boolean>(false)
  const [showSideEffectWarning, setShowSideEffectWarning] = useState<boolean>(false)
  const [warningMedicine, setWarningMedicine] = useState<any>(null)
  const [sideEffectMedicinesCache, setSideEffectMedicinesCache] = useState<any>(null)

  const { selectedHospital: hospital }: any = useHospital()
  const authData: any = useContext(AuthContext)

  // Watch frequency to determine if it's "one_time"
  const selectedFrequency = watch('frequency')
  const isOneTimeFrequency = selectedFrequency === '2' || selectedFrequency === 2

  // Watch for changes in start date and duration to calculate end date
  const prescriptionStartDate = watch('prescriptionStartDate')
  const prescriptionEndDate = watch('prescriptionEndDate')
  const dosageDuration = watch('dosageDuration')
  const intervalItem = watch('interval')
  const selectMedicineType = watch('selectMedicineType')
  const isDischargedAnimal = Boolean(patientData?.discharge_at)

  const isSmallerDevices = useMediaQuery(theme.breakpoints.down('sm'))

  // Combined loading state
  const isInitialDataLoading = useMemo(() => {
    return frequencyLoading || intervalLoading || isPrescriptionListLoading || medicalMasterDataLoading
  }, [frequencyLoading, intervalLoading, isPrescriptionListLoading, medicalMasterDataLoading])

  // Helper function to calculate duration dynamically
  function calculateDynamicDuration(startDate: Date, endDate: Date) {
    if (!startDate || !endDate) {
      return '1 days'
    }

    const start = dayjs(startDate).startOf('day')
    const end = dayjs(endDate).startOf('day')

    if (start.isSame(end, 'day')) {
      return '1 days'
    }

    const diffDays = end.diff(start, 'day') + 1

    return `${diffDays} days`
  }

  // Calculate and update endsOn whenever relevant fields change
  useEffect(() => {
    if (prescriptionStartDate && !isOneTimeFrequency && selectMedicineType === 'Schedule') {
      if (dosageDuration?.value && dosageDuration?.unit) {
        const startDateForCalc =
          prescriptionStartDate && typeof (prescriptionStartDate as any)?.toDate === 'function'
            ? (prescriptionStartDate as any).toDate()
            : prescriptionStartDate
        const calculatedEndDate = calculateEndDate(startDateForCalc, dosageDuration, intervalItem, false)
        if (calculatedEndDate) {
          const formattedDate = moment(calculatedEndDate).format('DD MMM YYYY')
          setEndsOn(formattedDate)
          setValue('prescriptionEndDate', calculatedEndDate)
        } else {
          setEndsOn(null)
          setValue('prescriptionEndDate', null as unknown as Date)
        }
      } else {
        setEndsOn(null)
        setValue('prescriptionEndDate', null as unknown as Date)
      }
    } else {
      setEndsOn(null)
    }
  }, [
    prescriptionStartDate,
    dosageDuration?.value,
    dosageDuration?.unit,
    isOneTimeFrequency,
    selectMedicineType,
    intervalItem,
    setValue
  ])

  const debouncedBatchSearch = useCallback(
    debounce(async (medicineId: Id, query: string = '') => {
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
        }
      } catch (error) {
        const err = error as Error
        console.error('Error fetching medicine batches:', err.message)
      } finally {
        setBatchLoading(false)
      }
    }, 500),
    []
  )

  const fetchMedicineBatches = useCallback(
    (medicineId: Id, query: string = '') => {
      debouncedBatchSearch(medicineId, query)
    },
    [debouncedBatchSearch]
  )

  function getTimeDayjs(timeStr: string) {
    if (!timeStr) return dayjs()

    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      return dayjs(timeStr, ['hh:mm A', 'h:mm A'])
    }

    const [hours, minutes] = timeStr.split(':').map(Number)

    return dayjs()
      .hour(hours)
      .minute(minutes || 0)
      .second(0)
  }

  const handleSetDefaultValues = (data: PrescriptionDetails) => {
    const frequency = frequencyData?.find((item) => item?.string_id == data.prescription_frequency)
    const interval = intervalList?.find((item) => item?.interval_string_id == data.interval_string_id)

    const deliveryRoute = Array.isArray(medicalMasterData)
    ? undefined :medicalMasterData?.prescriptionDeliveryRoute?.find(
      (item) => item?.string_id == data.delivery_route_string_id
    )

    reset({
      frequency: frequency?.id || data.frequency || '',
      interval: interval?.id || data.interval || '',
      deliveryRoute: deliveryRoute?.value || '',

      prescriptionStartDate:
        fromPage === 'editPrescription' ? dayjs(date) : data?.stop_date ? dayjs(data.stop_date) : null,

      dosageDuration: {
        value: data?.duration_qty || '0',
        unit: data?.duration_label?.toLowerCase() || data?.duration?.split(' ')[1] || ''
      },

      notes: data.notes || '',

      wastageQuantity: '',
      wastageUOM: '',
      wastageNotes: '',

      batchNumber: '',
      batchImage: [],

      schedules:
        data.medicine_timings?.map((schedule) => ({
          oldTime: formatTimeWithMoment(schedule.scheduled_time ?? ''),
          createdAt: schedule.created_at,
          time: schedule.scheduled_time ? getTimeDayjs(schedule.scheduled_time) : dayjs(),
          quantity: schedule.scheduled_quantity || '',
          unit: getUnitFromLabel(schedule.scheduled_unit_name ?? '', medicalMasterData) || '',
          scheduled_dose_id: schedule?.scheduled_dose_id
        })) || [],
      selectMedicineType: 'Schedule'
    })
  }

  useEffect(() => {
    if (medicineDetail && medicalMasterData && frequencyData && fromPage === 'prescriptionDetail' && intervalList) {
      handleSetDefaultValues(medicineDetail)
      handleMedicineSelect({ id: medicineDetail?.medicine_id ?? '', name: medicineDetail?.medicine_name ?? ''})
      setApiMedicineList([{ id: medicineDetail?.medicine_id ?? '', name: medicineDetail?.medicine_name ?? '' }])
    }
  }, [fromPage, medicalMasterData, medicineDetail])

  useEffect(() => {
    if (medicineDetail && medicalMasterData && frequencyData && fromPage === 'editPrescription' && intervalList) {
      handleSetDefaultValues(medicineDetail)
      handleMedicineSelect({ id: medicineDetail?.medicine_id ?? '', name: medicineDetail?.medicine_name ?? '' })
      setApiMedicineList([{ id: medicineDetail?.medicine_id ?? '', name: medicineDetail?.medicine_name ?? '' }])
    }
  }, [fromPage, medicalMasterData, medicineDetail])

  const getDetails = async (data?: MedicineIdentifier) => {
    try {
      setMedicineLoading(true)

      const payload: GetPrescriptionDetailsParams = {
        prescription_id: data?.id ?? '',
        date: date || '',
        group_prescription_id: data?.id ?? '',
        hospital_id: hospital?.id || ''
      }

      const response = await getPrescriptionDetails(payload)

      if (response?.success) {
        setMedicineDetail(response?.data)
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {
      const err = error as Error
      Toaster({ type: 'error', message: err || t('hospital_module.something_went_wrong') })
    } finally {
      setMedicineLoading(false)
    }
  }

  const fetchSideEffectMedicines = async (): Promise<
  GetPrescriptionMedicineSideEffectResponse['data']| undefined
> => {
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
      const err = error as Error
      Toaster({ type: 'error', message: err || t('hospital_module.something_went_wrong') })
      router.back()
    } finally {
      setSideEffectMedicinesLoading(false)
    }
  }

  // Helper function to check for side effects
  const checkForSideEffects = (sideEffectMedicines: any, selectedMedicineId: Id) => {
    if (!sideEffectMedicines || !sideEffectMedicines.result) return false

    const medicineIdsWithSideEffects = sideEffectMedicines.result
      .map((item: any) => (item.medicine_id ? item.medicine_id.toString() : null))
      .filter((id: any) => id !== null)

    return medicineIdsWithSideEffects.includes(selectedMedicineId.toString())
  }

  const handleMedicineSelect = async (medicine: MedicineDetails) => {
    if (medicine) {
      if (fromPage === 'prescriptionDetail' || editingMedicine || fromPage === 'editPrescription') {
        proceedWithMedicineSelection(medicine)

        return
      }

      let sideEffectMedicines: GetPrescriptionMedicineSideEffectResponse['data'] | undefined

      if (sideEffectMedicinesCache !== null) {
        sideEffectMedicines = sideEffectMedicinesCache
      } else {
        sideEffectMedicines = await fetchSideEffectMedicines()

        setSideEffectMedicinesCache(sideEffectMedicines)
      }

      const hasSideEffects = checkForSideEffects(sideEffectMedicines, medicine.id)

      if (hasSideEffects) {
        setShowSideEffectWarning(true)
        setWarningMedicine(medicine)

        return
      } else {
        proceedWithMedicineSelection(medicine)
      }
    }
  }

  const proceedWithMedicineSelection = (medicine: MedicineDetails) => {
    setValue('selectedMedicineId', medicine.id, { shouldValidate: true })
    setValue('selectedMedicine', medicine, { shouldValidate: true })
    setTemporarilySelectedMedicine({ ...medicine })
    setSelectedMedicine({ ...medicine })

    setValue('batchNumber', null)
    setBatchSearchQuery('')

    if (watch('selectMedicineType') === 'Direct Administer') {
      fetchMedicineBatches(medicine.id, '')
    }
  }

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

  useEffect(() => {
    const subscription = watch((value: any, { name }: any) => {
      if (name === 'selectMedicineType') {
        if (value.selectMedicineType !== 'Direct Administer') {
          setBatchList([])
          setValue('batchNumber', null)
          setBatchSearchQuery('')
        } else if (temporarilySelectedMedicine?.id) {
          debouncedBatchSearch(temporarilySelectedMedicine.id, '')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [watch, temporarilySelectedMedicine?.id, debouncedBatchSearch, setValue])

  const handleBatchSearch = useCallback(
    (value: string) => {
      setBatchSearchQuery(value)
      if (temporarilySelectedMedicine?.id) {
        fetchMedicineBatches(temporarilySelectedMedicine.id, value)
      }
    },
    [temporarilySelectedMedicine?.id, fetchMedicineBatches]
  )

  const fetchMedicalMasterData = useCallback(async () => {
    try {
      setMedicalMasterDataLoading(true)
      const response = await getMedicalMasterData()
      if (response?.success) {
        await Promise.all([fetchFrequencies(), fetchIntervals()])

        setMedicalMasterData((prevData: MedicalMasterFormData) => ({
          ...response?.data,
          prescriptionFrequency: prevData?.prescriptionFrequency || [],
          intervalList: prevData?.intervalList || [],
          prescriptionDosageMeasurementType:
            response?.data?.prescriptionDosageMeasurementType?.map((item: PrescriptionDosageMeasurementType) => ({
              ...item,
              value: item.key,
              unit_name: item.label,
              uom_abbr: item.key
            }))?.sort((a: PrescriptionDosageMeasurementType, b: PrescriptionDosageMeasurementType) => a.label?.localeCompare(b.label)) || [],
          prescriptionDuration: response?.data?.prescriptionDuration?.map((item: PrescriptionDurationOption) => ({ ...item, value: item.key })) || [],
          prescriptionMeasurementType:
            response?.data?.prescriptionMeasurementType?.map((item: PrescriptionMeasurementType) => ({
              ...item,
              label: item.unit_name,
              value: item.uom_abbr
            })) || [],
          prescriptionDeliveryRoute:
            response?.data?.prescriptionDeliveryRoute?.map((item: PrescriptionDeliveryRoute) => ({
              ...item,
              label: item.delivery,
              value: item.route_abbr
            }))?.sort((a: any, b: any) => a.label?.localeCompare(b.label)) || []
        }))
      } else {
        setMedicalMasterData({
          caseTypes: [],
          prescriptionFrequency: [],
          prescriptionDosageMeasurementType: [],
          prescriptionDuration: [],
          prescriptionDeliveryRoute: [],
          intervalList: []
        })
      }
    } catch (error) {
      const err = error as Error
      console.error('Error fetching medical master data:', err.message)
    } finally {
      setMedicalMasterDataLoading(false)
    }
  }, [])

  const fetchFrequencies = useCallback(async () => {
    try {
      setFrequencyLoading(true)
      const response = await getFrequency()
      if (response?.success) {
        setFrequencyData(response?.data?.map((item) => ({ ...item, value: item.id })) || [])
        setMedicalMasterData((prevData) => ({
          ...prevData,
          prescriptionFrequency: response?.data?.map((item) => ({
            ...item,
            value: item.id
          }))
        }))
      } else {
        setFrequencyData([])
      }
    } catch (error) {
      const err = error as Error
      console.error('Error fetching medical master data:', err.message)
    } finally {
      setFrequencyLoading(false)
    }
  }, [])

  const fetchIntervals = async () => {
    try {
      setIntervalLoading(true)
      const response = await getIntervalList()
      if (response?.success) {
        setIntervalList(
          response?.data?.map((item) => ({
            ...item,
            value: item.id
          })) || []
        )
        setMedicalMasterData((prevData) => ({
          ...prevData,
          intervalList: response?.data?.map((item) => ({
            ...item,
            value: item.id
          }))
        }))
      } else {
        setIntervalList([])
      }
    } catch (error) {
      const err = error as Error
      console.error('Error fetching medical master data:', err.message)
    } finally {
      setIntervalLoading(false)
    }
  }

  const fetchMedicines = useCallback(
    async (query: string = '', pageNo: number = 1, append: boolean = false) => {
      try {
        if (pageNo === 1) {
          setSearching(true)
        } else {
          setMedicineLoading(true)
        }

        const params = {
          product_search: query,
          page_no: pageNo,
          screen: 'Medicine'
        }
        const response = await getMedicineList({ params })
        if (response?.success) {
          const newResults = response.data.brand_name.result || []
          const totalRecords = parseInt(response.data.brand_name.count) || 0

          setApiMedicineList((prev) => (append ? [...prev, ...newResults] : newResults))
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

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setResetPagination(true)
      setPage(1)
      fetchMedicines(query, 1, false)
    }, 500),
    []
  )

  const handleMedicineSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (fromPage === 'prescriptionDetail' || medicine_edit_id || fromPage === 'editPrescription') {
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
      if (fromPage === 'prescriptionDetail' || medicine_edit_id || fromPage === 'editPrescription') {
        return
      }
      setSelectedMedicine(null)
      setTemporarilySelectedMedicine(null)
    }
    if (fromPage === 'prescriptionDetail' || medicine_edit_id || fromPage === 'editPrescription') {
      return
    } else {
      fetchMedicines('', 1, false)
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    if (resetPagination || medicineLoading || !hasMore) return
    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50

    if (bottom) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchMedicines(medicineSearchQuery, nextPage, true)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  useEffect(() => {
    if (fromPage === 'editPrescription') {
      getDetails({
        id: prescriptionId
      })
    } else if (fromPage === 'prescriptionDetail') {
      getDetails({
        id: prescriptionId
      })
    } else {
      fetchMedicines('', 1, true)
    }
    fetchMedicalMasterData()
  }, [])

  useEffect(() => {
    if (!id) return

    const getPatientInfo = async () => {
      setPatientLoading(true)
      try {
        await getPatientDetails(id).then((res) => {
          if (res?.success === true) {
            setPatientData(res?.data ?? null)

            if (
              hospital?.id &&
              res.data?.animal_detail?.animal_id &&
              id &&
              res.data?.medical_record_id &&
              fromPage !== 'prescriptionDetail' &&
              fromPage !== 'editPrescription'
            ) {
              getPrescriptionList(res.data?.animal_detail?.animal_id, res.data?.medical_record_id)
            }
            dispatch(updateState({
              key: STORAGE_KEY,
              value: {
                ...medicalRecordData,
                animal_id: res.data?.animal_detail?.animal_id,
                medical_record_id: res.data?.medical_record_id,
                animal_admitted_date: res.data?.admitted_at
              }
            }))
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

  const getPrescriptionList = async (animalId?: Id, medicalRecordId?: Id) => {
    try {
      setIsPrescriptionListLoading(true)

      const payload: GetPrescriptionListParams = {
        hospital_id: hospital?.id || '',
        animal_id: animal_id || animalId || '',
        medical_type: 'prescription',
        type: 'active',
        generate_for_date: new Date().toISOString().split('T')[0],
        hospital_case_id: id || ''
      }

      const response = await getPrescriptions(payload)

      if (response?.success) {
        const prescriptions = response?.data?.prescriptions?.map((item) => ({
          ...item,
          status: item?.status ? item?.status?.toLowerCase() : null
        }))
        setMedicationData(prescriptions)
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {
      const err = error as Error
      console.error('Error fetching prescription list:', err)

      Toaster({ type: 'error', message: err || t('hospital_module.something_went_wrong') })
    } finally {
      setIsPrescriptionListLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      debouncedBatchSearch.cancel()
      debouncedSearch.cancel()
    }
  }, [debouncedBatchSearch, debouncedSearch])

  useEffect(() => {
    if (patientData?.discharge_at) {
      const dischargeDate = dayjs(Utility.convertUTCToLocal(patientData.discharge_at))
      const admittedDate = patientData?.admitted_at
        ? dayjs(Utility.convertUTCToLocal(patientData.admitted_at))
        : null

      if (selectMedicineType === 'Direct Administer') {
        if (!prescriptionStartDate || prescriptionStartDate === '') {
          if (admittedDate) {
            setValue('prescriptionStartDate', admittedDate)
          } else {
            setValue('prescriptionStartDate', dischargeDate)
          }
        }

        if (!isOneTimeFrequency) {
          setValue('prescriptionEndDate', dischargeDate)
        }
      }

      if (selectMedicineType === 'Schedule' && (!prescriptionStartDate || prescriptionStartDate === '')) {
        if (admittedDate) {
          setValue('prescriptionStartDate', admittedDate)
        } else {
          setValue('prescriptionStartDate', dischargeDate)
        }
      }
    }
  }, [patientData?.discharge_at, patientData?.admitted_at, selectMedicineType, isOneTimeFrequency, prescriptionStartDate, setValue])

  useEffect(() => {
    if (isDischargedAnimal && selectMedicineType !== 'Direct Administer') {
      setValue('selectMedicineType', 'Direct Administer')
    }
  }, [isDischargedAnimal, selectMedicineType, setValue])

  function toISTISOString(date: DateRangeValue, includeCurrentTime: boolean = false) {
    if (!date) return ''

    let momentDate = moment(date)

    if (includeCurrentTime) {
      const year = momentDate.year()
      const month = momentDate.month()
      const day = momentDate.date()

      const now = new Date()

      momentDate = moment({
        year,
        month,
        date: day,
        hour: now.getHours(),
        minute: now.getMinutes(),
        second: now.getSeconds(),
        millisecond: now.getMilliseconds()
      })
    }

    return momentDate.utcOffset('+05:30').format('YYYY-MM-DDTHH:mm:ss.SSSZ')
  }

  function formatPrescriptionUTCDateTime(date: DateRangeValue, includeCurrentTime: boolean = false) {
    if (!date) return ''

    let momentDate = moment(date)

    if (includeCurrentTime) {
      const year = momentDate.year()
      const month = momentDate.month()
      const day = momentDate.date()
      const now = new Date()

      momentDate = moment({
        year,
        month,
        date: day,
        hour: now.getHours(),
        minute: now.getMinutes(),
        second: now.getSeconds(),
        millisecond: now.getMilliseconds()
      })
    }

    return momentDate.utc().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
  }

  function convertUTCToLocaltime(date: DateRangeValue) {
    if (!date) return ''
    const stillUtc = moment.utc(date).toDate()

    const local = moment(stillUtc).local(true).format('hh : mm : A')

    return local
  }

  function formatTimeWithMoment(timeString: string | null): string {
    if (!timeString) return ''

    const time = moment(timeString, 'HH:mm:ss')
    if (!time.isValid()) return ''

    return time.format('hh : mm : A')
  }

  const resetForm = useCallback(() => {
    Object.keys(defaultValues).forEach((key: string) => {
      if (key === 'selectMedicineType') {
        setValue(key, watch('selectMedicineType'))
      } else {
          setValue(key as keyof PrescriptionDefaultValues, defaultValues[key as keyof PrescriptionDefaultValues])
      }
    })
    setSelectedMedicine(null)
    setTemporarilySelectedMedicine(null)
  }, [setValue])

  const handleScheduledPrescription = async (
    data: AddPrescriptionFormData,
    medicalMasterData: MedicalMasterFormData | null,
    medical_record_id: Id,
    temporarilySelectedMedicine: MedicineDetails | null
  ) => {
    try {
      setIsSubmitting(true)
      const interval = medicalMasterData?.intervalList?.find((item) => item?.value === data?.interval)
      const frequency = medicalMasterData?.prescriptionFrequency?.find((item) => item?.id == data.frequency)

      const deliveryRoute = medicalMasterData?.prescriptionDeliveryRoute?.find(
        (item) => item?.route_abbr === data.deliveryRoute
      )

      const prescriptionDuration = medicalMasterData?.prescriptionDuration?.find(
        (item) => item?.value === data.dosageDuration?.unit
      )

      const scheduleDoses = data.schedules.map((schedule) => ({
        id: '',
        time: schedule?.time ? convertUTCToLocaltime(schedule.time) : '',
        quantity: schedule.quantity,
        unit_id: getUnitIdFromName(schedule?.unit, medicalMasterData ?? null),
        unit_name: schedule.unit,
        string_id: getStringIdFromUnitName(schedule?.unit, medicalMasterData)
      }))

      const payload: AddPrescriptionParams = {
        medical_record_id: medical_record_id,
        request_from: 'hospital',
        hospital_case_id: id,
        data: JSON.stringify([
          {
            id: temporarilySelectedMedicine?.id,
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

            start_date: formatPrescriptionUTCDateTime(data.prescriptionStartDate, true),
            end_date: isOneTimeFrequency
              ? formatPrescriptionUTCDateTime(data.prescriptionStartDate, true)
              : calculateEndDate(data.prescriptionStartDate, data.dosageDuration, interval?.value),

            restart_reason: '',
            stop_reason: '',
            will_restart: false,
            side_effect: false,
            created_for: 'SINGLE',

            administer_date: toISTISOString(data.prescriptionStartDate),

            batch_list: [],
            dose_type: 'fixed_dose'
          }
        ])
      }

      const response = await addPrescription(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message })

        resetForm()

        await getPrescriptionList()

        return response
      } else {
        Toaster({ type: 'error', message: response?.message })

        return null
      }
    } catch (error) {
      const err = error as Error
      console.error('Error in handleScheduledPrescription:', err)

      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDirectAdminister = async (data: DirectAdministerFormData, medicalMasterData: MedicalMasterFormData, medical_record_id: Id, temporarilySelectedMedicine: MedicineDetails | null) => {
    try {
      setIsSubmitting(true)

      let calculatedDuration = calculateDynamicDuration(data.prescriptionStartDate, data.prescriptionEndDate)

      const frequency = medicalMasterData?.prescriptionFrequency?.find((item) => item?.id == data.frequency)

      const deliveryRoute = medicalMasterData?.prescriptionDeliveryRoute?.find(
        (item) => item?.route_abbr === data.deliveryRoute
      )
      const interval = medicalMasterData?.intervalList?.find((item) => item?.value === data?.interval)

      const selectedBatch = batchList?.find((item) => {
        const batchNo = typeof data.batchNumber === 'object' ? data.batchNumber?.batch_no : data.batchNumber

        return item?.batch_no === batchNo
      })

      const scheduleDoses = data.schedules.map((schedule) => ({
        id: '',
        time: schedule?.time ? convertUTCToLocaltime(schedule.time) : '',
        quantity: schedule.quantity,
        unit_id: getUnitIdFromName(schedule?.unit, medicalMasterData),
        unit_name: schedule.unit,
        string_id: getStringIdFromUnitName(schedule?.unit, medicalMasterData)
      }))

      const batchListPayload =
        data.batchNumber?.batch_no || data.batchNumber
          ? [
              {
                id: selectedBatch?.id,
                batch_id: selectedBatch?.id,
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

      const payload: AddDirectAdministerParams = {
        record_date: toISTISOString(new Date()).replace('T', ' ').slice(0, 19),
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

            notes: data.notes || '',

            delivery_route_name: data?.deliveryRoute || '',
            delivery_route_id: deliveryRoute?.id || '',
            delivery_route_string_id: deliveryRoute?.string_id || '',

            start_date: formatPrescriptionUTCDateTime(data.prescriptionStartDate, true),
            end_date: isOneTimeFrequency
              ? formatPrescriptionUTCDateTime(data.prescriptionStartDate, true)
              : formatPrescriptionUTCDateTime(data.prescriptionEndDate, true),

            restart_reason: '',
            stop_reason: '',
            will_restart: false,
            side_effect: false,
            created_for: 'DIRECT_ADMINISTER',
            administer_date: toISTISOString(data.prescriptionStartDate)?.slice(0, 10) || '',

            batch_list: batchListPayload,
            request_from: 'hospital_module',
            dose_type: 'fixed_dose',
            files: data.batchImage ? data.batchImage : []
          }
        ]),
        [selectedBatch ? `BATCH_${selectedBatch.id}` : 'BATCH_0']: data.batchImage?.[0] ? data.batchImage[0] : []
      }

      const response = await addDirectAdministerPrescription(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || t('hospital_module.direct_administer_record_added') })
        resetForm()

        await getPrescriptionList()

        return response
      } else {
        Toaster({ type: 'error', message: response?.message })
        console.error('Failed to add direct administer record')

        return null
      }
    } catch (error: unknown) {
      console.error('Error in handleDirectAdminister:', error)

      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitHandler = handleSubmit(async (data: SubmitFormData) => {
    try {
      const isDirectAdminister = data.selectMedicineType === 'Direct Administer'
      let response: AddDirectAdministerResponse | AddPrescriptionResponse | null = null
      if (isDirectAdminister) {
        if (medicalMasterData == null) return
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
          setCancelOrCloseText('CLOSE')
          resetForm()
        }
      }
    } catch (error) {
      const err = error as Error
      console.error(' Error in submitHandler:', err)
    }
  })

  function formatDateWithCurrentTime(date: string | number | Date): string {
    const originalDate = new Date(date)

    const now = new Date()

    const result = new Date(
      originalDate.getUTCFullYear(),
      originalDate.getUTCMonth(),
      originalDate.getUTCDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
      now.getMilliseconds()
    )

    return result.toISOString()
  }

  const handleRestartMedicine = async (data: RestartMedicineFormData) => {
    try {
      setIsSubmitting(true)
      const interval = medicalMasterData?.intervalList?.find((item) => item?.value === data?.interval)
      const frequency = medicalMasterData?.prescriptionFrequency?.find((item) => item?.id == data.frequency)

      const deliveryRoute = medicalMasterData?.prescriptionDeliveryRoute?.find(
        (item) => item?.route_abbr === data.deliveryRoute
      )

      const prescriptionDuration = medicalMasterData?.prescriptionDuration?.find(
        (item) => item?.value === data.dosageDuration?.unit
      )

      const scheduleDoses = data.schedules.map((schedule) => ({
        id: schedule?.scheduled_dose_id,
        time: schedule?.time ? convertUTCToLocaltime(schedule.time) : '',
        quantity: schedule.quantity,
        unit_id: getUnitIdFromName(schedule?.unit, medicalMasterData),
        old_time: schedule?.oldTime ? schedule.oldTime : '',
        unit_name: schedule.unit,
        string_id: getStringIdFromUnitName(schedule?.unit, medicalMasterData),
        created_at: schedule?.createdAt
      }))

      const payload: RestartMedicineParams = {
        medical_record_id: medicineDetail?.medical_record_id ?? '',
        prescription_id: medicineDetail?.medicine_id ?? '',
        type: 'prescription',
        status: 'restart',
        request_from: 'hospital_module',
        note: data?.notes,
        medicine_details: {
          id: medicineDetail?.medicine_id ?? '',
          label: medicineDetail?.medicine_name ?? '',
          name: medicineDetail?.medicine_name ?? '',

          frequency_key: frequency?.string_id || '',
          frequency_id: frequency?.id || '',
          frequency: data?.frequency,
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

          start_date: formatPrescriptionUTCDateTime(data.prescriptionStartDate, true),
          end_date: isOneTimeFrequency
            ? formatPrescriptionUTCDateTime(data.prescriptionStartDate, true)
            : formatDateWithCurrentTime(
                calculateEndDate(data.prescriptionStartDate, data.dosageDuration, interval?.value)
              ),

          restart_reason: '',
          stop_reason: '',
          side_effect: false,
          group_prescription_id: medicineDetail?.group_prescription_id || medicineDetail?.prescription_id ||''
        }
      }
      const response = await stopPrescription(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message })
        router.back()
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error: unknown) {
      console.error('Error in handleRestartMedicine:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const validatePrescriptionBeforeUpdate = async (data: AddPrescriptionFormData) => {
    try {
      const payload: UpdatePrescriptionParams = {
        medical_record_id: medicineDetail?.medical_record_id ?? '',
        prescription_id: medicineDetail?.prescription_id ?? '',
        medicine_id: medicineDetail?.medicine_id ?? ''
      }

      const response = await validatePrescriptionUpdate(payload)

      if (response?.success) {
        handleUpdatePrescription(data)
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error: unknown) {
      console.error('Error in validatePresctiptionBeforeUpdate:', error)
    }
  }

  const handleUpdatePrescription = async (data: AddPrescriptionFormData) => {
    try {
      setIsSubmitting(true)
      const interval = medicalMasterData?.intervalList?.find((item) => item?.value === data?.interval)
      const frequency = medicalMasterData?.prescriptionFrequency?.find((item) => item?.id == data.frequency)

      const deliveryRoute = medicalMasterData?.prescriptionDeliveryRoute?.find(
        (item) => item?.route_abbr === data.deliveryRoute
      )

      const prescriptionDuration = medicalMasterData?.prescriptionDuration?.find(
        (item) => item?.value === data.dosageDuration?.unit
      )

      const scheduleDoses = data.schedules.map((schedule) => ({
        id: schedule?.scheduled_dose_id ?? null,
        time: schedule?.time ? convertUTCToLocaltime(schedule.time) : '',
        quantity: schedule.quantity,
        unit_id: getUnitIdFromName(schedule?.unit, medicalMasterData),
        old_time: schedule?.oldTime ? schedule.oldTime : '',
        unit_name: schedule.unit,
        string_id: getStringIdFromUnitName(schedule?.unit, medicalMasterData),
        created_at: schedule?.createdAt
      }))

      const payload: AddPrescriptionParams = {
        medical_record_id: medicineDetail?.medical_record_id ?? '',
        request_from: 'hospital',
        hospital_case_id: id,
        data: JSON.stringify([
          {
            prescription_id: medicineDetail?.prescription_id,
            follow_up_date: null,
            group_prescription_id: medicineDetail?.prescription_id,
            id: medicineDetail?.medicine_id,
            controlled_substance: medicineDetail?.controlled_substance == 1 ? true : false,
            side_effect: medicineDetail?.side_effect == 1 ? true : false,
            medical_record_id: medicineDetail?.medical_record_id,
            created_for: 'medical',
            created_by: authData?.userData?.id,
            dose_type: 'fixed_dose',

            delivery_route_id: deliveryRoute?.id || '',
            delivery_route_name: data?.deliveryRoute || '',
            delivery_route_string_id: deliveryRoute?.string_id || '',

            frequency_id: frequency?.id || '',
            frequency_compare: frequency?.string_id || '',
            frequency: data?.frequency,
            frequency_string_id: frequency?.translation_string_id || '',

            interval: interval?.label || '',
            interval_id: interval?.id || '',
            interval_string_id: interval?.interval_string_id || '',

            notes: data?.notes || '',

            start_date: formatPrescriptionUTCDateTime(data.prescriptionStartDate, true),
            stop_date: null,
            show_stop_button: 'no',
            administer_date: null,
            end_date: isOneTimeFrequency
              ? formatPrescriptionUTCDateTime(data.prescriptionStartDate, true)
              : formatDateWithCurrentTime(
                  calculateEndDate(data.prescriptionStartDate, data.dosageDuration, interval?.value)
                ),
            status: 'active',
            stop_reason: '',
            is_new_data: '1',
            restart_reason: '',
            will_restart: false,

            dosage: null,
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
            created_at: medicineDetail?.created_at || '',

            schedule_doses: scheduleDoses,

            name: medicineDetail?.medicine_name,
            label: medicineDetail?.medicine_name,

            frequency_key: frequency?.string_id || '',
            frequency_id_duplicate: frequency?.id || ''
          }
        ])
      }

      const response = await addPrescription(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message })
        router.back()
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {
      const err = error as Error
      console.error('Error in handleRestartMedicine:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const scrollToFirstError = (errors: any) => {
    if (!errors || Object.keys(errors).length === 0) return

    const findFirstErrorField = (errorObj: any, path: string = ''): any => {
      if (Array.isArray(errorObj)) {
        for (let i = 0; i < errorObj.length; i++) {
          if (errorObj[i]) {
            const result = findFirstErrorField(errorObj[i], `${path}[${i}]`)
            if (result) return result
          }
        }
      } else if (typeof errorObj === 'object' && errorObj !== null) {
        if (errorObj.message && path) {
          return { path, message: errorObj.message }
        }

        for (const key in errorObj) {
          const newPath = path ? `${path}.${key}` : key
          const result = findFirstErrorField(errorObj[key], newPath)
          if (result) return result
        }
      } else if (errorObj?.message) {
        return { path, message: errorObj.message }
      }

      return null
    }

  const firstError = findFirstErrorField(errors)

  if (!firstError) return

  const { path, message } = firstError

  let selectorPath = path.replace(/\[(\d+)\]/g, '.$1').replace(/^\./, '')

  let element: any = null
  let attempts: string[] = []

  if (selectorPath.includes('schedules.')) {
    const parts = selectorPath.split('.')
    const index = parts[1]
    const field = parts[2]

    attempts = [
      `[name="schedules.${index}.${field}"]`,
      `input[name*="schedules.${index}.${field}"]`,
      `select[name*="schedules.${index}.${field}"]`,
      `[data-error-field="schedules.${index}.${field}"]`,
      `.schedule-field-${index}-${field}`
    ]

    for (const attempt of attempts) {
      element = document.querySelector(attempt)
      if (element) break
    }
  } else if (selectorPath.includes('dosageDuration')) {
    if (selectorPath === 'dosageDuration') {
      if (message.includes('value') || message.includes('Duration must')) {
        attempts = [
          'input[name*="dosageDuration.value"]',
          '[name="dosageDuration.value"]',
          '[data-error-field="dosageDuration.value"]'
        ]
      } else if (message.includes('unit') || message.includes('select duration')) {
        attempts = [
          'select[name*="dosageDuration.unit"]',
          '[name="dosageDuration.unit"]',
          '[data-error-field="dosageDuration.unit"]'
        ]
      } else {
        attempts = [
          'input[name*="dosageDuration.value"]',
          'select[name*="dosageDuration.unit"]',
          '[name*="dosageDuration"]',
          '[data-error-field*="dosageDuration"]'
        ]
      }
    } else {
      const field = selectorPath.split('.')[1]
      attempts = [
        `[name="dosageDuration.${field}"]`,
        `${field === 'value' ? 'input' : 'select'}[name*="dosageDuration.${field}"]`,
        `[data-error-field="dosageDuration.${field}"]`
      ]
    }

    for (const attempt of attempts) {
      element = document.querySelector(attempt)
      if (element) break
    }
  } else {
    attempts = [
      `[name="${selectorPath}"]`,
      `[data-error-field="${selectorPath}"]`,
      `input[name*="${selectorPath}"]`,
      `select[name*="${selectorPath}"]`
    ]

    for (const attempt of attempts) {
      element = document.querySelector(attempt)
      if (element) break
    }
  }

  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    })
  } else {
    const formContainer =
      document.querySelector('.schedule-medicine-form') ||
      document.querySelector('form') ||
      document.querySelector('.MuiBox-root')

    if (formContainer) {
      formContainer.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })

      console.error('Validation error:', message)
    }
  }
}

  const prescriptionSubmitHandler = handleSubmit(
    async (data: SubmitFormData) => {
      if (patientData?.discharge_at) {
        const dischargeDate = dayjs(Utility.convertUTCToLocal(patientData.discharge_at)).endOf('day')
        const isOneTime = data.frequency === '2' || data.frequency === 2

        if (data.selectMedicineType === 'Direct Administer') {
          if (data.prescriptionStartDate) {
            const startDate = dayjs(data.prescriptionStartDate).startOf('day')
            if (startDate.isAfter(dischargeDate)) {
              Toaster({
                type: 'error',
                message: `${t('hospital_module.prescription_start_after_discharge')} (${dayjs(Utility.convertUTCToLocal(patientData.discharge_at)).format('DD MMM YYYY')})`
              })
              return
            }
          }

          if (!isOneTime && data.prescriptionEndDate) {
            const endDate = dayjs(data.prescriptionEndDate).endOf('day')
            if (endDate.isAfter(dischargeDate)) {
              Toaster({
                type: 'error',
                message: `${t('hospital_module.prescription_end_after_discharge')} (${dayjs(Utility.convertUTCToLocal(patientData.discharge_at)).format('DD MMM YYYY')})`
              })
              return
            }
          }
        }

        if (data.selectMedicineType === 'Schedule' && data.prescriptionStartDate) {
          const startDate = dayjs(data.prescriptionStartDate).startOf('day')
          if (startDate.isAfter(dischargeDate)) {
            Toaster({
              type: 'error',
              message: `${t('hospital_module.prescription_start_after_discharge')} (${dayjs(Utility.convertUTCToLocal(patientData.discharge_at)).format('DD MMM YYYY')})`
            })
            return
          }
        }

        if (data.selectMedicineType === 'Schedule' && !isOneTime) {
          if (data.prescriptionStartDate && data.dosageDuration?.value && data.dosageDuration?.unit) {
            const durationValue = data.dosageDuration.value
            const durationUnit = data.dosageDuration.unit.toLowerCase()

            const startDate = dayjs(data.prescriptionStartDate).startOf('day')
            let calculatedEndDate: number | Dayjs

            if (durationUnit === 'days') {
              calculatedEndDate = startDate.add(durationValue - 1, 'day').endOf('day')
            } else if (durationUnit === 'weeks') {
              calculatedEndDate = startDate.add(durationValue * 7 - 1, 'day').endOf('day')
            } else if (durationUnit === 'months') {
              calculatedEndDate = startDate.add(durationValue, 'month').subtract(1, 'day').endOf('day')
            } else {
              calculatedEndDate = startDate.add(durationValue - 1, 'day').endOf('day')
            }

            if (calculatedEndDate.isAfter(dischargeDate)) {
              Toaster({
                type: 'error',
                message: `${t('hospital_module.prescription_duration_beyond_discharge')} (${dayjs(patientData.discharge_at).format('DD MMM YYYY')})`
              })
              return
            }
          }
        }
      }

      const interval = medicalMasterData?.intervalList?.find((item) => item?.value === data?.interval)
      const frequency = medicalMasterData?.prescriptionFrequency?.find((item) => item?.id == data.frequency)

      const deliveryRoute = medicalMasterData?.prescriptionDeliveryRoute?.find(
        (item) => item?.route_abbr === data.deliveryRoute
      )

      const prescriptionDuration = medicalMasterData?.prescriptionDuration?.find(
        (item) => item?.value === data.dosageDuration?.unit
      )

      const scheduleDoses = data.schedules.map((schedule: MedicineScheduleDose) => ({
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
            id: temporarilySelectedMedicine?.id,
            label: temporarilySelectedMedicine?.name,
            name: temporarilySelectedMedicine?.name,
            generic_name: temporarilySelectedMedicine?.generic_name,
            total_qty: temporarilySelectedMedicine?.total_qty || 0,
            total_central_store_qty: temporarilySelectedMedicine?.total_central_store_qty || 0,
            total_local_store_qty: temporarilySelectedMedicine?.total_local_store_qty || 0,

            frequency_key: frequency?.string_id || '',
            frequency_id: frequency?.id || '',
            frequency: data?.frequency,
            frequency_string_id: frequency?.translation_string_id || '',
            frequency_name: frequency?.label,

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
            delivery_route_label: deliveryRoute?.label,

            start_date: formatPrescriptionUTCDateTime(data.prescriptionStartDate, true),

            end_date: isOneTimeFrequency
              ? formatPrescriptionUTCDateTime(data.prescriptionStartDate, true)
              : calculateEndDate(data.prescriptionStartDate, data.dosageDuration, intervalItem),

            restart_reason: '',
            stop_reason: '',
            will_restart: false,
            side_effect: false,
            created_for: 'SINGLE',

            administer_date: toISTISOString(data.prescriptionStartDate),

            batch_list: [],

            dose_type: 'fixed_dose',
            selectMedicineType: 'Schedule'
          }
        ]
      }

      if (discharge_tab === 'TransferHospital' || discharge_tab === 'TransferEnclosure') {
        const newMedicine = payload.data[0]

        const tempKey = discharge_tab === 'TransferHospital' ? 'transfer_temp_medicines' : 'enclosure_temp_medicines'

        const existing = hospitalData[tempKey] || []
        const alreadyExists = existing.some((med: MedicineIdentifier) => med.id === newMedicine.id)

        const updatedList = alreadyExists
          ? existing.map((med: MedicineIdentifier) => (med.id === newMedicine.id ? newMedicine : med))
          : [newMedicine, ...existing]

        dispatch(updateState({ key: tempKey, value: updatedList }))
        router.replace(`/hospital/inpatient/${id}/?tab=discharge&discharge_tab=${discharge_tab}#medications-section`)

        return
      } else if (fromPage === 'editPrescription') {
        validatePrescriptionBeforeUpdate(data)
      } else if (fromPage === 'prescriptionDetail') {
        handleRestartMedicine(data)
      } else {
        submitHandler(data as unknown as BaseSyntheticEvent)
      }
    },
    (errors) => {
      scrollToFirstError(errors)
    }
  )

  useEffect(() => {
    if (!editingMedicine) return
    handleMedicineSelect(editingMedicine)
  }, [editingMedicine])

  const getUnitIdFromName = (unitName: string, medicalMasterData: MedicalMasterFormData | null) => {
    const unit = medicalMasterData?.prescriptionDosageMeasurementType?.find(
      (item) => item.unit_name === unitName || item.uom_abbr === unitName
    )

    return unit?.id || ''
  }

  const getUnitFromLabel = (unitName: string, medicalMasterData: MedicalMasterFormData | null) => {
    const unit = medicalMasterData?.prescriptionDosageMeasurementType?.find(
      (item) => item?.label?.toLowerCase() == unitName?.toLowerCase()
    )

    return unit?.key || ''
  }

  const getStringIdFromUnitName = (unitName: string, medicalMasterData: MedicalMasterFormData | null) => {
    const unit = medicalMasterData?.prescriptionDosageMeasurementType?.find(
      (item) => item.unit_name === unitName || item.uom_abbr === unitName
    )

    return unit?.string_id || ''
  }

  const calculateEndDate = (startDate: string | number | Date, dosageDuration?: DosageDuration, interval?: any, includeTime: boolean = true) => {
    if (!startDate || !dosageDuration?.value) return ''

    const start = moment(startDate)
    if (!start.isValid()) return ''
    let endDate = start.clone()
    const durationValue = Number(dosageDuration.value)

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

    return formatPrescriptionUTCDateTime(endDate, includeTime)
  }

  const handleAIDDisplay = () => {
    if (patientData?.animal_detail?.local_identifier_name && patientData?.animal_detail?.local_identifier_value) {
      return patientData?.animal_detail?.local_identifier_value
    } else {
      return patientData?.animal_detail?.animal_id
    }
  }

  const handleClearMedicine = () => {
    setTemporarilySelectedMedicine(null)
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
          {
            label:
              patientData?.animal_detail?.local_identifier_name && patientData?.animal_detail?.local_identifier_value
                ? patientData?.animal_detail?.local_identifier_name
                : 'AID',
            value: handleAIDDisplay()
          },
          { label: t('hospital_module.health_status_label'), value: patientData?.health_status || 'stable', isStatusCard: true },
          { label: t('hospital_module.location'), value: `${patientData?.bed_name}, ${patientData?.room_name}` },
          { label: t('hospital_module.consulting_veterinarian'), value: patientData?.attend_by_full_name }
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
              {t('hospital_module.select_medicine_to')}
            </Typography>
          </Grid>
          {!isDischargedAnimal && (
            <Grid size={{ xs: 12, md: 4, lg: 4 }}>
              <TreatmentTypeRadioButtons
                label={(t('hospital_module.schedule') as string)}
                isSelected={watch('selectMedicineType') === 'Schedule'}
                sx={{
                  borderColor: `${theme.palette.customColors.OutlineVariant}`
                }}
                onClick={() => setValue('selectMedicineType', 'Schedule')}
              />
            </Grid>
          )}
          {(!discharge_tab && !fromPage) || isDischargedAnimal ? (
            <Grid size={{ xs: 12, md: 4, lg: 4 }}>
              <TreatmentTypeRadioButtons
                label={(t('hospital_module.direct_administer') as string)}
                isSelected={watch('selectMedicineType') === 'Direct Administer'}
                sx={{
                  borderColor: `${theme.palette.customColors.OutlineVariant}`
                }}
                onClick={() => setValue('selectMedicineType', 'Direct Administer')}
              />
            </Grid>
          ) : null}
        </Grid>
        <Grid container spacing={5} className='match-height' sx={{ pt: 6 }}>
          <Grid size={{ xs: 12, md: 6, lg: 6 }}>
            <PrescriptionMedicineList
              medicineList={apiMedicineList.length > 0 ? apiMedicineList : []}
              temporarilySelectedMedicine={temporarilySelectedMedicine}
              handleClearMedicine={handleClearMedicine}
              selectedMedicine={selectedMedicine ? selectedMedicine?.id : null}
              onSelect={handleMedicineSelect}
              searchQuery={
                fromPage === 'prescriptionDetail' || medicine_edit_id || fromPage === 'editPrescription'
                  ? temporarilySelectedMedicine?.name
                  : medicineSearchQuery
              }
              handleSearchChange={handleMedicineSearch}
              handleClearSearch={handleClearSearch}
              isDirectAdminister={watch('selectMedicineType') === 'Direct Administer'}
              handleScroll={handleScroll}
              loading={isInitialDataLoading}
              paginationLoading={medicineLoading}
              searching={searching}
              error={(errors as any).selectedMedicine?.message || (errors as any).selectedMedicineId?.message}
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
              patientData={patientData}
            />
          </Grid>
        </Grid>
      </Box>

      <BottomActionBar
        submitLabel={
          fromPage === 'editPrescription'
            ? t('hospital_module.update_medicine')
            : fromPage === 'prescriptionDetail'
            ? t('hospital_module.restart_medicine')
            : watch('selectMedicineType') === 'Direct Administer'
            ? t('hospital_module.administer_title')
            : t('hospital_module.schedule_title')
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
          title={(t('hospital_module.caused_adverse_side_effects') as string)}
          cancelText={'No'}
          confirmBtnStyle={{ background: theme.palette.primary.main, py: 2 }}
          image={'/images/warning-icon.svg'}
          imgStyle={{ background: theme.palette.customColors.mdAntzNeutral, p: 4 }}
          confirmAction={handleSideEffectConfirm}
          loading={sideEffectMedicinesLoading}
          ConfirmationText={'YES'}
          description={''}
        />
      )}
    </Box>
  )
}
