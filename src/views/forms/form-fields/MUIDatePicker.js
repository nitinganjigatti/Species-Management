import React from 'react'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import 'dayjs/locale/en' // Import more locales as needed

// Extend dayjs with plugins
dayjs.extend(advancedFormat)
dayjs.extend(localizedFormat)

const locale = 'en' // e.g., 'fr', 'de', 'hi', etc.

const MUIDatePicker = ({
  value,
  onChange,
  label = 'Select Date',
  minDate,
  maxDate = dayjs(),
  format = 'Do MMM YY',
  views,
  disabled = false,
  error = false,
  helperText = '',
  sx = {}
}) => {
  // Apply locale globally
  dayjs.locale(locale)

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={locale}>
      <DatePicker
        value={value}
        onChange={onChange}
        label={label}
        disabled={disabled}
        views={views && views}
        format={format}
        minDate={minDate}
        maxDate={maxDate}
        slotProps={{
          textField: {
            fullWidth: true,
            error,
            helperText,
            sx: {
              '& .MuiInputAdornment-root .MuiIconButton-root': {
                alignSelf: 'center',
              },
              '& .MuiInputBase-root': {
                alignItems: 'center'
              },
              ...sx
            }
          }
        }}
        sx={{
          width: '100%',
          ...sx
        }}
      />
    </LocalizationProvider>
  )
}

export default React.memo(MUIDatePicker)
