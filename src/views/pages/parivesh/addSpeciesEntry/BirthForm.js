import { forwardRef } from 'react'
import { Grid, FormControl, TextField, MenuItem, FormHelperText } from '@mui/material'
import { Controller } from 'react-hook-form'
import SingleDatePicker from 'src/components/SingleDatePicker'

const BirthFrom = ({ control, errors }) => {
  const CustomInput = forwardRef(({ ...props }, ref) => {
    return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
  })
  return (
    <>
      <FormControl fullWidth sx={{ mb: 6 }}>
        <Controller
          name='gender'
          control={control}
          render={({ field: { value, onChange } }) => (
            <TextField select label='Gender*' value={value} onChange={onChange} error={Boolean(errors.gender)}>
              <MenuItem value='male'>Male</MenuItem>
              <MenuItem value='female'>Female</MenuItem>
              <MenuItem value='other'>Other</MenuItem>
            </TextField>
          )}
        />
        {errors.gender && <FormHelperText sx={{ color: 'error.main' }}>{errors.gender?.message}</FormHelperText>}
      </FormControl>
      <FormControl fullWidth sx={{ mb: 6 }}>
        <Controller
          name='animal_count'
          control={control}
          rules={{ required: true }}
          render={({ field: { value, onChange } }) => (
            <TextField
              label='Total Count*'
              value={value}
              onChange={onChange}
              placeholder='Enter Total Count'
              error={Boolean(errors.animal_count)}
              name='animal_count'
            />
          )}
        />
        {errors.animal_count && (
          <FormHelperText sx={{ color: 'error.main' }}>{errors.animal_count?.message}</FormHelperText>
        )}
      </FormControl>
      <FormControl fullWidth sx={{ mb: 6 }}>
        <Controller
          name='transaction_date'
          control={control}
          render={({ field: { value, onChange } }) => (
            <SingleDatePicker
              fullWidth
              date={value}
              width={'100%'}
              dateFormat='dd/MM/yyyy'
              onChangeHandler={onChange}
              maxDate={new Date()}
              customInput={<CustomInput label='Date*' error={Boolean(errors.transaction_date)} />}
            />
          )}
        />
        {errors.transaction_date && (
          <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
            {errors.transaction_date?.message}
          </FormHelperText>
        )}
      </FormControl>
    </>
  )
}

export default BirthFrom
