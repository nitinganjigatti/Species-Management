/* eslint-disable lines-around-comment */
import React, { useEffect, useRef, useState, useMemo } from 'react'
import { Box, Typography, IconButton, Grid, Button } from '@mui/material'
import { alpha, styled } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'
import MUICheckbox from 'src/views/forms/form-fields/MUICheckbox'
import HorizontalDateNav from 'src/views/utility/HorizontalDateNav'
import MUISwitch from 'src/views/forms/form-fields/MUISwitch'
import TimeSlotCell from 'src/views/pages/hospital/prescription-monitoring/TimeSlotCell'
import MetricCard from 'src/views/pages/hospital/prescription-monitoring/MetricCard'
import Router from 'next/router'
import { useRouter } from 'next/router'
import NoDataFound from 'src/views/utility/NoDataFound'
import ActionButtonsWithSelection from '../ActionButtonsWithSelection'
import AdministerOrSkipModal from 'src/views/pages/hospital/prescription-monitoring/AdministerOrSkipModal'
import NoMedicalData from 'src/views/utility/NoMedicalData'

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
  marginBottom: theme.spacing(1.8)
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

const TimeSlot = styled(Box, {
  shouldForwardProp: prop => prop !== 'config'
})(({ theme, config, disabled }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'white',
  fontSize: '13px',
  fontWeight: 500,
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.2s ease',
  position: 'relative',
  margin: 0,
  padding: 0,
  width: '184px',
  height: '70px',
  marginTop: theme.spacing(0.5),
  backgroundColor: config?.backgroundColor,
  color: config?.color,
  border: config?.border,
  borderColor: config?.borderColor,
  padding: '8px',
  borderRadius: '8px',
  '&:hover': disabled
    ? {}
    : {
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
  top: '90%',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: 'transparent',
  border: '1px solid',
  borderColor: theme.palette.customColors.Error,
  color: theme.palette.customColors.Error,
  padding: '2px 6px',
  fontSize: '12px',
  fontWeight: 600,
  borderRadius: '8px',
  zIndex: 1000,
  whiteSpace: 'nowrap',
  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '-6px', // Position above the tooltip
    left: '50%',
    transform: 'translateX(-50%)',
    width: 0,
    height: 0,
    borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent',
    borderBottom: '6px solid #E35163', // Changed to borderBottom for upward arrow
    borderTop: 'none'
  }
}))

// const TimeTooltip = styled(Box)(({ theme }) => ({
//   position: 'absolute',
//   top: '2px',
//   left: '50%',
//   transform: 'translateX(-50%)',
//   backgroundColor: 'transparent',
//   border: '1px solid',
//   borderColor: theme.palette.customColors.Error,
//   color: theme.palette.customColors.Error,
//   padding: '4px 8px',
//   fontSize: '12px',
//   fontWeight: 600,
//   borderRadius: '8px',
//   zIndex: 1000,
//   whiteSpace: 'nowrap',
//   boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
//   '&::after': {
//     content: '""',
//     position: 'absolute',
//     top: '100%',
//     left: '50%',
//     transform: 'translateX(-50%)',
//     width: 0,
//     height: 0,
//     borderLeft: '6px solid transparent',
//     borderRight: '6px solid transparent',
//     borderTop: '6px solid #E35163',
//     borderBottom: 'none'
//   }
// }))

const ShimmerCheckbox = styled(Box)(({ theme }) => ({
  width: '100px',
  height: '20px',
  backgroundColor: theme.palette.grey[200],
  borderRadius: '4px',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${theme.palette.grey[100]}, transparent)`,
    animation: 'shimmer 1.5s infinite'
  }
}))

const ShimmerSwitch = styled(Box)(({ theme }) => ({
  width: '200px',
  height: '20px',
  backgroundColor: theme.palette.grey[200],
  borderRadius: '4px',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${theme.palette.grey[100]}, transparent)`,
    animation: 'shimmer 1.5s infinite'
  }
}))

const PrescriptionMonitoringGrid = ({
  medications,
  dates = [],
  selectedDate,
  handleDateChange = () => {},
  onTimeSlotClick = () => {},
  onRemoveMetric = () => {},
  onOpenPrescriptionCard = () => {},
  isLoading,
  isCurrentMedicalRecord,
  setIsCurrentMedicalRecord,
  setSelectedMedicine,
  handleAdminister,
  handleSkip,
  isAdministerLoading,
  isSkipLoading,
  handleAdministerOrSkipOpen,
  addPrescriptionToTimeslot,
  selectedMetrics,
  setSelectedMetrics,
  isDischared,
  category
}) => {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query

  const scrollContainerRef = useRef(null)
  const hourRefs = useRef({})

  const [hoveredSlot, setHoveredSlot] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [didInitialScroll, setDidInitialScroll] = useState(false)
  const [isAdministerOrSkipPopupOpen, setIsAdministerOrSkipPopupOpen] = useState(false)
  const [isAdministerOrSkipPopupLoading, setIsAdministerOrSkipPopupLoading] = useState(false)
  const [isAdminstrationLoading, setIsAdminstrationLoading] = useState(false)
  // const [selectedMedicine, setSelectedMedicine] = useState(null)

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

      const medicationTimeSlots = timeSlots?.map((timeLabel, index) => {
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
                status:
                  schedule?.status?.toLowerCase() === 'administrator'
                    ? 'administered'
                    : schedule?.status?.toLowerCase() === 'withheld'
                    ? 'skipped'
                    : schedule?.status?.toLowerCase(),
                administered_time: schedule.administered_time,
                compliance_note: schedule.compliance_note,
                scheduledTime: schedule?.time,
                medicine_id: schedule?.medicine_id,
                administrative_ids: schedule?.administrative_ids || []
              }
            : undefined
        }
      })

      return {
        id: medication.prescription_id,
        prescription_id: medication.prescription_id,
        medicine_id: medication?.schedule?.[0]?.medicine_id,
        medical_record_id: medication?.id,
        name: medication.name,
        frequency: medication.frequency,
        progress: medication.progress,
        status: medication.status,
        timeSlots: medicationTimeSlots,
        controlled_substance: medication.controlled_substance,
        canEdit: medication.canEdit,
        sideEffects: medication.side_effects,
        schedule:
          medication.schedule && Array.isArray(medication.schedule)
            ? medication.schedule.map(schedule => ({
                ...schedule,
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
              metric.schedule.every(
                s => s.status === "administrator" || s.status === "withheld" || s.status === 'stopped'
              )
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
  }

  // On initial load, scroll current hour's slot flush right in container
  useEffect(() => {
    if (!didInitialScroll && displayMetrics.length > 0) {
      const scrollToCurrentTime = () => {
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
          setDidInitialScroll(true)
        }
      }

      // Use setTimeout to ensure DOM is fully rendered
      const timer = setTimeout(scrollToCurrentTime, 100)

      return () => clearTimeout(timer)
    }
  }, [didInitialScroll, currentTime, displayMetrics]) // Added displayMetrics to dependencies

  // const allSchedules = defaultMetrics.flatMap(metric => metric.schedule)

  // Count occurrences of each time
  const prescriptionCardColorsConfig = prescriptionDetails => {
    const { status } = prescriptionDetails
    
    if (status === 'pending' && prescriptionDetails?.sideEffects === 1) {
      return {
        backgroundColor: alpha(theme.palette.customColors.antzNotes80, 0.5)
        // border: `0.5px solid ${theme.palette.customColors.TertiaryContainer}`

        // textStyle: ''
      }
    } else if (status === 'stopped') {
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
        backgroundColor: theme.palette.customColors.Surface,
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

  const handleMedicineNameClick = data => {
    onOpenPrescriptionCard(data)
  }

  const handleAddPrescriptionToTimeslot = data => {
    const datePart = selectedDate.split(' ')[0] // "2025-11-10"

    // Convert "5 AM" etc. to proper 24-hour format
    const targetDateTime = new Date(`${datePart}T${convertTo24Hour(data?.scheduledTime)}`)
    const now = new Date()

    if (isNaN(targetDateTime.getTime())) {
      console.error('Invalid date or time format')

      return
    }

    if (targetDateTime < now) {
      addPrescriptionToTimeslot('past', data)
    } else if (targetDateTime > now && data?.data?.status !== 'stopped') {
      addPrescriptionToTimeslot('future', data)
    } else {
      return
    }
  }

  const isScheduledFuture = (scheduledDate, scheduledTime) => {
    // Parse the scheduled time (e.g., "03 AM")
    const [hours, modifier] = scheduledTime.split(' ')
    let hours24 = parseInt(hours)

    // Convert to 24-hour format
    if (modifier === 'PM' && hours24 !== 12) {
      hours24 += 12
    } else if (modifier === 'AM' && hours24 === 12) {
      hours24 = 0
    }

    // Create scheduled datetime object
    const scheduledDateTime = new Date(scheduledDate)
    scheduledDateTime.setHours(hours24, 0, 0, 0)

    // Get current datetime
    const now = new Date()

    // Return true if scheduled datetime is in the future
    return scheduledDateTime > now
  }

  // this is for allow schedule for same day for fast time and future time and any fast time
  const isScheduledAllowed = (scheduledDate, scheduledTime) => {
    // Parse time (kept only to build date, not for validation)
    const [hours, modifier] = scheduledTime.split(' ')
    let hours24 = parseInt(hours, 10)

    if (modifier === 'PM' && hours24 !== 12) hours24 += 12
    if (modifier === 'AM' && hours24 === 12) hours24 = 0

    const scheduled = new Date(scheduledDate)
    scheduled.setHours(hours24, 0, 0, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const scheduledDay = new Date(scheduled)
    scheduledDay.setHours(0, 0, 0, 0)

    // ❌ Block only future days
    const result = scheduledDay <= today

    return result
  }

  // Helper: converts "5 AM"/"1 PM" to "HH:mm:ss"
  function convertTo24Hour(time12h) {
    if (!time12h) return '00:00:00'
    let [hour, modifier] = time12h.split(' ')
    hour = parseInt(hour, 10)

    if (modifier.toUpperCase() === 'PM' && hour !== 12) hour += 12
    if (modifier.toUpperCase() === 'AM' && hour === 12) hour = 0

    return `${hour.toString().padStart(2, '0')}:00:00`
  }

  const handleRouterNavigation = () => {
    const queryParams = {
      date: selectedDate
    }

    if (category === 'Outpatients') {
      router.push({
        pathname: `/hospital/outpatient/${id}/schedule-prescription`,
        query: queryParams
      })
    } else {
      router.push({
        pathname: `/hospital/inpatient/${id}/schedule-prescription`,
        query: queryParams
      })
    }
  }

  const handleSwitchChange = e => {
    setIsCurrentMedicalRecord(e.target.checked)

    // Update URL query parameter
    router.replace(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          isCurrentMedicalRecordOnly: e.target.checked
        }
      },
      undefined,
      { shallow: true }
    )
  }

  // Show shimmer loading state
  if (isLoading) {
    return (
      <>
        <Grid container spacing={4} sx={{ alignItems: 'center', my: 4, justifyContent: 'space-between' }}>
          <Grid item size={{ xs: 8, sm: 9, lg: 9.5 }}>
            <ShimmerHorizontalDateNav />
          </Grid>
          <Grid item size={{ xs: 4, sm: 3, lg: 2.5 }}>
            <Button onClick={handleRouterNavigation} sx={{ height: '48px', width: '100%' }} variant='contained'>
              ADD PRESCRIPTION
            </Button>
          </Grid>
          <Grid
            item
            size={{ xs: 12, sm: 12 }}
            sx={{ display: 'flex', alignItems: 'center', my: 4, justifyContent: 'space-between' }}
          >
            <ShimmerCheckbox />
            <ShimmerSwitch />
          </Grid>
          <Grid item size={{ xs: 12, sm: 12 }}>
            <ShimmerMetricsGrid />
          </Grid>
        </Grid>

        {/* Global Shimmer Animation */}
        <style jsx global>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
        `}</style>
      </>
    )
  }

  return (
    <>
      <Grid container spacing={4} sx={{ alignItems: 'center', my: 4, justifyContent: 'space-between' }}>
        <Grid item size={isDischared || displayMetrics?.length === 0 ? { xs: 12 } : { xs: 8, sm: 9, lg: 9.5 }}>
          <HorizontalDateNav
            isLoading={isLoading}
            onDateSelect={handleDateChange}
            selectedDate={selectedDate}
            dates={dates}
          />
        </Grid>
        {!isDischared && displayMetrics?.length > 0 ? (
          <Grid item size={{ xs: 4, sm: 3, lg: 2.5 }}>
            <Button onClick={handleRouterNavigation} sx={{ height: '48px', width: '100%' }} variant='contained'>
              ADD PRESCRIPTION
            </Button>
          </Grid>
        ) : null}
        {displayMetrics?.length > 0 && (
          <Grid
            item
            size={{ xs: 12, sm: 12 }}
            sx={{ display: 'flex', alignItems: 'center', my: 4, justifyContent: 'space-between' }}
          >
            <Box sx={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <MUICheckbox
                label='Select all'
                labelStyle={isAllSelected && { color: 'green' }}
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                disabled={displayMetrics?.length === 0 || isDischared}
                onChange={handleSelectAll}
              />
              {selectedMetrics.length > 0 && (
                <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}>
                    Pending Dosage:
                  </Typography>
                  <Typography sx={{ weight: 600, fontSize: '16px', color: theme.palette.customColors.neutralPrimary }}>
                    {selectedMetrics.reduce((total, metric) => {
                      if (metric?.progress) {
                        const [completed, totalDoses] = metric.progress.split('/').map(Number)
                        const pending = totalDoses - completed

                        return total + (isNaN(pending) ? 0 : pending)
                      }

                      return total
                    }, 0)}
                  </Typography>
                </Box>
              )}
            </Box>
            <MUISwitch
              checked={isCurrentMedicalRecord}
              onChange={handleSwitchChange}
              label='Current medical records only'
            />
          </Grid>
        )}
        {!isLoading && displayMetrics?.length <= 0 && (
          <Grid item size={{ xs: 12, sm: 12 }} sx={{ display: 'flex' }}>
            <MUISwitch
              checked={isCurrentMedicalRecord}
              onChange={handleSwitchChange}
              label='Current medical records only'
              size='small'
              sx={{ ml: 2.6 }}
            />
          </Grid>
        )}

        <Grid item size={{ xs: 12, sm: 12 }}>
          {displayMetrics.length > 0 ? (
            <DashboardContainer>
              <MainContainer>
                <FixedColumn>
                  <HeaderContainer sx={{ mb: '16px' }}>
                    <Typography
                      sx={{ weight: 500, fontSize: '16px', color: theme.palette.customColors.neutralPrimary }}
                    >
                      Prescription
                    </Typography>
                  </HeaderContainer>

                  {displayMetrics?.map(metric => (
                    <MetricCardWrapper key={metric.id}>
                      <MetricCard
                        metric={metric}
                        onMedicineNameClick={() => handleMedicineNameClick(metric)}
                        selected={selectedMetrics.some(m => m.id === metric.id)}
                        onSelect={() => handleSelectMetric(metric)}
                        disabled={
                          (Array.isArray(metric.schedule) &&
                            metric.schedule.length > 0 &&
                            metric.schedule.every(s => s.status === 'administered')) ||
                          isDischared
                        }
                        theme={theme}
                        MetricLabel={MetricLabel}
                        prescriptionCardColorsConfig={prescriptionCardColorsConfig}
                      />
                    </MetricCardWrapper>
                  ))}
                </FixedColumn>

                <ScrollableContainer ref={scrollContainerRef}>
                  <TimeSlotGrid numColumns={timeSlots.length} sx={{ mb: '16px' }}>
                    {timeSlots.map(time => {
                      const currentHour24 = currentTime.getHours()
                      const slotHour24 = convertLabelToHour24(time)
                      const isCurrentHour = slotHour24 === currentHour24

                      // Check if selectedDate is today AND it's the current hour
                      const shouldShowTooltip =
                        isCurrentHour && new Date(selectedDate).toDateString() === new Date().toDateString()

                      const currentMinutes = currentTime.getMinutes()
                      const positionPercentage = (currentMinutes / 60) * 100

                      return (
                        <TimeHeader
                          onClick={() => {}}
                          key={time}
                          sx={{
                            position: 'relative',
                            width: '184px'
                          }}
                          ref={el => (hourRefs.current[time] = el)}
                        >
                          {time}
                          {shouldShowTooltip && (
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
                    <TimeSlotGrid onClick={() => {}} key={metric.id} numColumns={timeSlots.length}>
                      {metric.timeSlots.map((timeSlot, index) => {
                        const slotKey = `${metric.id}-${index}`
                        const hasSchedule = timeSlot.isActive

                        const status = timeSlot?.value?.status?.toLowerCase()
                        const scheduledTime = timeSlot?.value?.scheduledTime || timeSlot?.time
                        const dosage = timeSlot?.value?.dosage

                        return (
                          <TimeSlot
                            config={timeSlotGridConfig(status)}
                            key={slotKey}
                            onClick={() => {
                              if (isDischared) return
                              if (metric?.status?.toLowerCase() === 'stopped' && status !== 'pending') return

                              const data = {
                                scheduledTime: scheduledTime,
                                timeSlot: timeSlot?.value,
                                staus: status,
                                data: metric
                              }
                              if (!status) handleAddPrescriptionToTimeslot(data)
                              if (status === 'pending') {
                                // const isFuture = isScheduledFuture(selectedDate, scheduledTime)
                                // this is for allow schedule for same day for fast time and future time and any fast time

                                const isFuture = isScheduledAllowed(selectedDate, scheduledTime)

                                if (isFuture) {
                                  // Open administer/skip modal
                                  // if (timeSlot?.value?.administrative_ids?.length > 1) {
                                  if (timeSlot?.value?.administrative_ids?.length) {
                                    handleAdministerOrSkipOpen(data, 'multiple')
                                  } else {
                                    handleAdministerOrSkipOpen(data, 'single')
                                  }
                                  // onOpenPrescriptionCard(timeSlot)
                                }
                              }
                              // handleTimeSlotClick(metric.id, timeSlot)
                            }}
                            disabled={
                              isDischared ||
                              status === 'administered' ||
                              status === 'skipped' ||
                              status === 'stopped' ||
                              (metric?.status === 'stopped' &&
                                !status &&
                                // isScheduledFuture(selectedDate, scheduledTime)) ||
                                // this is for allow schedule for same day for fast time and future time and any fast time

                                isScheduledAllowed(selectedDate, scheduledTime))
                              // ||
                              // (status?.toLowerCase() === 'pending' &&
                              //   // isScheduledFuture(selectedDate, scheduledTime)
                              //   // this is for allow schedule for same day for fast time and future time and any fast time

                              //   isScheduledAllowed(selectedDate, scheduledTime))
                            }
                          >
                            <TimeSlotCell
                              hasSchedule={hasSchedule}
                              status={status}
                              scheduledTime={scheduledTime}
                              administeredTime={timeSlot?.value?.administered_time}
                              dosage={dosage}
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
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <NoMedicalData
                btnText={'ADD PRESCRIPTION'}
                text={'All Added Prescriptions Will Appear here'}
                isDischarged={isDischared}
                btnAction={handleRouterNavigation}
              />
            </Box>
          )}
        </Grid>
      </Grid>
      {selectedMetrics?.length ? (
        <ActionButtonsWithSelection
          selectedCount={selectedMetrics?.length}
          cancelLabel='SKIPPED'
          addLabel='ADMINISTER'
          onCancel={() => handleSkip(selectedMetrics)}
          onAdd={() => handleAdminister(selectedMetrics)}
          width='140px'
          height='42px'
          isSubmitLoading={isAdministerLoading}
          isCancelLoading={isSkipLoading}
        />
      ) : null}
    </>
  )
}

export default React.memo(PrescriptionMonitoringGrid)

// Shimmer Loading Components
const ShimmerHorizontalDateNav = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      px: 1,
      height: '48px',
      backgroundColor: '#E8F4F2',
      borderRadius: 1,
      width: '100%'
    }}
  >
    {/* Shimmer Year Label */}
    <Box
      sx={{
        fontSize: '20px',
        fontWeight: 500,
        backgroundColor: 'grey.300',
        color: 'transparent',
        height: '100%',
        borderRadius: 0.75,
        minWidth: '82px',
        flexShrink: 0,
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)`,
          animation: 'shimmer 1.5s infinite'
        }
      }}
    />
    {/* Shimmer Date Buttons */}
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        flex: 1,
        height: '100%',
        paddingLeft: 25,
        '&::-webkit-scrollbar': { display: 'none' }
      }}
    >
      {Array.from({ length: 7 }).map((_, index) => (
        <Box
          key={index}
          sx={{
            width: 120,
            minWidth: 120,
            height: '32px',
            borderRadius: '6px',
            marginLeft: 0.5,
            backgroundColor: 'grey.300',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)`,
              animation: 'shimmer 1.5s infinite'
            }
          }}
        />
      ))}
    </Box>
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
          {/* Header Shimmer */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 2,
              background: 'grey.100',
              borderRadius: 1,
              height: '56px',
              marginBottom: 2,
              width: '100%',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)`,
                animation: 'shimmer 1.5s infinite'
              }
            }}
          />

          {/* Metric Cards Shimmer */}
          {Array.from({ length: 5 }).map((_, index) => (
            <MetricCardWrapper key={index}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '160px' }}>
                {/* Checkbox Shimmer */}
                <Box
                  sx={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    backgroundColor: 'grey.200',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)`,
                      animation: 'shimmer 1.5s infinite'
                    }
                  }}
                />
                {/* Metric Card Shimmer */}
                <Box
                  sx={{
                    width: '266px',
                    height: '74px',
                    backgroundColor: 'grey.200',
                    borderRadius: '8px',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)`,
                      animation: 'shimmer 1.5s infinite'
                    }
                  }}
                />
              </Box>
            </MetricCardWrapper>
          ))}
        </FixedColumn>

        <ScrollableContainer>
          {/* Time Headers Shimmer */}
          <TimeSlotGrid numColumns={timeSlots.length}>
            {timeSlots.map((time, index) => (
              <Box
                key={index}
                sx={{
                  minWidth: '184px',
                  height: '56px',
                  backgroundColor: 'grey.100',
                  borderRadius: '4px',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)`,
                    animation: 'shimmer 1.5s infinite'
                  }
                }}
              />
            ))}
          </TimeSlotGrid>

          {/* Time Slots Shimmer */}
          {Array.from({ length: 5 }).map((_, rowIndex) => (
            <TimeSlotGrid key={rowIndex} numColumns={timeSlots.length}>
              {timeSlots.map((_, colIndex) => (
                <Box
                  key={colIndex}
                  sx={{
                    minWidth: '184px',
                    height: '70px',
                    backgroundColor: 'grey.200',
                    borderRadius: '8px',
                    marginTop: 0.5,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)`,
                      animation: 'shimmer 1.5s infinite'
                    }
                  }}
                />
              ))}
            </TimeSlotGrid>
          ))}
        </ScrollableContainer>
      </MainContainer>

      {/* Global Shimmer Animation */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </DashboardContainer>
  )
}
