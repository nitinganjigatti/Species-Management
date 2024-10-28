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
import { GetEggMaster } from 'src/lib/api/egg/egg'
import { GetNurseryList } from 'src/lib/api/egg/nursery'

import { getSpecieList, getTaxonomyList } from 'src/lib/api/egg/egg/createAnimal'
import { getFilterBatchList } from 'src/lib/api/egg/dashboard'
import { AuthContext } from 'src/context/AuthContext'

const leftMenu = [
  { id: 1, name: 'Species' },
  { id: 2, name: 'Batch' },
  { id: 3, name: 'Nursery' },
  { id: 4, name: 'Security status' },

  // { id: 5, name: 'Condition' },
  { id: 6, name: 'Reason' },
  { id: 7, name: 'Site' }
]

const DashboardFilter = ({
  isFilterOpen,
  setIsFilterOpen,
  selectedOptions,
  setSelectedOptions,
  setFilterList,
  setShowFilters,
  setApplyFilters,
  filterList,
  setDiscardList
}) => {
  const theme = useTheme()
  const authData = useContext(AuthContext)
  const [selectedMenu, setSelectedMenu] = useState(leftMenu[0])
  const [nurseryList, setNurseryList] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [eggMaster, setEggMaster] = useState(null)
  const [selectAll, setSelectAll] = useState(false)
  const [taxonomyList, setTaxonomyList] = useState([])

  const [batchList, setBatchList] = useState([])
  const [conditionList, setConditionList] = useState([])
  const [siteList, setSiteList] = useState([])

  // console.log('siteList :>> ', siteList)

  const handleCloseDrawer = () => {
    setIsFilterOpen(false)
    setFilterList([])
    setSelectedOptions({ Species: [], Nursery: [], Batch: [], 'Security status': [], Condition: [], Reason: [] })
  }

  const handleMenuClick = menu => {
    setSelectedMenu(menu)
    setSearchQuery('')
    searchData('')

    setSelectAll(false)
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

  const getEggMasterData = async () => {
    try {
      await GetEggMaster().then(res => {
        if (res.success) {
          setEggMaster(res?.data)

          setConditionList(res?.data?.egg_condition)
        }
      })
    } catch (e) {
      console.log(e)
    }
  }

  const getTaxonomyListFunc = async q => {
    try {
      getSpecieList(q).then(res => {
        if (res.result.length > 0) {
          setTaxonomyList(res?.result)
        }
      })
    } catch (error) {}
  }

  const getBatchList = async q => {
    try {
      const params = {
        q
      }
      await getFilterBatchList(params).then(res => {
        if (res?.data?.data.success) {
          setBatchList(res?.data?.data?.data?.result)
        }
      })
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    if (isFilterOpen) {
      NurseryList()
      getEggMasterData()
      getTaxonomyListFunc()
      getBatchList()
      if (authData?.userData?.user?.zoos[0]?.sites.length > 0) {
        setSiteList(authData?.userData?.user?.zoos[0].sites)
      }
    }
  }, [isFilterOpen])

  const handleCheckboxChange = (id, name) => {
    const currentSelectedOptions = selectedOptions[selectedMenu.name] || []
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

    // Always update selectAll based on the new selection state
    setSelectAll(areAllSelected)
  }

  const handleSelectAllChange = event => {
    const isChecked = event.target.checked
    setSelectAll(isChecked)

    if (isChecked) {
      // Select all options for the current menu
      const newSelectedOptions = {
        ...selectedOptions,
        [selectedMenu.name]: getOptionsForMenu(selectedMenu).map(item => ({ id: item.id, name: item.name }))
      }
      setSelectedOptions(newSelectedOptions)
    } else {
      // Deselect all options for the current menu
      const newSelectedOptions = {
        ...selectedOptions,
        [selectedMenu.name]: []
      }
      setSelectedOptions(newSelectedOptions)
    }
  }

  const getOptionsForMenu = menu => {
    switch (menu.name) {
      case 'Species':
        return (
          taxonomyList?.map(species => ({
            id: species.tsn,
            name: species.common_name
          })) || []
        )
        break
      case 'Batch':
        return (
          batchList?.map(batch => ({
            id: batch.egg_discard_id,
            name: batch.request_id
          })) || []
        )
      case 'Nursery':
        return (
          nurseryList?.map(nursery => ({
            id: nursery.nursery_id,
            name: nursery.nursery_name
          })) || []
        )
      case 'Security status':
        return [
          { id: 'DISCARD_REQUEST_GENERATED', name: 'Security check pending' },
          { id: 'COMPLETED', name: 'Security Checked' }
        ]

      // case 'Condition':
      //   return (
      //     conditionList?.map(condition => ({
      //       id: condition.id,
      //       name: condition.egg_condition
      //     })) || []
      //   )
      case 'Reason':
        const filteredEggStage = eggMaster?.egg_state?.filter(stage => stage.egg_status_id === '3')

        return filteredEggStage?.map(stage => ({
          id: stage.id,
          name: stage.egg_state
        }))

      case 'Site':
        return (
          siteList?.map(site => ({
            id: site.site_id,
            name: site.site_name
          })) || []
        )
      default:
        return []
    }
  }

  const handleSearchChange = event => {
    const query = event.target.value.toLowerCase()
    setSearchQuery(event.target.value)

    searchData(event.target.value)
  }

  const handleApplyFilter = () => {
    setSearchQuery('')
    setDiscardList([])

    const combinedSelectedOptions = [
      ...selectedOptions.Species,
      ...selectedOptions.Nursery,
      ...selectedOptions.Batch,

      ...selectedOptions['Security status'],

      ...selectedOptions.Condition,
      ...selectedOptions.Reason,
      ...selectedOptions.Site
    ]

    setFilterList(combinedSelectedOptions)
    setApplyFilters(selectedOptions)
    setIsFilterOpen(false)
  }

  const searchData = useCallback(
    debounce(async search => {
      setSearchQuery(search)

      try {
        if (selectedMenu.name === 'Nursery') {
          await NurseryList(search)
        } else if (selectedMenu.name === 'Batch') {
          await getBatchList(search)
        } else if (selectedMenu.name === 'Species') {
          getTaxonomyListFunc(search)
        }
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    [selectedMenu]
  )

  return (
    <Drawer
      anchor='right'
      open={isFilterOpen}
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
          <Typography sx={{ fontSize: '24px', fontWeight: 500 }}>
            Filter {filterList?.length > 0 && -filterList?.length}{' '}
          </Typography>
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
                height: 'calc(100vh - 185px)',
                overflowY: 'auto', // Enable vertical scrolling
                '&::-webkit-scrollbar': {
                  width: 0,
                  height: 0
                },
                '-ms-overflow-style': 'none', // Hide scrollbar for Internet Explorer and Edge
                scrollbarWidth: 'none' // Hide scrollbar for Firefox
              }}
            >
              <>
                {(selectedMenu.name === 'Species' ||
                  selectedMenu.name === 'Nursery' ||
                  selectedMenu.name === 'Batch') && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      border: '1px solid #C3CEC7',
                      borderRadius: '4px',
                      padding: '0 8px',
                      height: '40px',
                      mb: 4,
                      marginLeft: 3
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
                )}

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

              {selectedMenu && (
                <Box sx={{ mt: 2 }}>
                  {getOptionsForMenu(selectedMenu)?.map((option, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Checkbox
                        checked={selectedOptions[selectedMenu.name]?.some(item => item.id === option.id)}
                        onChange={() => handleCheckboxChange(option.id, option.name)}
                        inputProps={{ 'aria-label': 'controlled' }}
                      />
                      <Typography
                        sx={{ fontSize: '16px', fontWeight: 400, color: '#839D8D', textTransform: 'capitalize' }}
                      >
                        {option.name}
                      </Typography>
                    </Box>
                  ))}
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
        <LoadingButton
          fullWidth
          variant='contained'
          size='large'
          onClick={() => {
            handleApplyFilter()

            setShowFilters(true)
          }}
        >
          APPLY FILTER
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default DashboardFilter
