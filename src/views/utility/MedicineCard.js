import React from 'react'
import { Card, Typography, Box, Avatar, alpha } from '@mui/material'

const MedicineCard = ({ name, description, pending, icon, pendingColor }) => {
  return (
    <Card
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 5,
        mb: 2,
        minHeight: 100
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: 2,
          borderRadius: '8px',
          backgroundColor: theme => alpha(theme.palette.customColors.neutral_50, 0.05),
          justifyContent: 'center',
          mr: 3
        }}
      >
        <Avatar variant='square' src={icon} alt={name} sx={{ width: 32, height: 32 }} />
      </Box>
      {/* Avatar for Medicine Icon */}

      <Box sx={{ flexGrow: 1 }}>
        <Typography sx={{ fontSize: '14px', fontWeight: 600, color: 'customColors.OnSurfaceVariant' }}>
          {name}
        </Typography>
        <Typography variant='body2' sx={{ fontSize: '14px', fontWeight: 400, color: 'customColors.neutralSecondary' }}>
          {description}
        </Typography>
      </Box>

      <Box sx={{ textAlign: 'right' }}>
        <Typography variant='body2' sx={{ fontSize: '14px', fontWeight: 400, color: 'customColors.OnSurfaceVariant' }}>
          Pending Items
        </Typography>
        <Typography sx={{ fontSize: '16px', fontWeight: 600, color: pendingColor }}>
          {pending.toString().padStart(2, '0')}
        </Typography>
      </Box>
    </Card>
  )
}

export default MedicineCard
