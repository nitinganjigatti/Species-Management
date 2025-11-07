import { Grid, Box } from '@mui/system'
import React, { useEffect, useState } from 'react'
import PrescriptionMonitoringGrid from './PrescriptionMonitoringGrid'
import { AdministerMedicineModal, MedicineScheduleView } from 'src/views/pages/hospital/prescription-monitoring'
import MedicinePrescriptionCard from 'src/views/pages/hospital/prescription-monitoring/MedicinePrescriptionCard'
import { useRouter } from 'next/router'
import { useHospital } from 'src/context/HospitalContext'
import Toaster from 'src/components/Toaster'
import {
  administerAllMedicines,
  administerDose,
  administerPrescription,
  getDates,
  getPrescriptionDetails,
  getPrescriptions,
  skipPrescription,
  stopPrescription
} from 'src/lib/api/hospital/prescription'
import Utility from 'src/utility'
import { status } from 'nprogress'
import AdministerOrSkipModal from 'src/views/pages/hospital/prescription-monitoring/AdministerOrSkipModal'
import { SelectAll } from '@mui/icons-material'

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

  const today = new Date().toISOString().split('T')[0] // gives 'YYYY-MM-DD'
  const [selectedDate, setSelectedDate] = useState(today)
  const router = useRouter()
  const { selectedHospital: hospital } = useHospital()

  const { medical_record_id, animal_id } = router.query

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
        Toaster({ type: 'success', message: 'Medicine stopped successfully' })

        // Refresh the prescription list
        getPrescriptionList()

        // Refresh the details if the card is still open
        if (prescriptionCardOpen) {
          getDetails(medicineDetails, detailSelectedDate)
        }
      } else {
        Toaster({ type: 'error', message: response?.message })
      }

      // For now, just show a success message
      Toaster({
        type: 'success',
        message: `Medicine stopped. Reason: ${data.reason}. Adverse effects: ${data.hasAdverseEffects}`
      })

      // Optionally refresh the data
      // getPrescriptionList()
      // if (prescriptionCardOpen && medicineDetails) {
      //   getDetails(medicineDetails, detailSelectedDate)
      // }
    } catch (error) {
      console.error('Error stopping medicine:', error)
      Toaster({ type: 'error', message: error?.message || 'Failed to stop medicine' })
    }
  }

  const handleAddNewDosage = medicineData => {
    console.log('Add new dosage:', medicineData)
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
        prescription_id: data?.id,
        date: detailSelectedDate,
        group_prescription_id: data?.id
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

              status: item?.status,

              // status: 'Administered',

              variant: item?.status?.toLowerCase(),

              // variant: 'administered',
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

  const handleSubmit = async data => {
    setIsAdministerOrSkipPopupLoading(true)

    try {
      // Process the form data based on action type
      if (data.action === 'administer') {
        console.log('Administering medicine with data:', {
          time: data.time,
          quantity: data.quantity,
          quantityUnit: data.quantityUnit,
          wastageQuantity: data.wastageQuantity,
          wastageUnit: data.wastageUnit,
          notes: data.notes,
          batchNumber: data.batchNumber,
          attachment: data.attachment
        })

        // Your API call for administering medicine
        // await administerMedicine(data)
      } else if (data.action === 'skipped') {
        console.log('Skipping medicine with data:', {
          time: data.time,
          quantity: data.quantity,
          quantityUnit: data.quantityUnit,
          skipReason: data.skipReason
        })

        // Your API call for skipping medicine
        // await skipMedicine(data)
      }

      // Success handling
      alert('Action completed successfully!')

      // handleClose()
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred')
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

    // Add your logic here
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

  const handleAdministerOrSkipOpen = data => {
    setSelectedMedicine(data)
    console.log('data in handleAdministerOrSkipOpen:', data)
    setIsAdministerOrSkipPopupOpen(true)
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

      {/* <AdministerMedicineModal
              isSidebarOpen={isAdministerFormOpen}
              handleSidebarClose={() => setIsAdministerFormOpen(false)}
              scheduleDosage={dummyMedicationData}
              onSubmit={handleAdministerSubmit}
            /> */}
      {/* <ScheduleDosage
              isOpen={isAdministerFormOpen}
              handleSidebarClose={() => setIsAdministerFormOpen(false)}
              scheduleDosage={dummyMedicationData}
              onSubmit={handleAdministerSubmit}
            /> */}

      <MedicinePrescriptionCard
        open={prescriptionCardOpen}
        onClose={handleClosePrescriptionCard}
        isDetailLoading={isDetailLoading}
        isDatesLoading={isDatesLoading}
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

          // Pass additional data needed for API calls
          prescription_id: medicineDetails?.prescription_id,
          group_prescription_id: medicineDetails?.group_prescription_id
        }}
        dosageEntries={medicineDetails?.medicine_timings || []}
        dateOptions={detailDates}
        onStopMedicine={handleStopMedicine}
        onAddNewDosage={handleAddNewDosage}
        onRefreshEntry={handleRefreshEntry}
        handleDateChange={handleDetailDateChange}
        selectedDate={detailSelectedDate}
      />
      <AdministerOrSkipModal
        open={isAdministerOrSkipPopupOpen}
        handleClose={handleAdministerOrSkipClose}
        onSubmit={handleSubmit}
        submitLoader={isAdministerOrSkipPopupLoading}
        medicineData={{
          ...selectedMedicine,
          name: selectedMedicine?.name,
          time: selectedMedicine?.scheduledTime,
          date: selectedMedicine?.date,
          calculatedDosage: selectedMedicine?.dosage
        }}
      />
    </Box>
  )
}

export default React.memo(PrescriptionLayout)