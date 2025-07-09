import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import {
  Button,
  Card,
  Typography,
  Box,
  TextField,
  Avatar,
  Divider,
  IconButton,
  MenuItem,
  Menu,
  Drawer
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import React, { useState } from 'react'
import { useTheme } from '@mui/material/styles'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import StickyTable from 'src/views/table/sticky-table'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import MuiTimeline from '@mui/lab/Timeline'
import { styled } from '@mui/material/styles'
// import {  TimelineConnector, TimelineContent, TimelineItem, TimelineSeparator } from '@mui/lab'

const AnimalIncidents = () => {
  const theme = useTheme()

  const [activtyLogSideBar, setActivtyLogSideBar] = useState(false)

  // Inside your component
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  const handleMenuOpen = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const activtyLogData = [
    {
      type: 'Animal Found',
      color: '#00A046',
      date: '3 Dec 2025',
      time: '3:34 PM',
      details: {
        'Physical condition': 'Minor scratches on rear leg',
        'Behaviour observation': 'Restless',
        'Health assessment': 'Under observation in Vet Zone A',
        'Injury details': 'Documented, no critical concern',
        'Immediate action taken': 'Caretaker assigned and sedated for treatment'
      },
      createdBy: {
        name: 'Sourav Tambe',
        timestamp: '14 Apr 2024 | 12:35 PM'
      }
    },
    {
      type: 'Animal Missing',
      color: '#FF5630',
      date: '3 Dec 2025',
      time: '3:34 PM',
      details: {
        'Missing Since': '3 Dec 2025 • 3:34 PM',
        'Last seen or escaped from': 'Cage from Gagav',
        'Animal behaviour before incident': 'Aggressive',
        'Actions taken': 'Allotted control room',
        'Steps to prevent future incidents': 'Informed'
      },
      createdBy: {
        name: 'Sourav Tambe',
        timestamp: '14 Apr 2024 | 12:35 PM'
      }
    },
    {
      type: 'Animal Found',
      color: '#00A046',
      date: '5 Dec 2025',
      time: '10:20 AM',
      details: {
        'Physical condition': 'Healthy but dehydrated',
        'Behaviour observation': 'Calm',
        'Health assessment': 'Given fluids and under observation',
        'Injury details': 'None',
        'Immediate action taken': 'Returned to enclosure'
      },
      createdBy: {
        name: 'Nikita Rao',
        timestamp: '15 Apr 2024 | 11:20 AM'
      }
    },
    {
      type: 'Animal Missing',
      color: '#FF5630',
      date: '6 Dec 2025',
      time: '2:45 PM',
      details: {
        'Missing Since': '6 Dec 2025 • 2:45 PM',
        'Last seen or escaped from': 'Section B Gate',
        'Animal behaviour before incident': 'Highly alert',
        'Actions taken': 'Area cordoned off',
        'Steps to prevent future incidents': 'Review gate sensors'
      },
      createdBy: {
        name: 'Amit Verma',
        timestamp: '16 Apr 2024 | 9:15 AM'
      }
    },
    {
      type: 'Animal Found',
      color: '#00A046',
      date: '7 Dec 2025',
      time: '6:10 AM',
      details: {
        'Physical condition': 'Minor bruises',
        'Behaviour observation': 'Tired',
        'Health assessment': 'Observation ongoing',
        'Injury details': 'Soft tissue bruising',
        'Immediate action taken': 'Shifted to recovery zone'
      },
      createdBy: {
        name: 'Rohit Sharma',
        timestamp: '17 Apr 2024 | 1:00 PM'
      }
    },
    {
      type: 'Animal Missing',
      color: '#FF5630',
      date: '9 Dec 2025',
      time: '11:50 PM',
      details: {
        'Missing Since': '9 Dec 2025 • 11:50 PM',
        'Last seen or escaped from': 'Feeding area',
        'Animal behaviour before incident': 'Stressed',
        'Actions taken': 'Emergency alert triggered',
        'Steps to prevent future incidents': 'Added night guards'
      },
      createdBy: {
        name: 'Priya Nair',
        timestamp: '18 Apr 2024 | 8:40 PM'
      }
    },
    {
      type: 'Animal Found',
      color: '#00A046',
      date: '10 Dec 2025',
      time: '9:15 AM',
      details: {
        'Physical condition': 'Stable',
        'Behaviour observation': 'Relaxed',
        'Health assessment': 'Vet cleared',
        'Injury details': 'None',
        'Immediate action taken': 'Returned to normal habitat'
      },
      createdBy: {
        name: 'Anjali Mehta',
        timestamp: '19 Apr 2024 | 9:00 AM'
      }
    },
    {
      type: 'Animal Missing',
      color: '#FF5630',
      date: '11 Dec 2025',
      time: '5:00 PM',
      details: {
        'Missing Since': '11 Dec 2025 • 5:00 PM',
        'Last seen or escaped from': 'Veterinary block',
        'Animal behaviour before incident': 'Agitated',
        'Actions taken': 'Security dispatched',
        'Steps to prevent future incidents': 'Strengthened barrier protocols'
      },
      createdBy: {
        name: 'Rahul Deshmukh',
        timestamp: '20 Apr 2024 | 4:45 PM'
      }
    }
  ]

  const handleScroll = async e => {
    // const container = e.target
    // // Check if the user has reached the bottom
    // if (
    //   container.scrollHeight - Math.round(container.scrollTop) === container.clientHeight &&
    //   activtyLogData.length < activtyLogCount
    // ) {
    //   // User has reached the bottom, perform your action here
    //   setPage_no(++page_no)
    //   setReachedEnd(true)
    //   const params = { page_no }
    //   try {
    //     getActivityLogs(egg_id, params).then(res => {
    //       if (res?.success) {
    //         if (res?.data?.result?.length > 0) {
    //           setActivtyLogData(prev => [...prev, ...res?.data?.result])
    //           setReachedEnd(false)
    //         } else {
    //           setReachedEnd(false)
    //         }
    //       } else {
    //         setReachedEnd(false)
    //       }
    //     })
    //   } catch (error) {
    //     console.log('error', error)
    //   }
    // }
  }

  const IncidentTimeline = () => {
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
    return (
      <Box sx={{ display: 'flex', marginLeft: 'auto', cursor: 'pointer' }}>
        <Drawer
          anchor='right'
          open={activtyLogSideBar}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { width: ['100%', 520] },
            height: '100vh',
            '& .css-e1dg5m-MuiCardContent-root': {
              pt: 0
            }
          }}
        >
          <Box
            sx={{
              pb: 4,
              pt: 4,
              px: 4,
              position: 'sticky',
              top: 0,
              backgroundColor: theme.palette.primary.contrastText,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              zIndex: 100
            }}
          >
            <Box
              className='sidebar-header'
              sx={{
                display: 'flex',
                width: '100%',
                gap: '12px',
                justifyContent: 'space-between',
                alignItems: 'start'
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
                <Typography sx={{ fontWeight: 500, fontSize: '24px' }}>Incident Timeline</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton size='small' onClick={() => setActivtyLogSideBar(false)} sx={{ color: 'text.primary' }}>
                  <Icon icon='mdi:close' fontSize={24} />
                </IconButton>
              </Box>
            </Box>
          </Box>
          <Box onScroll={handleScroll} sx={{ px: 4, pt: 8, overflowY: 'auto' }}>
            {activtyLogData?.length > 0 ? (
              <Timeline>
                {activtyLogData?.map((item, index) => (
                  <TimelineItem key={index}>
                    <TimelineSeparator
                      sx={{
                        '& span': {
                          borderLeft: `2px dashed ${theme.palette.primary.light}`
                          // backgroundColor:
                          //   item.status === 'Necropsy' || item.status === 'Discard' || item.status === 'Rotten'
                          //     ? theme.palette.formContent.tertiary
                          //     : theme.palette.primary.light
                        }
                      }}
                    >
                      <Box
                        sx={{
                          // border: '2px solid ',
                          backgroundColor:
                            item.color === 'Necropsy' || item.status === 'Discard' || item.status === 'Rotten'
                              ? theme.palette.formContent.tertiary
                              : theme.palette.primary.light,
                          boxSizing: 'border-box',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      ></Box>
                      {activtyLogData.length === index + 1 ? null : <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent
                      sx={{
                        ml: 4,
                        borderRadius: '8px',
                        position: 'relative',
                        top: 14,
                        p: 0
                      }}
                    >
                      <Box
                        sx={{
                          flexGrow: 1,
                          backgroundColor: item.type === 'Animal Found' ? '#E7F7ED' : '#FFF1EF',
                          borderRadius: 2,
                          p: 2
                        }}
                      >
                        <Typography
                          sx={{
                            color: item.color,
                            fontWeight: 600,
                            fontSize: 14,
                            mb: 1
                          }}
                        >
                          {item.type}
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography sx={{ fontWeight: 500 }}>
                            {item.type === 'Animal Found' ? 'Found On' : 'Missing Since'}
                          </Typography>
                          <Typography>
                            {item.date} • {item.time}
                          </Typography>

                          {Object.entries(item.details).map(([key, value]) => (
                            <React.Fragment key={key}>
                              <Typography sx={{ fontWeight: 500 }}>{key}</Typography>
                              <Typography>{value}</Typography>
                            </React.Fragment>
                          ))}
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box>
                            <Typography sx={{ fontSize: 12, fontWeight: 500 }}>{item.name}</Typography>
                            <Typography sx={{ fontSize: 10, color: 'gray' }}>{item.timestamp}</Typography>
                          </Box>
                        </Box>
                      </Box>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            ) : null}
          </Box>
          {/* {reachedEnd ? <LinearProgress /> : null} */}
        </Drawer>{' '}
      </Box>
    )
  }

  return (
    <>
      <Card sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography
              sx={{
                fontSize: 20,
                letterSpacing: 0,
                fontWeight: 500,
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              Incidents (2)
            </Typography>
            <Button onClick={() => setActivtyLogSideBar(true)} variant='contained' sx={{ height: '40px' }}>
              <Icon icon='mdi:plus' />
              Report incident
            </Button>
          </Box>
          <Box
            sx={{
              padding: '8px 12px 8px 8px',
              backgroundColor: theme.palette.customColors.OnBackground,
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gp: 4
            }}
          >
            <Box sx={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  backgroundColor: theme.palette.customColors.Tertiary,
                  borderRadius: '8px',
                  padding: '12px'
                }}
              >
                <Typography
                  sx={{ textAlign: 'center', color: theme.palette.primary.contrastText, fontSize: 14, fontWeight: 600 }}
                >
                  12 Dec 2025
                </Typography>
                <Typography
                  sx={{ textAlign: 'center', color: theme.palette.primary.contrastText, fontSize: 14, fontWeight: 600 }}
                >
                  03:20 PM
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: 20, fontWeight: 500 }}>
                  INC00410
                </Typography>
                <Typography sx={{ color: theme.palette.customColors.Tertiary, fontSize: 16, fontWeight: 500 }}>
                  Animal Missing
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: 14, fontWeight: 400 }}>
                Site
              </Typography>
              <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: 16, fontWeight: 500 }}>
                Bannerghatta East 12A
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: 14, fontWeight: 400 }}>
                Section
              </Typography>
              <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: 16, fontWeight: 500 }}>
                Hillcrest Wildlife Center
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: 14, fontWeight: 400 }}>
                Enclosure
              </Typography>
              <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: 16, fontWeight: 500 }}>
                Enclosure-234
              </Typography>
            </Box>
            <Box>
              <IconButton size='small' onClick={handleMenuOpen}>
                <Icon icon='mdi:dots-vertical' />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem onClick={handleMenuClose}>View Details</MenuItem>
                <MenuItem onClick={handleMenuClose}>Edit Incident</MenuItem>
                <MenuItem onClick={handleMenuClose}>Misreport Found</MenuItem>
                <MenuItem onClick={handleMenuClose}>Misreport Missing</MenuItem>
              </Menu>
            </Box>
          </Box>
        </Box>
      </Card>

      <Box
        sx={{
          backgroundColor: theme.palette.primary.contrastText,
          borderRadius: '8px',
          border: `1px solid ${theme.palette.customColors.OutlineVariant},`,
          p: '24px'
        }}
      >
        <Box
          sx={{
            backgroundColor: theme.palette.customColors.OnBackground,
            padding: '12px',
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Typography
              sx={{
                fontSize: 16,
                letterSpacing: 0,
                fontWeight: 500,
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              INC00410
            </Typography>
            <Typography
              sx={{
                fontSize: 20,
                letterSpacing: 0,
                fontWeight: 600,
                color: theme.palette.customColors.Tertiary
              }}
            >
              Animal Missing
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Typography
              sx={{
                fontSize: 14,
                letterSpacing: 0,
                fontWeight: 400,
                color: theme.palette.customColors.neutralSecondary
              }}
            >
              Missing since
            </Typography>
            <Typography
              sx={{
                fontSize: 16,
                letterSpacing: 0,
                fontWeight: 500,
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              10 Apr 2024 • 12:28 PM
            </Typography>
          </Box>
        </Box>
        {/* <SpeciesCard
            species={{ default_icon: 'ghj', complete_name: 'Trichoglossus moluccanus', common_name: 'Rainbow Lorikeet' }}
          /> */}
      </Box>

      <IncidentTimeline />
    </>
  )
}

export default AnimalIncidents
