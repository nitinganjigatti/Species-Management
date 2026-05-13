'use client'

import React from 'react'
import { Box, Typography, Checkbox } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'

interface MedicineTimeSlotProps {
  time?: string
  dosagePerKg?: string
  totalDosage?: string
  isCompleted?: boolean
  onToggle?: () => void
  onAdminister?: () => void
}

const MedicineTimeSlot = ({
  time = '07:00 AM',
  dosagePerKg = '10 mg/kg',
  totalDosage = '310 mg',
  isCompleted = true,
  onToggle = () => {},
  onAdminister = () => {}
}: MedicineTimeSlotProps) => {
  const theme: any = useTheme()

  const handleCheckboxClick = () => {
    onToggle()
  }

  const handleSlotClick = () => {
    if (!isCompleted) {
      onAdminister()
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        height: '56px',
        alignItems: 'center',
        gap: 1.5,
        alignSelf: 'stretch',
        borderRadius: 2,
        backgroundColor: isCompleted ? theme.palette.customColors.Surface : theme.palette.customColors.Background,
        border: isCompleted ? `1px solid ${theme.palette.primary.main}` : 'none',
        cursor: isCompleted ? 'default' : 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: isCompleted ? theme.palette.customColors.Surface : theme.palette.customColors.neutral05
        }
      }}
      onClick={handleSlotClick}
    >
      {/* Time Section */}
      <Box
        sx={{
          display: 'flex',
          px: 2,
          alignItems: 'center',
          gap: 0.5,
          flex: '1 0 0'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25
          }}
        >
          <AccessTimeIcon sx={{ fontSize: 24, color: theme.palette.customColors.OnSurfaceVariant }} />
        </Box>
        <Typography
          sx={{
            flex: '1 0 0',
            fontSize: '16px',
            fontWeight: 600,
            color: theme.palette.customColors.OnSurfaceVariant,
            fontFamily: 'Inter'
          }}
        >
          {time}
        </Typography>
      </Box>

      {/* Dosage Section */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 2.5
        }}
      >
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 400,
            color: theme.palette.customColors.OnSurfaceVariant,
            fontFamily: 'Inter'
          }}
        >
          {dosagePerKg}
        </Typography>
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 500,
            color: theme.palette.customColors.OnSurfaceVariant,
            fontFamily: 'Inter'
          }}
        >
          {totalDosage}
        </Typography>
      </Box>

      {/* Checkbox Section */}
      <Box
        sx={{
          display: 'flex',
          px: 2,
          justifyContent: 'center',
          alignItems: 'center',
          gap: 1.25,
          alignSelf: 'stretch',
          backgroundColor: isCompleted ? theme.palette.customColors.OnBackground : theme.palette.customColors.neutral05
        }}
        onClick={e => {
          e.stopPropagation()
          handleCheckboxClick()
        }}
      >
        <Checkbox
          checked={isCompleted}
          onChange={handleCheckboxClick}
          icon={
            <CheckBoxOutlineBlankIcon
              sx={{
                fontSize: 24,
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            />
          }
          checkedIcon={
            <CheckBoxIcon
              sx={{
                fontSize: 24,
                color: theme.palette.primary.main
              }}
            />
          }
          sx={{
            p: 0,
            '&:hover': {
              backgroundColor: 'transparent'
            }
          }}
        />
      </Box>
    </Box>
  )
}

export default MedicineTimeSlot
