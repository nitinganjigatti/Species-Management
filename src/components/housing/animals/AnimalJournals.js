import React, { useState } from 'react'
import { Box, Typography, Button, IconButton, Switch, Divider, Avatar, Chip, TextField, Tooltip, Autocomplete } from '@mui/material'
import { Icon } from '@iconify/react'
import { useTheme } from '@mui/material/styles'
import UserInfoCard from 'src/views/utility/insights/UserInfoCard'
import { styled } from '@mui/material/styles'
import { color, fontWeight, letterSpacing, lineHeight } from '@mui/system'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import MuiTimeline from '@mui/lab/Timeline'


const activityLogData = [
  {
    "date": "Today 24 Mar 2025",
    "events": [
      {
        "time": "12:22 PM",
        "type": "Medical",
        "title": "Lab test report updated",
        "code": "MED-123",
        "details": {
          "report_id": "MED-232",
          "lab_request_id": "LT-2131",
          "tests": "CBZ, NH3, test3, test4, test5 & 10 more",
          "reported_by": "Naveen Kumar"
        }
      },
      {
        "time": "10:23 PM",
        "type": "Notes",
        "title": "Electrical",
        "details": {
          "sub_type": "Malfunction, Power outage",
          "priority": "Medium",
          "note": "A swift, agile fox leaps gracefully over a sleepy canine, showcasing the beauty of nature's dance.",
          "people_tagged": ["Prajwal Shetty", "Nitin Ganjigatti", "Charlin Barua", "Sonam Kakade"]
        }
      }
    ]
  },
  {
    "date": "23 Mar 2025",
    "events": [
      {
        "time": "9:15 AM",
        "type": "Medical",
        "title": "Vaccination Administered",
        "code": "MED-123",
        "details": {
          "report_id": "MED-240",
          "brand": "Zoetis plus",
          "dose": "5ml",
          "batch": "BAT-521",
          "reported_by": "Dr. Anita Joshi"
        }
      },
      {
        "time": "5:40 PM",
        "type": "Transfer",
        "title": "Enclosure Shift",
        "code": "MED-123",
        "details": {
          "report_id": "INT-456",
          "from": "Cage 3B",
          "to": "Zone 7A"
        }
      }
    ]
  },
  {
    "date": "22 Mar 2025",
    "events": [
      {
        "time": "11:00 AM",
        "type": "Medical",
        "title": "Health Check Report",
        "code": "INT-123",
        "details": {
          "report_id": "MED-238",
          "lab_request_id": "LT-2119",
          "tests": "X-ray, CBC, Urine Analysis",
          "reported_by": "Dr. Arvind Rao"
        }
      }
    ]
  },
  {
    "date": "21 Mar 2025",
    "events": [
      {
        "time": "3:00 PM",
        "type": "Transfer",
        "title": "Animal Relocation",
        "code": "MED-123",
        "details": {
          "report_id": "INT-789",
          "from": "Hilltop Zone",
          "to": "Lakeview Shelter"
        }
      }
    ]
  },
  {
    "date": "20 Mar 2025",
    "events": [
      {
        "time": "8:15 AM",
        "type": "Notes",
        "title": "Fence Damage",
        "details": {
          "sub_type": "Physical Security",
          "priority": "High",
          "note": "Section 4 fence observed damaged during morning inspection.",
          "people_tagged": ["Aman Singh", "Meera Patel"]
        }
      }
    ]
  },
  {
    "date": "19 Mar 2025",
    "events": [
      {
        "time": "4:00 PM",
        "type": "Vaccination",
        "title": "Treatment Initiated",
        "code": "MED-123",
        "details": {
          "report_id": "MED-221",
          "lab_request_id": "LT-2101",
          "tests": "Blood Culture",
          "reported_by": "Dr. Sameer Desai"
        }
      }
    ]
  },
  {
    "date": "18 Mar 2025",
    "events": [
      {
        "time": "6:45 PM",
        "type": "Transfer",
        "title": "Night Shelter Shift",
        "details": {
          "report_id": "INT-300",
          "from": "Outdoor Pen",
          "to": "Night Shelter A"
        }
      }
    ]
  }
]


const AnimalJournals = ({ icon, color, title, time, children }) => {
  const theme = useTheme()
  const [selectedTab, setSelectedTab] = useState('active') // or 'inactive'
  const [searchValue, setSearchValue] = useState('')
  const [selectedUser, setSelectedUser] = useState({ user_name: 'All' })

  const basicStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '4px',
      height: '40px'
    },
  }

  const IncidentTimeline = () => {
    const Timeline = styled(MuiTimeline)({
      paddingLeft: 0,
      paddingRight: 0,
      '& .MuiTimelineItem-root': {
        width: '100%',
        '&:before': { display: 'none' }
      }
    })

    return (
      <Box sx={{ mt: '16px' }}>
        {activityLogData.map((group, groupIndex) => (
          <Box key={groupIndex} sx={{ mb: 6 }}>
            <Box
              sx={{
                backgroundColor: '#0000000D',
                height: '48px',
                pl: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 2
              }}
            >
              <Icon icon='mdi:calendar-blank-outline' style={{ fontSize: 24, color: '#000' }} />
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: 20,
                  letterSpacing: 0,
                  color: '#000',
                  whiteSpace: 'nowrap'
                }}
              >
                {group.date}
              </Typography>

              {/* Dashed line after date */}
              <Box
                sx={{
                  flexGrow: 1,
                  height: '1px',
                  ml: 2,
                  backgroundImage: `repeating-linear-gradient(
        to right,
        ${theme.palette.customColors.OutlineVariant},
        ${theme.palette.customColors.OutlineVariant} 4px,
        transparent 4px,
        transparent 8px
      )`
                }}
              />
            </Box>

            <Timeline>
              {group.events.map((item, index) => (
                <TimelineItem key={index}>
                  <TimelineSeparator
                    sx={{
                      '& span': {
                        ml: '1px',
                        background: 'transparent',
                        width: '1px',
                        height: '100%',
                        backgroundImage: `repeating-linear-gradient(
                        to bottom,
                        ${theme.palette.customColors.OutlineVariant},
                        ${theme.palette.customColors.OutlineVariant} 5px,
                        transparent 8px,
                        transparent 13px
                      )`,
                        opacity: 1
                      }
                    }}
                  >
                    <Avatar sx={{ width: 32, height: 32 }}>
                      <Icon icon='mdi:account' width={20} height={20} />
                    </Avatar>
                    {group.events.length === index + 1 ? null : <TimelineConnector />}
                  </TimelineSeparator>

                  <TimelineContent
                    sx={{
                      ml: 4,
                      borderRadius: '8px',
                      position: 'relative',
                      top: -5,
                      p: 0,
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '200px' }}>
                        <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 400, fontSize: 12, letterSpacing: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {item.type}
                        </Typography>
                        <Tooltip title={item.type}>
                          <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500, fontSize: 16, letterSpacing: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            Lab test report updated
                          </Typography>
                        </Tooltip>
                        <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontWeight: 600, fontSize: 12, letterSpacing: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          12:22 PM
                        </Typography>
                      </Box>


                      <Box
                        sx={{
                          flexGrow: 1,
                          backgroundColor: theme.palette.customColors.lightBg,
                          borderRadius: '8px',
                          maxWidth: '2000px',
                          width: '270px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          p: '16px'
                        }}
                      >
                        {item?.code && <Typography sx={{ fontWeight: 600, fontSize: '14px', color: item.type === 'Medical' ? theme.palette.customColors.Tertiary : item.type === 'Vaccination' ? theme.palette.primary.dark : theme.palette.customColors.addPrimary }}>
                          {item.code}
                        </Typography>}

                        {Object.entries(item.details).map(([key, value]) => (
                          <Tooltip title={`${key} : ${Array.isArray(value) ? String(value).split(',').join(', ') : value}}`}>
                            <Typography sx={{ fontWeight: 400, fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant, letterSpacing: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {key} : <span style={{ fontWeight: 500, letterSpacing: '0.1px', letterSpacing: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} >{Array.isArray(value) ? String(value).split(',').join(', ') : value}</span>
                            </Typography>
                          </Tooltip>
                        ))}

                        {item.createdBy && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Avatar sx={{ width: 34, height: 34 }} />
                            <Box>
                              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
                                {item.createdBy.name}
                              </Typography>
                              <Typography sx={{ fontSize: 12, fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}>
                                {item.createdBy.timestamp}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </Box>
        ))
        }
      </Box >
    )
  }

  return <>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px', mt: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Button
          onClick={() => setSelectedTab('active')}
          variant={selectedTab === 'active' ? 'contained' : 'text'}
          sx={{
            fontSize: 14,
            fontWeight: 500,
            height: '38px',
            width: '154px',
            letterSpacing: '0.1px',
            textTransform: 'capitalize',
            color:
              selectedTab === 'active'
                ? theme.palette.primary.contrastText
                : theme.palette.customColors.OnSurfaceVariant,
            backgroundColor:
              selectedTab === 'active'
                ? theme.palette.customColors.OnPrimaryContainer
                : theme.palette.customColors.displaybgSecondary,
            '&:hover': {
              backgroundColor:
                selectedTab === 'active'
                  ? theme.palette.customColors.OnPrimaryContainer
                  : theme.palette.customColors.displaybgSecondary
            }
          }}
        >
          All
        </Button>

        <Button
          onClick={() => setSelectedTab('inactive')}
          variant={selectedTab === 'inactive' ? 'contained' : 'text'}
          sx={{
            fontSize: 14,
            fontWeight: 500,
            height: '38px',
            width: '154px',
            letterSpacing: '0.1px',
            textTransform: 'capitalize',
            color:
              selectedTab === 'inactive'
                ? theme.palette.primary.contrastText
                : theme.palette.customColors.OnSurfaceVariant,
            backgroundColor:
              selectedTab === 'inactive'
                ? theme.palette.customColors.OnPrimaryContainer
                : theme.palette.customColors.displaybgSecondary,
            '&:hover': {
              backgroundColor:
                selectedTab === 'inactive'
                  ? theme.palette.customColors.OnPrimaryContainer
                  : theme.palette.customColors.displaybgSecondary
            }
          }}
        >
          Medical Record
        </Button>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', rowGap: 4, columnGap: 2, flexWrap: 'wrap' }}>
        {/* Tabs */}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            borderRadius: '4px',
            border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
            padding: '0 8px',
            height: '40px'
          }}
        >
          <Icon fontSize={24} icon='mi:search' color={theme.palette.customColors.neutralSecondary} />
          <TextField
            variant='outlined'
            placeholder='Search...'
            onChange={e => {
              setSearchValue(e.target.value)
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  border: 'none',
                  borderRadius: '4px'
                }
              },
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Autocomplete
            sx={{ width: '200px', height: '40px' }}
            value={selectedUser}
            disablePortal
            options={[{ user_name: 'All' }, { user_name: 'xyz' }, { user_name: 'abc' }]}
            getOptionLabel={option => option.user_name}
            isOptionEqualToValue={(option, value) => option?.user_name === value?.user_name}
            onChange={(e, val) => {
              setSelectedUser(val)
            }}
            renderInput={params => (
              <TextField
                {...params}
                sx={{ ...basicStyle }}
                label='All'
                placeholder='All'
              />
            )}
          />
          <Box sx={{ borderRadius: '4px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', height: '40px', width: '95px', border: `1px solid ${theme.palette.customColors.OutlineVariant}` }}>
            <Icon icon='mage:filter' fontSize={24} />
            <Typography s={{ fontSize: '16px', fontWeight: 400, lineHeight: '24px', letterSpacing: '0.15px', color: theme.palette.customColors.OnSurfaceVariant }}>
              Filter
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>





    <IncidentTimeline />


  </>
}

export default AnimalJournals
