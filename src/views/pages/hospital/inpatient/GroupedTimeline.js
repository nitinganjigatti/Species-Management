import React from 'react'
import { Grid, Box, FormControl, MenuItem, Select, Skeleton, Tooltip, Typography } from '@mui/material'
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
import { FilterButton } from 'src/views/utility/render-snippets'
import Utility from 'src/utility'
import NoDataFound from 'src/views/utility/NoDataFound'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'

const medicalTypeOptions = [
  { label: 'All Activities', value: '' },
  { label: 'Vaccination', value: 'vaccination' },
  { label: 'Prescription', value: 'prescription' },
  { label: 'Clinical Assessment', value: 'clinical_assessment' },
  { label: 'Symptoms', value: 'symptoms' }
]

const TimelineEvent = ({ entry, isFirst, isLast }) => {
  const theme = useTheme()

  const snakeToTitleCase = title => {
    if (!title || typeof title !== 'string') return 'NA'

    return title
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

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
            width: '1.6px'
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
            width: '1.6px'
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
          <Grid size={{ xs: 3 }} sx={{ display: 'flex', flexDirection: 'column' }}>
            <TextEllipsisWithModal
              placement='top'
              enableDialog={false}
              text={snakeToTitleCase(entry?.title)}
              style={{
                fontWeight: 600,
                fontSize: '1rem',
                color: theme.palette.customColors.OnSurfaceVariant,
                maxWidth: '100%'
              }}
            />
            <TextEllipsisWithModal
              enableDialog={false}
              text={snakeToTitleCase(
                entry?.details?.medical_record_number ? entry?.details?.medical_record_number : 'NA'
              )}
              style={{
                fontWeight: 400,
                fontSize: '0.75rem',
                color: theme.palette.customColors.OnSurfaceVariant,
                maxWidth: '100%'
              }}
            />
          </Grid>
          <Grid
            size={{ xs: 6 }}
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              textAlign: entry?.complaints ? 'justify' : 'center'
            }}
          >
            <StyledTypography fontSize={'0.875rem'} fontWeight={500}>
              <Tooltip title={entry?.complaints || 'NA'} arrow placement='top'>
                {entry?.details?.complaints || 'NA'}
              </Tooltip>
            </StyledTypography>
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

  if (!section?.entries || section.entries.length === 0) return

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
  searchQuery,
  onSearchChange,
  onMedicalTypeChange,
  medicalType,
  onClearSearch,
  lastTimelineRef,
  hasNextPage,
  isFetchingNextPage
}) => {
  const theme = useTheme()

  return (
    <>
      <Box sx={{ width: '100%', mt: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <>
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
              borderRadius={'4px'}
              width={{ xs: '100%', sm: 222 }}
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              onClear={onClearSearch}
            />
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 120, flex: 1, m: 0 }}>
                <Select
                  value={medicalType}
                  onChange={e => onMedicalTypeChange(e.target.value)}
                  displayEmpty
                  inputProps={{ 'aria-label': 'Without label' }}
                  sx={{
                    height: 40,
                    width: { xs: '100%', sm: 200 },
                    borderRadius: '4px'
                  }}
                >
                  {medicalTypeOptions?.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FilterButton />
            </Box>
          </Box>

          {isLoading ? (
            <TimelineSkeleton />
          ) : medicalSummaryData?.length > 0 ? (
            <>
              {medicalSummaryData?.map((section, index) => {
                const isLast = index === medicalSummaryData.length - 1

                return (
                  <Box key={`${section?.date}-${index}`} ref={isLast ? lastTimelineRef : null} sx={{ mb: '1rem' }}>
                    <TimelineSection section={section} />
                  </Box>
                )
              })}
              {/* Show skeleton only when fetching more pages and we already have data */}
              {isFetchingNextPage && medicalSummaryData.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <TimelineSkeleton />
                </Box>
              )}

              {/*  Show "No more data" */}
              {!hasNextPage && medicalSummaryData.length > 0 && (
                <StyledTypography align='center' sx={{ mt: 4, color: theme.palette.text.disabled }}>
                  No more medical summary data to load
                </StyledTypography>
              )}
            </>
          ) : (
            <NoDataFound variant='Seal' height={300} width={300} />
          )}
        </>
      </Box>
    </>
  )
}

export default GroupedTimeline

// Styled Components
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

// skeleton loader
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
