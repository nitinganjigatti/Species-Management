import { Avatar, Grid, Typography } from '@mui/material'
import { Box } from '@mui/system'
import TextField from '@mui/material/TextField'
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
import IconButton from '@mui/material/IconButton'

const ActivityLogs = ({ handleSidebarClose, searchValue, setSearchValue }) => {
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          width: '100%',
          gap: '12px',
          justifyContent: 'space-between',
          alignItems: 'start'
          // p: theme => theme.spacing(3, 3.255, 3, 5.255)
          // paddingBottom: 5
        }}
      >
        <Box
          sx={{
            padding: '4px',
            borderRadius: '4px',
            height: '32px',
            width: '32px',
            backgroundColor: theme.palette.customColors.mdAntzNeutral
          }}
        >
          <Icon icon={'ion:time-outline'} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 500, fontSize: '24px' }}>Activity Log</Typography>
          <Typography sx={{ fontWeight: 400, fontSize: '14px' }}>
            View a detailed history of ingredient actions, including updates, activations, and deactivations
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            size='small'
            onClick={() => {
              handleSidebarClose()
            }}
            sx={{ color: 'text.primary' }}
          >
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>
      </Box>
      <Box>
        <TextField
          value={searchValue}
          fullWidth
          label='Search activity'
          InputProps={{
            startAdornment: <Icon style={{ marginRight: 10 }} icon={'ion:search-outline'} />
          }}
          onChange={e => setSearchValue(e.target.value)}
        />
      </Box>

      <Box>
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
      </Box>
    </Box>
  )
}

export default ActivityLogs
