import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import Divider from '@mui/material/Divider'
import Avatar from 'src/@core/components/mui/avatar'
import Button from '@mui/material/Button'
import DoneIcon from '@mui/icons-material/Done'
import { useEffect, useState } from 'react'
import { Stack } from '@mui/system'
import toast from 'react-hot-toast'
import { Tooltip, Select, MenuItem, CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import SizeSelector from 'src/components/SelectCutsize'
import Utility from 'src/utility'

const ComboCard = ({
  rows,
  setSelectedCardCombo,
  selectedCardCombo,
  checkid,
  onChange,
  handleSidebarClose,
  allComboSelectedValues,
  formData,
  addEventSidebarOpen,
  searchValue,
  setSearchValue,
  fromrow,
  comboid,
  comboName,
  cutsizelist,
  dietid,
  loading
}) => {
  const theme = useTheme()
  const [remarks, setRemarks] = useState({})
  const [selectedCount, setSelectedCount] = useState([])
  const [selectedDays, setSelectedDays] = useState()

  const [expandedIndex, setExpandedIndex] = useState([])
  const [size, setSize] = useState({})
  const [showErrors, setShowErrors] = useState(false)

  const Day = [
    { id: 0, name: 'All', isActive: true },
    { id: 1, name: 'Mon', isActive: true },
    { id: 2, name: 'Tue', isActive: true },
    { id: 3, name: 'Wed', isActive: true },
    { id: 4, name: 'Thu', isActive: true },
    { id: 5, name: 'Fri', isActive: true },
    { id: 6, name: 'Sat', isActive: true },
    { id: 7, name: 'Sun', isActive: true }
  ]

  useEffect(() => {
    const uniqueSelectedValues = allComboSelectedValues?.filter(
      (value, index, self) =>
        index === self.findIndex(v => v?.recipe_id === value?.recipe_id && v?.mealid === value?.mealid)
    )

    const selectedValuesWithCheckId = uniqueSelectedValues?.filter(item => item?.mealid === checkid)

    let updatedselectedCardCombo = []

    rows.forEach(row => {
      const match = selectedValuesWithCheckId?.find(item => String(item.recipe_id) === row.id)
      if (match) {
        const updatedRow = {}
        for (const key in row) {
          updatedRow[key] = match[key] !== undefined ? match[key] : row[key]
        }

        updatedselectedCardCombo.push(updatedRow)
      }
    })

    const currentselectedCardCombo = selectedCardCombo || []

    const updatedSelectedCard = [
      ...currentselectedCardCombo,
      ...selectedValuesWithCheckId
        .map(item => ({
          ...item,
          id: String(item.recipe_id)
        }))
        .filter(item => !currentselectedCardCombo.some(existingItem => existingItem.recipe_id === item.recipe_id))
    ]
    if (!searchValue) {
      setSelectedCardCombo(updatedSelectedCard)
    }

    if (selectedValuesWithCheckId?.length) {
      const updatedSize = { ...size }

      selectedValuesWithCheckId.forEach(combo => {
        if (combo.mealid === checkid) {
          const ingredientCutSizes = {}
          combo?.combo_ingredients?.forEach(ingredient => {
            if (ingredient.ingredient_id && ingredient.ingredient_cut_size_id) {
              ingredientCutSizes[ingredient.ingredient_id] = { id: ingredient.ingredient_cut_size_id }
            }
          })
          updatedSize[combo.recipe_id] = ingredientCutSizes
        }
      })

      setSize(updatedSize)
    }

    const previousSelectedDays = selectedDays || []
    if (
      allComboSelectedValues &&
      allComboSelectedValues?.length > 0 &&
      allComboSelectedValues.some(item => item?.mealid === checkid) &&
      !dietid
    ) {
      const updatedRemarks = { ...remarks }

      const updatedSelectedDays = rows.map(row => {
        const selectedItem = selectedValuesWithCheckId.find(item => item.recipe_id === row.id)

        if (selectedItem) {
          return {
            cardId: row.id,
            days: Day.map(day => ({
              id: day.id,
              name: day.name,
              isActive: selectedItem.days_of_week?.includes(day.id) || false
            }))
          }
        } else {
          return {
            cardId: row.id,
            days: Day.map(day => ({
              id: day.id,
              name: day.name,
              isActive: true
            }))
          }
        }
      })

      setSelectedDays(updatedSelectedDays)

      selectedValuesWithCheckId?.forEach(item => {
        if (item.mealid === checkid) {
          updatedRemarks[item.recipe_id] = item.remarks || ''
        }
      })

      setRemarks(updatedRemarks)
    } else if (
      allComboSelectedValues &&
      allComboSelectedValues?.length > 0 &&
      allComboSelectedValues.some(item => item?.mealid === checkid)
    ) {
      const cardIds = selectedValuesWithCheckId.map(item => item.recipe_id)
      const days = selectedValuesWithCheckId.map(item => item.days_of_week)
      const updatedRemarks = { ...remarks }

      const updatedSelectedDays = []
      cardIds.forEach((cardId, index) => {
        updatedSelectedDays.push({
          cardId: cardId,
          days: Day.map(day => ({
            id: day.id,
            name: day.name,
            isActive: days[index]?.includes(day.id) ? true : false
          }))
        })
      })

      const finalSelectedDays = rows.map(row => {
        const updatedDay = updatedSelectedDays?.find(updated => updated.cardId === row.id)

        if (updatedDay) {
          return updatedDay
        } else {
          const existingDay = selectedDays?.find(existing => existing.cardId === row.id)

          return existingDay || { cardId: row.id, days: Day }
        }
      })

      setSelectedDays(finalSelectedDays)

      selectedValuesWithCheckId?.forEach(item => {
        if (item.mealid === checkid) {
          updatedRemarks[item.recipe_id] = item.remarks || ''
        }
      })

      setRemarks(updatedRemarks)
    } else if (
      allComboSelectedValues &&
      allComboSelectedValues?.length > 0 &&
      allComboSelectedValues.some(item => item?.mealid !== checkid) &&
      searchValue
    ) {
      const finalSelectedDays = rows.map(row => {
        const previousDay = previousSelectedDays?.find(prev => prev.cardId === row.id)

        const enabledAllDays = Day.map(day => ({
          id: day.id,
          name: day.name,
          isActive: true
        }))

        return previousDay ? previousDay : { cardId: row.id, days: enabledAllDays }
      })
      setSelectedDays(finalSelectedDays)
      setRemarks({})
    } else if (
      !searchValue &&
      allComboSelectedValues &&
      allComboSelectedValues?.length > 0 &&
      allComboSelectedValues.some(item => item?.mealid === checkid) &&
      selectedCardCombo?.length > 0
    ) {
      const previousSelectedDays = selectedDays || []

      const initialSelectedDays = rows.map(row => ({
        cardId: row.id,
        days: Day
      }))

      setSelectedDays(initialSelectedDays)
      setRemarks({})
    } else if (selectedCardCombo?.length > 0 && allComboSelectedValues && allComboSelectedValues?.length <= 0) {
      const previousSelectedDays = selectedDays || []

      const updatedSelectedDays = rows.map(row => {
        const previousDay = previousSelectedDays?.find(prev => prev.cardId === row.id)

        if (previousDay) {
          return previousDay
        } else {
          return {
            cardId: row.id,
            days: Day.map(day => ({
              id: day.id,
              name: day.name,
              isActive: true
            }))
          }
        }
      })

      setSelectedDays(updatedSelectedDays)
    } else if (searchValue !== '' && !dietid) {
      const previousSelectedDays = selectedDays || []

      const updatedSelectedDays = rows.map(row => {
        const previousDay = previousSelectedDays?.find(prev => prev.cardId === row.id)

        if (previousDay) {
          return previousDay
        } else {
          return {
            cardId: row.id,
            days: Day.map(day => ({
              id: day.id,
              name: day.name,
              isActive: true
            }))
          }
        }
      })

      setSelectedDays(updatedSelectedDays)
      setRemarks({})
    } else if (!searchValue && selectedCardCombo.length <= 0) {
      const previousSelectedDays = selectedDays || []

      const initialSelectedDays = rows.map(row => ({
        cardId: row.id,
        days: Day
      }))
      setSelectedDays(initialSelectedDays)
      setRemarks({})
      setSize({})
    }
  }, [allComboSelectedValues, checkid, formData, rows, addEventSidebarOpen, searchValue])

  const handleSelectedDays = (dayId, dayName, cardId) => {
    let updatedDays = selectedDays.map(card => {
      if (card.cardId !== cardId) {
        return card
      }

      let lastSelectedDayId = null

      const updatedCard = {
        ...card,
        days: card.days.map(day => {
          if (dayId === 0) {
            return {
              ...day,
              isActive: true
            }
          } else if (day.id === dayId) {
            lastSelectedDayId = dayId

            return {
              ...day,
              isActive: !day.isActive
            }
          } else {
            return {
              ...day,
              isActive: day.isActive
            }
          }
        })
      }

      if (dayId === 0) {
        updatedCard.days = updatedCard.days.map((day, index) => ({
          ...day,
          isActive: index !== 0
        }))
      }

      const anyDayUnselected = updatedCard.days.slice(1).some(day => !day.isActive)
      updatedCard.days[0].isActive = !anyDayUnselected

      const allOtherDaysInactive = updatedCard.days.slice(1).every(day => !day.isActive)
      if (lastSelectedDayId && allOtherDaysInactive) {
        updatedCard.days = updatedCard.days.map(day => ({
          ...day,
          isActive: day.id === lastSelectedDayId
        }))
      }

      return updatedCard
    })

    setSelectedDays(updatedDays)
  }

  const handleCardClick = item => {
    const index = selectedCardCombo.findIndex(card => card.id === item.id)

    const selectedDaysForItem = Day.filter(day =>
      selectedDays.some(
        selectedDay =>
          selectedDay.cardId === item.id && selectedDay.days.some(selectedDay => selectedDay.dayId === day.id)
      )
    )

    const daysSelected = selectedDaysForItem.length > 0

    if (index !== -1) {
      setSelectedCardCombo(prevValues => prevValues.filter(card => card.id !== item.id))
    } else {
      setSelectedCardCombo(prevValues => {
        if (daysSelected) {
          setSelectedCount(selectedCardCombo.length)
        }

        return [...prevValues, item]
      })
    }
  }

  const handleSelected = () => {
    if (selectedCardCombo.length === 0) {
      toast.error('Mix(s) are required.', {
        duration: 1000
      })

      return
    }

    const cardsWithMissingCutSize = selectedCardCombo.filter(item =>
      item.ingredients.some(ingredient => !size[item.id]?.[ingredient.ingredient_id]?.id)
    )

    if (cardsWithMissingCutSize.length > 0) {
      toast.error('Please select a cut size for all ingredients in the selected mix(s).', {
        duration: 1000
      })
      setShowErrors(true)

      return
    }
    setShowErrors(false)

    const filteredItems = selectedCardCombo.map(item => {
      const selectedDaysForItem = selectedDays?.find(selectedDay => selectedDay.cardId === item.id)

      const selectedDayNames = selectedDaysForItem?.days.filter(d => d.isActive).map(d => d.name) || []
      const selectedDayId = selectedDaysForItem?.days.filter(d => d.isActive).map(d => d.id) || []

      const cardRemarks = selectedCardCombo?.find(card => card.id === item.id)?.remarks || ''

      const ingredientNames = item?.ingredients?.map(ingredient => ingredient.ingredient_name)
      const quantity = item?.ingredients?.map(ingredient => ingredient.quantity)
      const quantityper = item?.ingredients?.map(ingredient => ingredient.quantity_type)

      const comboIngredients = item.ingredients.map(ingredient => ({
        ingredient_id: ingredient.ingredient_id,
        ingredient_cut_size_id: size[item.id]?.[ingredient.ingredient_id]?.id || null
      }))

      const existingCard = selectedCardCombo?.find(card => card.id === item.id)

      const preservedDaysOfWeek = selectedDayId?.length ? selectedDayId : existingCard?.days_of_week || []

      const updatedIngredients = item.ingredients.map(ingredient => {
        const cutSizeId = size[item.id]?.[ingredient.ingredient_id]?.id || null
        const cutSize = cutsizelist?.find(cs => cs.id === cutSizeId)?.cut_size || null

        return {
          ...ingredient,
          cut_size_id: cutSizeId,
          cut_size: cutSize
        }
      })

      return {
        recipe_name: item.recipe_name,
        recipe_id: item.id ? item.id : null,
        days_of_week: preservedDaysOfWeek,
        remarks: cardRemarks,
        mealid: checkid,
        recipe_image: item.recipe_image,
        ingredients_count: item.ingredients_count,
        ingredient_name: ingredientNames,
        quantity: quantity,
        quantity_type: quantityper,
        ingredients: updatedIngredients,
        desc: item.desc,
        combo_ingredients: comboIngredients
      }
    })

    setSelectedCardCombo(filteredItems)

    onChange(filteredItems)

    handleSidebarClose()
    setSearchValue('')
  }

  const handleAddRemarks = (event, cardId) => {
    const updatedCards = selectedCardCombo.map(item => {
      if (item.id === cardId) {
        return {
          ...item,
          remarks: event.target.value
        }
      }

      return item
    })

    if (!updatedCards.find(item => item.id === cardId)) {
      updatedCards.push({
        id: cardId,
        remarks: event.target.value
      })
    }

    setRemarks({
      ...remarks,
      [cardId]: event.target.value
    })

    setSelectedCardCombo(updatedCards)
  }

  const filteredRecipeList = rows.filter(item => item.recipe_name.toLowerCase().includes(searchValue.toLowerCase()))

  //let sortedRecipeList = [...filteredRecipeList].sort((a, b) => a.recipe_name.localeCompare(b.recipe_name))
  let sortedRecipeList = [...filteredRecipeList]

  // Filter sortedRecipeList based on remarks and fromrow condition
  if (fromrow !== '' && fromrow === 'rowedit_combo') {
    sortedRecipeList = sortedRecipeList.filter(item => item.id === comboid && item.recipe_name === comboName)
  }

  const handleChangeSize = (event, item, ingredient) => {
    event.stopPropagation()
    const { value } = event.target

    const newCutSize = cutsizelist.find(type => Number(type.id) === Number(value))

    setSize(prevState => ({
      ...prevState,
      [item.id]: {
        ...prevState[item.id],
        [ingredient.ingredient_id]: {
          id: value,
          name: newCutSize?.cut_size
        }
      }
    }))
  }

  const calculateTotalQuantity = ingredients => {
    const total = ingredients.reduce((total, ingredient) => {
      return total + parseFloat(ingredient.quantity)
    }, 0)

    return Math.round(total)
  }

  return (
    <Box sx={{ pb: '100px' }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
          <CircularProgress />
        </Box>
      ) : sortedRecipeList?.length > 0 ? (
        sortedRecipeList?.map((item, index) => {
          return (
            <>
              <Box
                sx={{
                  bgcolor: 'background.paper',
                  border: selectedCardCombo?.some(card => card?.id === item?.id)
                    ? `2px solid ${theme.palette.primary.main}`
                    : theme.palette.customColors.OnPrimary,
                  boxShadow: 0,
                  mt: 4,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  mb: fromrow === 'rowedit_combo' ? '40px' : '0px'
                }}
              >
                <Box
                  sx={{ display: 'flex', m: 1, cursor: 'pointer', padding: '16px', pb: '4px', pt: '10px' }}
                  onClick={() => {
                    handleCardClick(item, index)
                  }}
                >
                  <Box
                    sx={{
                      width: '68px',
                      height: '68px',
                      color: theme.palette.customColors.OnPrimary,
                      position: 'relative',
                      top: '2px',

                      bgcolor: selectedCardCombo?.some(card => card?.id === item?.id)
                        ? theme.palette.primary.main
                        : theme.palette.customColors.tableHeaderBg,
                      borderRadius: '10.88px'
                    }}
                  >
                    {selectedCardCombo?.some(card => card?.id === item?.id) ? (
                      <>
                        <Box sx={{ width: '48px', height: '48px', position: 'relative', top: '10px', left: '10px' }}>
                          <DoneIcon
                            sx={{
                              width: '38.71px',
                              height: '39.69px',
                              position: 'relative',
                              top: '5.6px',
                              left: '5.13px'
                            }}
                          />
                        </Box>
                      </>
                    ) : (
                      <Avatar
                        variant='round'
                        alt='Ingredient Image'
                        sx={{
                          width: '54.4px',
                          height: '54.4px',
                          position: 'relative',
                          top: '6.8px',
                          left: '6.8px'
                        }}
                        src={item?.recipe_image ? item?.recipe_image : '/icons/icon_recipe_fill.png'}
                      ></Avatar>
                    )}
                  </Box>
                  <Box sx={{ width: '333px' }}>
                    <Box sx={{ width: '333px', height: '45px', gap: 4 }}>
                      <Tooltip title={item?.recipe_name?.length > 50 ? item?.recipe_name : ''}>
                        <Typography
                          sx={{
                            ml: 4,
                            fontSize: '20px',
                            color: theme.palette.customColors.OnSurfaceVariant,
                            width: '400px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item?.recipe_name}
                        </Typography>
                      </Tooltip>
                      <Typography
                        variant='body'
                        sx={{ ml: 4, fontSize: '14px', width: '79px', mt: 0, mb: 0, float: 'left' }}
                      >
                        {item?.recipe_no ? item?.recipe_no : 'MIX- 000'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '333px', height: '45px' }}>
                      <Box sx={{ ml: '10px', ml: 4 }}>
                        <Typography
                          sx={{
                            mt: 2,
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: theme.palette.customColors.neutralPrimary
                          }}
                        >
                          {item?.ingredients_count}&nbsp;
                          <span style={{ color: '#e55b3e' }}> ({calculateTotalQuantity(item?.by_percentage)}%)</span>
                        </Typography>
                        <Typography sx={{ fontSize: '10px', width: '100px' }}>Items by %</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
                <Divider />

                {selectedCardCombo?.some(card => card?.id === item?.id) ? (
                  <Box sx={{ pl: 5, pr: 5, mt: 3, mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0 }}>
                      <Typography
                        sx={{ fontWeight: '500', color: theme.palette.customColors.neutral_50, fontSize: '16px' }}
                      >
                        Items
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: '500',
                          color: theme.palette.customColors.neutral_50,
                          fontSize: '16px',
                          mr: 20
                        }}
                      >
                        Cut size
                      </Typography>
                    </Box>
                    {item.ingredients.map((ingredient, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          pb: 2,
                          pt: 1
                        }}
                      >
                        <Avatar
                          variant='square'
                          alt={ingredient.ingredient_name}
                          sx={{
                            width: 45,
                            height: 50,
                            mr: 4,
                            background: theme.palette.customColors.tableHeaderBg,
                            padding: '8px',
                            borderRadius: '4px'
                          }}
                        >
                          <img
                            src={ingredient?.ingredient_image || '/icons/icon_ingredient_fill.png'}
                            alt={ingredient.ingredient_name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            // onError={e => {
                            //   e.target.src = '/icons/icon_ingredient.svg' // Fallback to default icon
                            // }}
                          />
                        </Avatar>

                        <Box sx={{ flex: 1 }}>
                          <Tooltip
                            title={`${ingredient.ingredient_name} ${ingredient.quantity} ${
                              ingredient.quantity_type === 'percentage' ? '%' : ''
                            }`}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                width: '250px',
                                overflow: 'hidden'
                              }}
                            >
                              <Typography
                                variant='body1'
                                sx={{
                                  fontWeight: '600',
                                  color: theme.palette.customColors.OnSurfaceVariant,
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden',
                                  whiteSpace: 'nowrap',
                                  flexShrink: 1
                                }}
                              >
                                {ingredient.ingredient_name}
                              </Typography>
                              <Typography
                                variant='body1'
                                sx={{
                                  fontWeight: '600',
                                  color: theme.palette.customColors.OnSurfaceVariant,
                                  marginLeft: 1,
                                  flexShrink: 0
                                }}
                              >
                                {Utility.formatNumber(ingredient.quantity)}
                                {ingredient.quantity_type === 'percentage' ? '%' : ''}
                              </Typography>
                            </Box>
                          </Tooltip>

                          <Typography variant='body2' color={theme.palette.customColors.OnSurfaceVariant}>
                            Id - {'ING' + ingredient.id}
                          </Typography>

                          <Typography variant='body2' color={theme.palette.customColors.secondaryBg}>
                            {ingredient.preparation_type}
                          </Typography>
                        </Box>

                        <SizeSelector
                          size={size}
                          cutsizelist={cutsizelist}
                          item={item}
                          ingredient={ingredient}
                          handleChangeSize={handleChangeSize}
                          showErrors={showErrors}
                        />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  ''
                )}
                {selectedCardCombo?.some(card => card?.id === item?.id) ? (
                  <>
                    <Divider />
                    <Typography sx={{ py: 3, px: 2, ml: 3 }}>Feeding Days</Typography>
                    <Stack direction='row' gap={3} mb={2} sx={{ px: 2, ml: 4 }}>
                      {Day?.map(day => (
                        <Box
                          key={day.id}
                          onClick={() => handleSelectedDays(day.id, day.name, item.id)}
                          sx={{
                            fontSize: 11,
                            fontWeight: 'bold',
                            bgcolor: selectedDays?.find(
                              selectedDay =>
                                selectedDay.cardId === item.id &&
                                selectedDay.days?.find(d => d.id === day.id && d.isActive)
                            )
                              ? '#203e56'
                              : '#dedede',
                            borderRadius: 5,
                            p: 2,
                            justifyContent: 'center',
                            alignItems: 'center',
                            cursor: 'pointer',

                            color: selectedDays?.find(
                              selectedDay =>
                                selectedDay.cardId === item.id &&
                                selectedDay.days?.find(d => d.id === day.id && d.isActive)
                            )
                              ? 'white'
                              : 'black'
                          }}
                        >
                          {day.name}
                        </Box>
                      ))}
                    </Stack>

                    <Box sx={{ mt: 5 }}>
                      <Divider />
                      <TextField
                        multiline
                        rows={expandedIndex.includes(index) ? 2 : 2}
                        onChange={e => handleAddRemarks(e, item.id)}
                        placeholder={expandedIndex.includes(index) ? 'Remarks' : 'Add remarks (optional)'}
                        value={remarks[item.id] || ''}
                        variant='outlined'
                        fullWidth
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              border: 'none'
                            }
                          },
                          transition: 'max-height 0.5s ease-in-out',
                          overflow: 'hidden',
                          maxHeight: expandedIndex.includes(index) ? '100px' : '70px',
                          pl: 4,
                          pt: 3
                        }}
                      />
                    </Box>
                  </>
                ) : (
                  ''
                )}
              </Box>
            </>
          )
        })
      ) : (
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
      )}

      <Box
        sx={{
          height: { xs: '80px', sm: '90px', md: '100px' },
          width: '100%',
          maxWidth: '562px',
          position: 'fixed',
          bottom: 0,
          right: 0,
          px: 4,
          bgcolor: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: 'env(safe-area-inset-bottom)',
          zIndex: 9999
        }}
      >
        {fromrow === 'rowedit_combo' ? (
          <Button fullWidth size='large' variant='contained' onClick={handleSelected}>
            ADD MIX
          </Button>
        ) : (
          <Button fullWidth size='large' variant='contained' onClick={handleSelected}>
            ADD MIX - {selectedCardCombo?.length} SELECTED
          </Button>
        )}
      </Box>
      {/* )} */}
    </Box>
  )
}

export default ComboCard
