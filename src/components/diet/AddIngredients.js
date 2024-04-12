/* eslint-disable padding-line-between-statements */
/* eslint-disable newline-before-return */
/* eslint-disable lines-around-comment */
import React, { useState } from 'react'
import Drawer from '@mui/material/Drawer'
import { Box, IconButton, Typography, TextField, Stack, Button, Checkbox } from '@mui/material'
import Icon from 'src/@core/components/icon'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import Divider from '@mui/material/Divider'
import { margin } from '@mui/system'
import toast from 'react-hot-toast'

const AddIngredients = props => {
  const { open, handleSidebarClose } = props
  const [feed, setFeed] = React.useState('')
  const [selectFeed, setSelectFeed] = useState({})

  const [searchValue, setSearchValue] = useState('')
  const [remarks, setRemarks] = useState('')

  const [showBottom, setShowBottom] = useState([])

  const [cutSize, seCutSize] = useState('')
  const [size, setSize] = useState('')
  const [visibility, setVisibility] = useState([])

  const handelShowBottom = (event, item, index) => {
    event.stopPropagation()

    setVisibility(prevVisibility => {
      const existingIndex = prevVisibility.findIndex(visItem => visItem && visItem.id === item.id)
      const newVisibility = [...prevVisibility]
      if (existingIndex !== -1 && newVisibility[existingIndex]?.isVisible) {
        // newVisibility.splice(existingIndex, 1)
        newVisibility[existingIndex] = {
          ...newVisibility[existingIndex],
          isVisible: true
        }
      } else {
        if (existingIndex !== -1) {
          newVisibility[existingIndex] = {
            ...newVisibility[existingIndex],
            isVisible: true
          }
        } else {
          newVisibility.push({
            id: item.id,
            isVisible: true
          })
        }
      }

      return newVisibility
    })
  }

  const handleChange = event => {
    setFeed(event.target.value)
  }

  const handleChangeFeed = (event, itemId) => {
    const { value } = event.target
    setSelectFeed(prevState => ({
      ...prevState,
      [itemId]: value
    }))
  }

  const handleChangeSize = event => {
    event.stopPropagation()
    setSize(event.target.value)
  }

  const handleAddRemarks = event => {
    event.stopPropagation()
    setRemarks(event.target.value)
  }

  // handle click days
  const [foods, setFoods] = useState(FoodData)
  console.log('foods', foods)

  // Handle click on the days

  const handleDayClick = (id, cardId) => {
    setFoods(prevFoods =>
      prevFoods.map(food => {
        if (food.id === cardId) {
          if (id === '0') {
            // Toggle all days for the specific card
            const allActive = !food.days.every(day => day.isActive)
            return {
              ...food,
              days: food.days.map(day => ({ ...day, isActive: allActive }))
            }
          } else {
            // Toggle the clicked day
            const updatedDays = food.days.map(day => {
              if (day.id === id) {
                return { ...day, isActive: !day.isActive }
              }
              return day
            })

            // Check if all individual days are active, then activate "ALL" button
            const allIndividualDaysActive = updatedDays.slice(1).every(day => day.isActive)
            const allActive = allIndividualDaysActive || updatedDays[0].isActive

            // Check if "ALL" button is already active and any individual day is clicked again
            if (updatedDays[0].isActive && !allIndividualDaysActive) {
              // Toggle all days to false
              return {
                ...food,
                days: updatedDays.map((day, index) => (index === 0 ? { ...day, isActive: false } : day))
              }
            }

            return {
              ...food,
              days: updatedDays.map((day, index) => (index === 0 ? { ...day, isActive: allActive } : day))
            }
          }
        }
        return food
      })
    )
  }

  // card selection
  const [selectedCard, setSelectedCard] = useState([])

  const handelCardSelection = item => {
    const feedType = selectFeed[item.id] || ''
    const remarksData = remarks || ''

    // Get unique selected days
    const selectedDaysSet = new Set()
    foods.forEach(food => {
      food.days.forEach(day => {
        if (day.isActive) {
          selectedDaysSet.add(day.title)
        }
      })
    })
    const selectedDays = Array.from(selectedDaysSet)

    // Check if feedType is "chopped"
    if (feedType === 'chopped') {
      const cutSizeValue = cutSize || ''
      const sizeValue = size || ''

      // Check if cut size and its dropdown are not empty
      if (!cutSizeValue || !sizeValue) {
        // Show toast or alert for required fields
        return
      }
    }

    // Check if any required field is empty
    if (!feedType || selectedDays.length === 0) {
      // Show toast or alert for required fields
      return
    }

    // Prepare the object to store values
    const boxValues = {
      id: item.id,
      name: item.name,
      feedType: feedType,
      selectedDays: selectedDays,
      remarks: remarksData,

      // Include cut size and its dropdown only if feedType is "chopped"
      ...(feedType === 'chopped' && { cutSize: cutSize, size: size })
    }

    // Check if the boxValues already exist in selectedCard
    const index = selectedCard.findIndex(card => card.id === item.id)
    if (index !== -1) {
      // Remove the existing entry
      setSelectedCard(prevValues => prevValues.filter(card => card.id !== item.id))
    } else {
      // Add new entry
      setSelectedCard(prevValues => [...prevValues, boxValues])
    }
  }

  const handleAllSelect = () => {
    return toast(
      t => (
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Icon icon='ooui:success' style={{ marginRight: '20px', fontSize: 50, color: '#37BD69' }} />
            <div>
              <Typography sx={{ fontWeight: 500 }} variant='h5'>
                Ingredient Selected
              </Typography>
            </div>
          </Box>
          <IconButton
            onClick={() => toast.dismiss(t.id)}
            style={{ position: 'absolute', top: 5, right: 5, float: 'right' }}
          >
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>
      ),
      {
        style: {
          minWidth: '450px',
          minHeight: '130px'
        }
      }
    )
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'] },
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box sx={{ bgcolor: '#dbe0de', p: 3, gap: '24px' }}>
          <Box
            className='sidebar-header'
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              p: theme => theme.spacing(3, 3.255, 3, 5.255)

              //   backgroundColor: 'background.default',
            }}
          >
            <Box sx={{ gap: 2, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <Icon
                style={{ marginLeft: -8 }}
                icon='material-symbols-light:add-notes-outline-rounded'
                fontSize={'32px'}
              />
              <Typography variant='h6'>Add Ingredients</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size='small' onClick={handleSidebarClose} sx={{ color: 'text.primary' }}>
                <Icon icon='mdi:close' fontSize={20} />
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, p: 4 }}>
            <Box sx={{ width: '306px' }}>
              <TextField
                value={searchValue}
                fullWidth
                InputProps={{
                  startAdornment: <Icon style={{ marginRight: 10 }} icon={'ion:search-outline'} />
                }}
                placeholder='Search'
                onChange={e => {
                  setSearchValue(e.target.value)
                }}
              />
            </Box>
            <Box sx={{ width: '184px' }}>
              <FormControl fullWidth>
                <InputLabel id='demo-simple-select-label'>Feed</InputLabel>
                <Select
                  labelId='demo-simple-select-label'
                  id='demo-simple-select'
                  value={feed}
                  label='Feed'
                  onChange={handleChange}
                >
                  <MenuItem value={1}>feed 1</MenuItem>
                  <MenuItem value={2}>feed 2</MenuItem>
                  <MenuItem value={3}>feed 3</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Card View */}

          <>
            {foods?.map((item, index) => (
              <Box
                key={item?.id}
                sx={{
                  bgcolor: 'white',
                  mx: 2,
                  borderRadius: 1,
                  my: 3,
                  ...(visibility.find(visItem => visItem && visItem.id === item.id)?.isVisible && {
                    border: '2px solid #37bd69' // Change border color when isVisible is true
                  })
                }}
                onClick={event => handelShowBottom(event, item, index)}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    px: 2,
                    py: 2
                  }}
                >
                  {selectedCard.some(card => card.id === item.id) ? (
                    // Render checkbox icon if card is selected
                    <Box onClick={() => handelCardSelection(item)}>
                      <Checkbox checked sx={{ '& .MuiSvgIcon-root': { fontSize: 80 } }} />
                    </Box>
                  ) : (
                    // Render image if card is not selected
                    <Box sx={{ ml: 4, mr: 4, mt: 5 }} onClick={() => handelCardSelection(item)}>
                      <img
                        src={item?.image}
                        style={{ width: '100%', borderRadius: 10, width: 60, height: 60 }}
                        alt='ingredient'
                      />
                    </Box>
                  )}
                  <Box sx={{ p: 1, width: '100%' }}>
                    <Typography variant='h6'>{item?.name}</Typography>
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
                          <Select
                            size='small'
                            value={selectFeed[item.id] || ''}
                            onChange={e => handleChangeFeed(e, item.id)}
                            displayEmpty
                          >
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
                {/* {showBottom === index  */}
                {visibility.find(visItem => visItem && visItem.id === item.id)?.isVisible ? (
                  <>
                    <Box sx={{ m: 2 }}>
                      {selectFeed[item.id] === 'chopped' ? (
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
                                  onChange={e => seCutSize(e.target.value)}
                                />
                              </FormControl>
                            </Box>
                            <Box sx={{ width: '178.5px' }}>
                              <FormControl fullWidth>
                                <Select size='small' value={size} onChange={handleChangeSize} displayEmpty>
                                  <MenuItem value='' disabled>
                                    Cm
                                  </MenuItem>
                                  <MenuItem value='chopped'>CM</MenuItem>
                                  <MenuItem value='unchopped'>M</MenuItem>
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
                          {item?.days?.map(day => (
                            <Box
                              key={day.id}
                              onClick={event => handleDayClick(day.id, item.id)}
                              sx={{
                                fontSize: 11,
                                fontWeight: 'bold',
                                bgcolor: day.isActive ? '#203e56' : '#dedede',
                                borderRadius: 5,
                                p: 2,
                                justifyContent: 'center',
                                alignItems: 'center',
                                cursor: 'pointer',
                                '&:hover': {
                                  bgcolor: '#203e56',
                                  color: 'white'
                                },
                                color: day.isActive ? 'white' : 'black'
                              }}
                            >
                              {day?.title}
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
            ))}
          </>
        </Box>
        <Box sx={{ height: '122px', position: 'sticky', bottom: 0, px: 4, py: 5, bgcolor: 'white' }}>
          <Button fullWidth variant='contained' onClick={() => handleAllSelect()}>
            ADD INGREDIENT - {selectedCard?.length} SELECTED
          </Button>
        </Box>
      </Drawer>
    </>
  )
}

export default AddIngredients

const FoodData = [
  {
    id: 1,
    name: 'Egg',
    image:
      'https://media.istockphoto.com/id/520889612/photo/boiled-eggs-in-bowl.jpg?s=612x612&w=0&k=20&c=wwes11nnPnZu7IFz6SSSjhsfoBK-ZcTFsqH9Em72ClA=',
    days: [
      { title: 'ALL', id: '0', isActive: false },
      { title: 'Mon', id: '1', isActive: false },
      { title: 'Tue', id: '2', isActive: false },
      { title: 'Wed', id: '3', isActive: false },
      { title: 'Thu', id: '4', isActive: false },
      { title: 'Fri', id: '5', isActive: false },
      { title: 'Sat', id: '6', isActive: false },
      { title: 'Sun', id: '7', isActive: false }
    ]
  },
  {
    id: 2,
    name: 'Apple',
    image:
      'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxleHBsb3JlLWZlZWR8Nnx8fGVufDB8fHx8fA%3D%3D',
    days: [
      { title: 'ALL', id: '0', isActive: false },
      { title: 'Mon', id: '1', isActive: false },
      { title: 'Tue', id: '2', isActive: false },
      { title: 'Wed', id: '3', isActive: false },
      { title: 'Thu', id: '4', isActive: false },
      { title: 'Fri', id: '5', isActive: false },
      { title: 'Sat', id: '6', isActive: false },
      { title: 'Sun', id: '7', isActive: false }
    ]
  },
  {
    id: 3,
    name: 'Papaya',
    image: 'https://organicbazar.net/cdn/shop/products/Untitled-design-2022-12-08T182126.753.jpg?v=1694167597',
    days: [
      { title: 'ALL', id: '0', isActive: false },
      { title: 'Mon', id: '1', isActive: false },
      { title: 'Tue', id: '2', isActive: false },
      { title: 'Wed', id: '3', isActive: false },
      { title: 'Thu', id: '4', isActive: false },
      { title: 'Fri', id: '5', isActive: false },
      { title: 'Sat', id: '6', isActive: false },
      { title: 'Sun', id: '7', isActive: false }
    ]
  },
  {
    id: 4,
    name: 'Chicken',
    image: 'https://cdn.pixabay.com/photo/2020/02/15/04/19/chicken-4849979_1280.jpg',
    days: [
      { title: 'ALL', id: '0', isActive: false },
      { title: 'Mon', id: '1', isActive: false },
      { title: 'Tue', id: '2', isActive: false },
      { title: 'Wed', id: '3', isActive: false },
      { title: 'Thu', id: '4', isActive: false },
      { title: 'Fri', id: '5', isActive: false },
      { title: 'Sat', id: '6', isActive: false },
      { title: 'Sun', id: '7', isActive: false }
    ]
  },

  {
    id: 5,
    name: 'WaterMelon',
    image:
      'https://post.healthline.com/wp-content/uploads/2019/09/watermelon-fruit-sliced-1296x728-header-1296x728.jpg',
    days: [
      { title: 'ALL', id: '0', isActive: false },
      { title: 'Mon', id: '1', isActive: false },
      { title: 'Tue', id: '2', isActive: false },
      { title: 'Wed', id: '3', isActive: false },
      { title: 'Thu', id: '4', isActive: false },
      { title: 'Fri', id: '5', isActive: false },
      { title: 'Sat', id: '6', isActive: false },
      { title: 'Sun', id: '7', isActive: false }
    ]
  }
]
