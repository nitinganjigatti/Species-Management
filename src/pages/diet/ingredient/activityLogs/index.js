import { Avatar, Grid, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React from 'react'
import { useTheme } from '@mui/material/styles'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import MuiTimeline from '@mui/lab/Timeline'
import Icon from 'src/@core/components/icon'
import { styled } from '@mui/material/styles'

const ActivityLogs = () => {
  const theme = useTheme()
  // Styled Timeline component
  const Timeline = styled(MuiTimeline)({
    paddingLeft: 0,
    paddingRight: 0,
    '& .MuiTimelineItem-root': {
      width: '100%',
      '&:before': {
        display: 'none'
      }
    }
  })

  const ImgShoe = styled('img')(({ theme }) => ({
    borderRadius: theme.shape.borderRadius
  }))

  const events = [
    {
      date: '22 Mar 2024',
      logs: [
        {
          time: '10:00AM',
          activity: 'Ingredient activated',
          user: 'Jordan Stevenson',
          details: 'Activated ingredient'
        },
        {
          time: '09:56AM',
          activity: 'Ingredient deactivated',
          user: 'Jordan Stevenson',
          details: 'Deactivated ingredient'
        },
        {
          time: '09:00AM',
          activity: 'Swapped ingredient',
          user: 'Jordan Stevenson',
          details: 'Swapped ingredient ING00012 with ING00023'
        }
      ]
    },
    {
      date: '21 Mar 2024',
      logs: [
        {
          time: '12:00PM',
          activity: 'Ingredient edited',
          user: 'Jordan Stevenson',
          details: 'Ingredient details edited'
        },
        {
          time: '6:00PM',
          activity: 'Ingredient deactivated',
          user: 'Jordan Stevenson',
          details: 'Deactivated ingredient'
        },
        {
          time: '10:00AM',
          activity: 'Swapped ingredient',
          user: 'Jordan Stevenson',
          details: 'Swapped ingredient ING0001 with ...'
        }
      ]
    },
    {
      date: '22 Mar 2024',
      logs: [
        {
          time: '10:00AM',
          activity: 'Ingredient activated',
          user: 'Jordan Stevenson',
          details: 'Activated ingredient'
        },
        {
          time: '09:56AM',
          activity: 'Ingredient deactivated',
          user: 'Jordan Stevenson',
          details: 'Deactivated ingredient'
        },
        {
          time: '09:00AM',
          activity: 'Swapped ingredient',
          user: 'Jordan Stevenson',
          details: 'Swapped ingredient ING00012 with ING00023'
        }
      ]
    },
    {
      date: '21 Mar 2024',
      logs: [
        {
          time: '12:00PM',
          activity: 'Ingredient edited',
          user: 'Jordan Stevenson',
          details: 'Ingredient details edited'
        },
        {
          time: '6:00PM',
          activity: 'Ingredient deactivated',
          user: 'Jordan Stevenson',
          details: 'Deactivated ingredient'
        },
        {
          time: '10:00AM',
          activity: 'Swapped ingredient',
          user: 'Jordan Stevenson',
          details: 'Swapped ingredient ING0001 with ...'
        }
      ]
    }
  ]
  return (
    <>
      {events.map((item, index) => (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs='auto'>
              <Box
                sx={{
                  display: 'flex',
                  p: '8px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.palette.primary.dark}`
                }}
              >
                <Typography
                  sx={{ fontSize: 14, fontWeight: 500, lineHeight: 'normal', color: theme.palette.primary.dark }}
                >
                  Today,&nbsp;
                </Typography>
                <Typography
                  sx={{ fontSize: 14, fontWeight: 500, lineHeight: 'normal', color: theme.palette.primary.dark }}
                >
                  {item.date}
                </Typography>
              </Box>
            </Grid>

            <Grid
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              item
              xs
            >
              <Box
                sx={{
                  flex: 1,
                  height: '1px',
                  background: 'linear-gradient(to right, #999 50%, transparent 50%)',
                  backgroundSize: '8px 1px'
                }}
              ></Box>
            </Grid>
          </Grid>
          <Timeline>
            {item.logs.map((item, index) => (
              <TimelineItem>
                <TimelineSeparator>
                  {/* <TimelineDot color='success' /> */}
                  <Box sx={{ border: '1px solid ', height: '25px', borderRadius: '4px' }}>
                    <Icon icon={'mdi:clipboard'} />
                  </Box>
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent sx={{ py: 0, mb: '20px' }}>
                  <Typography
                    variant='body2'
                    sx={{ mr: 2, fontSize: 16, fontWeight: 500, lineHeight: 'normal', mb: '12px' }}
                  >
                    {item.activity}
                  </Typography>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      justifyContent: 'space-between',
                      mb: '20px'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Avatar src='/images/avatars/1.png' sx={{ width: '2rem', height: '2rem', mr: 2 }} />
                      <Box>
                        <Typography
                          variant='subtitle2'
                          sx={{
                            color: theme.palette.customColors.OnSurfaceVariant,
                            fontSize: 14,
                            fontWeight: 500,
                            lineHeight: 'normal'
                          }}
                        >
                          {item.user}
                        </Typography>
                        <Typography
                          variant='body2'
                          sx={{
                            fontSize: 14,
                            fontWeight: 400,
                            lineHeight: 'normal',
                            color: theme.palette.customColors.neutralSecondary
                          }}
                        >
                          {item.details}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ alignSelf: 'self-start' }}>
                      <Typography
                        sx={{
                          color: theme.palette.customColors.OnSurfaceVariant,
                          fontSize: 14,
                          fontWeight: 500,
                          lineHeight: 'normal'
                        }}
                        variant='caption'
                      >
                        {item.time}
                      </Typography>
                    </Box>
                  </Box>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </Box>
      ))}
    </>
  )
}

export default ActivityLogs
