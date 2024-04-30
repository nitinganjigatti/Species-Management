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
  CircularProgress,
  Avatar,
  Card
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import Divider from '@mui/material/Divider'
import { Add, Remove } from '@mui/icons-material'
import toast from 'react-hot-toast'
import { getIngredientList } from 'src/lib/api/diet/getIngredients'
import { getUnitsForRecipe } from 'src/lib/api/diet/recipe'
import { getPreparationTypeList } from 'src/lib/api/diet/settings/preparationTypes'

const AddIngredientswithChoice = props => {
  const {
    open,
    handleSidebarClose,
    onChange,
    childStateValue,
    checkid,
    allSelectedValues,
    formData,
    setSelectedIngredient
  } = props
  const [feed, setFeed] = React.useState('')
  const [selectFeed, setSelectFeed] = useState({})

  const [searchValue, setSearchValue] = useState('')
  const [remarks, setRemarks] = useState('')
  const [cutSize, setCutSize] = useState('')
  const [size, setSize] = useState('')
  const [visibility, setVisibility] = useState([])

  const [ingredientList, setIngredientList] = useState([])

  let [ingredientPage, setIngredientPage] = useState(1)
  const [reachedEnd, setReachedEnd] = useState(false)
  const [sort, setSort] = useState('desc')
  const [uom, setUom] = useState([])
  const [feedType, setFeedType] = useState([])
  const [selectedDays, setSelectedDays] = useState([])
  console.log('Selected days:', selectedDays)
  const [count, setCount] = useState(1)
  const [showDays, setShowDays] = useState(false)

  const handelShowBottom = (event, item, index) => {
    console.log('item', item)
    event.stopPropagation()

    setVisibility(prevVisibility => {
      const existingIndex = prevVisibility.findIndex(visItem => visItem && visItem.id === item.id)
      const newVisibility = [...prevVisibility]

      if (existingIndex !== -1) {
        // If the item already exists in visibility state, do not toggle off its visibility
        return newVisibility
      }

      // If the item is not visible or doesn't exist, set it to visible
      newVisibility.push({
        id: item.id,
        isVisible: true
      })

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
    event.stopPropagation()
    const { value } = event.target

    const selectedFeedType = item.preparation_types.find(type => type.id === value)

    setSelectFeed(prevState => ({
      ...prevState,
      [item.id]: {
        id: selectedFeedType.id,
        name: selectedFeedType.label
      }
    }))

    if (selectedFeedType.label !== 'Chopped') {
      handelCardSelection(event, item, selectedFeedType, null, null, selectedDays)
    }
  }

  const handleChangeSize = (event, item) => {
    event.stopPropagation()
    const newUom = event.target.value

    setSize(event.target.value)
    if (cutSize) {
      handelCardSelection(event, item, null, null, newUom, selectedDays)
    }
  }

  const handleAddRemarks = event => {
    event.stopPropagation()
    setRemarks(event.target.value)
  }

  // card selection
  const [selectedCard, setSelectedCard] = useState([])
  console.log('selectedCard', selectedCard)

  const handelCardSelection = (event, item, selectedFeedType, newCutSize, newUom, updatedSelectedDays) => {
    event.stopPropagation()

    // Get the selected feed value for the current item
    const feed_type_id = selectedFeedType ? selectedFeedType.id : selectFeed[item.id]?.id || ''
    const feed_type = selectedFeedType ? selectedFeedType.label : selectFeed[item.id]?.name || ''

    // Get the remarks value
    const remarksData = remarks || ''

    // Get the selected days for the current item
    // const selectedDaysForItem = updatedSelectedDays?.filter(updatedDay => {
    //   return (
    //     updatedDay.cardId === item.id &&
    //     updatedDay.days.some(day => {
    //       return selectedDays.some(
    //         selectedDay =>
    //           selectedDay.cardId === updatedDay.cardId &&
    //           selectedDay.days.some(selectedDay => selectedDay.dayId === day.dayId)
    //       )
    //     })
    //   )
    // })

    // Prepare the object to store values
    const boxValues = {
      id: item.id,
      name: item.ingredient_name,
      preparation_type_id: feed_type_id,
      preparation_type: feed_type
      // days_of_week: selectedDaysForItem?.flatMap(dayObj => dayObj.days.map(day => day.dayId)),
      // remarks: remarksData,
      // valueid: checkid
    }

    if (feed_type === 'Chopped') {
      // Include cut size and its dropdown only if feedType is "Chopped"
      const cutSizeValue = newCutSize ? newCutSize : cutSize || ''
      const sizeValue = newUom ? newUom : size || ''

      // Update boxValues with cut size and size
      boxValues.feed_cut_size = cutSizeValue
      boxValues.feed_uom_id = sizeValue
    }

    // Check if the boxValues already exist in selectedCard
    const existingIndex = selectedCard.findIndex(card => card.id === item.id)
    if (existingIndex !== -1) {
      // If the card already exists, update its values
      selectedCard[existingIndex] = boxValues
      setSelectedCard([...selectedCard])
    } else {
      // If the card is new, add it to selectedCard
      setSelectedCard(prevValues => [...prevValues, boxValues])
    }
  }

  const removeingClick = () => {
    // Call the function passed from the parent component
    props.removeingClick(item) // Pass the item to be removed
  }

  // useEffect(() => {
  //   const filteredSelectedCard = selectedCard.filter(card => card.valueid === checkid)
  //   setSelectedCard(filteredSelectedCard)
  // }, [checkid])

  const handleContinueClick = event => {
    if (selectedCard.length === 0) {
      toast.error('Please select an Ingredient')
    }
    if (selectedCard.length >= 1) {
      setShowDays(true)

      const allDayIds = Day.map(day => day.id)
      setSelectedDays(allDayIds)
    }
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

  // useEffect(() => {
  //   // Filter out duplicates based on id and valueid
  //   const uniqueSelectedValues = allSelectedValues.filter(
  //     (value, index, self) => index === self.findIndex(v => v.id === value.id && v.valueid === value.valueid)
  //   )
  //   console.log(uniqueSelectedValues, 'uniqueSelectedValues')
  //   console.log(checkid, 'checkid')
  //   // Compare uniqueSelectedValues with checkid
  //   const selectedValuesWithCheckId = uniqueSelectedValues.filter(item => item.valueid === checkid)
  //   console.log(selectedValuesWithCheckId, 'selectedValuesWithCheckId')
  //   // Update selectedCard with matched objects, or set to an empty array if no match found
  //   setSelectedCard(selectedValuesWithCheckId.length > 0 ? selectedValuesWithCheckId : [])
  // }, [allSelectedValues, checkid, formData])

  useEffect(() => {
    // Filter out duplicates based on id and valueid
    const uniqueSelectedValues = allSelectedValues?.filter(
      (value, index, self) => index === self.findIndex(v => v.id === value.id && v.valueid === value.valueid)
    )
    console.log(uniqueSelectedValues, 'uniqueSelectedValues')
    console.log(checkid, 'checkid')
    // Compare uniqueSelectedValues with checkid
    const selectedValuesWithCheckId = uniqueSelectedValues?.filter(item => item.valueid === checkid)
    console.log(selectedValuesWithCheckId, 'selectedValuesWithCheckId')
    // Update selectedCard with matched objects, or set to an empty array if no match found
    setSelectedCard(selectedValuesWithCheckId?.length > 0 ? selectedValuesWithCheckId : [])
    // Extract cardId values and selectedDays arrays from selectedValuesWithCheckId
    const cardIds = selectedValuesWithCheckId?.map(item => item.id)
    const days = selectedValuesWithCheckId?.map(item => item.selectedDays)
    // Update selectedDays state with the extracted values
    const updatedSelectedDays = []
    cardIds?.forEach((cardId, index) => {
      updatedSelectedDays.push({
        cardId: cardId,
        days: days[index]
      })
    })
    setSelectedDays(updatedSelectedDays)
  }, [allSelectedValues, checkid, formData])

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

  const handelInputCutSize = (event, item) => {
    event.stopPropagation()
    const newCutSize = event.target.value

    // Set cutSize state
    setCutSize(event.target.value)

    // Call handelCardSelection with the updated cutSize value
    if (size) {
      handelCardSelection(event, item, null, newCutSize, null, selectedDays)
    }
  }

  const removeSelectedCard = (event, itemId) => {
    console.log('removeSelectedCard Called')

    // Check if the card with itemId is present in the selectedCard state
    const cardIndex = selectedCard.findIndex(card => card.id === itemId)

    if (cardIndex !== -1) {
      // If the card is found, remove it from the selectedCard state
      const updatedSelectedCard = [...selectedCard]
      updatedSelectedCard.splice(cardIndex, 1)
      setSelectedCard(updatedSelectedCard)
    }
  }

  const handleIncrement = () => {
    if (count < selectedCard.length) {
      setCount(prevCount => prevCount + 1)
    }
  }

  const handleDecrement = () => {
    setCount(prevCount => (prevCount > 1 ? prevCount - 1 : prevCount))
  }

  const handleDayClick = day => {
    if (day.id === 0) {
      // If "All" is clicked, select all days from Monday to Sunday
      const allDayIds = Day.map(day => day.id)
      setSelectedDays(allDayIds)
    } else if (selectedDays.length === 7 && selectedDays.includes(0)) {
      // If all days are already selected and an individual day is clicked, remove both the clicked day and "All" from the selection
      setSelectedDays(selectedDays.filter(selectedDayId => selectedDayId !== day.id))
    } else if (selectedDays.length === 1 && selectedDays.includes(day.id)) {
      // If only one day is selected and the user tries to deselect it, keep it selected
      return
    } else if (day.id !== 0 && selectedDays.includes(0)) {
      // If an individual day is clicked and "All" is already selected, remove both the clicked day and "All" from the selection
      setSelectedDays(selectedDays.filter(selectedDayId => selectedDayId !== day.id && selectedDayId !== 0))
    } else {
      // Toggle selection for the clicked day
      const updatedSelection = selectedDays.includes(day.id)
        ? selectedDays.filter(selectedDayId => selectedDayId !== day.id)
        : [...selectedDays, day.id]

      setSelectedDays(updatedSelection)
    }
  }

  const [listOfIngredient, setListOfIngredient] = useState([])
  console.log('listOfIngredient', listOfIngredient)

  const handelSetIngredient = () => {
    // Collect data
    const selectedIngredient = {
      ingredientList: selectedCard,
      days_of_week: selectedDays,
      min_Choice: count,
      remarks: remarks
    }

    // Add the selected ingredient to the list of ingredients
    setListOfIngredient(prevList => [...prevList, selectedIngredient])
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
              <Typography variant='h6'>Select Multiple Items</Typography>
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
                  border: '2px solid #37bd69'
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
                  <Box
                    onClick={event => removeSelectedCard(event, item.id)}
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
                  >
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
                    onClick={event => handelCardSelection(event, item)}
                  >
                    <Avatar
                      variant='square'
                      alt='Medicine Image'
                      sx={{ width: 40, height: 40, background: '#E8F4F2', borderRadius: 20 }}
                      src={item?.image ? item?.image : null}
                    >
                      {item?.image ? null : <Icon icon='healthicons:fruits-outline' />}
                    </Avatar>
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
                              onChange={event => handelInputCutSize(event, item)}

                              // onChange={event => setCutSize(event.target.value)}
                            />
                          </FormControl>
                        </Box>
                        <Box sx={{ width: '160.5px' }}>
                          <FormControl fullWidth>
                            <Select
                              size='small'
                              value={size}
                              onChange={event => handleChangeSize(event, item)}
                              displayEmpty
                            >
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
                </Box>
              </>
              {/* ) : null} */}
            </Box>
          ))}
          {reachedEnd ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              <CircularProgress sx={{ mb: 10 }} />
            </Box>
          ) : null}
        </Box>

        <Box
          sx={{
            height: showDays ? '370px' : '122px',
            width: '100%',
            maxWidth: '562px',
            position: 'fixed',
            bottom: 0,
            px: 4,
            bgcolor: 'white',
            alignItems: 'center',
            justifyContent: 'center',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* ---------------------- Day Card-------------------- - */}

          {showDays && (
            <Card sx={{ boxShadow: 'none', width: '500px' }}>
              <Stack direction='row' sx={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '20px' }}>
                  {selectedCard?.length} Items Selected
                </Typography>
                <IconButton size='small' onClick={() => setShowDays(false)} sx={{ color: 'text.primary' }}>
                  <Icon icon='mdi:close' fontSize={25} />
                </IconButton>
              </Stack>
              <Typography style={{ float: 'left', marginTop: '20px', fontWeight: 'bold' }}>
                Enter minimum choice
              </Typography>
              <Box
                display='flex'
                alignItems='center'
                sx={{
                  border: '1px solid #C3CEC7',
                  width: '22%',
                  borderRadius: '5px',
                  float: 'right',
                  marginTop: '15px',
                  justifyContent: 'space-between'
                }}
              >
                <IconButton onClick={handleDecrement}>
                  <Remove />
                </IconButton>
                <Typography variant='h5' align='center' sx={{ color: '#37BD69' }}>
                  {count}
                </Typography>
                <IconButton onClick={handleIncrement}>
                  <Add />
                </IconButton>
              </Box>
              <Box sx={{ mt: 12, mb: 8 }}>
                <Typography sx={{ py: 4 }}>Feeding Days</Typography>

                <Stack direction='row' gap={3} mb={2}>
                  {Day?.map(day => (
                    <Box
                      key={day.id}
                      onClick={event => handleDayClick(day)}
                      sx={{
                        fontSize: 11,
                        fontWeight: 'bold',
                        bgcolor: selectedDays.includes(day.id) ? '#203e56' : '#dedede',
                        borderRadius: 5,
                        p: 2,
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: '#203e56',
                          color: 'white'
                        },
                        color: selectedDays.includes(day.id) ? 'white' : 'black'
                      }}
                    >
                      {day.name}
                    </Box>
                  ))}
                </Stack>
                <Box sx={{ py: 3 }}>
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

              <Button fullWidth variant='contained' size='large' onClick={() => handelSetIngredient()}>
                ADD TO MEAL
              </Button>
            </Card>
          )}

          {/* -------------------------------------------- */}

          {!showDays && (
            <Button fullWidth variant='contained' size='large' sx={{ mb: 4 }} onClick={() => handleContinueClick()}>
              {selectedCard?.length} SELECTED - CONTINUE
            </Button>
          )}
        </Box>
      </Drawer>
    </>
  )
}

export default AddIngredientswithChoice

const Day = [
  { id: 0, name: 'All', isActive: false },
  { id: 1, name: 'Mon', isActive: false },
  { id: 2, name: 'Tue', isActive: false },
  { id: 3, name: 'Wed', isActive: false },
  { id: 4, name: 'Thu', isActive: false },
  { id: 5, name: 'Fri', isActive: false },
  { id: 6, name: 'Sat', isActive: false },
  { id: 7, name: 'Sun', isActive: false }
]
