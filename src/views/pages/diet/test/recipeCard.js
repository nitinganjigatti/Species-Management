import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Icon from 'src/@core/components/icon'
import Card from '@mui/material/Card'

import Divider from '@mui/material/Divider'
import Avatar from 'src/@core/components/mui/avatar'
import Button from '@mui/material/Button'
import DoneIcon from '@mui/icons-material/Done'
import { use, useState } from 'react'
import { Stack } from '@mui/system'

const RecipeCard = ({ rows, setSelectedCard, selectedCard }) => {
  const [remarks, setRemarks] = useState('')
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

  console.log('rows>>>>>', rows)

  const [selectedDays, setSelectedDays] = useState([])
  console.log('selectedDays', selectedDays, remarks)

  const [expandedIndex, setExpandedIndex] = useState([])

  const handleDayClick = (dayId, dayName, cardId) => {
    let cardInfo = selectedDays.find(item => item.cardId === cardId)
    if (!cardInfo) {
      cardInfo = { cardId, days: [] }
    }

    if (dayId === 0) {
      const allDaysSelected = cardInfo.days.filter(item => item.dayId !== 0).length === 7

      if (allDaysSelected) {
        cardInfo.days = []
      } else {
        cardInfo.days = []
        for (let i = 1; i <= 7; i++) {
          const day = Day.find(day => day.id === i)
          cardInfo.days.push({ dayId: day.id, dayName: day.name })
        }

        cardInfo.days.push({ dayId: 0, dayName: 'All' })
      }
    } else {
      const index = cardInfo.days.findIndex(item => item.dayId === dayId)

      if (index === -1) {
        cardInfo.days.push({ dayId, dayName })
      } else {
        cardInfo.days.splice(index, 1)
      }

      if (dayId !== 0) {
        const allDayIndex = cardInfo.days.findIndex(item => item.dayId === 0)
        if (allDayIndex !== -1) {
          cardInfo.days.splice(allDayIndex, 1)
        }
      }
    }

    const allSelected = cardInfo.days.length === 7 && !cardInfo.days.some(day => day.dayId === 0)
    if (allSelected) {
      const allDay = Day.find(day => day.id === 0)
      cardInfo.days.push({ dayId: 0, dayName: 'All' })
    }

    const updatedSelectedDays = selectedDays.filter(item => item.cardId !== cardId)
    updatedSelectedDays.push(cardInfo)
    setSelectedDays(updatedSelectedDays)
  }

  console.log('Selected Days ??', selectedDays)

  const handleCardClick = item => {
    debugger
    // Check if the item is already selected
    // const selectedIndex = selectedCard.indexOf(item)
    const remarksData = remarks || ''

    const selectedDaysForItem = Day.filter(day =>
      selectedDays.some(
        selectedDay =>
          selectedDay.cardId === item.id && selectedDay.days.some(selectedDay => selectedDay.dayId === day.id)
      )
    )

    const index = selectedCard.findIndex(card => card.id === item.id)
    if (index === -1) {
      // If not selected, add it to the selectedCard array
      setSelectedCard(prevValues => [
        ...prevValues,
        {
          item: item,
          id: item.id,
          selectedDays: selectedDays,
          remarks: remarksData
        }
      ])
    } else {
      // If selected, remove it from the selectedCard array
      const newSelectedCard = [...selectedCard]
      newSelectedCard.splice(index, 1)
      setSelectedCard(newSelectedCard)
    }

    // Prepare the object to store values
  }

  // const handleClick = (item, index, e) => {
  //   console.log('dfdm', e.target.value)
  //   const newSelectedCard = [...selectedCard]
  //   const selectedItem = newSelectedCard.find(selectedItem => selectedItem.id === item.id)

  //   if (selectedItem) {
  //     selectedItem.selected_remarks = e.target.value
  //   }

  //   setSelectedCard(newSelectedCard)

  //   setExpandedIndex(prevState =>
  //     prevState.includes(index) ? prevState.filter(i => i !== index) : [...prevState, index]
  //   )
  // }
  const handleSelected = () => {
    console.log('Selected Data', selectedCard)
  }

  const handleAddRemarks = event => {
    event.stopPropagation()
    setRemarks(event.target.value)
  }

  console.log('remarks >>', remarks)
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
                  border: selectedCard.some(card => card.id === item.id) ? '2px solid #37BD69' : '#fff',
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

                      bgcolor: selectedCard.some(card => card.id === item.id) ? '#37BD69' : '#E8F4F2',
                      borderRadius: '10.88px'
                    }}
                  >
                    {selectedCard.some(card => card.id === item.id) ? (
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
                {selectedCard.some(card => card.id === item.id) ? (
                  <>
                    <Divider />
                    <Typography sx={{ py: 3, px: 2, ml: 3 }}>Feeding Days</Typography>
                    <Stack direction='row' gap={3} mb={2} sx={{ px: 2, ml: 4 }}>
                      {Day?.map(day => (
                        <Box
                          key={day.id}
                          onClick={() => handleDayClick(day.id, day.name, item.id)}
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
                          {day.name}
                        </Box>
                      ))}
                    </Stack>

                    <Box sx={{ mt: 5 }}>
                      <Divider />
                      <TextField
                        multiline
                        rows={expandedIndex.includes(index) ? 3 : 1}
                        // onClick={e => handleClick(item, index, e)}
                        onChange={handleAddRemarks}
                        placeholder={expandedIndex.includes(index) ? 'Remarks' : 'Add remarks (optional)'}
                        variant='outlined'
                        fullWidth
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              border: 'none' // Remove the outside border
                            }
                          },
                          transition: 'max-height 0.5s ease-in-out', // Smooth transition
                          overflow: 'hidden', // Hide overflow content during transition
                          maxHeight: expandedIndex.includes(index) ? '100px' : '56px' // Initial and expanded height
                        }}
                        // onBlur={() => setExpandedText(false)} // Collapse on blur
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
        {selectedCard.length > 0 && (
          <Card
            sx={{
              height: '122px',
              width: '585px',
              position: 'fixed',
              bottom: 0,
              ml: -6,
              padding: '32px, 16px, 32px, 16px'
            }}
          >
            <Button
              sx={{ width: '530px', height: '58px', mt: '35px', ml: 7, gap: '12px' }}
              variant='contained'
              onClick={handleSelected}
            >
              ADD RECIPE - {selectedCard.length} SELECTED
            </Button>
          </Card>
        )}
      </Box>
    </Box>
  )
}

export default RecipeCard
