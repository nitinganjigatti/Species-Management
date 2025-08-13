// ** Third Party Imports
import DatePicker from 'react-datepicker'

// ** Custom Component Imports
import CustomInput from './PickersCustomInput'

// ** Styled Component
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import InputAdornment from '@mui/material/InputAdornment'

const SingleDatePicker = ({
  popperPlacement,
  date,
  maxDate,
  onChangeHandler,
  name,
  dateFormat = 'dd-MMM-yyyy',
  disabled = false,
  size,
  ...rest
}) => {
  const handleDateChange = selectedDate => {
    if (selectedDate === null) {
      onChangeHandler(new Date())
    } else {
      onChangeHandler(selectedDate)
    }
  }

  return (
    <DatePickerWrapper>
      <DatePicker
        disabled={disabled ? disabled : null}
        showIcon
        selected={date}
        dateFormat={dateFormat}
        id='form-layouts-separator-date'
        popperPlacement={popperPlacement}
        onChange={handleDateChange}
        maxDate={maxDate ? maxDate : null}
        popperProps={{
          strategy: 'fixed'
        }}
        placeholderText='select a date'
        customInput={
          <CustomInput
            label={name}
            width='auto'
            size={size}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Icon icon='mdi:calendar-month-outline' />
                </InputAdornment>
              )
            }}
          />
        }
        {...rest}
      />
    </DatePickerWrapper>
  )
}

export default SingleDatePicker
