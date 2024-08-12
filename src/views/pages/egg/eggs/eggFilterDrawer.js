import { useTheme } from '@mui/material/styles'
import { LoadingButton } from '@mui/lab'
import {
  Box,
  Checkbox,
  debounce,
  Divider,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material'
import React, { useState, useEffect, useContext, useCallback } from 'react'
import Icon from 'src/@core/components/icon'
import { getCollectedByList, GetEggMaster } from 'src/lib/api/egg/egg'
import { GetNurseryList } from 'src/lib/api/egg/nursery'
import { AuthContext } from 'src/context/AuthContext'
import dayjs from 'dayjs'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import moment from 'moment'
import { DatePicker } from '@mui/x-date-pickers'

const EggFilterDrawer = ({ openFilterDrawer, setOpenFilterDrawer, setFilterList, setSelectedFiltersOptions }) => {
  const theme = useTheme()
  const [selectedMenu, setSelectedMenu] = useState(leftMenu[0])

  const authData = useContext(AuthContext)

  const [selectAll, setSelectAll] = useState(false)

  const [eggStage, setEggStage] = useState([])
  const [nurseryList, setNurseryList] = useState([])
  const [siteList, setSiteList] = useState([])
  const [collectedByList, setCollectedByList] = useState([])
  const [eggMaster, setEggMaster] = useState(null)

  const [selectedDropdownID, setSelectedDropdownId] = useState(null)

  const [selectedOptions, setSelectedOptions] = useState({
    Stage: [],
    Nursery: [],
    Site: [],
    'Collected By': [],
    collected_date: null,
    status: null
  })

  const [selectedDate, setSelectedDate] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')

  const getEggMasterData = async () => {
    try {
      await GetEggMaster().then(res => {
        if (res.success) {
          setEggMaster(res?.data)

          // setEggStage(res?.data?.egg_state)

          setSelectedDropdownId(res?.data?.egg_state[0]?.id)
        }
      })
    } catch (e) {
      console.log(e)
    }
  }

  const NurseryList = async q => {
    try {
      const params = {
        // type: ['length', 'weight'],
        search: q ? q : ''

        // page: 1,
        // limit: 50
      }
      await GetNurseryList({ params: params }).then(res => {
        setNurseryList(res?.data?.result)
      })
    } catch (e) {
      console.log(e)
    }
  }

  const CollectedByList = async search => {
    try {
      const params = {
        // type: ['length', 'weight'],
        q: search ? search : ''

        // page: 1,
        // limit: 50
      }
      await getCollectedByList({ params: params }).then(res => {
        setCollectedByList(res?.data?.data?.data?.result)
      })
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    getEggMasterData()
    NurseryList()
    CollectedByList()
    if (authData?.userData?.user?.zoos[0]?.sites.length > 0) {
      setSiteList(authData?.userData?.user?.zoos[0].sites)
    }
  }, [openFilterDrawer])

  useEffect(() => {
    if (selectedDropdownID && eggMaster) {
      const filteredEggStatus = eggMaster?.egg_state?.filter(status => status?.egg_status_id === selectedDropdownID)
      setEggStage(filteredEggStatus)

      setSelectedOptions(prevSelectedOptions => ({
        ...prevSelectedOptions,
        status: selectedDropdownID
      }))
    }
  }, [selectedDropdownID, eggMaster])

  const handleMenuClick = menu => {
    setSelectedMenu(menu)

    // Reset selectAll state when menu changes
    setSelectAll(false)
  }

  const handleCloseDrawer = () => {
    setOpenFilterDrawer(false)
    setSelectedMenu(leftMenu[0]) // Reset to default selected menu
    setSelectAll(false) // Reset Select All checkbox
    setSelectedOptions({
      Stage: [],
      Nursery: [],
      Site: [],
      'Collected By': [],
      collected_date: null
    }) // Reset selected options
  }

  const handleApplyFilter = () => {
    // Format the date correctly using dayjs
    const formattedDate = selectedDate ? dayjs(selectedDate).format('DD MMM YYYY') : ''

    const updatedSelectedOptions = {
      ...selectedOptions,
      collected_date: selectedDate
    }

    const combinedSelectedOptions = [
      ...updatedSelectedOptions.Stage,
      ...updatedSelectedOptions.Nursery,
      ...updatedSelectedOptions.Site,
      ...updatedSelectedOptions['Collected By'],
      ...(formattedDate ? [{ id: 'collected_date', name: formattedDate }] : [])
    ]

    // console.log('Combined Selected Options:', combinedSelectedOptions)

    setSelectedFiltersOptions(updatedSelectedOptions)
    setFilterList(combinedSelectedOptions)
    setOpenFilterDrawer(false)
  }

  const handleSelectAllChange = event => {
    const isChecked = event.target.checked
    setSelectAll(isChecked)

    if (isChecked) {
      const newSelectedOptions = {
        ...selectedOptions,
        [selectedMenu.name]: getOptionsForMenu(selectedMenu).map(item => ({ id: item.id, name: item.name }))
      }
      setSelectedOptions(newSelectedOptions)

      // console.log('Selected All: ')
    } else {
      const newSelectedOptions = {
        ...selectedOptions,
        [selectedMenu.name]: []
      }
      setSelectedOptions(newSelectedOptions)

      // console.log('Deselected All')
    }
  }

  const handleCheckboxChange = (id, name) => {
    const currentSelectedOptions = selectedOptions[selectedMenu.name]
    const isChecked = currentSelectedOptions.some(option => option.id === id)

    const newSelectedOptions = isChecked
      ? currentSelectedOptions.filter(option => option.id !== id)
      : [...currentSelectedOptions, { id, name }]

    const allOptions = getOptionsForMenu(selectedMenu)
    const areAllSelected = newSelectedOptions.length === allOptions.length

    setSelectedOptions({
      ...selectedOptions,
      [selectedMenu.name]: newSelectedOptions
    })

    setSelectAll(areAllSelected)

    // console.log('Updated Selection: ')
  }

  const getOptionsForMenu = menu => {
    switch (menu.name) {
      case 'Stage':
        return eggStage.map(stage => ({ id: stage?.id, name: stage.egg_state }))
      case 'Nursery':
        return nurseryList.map(nursery => ({
          id: nursery.nursery_id, // Ensure you use the correct field name
          name: nursery.nursery_name
        }))
      case 'Site':
        return siteList.map(site => ({ id: site.site_id, name: site.site_name }))
      case 'Collected By':
        return collectedByList.map(list => ({ id: list.user_id, name: list.user_full_name }))
      default:
        return []
    }
  }

  // Handler for date change
  const handleDateChange = newDate => {
    // console.log('New Date:', newDate)

    // Assuming newDate is a Day.js object
    setSelectedDate(newDate)

    setSelectedOptions(prevSelectedOptions => ({
      ...prevSelectedOptions,
      collected_date: newDate
    }))
  }

  const searchData = useCallback(
    debounce(async search => {
      setSearchQuery(search)

      try {
        if (selectedMenu.name === 'Nursery') {
          await NurseryList(search)
        } else if (selectedMenu.name === 'Collected By') {
          await CollectedByList(search)
        } else if (selectedMenu.name === 'Site') {
          const filtered = siteList.filter(site => site.site_name.toLowerCase().includes(search.toLowerCase()))
          if (search) {
            setSiteList(filtered)
          } else {
            if (authData?.userData?.user?.zoos[0]?.sites.length > 0) {
              setSiteList(authData?.userData?.user?.zoos[0].sites)
            }
          }
        } else if (selectedMenu.name === 'Stage') {
          if (search) {
            const filtered = eggStage.filter(stage => stage.egg_state.toLowerCase().includes(search.toLowerCase()))
            setEggStage(filtered)
          } else {
            if (selectedDropdownID && eggMaster) {
              const filteredEggStatus = eggMaster?.egg_state?.filter(
                status => status?.egg_status_id === selectedDropdownID
              )
              setEggStage(filteredEggStatus)
            }
          }
        }

        // Add other conditions for different menus if needed
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    [selectedMenu, eggStage, siteList, selectedDropdownID]
  )

  const handleSearchChange = event => {
    const query = event.target.value.toLowerCase()
    setSearchQuery(event.target.value)

    // console.log('SearchQuery:>> ', event.target.value)
    searchData(event.target.value)
  }

  const handleDropdownChange = event => {
    setSelectedDropdownId(event.target.value)
  }

  return (
    <Drawer
      anchor='right'
      open={openFilterDrawer}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '562px'], height: '100vh' },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        backgroundColor: 'background.default'
      }}
    >
      <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'background.default',
          p: theme => theme.spacing(3, 3.255, 3, 5.255)
        }}
      >
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
          <Icon icon='mage:filter' fontSize={30} />
          <Typography sx={{ fontSize: '24px', fontWeight: 500 }}>Filter - </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleCloseDrawer}>
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>
      </Box>
      <Box
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'] },
          backgroundColor: 'background.default',
          height: '100%'
        }}
      >
        <Grid container sx={{ px: 5 }}>
          <Grid item md={4} sm={4} xs={4}>
            {leftMenu.map(menu => (
              <Box
                key={menu.id}
                sx={{
                  width: '190px',
                  bgcolor: selectedMenu?.id === menu.id ? 'white' : 'transparent',
                  cursor: 'pointer',
                  p: 4,
                  borderTopLeftRadius: '8px',
                  borderBottomLeftRadius: '8px'
                }}
                onClick={() => handleMenuClick(menu)}
              >
                <Typography sx={{ color: theme.palette.primary.dark, fontSize: '16px', fontWeight: 400 }}>
                  {menu.name}
                </Typography>
              </Box>
            ))}
          </Grid>
          <Grid item md={8} sm={8} xs={8}>
            <Box
              sx={{
                bgcolor: '#FFFFFF',
                p: '16px',
                borderRadius: '8px',
                width: '345px',
                height: '550px',
                overflowY: 'auto', // Enable vertical scrolling
                '&::-webkit-scrollbar': {
                  width: 0,
                  height: 0
                },
                '-ms-overflow-style': 'none', // Hide scrollbar for Internet Explorer and Edge
                scrollbarWidth: 'none' // Hide scrollbar for Firefox
              }}
            >
              {selectedMenu?.name === 'Collected Date' ? null : (
                <>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      border: '1px solid #C3CEC7',
                      borderRadius: '4px',
                      padding: '0 8px',
                      height: '40px',
                      mb: 4
                    }}
                  >
                    <Icon icon='mi:search' color={theme.palette.customColors.OnSurfaceVariant} />
                    <TextField
                      variant='outlined'
                      placeholder='Search'
                      value={searchQuery}
                      onChange={handleSearchChange}
                      InputProps={{
                        disableUnderline: false
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
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Checkbox
                      checked={selectAll}
                      onChange={handleSelectAllChange}
                      inputProps={{ 'aria-label': 'controlled' }}
                    />
                    <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#839D8D' }}>Select All</Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                </>
              )}

              {selectedMenu?.name === 'Stage' && (
                <FormControl fullWidth>
                  <InputLabel id='dropdown-label'>Select Status</InputLabel>
                  <Select
                    labelId='dropdown-label'
                    label='Select Status'
                    value={selectedDropdownID}
                    onChange={handleDropdownChange}
                  >
                    {eggMaster?.egg_status.map(item => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.egg_status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {selectedMenu && (
                <Box sx={{ mt: 2 }}>
                  {getOptionsForMenu(selectedMenu).map((option, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Checkbox
                        checked={selectedOptions[selectedMenu.name]?.some(item => item.id === option.id)}
                        onChange={() => handleCheckboxChange(option.id, option.name)}
                        inputProps={{ 'aria-label': 'controlled' }}
                      />
                      <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#839D8D' }}>
                        {option.name}
                      </Typography>
                    </Box>
                  ))}
                  {selectedMenu?.name === 'Collected Date' && (
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        sx={{ width: '100%', '& .MuiIconButton-edgeEnd': { display: 'block' } }}
                        maxDate={dayjs()}
                        value={selectedDate}
                        onChange={handleDateChange}
                      />
                    </LocalizationProvider>
                  )}
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
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
          boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.2)',
          zIndex: 123
        }}
      >
        <LoadingButton fullWidth variant='outlined' size='large' onClick={handleCloseDrawer}>
          CANCEL ALL
        </LoadingButton>
        <LoadingButton fullWidth variant='contained' size='large' onClick={handleApplyFilter}>
          APPLY FILTER
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default EggFilterDrawer

const leftMenu = [
  { id: 1, name: 'Stage' },
  { id: 2, name: 'Site' },
  { id: 3, name: 'Nursery' },
  { id: 4, name: 'Collected Date' },
  { id: 5, name: 'Collected By' },
  { id: 6, name: 'Enclosure' }
]
