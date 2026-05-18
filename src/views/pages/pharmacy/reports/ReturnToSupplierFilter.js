import { useTheme } from '@emotion/react'
import styled from '@emotion/styled'
import { LoadingButton } from '@mui/lab'
import { Badge, Checkbox, Divider, Drawer, Grid, IconButton, Tooltip, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React, { useCallback, useState } from 'react'
import Icon from 'src/@core/components/icon'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import MUISelect from 'src/views/forms/form-fields/MUISelect'

const leftMenu = [
  { id: 1, name: 'Supplier Name' },
  { id: 2, name: 'Discarded By' },
  { id: 3, name: 'Drug Type' }
]

const drugTypeOptions = [
  { id: 'all', name: 'All' },
  { id: 'controlled', name: 'Controlled Substance' },
  { id: 'prescription', name: 'Prescription required' }
]

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    borderRadius: '20%'
  }
}))

const ReturnToSupplierFilter = ({
  openFilterDrawer,
  setOpenFilterDrawer,
  onApplyFilter,
  selectedOptions,
  setSelectedOptions,
  supplierData,
  handleSelectAllSuppliers,
  users,
  handleSelectAllUser
}) => {
  const theme = useTheme()

  const [selectedMenu, setSelectedMenu] = useState(leftMenu[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isAllSupplierSelected =
    supplierData?.length > 0 && selectedOptions['Supplier Name']?.length === supplierData?.length

  const isAllUsersSelected = users?.length > 0 && selectedOptions['Discarded By']?.length === users?.length

  const handleCloseDrawer = () => {
    setOpenFilterDrawer(false)
    setSelectedMenu(leftMenu[0])
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

  const handleSearch = useCallback(value => {
    setSearchQuery(value)
  }, [])

  const applyFilters = useCallback(() => {
    if (isSubmitting) return
    setIsSubmitting(true)
    const filterData = {}
    if (selectedOptions['Supplier Name'] && selectedOptions['Supplier Name'].length > 0) {
      filterData['suppliersName'] = selectedOptions['Supplier Name']
    }

    if (selectedOptions['Discarded By'] && selectedOptions['Discarded By'].length > 0) {
      filterData['discardedBy'] = selectedOptions['Discarded By']
    }

    if (selectedOptions['Drug Type'] && selectedOptions['Drug Type'] !== 'all') {
      filterData[selectedOptions['Drug Type']] = 1
    }

    onApplyFilter(filterData)
    setOpenFilterDrawer(false)
    setIsSubmitting(false)
  }, [selectedOptions, onApplyFilter, setOpenFilterDrawer, isSubmitting])

  const getMenuBadgeCount = menuName => {
    if (menuName === 'Drug Type') {
      return selectedOptions[menuName] && selectedOptions[menuName] !== 'all' ? 1 : 0
    }

    return selectedOptions[menuName] ? selectedOptions[menuName].length : 0
  }

  const filteredSuppliersList = supplierData?.filter(supplier =>
    supplier.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredUsersList = users?.filter(user => user.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleSuppliersSelectAll = () => {
    handleSelectAllSuppliers()
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
              {selectedMenu.name === 'Supplier Name' ? (
                <>
                  <Box>
                    <MUISearch
                      placeholder='Search'
                      value={searchQuery}
                      onChange={e => handleSearch(e.target.value)}
                      onClear={() => handleSearch('')}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Checkbox
                      checked={isAllSupplierSelected}
                      indeterminate={selectedOptions['Supplier Name']?.length > 0 && !isAllSupplierSelected}
                      inputProps={{ 'aria-label': 'controlled' }}
                      onChange={handleSuppliersSelectAll}
                    />
                    <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#839D8D' }}>Select All</Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  {filteredSuppliersList?.map(supplier => (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }} key={supplier?.id}>
                      <Checkbox
                        inputProps={{ 'aria-label': 'controlled' }}
                        checked={selectedOptions['Supplier Name']?.includes(supplier?.id)}
                        onChange={() => handleCheckbox(supplier?.id, 'Supplier Name')}
                      />
                      <Tooltip title={supplier?.company_name}>
                        <Typography
                          sx={{
                            fontSize: '16px',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            fontWeight: 400,
                            color: '#839D8D'
                          }}
                        >
                          {supplier?.company_name}
                        </Typography>
                      </Tooltip>
                    </Box>
                  ))}
                </>
              ) : selectedMenu.name === 'Discarded By' ? (
                <>
                  <Box>
                    <MUISearch
                      placeholder='Search'
                      value={searchQuery}
                      onChange={e => handleSearch(e.target.value)}
                      onClear={() => handleSearch('')}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Checkbox
                      checked={isAllUsersSelected}
                      indeterminate={selectedOptions['Discarded By']?.length > 0 && !isAllUsersSelected}
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
                        checked={selectedOptions['Discarded By']?.includes(user?.id)}
                        onChange={() => handleCheckbox(user?.id, 'Discarded By')}
                      />
                      <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#839D8D' }}>{user?.name}</Typography>
                    </Box>
                  ))}
                </>
              ) : selectedMenu.name === 'Drug Type' ? (
                <>
                  <MUISelect
                    value={selectedOptions['Drug Type'] || 'all'}
                    onChange={handleDrugTypeChange}
                    sx={{
                      '& .MuiSelect-select': {
                        fontSize: '16px',
                        fontWeight: 400,
                        color: '#839D8D'
                      }
                    }}
                    options={drugTypeOptions}
                  />
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
          CANCEL ALL
        </LoadingButton>
        <LoadingButton fullWidth variant='contained' size='large' onClick={applyFilters}>
          APPLY FILTER
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default ReturnToSupplierFilter
