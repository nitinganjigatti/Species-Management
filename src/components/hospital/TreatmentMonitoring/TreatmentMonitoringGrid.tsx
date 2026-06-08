'use client'

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Typography,
  IconButton,
  Grid as MuiGrid,
  Button,
  Skeleton,
  FormControlLabel,
  Radio,
  RadioGroup,
  Tooltip
} from '@mui/material'
import { alpha, styled, useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import HorizontalDateNavRaw from 'src/views/utility/HorizontalDateNav'
const HorizontalDateNav: any = HorizontalDateNavRaw
import AddScheduleDrawerRaw from 'src/views/pages/hospital/treatment-monitoring/AddScheduleDrawer'
import AddParameterDrawerRaw from 'src/views/pages/hospital/treatment-monitoring/AddParameterDrawer'
const AddScheduleDrawer: any = AddScheduleDrawerRaw
const AddParameterDrawer: any = AddParameterDrawerRaw
import useSafeRouter from 'src/hooks/useSafeRouter'
import { useParams } from 'next/navigation'
import {
  deleteMonitoringParameter,
  getMonitoringParameters,
  getTreatmentIntervals,
  getTreatmentMonitoringData
} from 'src/lib/api/hospital/treatmentMonitoring'
import AddParameterDataEntryRaw from 'src/views/pages/hospital/treatment-monitoring/AddParameterDataEntry'
const AddParameterDataEntry: any = AddParameterDataEntryRaw
import { useQuery } from '@tanstack/react-query'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import Toaster from 'src/components/Toaster'
import Utility from 'src/utility'
import { useSelector } from 'react-redux'
import NoMedicalData from 'src/views/utility/NoMedicalData'
import { DeleteMonitoringParameterPayload, GetTreatmentIntervalsResponse, MonitoringParametersResponse } from 'src/types/hospital/api/TreatmentMonitoring/parametersUnit'
import { GetTreatmentMonitoringListResponse } from 'src/types/hospital/api/TreatmentMonitoring/treatmentMonitoring'
import { PatientDetailsData } from 'src/types/hospital/models'
import { AssessmentDetails, RemoveParameterPeriod, TreatmentMonitoringData } from 'src/types/hospital/models/treatmentMonitoring'

const Grid: any = MuiGrid

dayjs.extend(utc)

const STORAGE_KEY = 'medical_record_data'

// Utility functions
const getLabelForHour = (hour: number) => {
  const normalizedHour = hour === 24 ? 0 : hour
  const h = normalizedHour % 12 === 0 ? 12 : normalizedHour % 12
  const ampm = normalizedHour < 12 ? 'AM' : 'PM'

  return `${h} ${ampm}`
}

const formatInterval = (interval: any) => {
  if (!interval) return ''
  if (interval.includes(':')) return interval
  const [hour, ampm] = interval.split(' ')

  return `${hour}:00 ${ampm}`
}

const useRealtimeTooltip = (scrollContainerRef: any, timeSlots: any[], isToday: boolean, theme: any) => {
  useEffect(() => {
    if (!isToday) return

    let animationFrameId: any
    let tooltipElement: any = null

    const createTooltip = () => {
      if (tooltipElement) return tooltipElement

      tooltipElement = document.createElement('div')
      tooltipElement.style.cssText = `
        position: absolute;
        bottom: -24px;
        transform: translateX(-50%);
        background-color: white;
        border: 1px solid ${theme.palette.customColors.Error};
        color: ${theme.palette.customColors.Error};
        padding: 2px 6px;
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
          top: -28%;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-bottom: 6px solid ${theme.palette.customColors.Error};
          border-top: none;
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

interface PatientMonitoringProps {
  metrics?: any[]
  patientData?: PatientDetailsData
  refetchPatient?: () => void
}

export interface TimeSlotRecord {
  value: string
  unit: string
  total: number
  recorded_time: string
}

export interface TimeSlotFormData {
  time: string
  isActive: boolean
  record?: TimeSlotRecord
}

export interface DisplayMetric extends TreatmentMonitoringData {
  timeSlots: TimeSlotFormData[]
  canEdit: boolean
  hasEntries?: boolean 
}

export interface ParamsDetails {
  interval: string
  date: string
  parameter: DisplayMetric | null
}

const PatientMonitoring = React.memo(({ metrics = [], patientData, refetchPatient }: PatientMonitoringProps) => {
  const { t } = useTranslation()
  const theme: any = useTheme()
  const hospitalData: any = useSelector((state: any) => state.hospital.data)
  const medicalRecordData: any = hospitalData[STORAGE_KEY] || {}
  const scrollContainerRef = useRef<any>(null)
  const hourRefs = useRef<any>({})
  const router: any = useSafeRouter()
  const isPatientDischarged = patientData?.status === 'discharge' ? true : false

  const routerParams: any = useParams()
  const id = routerParams?.id || router.query?.id
  const medical_record_id = medicalRecordData?.medical_record_id
  const animal_id = medicalRecordData?.animal_id
  const today = new Date().toISOString().split('T')[0]

  // If patient is discharged, default to discharge date; otherwise use today
  const getDefaultDate = () => {
    if (isPatientDischarged && patientData?.discharge_at) {
      const dischargeDate = dayjs.utc(patientData.discharge_at).local().format('YYYY-MM-DD')
      return dischargeDate
    }
    return today
  }

  const [didInitialScroll, setDidInitialScroll] = useState<boolean>(false)
  const [openScheduleDrawer, setOpenScheduleDrawer] = useState<boolean>(false)
  const [addParameterDrawerOpen, setAddParameterDrawerOpen] = useState<boolean>(false)
  const [openParamsEntryDrawer, setOpenParamsEntryDrawer] = useState<boolean>(false)
  const [dates, setDates] = useState<string[] | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(getDefaultDate())
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false)
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false)
  const [paramData, setParamData] = useState<DisplayMetric | null>(null)
  const [deleteScope, setDeleteScope] = useState<RemoveParameterPeriod>('only_today')

  const isToday = dayjs(selectedDate).isSame(dayjs(), 'day')

  const [paramsDetails, setParamsDetails] = useState<ParamsDetails>({
    interval: '',
    date: '',
    parameter: null
  })

  const { data: treatmentIntervals, isLoading: intervalLoading } = useQuery<GetTreatmentIntervalsResponse>({
    queryKey: ['hospital-treatment-interval'],
    queryFn: () => getTreatmentIntervals()
  })

  const intervalList = treatmentIntervals?.data?.map(
    (item) => ({
      id: item?.id,
      label: item?.frequency_label,
      duration: item?.duration_minutes
    })
  )

  const {
    data: monitoringParams,
    isLoading: monitoringParamsLoading,
    refetch: refetchMonitoringParams
  } = useQuery<MonitoringParametersResponse>({
    queryKey: ['treatment-monitoring-parameters'],
    queryFn: () => getMonitoringParameters(id),
    enabled: !!id
  })

  const timeSlots = useMemo(() => {
    const slots: string[] = []
    for (let hour = 0; hour <= 23; hour++) {
      slots.push(getLabelForHour(hour))
    }

    return slots
  }, [])

  useRealtimeTooltip(scrollContainerRef, timeSlots, isToday, theme)

  const createTimeSlotStructure = useCallback((slots: string[]) => slots.map((time: string) => ({ time, isActive: false })), [])

  const {
    data: monitoringDataListings,
    isLoading: monitoringLoading,
    refetch: monitoringRefetch
  } = useQuery<GetTreatmentMonitoringListResponse>({
    queryKey: ['hospital-treatment-monitoring-listings', id, selectedDate],
    queryFn: () =>
      getTreatmentMonitoringData({
        date: selectedDate,
        hospital_case_id: id
      })
  })

  const monitoringData = useMemo(() => {
    if (!monitoringDataListings?.data) return []

    return monitoringDataListings.data.map((item: TreatmentMonitoringData) => {
      const slots: TimeSlotFormData[] = createTimeSlotStructure(timeSlots)

      item.assessment_details?.forEach((detail: AssessmentDetails) => {
        const istRecordTime = detail?.record_time_ist
        const slotLabel = getLabelForHour(parseInt(istRecordTime.split(':')[0]))
        const slot = slots.find(s => s.time === slotLabel)
        if (slot) {
          slot.isActive = true

          let formattedTime = formatInterval(slotLabel)
          if (detail.record_time_ist) {
            const parsed = (dayjs as any)(detail.record_time_ist, ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD HH:mm', 'HH:mm:ss', 'HH:mm'], true)
            if (parsed.isValid()) {
              formattedTime = parsed.format('hh:mm A')
            }
          }

          slot.record = {
            value: detail.assessment_value,
            unit: detail.unit_name,
            total: Number(detail.total_records || 1),
            recorded_time: formattedTime
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

  const displayMetrics: DisplayMetric[] = metrics?.length > 0 ? metrics : defaultMetrics

  const handleTimeSlotClick = ({ interval, date, parameter }: ParamsDetails) => {
    setOpenParamsEntryDrawer(true)
    setParamsDetails({ interval: interval, date: date, parameter: parameter })
  }

  useEffect(() => {
    if (monitoringLoading) return
    if (!scrollContainerRef.current) return

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
  }, [monitoringLoading])

  const handleDateChange = (date: string) => {
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
      const payload: DeleteMonitoringParameterPayload = {
        hospital_case_id: id,
        assessment_type_id: paramData?.assessment_type_id ?? '',
        scheduled_date_time: dayjs(selectedDate)
          .hour(dayjs().hour())
          .minute(dayjs().minute())
          .second(dayjs().second())
          .format('YYYY-MM-DD HH:mm:ss')
      }

      if (isToday) {
        payload.remove_parameter_period = deleteScope
      }

      await deleteMonitoringParameter(payload).then((res) => {
        if (res?.status === true) {
          Toaster({ type: 'success', message: res?.message })
          setDeleteLoading(false)
          setOpenDeleteDialog(false)
          monitoringRefetch()
          refetchMonitoringParams()
          if (paramData?.assessment_type_id === '1' && refetchPatient) refetchPatient()
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
    return displayMetrics?.map((metric: DisplayMetric) => (
      <TimeSlotGrid key={metric.assessment_type_id} numColumns={timeSlots.length}>
        {metric?.timeSlots.map((timeSlot: TimeSlotFormData, index: number) => {
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
          const isDisabled = isFutureTodaySlot

          let showPlus = true
          if (isFutureTodaySlot) showPlus = false
          let isYellow = false

          if (durationMinutes) {
            const intervalHours = Number(durationMinutes) / 60

            let isIntervalSlot = false

            if (isAdmittedDay && admittedAtHourIST != null) {
              if (hour >= admittedAtHourIST) {
                const diff = hour - admittedAtHourIST
                isIntervalSlot = diff % intervalHours === 0
              }
            } else {
              isIntervalSlot = hour % intervalHours === 0
            }

            if (durationMinutes) {
              if (isIntervalSlot) {
                isYellow = true
                bgColor = alpha(theme.palette.customColors.antzNotes, 0.64)
              }
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
                    <Tooltip title={`${timeSlot.record.value} ${timeSlot.record.unit}`} placement='top' arrow>
                      <Typography
                        sx={{
                          fontWeight: 500,
                          fontSize: '1rem',
                          color: theme.palette.customColors.neutralPrimary,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          width: '100%',
                          cursor: 'pointer'
                        }}
                      >
                        {`${timeSlot.record.value} ${timeSlot.record.unit}`}
                      </Typography>
                    </Tooltip>
                  ) : (
                    <Tooltip title={`${timeSlot.record.value}`} placement='top' arrow>
                      <Typography
                        sx={{
                          fontWeight: 500,
                          fontSize: '1rem',
                          color: theme.palette.customColors.neutralPrimary,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          width: '100%',
                          cursor: 'pointer'
                        }}
                      >
                        {`${timeSlot.record.value}`}
                      </Typography>
                    </Tooltip>
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
                (!isDisabled || isPatientDischarged) && showPlus && <Icon icon={'mdi-plus'} fontSize={20} />
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
        {t('hospital_module.delete_scope_question')}
      </Typography>

      <RadioGroup
        value={deleteScope}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeleteScope(e.target.value as RemoveParameterPeriod)}
        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}
      >
        <FormControlLabel
          value='only_today'
          control={<Radio />}
          label={
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.neutralPrimary }}>
                {t('hospital_module.only_for_today')}
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: theme.palette.customColors.neutralSecondary }}>
                {t('hospital_module.remove_only_today_desc')}
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
                {t('hospital_module.from_today_onward')}
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: theme.palette.customColors.neutralSecondary }}>
                {t('hospital_module.remove_from_today_onwards_desc')}
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

  // --- discharge conditions ---
  const dischargeDate = patientData?.discharge_at
    ? dayjs(Utility.convertUTCToLocal(patientData.discharge_at)).format('YYYY-MM-DD')
    : null

  const isAfterDischarge = dischargeDate ? dayjs().isAfter(dayjs(dischargeDate), 'day') : false
  const isDischargedToday = dischargeDate ? dayjs().isSame(dayjs(), 'day') : false

  let dateNavGrid = 10
  let scheduleGrid = 2

  if (isPatientDischarged && isAfterDischarge) {
    dateNavGrid = 12
    scheduleGrid = 0
  } else if (isPatientDischarged && isDischargedToday && isToday) {
    dateNavGrid = 12
    scheduleGrid = 0
  } else if ((isPatientDischarged && isToday)) {
    dateNavGrid = 12
    scheduleGrid = 0
  } else if (!(monitoringData?.length > 0)) {
    dateNavGrid = 12
    scheduleGrid = 0
  } else {
    dateNavGrid = 10
    scheduleGrid = 2
  }

  return (
    <>
      <Grid container spacing={2} sx={{ alignItems: 'center', my: 4, justifyContent: 'space-between' }}>
        <Grid container spacing={6} rowSpacing={4}>
          <Grid
            item
            size={{
              xs: 12,
              sm: 12,
              md: dateNavGrid
            }}
          >
            <HorizontalDateNav
              onDateSelect={handleDateChange}
              selectedDate={selectedDate}
              dates={dates}
              isLoading={monitoringLoading}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 12, md: scheduleGrid }}>
            {monitoringLoading ? (
              <Skeleton variant='rectangular' height={48} sx={{ borderRadius: 1 }} animation='wave' />
            ) : !monitoringLoading && !isToday && !isAfterDischarge && (!isPatientDischarged || isDischargedToday) ? (
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
                {t('today')}
              </Button>
            ) : (
              isToday &&
              monitoringData?.length > 0 && !isAfterDischarge && !isPatientDischarged && (
                <Button
                  sx={{ height: '48px', width: '100%', fontSize: '0.8rem' }}
                  variant='contained'
                  onClick={() => setOpenScheduleDrawer(true)}
                >
                  {monitoringDataListings?.show_edit_schedule_button == '1' ? t('hospital_module.edit_schedule') : t('hospital_module.schedule')}
                </Button>
              )
            )}
          </Grid>
        </Grid>
        <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
          {monitoringLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
              <Box sx={{ width: '180px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Skeleton variant='rectangular' height={56} sx={{ borderRadius: 2 }} animation='wave' />
                {[...Array(4)].map((_, i: number) => (
                  <Skeleton key={i} variant='rectangular' height={72} sx={{ borderRadius: 2 }} animation='wave' />
                ))}
              </Box>
              <Box sx={{ flex: 1, overflowX: 'auto' }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  {[...Array(6)].map((_, i: number) => (
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
                {[...Array(4)].map((_, rowIndex: number) => (
                  <Box key={rowIndex} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    {[...Array(6)].map((_, colIndex: number) => (
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
          ) : displayMetrics.length === 0 ? (
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <NoMedicalData
                btnText={t('hospital_module.add_monitoring')}
                text={t('hospital_module.all_added_treatments_will_appear_here')}
                btnAction={() => setAddParameterDrawerOpen(true)}
              />
            </Box>
          ) : (
            <DashboardContainer>
              <MainContainer>
                <FixedColumn>
                  <HeaderContainer>
                    <Typography
                      sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.neutralPrimary }}
                    >
                      {t('hospital_module.monitoring')}
                    </Typography>
                    <IconButton size='small' onClick={() => setAddParameterDrawerOpen(true)}>
                      <Icon icon={'icons8:plus'} fontSize={30} color={theme.palette.primary.main} />
                    </IconButton>
                  </HeaderContainer>

                  {displayMetrics?.map((metric: DisplayMetric) => (
                    <MetricLabel key={metric.assessment_type_id}>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          gap: 1,
                          minWidth: 0,
                          flex: 1
                        }}
                      >
                        <Tooltip title={metric.label} placement='top' arrow>
                          <MetricName>{metric.label}</MetricName>
                        </Tooltip>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Icon icon={'f7:waveform-path-ecg'} fontSize={16} />
                          <MetricSubtext>{metric.frequency_label}</MetricSubtext>
                        </Box>
                      </Box>

                      {metric?.canEdit && (
                        <IconButton
                          size='small'
                          onClick={() => {
                            const hasEntries = metric?.timeSlots?.some((slot) => slot.record)
                            setParamData({
                              ...metric,
                              hasEntries
                            })
                            setOpenDeleteDialog(true)
                          }}
                          sx={{ color: theme.palette.customColors.OnPrimaryContainer, ml: 1 }}
                        >
                          <Icon icon={'mdi-close'} fontSize={20} />
                        </IconButton>
                      )}
                    </MetricLabel>
                  ))}
                </FixedColumn>

                <ScrollableContainer ref={scrollContainerRef}>
                  <TimeSlotGrid numColumns={timeSlots.length} sx={{ mb: 7 }}>
                    {timeSlots.map((time: string) => (
                      <TimeHeader key={time} data-hour={time} ref={(el: HTMLDivElement | null) => { hourRefs.current[time] = el }}>
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
          isPatientDischarged={isPatientDischarged}
          refetchPatient={refetchPatient}
        />
      )}
      {openDeleteDialog && (
        <ConfirmationDialog
          dialogBoxStatus={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          title={`Remove ${paramData?.label} parameter`}
          description={
            paramData?.hasEntries
              ? t('hospital_module.remove_parameter_with_entries_desc')
              : null
          }
          cancelText={t('cancel')}
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
const DashboardContainer = styled(Box)(() => ({
  maxWidth: '100%',
  overflow: 'hidden'
}))

const MainContainer = styled(Box)(() => ({
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

const ScrollableContainer = styled(Box)(() => ({
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

const TimeSlotGrid: any = styled(Box, {
  shouldForwardProp: (prop: any) => prop !== 'numColumns'
})(({ theme, numColumns }: any) => ({
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

const HeaderContainer = styled(Box)(({ theme }: any) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 3),
  background: theme.palette.customColors.lightBg,
  borderRadius: '4px',
  marginBottom: theme.spacing(7),
  width: '100%',
  height: '56px'
}))

const MetricLabel = styled(Box)(({ theme }: any) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 3),
  backgroundColor: theme.palette.customColors.lightBg,
  borderRadius: theme.spacing(1),
  height: '72px',
  marginBottom: theme.spacing(2),
  width: '100%'
}))

const MetricName = styled(Typography)(({ theme }: any) => ({
  fontSize: '14px',
  fontWeight: 500,
  color: theme.palette.customColors.deepDark,
  marginBottom: '2px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: '100%',
  cursor: 'default'
}))

const MetricSubtext = styled(Typography)(({ theme }: any) => ({
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
  maxWidth: '160px',
  height: '72px',
  [theme.breakpoints.down('md')]: {
    fontSize: '11px',
    minWidth: '160px'
  }
}))

const TimeHeader = styled(Box)(({ theme }: any) => ({
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
    minWidth: '160px'
  }
}))
