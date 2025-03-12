import { forwardRef } from 'react'
import { Grid, FormControl, TextField, MenuItem, FormHelperText } from '@mui/material'
import { Controller } from 'react-hook-form'
import SingleDatePicker from 'src/components/SingleDatePicker'

const DeathForm = ({ control, errors }) => {
  const CustomInput = forwardRef(({ ...props }, ref) => {
    return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
  })
  return (
    <>
      <FormControl fullWidth sx={{ mb: 6 }}>
        <Controller
          name='reason_for_death'
          control={control}
          rules={{ required: true }}
          render={({ field: { value, onChange } }) => (
            <TextField
              label='Reason for Death*'
              value={value}
              onChange={onChange}
              placeholder='Enter Reason for Death'
              error={Boolean(errors.reason_for_death)}
              name='reason_for_death'
            />
          )}
        />

        {errors.reason_for_death && (
          <FormHelperText sx={{ color: 'error.main' }}>{errors.reason_for_death?.message}</FormHelperText>
        )}
      </FormControl>
      <FormControl fullWidth sx={{ mb: 6 }}>
        <Controller
          name='death_date'
          control={control}
          render={({ field: { value, onChange } }) => (
            <SingleDatePicker
              fullWidth
              date={value}
              width={'100%'}
              dateFormat='dd/MM/yyyy'
              // showTimeSelect
              // timeIntervals={15}

              onChangeHandler={onChange}
              maxDate={new Date()}
              customInput={<CustomInput label='Date of Death*' error={Boolean(errors.death_date)} />}
            />
          )}
        />
        {errors.death_date && (
          <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
            {errors.death_date?.message}
          </FormHelperText>
        )}
      </FormControl>
      <FormControl fullWidth sx={{ mb: 6 }}>
        <Controller
          name='death_animal_id'
          control={control}
          rules={{ required: true }}
          render={({ field: { value, onChange } }) => (
            <TextField
              label='Animal ID (Optional)'
              value={value}
              onChange={onChange}
              placeholder='Enter Animal ID (Optional)'
              error={Boolean(errors.death_animal_id)}
              name='death_animal_id'
            />
          )}
        />

        {errors.death_animal_id && (
          <FormHelperText sx={{ color: 'error.main' }}>{errors.death_animal_id?.message}</FormHelperText>
        )}
      </FormControl>
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
          name='transaction_date'
          control={control}
          render={({ field: { value, onChange } }) => (
            <SingleDatePicker
              fullWidth
              date={value}
              width={'100%'}
              dateFormat='dd/MM/yyyy'
              // showTimeSelect
              // timeIntervals={15}
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

export default DeathForm
