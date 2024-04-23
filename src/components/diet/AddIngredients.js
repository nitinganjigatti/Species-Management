/* eslint-disable padding-line-between-statements */
/* eslint-disable newline-before-return */
/* eslint-disable lines-around-comment */
import React, { useCallback, useEffect, useState } from 'react'
import Drawer from '@mui/material/Drawer'
import {
  Box,
  IconButton,
  Typography,
  TextField,
  Stack,
  Button,
  Checkbox,
  debounce,
  CircularProgress
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import Divider from '@mui/material/Divider'

import toast from 'react-hot-toast'
import { getIngredientList } from 'src/lib/api/diet/getIngredients'
import { getUnitsForRecipe } from 'src/lib/api/diet/recipe'
import { getPreparationTypeList } from 'src/lib/api/diet/settings/preparationTypes'

const AddIngredients = props => {
  const { open, handleSidebarClose, setSelectedIngredient } = props
  const [feed, setFeed] = useState('')
  const [selectFeed, setSelectFeed] = useState({})

  const [searchValue, setSearchValue] = useState('')
  const [remarks, setRemarks] = useState('')
  const [cutSize, seCutSize] = useState('')
  const [size, setSize] = useState('')
  const [visibility, setVisibility] = useState([])

  const [ingredientList, setIngredientList] = useState([])
  console.log('ingredientList', ingredientList)
  let [ingredientPage, setIngredientPage] = useState(1)
  const [reachedEnd, setReachedEnd] = useState(false)
  const [sort, setSort] = useState('desc')
  const [uom, setUom] = useState([])
  const [feedType, setFeedType] = useState([])

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

  const handleChangeTopFeed = async event => {
    setReachedEnd(true)
    setFeed(event.target.value)

    try {
      const params = { page: ingredientPage, q: searchValue, sort, feed_type: event.target.value }
      await getIngredientList({ params }).then(res => {
        if (res?.data?.result?.length > 0) {
          setIngredientList(res?.data?.result)
          setReachedEnd(false)
        } else {
          setReachedEnd(false)
        }
      })
    } catch (error) {
      console.error(error)
    }
  }

  const handleChangeFeed = (event, item) => {
    const { value } = event.target
    // Find the selected feed type object
    const selectedFeedType = item.preparation_types.find(type => type.id === value)
    // Update the state with the ID and name of the selected feed type
    setSelectFeed(prevState => ({
      ...prevState,
      [item.id]: {
        id: selectedFeedType.id,
        name: selectedFeedType.label
      }
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

  const [selectedDays, setSelectedDays] = useState([])

  const handleDayClick = (dayId, dayName, cardId) => {
    let cardInfo = selectedDays.find(item => item.cardId === cardId)
    if (!cardInfo) {
      cardInfo = { cardId, days: [] }
    }

    // Check if the clicked day is "All"
    if (dayId === 0) {
      const allDaysSelected = cardInfo.days.filter(item => item.dayId !== 0).length === 7

      // If all individual days are selected, remove all days
      if (allDaysSelected) {
        cardInfo.days = []
      } else {
        // If not all individual days are selected, select all days
        cardInfo.days = []
        for (let i = 1; i <= 7; i++) {
          const day = Day.find(day => day.id === i)
          cardInfo.days.push({ dayId: day.id, dayName: day.name })
        }
        // Also add the "All" day
        cardInfo.days.push({ dayId: 0, dayName: 'All' })
      }
    } else {
      // Check if the clicked day is already selected for the card
      const index = cardInfo.days.findIndex(item => item.dayId === dayId)

      // If not selected, add the day
      if (index === -1) {
        cardInfo.days.push({ dayId, dayName })
      } else {
        // If selected, remove the day
        cardInfo.days.splice(index, 1)
      }

      // Check if "All" is selected and deselect if any individual day is deselected
      if (dayId !== 0) {
        const allDayIndex = cardInfo.days.findIndex(item => item.dayId === 0)
        if (allDayIndex !== -1) {
          cardInfo.days.splice(allDayIndex, 1)
        }
      }
    }

    // If all individual days are selected but the "All" option is not selected, add "All"
    const allSelected = cardInfo.days.length === 7 && !cardInfo.days.some(day => day.dayId === 0)
    if (allSelected) {
      const allDay = Day.find(day => day.id === 0)
      cardInfo.days.push({ dayId: 0, dayName: 'All' })
    }

    const updatedSelectedDays = selectedDays.filter(item => item.cardId !== cardId)
    updatedSelectedDays.push(cardInfo)
    setSelectedDays(updatedSelectedDays)
  }

  // card selection
  const [selectedCard, setSelectedCard] = useState([])
  console.log('selectedCard', selectedCard)

  const handelCardSelection = item => {
    // Get the selected feed value for the current item
    const feedType = selectFeed[item.id]?.name || ''

    // Get the remarks value
    const remarksData = remarks || ''

    // Get the selected days for the current item
    const selectedDaysForItem = Day.filter(day =>
      selectedDays.some(
        selectedDay =>
          selectedDay.cardId === item.id && selectedDay.days.some(selectedDay => selectedDay.dayId === day.id)
      )
    )

    // Validation checks
    if (!feedType) {
      // Display error message or handle empty feedType
      toast.error('Please select a feed type.')
      return
    }

    if (selectedDaysForItem.length === 0) {
      // Display error message or handle no selected days
      toast.error('Please select at least one day.')
      return
    }

    if (feedType === 'Chopped') {
      // Additional validation for 'Chopped' feed type
      const cutSizeValue = cutSize || ''
      const sizeValue = size || ''
      if (!cutSizeValue || !sizeValue) {
        // Display error message or handle empty cut size or size
        toast.error('Cut size and size are required for chopped feed.')
        return
      }
    }

    // Prepare the object to store values
    const boxValues = {
      id: item.id,
      name: item.ingredient_name,
      feedTypeId: feedType,
      selectedDays: selectedDaysForItem.map(day => day.name),
      remarks: remarksData
    }

    if (feedType === 'Chopped') {
      // Include cut size and its dropdown only if feedType is "Chopped"
      const cutSizeValue = cutSize || ''
      const sizeValue = size || ''

      // Update boxValues with cut size and size
      boxValues.cutSize = cutSizeValue
      boxValues.uomId = sizeValue
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
    setSelectedIngredient(selectedCard)
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

  useEffect(() => {
    getUnitsList()
    setReachedEnd(true)

    try {
      const params = { page: ingredientPage, q: searchValue, sort }
      getIngredientList({ params }).then(res => {
        if (res?.data?.result?.length > 0) {
          setIngredientList(prevArray => [...prevArray, ...res?.data?.result])
          setReachedEnd(false)
        } else {
          setReachedEnd(false)
        }
      })
    } catch (error) {
      console.error(error)
    }
  }, [])

  // Top Feed Type
  const fetchData = async () => {
    const params = {}
    try {
      const response = await getPreparationTypeList()

      setFeedType(response?.data?.result)
    } catch (error) {
      console.log('error', error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // uom

  const getUnitsList = async () => {
    try {
      const params = {
        type: ['length', 'weight'],
        page: 1
      }
      await getUnitsForRecipe({ params: params }).then(res => {
        setUom(res?.data?.result)
      })
    } catch (e) {
      console.log(e)
    }
  }

  const handleScroll = async e => {
    const container = e.target

    // Check if the user has reached the bottom
    if (container.scrollHeight - Math.round(container.scrollTop) === container.clientHeight) {
      // User has reached the bottom, perform your action here

      setIngredientPage(++ingredientPage)
      setReachedEnd(true)
      try {
        const params = { page: ingredientPage, q: searchValue, sort }
        await getIngredientList({ params }).then(res => {
          if (res?.data?.result?.length > 0) {
            setIngredientList(prevArray => [...prevArray, ...res?.data?.result])
            setReachedEnd(false)
          } else {
            setReachedEnd(false)
          }
        })
      } catch (error) {
        console.error(error)
      }
    }
  }

  const searchData = useCallback(
    debounce(async search => {
      if (searchValue != ' ') {
        try {
          // const currentAnimalFilterValue = animalFilterValueRef.current
          const params = { page: ingredientPage, q: search, sort }
          await getIngredientList({ params }).then(res => {
            if (res?.data?.result.length > 0) {
              setIngredientList(res?.data?.result)
              setIngredientPage(1)
            }
          })
        } catch (error) {
          // console.error(error)
          setIngredientPage(1)
        }
      }
    }, 500),

    [searchValue]
  )

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
          flexDirection: 'column',
          bgcolor: '#dbe0de',
          gap: '24px'
        }}
      >
        <Box sx={{ position: 'fixed', top: 0, bgcolor: '#dbe0de', zIndex: 10, width: '562px' }}>
          <Box
            className='sidebar-header'
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              p: theme => theme.spacing(3, 3.255, 3, 5.255),
              px: '24px'
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
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, p: 4, px: '24px' }}
          >
            <Box sx={{ width: '306px' }}>
              <TextField
                value={searchValue}
                fullWidth
                InputProps={{
                  startAdornment: <Icon style={{ marginRight: 10 }} icon={'ion:search-outline'} />
                }}
                placeholder='Search'
                onKeyUp={e => searchData(e.target.value)}
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
                  onChange={handleChangeTopFeed}
                >
                  {feedType?.map(feedList => (
                    <MenuItem key={feedList?.key} value={feedList?.id}>
                      {feedList?.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Box>

        {/* Card View */}

        <Box
          key={feed}
          sx={{ marginTop: 35, height: '65%', overflowY: 'auto', bgcolor: '#dbe0de' }}
          onScroll={handleScroll}
        >
          {ingredientList?.map((item, index) => (
            <Box
              key={item?.id}
              sx={{
                bgcolor: 'white',
                mx: '24px',
                borderRadius: '8px',
                my: 4,
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
                  ml: 2
                }}
              >
                {selectedCard.some(card => card.id === item.id) ? (
                  // Render checkbox icon if card is selected
                  <Box onClick={() => handelCardSelection(item)}>
                    <Checkbox checked sx={{ '& .MuiSvgIcon-root': { fontSize: 80 } }} />
                  </Box>
                ) : (
                  // Render image if card is not selected
                  <Box
                    sx={{
                      width: '68px',
                      height: '68px',
                      borderRadius: 1,
                      bgcolor: '#E8F4F2',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      mt: 4,
                      ml: 3,
                      mr: 4,
                      p: 3
                    }}
                    onClick={() => handelCardSelection(item)}
                  >
                    <img
                      src='https://media.istockphoto.com/id/1457433817/photo/group-of-healthy-food-for-flexitarian-diet.jpg?s=612x612&w=0&k=20&c=v48RE0ZNWpMZOlSp13KdF1yFDmidorO2pZTu2Idmd3M='
                      style={{ width: '100%', borderRadius: 20, width: 40, height: 40 }}
                      alt='ingredient'
                    />
                  </Box>
                )}
                <Box sx={{ pt: 3, paddingRight: 4, paddingBottom: 4, width: '100%' }}>
                  <Typography variant='h6'>{item?.ingredient_name}</Typography>
                  <Stack
                    direction='row'
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mt: 1 }}
                  >
                    <Typography>Id - {item?.id}</Typography>
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
                          value={selectFeed[item.id]?.id || ''}
                          onChange={e => handleChangeFeed(e, item)}
                          displayEmpty
                        >
                          <MenuItem value='' disabled>
                            Select
                          </MenuItem>
                          {item.preparation_types.map(preparationType => (
                            <MenuItem key={preparationType.key} value={preparationType.id}>
                              {preparationType.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </Stack>
                </Box>
              </Box>

              {/* bottom part */}

              <>
                <Box
                  sx={{
                    p: 3,
                    display: visibility.find(visItem => visItem && visItem.id === item.id)?.isVisible
                      ? 'block'
                      : ' none',
                    transitionProperty: 'display',
                    transitionDuration: '13s'
                  }}
                >
                  {selectFeed[item.id]?.name === 'Chopped' ? (
                    <>
                      <Divider mt={-2} />
                      <Stack
                        direction='row'
                        sx={{ py: 4, px: 2, alignItems: 'center', justifyContent: 'space-between' }}
                      >
                        <Typography>Enter cut size</Typography>
                        <Box sx={{ width: '160.5px' }}>
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
                        <Box sx={{ width: '160.5px' }}>
                          <FormControl fullWidth>
                            <Select size='small' value={size} onChange={handleChangeSize} displayEmpty>
                              <MenuItem value='' disabled>
                                Select
                              </MenuItem>
                              {uom?.map(unit => (
                                <MenuItem key={unit.id} value={unit._id}>
                                  {unit.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                      </Stack>
                    </>
                  ) : null}

                  <Divider />
                  <Box>
                    <Typography sx={{ py: 3, px: 2 }}>Feeding Days</Typography>

                    <Stack direction='row' gap={3} mb={2} sx={{ px: 2 }}>
                      {Day?.map(day => (
                        <Box
                          key={day.id}
                          onClick={event => handleDayClick(day.id, day.name, item.id)}
                          sx={{
                            fontSize: 11,
                            fontWeight: 'bold',
                            // bgcolor: day.isActive ? '#203e56' : '#dedede',
                            bgcolor: selectedDays.some(
                              selectedDay =>
                                selectedDay.cardId === item.id &&
                                selectedDay.days.some(selectedDay => selectedDay.dayId === day.id)
                            )
                              ? '#203e56'
                              : '#dedede',
                            borderRadius: 5,
                            p: 2,
                            justifyContent: 'center',
                            alignItems: 'center',
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: '#203e56',
                              color: 'white'
                            },
                            color: selectedDays.some(
                              selectedDay =>
                                selectedDay.cardId === item.id &&
                                selectedDay.days.some(selectedDay => selectedDay.dayId === day.id)
                            )
                              ? 'white'
                              : 'black'
                          }}
                        >
                          {day?.name}
                        </Box>
                      ))}
                    </Stack>

                    <Divider />

                    <Box sx={{ pt: 3 }}>
                      {' '}
                      <FormControl fullWidth>
                        {/* {remarks && ( */}
                        {/* <InputLabel id='demo-simple-select-label' shrink={remarks}>
                          Add Remarks
                        </InputLabel> */}
                        {/* )} */}

                        <TextField
                          sx={{ pt: 1 }}
                          id='demo-simple-select-label'
                          placeholder='Add Remarks (optional)'
                          variant='standard'
                          InputProps={{ disableUnderline: true }}
                          {...props}
                          onChange={handleAddRemarks}
                        />
                      </FormControl>
                    </Box>
                  </Box>
                </Box>
              </>
              {/* ) : null} */}
            </Box>
          ))}
          {reachedEnd ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              <CircularProgress sx={{ mb: 10 }} />{' '}
            </Box>
          ) : null}
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
            display: 'flex'
          }}
        >
          <Button fullWidth variant='contained' size='large' onClick={() => handleAllSelect()}>
            ADD INGREDIENT - {selectedCard?.length} SELECTED
          </Button>
        </Box>
      </Drawer>
    </>
  )
}

export default AddIngredients

const Day = [
  { id: 0, name: 'All', isActive: false },
  { id: 1, name: 'Mon', isActive: false },
  { id: 2, name: 'Tue', isActive: false },
  { id: 3, name: 'Wed', isActive: false },
  { id: 4, name: 'Thrs', isActive: false },
  { id: 5, name: 'Fri', isActive: false },
  { id: 6, name: 'Sat', isActive: false },
  { id: 7, name: 'Sun', isActive: false }
]
