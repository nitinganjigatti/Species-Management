'use client'

import React, { useState } from 'react'
import { Drawer, Box, Typography, IconButton, Button } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import FavoriteIcon from '@mui/icons-material/Favorite'
import BlockIcon from '@mui/icons-material/Block'
import AddIcon from '@mui/icons-material/Add'

import MedicineTimeSlot from './MedicineTimeSlot'
import AdministerMedicineModal from './AdministerMedicineModal'

interface MedicineScheduleViewProps {
  open: boolean
  onClose: () => void
  medicineData: any
  onStopMedicine?: (medicine: any) => void
  onAddDosage?: (medicine: any) => void
}

const MedicineScheduleView = ({
  open,
  onClose,
  medicineData,
  onStopMedicine = () => {},
  onAddDosage = () => {}
}: MedicineScheduleViewProps) => {
  const theme: any = useTheme()
  const [administerModalOpen, setAdministerModalOpen] = useState<boolean>(false)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<any>(null)

  const [timeSlots, setTimeSlots] = useState<any[]>([])

  const medicine = medicineData

  const handleClose = () => {
    onClose()
  }

  const handleTimeSlotToggle = (slotId: any) => {
    setTimeSlots((prev: any[]) =>
      prev.map((slot: any) => (slot.id === slotId ? { ...slot, isCompleted: !slot.isCompleted } : slot))
    )
  }

  const handleAdminister = (slot: any) => {
    setSelectedTimeSlot(slot)
    setAdministerModalOpen(true)
  }

  const handleAdministerSubmit = (data: any) => {
    console.log('Administer data:', data)

    if (selectedTimeSlot) {
      handleTimeSlotToggle(selectedTimeSlot.id)
    }
    setAdministerModalOpen(false)
    setSelectedTimeSlot(null)
  }

  const handleStopMedicine = () => {
    onStopMedicine(medicine)
  }

  const handleAddNewDosage = () => {
    onAddDosage(medicine)
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: ['100%', 562],
            borderRadius: '8px 0 0 8px',
            backgroundColor: '#FFFFFF'
          }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            width: '562px',
            flexDirection: 'column',
            alignItems: 'flex-start',
            height: '100vh'
          }}
        >
          {/* Header Section */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              alignSelf: 'stretch'
            }}
          >
            {/* Title Header */}
            <Box
              sx={{
                display: 'flex',
                width: '562px',
                p: 3,
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 2.5,
                borderBottom: `0.5px solid ${theme.palette.customColors.OutlineVariant}`,
                backgroundColor: '#FFFFFF'
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                  alignSelf: 'stretch'
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    gap: 1,
                    flex: '1 0 0'
                  }}
                >
                  <Typography
                    sx={{
                      alignSelf: 'stretch',
                      fontSize: '24px',
                      fontWeight: 500,
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontFamily: 'Inter'
                    }}
                  >
                    {medicine.name}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 0.5,
                      alignSelf: 'stretch'
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        flex: '1 0 0'
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          width: '16px',
                          height: '16px',
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderRadius: '30px',
                          backgroundColor: theme.palette.customColors.OnSurface
                        }}
                      >
                        <FavoriteIcon sx={{ fontSize: 10, color: '#FFFFFF' }} />
                      </Box>
                      <Typography
                        sx={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: theme.palette.customColors.OnSurface,
                          fontFamily: 'Inter'
                        }}
                      >
                        {medicine.medId}
                      </Typography>
                      <Box
                        sx={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '10px',
                          backgroundColor: theme.palette.primary.main
                        }}
                      />
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <Box
                          sx={{
                            width: '16px',
                            height: '8px',
                            backgroundColor: theme.palette.primary.main,
                            borderRadius: '4px 0 0 4px'
                          }}
                        />
                        <Typography
                          sx={{
                            fontSize: '14px',
                            fontWeight: 400,
                            color: theme.palette.customColors.OnSurfaceVariant,
                            fontFamily: 'Inter'
                          }}
                        >
                          {medicine.startDate}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <Box
                          sx={{
                            width: '16px',
                            height: '8px',
                            backgroundColor: theme.palette.customColors.Error,
                            borderRadius: '0 4px 4px 0'
                          }}
                        />
                        <Typography
                          sx={{
                            fontSize: '14px',
                            fontWeight: 400,
                            color: theme.palette.customColors.OnSurfaceVariant,
                            fontFamily: 'Inter'
                          }}
                        >
                          {medicine.endDate}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
                <IconButton onClick={handleClose} sx={{ p: 1.25 }}>
                  <CloseIcon sx={{ fontSize: 14, color: '#1F515B' }} />
                </IconButton>
              </Box>
            </Box>
          </Box>

          {/* Schedule Content */}
          <Box
            sx={{
              display: 'flex',
              p: 3,
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 2,
              alignSelf: 'stretch',
              flex: 1
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 2,
                alignSelf: 'stretch'
              }}
            >
              {/* Time Slots */}
              {timeSlots.map((slot: any) => (
                <MedicineTimeSlot
                  key={slot.id}
                  time={slot.time}
                  dosagePerKg={slot.dosagePerKg}
                  totalDosage={slot.totalDosage}
                  isCompleted={slot.isCompleted}
                  onToggle={() => handleTimeSlotToggle(slot.id)}
                  onAdminister={() => handleAdminister(slot)}
                />
              ))}
            </Box>

            {/* Action Buttons */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                alignSelf: 'stretch'
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 0.25,
                  flex: '1 0 0',
                  borderRadius: 1,
                  cursor: 'pointer',
                  py: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: theme.palette.customColors.neutral05
                  }
                }}
                onClick={handleStopMedicine}
              >
                <BlockIcon sx={{ fontSize: 24, color: theme.palette.customColors.Tertiary }} />
                <Typography
                  sx={{
                    flex: '1 0 0',
                    fontSize: '16px',
                    fontWeight: 500,
                    color: theme.palette.customColors.Tertiary,
                    fontFamily: 'Inter'
                  }}
                >
                  Stop Medicine
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 0.25,
                  borderRadius: 1,
                  cursor: 'pointer',
                  py: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: theme.palette.customColors.neutral05
                  }
                }}
                onClick={handleAddNewDosage}
              >
                <AddIcon sx={{ fontSize: 24, color: theme.palette.customColors.OnSurface }} />
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontWeight: 500,
                    color: theme.palette.customColors.OnSurface,
                    fontFamily: 'Inter'
                  }}
                >
                  Add New Dosage
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Bottom Action Buttons */}
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              p: 3,
              backgroundColor: '#FFFFFF',
              boxShadow: '0 -1px 30px 0 rgba(0, 0, 0, 0.10)',
              alignSelf: 'stretch'
            }}
          >
            <Button
              variant='outlined'
              sx={{
                flex: 1,
                height: '56px',
                borderRadius: 2,
                borderColor: theme.palette.customColors.OnSurfaceVariant,
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '15px',
                fontWeight: 500,
                textTransform: 'uppercase',
                fontFamily: 'Inter',
                '&:hover': {
                  borderColor: theme.palette.customColors.OnSurfaceVariant,
                  backgroundColor: theme.palette.customColors.neutral05
                }
              }}
            >
              SKIPPED
            </Button>
            <Button
              variant='contained'
              sx={{
                flex: 1,
                height: '56px',
                borderRadius: 2,
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.customColors.OnPrimary,
                fontSize: '15px',
                fontWeight: 500,
                textTransform: 'uppercase',
                fontFamily: 'Inter',
                boxShadow: '0 4px 8px -4px rgba(76, 78, 100, 0.42)',
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark
                }
              }}
            >
              ADMINISTER
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Administer Medicine Modal */}
      <AdministerMedicineModal
        handleSidebarOpen={administerModalOpen}
        handleSidebarClose={() => setAdministerModalOpen(false)}
        scheduleDosage={medicine}
        onSubmit={handleAdministerSubmit}
      />
    </>
  )
}

export default MedicineScheduleView
