import { Button, styled, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React, { useState } from 'react'

const ScrollContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',

  px: theme.spacing(1),
  height: '60px',
  backgroundColor: '#E8F4F2',
  borderRadius: theme.spacing(1),
  overflowX: 'auto',
  whiteSpace: 'nowrap',
  width: '100%',
  '&::-webkit-scrollbar': {
    display: 'none'
  }
}))

const YearLabel = styled(Typography)(({ theme }) => ({
  fontSize: '18px',
  fontWeight: 600,
  color: theme.palette.text.secondary,

  padding: theme.spacing(1.25, 2),
  borderRadius: theme.spacing(0.75),
  minWidth: '70px',
  textAlign: 'center',
  flexShrink: 0
}))

const DateButton = styled(Button, {
  shouldForwardProp: prop => !['isSelected', 'hasIndicator', 'indicatorColor'].includes(prop)
})(({ theme, isSelected, hasIndicator, indicatorColor }) => {
  const baseStyles = {
    position: 'relative',
    width: 120,
    minWidth: 120,
    height: '100%',
    marginLeft: theme.spacing(0.5),
    px: 1,
    py: 0.5,
    borderRadius: theme.spacing(0.75),
    backgroundColor: isSelected ? '#37474f' : 'transparent',
    color: isSelected ? '#FFF' : theme.palette.text.primary,
    fontSize: '14px',
    fontWeight: 500,
    textTransform: 'none',
    transition: 'all 0.2s ease',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1.2,
    gap: theme.spacing(0.5),
    '&:disabled': {
      backgroundColor: 'transparent',
      color: theme.palette.text.disabled,
      cursor: 'not-allowed',
      '&:hover': {
        transform: 'none'
      }
    },
    '& .date-content': {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.5)
    },
    '& .dot': {
      width: 8,
      height: 8,
      borderRadius: '50%',
      backgroundColor: indicatorColor || '#ff5722',
      opacity: hasIndicator ? 1 : 0,
      transition: 'opacity 0.2s ease'
    }
  }

  if (!isSelected) {
    baseStyles['&:hover'] = {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
      transform: 'translateY(-1px)'
    }
  }

  return baseStyles
})

const HorizontalDateNav = ({
  dates = null,
  year = null,
  selectedDate = '',
  onDateSelect = () => {},
  startDate = null,
  numberOfDays = 7,
  specialDates = [],
  disabledDates = [],
  indicatorColor = '#ff5722',
  containerStyle = {},
  dateButtonStyle = {}
}) => {
  const [internalSelectedDate, setInternalSelectedDate] = useState(selectedDate)

  const generateDates = () => {
    if (dates) return dates

    const generatedDates = []
    const start = startDate || new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 1; i < numberOfDays - 1; i++) {
      const currentDate = new Date(start)
      currentDate.setDate(start.getDate() + i)

      const isDisabled = disabledDates.some(d => d.toDateString() === currentDate.toDateString())
      const hasIndicator = specialDates.some(d => d.toDateString() === currentDate.toDateString())

      generatedDates.push({
        date: currentDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
        day: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: currentDate,
        isToday: false,
        hasIndicator,
        isDisabled,
        indicatorColor: hasIndicator ? indicatorColor : undefined
      })
    }

    const prevDate = new Date(today)
    prevDate.setDate(prevDate.getDate() - 1)

    generatedDates.push({
      date: prevDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
      day: prevDate.toLocaleDateString('en-US', { weekday: 'short' }),
      fullDate: prevDate,
      isToday: false,
      hasIndicator: false,
      isDisabled: false
    })

    generatedDates.push({
      date: today.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
      day: today.toLocaleDateString('en-US', { weekday: 'short' }),
      fullDate: today,
      isToday: true,
      hasIndicator: true,
      indicatorColor: '#ff0000',
      isDisabled: false
    })

    return generatedDates
  }

  const dateItems = generateDates()
  const displayYear = year || new Date().getFullYear()

  const handleDateClick = dateItem => {
    if (dateItem.isDisabled) return
    setInternalSelectedDate(dateItem.date)
    onDateSelect(dateItem)
  }

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit'
  })
  const currentSelectedDate = selectedDate || internalSelectedDate || currentDateStr

  return (
    <ScrollContainer style={containerStyle}>
      <YearLabel>{displayYear}</YearLabel>
      {dateItems.map((dateItem, index) => (
        <DateButton
          key={`${dateItem.date}-${index}`}
          isSelected={currentSelectedDate === dateItem.date}
          hasIndicator={dateItem.hasIndicator}
          indicatorColor={dateItem.indicatorColor || indicatorColor}
          disabled={dateItem.isDisabled}
          onClick={() => handleDateClick(dateItem)}
          style={dateButtonStyle}
          sx={{
            '&:hover':
              currentSelectedDate === dateItem.date
                ? {}
                : {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    transform: 'translateY(-1px)'
                  }
          }}
        >
          <Box display='flex' alignItems='center' gap={2}>
            {dateItem.hasIndicator && (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: dateItem.indicatorColor || indicatorColor
                }}
              />
            )}
            <Typography
              variant='body2'
              fontWeight={400}
              sx={{
                color: currentSelectedDate === dateItem.date ? '#FFF' : '#44544A'
              }}
            >
              {dateItem.date}
            </Typography>
          </Box>
          <Typography
            variant='body2'
            fontWeight={400}
            sx={{
              color: currentSelectedDate === dateItem.date ? '#FFF' : '#44544A'
            }}
          >
            {dateItem.day}
          </Typography>
        </DateButton>
      ))}
    </ScrollContainer>
  )
}

export default HorizontalDateNav
