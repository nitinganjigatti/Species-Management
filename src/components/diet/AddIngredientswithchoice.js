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
  Card,
  InputAdornment
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import ClearIcon from '@mui/icons-material/Clear'
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
import { getFeedTypeList } from 'src/lib/api/diet/feedType'

const AddIngredientswithChoice = props => {
  const {
    open,
    setOpenIngredientchoice,
    handleSidebarClose,
    onChange,
    allIngredientchoiceSelectedValues,
    checkid,
    formData,
    ingType,
    setingType,
    ingredientChoiceIndex
  } = props

  const [feed, setFeed] = React.useState('')
  const [selectFeed, setSelectFeed] = useState({})

  const [searchValue, setSearchValue] = useState('')

  const [remarks, setRemarks] = useState('')

  const [cutSize, setCutSize] = useState({})
  const [size, setSize] = useState({})
  const [visibility, setVisibility] = useState([])

  const [ingredientList, setIngredientList] = useState([])
  console.log('ingredientList :>> ', ingredientList)
  const [totalCount, setTotalCount] = useState('')
  console.log('totalCount :>> ', totalCount)

  let [ingredientPage, setIngredientPage] = useState(1)
  const [reachedEnd, setReachedEnd] = useState(false)
  const [sort, setSort] = useState('desc')
  const [uom, setUom] = useState([])
  const [feedType, setFeedType] = useState([])
  const [selectedDays, setSelectedDays] = useState([])

  const [count, setCount] = useState(1)
  const [showDays, setShowDays] = useState(false)

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
  }

  const handleChangeTopFeed = async event => {
    setReachedEnd(true)
    setFeed(event.target.value)

    try {
      const params = { page: ingredientPage, q: searchValue, sort, feed_type: event.target.value, status: 1 }
      await getIngredientList({ params }).then(res => {
        console.log(res, 'rest')
        if (res?.data?.result?.length > 0) {
          setIngredientList(res?.data?.result)
          setReachedEnd(false)
        } else {
          setReachedEnd(false)
          setIngredientList([])
        }
      })
    } catch (error) {
      console.error(error)
    }
  }

  const handleClearFeed = async () => {
    setFeed('')
    setReachedEnd(true)

    try {
      const params = { page: ingredientPage, q: searchValue, sort, feed_type: '', status: 1 }
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
    console.log(event, 'event')
    console.log(item, 'item')
    event.stopPropagation()
    // const newUom = event.target.value
    const newUom = uom.find(type => Number(type._id) === Number(item.uom_id))

    setSize(prevState => ({
      ...prevState,
      [item.id]: {
        id: event.target.value,
        name: newUom?.name
      }
    }))

    if (size) {
      handelCardSelection(event, item, null, null, newUom, selectedDays)
    }
  }

  const handleAddRemarks = event => {
    event.stopPropagation()
    setRemarks(event.target.value)
  }

  // card selection
  const [selectedCardIngchoice, setSelectedCardIngredientchoice] = useState([])

  const handelCardSelection = (event, item, selectedFeedType, newCutSize, newUom, updatedSelectedDays) => {
    event.stopPropagation()

    // Get the selected feed value for the current item
    const feed_type_id = selectedFeedType ? selectedFeedType.id : selectFeed[item.id]?.id || ''
    const feed_type = selectedFeedType ? selectedFeedType.label : selectFeed[item.id]?.name || ''

    // Get the remarks value
    const remarksData = remarks || ''
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
    console.log(item, 'item')

    // Prepare the object to store values
    const boxValues = {
      ingredient_id: item.id,
      ingredient_name: item.ingredient_name,
      preparation_type_id: feed_type_id,
      preparation_type: feed_type,
      // days_of_week: selectedDaysForItem?.flatMap(dayObj => dayObj.days.map(day => day.dayId)),
      // remarks: remarksData,
      mealid: checkid,
      ingredient_image: item.image
    }

    if (feed_type === 'Chopped') {
      // Include cut size and its dropdown only if feedType is "Chopped"
      const cutSizeValue = newCutSize ? newCutSize : cutSize[item.id]?.id || ''
      const sizeValue = newUom ? newUom?.id : size[item.id]?.id || ''
      const sizeName = newUom ? newUom?.name : size[item.id]?.name || ''

      // Update boxValues with cut size and size
      boxValues.feed_cut_size = cutSizeValue
      boxValues.feed_uom_id = sizeValue
      boxValues.feed_uom_name = sizeName
    }

    // Check if the boxValues already exist in selectedCardIngchoice
    const existingIndex = selectedCardIngchoice.findIndex(card => card.ingredient_id === item.id)
    if (existingIndex !== -1) {
      // If the card already exists, update its values
      selectedCardIngchoice[existingIndex] = boxValues
      setSelectedCardIngredientchoice([...selectedCardIngchoice])
    } else {
      // If the card is new, add it to selectedCardIngchoice
      setSelectedCardIngredientchoice(prevValues => [...prevValues, boxValues])
    }
  }

  const handleContinueClick = event => {
    if (selectedCardIngchoice.length === 0) {
      toast.error('Please select an Ingredient')
    }
    if (selectedCardIngchoice.length >= 1) {
      setShowDays(true)

      const allDayIds = Day.map(day => day.id)
      setSelectedDays(allDayIds)
    }
  }

  useEffect(() => {
    getUnitsList()
    setReachedEnd(true)

    try {
      const params = { page: ingredientPage, q: searchValue, sort, limit: 20, status: 1 }
      getIngredientList({ params }).then(res => {
        if (res?.data?.result?.length > 0) {
          setIngredientList(prevArray => [...prevArray, ...res?.data?.result])
          setTotalCount(res?.data?.total_count)
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
    const params = { page: 1, limit: 50, status: 1 }
    try {
      const response = await getFeedTypeList(params)

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
      })
    } catch (e) {
      console.log(e)
    }
  }

  const handleScroll = async e => {
    const container = e.target

    // Check if the user has reached the bottom
    if (totalCount > ingredientList.length) {
      console.log('api :>> ')
      if (container.scrollHeight - Math.round(container.scrollTop) === container.clientHeight) {
        // User has reached the bottom, perform your action here

        setIngredientPage(++ingredientPage)
        setReachedEnd(true)
        try {
          const params = { page: ingredientPage, q: searchValue, sort, feed_type: feed, limit: 20, status: 1 }
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
  }

  useEffect(() => {
    if (ingType === 'addingIndex') {
      const selectedValuesWithCheckId = allIngredientchoiceSelectedValues?.filter((item, index) => {
        return index === ingredientChoiceIndex && item?.mealid === checkid
      })
      console.log(selectedValuesWithCheckId, 'selectedValuesWithCheckId')
      if (selectedValuesWithCheckId?.length > 0) {
        // Extract ingredientList from selectedValuesWithCheckId
        const ingredientLists = selectedValuesWithCheckId.flatMap(item => item.ingredientList)
        const daysOfWeek = selectedValuesWithCheckId.flatMap(item => item.days_of_week)
        const minChoices = selectedValuesWithCheckId.flatMap(item => item.no_of_component_required)
        // Update selectedCardIngredientchoice state with ingredientList values
        setSelectedCardIngredientchoice(ingredientLists)
        // Update selectedDays state with the extracted days
        setSelectedDays(daysOfWeek)
        setShowDays(true)
        setCount(Math.max(...minChoices))
        //setListOfIngredient(selectedValuesWithCheckId)
        // Create selectFeed object
        const selectFeedObj = {}
        const newUom = {}
        const newCutSize = {}
        let newRemarks = ''
        const newVisibility = []

        selectedValuesWithCheckId.forEach((item, itemIndex) => {
          item.ingredientList.forEach(ingredient => {
            selectFeedObj[ingredient.ingredient_id] = {
              id: ingredient.preparation_type_id,
              name: ingredient.preparation_type
            }
            newUom[ingredient.ingredient_id] = {
              id: ingredient.feed_uom_id
            }
            newCutSize[ingredient.ingredient_id] = {
              id: ingredient.feed_cut_size
            }
            if (ingredient.ingredient_id) {
              newRemarks = item?.remarks
            }
          })
        })

        setSelectFeed(selectFeedObj)
        setSize(newUom)
        setCutSize(newCutSize)
        setRemarks(newRemarks)
      }
    } else {
      setShowDays(false)
      setListOfIngredient(allIngredientchoiceSelectedValues)
      setSelectedCardIngredientchoice([])
      setSelectedDays([])
      setShowDays(false)
      setCount(1)
      setSelectFeed({})
      setSize({})
      setCutSize({})
      setRemarks('')
    }
  }, [allIngredientchoiceSelectedValues, checkid, ingType === 'addingIndex', ingredientChoiceIndex, open])

  const searchData = useCallback(
    debounce(async search => {
      if (searchValue != ' ') {
        console.log('search ingwc :>> ', search)
        try {
          // const currentAnimalFilterValue = animalFilterValueRef.current
          const params = { page: 1, q: search, sort, status: 1 }
          await getIngredientList({ params }).then(res => {
            if (res?.data?.result.length > 0) {
              setIngredientList(res?.data?.result)
              setIngredientPage(1)
            } else {
              setIngredientList([])
            }
          })
        } catch (error) {
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

    // Call handelCardSelection with the updated cutSize value
    if (newCutSize) {
      handelCardSelection(event, item, null, newCutSize, null, selectedDays)
    } else {
      removeSelectedCard(event, item.id)
    }
  }

  const removeSelectedCard = (event, itemId) => {
    // Check if the card with itemId is present in the selectedCard state
    const cardIndex = selectedCardIngchoice.findIndex(card => card.ingredient_id === itemId)

    if (cardIndex !== -1) {
      // If the card is found, remove it from the selectedCard state
      const updatedSelectedCard = [...selectedCardIngchoice]
      updatedSelectedCard.splice(cardIndex, 1)
      setSelectedCardIngredientchoice(updatedSelectedCard)
    }
  }

  const handleIncrement = () => {
    if (count < selectedCardIngchoice.length) {
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

  // const handelSetIngredient = () => {
  //   setShowDays(false)
  //   setOpenIngredientchoice(false)
  //   console.log(allIngredientchoiceSelectedValues, 'allIngredientchoiceSelectedValues')
  //   console.log(selectedCardIngchoice, 'selectedCardIngchoice')
  //   console.log(listOfIngredient, 'listOfIngredient')
  //   // Collect data
  //   if (ingType === 'addingIndex') {
  //     // Find the index of the ingredient being updated
  //     const existingIngredientIndex = allIngredientchoiceSelectedValues.findIndex((item, index) => {
  //       return (
  //         index === ingredientChoiceIndex && // Check if the index matches
  //         item.mealid === checkid && // Check if the mealid matches
  //         item.ingredientList.some(ingredient => {
  //           return selectedCardIngchoice.some(selectedIngredient => {
  //             return selectedIngredient.ingredient_id === ingredient.ingredient_id
  //           })
  //         })
  //       )
  //     })
  //     console.log(existingIngredientIndex, 'existingIngredientIndex')
  //     // If the ingredient_id with the same mealid exists, update its values
  //     if (existingIngredientIndex !== -1) {
  //       // Clone the listOfIngredient to make changes
  //       const updatedListOfIngredient = [...allIngredientchoiceSelectedValues]

  //       // Update the ingredient at the specified index
  //       updatedListOfIngredient[existingIngredientIndex] = {
  //         ...updatedListOfIngredient[existingIngredientIndex],
  //         ingredientList: selectedCardIngchoice,
  //         days_of_week: selectedDays,
  //         no_of_component_required: count,
  //         remarks: remarks
  //       }
  //       console.log(listOfIngredient, 'listOfIngredient')

  //       // Check if the same ingredient_id is present in any other index of listOfIngredient with the same preparation_type
  //       const duplicateIngredientIndex = allIngredientchoiceSelectedValues.findIndex((item, index) => {
  //         return (
  //           index !== existingIngredientIndex && // Exclude the current index
  //           item.mealid === checkid && // Check if the mealid matches
  //           item.ingredientList.some(ingredient => {
  //             return selectedCardIngchoice.some(selectedIngredient => {
  //               return (
  //                 selectedIngredient.ingredient_id === ingredient.ingredient_id &&
  //                 selectedIngredient.preparation_type === ingredient.preparation_type
  //               )
  //             })
  //           })
  //         )
  //       })

  //       // If the same ingredient_id is found in another index with the same preparation_type, show an error toast
  //       if (duplicateIngredientIndex !== -1) {
  //         toast.error('Cannot update ingredient with the same preparation type in multiple places.')
  //         setingType('')

  //         return
  //       }

  //       // Set the updated listOfIngredient
  //       setListOfIngredient(updatedListOfIngredient)
  //       onChange(updatedListOfIngredient)

  //       // Show success toast message for updating the ingredient
  //       toast.success('Ingredient updated successfully!')

  //       return
  //     }
  //   } else {
  //     const selectedIngredient = {
  //       ingredientList: selectedCardIngchoice,
  //       days_of_week: selectedDays,
  //       no_of_component_required: count,
  //       remarks: remarks,
  //       mealid: checkid
  //     }

  //     // Check if any ingredient with the same preparation_type and ingredient_id already exists for the same mealid
  //     const matchedIngredient = listOfIngredient.find(item => {
  //       return (
  //         item.mealid === checkid && // Check if the mealid matches
  //         item.ingredientList.some(ingredient => {
  //           return selectedCardIngchoice.some(selectedIngredient => {
  //             return (
  //               selectedIngredient.preparation_type === ingredient.preparation_type &&
  //               selectedIngredient.ingredient_id === ingredient.ingredient_id
  //             )
  //           })
  //         })
  //       )
  //     })

  //     if (matchedIngredient) {
  //       const daysMatch = selectedDays.every(day => matchedIngredient.days_of_week.includes(day))
  //       if (daysMatch) {
  //         // If days_of_week arrays partially match, do not add
  //         const matchedIngredientName = matchedIngredient.ingredientList.map(ingredient => ingredient.name).join(', ')
  //         console.log(
  //           `Ingredient(s) ${matchedIngredientName} already exist(s) with same preparation_type and days_of_week`
  //         )
  //         toast.error(
  //           `Ingredient(s) ${matchedIngredientName} already exist(s) with same preparation_type and days_of_week`
  //         )

  //         return
  //       }
  //     }

  //     // Add the selected ingredient to the list of ingredients
  //     setListOfIngredient(prevList => {
  //       const updatedList = [...prevList, selectedIngredient]
  //       onChange(updatedList) // Call onChange with the updated list
  //       console.log(updatedList, 'updatedList')

  //       return updatedList
  //     })
  //     setSelectedCardIngredientchoice([])
  //     setVisibility([])
  //     setSelectFeed({})

  //     // Show success toast message
  //     toast.success('Ingredient added successfully!')
  //   }
  // }

  const handelSetIngredient = () => {
    setShowDays(false)
    setOpenIngredientchoice(false)

    if (ingType === 'addingIndex') {
      // Find the index of the ingredient being updated
      const existingIngredientIndex = allIngredientchoiceSelectedValues.findIndex((item, index) => {
        if (index === ingredientChoiceIndex && item.mealid === checkid) {
          // If ingredientList is empty, return true (match)
          if (item.ingredientList.length === 0) return true

          // Otherwise, check for matching ingredient_id
          return item.ingredientList.some(ingredient =>
            selectedCardIngchoice.some(
              selectedIngredient => selectedIngredient.ingredient_id === ingredient.ingredient_id
            )
          )
        }

        return false
      })

      if (existingIngredientIndex !== -1) {
        // Clone the listOfIngredient to make changes
        const updatedListOfIngredient = [...allIngredientchoiceSelectedValues]

        // Update the ingredient at the specified index
        updatedListOfIngredient[existingIngredientIndex] = {
          ...updatedListOfIngredient[existingIngredientIndex],
          ingredientList: selectedCardIngchoice,
          days_of_week: selectedDays,
          no_of_component_required: count,
          remarks: remarks
        }

        // Check if the same ingredient_id is present in any other index of listOfIngredient with the same preparation_type
        const duplicateIngredientIndex = allIngredientchoiceSelectedValues.findIndex((item, index) => {
          return (
            index !== existingIngredientIndex && // Exclude the current index
            item.mealid === checkid && // Check if the mealid matches
            item.ingredientList.some(ingredient => {
              return selectedCardIngchoice.some(
                selectedIngredient =>
                  selectedIngredient.ingredient_id === ingredient.ingredient_id &&
                  selectedIngredient.preparation_type === ingredient.preparation_type
              )
            })
          )
        })

        // If the same ingredient_id is found in another index with the same preparation_type, show an error toast
        if (duplicateIngredientIndex !== -1) {
          toast.error('Cannot update ingredient with the same preparation type in multiple places.')
          setingType('')

          return
        }

        // Set the updated listOfIngredient
        setListOfIngredient(updatedListOfIngredient)
        onChange(updatedListOfIngredient)

        // Show success toast message for updating the ingredient
        toast.success('Ingredient updated successfully!')

        return
      }
    } else {
      const selectedIngredient = {
        ingredientList: selectedCardIngchoice,
        days_of_week: selectedDays,
        no_of_component_required: count,
        remarks: remarks,
        mealid: checkid
      }

      // Check if any ingredient with the same preparation_type and ingredient_id already exists for the same mealid
      const matchedIngredient = listOfIngredient.find(item => {
        return (
          item.mealid === checkid && // Check if the mealid matches
          item.ingredientList.some(ingredient => {
            return selectedCardIngchoice.some(
              selectedIngredient =>
                selectedIngredient.preparation_type === ingredient.preparation_type &&
                selectedIngredient.ingredient_id === ingredient.ingredient_id
            )
          })
        )
      })

      if (matchedIngredient) {
        const daysMatch = selectedDays.every(day => matchedIngredient.days_of_week.includes(day))
        if (daysMatch) {
          // If days_of_week arrays partially match, do not add
          const matchedIngredientName = matchedIngredient.ingredientList.map(ingredient => ingredient.name).join(', ')

          toast.error(
            `Ingredient(s) ${matchedIngredientName} already exist(s) with same preparation_type and days_of_week`
          )

          return
        }
      }

      // Add the selected ingredient to the list of ingredients
      setListOfIngredient(prevList => {
        const updatedList = [...prevList, selectedIngredient]
        onChange(updatedList) // Call onChange with the updated list

        return updatedList
      })

      setSelectedCardIngredientchoice([])
      setVisibility([])
      setSelectFeed({})
      toast.success('Ingredient added successfully!')
    }
  }

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
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300
                      }
                    }
                  }}
                  endAdornment={
                    feed ? (
                      <InputAdornment position='end' sx={{ position: 'absolute', right: '30px' }}>
                        <IconButton aria-label='clear feed selection' onClick={handleClearFeed} edge='end'>
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ) : (
                      ''
                    )
                  }
                >
                  {feedType?.map(feedList => (
                    <MenuItem key={feedList?.key} value={feedList?.id}>
                      {feedList?.feed_type_name}
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
                ...(selectedCardIngchoice.some(card => card.ingredient_id === item.id) && {
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
                {selectedCardIngchoice.some(card => card.ingredient_id === item.id) ? (
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
                      src={item?.image ? item?.image : '/icons/icon_diet_fill.png'}
                    ></Avatar>
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
                        {/* <InputLabel id='demo-simple-select-label'>Select</InputLabel> */}
                        <Select
                          size='small'
                          value={selectFeed[item.id]?.id || ''}
                          onChange={e => handleChangeFeed(e, item)}
                          displayEmpty
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
                              value={cutSize[item.id]?.id || ''}
                              onChange={event => handelInputCutSize(event, item)}
                              error={
                                visibility?.find(visItem => visItem && visItem.id === item.id)?.isVisible &&
                                !cutSize[item.id]?.id
                              }

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
                              MenuProps={{
                                PaperProps: {
                                  style: {
                                    maxHeight: 300
                                  }
                                }
                              }}
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
                  {selectedCardIngchoice?.length} Items Selected
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
                        bgcolor: selectedDays.includes(day.id) ? '#203e56' : '#dedede66',
                        borderRadius: 5,
                        p: 2,
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: selectedDays.includes(day.id) ? '#203e56' : '#dedede',
                          color: selectedDays.includes(day.id) ? 'white' : 'black'
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
                    <TextField
                      sx={{ pt: 1 }}
                      id='demo-simple-select-label'
                      placeholder='Add Remarks (optional)'
                      variant='standard'
                      InputProps={{ disableUnderline: true }}
                      value={remarks}
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
              {selectedCardIngchoice?.length} SELECTED - CONTINUE
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
