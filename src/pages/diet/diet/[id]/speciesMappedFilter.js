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
  TextField,
  Typography
} from '@mui/material'
import React, { useState } from 'react'
import Icon from 'src/@core/components/icon'

const SpeciesMappedtoDietFilter = ({
  openFilterDrawer,
  setOpenFilterDrawer,
  tabsforfilter,
  items,
  setSearchTerm,
  searchTerm,
  setSelectedItems,
  selectedItems,
  activeTab,
  setActiveTab
}) => {
  const theme = useTheme()
  const [tempSelectedItems, setTempSelectedItems] = useState(selectedItems)
  const handleCloseDrawer = () => {
    setOpenFilterDrawer(false)
  }
  const handleApplyFilter = () => {
    setSelectedItems(tempSelectedItems)
    handleCloseDrawer()
  }

  // to remove values only from active tab on click of cancel
  // const handleCancelAll = () => {
  //   setTempSelectedItems({ ...tempSelectedItems, [activeTab]: [] })

  //   setSelectedItems({ ...selectedItems, [activeTab]: [] })
  //   setOpenFilterDrawer(false)
  // }

  const handleCancelAll = () => {
    // Clear all tabs in tempSelectedItems
    const clearedTempSelectedItems = Object.keys(tempSelectedItems).reduce((acc, key) => {
      acc[key] = []
      return acc
    }, {})

    // Clear all tabs in selectedItems
    const clearedSelectedItems = Object.keys(selectedItems).reduce((acc, key) => {
      acc[key] = []
      return acc
    }, {})

    setTempSelectedItems(clearedTempSelectedItems)
    setSelectedItems(clearedSelectedItems)
    setOpenFilterDrawer(false)
  }

  // const handleSelectAll = () => {
  //   const allSelectedIds = items[activeTab].map(item => item.id)
  //   setSelectedItems({
  //     ...selectedItems,
  //     [activeTab]: selectedItems[activeTab].length === items[activeTab].length ? [] : allSelectedIds
  //   })
  // }

  // const handleCheckboxChange = item => {
  //   console.log(item, 'item')
  //   const isSelected = selectedItems[activeTab].includes(item.id)
  //   const updatedSelection = isSelected
  //     ? selectedItems[activeTab].filter(id => id !== item.id)
  //     : [...selectedItems[activeTab], item.id]

  //   setSelectedItems({ ...selectedItems, [activeTab]: updatedSelection })
  // }

  const handleSelectAll = () => {
    const allSelectedIds = items[activeTab].map(item =>
      activeTab === 'Site' ? Number(item.nursery_id) : Number(item.id)
    )
    setTempSelectedItems({
      ...tempSelectedItems,
      [activeTab]: tempSelectedItems[activeTab].length === items[activeTab].length ? [] : allSelectedIds
    })
  }

  const handleCheckboxChange = item => {
    const itemId = activeTab === 'Site' ? Number(item.nursery_id) : Number(item.id)
    const isSelected = tempSelectedItems[activeTab].includes(itemId)
    const updatedSelection = isSelected
      ? tempSelectedItems[activeTab].filter(id => id !== itemId)
      : [...tempSelectedItems[activeTab], itemId]

    setTempSelectedItems({ ...tempSelectedItems, [activeTab]: updatedSelection })
  }

  const filteredItems = items[activeTab].filter(item => {
    const itemName = activeTab === 'Site' ? item.site_name : item.name
    return itemName.toLowerCase().includes(searchTerm.toLowerCase())
  })
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
      {/* header */}
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

      {/* container */}
      <Box
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'] },
          backgroundColor: 'background.default',
          height: '100%'
        }}
      >
        <Grid container sx={{ px: 5 }}>
          <Grid item md={4} sm={4} xs={4}>
            {tabsforfilter.map(tab => (
              <Box
                key={tab}
                onClick={() => setActiveTab(tab)}
                sx={{
                  padding: 1,
                  cursor: 'pointer',
                  backgroundColor: activeTab === tab ? '#fff' : 'transparent',
                  fontWeight: activeTab === tab ? 'bold' : 'normal',
                  color: theme.palette.primary.dark,
                  fontSize: '16px',
                  fontWeight: 400,
                  py: 4,
                  pl: 4,
                  borderTopLeftRadius: '6px',
                  borderBottomLeftRadius: '6px'
                }}
              >
                {tab}
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
                  <Icon
                    icon='mi:search'
                    //color={theme.palette.customColors.OnSurfaceVariant}
                  />
                  <TextField
                    variant='outlined'
                    placeholder='Search'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
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
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%', paddingBottom: '8px' }}>
                    <Checkbox
                      checked={tempSelectedItems[activeTab].length === items[activeTab].length}
                      onChange={handleSelectAll}
                    />
                    <span>Select All</span>
                  </div>
                </Box>
                <Divider sx={{ mb: 3 }} />
              </>

              <Box sx={{ mt: 2, width: '100%' }}>
                <Box sx={{ mb: 3, width: '100%' }}>
                  <Box sx={{ maxHeight: 600, mt: 1, width: '100%' }}>
                    {console.log(filteredItems, 'filteredItems')}
                    {filteredItems.map(item => {
                      const itemName = activeTab === 'Site' ? item.site_name : item.name
                      const itemId = activeTab === 'Site' ? Number(item.nursery_id) : Number(item.id)
                      return (
                        <div
                          key={itemId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                            paddingBottom: '8px'
                          }}
                        >
                          <Checkbox
                            checked={tempSelectedItems[activeTab].includes(itemId)}
                            onChange={() => handleCheckboxChange(item)}
                          />
                          <span>{itemName}</span>
                        </div>
                      )
                    })}
                  </Box>
                </Box>
              </Box>
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
        <LoadingButton fullWidth variant='outlined' size='large' onClick={handleCancelAll}>
          CANCEL ALL
        </LoadingButton>
        <LoadingButton fullWidth variant='contained' size='large' onClick={handleApplyFilter}>
          APPLY FILTER
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default SpeciesMappedtoDietFilter
