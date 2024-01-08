// ** Third Party Imports
import DatePicker from 'react-datepicker'

// ** Custom Component Imports
import CustomInput from './PickersCustomInput'

// ** Styled Component
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import InputAdornment from '@mui/material/InputAdornment'

const SingleDatePicker = ({ popperPlacement, date, onChangeHandler, name }) => {
  return (
    <DatePickerWrapper>
      <DatePicker
        showIcon
        selected={date}
        id='form-layouts-separator-date'
        popperPlacement={popperPlacement}
        onChange={onChangeHandler}
        placeholderText='select a date'
        customInput={
          <CustomInput
            label={name}
            width='auto'
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Icon icon='mdi:calendar-month-outline' />
                </InputAdornment>
              )
            }}
          />
        }
      />
    </DatePickerWrapper>
  )
}

export default SingleDatePicker
