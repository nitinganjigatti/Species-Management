import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Typography,
  Stack,
  Divider
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import CloseIcon from '@mui/icons-material/Close'
import IconButton from '@mui/material/IconButton'
import { useTheme } from '@emotion/react'
import { useRouter } from 'next/router'
import CustomDateRangePicker from './CustomDateRangePicker'

const CommonDateRangePickers = ({ onChange }) => {
  const theme = useTheme()
  const router = useRouter()
  const today = new Date()
  const [anchorEl, setAnchorEl] = useState(null)
  const [customDialogOpen, setCustomDialogOpen] = useState(false)
  const [selectedRange, setSelectedRange] = useState(`All time - Upto - ${format(today, 'dd MMM, yyyy')}`)
  const [tempRange, setTempRange] = useState({})
  const open = Boolean(anchorEl)

  console.log(router.query, 'router.query')

  const dateRanges = [
    {
      label: 'All time',
      subLabel: `Upto - ${format(today, 'dd MMM, yyyy')}`,
      startDate: today,
      endDate: today
    },
    {
      label: 'Today',
      subLabel: format(today, 'dd MMM, yyyy'),
      startDate: today,
      endDate: today
    },
    {
      label: 'Yesterday',
      subLabel: format(subDays(today, 1), 'dd MMM, yyyy'),
      startDate: subDays(today, 1),
      endDate: today
    },
    {
      label: 'Last 7 days',
      subLabel: `${format(subDays(today, 7), 'dd MMM, yyyy')} - ${format(today, 'dd MMM, yyyy')}`,
      startDate: subDays(today, 7),
      endDate: today
    },
    {
      label: 'Last 1 month',
      subLabel: `${format(subMonths(today, 1), 'dd MMM, yyyy')} - ${format(today, 'dd MMM, yyyy')}`,
      startDate: subMonths(today, 1), // Start date is 1 month ago from today
      endDate: today // End date is today
    },

    {
      label: 'Last 6 months',
      subLabel: `${format(subMonths(today, 6), 'dd MMM, yyyy')} - ${format(today, 'dd MMM, yyyy')}`,
      startDate: subMonths(today, 6),
      endDate: today
    },
    {
      label: 'Custom range',
      subLabel: 'Select a custom range',
      hasChevron: true
    }
  ]

  useEffect(() => {
    const { from_date, to_date } = router.query

    if (from_date && to_date) {
      const fromDate = new Date(from_date)
      const toDate = new Date(to_date)

      // Check if from_date and to_date are the same
      if (fromDate.toDateString() === toDate.toDateString()) {
        setSelectedRange(`Today - ${format(today, 'dd MMM, yyyy')}`)
        onChange?.(fromDate, toDate)
      } else {
        // Find the matching range in dateRanges
        const matchingRange = dateRanges.find(
          range =>
            range.startDate &&
            range.endDate &&
            range.startDate.toDateString() === fromDate.toDateString() &&
            range.endDate.toDateString() === toDate.toDateString()
        )

        if (matchingRange) {
          // If a predefined range matches, use its label and subLabel
          setSelectedRange(`${matchingRange.label} - ${matchingRange.subLabel}`)
        } else {
          // set a custom range
          const customRangeLabel = `Custom Range - ${format(fromDate, 'dd MMM, yyyy')} - ${format(
            toDate,
            'dd MMM, yyyy'
          )}`
          setSelectedRange(customRangeLabel)
        }
        onChange?.(fromDate, toDate)
      }
    }
  }, [])

  const handleClick = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleSelect = range => {
    if (range.label === 'Custom range') {
      setCustomDialogOpen(true)
    } else if (range.label === 'All time') {
      setSelectedRange(`${range.label} - ${range.subLabel}`)
      onChange?.('', '')
    } else if (range.startDate && range.endDate) {
      setSelectedRange(`${range.label} - ${range.subLabel}`)
      onChange?.(range.startDate, range.endDate)
    }
    handleClose()
  }

  const handleDateChange = range => {
    setTempRange(range)
    console.log('Selected Range:', range)
  }

  const handleApply = () => {
    if (tempRange.startDate && tempRange.endDate) {
      const newRange = `Custom Range - ${format(tempRange.startDate, 'dd MMM, yyyy')} - ${format(
        tempRange.endDate,
        'dd MMM, yyyy'
      )}`
      setSelectedRange(newRange) // Update selectedRange
      onChange?.(tempRange.startDate, tempRange.endDate)
    }
    setCustomDialogOpen(false) // Close dialog
  }

  return (
    <>
      <Box
        onClick={handleClick}
        sx={{
          cursor: 'pointer',
          backgroundColor: 'customColors.Background',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          pr: 2,
          width: '100%',
          '&:hover': {
            backgroundColor: '#E8EBE8'
            // customColors.neutral05
          }
        }}
      >
        <Box
          sx={{
            backgroundColor: 'customColors.Outline',
            // borderRadius: '4px',
            borderRadius: '4px 0 0 4px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <CalendarTodayIcon sx={{ color: 'white', fontSize: 24 }} />
        </Box>
        <Typography
          sx={{
            color: 'customColors.OnSurfaceVariant',
            fontSize: '16px',
            fontWeight: 500,
            flex: 1
          }}
        >
          {selectedRange}
        </Typography>
        {/* <KeyboardArrowDownIcon
          sx={{
            color: '#64748B',
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        /> */}
      </Box>

      <Menu
        id='date-range-menu'
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'date-range-button'
        }}
        PaperProps={{
          elevation: 3,
          sx: {
            width: '300px',
            maxHeight: 'none',
            mt: 1,
            '& .MuiList-root': {
              padding: 0
            }
            // borderRadius: '8px'
            // border: '1px solid #E0E0E0'
          }
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        {dateRanges.map((range, index) => (
          <Box key={range.label}>
            <MenuItem
              key={range.label}
              onClick={() => handleSelect(range)}
              // divider={index < dateRanges.length - 1}
              sx={{
                py: 3,
                px: 6,
                '&:hover': {
                  backgroundColor: '#F8FAFB'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Stack spacing={0.5} sx={{ flex: 1 }}>
                  <Typography
                    variant='body1'
                    sx={{
                      fontWeight: 500,
                      color: 'customColors.OnPrimaryContainer',
                      fontSize: '16px'
                    }}
                  >
                    {range.label}
                  </Typography>
                  <Typography
                    variant='body2'
                    sx={{
                      fontWeight: 400,
                      color: 'customColors.Outline',
                      fontSize: '14px'
                    }}
                  >
                    {range.subLabel}
                  </Typography>
                </Stack>
                {range.hasChevron && (
                  <ChevronRightIcon
                    sx={{
                      color: 'customColors.OnSurfaceVariant',
                      ml: 1
                    }}
                  />
                )}
              </Box>
            </MenuItem>
            {index < dateRanges.length - 1 && <Divider sx={{ m: 4, color: 'customColors.SurfaceVariant' }} />}
          </Box>
        ))}
      </Menu>
      <Dialog
        open={customDialogOpen}
        onClose={() => setCustomDialogOpen(false)}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            height: { xs: '400px', sm: '460px', md: '490px' },
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: `1px solid ${theme.palette.customColors.SurfaceVariant}`,
            p: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <Typography
            variant='h6'
            sx={{
              fontWeight: 600,
              color: 'customColors.OnPrimaryContainer'
            }}
          >
            Select Date Range
          </Typography>
          <IconButton
            aria-label='close'
            onClick={() => {
              setCustomDialogOpen(false)
              setTempRange({})
            }}
            sx={{
              color: 'customColors.OnPrimaryContainer'
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            p: 2,
            overflow: 'hidden',
            flexGrow: 1,
            position: 'relative'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflowY: 'auto',
              px: 2,
              pb: 4,

              '&::-webkit-scrollbar': {
                width: '8px'
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: '4px'
              }
            }}
          >
            <CustomDateRangePicker
              label='Date Range'
              monthsShown={2}
              shouldCloseOnSelect={false}
              onChange={handleDateChange}
              open={true}
              disableFutureDates={today}
              allowSingleDate={true}
            />
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            p: 3,
            flexShrink: 0,
            position: 'relative',
            zIndex: 1,
            mt: 2
          }}
        >
          <Button
            onClick={() => {
              setCustomDialogOpen(false)
              setTempRange({})
            }}
            variant='outlined'
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            variant='contained'
            color='primary'
            sx={{ ml: 2 }}
            disabled={!tempRange.startDate || !tempRange.endDate}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
      {/* <Dialog
        open={customDialogOpen}
        onClose={() => setCustomDialogOpen(false)}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            height: { xs: '400px', sm: '500px', md: '510px' },
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: `1px solid ${theme.palette.customColors.SurfaceVariant}`,
            p: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography
            variant='h6'
            sx={{
              fontWeight: 600,
              color: 'customColors.OnPrimaryContainer'
            }}
          >
            Select Date Range
          </Typography>
          <IconButton
            aria-label='close'
            onClick={() => setCustomDialogOpen(false)}
            sx={{
              color: 'customColors.OnPrimaryContainer'
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 6, p: 2 }}>
          <Box>
            <CustomDateRangePicker
              label='Date Range'
              monthsShown={2}
              shouldCloseOnSelect={false}
              onChange={handleDateChange}
              open={true}
              disableFutureDates={today}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setCustomDialogOpen(false)} variant='outlined'>
            Cancel
          </Button>
          <Button onClick={handleApply} variant='contained' color='primary'>
            Apply
          </Button>
        </DialogActions>
      </Dialog> */}
    </>
  )
}

export default CommonDateRangePickers
