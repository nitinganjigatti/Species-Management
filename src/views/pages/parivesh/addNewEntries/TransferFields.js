import React from 'react'
import { Grid, FormControl, TextField, MenuItem, FormHelperText } from '@mui/material'
import { forwardRef } from 'react'
import { Controller } from 'react-hook-form'
import SingleDatePicker from 'src/components/SingleDatePicker'

const TransferFields = ({
  control,
  errors,
  watch,
  getValues,
  setValue,
  clearErrors,
  isEditMode,
  editParams,
  reasonType
}) => {
  const CustomInput = forwardRef(({ ...props }, ref) => {
    return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
  })
  return (
    <>
      <Grid container spacing={2} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={12}>
          <FormControl fullWidth>
            <Controller
              name='where_to_transfer'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  label='Which organization would you transfer?'
                  value={value}
                  type='text'
                  onChange={onChange}
                  placeholder='Which organization would you transfer?'
                  error={Boolean(errors.where_to_transfer)}
                  name='where_to_transfer'
                />
              )}
            />

            {errors.where_to_transfer && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors.where_to_transfer?.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>
      </Grid>
      <Grid container spacing={2} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={12}>
          <FormControl fullWidth>
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
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} sx={{ mb: 6 }}>
          <FormControl fullWidth>
            <Controller
              name='animal_count'
              control={control}
              rules={{ required: reasonType !== 'death' }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  label='Total Count*'
                  value={value}
                  type='number'
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
        </Grid>

        <Grid item xs={12} sm={6} sx={{ mb: 6 }}>
          <FormControl fullWidth>
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
        </Grid>
      </Grid>
    </>
  )
}

export default TransferFields
