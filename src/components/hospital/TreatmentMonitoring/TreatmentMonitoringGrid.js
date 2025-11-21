import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { Box, Typography, IconButton, Grid, Button, Skeleton, FormControlLabel, Radio, RadioGroup } from '@mui/material'
import { alpha, styled, useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import HorizontalDateNav from 'src/views/utility/HorizontalDateNav'
import AddScheduleDrawer from 'src/views/pages/hospital/treatment-monitoring/AddScheduleDrawer'
import AddParameterDrawer from 'src/views/pages/hospital/treatment-monitoring/AddParameterDrawer'
import { useRouter } from 'next/router'
import {
  deleteMonitoringParameter,
  getMonitoringParameters,
  getTreatmentIntervals,
  getTreatmentMonitoringData
} from 'src/lib/api/hospital/treatmentMonitoring'
import AddParameterDataEntry from 'src/views/pages/hospital/treatment-monitoring/AddParameterDataEntry'
import { useQuery } from '@tanstack/react-query'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import dayjs from 'dayjs'
import Toaster from 'src/components/Toaster'
import Utility from 'src/utility'

// Utility functions
const getLabelForHour = hour => {
  const normalizedHour = hour === 24 ? 0 : hour
  const h = normalizedHour % 12 === 0 ? 12 : normalizedHour % 12
  const ampm = normalizedHour < 12 ? 'AM' : 'PM'

  return `${h} ${ampm}`
}

const formatInterval = interval => {
  if (!interval) return ''
  if (interval.includes(':')) return interval
  const [hour, ampm] = interval.split(' ')

  return `${hour}:00 ${ampm}`
}

const useRealtimeTooltip = (scrollContainerRef, timeSlots, isToday) => {
  useEffect(() => {
    if (!isToday) return

    let animationFrameId
    let tooltipElement = null

    const createTooltip = () => {
      if (tooltipElement) return tooltipElement

      tooltipElement = document.createElement('div')
      tooltipElement.style.cssText = `
        position: absolute;
        top: 0px;
        transform: translateX(-50%);
        background-color: white;
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
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      if (tooltipElement && tooltipElement.parentElement) {
        tooltipElement.parentElement.removeChild(tooltipElement)
      }
    }
  }, [scrollContainerRef, timeSlots, isToday])
}

const PatientMonitoring = React.memo(({ metrics = [], patientData }) => {
  const theme = useTheme()
  const scrollContainerRef = useRef(null)
  const hourRefs = useRef({})
  const router = useRouter()

  const { id, medical_record_id, animal_id } = router.query
  const today = new Date().toISOString().split('T')[0]

  const [didInitialScroll, setDidInitialScroll] = useState(false)
  const [openScheduleDrawer, setOpenScheduleDrawer] = useState(false)
  const [addParameterDrawerOpen, setAddParameterDrawerOpen] = useState(false)
  const [openParamsEntryDrawer, setOpenParamsEntryDrawer] = useState(false)
  const [dates, setDates] = useState(null)
  const [selectedDate, setSelectedDate] = useState(today)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [paramData, setParamData] = useState(null)
  const [deleteScope, setDeleteScope] = useState('only_today')

  const isToday = dayjs(selectedDate).isSame(dayjs(), 'day')

  const [paramsDetails, setParamsDetails] = useState({
    interval: '',
    date: '',
    parameter: null
  })

  const { data: treatmentIntervals, isLoading: intervalLoading } = useQuery({
    queryKey: ['hospital-treatment-interval'],
    queryFn: () => getTreatmentIntervals()
  })

  const intervalList = treatmentIntervals?.data?.map(
    item =>
      ({
        id: item?.id,
        label: item?.frequency_label,
        duration: item?.duration_minutes
      } || [])
  )

  const {
    data: monitoringParams,
    isLoading: monitoringParamsLoading,
    refetch: refetchMonitoringParams
  } = useQuery({
    queryKey: ['treatment-monitoring-parameters'],
    queryFn: () => getMonitoringParameters(id),
    enabled: !!id
  })

  useEffect(() => {
    refetchMonitoringParams()
  }, [id])

  const timeSlots = useMemo(() => {
    const slots = []
    for (let hour = 0; hour <= 23; hour++) {
      slots.push(getLabelForHour(hour))
    }

    return slots
  }, [])

  useRealtimeTooltip(scrollContainerRef, timeSlots, isToday)

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
    if (!monitoringDataListings?.data) return []

    return monitoringDataListings.data.map(item => {
      const slots = createTimeSlotStructure(timeSlots)

      item.assessment_details?.forEach(detail => {
        const istRecordTime = detail?.record_time_ist
        const slotLabel = getLabelForHour(parseInt(istRecordTime.split(':')[0]))
        const slot = slots.find(s => s.time === slotLabel)
        if (slot) {
          slot.isActive = true
          slot.record = {
            value: detail.assessment_value,
            unit: detail.unit_name,
            total: Number(detail.total_records || 1),
            recorded_time: dayjs(detail.record_time_ist, 'HH:mm').format('hh:mm A')
          }
        }
      })

      return {
        ...item,
        timeSlots: slots,
        canEdit: true
      }
    })
  }, [monitoringDataListings, createTimeSlotStructure, timeSlots])

  useEffect(() => {
    if (monitoringDataListings?.header_date?.between_date) {
      setDates(monitoringDataListings.header_date.between_date)
    }
  }, [monitoringDataListings])

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

  useEffect(() => {
    if (selectedDate) {
      monitoringRefetch()
    }
  }, [selectedDate])

  const handleParamDelete = async () => {
    setDeleteLoading(true)

    try {
      const payload = {
        hospital_case_id: id,
        assessment_type_id: paramData?.assessment_type_id,
        scheduled_date_time: dayjs(selectedDate)
          .hour(dayjs().hour())
          .minute(dayjs().minute())
          .second(dayjs().second())
          .format('YYYY-MM-DD HH:mm:ss')
      }

      if (isToday) {
        payload.remove_parameter_period = deleteScope
      }

      await deleteMonitoringParameter(payload).then(res => {
        if (res?.status === true) {
          Toaster({ type: 'success', message: res?.message })
          setDeleteLoading(false)
          setOpenDeleteDialog(false)
          monitoringRefetch()
          refetchMonitoringParams()
        } else {
          setDeleteLoading(false)
          Toaster({ type: 'error', message: res?.message })
        }
      })
    } catch (error) {
      console.error('Cannot Delete Parameter', error)
      setDeleteLoading(false)
    }
  }

  const admittedAtLocal = monitoringDataListings?.current_day_schedule_date_time
    ? Utility.convertUTCToLocal(monitoringDataListings?.current_day_schedule_date_time)
    : null

  const admittedAtHourIST = admittedAtLocal ? dayjs(admittedAtLocal, 'YYYY-MM-DD HH:mm:ss').hour() : null

  const isAdmittedDay = admittedAtLocal
    ? dayjs(selectedDate).isSame(dayjs(admittedAtLocal, 'YYYY-MM-DD HH:mm:ss'), 'day')
    : false

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

          const isFutureTodaySlot = isToday && hour > currentHour
          const isBeforeAdmitTime = isAdmittedDay && admittedAtHourIST !== null && hour < admittedAtHourIST
          const isAfterAdmitTime = !isBeforeAdmitTime

          // Disable ONLY future slots. Nothing else.
          const isDisabled = isFutureTodaySlot

          let showPlus = true

          // hide plus only in future today slots
          if (isFutureTodaySlot) showPlus = false
          let isYellow = false

          if (durationMinutes) {
            const intervalHours = durationMinutes / 60
            const isIntervalSlot = hour % intervalHours === 0

            // Yellow should appear everywhere AFTER admitted time — even future hours
            if (isIntervalSlot && isAfterAdmitTime) {
              isYellow = true
              bgColor = alpha(theme.palette.customColors.antzNotes, 0.64)
            }
          }

          return (
            <TimeSlot
              key={slotKey}
              sx={{
                backgroundColor: timeSlot.record ? alpha(theme.palette.customColors.SecondaryContainer, 0.24) : bgColor,
                border: timeSlot.record
                  ? `1px solid ${theme.palette.customColors.OutlineVariant}`
                  : isYellow
                  ? `1px solid ${theme.palette.customColors.OutlineVariant}`
                  : `1px dashed ${theme.palette.customColors.OutlineVariant}`,
                opacity: isDisabled ? 0.5 : 1,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                alignItems: timeSlot.record ? 'flex-start' : 'center',
                justifyContent: timeSlot.record ? 'flex-start' : 'center',
                padding: timeSlot.record ? '12px' : 0,
                '&:hover': {
                  border: `2px solid${theme.palette.primary.main}`
                }
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
              {timeSlot.record ? (
                <Box
                  sx={{ display: 'flex', flexDirection: 'column', gap: 1, justifyContent: 'flex-start', width: '100%' }}
                >
                  {timeSlot?.record?.unit !== null ? (
                    <Typography
                      sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.neutralPrimary }}
                    >{`${timeSlot.record.value} ${timeSlot.record.unit}`}</Typography>
                  ) : (
                    <Typography
                      sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.neutralPrimary }}
                    >{`${timeSlot.record.value}`}</Typography>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography
                      sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      {timeSlot?.record?.recorded_time || formatInterval(timeSlot?.time)}
                    </Typography>
                    {timeSlot.record.total > 1 && (
                      <Typography
                        sx={{
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: theme.palette.customColors.OnPrimaryContainer
                        }}
                      >
                        +{timeSlot.record.total - 1}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ) : (
                !isDisabled && showPlus && <Icon icon={'mdi-plus'} fontSize={20} />
              )}
            </TimeSlot>
          )
        })}
      </TimeSlotGrid>
    ))
  }, [displayMetrics, timeSlots, selectedDate])

  const renderDeleteForm = (
    <Box
      sx={{
        border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
        width: '100%',
        p: 3,
        borderRadius: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 2
      }}
    >
      <Typography sx={{ fontSize: '1rem', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}>
        How would you like to apply this change?
      </Typography>

      <RadioGroup
        value={deleteScope}
        onChange={e => setDeleteScope(e.target.value)}
        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}
      >
        <FormControlLabel
          value='only_today'
          control={<Radio />}
          label={
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.neutralPrimary }}>
                Only for Today
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: theme.palette.customColors.neutralSecondary }}>
                Remove only for today.
              </Typography>
            </Box>
          }
          sx={{
            alignItems: 'flex-start'
          }}
        />

        <FormControlLabel
          value='from_today_onwards'
          control={<Radio />}
          label={
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.neutralPrimary }}>
                From Today Onward
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: theme.palette.customColors.neutralSecondary }}>
                Remove this parameter for today and future days.
              </Typography>
            </Box>
          }
          sx={{
            alignItems: 'flex-start'
          }}
        />
      </RadioGroup>
    </Box>
  )

  return (
    <>
      <Grid container spacing={2} sx={{ alignItems: 'center', my: 4, justifyContent: 'space-between' }}>
        <Grid container spacing={6} rowSpacing={4}>
          <Grid item size={{ xs: 12, sm: 12, md: 9 }}>
            <HorizontalDateNav
              onDateSelect={handleDateChange}
              selectedDate={selectedDate}
              dates={dates}
              isLoading={monitoringLoading}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 12, md: 3 }}>
            {isToday ? (
              <Button
                sx={{ height: '48px', width: '100%', fontSize: '0.8rem' }}
                variant='contained'
                onClick={() => setOpenScheduleDrawer(true)}
              >
                {monitoringDataListings?.is_scheduled_for_particular_day ? 'Edit Schedule' : 'Schedule'}
              </Button>
            ) : (
              <Button
                sx={{
                  height: '48px',
                  width: '100%',
                  border: `1px solid ${theme.palette.primary.main}`,
                  fontSize: '12px',
                  fontWeight: 600
                }}
                variant='outlined'
                onClick={() => setSelectedDate(dayjs().format('YYYY-MM-DD'))}
                startIcon={<Icon icon={'uil:calender'} />}
              >
                Today
              </Button>
            )}
          </Grid>
        </Grid>
        <Grid size={{ xs: 12 }} sx={{ mt: 4 }}>
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
                      <Icon icon={'icons8:plus'} fontSize={30} color={theme.palette.primary.main} />
                    </IconButton>
                  </HeaderContainer>

                  {displayMetrics?.map(metric => (
                    <MetricLabel key={metric.assessment_type_id}>
                      <Box>
                        <MetricName>{metric.label}</MetricName>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Icon icon={'f7:waveform-path-ecg'} fontSize={16} />
                          <MetricSubtext>{metric.frequency_label}</MetricSubtext>
                        </Box>
                      </Box>

                      {metric?.canEdit && (
                        <IconButton
                          size='small'
                          onClick={() => {
                            const hasEntries = metric?.timeSlots?.some(slot => slot.record)
                            setParamData({
                              ...metric,
                              hasEntries
                            })
                            setOpenDeleteDialog(true)
                          }}
                          sx={{ color: '#6c757d', ml: 1 }}
                        >
                          <Icon icon={'mdi-close'} fontSize={20} />
                        </IconButton>
                      )}
                    </MetricLabel>
                  ))}
                </FixedColumn>

                <ScrollableContainer ref={scrollContainerRef}>
                  <TimeSlotGrid numColumns={timeSlots.length} sx={{ mb: 6 }}>
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
          intervalList={intervalList}
          intervalLoading={intervalLoading}
          monitoringParams={monitoringParams}
          refetchMonitoringParams={refetchMonitoringParams}
        />
      )}
      {addParameterDrawerOpen && (
        <AddParameterDrawer
          open={addParameterDrawerOpen}
          setOpen={setAddParameterDrawerOpen}
          hospitalCaseId={id}
          refetchMonitoringData={monitoringRefetch}
          isToday={isToday}
          selectedDate={selectedDate}
          refetchMonitoringParams={refetchMonitoringParams}
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
          selectedDate={selectedDate}
          monitoringRefetch={monitoringRefetch}
        />
      )}
      {openDeleteDialog && (
        <ConfirmationDialog
          dialogBoxStatus={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          title={`Remove ${paramData?.label} parameter`}
          description={
            paramData?.hasEntries
              ? 'This parameter has recorded entries. Removing it will also delete all recorded values'
              : null
          }
          cancelText='CANCEL'
          cancelBtnStyle={{
            borderColor: theme.palette.customColors.OnPrimaryContainer,
            color: theme.palette.customColors.OnPrimaryContainer,
            width: '100%'
          }}
          confirmBtnStyle={{ background: theme.palette.customColors.Error, py: 2, height: '56px', width: '100%' }}
          image='/images/warning-icon.svg'
          imgStyle={{ background: theme.palette.customColors.TertiaryLight, p: 3 }}
          confirmAction={handleParamDelete}
          loading={deleteLoading}
          ConfirmationText='CONFIRM'
          imgHeight='36px'
          imgWidth='36px'
          formComponent={isToday ? renderDeleteForm : null}
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
  position: 'relative',
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: `repeat(${numColumns}, minmax(120px, 1fr))`,
    gap: theme.spacing(1.5)
  }
}))

const HeaderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 3),
  background: theme.palette.customColors.lightBg,
  borderRadius: '4px',

  // height: '56px',
  marginBottom: theme.spacing(6),
  width: '100%'
}))

const MetricLabel = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 2.5),
  backgroundColor: theme.palette.customColors.lightBg,
  borderRadius: theme.spacing(1),
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
  borderRadius: theme.spacing(1),
  borderColor: theme.palette.customColors.OutlineVariant,
  fontWeight: 500,
  color: theme.palette.customColors.OutlineVariant,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  position: 'relative',
  minWidth: '160px',
  height: '72px',
  [theme.breakpoints.down('md')]: {
    fontSize: '11px',
    minWidth: '120px'
  }
}))

const TimeHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2, 3),
  textAlign: 'center',
  fontSize: '16px',
  fontWeight: 500,
  color: theme.palette.customColors.deepDark,
  background: theme.palette.customColors.lightBg,
  borderRadius: '4px',
  position: 'relative',
  minWidth: '160px',
  height: '56px',
  [theme.breakpoints.down('md')]: {
    minWidth: '120px'
  }
}))
