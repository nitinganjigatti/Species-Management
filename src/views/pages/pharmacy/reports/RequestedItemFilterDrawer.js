import { useTheme } from '@emotion/react'
import { LoadingButton } from '@mui/lab'
import { Badge, Checkbox, Divider, Drawer, Grid, IconButton, TextField, Typography } from '@mui/material'
import { Box, styled } from '@mui/system'
import React, { useCallback, useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'

const leftMenu = [
  { id: 1, name: 'pharmacy' },
  { id: 2, name: 'user' }
]

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    borderRadius: '20%'
  }
}))

const RequestedItemFilterDrawer = ({
  openFilterDrawer,
  setOpenFilterDrawer,
  onApplyFilter,
  selectedOptions,
  setSelectedOptions,
  pharmacyList,
  users,
  selectAllPharmacy,
  handleSelectAllPharmacy,
  selectAllUser,
  handleSelectAllUser
}) => {
  const theme = useTheme()

  const [selectedMenu, setSelectedMenu] = useState(leftMenu[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectAll, setSelectAll] = useState(false)

  const handleCloseDrawer = () => {
    setOpenFilterDrawer(false)
    setSelectedMenu(leftMenu[0])
    setSelectAll(false)
    setSearchQuery('')
  }

  const handleMenuClick = menu => {
    setSelectedMenu(menu)
    setSearchQuery('')
    setSelectAll(false)
  }

  const handleSelectAll = useCallback(
    (list, filterFn, menuName, event) => {
      const filteredList = list?.filter(filterFn) || []

      setSelectedOptions(prevOptions => ({
        ...prevOptions,
        [menuName]: event.target.checked ? filteredList.map(item => item.id) : []
      }))
      setSelectAll(event.target.checked)
    },
    [setSelectedOptions, setSelectAll]
  )

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

  const handleSearch = useCallback(event => {
    setSearchQuery(event.target.value)
  }, [])

  useEffect(() => {
    if (selectedMenu.name === 'pharmacy') {
      const filteredList = pharmacyList?.filter(pharmacy =>
        pharmacy.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      if (
        filteredList?.length > 0 &&
        filteredList?.every(pharmacy => selectedOptions['pharmacy']?.includes(pharmacy.id))
      ) {
        setSelectAll(true)
      } else {
        setSelectAll(false)
      }
    }

    if (selectedMenu.name === 'user') {
      const filteredList = users?.filter(user => user.name.toLowerCase().includes(searchQuery.toLowerCase()))
      if (filteredList?.length > 0 && filteredList?.every(user => selectedOptions['user']?.includes(user.id))) {
        setSelectAll(true)
      } else {
        setSelectAll(false)
      }
    }
  }, [selectedOptions, searchQuery, pharmacyList, selectedMenu, users])

  const applyFilters = () => {
    const filterData = {}

    if (selectedOptions['user'] && selectedOptions['user'].length > 0) {
      filterData['user'] = selectedOptions['user']
    }

    if (selectedOptions['pharmacy'] && selectedOptions['pharmacy'].length > 0) {
      filterData['pharmacy'] = selectedOptions['pharmacy']
    }

    onApplyFilter(filterData)
    setOpenFilterDrawer(false)
  }

  const filteredPharmacyList = pharmacyList?.filter(pharmacy =>
    pharmacy.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredUsersList = users?.filter(user => user.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const getMenuBadgeCount = menuName => {
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
          <Grid item md={4} sm={4} xs={4}>
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
          <Grid item md={8} sm={8} xs={8}>
            <Box
              sx={{
                bgcolor: '#FFFFFF',
                p: '16px',
                borderRadius: '8px',
                width: '345px',
                height: 'calc(100vh - 185px)',
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: 0,
                  height: 0
                },
                '-ms-overflow-style': 'none',
                scrollbarWidth: 'none'
              }}
            >
              {selectedMenu.name === 'pharmacy' ? (
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
                      checked={selectAllPharmacy}
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
                        checked={selectedOptions['pharmacy']?.includes(pharmacy?.id)}
                        onChange={() => handleCheckbox(pharmacy?.id, 'pharmacy')}
                      />
                      <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#839D8D' }}>
                        {pharmacy?.name}
                      </Typography>
                    </Box>
                  ))}
                </>
              ) : selectedMenu.name === 'user' ? (
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
                      checked={selectAllUser}
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
                        checked={selectedOptions['user']?.includes(user?.id)}
                        onChange={() => handleCheckbox(user?.id, 'user')}
                      />
                      <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#839D8D' }}>{user?.name}</Typography>
                    </Box>
                  ))}
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
        <LoadingButton fullWidth variant='outlined' size='large' onClick={handleCloseDrawer}>
          CLOSE
        </LoadingButton>
        <LoadingButton fullWidth variant='contained' size='large' onClick={applyFilters}>
          APPLY FILTER
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default RequestedItemFilterDrawer
