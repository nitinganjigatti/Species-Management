import React from 'react'
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import 'dayjs/locale/en'

dayjs.extend(advancedFormat)
dayjs.extend(localizedFormat)

const locale = 'en'

const MUIDateTimePicker = ({
  value,
  onChange,
  label = 'Select Date & Time',
  format,
  disabled = false,
  error = false,
  helperText = '',
  minDateTime = null,
  maxDateTime = null,
  ampm = false,
  sx = {},
  size = 'medium',
  borderRadius = '4px'
}) => {
  dayjs.locale(locale)

  // Auto-set format based on ampm prop if not explicitly provided
  const displayFormat = format || (ampm ? 'Do MMM YYYY hh:mm A' : 'Do MMM YYYY HH:mm')

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={locale}>
      <DateTimePicker
        value={value}
        onChange={onChange}
        label={label}
        disabled={disabled}
        format={displayFormat}
        ampm={ampm}
        minDateTime={minDateTime}
        maxDateTime={maxDateTime}
        slotProps={{
          textField: {
            fullWidth: true,
            error,
            helperText,
            size,
            sx: {
              '& .MuiOutlinedInput-root': {
                borderRadius
              },
              '& .MuiInputAdornment-root .MuiIconButton-root': {
                alignSelf: 'center'
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

export default React.memo(MUIDateTimePicker)
