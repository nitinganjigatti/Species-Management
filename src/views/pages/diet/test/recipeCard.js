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
  const [remarks, setRemarks] = useState('')
  const [selectedCount, setSelectedCount] = useState([])

  const Day = [
    { id: 0, name: 'All', isActive: true },
    { id: 1, name: 'Mon', isActive: true },
    { id: 2, name: 'Tue', isActive: true },
    { id: 3, name: 'Wed', isActive: true },
    { id: 4, name: 'Thrs', isActive: true },
    { id: 5, name: 'Fri', isActive: true },
    { id: 6, name: 'Sat', isActive: true },
    { id: 7, name: 'Sun', isActive: true }
  ]

  useEffect(() => {
    const initialSelectedDays = rows.map(row => ({
      cardId: row.id,
      days: Day
    }))

    console.log('Initial Values>>', initialSelectedDays)
    setSelectedDays(initialSelectedDays)
  }, [rows])

  const [selectedDays, setSelectedDays] = useState()
  console.log('selectedDays', selectedDays, remarks)

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
    // console.log('Last selected day:', lastSelectedDayInfo);
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

  console.log('selectedCount >>', selectedCount)

  const handleSelected = () => {
    console.log('Selected Data', selectedCardRecipe)
    handleSidebarClose()
    const filteredItems = selectedCardRecipe.map(item => {
      const selectedDaysForItem = selectedDays.find(selectedDay => selectedDay.cardId === item.id)
      console.log(selectedDaysForItem, 'selectedDaysForItem')
      const selectedDayNames = selectedDaysForItem?.days.filter(d => d.isActive).map(d => d.name) || []

      const selectedDayId = selectedDaysForItem?.days.filter(d => d.isActive).map(d => d.id) || []

      const cardRemarks = selectedCardRecipe.find(card => card.id === item.id)?.remarks || ''

      return {
        recipe_name: item.recipe_name,
        recipe_id: item.id ? item.id : null,
        days_of_week: selectedDayId,
        remarks: cardRemarks,
        mealid: checkid
      }
    })

    setSelectedCardRecipe(filteredItems)
    onChange(filteredItems)
  }

  console.log('selectedCardRecipe >>', selectedCardRecipe)

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

    setSelectedCardRecipe(updatedCards)
  }

  useEffect(() => {
    // Filter out duplicates based on id and mealid
    console.log(rows, 'rows')
    const uniqueSelectedValues = allRecipeSelectedValues?.filter(
      (value, index, self) =>
        index === self.findIndex(v => v?.recipe_id === value?.recipe_id && v?.mealid === value?.mealid)
    )
    console.log(uniqueSelectedValues, 'uniqueSelectedValues')
    // Compare uniqueSelectedValues with checkid
    const selectedValuesWithCheckId = uniqueSelectedValues?.filter(item => item?.mealid === checkid)

    // Initialize a new array to store the updated selectedCardRecipe
    let updatedSelectedCardRecipe = []
    console.log(selectedValuesWithCheckId, 'selectedValuesWithCheckId')
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
    console.log(updatedSelectedCardRecipe, 'updatedSelectedCardRecipe')
    console.log(selectedValuesWithCheckId, 'selectedValuesWithCheckId')
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
      console.log(cardIds, 'cardIds')
      console.log(days, 'days')
      // Update selectedDays state with the extracted values
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
      setSelectedDays(updatedSelectedDays)
    } else {
      const initialSelectedDays = rows.map(row => ({
        cardId: row.id,
        days: Day
      }))

      console.log('Initial Values>>', initialSelectedDays)
      setSelectedDays(initialSelectedDays)
    }
  }, [allRecipeSelectedValues, checkid, formData, rows, addEventSidebarOpen])

  return (
    <Box>
      <Box>
        {/* Example Card */}
        {rows?.map((item, index) => {
          return (
            <>
              <Box
                sx={{
                  bgcolor: 'background.paper',
                  border: selectedCardRecipe?.some(card => card.id === item.id) ? '2px solid #37BD69' : '#fff',
                  boxShadow: 1,
                  mt: 4,
                  borderRadius: '12px',
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
                        src={item?.recipe_image ? item?.recipe_image : '/icons/recipedummy.svg'}
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
                          {item?.ingredients_count}(68%)
                        </Typography>
                        <Typography sx={{ fontSize: '10px', width: '100px' }}>Ingredients by %</Typography>
                      </Box>
                      <Divider sx={{ borderLeft: '1px solid #D9D9D9', height: 30, mr: 2, mt: 3 }}></Divider>
                      <Box>
                        <Typography sx={{ mt: 2, fontSize: '12px', color: '#000', fontWeight: 'bold' }}>
                          {' '}
                          05 nos
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
        {selectedCardRecipe?.length > 0 && (
          <Card
            sx={{
              height: '122px',
              width: '597px',
              position: 'fixed',
              bottom: 0,
              ml: -6,
              padding: '32px, 16px, 32px, 16px'
            }}
          >
            <Button
              sx={{ width: '530px', height: '58px', mt: '35px', ml: 9, gap: '12px' }}
              variant='contained'
              onClick={handleSelected}
            >
              ADD RECIPE - {selectedCardRecipe.length} SELECTED
            </Button>
          </Card>
        )}
      </Box>
    </Box>
  )
}

export default RecipeCard
