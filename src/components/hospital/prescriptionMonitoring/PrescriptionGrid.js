import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Typography,
  Switch,
  FormControlLabel,
  Box,
  Chip,
  IconButton
} from '@mui/material'
import { Add as AddIcon, Check as CheckIcon, Close as CloseIcon, Schedule as ScheduleIcon } from '@mui/icons-material'
import { styled } from '@mui/material/styles'
import PatientMonitoring from 'src/views/pages/hospital/utility/PatientMontoring'
import HorizontalDateNav from 'src/views/utility/HorizontalDateNav'

// Styled components
const StyledTableContainer = styled(TableContainer)({
  maxHeight: '70vh',
  '& .MuiTable-root': {
    minWidth: 1000
  }
})

const StickyCell = styled(TableCell)({
  position: 'sticky',
  left: 0,
  backgroundColor: 'white',
  zIndex: 2,
  borderRight: '2px solid #e0e0e0',
  minWidth: 200,
  padding: '12px 16px'
})

const StickyHeaderCell = styled(TableCell)({
  position: 'sticky',
  left: 0,
  backgroundColor: '#f5f5f5',
  zIndex: 3,
  borderRight: '2px solid #e0e0e0',
  minWidth: 200,
  fontWeight: 600,
  padding: '12px 16px'
})

const TimeSlotCell = styled(TableCell)({
  minWidth: 140,
  textAlign: 'center',
  padding: '8px 12px',
  cursor: 'pointer',
  position: 'relative'

  // '&:hover': {
  //   backgroundColor: '#f8f9fa'
  // }
})

const DosageBox = styled(Box)({
  backgroundColor: '#FFF9E6',
  border: '1px solid #ffc107',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '12px',
  fontWeight: 500,
  color: '#856404',
  display: 'inline-block',
  minWidth: '60px',
  textAlign: 'center'
})

const StatusBox = styled(Box)(({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'administered':
        return {
          backgroundColor: '#e8f5e8',
          border: '1px solid #4caf50',
          color: '#2e7d32'
        }
      case 'stopped':
        return {
          backgroundColor: '#ffebee',
          border: '1px solid #f44336',
          color: '#c62828'
        }
      case 'skipped':
        return {
          backgroundColor: '#f3e5f5',
          border: '1px solid #9c27b0',
          color: '#7b1fa2'
        }
      default:
        return {
          backgroundColor: '#FFF9E6',
          border: '1px solid #ffc107',
          color: '#856404'
        }
    }
  }

  return {
    ...getStatusStyles(),
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '11px',
    fontWeight: 500,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    minWidth: '184px',
    minHeight: '72px',
    textAlign: 'center'
  }
})

const EmptyDosageBox = styled(Box)({
  border: '2px dashed #ccc',
  borderRadius: '8px',
  padding: '12px',
  fontSize: '12px',
  color: '#999',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '184px',
  minHeight: '72px',
  cursor: 'pointer'

  // '&:hover': {
  //   borderColor: '#999',
  //   backgroundColor: '#f8f9fa'
  // }
})

const DosageTracker = styled(Chip)(({ status }) => {
  const getTrackerStyles = () => {
    switch (status) {
      case 'complete':
        return {
          backgroundColor: '#e8f5e8',
          color: '#2e7d32'
        }
      case 'partial':
        return {
          backgroundColor: '#fff3e0',
          color: '#f57c00'
        }
      default:
        return {
          backgroundColor: '#ffebee',
          color: '#c62828'
        }
    }
  }

  return {
    ...getTrackerStyles(),
    fontSize: '11px',
    height: '22px',
    '& .MuiChip-label': {
      padding: '0 8px',
      fontWeight: 600
    }
  }
})

// Sample data
const timeSlots = ['12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5Pm', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5Pm']

const initialPrescriptions = [
  {
    id: '1',
    name: 'Dolo 650 tablet',
    frequency: '3 times',
    total: 4,
    taken: 4,
    selected: true,
    schedule: [
      {
        time: '12 PM',
        dose: '310 mg',
        status: 'administered',
        timestamp: '12:30 PM\n12:00 AM'
      },
      {
        time: '4 PM',
        dose: '310 mg',
        status: 'skipped',
        timestamp: 'Skipped\n12:00 AM'
      }
    ]
  },
  {
    id: '2',
    name: 'Crocine',
    frequency: '4 times',
    total: 4,
    taken: 3,
    selected: false,
    schedule: [
      {
        time: '2 PM',
        dose: '310 mg',
        status: 'administered',
        timestamp: 'Administered\n12:00 AM'
      },
      {
        time: '4 PM',
        dose: '310 mg',
        status: 'normal'
      }
    ]
  },
  {
    id: '3',
    name: 'Levothyroxine',
    frequency: '2 times',
    total: 2,
    taken: 1,
    selected: false,
    schedule: [
      {
        time: '12 PM',
        dose: '310 mg',
        status: 'administered',
        timestamp: '12:30 PM\n12:00 AM'
      },
      {
        time: '3 PM',
        dose: '310 mg',
        status: 'stopped',
        timestamp: 'Stopped\n12:00 AM'
      }
    ]
  }

  // {
  //   id: '4',
  //   name: 'Cetil',
  //   frequency: '2 times',
  //   total: 2,
  //   taken: 0,
  //   selected: true,
  //   schedule: [
  //     {
  //       time: '12 PM',
  //       dose: '310 mg',
  //       status: 'administered',
  //       timestamp: '12:30 PM\n12:00 AM'
  //     },
  //     {
  //       time: '4 PM',
  //       dose: '310 mg',
  //       status: 'skipped',
  //       timestamp: 'Skipped\n12:00 AM'
  //     }
  //   ]
  // },
  // {
  //   id: '5',
  //   name: 'Paracetamol',
  //   frequency: '3 times',
  //   total: 3,
  //   taken: 2,
  //   selected: false,
  //   schedule: [
  //     { time: '9 AM', dose: '500 mg', status: 'administered', timestamp: '9:10 AM\n12:00 AM' },
  //     { time: '1 PM', dose: '500 mg', status: 'administered', timestamp: '1:15 PM\n12:00 AM' },
  //     { time: '9 PM', dose: '500 mg', status: 'pending', timestamp: '—\n12:00 AM' }
  //   ]
  // },
  // {
  //   id: '6',
  //   name: 'Azithromycin',
  //   frequency: '1 time',
  //   total: 1,
  //   taken: 0,
  //   selected: true,
  //   schedule: [{ time: '10 AM', dose: '500 mg', status: 'pending', timestamp: '—\n12:00 AM' }]
  // },
  // {
  //   id: '7',
  //   name: 'Amoxicillin',
  //   frequency: '3 times',
  //   total: 3,
  //   taken: 1,
  //   selected: false,
  //   schedule: [
  //     { time: '7 AM', dose: '250 mg', status: 'administered', timestamp: '7:20 AM\n12:00 AM' },
  //     { time: '3 PM', dose: '250 mg', status: 'pending', timestamp: '—\n12:00 AM' },
  //     { time: '11 PM', dose: '250 mg', status: 'pending', timestamp: '—\n12:00 AM' }
  //   ]
  // },
  // {
  //   id: '8',
  //   name: 'Metformin',
  //   frequency: '2 times',
  //   total: 2,
  //   taken: 1,
  //   selected: true,
  //   schedule: [
  //     { time: '8 AM', dose: '500 mg', status: 'administered', timestamp: '8:25 AM\n12:00 AM' },
  //     { time: '8 PM', dose: '500 mg', status: 'pending', timestamp: '—\n12:00 AM' }
  //   ]
  // },
  // {
  //   id: '9',
  //   name: 'Atorvastatin',
  //   frequency: '1 time',
  //   total: 1,
  //   taken: 0,
  //   selected: true,
  //   schedule: [{ time: '9 PM', dose: '20 mg', status: 'pending', timestamp: '—\n12:00 AM' }]
  // },
  // {
  //   id: '10',
  //   name: 'Vitamin D3',
  //   frequency: '1 time',
  //   total: 1,
  //   taken: 0,
  //   selected: false,
  //   schedule: [{ time: '11 AM', dose: '60k IU', status: 'pending', timestamp: '—\n12:00 AM' }]
  // }
]

// {
//   "name": "Levothyroxine",
//   "date": "",
//   "frequency": "1 time",
//   "progress": "1/1",
//   "status": "completed",
//   "color_code": "green",
//   "special_instructions": "Take on empty stomach, 1 hour before breakfast",
//   "schedules": [
//     {
//       "schedule_id": 1,
//       "time": "7:00 AM",
//       "dosage": "50 mcg",
//       "status": "administered",
//       "administered_time": "7:00 AM",
//       "compliance_note": "Taken correctly on empty stomach"
//     }
//   ]
// }

export default function PrescriptionGrid() {
  const [prescriptions, setPrescriptions] = useState(initialPrescriptions)

  const [selectedPrescriptions, setSelectedPrescriptions] = useState(
    new Set(prescriptions.filter(p => p.selected).map(p => p.id))
  )
  const [currentRecordOnly, setCurrentRecordOnly] = useState(false)

  const pendingDosages = prescriptions.reduce(
    (total, prescription) => total + (prescription.total - prescription.taken),
    0
  )

  const handlePrescriptionSelect = prescriptionId => {
    const newSelected = new Set(selectedPrescriptions)
    if (newSelected.has(prescriptionId)) {
      newSelected.delete(prescriptionId)
    } else {
      newSelected.add(prescriptionId)
    }
    setSelectedPrescriptions(newSelected)

    setPrescriptions(prev => prev.map(p => (p.id === prescriptionId ? { ...p, selected: !p.selected } : p)))
  }

  const handleSelectAll = () => {
    if (selectedPrescriptions.size === prescriptions.length) {
      setSelectedPrescriptions(new Set())
      setPrescriptions(prev => prev.map(p => ({ ...p, selected: false })))
    } else {
      setSelectedPrescriptions(new Set(prescriptions.map(p => p.id)))
      setPrescriptions(prev => prev.map(p => ({ ...p, selected: true })))
    }
  }

  const toggleDosage = (prescriptionId, timeSlot) => {
    setPrescriptions(prev =>
      prev.map(prescription => {
        if (prescription.id !== prescriptionId) return prescription

        const existingScheduleIndex = prescription.schedule.findIndex(s => s.time === timeSlot)

        if (existingScheduleIndex >= 0) {
          const newSchedule = [...prescription.schedule]
          const currentStatus = newSchedule[existingScheduleIndex].status

          // Cycle through statuses: normal -> administered -> stopped -> skipped -> removed
          let newStatus
          let newTimestamp

          switch (currentStatus) {
            case 'normal':
              newStatus = 'administered'
              newTimestamp = 'Administered\n12:00 AM'
              break
            case 'administered':
              newStatus = 'stopped'
              newTimestamp = 'Stopped\n12:00 AM'
              break
            case 'stopped':
              newStatus = 'skipped'
              newTimestamp = 'Skipped\n12:00 AM'
              break
            default:
              // Remove the dosage
              newSchedule.splice(existingScheduleIndex, 1)

              return {
                ...prescription,
                schedule: newSchedule
              }
          }

          newSchedule[existingScheduleIndex] = {
            ...newSchedule[existingScheduleIndex],
            status: newStatus,
            timestamp: newTimestamp
          }

          return {
            ...prescription,
            schedule: newSchedule
          }
        } else {
          // Add new dosage
          return {
            ...prescription,
            schedule: [
              ...prescription.schedule,
              {
                time: timeSlot,
                dose: '310 mg',
                status: 'normal'
              }
            ]
          }
        }
      })
    )
  }

  const getScheduleForTime = (prescription, time) => {
    return prescription.schedule.find(s => s.time === time)
  }

  const getTrackerStatus = prescription => {
    if (prescription.taken === prescription.total) return 'complete'
    if (prescription.taken > 0) return 'partial'

    return 'pending'
  }

  const renderStatusIcon = status => {
    switch (status) {
      case 'administered':
        return <CheckIcon sx={{ fontSize: 12, color: '#2e7d32' }} />
      case 'stopped':
        return <CloseIcon sx={{ fontSize: 12, color: '#c62828' }} />
      case 'skipped':
        return <ScheduleIcon sx={{ fontSize: 12, color: '#7b1fa2' }} />
      default:
        return null
    }
  }

  return (
    <Box sx={{ backgroundColor: '#fafafa', minHeight: '100vh' }}>
      {/* <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          p: 2,
          backgroundColor: 'white'
        }}
      >
        <Typography variant='h6' sx={{ color: '#333', fontWeight: 600 }}>
          Pending Dosage: <span style={{ color: '#d32f2f' }}>{pendingDosages}</span>
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={currentRecordOnly}
              onChange={e => setCurrentRecordOnly(e.target.checked)}
              color='primary'
            />
          }
          label='Current Medical Record Only'
          sx={{ '& .MuiFormControlLabel-label': { fontSize: '14px' } }}
        />
      </Box> */}

      {/* Table */}
      {/* <Paper elevation={2} sx={{ overflow: 'hidden' }}> */}
      <StyledTableContainer>
        <Table stickyHeader>
          {/* <TableHead>
              <TableRow>
                <StickyHeaderCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Checkbox
                      checked={selectedPrescriptions.size === prescriptions.length}
                      indeterminate={
                        selectedPrescriptions.size > 0 && selectedPrescriptions.size < prescriptions.length
                      }
                      onChange={handleSelectAll}
                      size='small'
                    />
                    <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                      Prescription
                    </Typography>
                  </Box>
                </StickyHeaderCell>
                {timeSlots.map(time => (
                  <TableCell
                    key={time}
                    align='center'
                    sx={{
                      fontWeight: 600,
                      backgroundColor: '#f5f5f5',
                      minWidth: 140,
                      padding: '12px'
                    }}
                  >
                    {time}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead> */}
          <TableBody>
            {prescriptions.map(prescription => (
              <TableRow
                key={prescription.id}
                hover
                sx={{
                  '&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
                  '&:hover': { backgroundColor: '#f0f8ff !important' }
                }}
              >
                <StickyCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '266px', height: '72px' }}>
                    <Checkbox
                      checked={selectedPrescriptions.has(prescription.id)}
                      onChange={() => handlePrescriptionSelect(prescription.id)}
                      size='small'
                    />
                    <Box sx={{ flex: 1, width: '232px', height: '72px', borderRadius: '8px', border: '1px solid red' }}>
                      <Typography variant='body2' sx={{ fontWeight: 600, mb: 0.5 }}>
                        {prescription.name}
                      </Typography>
                      <Typography variant='caption' sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                        {prescription.frequency}
                      </Typography>
                      <DosageTracker
                        label={`${prescription.taken}/${prescription.total}`}
                        size='small'
                        status={getTrackerStatus(prescription)}
                      />
                    </Box>
                  </Box>
                </StickyCell>
                {timeSlots.map(time => {
                  const scheduleEntry = getScheduleForTime(prescription, time)

                  return (
                    <TimeSlotCell key={time} onClick={() => toggleDosage(prescription.id, time)}>
                      {scheduleEntry ? (
                        <StatusBox status={scheduleEntry.status}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            {renderStatusIcon(scheduleEntry.status)}
                            <Typography variant='caption' sx={{ fontWeight: 600 }}>
                              {scheduleEntry.dose}
                            </Typography>
                          </Box>
                          {scheduleEntry.timestamp && (
                            <Typography
                              variant='caption'
                              sx={{
                                fontSize: '10px',
                                opacity: 0.8,
                                whiteSpace: 'pre-line',
                                textAlign: 'center'
                              }}
                            >
                              {scheduleEntry.timestamp}
                            </Typography>
                          )}
                        </StatusBox>
                      ) : (
                        <EmptyDosageBox>
                          <AddIcon sx={{ fontSize: 16, color: '#ccc' }} />
                        </EmptyDosageBox>
                      )}
                    </TimeSlotCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </StyledTableContainer>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant='caption' sx={{ color: '#666' }}>
          Click on cells to cycle through: Normal → Administered → Stopped → Skipped → Remove
        </Typography>
      </Box>
    </Box>
  )
}
