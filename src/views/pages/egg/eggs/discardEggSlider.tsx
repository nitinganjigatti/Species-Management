'use client'

import React, { FC } from 'react'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  Drawer,
  Typography,
  IconButton,
  Tab,
  Chip,
  Divider,
  Stack,
  TextField,
  Tooltip,
  Avatar,
  FormControl,
  Select,
  MenuItem,
  debounce,
  CircularProgress
} from '@mui/material'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import { TabContext, TabList, TabPanel } from '@mui/lab'

import moment from 'moment'
import Utility from 'src/utility'
import Icon from 'src/@core/components/icon'
import DashboardFilter from './dashboardFilter'
import { useTranslation } from 'react-i18next'
import { getDashboardDiscardList } from 'src/lib/api/egg/dashboard'

const DiscardEggSlider: any = ({ openDiscard, setOpenDiscard }: { openDiscard: any, setOpenDiscard: any }) => {
  const theme = useTheme()
  const { t } = useTranslation()
  // States
  const [tabStatus, setTabStatus] = useState('site')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [discardList, setDiscardList] = useState([])
  const [listCount, setListCount] = useState<number>(0)
  const [search, setSearch] = useState('')
  const [date, setDate] = useState({ to_date: '', from_date: '' })

  // Ref for search input to enable auto-focus
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [page, setPage] = useState(1)
  const [reachedEnd, setReachedEnd] = useState(false)
  const [loader, setLoader] = useState(false)
  const [selectedDropDown, setSelectedDropDown] = useState('all')
  const [filterList, setFilterList] = useState([])
  const [selectedOptions, setSelectedOptions] = useState(initFilters())
  const [applyFilters, setApplyFilters] = useState(initFilters())
  const activeFilterCount = useMemo(() => {
    if (!applyFilters) return 0

    return Object.entries(applyFilters).reduce((count, [key, value]) => {
      if (key === 'selecteMenu') return count

      if (Array.isArray(value) && value.length > 0) {
        return count + 1
      }

      return count
    }, 0)
  }, [applyFilters])

  function initFilters() {
    return {
      Species: [],
      Nursery: [],
      Batch: [],
      'Security status': [],
      Condition: [],
      Reason: [],
      Site: [],
      selecteMenu: { id: 1, name: 'Species' }
    }
  }

  const buildParams = (pageNo: any, q = '', toDate = '', fromDate = '') => {
    const extractIds = (key: any) => (applyFilters as any)[key]?.map((option: any) => option.id) || []

    return {
      ref_type: tabStatus,
      sort: 'desc',
      q,
      page_no: pageNo,
      from_date: fromDate || '',
      to_date: toDate || '',
      taxonomy_id: extractIds('Species').length ? JSON.stringify(extractIds('Species')) : '',
      batch_id: extractIds('Batch').length ? JSON.stringify(extractIds('Batch')) : '',
      nursery_id: extractIds('Nursery').length ? JSON.stringify(extractIds('Nursery')) : '',
      security_status: extractIds('Security status').length ? JSON.stringify(extractIds('Security status')) : '',
      egg_state_id: extractIds('Reason').length ? JSON.stringify(extractIds('Reason')) : '',
      site_id: extractIds('Site').length ? JSON.stringify(extractIds('Site')) : ''
    }
  }

  const DiscardList = async (pageNo: any, q = '', toDate = '', fromDate = '') => {
    setLoader(true)
    try {
      const params = buildParams(pageNo, q, toDate, fromDate)
      const res = await getDashboardDiscardList(params)
      const list = res?.data?.data?.data

      if (res?.data?.data?.success) {
        const newResult = list?.result || []
        setDiscardList(prev => (pageNo > 1 ? [...prev, ...newResult] : newResult))
        setListCount(list?.total_count || 0)
        setReachedEnd(false)
      }
    } catch (error) {
      console.error('DiscardList error:', error)
    } finally {
      setLoader(false)
    }
  }

  // Handlers
  const handleDropDownChange = async (event: any) => {
    const value = event.target.value
    setSelectedDropDown(value)
    setDiscardList([])
    setLoader(true)
    setListCount(0)
    const currentDate = moment().format('YYYY-MM-DD')

    const fromDate = moment()
      .subtract(value - 1, 'days')
      .format('YYYY-MM-DD')

    setPage(1)
    if (value === 'all') {
      await DiscardList(1, search, '', '')
    } else {
      await DiscardList(1, search, currentDate, fromDate)
    }
  }

  const handleTabChange = (event: any, value: any) => {
    setTabStatus(value)
    resetSearchAndFilters()
  }

  const resetSearchAndFilters = () => {
    setSearch('')
    setIsSearchOpen(false)
    setIsFilterOpen(false)
    setDiscardList([])
    setListCount(0)
    setSelectedDropDown('all')
    setApplyFilters(initFilters())
    setSelectedOptions(initFilters())
    setFilterList([])
    setPage(1)
    // DiscardList(1, '', '', '')
  }

  const handleSearch = (value: any) => {
    setPage(1)
    setSearch(value)
    searchData(value)
  }

  const handleRemoveFilter = (item: any) => {
    const updatedFilterList = filterList.filter((filter: any) => !(filter.id === item.id && filter.name === item.name))
    const newSelectedFilters = { ...applyFilters }

    for (const category in newSelectedFilters) {
      if (Array.isArray((newSelectedFilters as any)[category])) {
        (newSelectedFilters as any)[category] = (newSelectedFilters as any)[category].filter(
          (filter: any) => !(filter.id === item.id && filter.name === item.name)
        )
      }
    }

    setFilterList(updatedFilterList)
    setSelectedOptions(newSelectedFilters)
    setApplyFilters(newSelectedFilters)
    setPage(1)
    setDiscardList([])
  }

  const handleScroll = async (e: any) => {
    const container = e.target
    if (
      discardList.length < listCount &&
      container.scrollHeight - Math.round(container.scrollTop) <= container.clientHeight + 1
    ) {
      if (loader) return // double-fire guard
      setLoader(true)
      const next = page + 1
      setPage(next)
      setReachedEnd(true)
      await DiscardList(next, search, date?.to_date, date?.from_date)
      setLoader(false)
    }
  }

  // const debouncedHandleScroll = debounce(handleScroll, 1000)
  const debouncedHandleScroll = handleScroll

  // const searchData = debounce(async searchVal => {
  //   console.log('first', isSearchOpen)
  //   if (isSearchOpen === true) {
  //     console.log('first', isSearchOpen)
  //     setDiscardList([])
  //     setListCount(0)
  //     await DiscardList(searchVal, date?.to_date, date?.from_date)
  //   }
  // })

  const searchData = useCallback(
    debounce(async (searchVal: any) => {
      setPage(1)
      setTimeout(() => {
        if (isSearchOpen === true) {
          // console.log('first', isSearchOpen)
          setDiscardList([])
          setListCount(0)
          DiscardList(1, searchVal, date?.to_date, date?.from_date)
        }
      }, 200)
    }, 1000),
    [date, tabStatus, applyFilters, isSearchOpen]
  )

  const handelOnclose = () => {
    setOpenDiscard(false)
    setSearch('')
    setDiscardList([])
  }

  // Effects
  useEffect(() => {
    if (openDiscard) {
      setPage(1)
      DiscardList(1, search, '', '')
    }
  }, [openDiscard, tabStatus, applyFilters])

  useEffect(() => {
    setDiscardList([])
  }, [selectedDropDown])

  // Auto-focus search input when search is opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef?.current?.focus?.()
      }, 100) // Small delay to ensure DOM is ready

      return () => clearTimeout(timer)
    }
  }, [isSearchOpen])

  const TabBadge = ({ label, totalCount }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </div>
  )

  const TabHeader = () => {
    return (
      <Box sx={{ bgcolor: theme.palette.primary.contrastText }}>
        <Stack
          direction='row'
          sx={{
            width: '100%',
            height: '60px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: '16px'
          }}
        >
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>
              {t('egg_module.discarded_eggs')} {listCount && <span>({listCount})</span>}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: '12px' }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                width: '34px',
                height: '36px',
                border: 1,
                borderRadius: '6px',
                borderColor: theme.palette.customColors.OutlineVariant,
                bgcolor: isSearchOpen ? theme?.palette.primary.dark : null,
                alignItems: 'center',
                cursor: 'pointer'
              }}
              onClick={() => {
                if (isSearchOpen) {
                  setSearch('')
                  if (search != '') {
                    handleSearch('')
                  }
                }
                setIsSearchOpen(!isSearchOpen)
              }}
            >
              <Icon
                icon='bitcoin-icons:search-filled'
                fontSize={18}
                color={isSearchOpen ? theme.palette.primary.contrastText : 'Black'}
              />
            </Box>
            <FormControl variant='outlined' sx={{ height: '36px' }}>
              <Select
                labelId='dropdown-label'
                id='dropdown'
                value={selectedDropDown}
                onChange={event => {
                  handleDropDownChange(event)
                }}
                sx={{ height: '36px' }}
              >
                <MenuItem value='all'>All</MenuItem>

                <MenuItem value='3'>Last 3 days</MenuItem>
                <MenuItem value='7'>Last 7 days</MenuItem>
                <MenuItem value='30'>Last 30 days</MenuItem>
              </Select>
            </FormControl>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 1,
                width: activeFilterCount > 0 ? '50px' : '34px',
                height: '36px',
                border: 1,
                borderRadius: '6px',
                borderColor: theme.palette.customColors.OutlineVariant,
                bgcolor: activeFilterCount > 0 ? theme?.palette.primary.dark : null,
                alignItems: 'center',
                cursor: 'pointer'
              }}
              onClick={() => setIsFilterOpen(true)}
            >
              <Icon
                icon='fluent:filter-16-filled'
                fontSize={20}
                color={activeFilterCount > 0 ? theme.palette.primary.contrastText : 'Black'}
              />

              {activeFilterCount > 0 && (
                <Typography sx={{ color: theme.palette.primary.contrastText, fontSize: '14px', fontWeight: 400 }}>
                  {activeFilterCount}
                </Typography>
              )}
            </Box>
          </Box>
        </Stack>
        {(showFilters || isSearchOpen) && (
          <Box sx={{ px: '16px' }}>
            {isSearchOpen && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                  borderRadius: '4px',
                  bgcolor: theme.palette.customColors.Surface,
                  padding: '0 8px',
                  height: '56px',
                  mb: 3
                }}
              >
                <Icon icon='mi:search' fontSize={20} />
                <TextField
                  variant='outlined'
                  placeholder='Search'
                  value={search}
                  onChange={e => {
                    setPage(1)

                    // setSearch(e.target.value)
                    handleSearch(e.target.value)
                  }}
                  inputRef={searchInputRef}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      border: 'none',
                      padding: '0',

                      '& fieldset': {
                        border: 'none'
                      }
                    }
                  }}
                />
              </Box>
            )}

            {showFilters && (
              <Box sx={{ mt: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: '12px', mb: 2, overflowX: 'auto', scrollbarWidth: 'none' }}>
                  {filterList?.length > 0 &&
                    filterList?.map((item: any, index: any) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          px: '8px',
                          py: '12px',
                          bgcolor: theme.palette.customColors.customTableBorderBg,
                          borderRadius: '8px',
                          height: '35px'
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: (theme.palette.primary as any).deepDark,
                            textTransform: 'capitalize',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item?.name}
                        </Typography>{' '}
                        <IconButton onClick={() => handleRemoveFilter(item)}>
                          <Icon icon='mdi:close' fontSize={18} color={theme.palette.primary.light} />
                        </IconButton>
                      </Box>
                    ))}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
    )
  }

  const Card = ({ list }: any) => {
    return (
      <>
        {listCount > 0 && discardList?.length > 0 && (
          <Box
            sx={{
              m: '16px',
              mt: 3,
              bgcolor: 'white',
              px: '20px',
              py: '16px',
              borderRadius: '8px',
              border: `1px solid ${theme.palette.customColors.OutlineVariant}`
            }}
          >
            <Box sx={{ width: '100%', display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                <Avatar
                  variant='rounded'
                  alt='Medicine Image'
                  sx={{
                    width: 35,
                    height: 35,
                    mr: 4,
                    borderRadius: '50%',
                    background: theme.palette.customColors.displaybgPrimary,
                    overflow: 'hidden'
                  }}
                >
                  {list?.default_icon ? (
                    <img style={{ width: '100%', height: '100%' }} src={list?.default_icon} alt='Profile' />
                  ) : (
                    <Icon icon='mdi:user' />
                  )}
                </Avatar>

                <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Typography
                    sx={{
                      color: (theme.palette.primary as any).deepDark,
                      fontSize: '16px',
                      fontWeight: '500',
                      lineHeight: '19.36px',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {list?.egg_code}
                  </Typography>

                  {list?.egg_condition && (
                    <Box
                      sx={{
                        borderRadius: '4px',
                        px: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor:
                          list?.egg_condition === 'Rotten'
                            ? theme.palette.customColors.AntzTertiary
                            : list?.egg_condition === 'Broken'
                            ? theme.palette.customColors.AntzTertiary
                            : list?.egg_condition === 'Cracked'
                            ? theme.palette.customColors.AntzTertiary
                            : list?.egg_condition === 'Discard'
                            ? theme.palette.customColors.AntzTertiary
                            : list?.egg_condition === 'Thin-Shelled'
                            ? theme.palette.customColors.displaybgPrimary
                            : list?.egg_condition === 'Fertile'
                            ? theme.palette.customColors.displaybgPrimary
                            : theme.palette.customColors.OnBackground
                      }}
                    >
                      <Typography
                        sx={{
                          color:
                            list?.egg_condition === 'Fresh'
                              ? theme.palette.primary.dark
                              : list?.egg_condition === 'Rotten'
                              ? theme.palette.customColors.Tertiary
                              : list?.egg_condition === 'Broken'
                              ? theme.palette.customColors.Tertiary
                              : list?.egg_condition === 'Cracked'
                              ? theme.palette.customColors.moderateSecondary
                              : list?.egg_condition === 'Discard'
                              ? theme.palette.customColors.Tertiary
                              : list?.egg_condition === 'Hatched'
                              ? theme.palette.customColors.antzInfo60
                              : list?.egg_condition === 'Thin-Shelled'
                              ? theme.palette.primary.light
                              : theme.palette.primary.dark,
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        {list?.egg_condition}
                      </Typography>
                    </Box>
                  )}

                  <Tooltip
                    title={
                      list?.default_common_name ? Utility?.toPascalSentenceCase(list.default_common_name) : 'Unknown'
                    }
                  >
                    <Typography
                      sx={{
                        width: 'calc(100% - 100px)',
                        color: theme.palette.customColors.OnSecondaryContainer,
                        fontSize: '16px',
                        fontWeight: 500,
                        lineHeight: '16.94px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {list?.default_common_name ? Utility?.toPascalSentenceCase(list.default_common_name) : 'Unknown'}
                    </Typography>
                  </Tooltip>
                </Box>
              </Box>

              {list?.activity_status === 'COMPLETED' ? (
                <Typography
                  sx={{ fontSize: '13px', fontWeight: 600, textAlign: 'center', color: theme.palette.primary.light }}
                >
                  {t('egg_module.security_checked')}
                </Typography>
              ) : (
                <Typography sx={{ fontSize: '13px', textAlign: 'center' }}>
                  {t('egg_module.security_check_pending')}
                </Typography>
              )}
            </Box>
            <Divider sx={{ my: 4 }} />
            <Stack>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography
                  sx={{
                    width: 120,
                    fontWeight: 400,
                    fontSize: '14px',
                    color: theme.palette.customColors.OnSecondaryContainer
                  }}
                >
                  {t('egg_module_discarded_on')}
                </Typography>
                <Typography
                  sx={{ fontWeight: 400, fontSize: '14px', color: theme.palette.customColors.OnSecondaryContainer }}
                >
                  :&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  {list?.discarded_date
                    ? Utility.formatDisplayDate(Utility.convertUTCToLocal(list?.discarded_date))
                    : '-'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography
                  sx={{
                    width: 120,
                    fontWeight: 400,
                    fontSize: '14px',
                    color: theme.palette.customColors.OnSecondaryContainer
                  }}
                >
                  {t('egg_module.batch')}
                </Typography>
                <Typography
                  sx={{ fontWeight: 400, fontSize: '14px', color: theme.palette.customColors.OnSecondaryContainer }}
                >
                  : &nbsp;&nbsp;&nbsp; {list?.request_id ? list?.request_id : '-'}
                </Typography>
              </Box>{' '}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography
                  sx={{
                    width: 120,
                    fontWeight: 400,
                    fontSize: '14px',
                    color: theme.palette.customColors.OnSecondaryContainer
                  }}
                >
                  AID
                </Typography>
                <Typography
                  sx={{ fontWeight: 400, fontSize: '14px', color: theme.palette.customColors.OnSecondaryContainer }}
                >
                  : &nbsp;&nbsp;&nbsp; {list?.egg_code ? list?.egg_code : '-'}
                </Typography>
              </Box>{' '}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography
                  sx={{
                    width: 120,
                    fontWeight: 400,
                    fontSize: '14px',
                    color: theme.palette.customColors.OnSecondaryContainer
                  }}
                >
                  EID
                </Typography>
                <Typography
                  sx={{ fontWeight: 400, fontSize: '14px', color: theme.palette.customColors.OnSecondaryContainer }}
                >
                  : &nbsp;&nbsp;&nbsp; {list?.egg_number ? list?.egg_number : '-'}
                </Typography>
              </Box>{' '}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography
                  sx={{
                    width: 120,
                    fontWeight: 400,
                    fontSize: '14px',
                    color: theme.palette.customColors.OnSecondaryContainer
                  }}
                >
                  {tabStatus === 'site' ? 'Site' : 'Nursery'}
                </Typography>
                <Typography
                  sx={{ fontWeight: 400, fontSize: '14px', color: theme.palette.customColors.OnSecondaryContainer }}
                >
                  : &nbsp;&nbsp;&nbsp; {tabStatus === 'site' ? list?.site_name : list?.nursery_name}
                </Typography>
              </Box>{' '}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography
                  sx={{
                    width: 120,
                    fontWeight: 400,
                    fontSize: '14px',
                    color: theme.palette.customColors.OnSecondaryContainer
                  }}
                >
                  {t('reason')}
                </Typography>
                <Typography
                  sx={{ fontWeight: 400, fontSize: '14px', color: theme.palette.customColors.OnSecondaryContainer }}
                >
                  : &nbsp;&nbsp;&nbsp; {list?.egg_state ? list?.egg_state : '-'}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}
      </>
    )
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={openDiscard}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'] },
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        <Box sx={{ bgcolor: theme.palette.customColors.lightBg, width: '100%', height: '100%', overflowY: 'auto' }}>
          {/* Header  */}
          <Box
            className='sidebar-header'
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              p: theme => theme.spacing(3, 3.255, 3, 5.255),
              px: '24px',
              bgcolor: theme.palette.customColors.lightBg
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
              <img src='/icons/egg_dashboard/discard.png' alt='icon' width='32' height='32' />

              <Typography variant='h6'>{t('egg_module.discard_details')}</Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <IconButton size='small' sx={{ color: 'text.primary' }}>
                <Icon icon='mdi:close' fontSize={20} onClick={() => handelOnclose()} />
              </IconButton>
            </Box>
          </Box>

          {/* Tabs */}
          <Box sx={{ backgroundColor: theme.palette.primary.contrastText }}>
            <TabContext value={tabStatus}>
              <TabList onChange={handleTabChange}>
                <Tab
                  sx={{ flex: 1, maxWidth: '280px', fontWeight: 600, fontSize: '14px' }}
                  value='site'
                  label={<TabBadge label='SITE WISE ' />}
                />
                <Tab
                  sx={{ flex: 1, maxWidth: '280px', fontWeight: 600, fontSize: '14px' }}
                  value='nursery'
                  label={<TabBadge label='NURSERY WISE ' />}
                />
              </TabList>
              <TabPanel value='site' sx={{ p: 0 }}>
                {' '}
                <Divider />
                {TabHeader()}
                <Box
                  onScroll={e => {
                    debouncedHandleScroll(e)
                  }}
                  sx={{
                    bgcolor: theme.palette.customColors.lightBg,
                    py: 2,
                    pb: 20,
                    height: '100vh',
                    overflowY: 'auto',
                    scrollbarWidth: 'none'
                  }}
                >
                  {discardList?.map((item: any, index: any) => (
                    <Card key={index} list={item} />
                  ))}

                  {listCount == 0 && !loader && (
                    <Typography
                      sx={{
                        color: (theme.palette.primary as any).deepDark,
                        fontSize: '16px',
                        fontWeight: '500',
                        lineHeight: '19.36px',
                        overflow: 'hidden',
                        textAlign: 'center',
                        mt: 5,
                        whiteSpace: 'nowrap',
                        boxSizing: 'border-box'
                      }}
                    >
                      {t('no_records')}
                    </Typography>
                  )}

                  {loader && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <CircularProgress />
                    </Box>
                  )}
                </Box>
              </TabPanel>
              <TabPanel value='nursery' sx={{ p: 0 }}>
                {' '}
                <Divider />
                {TabHeader()}
                <Box
                  onScroll={(e: any) => {
                    debouncedHandleScroll(e)
                  }}
                  sx={{
                    bgcolor: theme.palette.customColors.lightBg,
                    py: 2,
                    pb: 20,
                    height: '100vh',
                    overflowY: 'auto',
                    scrollbarWidth: 'none'
                  }}
                >
                  {discardList?.map((item: any, index: any) => (
                    <Card key={index} list={item} />
                  ))}

                  {listCount == 0 && !loader && (
                    <Typography
                      sx={{
                        color: (theme.palette.primary as any).deepDark,
                        fontSize: '16px',
                        fontWeight: '500',
                        lineHeight: '19.36px',
                        overflow: 'hidden',
                        textAlign: 'center',
                        mt: 5,
                        whiteSpace: 'nowrap',
                        boxSizing: 'border-box'
                      }}
                    >
                      {t('no_records')}
                    </Typography>
                  )}

                  {loader && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {/* {console.log('loader when scroll', loader)} */}
                      <CircularProgress />
                    </Box>
                  )}
                </Box>
              </TabPanel>
            </TabContext>
          </Box>
        </Box>
      </Drawer>
      {isFilterOpen && (
        <DashboardFilter
          setShowFilters={setShowFilters}
          isFilterOpen={isFilterOpen}
          setIsFilterOpen={setIsFilterOpen}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
          setFilterList={setFilterList}
          setApplyFilters={setApplyFilters}
          applyFilters={applyFilters}
          filterList={filterList}
          setDiscardList={setDiscardList}
          setSearch={setSearch}
          setIsSearchOpen={setIsSearchOpen}
          setSelectedDropDown={setSelectedDropDown}
        />
      )}
    </>
  )
}

export default DiscardEggSlider
