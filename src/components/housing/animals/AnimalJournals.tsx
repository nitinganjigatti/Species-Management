import React, { useContext, useEffect, useState } from 'react'
import { Box, Typography, Button, Avatar, Tooltip, Skeleton } from '@mui/material'
import { Icon } from '@iconify/react'
import { useTheme } from '@mui/material/styles'
import { styled } from '@mui/material/styles'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import { timelineItemClasses } from '@mui/lab'

import MuiTimeline from '@mui/lab/Timeline'
import JournalFilterSheet from './journalFilter'
import { AuthContext } from 'src/context/AuthContext'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'

import { getAnimalJournalLogs, getAnimalJournalModules } from 'src/lib/api/housing'
import Utility from 'src/utility'
import Timeline from '@mui/lab/Timeline'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import NoDataFound from 'src/views/utility/NoDataFound'
import { useParams } from 'next/navigation'
import { AnimalJournalLog, AnimalJournalEntry, User, JournalModule } from 'src/types/housing'
import { useTranslation } from 'react-i18next'

interface UserOption {
  user_id: string | number
  user_name: string
}

interface DateRange {
  from: Date | null
  to: Date | null
}

interface SelectedOptions {
  Users: (string | number)[]
  Categories: number[]
  'Date Range': DateRange
}

interface JournalLogGroup {
  date: string
  entries: JournalLogEntry[]
}

interface JournalLogEntry {
  type?: string
  category?: string
  title?: string
  time?: string
  code?: string
  incon?: string
  details?: Record<string, any>
  createdBy?: {
    name?: string
    timestamp?: string
  }
}

interface ModuleFilterItem {
  id: number | null
  name: string // Display name for UI
  module?: string // Original module value from API (for sending back to API)
}

interface AnimalJournalsProps {
  animalId?: number | string
}

const AnimalJournals: React.FC<AnimalJournalsProps> = ({ animalId: propAnimalId }) => {
  const theme = useTheme() as any
  const router = useSafeRouter()
  const { id } = router.query
  const id_resolved = propAnimalId != null ? String(propAnimalId) : Array.isArray(id) ? id[0] : id
  const authData = useContext(AuthContext)
  const { t } = useTranslation()

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [users, setUsers] = useState<UserOption[]>([])

  const [journalLogsLoading, setJournalLogsLoading] = useState<boolean>(false)
  const [animalJournalLogs, setAnimalJournalLogs] = useState<JournalLogGroup[]>([])

  // Module filter state (horizontal chips)
  const [journalModules, setJournalModules] = useState<ModuleFilterItem[]>([{ id: null, name: t('all') }])
  const [selectedModule, setSelectedModule] = useState<ModuleFilterItem>({ id: null, name: t('all') })
  const [modulesLoading, setModulesLoading] = useState<boolean>(false)

  // Pagination
  const [page, setPage] = useState<number>(1)
  const [totalCount, setTotalCount] = useState<number>(0)

  // filter options - only Users (Date Range is in main UI)
  const categories: string[] = [t('animals_module.users')]

  const [openFilterDrawer, setOpenFilterDrawer] = useState<boolean>(false)

  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({
    Users: [],
    Categories: [],
    'Date Range': { from: null, to: null }
  })
  const [selectedUsers, setSelectedUsers] = useState<(string | number)[]>([])
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null })

  // Transform users to match filter drawer interface (userId, userName)
  const filterDrawerUsers = users
    .filter(u => u.user_id !== '') // Exclude "All" option for filter drawer
    .map(u => ({
      userId: typeof u.user_id === 'string' ? parseInt(u.user_id, 10) : u.user_id,
      userName: u.user_name
    }))

  const options: Record<string, any[] | null> = {
    Users: filterDrawerUsers
  }

  const getUsers = async (): Promise<void> => {
    try {
      const zoo_id = (authData as any)?.userData?.user?.zoos?.[0]?.zoo_id
      if (!zoo_id) return
      const Users = await getUserList({ zoo_id })
      setUsers(Users?.data || [])
    } catch (error) {
      console.error(String(error) || 'Failed to fetch user data.')
    }
  }

  // Fetch journal modules (for horizontal filter chips)
  const fetchJournalModules = async (): Promise<void> => {
    const animalId = id_resolved
    if (!animalId) return

    try {
      setModulesLoading(true)
      const res = await getAnimalJournalModules({ animal_id: Number(animalId) })
      if (res.success && res.data) {
        const modules = res.data.map((item: any) => ({
          id: item.id,
          // Store original module value for API calls
          module: item.module,
          // Display name: capitalize first letter, keep underscores for matching mobile
          name: item.module ? item.module.charAt(0).toUpperCase() + item.module.slice(1).toLowerCase() : item.module
        }))
        // Add "All" option at the beginning
        setJournalModules([{ id: null, name: t('all'), module: undefined }, ...modules])
      }
    } catch (error) {
      console.error('Error fetching journal modules:', error)
    } finally {
      setModulesLoading(false)
    }
  }

  const fetchAnimalJournalLogs = async (
    pageNum: number = 1,
    reset: boolean = false,
    filters?: {
      userIds?: (string | number)[]
      dateRangeFilter?: DateRange
      moduleFilter?: ModuleFilterItem
    }
  ): Promise<void> => {
    const animalId = id_resolved
    if (!animalId) return

    // Use passed filters or fall back to current state
    const currentUserIds = filters?.userIds ?? selectedUsers
    const currentDateRange = filters?.dateRangeFilter ?? dateRange
    const currentModule = filters?.moduleFilter ?? selectedModule

    // Build params matching mobile implementation
    // Mobile always sends start_date and end_date (empty string if not set)
    const today = new Date().toISOString().split('T')[0]

    const params: any = {
      animal_id: animalId,
      page: pageNum,
      limit: '10',
      start_date: currentDateRange.from ? new Date(currentDateRange.from).toISOString().split('T')[0] : '',
      end_date: currentDateRange.to ? new Date(currentDateRange.to).toISOString().split('T')[0] : today
    }

    // Add user filter (JSON stringified array)
    if (currentUserIds.length > 0) {
      params.user_ids = JSON.stringify(currentUserIds)
    }

    // Add module filter - send original module value from API (matching mobile)
    if (currentModule.id !== null && currentModule.module) {
      params.module = currentModule.module
    }

    try {
      setJournalLogsLoading(true)
      console.log('Journal API params:', params)
      const res = await getAnimalJournalLogs(params)
      if (res.success) {
        const newLogs = (res?.data?.data || []) as JournalLogGroup[]
        if (reset) {
          setAnimalJournalLogs(newLogs)
        } else {
          setAnimalJournalLogs(prev => [...prev, ...newLogs])
        }
        setTotalCount(res?.data?.total_count || 0)
      } else {
        console.error(String(res.message) || 'Failed to fetch journal logs.')
      }
    } catch (error) {
      console.error(String(error) || 'Failed to fetch journal logs.')
    } finally {
      setJournalLogsLoading(false)
    }
  }

  // Initial load - fetch modules and users
  useEffect(() => {
    if (id_resolved) {
      fetchJournalModules()
      getUsers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id_resolved, authData])

  // Fetch journal logs on initial load and when filters change
  useEffect(() => {
    if (id_resolved) {
      setPage(1)
      // Pass current filter values directly to avoid closure issues
      fetchAnimalJournalLogs(1, true, {
        userIds: selectedUsers,
        dateRangeFilter: dateRange,
        moduleFilter: selectedModule
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id_resolved, dateRange, selectedModule, selectedUsers])

  // Handle module selection
  const handleModuleSelect = (module: ModuleFilterItem): void => {
    setSelectedModule(module)
  }

  const AnimalJournalLog: React.FC = () => {
    const StyledTimeline = styled(MuiTimeline)({
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
                backgroundColor: theme.palette.customColors.mdAntzNeutral,
                height: '48px',
                pl: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 2
              }}
            >
              <Icon
                icon='mdi:calendar-blank-outline'
                style={{ fontSize: 24, color: theme.palette.customColors.neutralPrimary }}
              />
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: 20,
                  letterSpacing: 0,
                  color: theme.palette.customColors.neutralPrimary,
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

            <StyledTimeline>
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
                    {(() => {
                      // Type-based conditional icon rendering matching mobile JournalCard.js
                      // Normalize type: lowercase, replace spaces with underscores
                      const rawType = item?.type || item?.category || ''
                      const itemType = rawType.toLowerCase().replace(/\s+/g, '_')
                      const fallbackImage = '/icons/antz.svg'

                      // Medical record type - hardcoded stethoscope icon (matching mobile)
                      if (itemType.includes('medical') || itemType.includes('medical_record')) {
                        return (
                          <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.error.main }}>
                            <Icon icon='fa6-solid:stethoscope' width={16} height={16} color='white' />
                          </Avatar>
                        )
                      }

                      // Vaccination type - syringe icon
                      if (itemType.includes('vaccination') || itemType.includes('vaccine')) {
                        return (
                          <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                            <Icon icon='mdi:needle' width={18} height={18} color='white' />
                          </Avatar>
                        )
                      }

                      // Mortality type - dead emoticon icon with red background
                      if (itemType.includes('mortality')) {
                        return (
                          <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.error.main }}>
                            <Icon icon='mdi:emoticon-dead-outline' width={20} height={20} color='white' />
                          </Avatar>
                        )
                      }

                      // Notes/Observation type - note outline icon
                      if (itemType.includes('note') || itemType.includes('observation')) {
                        return (
                          <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.grey[200] }}>
                            <Icon icon='mdi:note-outline' width={20} height={20} color={theme.palette.text.secondary} />
                          </Avatar>
                        )
                      }

                      // Login/Logout type
                      if (itemType === 'login' || itemType === 'logout') {
                        return (
                          <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.grey[200] }}>
                            <Icon icon={itemType === 'login' ? 'mdi:login' : 'mdi:logout'} width={20} height={20} />
                          </Avatar>
                        )
                      }

                      // Animal type
                      if (itemType.includes('animal')) {
                        const imageUrl = item?.details?.default_icon || item?.incon || (item as any)?.icon
                        if (imageUrl) {
                          return (
                            <Avatar sx={{ width: 32, height: 32 }}>
                              <img
                                alt='animal-icon'
                                style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                                src={imageUrl}
                                onError={e => {
                                  const target = e.target as HTMLImageElement
                                  target.src = fallbackImage
                                }}
                              />
                            </Avatar>
                          )
                        }
                      }

                      // Site type
                      if (itemType.includes('site')) {
                        const imageUrl = item?.details?.site_default_icon
                        if (imageUrl) {
                          return (
                            <Avatar sx={{ width: 32, height: 32 }}>
                              <img
                                alt='site-icon'
                                style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                                src={imageUrl}
                                onError={e => {
                                  const target = e.target as HTMLImageElement
                                  target.src = fallbackImage
                                }}
                              />
                            </Avatar>
                          )
                        }
                      }

                      // Section type
                      if (itemType.includes('section')) {
                        const imageUrl = item?.details?.section_default_icon
                        if (imageUrl) {
                          return (
                            <Avatar sx={{ width: 32, height: 32 }}>
                              <img
                                alt='section-icon'
                                style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                                src={imageUrl}
                                onError={e => {
                                  const target = e.target as HTMLImageElement
                                  target.src = fallbackImage
                                }}
                              />
                            </Avatar>
                          )
                        }
                      }

                      // Enclosure type
                      if (itemType.includes('enclosure')) {
                        const imageUrl = item?.details?.enclosure_default_icon
                        if (imageUrl) {
                          return (
                            <Avatar sx={{ width: 32, height: 32 }}>
                              <img
                                alt='enclosure-icon'
                                style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                                src={imageUrl}
                                onError={e => {
                                  const target = e.target as HTMLImageElement
                                  target.src = fallbackImage
                                }}
                              />
                            </Avatar>
                          )
                        }
                      }

                      // User profile type
                      if (itemType.includes('user') || itemType.includes('profile')) {
                        const imageUrl = item?.details?.user_profile_pic
                        if (imageUrl) {
                          return (
                            <Avatar sx={{ width: 32, height: 32 }}>
                              <img
                                alt='user-icon'
                                style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                                src={imageUrl}
                                onError={e => {
                                  const target = e.target as HTMLImageElement
                                  target.src = fallbackImage
                                }}
                              />
                            </Avatar>
                          )
                        }
                      }

                      // Default fallback: check all possible image fields
                      const imageUrl =
                        item?.incon ||
                        (item as any)?.icon ||
                        item?.details?.default_icon ||
                        item?.details?.site_default_icon ||
                        item?.details?.section_default_icon ||
                        item?.details?.enclosure_default_icon ||
                        item?.details?.user_profile_pic

                      return (
                        <Avatar sx={{ width: 32, height: 32 }}>
                          <img
                            alt='journal-icon'
                            style={{ height: '100%', width: '100%', objectFit: 'cover', padding: 4 }}
                            src={imageUrl || fallbackImage}
                            onError={e => {
                              const target = e.target as HTMLImageElement
                              if (!target.src.endsWith(fallbackImage)) {
                                target.src = fallbackImage
                              }
                            }}
                          />
                        </Avatar>
                      )
                    })()}
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
                          {item.category
                            ?.split('_')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ')}
                        </Typography>
                        <Tooltip title={item.title}>
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
                            {Utility.toPascalSentenceCase(item.title)}
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

                        {item?.category && (
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
                            {item?.details?.medical_record_number}
                          </Typography>
                        )}

                        {Object.entries(item.details || {})
                          .filter(
                            ([key, value]) =>
                              key !== 'medical_record_number' &&
                              value !== null &&
                              value !== undefined &&
                              !(Array.isArray(value) && value.length === 0) &&
                              !(typeof value === 'string' && value.trim() === '')
                          )
                          .map(([key, value]) => {
                            const isDateString =
                              typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) // Matches "YYYY-MM-DD HH:mm:ss"

                            const formattedValue = isDateString
                              ? Utility.convertUTCToLocalDate(value)
                              : Array.isArray(value)
                              ? value.join(', ')
                              : value

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
                                  {key
                                    .replace(/_/g, ' ')
                                    .toLowerCase()
                                    .replace(/^./, s => s.toUpperCase())}{' '}
                                  :
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
                            )
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
            </StyledTimeline>
          </Box>
        ))}
      </Box>
    )
  }

  const handleSelection = async (selectedIDs: (string | number)[] | DateRange, category: string): Promise<void> => {
    setIsLoading(true)

    if (category === 'Users') {
      // Convert user IDs to integers (matching mobile implementation)
      const userIds = (selectedIDs as (string | number)[]).map(id => (typeof id === 'string' ? parseInt(id, 10) : id))
      setSelectedUsers(userIds)
    }

    setIsLoading(false)
  }

  const TimelineSkeleton: React.FC = () => (
    <Timeline
      position='right'
      sx={{
        [`& .${timelineItemClasses.root}:before`]: {
          flex: 0,
          padding: 0
        }
      }}
    >
      {[1, 2].map((item, idx) => (
        <TimelineItem key={item}>
          <TimelineSeparator
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Skeleton variant='circular' width={40} height={40} />
            {idx < 2 && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              justifyContent: 'flex-start',
              width: '100%',
              py: 0,
              pl: 2
            }}
          >
            {/* Left side - Timeline info skeleton */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                minWidth: '200px',
                justifyContent: 'center'
              }}
            >
              <Skeleton variant='text' width={140} height={20} />
              <Skeleton variant='text' width={120} height={24} />
              <Skeleton variant='text' width={80} height={16} />
            </Box>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  gap: 1,
                  p: 4,
                  borderRadius: 1,
                  background: theme.palette.customColors.displaybgPrimary,
                  width: { xs: '100%', md: '400px' },
                  maxWidth: '400px',
                  mt: 1
                }}
              >
                <Skeleton variant='text' width={180} height={20} />
                <Skeleton variant='text' width={160} height={20} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Skeleton variant='circular' width={16} height={16} />
                  <Skeleton variant='text' width={120} height={20} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Skeleton variant='rectangular' width={16} height={16} />
                  <Skeleton variant='text' width={120} height={20} />
                </Box>
                <Skeleton variant='text' width={200} height={20} />
              </Box>
            </Box>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  )

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px', mt: 4 }}>
        {/* Date Range Picker and Filter Button Row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', rowGap: 4, columnGap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ minWidth: '40px', maxWidth: '400px' }}>
            <CommonDateRangePickers
              onChange={(startDate: Date | string, endDate: Date | string) => {
                // CommonDateRangePickers passes two arguments, convert to object
                // Empty strings mean "All time" was selected
                if (startDate === '' && endDate === '') {
                  setDateRange({ from: null, to: null })
                } else {
                  setDateRange({
                    from: startDate instanceof Date ? startDate : null,
                    to: endDate instanceof Date ? endDate : null
                  })
                }
              }}
              filterDates={{ startDate: dateRange.from, endDate: dateRange.to }}
            />
          </Box>
          <Button
            variant='outlined'
            onClick={() => setOpenFilterDrawer(true)}
            sx={{
              minWidth: '40px',
              height: '40px',
              p: 1,
              borderColor: theme.palette.customColors?.OutlineVariant,
              position: 'relative'
            }}
          >
            <Icon icon='mage:filter' fontSize={20} />
            {selectedUsers.length > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                {selectedUsers.length}
              </Box>
            )}
          </Button>
        </Box>

        {/* Journal Type Horizontal Filter Chips - below Users and Date picker */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            pb: 1,
            '&::-webkit-scrollbar': {
              height: 6
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: 3
            }
          }}
        >
          {modulesLoading
            ? // Skeleton loading for modules
              Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton
                  key={idx}
                  variant='rectangular'
                  width={100}
                  height={40}
                  sx={{ borderRadius: '50px', flexShrink: 0 }}
                />
              ))
            : journalModules.map((module, index) => {
                const isSelected = selectedModule.name === module.name

                return (
                  <Button
                    key={index}
                    onClick={() => handleModuleSelect(module)}
                    sx={{
                      flexShrink: 0,
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      textTransform: 'none',
                      borderRadius: '8px',
                      px: 3,
                      py: 1,
                      minHeight: '40px',
                      whiteSpace: 'nowrap',
                      minWidth: 'auto',
                      backgroundColor: isSelected
                        ? theme.palette.customColors?.OnPrimaryContainer
                        : theme.palette.customColors?.displaybgPrimary,
                      color: isSelected
                        ? theme.palette.customColors?.OnPrimary
                        : theme.palette.customColors?.OnPrimaryContainer
                    }}
                  >
                    {module.name}
                  </Button>
                )
              })}
        </Box>

        <JournalFilterSheet
          options={options as any}
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

        {journalLogsLoading ? (
          <TimelineSkeleton />
        ) : animalJournalLogs.length > 0 ? (
          <AnimalJournalLog />
        ) : (
          <NoDataFound width={250} height={250} variant='Seal' />
        )}
      </Box>
    </>
  )
}

export default AnimalJournals
