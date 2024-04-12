import React, { useState } from 'react'
import Drawer from '@mui/material/Drawer'
import { Box, IconButton, Typography, TextField, Stack, Button } from '@mui/material'
import Icon from 'src/@core/components/icon'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import Divider from '@mui/material/Divider'

const Card = props => {
  const { FoodData } = props
  const [feed, setFeed] = React.useState('')
  const [selectFeed, setSelectFeed] = useState('')

  const [searchValue, setSearchValue] = useState('')

  const [Day, setDay] = useState([
    { title: 'ALL', id: '0', isActive: false },
    { title: 'Mon', id: '1', isActive: false },
    { title: 'Tue', id: '2', isActive: false },
    { title: 'Wed', id: '3', isActive: false },
    { title: 'Thu', id: '4', isActive: false },
    { title: 'Fri', id: '5', isActive: false },
    { title: 'Sat', id: '6', isActive: false },
    { title: 'Sun', id: '7', isActive: false }
  ])

  const [showBottom, setShowBottom] = useState(false)

  const [cutSize, setCutSize] = useState()
  const [size, setSize] = useState('')

  const handelShowBottom = () => {
    setShowBottom(!showBottom)
  }

  const handleChange = event => {
    setFeed(event.target.value)
  }

  const handleChangeFeed = event => {
    event.stopPropagation()
    setSelectFeed(event.target.value)
  }

  const handleChangeSize = event => {
    event.stopPropagation()
    setSize(event.target.value)
  }

  const handleAddRemarks = event => {
    event.stopPropagation()
    console.log('Remarks', event.target.value)
  }

  const [activeDay, setActiveDay] = useState([])
  console.log('activeDay', activeDay)

  const handleDayClick = (event, id, title) => {
    event.stopPropagation()
    if (id === '0') {
      const allDaysAreActive = activeDay.every(day => day?.isActive)
      const updatedSelectedDays = Day?.map(day => ({ ...day, isActive: !allDaysAreActive }))
      setActiveDay(updatedSelectedDays)
    } else {
      const updatedSelectedDays = [...activeDay]
      const dayIndex = updatedSelectedDays.findIndex(day => day?.id === id)

      // Toggle the clicked day's active state
      updatedSelectedDays[dayIndex].isActive = !updatedSelectedDays[dayIndex]?.isActive

      // If "ALL" was previously active and a single day is toggled, mark "ALL" as inactive
      if (updatedSelectedDays[0].isActive) {
        updatedSelectedDays[0].isActive = false
      } else {
        // Check if all days from Mon to Sun are active
        const allDaysExceptAll = updatedSelectedDays.slice(1)
        const allDaysAreActive = allDaysExceptAll.every(day => day?.isActive)

        // If all days from Mon to Sun are active, mark "ALL" as active as well
        updatedSelectedDays[0].isActive = allDaysAreActive
      }

      setActiveDay(updatedSelectedDays)
    }
  }

  return (
    <Box sx={{ bgcolor: 'white', mx: 2, borderRadius: 1, my: 3 }} onClick={() => handelShowBottom()}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          px: 2,
          py: 2
        }}
      >
        <Box sx={{ mr: 2, mt: 2 }}>
          <img
            src={FoodData?.image}
            style={{ width: '100%', borderRadius: 10, width: 60, height: 60 }}
            alt='ingredient'
          />
        </Box>
        <Box sx={{ p: 1, width: '100%' }}>
          <Typography variant='h6'>{FoodData?.name}</Typography>
          <Stack
            direction='row'
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mt: 1 }}
          >
            <Typography>Id - 1234</Typography>
            <Typography>Feed Type - Egg</Typography>
          </Stack>
          <Stack
            direction='row'
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mt: 1 }}
          >
            <Typography>Preparation-Type</Typography>

            <Box sx={{ width: 200 }}>
              <FormControl fullWidth>
                {/* <InputLabel id='demo-simple-select-label'>Select</InputLabel> */}
                <Select size='small' value={selectFeed} onChange={handleChangeFeed} displayEmpty>
                  <MenuItem value='' disabled>
                    Select
                  </MenuItem>
                  <MenuItem value='chopped'>Chopped</MenuItem>
                  <MenuItem value='unchopped'>Unchopped</MenuItem>
                  <MenuItem value='option-3'>Option-3</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* bottom part */}
      {/*  */}
      {showBottom ? (
        <>
          <Box sx={{ m: 2 }}>
            {selectFeed === 'chopped' ? (
              <>
                <Divider />
                <Stack direction='row' sx={{ py: 3, alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography>Enter cut size</Typography>
                  <Box sx={{ width: '178.5px' }}>
                    <FormControl fullWidth>
                      <TextField
                        size='small'
                        placeholder='Add Size'
                        variant='outlined'
                        {...props}
                        onChange={handleAddRemarks}
                      />
                    </FormControl>
                  </Box>
                  <Box sx={{ width: '178.5px' }}>
                    <FormControl fullWidth>
                      <Select size='small' value={size} onChange={handleChangeSize} displayEmpty>
                        <MenuItem value='' disabled>
                          Cm
                        </MenuItem>
                        <MenuItem value='chopped'>Chopped</MenuItem>
                        <MenuItem value='unchopped'>Unchopped</MenuItem>
                        <MenuItem value='option-3'>Option-3</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Stack>
              </>
            ) : null}

            <Divider />
            <Box>
              <Typography sx={{ py: 4 }}>Feeding Days</Typography>

              <Stack direction='row' gap={3} mb={2}>
                {Day?.map(item => (
                  <Box
                    key={item.id}
                    onClick={event => handleDayClick(event, item.id, item.title, item.isActive)}
                    sx={{
                      fontSize: 11,
                      fontWeight: 'bold',
                      bgcolor: activeDay.find(day => day.id === item.id && day.isActive) ? '#203e56' : '#dedede',
                      borderRadius: 5,
                      p: 2,
                      justifyContent: 'center',
                      alignItems: 'center',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: '#203e56',
                        color: 'white'
                      },
                      color: activeDay.find(day => day.id === item.id && day.isActive) ? 'white' : 'black'
                    }}
                  >
                    {item?.title}
                  </Box>
                ))}
              </Stack>

              <Divider />

              <Box sx={{ py: 3 }}>
                {' '}
                <FormControl fullWidth>
                  <TextField
                    placeholder='Add Remarks (optional)'
                    variant='outlined'
                    {...props}
                    onChange={handleAddRemarks}
                  />
                </FormControl>
              </Box>
            </Box>
          </Box>
        </>
      ) : null}
    </Box>
  )
}

export default Card
