import React from 'react'
import { Box, Typography } from '@mui/material'
import Timeline from '@mui/lab/Timeline'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent'
import { useTheme, styled } from '@mui/material/styles'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { timelineOppositeContentClasses } from '@mui/lab'
import { useMediaQuery } from '@mui/system'

const defaultTimelineData = [
  {
    id: 1,
    time: '12:15 AM',
    date: '1st Jan 2025',
    title: 'Prescription added',
    label_id: 'MED - 12345/25',
    description: 'Dolo Tablet 650mg, Everyday, for 2weeks, 3 times\nLorem ipsum doalr sit amet',
    doctor: 'Dr Prajwal Shetty'
  },
  {
    id: 2,
    time: '11:22 AM',
    date: '1st Jan 2025',
    title: 'Vaccination Stopped',
    label_id: 'VAC - 12345/25',
    description: 'Savavet kiwof plus\nReason for stopping lorem ipsum dolar sit amet',
    doctor: 'Dr Prajwal Shetty'
  },
  {
    id: 3,
    time: '12:15 AM',
    date: '29th Dec 2024',
    title: 'Prescription added',
    label_id: 'MED - 12345/25',
    description: 'Dolo Tablet 650mg, Everyday, for 2weeks, 3 times\nLorem ipsum doalr sit amet',
    doctor: 'Dr Prajwal Shetty'
  },
  {
    id: 4,
    time: '11:22 AM',
    date: '29th Dec 2024',
    title: 'Vaccination Stopped',
    label_id: 'VAC - 12345/25',
    description: 'Savavet kiwof plus\nReason for stopping lorem ipsum dolar sit amet',
    doctor: 'Dr Prajwal Shetty'
  }
]

const TimelineEvent = ({ event, isFirst, isLast }) => {
  const theme = useTheme()

  return (
    <TimelineItem sx={{ minHeight: '90px', alignItems: 'flex-start' }}>
      <StyledTimelineOppositeContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <Typography
            variant='body2'
            sx={{ color: theme.palette.customColors.OnPrimaryContainer, fontWeight: 600, fontSize: '0.8rem' }}
          >
            {event.date}
          </Typography>
          <Typography variant='body2' sx={{ color: theme.palette.customColors.OnPrimaryContainer, fontSize: '0.9rem' }}>
            {event.time}
          </Typography>
        </Box>
      </StyledTimelineOppositeContent>
      <TimelineSeparator
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '100%'
        }}
      >
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
      <StyledTimelineContent>
        <Box
          sx={{
            width: { xs: '100%', sm: '30%', md: '25%' },
            mb: { xs: 1, sm: 0 }
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: '14px', md: '16px' },
              fontWeight: 600,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            {event.title}
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '11px', md: '12px' },
              fontWeight: 400,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            {event.label_id}
          </Typography>
        </Box>
        <Box
          sx={{
            width: { xs: '100%', sm: '40%', md: '50%' },
            mb: { xs: 1, sm: 0 }
          }}
        >
          <Typography
            sx={{ color: theme.palette.customColors.OnPrimaryContainer, fontSize: { xs: '0.9rem', md: '1rem' } }}
          >
            {event.description}
          </Typography>
        </Box>
        <Box
          sx={{
            width: { xs: '100%', sm: '30%', md: '25%' },
            textAlign: { xs: 'left', sm: 'right' }
          }}
        >
          <Typography variant='caption'>{event.doctor}</Typography>
        </Box>
      </StyledTimelineContent>
    </TimelineItem>
  )
}

const GroupedTimeline = ({ data = defaultTimelineData }) => {
  const theme = useTheme()

  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const isMediumOrLarger = useMediaQuery(theme.breakpoints.up('md'))

  return (
    <Box sx={{ width: '100%', mt: '2rem' }}>
      <StyledTimeline isMediumScreen={isMediumOrLarger}>
        {data.map((event, index) => (
          <TimelineEvent key={event.id} event={event} isFirst={index === 0} isLast={index === data.length - 1} />
        ))}
      </StyledTimeline>
    </Box>
  )
}

export default GroupedTimeline

// Styled Components
const StyledTimeline = styled(Timeline)(({ theme, isMediumScreen }) => ({
  [`& .${timelineOppositeContentClasses.root}`]: {
    flex: '0 0 120px',
    minWidth: '120px',
    padding: 0,
    margin: 0
  },
  padding: 0,
  margin: 0,
  '& .MuiTimelineItem-root:before': {
    display: 'none'
  },
  '& .MuiTimelineItem-root:not(:last-of-type) .MuiTimelineContent-root': {
    marginBottom: 0
  },
  '& .MuiTimelineContent-root': {
    paddingTop: 0,
    paddingBottom: 0,
    marginTop: 0
  },
  '& .MuiTimelineConnector-root': {
    minHeight: isMediumScreen ? '60px' : '100px'
  }
}))

const StyledTimelineOppositeContent = styled(TimelineOppositeContent)(({ theme }) => ({
  margin: 0,
  padding: 0,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start'
}))

const StyledTimelineContent = styled(TimelineContent)(({ borderTop }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  width: '100%'
}))
