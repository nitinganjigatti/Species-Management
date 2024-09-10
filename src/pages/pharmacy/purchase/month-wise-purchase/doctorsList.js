import { useTheme } from '@mui/material/styles'
import React, { useState, useEffect, useContext, useCallback } from 'react'
import {
  Avatar,
  Box,
  Card,
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

import Icon from 'src/@core/components/icon'

const MedicineNamedoctorsList = ({ openDoctorListDrawer, setOpenDoctorListDrawer }) => {
  const handleClose = () => {
    setOpenDoctorListDrawer(false)
  }
  return (
    <Drawer
      anchor='right'
      open={openDoctorListDrawer}
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
          <Icon icon='hugeicons:medicine-bottle-01' fontSize={30} />
          <Typography sx={{ fontSize: '24px', fontWeight: 500 }}>Filter </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }} onClick={handleClose}>
          <IconButton size='small' sx={{ color: 'text.primary' }}>
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>
      </Box>
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
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '20px', fontWeight: 500 }}>18 Doctors </Typography>
        </Box>
        <Typography sx={{ fontSize: '20px', fontWeight: 400, fontWeight: 500 }}>110 nos.</Typography>
      </Box>

      <Box
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'] },
          backgroundColor: 'background.default',
          height: '100%'
        }}
      >
        <Grid container sx={{ px: 5 }}>
          <Grid item md={8} sm={8} xs={8}>
            <Box
              sx={{
                //bgcolor: '#FFFFFF',
                pt: '16px',
                borderRadius: '8px',
                width: '525px',
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
                    height: '50px',
                    mb: 4,
                    bgcolor: '#FFFFFF'
                  }}
                >
                  <Icon icon='mi:search' />
                  <TextField
                    variant='outlined'
                    placeholder='Search by doctors'
                    //value={searchQuery}
                    //onChange={handleSearchChange}
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
              </>

              <Card
                sx={{
                  mt: 2,
                  boxShadow: 'none',
                  border: '1px solid #C3CEC7',
                  height: '70px',
                  p: 5,
                  borderRadius: '8px'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar alt='Name' sx={{ width: 30, height: 30, mr: 2 }} src={'/images/avatars/1.png'} />
                    <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#44544A' }}>
                      Dr.Nidhin Prathap
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#44544A' }}>110 nos.</Typography>
                </Box>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Drawer>
  )
}

export default MedicineNamedoctorsList
