import React from 'react'
import { Box, Tooltip, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'

// Helper function to format time from "12 AM" to "12:00 AM"
const formatScheduledTime = (timeStr: string) => {
  if (!timeStr) return ''

  const parts = timeStr.split(' ')
  if (parts.length !== 2) return timeStr

  const [hour, period] = parts

  return `${hour}:00 ${period}`
}

interface TimeSlotCellProps {
  hasSchedule?: boolean
  status?: string
  scheduledTime?: string
  administeredTime?: string
  dosage?: string
  onClick?: (e: React.MouseEvent<HTMLElement>) => void
  config?: any
  theme: any
  disabled?: boolean
}

const TimeSlotCell = ({
  hasSchedule,
  status,
  scheduledTime,
  administeredTime,
  dosage,
  onClick,
  config,
  theme,
  disabled
}: TimeSlotCellProps) => (
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
                textDecoration: status === 'stopped' ? 'line-through' : 'none'
              }}
              variant='caption'
            >
              {status == 'administered' || status == 'skipped' || status == 'stopped'
                ? formatToIST(administeredTime || '')
                : formatScheduledTime(scheduledTime || '')}
            </Typography>
          </Box>
        )}
        <Tooltip title={dosage} arrow placement='top'>
          <Typography
            sx={{
              fontSize: '14px',
              mx: status === 'pending' ? 'auto' : undefined,
              lineHeight: 1.5,
              letterSpacing: 0,
              textAlign: 'center',
              color: theme.palette.customColors.neutralSecondary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              px: status == 'pending' ? 2 : undefined,
              maxWidth: status == 'pending' ? '100%' : '50px',
              flex: 1
            }}
            variant='caption'
          >
            {dosage}
          </Typography>
        </Tooltip>
      </Box>
    ) : !disabled ? (
      <Icon icon={'mdi-plus'} color={theme.palette.customColors.OutlineVariant} fontSize={20} />
    ) : null}
  </>
)

export default React.memo(TimeSlotCell)

const formatToIST = (utcTimeString: string) => {
  if (!utcTimeString) return ''

  try {
    const timePart = utcTimeString.split(':').slice(0, 2).join(':')
    const [hoursStr, minutesStr] = timePart.split(':')

    let hours = parseInt(hoursStr, 10)
    let minutes = parseInt(minutesStr || '00', 10)

    hours += 5
    minutes += 30

    if (minutes >= 60) {
      hours += Math.floor(minutes / 60)
      minutes = minutes % 60
    }

    if (hours >= 24) {
      hours = hours % 24
    }

    const ampm = hours >= 12 ? 'PM' : 'AM'
    let displayHours = hours % 12
    displayHours = displayHours === 0 ? 12 : displayHours

    const formattedHours = displayHours.toString().padStart(2, '0')
    const formattedMinutes = minutes.toString().padStart(2, '0')

    return `${formattedHours}:${formattedMinutes} ${ampm}`
  } catch (error) {
    console.error('Error formatting time:', error)

    return utcTimeString
  }
}
