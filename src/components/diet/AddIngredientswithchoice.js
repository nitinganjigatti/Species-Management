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
  InputAdornment,
  Tooltip
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
import { useTheme } from '@mui/material/styles'
import { getIngredientList } from 'src/lib/api/diet/getIngredients'
import { palette } from '@mui/system'

const AddIngredientswithChoice = props => {
  const {
    open,
    setOpenIngredientchoice,
    handleSidebarClose: parentHandleSidebarClose,
    onChange,
    allIngredientchoiceSelectedValues,
    checkid,
    formData,
    ingType,
    setingType,
    ingredientChoiceIndex,
    uom,
    feedType,
    fromrow,
    ingredientwithChoiceId,
    ingredientwithChoiceName,
    setIngredientList,
    ingredientList,
    totalCount,
    setTotalCount,
    ingredientPage,
    setIngredientPage,
    reachedEnd,
    setReachedEnd,
    searchValue,
    setSearchValue,
    setSort,
    sort
  } = props
  const theme = useTheme()
  const [feed, setFeed] = React.useState('')
  const [selectFeed, setSelectFeed] = useState({})

  const [remarks, setRemarks] = useState('')

  const [cutSize, setCutSize] = useState({})
  const [size, setSize] = useState({})
  const [visibility, setVisibility] = useState([])

  const [selectedDays, setSelectedDays] = useState([])

  const [count, setCount] = useState(1)
  const [showDays, setShowDays] = useState(false)
  const [loading, setLoading] = useState(false)

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

  const handleSidebarClose = () => {
    setSearchValue('')
    parentHandleSidebarClose()
    setFeed('')
  }

  const handleChangeTopFeed = async event => {
    setReachedEnd(true)
    setFeed(event.target.value)

    try {
      setLoading(true)
      const params = { page: 1, limit: 20, q: searchValue, sort, feed_type: event.target.value, status: 1 }
      await getIngredientList({ params }).then(res => {
        if (res?.data?.result?.length > 0) {
          setIngredientList(res?.data?.result)
          setIngredientPage(1)
          setTotalCount(res?.data?.total_count)
          setReachedEnd(false)
          setLoading(false)
        } else {
          setReachedEnd(false)
          setIngredientList([])
          setLoading(false)
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
          setIngredientPage(1)
          setTotalCount(res?.data?.total_count)
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

    if (selectedFeedType.label !== '') {
      handelCardSelection(event, item, selectedFeedType, null, null, selectedDays)
    }
  }

  const handleChangeSize = (event, item) => {
    event.stopPropagation()

    const { value } = event.target
    const newUom = uom.find(type => Number(type.id) === Number(value))

    setSize(prevState => ({
      ...prevState,
      [item.id]: {
        id: event.target.value,
        name: newUom?.cut_size
      }
    }))

    if (newUom) {
      handelCardSelection(event, item, null, null, newUom, selectedDays)
    }
  }

  const handleAddRemarks = event => {
    event.stopPropagation()
    setRemarks(event.target.value)
  }

  const [selectedCardIngchoice, setSelectedCardIngredientchoice] = useState([])

  const handelCardSelection = (event, item, selectedFeedType, newCutSize, newUom, updatedSelectedDays) => {
    event.stopPropagation()

    // Get the selected feed value for the current item
    const feed_type_id = selectedFeedType ? selectedFeedType.id : selectFeed[item.id]?.id || ''
    const feed_type = selectedFeedType ? selectedFeedType.label : selectFeed[item.id]?.name || ''

    // Get the remarks value
    const remarksData = remarks || ''
    if (!feed_type) {
      return
    }

    if (feed_type !== '') {
      const cutSizeValue = newCutSize ? newCutSize : cutSize[item.id]?.id || ''
      const sizeValue = newUom ? newUom : size[item.id]?.id || ''
      if (!sizeValue) {
        return
      }
    }

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

    if (feed_type !== '') {
      const sizeValue = newUom ? newUom?.id : size[item.id]?.id || ''
      const sizeName = newUom ? newUom?.cut_size : size[item.id]?.name || ''

      // boxValues.feed_cut_size = cutSizeValue
      boxValues.master_cut_size_id = sizeValue
      boxValues.master_cut_size = sizeName
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
    if (Object.keys(selectFeed).length === 0) {
      toast.error('Items are required', {
        duration: 1000
      })
    } else if (
      (Object.keys(selectFeed).length > 0 && Object.keys(size).length === 0) ||
      Object.keys(selectFeed).length !== Object.keys(size).length
    ) {
      toast.error('Please select a Cutsize', {
        duration: 1000
      })
    } else if (selectedCardIngchoice.length >= 1) {
      if (allIngredientchoiceSelectedValues.some(all => all.mealid === checkid) && ingType === 'addingIndex') {
        const selectedValuesWithCheckId = allIngredientchoiceSelectedValues?.filter((item, index) => {
          return index === ingredientChoiceIndex && item?.mealid === checkid
        })
        const daysOfWeek = selectedValuesWithCheckId.flatMap(item => item.days_of_week)
        setShowDays(true)
        setSelectedDays(daysOfWeek)
      } else {
        const allDayIds = Day.map(day => day.id)
        setShowDays(true)
        setSelectedDays(allDayIds)
      }
    }
  }

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async search => {
      try {
        setLoading(true)
        const params = { page: 1, q: search, sort, status: 1, limit: 20, feed_type: feed }
        const res = await getIngredientList({ params })
        if (res?.data?.result.length > 0) {
          setIngredientList(res.data.result)
          setIngredientPage(1)
          setTotalCount(res?.data?.total_count)
        } else {
          setIngredientList([])
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }, 500),
    [ingredientList]
  )

  const handleSearchChange = e => {
    const value = e.target.value
    setSearchValue(value)
    debouncedSearch(value)
  }

  const handleCancelClick = () => {
    setSearchValue('')
    debouncedSearch('')
  }

  const handleScroll = async e => {
    const container = e.target
    const threshold = 20

    if (totalCount > ingredientList.length) {
      const isNearBottom =
        container.scrollHeight - Math.round(container.scrollTop) <= container.clientHeight + threshold
      if (isNearBottom) {
        setIngredientPage(prevPage => prevPage + 1)
        setReachedEnd(true)
        try {
          const params = { page: ingredientPage + 1, q: searchValue, sort, feed_type: feed, limit: 20, status: 1 }
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

      if (selectedValuesWithCheckId?.length > 0) {
        const ingredientLists = selectedValuesWithCheckId.flatMap(item => item.ingredientList)
        const daysOfWeek = selectedValuesWithCheckId.flatMap(item => item.days_of_week)
        const minChoices = selectedValuesWithCheckId.flatMap(item => item.no_of_component_required)

        setSelectedCardIngredientchoice(ingredientLists)

        setSelectedDays(daysOfWeek)
        setShowDays(false)
        setCount(Math.max(...minChoices))
        //setListOfIngredient(selectedValuesWithCheckId)

        const selectFeedObj = {}
        const newUom = {}
        const newCutSize = {}
        let newRemarks = ''

        const newVisibility = selectedValuesWithCheckId?.flatMap(item =>
          item.ingredientList.map(ingredient => ({
            id: ingredient.ingredient_id.toString(),
            isVisible: true
          }))
        )

        selectedValuesWithCheckId.forEach((item, itemIndex) => {
          item.ingredientList.forEach(ingredient => {
            selectFeedObj[ingredient.ingredient_id] = {
              id: ingredient.preparation_type_id,
              name: ingredient.preparation_type
            }
            newUom[ingredient.ingredient_id] = {
              id: ingredient.master_cut_size_id,
              name: ingredient.master_cut_size
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
        setVisibility(newVisibility)
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
      setVisibility([])
    }
  }, [allIngredientchoiceSelectedValues, checkid, ingType === 'addingIndex', ingredientChoiceIndex, open])

  const removeSelectedCard = (event, itemId) => {
    // Check if the card with itemId is present in the selectedCard state
    const cardIndex = selectedCardIngchoice.findIndex(card => card.ingredient_id === itemId)

    if (cardIndex !== -1) {
      // If the card is found, remove it from the selectedCard state
      const updatedSelectedCard = [...selectedCardIngchoice]
      updatedSelectedCard.splice(cardIndex, 1)
      setSelectedCardIngredientchoice(updatedSelectedCard)

      setSelectFeed(prev => {
        const newFeed = { ...prev }
        delete newFeed[itemId]

        return newFeed
      })

      setSize(prev => {
        const newSize = { ...prev }
        delete newSize[itemId]

        return newSize
      })
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
      const allDayIds = Day.map(day => day.id)
      setSelectedDays(allDayIds)
    } else if (selectedDays.length === 7 && selectedDays.includes(0)) {
      setSelectedDays(selectedDays.filter(selectedDayId => selectedDayId !== day.id))
    } else if (selectedDays.length === 1 && selectedDays.includes(day.id)) {
      return
    } else if (day.id !== 0 && selectedDays.includes(0)) {
      setSelectedDays(selectedDays.filter(selectedDayId => selectedDayId !== day.id && selectedDayId !== 0))
    } else {
      const updatedSelection = selectedDays.includes(day.id)
        ? selectedDays.filter(selectedDayId => selectedDayId !== day.id)
        : [...selectedDays, day.id]

      setSelectedDays(updatedSelection)
    }
  }

  const [listOfIngredient, setListOfIngredient] = useState([])

  const handelSetIngredient = () => {
    setShowDays(false)
    setOpenIngredientchoice(false)

    if (ingType === 'addingIndex') {
      const existingIngredientIndex = allIngredientchoiceSelectedValues.findIndex((item, index) => {
        if (index === ingredientChoiceIndex && item.mealid === checkid) {
          if (item.ingredientList.length === 0) return true

          return item.ingredientList.some(ingredient =>
            selectedCardIngchoice.some(
              selectedIngredient => selectedIngredient.ingredient_id === ingredient.ingredient_id
            )
          )
        }

        return false
      })

      if (existingIngredientIndex !== -1) {
        const updatedListOfIngredient = [...allIngredientchoiceSelectedValues]

        // Update the ingredient at the specified index
        updatedListOfIngredient[existingIngredientIndex] = {
          ...updatedListOfIngredient[existingIngredientIndex],
          ingredientList: selectedCardIngchoice,
          days_of_week: selectedDays,
          no_of_component_required: count,
          remarks: remarks
        }

        const duplicateIngredientIndex = allIngredientchoiceSelectedValues.findIndex((item, index) => {
          return (
            index !== existingIngredientIndex &&
            item.mealid === checkid &&
            item.ingredientList.some(ingredient => {
              return selectedCardIngchoice.some(
                selectedIngredient =>
                  selectedIngredient.ingredient_id === ingredient.ingredient_id &&
                  selectedIngredient.preparation_type === ingredient.preparation_type
              )
            })
          )
        })

        if (duplicateIngredientIndex !== -1) {
          toast.error('Cannot update ingredient with the same preparation type in multiple places.')
          setingType('')

          return
        }

        setListOfIngredient(updatedListOfIngredient)
        onChange(updatedListOfIngredient)

        toast.success('Item updated successfully!')

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

      const duplicateIngredients = listOfIngredient
        .filter(item => item.mealid === checkid)
        .flatMap(item =>
          item.ingredientList.filter(existingIng =>
            selectedCardIngchoice.some(
              newIng =>
                newIng.ingredient_id === existingIng.ingredient_id &&
                newIng.preparation_type === existingIng.preparation_type
            )
          )
        )

      if (duplicateIngredients.length > 0) {
        // Check for overlapping days
        const hasDayOverlap = listOfIngredient.some(
          item =>
            item.mealid === checkid &&
            item.days_of_week.some(day => selectedDays.includes(day)) &&
            item.ingredientList.some(existingIng =>
              selectedCardIngchoice.some(
                newIng =>
                  newIng.ingredient_id === existingIng.ingredient_id &&
                  newIng.preparation_type === existingIng.preparation_type
              )
            )
        )

        if (hasDayOverlap) {
          const duplicateNames = duplicateIngredients
            .map(ing => ing.ingredient_name)
            .filter((name, index, self) => self.indexOf(name) === index)

          toast.error(
            `Ingredient ${duplicateNames.join(', ')} already exist's with same preparation type and days of the week`
          )

          return
        }
      }

      setListOfIngredient(prevList => {
        const updatedList = [...prevList, selectedIngredient]
        onChange(updatedList)

        return updatedList
      })
      setSearchValue('')
      setSelectedCardIngredientchoice([])
      setVisibility([])
      setSelectFeed({})
      toast.success('Item added successfully!')
    }
  }

  let sortedIngredientList = [...ingredientList]?.sort((a, b) => a.ingredient_name.localeCompare(b.ingredient_name))

  if (fromrow !== '' && fromrow === 'rowedit_ingredientwithchoice') {
    sortedIngredientList = sortedIngredientList.filter(
      item => ingredientwithChoiceId.includes(item.id) && ingredientwithChoiceName.includes(item.ingredient_name)
    )
  }

  const handleClose = () => {
    setShowDays(false)
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
          bgcolor: theme.palette.customColors.bodyBg,
          gap: '24px'
        }}
      >
        <Box sx={{ position: 'fixed', top: 0, bgcolor: theme.palette.customColors.bodyBg, zIndex: 10, width: '562px' }}>
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
              <img src='/icons/Activity.svg' alt='Grocery Icon' width='35px' />
              <Typography variant='h6' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
                Select Multiple Items
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size='small' onClick={handleSidebarClose} sx={{ color: theme.palette.primary.light }}>
                <Icon icon='mdi:close' fontSize={25} />
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
                slotProps={{
                  input: {
                    startAdornment: (
                      <Icon
                        style={{ marginRight: 10, color: theme.palette.customColors.OnSurfaceVariant }}
                        icon={'ion:search-outline'}
                      />
                    ),
                    endAdornment: searchValue && (
                      <IconButton onClick={handleCancelClick} size='small' sx={{ padding: 0 }}>
                        <Icon
                          icon={'ion:close-outline'}
                          style={{ color: theme.palette.customColors.OnSurfaceVariant }}
                        />
                      </IconButton>
                    )
                  }
                }}
                placeholder='Search item'
                onChange={handleSearchChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderColor: theme.palette.customColors.Outline,
                    '& fieldset': {
                      borderColor: theme.palette.customColors.Outline
                    }
                  }
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
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.customColors.Outline
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.customColors.Outline
                    },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '0px'
                    }
                  }}
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
          sx={{
            marginTop: 35,
            height: 'calc(100vh - 245px)',
            overflowY: 'auto',
            bgcolor: theme.palette.customColors.bodyBg
          }}
          onScroll={fromrow !== 'rowedit_ingredientwithchoice' ? handleScroll : undefined}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
              <CircularProgress />
            </Box>
          ) : sortedIngredientList?.length > 0 ? (
            sortedIngredientList?.map((item, index) => (
              <Box
                key={item?.id}
                sx={{
                  bgcolor: 'white',
                  mx: '24px',
                  borderRadius: '8px',
                  my: 4,
                  ...(selectedCardIngchoice.some(card => card.ingredient_id === item.id) && {
                    border: `2px solid ${theme.palette.primary.main}`
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
                    <Box
                      onClick={event => removeSelectedCard(event, item.id)}
                      sx={{
                        width: '68px',
                        height: '68px',
                        borderRadius: 1,
                        bgcolor: theme.palette.customColors.displaybgPrimary,
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
                    <Box
                      sx={{
                        width: '68px',
                        height: '68px',
                        borderRadius: 1,
                        bgcolor: theme.palette.customColors.displaybgPrimary,
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
                        alt='Ingredient Image'
                        sx={{
                          width: 40,
                          height: 40,
                          background: theme.palette.customColors.displaybgPrimary,
                          borderRadius: 20
                        }}
                        src={item?.image ? item?.image : '/icons/icon_diet_fill.png'}
                      ></Avatar>
                    </Box>
                  )}
                  <Box sx={{ pt: 3, paddingRight: 4, paddingBottom: 4, width: '100%' }}>
                    <Tooltip title={item?.ingredient_name?.length > 50 ? item?.ingredient_name : ''}>
                      <Typography
                        variant='h6'
                        sx={{ width: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {item?.ingredient_name}
                      </Typography>
                    </Tooltip>
                    <Stack
                      direction='row'
                      sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mt: 1 }}
                    >
                      <Typography>ING - {item?.id}</Typography>
                      <Typography
                        sx={{
                          mr: 3,
                          maxWidth: 180,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        noWrap
                      >
                        Feed Type -&nbsp;
                        <Tooltip title={item?.feed_type_label || ''}>
                          <span
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'inline-block',
                              maxWidth: '100%'
                            }}
                          >
                            {item?.feed_type_label}
                          </span>
                        </Tooltip>
                      </Typography>
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
                            error={
                              visibility?.find(visItem => visItem && visItem.id === item.id)?.isVisible &&
                              !selectFeed[item.id]?.id
                            }
                            sx={{
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.customColors.Outline
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.customColors.Outline
                              },
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '0px'
                              }
                            }}
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
                    {selectFeed[item.id]?.name !== '' ? (
                      <>
                        <Divider mt={-2} />
                        <Stack direction='row' sx={{ py: 4, px: 2, alignItems: 'center' }}>
                          <Typography>Enter cut size</Typography>

                          <Box sx={{ pl: 5 }}>
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
                                sx={{
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: theme.palette.customColors.Outline
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: theme.palette.customColors.Outline
                                  },
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: '0px'
                                  }
                                }}
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
                                  <MenuItem key={unit.id} value={unit.id}>
                                    {unit.cut_size}
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
              </Box>
            ))
          ) : sortedIngredientList?.length <= 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '70%',
                textAlign: 'center'
              }}
            >
              <img src='/images/no_data_animal_2.png' alt='Grocery Icon' width='250px' />
              <Box
                sx={{
                  color: theme.palette.customColors.statusText,
                  fontSize: '16px'
                }}
              >
                No records to show
              </Box>
            </Box>
          ) : null}
          {!loading && reachedEnd ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              <CircularProgress sx={{ mb: 10 }} />
            </Box>
          ) : null}
        </Box>

        <Box
          sx={{
            height: showDays ? '370px' : '100px',
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
                <IconButton size='small' onClick={handleClose} sx={{ color: 'text.primary' }}>
                  <Icon icon='mdi:close' fontSize={25} />
                </IconButton>
              </Stack>
              <Typography style={{ float: 'left', marginTop: '20px', fontWeight: 'bold' }}>
                Enter minimum choice
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
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
                <Typography variant='h5' align='center' sx={{ color: theme.palette.primary.main }}>
                  {count}
                </Typography>
                <IconButton onClick={handleIncrement}>
                  <Add />
                </IconButton>
              </Box>
              <Box sx={{ mt: 12, mb: 8 }}>
                <Typography sx={{ py: 4 }}>Feeding Days</Typography>

                <Stack
                  direction='row'
                  sx={{
                    gap: 3,
                    mb: 2
                  }}
                >
                  {Day?.map(day => (
                    <Box
                      key={day.id}
                      onClick={event => handleDayClick(day)}
                      sx={{
                        fontSize: 11,
                        fontWeight: 'bold',
                        bgcolor: selectedDays.includes(day.id) ? theme.palette.secondary.dark : '#dedede66',
                        borderRadius: 5,
                        p: 2,
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: selectedDays.includes(day.id) ? theme.palette.secondary.dark : '#dedede',
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
                      autoComplete='off'
                      slotProps={{
                        input: {
                          disableUnderline: true
                        }
                      }}
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
            <Button fullWidth variant='contained' size='large' sx={{ mb: 2 }} onClick={() => handleContinueClick()}>
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
