import { useTheme } from '@emotion/react'
import { LoadingButton } from '@mui/lab'
import {
  Badge,
  Checkbox,
  Divider,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material'
import { Box, styled } from '@mui/system'
import React, { useCallback, useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'

const leftMenu = [
  { id: 1, name: 'Pharmacy' },
  { id: 2, name: 'User' },
  { id: 3, name: 'Drug Type' },
  { id: 4, name: 'Priority' }
]

const drugTypeOptions = [
  { id: 'all', name: 'All' },
  { id: 'controlled', name: 'Controlled Substance' },
  { id: 'prescription', name: 'Prescription Required' }
]

const priorityOptions = [
  { id: 'all', name: 'All' },
  { id: 'normal', name: 'Normal' },
  { id: 'high', name: 'High' },
  { id: 'emergency', name: 'Emergency' }
]

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    borderRadius: '20%'
  }
}))

const AllRequestedItemFilterDrawer = ({
  openFilterDrawer,
  setOpenFilterDrawer,
  onApplyFilter,
  selectedOptions,
  setSelectedOptions,
  pharmacyList,
  users,
  handleSelectAllPharmacy,
  handleSelectAllUser
}) => {
  const theme = useTheme()

  const [selectedMenu, setSelectedMenu] = useState(leftMenu[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isAllPharmaciesSelected =
    pharmacyList?.length > 0 && selectedOptions['Pharmacy']?.length === pharmacyList?.length

  const isAllUsersSelected = users?.length > 0 && selectedOptions['User']?.length === users?.length

  const handleCloseDrawer = () => {
    setOpenFilterDrawer(false)
  }

  const handleMenuClick = menu => {
    setSelectedMenu(menu)
    setSearchQuery('')
  }

  const handleClearAll = () => {
    setSelectedOptions({})
  }

  const handleCheckbox = useCallback(
    (id, menuName) => {
      setSelectedOptions(prevOptions => {
        const isSelected = prevOptions[menuName]?.includes(id)

        return {
          ...prevOptions,
          [menuName]: isSelected
            ? prevOptions[menuName].filter(itemId => itemId !== id)
            : [...(prevOptions[menuName] || []), id]
        }
      })
    },
    [setSelectedOptions]
  )

  const handleDrugTypeChange = event => {
    setSelectedOptions(prevOptions => ({
      ...prevOptions,
      'Drug Type': event.target.value
    }))
  }

  const handlePriorityChange = event => {
    setSelectedOptions(prevOptions => ({
      ...prevOptions,
      Priority: event.target.value
    }))
  }

  const handleSearch = useCallback(event => {
    setSearchQuery(event.target.value)
  }, [])

  const applyFilters = useCallback(() => {
    if (isSubmitting) return
    setIsSubmitting(true)

    const filterData = {}

    if (selectedOptions['User'] && selectedOptions['User'].length > 0) {
      filterData['User'] = selectedOptions['User']
    }

    if (selectedOptions['Pharmacy'] && selectedOptions['Pharmacy'].length > 0) {
      filterData['Pharmacy'] = selectedOptions['Pharmacy']
    }

    if (selectedOptions['Drug Type'] && selectedOptions['Drug Type'] !== 'all') {
      filterData[selectedOptions['Drug Type']] = 1
    }

    if (selectedOptions['Priority'] && selectedOptions['Priority'] !== 'all') {
      filterData['Priority'] = selectedOptions['Priority']
    }

    onApplyFilter(filterData)
    setOpenFilterDrawer(false)
  }, [selectedOptions, onApplyFilter, setOpenFilterDrawer, isSubmitting])

  const filteredPharmacyList = pharmacyList?.filter(pharmacy =>
    pharmacy.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredUsersList = users?.filter(user => user.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const getMenuBadgeCount = menuName => {
    if (menuName === 'Drug Type') {
      return selectedOptions[menuName] && selectedOptions[menuName] !== 'all' ? 1 : 0
    }

    if (menuName === 'Priority') {
      return selectedOptions[menuName] && selectedOptions[menuName] !== 'all' ? 1 : 0
    }

    return selectedOptions[menuName] ? selectedOptions[menuName].length : 0
  }

  const handlePharmacySelectAll = () => {
    handleSelectAllPharmacy()
  }

  const handleUserSelectAll = () => {
    handleSelectAllUser()
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
          <Typography sx={{ fontSize: '24px', fontWeight: 500 }}>Filter</Typography>
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
          <Grid item size={{ xs: 4, sm: 4, md: 4 }}>
            {leftMenu?.map(menu => (
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
                <Typography
                  sx={{
                    color: theme.palette.primary.dark,
                    fontSize: '16px',
                    fontWeight: 400,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  {menu.name}
                  <StyledBadge badgeContent={getMenuBadgeCount(menu.name)} color='primary' sx={{ ml: 2 }} />
                </Typography>
              </Box>
            ))}
          </Grid>
          <Grid item size={{ xs: 8, sm: 8, md: 8 }}>
            <Box
              sx={{
                bgcolor: '#FFFFFF',
                p: '16px',
                borderRadius: '8px',
                width: '345px',
                height: 'calc(100dvh - 190px)',
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: 0,
                  height: 0
                },
                '-ms-overflow-style': 'none',
                scrollbarWidth: 'none'
              }}
            >
              {selectedMenu.name === 'Pharmacy' ? (
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
                      onChange={handleSearch}
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
                      checked={isAllPharmaciesSelected}
                      indeterminate={selectedOptions['Pharmacy']?.length > 0 && !isAllPharmaciesSelected}
                      inputProps={{ 'aria-label': 'controlled' }}
                      onChange={handlePharmacySelectAll}
                    />
                    <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#839D8D' }}>Select All</Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  {filteredPharmacyList?.map(pharmacy => (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }} key={pharmacy?.id}>
                      <Checkbox
                        inputProps={{ 'aria-label': 'controlled' }}
                        checked={selectedOptions['Pharmacy']?.includes(pharmacy?.id)}
                        onChange={() => handleCheckbox(pharmacy?.id, 'Pharmacy')}
                      />
                      <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#839D8D' }}>
                        {pharmacy?.name}
                      </Typography>
                    </Box>
                  ))}
                </>
              ) : selectedMenu.name === 'User' ? (
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
                      onChange={handleSearch}
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
                      checked={isAllUsersSelected}
                      indeterminate={selectedOptions['User']?.length > 0 && !isAllUsersSelected}
                      inputProps={{ 'aria-label': 'controlled' }}
                      onChange={handleUserSelectAll}
                    />
                    <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#839D8D' }}>Select All</Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  {filteredUsersList?.map(user => (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }} key={user?.id}>
                      <Checkbox
                        inputProps={{ 'aria-label': 'controlled' }}
                        checked={selectedOptions['User']?.includes(user?.id)}
                        onChange={() => handleCheckbox(user?.id, 'User')}
                      />
                      <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#839D8D' }}>{user?.name}</Typography>
                    </Box>
                  ))}
                </>
              ) : selectedMenu.name === 'Drug Type' ? (
                <>
                  <FormControl fullWidth>
                    <Select
                      value={selectedOptions['Drug Type'] || 'all'}
                      onChange={handleDrugTypeChange}
                      sx={{
                        '& .MuiSelect-select': {
                          fontSize: '16px',
                          fontWeight: 400,
                          color: '#839D8D'
                        }
                      }}
                    >
                      {drugTypeOptions.map(option => (
                        <MenuItem
                          key={option.id}
                          value={option.id}
                          sx={{
                            fontSize: '16px',
                            fontWeight: 400,
                            color: '#839D8D'
                          }}
                        >
                          {option.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </>
              ) : selectedMenu.name === 'Priority' ? (
                <>
                  <FormControl fullWidth>
                    <Select
                      value={selectedOptions['Priority'] || 'all'}
                      onChange={handlePriorityChange}
                      sx={{
                        '& .MuiSelect-select': {
                          fontSize: '16px',
                          fontWeight: 400,
                          color: '#839D8D'
                        }
                      }}
                    >
                      {priorityOptions.map(option => (
                        <MenuItem
                          key={option.id}
                          value={option.id}
                          sx={{
                            fontSize: '16px',
                            fontWeight: 400,
                            color: '#839D8D'
                          }}
                        >
                          {option.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </>
              ) : null}
            </Box>
          </Grid>
        </Grid>
      </Box>
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
        <LoadingButton fullWidth variant='outlined' size='large' onClick={handleClearAll}>
          CLEAR ALL
        </LoadingButton>
        <LoadingButton fullWidth variant='contained' size='large' onClick={applyFilters}>
          APPLY FILTER
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default AllRequestedItemFilterDrawer
