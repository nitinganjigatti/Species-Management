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
  InputAdornment,
  Tooltip
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import Divider from '@mui/material/Divider'
import ClearIcon from '@mui/icons-material/Clear'
import toast from 'react-hot-toast'
import { useTheme } from '@mui/material/styles'
import { getIngredientList } from 'src/lib/api/diet/getIngredients'

const AddIngredients = props => {
  const {
    open,
    handleSidebarClose: parentHandleSidebarClose,
    onChange,
    checkid,
    allSelectedValues,
    formData,
    setSelectedIngredient,
    setUomprevnew,
    uom,
    feedType,
    ingredientId,
    fromrow,
    ingredientName,
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

    const allDays = Array.from({ length: 8 }, (_, i) => ({
      dayId: i,
      dayName: Day.find(day => day.id === i)?.name
    }))

    setSelectedDays(prevSelectedDays => {
      const existingIndex = prevSelectedDays.findIndex(selectedItem => selectedItem && selectedItem.cardId === item.id)

      if (existingIndex === -1) {
        // If the item doesn't exist, add it with all days selected
        const newSelectedDays = [...prevSelectedDays, { cardId: item.id, days: allDays }]

        return newSelectedDays
      }

      return prevSelectedDays
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
      const params = { page: 1, limit: 20, q: searchValue, sort, feed_type: event.target.value, status: 1 }
      await getIngredientList({ params }).then(res => {
        if (res?.data?.result?.length > 0) {
          setIngredientList(res?.data?.result)
          setIngredientPage(1)
          setTotalCount(res?.data?.total_count)
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

    if (selectedFeedType.label) {
      setSelectedDays(prevSelectedDays => {
        const existingIndex = prevSelectedDays.findIndex(
          selectedItem => selectedItem && selectedItem.cardId === item.id
        )

        if (existingIndex === -1) {
          const allDays = Array.from({ length: 8 }, (_, i) => ({
            dayId: i,
            dayName: Day.find(day => day.id === i)?.name
          }))
          const newSelectedDays = [...prevSelectedDays, { cardId: item.id, days: allDays }]

          return newSelectedDays
        }

        return prevSelectedDays
      })

      setSelectedDays(currentSelectedDays => {
        // if (selectedFeedType.label !== 'Chopped') {
        handelCardSelection(event, item, selectedFeedType, null, null, currentSelectedDays)
        // }

        return currentSelectedDays
      })
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

  const handleAddRemarks = (event, item) => {
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
      .filter(item => item !== undefined)

    setSelectedDays(updatedSelectedDays)

    if (updatedSelectedDays.length > 0) {
      handelCardSelection(event, item, null, null, null, updatedSelectedDays)
    }
  }

  const [selectedCard, setSelectedCard] = useState([])

  useEffect(() => {
    const filteredSelectedCard = selectedCard.filter(card => card.mealid === checkid)
    setSelectedCard(filteredSelectedCard)
  }, [checkid])

  const handelCardSelection = (event, item, selectedFeedType, newCutSize, newUom, selectedDays, newRemarks) => {
    event.stopPropagation()

    const feed_type_id = selectedFeedType ? selectedFeedType.id : selectFeed[item.id]?.id || ''
    const feed_type = selectedFeedType ? selectedFeedType.label : selectFeed[item.id]?.name || ''
    const remarksData = newRemarks ? newRemarks : remarks[item.id]?.remarks || ''

    const selectedDaysForItem = selectedDays
      ?.filter(updatedDay => updatedDay.cardId === item.id)
      .flatMap(dayObj => dayObj.days.map(day => day.dayId))

    if (!feed_type) {
      // toast.error('Please select a feed type.')

      return
    }

    if (feed_type !== '') {
      const cutSizeValue = newCutSize ? newCutSize : cutSize[item.id]?.id || ''
      const sizeValue = newUom ? newUom?.id : size[item.id]?.id || ''

      if (!sizeValue) {
        return
      }
    }

    const boxValues = {
      ingredient_id: item.id,
      ingredient_name: item.ingredient_name,
      preparation_type_id: feed_type_id,
      preparation_type: feed_type,
      days_of_week: selectedDaysForItem,
      remarks: newRemarks ? newRemarks : remarksData,
      mealid: checkid,
      ingredient_image: item.image,
      //feed_cut_size: feed_type === 'Chopped' ? (newCutSize ? newCutSize : cutSize[item.id]?.id || '') : '',
      master_cut_size_id: feed_type !== '' ? (newUom ? newUom.id : size[item.id]?.id || '') : '',
      master_cut_size: feed_type !== '' ? (newUom ? newUom.cut_size : size[item.id]?.name || '') : ''
    }

    const existingIndex = selectedCard.findIndex(card => card.ingredient_id === item.id)

    if (existingIndex !== -1) {
      selectedCard[existingIndex] = boxValues
      setSelectedCard([...selectedCard])
    } else {
      setSelectedCard(prevValues => [...prevValues, boxValues])
    }
  }

  const handleAllSelect = event => {
    event?.stopPropagation()

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
    } else if (selectedCard?.length > 0) {
      debouncedSearch('')
      handleSidebarClose()
      setSelectedCard(selectedCard)
      setSearchValue('')
      onChange(selectedCard)
      setSelectedIngredient(selectedCard)

      return toast.success('Ingredient selected')
    }
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
    const uniqueSelectedValues = allSelectedValues?.filter(
      (value, index, self) =>
        index === self.findIndex(v => v?.ingredient_id === value?.ingredient_id && v?.mealid === value?.mealid)
    )

    const selectedValuesWithCheckId = uniqueSelectedValues?.filter(item => item?.mealid === checkid)

    const updatedSelectedCard =
      selectedValuesWithCheckId?.map(item => ({
        ...item,
        ingredient_id: String(item.ingredient_id)
      })) || []

    setSelectedCard(updatedSelectedCard)

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

    const newSelectFeed = {}
    const newRemarks = {}
    const newUom = {}
    const newCutSize = {}

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
        newRemarks[item.ingredient_id] = {
          remarks: item.remarks
        }
        newUom[item.ingredient_id] = {
          id: item.master_cut_size_id,
          name: item.master_cut_size
        }
        newCutSize[item.ingredient_id] = {
          id: item.feed_cut_size
        }
      }
    })
    setSelectFeed(newSelectFeed)
    setRemarks(newRemarks)
    setSize(newUom)
    setCutSize(newCutSize)

    setVisibility(newVisibility)
  }, [allSelectedValues, checkid, formData, open])

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

  const removeSelectedCard = (event, itemId) => {
    event.stopPropagation()

    // Check if the card with itemId is present in the selectedCard state
    const cardIndex = selectedCard.findIndex(card => card.ingredient_id === itemId)

    if (cardIndex !== -1) {
      const updatedSelectedCard = [...selectedCard]
      updatedSelectedCard.splice(cardIndex, 1)
      setSelectedCard(updatedSelectedCard)

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

  let sortedIngredientList = [...ingredientList]?.sort((a, b) => a.ingredient_name.localeCompare(b.ingredient_name))

  if (fromrow !== '' && fromrow === 'rowedit_ingredient') {
    sortedIngredientList = sortedIngredientList.filter(
      item => item.id === ingredientId && item.ingredient_name === ingredientName
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
                Add Items
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size='small' onClick={handleSidebarClose} sx={{ color: theme.palette.primary.light }}>
                <Icon icon='mdi:close' fontSize={25} />
              </IconButton>
            </Box>
          </Box>

          {fromrow !== 'rowedit_ingredient' ? (
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
          ) : (
            ''
          )}
        </Box>

        {/* Card View */}

        <Box
          key={feed}
          sx={{
            marginTop: fromrow === 'rowedit_ingredient' ? 0 : 35,
            paddingTop: fromrow !== 'rowedit_ingredient' ? 0 : 20,

            height: fromrow !== 'rowedit_ingredient' ? 'calc(100vh - 245px)' : '85%',
            overflowY: 'auto',
            bgcolor: theme.palette.customColors.bodyBg
          }}
          onScroll={fromrow !== 'rowedit_ingredient' ? handleScroll : undefined}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 30 }}>
              <CircularProgress />
            </Box>
          ) : sortedIngredientList?.length > 0 ? (
            sortedIngredientList?.map((item, index) => (
              <Box
                key={item?.id}
                sx={{
                  bgcolor: theme.palette.customColors.OnPrimary,
                  mx: '24px',
                  borderRadius: '8px',
                  my: 4,
                  width: '92%',
                  ...(selectedCard.some(card => card.ingredient_id === item.id) && {
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
                  {selectedCard.some(card => card.ingredient_id === item.id) ? (
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
                      >
                        {item?.image ? null : <Icon icon='healthicons:fruits-outline' />}
                      </Avatar>
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

                    <Divider />
                    <Box>
                      <Typography sx={{ py: 3, px: 2 }}>Feeding Days</Typography>

                      <Stack
                        direction='row'
                        sx={{
                          gap: 3,
                          mb: 2,
                          px: 2
                        }}
                      >
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
                                ? theme.palette.secondary.dark
                                : '#dedede66',
                              borderRadius: 5,
                              p: 2,
                              justifyContent: 'center',
                              alignItems: 'center',
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: selectedDays.some(
                                  selectedDay =>
                                    selectedDay.cardId === item.id &&
                                    selectedDay.days?.some(selectedDay => selectedDay.dayId === day.id)
                                )
                                  ? theme.palette.secondary.dark
                                  : '#dedede',
                                color: selectedDays.some(
                                  selectedDay =>
                                    selectedDay.cardId === item.id &&
                                    selectedDay.days?.some(selectedDay => selectedDay.dayId === day.id)
                                )
                                  ? 'white'
                                  : 'black'
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
                            // InputProps={{ disableUnderline: true }}
                            slotProps={{
                              input: {
                                disableUnderline: true
                              }
                            }}
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
            ))
          ) : searchValue !== '' && sortedIngredientList.length <= 0 ? (
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
            height: '100px',
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
          {fromrow === 'rowedit_ingredient' ? (
            <Button fullWidth variant='contained' size='large' onClick={() => handleAllSelect()}>
              ADD ITEM
            </Button>
          ) : (
            <Button fullWidth variant='contained' size='large' onClick={() => handleAllSelect()}>
              ADD ITEM - {selectedCard?.length} SELECTED
            </Button>
          )}
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
