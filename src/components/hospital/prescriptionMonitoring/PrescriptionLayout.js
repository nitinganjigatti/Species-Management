import { Grid, Box } from '@mui/system'
import React, { useCallback, useEffect, useState } from 'react'
import PrescriptionMonitoringGrid from './PrescriptionMonitoringGrid'
import { AdministerMedicineModal, MedicineScheduleView } from 'src/views/pages/hospital/prescription-monitoring'
import MedicinePrescriptionCard from 'src/views/pages/hospital/prescription-monitoring/MedicinePrescriptionCard'
import { useRouter } from 'next/router'
import { useHospital } from 'src/context/HospitalContext'
import Toaster from 'src/components/Toaster'
import {
  addDirectAdministerPrescription,
  administerAllMedicines,
  administerDose,
  administerPrescription,
  getDates,
  getMedicineBatches,
  getPrescriptionDetails,
  getPrescriptions,
  schedulePrescription,
  skipPrescription,
  stopPrescription
} from 'src/lib/api/hospital/prescription'
import Utility from 'src/utility'
import { status } from 'nprogress'
import AdministerOrSkipModal from 'src/views/pages/hospital/prescription-monitoring/AdministerOrSkipModal'
import { SelectAll } from '@mui/icons-material'
import { getMedicalMasterData } from 'src/lib/api/hospital/medicalMaster'
import { debounce, set } from 'lodash'
import ScheduleDosage from 'src/views/pages/hospital/prescription-monitoring/ScheduleDosage'
import moment from 'moment'

function PrescriptionLayout({ drawerType }) {
  const [openSchedule, setOpenSchedule] = useState(false)
  const [prescriptionCardOpen, setPrescriptionCardOpen] = useState(false)
  const [medicationData, setMedicationData] = useState([])
  const [dates, setDates] = useState(null)
  const [medicineDetails, setMedicineDetails] = useState(null)
  const [detailDates, setDetailDates] = useState(null)
  const [detailSelectedDate, setDetailSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isDatesLoading, setIsDatesLoading] = useState(false)
  const [isAdministerFormOpen, setIsAdministerFormOpen] = useState(true)
  const [isPrescriptionListLoading, setIsPrescriptionListLoading] = useState(false)
  const [isCurrentMedicalRecord, setIsCurrentMedicalRecord] = useState(false)
  const [isAdministerOrSkipPopupOpen, setIsAdministerOrSkipPopupOpen] = useState(false)
  const [isAdministerOrSkipPopupLoading, setIsAdministerOrSkipPopupLoading] = useState(false)
  const [selectedMedicine, setSelectedMedicine] = useState(null)
  const [isSelectedAll, setIsSelectedAll] = useState(false)
  const [isSkipLoading, setIsSkipLoading] = useState(false)
  const [isAdministerLoading, setIsAdministerLoading] = useState(false)
  const [medicalMasterData, setMedicalMasterData] = useState(null)
  const [medicalMasterDataLoading, setMedicalMasterDataLoading] = useState(false)
  const [administerModelOpen, setAdministerModelOpen] = useState(false)
  const [batchList, setBatchList] = useState([])
  const [batchSearchQuery, setBatchSearchQuery] = useState('')
  const [batchLoading, setBatchLoading] = useState(false)
  const [selectedSlotData, setSelectedSlotData] = useState(null)
  const [isScheduleDosageModelOpen, setIsScheduleDosageModelOpen] = useState(false)
  const [isAddDosageModelOpen, setIsAddDosageModelOpen] = useState(false)
  const [isAdministerDosageModelOpen, setIsAdministerDosageModelOpen] = useState(false)
  const [inpatientId, setInpatientId] = useState(null)
  const [selectedMedicationsFromDetail, setSelectedMedicationsFromDetail] = useState([])

  const today = new Date().toISOString().split('T')[0] // gives 'YYYY-MM-DD'
  const [selectedDate, setSelectedDate] = useState(today)
  const router = useRouter()
  const { selectedHospital: hospital } = useHospital()

  const { medical_record_id, animal_id } = router.query

  const handleGetInpatientId = () => {
    try {
      const url = window.location.href
      const parsedUrl = new URL(url)
      const pathParts = parsedUrl.pathname.split('/').filter(Boolean)
      const inpatientId = pathParts[2] // e.g. "161"

      return inpatientId
    } catch (error) {
      console.error('Invalid URL:', error)

      return null
    }
  }

  useEffect(() => {
    const inpatientId = handleGetInpatientId()
    setInpatientId(inpatientId)
  }, [window.location.href])

  const handleDateChange = date => {
    setSelectedDate(date)
  }

  // Handle prescription card actions
  const handleOpenPrescriptionCard = data => {
    getPrescriptionDates(data)
    setPrescriptionCardOpen(true)
  }

  const handleClosePrescriptionCard = () => {
    setPrescriptionCardOpen(false)
  }

  const handleStopMedicine = async data => {
    console.log('Stop medicine confirmed:', data)
    console.log('medicineData:', data.medicineData)
    try {
      const payload = {
        medical_record_id: medical_record_id,
        prescription_id: medicineDetails?.medicine_id, // medicine_id
        type: 'prescription',
        status: 'stop',
        note: data.note,
        side_effect: data.hasAdverseEffects === 'yes',
        case: 'single',
        main_prescription_id: medicineDetails?.prescription_id // prescription_id
      }

      const response = await stopPrescription(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Medicine stopped successfully' })

        // Refresh the prescription list
        getPrescriptionList()

        // Refresh the details if the card is still open
        if (prescriptionCardOpen) {
          getDetails(medicineDetails, detailSelectedDate)
        }
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {
      console.error('Error stopping medicine:', error)
      Toaster({ type: 'error', message: error?.message || 'Failed to stop medicine' })
    }
  }

  const handleAddNewDosage = async formData => {
    setIsAddDosageModelOpen(true)
    if (!medicalMasterData) fetchMedicalMasterData()
      try {
        const payload = {
          animal_id: animal_id,
          hospital_case_id: inpatientId,
          prescription_id: selectedSlotData?.data?.prescription_id,
          medical_record_id: medical_record_id,
          medicine_id: selectedSlotData?.data?.medicine_id,
          medicine_name: selectedSlotData?.data?.name,
          schedule_date: selectedDate,
          dosage_times: formData?.schedules.map(item => ({
            time: convertUTCToLocaltime(item?.time),
            quantity: item?.dosageQuantity,
            unit_id: fetchUnit(item?.dosageUnit)?.id
          })),
          apply_dosage: formData?.apply_dosage === 'till_end' ? 'till_prescription_ends' : 'only_for_this_day'
        }
  
        const response = await schedulePrescription(payload)
        if (response?.success) {
          setIsScheduleDosageModelOpen(false)
          Toaster({ type: 'success', message: response?.message })
        } else {
          Toaster({ type: 'error', message: response?.message })
        }
      } catch (error) {
        console.error('Error:', error)
      }
  }

  const handleRefreshEntry = (entryId, medicineData) => {
    console.log('Refresh entry:', entryId, medicineData)

    if (medicineData && detailSelectedDate) {
      getDetails(medicineData, detailSelectedDate)
    }
  }

  const getPrescriptionList = async () => {
    try {
      setIsPrescriptionListLoading(true)

      const payload = {
        hospital_id: hospital?.id || '',
        animal_id: animal_id || '',
        medical_type: 'prescription',
        type: 'active',
        medical_record_id: medical_record_id || '',
        generate_for_date: selectedDate,
        medical_record_id: isCurrentMedicalRecord ? medical_record_id : ''
      }

      const response = await getPrescriptions(payload)

      if (response?.success) {
        setDates(response?.data?.schedulded_date)
        const dates = response?.data?.schedulded_date
        if (dates?.length && !selectedDate) setSelectedDate(selectedDate)

        const prescriptions = response?.data?.prescriptions?.map(item => ({
          ...item,
          status: status?.toLowerCase()
        }))
        setMedicationData(prescriptions)
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {
      Toaster({ type: 'error', message: error || 'Something went wrong' })
    } finally {
      setIsPrescriptionListLoading(false)
    }
  }

  const getDetails = async (data, date) => {
    try {
      setIsDetailLoading(true)

      const payload = {
        prescription_id: data?.id || medicineDetails?.prescription_id,
        date: detailSelectedDate,
        group_prescription_id: data?.id || medicineDetails?.prescription_id
      }

      const response = await getPrescriptionDetails(payload)

      if (response?.success) {
        const data = {
          ...response?.data,
          medicine_timings:
            response?.data?.medicine_timings?.map(item => ({
              ...item,
              id: item?.administritive_id,
              time: item?.administritive_time || item?.scheduled_time,

              status: item?.status?.toLowerCase() === 'administrator' ? 'administered' : item?.status?.toLowerCase(),
              variant: item?.status?.toLowerCase() === 'administrator' ? 'administered' : item?.status?.toLowerCase(),
              dosage: `${item?.scheduled_unit_id} ${item?.scheduled_unit_name}`,
              amount: item?.scheduled_quantity,
              wastage: item?.wastage_quantity,
              wastageNote: item?.wastage_note,
              batchNumber: item?.batch_details[0]?.batch_number,
              administeredBy: item?.user_full_name,
              administeredAt: item?.administritive_time,
              icon:
                item?.status === 'Administered'
                  ? 'mdi:check-circle'
                  : item?.status === 'Skipped'
                  ? 'jam:stop-sign'
                  : item?.status === 'Stopped'
                  ? 'jam:stop-sign'
                  : 'mdi:clock-outline'
            })) || []
        }
        setMedicineDetails(data)
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {
      Toaster({ type: 'error', message: error || 'Something went wrong' })
    } finally {
      setIsDetailLoading(false)
    }
  }

  const getPrescriptionDates = async data => {
    try {
      setIsDatesLoading(true)

      const payload = {
        from_date: dates?.length && dates[0],
        to_date: new Date().toISOString().slice(0, 10),
        type: 'all',
        prescription_id: data?.id,
        group_prescription_id: data?.group_prescription_id || data?.id
      }

      const response = await getDates(payload)

      if (response?.success) {
        const mappedDates = response?.data?.map(item => item?.date)
        setDetailDates(mappedDates)
        getDetails(data)
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {
      Toaster({ type: 'error', message: error || 'Something went wrong' })
    } finally {
      setIsDatesLoading(false)
    }
  }

  const handleAdministerOrSkipClose = () => setIsAdministerOrSkipPopupOpen(false)

  const handleAdministerOrSubmit = async data => {
    setIsAdministerOrSkipPopupLoading(true)
    console.log('handleAdministerOrSubmit data', data)
    try {
      const wastageUnit = medicalMasterData?.prescriptionMeasurementType?.find(
        item => item.uom_abbr === data?.wastageUnit
      )

      const formattedTime = Utility?.convertUTCToLocaltime(data.time)

      const time24 = new Date(`1970-01-01 ${formattedTime}`).toLocaleTimeString('en-GB', {
        hour12: false
      })

      // Process the form data based on action type
      const payload = {
        medical_record_id: JSON.stringify([medical_record_id]),
        medicine_id: JSON.stringify([selectedSlotData?.timeSlot?.medicine_id]),
        type: 'single',
        purpose: data.action === 'administer' ? 'administer' : 'withheld',
        side_effect: 0,
        administer_id: JSON.stringify([selectedSlotData?.timeSlot?.schedule_id]),
        batch_details: JSON.stringify([
          {
            id: data?.batchNumber?.id,
            batch_no: data?.batchNumber?.batch_no,
            animal_id: [animal_id],
            wastage_quantity: data?.wastageQuantity,
            reason: data?.skipReason,
            wastage_unit_id: wastageUnit?.id
          }
        ]),
        administritive_time: time24,
        group_prescription_id: data?.group_prescription_id || data?.id
      }
      const response = await administerDose(payload)
      if (response?.success) {
        Toaster({ type: 'success', message: response?.message })
        setIsAdministerOrSkipPopupOpen(false)
        getPrescriptionList()
      } else {
        Toaster({ type: 'error', message: response?.message })
      }

      // handleClose()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsAdministerOrSkipPopupLoading(false)
    }
  }

  useEffect(() => {
    if (detailDates?.length) {
      getDetails(medicineDetails, detailSelectedDate)
    }
  }, [detailSelectedDate])

  useEffect(() => {
    if (hospital?.id) getPrescriptionList()
  }, [hospital?.id, selectedDate, isCurrentMedicalRecord])

  const handleAdministerSubmit = formData => {
    console.log('Administer Medicine Form Submitted:', formData)
    try {
      const payload = {
        record_date: '',
        animal_id: JSON.stringify([animal_id]),
        created_for: 'DIRECT_ADMINISTER',
        prescription: [{
          start_date: "2025-10-09T05:28:34.964Z",
          end_date: "2025-10-09T05:28:34.964Z", 
          schedule_doses: [{
            id: '',
            time: convertUTCToLocaltime(formData?.time),
            quantity: formData?.quantity,
            unit_id: fetchUnit(formData?.quantityUnit)?.id,
            unit_name: fetchUnit(formData?.quantityUnit)?.unit_name,
            string_id: fetchUnit(formData?.quantityUnit)?.string_id
          }],
        }],
        request_from: 'hospital_module',
        medical_record_id: medical_record_id,
        is_unscheduled: 1,
        prescription_id: selectedSlotData?.data?.medicine_id,
        medicine_id: selectedSlotData?.data?.medicine_id,
        medical_record_type: 'SINGLE',
        case_type: 1,
      }

      // administerMedicine(payload)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      console.log('Administer')
    }
  }

  function convertUTCToLocaltime(date) {
    if (!date) return ''
    const stillUtc = moment.utc(date).toDate()

    const local = moment(stillUtc).local(true).format('hh:mm:A') // 👈 adds leading zero + spaces around colons

    return local
  }

  const fetchUnit = unit => {
    const unitData = medicalMasterData?.prescriptionMeasurementType?.find(item => item?.uom_abbr === unit)

    return unitData?.id
  }

  const handleScheduleSubmit = async formData => {
    console.log('Administer Medicine Form Submitted:', formData)

    try {
      const payload = {
        animal_id: animal_id,
        hospital_case_id: inpatientId,
        prescription_id: selectedSlotData?.data?.prescription_id,
        medical_record_id: medical_record_id,
        medicine_id: selectedSlotData?.data?.medicine_id,
        medicine_name: selectedSlotData?.data?.name,
        schedule_date: selectedDate,
        dosage_times: formData?.schedules.map(item => ({
          time: convertUTCToLocaltime(item?.time),
          quantity: item?.dosageQuantity,
          unit_id: fetchUnit(item?.dosageUnit)?.id
        })),
        apply_dosage: formData?.apply_dosage === 'till_end' ? 'till_prescription_ends' : 'only_for_this_day'
      }

      const response = await schedulePrescription(payload)
      if (response?.success) {
        setIsScheduleDosageModelOpen(false)
        Toaster({ type: 'success', message: response?.message })
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleAddDosageSubmit = async formData => {
    console.log('Administer Medicine Form Submitted:', formData)

    try {
      const payload = {
        animal_id: animal_id,
        hospital_case_id: inpatientId,
        prescription_id: medicineDetails?.prescription_id,
        medical_record_id: medical_record_id,
        medicine_id: medicineDetails?.medicine_id,
        medicine_name: medicineDetails?.medicine_name,
        schedule_date: detailSelectedDate,
        dosage_times: formData?.schedules.map(item => ({
          time: convertUTCToLocaltime(item?.time),
          quantity: item?.dosageQuantity,
          unit_id: fetchUnit(item?.dosageUnit)?.id
        })),
        apply_dosage: formData?.apply_dosage === 'till_end' ? 'till_prescription_ends' : 'only_for_this_day'
      }

      const response = await schedulePrescription(payload)
      if (response?.success) {
        Toaster({ type: 'success', message: response?.message })
        setIsAddDosageModelOpen(false)
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleDetailDateChange = date => {
    console.log('Detail date changed to:', date)
    setDetailSelectedDate(date)
  }

  const handleSelectAllAdministerrOrSkip = async purpose => {
    try {
      const payload = {
        administer_date: Utility.convertUTCToLocalDate(new Date().toISOString().slice(0, 10)),
        type: 'single',
        purpose: purpose,
        administritive_time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        select_all: 1,
        q: '',
        ignored_ids: [],
        animal_id: animal_id,
        medical_record_id: JSON.stringify([medical_record_id])
      }

      const response = await administerAllMedicines(payload)
      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Medicines administered successfully' })
        getPrescriptionList()
      } else {
        Toaster({ type: 'error', message: 'Something went wrong' }) // TODO: Update to error message
      }
    } catch (error) {
      Toaster({ type: 'error', message: 'Something went wrong' })
    } finally {
      setIsAdministerLoading(false)
      setIsSkipLoading(false)
    }
  }

  const handleSingleOrMultipleDoseAdministerOrSkip = async (data, purpose) => {
    try {
      const medicineIds = data?.map(item => item?.medicine_id).filter(Boolean)

      const administerIds = JSON.stringify(
        data
          ?.flatMap(item => item?.timeSlots || []) // merge all timeSlots from all items
          .map(slot => {
            if (slot?.value?.schedule_id && (!slot?.value?.status || slot?.value?.status?.toLowerCase() === 'pending'))
              return slot?.value?.schedule_id
          }) // extract schedule_id
          .filter(Boolean) // remove null/undefined
      )

      const payload = {
        medical_record_id: JSON.stringify([medical_record_id]),
        medicine_id: data?.length > 1 ? JSON.stringify(medicineIds) : JSON.stringify([data[0]?.medicine_id]),
        type: 'single',
        purpose: purpose,
        side_effect: 0,
        administer_id: administerIds,
        batch_details: [],
        administritive_time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        group_prescription_id: data?.group_prescription_id || data?.id
      }

      const response = await administerDose(payload)
      if (response?.success) {
        Toaster({ type: 'success', message: response?.message })
        getPrescriptionList()
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {
      Toaster({ type: 'error', message: error || 'Something went wrong' })
    } finally {
      setIsAdministerLoading(false)
      setIsSkipLoading(false)
    }
  }

  const handleAdminister = async data => {
    console.log('Administer clicked for selected metrics:', data)
    console.log('SelectAll', SelectAll, data?.length, medicationData?.length)
    setIsAdministerLoading(true)
    if (SelectAll && data?.length === medicationData?.length) {
      handleSelectAllAdministerrOrSkip('administer')
    } else {
      handleSingleOrMultipleDoseAdministerOrSkip(data, 'administer')
    }
  }

  const handleSkip = async data => {
    console.log('Administer clicked for selected metrics:', data)
    console.log('SelectAll', SelectAll, data?.length, medicationData?.length)
    setIsSkipLoading(true)
    if (SelectAll && data?.length === medicationData?.length) {
      handleSelectAllAdministerrOrSkip('withheld')
    } else {
      handleSingleOrMultipleDoseAdministerOrSkip(data, 'withheld')
    }
  }

  const fetchMedicalMasterData = useCallback(async () => {
    try {
      setMedicalMasterDataLoading(true)
      const response = await getMedicalMasterData()
      if (response?.success) {
        setMedicalMasterData({
          ...response?.data,

          // prescriptionFrequency: frequencyData || [],
          prescriptionDosageMeasurementType:
            response?.data?.prescriptionDosageMeasurementType?.map(item => ({ ...item, value: item.key })) || [],
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
    } finally {
      setMedicalMasterDataLoading(false)
    }
  }, [])

  const handleAdministerOrSkipOpen = data => {
    setSelectedSlotData(data)

    // setSelectedMedicine(data)
    if (!medicalMasterData) {
      fetchMedicalMasterData()
    }
    setBatchList([])
    setIsAdministerOrSkipPopupOpen(true)
  }

  const handleAdministerSelectedFromDrawer = async (selectedItems, medicineData) => {
    console.log('Administer selected medications from drawer:', selectedItems, medicineData)

    try {
      setIsAdministerLoading(true)

      // Extract administritive_ids from selected items
      const administerIds = JSON.stringify(selectedItems.map(item => item?.administritive_id).filter(Boolean))

      const payload = {
        medical_record_id: JSON.stringify([medical_record_id]),
        medicine_id: JSON.stringify([medicineData?.medicine_id]),
        type: 'single',
        purpose: 'administer',
        side_effect: 0,
        administer_id: administerIds,
        batch_details: [],
        administritive_time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        group_prescription_id: medicineData?.group_prescription_id || medicineData?.id
      }

      const response = await administerDose(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Medications administered successfully' })
        setSelectedMedicationsFromDetail([])

        // Refresh the prescription list
        getPrescriptionList()

        // Refresh the drawer details
        if (prescriptionCardOpen && medicineData) {
          getDetails(medicineData, detailSelectedDate)
        }

        // Close the drawer after successful action
        // handleClosePrescriptionCard()
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to administer medications' })
      }
    } catch (error) {
      console.error('Error administering medications:', error)
      Toaster({ type: 'error', message: error?.message || 'Something went wrong' })
    } finally {
      setIsAdministerLoading(false)
    }
  }

  const handleSkipSelectedFromDrawer = async (selectedItems, medicineData) => {
    console.log('Skip selected medications from drawer:', selectedItems, medicineData)

    try {
      setIsSkipLoading(true)

      // Extract administritive_ids from selected items
      const administerIds = JSON.stringify(selectedItems.map(item => item?.administritive_id).filter(Boolean))

      const payload = {
        medical_record_id: JSON.stringify([medical_record_id]),
        medicine_id: JSON.stringify([medicineData?.medicine_id]),
        type: 'single',
        purpose: 'withheld', // "withheld" for skip
        side_effect: 0,
        administer_id: administerIds,
        batch_details: [],
        administritive_time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        group_prescription_id: medicineData?.group_prescription_id || medicineData?.id
      }

      const response = await administerDose(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Medications skipped successfully' })
        setSelectedMedicationsFromDetail([])

        // Refresh the prescription list
        getPrescriptionList()

        // Refresh the drawer details
        if (prescriptionCardOpen && medicineData) {
          getDetails(medicineData, detailSelectedDate)
        }

        // Close the drawer after successful action
        // handleClosePrescriptionCard()
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to skip medications' })
      }
    } catch (error) {
      console.error('Error skipping medications:', error)
      Toaster({ type: 'error', message: error?.message || 'Something went wrong' })
    } finally {
      setIsSkipLoading(false)
    }
  }

  const debouncedBatchSearch = useCallback(
    debounce(async (medicineId, query = '') => {
      if (!medicineId) {
        console.log('No medicineId provided, skipping batch fetch')
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
          setBatchList(response?.data?.result.map(item => ({ ...item, label: item?.batch_no, value: item?.id })) || [])
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
      console.log('Fetching batches for medicineId:', medicineId, 'with query:', query)
      debouncedBatchSearch(medicineId, query)
    },
    [debouncedBatchSearch]
  )

  const handleBatchSearch = value => {
    console.log('Batch search triggered with value:', value)
    setBatchSearchQuery(value)
    const medicineId = selectedSlotData?.timeSlot?.medicine_id || selectedSlotData?.data?.medicine_id

    // console.log('Calling fetchMedicineBatches for medicine:', temporarilySelectedMedicine.id)
    fetchMedicineBatches(medicineId, value)
  }

  const addPrescriptionToTimeslot = async (type, data) => {
    console.log('addPrescriptionToTimeslot', type, data)
    setSelectedSlotData(data)
    if (!medicalMasterData) fetchMedicalMasterData()
    setBatchList([])
    if (type === 'past') {
      setIsAdministerDosageModelOpen(true)
    } else if (type === 'future') {
      setIsScheduleDosageModelOpen(true)
    }
    console.log('addPrescriptionToTimeslot', type, data)
  }

  return (
    <Box>
      <Grid container spacing={2} sx={{ alignItems: 'center' }}>
        {/* <Button onClick={() => setOpenSchedule(true)}>View Sample Schedule</Button> */}
        <Grid xs={12}>
          <PrescriptionMonitoringGrid
            onOpenPrescriptionCard={handleOpenPrescriptionCard}
            medications={medicationData}
            isLoading={isPrescriptionListLoading}
            setIsSelectedAll={() => setIsSelectedAll(!isSelectedAll)}

            // medications={medication}
            setIsCurrentMedicalRecord={setIsCurrentMedicalRecord}
            isCurrentMedicalRecord={isCurrentMedicalRecord}
            dates={dates}
            selectedDate={selectedDate}
            handleDateChange={handleDateChange}
            selectedMedicine={selectedMedicine}
            setSelectedMedicine={setSelectedMedicine}
            isAdministerLoading={isAdministerLoading}
            isSkipLoading={isSkipLoading}
            handleAdminister={handleAdminister}
            handleSkip={handleSkip}
            handleAdministerOrSkipOpen={handleAdministerOrSkipOpen}
            addPrescriptionToTimeslot={addPrescriptionToTimeslot}
          />
        </Grid>
      </Grid>
      {/* <Grid size={{ xs: 12 }}>
        <Button
          slotProps={{
            size: {}
          }}
          variant='outlined'
          onClick={handleOpenPrescriptionCard}
          sx={{ mt: 2 }}
        >
          View Medicine Prescription Details
        </Button>
      </Grid> */}
      {/* <MedicineScheduleView
        open={openSchedule}
        onClose={() => setOpenSchedule(false)}
        medicineData={medicineDetails}
        onStopMedicine={() => setOpenSchedule(false)}
        onAddDosage={() => {}}
      /> */}

      {/* <MedicationAdministerForm
        open={isAdministerFormOpen}
        onClose={() => setIsAdministerFormOpen(false)}
        medicationData={dummyMedicationData}
      /> */}
      {/* Medicine Prescription Card Drawer */}

      <AdministerMedicineModal
        handleSidebarOpen={isAdministerDosageModelOpen}
        handleSidebarClose={() => setIsAdministerDosageModelOpen(false)}
        scheduleDosage={selectedSlotData}
        onSubmit={handleAdministerSubmit}
        batchList={batchList}
        batchLoading={batchLoading}
        handleBatchSearch={handleBatchSearch}
        selectedDate={selectedDate}
        medicalMasterData={medicalMasterData}
        isControlledSubstance={selectedSlotData?.data?.controlled_substance == 1}
      />
      <ScheduleDosage
        handleOpen={isScheduleDosageModelOpen}
        handleSidebarClose={() => setIsScheduleDosageModelOpen(false)}
        scheduleDosage={selectedSlotData}
        onSubmit={handleScheduleSubmit}
        batchList={batchList}
        batchLoading={batchLoading}
        handleBatchSearch={handleBatchSearch}
        selectedDate={selectedDate}
        medicalMasterData={medicalMasterData}
        isControlledSubstance={selectedSlotData?.data?.controlled_substance == 1}
      />
      {/* Add dosage flow */}
      <ScheduleDosage
        label='Add Dosage'
        handleOpen={isAddDosageModelOpen}
        handleSidebarClose={() => setIsAddDosageModelOpen(false)}
        scheduleDosage={{
          data: {
            ...medicineDetails,
            name: medicineDetails?.medicine_name || '-'
          }
        }}
        onSubmit={handleAddDosageSubmit}
        batchList={batchList}
        batchLoading={batchLoading}
        handleBatchSearch={handleBatchSearch}
        selectedDate={detailSelectedDate}
        medicalMasterData={medicalMasterData}
        isControlledSubstance={selectedSlotData?.data?.controlled_substance == 1}
      />

      <MedicinePrescriptionCard
        open={prescriptionCardOpen}
        onClose={handleClosePrescriptionCard}
        isDetailLoading={isDetailLoading}
        isDatesLoading={isDatesLoading}
        selectedMedications={selectedMedicationsFromDetail}
        setSelectedMedications={setSelectedMedicationsFromDetail}
        medicineData={{
          ...medicineDetails,
          name: medicineDetails?.medicine_name || '-',
          medId: medicineDetails?.medical_record_code || '-',
          startDate: medicineDetails?.start_date || '-',
          endDate: medicineDetails?.end_date || '-',
          dosage: medicineDetails?.dose_count ? `${medicineDetails?.dose_count} Times` : '-',
          frequency: medicineDetails?.frequency || '-',
          duration: medicineDetails?.duration || '-',
          deliveryRoute: medicineDetails?.delivery_route_name || '-',
          notes: medicineDetails?.notes || '-',
          lastEdited:
            medicineDetails?.updated_at || medicineDetails?.created_at
              ? `Last edited on ${Utility.convertUTCToLocaltime(
                  medicineDetails?.updated_at || medicineDetails?.created_at
                )} • ${Utility.formatDisplayDate(medicineDetails?.updated_at || medicineDetails?.created_at)}`
              : '-',
          defaultTab: 2,
          prescription_id: medicineDetails?.prescription_id,
          group_prescription_id: medicineDetails?.group_prescription_id,
          medicine_id: medicineDetails?.medicine_id,
          id: medicineDetails?.id
        }}
        dosageEntries={medicineDetails?.medicine_timings || []}
        dateOptions={detailDates}
        onStopMedicine={handleStopMedicine}
        onAddNewDosage={handleAddNewDosage}
        onRefreshEntry={handleRefreshEntry}
        handleDateChange={handleDetailDateChange}
        selectedDate={detailSelectedDate}
        onAdministerSelected={handleAdministerSelectedFromDrawer}
        onSkipSelected={handleSkipSelectedFromDrawer}
        isAdministerLoading={isAdministerLoading}
        isSkipLoading={isSkipLoading}
      />
      <AdministerOrSkipModal
        open={isAdministerOrSkipPopupOpen}
        handleClose={handleAdministerOrSkipClose}
        onSubmit={handleAdministerOrSubmit}
        medicalMasterData={medicalMasterData}
        submitLoader={isAdministerOrSkipPopupLoading}
        mastersDataLoading={medicalMasterDataLoading}
        batchList={batchList}
        batchLoading={batchLoading}
        handleBatchSearch={handleBatchSearch}
        isControlledSubstance={selectedSlotData?.data?.controlled_substance == 1}
        scheduledDate={selectedDate}
        medicineData={{
          ...selectedSlotData,
          data: selectedSlotData?.data,
          scheduled_time: selectedSlotData?.scheduled_time,
          status: selectedSlotData?.status,
          timeSlot: selectedSlotData?.timeSlot,
          dosage: selectedSlotData?.timeSlot?.dosage || ''
        }}
      />
    </Box>
  )
}

export default React.memo(PrescriptionLayout)