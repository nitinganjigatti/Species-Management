'use client'

import React from 'react'
import { Grid, Box, Skeleton, Typography } from '@mui/material'
import Timeline from '@mui/lab/Timeline'
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem'
import { timelineOppositeContentClasses } from '@mui/lab'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import { useTheme, styled } from '@mui/material/styles'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useTranslation } from 'react-i18next'
import Search from 'src/views/utility/Search'
import Utility from 'src/utility'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import NoMedicalData from 'src/views/utility/NoMedicalData'


const DETAIL_LABELS: Record<string, string> = {
  case_type: 'Case Type',
  complaints: 'Symptoms',
  complaint: 'Symptoms',
  diagnosis: 'Clinical Assessment',
  prescription: 'Prescription',
  advice: 'Advice',
  advices: 'Advice',
  notes: 'Notes',
  note: 'Notes',
  follow_up_date: 'Next Visit',
  lab: 'Lab Tests',
  lab_data: 'Lab Tests',
  lab_test_requests: 'Lab Tests',
  attachment: 'Attachments',
  attachments: 'Attachments'
}

const HIDDEN_DETAIL_KEYS = new Set([
  'medical_record_number',
  'status',
  'created_for',
  'createdFor',
  'created_by',
  'created_at',
  'is_causing_adverse_side_effect',
  'isCausingAdverseSideEffect',
  'data',
  'Data'
])

const isEmptyDetailValue = (value: any): boolean => {
  if (value === null || value === undefined) return true
  if (typeof value === 'string' && value.trim() === '') return true
  if (Array.isArray(value)) return value.every(isEmptyDetailValue)
  if (typeof value === 'object') return Object.keys(value).length === 0

  return false
}

const formatDetailLabel = (key: string): string => {
  if (DETAIL_LABELS[key]) return DETAIL_LABELS[key]

  return key
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char: string) => char.toUpperCase())
}

const getObjectDisplayValue = (value: any): any => {
  if (!value || typeof value !== 'object') return null

  const preferredKeys = [
    'label',
    'name',
    'title',
    'complaint',
    'diagnosis',
    'medicine_name',
    'lab_code',
    'request_code',
    'note',
    'value'
  ]

  for (const key of preferredKeys) {
    const candidate = value?.[key]
    if (!isEmptyDetailValue(candidate)) {
      return formatDetailValue(candidate)
    }
  }

  const nestedValues = Object.values(value)
    .map((item: any) => formatDetailValue(item))
    .filter(Boolean)

  return nestedValues.length ? nestedValues.join(', ') : null
}

const formatDetailValue = (value: any): any => {
  if (isEmptyDetailValue(value)) return null

  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return Utility.convertUtcToLocalReadableDate(value)
    }

    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
      return Utility.convertUTCToLocalDate(value)
    }

    return value.replace(/\\n/g, '\n').trim()
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  if (Array.isArray(value)) {
    const items = value.map((item: any) => formatDetailValue(item)).filter(Boolean)

    return items.length ? items.join(', ') : null
  }

  if (typeof value === 'object') {
    return getObjectDisplayValue(value)
  }

  return String(value)
}

const getDisplayDetails = (details: any): any[] => {
  if (!details || typeof details !== 'object') return []

  const preferredOrder = [
    'case_type',
    'complaints',
    'complaint',
    'diagnosis',
    'prescription',
    'advice',
    'advices',
    'lab',
    'lab_data',
    'lab_test_requests',
    'attachments',
    'attachment',
    'notes',
    'note',
    'follow_up_date'
  ]

  const allKeys = Object.keys(details).filter((key: string) => !HIDDEN_DETAIL_KEYS.has(key))
  const orderedKeys = [...preferredOrder, ...allKeys.filter((key: string) => !preferredOrder.includes(key))]

  return orderedKeys
    .filter((key: string, index: number) => allKeys.includes(key) && orderedKeys.indexOf(key) === index)
    .map((key: string) => ({
      key,
      label: formatDetailLabel(key),
      value: formatDetailValue(details[key])
    }))
    .filter((item: any) => item.value)
}

interface TimelineEventProps {
  entry?: any
  isFirst?: boolean
  isLast?: boolean
}

const TimelineEvent = ({ entry, isFirst, isLast }: TimelineEventProps) => {
  const theme: any = useTheme()
  const detailItems = getDisplayDetails(entry?.details)

  return (
    <TimelineItem sx={{ minHeight: '5rem' }}>
      <StyledTimelineOppositeContent>
        <StyledTypography>{Utility.convertUTCToLocaltime(entry?.time)}</StyledTypography>
      </StyledTimelineOppositeContent>
      <TimelineSeparator>
        <TimelineConnector
          sx={{
            visibility: isFirst ? 'hidden' : 'visible',
            minHeight: isFirst ? 0 : '1.25rem',
            backgroundColor: theme.palette.customColors.OnPrimaryContainer,
            width: '1.5px'
          }}
        />
        <Box
          sx={{
            width: '2rem',
            height: '2rem',
            borderRadius: '50%',
            border: `1px solid ${theme.palette.customColors.OnPrimaryContainer}`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <CheckCircleIcon sx={{ color: theme.palette.customColors.OnPrimaryContainer, fontSize: '1.5rem' }} />
        </Box>
        <TimelineConnector
          sx={{
            visibility: isLast ? 'hidden' : 'visible',
            minHeight: isLast ? 0 : '1.25rem',
            backgroundColor: theme.palette.customColors.OnPrimaryContainer,
            width: '1.5px'
          }}
        />
      </TimelineSeparator>
      <StyledTimelineContent
        container
        spacing={10}
        borderTop={isFirst ? 0 : `1px solid ${theme.palette.customColors.OutlineVariant}`}
      >
        <Grid
          container
          wrap='wrap'
          sx={{ xs: '100%', minWidth: { xs: '100%', sm: '540px' } }}
        >
          <Grid size={{ xs: 12, sm: 3 }} sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', gap: 1 }}>
            <StyledTypography fontWeight={600}>{entry?.title}</StyledTypography>
            <StyledTypography fontWeight={400} fontSize={'0.75rem'}>
              {entry?.details?.medical_record_number}
            </StyledTypography>
          </Grid>
          <Grid
            size={{ xs: 12, sm: 6 }}
            sx={{
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px', py: 0.25, minWidth: 0 }}>
              {detailItems.length > 0 ? (
                detailItems.map((item: any) => (
                  <Box
                    key={item.key}
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: { xs: 0.5, sm: 1 },
                      width: '100%',
                      alignItems: 'flex-start'
                    }}
                  >
                    <StyledTypography
                      fontSize={'1rem'}
                      fontWeight={600}
                      color={theme.palette.customColors.OnSurface}
                      sx={{ flexShrink: 0 }}
                    >
                      {item.label}:
                    </StyledTypography>
                    <StyledTypography
                      fontSize={'1rem'}
                      fontWeight={500}
                      sx={{
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        minWidth: 0,
                        flex: '1 1 auto'
                      }}
                    >
                      {item.value}
                    </StyledTypography>
                  </Box>
                ))
              ) : (
                <StyledTypography fontSize={'0.875rem'} fontWeight={500}>
                  --
                </StyledTypography>
              )}
            </Box>
          </Grid>
          <Grid
            size={{ xs: 12, sm: 3 }}
            sx={{
              textAlign: 'right',
              display: 'flex',
              alignItems: 'center',
              justifyContent: { xs: 'flex-start', sm: 'flex-end' }
            }}
          >
            <StyledTypography fontSize={'0.875rem'} fontWeight={400}>
              {entry?.user_full_name}
            </StyledTypography>
          </Grid>
        </Grid>
      </StyledTimelineContent>
    </TimelineItem>
  )
}

interface TimelineSectionProps {
  section?: any
}

const TimelineSection = ({ section }: TimelineSectionProps) => {
  const theme: any = useTheme()

  if (!section?.entries || section?.entries?.length === 0) return null

  return (
    <Box sx={{}}>
      <StyledSectionHeader>
        <CalendarTodayIcon sx={{ color: theme.palette.customColors.OnPrimaryContainer }} />
        <StyledTypography fontSize={'1.25rem'} color={theme.palette.customColors.OnPrimaryContainer}>
          {Utility.convertUtcToLocalReadableDate(section?.date)}
        </StyledTypography>
      </StyledSectionHeader>
      <StyledTimeline>
        {section?.entries.map((entry: any, index: number) => (
          <TimelineEvent
            key={index + 1}
            entry={entry}
            isFirst={index === 0}
            isLast={index === section?.entries?.length - 1}
          />
        ))}
      </StyledTimeline>
    </Box>
  )
}

interface GroupedTimelineProps {
  medicalSummaryData?: any
  isLoading?: boolean
  isRefetching?: boolean
  searchQuery?: string
  onSearchChange?: (value: string) => void
  onMedicalTypeChange?: any
  medicalType?: any
  onClearSearch?: () => void
  lastTimelineRef?: any
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  setOpenFilterDrawer?: any
  filterCount?: number
  filterDate?: any
  setFilterDate?: any
  hasActiveFilters?: boolean
}

const GroupedTimeline = ({
  medicalSummaryData,
  isLoading,
  isRefetching,
  searchQuery,
  onSearchChange,
  onMedicalTypeChange,
  medicalType,
  onClearSearch,
  lastTimelineRef,
  hasNextPage,
  isFetchingNextPage,
  setOpenFilterDrawer,
  filterCount,
  filterDate,
  setFilterDate,
  hasActiveFilters
}: GroupedTimelineProps) => {
  const { t } = useTranslation()
  const theme: any = useTheme()

  const medicalTypeOptions = [
    { label: t('hospital_module.all_activities'), value: '' },
    { label: t('hospital_module.vaccination'), value: 'vaccination' },
    { label: t('hospital_module.prescription_label'), value: 'prescription' },
    { label: t('hospital_module.clinical_assessment'), value: 'clinical_assessment' },
    { label: t('hospital_module.symptoms'), value: 'symptoms' }
  ]

  const dataLength = medicalSummaryData?.length || 0
  const noData = dataLength === 0
  const filtering = hasActiveFilters

  const Header = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: { xs: 'center', sm: 'space-between' },
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 3,
        mb: '1.5rem'
      }}
    >
      <Search
        borderRadius='4px'
        width={{ xs: '100%', sm: 222 } as any}
        value={searchQuery}
        onChange={(e: any) => onSearchChange && onSearchChange(e.target.value)}
        onClear={onClearSearch}
      />

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <CommonDateRangePickers
          filterDates={filterDate}
          onChange={(start: any, end: any) => setFilterDate({ startDate: start, endDate: end })}
        />

        <FilterButtonWithNotification onClick={() => setOpenFilterDrawer(true)} appliedFiltersCount={filterCount} />
      </Box>
    </Box>
  )

  if (isLoading && !filtering) {
    return (
      <Box sx={{ mt: 2 }}>
        <TimelineSkeleton />
      </Box>
    )
  }

  if (!isLoading && !filtering && noData) {
    return (
      <Box
        sx={{
          width: '100%',
          mt: '2rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <NoMedicalData isDischarged={true} text={undefined} btnText={undefined} />
      </Box>
    )
  }

  if (filtering && noData) {
    return (
      <Box sx={{ width: '100%', mt: '1.5rem' }}>
        {Header}

        {isLoading || isRefetching ? (
          <TimelineSkeleton />
        ) : (
          <Box
            sx={{
              width: '100%',
              mt: 4,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <NoMedicalData isDischarged={true} text={undefined} btnText={undefined} />
          </Box>
        )}
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', mt: '1.5rem' }}>
      {Header}

      {isRefetching && filtering && (
        <Box sx={{ mt: 2 }}>
          <TimelineSkeleton />
        </Box>
      )}

      {!isRefetching &&
        medicalSummaryData?.map((section: any, index: number) => {
          const isLast = index === dataLength - 1

          return (
            <Box key={`${section?.date}-${index}`} ref={isLast ? lastTimelineRef : null} sx={{ mb: '1rem' }}>
              <TimelineSection section={section} />
            </Box>
          )
        })}

      {isFetchingNextPage && (
        <Box sx={{ mt: 2 }}>
          <TimelineSkeleton />
        </Box>
      )}

      {!hasNextPage && dataLength > 9 && (
        <StyledTypography align='center' sx={{ mt: 4, color: theme.palette.text.disabled }}>
          {t('hospital_module.no_more_medical_summary_data_to_load')}
        </StyledTypography>
      )}
    </Box>
  )
}

export default GroupedTimeline

const StyledTimeline = styled(Timeline)(() => ({
  [`& .${timelineOppositeContentClasses.root}`]: {
    flex: 0,
    minWidth: '5rem',
    padding: 0
  },
  margin: 0,
  padding: '0 1rem',
  '& .MuiTimelineItem-root:before': {
    display: 'none'
  }
}))

const StyledTimelineOppositeContent = styled(TimelineOppositeContent)(() => ({
  display: 'flex',
  justifyContent: 'start',
  alignItems: 'center'
}))

const StyledTimelineContent = styled(Grid)<{ borderTop?: any }>(({ theme, borderTop }: any) => ({
  marginLeft: '0.625rem',
  padding: '1.5rem 0',
  borderTop: borderTop || 'none',
  overflowX: 'hidden',

  [`@media (max-width: 768px)`]: {
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',

    '&::-webkit-scrollbar': {
      display: 'none'
    },

    scrollbarWidth: 'none',

    msOverflowStyle: 'none'
  }
}))

const StyledSectionHeader = styled(Box)(({ theme }: any) => ({
  backgroundColor: theme.palette.customColors.Background,
  padding: '1.25rem 1rem',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}))

const StyledTypography = styled(Typography)<{ fontWeight?: number; fontSize?: string; color?: string }>(
  ({ theme, fontWeight, fontSize, color }: any) => ({
    fontSize: fontSize || '1rem',
    fontWeight: fontWeight || 500,
    color: color || theme.palette.customColors.OnSurfaceVariant
  })
)

const TimelineSkeleton = () => {
  return (
    <Timeline
      position='right'
      sx={{
        [`& .${timelineItemClasses.root}:before`]: {
          flex: 0,
          padding: 0
        }
      }}
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <TimelineItem key={index}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, minWidth: 100 }}>
            <Skeleton variant='text' width={50} height={20} />
          </Box>
          <TimelineSeparator
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Skeleton variant='circular' width={32} height={32} />
            {index < 4 && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              width: '100%',
              py: 1,
              pl: 2
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 200 }}>
              <Skeleton variant='text' width={120} height={20} />
              <Skeleton variant='text' width={60} height={16} />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 200 }}>
              <Skeleton variant='text' width={150} height={20} />
              <Skeleton variant='text' width={150} height={18} />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
              <Skeleton variant='text' width={100} height={16} />
            </Box>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  )
}
