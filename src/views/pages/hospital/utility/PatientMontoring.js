import React, { useEffect, useRef, useState, useMemo } from 'react'
import { Box, Typography, IconButton } from '@mui/material'
import { styled } from '@mui/material/styles'
import Icon from 'src/@core/components/icon' // Keep your Icon import as is
import { useTheme } from '@emotion/react'

// Utility functions
const getLabelForHour = hour => {
  const normalizedHour = hour === 24 ? 0 : hour
  const h = normalizedHour % 12 === 0 ? 12 : normalizedHour % 12
  const ampm = normalizedHour < 12 ? 'AM' : 'PM'

  return `${h} ${ampm}`
}

const convertLabelToHour24 = label => {
  const [hourStr, meridian] = label.split(' ')
  let hour = parseInt(hourStr, 10)
  if (meridian === 'AM') return hour === 12 ? 0 : hour
  else return hour === 12 ? 12 : hour + 12
}

// Styled components
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

const TimeSlotGrid = styled(Box)(({ theme, numColumns }) => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${numColumns}, minmax(160px, 1fr))`,
  gap: theme.spacing(2),
  alignItems: 'stretch',
  width: 'max-content',
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: `repeat(${numColumns}, minmax(120px, 1fr))`,
    gap: theme.spacing(1.5)
  }
}))

const HeaderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 2.5),
  background: theme.palette.customColors.lightBg,
  borderRadius: 1,
  height: '56px',
  marginBottom: theme.spacing(2),
  width: '100%'
}))

const MetricLabel = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 2.5),
  backgroundColor: theme.palette.customColors.lightBg,
  borderRadius: 1,
  height: '72px',
  marginBottom: theme.spacing(2),
  width: '100%'
}))

const MetricName = styled(Typography)(({ theme }) => ({
  fontSize: '14px',
  fontWeight: 500,
  color: theme.palette.customColors.deepDark,
  marginBottom: '2px'
}))

const MetricSubtext = styled(Typography)(({ theme }) => ({
  fontSize: '12px',
  color: theme.palette.customColors.secondaryBg
}))

const TimeSlot = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'white',
  borderRadius: '6px',
  border: '1px dashed',
  borderColor: theme.palette.customColors.OutlineVariant,
  fontSize: '13px',
  fontWeight: 500,
  color: theme.palette.customColors.OutlineVariant,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  position: 'relative',
  minWidth: '160px',
  height: '72px',
  '&:hover': {
    backgroundColor: '#f8f9fa',
    borderColor: '#dee2e6'
  },
  [theme.breakpoints.down('md')]: {
    fontSize: '11px',
    minWidth: '120px'
  }
}))

const TimeHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  fontSize: '16px',
  fontWeight: 500,
  color: theme.palette.customColors.deepDark,
  background: theme.palette.customColors.lightBg,
  borderRadius: 1,
  position: 'relative',
  minWidth: '160px',
  height: '56px',
  [theme.breakpoints.down('md')]: {
    minWidth: '120px'
  }
}))

const TimeTooltip = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '10px',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: '#fff',
  border: '1px solid',
  borderColor: theme.palette.customColors.Error,
  color: theme.palette.customColors.Error,
  padding: '4px 8px',
  fontSize: '12px',
  fontWeight: 600,
  borderRadius: '8px',
  zIndex: 1000,
  whiteSpace: 'nowrap',
  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 0,
    height: 0,
    borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent',
    borderTop: '6px solid #E35163',
    borderBottom: 'none'
  }
}))

const PatientMonitoring = ({ metrics = [], onTimeSlotClick = () => {}, onRemoveMetric = () => {} }) => {
  const theme = useTheme()

  const scrollContainerRef = useRef(null)
  const hourRefs = useRef({})

  const [hoveredSlot, setHoveredSlot] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [didInitialScroll, setDidInitialScroll] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Time slots from 12 AM up to current hour inclusive
  const timeSlots = useMemo(() => {
    const slots = []
    const currentHour = currentTime.getHours()
    for (let hour = 0; hour <= currentHour; hour++) {
      slots.push(getLabelForHour(hour))
    }

    return slots
  }, [currentTime])

  const createTimeSlotStructure = timeSlots => {
    return timeSlots.map(time => ({
      time,
      isActive: false,
      value: undefined
    }))
  }

  const defaultMetrics = useMemo(() => {
    return [
      {
        id: 'temperature',
        name: 'Temperature',
        subtext: 'Custom',
        timeSlots: createTimeSlotStructure(timeSlots),
        canEdit: true
      },
      {
        id: 'heartRate',
        name: 'Heart Rate',
        subtext: 'Custom',
        timeSlots: createTimeSlotStructure(timeSlots),
        canEdit: true
      },
      {
        id: 'respirationRate',
        name: 'Respiration Rate',
        subtext: 'Custom',
        timeSlots: createTimeSlotStructure(timeSlots),
        canEdit: true
      },
      {
        id: 'appetite',
        name: 'Appetite',
        subtext: 'Custom',
        timeSlots: createTimeSlotStructure(timeSlots),
        canEdit: true
      },
      {
        id: 'crt',
        name: 'CRT',
        subtext: 'Custom',
        timeSlots: createTimeSlotStructure(timeSlots),
        canEdit: true
      },
      {
        id: 'urination',
        name: 'Urination',
        subtext: 'Custom',
        timeSlots: createTimeSlotStructure(timeSlots),
        canEdit: true
      },
      {
        id: 'defecation',
        name: 'Defecation',
        subtext: 'Custom',
        timeSlots: createTimeSlotStructure(timeSlots),
        canEdit: true
      }
    ]
  }, [timeSlots])

  const displayMetrics = metrics.length > 0 ? metrics : defaultMetrics

  const handleTimeSlotClick = (metricId, timeValue) => {
    onTimeSlotClick(metricId, timeValue)
  }

  // On initial load, scroll current hour's slot flush right in container
  useEffect(() => {
    if (!didInitialScroll) {
      const currentHour24 = currentTime.getHours()
      const currentHourLabel = getLabelForHour(currentHour24)
      const currentHourElement = hourRefs.current[currentHourLabel]
      const scrollContainer = scrollContainerRef.current

      if (currentHourElement && scrollContainer) {
        const elOffsetLeft = currentHourElement.offsetLeft
        const elWidth = currentHourElement.offsetWidth
        const containerWidth = scrollContainer.clientWidth
        let scrollLeftPos = elOffsetLeft + elWidth - containerWidth
        if (scrollLeftPos < 0) scrollLeftPos = 0

        scrollContainer.scrollTo({
          left: scrollLeftPos,
          behavior: 'smooth'
        })
      }
      setDidInitialScroll(true)
    }
  }, [didInitialScroll, currentTime])

  return (
    <DashboardContainer>
      <MainContainer>
        <FixedColumn>
          <HeaderContainer>
            <Typography>Monitoring</Typography>
            <IconButton size='small'>
              <Icon icon={'mdi-plus'} fontSize={20} />
            </IconButton>
          </HeaderContainer>

          {displayMetrics.map(metric => (
            <MetricLabel key={metric.id}>
              <Box>
                <MetricName>{metric.name}</MetricName>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Icon />
                  <MetricSubtext>{metric.subtext}</MetricSubtext>
                </Box>
              </Box>

              {metric.canEdit && (
                <IconButton size='small' onClick={() => onRemoveMetric(metric.id)} sx={{ color: '#6c757d', ml: 1 }}>
                  <Icon icon={'mdi-close'} fontSize={20} />
                </IconButton>
              )}
            </MetricLabel>
          ))}
        </FixedColumn>

        <ScrollableContainer ref={scrollContainerRef}>
          <TimeSlotGrid numColumns={timeSlots.length}>
            {timeSlots.map(time => {
              const currentHour24 = currentTime.getHours()
              const slotHour24 = convertLabelToHour24(time)
              const isCurrentHour = slotHour24 === currentHour24

              const currentMinutes = currentTime.getMinutes()
              const positionPercentage = (currentMinutes / 60) * 100

              return (
                <TimeHeader key={time} sx={{ position: 'relative' }} ref={el => (hourRefs.current[time] = el)}>
                  {time}
                  {isCurrentHour && (
                    <TimeTooltip sx={{ left: `${positionPercentage}%` }}>
                      {currentTime.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </TimeTooltip>
                  )}
                </TimeHeader>
              )
            })}
          </TimeSlotGrid>

          {displayMetrics.map(metric => (
            <TimeSlotGrid key={metric.id} numColumns={timeSlots.length}>
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

export default PatientMonitoring
