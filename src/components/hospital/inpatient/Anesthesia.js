import {
  Button,
  Tooltip,
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
import Skeleton from '@mui/material/Skeleton'
import LoadingSkeleton from 'src/components/hospital/inpatient/Anesthesia/LoadingSkeleton'
import { Box, Grid } from '@mui/system'
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useTheme } from '@mui/material/styles'
import MediaCard from 'src/views/utility/MediaCard'
import { useRouter } from 'next/router'
import { alpha } from '@mui/material/styles'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import VitalMonitoringDetail from './Anesthesia/vitalForms/VitalMonitoringDetail'
import { getAnesthesiaList, getAnesthesiaDetail, deleteAnesthesia } from 'src/lib/api/hospital/anesthesia'
import Utility from 'src/utility'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import DeleteConfirmationDialog from 'src/views/utility/DeleteConfirmationDialog'

const PAGE_SIZE = 10
const SCROLL_FETCH_THRESHOLD = 140
const ANESTHESIA_DETAIL_ID = 4

const formatValueWithUnit = (value, unit) => {
  if (value === undefined || value === null || value === '') return '--'
  return unit ? `${value} ${unit}`.trim() : `${value}`
}

const formatTimeOnly = time => {
  if (!time) return '--'
  const parsed = dayjs(`1970-01-01T${time}`)
  return parsed.isValid() ? parsed.format('hh:mm A') : time
}

const normalizeQueryValue = value => (Array.isArray(value) ? value[0] : value)
const hasValue = value => value !== undefined && value !== null && value !== ''

const getRecordIdentifier = record => {
  if (!record || typeof record !== 'object') return ''

  if (record.anaesthesia_id) return String(record.anaesthesia_id)
  if (record.id) return String(record.id)
  if (record.code) return String(record.code)
  return ''
}

const getStableRecordId = (record, index = 0) => {
  const identifier = getRecordIdentifier(record)

  if (identifier) return identifier
  if (record?.code) return String(record.code)

  return `record-${index}`
}

const formatDateTime = value => {
  if (!value) return '--'
  const formatted = Utility.convertUTCToLocalDateTime(value)
  return formatted && formatted !== 'Invalid date' ? formatted : String(value)
}

const formatStaffNames = list => {
  if (!Array.isArray(list) || !list.length) return '--'

  const names = list
    .map(item => item?.full_name || item?.name)
    .filter(Boolean)
    .join(', ')

  return names || '--'
}

const MediaScroller = ({ items = [] }) => {
  if (!items.length) {
    return <Typography sx={{ color: 'text.secondary', px: 2 }}>No attachments available.</Typography>
  }

  return (
    <Box
      sx={theme => ({
        width: '100%',
        overflowX: 'auto',
        py: 2,
        '&::-webkit-scrollbar': { height: '2px !important' },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
        '&::-webkit-scrollbar-thumb': {
          background: theme.palette.customColors.OutlineSecondary,
          borderRadius: '6px'
        },
        scrollbarWidth: 'thin',
        scrollbarColor: `${theme.palette.customColors.OutlineSecondary} transparent`
      })}
    >
      <Box
        sx={{
          display: 'inline-flex',
          gap: 2,
          px: 2
        }}
      >
        {items.map(item => (
          <Box
            key={item.id}
            sx={{
              width: 240,
              flexShrink: 0
            }}
          >
            <MediaCard media={item} isBorderedCard />
          </Box>
        ))}
      </Box>
    </Box>
  )
}

function Anesthesia({ hospitalCaseId, patientData }) {
  const theme = useTheme()
  const router = useRouter()
  const scrollContainerRef = useRef(null)
  const queryClient = useQueryClient()

  const resolvedHospitalCaseId = useMemo(() => {
    return hasValue(hospitalCaseId) ? hospitalCaseId : undefined
  }, [hospitalCaseId])

  const resolvedMedicalRecordId = useMemo(() => {
    const queryValue = normalizeQueryValue(router?.query?.medical_record_id)
    if (hasValue(queryValue)) return queryValue

    return patientData?.medical_record_id
  }, [router?.query, patientData?.medical_record_id])

  const shouldFetchRecords = Boolean(resolvedHospitalCaseId && resolvedMedicalRecordId)

  const {
    data: anesthesiaPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isAnesthesiaLoading,
    error: anesthesiaError,
    isFetching: isFetchingRecords
  } = useInfiniteQuery({
    queryKey: ['anesthesiaRecords', resolvedHospitalCaseId, resolvedMedicalRecordId],
    queryFn: ({ pageParam = 1 }) =>
      getAnesthesiaList({
        params: {
          hospital_case_id: resolvedHospitalCaseId,
          medical_record_id: resolvedMedicalRecordId,
          limit: PAGE_SIZE,
          page_no: pageParam
        }
      }),
    getNextPageParam: lastPage => {
      const pagination = lastPage?.data

      if (!pagination) return undefined

      const currentPage = Number(pagination.page_no) || 0
      const totalPages = Number(pagination.total_pages) || 0

      return currentPage < totalPages ? currentPage + 1 : undefined
    },
    enabled: shouldFetchRecords
  })

  const anesthesiaRecords = useMemo(() => {
    if (!anesthesiaPages?.pages?.length) return []

    return anesthesiaPages.pages.flatMap(page => (Array.isArray(page?.data?.records) ? page.data.records : []))
  }, [anesthesiaPages])

  const [activeRecordId, setActiveRecordId] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    if (!anesthesiaRecords.length) {
      setActiveRecordId('')

      return
    }

    setActiveRecordId(prev => {
      if (prev && anesthesiaRecords.some((record, index) => getStableRecordId(record, index) === prev)) {
        return prev
      }

      return getStableRecordId(anesthesiaRecords[0], 0)
    })
  }, [anesthesiaRecords])

  const activeRecord = useMemo(() => {
    if (!anesthesiaRecords.length) return null

    if (activeRecordId) {
      const found = anesthesiaRecords.find((record, index) => getStableRecordId(record, index) === activeRecordId)

      if (found) return found
    }

    return anesthesiaRecords[0]
  }, [anesthesiaRecords, activeRecordId])

  const { data: anesthesiaDetailResponse, refetch: refetchAnesthesiaDetail } = useQuery({
    queryKey: ['anesthesiaDetail', ANESTHESIA_DETAIL_ID, activeRecordId],
    queryFn: () => getAnesthesiaDetail(ANESTHESIA_DETAIL_ID),
    enabled: shouldFetchRecords && Boolean(activeRecordId)
  })
  const anesthesiaDetail = anesthesiaDetailResponse?.data || null

  const recordCode = anesthesiaDetail?.code || activeRecord?.code || '--'
  const lastUpdatedValue = formatDateTime(
    anesthesiaDetail?.updated_at || anesthesiaDetail?.created_at || activeRecord?.updated_at || activeRecord?.created_at
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
        .map(item => item?.name)
        .filter(name => typeof name === 'string' && name.trim() !== '')
    }

    if (!Array.isArray(activeRecord?.purpose)) return []

    return activeRecord.purpose.map(item => item?.name).filter(name => typeof name === 'string' && name.trim() !== '')
  }, [anesthesiaDetail, activeRecord])

  const notesText = anesthesiaDetail?.notes?.trim()
    ? anesthesiaDetail.notes
    : activeRecord?.notes?.trim()
    ? activeRecord.notes
    : '--'

  const activeRecordAnesthesiaId = activeRecord?.anaesthesia_id || activeRecord?.id || ''

  const anesthesiaSetupSections = useMemo(() => {
    if (!Array.isArray(anesthesiaDetail?.anaesthesia_setup)) return []

    return anesthesiaDetail.anaesthesia_setup.map((section, sectionIndex) => ({
      id: section.section_id || section.string_id || `section-${sectionIndex}`,
      sectionName: section.section_name || 'Section',
      stringId: section.string_id,
      fields: (section.fields || []).map((field, index) => ({
        key: `${section.section_id || section.string_id || sectionIndex}-${field.field_id || index}`,
        label: field.field_label || field.field_key || 'Field',
        value: formatValueWithUnit(field.field_value, field.unit)
      })),
      monitoringItems: Array.isArray(section.monitoring_items)
        ? section.monitoring_items
            .filter(item => item?.is_selected === '1' || item?.is_selected === 1 || item?.is_selected === true)
            .map(item => item?.name)
            .filter(Boolean)
        : []
    }))
  }, [anesthesiaDetail])

  const nonMonitoringSetupSections = useMemo(
    () => anesthesiaSetupSections.filter(section => section.stringId !== 'monitoring' && section.fields.length),
    [anesthesiaSetupSections]
  )

  const monitoringItems = useMemo(() => {
    const monitoringSection = anesthesiaSetupSections.find(section => section.stringId === 'monitoring')

    return monitoringSection?.monitoringItems || []
  }, [anesthesiaSetupSections])

  const preAnesthesiaDetail = anesthesiaDetail?.pre_anaesthesia || null

  const environmentalDetails = useMemo(() => {
    if (!preAnesthesiaDetail) return []

    return [
      { label: 'Temperature', value: preAnesthesiaDetail.temperature || '--' },
      { label: 'Humidity', value: preAnesthesiaDetail.humidity || '--' }
    ]
  }, [preAnesthesiaDetail])

  const examDetails = useMemo(() => {
    if (!preAnesthesiaDetail) return []

    const weightText = preAnesthesiaDetail.weight
      ? `${preAnesthesiaDetail.weight} ${preAnesthesiaDetail.weight_unit || ''}${
          preAnesthesiaDetail.weight_type ? ` (${preAnesthesiaDetail.weight_type})` : ''
        }`.trim()
      : '--'

    return [
      { label: 'Physical Health Status', value: preAnesthesiaDetail.physical_health_status || '--' },
      { label: 'Body Condition', value: preAnesthesiaDetail.body_condition || '--' },
      { label: 'Activity', value: preAnesthesiaDetail.animal_activity || '--' },
      {
        label: 'Fasting Time',
        value: preAnesthesiaDetail.fasting_time
          ? `${preAnesthesiaDetail.fasting_time} ${preAnesthesiaDetail.fasting_unit || ''}`.trim()
          : '--'
      },
      {
        label: 'Previous Endotracheal Tube Size',
        value: preAnesthesiaDetail.previous_endotracheal_tube_size || '--'
      },
      { label: 'Weight', value: weightText },
      { label: 'Code Status', value: preAnesthesiaDetail.code_status || '--' }
    ]
  }, [preAnesthesiaDetail])

  const riskOfConcernText = preAnesthesiaDetail?.pre_anesthesia_notes || '--'
  const clinPathText = Array.isArray(preAnesthesiaDetail?.clin_path)
    ? preAnesthesiaDetail.clin_path
        .map(item => item?.name)
        .filter(Boolean)
        .join(', ')
    : '--'

  const medicationRecords = useMemo(() => {
    const records = anesthesiaDetail?.anaesthesia_medications?.medication?.records

    if (!Array.isArray(records)) return []

    return records.map(record => ({
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

    return records.map(record => ({
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

    return records.map(record => ({
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

    return [
      { label: 'Recovery Type', value: recoveryData.recovery_type || '--' },
      { label: 'Recovery 1st Effect', value: formatTimeOnly(recoveryData.recovery_first_effect_time) },
      { label: 'Recovery Full Effect', value: formatTimeOnly(recoveryData.recovery_full_effect_time) }
    ]
  }, [recoveryData])

  const recoveryProblemText = recoveryData?.describe_problem || '--'
  const recoveryNotesText = recoveryData?.notes || '--'

  const anaesthesiaRatings = useMemo(
    () => ({
      induction: recoveryData?.rating_induction || '--',
      tolerance: recoveryData?.rating_tolerance || '--',
      recovery: recoveryData?.rating_recovery || '--',
      overall: recoveryData?.rating_overall || '--'
    }),
    [recoveryData]
  )

  const attachments = useMemo(() => {
    const records = anesthesiaDetail?.attachments?.records

    return Array.isArray(records) ? records : []
  }, [anesthesiaDetail])

  const vitalMonitoringData = useMemo(() => {
    const monitoring = anesthesiaDetail?.vital_monitoring

    if (!monitoring) return { timeSlots: [], rows: [] }

    const timeSlots = (monitoring.time_slots || [])
      .map(slot => {
        const id = slot.id || slot.monitoring_time_id

        if (!id) return null

        return {
          id: String(id),
          label: formatTimeOnly(slot.recorded_time)
        }
      })
      .filter(Boolean)

    const rows = []

    ;(monitoring.records || []).forEach(section => {
      ;(section.fields || []).forEach((field, index) => {
        const key = `${section.section_id || 'section'}-${field.field_id || index}-${index}`
        const label =
          section.section_name && field.field_label && field.field_label !== section.section_name
            ? `${section.section_name} - ${field.field_label}`
            : field.field_label || section.section_name || 'Field'

        const values = {}

        ;(field.values || []).forEach(value => {
          if (!value?.monitoring_time_id) return

          const slotId = String(value.monitoring_time_id)
          values[slotId] = formatValueWithUnit(value.field_value, value.unit)
        })

        rows.push({ key, label, values })
      })
    })

    return { timeSlots, rows }
  }, [anesthesiaDetail])

  const isRecordsLoading = isAnesthesiaLoading || (isFetchingRecords && !anesthesiaRecords.length)

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
    selectionId => {
      if (selectionId === activeRecordId) {
        refetchAnesthesiaDetail()

        return
      }

      setActiveRecordId(selectionId)
    },
    [activeRecordId, refetchAnesthesiaDetail]
  )

  const handleDeleteClick = useCallback(() => {
    if (!activeRecordAnesthesiaId || deleteLoading) return

    setDeleteDialogOpen(true)
  }, [activeRecordAnesthesiaId, deleteLoading])

  const handleDeleteDialogClose = useCallback(() => {
    if (deleteLoading) return

    setDeleteDialogOpen(false)
  }, [deleteLoading])

  const handleEditClick = value => {
    console.log(value, 'value')
    if (value?.anaesthesia_id) {
      const resolvedCaseId = resolvedHospitalCaseId
      const animalId = normalizeQueryValue(router?.query?.animal_id)

      const href = resolvedCaseId
        ? {
            pathname: `/hospital/inpatient/AddAnesthesiaRecord/`,
            query: {
              hospital_case_id: resolvedCaseId,
              medical_record_id: patientData?.medical_record_id,
              hospital_id: patientData?.hospital_id,
              animal_id: animalId,
              animal_admitted_date: router?.query?.animal_admitted_date,
              tab: router?.query?.tab,
              anaesthesia_id: value?.anaesthesia_id
            }
          }
        : '/hospital/inpatient/AddAnesthesiaRecord'

      router.push(href)
    }
  }

  const handleDeleteConfirm = useCallback(async () => {
    if (!activeRecordAnesthesiaId) return

    try {
      setDeleteLoading(true)
      await deleteAnesthesia(activeRecordAnesthesiaId)
      toast.success('Anesthesia deleted successfully.')
      setDeleteDialogOpen(false)
      setActiveRecordId('')
      await queryClient.invalidateQueries(['anesthesiaRecords', resolvedHospitalCaseId, resolvedMedicalRecordId])
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Failed to delete anesthesia record.'
      toast.error(message)
    } finally {
      setDeleteLoading(false)
    }
  }, [activeRecordAnesthesiaId, queryClient, resolvedHospitalCaseId, resolvedMedicalRecordId])

  const renderTabSkeletons = useCallback(
    (count = 4) => (
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        {Array.from({ length: count }).map((_, index) => (
          <Skeleton key={`tab-skeleton-${index}`} variant='rounded' width={110 + (index % 3) * 12} height={48} />
        ))}
      </Box>
    ),
    []
  )

  const renderRecordTabs = () => {
    if (!shouldFetchRecords) {
      return (
        <Typography sx={{ color: theme.palette.customColors.neutralSecondary, whiteSpace: 'nowrap' }}>
          Provide hospital case & medical record IDs to view anesthesia records.
        </Typography>
      )
    }

    if (isRecordsLoading) {
      return renderTabSkeletons()
    }

    if (anesthesiaError) {
      const message =
        anesthesiaError?.response?.data?.message || anesthesiaError?.message || 'Failed to load anesthesia records.'

      return (
        <Typography color='error' sx={{ whiteSpace: 'nowrap' }}>
          {message}
        </Typography>
      )
    }

    if (!anesthesiaRecords.length) {
      return (
        <Typography sx={{ color: theme.palette.customColors.neutralSecondary, whiteSpace: 'nowrap' }}>
          No anesthesia records found.
        </Typography>
      )
    }

    return anesthesiaRecords.map((record, index) => {
      const label = record?.code || `Record ${index + 1}`
      const selectionId = getStableRecordId(record, index)
      const isActive = selectionId === activeRecordId

      return (
        <Box
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

  const tableStyles = {
    '& tr': {
      height: '55px'
    },
    '& th': {
      fontWeight: 600,
      fontSize: '12px',
      color: theme.palette.customColors.OnSurfaceVariant,
      backgroundColor: theme.palette.customColors.displaybgSecondary,
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
  const renderCell = text => {
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

  const handleAddSurgeryRecord = () => {
    const resolvedCaseId = resolvedHospitalCaseId
    const animalId = normalizeQueryValue(router?.query?.animal_id)

    const href = resolvedCaseId
      ? {
          pathname: `/hospital/inpatient/AddAnesthesiaRecord/`,
          query: {
            hospital_case_id: resolvedCaseId,
            medical_record_id: patientData?.medical_record_id,
            hospital_id: patientData?.hospital_id,
            animal_id: animalId,
            animal_admitted_date: router?.query?.animal_admitted_date,
            tab: router?.query?.tab
          }
        }
      : '/hospital/inpatient/AddAnesthesiaRecord'

    router.push(href)
  }

  const DetailsHeader = ({ text }) => (
    <Box
      sx={theme => ({
        backgroundColor: alpha(theme.palette.customColors.displaybgPrimary, 0.6),
        padding: '8px',
        borderRadius: '4px'
      })}
    >
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

          <Button
            onClick={handleAddSurgeryRecord}
            variant='contained'
            sx={{ flex: '0 0 auto', whiteSpace: 'nowrap', height: '48px' }}
          >
            Add Anesthesia
          </Button>
        </Box>

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
              Anesthesia Details
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
                  Last updated : {lastUpdatedValue}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <DetailsHeader text={'Basic details'} />
            <Grid sx={{ px: '8px' }} container spacing={4}>
              {Object.entries(basicDetails).map(([label, value]) => (
                <Grid item size={{ xs: 6, md: 4 }} key={label}>
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
            <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px', fontWeight: 600 }}>
              Purpose of Anaesthesia
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {purposeItems.length ? (
                purposeItems.map((item, index) => (
                  <Chip
                    key={`${item}-${index}`}
                    label={item}
                    sx={{
                      backgroundColor: alpha(theme.palette.customColors.SecondaryContainer, 0.5),
                      color: theme.palette.customColors.OnPrimaryContainer,
                      fontWeight: 500,
                      fontSize: '14px',
                      border: `1px solid ${theme.palette.customColors.SecondaryContainer}`,
                      borderRadius: '6px',
                      '& .MuiChip-label': { px: 2, py: 0.5 }
                    }}
                  />
                ))
              ) : (
                <Typography sx={{ color: theme.palette.customColors.neutralSecondary }}>No purpose added.</Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            <Typography sx={{ color: theme.palette.customColors.secondaryBg, fontSize: '14px', fontWeight: 400 }}>
              Notes
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Typography
                sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px', fontWeight: 500 }}
              >
                {notesText}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <DetailsHeader text={'Anesthesia Set Up'} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {nonMonitoringSetupSections.length ? (
                nonMonitoringSetupSections.map(section => (
                  <Box key={section.id} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>
                      {section.sectionName}
                    </Typography>
                    <Grid sx={{ px: '8px' }} container spacing={4}>
                      {section.fields.map(field => (
                        <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={field.key}>
                          <Tooltip title={field.label} placement='bottom-start' arrow>
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
                              {field.label}
                            </Typography>
                          </Tooltip>
                          <Tooltip title={field.value} placement='bottom-start' arrow>
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
                              {field.value}
                            </Typography>
                          </Tooltip>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                ))
              ) : (
                <Typography sx={{ color: theme.palette.customColors.neutralSecondary, px: 2 }}>
                  No anesthesia setup data available.
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px', mt: 2 }}>
              <Typography
                sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px', fontWeight: 600 }}
              >
                Monitoring
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {monitoringItems.length ? (
                  monitoringItems.map((item, index) => (
                    <Chip
                      key={`${item}-${index}`}
                      label={item}
                      sx={{
                        backgroundColor: alpha(theme.palette.customColors.SecondaryContainer, 0.5),
                        color: theme.palette.customColors.OnPrimaryContainer,
                        fontWeight: 500,
                        fontSize: '14px',
                        border: `1px solid ${theme.palette.customColors.SecondaryContainer}`,
                        borderRadius: '6px',
                        '& .MuiChip-label': { px: 2, py: 0.5 }
                      }}
                    />
                  ))
                ) : (
                  <Typography sx={{ color: theme.palette.customColors.neutralSecondary }}>
                    No monitoring added.
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <DetailsHeader text={'Pre Anesthesia'} />

            <Box
              sx={{
                px: '8px',
                //height: '20px',
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
                  Environmental Condition
                </Typography>
              </Box>
              <Grid sx={{ px: '0px' }} container spacing={4}>
                {environmentalDetails.length ? (
                  environmentalDetails.map(item => (
                    <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={item.label}>
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
                            whiteSpace: 'nowrap'
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
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.value}
                        </Typography>
                      </Tooltip>
                    </Grid>
                  ))
                ) : (
                  <Grid item size={{ xs: 12 }}>
                    <Typography sx={{ color: theme.palette.customColors.neutralSecondary }}>
                      No data available.
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>

            <Divider />

            <Box
              sx={{
                px: '8px',
                //height: '20px',
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
                  Pre Anesthetic Examination
                </Typography>
              </Box>
              <Grid sx={{ px: '0px' }} container spacing={4}>
                {examDetails.length ? (
                  examDetails.map(item => (
                    <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={item.label}>
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
                            whiteSpace: 'nowrap'
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
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.value}
                        </Typography>
                      </Tooltip>
                    </Grid>
                  ))
                ) : (
                  <Grid item size={{ xs: 12 }}>
                    <Typography sx={{ color: theme.palette.customColors.neutralSecondary }}>
                      No data available.
                    </Typography>
                  </Grid>
                )}
              </Grid>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mt: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
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
                    Risk of Concern
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
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {riskOfConcernText}
                    </Typography>
                  </Tooltip>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
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
                    Clin Path
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
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {clinPathText}
                    </Typography>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <DetailsHeader text={'Medication & Gas'} />
            <Box sx={{ mb: 4 }}>
              <Typography
                variant='subtitle1'
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  color: theme.palette.text.primary
                }}
              >
                Medication - {medicationRecords.length}
              </Typography>

              <TableContainer
                component={Paper}
                variant='outlined'
                sx={{
                  borderRadius: '8px!important',
                  overflow: 'hidden',
                  boxShadow: 'none',
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`
                }}
              >
                <Table size='small' sx={tableStyles}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Drug</TableCell>
                      <TableCell>Purpose/Stage</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Route</TableCell>
                      <TableCell>Delivery Time</TableCell>
                      <TableCell>Delivery Status</TableCell>
                      <TableCell>Max Effect</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {medicationRecords.length ? (
                      medicationRecords.map(record => (
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
                            No medication data.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box>
              <Typography
                variant='subtitle1'
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  color: theme.palette.text.primary
                }}
              >
                Gas - {gasRecords.length}
              </Typography>

              <TableContainer
                component={Paper}
                variant='outlined'
                sx={{
                  borderRadius: '8px!important',
                  overflow: 'hidden',
                  boxShadow: 'none',
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`
                }}
              >
                <Table size='small' sx={tableStyles}>
                  <TableHead>
                    <TableRow sx={{ height: '55px' }}>
                      <TableCell>Gas</TableCell>
                      <TableCell>O2 L/Min</TableCell>
                      <TableCell>Concentration %</TableCell>
                      <TableCell>Route</TableCell>
                      <TableCell>Start Time</TableCell>
                      <TableCell>End Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {gasRecords.length ? (
                      gasRecords.map(record => (
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
                            No gas data.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>

          <Grid xs={12}>
            {/* <PrescriptionMonitoringGrid
          // onOpenPrescriptionCard={handleOpenPrescriptionCard}
          // medications={medicationData}
          // isLoading={isPrescriptionListLoading}
          // // medications={medication}
          // dates={dates}
          // selectedDate={selectedDate}
          // handleDateChange={handleDateChange}
          /> */}
            <VitalMonitoringDetail data={vitalMonitoringData} />
          </Grid>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <DetailsHeader text={'Recovery & Reversal'} />
            <Box sx={{ mb: 4 }}>
              <Typography
                variant='subtitle1'
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  color: theme.palette.text.primary
                }}
              >
                Reversal drug - {reversalRecords.length}
              </Typography>

              <TableContainer
                component={Paper}
                variant='outlined'
                sx={{
                  borderRadius: '8px!important',
                  overflow: 'hidden',
                  boxShadow: 'none',
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`
                }}
              >
                <Table size='small' sx={tableStyles}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Drug Name</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Route</TableCell>
                      <TableCell>Delivery Time</TableCell>
                      <TableCell>Delivery </TableCell>
                      <TableCell>Max Effect</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reversalRecords.length ? (
                      reversalRecords.map(record => (
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
                            No reversal data.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Box
                sx={{
                  px: '8px',
                  //height: '20px',
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
                    Recovery Details
                  </Typography>
                </Box>
                <Grid sx={{ px: '0px' }} container spacing={4}>
                  {recoveryInfoList.length ? (
                    recoveryInfoList.map(item => (
                      <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={item.label}>
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
                              whiteSpace: 'nowrap'
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
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {item.value}
                          </Typography>
                        </Tooltip>
                      </Grid>
                    ))
                  ) : (
                    <Grid item size={{ xs: 12 }}>
                      <Typography sx={{ color: theme.palette.customColors.neutralSecondary }}>
                        No recovery data.
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>

              <Divider />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Box
                sx={{
                  px: '8px',
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
                    Recovery Details
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  px: '8px',
                  //height: '20px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  columnGap: '4px',
                  rowGap: '10px',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mt: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
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
                      Describe the Problem
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
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {recoveryProblemText}
                      </Typography>
                    </Tooltip>
                  </Box>
                </Box>
                <Box
                  sx={theme => ({
                    gap: '3px',
                    background: theme.palette.customColors.Notes,
                    width: '100%',
                    px: 4,
                    py: 2,
                    borderRadius: '8px'
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
                    Notes
                  </Typography>
                  <Tooltip title={recoveryNotesText} placement='bottom-start' arrow>
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
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Box
                  sx={{
                    px: '8px',
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
                      sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px', fontWeight: 600 }}
                    >
                      Anesthesia Ratings
                    </Typography>
                  </Box>
                  <Grid sx={{ px: '0px' }} container spacing={4}>
                    {Object.entries(anaesthesiaRatings).map(([label, value]) => (
                      <Grid item size={{ xs: 12, sm: 6, md: 3 }} key={label}>
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
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <DetailsHeader text={'ATTACHMENTS'} />
            <MediaScroller items={attachments} />
          </Box>
        </Box>
      </Box>
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        loading={deleteLoading}
        handleClose={handleDeleteDialogClose}
        action={handleDeleteConfirm}
        message='Are you sure you want to delete this anesthesia record?'
      />
    </>
  )
}

export default Anesthesia
