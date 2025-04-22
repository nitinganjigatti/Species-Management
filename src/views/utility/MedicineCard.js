import React from 'react'
import { Card, Typography, Box, Avatar, alpha } from '@mui/material'
import { useTheme } from '@emotion/react'
import RenderUtility from 'src/utility/render'
import CustomChip from 'src/@core/components/mui/chip'

const MedicineCard = ({ name, description, pending, icon, pendingColor, control_substance, prescription_required }) => {
  const theme = useTheme()

  return (
    <Card
      sx={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px',
        boxShadow: `0px 2px 12px 0px ${theme.palette.customColors.neutral05}`,
        borderRadius: '8px',
        mb: '12px'
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
        {/* Avatar for Medicine Icon */}
        <Avatar
          variant='square'
          src={icon?.trim() ? icon : '/images/Medicine_Icon.png'}
          alt={name}
          sx={{ width: 32, height: 32 }}
        />
      </Box>

      <Box sx={{ flexGrow: 1 }}>
        <Typography sx={{ fontSize: '14px', fontWeight: 600, color: 'customColors.OnSurfaceVariant' }}>
          {RenderUtility?.renderControlLabel(control_substance === '1', 'CS')}{' '}
          {/* {prescription_required === '1' && <CustomChip label='PR' skin='light' color='success' size='small' />} */}
          {RenderUtility?.renderPrescriptionLabel(prescription_required === '1', 'PR')} {name}
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
