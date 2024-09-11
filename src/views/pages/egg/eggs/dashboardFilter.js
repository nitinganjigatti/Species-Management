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
import { useRouter } from 'next/router'

const leftMenu = [
  { id: 1, name: 'Species' },
  { id: 2, name: 'Batch' },
  { id: 3, name: 'Nursery' },
  { id: 4, name: 'Security status' },
  { id: 5, name: 'Condition' },
  { id: 6, name: 'Reason' }
]

const DashboardFilter = ({ isFilterOpen, setIsFilterOpen }) => {
  const theme = useTheme()
  const [selectedMenu, setSelectedMenu] = useState(leftMenu[0])

  const handleCloseDrawer = () => {
    setIsFilterOpen(false)
  }

  const handleMenuClick = menu => {
    setSelectedMenu(menu)
  }

  const getOptionsForMenu = menu => {
    switch (menu.name) {
      case 'Species':
        return []
        break
      case 'Batch':
        return []
      case 'Nursery':
        return []
      case 'Security status':
        return []
      case 'Condition':
        return []
      case 'Reason':
        return []
      default:
        return []
    }
  }

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
                    // value={searchQuery}
                    // onChange={handleSearchChange}
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
                    // checked={selectAll}
                    // onChange={handleSelectAllChange}
                    inputProps={{ 'aria-label': 'controlled' }}
                  />
                  <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#839D8D' }}>Select All</Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
              </>

              <Box sx={{ mt: 2 }}>
                {getOptionsForMenu(selectedMenu)?.map((option, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Checkbox
                      //   checked={selectedOptions[selectedMenu.name]?.some(item => item.id === option.id)}
                      //   onChange={() => handleCheckboxChange(option.id, option.name)}
                      inputProps={{ 'aria-label': 'controlled' }}
                    />
                    <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#839D8D' }}>{option.name}</Typography>
                  </Box>
                ))}
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
        <LoadingButton fullWidth variant='outlined' size='large' onClick={handleCloseDrawer}>
          CANCEL ALL
        </LoadingButton>
        <LoadingButton
          fullWidth
          variant='contained'
          size='large'

          // onClick={handleApplyFilter}
        >
          APPLY FILTER
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default DashboardFilter
