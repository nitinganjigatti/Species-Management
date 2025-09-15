import React from 'react'
import { Box, Typography, Paper, IconButton, alpha } from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useTheme } from '@mui/material/styles'

const ActivityList = ({ activities }) => {
  const theme = useTheme()

  return (
    <Box sx={{ px: 5, py: 5 }}>
      <Typography sx={{ fontWeight: 600, mb: 2 }}>Activity</Typography>

      {/* Status Update */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: theme.palette.customColors.bodyBg,
          boxShadow: 'none',
          border: 'none',
          borderRadius: '8px'
        }}
      >
        <Typography sx={{ fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant, fontSize: '14px' }}>
          Status Update
        </Typography>
        <Typography
          sx={{ color: theme.palette.customColors.neutralSecondary, mb: 3, fontWeight: 400, fontSize: '12px' }}
        >
          Dr. Nitin • 12:05 PM • 19 May 2025
        </Typography>
        <Typography
          sx={{ mb: 1, color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 400, fontSize: '12px' }}
        >
          Severity: <strong>Medium</strong>
        </Typography>
        <Typography
          sx={{ mb: 2, color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 400, fontSize: '12px' }}
        >
          Status: <strong>Active</strong>
        </Typography>
        <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontWeight: 400, fontSize: '12px' }}>
          Comment
        </Typography>
        <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 400, fontSize: '14px' }}>
          Mild oral plaque formation inside beak noted; no concurrent bacterial infections detected
        </Typography>
      </Paper>

      {/* Activity Items */}
      {activities.map((activity, i) => (
        <Paper
          key={i}
          sx={{
            p: 3,
            mb: 3,
            background: alpha(theme.palette.customColors.antzNotes, 0.4),
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            boxShadow: 'none',
            border: 'none',
            borderRadius: '8px'
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant, fontSize: '14px' }}>
              Beak deformity present with overgrowth and surface cracking; patient shows signs of immunosuppression
            </Typography>
            <Typography
              sx={{
                color: theme.palette.customColors.neutralSecondary,
                fontWeight: 400,
                fontSize: '12px',
                mt: 1.5
              }}
            >
              Dr. Nitin • 12:05 PM • 19 May 2025
            </Typography>
          </Box>
          <IconButton size='small' style={{ padding: 1 }}>
            <EditOutlinedIcon sx={{ fontSize: 21, color: theme.palette.customColors.OnPrimaryContainer }} />
          </IconButton>
        </Paper>
      ))}
    </Box>
  )
}

export default ActivityList
