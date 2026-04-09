'use client'

import React from 'react'
import { Grid, Box, FormControl, MenuItem, Select, Skeleton, Typography } from '@mui/material'
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
import Search from 'src/views/utility/Search'
import Utility from 'src/utility'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import NoMedicalData from 'src/views/utility/NoMedicalData'

const medicalTypeOptions = [
  { label: 'All Activities', value: '' },
  { label: 'Vaccination', value: 'vaccination' },
  { label: 'Prescription', value: 'prescription' },
  { label: 'Clinical Assessment', value: 'clinical_assessment' },
  { label: 'Symptoms', value: 'symptoms' }
]

const DETAIL_LABELS = {
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

const HIDDEN_DETAIL_KEYS = new Set(['medical_record_number'])

const isEmptyDetailValue = value => {
  if (value === null || value === undefined) return true
  if (typeof value === 'string' && value.trim() === '') return true
  if (Array.isArray(value)) return value.every(isEmptyDetailValue)
  if (typeof value === 'object') return Object.keys(value).length === 0

  return false
}

const formatDetailLabel = key => {
  if (DETAIL_LABELS[key]) return DETAIL_LABELS[key]

  return key
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase())
}

const getObjectDisplayValue = value => {
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
    .map(item => formatDetailValue(item))
    .filter(Boolean)

  return nestedValues.length ? nestedValues.join(', ') : null
}

const formatDetailValue = value => {
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
    const items = value.map(item => formatDetailValue(item)).filter(Boolean)

    return items.length ? items.join(', ') : null
  }

  if (typeof value === 'object') {
    return getObjectDisplayValue(value)
  }

  return String(value)
}

const getDisplayDetails = details => {
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

  const allKeys = Object.keys(details).filter(key => !HIDDEN_DETAIL_KEYS.has(key))
  const orderedKeys = [...preferredOrder, ...allKeys.filter(key => !preferredOrder.includes(key))]

  return orderedKeys
    .filter((key, index) => allKeys.includes(key) && orderedKeys.indexOf(key) === index)
    .map(key => ({
      key,
      label: formatDetailLabel(key),
      value: formatDetailValue(details[key])
    }))
    .filter(item => item.value)
}

const TimelineEvent = ({ entry, isFirst, isLast }) => {
  const theme = useTheme()
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
          wrap='nowrap' // Prevents wrapping
          sx={{ xs: '100%', minWidth: '540px' }} // Minimum width similar to iPad layout
        >
          <Grid size={{ xs: 3 }} sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', gap: 1 }}>
            <StyledTypography fontWeight={600}>{entry?.title}</StyledTypography>
            <StyledTypography fontWeight={400} fontSize={'0.75rem'}>
              {entry?.details?.medical_record_number}
            </StyledTypography>
          </Grid>
          <Grid
            size={{ xs: 6 }}
            sx={{
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px', py: 0.25, minWidth: 0 }}>
              {detailItems.length > 0 ? (
                detailItems.map(item => (
                  <Box
                    key={item.key}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1,
                      minWidth: 0,
                      flexWrap: 'wrap'
                    }}
                  >
                    <StyledTypography
                      fontSize={'1rem'}
                      fontWeight={600}
                      color={theme.palette.customColors.OnSurface}
                    >
                      {item.label}:
                    </StyledTypography>
                    <StyledTypography
                      fontSize={'1rem'}
                      fontWeight={500}
                      sx={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        minWidth: 0,
                        flex: 1
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
            size={{ xs: 3 }}
            sx={{
              textAlign: 'right',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end'
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

const TimelineSection = ({ section }) => {
  const theme = useTheme()

  if (!section?.entries || section?.entries?.length === 0) return

  return (
    <Box sx={{}}>
      <StyledSectionHeader>
        <CalendarTodayIcon sx={{ color: theme.palette.customColors.OnPrimaryContainer }} />
        <StyledTypography fontSize={'1.25rem'} color={theme.palette.customColors.OnPrimaryContainer}>
          {Utility.convertUtcToLocalReadableDate(section?.date)}
        </StyledTypography>
      </StyledSectionHeader>
      <StyledTimeline>
        {section?.entries.map((entry, index) => (
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
}) => {
  const theme = useTheme()

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
        width={{ xs: '100%', sm: 222 }}
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        onClear={onClearSearch}
      />

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <CommonDateRangePickers
          filterDates={filterDate}
          onChange={(start, end) => setFilterDate({ startDate: start, endDate: end })}
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
        <NoMedicalData isDischarged={true} />
      </Box>
    )
  }

  if (filtering && noData) {
    return (
      <Box sx={{ width: '100%', mt: '1.5rem' }}>
        {Header}

        {/* Show skeleton while filtering refetch or initial load */}
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
            <NoMedicalData isDischarged={true} />
          </Box>
        )}
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', mt: '1.5rem' }}>
      {Header}

      {/* If filtering and refetching, show skeleton for data section */}
      {isRefetching && filtering && (
        <Box sx={{ mt: 2 }}>
          <TimelineSkeleton />
        </Box>
      )}

      {/* Data List */}
      {!isRefetching &&
        medicalSummaryData?.map((section, index) => {
          const isLast = index === dataLength - 1

          return (
            <Box key={`${section?.date}-${index}`} ref={isLast ? lastTimelineRef : null} sx={{ mb: '1rem' }}>
              <TimelineSection section={section} />
            </Box>
          )
        })}

      {/* Show skeleton only when fetching more pages */}
      {isFetchingNextPage && (
        <Box sx={{ mt: 2 }}>
          <TimelineSkeleton />
        </Box>
      )}

      {/*  Show "No more data" */}
      {!hasNextPage && dataLength > 9 && (
        <StyledTypography align='center' sx={{ mt: 4, color: theme.palette.text.disabled }}>
          No more medical summary data to load
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

const StyledTimelineContent = styled(Grid)(({ theme, borderTop }) => ({
  marginLeft: '0.625rem',
  padding: '1.5rem 0',
  borderTop: borderTop || 'none',
  overflowX: 'hidden',

  [`@media (max-width: 768px)`]: {
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',

    // Hide scrollbar (Chrome, Safari)
    '&::-webkit-scrollbar': {
      display: 'none'
    },

    // Hide scrollbar (Firefox)
    scrollbarWidth: 'none',

    // Hide scrollbar (IE/Edge)
    msOverflowStyle: 'none'
  }
}))

const StyledSectionHeader = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.customColors.Background,
  padding: '1.25rem 1rem',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}))

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 500,
  color: color || theme.palette.customColors.OnSurfaceVariant
}))

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
