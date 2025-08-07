import React, { useEffect, useState } from 'react'
import { Box, Typography, Button, Avatar, TextField, Tooltip, Autocomplete } from '@mui/material'
import { Icon } from '@iconify/react'
import { useTheme } from '@mui/material/styles'
import UserInfoCard from 'src/views/utility/insights/UserInfoCard'
import { styled } from '@mui/material/styles'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import MuiTimeline from '@mui/lab/Timeline'
import JournalFilterSheet from './journalFilter'
import { read, readAsync } from 'src/lib/windows/utils'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import Toaster from 'src/components/Toaster'

const activityLogData = [
  {
    date: 'Today 24 Mar 2025',
    events: [
      {
        time: '12:22 PM',
        type: 'Medical',
        title: 'Lab test report updated',
        code: 'MED-123',
        details: {
          report_id: 'MED-232',
          lab_request_id: 'LT-2131',
          tests: 'CBZ, NH3, test3, test4, test5 & 10 more',
          reported_by: 'Naveen Kumar'
        }
      },
      {
        time: '10:23 PM',
        type: 'Notes',
        title: 'Electrical',
        details: {
          sub_type: 'Malfunction, Power outage',
          priority: 'Medium',
          note: "A swift, agile fox leaps gracefully over a sleepy canine, showcasing the beauty of nature's dance.",
          people_tagged: ['Prajwal Shetty', 'Nitin Ganjigatti', 'Charlin Barua', 'Sonam Kakade']
        }
      }
    ]
  },
  {
    date: '23 Mar 2025',
    events: [
      {
        time: '9:15 AM',
        type: 'Medical',
        title: 'Vaccination Administered',
        code: 'MED-123',
        details: {
          report_id: 'MED-240',
          brand: 'Zoetis plus',
          dose: '5ml',
          batch: 'BAT-521',
          reported_by: 'Dr. Anita Joshi'
        }
      },
      {
        time: '5:40 PM',
        type: 'Transfer',
        title: 'Enclosure Shift',
        code: 'MED-123',
        details: {
          report_id: 'INT-456',
          from: 'Cage 3B',
          to: 'Zone 7A'
        }
      }
    ]
  },
  {
    date: '22 Mar 2025',
    events: [
      {
        time: '11:00 AM',
        type: 'Medical',
        title: 'Health Check Report',
        code: 'INT-123',
        details: {
          report_id: 'MED-238',
          lab_request_id: 'LT-2119',
          tests: 'X-ray, CBC, Urine Analysis',
          reported_by: 'Dr. Arvind Rao'
        }
      }
    ]
  },
  {
    date: '21 Mar 2025',
    events: [
      {
        time: '3:00 PM',
        type: 'Transfer',
        title: 'Animal Relocation',
        code: 'MED-123',
        details: {
          report_id: 'INT-789',
          from: 'Hilltop Zone',
          to: 'Lakeview Shelter'
        }
      }
    ]
  },
  {
    date: '20 Mar 2025',
    events: [
      {
        time: '8:15 AM',
        type: 'Notes',
        title: 'Fence Damage',
        details: {
          sub_type: 'Physical Security',
          priority: 'High',
          note: 'Section 4 fence observed damaged during morning inspection.',
          people_tagged: ['Aman Singh', 'Meera Patel']
        }
      }
    ]
  },
  {
    date: '19 Mar 2025',
    events: [
      {
        time: '4:00 PM',
        type: 'Vaccination',
        title: 'Treatment Initiated',
        code: 'MED-123',
        details: {
          report_id: 'MED-221',
          lab_request_id: 'LT-2101',
          tests: 'Blood Culture',
          reported_by: 'Dr. Sameer Desai'
        }
      }
    ]
  },
  {
    date: '18 Mar 2025',
    events: [
      {
        time: '6:45 PM',
        type: 'Transfer',
        title: 'Night Shelter Shift',
        details: {
          report_id: 'INT-300',
          from: 'Outdoor Pen',
          to: 'Night Shelter A'
        }
      }
    ]
  }
]

const usersData = [
  { userId: 1, userName: 'User 1', image: 'https://randomuser.me/api/portraits/men/1.jpg' },
  { userId: 2, userName: 'User 2', image: 'https://randomuser.me/api/portraits/women/2.jpg' },
  { userId: 3, userName: 'User 3', image: 'https://randomuser.me/api/portraits/men/3.jpg' },
  { userId: 4, userName: 'User 4', image: 'https://randomuser.me/api/portraits/women/4.jpg' },
  { userId: 5, userName: 'User 5', image: 'https://randomuser.me/api/portraits/men/5.jpg' },
  { userId: 6, userName: 'User 6', image: 'https://randomuser.me/api/portraits/women/6.jpg' },
  { userId: 7, userName: 'User 7', image: 'https://randomuser.me/api/portraits/men/7.jpg' },
  { userId: 8, userName: 'User 8', image: 'https://randomuser.me/api/portraits/women/8.jpg' },
  { userId: 9, userName: 'User 9', image: 'https://randomuser.me/api/portraits/men/9.jpg' },
  { userId: 10, userName: 'User 10', image: 'https://randomuser.me/api/portraits/women/10.jpg' },
  { userId: 11, userName: 'User 11', image: 'https://randomuser.me/api/portraits/men/11.jpg' },
  { userId: 12, userName: 'User 12', image: 'https://randomuser.me/api/portraits/women/12.jpg' },
  { userId: 13, userName: 'User 13', image: 'https://randomuser.me/api/portraits/men/13.jpg' },
  { userId: 14, userName: 'User 14', image: 'https://randomuser.me/api/portraits/women/14.jpg' },
  { userId: 15, userName: 'User 15', image: 'https://randomuser.me/api/portraits/men/15.jpg' },
  { userId: 16, userName: 'User 16', image: 'https://randomuser.me/api/portraits/women/16.jpg' },
  { userId: 17, userName: 'User 17', image: 'https://randomuser.me/api/portraits/men/17.jpg' },
  { userId: 18, userName: 'User 18', image: 'https://randomuser.me/api/portraits/women/18.jpg' },
  { userId: 19, userName: 'User 19', image: 'https://randomuser.me/api/portraits/men/19.jpg' },
  { userId: 20, userName: 'User 20', image: 'https://randomuser.me/api/portraits/women/20.jpg' },
  { userId: 21, userName: 'User 21', image: 'https://randomuser.me/api/portraits/men/21.jpg' },
  { userId: 22, userName: 'User 22', image: 'https://randomuser.me/api/portraits/women/22.jpg' },
  { userId: 23, userName: 'User 23', image: 'https://randomuser.me/api/portraits/men/23.jpg' },
  { userId: 24, userName: 'User 24', image: 'https://randomuser.me/api/portraits/women/24.jpg' },
  { userId: 25, userName: 'User 25', image: 'https://randomuser.me/api/portraits/men/25.jpg' },
  { userId: 26, userName: 'User 26', image: 'https://randomuser.me/api/portraits/women/26.jpg' },
  { userId: 27, userName: 'User 27', image: 'https://randomuser.me/api/portraits/men/27.jpg' },
  { userId: 28, userName: 'User 28', image: 'https://randomuser.me/api/portraits/women/28.jpg' },
  { userId: 29, userName: 'User 29', image: 'https://randomuser.me/api/portraits/men/29.jpg' },
  { userId: 30, userName: 'User 30', image: 'https://randomuser.me/api/portraits/women/30.jpg' },
  { userId: 31, userName: 'User 31', image: 'https://randomuser.me/api/portraits/men/31.jpg' },
  { userId: 32, userName: 'User 32', image: 'https://randomuser.me/api/portraits/women/32.jpg' },
  { userId: 33, userName: 'User 33', image: 'https://randomuser.me/api/portraits/men/33.jpg' },
  { userId: 34, userName: 'User 34', image: 'https://randomuser.me/api/portraits/women/34.jpg' },
  { userId: 35, userName: 'User 35', image: 'https://randomuser.me/api/portraits/men/35.jpg' },
  { userId: 36, userName: 'User 36', image: 'https://randomuser.me/api/portraits/women/36.jpg' },
  { userId: 37, userName: 'User 37', image: 'https://randomuser.me/api/portraits/men/37.jpg' },
  { userId: 38, userName: 'User 38', image: 'https://randomuser.me/api/portraits/women/38.jpg' },
  { userId: 39, userName: 'User 39', image: 'https://randomuser.me/api/portraits/men/39.jpg' },
  { userId: 40, userName: 'User 40', image: 'https://randomuser.me/api/portraits/women/40.jpg' },
  { userId: 41, userName: 'User 41', image: 'https://randomuser.me/api/portraits/men/41.jpg' },
  { userId: 42, userName: 'User 42', image: 'https://randomuser.me/api/portraits/women/42.jpg' },
  { userId: 43, userName: 'User 43', image: 'https://randomuser.me/api/portraits/men/43.jpg' },
  { userId: 44, userName: 'User 44', image: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { userId: 45, userName: 'User 45', image: 'https://randomuser.me/api/portraits/men/45.jpg' },
  { userId: 46, userName: 'User 46', image: 'https://randomuser.me/api/portraits/women/46.jpg' },
  { userId: 47, userName: 'User 47', image: 'https://randomuser.me/api/portraits/men/47.jpg' },
  { userId: 48, userName: 'User 48', image: 'https://randomuser.me/api/portraits/women/48.jpg' },
  { userId: 49, userName: 'User 49', image: 'https://randomuser.me/api/portraits/men/49.jpg' },
  { userId: 50, userName: 'User 50', image: 'https://randomuser.me/api/portraits/women/50.jpg' }
]

const categoriesData = [
  { categoryId: 1, categoryName: 'Technology' },
  { categoryId: 2, categoryName: 'Health' },
  { categoryId: 3, categoryName: 'Education' },
  { categoryId: 4, categoryName: 'Finance' },
  { categoryId: 5, categoryName: 'Travel' },
  { categoryId: 6, categoryName: 'Food' },
  { categoryId: 7, categoryName: 'Fashion' },
  { categoryId: 8, categoryName: 'Sports' },
  { categoryId: 9, categoryName: 'Entertainment' },
  { categoryId: 10, categoryName: 'Lifestyle' },
  { categoryId: 11, categoryName: 'Business' },
  { categoryId: 12, categoryName: 'Science' },
  { categoryId: 13, categoryName: 'Politics' },
  { categoryId: 14, categoryName: 'Art' },
  { categoryId: 15, categoryName: 'Culture' },
  { categoryId: 16, categoryName: 'Books' },
  { categoryId: 17, categoryName: 'Gaming' },
  { categoryId: 18, categoryName: 'Automobile' },
  { categoryId: 19, categoryName: 'Music' },
  { categoryId: 20, categoryName: 'Real Estate' }
]

const AnimalJournals = () => {
  const theme = useTheme()
  const [selectedTab, setSelectedTab] = useState('active') // or 'inactive'
  const [searchValue, setSearchValue] = useState('')

  const [selectedUser, setSelectedUser] = useState({ user_name: 'All' })
  const [users, setUsers] = useState([])

  // filter options
  const categories = ['Users', 'Categories', 'Date Range']

  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)

  const [selectedOptions, setSelectedOptions] = useState({
    Users: [],
    Categories: [],
    'Date Range': { from: null, to: null }
  })
  const [selectedUsers, setSelectedUsers] = useState([])
  const [dateRange, setDateRange] = useState({ from: null, to: null })

  const [isLoading, setIsLoading] = useState(false)

  const options = {
    Users: usersData || [],
    Categories: categoriesData || [],
    'Date Range': null
  }

  const basicStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '4px',
      height: '40px'
    }
  }

  const getUsers = async () => {
    try {
      const userDetails = await readAsync('userDetails')
      const zoo_id = userDetails?.user?.zoos[0].zoo_id
      const Users = await getUserList({ zoo_id })

      setUsers(Users?.data)
    } catch (error) {
      Toaster({ type: 'error', message: String(error) || 'Failed to fetch user data.' })
    }
  }

  const getUserData = () => {
    const result = read('userDetails')
    setSelectedUser({
      user_id: result?.user?.user_id,
      user_name: `${result?.user?.user_first_name} ${result?.user?.user_last_name}`
    })
  }

  useEffect(() => {
    getUsers()
    getUserData()
  }, [])

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
                      p: 0
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '200px' }}>
                        <Typography
                          sx={{
                            color: theme.palette.customColors.OnSurfaceVariant,
                            fontWeight: 400,
                            fontSize: 12,
                            letterSpacing: 0,
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden'
                          }}
                        >
                          {item.type}
                        </Typography>
                        <Tooltip title={item.type}>
                          <Typography
                            sx={{
                              color: theme.palette.customColors.OnSurfaceVariant,
                              fontWeight: 500,
                              fontSize: 16,
                              letterSpacing: 0,
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden'
                            }}
                          >
                            Lab test report updated
                          </Typography>
                        </Tooltip>
                        <Typography
                          sx={{
                            color: theme.palette.customColors.neutralSecondary,
                            fontWeight: 600,
                            fontSize: 12,
                            letterSpacing: 0,
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden'
                          }}
                        >
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
                        {item?.code && (
                          <Typography
                            sx={{
                              fontWeight: 600,
                              fontSize: '14px',
                              color:
                                item.type === 'Medical'
                                  ? theme.palette.customColors.Tertiary
                                  : item.type === 'Vaccination'
                                  ? theme.palette.primary.dark
                                  : theme.palette.customColors.addPrimary
                            }}
                          >
                            {item.code}
                          </Typography>
                        )}

                        {Object.entries(item.details).map(([key, value]) => (
                          <Tooltip
                            title={`${key} : ${Array.isArray(value) ? String(value).split(',').join(', ') : value}}`}
                          >
                            <Typography
                              sx={{
                                fontWeight: 400,
                                fontSize: '14px',
                                color: theme.palette.customColors.OnSurfaceVariant,
                                letterSpacing: 0,
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden'
                              }}
                            >
                              {key} :{' '}
                              <span
                                style={{
                                  fontWeight: 500,
                                  letterSpacing: '0.1px',
                                  letterSpacing: 0,
                                  whiteSpace: 'nowrap',
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden'
                                }}
                              >
                                {Array.isArray(value) ? String(value).split(',').join(', ') : value}
                              </span>
                            </Typography>
                          </Tooltip>
                        ))}

                        {item.createdBy && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Avatar sx={{ width: 34, height: 34 }} />
                            <Box>
                              <Typography
                                sx={{
                                  fontSize: 14,
                                  fontWeight: 500,
                                  color: theme.palette.customColors.OnSurfaceVariant
                                }}
                              >
                                {item.createdBy.name}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: 12,
                                  fontWeight: 400,
                                  color: theme.palette.customColors.OnSurfaceVariant
                                }}
                              >
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
        ))}
      </Box>
    )
  }

  const handleSelection = async (selectedIDs, category) => {
    let params = {}
    setIsLoading(true)

    const isAllSelected = category === 'Users' ? 'All Users' : category === 'Categories' ? 'All Categories' : null

    const key = category === 'Users' ? 'userIds' : category === 'Categories' ? 'categoryids' : 'date'

    const stateSetter = category === 'Users' ? setSelectedUsers : setSelectedOptions

    // ✅ Only run array logic if it's array
    if (Array.isArray(selectedIDs) && selectedIDs.includes(isAllSelected)) {
      if (category === 'Users') {
        stateSetter(usersData.map(user => user.userId)) // Select all
        params[key] = ''
      } else if (category === 'Categories') {
        stateSetter(prev => ({ ...prev, Categories: categoriesData.map(c => c.categoryId) }))
        params[key] = ''
      }
    } else {
      params[key] = Array.isArray(selectedIDs) ? selectedIDs.toString() : ''
      if (category === 'Users') {
        stateSetter(selectedIDs)
      } else if (category === 'Categories') {
        stateSetter(prev => ({ ...prev, Categories: selectedIDs }))
      } else if (category === 'Date Range') {
        setSelectedOptions(prev => ({
          ...prev,
          'Date Range': selectedIDs
        }))
      }
    }

    setIsLoading(false)
  }

  return (
    <>
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
            Mortality
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
                }
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Autocomplete
              sx={{ width: '200px', height: '40px' }}
              value={selectedUser}
              disablePortal
              options={users}
              getOptionLabel={option => option.user_name}
              isOptionEqualToValue={(option, value) => option?.user_id === value?.user_id}
              onChange={(e, val) => {
                setSelectedUser(val)
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  sx={{
                    ...basicStyle,
                    '& label.MuiInputLabel-root': {
                      transform: 'translate(14px, 8px) !important'
                    },
                    '& label.MuiInputLabel-root[data-shrink="true"]': {
                      transform: 'translate(14px, -9px) scale(0.75) !important'

                      // pointerEvents: 'none'
                    }
                  }}
                  label='Users'
                  placeholder='Search & Select'
                />
              )}
            />
            {/* <Box onClick={() => setOpenFilterDrawer(true)} sx={{ borderRadius: '4px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', height: '40px', width: '95px', border: `1px solid ${theme.palette.customColors.OutlineVariant}` }}>
            <Icon icon='mage:filter' fontSize={24} />
            <Typography s={{ fontSize: '16px', fontWeight: 400, lineHeight: '24px', letterSpacing: '0.15px', color: theme.palette.customColors.OnSurfaceVariant }}>
              Filter
            </Typography>
          </Box> */}
          </Box>
        </Box>
      </Box>

      <IncidentTimeline />

      <JournalFilterSheet
        options={options}
        animalId={123}
        categories={categories}
        openFilterDrawer={openFilterDrawer}
        setOpenFilterDrawer={setOpenFilterDrawer}
        selectedOptions={selectedOptions}
        setSelectedOptions={setSelectedOptions}
        handleSelection={handleSelection}
        selectedUsers={selectedUsers}
        setSelectedUsers={setSelectedUsers}
        dateRange={dateRange}
        setDateRange={setDateRange}
      />
    </>
  )
}

export default AnimalJournals
