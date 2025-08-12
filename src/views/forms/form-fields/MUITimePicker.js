import React from 'react'
import { TimePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import 'dayjs/locale/en'

dayjs.extend(advancedFormat)
dayjs.extend(localizedFormat)

const locale = 'en'

const MUITimePicker = ({
    value,
    onChange,
    label = 'Select Time',
    format = 'hh:mm A',
    views = ['hours', 'minutes'],
    disabled = false,
    error = false,
    helperText = '',
    ampm = true,
    minutesStep = 1,
    sx = {}
}) => {
    // Apply locale globally
    dayjs.locale(locale)

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={locale}>
            <TimePicker
                value={value}
                onChange={onChange}
                label={label}
                disabled={disabled}
                views={views}
                format={format}
                ampm={ampm}
                minutesStep={minutesStep}
                slotProps={{
                    textField: {
                        fullWidth: true,
                        error,
                        helperText,
                        sx: {
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

export default React.memo(MUITimePicker)