import React, { useEffect, useState } from 'react'
import { Box, Typography, Button, Avatar, TextField, Tooltip, Autocomplete, CircularProgress, Skeleton } from '@mui/material'
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

import { getAnimalJournalLogs } from 'src/lib/api/housing'
import Utility from 'src/utility'

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

  const [isLoading, setIsLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState('active') // or 'inactive'
  const [searchValue, setSearchValue] = useState('')

  const [selectedUser, setSelectedUser] = useState({ user_name: 'All' })
  const [users, setUsers] = useState([])

  const [journalLogsLoading, setJournalLogsLoading] = useState(false)
  const [animalJournalLogs, setAnimalJournalLogs] = useState([])

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


  const options = {
    Users: users || [],
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


  const fetchAnimalJournalLogs = async () => {
    const params = {
      animal_id: '233012',
      page: 1,
      limit: 10
    }
    try {
      setJournalLogsLoading(true)
      const res = await getAnimalJournalLogs(params)
      if (res.success) {
        setAnimalJournalLogs(res?.data?.data)
      } else {
        Toaster({ type: 'error', message: String(res.message) || 'Failed to fetch journal logs.' })
      }
    } catch (error) {
      Toaster({ type: 'error', message: String(error) || 'Failed to fetch journal logs.' })
    } finally {
      setJournalLogsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnimalJournalLogs()
    getUsers()
    getUserData()
  }, [])


  const AnimalJournalLog = () => {
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
        {animalJournalLogs.map((group, groupIndex) => (
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
                {Utility.convertUTCToLocalDate(group.date)}
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
              {group?.entries?.map((item, index) => (
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
                      {item?.incon ? <img alt='img' style={{ height: '100%', width: '100%' }} src={item?.incon} /> :
                        <Icon icon='mdi:account' width={20} height={20} />
                      }
                    </Avatar>
                    {group.entries.length === index + 1 ? null : <TimelineConnector />}
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

                        <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 400, fontSize: 12, letterSpacing: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {item.category
                            .split('_')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ')
                          }
                        </Typography>
                        <Tooltip title={item.title}>
                          <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500, fontSize: 16, letterSpacing: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {Utility.toPascalSentenceCase(item.title)}
                          </Typography>
                        </Tooltip>
                        <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontWeight: 600, fontSize: 12, letterSpacing: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {Utility.convertUTCToLocaltime(item.time)}
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

                       
                        {item?.category && <Typography sx={{ fontWeight: 600, fontSize: '14px', color: item.type === 'Medical' ? theme.palette.customColors.Tertiary : item.type === 'Vaccination' ? theme.palette.primary.dark : theme.palette.customColors.addPrimary }}>
                          {item?.details?.medical_record_number}
                        </Typography>}

                        {Object.entries(item.details)
                          .filter(([key, value]) =>
                            key !== 'medical_record_number' &&
                            value !== null &&
                            value !== undefined &&
                            !(Array.isArray(value) && value.length === 0) &&
                            !(typeof value === 'string' && value.trim() === '')
                          )
                          .map(([key, value]) => {
                            const isDateString =
                              typeof value === 'string' &&
                              /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value); // Matches "YYYY-MM-DD HH:mm:ss"

                            const formattedValue = isDateString
                              ? Utility.convertUTCToLocalDate(value)
                              : Array.isArray(value)
                                ? value.join(', ')
                                : value;

                            return (
                              <Tooltip key={key} title={`${key}: ${formattedValue}`}>
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
                                  {key} :
                                  <span
                                    style={{
                                      fontWeight: 500,
                                      letterSpacing: 0,
                                      whiteSpace: 'nowrap',
                                      textOverflow: 'ellipsis',
                                      overflow: 'hidden'
                                    }}
                                  >
                                    &nbsp;{formattedValue}
                                  </span>
                                </Typography>
                              </Tooltip>
                            );
                          })}


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
        stateSetter(users.map(user => user.user_id)) // Select all
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
          <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

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
            <Box onClick={() => setOpenFilterDrawer(true)} sx={{ borderRadius: '4px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', height: '40px', width: '95px', border: `1px solid ${theme.palette.customColors.OutlineVariant}` }}>
            <Icon icon='mage:filter' fontSize={24} />
            <Typography s={{ fontSize: '16px', fontWeight: 400, lineHeight: '24px', letterSpacing: '0.15px', color: theme.palette.customColors.OnSurfaceVariant }}>
              Filter
            </Typography>
          </Box> 
          </Box>
        </Box>



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


      {journalLogsLoading ? <Box sx={{ mb: 6 }}>
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
      </Box>
      <Box sx={{ display: 'flex', columnGap:'100px', flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '200px' }}>
          <Skeleton variant='rounded' sx={{ borderRadius: '8px', minHeight: '20px', maxHeight: '240px' }} height={10} />
          <Skeleton variant='rounded' sx={{ borderRadius: '8px', minHeight: '30px', maxHeight: '240px' }} height={20} />
          <Skeleton variant='rounded' sx={{ borderRadius: '8px', minHeight: '20px', maxHeight: '240px' }} height={10} />
        </Box>
        <Skeleton
          sx={{
            backgroundColor: theme.palette.customColors.lightBg,
            borderRadius: '8px',
            minHight: '200px',
            maxWidth:'100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            p: '16px'
          }}
          height={200}
          width={800}
        />
      </Box>
    </Box > :
      <AnimalJournalLog />
    }
      
    </Box>
  </>)
}

export default AnimalJournals
 