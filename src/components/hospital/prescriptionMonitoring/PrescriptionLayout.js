import { Grid, Box } from '@mui/system'
import React, { useState } from 'react'
import PrescriptionMonitoringGrid from './PrescriptionMonitoringGrid'
import { MedicineScheduleView } from 'src/views/pages/hospital/prescription-monitoring'
import { Button } from '@mui/material'

function PrescriptionLayout({ drawerType }) {
  // const { drawerType } = drawerType
  console.log('drawerState', drawerType)

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

  return (
    <Box>
      <Grid container spacing={2} sx={{ alignItems: 'center' }}>
        <Button onClick={() => setOpenSchedule(true)}>View Sample Schedule</Button>
        <Grid xs={12}>
          <PrescriptionMonitoringGrid medications={medication} />
        </Grid>
      </Grid>

      <MedicineScheduleView
        open={openSchedule}
        onClose={() => setOpenSchedule(false)}
        medicineData={exampleMedicine}
        onStopMedicine={() => setOpenSchedule(false)}
        onAddDosage={() => {}}
      />
    </Box>
  )
}

export default React.memo(PrescriptionLayout)
