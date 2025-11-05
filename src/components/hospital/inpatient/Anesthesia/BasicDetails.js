import React from 'react'
import {
  Box,
  TextField,
  Typography,
  Grid,
  MenuItem,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Paper
} from '@mui/material'
//import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { useTheme } from '@mui/material/styles'

export default function BasicDetails({ data, onChange }) {
  const theme = useTheme()

  const purposeOptions = [
    'Detailed physical examination',
    'Ultrasonography',
    'CT',
    'MRI',
    'Blood draw',
    'Wing/beak/nail trim',
    'Endoscopy',
    'Dentistry, print dental sheet',
    'Wound management/bandaging',
    'Feeding tube (esophagostomy tube)',
    'E-collar placement',
    'OR surgery, submit request'
  ]

  const handlePurposeToggle = (event, newValues) => {
    onChange('purpose', newValues)
  }

  return (
    <Paper variant='outlined' sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant='h6' fontWeight={600} mb={3}>
        Basic Details*
      </Typography>

      {/* Basic Fields */}
    </Paper>
  )
}
