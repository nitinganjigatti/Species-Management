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
  collapseClasses
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
  const {
    open,
    handleSidebarClose,
    onChange,
    childStateValue,
    checkid,
    allSelectedValues,
    formData,
    setSelectedIngredient,
    setUomprev
  } = props
  const [feed, setFeed] = React.useState('')
  const [selectFeed, setSelectFeed] = useState({})
  console.log('selectFeed :>> ', selectFeed)

  const [searchValue, setSearchValue] = useState('')
  const [remarks, setRemarks] = useState('')
  console.log('remarks :>> ', remarks)
  const [cutSize, setCutSize] = useState({})
  const [size, setSize] = useState({})
  const [visibility, setVisibility] = useState([])

  const [ingredientList, setIngredientList] = useState([])

  let [ingredientPage, setIngredientPage] = useState(1)
  const [reachedEnd, setReachedEnd] = useState(false)
  const [sort, setSort] = useState('desc')
  const [uom, setUom] = useState([])
  const [feedType, setFeedType] = useState([])
  const [selectedDays, setSelectedDays] = useState([])
  console.log('Selected days:', selectedDays)

  // const handelShowBottom = (event, item, index) => {
  //   // console.log('item', item)
  //   event.stopPropagation()

  //   setVisibility(prevVisibility => {
  //     const existingIndex = prevVisibility.findIndex(visItem => visItem && visItem.id === item.id)
  //     const newVisibility = [...prevVisibility]

  //     if (existingIndex !== -1) {
  //       // If the item already exists in visibility state, do not toggle off its visibility
  //       return newVisibility
  //     }

  //     // If the item is not visible or doesn't exist, set it to visible
  //     newVisibility.push({
  //       id: item.id,
  //       isVisible: true
  //     })

  //     return newVisibility
  //   })

  //   const allDays = Array.from({ length: 8 }, (_, i) => ({
  //     dayId: i,
  //     dayName: Day.find(day => day.id === i)?.name
  //   }))

  //   setSelectedDays(prevSelectedDays => {
  //     const existingIndex = prevSelectedDays.findIndex(selectedItem => selectedItem && selectedItem.cardId === item.id)

  //     if (existingIndex === -1) {
  //       // If the item doesn't exist, add it with all days selected
  //       return [...prevSelectedDays, { cardId: item.id, days: allDays }]
  //     }

  //     // If the item already exists, do not update the selected days
  //     return prevSelectedDays
  //   })
  // }

  const handelShowBottom = (event, item, index) => {
    event.stopPropagation()

    setVisibility(prevVisibility => {
      const existingIndex = prevVisibility.findIndex(visItem => visItem && visItem.id === item.id)
      const newVisibility = [...prevVisibility]

      if (existingIndex !== -1) {
        return newVisibility
      }
      newVisibility.push({
        id: item.id,
        isVisible: true
      })

      return newVisibility
    })

    const allDays = Array.from({ length: 8 }, (_, i) => ({
      dayId: i,
      dayName: Day.find(day => day.id === i)?.name
    }))

    setSelectedDays(prevSelectedDays => {
      const existingIndex = prevSelectedDays.findIndex(selectedItem => selectedItem && selectedItem.cardId === item.id)

      if (existingIndex === -1) {
        // If the item doesn't exist, add it with all days selected
        const newSelectedDays = [...prevSelectedDays, { cardId: item.id, days: allDays }]
        console.log('Updated selectedDays:', newSelectedDays) // Debug log

        return newSelectedDays
      }

      // If the item already exists, do not update the selected days
      return prevSelectedDays
    })

    // Use the updated selectedDays state
    setSelectedDays(currentSelectedDays => {
      handelCardSelection(event, item, null, null, null, currentSelectedDays)

      return currentSelectedDays
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

  // const handleChangeFeed = (event, item) => {
  //   event.stopPropagation()
  //   const { value } = event.target

  //   const selectedFeedType = item.preparation_types.find(type => type.id === value)

  //   setSelectFeed(prevState => ({
  //     ...prevState,
  //     [item.id]: {
  //       id: selectedFeedType.id,
  //       name: selectedFeedType.label
  //     }
  //   }))

  //   if (selectedFeedType.label !== 'Chopped') {
  //     handelCardSelection(event, item, selectedFeedType, null, null, selectedDays)
  //   }
  // }

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

    // Log the current selectedFeedType and selectedDays
    console.log('Selected Feed Type:', selectedFeedType)
    console.log('Current selectedDays:', selectedDays)

    // Update selectedDays if necessary before calling handelCardSelection
    if (selectedFeedType.label !== 'Chopped') {
      setSelectedDays(prevSelectedDays => {
        const existingIndex = prevSelectedDays.findIndex(
          selectedItem => selectedItem && selectedItem.cardId === item.id
        )

        // If the item doesn't exist, add it with all days selected
        if (existingIndex === -1) {
          const allDays = Array.from({ length: 8 }, (_, i) => ({
            dayId: i,
            dayName: Day.find(day => day.id === i)?.name
          }))
          const newSelectedDays = [...prevSelectedDays, { cardId: item.id, days: allDays }]
          console.log('Updated selectedDays:', newSelectedDays) // Debug log

          return newSelectedDays
        }

        return prevSelectedDays
      })

      // Ensure that handelCardSelection uses the updated selectedDays state
      setSelectedDays(currentSelectedDays => {
        if (selectedFeedType.label !== 'Chopped') {
          handelCardSelection(event, item, selectedFeedType, null, null, currentSelectedDays)
        }

        return currentSelectedDays
      })
    }
  }

  const handleChangeSize = (event, item) => {
    event.stopPropagation()

    const newUom = event.target.value

    setSize(prevState => ({
      ...prevState,
      [item.id]: {
        id: event.target.value
        // name: selectedFeedType.label
      }
    }))

    // Update the state with the new object
    // setSize(updatedObject)
    console.log('size :>> ', size)

    if (cutSize) {
      handelCardSelection(event, item, null, null, newUom, selectedDays)
    }
  }

  const handleAddRemarks = (event, item) => {
    // event.stopPropagation()
    // setRemarks(event.target.value)
    const newRemarks = event.target.value
    setRemarks(prevState => ({
      ...prevState,
      [item.id]: {
        remarks: event.target.value
      }
    }))

    if (remarks) {
      handelCardSelection(event, item, null, null, null, selectedDays, newRemarks)
    }
  }

  const handleDayClick = (event, dayId, dayName, cardId, item) => {
    event.stopPropagation()

    const updatedSelectedDays = selectedDays
      .map(selectedItem => {
        if (selectedItem.cardId === cardId) {
          let updatedDays = [...selectedItem.days] // Copy existing days

          if (dayId === 0 && !updatedDays.some(day => day.dayId === 0)) {
            // Select "All" if it's not already selected
            updatedDays = Day.map(day => ({ dayId: day.id, dayName: day.name }))
            // updatedDays.push({ dayId: 0, dayName: 'All' })
          } else if (dayId !== 0) {
            // Toggle individual day selection
            const existingIndex = updatedDays.findIndex(d => d.dayId === dayId)
            if (existingIndex === -1) {
              updatedDays.push({ dayId, dayName })
            } else {
              updatedDays = updatedDays.filter(d => d.dayId !== dayId)
            }

            // Check if "All" should be deselected
            const allDayIndex = updatedDays.findIndex(d => d.dayId === 0)
            if (allDayIndex !== -1 && dayId !== 0) {
              updatedDays = updatedDays.filter(d => d.dayId !== 0)
            }
          }

          // Ensure at least one day remains selected if only one is currently selected
          if (updatedDays.length === 0 && selectedItem.days.length === 1) {
            updatedDays = selectedItem.days
          }

          return { cardId, days: updatedDays }
        }

        return selectedItem
      })
      .filter(item => item !== undefined) // Filter out any undefined items

    setSelectedDays(updatedSelectedDays)

    if (updatedSelectedDays.length > 0) {
      handelCardSelection(event, item, null, null, null, updatedSelectedDays)
    }
  }

  // card selection
  const [selectedCard, setSelectedCard] = useState([])
  console.log('selectedCard :>> ', selectedCard)

  // const handelCardSelection = (event, item, selectedFeedType, newCutSize, newUom, updatedSelectedDays) => {
  //   event.stopPropagation()

  //   // Get the selected feed value for the current item
  //   const feed_type_id = selectedFeedType ? selectedFeedType.id : selectFeed[item.id]?.id || ''
  //   const feed_type = selectedFeedType ? selectedFeedType.label : selectFeed[item.id]?.name || ''

  //   // Get the remarks value
  //   const remarksData = remarks || ''

  //   // Get the selected days for the current item
  //   const selectedDaysForItem = updatedSelectedDays?.filter(updatedDay => {
  //     return (
  //       updatedDay.cardId === item.id &&
  //       updatedDay.days.some(day => {
  //         return selectedDays.some(
  //           selectedDay =>
  //             selectedDay.cardId === updatedDay.cardId &&
  //             selectedDay.days.some(selectedDay => selectedDay.dayId === day.dayId)
  //         )
  //       })
  //     )
  //   })

  //   // Validation checks
  //   if (!feed_type) {
  //     // Display error message or handle empty feedType
  //     toast.error('Please select a feed type.')

  //     return
  //   }

  //   if (selectedDaysForItem?.length === 0) {
  //     // Display error message or handle no selected days
  //     toast.error('Please select at least one day.')

  //     return
  //   }

  //   if (feed_type === 'Chopped') {
  //     // Additional validation for 'Chopped' feed type
  //     const cutSizeValue = newCutSize ? newCutSize : cutSize || ''
  //     const sizeValue = newUom ? newUom : size || ''
  //     if (!cutSizeValue || !sizeValue) {
  //       // Display error message or handle empty cut size or size
  //       toast.error('Cut size and size are required for chopped feed.')

  //       return
  //     }
  //   }

  //   // Prepare the object to store values
  //   const boxValues = {
  //     ingredient_id: item.id,
  //     ingredient_name: item.ingredient_name,
  //     preparation_type_id: feed_type_id,
  //     preparation_type: feed_type,
  //     days_of_week: selectedDaysForItem?.flatMap(dayObj => dayObj.days.map(day => day.dayId)),
  //     remarks: remarksData,
  //     mealid: checkid
  //   }

  //   if (feed_type === 'Chopped') {
  //     // Include cut size and its dropdown only if feedType is "Chopped"
  //     const cutSizeValue = newCutSize ? newCutSize : cutSize || ''
  //     const sizeValue = newUom ? newUom : size || ''

  //     // Update boxValues with cut size and size
  //     boxValues.feed_cut_size = cutSizeValue
  //     boxValues.feed_uom_id = sizeValue
  //   }

  //   // Check if the boxValues already exist in selectedCard
  //   const existingIndex = selectedCard.findIndex(card => card.ingredient_id === item.id)
  //   if (existingIndex !== -1) {
  //     // If the card already exists, update its values
  //     selectedCard[existingIndex] = boxValues
  //     setSelectedCard([...selectedCard])
  //   } else {
  //     // If the card is new, add it to selectedCard
  //     setSelectedCard(prevValues => [...prevValues, boxValues])
  //   }
  // }

  // const removeingClick = () => {
  //   // Call the function passed from the parent component
  //   props.removeingClick(item) // Pass the item to be removed
  // }

  // useEffect(() => {
  //   const filteredSelectedCard = selectedCard.filter(card => card.mealid === checkid)
  //   setSelectedCard(filteredSelectedCard)
  // }, [checkid])

  const handelCardSelection = (event, item, selectedFeedType, newCutSize, newUom, selectedDays, newRemarks) => {
    event.stopPropagation()
    console.log('handelCardSelection newRemarks :>> ', newRemarks)

    const feed_type_id = selectedFeedType ? selectedFeedType.id : selectFeed[item.id]?.id || ''
    const feed_type = selectedFeedType ? selectedFeedType.label : selectFeed[item.id]?.name || ''
    const remarksData = newRemarks ? newRemarks : remarks[item.id]?.remarks || ''

    const selectedDaysForItem = selectedDays
      ?.filter(updatedDay => updatedDay.cardId === item.id)
      .flatMap(dayObj => dayObj.days.map(day => day.dayId))

    console.log('selectedDaysForItem :>> ', selectedDaysForItem) // Debug log

    if (!feed_type) {
      // toast.error('Please select a feed type.')

      return
    }

    if (feed_type === 'Chopped') {
      const cutSizeValue = newCutSize ? newCutSize : cutSize[item.id]?.id || ''
      const sizeValue = newUom ? newUom : size[item.id]?.id || ''
      if (!cutSizeValue || !sizeValue) {
        // toast.error('Cut size and size are required for chopped feed.')

        return
      }
    }
    // console.log(item, 'item')

    const boxValues = {
      ingredient_id: item.id,
      ingredient_name: item.ingredient_name,
      preparation_type_id: feed_type_id,
      preparation_type: feed_type,
      days_of_week: selectedDaysForItem,
      remarks: newRemarks ? newRemarks : remarksData,
      mealid: checkid,
      ingredient_image: item.ingredient_image,
      feed_cut_size: feed_type === 'Chopped' ? (newCutSize ? newCutSize : cutSize[item.id]?.id || '') : '',
      feed_uom_id: feed_type === 'Chopped' ? (newUom ? newUom : size[item.id]?.id || '') : ''
    }

    // if (feed_type === 'Chopped') {
    //   console.log('feed_type :>> ', feed_type)
    //   boxValues.feed_cut_size = feed_type === 'Chopped' ? (newCutSize ? newCutSize : cutSize || '') : ''
    //   boxValues.feed_uom_id = feed_type === 'Chopped' ? (newUom ? newUom : size || '') : ''
    // }

    const existingIndex = selectedCard.findIndex(card => card.ingredient_id === item.id)

    if (existingIndex !== -1) {
      // If the card already exists, update its values
      console.log('Updating existing card:', selectedCard[existingIndex])
      selectedCard[existingIndex] = boxValues
      setSelectedCard([...selectedCard])
    } else {
      // If the card is new, add it to selectedCard
      console.log('Adding new card:', boxValues)
      setSelectedCard(prevValues => [...prevValues, boxValues])
    }
    console.log('Updated selectedCard:', selectedCard) // Debug log
  }

  const handleAllSelect = event => {
    setSelectedCard(selectedCard)
    onChange(selectedCard)
    // event.stopPropagation()
    setSelectedIngredient(selectedCard)
    handleSidebarClose()

    return toast.success('Ingredient selected')
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
        page: 1,
        limit: 50
      }
      await getUnitsForRecipe({ params: params }).then(res => {
        setUom(res?.data?.result)
        setUomprev(res?.data?.result)
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

  useEffect(() => {
    // Filter out duplicates based on id and mealid
    const uniqueSelectedValues = allSelectedValues?.filter(
      (value, index, self) =>
        index === self.findIndex(v => v?.ingredient_id === value?.ingredient_id && v?.mealid === value?.mealid)
    )
    // console.log(uniqueSelectedValues, 'uniqueSelectedValues')
    // Compare uniqueSelectedValues with checkid
    const selectedValuesWithCheckId = uniqueSelectedValues?.filter(item => item?.mealid === checkid)
    console.log(selectedValuesWithCheckId, 'selectedValuesWithCheckId')

    const updatedSelectedCard =
      selectedValuesWithCheckId?.map(item => ({
        ...item,
        ingredient_id: String(item.ingredient_id) // Convert ingredient_id to string
      })) || []

    setSelectedCard(updatedSelectedCard)

    // Extract cardId values and selectedDays arrays from selectedValuesWithCheckId
    const cardIds = selectedValuesWithCheckId?.map(item => item.ingredient_id)
    const days = selectedValuesWithCheckId?.map(item => item.days_of_week)

    // Update selectedDays state with the extracted values
    const updatedSelectedDays = []
    cardIds?.forEach((cardId, index) => {
      updatedSelectedDays.push({
        cardId: String(cardId),
        days: days[index]?.map(dayId => ({
          dayId: dayId,
          dayName: Day.find(day => day.id === dayId)?.name
        }))
      })
    })
    setSelectedDays(updatedSelectedDays)
    // console.log(selectedValuesWithCheckId, 'selectedValuesWithCheckId')
    // Update selectFeed state based on selectedValuesWithCheckId
    const newSelectFeed = {}

    const newVisibility = selectedValuesWithCheckId?.map(item => ({
      id: String(item.ingredient_id),
      isVisible: true
    }))

    selectedValuesWithCheckId?.forEach(item => {
      if (item.mealid === checkid) {
        const preparationType = item.preparation_type
        const preparationTypeId = item.preparation_type_id
        newSelectFeed[item.ingredient_id] = {
          id: preparationTypeId,
          name: preparationType
        }
      }
    })
    setSelectFeed(newSelectFeed)
    setVisibility(newVisibility)
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
    setCutSize(prevState => ({
      ...prevState,
      [item.id]: {
        id: event.target.value
        // name: selectedFeedType.label
      }
    }))
    // setCutSize(event.target.value)

    // Call handelCardSelection with the updated cutSize value
    if (size) {
      handelCardSelection(event, item, null, newCutSize, null, selectedDays)
    }
  }

  const removeSelectedCard = (event, itemId) => {
    event.stopPropagation()
    console.log('removeSelectedCard Called')

    // Check if the card with itemId is present in the selectedCard state
    const cardIndex = selectedCard.findIndex(card => card.ingredient_id === itemId)
    console.log('cardIndex :>> ', cardIndex)

    if (cardIndex !== -1) {
      // If the card is found, remove it from the selectedCard state
      const updatedSelectedCard = [...selectedCard]
      updatedSelectedCard.splice(cardIndex, 1)
      setSelectedCard(updatedSelectedCard)
    }
  }
  console.log(selectedCard, 'selectedCard')

  const sortedIngredientList = [...ingredientList]?.sort((a, b) => a.ingredient_name.localeCompare(b.ingredient_name))

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
          {sortedIngredientList?.map((item, index) => (
            <Box
              key={item?.id}
              sx={{
                bgcolor: 'white',
                mx: '24px',
                borderRadius: '8px',
                my: 4,
                ...(selectedCard.some(card => card.ingredient_id === item.id) && {
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
                {selectedCard.some(card => card.ingredient_id === item.id) ? (
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
                    <Typography>Feed Type - {item?.feed_type_label}</Typography>
                  </Stack>
                  <Stack
                    direction='row'
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mt: 1 }}
                  >
                    <Typography>Preparation Type</Typography>

                    <Box sx={{ width: 200 }}>
                      <FormControl fullWidth>
                        <Select
                          size='small'
                          value={selectFeed[item.id]?.id || ''}
                          onChange={e => handleChangeFeed(e, item)}
                          displayEmpty
                          // color=
                          error={
                            visibility?.find(visItem => visItem && visItem.id === item.id)?.isVisible &&
                            !selectFeed[item.id]?.id
                          }
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
                    display: visibility?.find(visItem => visItem && visItem.id === item.id)?.isVisible
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
                              value={cutSize[item.id]?.id || ''}
                              onChange={event => handelInputCutSize(event, item)}
                              error={
                                visibility?.find(visItem => visItem && visItem.id === item.id)?.isVisible &&
                                !cutSize[item.id]?.id
                              }
                              // sx={{
                              //   ...(visibility?.find(visItem => visItem && visItem.id === item.id)?.isVisible && {
                              //     '& .MuiOutlinedInput-root': {
                              //       '& fieldset': {
                              //         borderColor: !cutSize[item.id]?.id && 'red',
                              //         borderWidth: '2px'
                              //       },
                              //       '&:hover fieldset': {
                              //         borderColor: !cutSize[item.id]?.id && 'red'
                              //       },
                              //       '&.Mui-focused fieldset': {
                              //         borderColor: !cutSize[item.id]?.id && 'default'
                              //       }
                              //     }
                              //   }),
                              //   borderRadius: 1 // Ensure borderRadius is applied correctly
                              // }}

                              // onChange={event => setCutSize(event.target.value)}
                            />
                          </FormControl>
                        </Box>
                        <Box sx={{ width: '160.5px' }}>
                          <FormControl fullWidth>
                            <Select
                              size='small'
                              value={size[item.id]?.id || ''}
                              onChange={event => handleChangeSize(event, item)}
                              displayEmpty
                              error={
                                visibility?.find(visItem => visItem && visItem.id === item.id)?.isVisible &&
                                !size[item.id]?.id
                              }
                              // sx={{
                              //   ...(visibility?.find(visItem => visItem && visItem.id === item.id)?.isVisible && {
                              //     borderColor: !size[item.id]?.id ? 'red' : '#ffffff',
                              //     borderWidth: '2px',
                              //     borderStyle: 'solid',
                              //     borderRadius: 1,
                              //     '&.Mui-focused': {
                              //       borderColor: 'transparent'
                              //     }
                              //   })
                              // }}
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

                  <Divider />
                  <Box>
                    <Typography sx={{ py: 3, px: 2 }}>Feeding Days</Typography>

                    <Stack direction='row' gap={3} mb={2} sx={{ px: 2 }}>
                      {Day?.map(day => (
                        <Box
                          key={day.id}
                          onClick={event => handleDayClick(event, day.id, day.name, item.id, item)}
                          sx={{
                            fontSize: 11,
                            fontWeight: 'bold',

                            bgcolor: selectedDays.some(
                              selectedDay =>
                                selectedDay.cardId === item.id &&
                                selectedDay.days?.some(selectedDay => selectedDay.dayId === day.id)
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
                                selectedDay.days?.some(selectedDay => selectedDay.dayId === day.id)
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
                        <TextField
                          sx={{ pt: 1 }}
                          id='demo-simple-select-label'
                          placeholder='Add Remarks (optional)'
                          variant='standard'
                          InputProps={{ disableUnderline: true }}
                          value={remarks[item.id]?.remarks || ''}
                          onChange={event => handleAddRemarks(event, item)}
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
              <CircularProgress sx={{ mb: 10 }} />
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
  { id: 4, name: 'Thu', isActive: false },
  { id: 5, name: 'Fri', isActive: false },
  { id: 6, name: 'Sat', isActive: false },
  { id: 7, name: 'Sun', isActive: false }
]
