import React, { useState } from 'react'
import { Box, FormControl, MenuItem, Select, Typography } from '@mui/material'
import Timeline from '@mui/lab/Timeline'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import { useTheme, styled } from '@mui/material/styles'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { timelineOppositeContentClasses } from '@mui/lab'
import Search from 'src/views/utility/Search'
import { FilterButton } from 'src/views/utility/render-snippets'

const medicalTypes = [
  { label: 'All Activities', value: '' },
  { label: 'Vaccination', value: 'vaccination' },
  { label: 'Prescription', value: 'prescription' },
  { label: 'Clinical Assessment', value: 'clinical_assessment' },
  { label: 'Symptoms', value: 'symptoms' },
  { label: 'Treatment', value: 'treatment' }
]

const defaultTimelineData = [
  {
    date: '01 Jan 2025',
    events: [
      {
        id: 1,
        time: '12:15 AM',
        title: 'Prescription added',
        description: 'Dolo Tablet 650mg, Everyday, for 2weeks, 3 times\nLorem ipsum doalr sit amet',
        doctor: 'Dr Prajwal Shetty'
      },
      {
        id: 2,
        time: '11:22 AM',
        title: 'Vaccination Stopped',
        description: 'Savavet kiwof plus\nReason for stopping lorem ipsum dolar sit amet',
        doctor: 'Dr Prajwal Shetty'
      }
    ]
  },
  {
    date: '29 Dec 2024',
    events: [
      {
        id: 3,
        time: '12:15 AM',
        title: 'Prescription added',
        description: 'Dolo Tablet 650mg, Everyday, for 2weeks, 3 times\nLorem ipsum doalr sit amet',
        doctor: 'Dr Prajwal Shetty'
      },
      {
        id: 4,
        time: '11:22 AM',
        title: 'Vaccination Stopped',
        description: 'Savavet kiwof plus\nReason for stopping lorem ipsum dolar sit amet',
        doctor: 'Dr Prajwal Shetty'
      }
    ]
  }
]

const TimelineEvent = ({ event, isFirst, isLast }) => {
  const theme = useTheme()

  return (
    <TimelineItem sx={{ minHeight: '80px' }}>
      <StyledTimelineOppositeContent>
        <Typography variant='body2' sx={{ color: theme.palette.customColors.OnPrimaryContainer, fontSize: '1rem' }}>
          {event.time}
        </Typography>
      </StyledTimelineOppositeContent>
      <TimelineSeparator>
        <TimelineConnector
          sx={{
            visibility: isFirst ? 'hidden' : 'visible',
            minHeight: isFirst ? 0 : '20px',
            color: theme.palette.customColors.OnPrimaryContainer
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
            minHeight: isLast ? 0 : '20px'
          }}
        />
      </TimelineSeparator>
      <StyledTimelineContent borderTop={isFirst ? 0 : `1px solid ${theme.palette.customColors.OutlineVariant}`}>
        <Box sx={{ width: '25%' }}>
          <Typography variant='h6' component='span'>
            {event.title}
          </Typography>
        </Box>
        <Box sx={{ width: '50%' }}>
          <Typography sx={{ color: theme.palette.customColors.OnPrimaryContainer, fontSize: '1rem' }}>
            {event.description}
          </Typography>
        </Box>
        <Box sx={{ width: '25%', textAlign: 'right' }}>
          <Typography variant='caption'>{event.doctor}</Typography>
        </Box>
      </StyledTimelineContent>
    </TimelineItem>
  )
}

const TimelineSection = ({ section }) => {
  const theme = useTheme()

  const sectionHeaderStyles = {
    bgcolor: theme.palette.customColors.Background,
    px: '1rem',
    py: '0.75rem',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: 2
  }

  return (
    <Box mb={3}>
      <Box sx={sectionHeaderStyles}>
        <CalendarTodayIcon sx={{ color: theme.palette.customColors.OnPrimaryContainer }} />
        <Typography
          variant='subtitle1'
          sx={{ fontSize: '1.25rem', fontWeight: 500, color: theme.palette.customColors.OnPrimaryContainer }}
        >
          {section.date}
        </Typography>
      </Box>
      <StyledTimeline>
        {section.events.map((event, index) => (
          <TimelineEvent
            key={event.id}
            event={event}
            isFirst={index === 0}
            isLast={index === section.events.length - 1}
          />
        ))}
      </StyledTimeline>
    </Box>
  )
}

const GroupedTimeline = ({ data = defaultTimelineData }) => {
  const [medicalType, setMedicalType] = useState('')
  const [searchValue, setSearchValue] = useState('')

  return (
    <>
      <Box sx={{ width: '100%', mt: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Search value={searchValue} onChange={e => setSearchValue(e.target.value)} />
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'flex-end' }}>
              <FormControl sx={{ m: 1, minWidth: 120 }}>
                <Select
                  value={medicalType}
                  onChange={e => setMedicalType(e.target.value)}
                  displayEmpty
                  inputProps={{ 'aria-label': 'Without label' }}
                  sx={{
                    height: 40,
                    width: 200
                  }}
                >
                  {medicalTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FilterButton />
            </Box>
          </Box>
          {data.map(section => (
            <TimelineSection key={section.date} section={section} />
          ))}
        </>
      </Box>
    </>
  )
}

export default GroupedTimeline

// Styled Components
const StyledTimeline = styled(Timeline)(({ theme }) => ({
  [`& .${timelineOppositeContentClasses.root}`]: {
    flex: 0,
    minWidth: '80px',
    padding: 0,
    margin: 0
  },
  padding: 0,
  margin: 0,
  '& .MuiTimelineItem-root:before': {
    display: 'none'
  }
}))

const StyledTimelineOppositeContent = styled(TimelineOppositeContent)(({ theme }) => ({
  margin: 0,
  padding: 0,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
}))

const StyledTimelineContent = styled(TimelineContent)(({ theme, borderTop }) => ({
  display: 'flex',
  alignItems: 'center',
  margin: 0,
  padding: 0,
  paddingTop: '1rem',
  paddingBottom: '1rem',
  marginLeft: '1rem',
  marginRight: '1rem',
  width: '100%',
  borderTop: borderTop || 'none'
}))
