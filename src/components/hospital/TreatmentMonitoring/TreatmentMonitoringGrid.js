import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { Box, Typography, IconButton, Grid, Button, Skeleton } from '@mui/material'
import { alpha, styled, useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import HorizontalDateNav from 'src/views/utility/HorizontalDateNav'
import AddScheduleDrawer from 'src/views/pages/hospital/treatment-monitoring/AddScheduleDrawer'
import AddParameterDrawer from 'src/views/pages/hospital/treatment-monitoring/AddParameterDrawer'
import { useRouter } from 'next/router'
import { getTreatmentMonitoringData } from 'src/lib/api/hospital/treatmentMonitoring'
import AddParameterDataEntry from 'src/views/pages/hospital/treatment-monitoring/AddParameterDataEntry'
import { useQuery } from '@tanstack/react-query'

// Utility functions
const getLabelForHour = hour => {
  const normalizedHour = hour === 24 ? 0 : hour
  const h = normalizedHour % 12 === 0 ? 12 : normalizedHour % 12
  const ampm = normalizedHour < 12 ? 'AM' : 'PM'

  return `${h} ${ampm}`
}

const useRealtimeTooltip = (scrollContainerRef, timeSlots) => {
  useEffect(() => {
    let animationFrameId
    let tooltipElement = null

    const createTooltip = () => {
      if (tooltipElement) return tooltipElement

      tooltipElement = document.createElement('div')
      tooltipElement.style.cssText = `
        position: absolute;
        top: 0px;
        transform: translateX(-50%);
        background-color: transparent;
        border: 1px solid #E35163;
        color: #E35163;
        padding: 4px 8px;
        font-size: 12px;
        font-weight: 600;
        border-radius: 8px;
        z-index: 1000;
        white-space: nowrap;
        box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        display: none;
        pointer-events: none;
      `
      const style = document.createElement('style')
      style.textContent = `
        .tooltip-arrow::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid #E35163;
          border-bottom: none;
        }
      `
      document.head.appendChild(style)
      tooltipElement.className = 'tooltip-arrow'

      return tooltipElement
    }

    const updateTooltip = () => {
      if (!scrollContainerRef.current) {
        animationFrameId = requestAnimationFrame(updateTooltip)

        return
      }

      const now = new Date()
      const currentHour24 = now.getHours()
      const currentMinutes = now.getMinutes()
      const currentSeconds = now.getSeconds()
      const currentHourLabel = getLabelForHour(currentHour24)
      const hourElement = scrollContainerRef.current.querySelector(`[data-hour="${currentHourLabel}"]`)

      if (!hourElement) {
        if (tooltipElement) {
          tooltipElement.style.display = 'none'
        }
        animationFrameId = requestAnimationFrame(updateTooltip)

        return
      }

      if (!tooltipElement) {
        tooltipElement = createTooltip()
        const gridContainer = hourElement.parentElement
        if (gridContainer) {
          gridContainer.appendChild(tooltipElement)
        }
      }

      const totalSecondsInHour = 3600
      const currentSecondsInHour = currentMinutes * 60 + currentSeconds
      const positionPercentage = (currentSecondsInHour / totalSecondsInHour) * 100
      const hourRect = hourElement.getBoundingClientRect()
      const containerRect = hourElement.parentElement.getBoundingClientRect()
      const hourWidth = hourRect.width
      const hourLeftOffset = hourRect.left - containerRect.left
      const pixelPosition = hourLeftOffset + (hourWidth * positionPercentage) / 100

      tooltipElement.style.left = `${pixelPosition}px`
      tooltipElement.style.display = 'block'
      tooltipElement.textContent = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })

      const scrollContainer = scrollContainerRef.current
      const scrollLeft = scrollContainer.scrollLeft
      const scrollRight = scrollLeft + scrollContainer.clientWidth

      const isInView = pixelPosition >= scrollLeft && pixelPosition <= scrollRight
      tooltipElement.style.opacity = isInView ? '1' : '0.3'

      animationFrameId = requestAnimationFrame(updateTooltip)
    }

    animationFrameId = requestAnimationFrame(updateTooltip)

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      if (tooltipElement && tooltipElement.parentElement) {
        tooltipElement.parentElement.removeChild(tooltipElement)
      }
    }
  }, [scrollContainerRef, timeSlots])
}

const PatientMonitoring = React.memo(({ metrics = [], patientData }) => {
  const theme = useTheme()
  const scrollContainerRef = useRef(null)
  const hourRefs = useRef({})
  const router = useRouter()

  const { id, medical_record_id, animal_id } = router.query
  const today = new Date().toISOString().split('T')[0]

  const [hoveredSlot, setHoveredSlot] = useState(null)
  const [didInitialScroll, setDidInitialScroll] = useState(false)
  const [openScheduleDrawer, setOpenScheduleDrawer] = useState(false)
  const [addParameterDrawerOpen, setAddParameterDrawerOpen] = useState(false)
  const [openParamsEntryDrawer, setOpenParamsEntryDrawer] = useState(false)
  const [parametersLoading, setParametersLoading] = useState(false)
  const [dates, setDates] = useState(null)
  const [selectedDate, setSelectedDate] = useState(today)

  // const [monitoringData, setMonitoringData] = useState([])

  const [paramsDetails, setParamsDetails] = useState({
    interval: '',
    date: '',
    parameter: null
  })

  useEffect(() => {
    if (patientData?.admitted_at) {
      const admittedDate = new Date(patientData.admitted_at)
      const currentDate = new Date()

      const datesArray = []
      let tempDate = new Date(admittedDate)
      while (tempDate <= currentDate) {
        datesArray.push(tempDate.toISOString().split('T')[0])
        tempDate.setDate(tempDate.getDate() + 1)
      }

      setDates(datesArray)
    }
  }, [patientData])

  const timeSlots = useMemo(() => {
    const slots = []
    for (let hour = 0; hour <= 23; hour++) {
      slots.push(getLabelForHour(hour))
    }

    return slots
  }, [])

  useRealtimeTooltip(scrollContainerRef, timeSlots)

  const createTimeSlotStructure = useCallback(slots => slots.map(time => ({ time, isActive: false })), [])

  const {
    data: monitoringDataListings,
    isLoading: monitoringLoading,
    refetch: monitoringRefetch
  } = useQuery({
    queryKey: ['hospital-treatment-monitoring-listings', id, selectedDate],
    queryFn: () =>
      getTreatmentMonitoringData({
        date: selectedDate,
        hospital_case_id: id
      })
  })

  const monitoringData = useMemo(() => {
    return (
      monitoringDataListings?.data?.map(item => ({
        ...item,
        timeSlots: createTimeSlotStructure(timeSlots),
        canEdit: true
      })) || []
    )
  }, [monitoringDataListings, createTimeSlotStructure, timeSlots])

  const defaultMetrics = useMemo(() => monitoringData, [monitoringData])

  const displayMetrics = metrics?.length > 0 ? metrics : defaultMetrics

  const handleTimeSlotClick = ({ interval, date, parameter }) => {
    setOpenParamsEntryDrawer(true)
    setParamsDetails({ interval: interval, date: date, parameter: parameter })
  }

  useEffect(() => {
    if (!didInitialScroll && scrollContainerRef.current) {
      const now = new Date()
      const currentHour24 = now.getHours()
      const currentHourLabel = getLabelForHour(currentHour24)
      const currentHourElement = hourRefs.current[currentHourLabel]
      const scrollContainer = scrollContainerRef.current

      if (currentHourElement) {
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
  }, [didInitialScroll])

  const handleDateChange = date => {
    setSelectedDate(date)
  }

  const renderedMetrics = useMemo(() => {
    return displayMetrics?.map(metric => (
      <TimeSlotGrid key={metric?.id} numColumns={timeSlots.length}>
        {metric?.timeSlots.map((timeSlot, index) => {
          const slotKey = `${metric.assessment_type_id}-${index}`
          const durationMinutes = metric?.duration_minutes
          const [h, ampm] = timeSlot.time.split(' ')
          let hour = parseInt(h)
          if (ampm === 'PM' && hour !== 12) hour += 12
          if (ampm === 'AM' && hour === 12) hour = 0

          const currentHour = new Date().getHours()
          let bgColor = theme.palette.customColors.OnPrimary
          let isDisabled = hour > currentHour
          let showPlus = !isDisabled

          if (durationMinutes) {
            const intervalHours = durationMinutes / 60
            if (hour % intervalHours === 0) {
              bgColor = alpha(theme.palette.customColors.antzNotes, 0.64)
            }
          }

          return (
            <TimeSlot
              key={slotKey}
              sx={{
                backgroundColor: bgColor,
                opacity: isDisabled ? 0.5 : 1,
                cursor: isDisabled ? 'not-allowed' : 'pointer'
              }}
              onClick={() => {
                if (!isDisabled)
                  handleTimeSlotClick({
                    interval: timeSlot.time,
                    date: selectedDate,
                    parameter: metric
                  })
              }}
            >
              {!isDisabled && showPlus && <Icon icon={'mdi-plus'} fontSize={20} />}
            </TimeSlot>
          )
        })}
      </TimeSlotGrid>
    ))
  }, [displayMetrics, timeSlots, selectedDate])

  return (
    <>
      <Grid container spacing={2} sx={{ alignItems: 'center', my: 4, justifyContent: 'space-between' }}>
        <Grid container spacing={6}>
          <Grid item size={{ xs: 12, sm: 12, md: 10 }}>
            <HorizontalDateNav onDateSelect={handleDateChange} selectedDate={selectedDate} dates={dates} />
          </Grid>
          <Grid item size={{ xs: 12, sm: 12, md: 2 }}>
            <Button
              sx={{ height: '48px', width: '100%', fontSize: '0.8rem' }}
              variant='contained'
              onClick={() => setOpenScheduleDrawer(true)}
            >
              Schedule
            </Button>
          </Grid>
        </Grid>
        <Grid size={{ xs: 12 }} sx={{ mt: 6 }}>
          {monitoringLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
              <Box sx={{ width: '180px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Skeleton variant='rectangular' height={56} sx={{ borderRadius: 2 }} animation='wave' />
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} variant='rectangular' height={72} sx={{ borderRadius: 2 }} animation='wave' />
                ))}
              </Box>
              <Box sx={{ flex: 1, overflowX: 'auto' }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  {[...Array(6)].map((_, i) => (
                    <Skeleton
                      key={i}
                      variant='rectangular'
                      height={56}
                      width={160}
                      sx={{ borderRadius: 2 }}
                      animation='wave'
                    />
                  ))}
                </Box>
                {[...Array(4)].map((_, rowIndex) => (
                  <Box key={rowIndex} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    {[...Array(6)].map((_, colIndex) => (
                      <Skeleton
                        key={colIndex}
                        variant='rectangular'
                        height={72}
                        width={160}
                        sx={{ borderRadius: 2 }}
                        animation='wave'
                      />
                    ))}
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <DashboardContainer>
              <MainContainer>
                <FixedColumn>
                  <HeaderContainer>
                    <Typography
                      sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.neutralPrimary }}
                    >
                      Monitoring
                    </Typography>
                    <IconButton size='small' onClick={() => setAddParameterDrawerOpen(true)}>
                      <Icon icon={'ei:plus'} fontSize={30} color={theme.palette.primary.main} fontWeight={600} />
                    </IconButton>
                  </HeaderContainer>

                  {displayMetrics?.map(metric => (
                    <MetricLabel key={metric.assessment_type_id}>
                      <Box>
                        <MetricName>{metric.label}</MetricName>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Icon />
                          <MetricSubtext>{metric.frequency_label}</MetricSubtext>
                        </Box>
                      </Box>

                      {metric.canEdit && (
                        <IconButton size='small' onClick={() => console.log(metric)} sx={{ color: '#6c757d', ml: 1 }}>
                          <Icon icon={'mdi-close'} fontSize={20} />
                        </IconButton>
                      )}
                    </MetricLabel>
                  ))}
                </FixedColumn>

                <ScrollableContainer ref={scrollContainerRef}>
                  <TimeSlotGrid numColumns={timeSlots.length}>
                    {timeSlots.map(time => (
                      <TimeHeader key={time} data-hour={time} ref={el => (hourRefs.current[time] = el)}>
                        {time}
                      </TimeHeader>
                    ))}
                  </TimeSlotGrid>

                  {renderedMetrics}
                </ScrollableContainer>
              </MainContainer>
            </DashboardContainer>
          )}
        </Grid>
      </Grid>
      {openScheduleDrawer && (
        <AddScheduleDrawer
          open={openScheduleDrawer}
          setOpen={setOpenScheduleDrawer}
          monitoring={defaultMetrics}
          hospitalCaseId={id}
          refetchMonitoringData={monitoringRefetch}
        />
      )}
      {addParameterDrawerOpen && (
        <AddParameterDrawer
          open={addParameterDrawerOpen}
          setOpen={setAddParameterDrawerOpen}
          hospitalCaseId={id}
          refetchMonitoringData={monitoringRefetch}
        />
      )}
      {openParamsEntryDrawer && (
        <AddParameterDataEntry
          open={openParamsEntryDrawer}
          setOpen={setOpenParamsEntryDrawer}
          data={paramsDetails}
          hospitalCaseId={id}
          medicalRecordId={medical_record_id}
          animalId={animal_id}
          refetchMonitoringData={monitoringRefetch}
        />
      )}
    </>
  )
})

PatientMonitoring.displayName = 'PatientMonitoring'

export default PatientMonitoring

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
  position: 'relative', // Critical for tooltip positioning
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
