/* eslint-disable lines-around-comment */
import React, { useEffect, useRef, useState, useMemo } from 'react'
import { Box, Typography, IconButton, Grid, Button } from '@mui/material'
import { alpha, styled } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'
import MUICheckbox from 'src/views/forms/form-fields/MUICheckbox'
import HorizontalDateNav from 'src/views/utility/HorizontalDateNav'
import MUISwitch from 'src/views/forms/form-fields/MUISwitch'
import ActionButtons from '../FooterActionbuttons'
import TimeSlotCell from 'src/views/pages/hospital/prescription-monitoring/TimeSlotCell'
import MetricCard from 'src/views/pages/hospital/prescription-monitoring/MetricCard'
import Router from 'next/router'
import { useRouter } from 'next/router'
import NoDataFound from 'src/views/utility/NoDataFound'
import ActionButtonsWithSelection from '../ActionButtonsWithSelection'
import AdministerOrSkipModal from 'src/views/pages/hospital/prescription-monitoring/AdministerOrSkipModal'

const medicineData = {
  name: 'Levothyroxine',
  date: '2 Jan 2025',
  time: '12:00 PM',
  calculatedDosage: '310 mg'
}

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
  width: '266px',
  flexShrink: 0,
  marginRight: theme.spacing(2)
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
  marginBottom: theme.spacing(2)
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

const MetricCardWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  justifyItems: 'space-between',
  width: '266px',
  columnGap: '12px',
  marginBottom: theme.spacing(1.3)
}))

const MetricLabel = styled(Box, {
  shouldForwardProp: prop => prop !== 'config'
})(({ theme, config }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingLeft: '8px',
  backgroundColor: config?.backgroundColor,
  border: config?.border,
  borderRadius: 1,
  height: '74px',
  maxHeight: '74px',
  minHeight: '74px',
  cursor: 'pointer',
  width: '230px',
  borderRadius: '8px'
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

const TimeSlot = styled(Box, {
  shouldForwardProp: prop => prop !== 'config'
})(({ theme, config }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'white',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  position: 'relative',
  margin: 0,
  padding: 0,
  minWidth: '184px',
  height: '70px',
  marginTop: theme.spacing(0.5),
  backgroundColor: config?.backgroundColor,
  color: config?.color,
  border: config?.border,
  borderColor: config?.borderColor,
  padding: '8px',
  borderRadius: '8px',
  '&:hover': {
    backgroundColor: '#f8f9fa',
    borderColor: '#dee2e6'
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
  top: '2px',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: 'transparent',
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

// Shimmer UI Components
const ShimmerContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  width: '100%',
  height: '100%',
  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
}))

const ShimmerMetricCard = styled(Box)(({ theme }) => ({
  width: '230px',
  height: '74px',
  backgroundColor: theme.palette.action.hover,
  borderRadius: '8px',
  marginBottom: theme.spacing(1.3)
}))

const ShimmerTimeHeader = styled(Box)(({ theme }) => ({
  minWidth: '160px',
  height: '56px',
  backgroundColor: theme.palette.action.hover,
  borderRadius: '4px'
}))

const ShimmerTimeSlot = styled(Box)(({ theme }) => ({
  minWidth: '184px',
  height: '70px',
  backgroundColor: theme.palette.action.hover,
  borderRadius: '8px',
  marginTop: theme.spacing(0.5)
}))

const ShimmerButton = styled(Box)(({ theme }) => ({
  height: '48px',
  width: '100%',
  backgroundColor: theme.palette.action.hover,
  borderRadius: '4px'
}))

const ShimmerCheckbox = styled(Box)(({ theme }) => ({
  width: '100px',
  height: '20px',
  backgroundColor: theme.palette.action.hover,
  borderRadius: '4px'
}))

const ShimmerSwitch = styled(Box)(({ theme }) => ({
  width: '200px',
  height: '20px',
  backgroundColor: theme.palette.action.hover,
  borderRadius: '4px'
}))

// Shimmer Loading Components
const ShimmerHorizontalDateNav = () => (
  <Box sx={{ display: 'flex', gap: 2 }}>
    {Array.from({ length: 7 }).map((_, index) => (
      <Box
        key={index}
        sx={{
          width: '80px',
          height: '40px',
          backgroundColor: 'action.hover',
          borderRadius: '4px'
        }}
      />
    ))}
  </Box>
)

const ShimmerMetricsGrid = () => {
  const timeSlots = useMemo(() => {
    const slots = []
    for (let hour = 0; hour < 24; hour++) {
      slots.push(getLabelForHour(hour))
    }

    return slots
  }, [])

  return (
    <DashboardContainer>
      <MainContainer>
        <FixedColumn>
          <HeaderContainer>
            <Box sx={{ width: '120px', height: '20px', backgroundColor: 'action.hover', borderRadius: '4px' }} />
          </HeaderContainer>
          {Array.from({ length: 5 }).map((_, index) => (
            <MetricCardWrapper key={index}>
              <ShimmerMetricCard />
            </MetricCardWrapper>
          ))}
        </FixedColumn>

        <ScrollableContainer>
          <TimeSlotGrid numColumns={timeSlots.length}>
            {timeSlots.map((time, index) => (
              <ShimmerTimeHeader key={index} />
            ))}
          </TimeSlotGrid>
          {Array.from({ length: 5 }).map((_, rowIndex) => (
            <TimeSlotGrid key={rowIndex} numColumns={timeSlots.length}>
              {timeSlots.map((_, colIndex) => (
                <ShimmerTimeSlot key={colIndex} />
              ))}
            </TimeSlotGrid>
          ))}
        </ScrollableContainer>
      </MainContainer>
    </DashboardContainer>
  )
}

const PrescriptionMonitoringGrid = ({
  medications,
  dates = [],
  selectedDate,
  handleDateChange = () => {},
  onTimeSlotClick = () => {},
  onRemoveMetric = () => {},
  onOpenPrescriptionCard = () => {},
  isLoading
}) => {
  const theme = useTheme()
  const router = useRouter()
  const { id, animal_id, medical_record_id } = router.query
  const scrollContainerRef = useRef(null)
  const hourRefs = useRef({})

  const [hoveredSlot, setHoveredSlot] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [didInitialScroll, setDidInitialScroll] = useState(false)
  const [isAdministerOrSkipPopupOpen, setIsAdministerOrSkipPopupOpen] = useState(false)
  const [isAdministerOrSkipPopupLoading, setIsAdministerOrSkipPopupLoading] = useState(false)
  // Array of selected metric objects
  const [selectedMetrics, setSelectedMetrics] = useState([])
  const [isAdminstrationLoading, setIsAdminstrationLoading] = useState(false)
  const [selectedMedicine, setSelectedMedicine] = useState(null)

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      if (now.getMinutes() !== currentTime.getMinutes()) {
        setCurrentTime(now)
      }
    }, 30000) // Check every 30 seconds instead of every second

    return () => clearInterval(interval)
  }, [currentTime])

  // Time slots for all 24 hours
  const timeSlots = useMemo(() => {
    const slots = []
    for (let hour = 0; hour < 24; hour++) {
      slots.push(getLabelForHour(hour))
    }

    return slots
  }, [])

  const createTimeSlotStructure = timeSlots => {
    const slots = []
    for (let hour = 0; hour < 24; hour++) {
      slots.push(getLabelForHour(hour))
    }

    return timeSlots.map(time => ({
      time,
      isActive: false,
      value: undefined
    }))
  }

  // Default metrics if no medications are provided
  const defaultMetrics = useMemo(() => {
    const medicationsMapped = medications?.map(med => ({ ...med, timeSlots: createTimeSlotStructure(timeSlots) }))

    return medicationsMapped
  }, [timeSlots, medications])

  function isSameHourSlot(time1, time2) {
    if (!time1 || !time2) return false

    const normalize = timeStr => {
      const parts = timeStr.trim().split(' ')
      if (parts.length < 2) return null

      const meridian = parts[1].toUpperCase()
      const hourPart = parts[0]

      // Handles "1", "01", "1:22", "01:22"
      const [hourStr] = hourPart.split(':')
      const hour = parseInt(hourStr, 10)

      return `${hour} ${meridian}`
    }

    return normalize(time1) === normalize(time2)
  }

  const formatMedicationData = useMemo(() => {
    // if (!medications || defaultMetrics.length === 0) return []
    const medicationList = defaultMetrics
    // console.log('medications:', medications)
    // console.log('defaultMetrics:', defaultMetrics)

    return medicationList?.map(medication => {
      // Changed 'el' to 'medication' for clarity

      // Debug: Log the entire medication object and specifically the schedule
      // console.log('Full medication object:', medication)
      // console.log('Schedule property:', medication.schedule)
      // console.log('Schedule type:', typeof medication.schedule)

      const medicationTimeSlots = timeSlots?.map(timeLabel => {
        // Handle time format differences - normalize both formats
        // Add safety check for schedule array

        // const schedule =
        //   medication.schedule && Array.isArray(medication.schedule)
        //     ? medication.schedule.find(s => s.time == timeLabel)
        //     : undefined
        let schedule =
          medication.schedule && Array.isArray(medication.schedule)
            ? medication.schedule.find(s => isSameHourSlot(s.time, timeLabel))
            : undefined

        // console.log('isSameHourSlot :', schedule)

        // debugger

        return {
          time: timeLabel,

          // scheduledTime: schedule.time

          isActive: schedule ? true : false,
          value: schedule
            ? {
                schedule_id: schedule.schedule_id,
                dosage: schedule.dosage,
                status: schedule.status,
                administered_time: schedule.administered_time,
                compliance_note: schedule.compliance_note,
                scheduledTime: schedule?.time
              }
            : undefined
        }
      })

      return {
        id: medication.id,
        name: medication.name,
        frequency: medication.frequency,
        progress: medication.progress,
        status: medication.status,
        timeSlots: medicationTimeSlots,
        canEdit: true,
        schedule:
          medication.schedule && Array.isArray(medication.schedule)
            ? medication.schedule.map(schedule => ({
                schedule_id: schedule.schedule_id,
                time: schedule.time,
                dosage: schedule.dosage,
                status: schedule.status,
                administered_time: schedule.administered_time,
                compliance_note: schedule.compliance_note
              }))
            : [] // Default to empty array if schedule is undefined/null
      }
    })
  }, [defaultMetrics, timeSlots, medications])

  // Use medication data if available, otherwise use default metrics
  const displayMetrics = formatMedicationData

  // Select all logic
  const isAllSelected = displayMetrics?.length > 0 && selectedMetrics?.length === displayMetrics?.length
  const isIndeterminate = selectedMetrics?.length > 0 && selectedMetrics?.length < displayMetrics?.length

  const handleSelectAll = event => {
    if (event.target.checked) {
      setSelectedMetrics(
        displayMetrics?.filter(
          metric =>
            !(
              Array.isArray(metric.schedule) &&
              metric.schedule.length > 0 &&
              metric.schedule.every(s => s.status === 'administered')
            )
        )
      )
    } else {
      setSelectedMetrics([])
    }
  }

  const handleSelectMetric = metricObj => {
    setSelectedMetrics(prev => {
      const exists = prev.some(m => m.id === metricObj.id)
      if (exists) {
        return prev.filter(m => m.id !== metricObj.id)
      } else {
        return [...prev, metricObj]
      }
    })
  }

  // const displayMetrics = medications?.length > 0 ? formatMedicationData : defaultMetrics

  const handleTimeSlotClick = (metricId, timeValue) => {
    onTimeSlotClick(metricId, timeValue)
    console.log('metricId', metricId)
    console.log('timeValue', timeValue)
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

  // const allSchedules = defaultMetrics.flatMap(metric => metric.schedule)

  // Count occurrences of each time
  const prescriptionCardColorsConfig = prescriptionDetails => {
    const { status } = prescriptionDetails

    if (status === 'stopped') {
      return {
        backgroundColor: alpha(theme.palette.customColors.TertiaryContainer, 0.2),
        border: `0.5px solid ${theme.palette.customColors.TertiaryContainer}`

        // textStyle: ''
      }
    } else if (status === 'skipped') {
      return {
        backgroundColor: theme.palette.customColors.Surface,
        border: `0.5px solid ${theme.palette.customColors.OutlineVariant}`
      }
    } else {
      return { backgroundColor: theme.palette.customColors.Background, border: '1px solid transparent' }
    }
  }

  // function renderStyledText(text, color = 'inherit') {
  //   return (
  //     <Typography
  //       sx={{
  //         fontFamily: 'Inter, sans-serif',
  //         fontWeight: 500,
  //         fontSize: '16px',
  //         lineHeight: '100%',
  //         letterSpacing: 0,
  //         verticalAlign: 'middle',
  //         fontStyle: 'normal',
  //         color,
  //         width: '210px'
  //       }}
  //     >
  //       {text}
  //     </Typography>
  //   )
  // }
  const timeSlotGridConfig = status => {
    // debugger

    if (status === 'stopped') {
      return {
        backgroundColor: alpha(theme.palette.customColors.TertiaryContainer, 0.2),
        border: `0.5px solid ${theme.palette.customColors.TertiaryContainer}`,
        color: theme.palette.customColors.Tertiary,
        textDecoration: 'line-through'
      }
    } else if (status === 'skipped') {
      return {
        backgroundColor: theme.palette.customColors.neutral05,
        border: `0.5px solid ${theme.palette.customColors.OutlineVariant}`,
        color: theme.palette.customColors.neutralPrimary,
        textDecoration: 'none'
      }
    } else if (status === 'administered') {
      return {
        backgroundColor: theme.palette.customColors.onPrimary,
        border: `0.5px solid ${theme.palette.customColors.Outline}`,
        color: theme.palette.customColors.OnSurface,
        textDecoration: 'none'
      }
    } else if (status === 'pending') {
      return {
        backgroundColor: '#FCF4AEA3',
        border: `0.5px solid ${theme.palette.customColors.SurfaceVariant}`,
        // color: theme.palette.customColors.OnSurface,
        textDecoration: 'none'
      }
    } else {
      return {
        backgroundColor: theme.palette.customColors.onPrimary,
        borderColor: theme.palette.customColors.OutlineVariant,
        border: '1px dashed'
      }
    }
  }

  const handleSkip = () => {
    console.log('Skipped clicked for selected metrics:', selectedMetrics)
    // Implement skip logic here
  }

  const handleAdminister = () => {
    console.log('Administer clicked for selected metrics:', selectedMetrics)
    // Implement administer logic here
  }

  const handleAdministerOrSkipOpen = data => {
    setSelectedMedicine(data)
    console.log('data in handleAdministerOrSkipOpen:', data)
    setIsAdministerOrSkipPopupOpen(true)
  }

  const handleAdministerOrSkipClose = () => setIsAdministerOrSkipPopupOpen(false)

  const handleSubmit = async data => {
    setIsAdministerOrSkipPopupLoading(true)

    try {
      // Process the form data based on action type
      if (data.action === 'administer') {
        console.log('Administering medicine with data:', {
          time: data.time,
          quantity: data.quantity,
          quantityUnit: data.quantityUnit,
          wastageQuantity: data.wastageQuantity,
          wastageUnit: data.wastageUnit,
          notes: data.notes,
          batchNumber: data.batchNumber,
          attachment: data.attachment
        })
        // Your API call for administering medicine
        // await administerMedicine(data)
      } else if (data.action === 'skipped') {
        console.log('Skipping medicine with data:', {
          time: data.time,
          quantity: data.quantity,
          quantityUnit: data.quantityUnit,
          skipReason: data.skipReason
        })
        // Your API call for skipping medicine
        // await skipMedicine(data)
      }

      // Success handling
      alert('Action completed successfully!')
      handleClose()
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred')
    } finally {
      setIsAdministerOrSkipPopupLoading(false)
    }
  }

  // Show shimmer loading state
  if (isLoading) {
    return (
      <>
        <Grid container spacing={2} sx={{ alignItems: 'center', my: 4, justifyContent: 'space-between' }}>
          <Grid item size={{ xs: 10, sm: 10 }}>
            <ShimmerHorizontalDateNav />
          </Grid>
          <Grid item size={{ xs: 2, sm: 2 }}>
            <Button
              onClick={() => {
                router.push({
                  pathname: `/hospital/inpatient/${id}/schedule-prescription`,
                  query: {
                    animal_id,
                    medical_record_id
                  }
                })
              }}
              sx={{ height: '48px', width: '100%' }}
              variant='contained'
            >
              Add new
            </Button>
          </Grid>
          <Grid
            item
            size={{ xs: 12, sm: 12 }}
            sx={{ display: 'flex', alignItems: 'center', my: 4, justifyContent: 'space-between' }}
          >
            <ShimmerCheckbox />
            <MUISwitch label='Current medical records only' />
          </Grid>
          <Grid item size={{ xs: 12, sm: 12 }}>
            <ShimmerMetricsGrid />
          </Grid>
        </Grid>
      </>
    )
  }

  return (
    <>
      <Grid container spacing={2} sx={{ alignItems: 'center', my: 4, justifyContent: 'space-between' }}>
        <Grid item size={{ xs: 10, sm: 10 }}>
          <HorizontalDateNav
            isLoading={isLoading}
            onDateSelect={handleDateChange}
            selectedDate={selectedDate}
            dates={dates}
          />
        </Grid>
        <Grid item size={{ xs: 2, sm: 2 }}>
          <Button
            onClick={() => {
              router.push({
                pathname: `/hospital/inpatient/${id}/schedule-prescription`,
                query: {
                  animal_id,
                  medical_record_id
                }
              })
            }}
            sx={{ height: '48px', width: '100%' }}
            variant='contained'
          >
            Add new
          </Button>
        </Grid>
        <Grid
          item
          size={{ xs: 12, sm: 12 }}
          sx={{ display: 'flex', alignItems: 'center', my: 4, justifyContent: 'space-between' }}
        >
          <MUICheckbox
            label='Select all'
            labelStyle={isAllSelected && { color: 'green' }}
            checked={isAllSelected}
            indeterminate={isIndeterminate}
            disabled={displayMetrics?.length === 0}
            onChange={handleSelectAll}
          />
          <MUISwitch label='Current medical records only' />
        </Grid>
        <Grid item size={{ xs: 12, sm: 12 }}>
          {displayMetrics.length > 0 ? (
            <DashboardContainer>
              <MainContainer>
                <FixedColumn>
                  <HeaderContainer>
                    <Typography>Medications</Typography>
                  </HeaderContainer>

                  {displayMetrics?.map(metric => (
                    <MetricCardWrapper key={metric.id}>
                      <MetricCard
                        metric={metric}
                        selected={selectedMetrics.some(m => m.id === metric.id)}
                        onSelect={() => handleSelectMetric(metric)}
                        disabled={
                          Array.isArray(metric.schedule) &&
                          metric.schedule.length > 0 &&
                          metric.schedule.every(s => s.status === 'administered')
                        }
                        theme={theme}
                        MetricLabel={MetricLabel}
                        prescriptionCardColorsConfig={prescriptionCardColorsConfig}
                      />
                    </MetricCardWrapper>
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
                        <TimeHeader
                          onClick={() => {
                            console.log('onclick of time slots', time)
                          }}
                          key={time}
                          sx={{
                            position: 'relative',
                            width: '184px'
                          }}
                          ref={el => (hourRefs.current[time] = el)}
                        >
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
                  {displayMetrics?.map(metric => (
                    <TimeSlotGrid
                      onClick={() => {
                        console.log('onclick of time slot grid', metric)
                      }}
                      key={metric.id}
                      numColumns={timeSlots.length}
                    >
                      {metric.timeSlots.map((timeSlot, index) => {
                        const slotKey = `${metric.id}-${index}`
                        const hasSchedule = timeSlot.isActive

                        const status = timeSlot?.value?.status?.toLowerCase()
                        const scheduledTime = timeSlot?.value?.scheduledTime
                        const dosage = timeSlot?.value?.dosage

                        return (
                          <TimeSlot
                            config={timeSlotGridConfig(status)}
                            key={slotKey}
                            onClick={() => {
                              handleTimeSlotClick(metric.id, timeSlot)
                            }}
                          >
                            <TimeSlotCell
                              hasSchedule={hasSchedule}
                              status={status}
                              scheduledTime={scheduledTime}
                              dosage={dosage}
                              onClick={() => {
                                console.log('medicine scheduledTime', timeSlot?.value?.scheduledTime)
                                console.log('slot time', timeSlot?.value)
                                console.log('status', status)
                                if (status === 'pending') {
                                  // Open administer/skip modal
                                  const data = {
                                    scheduledTime: timeSlot?.value?.scheduledTime,
                                    timeSlot: timeSlot?.value,
                                    staus: status
                                  }
                                  handleAdministerOrSkipOpen(data)
                                  // onOpenPrescriptionCard(timeSlot)
                                }
                              }}
                              config={timeSlotGridConfig(status)}
                              theme={theme}
                            />
                          </TimeSlot>
                        )
                      })}
                    </TimeSlotGrid>
                  ))}
                </ScrollableContainer>
              </MainContainer>
            </DashboardContainer>
          ) : (
            <Typography>No Medications Scheduled for this date.</Typography>
            // <NoDataFound />
          )}
        </Grid>
      </Grid>
      <AdministerOrSkipModal
        open={isAdministerOrSkipPopupOpen}
        handleClose={handleAdministerOrSkipClose}
        onSubmit={handleSubmit}
        submitLoader={isAdministerOrSkipPopupLoading}
        medicineData={{
          ...selectedMedicine,
          name: selectedMedicine?.name || medicineData.name,
          time: selectedMedicine?.scheduledTime || medicineData.time,
          date: selectedMedicine?.date || medicineData.date,
          calculatedDosage: selectedMedicine?.dosage || medicineData.calculatedDosage
        }}
      />
      {selectedMetrics?.length ? (
        <ActionButtonsWithSelection
          selectedCount={selectedMetrics?.length}
          cancelLabel='SKIPPED'
          addLabel='ADMINISTER'
          onCancel={handleSkip}
          onAdd={handleAdminister}
          width='140px'
          height='42px'
          isSubmitLoading={isAdminstrationLoading}
        />
      ) : null}
    </>
  )
}

export default React.memo(PrescriptionMonitoringGrid)