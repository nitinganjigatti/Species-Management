import React, { useEffect, useState } from 'react'
import { Box, Typography, IconButton, Chip } from '@mui/material'
import { styled } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'

const DashboardContainer = styled(Box)(({ theme }) => ({
  maxWidth: '100%',
  overflow: 'hidden'
}))

const MainContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  width: '100%',
  height: '100%'
}))

const FixedColumn = styled(Box)(({ theme }) => ({
  width: '180px',
  flexShrink: 0,
  borderRight: '1px solid #e9ecef',
  marginRight: theme.spacing(2),
  [theme.breakpoints.down('md')]: {
    width: '160px'
  }
}))

const ScrollableContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowX: 'auto',
  overflowY: 'hidden',
  height: '100%',
  '&::-webkit-scrollbar': {
    height: 0
  },
  scrollbarWidth: 'none',
  msOverflowStyle: 'none'
}))

const TimeSlotGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(24, minmax(80px, 1fr))', // Fixed 24 columns for 24 hours
  gap: theme.spacing(2),
  alignItems: 'center',
  width: 'max-content',
  minWidth: '100%',
  marginBottom: theme.spacing(3),
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: 'repeat(24, minmax(60px, 1fr))',
    gap: theme.spacing(1.5)
  }
}))

const MetricLabel = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(3, 2.5),
  backgroundColor: '#EFF5F2',
  borderRadius: 1,
  minHeight: '48px',
  marginBottom: theme.spacing(3),
  width: '100%'
}))

const MetricName = styled(Typography)(({ theme }) => ({
  fontSize: '14px',
  fontWeight: 500,
  color: '#495057',
  marginBottom: '2px'
}))

const MetricSubtext = styled(Typography)(({ theme }) => ({
  fontSize: '12px',
  color: '#6c757d'
}))

const TimeSlot = styled(Box)(({ theme }) => ({
  display: 'flex',
  padding: theme.spacing(5, 1.5),
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'white',
  borderRadius: '6px',
  border: '1px solid #e9ecef',
  fontSize: '13px',
  fontWeight: 500,
  color: '#495057',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  position: 'relative',
  minWidth: '80px',
  '&:hover': {
    backgroundColor: '#f8f9fa',
    borderColor: '#dee2e6'
  },
  [theme.breakpoints.down('md')]: {
    fontSize: '11px',
    padding: theme.spacing(2, 1.5),
    minWidth: '60px'
  }
}))

const TimeHeader = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  fontSize: '16px',
  fontWeight: 500,
  color: '#495057',
  padding: theme.spacing(4),
  background: '#EFF5F2',
  borderRadius: 0.5,
  position: 'relative',
  minWidth: '80px',
  [theme.breakpoints.down('md')]: {
    minWidth: '60px'
  }
}))

const TimeTooltip = styled(Box)(({ theme }) => ({
  position: 'absolute',
  transform: 'translate(-50%, -100%)',
  backgroundColor: '#fff',
  border: '2px solid #E35163',
  color: '#E35163',
  padding: '2px 8px',
  fontSize: '12px',
  fontWeight: 600,
  borderRadius: '8px',
  zIndex: 2,
  whiteSpace: 'nowrap',
  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',

  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-6px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 0,
    height: 0,
    borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent',
    borderTop: '6px solid #E35163'
  }
}))

const PatientMontoring = ({
  timeSlots = [
    '12 AM',
    '1 AM',
    '2 AM',
    '3 AM',
    '4 AM',
    '5 AM',
    '6 AM',
    '7 AM',
    '8 AM',
    '9 AM',
    '10 AM',
    '11 AM',
    '12 PM',
    '1 PM',
    '2 PM',
    '3 PM',
    '4 PM',
    '5 PM',
    '6 PM',
    '7 PM',
    '8 PM',
    '9 PM',
    '10 PM',
    '11 PM'
  ],
  metrics = [],
  onTimeSlotClick = () => {},
  onRemoveMetric = () => {}
}) => {
  const [hoveredSlot, setHoveredSlot] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const getCurrentSlotIndex = () => {
    const currentHour = currentTime.getHours()

    return timeSlots.findIndex(slot => {
      const hour = parseInt(slot)
      const isPM = slot.includes('PM')
      const normalizedHour = isPM && hour !== 12 ? hour + 12 : slot.includes('AM') && hour === 12 ? 0 : hour

      return normalizedHour === currentHour
    })
  }

  const defaultMetrics = [
    {
      id: 'temperature',
      name: 'Temperature',
      subtext: 'Custom',
      timeSlots: timeSlots.map((time, index) => ({
        time,
        isActive: index === 2,
        value: index === 2 ? '01:30 AM' : undefined
      })),
      canEdit: true
    },
    {
      id: 'heartRate',
      name: 'Heart Rate',
      subtext: 'Custom',
      timeSlots: timeSlots.map(time => ({ time })),
      canEdit: true
    },
    {
      id: 'respirationRate',
      name: 'Respiration Rate',
      subtext: 'Custom',
      timeSlots: timeSlots.map(time => ({ time })),
      canEdit: true
    },
    {
      id: 'appetite',
      name: 'Appetite',
      subtext: 'Custom',
      timeSlots: timeSlots.map(time => ({ time })),
      canEdit: true
    },
    {
      id: 'crt',
      name: 'CRT',
      subtext: 'Custom',
      timeSlots: timeSlots.map(time => ({ time })),
      canEdit: true
    },
    {
      id: 'urination',
      name: 'Urination',
      subtext: 'Custom',
      timeSlots: timeSlots.map(time => ({ time })),
      canEdit: true
    },
    {
      id: 'defecation',
      name: 'Defecation',
      subtext: 'Custom',
      timeSlots: timeSlots.map(time => ({ time })),
      canEdit: true
    }
  ]

  const displayMetrics = metrics.length > 0 ? metrics : defaultMetrics

  const handleTimeSlotClick = (metricId, timeSlot) => {
    onTimeSlotClick(metricId, timeSlot.time)
  }

  return (
    <DashboardContainer>
      <MainContainer>
        {/* Fixed Column for Labels */}
        <FixedColumn>
          {/* Header for the fixed column */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 4,
              background: '#EFF5F2',
              borderRadius: 0.5,
              marginBottom: 3
            }}
          >
            <Typography>Monitoring</Typography>
            <Icon icon={'mdi-plus'} fontSize={20} />
          </Box>

          {/* Metric Labels */}
          {displayMetrics.map(metric => (
            <MetricLabel key={metric.id}>
              <Box>
                <MetricName>{metric.name}</MetricName>
                <MetricSubtext>{metric.subtext}</MetricSubtext>
              </Box>
              {metric.canEdit && (
                <IconButton size='small' onClick={() => onRemoveMetric(metric.id)} sx={{ color: '#6c757d', ml: 1 }}>
                  <Icon icon={'mdi-close'} fontSize={20} />
                </IconButton>
              )}
            </MetricLabel>
          ))}
        </FixedColumn>

        {/* Scrollable Container for Time Slots */}
        <ScrollableContainer>
          {/* Time Headers */}
          <TimeSlotGrid>
            {timeSlots.map((time, index) => (
              <TimeHeader key={time}>
                {time}
                {/* Tooltip only if this is the current hour slot */}
                {(() => {
                  const currentHour = currentTime.getHours()
                  const hour = parseInt(time)
                  const isPM = time.includes('PM')
                  const normalizedHour = isPM && hour !== 12 ? hour + 12 : time.includes('AM') && hour === 12 ? 0 : hour

                  if (normalizedHour === currentHour) {
                    const minutes = currentTime.getMinutes()
                    const leftPercentage = (minutes / 60) * 100

                    return (
                      <TimeTooltip
                        sx={{
                          left: `${leftPercentage}%`
                        }}
                      >
                        {currentTime.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </TimeTooltip>
                    )
                  }

                  return null
                })()}
              </TimeHeader>
            ))}
          </TimeSlotGrid>

          {/* Metric Time Slots */}
          {displayMetrics.map(metric => (
            <TimeSlotGrid key={metric.id}>
              {metric.timeSlots.map((timeSlot, index) => {
                const slotKey = `${metric.id}-${index}`

                return (
                  <TimeSlot
                    key={slotKey}
                    onClick={() => handleTimeSlotClick(metric.id, timeSlot)}
                    onMouseEnter={() => setHoveredSlot(slotKey)}
                    onMouseLeave={() => setHoveredSlot(null)}
                    sx={{
                      transform: hoveredSlot === slotKey ? 'translateY(-1px)' : 'none'
                    }}
                  >
                    <Icon icon={'mdi-plus'} fontSize={20} />
                  </TimeSlot>
                )
              })}
            </TimeSlotGrid>
          ))}
        </ScrollableContainer>
      </MainContainer>
    </DashboardContainer>
  )
}

export default PatientMontoring
