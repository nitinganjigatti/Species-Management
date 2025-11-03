import React, { useState } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  Paper
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useTheme } from '@mui/material/styles'

const MedicationTimeCard = ({ 
  time = '07:00 AM', 
  dosage = '10 mg/kg', 
  amount = '310 mg',
  checked = false,
  onChange = () => {}
}) => {
    const theme = useTheme()

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',

        paddingLeft: '16px',
        backgroundColor: theme.palette.customColors.Background,
        borderRadius: '8px',
        gap: '8px'
      }}
    >
      {/* Left Section - Time */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <AccessTimeIcon sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '20px' }} />
        <Typography
          sx={{
            fontWeight: 600,
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px'
          }}
        >
          {time}
        </Typography>
      </Box>

      {/* Middle Section - Dosage Info */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px'
          }}
        >
          {dosage}
        </Typography>
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: 500
          }}
        >
          {amount}
        </Typography>
      </Box>

      {/* Right Section - Checkbox */}
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', backgroundColor: theme.palette.customColors.neutral05, padding: '12px 16px', }}>

      <Checkbox
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        sx={{
          color: '#999',
          padding: '4px',
          '&.Mui-checked': {
            color: '#1976d2'
          }
        }}
      />
      </Box>
      </Box>
    </Paper>
  );
};

export default MedicationTimeCard;