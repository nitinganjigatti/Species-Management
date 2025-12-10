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

const TimeSlotCell = ({ hasSchedule, status, scheduledTime, administeredTime, dosage, onClick, config, theme }) => (
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
                textDecoration: config?.textDecoration,
                textDecoration: status === 'administered' ? 'line-through' : 'none'
              }}
              variant='caption'
            >
              {status == 'administered' ? formatToIST(administeredTime) : formatScheduledTime(scheduledTime)}
            </Typography>
          </Box>
        )}
        <Tooltip title={dosage} arrow placement='top'>
          <Typography
            sx={{
              fontSize: '14px',
              mx: status === 'pending' && 'auto',
              lineHeight: 1.5,
              letterSpacing: 0,
              textAlign: 'center',
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

const formatToIST = (utcTimeString) => {
  if (!utcTimeString) return ''
  
  try {
    // Remove seconds if present
    const timePart = utcTimeString.split(':').slice(0, 2).join(':')
    const [hoursStr, minutesStr] = timePart.split(':')
    
    let hours = parseInt(hoursStr, 10)
    let minutes = parseInt(minutesStr || '00', 10)
    
    // Add 5 hours and 30 minutes
    hours += 5
    minutes += 30
    
    // Handle minute overflow
    if (minutes >= 60) {
      hours += Math.floor(minutes / 60)
      minutes = minutes % 60
    }
    
    // Handle hour overflow (24-hour format)
    if (hours >= 24) {
      hours = hours % 24
    }
    
    // Convert to 12-hour AM/PM format
    const ampm = hours >= 12 ? 'PM' : 'AM'
    let displayHours = hours % 12
    displayHours = displayHours === 0 ? 12 : displayHours
    
    // Format with leading zeros
    const formattedHours = displayHours.toString().padStart(2, '0')
    const formattedMinutes = minutes.toString().padStart(2, '0')
    
    return `${formattedHours}:${formattedMinutes} ${ampm}`
  } catch (error) {
    console.error('Error formatting time:', error)
    
return utcTimeString
  }
}