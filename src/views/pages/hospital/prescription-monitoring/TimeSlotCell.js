import React from 'react'
import { Box, Tooltip, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'

// Helper function to format time from "12 AM" to "12:00 AM"
const formatScheduledTime = timeStr => {
  if (!timeStr) return ''

  // Split the time string (e.g., "12 AM" -> ["12", "AM"])
  const parts = timeStr.split(' ')
  if (parts.length !== 2) return timeStr

  const [hour, period] = parts

  // Add ":00" to the hour part
  return `${hour}:00 ${period}`
}

const TimeSlotCell = ({ hasSchedule, status, scheduledTime, dosage, onClick, config, theme }) => (
  <>
    {hasSchedule ? (
      <Box
        onClick={onClick}
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          width: '184px'
        }}
      >
        {status !== 'pending' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography
              sx={{
                fontWeight: 500,
                fontFamily: 'Inter',
                fontStyle: 'normal',
                fontSize: '16px',
                lineHeight: '100%',
                letterSpacing: 0,
                color: config?.color
              }}
            >
              {status ? status.charAt(0).toUpperCase() + status.slice(1) : ''}
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Inter',
                fontWeight: 400,
                fontStyle: 'normal',
                fontSize: '14px',
                letterSpacing: 0,
                color: theme.palette.customColors.OnSurfaceVariant,
                textDecoration: config?.textDecoration
              }}
              variant='caption'
            >
              {formatScheduledTime(scheduledTime)}
            </Typography>
          </Box>
        )}
        <Tooltip title={dosage} arrow placement='top'>
          <Typography
            sx={{
              fontSize: '14px',
              mx: status === 'pending' && 'auto',
              lineHeight: 1,
              letterSpacing: 0,
              textAlign: 'right',
              color: theme.palette.customColors.neutralSecondary,

              // Ellipsis styles
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100px', // Consistent width
              flex: 1
            }}
            variant='caption'
          >
            {dosage}
          </Typography>
        </Tooltip>
      </Box>
    ) : (
      <Icon icon={'mdi-plus'} color={theme.palette.customColors.OutlineVariant} fontSize={20} />
    )}
  </>
)

export default React.memo(TimeSlotCell)