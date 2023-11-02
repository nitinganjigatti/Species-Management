// ** Third Party Imports
import DatePicker from 'react-datepicker'

// ** Custom Component Imports
import CustomInput from './PickersCustomInput'

// ** Styled Component
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'

const SingleDatePicker = ({ popperPlacement, date, onChangeHandler, name }) => {
  return (
    <DatePickerWrapper>
      <DatePicker
        selected={date}
        id='form-layouts-separator-date'
        popperPlacement={popperPlacement}
        onChange={onChangeHandler}
        placeholderText='Click to select a date'
        customInput={<CustomInput label={name} width='auto' />}
      />
    </DatePickerWrapper>
  )
}

export default SingleDatePicker
