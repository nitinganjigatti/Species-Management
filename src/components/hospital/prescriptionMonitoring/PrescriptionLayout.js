import { Grid, Box } from '@mui/system'
import React, { useEffect, useState } from 'react'
import PrescriptionMonitoringGrid from './PrescriptionMonitoringGrid'
import { MedicineScheduleView } from 'src/views/pages/hospital/prescription-monitoring'
import { Button } from '@mui/material'
import MedicinePrescriptionCard from 'src/views/pages/hospital/prescription-monitoring/MedicinePrescriptionCard'
import { Router, useRouter } from 'next/router'
import { useHospital } from 'src/context/HospitalContext'
import Toaster from 'src/components/Toaster'
import { getDates, getPrescriptionDetails, getPrescriptions } from 'src/lib/api/hospital/prescription'
import Utility from 'src/utility'

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
  const [medicationData, setMedicationData] = useState(null)
  const [dates, setDates] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [medicineDetails, setMedicineDetails] = useState(null)
  const [detailDates, setDetailDates] = useState(null)
  const [detailSelectedDate, setDetailSelectedDate] = useState(null)

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
      const today = new Date().toISOString().split('T')[0] // gives 'YYYY-MM-DD'

      const payload = {
        hospital_id: hospital?.id || '',
        animal_id: animal_id || '',
        medical_type: 'prescription',
        type: 'active',
        medical_record_id: medical_record_id || '',
        generate_for_date: today || ''
      }

      const response = await getPrescriptions(payload)

      if (response?.success) {
        setDates(response?.data?.schedulded_date)
        const dates = response?.data?.schedulded_date
        if (dates?.length > 0) setSelectedDate(dates[dates?.length - 1])
        setMedicationData(response?.data?.prescriptions)
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {
      Toaster({ type: 'error', message: error || 'Something went wrong' })
    }
  }

  const getDetails = async (data, date) => {
    try {
      const payload = {
        prescription_id: data?.prescription_id || '30176', // TODO: Upgrade after listing integration
        date: date || '2025-10-07',
        group_prescription_id: data?.group_prescription_id || '30176'
      }

      const response = await getPrescriptionDetails(payload)

      if (response?.success) {
        setMedicineDetails(response?.data)
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {
      Toaster({ type: 'error', message: error || 'Something went wrong' })
    }
  }

  const getPrescriptionDates = async data => {
    try {
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
        getDetails(data, lastDate)
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {
      Toaster({ type: 'error', message: error || 'Something went wrong' })
    }
  }

  useEffect(() => {
    if (hospital?.id) getPrescriptionList()
  }, [hospital?.id])

  const medication = [
    {
      id: 'Levothyroxine',
      name: 'Levothyroxine',
      frequency: '1 times',
      progress: '1/1',
      status: 'completed',
      canEdit: true,
      schedule: [
        {
          schedule_id: 1,
          time: '12 AM',
          dosage: '50 mcg',
          status: 'administered',
          administered_time: '12 AM',
          compliance_note: 'Taken correctly on empty stomach'
        },
        {
          schedule_id: 2,
          time: '1 PM',
          dosage: '310 mg',
          status: 'pending',
          administered_time: '1 PM',
          compliance_note: 'Taken correctly on empty stomach'
        },
        {
          schedule_id: 3,
          time: '5 PM',
          dosage: '310 mg',
          status: 'administered',
          administered_time: '5 PM',
          compliance_note: 'Taken correctly on empty stomach'
        },
        {
          schedule_id: 4,
          time: '5 PM',
          dosage: '310 mg',
          status: 'pending',
          administered_time: '5 PM',
          compliance_note: 'Taken correctly on empty stomach'
        }
      ]
    },

    {
      id: 'crt',
      name: 'CRT',
      frequency: '1 time',
      progress: '1/1',
      status: 'administered',
      canEdit: true,
      schedule: [
        {
          schedule_id: 1,
          time: '3 AM',
          dosage: '50 mcg',
          status: 'administered',
          administered_time: '3 AM',
          compliance_note: 'Medication discontinued by doctor'
        },
        {
          schedule_id: 1,
          time: '2 AM',
          dosage: '50 mcg',
          status: 'administered',
          administered_time: '2 AM',
          compliance_note: 'Medication discontinued by doctor'
        },
        {
          schedule_id: 1,
          time: '1 AM',
          dosage: '50 mcg',
          status: 'administered',
          administered_time: '1 AM',
          compliance_note: 'Medication discontinued by doctor'
        }
      ]
    },
    {
      id: 'urination',
      name: 'Urination',
      frequency: '1 time',
      progress: '1/1',
      status: 'skipped',
      canEdit: true,
      schedule: [
        {
          schedule_id: 1,
          time: '12 AM',
          dosage: '50 mcg',
          status: 'skipped',
          administered_time: '',
          compliance_note: 'Patient forgot to take'
        }
      ]
    },
    {
      id: 'defecation',
      name: 'Defecation',
      frequency: '1 time',
      progress: '1/1',
      status: 'stopped',
      canEdit: true,
      schedule: [
        {
          schedule_id: 1,
          time: '7:00 AM',
          dosage: '50 mcg',
          status: 'stopped',
          administered_time: '',
          compliance_note: 'Treatment stopped due to side effects'
        }
      ]
    },
    {
      id: 'appetite',
      name: 'Appetite',
      frequency: '1 time',
      progress: '1/1',
      status: 'skipped',
      canEdit: true,
      schedule: [
        {
          schedule_id: 1,
          time: '7:00 AM',
          dosage: '50 mcg',
          status: 'skipped',
          administered_time: '',
          compliance_note: 'Missed dose - patient was sleeping'
        }
      ]
    },
    {
      id: 'defecation2',
      name: 'Defecation',
      frequency: '1 time',
      progress: '1/1',
      status: 'completed',
      canEdit: true,
      schedule: [
        {
          schedule_id: 1,
          time: '7:00 AM',
          dosage: '50 mcg',
          status: 'administered',
          administered_time: '7:00 AM',
          compliance_note: 'Taken correctly on empty stomach'
        }
      ]
    },
    {
      id: 'appetite2',
      name: 'Appetite',
      frequency: '1 time',
      progress: '1/1',
      status: 'completed',
      canEdit: true,
      schedule: [
        {
          schedule_id: 1,
          time: '7:00 AM',
          dosage: '50 mcg',
          status: 'administered',
          administered_time: '7:00 AM',
          compliance_note: 'Taken correctly on empty stomach'
        }
      ]
    },
    {
      id: 'paracetamol',
      name: 'Paracetamol',
      frequency: '3 times',
      progress: '2/3',
      status: 'in-progress',
      canEdit: true,
      schedule: [
        {
          schedule_id: 1,
          time: '8:00 AM',
          dosage: '500 mg',
          status: 'administered',
          administered_time: '8:05 AM',
          compliance_note: 'Taken with water'
        },
        {
          schedule_id: 2,
          time: '2:00 PM',
          dosage: '500 mg',
          status: 'skipped',
          administered_time: '',
          compliance_note: 'Patient was in meeting'
        },
        {
          schedule_id: 3,
          time: '8:00 PM',
          dosage: '500 mg',
          status: 'administered',
          administered_time: '8:15 PM',
          compliance_note: 'Taken with dinner'
        }
      ]
    },
    {
      id: 'amoxicillin',
      name: 'Amoxicillin',
      frequency: '2 times',
      progress: '1/2',
      status: 'in-progress',
      canEdit: true,
      schedule: [
        {
          schedule_id: 1,
          time: '9:00 AM',
          dosage: '250 mg',
          status: 'administered',
          administered_time: '9:10 AM',
          compliance_note: 'Taken after food'
        },
        {
          schedule_id: 2,
          time: '9:00 PM',
          dosage: '280 mg',
          status: 'stopped',
          administered_time: '',
          compliance_note: 'Stopped due to allergic reaction'
        }
      ]
    },
    {
      id: 'vitamind',
      name: 'Vitamin D',
      frequency: '1 time',
      progress: '0/1',
      status: 'pending',
      canEdit: true,
      schedule: [
        {
          schedule_id: 1,
          time: '6:00 AM',
          dosage: '1000 IU',
          status: 'skipped',
          administered_time: '',
          compliance_note: 'Patient forgot to take with milk'
        }
      ]
    }
  ]

  const handleDetailDateChange = date => {
    setDetailSelectedDate(date)
  }

  return (
    <Box>
      <Grid container spacing={2} sx={{ alignItems: 'center' }}>
        {/* <Button onClick={() => setOpenSchedule(true)}>View Sample Schedule</Button> */}
        <Grid xs={12}>
          <PrescriptionMonitoringGrid
            onOpenPrescriptionCard={handleOpenPrescriptionCard}

            // medications={medicationData}
            medications={medication}
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
      {/* Medicine Prescription Card Drawer */}

      <MedicinePrescriptionCard
        open={prescriptionCardOpen}
        onClose={handleClosePrescriptionCard}
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
        dosageEntries={[
          {
            id: 1,
            time: '07:00 AM',
            status: 'Administered',
            variant: 'administered',
            dosage: '10 mg/kg',
            amount: '310 mg',
            wastage: 'Wastage - 200 mg',
            wastageNote: 'Lorem impsum doal sit amet sit lip alu lorem ipsum dolar',
            batchNumber: 'BTC2345',
            administeredBy: 'Jordan Stevenson',
            administeredAt: '02 Jan 2025 • 12 : 35 PM',
            icon: 'mdi:check-circle'
          },
          {
            id: 2,
            time: '11:00 AM',
            status: 'Skipped',
            variant: 'skipped',
            dosage: '10 mg/kg',
            amount: '310 mg',
            administeredBy: 'Jordan Stevenson',
            administeredAt: '02 Jan 2025 • 12 : 35 PM',
            icon: 'jam:stop-sign'
          },
          {
            id: 3,
            time: '04:00 PM',
            status: 'Stopped',
            variant: 'stopped',
            dosage: '10 mg/kg',
            amount: '310 mg',
            administeredBy: 'Jordan Stevenson',
            administeredAt: '02 Jan 2025 • 12 : 35 PM',
            icon: 'jam:stop-sign',
            isStrikethrough: true
          }
        ]}
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
