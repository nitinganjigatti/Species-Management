import React, { useState } from 'react'
import { Box, Checkbox, Divider, Drawer, FormControl, Grid, IconButton, TextField, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'

const fruitsList = [
  { id: 1, name: 'Banana' },
  { id: 2, name: 'Apple' },
  { id: 3, name: 'Orange' },
  { id: 4, name: 'Mango' },
  { id: 5, name: 'Grapes' },
  { id: 6, name: 'Pineapple' },
  { id: 7, name: 'Strawberry' },
  { id: 8, name: 'Watermelon' },
  { id: 9, name: 'Papaya' },
  { id: 10, name: 'Peach' }
]

const MonthWisedispatchFilter = ({ openFilterDrawer, setOpenFilterDrawer }) => {
  const [selectedFruitIds, setSelectedFruitIds] = useState([])

  const handleClose = () => {
    setOpenFilterDrawer(false)
  }

  const handleCheckboxChange = fruitId => {
    setSelectedFruitIds(
      prevSelected =>
        prevSelected.includes(fruitId)
          ? prevSelected.filter(id => id !== fruitId) // Remove if already selected
          : [...prevSelected, fruitId] // Add if not selected
    )
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

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }} onClick={handleClose}>
          <IconButton size='small' sx={{ color: 'text.primary' }}>
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
          <Grid item md={8} sm={8} xs={8}>
            <Box
              sx={{
                bgcolor: '#FFFFFF',
                p: '16px',
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
                    height: '40px',
                    mb: 4
                  }}
                >
                  <Icon icon='mi:search' />
                  <TextField
                    variant='outlined'
                    placeholder='Search'
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
                    // Logic for "Select All" checkbox
                    checked={selectedFruitIds.length === fruitsList.length}
                    onChange={() =>
                      setSelectedFruitIds(
                        selectedFruitIds.length === fruitsList.length ? [] : fruitsList.map(f => f.id)
                      )
                    }
                    inputProps={{ 'aria-label': 'select all fruits' }}
                  />
                  <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#839D8D' }}>Select All</Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
              </>

              <Box sx={{ mt: 2 }}>
                {fruitsList.map(fruit => (
                  <Box key={fruit.id} sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Checkbox
                      checked={selectedFruitIds.includes(fruit.id)}
                      onChange={() => handleCheckboxChange(fruit.id)}
                      inputProps={{ 'aria-label': fruit.name }}
                    />
                    <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#839D8D' }}>{fruit.name}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Drawer>
  )
}

export default MonthWisedispatchFilter
