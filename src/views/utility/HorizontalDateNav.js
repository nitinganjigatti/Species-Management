import React from 'react'

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
  // Generate dynamic dates if not provided
  const generateDates = () => {
    if (dates) return dates

    const generatedDates = []
    const start = startDate || new Date()

    for (let i = 0; i < numberOfDays; i++) {
      const currentDate = new Date(start)
      currentDate.setDate(start.getDate() + i)

      // Check if date should be disabled
      const isDisabled = disabledDates.some(disabledDate => disabledDate.toDateString() === currentDate.toDateString())

      // Check if date has indicator
      const hasIndicator = specialDates.some(specialDate => specialDate.toDateString() === currentDate.toDateString())

      // Format date string
      const dateStr = currentDate.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit'
      })

      // Format day string
      const dayStr = currentDate.toLocaleDateString('en-US', {
        weekday: 'short'
      })

      generatedDates.push({
        date: dateStr,
        day: dayStr,
        fullDate: currentDate,
        hasIndicator,
        isDisabled,
        indicatorColor: hasIndicator ? indicatorColor : undefined
      })
    }

    return generatedDates
  }

  const dateItems = generateDates()
  const displayYear = year || new Date().getFullYear()

  const handleDateClick = dateItem => {
    if (dateItem.isDisabled) return

    setInternalSelectedDate(dateItem.date)
    onDateSelect(dateItem)
  }

  const currentSelectedDate = selectedDate || internalSelectedDate

  return (
    <>
      <StyledContainer style={containerStyle}>
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
          >
            {dateItem.date} {dateItem.day}
          </DateButton>
        ))}
      </StyledContainer>
    </>
  )
}

export default HorizontalDateNav
