import { Grid, Box } from '@mui/system'
import React, { useEffect, useState } from 'react'
import PrescriptionMonitoringGrid from './PrescriptionMonitoringGrid'
import { AdministerMedicineModal, MedicineScheduleView } from 'src/views/pages/hospital/prescription-monitoring'
import { Button } from '@mui/material'
import MedicinePrescriptionCard from 'src/views/pages/hospital/prescription-monitoring/MedicinePrescriptionCard'
import { Router, useRouter } from 'next/router'
import { useHospital } from 'src/context/HospitalContext'
import Toaster from 'src/components/Toaster'
import { getDates, getPrescriptionDetails, getPrescriptions } from 'src/lib/api/hospital/prescription'
import Utility from 'src/utility'
import ScheduleDosage from 'src/views/pages/hospital/prescription-monitoring/ScheduleDosage'
import { status } from 'nprogress'

const dummyMedicationData = {
  name: 'Levothyroxine',
  date: new Date('2025-01-02'),
  time: new Date('2025-01-02T12:00:00'),
  quantity: '310 mg'
}

function PrescriptionLayout({ drawerType }) {
  // const { drawerType } = drawerType

  const exampleMedicine = {
    name: 'Dolo 650 tablet',
    medId: 'MED - 12345/25',
    startDate: '1 Jan 2025',
    endDate: '04 Jan 2025',
    dosageCount: '3 Times',
    frequency: 'Everyday',
    duration: '3 days',
    deliveryRoute: 'Oral',
    notes: 'Lorem ipsum dolor sit amet consectetur adipiscin ipsum dolor...',
    lastEdited: 'Last edited on 10:34 AM • 02 Jan 2025'
  }

  const [openSchedule, setOpenSchedule] = useState(false)
  const [prescriptionCardOpen, setPrescriptionCardOpen] = useState(false)
  const [medicationData, setMedicationData] = useState([])
  const [dates, setDates] = useState(null)
  const [medicineDetails, setMedicineDetails] = useState(null)
  const [detailDates, setDetailDates] = useState(null)
  const [detailSelectedDate, setDetailSelectedDate] = useState(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isDatesLoading, setIsDatesLoading] = useState(false)
  const [isAdministerFormOpen, setIsAdministerFormOpen] = useState(true)
  const [isPrescriptionListLoading, setIsPrescriptionListLoading] = useState(false)

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

  const handleStopMedicine = medicineData => {
    console.log('Stop medicine:', medicineData)

    // Add your logic here
  }

  const handleAddNewDosage = medicineData => {
    console.log('Add new dosage:', medicineData)

    // Add your logic here
  }

  const handleRefreshEntry = (entryId, medicineData) => {
    console.log('Refresh entry:', entryId, medicineData)

    // Add your logic here
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
        generate_for_date: selectedDate
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
        prescription_id: data?.prescription_id || '30176', // TODO: Upgrade after listing integration
        date: date || '2025-10-07',
        group_prescription_id: data?.group_prescription_id || '30176'
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
        from_date: data?.from_date || '2025-10-01', // TODO: Upgrade after listing integration
        to_date: data?.to_date || '2025-10-31',
        type: 'all',
        prescription_id: data?.prescription_id || '30176',
        group_prescription_id: data?.group_prescription_id || '30176'
      }

      const response = await getDates(payload)

      if (response?.success) {
        const mappedDates = response?.data?.map(item => item?.date)
        setDetailDates(mappedDates)
        const lastDate = (response?.data?.length > 0 && response?.data[response?.data?.length - 1]?.date) || ''
        setDetailSelectedDate(lastDate)
        getDetails(data, lastDate)
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {
      Toaster({ type: 'error', message: error || 'Something went wrong' })
    } finally {
      setIsDatesLoading(false)
    }
  }

  useEffect(() => {
    if (detailDates?.length) {
      getDetails(medicineDetails, detailSelectedDate)
    }
  }, [detailSelectedDate])

  useEffect(() => {
    if (hospital?.id) getPrescriptionList()
  }, [hospital?.id, selectedDate])

  const handleAdministerSubmit = formData => {
    console.log('Administer Medicine Form Submitted:', formData)

    // Add your logic here
  }

  const handleDetailDateChange = date => {
    console.log('Detail date changed to:', date)
    setDetailSelectedDate(date)
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

            // medications={medication}
            dates={dates}
            selectedDate={selectedDate}
            handleDateChange={handleDateChange}
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
      <MedicineScheduleView
        open={openSchedule}
        onClose={() => setOpenSchedule(false)}
        medicineData={exampleMedicine}
        onStopMedicine={() => setOpenSchedule(false)}
        onAddDosage={() => {}}
      />

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
          defaultTab: 2
        }}
        dosageEntries={medicineDetails?.medicine_timings || []}
        dateOptions={detailDates}
        onStopMedicine={handleStopMedicine}
        onAddNewDosage={handleAddNewDosage}
        onRefreshEntry={handleRefreshEntry}
        handleDateChange={handleDetailDateChange}
        selectedDate={detailSelectedDate}
      />
    </Box>
  )
}

export default React.memo(PrescriptionLayout)
