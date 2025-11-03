import { Button, styled, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React, { useState, useEffect, useRef } from 'react'
import Utility from 'src/utility'

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
  dateButtonStyle = {},
  isLoading = false
}) => {
  const [internalSelectedDate, setInternalSelectedDate] = useState(selectedDate)
  const scrollAreaRef = useRef(null)
  const dateButtonRefs = useRef({})

  const generateDates = () => {
    if (dates) return dates

    // const generatedDates = []
    // const start = startDate || new Date()
    // const today = new Date()
    // today.setHours(0, 0, 0, 0)

    // for (let i = 1; i < numberOfDays - 1; i++) {
    //   const currentDate = new Date(start)
    //   currentDate.setDate(start.getDate() + i)

    //   const isDisabled = disabledDates.some(d => d.toDateString() === currentDate.toDateString())
    //   const hasIndicator = specialDates.some(d => d.toDateString() === currentDate.toDateString())

    //   generatedDates.push({
    //     date: currentDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
    //     day: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
    //     fullDate: currentDate,
    //     isToday: false,
    //     hasIndicator,
    //     isDisabled,
    //     indicatorColor: hasIndicator ? indicatorColor : undefined
    //   })
    // }

    // const prevDate = new Date(today)
    // prevDate.setDate(prevDate.getDate() - 1)

    // generatedDates.push({
    //   date: prevDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
    //   day: prevDate.toLocaleDateString('en-US', { weekday: 'short' }),
    //   fullDate: prevDate,
    //   isToday: false,
    //   hasIndicator: false,
    //   isDisabled: false
    // })

    // generatedDates.push({
    //   date: today.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
    //   day: today.toLocaleDateString('en-US', { weekday: 'short' }),
    //   fullDate: today,
    //   isToday: true,
    //   hasIndicator: true,
    //   indicatorColor: '#ff0000',
    //   isDisabled: false
    // })

    // return generatedDates
  }

  useEffect(() => {
    console.log('dates', dates)
  }, [dates])
  useEffect(() => {
    console.log('selectedDate', selectedDate)
  }, [selectedDate])

  const dateItems = generateDates()
  const displayYear = year || new Date().getFullYear()

  const handleDateClick = dateItem => {
    setInternalSelectedDate(dateItem)
    onDateSelect(dateItem)
  }

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit'
  })
  const currentSelectedDate = selectedDate || internalSelectedDate || currentDateStr

  // Auto-scroll to current date on component mount
  useEffect(() => {
    const scrollToCurrentDate = () => {
      const currentDateButton = dateButtonRefs.current[selectedDate]
      const scrollArea = scrollAreaRef.current

      if (currentDateButton && scrollArea) {
        const buttonRect = currentDateButton.getBoundingClientRect()
        const scrollAreaRect = scrollArea.getBoundingClientRect()

        const scrollLeft =
          currentDateButton.offsetLeft - scrollArea.offsetLeft - scrollAreaRect.width / 2 + buttonRect.width / 2

        scrollArea.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: 'smooth'
        })
      }
    }

    // Small delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(scrollToCurrentDate, 100)

    return () => clearTimeout(timeoutId)
  }, [selectedDate, dateItems])

  // Render shimmer UI when loading
  if (isLoading) {
    return (
      <ScrollContainer style={containerStyle}>
        <ShimmerYearLabel />
        <DateScrollArea ref={scrollAreaRef}>
          {Array.from({ length: 4 }).map((_, index) => (
            <ShimmerDateButton key={index} />
          ))}
        </DateScrollArea>
      </ScrollContainer>
    )
  }

  return (
    <ScrollContainer style={containerStyle}>
      <YearLabel>{displayYear}</YearLabel>
      <DateScrollArea ref={scrollAreaRef}>
        {dateItems?.map((dateItem, index) => (
          <DateButton
            key={dateItem}
            ref={el => (dateButtonRefs.current[dateItem] = el)}
            isSelected={selectedDate === dateItem}

            // hasIndicator={dateItem.hasIndicator}
            indicatorColor={indicatorColor}

            // disabled={dateItem.isDisabled}
            onClick={() => handleDateClick(dateItem)}
            style={dateButtonStyle}
            sx={{
              '&:hover':
                selectedDate === dateItem
                  ? {}
                  : {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      transform: 'translateY(-1px)'
                    }
            }}
          >
            <Box display='flex' alignItems='center' gap={2}>
              {dateItem === selectedDate && (
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: indicatorColor
                  }}
                />
              )}
              <Typography
                variant='body2'
                fontWeight={400}
                sx={{
                  color: selectedDate === dateItem ? '#FFF' : '#44544A'
                }}
              >
                {Utility.formatDisplayDate(dateItem)}
              </Typography>
            </Box>
            {/* <Typography
              variant='body2'
              fontWeight={400}
              sx={{
                color: currentSelectedDate === dateItem ? '#FFF' : '#44544A'
              }}
            >
              {dateItem}
            </Typography> */}
          </DateButton>
        ))}
      </DateScrollArea>
    </ScrollContainer>
  )
}

export default HorizontalDateNav

const ScrollContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  px: theme.spacing(1),
  height: '48px',
  backgroundColor: '#E8F4F2',
  borderRadius: theme.spacing(1),
  width: '100%'
}))

const DateScrollArea = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  overflowX: 'auto',
  whiteSpace: 'nowrap',
  flex: 1,
  height: '100%',
  paddingLeft: theme.spacing(25), // Space for fixed year
  // paddingRight: theme.spacing(2), // Space for fixed year
  '&::-webkit-scrollbar': {
    display: 'none'
  },
  '-ms-overflow-style': 'none',
  'scrollbar-width': 'none'

  // [theme.breakpoints.up('md')]: {
  //   paddingLeft: 0,
  //   overflowX: 'visible'
  // }
}))

const YearLabel = styled(Typography)(({ theme }) => ({
  fontSize: '20px',
  fontWeight: 500,
  backgroundColor: theme.palette.customColors.displaybgSecondary,
  color: theme.palette.customColors.OnPrimaryContainer,

  // padding: '8px 16px',
  height: '100%',
  borderRadius: theme.spacing(0.75),
  minWidth: '82px',

  flexShrink: 0,
  position: 'absolute',

  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'

  // [theme.breakpoints.up('md')]: {
  //   position: 'static',
  //   transform: 'none',
  //   backgroundColor: 'transparent'
  // }
}))

const DateButton = styled(Button, {
  shouldForwardProp: prop => !['isSelected', 'hasIndicator', 'indicatorColor'].includes(prop)
})(({ theme, isSelected, hasIndicator, indicatorColor }) => {
  const baseStyles = {
    position: 'relative',
    width: 120,
    minWidth: 120,

    // height: 'calc(100% - 8px)', // Account for container padding
    height: '48px',
    marginLeft: theme.spacing(0.5),
    px: 1,
    py: 0,
    borderRadius: theme.spacing(0.75),
    backgroundColor: isSelected ? theme.palette.customColors.OnPrimaryContainer : 'transparent',
    color: isSelected ? theme.palette.customColors.OnPrimary : theme.palette.customColors.OnSurfaceVariant,
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
    minHeight: 0, // Override MUI button default minHeight
    '&.MuiButton-root': {
      minHeight: 0 // Ensure MUI doesn't override
    },
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
      backgroundColor: indicatorColor || theme.palette.customColors?.error?.main,
      opacity: hasIndicator ? 1 : 0,
      transition: 'opacity 0.2s ease'
    }
  }

  // Hover effect is handled in the sx prop to ensure proper selected state logic

  return baseStyles
})

// Shimmer UI Components
const ShimmerYearLabel = styled(Box)(({ theme }) => ({
  fontSize: '20px',
  fontWeight: 500,
  backgroundColor: theme.palette.grey[300],
  color: 'transparent',
  height: '100%',
  borderRadius: theme.spacing(0.75),
  minWidth: '82px',
  flexShrink: 0,
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: 'shimmer 1.5s infinite linear',
  background: `linear-gradient(90deg, ${theme.palette.grey[300]} 25%, ${theme.palette.grey[200]} 50%, ${theme.palette.grey[300]} 75%)`,
  backgroundSize: '200% 100%'
}))

const ShimmerDateButton = styled(Box)(({ theme }) => ({
  width: 120,
  minWidth: 120,
  height: '16px',
  borderRadius: '4px',
  marginLeft: '4px',
  backgroundColor: theme.palette.grey[300],
  animation: 'shimmer 1.5s infinite linear',
  background: `linear-gradient(90deg, ${theme.palette.grey[300]} 25%, ${theme.palette.grey[200]} 50%, ${theme.palette.grey[300]} 75%)`,
  backgroundSize: '200% 100%',
  flexShrink: 0
}))

// Add shimmer animation keyframes
const styles = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.innerText = styles
  document.head.appendChild(styleSheet)
}
