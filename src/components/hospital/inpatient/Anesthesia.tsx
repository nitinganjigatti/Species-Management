'use client'
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import useSafeRouter from 'src/hooks/useSafeRouter'

import {
  Button,
  Tooltip as MuiTooltip,
  Typography,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material'
import { Box, Grid } from '@mui/system'
import Skeleton from '@mui/material/Skeleton'
import { alpha, useTheme, SxProps, Theme } from '@mui/material/styles'

import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'

import Utility from 'src/utility'
import DeleteConfirmationDialog from 'src/views/utility/DeleteConfirmationDialog'
import LoadingSkeleton from 'src/components/hospital/inpatient/Anesthesia/LoadingSkeleton'
import VitalMonitoringDetail from './Anesthesia/vitalForms/VitalMonitoringDetail'
import NoMedicalData from 'src/views/utility/NoMedicalData'
import { getAnesthesiaList, getAnesthesiaDetail, deleteAnesthesia } from 'src/lib/api/hospital/anesthesia'
import { AnesthesiaRecordsResponse, AnesthesiaDetailResponse } from 'src/types/hospital/api/Anesthesia/anesthesia'
import { ApiError } from 'src/types/hospital/api'
import { AnesthesiaAssessmentType, AnesthesiaDetailOption, AnesthesiaDetails, AnesthesiaGasRow, AnesthesiaMedicationRow, AnesthesiaReversalRow, AnesthesiaSetupFields, Gas, Medications, PatientDetailsData, Reversal, VitalMonitoringFields, VitalMonitoringRecords, VitalMonitoringTimeSlots } from 'src/types/hospital/models'
import { Id } from 'src/types/compliance'

export interface VitalMonitoringRow {
  key: string
  label: string
  values: Record<string, string>
}

export interface VitalMonitoringTableData {
  timeSlots: VitalMonitoringTimeSlots[]
  rows: VitalMonitoringRow[]
}

const tooltipSlotProps = {
  tooltip: {
    sx: {
      maxHeight: 200,
      overflowY: 'auto'
    }
  }
}

const Tooltip = ({ slotProps, ...props }: any) => {
  const mergedSlotProps = {
    ...tooltipSlotProps,
    ...(slotProps
      ? {
          ...slotProps,
          tooltip: { ...tooltipSlotProps.tooltip, ...(slotProps.tooltip || {}) }
        }
      : undefined)
  }

  return <MuiTooltip slotProps={mergedSlotProps} {...props} />
}

const PAGE_SIZE = 10
const SCROLL_FETCH_THRESHOLD = 140

const formatValueWithUnit = (value: string | number | null, unit?: string | null) => {
  if (value === undefined || value === null || value === '') return '--'
  return unit ? `${value} ${unit}`.trim() : `${value}`
}

const formatTimeOnly = (time: string | null) => {
  if (!time) return '--'
  const parsed = dayjs(`1970-01-01T${time}`)
  return parsed.isValid() ? parsed.format('hh:mm A') : time
}

const formatDateTime = (value: string | null) => {
  if (!value) return '--'
  const formatted = Utility.convertUTCToLocalDateTime(value)
  return formatted && formatted !== 'Invalid date' ? formatted : String(value)
}

const formatStaffNames = (list: Array<{ full_name?: string; name?: string }> | null) => {
  if (!Array.isArray(list) || !list.length) return '--'

  const names = list
    .map(item => item?.full_name || item?.name)
    .filter(Boolean)
    .join(', ')

  return names || '--'
}

interface AnesthesiaProps {
  hospitalCaseId?: Id
  medicalRecordId?: Id
  patientData?: PatientDetailsData
  overviewData?: { status?: string; [key: string]: unknown }
  patientDischarged?: boolean
  category?: string
}

interface AnesthesiaSetupSectionField {
  key: string
  label: string
  value: string
}

interface AnesthesiaSetupSectionView {
  id: Id | string
  sectionName: string
  stringId?: string
  fields: AnesthesiaSetupSectionField[]
  monitoringItems: string[]
}

function Anesthesia({ hospitalCaseId, medicalRecordId, patientData, overviewData, patientDischarged = false, category }: AnesthesiaProps) {
  const { t } = useTranslation()
  const theme: any = useTheme()
  const router: any = useSafeRouter()
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const queryClient = useQueryClient()

  const resolvedHospitalCaseId = hospitalCaseId || ''
  const resolvedMedicalRecordId = medicalRecordId || patientData?.medical_record_id || ''

  const shouldFetchRecords = Boolean(resolvedHospitalCaseId && resolvedMedicalRecordId)

  const {
    data: anesthesiaPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isAnesthesiaLoading,
    error: anesthesiaError,
    isFetching: isFetchingRecords
  } = useInfiniteQuery<AnesthesiaRecordsResponse>({
    queryKey: ['anesthesiaRecords', resolvedHospitalCaseId, resolvedMedicalRecordId],
    queryFn: ({ pageParam = 1 }: { pageParam?: number }) =>
      getAnesthesiaList({
        params: {
          hospital_case_id: resolvedHospitalCaseId,
          medical_record_id: resolvedMedicalRecordId,
          limit: PAGE_SIZE,
          page_no: pageParam
        }
      } as any),
    getNextPageParam: (lastPage: AnesthesiaRecordsResponse) => {
      const pagination = lastPage?.data

      if (!pagination) return undefined

      const currentPage = Number(pagination.page_no) || 0
      const totalPages = Number(pagination.total_pages) || 0

      return currentPage < totalPages ? currentPage + 1 : undefined
    },
    enabled: shouldFetchRecords,
    initialPageParam: 1
  } as any)

  const anesthesiaRecords = useMemo<AnesthesiaDetails[]>(() => {
    if (!anesthesiaPages?.pages?.length) return []

    return anesthesiaPages.pages.flatMap((page: AnesthesiaRecordsResponse) =>
      Array.isArray(page?.data?.records) ? page.data.records : []
    )
  }, [anesthesiaPages])

  const [activeRecordId, setActiveRecordId] = useState<string>('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false)
  const isDischared = overviewData?.status === 'discharge'
  const previousFirstRecordIdRef = useRef<string>('')
  const preferredAppliedRef = useRef<boolean>(false)
  const preferredAnesthesiaId = useMemo(() => {
    const possible = router.query?.anaesthesia_id || router.query?.anesthesia_id

    return Array.isArray(possible) ? possible[0] : possible || ''
  }, [router.query?.anaesthesia_id, router.query?.anesthesia_id])

  useEffect(() => {
    preferredAppliedRef.current = false
  }, [preferredAnesthesiaId])

  useEffect(() => {
    if (!anesthesiaRecords.length) {
      setActiveRecordId('')
      previousFirstRecordIdRef.current = ''

      return
    }

    const currentIds = anesthesiaRecords
      .map((record: AnesthesiaDetails) => record?.anaesthesia_id || (record as { id?: Id })?.id)
      .map((id: Id | undefined) => (id == null ? '' : String(id)))
      .filter(Boolean)

    const preferredId = preferredAnesthesiaId ? String(preferredAnesthesiaId) : ''
    if (preferredId && !preferredAppliedRef.current && currentIds.includes(preferredId)) {
      setActiveRecordId(preferredId)
      preferredAppliedRef.current = true
      previousFirstRecordIdRef.current = currentIds[0] || ''

      return
    }

    if (preferredId && !preferredAppliedRef.current && !currentIds.includes(preferredId)) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      } else if (!hasNextPage) {
        preferredAppliedRef.current = true
      }
    }

    const firstId = currentIds[0] || ''
    const previousFirstId = previousFirstRecordIdRef.current
    previousFirstRecordIdRef.current = firstId

    if (firstId && firstId !== previousFirstId) {
      setActiveRecordId(firstId)

      return
    }

    if (!currentIds.includes(String(activeRecordId))) {
      setActiveRecordId(firstId)
    }
  }, [anesthesiaRecords, activeRecordId, preferredAnesthesiaId, fetchNextPage, hasNextPage, isFetchingNextPage])

  useEffect(() => {
    if (!activeRecordId) return
    const container = scrollContainerRef.current
    if (!container) return

    const el = container.querySelector(`[data-anesthesia-id='${activeRecordId}']`)
    if (el && typeof (el as HTMLElement).scrollIntoView === 'function') {
      (el as HTMLElement).scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
    }
  }, [activeRecordId])

  const activeRecord = useMemo(() => {
    if (!anesthesiaRecords.length) return null

    if (activeRecordId) {
      const found = anesthesiaRecords.find(
        (record: AnesthesiaDetails) => String(record?.anaesthesia_id || record?.id || '') === String(activeRecordId)
      )

      if (found) return found
    }

    return anesthesiaRecords[0]
  }, [anesthesiaRecords, activeRecordId])
  const isRecordsLoading = isAnesthesiaLoading || (isFetchingRecords && !anesthesiaRecords.length)
  const activeRecordAnesthesiaId = activeRecordId

  const {
    data: anesthesiaDetailResponse,
    refetch: refetchAnesthesiaDetail,
    isFetching: isAnesthesiaDetailFetching
  } = useQuery<AnesthesiaDetailResponse>({
    queryKey: ['anesthesiaDetail', activeRecordAnesthesiaId],
    queryFn: () => getAnesthesiaDetail(activeRecordAnesthesiaId),
    // queryFn: () => getAnesthesiaDetail(4),
    enabled: shouldFetchRecords && Boolean(activeRecordAnesthesiaId)
  } as any)
  const anesthesiaDetail = anesthesiaDetailResponse?.data || null
  const showDetailSkeleton = isAnesthesiaDetailFetching || isRecordsLoading || !activeRecordAnesthesiaId

  const recordCode = anesthesiaDetail?.code || activeRecord?.code || '--'
  const lastUpdatedValue = formatDateTime(
    anesthesiaDetail?.updated_at || anesthesiaDetail?.created_at || activeRecord?.updated_at || activeRecord?.created_at || null
  )

  const basicDetails = useMemo(() => {
    const source = anesthesiaDetail || activeRecord || {}
    const estimatedTime = source?.estimated_time_required
      ? `${source.estimated_time_required} ${source.estimated_time_unit || ''}`.trim()
      : '--'

    return {
      location: source?.location || '--',
      dateAndTimeOfAnesthesia: formatDateTime(source?.anaesthesia_datetime),
      estimatedTimeRequired: estimatedTime || '--',
      Veterinarian: formatStaffNames(source?.veterinarians),
      Anesthetists: formatStaffNames(source?.anesthetists)
    }
  }, [anesthesiaDetail, activeRecord])

  const purposeItems = useMemo(() => {
    if (Array.isArray(anesthesiaDetail?.purpose)) {
      return anesthesiaDetail.purpose
        .map((item) => item?.name)
        .filter((name) => typeof name === 'string' && name.trim() !== '')
    }

    if (!Array.isArray(activeRecord?.purpose)) return []

    return activeRecord.purpose.map((item: AnesthesiaAssessmentType) => item?.name).filter((name: string) => typeof name === 'string' && name.trim() !== '')
  }, [anesthesiaDetail, activeRecord])

  const notesText = anesthesiaDetail?.notes?.trim()
    ? anesthesiaDetail.notes
    : activeRecord?.notes?.trim()
    ? activeRecord.notes
    : '--'

  const anesthesiaSetupSections = useMemo(() => {
    if (!Array.isArray(anesthesiaDetail?.anaesthesia_setup)) return []

    return anesthesiaDetail.anaesthesia_setup.map((section, sectionIndex: number) => ({
      id: section.section_id || section.string_id || `section-${sectionIndex}`,
      sectionName: section.section_name,
      stringId: section.string_id,
      fields: (section.fields || []).map((field: AnesthesiaSetupFields, index: number) => ({
        key: `${section.section_id || section.string_id || sectionIndex}-${field.field_id || index}`,
        label: field.field_label || field.field_key || 'Field',
        value: formatValueWithUnit(field.field_value, field.unit)
      })),
      monitoringItems: Array.isArray(section.monitoring_items)
        ? section.monitoring_items
            .filter((item: AnesthesiaAssessmentType) => item?.is_selected === '1' || item?.is_selected === 1 || item?.is_selected === true)
            .map((item: AnesthesiaAssessmentType) => item?.name)
            .filter(Boolean)
        : []
    }))
  }, [anesthesiaDetail])

  const nonMonitoringSetupSections = useMemo(
    () => anesthesiaSetupSections.filter((section: AnesthesiaSetupSectionView) => section.stringId !== 'monitoring' && section.fields.length),
    [anesthesiaSetupSections]
  )

  const monitoringItems = useMemo(() => {
    const monitoringSection = anesthesiaSetupSections.find((section: AnesthesiaSetupSectionView) => section.stringId === 'monitoring')

    if (!monitoringSection?.monitoringItems?.length) return []

    const seen = new Set<string>()
    const items: string[] = []

    monitoringSection.monitoringItems.forEach((name: string) => {
      const trimmed = typeof name === 'string' ? name.trim() : ''
      const key = trimmed.toLowerCase()
      if (!trimmed || seen.has(key)) return
      seen.add(key)
      items.push(trimmed)
    })

    return items
  }, [anesthesiaSetupSections])

  const setupFieldItems = useMemo(
    () =>
      nonMonitoringSetupSections
        .map((section: AnesthesiaSetupSectionView) => {
          const combinedValue = section.fields
            .map((field: AnesthesiaSetupSectionField) => field.value)
            .filter((val: string) => val && val !== '--')
            .join(' - ')

          return {
            key: section.id,
            label: section.sectionName || 'Section',
            value: combinedValue || '--'
          }
        })
        .filter((item: { key: Id | string; label: string; value: string }) => item.label),
    [nonMonitoringSetupSections]
  )

  const preAnesthesiaDetail = anesthesiaDetail?.pre_anaesthesia || null

  const environmentalDetails = useMemo(() => {
    if (!preAnesthesiaDetail) return []

    return [
      { label: 'Temperature', value: preAnesthesiaDetail.temperature || '' },
      { label: 'Humidity', value: preAnesthesiaDetail.humidity || '' }
    ]
  }, [preAnesthesiaDetail])

  const examDetails = useMemo(() => {
    if (!preAnesthesiaDetail) return []

    const weightNumber = Number(preAnesthesiaDetail.weight)
    const hasWeight =
      preAnesthesiaDetail.weight !== undefined &&
      preAnesthesiaDetail.weight !== null &&
      preAnesthesiaDetail.weight !== '' &&
      !Number.isNaN(weightNumber) &&
      weightNumber !== 0

    const fastingNumber = Number(preAnesthesiaDetail.fasting_time)
    const hasFastingTime =
      preAnesthesiaDetail.fasting_time !== undefined &&
      preAnesthesiaDetail.fasting_time !== null &&
      preAnesthesiaDetail.fasting_time !== '' &&
      !Number.isNaN(fastingNumber) &&
      fastingNumber !== 0

    const weightText = hasWeight
      ? `${preAnesthesiaDetail.weight} ${preAnesthesiaDetail.weight_unit || ''}${
          preAnesthesiaDetail.weight_type ? ` (${preAnesthesiaDetail.weight_type})` : ''
        }`.trim()
      : '--'

    const fastingTimeText = hasFastingTime
      ? `${preAnesthesiaDetail.fasting_time} ${preAnesthesiaDetail.fasting_unit || ''}`.trim()
      : '--'

    return [
      { label: 'Physical Health Status', value: preAnesthesiaDetail.physical_health_status || '--' },
      { label: 'Body Condition', value: preAnesthesiaDetail.body_condition || '--' },
      { label: 'Activity', value: preAnesthesiaDetail.animal_activity || '--' },
      {
        label: 'Fasting Time',
        value: fastingTimeText
      },
      {
        label: 'Previous Endotracheal Tube Size',
        value: preAnesthesiaDetail.previous_endotracheal_tube_size || '--'
      },
      { label: 'Weight', value: weightText },
      { label: 'Code Status', value: preAnesthesiaDetail.code_status || '--' }
    ]
  }, [preAnesthesiaDetail])

  const riskOfConcernText = preAnesthesiaDetail?.pre_anesthesia_notes || ''
  const clinPathText = Array.isArray(preAnesthesiaDetail?.clin_path)
    ? preAnesthesiaDetail.clin_path
        .map((item) => item?.name)
        .filter(Boolean)
        .join(', ')
    : ''

  const medicationRecords = useMemo(() => {
    const records = anesthesiaDetail?.anaesthesia_medications?.medication?.records

    if (!Array.isArray(records)) return []

    return records.map((record: Medications) => ({
      id: record.id || `${record.drug_id}-${record.type}`,
      drug: record.drug_name || '--',
      purpose: record.purpose_stage || record.type || '--',
      amount: formatValueWithUnit(record.amount, record.uom_abbr || record.unit_name),
      route: record.route || '--',
      deliveryTime: formatTimeOnly(record.delivery_time),
      deliveryStatus: record.delivery_status || '--',
      maxEffect: formatTimeOnly(record.max_effect),
      notes: record.comments || '--'
    }))
  }, [anesthesiaDetail])

  const gasRecords = useMemo(() => {
    const records = anesthesiaDetail?.anaesthesia_medications?.gas?.records

    if (!Array.isArray(records)) return []

    return records.map((record: Gas) => ({
      id: record.id || `${record.drug_id}-${record.type}`,
      gas: record.drug_name || '--',
      o2: formatValueWithUnit(record.oxygen_l_min, 'L/Min'),
      concentration: record.concentration || '--',
      route: record.route || '--',
      startTime: formatTimeOnly(record.start_time),
      endTime: formatTimeOnly(record.end_time)
    }))
  }, [anesthesiaDetail])

  const reversalRecords = useMemo(() => {
    const records = anesthesiaDetail?.recovery_and_reversal?.reversal?.records

    if (!Array.isArray(records)) return []

    return records.map((record: Reversal) => ({
      id: record.id || `${record.drug_id}-${record.type}`,
      drug: record.drug_name || '--',
      amount: formatValueWithUnit(record.amount, record.uom_abbr || record.unit_name),
      route: record.route || '--',
      deliveryTime: formatTimeOnly(record.delivery_time),
      deliveryStatus: record.delivery_status || '--',
      maxEffect: formatTimeOnly(record.max_effect)
    }))
  }, [anesthesiaDetail])

  const recoveryData = anesthesiaDetail?.recovery_and_reversal?.recovery || null

  const recoveryInfoList = useMemo(() => {
    if (!recoveryData) return []

    const hasRecoveryType = recoveryData.recovery_type && recoveryData.recovery_type !== '--'

    return [
      { label: 'Recovery Type', value: recoveryData.recovery_type || '--' },
      {
        label: 'Recovery 1st Effect',
        value: hasRecoveryType ? formatTimeOnly(recoveryData.recovery_first_effect_time) : '--'
      },
      {
        label: 'Recovery Full Effect',
        value: hasRecoveryType ? formatTimeOnly(recoveryData.recovery_full_effect_time) : '--'
      }
    ]
  }, [recoveryData])

  const recoveryProblemText = recoveryData?.describe_problem || ''
  const recoveryNotesText = recoveryData?.notes || ''

  const anaesthesiaRatings = useMemo(
    () => ({
      induction: recoveryData?.rating_induction || '',
      tolerance: recoveryData?.rating_tolerance || '',
      recovery: recoveryData?.rating_recovery || '',
      overall: recoveryData?.rating_overall || ''
    }),
    [recoveryData]
  )

  const hasAnyRating = Object.values(anaesthesiaRatings).some((v: string) => v !== '')

  const vitalMonitoringData = useMemo<VitalMonitoringTableData>(() => {
    const monitoring = anesthesiaDetail?.vital_monitoring

    if (!monitoring) return { timeSlots: [], rows: [] }

    const timeSlots: VitalMonitoringTimeSlots[] = (monitoring.time_slots || [])
      .map((slot): VitalMonitoringTimeSlots | null => {
        const id = slot.id || slot.monitoring_time_id

        if (!id) return null

        return {
          id: String(id),
          label: formatTimeOnly(slot.recorded_time ?? '')
        }
      })
      .filter((slot): slot is VitalMonitoringTimeSlots => slot !== null)

    const rows: VitalMonitoringRow[] = []

    ;(monitoring.records || []).forEach((section: VitalMonitoringRecords) => {
      ;(section.fields || []).forEach((field: VitalMonitoringFields, index: number) => {
        const key = `${section.section_id || 'section'}-${field.field_id || index}-${index}`
        const label =
          section.section_name && field.field_label && field.field_label !== section.section_name
            ? `${section.section_name} - ${field.field_label}`
            : field.field_label || section.section_name || 'Field'

        const values: Record<string, string> = {}

        ;(field.values || []).forEach((value) => {
          if (!value?.monitoring_time_id) return

          const slotId = String(value.monitoring_time_id)
          values[slotId] = formatValueWithUnit(value.field_value, value.unit)
        })

        rows.push({ key, label, values })
      })
    })

    return { timeSlots, rows }
  }, [anesthesiaDetail])

  const handleScrollFetch = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return

    const node = scrollContainerRef.current

    if (!node) return

    const { scrollLeft, scrollWidth, clientWidth } = node

    if (scrollWidth - (scrollLeft + clientWidth) < SCROLL_FETCH_THRESHOLD) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  useEffect(() => {
    const node = scrollContainerRef.current

    if (!node) return

    const onScroll = () => {
      handleScrollFetch()
    }

    node.addEventListener('scroll', onScroll)

    return () => {
      node.removeEventListener('scroll', onScroll)
    }
  }, [handleScrollFetch])

  useEffect(() => {
    if (!shouldFetchRecords) return

    handleScrollFetch()
  }, [handleScrollFetch, shouldFetchRecords, anesthesiaRecords.length])

  const handleRecordTabClick = useCallback(
    (selectionId: string) => {
      if (selectionId === activeRecordId) {
        return
      }

      setActiveRecordId(selectionId)
    },
    [activeRecordId]
  )

  const handleDeleteClick = useCallback(() => {
    if (!activeRecordAnesthesiaId || deleteLoading) return

    setDeleteDialogOpen(true)
  }, [activeRecordAnesthesiaId, deleteLoading])

  const handleDeleteDialogClose = useCallback(() => {
    if (deleteLoading) return

    setDeleteDialogOpen(false)
  }, [deleteLoading])

  const handleEditClick = (value: AnesthesiaDetails) => {
    // const caseId =  router?.query?.id
    const caseId = resolvedHospitalCaseId || router?.query?.id

    if (value?.anaesthesia_id && caseId) {
      router.push(`/hospital/inpatient/${caseId}/AddAnesthesiaRecord?tab=anesthesia&from_tab=anesthesia&anaesthesia_id=${value?.anaesthesia_id}`)
    }
  }

  const handleDeleteConfirm = useCallback(async () => {
    if (!activeRecordAnesthesiaId) return

    try {
      setDeleteLoading(true)
      const response = await deleteAnesthesia(activeRecordAnesthesiaId)

      if (response?.success || response?.status || response?.anaesthesia_id || response?.anesthesia_id) {
        toast.success(response?.message || 'Anesthesia deleted successfully.')
        setDeleteDialogOpen(false)
        setActiveRecordId('')
        await queryClient.invalidateQueries({ queryKey: ['anesthesiaRecords', resolvedHospitalCaseId, resolvedMedicalRecordId] })
      } else {
        const message =
          response?.message ||
          response?.reason ||
          response?.data?.message ||
          'Unable to delete anesthesia record. Please try again.'
        toast.error(message)
        setDeleteDialogOpen(false)
      }
    } catch (error: unknown) {
      const err = error as ApiError
      const message = err?.response?.data?.message || err?.message || 'Failed to delete anesthesia record.'
      toast.error(message)
    } finally {
      setDeleteLoading(false)
    }
  }, [activeRecordAnesthesiaId, queryClient, resolvedHospitalCaseId, resolvedMedicalRecordId])

  const renderTabSkeletons = useCallback(
    (count: number = 4) => (
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        {Array.from({ length: count }).map((_, index: number) => (
          <Skeleton key={`tab-skeleton-${index}`} variant='rounded' width={110 + (index % 3) * 12} height={48} />
        ))}
      </Box>
    ),
    []
  )

  const renderRecordTabs = () => {
    if (!shouldFetchRecords) return null

    if (isRecordsLoading) {
      return renderTabSkeletons()
    }

    if (anesthesiaError) {
      const err = anesthesiaError as ApiError
      const message =
        err?.response?.data?.message || err?.message || 'Failed to load anesthesia records.'

      return (
        <Typography color='error' sx={{ whiteSpace: 'nowrap' }}>
          {message}
        </Typography>
      )
    }

    // if (!anesthesiaRecords.length) {
    //   return (
    //     <Typography sx={{ color: theme.palette.customColors.neutralSecondary, whiteSpace: 'nowrap' }}>
    //       No anesthesia records found.
    //     </Typography>
    //   )
    // }

    return anesthesiaRecords.map((record: AnesthesiaDetails, index: number) => {
      const label = record?.code || `Record ${index + 1}`
      const selectionId = record?.anaesthesia_id ? String(record.anaesthesia_id) : ''
      if (!selectionId) return null
      const isActive = selectionId === activeRecordId

      return (
        <Box
          data-anesthesia-id={selectionId}
          key={selectionId}
          onClick={() => handleRecordTabClick(selectionId)}
          sx={{
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            px: '16px',
            height: '48px',
            borderRadius: '8px',
            backgroundColor: isActive ? theme.palette.secondary.dark : theme.palette.customColors.mdAntzNeutral,
            cursor: 'pointer'
          }}
        >
          <Typography
            sx={{
              color: isActive ? theme.palette.primary.contrastText : theme.palette.customColors.neutralPrimary,
              whiteSpace: 'nowrap'
            }}
          >
            {label}
          </Typography>
        </Box>
      )
    })
  }

  const tableStyles: SxProps<Theme> = {
    '& thead tr': {
      height: '48px'
    },
    '& tbody tr': {
      height: '55px'
    },
    '& th': {
      fontWeight: 600,
      fontSize: '12px',
      color: theme.palette.customColors.OnSurfaceVariant,
      backgroundColor: theme.palette.customColors.bodyBg,
      textTransform: 'uppercase'
    },
    '& td': {
      fontSize: '14px',
      fontWeight: 500,
      color: theme.palette.customColors.OnSurfaceVariant,
      borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
      maxWidth: 180,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    '& tr:last-child td': {
      borderBottom: 'none'
    }
  }

  // Helper to render each cell with tooltip
  const renderCell = (text: string | number | null) => {
    const value = text !== undefined && text !== null && text !== '' ? text : '-'

    return (
      <Tooltip title={value} placement='bottom-start' arrow>
        <Box
          sx={{
            maxWidth: 180,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {value}
        </Box>
      </Tooltip>
    )
  }

  const DetailsHeader = ({ text }: { text: string }) => (
    <Box sx={{}}>
      <Divider sx={{ mb: 6 }} />
      <Typography
        sx={{
          fontWeight: 500,
          fontSize: '20px',
          letterSpacing: 0,
          color: theme.palette.customColors.OnPrimaryContainer
        }}
      >
        {text}
      </Typography>
    </Box>
  )
  const handleRouterNavigation = () => {
    if(category === 'Discharged') {
      router.push(`/hospital/discharged/${hospitalCaseId}/AddAnesthesiaRecord`)
    }
    else if(category === 'Mortality') {
      router.push(`/hospital/mortality/${hospitalCaseId}/AddAnesthesiaRecord`)
    }
    else if(category === 'Follow Up') {
      router.push(`/hospital/followup/${hospitalCaseId}/AddAnesthesiaRecord`)
    }
    else if(category === 'Outpatients'){
      router.push(`/hospital/outpatient/${hospitalCaseId}/AddAnesthesiaRecord`)
    }
    else {
      router.push(`/hospital/inpatient/${hospitalCaseId}/AddAnesthesiaRecord`)
    }
  }

  if (isRecordsLoading) {
    return <LoadingSkeleton />
  }

  return (
    <>
      <Box sx={{ mt: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: '24px'
          }}
        >
          <Box
            ref={scrollContainerRef}
            sx={{
              flex: '1 1 auto',
              minWidth: 0,
              overflowX: 'auto',
              scrollbarColor: 'transparent transparent'
            }}
          >
            <Box sx={{ display: 'inline-flex', gap: '10px', pr: 1, alignItems: 'center' }}>
              {renderRecordTabs()}
              {isFetchingNextPage && anesthesiaRecords.length ? (
                <Skeleton variant='rounded' width={90} height={32} />
              ) : null}
            </Box>
          </Box>

          {anesthesiaRecords.length > 0 && (
            <Button
              onClick={handleRouterNavigation}
              variant='contained'
              sx={{ flex: '0 0 auto', whiteSpace: 'nowrap', height: '48px' }}
            >
              {t('hospital_module.add_anesthesia')}
            </Button>
          )}
        </Box>
        {anesthesiaRecords.length === 0 && (
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <NoMedicalData
              btnText={t('hospital_module.add_anesthesia')}
              text={t('hospital_module.all_added_anesthesia_appear_here')}
              // isDischarged={isDischared}
              btnAction={handleRouterNavigation}
            />
          </Box>
        )}
        {anesthesiaRecords.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: '24px',
                  letterSpacing: 0,
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                {t('hospital_module.anesthesia_details')}
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: '14px',
                      color: theme.palette.customColors.OnPrimaryContainer
                    }}
                  >
                    {recordCode}
                  </Typography>

                  <Typography
                    sx={{
                      fontWeight: 400,
                      fontSize: '12px',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    {t('hospital_module.last_updated')} : {lastUpdatedValue}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <>
                    <Box
                      component='img'
                      src='/icons/pencil_outlined.svg'
                      alt='Edit'
                      sx={{ width: 24, height: 24, cursor: 'pointer' }}
                      onClick={() => handleEditClick(anesthesiaDetail)}
                    />

                    <Box
                      component='img'
                      src='/icons/delete_outlined.svg'
                      alt='Delete'
                      sx={{
                        width: 24,
                        height: 24,
                        cursor: activeRecordAnesthesiaId ? 'pointer' : 'not-allowed',
                        opacity: activeRecordAnesthesiaId ? 1 : 0.4
                      }}
                      onClick={handleDeleteClick}
                    />
                  </>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <DetailsHeader text={t('hospital_module.basic_details')} />
              <Grid container spacing={4}>
                {Object.entries(basicDetails).map(([label, value]: [string, string]) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={label}>
                    <Tooltip title={label.replace(/([A-Z])/g, ' $1')} placement='bottom-start' arrow>
                      <Typography
                        sx={{
                          mb: '4px',
                          fontWeight: 400,
                          fontSize: '14px',
                          letterSpacing: 0,
                          color: theme.palette.customColors.neutralSecondary,
                          textTransform: 'capitalize',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {label.replace(/([A-Z])/g, ' $1')}
                      </Typography>
                    </Tooltip>
                    <Tooltip title={value} placement='bottom-start' arrow>
                      <Typography
                        sx={{
                          fontWeight: 400,
                          fontSize: '16px',
                          letterSpacing: 0,
                          color: theme.palette.customColors.OnSurfaceVariant,
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {value}
                      </Typography>
                    </Tooltip>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Typography
                sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px', fontWeight: 600 }}
              >
                {t('hospital_module.purpose_of_anesthesia')}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {purposeItems.length ? (
                  purposeItems.map((item: string, index: number) => (
                    <Tooltip key={`${item}-${index}`} title={item} placement='top'>
                      <Chip
                        label={item}
                        sx={{
                          height: '41px',
                          backgroundColor: alpha(theme.palette.customColors.SecondaryContainer, 0.5),
                          border: `1px solid ${theme.palette.customColors.SecondaryContainer}`,
                          borderRadius: '6px',
                          '& .MuiChip-label': { px: 6, py: 0.5 },
                          color: theme.palette.customColors.OnPrimaryContainer,
                          fontWeight: 500,
                          fontSize: '16px',
                          textAlign: 'center'
                        }}
                      />
                    </Tooltip>
                  ))
                ) : (
                  <Typography sx={{ color: theme.palette.customColors.neutralSecondary }}>{t('hospital_module.no_purpose_added')}</Typography>
                )}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              <Typography sx={{ color: theme.palette.customColors.secondaryBg, fontSize: '14px', fontWeight: 400 }}>
                {t('notes')}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontSize: '16px',
                    fontWeight: 500,
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {notesText}
                </Typography>
              </Box>
            </Box>

            {environmentalDetails.length || examDetails.length || riskOfConcernText || clinPathText ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {environmentalDetails.length ? <DetailsHeader text={t('hospital_module.pre_anesthesia')} /> : ''}
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    columnGap: '4px',
                    rowGap: '10px',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {environmentalDetails.length ? (
                      <Typography
                        sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px', fontWeight: 600 }}
                      >
                        {t('hospital_module.environmental_condition')}
                      </Typography>
                    ) : (
                      ''
                    )}
                  </Box>
                  <Grid sx={{ px: '0px' }} container spacing={4}>
                    {
                      environmentalDetails.length
                        ? environmentalDetails.map((item: AnesthesiaDetailOption) => {
                            const hasValue = item.value !== undefined && item.value !== null && item.value !== ''
                            const displayValue = hasValue ? item.value : '--'
                            const unit = item.label === 'Temperature' ? '°C' : '%'

                            return (
                              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.label} sx={{ minWidth: 0 }}>
                                <Tooltip title={item.label} placement='bottom-start' arrow>
                                  <Typography
                                    sx={{
                                      mb: '4px',
                                      fontWeight: 400,
                                      fontSize: '14px',
                                      letterSpacing: 0,
                                      color: theme.palette.customColors.neutralSecondary,
                                      textTransform: 'capitalize',
                                      textOverflow: 'ellipsis',
                                      overflow: 'hidden',
                                      whiteSpace: 'nowrap',
                                      minWidth: 0,
                                      display: 'block'
                                    }}
                                  >
                                    {item.label}
                                  </Typography>
                                </Tooltip>

                                <Tooltip title={displayValue} placement='bottom-start' arrow>
                                  <Typography
                                    sx={{
                                      fontWeight: 500,
                                      fontSize: '16px',
                                      letterSpacing: 0,
                                      color: theme.palette.customColors.OnSurfaceVariant,
                                      textOverflow: 'ellipsis',
                                      overflow: 'hidden',
                                      whiteSpace: 'nowrap',
                                      minWidth: 0,
                                      display: 'block'
                                    }}
                                  >
                                    {displayValue}
                                    {hasValue ? unit : ''}
                                  </Typography>
                                </Tooltip>
                              </Grid>
                            )
                          })
                        : ''
                    }
                  </Grid>
                </Box>

                {examDetails.length ? <Divider /> : ''}

                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    columnGap: '4px',
                    rowGap: '10px',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  {examDetails.length ? (
                    <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <Typography
                        sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px', fontWeight: 600 }}
                      >
                        {t('hospital_module.pre_anesthetic_examination')}
                      </Typography>
                    </Box>
                  ) : (
                    ''
                  )}
                  <Grid container spacing={4}>
                    {
                      examDetails.length
                        ? examDetails.map((item: AnesthesiaDetailOption) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.label} sx={{ minWidth: 0 }}>
                              <Tooltip title={item.label} placement='bottom-start' arrow>
                                <Typography
                                  sx={{
                                    mb: '4px',
                                    fontWeight: 400,
                                    fontSize: '14px',
                                    letterSpacing: 0,
                                    color: theme.palette.customColors.neutralSecondary,
                                    textTransform: 'capitalize',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    minWidth: 0,
                                    display: 'block'
                                  }}
                                >
                                  {item.label}
                                </Typography>
                              </Tooltip>
                              <Tooltip title={item.value} placement='bottom-start' arrow>
                                <Typography
                                  sx={{
                                    fontWeight: 500,
                                    fontSize: '16px',
                                    letterSpacing: 0,
                                    color: theme.palette.customColors.OnSurfaceVariant,
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    minWidth: 0,
                                    display: 'block'
                                  }}
                                >
                                  {item.value}
                                </Typography>
                              </Tooltip>
                            </Grid>
                          ))
                        : ''
                    }
                  </Grid>
                  <Grid container spacing={4} sx={{ mt: 2, flexDirection: 'column' }}>
                    {riskOfConcernText ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0, width: '100%' }}>
                        <Typography
                          sx={{
                            mb: '4px',
                            fontWeight: 400,
                            fontSize: '14px',
                            letterSpacing: 0,
                            color: theme.palette.customColors.neutralSecondary,
                            textTransform: 'capitalize',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {t('hospital_module.risk_of_concern')}
                        </Typography>
                        <Tooltip title={riskOfConcernText} placement='bottom-start' arrow>
                          <Typography
                            sx={{
                              fontWeight: 400,
                              fontSize: '16px',
                              letterSpacing: 0,
                              color: theme.palette.customColors.OnSurfaceVariant,
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              minWidth: 0,
                              maxWidth: '100%',
                              width: '100%',
                              display: 'block'
                            }}
                          >
                            {riskOfConcernText}
                          </Typography>
                        </Tooltip>
                      </Box>
                    ) : (
                      ''
                    )}

                    {clinPathText ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0, width: '100%' }}>
                        <Typography
                          sx={{
                            mb: '4px',
                            fontWeight: 400,
                            fontSize: '14px',
                            letterSpacing: 0,
                            color: theme.palette.customColors.neutralSecondary,
                            textTransform: 'capitalize',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {t('hospital_module.clin_path')}
                        </Typography>
                        <Tooltip title={clinPathText} placement='bottom-start' arrow>
                          <Typography
                            sx={{
                              fontWeight: 400,
                              fontSize: '16px',
                              letterSpacing: 0,
                              color: theme.palette.customColors.OnSurfaceVariant,
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              width: '100%',
                              maxWidth: '100%',
                              display: 'block'
                            }}
                          >
                            {clinPathText}
                          </Typography>
                        </Tooltip>
                      </Box>
                    ) : (
                      ''
                    )}
                  </Grid>
                </Box>
              </Box>
            ) : (
              ''
            )}

            {medicationRecords.length || gasRecords.length ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {medicationRecords.length ? (
                  <>
                    <DetailsHeader text={t('hospital_module.medications_gas')} />
                    <Box sx={{ mb: 4 }}>
                      <Typography
                        variant='subtitle1'
                        sx={{
                          fontWeight: 600,
                          mb: 1,
                          color: theme.palette.text.primary
                        }}
                      >
                        {t('hospital_module.medication')} - {medicationRecords.length}
                      </Typography>

                      <TableContainer
                        component={Paper}
                        variant='outlined'
                        sx={{
                          borderRadius: '8px!important',
                          overflow: 'auto',
                          boxShadow: 'none',
                          border: `1px solid ${theme.palette.customColors.OutlineVariant}`
                        }}
                      >
                        <Table size='small' sx={{ ...tableStyles, minWidth: 1100 }}>
                          <TableHead>
                            <TableRow>
                              <TableCell>{t('hospital_module.drug')}</TableCell>
                              <TableCell>{t('hospital_module.purpose_stage')}</TableCell>
                              <TableCell>{t('amount')}</TableCell>
                              <TableCell>{t('hospital_module.route')}</TableCell>
                              <TableCell>{t('hospital_module.delivery_time')}</TableCell>
                              <TableCell>{t('hospital_module.delivery_status')}</TableCell>
                              <TableCell>{t('hospital_module.max_effect_label')}</TableCell>
                              <TableCell>{t('notes')}</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {medicationRecords.length ? (
                              medicationRecords.map((record: AnesthesiaMedicationRow) => (
                                <TableRow key={record.id}>
                                  <TableCell>{renderCell(record.drug)}</TableCell>
                                  <TableCell>{renderCell(record.purpose)}</TableCell>
                                  <TableCell>{renderCell(record.amount)}</TableCell>
                                  <TableCell>{renderCell(record.route)}</TableCell>
                                  <TableCell>{renderCell(record.deliveryTime)}</TableCell>
                                  <TableCell>{renderCell(record.deliveryStatus)}</TableCell>
                                  <TableCell>{renderCell(record.maxEffect)}</TableCell>
                                  <TableCell>{renderCell(record.notes)}</TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={8}>
                                  <Typography sx={{ color: theme.palette.customColors.neutralSecondary }}>
                                   {t('hospital_module.no_medication_data')}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </>
                ) : (
                  ''
                )}

                {gasRecords.length ? (
                  <Box>
                    <Typography
                      variant='subtitle1'
                      sx={{
                        fontWeight: 600,
                        mb: 1,
                        color: theme.palette.text.primary
                      }}
                    >
                      {t('hospital_module.gas')} - {gasRecords.length}
                    </Typography>

                    <TableContainer
                      component={Paper}
                      variant='outlined'
                      sx={{
                        borderRadius: '8px!important',
                        overflow: 'auto',
                        boxShadow: 'none',
                        border: `1px solid ${theme.palette.customColors.OutlineVariant}`
                      }}
                    >
                      <Table size='small' sx={{ ...tableStyles, minWidth: 800 }}>
                        <TableHead>
                          <TableRow sx={{ height: '55px' }}>
                            <TableCell>{t('hospital_module.gas')}</TableCell>
                            <TableCell>{t('hospital_module.o2_l_min')}</TableCell>
                            <TableCell>{t('hospital_module.concentration_percent')}</TableCell>
                            <TableCell>{t('hospital_module.route')}</TableCell>
                            <TableCell>{t('hospital_module.start_time')}</TableCell>
                            <TableCell>{t('hospital_module.end_time')}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {gasRecords.length ? (
                            gasRecords.map((record: AnesthesiaGasRow) => (
                              <TableRow key={record.id}>
                                <TableCell>{renderCell(record.gas)}</TableCell>
                                <TableCell>{renderCell(record.o2)}</TableCell>
                                <TableCell>{renderCell(record.concentration)}</TableCell>
                                <TableCell>{renderCell(record.route)}</TableCell>
                                <TableCell>{renderCell(record.startTime)}</TableCell>
                                <TableCell>{renderCell(record.endTime)}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6}>
                                <Typography sx={{ color: theme.palette.customColors.neutralSecondary }}>
                                  {t('hospital_module.no_gas_data')}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                ) : (
                  ''
                )}
              </Box>
            ) : (
              ''
            )}

            <Grid size={{ xs: 12 }}>
              <VitalMonitoringDetail data={vitalMonitoringData} />
            </Grid>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {reversalRecords.length ? (
                <>
                  <DetailsHeader text={t('hospital_module.recovery_and_reversal')} />
                  <Box sx={{ mb: 4 }}>
                    <Typography
                      variant='subtitle1'
                      sx={{
                        fontWeight: 600,
                        mb: 1,
                        color: theme.palette.text.primary
                      }}
                    >
                      {t('hospital_module.reversal_drug_section')} - {reversalRecords.length}
                    </Typography>

                    <TableContainer
                      component={Paper}
                      variant='outlined'
                      sx={{
                        borderRadius: '8px!important',
                        overflow: 'auto',
                        boxShadow: 'none',
                        border: `1px solid ${theme.palette.customColors.OutlineVariant}`
                      }}
                    >
                      <Table size='small' sx={{ ...tableStyles, minWidth: 800 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell>{t('hospital_module.drug_name')}</TableCell>
                            <TableCell>{t('amount')}</TableCell>
                            <TableCell>{t('hospital_module.route')}</TableCell>
                            <TableCell>{t('hospital_module.delivery_time')}</TableCell>
                            <TableCell>{t('hospital_module.delivery')} </TableCell>
                            <TableCell>{t('hospital_module.max_effect')}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {reversalRecords.length ? (
                            reversalRecords.map((record: AnesthesiaReversalRow) => (
                              <TableRow key={record.id}>
                                <TableCell>{renderCell(record.drug)}</TableCell>
                                <TableCell>{renderCell(record.amount)}</TableCell>
                                <TableCell>{renderCell(record.route)}</TableCell>
                                <TableCell>{renderCell(record.deliveryTime)}</TableCell>
                                <TableCell>{renderCell(record.deliveryStatus)}</TableCell>
                                <TableCell>{renderCell(record.maxEffect)}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6}>
                                <Typography sx={{ color: theme.palette.customColors.neutralSecondary }}>
                                  {t('hospital_module.no_reversal_data')}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </>
              ) : (
                ''
              )}

              {recoveryInfoList.length ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      columnGap: '4px',
                      rowGap: '10px',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <Typography
                        sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px', fontWeight: 600 }}
                      >
                        {t('hospital_module.recovery_details')}
                      </Typography>
                    </Box>
                    <Grid sx={{ px: '0px' }} container spacing={4}>
                      {
                        recoveryInfoList.length
                          ? recoveryInfoList.map((item: AnesthesiaDetailOption) => (
                              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.label} sx={{ minWidth: 0 }}>
                                <Tooltip title={item.label} placement='bottom-start' arrow>
                                  <Typography
                                    sx={{
                                      mb: '4px',
                                      fontWeight: 400,
                                      fontSize: '14px',
                                      letterSpacing: 0,
                                      color: theme.palette.customColors.neutralSecondary,
                                      textTransform: 'capitalize',
                                      textOverflow: 'ellipsis',
                                      overflow: 'hidden',
                                      whiteSpace: 'nowrap',
                                      minWidth: 0,
                                      display: 'block'
                                    }}
                                  >
                                    {item.label}
                                  </Typography>
                                </Tooltip>
                                <Tooltip title={item.value} placement='bottom-start' arrow>
                                  <Typography
                                    sx={{
                                      fontWeight: 500,
                                      fontSize: '16px',
                                      letterSpacing: 0,
                                      color: theme.palette.customColors.OnSurfaceVariant,
                                      textOverflow: 'ellipsis',
                                      overflow: 'hidden',
                                      whiteSpace: 'nowrap',
                                      minWidth: 0,
                                      display: 'block'
                                    }}
                                  >
                                    {item.value}
                                  </Typography>
                                </Tooltip>
                              </Grid>
                            ))
                          : ''
                      }
                    </Grid>
                  </Box>

                  <Divider />
                </Box>
              ) : (
                ''
              )}

              {recoveryProblemText || recoveryNotesText || hasAnyRating ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      columnGap: '4px',
                      rowGap: '10px',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  ></Box>

                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      columnGap: '4px',
                      rowGap: '10px',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    {recoveryProblemText && recoveryData.recovery_type === 'Problem' ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mt: 2, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
                          <Typography
                            sx={{
                              mb: '4px',
                              fontWeight: 400,
                              fontSize: '14px',
                              letterSpacing: 0,
                              color: theme.palette.customColors.neutralSecondary,
                              textTransform: 'capitalize',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {t('hospital_module.describe_the_problem')}
                          </Typography>
                          <Tooltip title={recoveryProblemText} placement='bottom-start' arrow>
                            <Typography
                              sx={{
                                fontWeight: 400,
                                fontSize: '16px',
                                letterSpacing: 0,
                                color: theme.palette.customColors.OnSurfaceVariant,
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                minWidth: 0,
                                display: 'block'
                              }}
                            >
                              {recoveryProblemText}
                            </Typography>
                          </Tooltip>
                        </Box>
                      </Box>
                    ) : (
                      ''
                    )}

                    {recoveryNotesText ? (
                      <Box
                        sx={(theme: any) => ({
                          gap: '3px',
                          background: theme.palette.customColors.Notes,
                          width: '100%',
                          px: 4,
                          py: 2,
                          borderRadius: '8px',
                          mt: 1
                        })}
                      >
                        <Typography
                          sx={{
                            mb: '4px',
                            fontWeight: 400,
                            fontSize: '14px',
                            letterSpacing: 0,
                            color: theme.palette.customColors.neutralSecondary,
                            textTransform: 'capitalize',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {t('notes')}
                        </Typography>
                        <Tooltip
                          title={recoveryNotesText}
                          placement='top'
                          arrow
                          slotProps={{
                            tooltip: {
                              sx: {
                                maxHeight: 200,
                                overflowY: 'auto'
                              }
                            }
                          }}
                        >
                          <Typography
                            sx={{
                              fontWeight: 500,
                              fontSize: '16px',
                              letterSpacing: 0,
                              color: theme.palette.customColors.OnSurfaceVariant,
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {recoveryNotesText}
                          </Typography>
                        </Tooltip>
                      </Box>
                    ) : (
                      ''
                    )}
                  </Box>

                  {hasAnyRating ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <Box
                        sx={{
                          mt: 3,
                          display: 'flex',
                          flexWrap: 'wrap',
                          columnGap: '4px',
                          rowGap: '10px',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <Typography
                            sx={{
                              color: theme.palette.customColors.OnSurfaceVariant,
                              fontSize: '16px',
                              fontWeight: 600
                            }}
                          >
                            {t('hospital_module.anesthesia_ratings_label')}
                          </Typography>
                        </Box>
                        <Grid sx={{ px: '0px' }} container spacing={4}>
                          {Object.entries(anaesthesiaRatings).map(([label, value]: [string, string]) => (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={label}>
                              <Tooltip title={label.replace(/([A-Z])/g, ' $1')} placement='bottom-start' arrow>
                                <Typography
                                  sx={{
                                    mb: '4px',
                                    fontWeight: 400,
                                    fontSize: '14px',
                                    letterSpacing: 0,
                                    color: theme.palette.customColors.neutralSecondary,
                                    textTransform: 'capitalize',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {label.replace(/([A-Z])/g, ' $1')}
                                </Typography>
                              </Tooltip>
                              <Tooltip title={value} placement='bottom-start' arrow>
                                <Typography
                                  sx={{
                                    fontWeight: 500,
                                    fontSize: '16px',
                                    letterSpacing: 0,
                                    color: theme.palette.customColors.OnSurfaceVariant,
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {value}
                                </Typography>
                              </Tooltip>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    </Box>
                  ) : (
                    ''
                  )}
                </Box>
              ) : (
                ''
              )}
            </Box>

            {setupFieldItems.length || monitoringItems.length ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {setupFieldItems.length ? <DetailsHeader text={t('hospital_module.anesthesia_setup')} /> : ''}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {setupFieldItems.length ? (
                    <Grid container spacing={{ xs: 3, sm: 4 }}>
                      {setupFieldItems.map((field) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={field.key}>
                          <Tooltip title={field.label} placement='bottom-start' arrow>
                            <Typography
                              sx={{
                                mb: '6px',
                                fontWeight: 400,
                                fontSize: '15px',
                                letterSpacing: 0,
                                color: theme.palette.customColors.neutralSecondary,
                                textTransform: 'capitalize',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {field.label}
                            </Typography>
                          </Tooltip>
                          <Tooltip title={field.value} placement='bottom-start' arrow>
                            <Typography
                              sx={{
                                fontWeight: 600,
                                fontSize: '18px',
                                letterSpacing: 0,
                                color: theme.palette.customColors.OnSurfaceVariant,
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {field.value}
                            </Typography>
                          </Tooltip>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    ("")
                  )}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px', mt: 2 }}>
                  {monitoringItems.length ? (
                    <Typography
                      sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px', fontWeight: 600 }}
                    >
                      {t('hospital_module.monitoring')}
                    </Typography>
                  ) : (
                    ''
                  )}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {
                      monitoringItems.length
                        ? monitoringItems.map((item: string, index: number) => (
                            <Tooltip key={`${item}-${index}`} title={item} placement='top'>
                              <Chip
                                label={item}
                                sx={{
                                  height: '41px',
                                  backgroundColor: alpha(theme.palette.customColors.SecondaryContainer, 0.5),
                                  border: `1px solid ${theme.palette.customColors.SecondaryContainer}`,
                                  borderRadius: '6px',
                                  '& .MuiChip-label': { px: 6, py: 0.5 },
                                  color: theme.palette.customColors.OnPrimaryContainer,
                                  fontWeight: 500,
                                  fontSize: '16px',
                                  textAlign: 'center'
                                }}
                              />
                            </Tooltip>
                          ))
                        : ''
                    }
                  </Box>
                </Box>
              </Box>
            ) : (
              ''
            )}
          </Box>
        )}
      </Box>
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        loading={deleteLoading}
        handleClose={handleDeleteDialogClose}
        action={handleDeleteConfirm}
        message= {t('hospital_module.are_you_sure_you_want_to_delete_this_anesthesia_record')}
      />
    </>
  );
}

export default Anesthesia
