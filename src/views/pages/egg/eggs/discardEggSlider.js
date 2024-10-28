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
  InputLabel,
  Select,
  MenuItem,
  debounce,
  CircularProgress
} from '@mui/material'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { LoadingButton, TabContext, TabList, TabPanel } from '@mui/lab'
import { useCallback, useEffect, useState } from 'react'
import DashboardFilter from './dashboardFilter'
import { getDashboardDiscardList } from 'src/lib/api/egg/dashboard'
import Utility from 'src/utility'
import moment from 'moment'
import { lightBlue } from '@mui/material/colors'

const DiscardEggSlider = ({ openDiscard, setOpenDiscard }) => {
  const theme = useTheme()
  const [tabStatus, setTabStatus] = useState('site')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [discardList, setDiscardList] = useState([])

  // console.log('discardList :>> ', discardList)
  const [listCount, setListCount] = useState('')
  const [search, setSearch] = useState('')
  const [date, setDate] = useState({ to_date: '', from_date: '' })
  let [page, setPage] = useState(1)
  const [reachedEnd, setReachedEnd] = useState(false)
  const [loader, setLoader] = useState(false)

  // const [loader, setLoader] = useState(false)

  const [selectedDropDown, setSelectedDropDown] = useState('all')

  const [selectedOptions, setSelectedOptions] = useState({
    Species: [],
    Nursery: [],
    Batch: [],
    'Security status': [],
    Condition: [],
    Reason: [],
    Site: []
  })

  // console.log('selectedOptions :>> ', selectedOptions)

  const [applyFilters, setApplyFilters] = useState({
    Species: [],
    Nursery: [],
    Batch: [],
    'Security status': [],
    Condition: [],
    Reason: [],
    Site: []
  })

  // console.log('applyFilters :>> ', applyFilters)

  const [filterList, setFilterList] = useState([])

  const handleDropDownChange = event => {
    setSelectedDropDown(event.target.value)
    setDiscardList([])
    setListCount('')
    const currentDate = moment().format('YYYY-MM-DD')

    const fromDate = moment()
      .subtract(event.target.value - 1, 'days')
      .format('YYYY-MM-DD')
    setDate({ to_date: currentDate, from_date: fromDate })
    if (event.target.value === 'all') {
      DiscardList(search, '', '')
    } else {
      DiscardList(search, currentDate, fromDate)
    }
  }

  const handleTabChange = (event, value) => {
    setTabStatus(value)
    setSearch('')
    setIsSearchOpen(false)
    setPage(1)
    setIsFilterOpen(false)
    setDiscardList([])
    setListCount('0')
    setSelectedDropDown('all')
    setApplyFilters({ Species: [], Nursery: [], Batch: [], 'Security status': [], Condition: [], Reason: [], Site: [] })

    setSelectedOptions({
      Species: [],
      Nursery: [],
      Batch: [],
      'Security status': [],
      Condition: [],
      Reason: [],
      Site: []
    })
    setFilterList([])
  }

  const TabBadge = ({ label, totalCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </div>
  )

  const handleRemoveFilter = item => {
    // Remove the filter item from the filterList
    const updatedFilterList = filterList.filter(filter => !(filter.id === item.id && filter.name === item.name))
    setFilterList(updatedFilterList)

    const newSelectedFilters = { ...applyFilters }

    // Handle specific cases like collected_date and search

    // Remove the item from other filter categories (if they are arrays)
    for (const category in newSelectedFilters) {
      if (Array.isArray(newSelectedFilters[category])) {
        newSelectedFilters[category] = newSelectedFilters[category].filter(
          filter => !(filter.id === item.id && filter.name === item.name)
        )
      }
    }
    setPage(1)

    // Update the selected options state
    setSelectedOptions(newSelectedFilters)
    setApplyFilters(newSelectedFilters)
    setDiscardList([])

    // fetchTableData();
  }

  const TabHeader = () => {
    return (
      <Box sx={{ bgcolor: '#fff' }}>
        <Stack
          direction='row'
          sx={{
            width: '562px',
            height: '60px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: '16px'
          }}
        >
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#44544A' }}>
              Discarded eggs {listCount && <span>({listCount})</span>}
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
                borderColor: '#c3cec7',

                bgcolor: isSearchOpen ? theme?.palette.primary.dark : null,

                alignItems: 'center',
                cursor: 'pointer'
              }}
              onClick={() => {
                setSearch('')
                handleSearch('')
                setIsSearchOpen(!isSearchOpen)
              }}
            >
              <Icon icon='bitcoin-icons:search-filled' fontSize={18} color={isSearchOpen ? '#fff' : 'Black'} />
            </Box>
            <FormControl variant='outlined' sx={{ height: '36px' }}>
              <Select
                labelId='dropdown-label'
                id='dropdown'
                value={selectedDropDown}
                onChange={handleDropDownChange}
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
                gap: 2,
                width: filterList?.length > 0 ? '50px' : '34px',
                height: '36px',
                border: 1,
                borderRadius: '6px',
                borderColor: '#c3cec7',
                bgcolor: filterList?.length > 0 ? theme?.palette.primary.dark : null,
                alignItems: 'center',
                cursor: 'pointer'
              }}
              onClick={() => setIsFilterOpen(true)}
            >
              <Icon icon='fluent:filter-16-filled' fontSize={20} color={filterList?.length > 0 ? '#fff' : 'Black'} />

              {filterList?.length > 0 && (
                <Typography sx={{ color: '#fff', fontSize: '14px', fontWeight: 400 }}>{filterList?.length}</Typography>
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
                  border: '1px solid #C3CEC7',

                  borderRadius: '4px',
                  bgcolor: '#f2fff8',
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
                  InputProps={{
                    disableUnderline: true
                  }}
                  onChange={e => {
                    setSearch(e.target.value)
                    handleSearch(e.target.value)
                  }}
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
                    filterList?.map((item, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',

                          // justifyContent: 'center',
                          alignItems: 'center',
                          gap: '6px',
                          px: '8px',
                          py: '12px',
                          bgcolor: '#dae7df',
                          borderRadius: '8px',
                          height: '35px'
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: '#000000',
                            textTransform: 'capitalize',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item?.name}
                        </Typography>{' '}
                        <IconButton onClick={() => handleRemoveFilter(item)}>
                          <Icon icon='mdi:close' fontSize={18} color={'#1F515B'} />
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

  const Card = ({ list }) => {
    // console.log('list :>> ', list)

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
              border: '1px solid #C3CEC7'
            }}
          >
            <Box sx={{ display: 'flex', gap: 4, mb: 4, mb: 4, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Avatar
                  variant='rounded'
                  alt='Medicine Image'
                  sx={{
                    width: 35,
                    height: 35,
                    mr: 4,
                    borderRadius: '50%',
                    background: '#E8F4F2',
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
                  <Box sx={{ display: 'flex', width: 250, gap: 4 }}>
                    <Typography
                      sx={{
                        color: '#000000',
                        fontSize: '16px',
                        fontWeight: '500',
                        lineHeight: '19.36px',
                        overflow: 'hidden',

                        // textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        boxSizing: 'border-box'
                      }}
                    >
                      {list?.egg_code}
                    </Typography>

                    {list?.egg_condition && (
                      <Box
                        sx={{
                          borderRadius: '4px',
                          px: 3,

                          // width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',

                          backgroundColor:
                            list?.egg_condition === 'Rotten'
                              ? '#FFD3D3'
                              : list?.egg_condition === 'Broken'
                              ? '#FFD3D3'
                              : list?.egg_condition === 'Cracked'
                              ? '#fdfad7'
                              : list?.egg_condition === 'Discard'
                              ? '#FFD3D3'
                              : list?.egg_condition === 'Thin-Shelled'
                              ? '#E8F4F2'
                              : list?.egg_condition === 'Fertile'
                              ? '#E8F4F2'
                              : '#E1F9ED'
                        }}
                      >
                        <Typography
                          sx={{
                            color:
                              list?.egg_condition === 'Fresh'
                                ? '#006D35'
                                : list?.egg_condition === 'Rotten'
                                ? '#FA6140'
                                : list?.egg_condition === 'Broken'
                                ? '#FA6140'
                                : list?.egg_condition === 'Cracked'
                                ? '#E4B819'
                                : list?.egg_condition === 'Discard'
                                ? '#fa6140'
                                : list?.egg_condition === 'Hatched'
                                ? '#32bfdd'
                                : list?.egg_condition === 'Thin-Shelled'
                                ? '#1F515B'
                                : '#006D35',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        >
                          {list?.egg_condition}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Tooltip
                    title={
                      list?.default_common_name ? Utility?.toPascalSentenceCase(list.default_common_name) : 'Unknown'
                    }
                  >
                    <Typography
                      sx={{
                        color: '#1F415B',
                        fontSize: '16px',
                        fontWeight: 500,
                        lineHeight: '16.94px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        width: '240px'
                      }}
                    >
                      {list?.default_common_name ? Utility?.toPascalSentenceCase(list.default_common_name) : 'Unknown'}
                    </Typography>
                  </Tooltip>
                </Box>
              </Box>
              <Box>
                {list?.activity_status === 'COMPLETED' ? (
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, textAlign: 'center', color: '#1F515B' }}>
                    Security checked
                  </Typography>
                ) : (
                  <Typography sx={{ fontSize: '13px', textAlign: 'center' }}>Security check pending</Typography>
                )}
              </Box>
            </Box>
            <Divider />
            <Stack sx={{ mt: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ width: 120, fontWeight: 400, fontSize: '14px', color: '#1F415B' }}>
                  Discarded On
                </Typography>
                <Typography sx={{ fontWeight: 400, fontSize: '14px', color: '#1F415B' }}>
                  :&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  {list?.discarded_date
                    ? Utility.formatDisplayDate(Utility.convertUTCToLocal(list?.discarded_date))
                    : '-'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ width: 120, fontWeight: 400, fontSize: '14px', color: '#1F415B' }}>Batch</Typography>
                <Typography sx={{ fontWeight: 400, fontSize: '14px', color: '#1F415B' }}>
                  : &nbsp;&nbsp;&nbsp; {list?.request_id ? list?.request_id : '-'}
                </Typography>
              </Box>{' '}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ width: 120, fontWeight: 400, fontSize: '14px', color: '#1F415B' }}>AID</Typography>
                <Typography sx={{ fontWeight: 400, fontSize: '14px', color: '#1F415B' }}>
                  : &nbsp;&nbsp;&nbsp; {list?.egg_code ? list?.egg_code : '-'}
                </Typography>
              </Box>{' '}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ width: 120, fontWeight: 400, fontSize: '14px', color: '#1F415B' }}>EID</Typography>
                <Typography sx={{ fontWeight: 400, fontSize: '14px', color: '#1F415B' }}>
                  : &nbsp;&nbsp;&nbsp; {list?.egg_number ? list?.egg_number : '-'}
                </Typography>
              </Box>{' '}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ width: 120, fontWeight: 400, fontSize: '14px', color: '#1F415B' }}>
                  {tabStatus === 'site' ? 'Site' : 'Nursery'}
                </Typography>
                <Typography sx={{ fontWeight: 400, fontSize: '14px', color: '#1F415B' }}>
                  : &nbsp;&nbsp;&nbsp; {tabStatus === 'site' ? list?.site_name : list?.nursery_name}
                </Typography>
              </Box>{' '}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ width: 120, fontWeight: 400, fontSize: '14px', color: '#1F415B' }}>Reason</Typography>
                <Typography sx={{ fontWeight: 400, fontSize: '14px', color: '#1F415B' }}>
                  : &nbsp;&nbsp;&nbsp; {list?.egg_state ? list?.egg_state : '-'}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}
      </>
    )
  }

  const handelOnclose = () => {
    setOpenDiscard(false)
    setSearch('')
    setDiscardList([])
  }

  const DiscardList = async (q, currentDate, fromDate) => {
    setLoader(true)

    // setDiscardList([])
    try {
      const nurseryIds = applyFilters.Nursery?.map(option => option.id)
      const speciesIds = applyFilters.Species?.map(option => option.id)
      const batchIds = applyFilters.Batch?.map(option => option.id)

      // const conditionIds = applyFilters.Condition?.map(option => option.id)
      const SecurityIds = applyFilters['Security status']?.map(option => option.id)
      const reasonIds = applyFilters.Reason?.map(option => option.id)
      const siteIds = applyFilters.Site?.map(option => option.id)

      const param = {
        ref_type: tabStatus,
        sort: 'desc',
        q,
        page_no: page,
        from_date: fromDate ? fromDate : '',
        to_date: currentDate ? currentDate : '',
        taxonomy_id: speciesIds.length > 0 ? JSON.stringify(speciesIds) : '',
        batch_id: batchIds.length > 0 ? JSON.stringify(batchIds) : '',
        nursery_id: nurseryIds.length > 0 ? JSON.stringify(nurseryIds) : '',
        security_status: SecurityIds.length > 0 ? JSON.stringify(SecurityIds) : '',

        // egg_condition_id: conditionIds.length > 0 ? JSON.stringify(conditionIds) : '',
        egg_state_id: reasonIds.length > 0 ? JSON.stringify(reasonIds) : '',
        site_id: siteIds.length > 0 ? JSON.stringify(siteIds) : ''
      }
      console.log('param :>> ', param)

      await getDashboardDiscardList(param).then(res => {
        const list = res?.data?.data?.data

        if (res?.data?.data.success) {
          // setDiscardList(list?.result)
          if (list?.result?.length > 0) {
            if (showFilters) {
              setDiscardList([...discardList, ...list?.result])
            } else {
              setDiscardList([...discardList, ...list?.result])
            }

            setListCount(list?.total_count)
          } else {
            // setDiscardList([discardList])
            setListCount('0')
          }
          setReachedEnd(false)

          // setLoader(false)
        }
      })
    } catch (error) {
      setLoader(false)

      console.log('error :>> ', error)
    } finally {
      setLoader(false)
    }
  }

  const handleSearch = value => {
    setSearch(value)
    setPage(1)
    searchData(value)
  }

  const searchData = useCallback(
    debounce(async search => {
      // setSearch(search)
      setPage(1)
      setDiscardList([])
      setListCount('0')

      try {
        await DiscardList(search, date?.to_date, date?.from_date)

        // Add other conditions for different menus if needed
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  useEffect(() => {
    if (openDiscard) {
      DiscardList(search, '', '')
    }
  }, [openDiscard, tabStatus, applyFilters])

  const handleScroll = async e => {
    const container = e.target
    if (discardList?.length < listCount) {
      if (container.scrollHeight - Math.round(container.scrollTop) <= container.clientHeight + 1) {
        setPage(++page)
        setReachedEnd(true)

        try {
          await DiscardList(search, date?.to_date, date?.from_date)
        } catch (error) {
          console.error(error)
        }
      }
    }
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
          borderRadius: '8px',

          gap: '24px'
        }}
      >
        {/* Header  */}
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#EFF5F2',
            height: '80px',
            p: theme => theme.spacing(3, 3.255, 3, 5.255)
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
            <img src='/icons/egg_dashboard/discard.png' alt='icon' width='32' height='32' />

            <Typography variant='h6'>Discard Details</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <IconButton size='small' sx={{ color: 'text.primary' }}>
              <Icon icon='mdi:close' fontSize={20} onClick={() => handelOnclose()} />
            </IconButton>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ backgroundColor: '#FFFF' }}>
          <TabContext value={tabStatus}>
            <TabList onChange={handleTabChange}>
              <Tab
                sx={{ width: '280px', fontWeight: 600, fontSize: '14px' }}
                value='site'
                label={<TabBadge label='SITE WISE ' />}
              />
              <Tab
                sx={{ width: '280px', fontWeight: 600, fontSize: '14px' }}
                value='nursery'
                label={<TabBadge label='NURSERY WISE ' />}
              />
            </TabList>
            <TabPanel value='site' sx={{ p: 0 }}>
              {' '}
              <Divider />
              {TabHeader()}
              <Box
                onScroll={handleScroll}
                sx={{
                  bgcolor: '#eff5f2',
                  py: 2,
                  pb: 20,
                  height: 'calc(100vh - 310px)',
                  overflowY: 'auto',
                  scrollbarWidth: 'none'
                }}
              >
                {listCount > 0 ? (
                  discardList?.map((item, index) => <Card key={index} list={item} />)
                ) : loader ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {' '}
                    <CircularProgress />
                  </Box>
                ) : (
                  <Typography
                    sx={{
                      color: '#000000',
                      fontSize: '16px',
                      fontWeight: '500',
                      lineHeight: '19.36px',
                      overflow: 'hidden',
                      textAlign: 'center',
                      mt: 5,

                      // textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      boxSizing: 'border-box'
                    }}
                  >
                    No records
                  </Typography>
                )}
              </Box>
            </TabPanel>
            <TabPanel value='nursery' sx={{ p: 0 }}>
              {' '}
              <Divider />
              {TabHeader()}
              <Box
                onScroll={handleScroll}
                sx={{
                  bgcolor: '#eff5f2',
                  py: 2,
                  pb: 20,
                  height: 'calc(100vh - 310px)',
                  overflowY: 'auto',
                  scrollbarWidth: 'none'
                }}
              >
                {listCount > 0 ? (
                  discardList?.map((item, index) => <Card key={index} list={item} />)
                ) : loader ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {' '}
                    <CircularProgress />
                  </Box>
                ) : (
                  <Typography
                    sx={{
                      color: '#000000',
                      fontSize: '16px',
                      fontWeight: '500',
                      lineHeight: '19.36px',
                      overflow: 'hidden',
                      textAlign: 'center',
                      mt: 5,

                      // textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      boxSizing: 'border-box'
                    }}
                  >
                    No records
                  </Typography>
                )}
              </Box>
            </TabPanel>
          </TabContext>
        </Box>

        {/* bottom buttons */}
        <Box
          sx={{
            height: '122px',
            width: '100%',
            maxWidth: '562px',
            position: 'fixed',
            bottom: 0,
            px: 4,
            bgcolor: 'white',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            display: 'flex',

            boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.1)',
            zIndex: 123
          }}
        >
          <LoadingButton
            fullWidth
            variant='contained'
            size='large'
            sx={{ height: '58px' }}

            // onClick={handleApplyFilter}
          >
            VIEW DETAILS
          </LoadingButton>
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
          filterList={filterList}
          setDiscardList={setDiscardList}
        />
      )}
    </>
  )
}

export default DiscardEggSlider
