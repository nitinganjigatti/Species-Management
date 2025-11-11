import React, { useState } from 'react'
import { Box, Typography, Checkbox, Paper } from '@mui/material'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import { useTheme } from '@mui/material/styles'

const MedicationTimeCard = ({ time, dosage, amount, checked = false, onChange = () => {} }) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',

        paddingLeft: '16px',
        backgroundColor: checked ? theme.palette.customColors.Surface : theme.palette.customColors.Background,
        border: checked ? `1px solid ${theme.palette.customColors.Primary}` : 'none',
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
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            backgroundColor: theme.palette.customColors.neutral05,
            padding: '12px 16px',
            borderRadius: '0 8px 8px 0'
          }}
        >
          <Checkbox
            checked={checked}
            onChange={e => onChange(e.target.checked)}
            sx={{
              padding: '4px',
              '&.Mui-checked': {
                color: theme.palette.customColors.Primary
              }
            }}
          />
        </Box>
      </Box>
    </Box>
  )
}

export default MedicationTimeCard
