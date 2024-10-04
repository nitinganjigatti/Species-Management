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

const RecipeCard = ({
  rows,
  setSelectedCardRecipe,
  selectedCardRecipe,
  checkid,
  onChange,
  handleSidebarClose,
  allRecipeSelectedValues,
  formData,
  addEventSidebarOpen
}) => {
  const [remarks, setRemarks] = useState({})
  console.log('remarks', remarks)

  const [selectedCount, setSelectedCount] = useState([])

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
    const initialSelectedDays = rows.map(row => ({
      cardId: row.id,
      days: Day
    }))

    setSelectedDays(initialSelectedDays)
  }, [rows])

  const [selectedDays, setSelectedDays] = useState()

  const [expandedIndex, setExpandedIndex] = useState([])

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

    // // Find the last selected day
    // let lastSelectedDayInfo = null;
    // for (let i = updatedDays.length - 1; i >= 0; i--) {
    //     const card = updatedDays[i];
    //     for (let j = card.days.length - 1; j >= 0; j--) {
    //         const day = card.days[j];
    //         if (day.isActive) {
    //             lastSelectedDayInfo = day;
    //             break;
    //         }
    //     }
    //     if (lastSelectedDayInfo) {
    //         break;
    //     }
    // }

    // // Log the last selected day to the console
  }

  const handleCardClick = item => {
    const index = selectedCardRecipe.findIndex(card => card.id === item.id)

    const selectedDaysForItem = Day.filter(day =>
      selectedDays.some(
        selectedDay =>
          selectedDay.cardId === item.id && selectedDay.days.some(selectedDay => selectedDay.dayId === day.id)
      )
    )

    const daysSelected = selectedDaysForItem.length > 0

    if (index !== -1) {
      setSelectedCardRecipe(prevValues => prevValues.filter(card => card.id !== item.id))
    } else {
      setSelectedCardRecipe(prevValues => {
        if (daysSelected) {
          setSelectedCount(selectedCardRecipe.length)
        }

        return [...prevValues, item]
      })
    }
  }

  const handleSelected = () => {
    handleSidebarClose()
    console.log(selectedCardRecipe, 'selectedCardRecipe')

    const filteredItems = selectedCardRecipe.map(item => {
      const selectedDaysForItem = selectedDays.find(selectedDay => selectedDay.cardId === item.id)

      const selectedDayNames = selectedDaysForItem?.days.filter(d => d.isActive).map(d => d.name) || []

      const selectedDayId = selectedDaysForItem?.days.filter(d => d.isActive).map(d => d.id) || []

      const cardRemarks = selectedCardRecipe.find(card => card.id === item.id)?.remarks || ''

      // Extract ingredient names from the ingredients array
      const ingredientNames = item?.ingredients?.map(ingredient => ingredient.ingredient_name)
      const quantity = item?.ingredients?.map(ingredient => ingredient.quantity)
      const quantityper = item?.ingredients?.map(ingredient => ingredient.quantity_type)

      return {
        recipe_name: item.recipe_name,
        recipe_id: item.id ? item.id : null,
        days_of_week: selectedDayId,
        remarks: cardRemarks,
        mealid: checkid,
        recipe_image: item.recipe_image,
        ingredients_count: item.ingredients_count,
        ingredient_name: ingredientNames,
        quantity: quantity,
        quantity_type: quantityper
      }
    })

    setSelectedCardRecipe(filteredItems)
    onChange(filteredItems)
  }

  const handleAddRemarks = (event, cardId) => {
    const updatedCards = selectedCardRecipe.map(item => {
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

    setSelectedCardRecipe(updatedCards)
  }

  useEffect(() => {
    // Filter out duplicates based on id and mealid

    const uniqueSelectedValues = allRecipeSelectedValues?.filter(
      (value, index, self) =>
        index === self.findIndex(v => v?.recipe_id === value?.recipe_id && v?.mealid === value?.mealid)
    )

    // Compare uniqueSelectedValues with checkid
    const selectedValuesWithCheckId = uniqueSelectedValues?.filter(item => item?.mealid === checkid)

    // Initialize a new array to store the updated selectedCardRecipe
    let updatedSelectedCardRecipe = []

    // Iterate over rows and check for matches
    rows.forEach(row => {
      const match = selectedValuesWithCheckId?.find(item => String(item.recipe_id) === row.id)
      if (match) {
        // Construct a new object with keys from the row object and values from the match object
        const updatedRow = {}
        for (const key in row) {
          updatedRow[key] = match[key] !== undefined ? match[key] : row[key]
        }

        // Add the updated row object to updatedSelectedCardRecipe
        updatedSelectedCardRecipe.push(updatedRow)
      }
    })

    // Update selectedCardRecipe with matched objects
    const updatedSelectedCard =
      selectedValuesWithCheckId?.map(item => ({
        ...item,
        id: String(item.recipe_id) // Convert ingredient_id to string
      })) || []
    setSelectedCardRecipe(updatedSelectedCard)

    // Extract cardId values and selectedDays arrays from selectedValuesWithCheckId
    if (
      allRecipeSelectedValues &&
      allRecipeSelectedValues.length > 0 &&
      allRecipeSelectedValues.some(item => item?.mealid === checkid)
    ) {
      const cardIds = selectedValuesWithCheckId.map(item => item.recipe_id)
      const days = selectedValuesWithCheckId.map(item => item.days_of_week)
      const newRemarks = {}

      // Update selectedDays state with the extracted values
      console.log('selectedValuesWithCheckId :>> ', selectedValuesWithCheckId)
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

      // Merge updatedSelectedDays with rows
      const finalSelectedDays = rows.map(row => {
        const updatedDay = updatedSelectedDays.find(updated => updated.cardId === row.id)
        console.log('updatedDay :>> ', updatedDay)
        if (updatedDay) {
          return updatedDay
        } else {
          return {
            cardId: row.id,
            days: Day
          }
        }
      })
      setSelectedDays(finalSelectedDays)

      selectedValuesWithCheckId?.forEach(item => {
        console.log('item for remarks ', item)
        if (item.mealid === checkid) {
          newRemarks[item.recipe_id] = item.remarks
        }
      })

      setRemarks(newRemarks)

      // setRemarks({
      //   ...remarks,
      //   [cardIds]: event.target.value
      // })
    } else {
      const initialSelectedDays = rows.map(row => ({
        cardId: row.id,
        days: Day
      }))

      setSelectedDays(initialSelectedDays)
      setRemarks({})
    }
  }, [allRecipeSelectedValues, checkid, formData, rows, addEventSidebarOpen])

  const sortedRecipeList = [...rows]?.sort((a, b) => a.recipe_name.localeCompare(b.recipe_name))

  const calculateTotalQuantity = ingredients => {
    return ingredients.reduce((total, ingredient) => {
      return total + parseFloat(ingredient.quantity)
    }, 0)
  }

  return (
    <Box>
      {/* Example Card */}
      {sortedRecipeList?.map((item, index) => {
        // const getQuantity = item?.by_percentage

        return (
          <>
            <Box
              sx={{
                bgcolor: 'background.paper',
                border: selectedCardRecipe?.some(card => card.id === item.id) ? '2px solid #37BD69' : '#fff',
                boxShadow: 1,
                mt: 4,

                // borderRadius: '12px',
                cursor: 'pointer'
              }}
            >
              <Box
                sx={{ display: 'flex', m: 1, cursor: 'pointer', padding: '16px' }}
                onClick={() => {
                  handleCardClick(item, index)
                }}
              >
                <Box
                  sx={{
                    width: '68px',
                    height: '68px',
                    color: '#fff',
                    position: 'relative',
                    top: '2px',

                    bgcolor: selectedCardRecipe?.some(card => card.id === item.id) ? '#37BD69' : '#E8F4F2',
                    borderRadius: '10.88px'
                  }}
                >
                  {selectedCardRecipe?.some(card => card.id === item.id) ? (
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
                      src={item?.recipe_image ? item?.recipe_image : '/icons/icon_diet_fill.png'}
                    ></Avatar>
                  )}
                </Box>
                <Box sx={{ width: '333px' }}>
                  <Box sx={{ width: '333px', height: '45px', gap: 4 }}>
                    <Typography sx={{ ml: 4, fontSize: '20px', color: '#44544A', width: '178px', height: '24px' }}>
                      {item.recipe_name}
                    </Typography>
                    <Typography variant='body' sx={{ ml: 4, fontSize: '14px', width: '79px', height: '17px', mt: 3 }}>
                      {item?.recipe_no ? item?.recipe_no : 'RCP- 000'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '333px', height: '33px' }}>
                    <Divider sx={{ borderLeft: '1px solid #D9D9D9', height: 30, ml: 4, mt: 3 }}></Divider>
                    <Box sx={{ ml: '10px' }}>
                      <Typography sx={{ mt: 2, fontSize: '12px', fontWeight: 'bold', color: '#000' }}>
                        {item?.ingredients_count}&nbsp;
                        <span style={{ color: '#e55b3e' }}> ({calculateTotalQuantity(item?.by_percentage)}%)</span>
                      </Typography>
                      <Typography sx={{ fontSize: '10px', width: '100px' }}>Ingredients by %</Typography>
                    </Box>
                    <Divider sx={{ borderLeft: '1px solid #D9D9D9', height: 30, mr: 2, mt: 3 }}></Divider>
                    <Box>
                      <Typography sx={{ mt: 2, fontSize: '12px', color: '#000', fontWeight: 'bold' }}>
                        {' '}
                        {item?.by_quantity?.length} nos
                      </Typography>
                      <Typography sx={{ fontSize: '10px', width: '100px' }}>Ingredients by qty</Typography>
                    </Box>
                    <Divider sx={{ borderLeft: '1px solid #D9D9D9', height: 30, mr: 2, mt: 3 }}></Divider>
                    <Box>
                      <Typography sx={{ mt: 2, fontSize: '12px', color: '#000', fontWeight: 'bold' }}>
                        {' '}
                        {item?.total_kcal ? item?.total_kcal : 0}
                      </Typography>
                      <Typography sx={{ fontSize: '10px', width: '100px' }}>Calories by 100g</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
              {selectedCardRecipe?.some(card => card.id === item.id) ? (
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
                          bgcolor: selectedDays.find(
                            selectedDay =>
                              selectedDay.cardId === item.id &&
                              selectedDay.days.find(d => d.id === day.id && d.isActive)
                          )
                            ? '#203e56'
                            : '#dedede',
                          borderRadius: 5,
                          p: 2,
                          justifyContent: 'center',
                          alignItems: 'center',
                          cursor: 'pointer',

                          color: selectedDays.find(
                            selectedDay =>
                              selectedDay.cardId === item.id &&
                              selectedDay.days.find(d => d.id === day.id && d.isActive)
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
                      rows={expandedIndex.includes(index) ? 3 : 1}
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
                        maxHeight: expandedIndex.includes(index) ? '100px' : '56px'
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
      })}
      {/* {selectedCardRecipe?.length > 0 && ( */}
      <Box
        sx={{
          height: '122px',
          ml: -4,

          width: '100%',

          maxWidth: '562px',
          position: 'fixed',
          bottom: 0,

          px: 4,
          bgcolor: 'white',
          alignItems: 'center',
          justifyContent: 'center',
          display: 'flex'

          // bgcolor: 'yellow'
        }}
      >
        <Button fullWidth size='large' variant='contained' onClick={handleSelected}>
          ADD RECIPE - {selectedCardRecipe?.length} SELECTED
        </Button>
      </Box>
      {/* )} */}
    </Box>
  )
}

export default RecipeCard
