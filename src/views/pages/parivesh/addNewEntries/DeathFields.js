import React, { useEffect, useState } from 'react'
import { Grid, FormControl, TextField, MenuItem, FormHelperText } from '@mui/material'
import { forwardRef } from 'react'
import { Controller } from 'react-hook-form'
import SingleDatePicker from 'src/components/SingleDatePicker'

const DeathFields = ({
  control,
  errors,
  watch,
  getValues,
  setValue,
  clearErrors,
  isEditMode,
  editParams,
  possessionType
}) => {
  const CustomInput = forwardRef(({ ...props }, ref) => {
    return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
  })

  // const transactionDate = watch('transaction_date')
  // const deathDate = watch('death_date')

  // useEffect(() => {
  //   validateDates(transactionDate, deathDate)
  // }, [transactionDate, deathDate])

  // const validateDates = (transactionDate, deathDate) => {
  //   if (!transactionDate || !deathDate) return

  //   const transactionDateTime = new Date(transactionDate).getTime()
  //   const deathDateTime = new Date(deathDate).getTime()

  //   if (transactionDateTime < deathDateTime) {
  //     setValue('transaction_date', null)
  //     clearErrors('transaction_date')
  //   }
  // }

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} sx={{ mb: 6 }}>
          <FormControl fullWidth>
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
        </Grid>
        <Grid item xs={12} sm={6} sx={{ mb: 6 }}>
          <FormControl fullWidth>
            <Controller
              name='death_date'
              rules={{ required: possessionType === 'death' ? true : false }}
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
                  // maxDate={new Date()}
                  maxDate={
                    editParams?.transaction_date
                      ? new Date(Math.min(new Date(editParams?.transaction_date).getTime(), new Date().getTime()))
                      : new Date()
                  }
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
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} sx={{ mb: 6 }}>
          <FormControl fullWidth>
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
        </Grid>
        <Grid item xs={12} sm={6} sx={{ mb: 6 }}>
          <Grid container spacing={2}>
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
                {errors.gender && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.gender?.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Grid container spacing={2} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <Controller
              name='transaction_date'
              control={control}
              // rules={{
              //   validate: {
              //     dateOrder: value => {
              //       const deathDateValue = getValues('death_date')
              //       if (deathDateValue) {
              //         const transactionDateTime = new Date(value).getTime()
              //         const deathDateTime = new Date(deathDateValue).getTime()
              //         if (transactionDateTime < deathDateTime) {
              //           return 'Entry date cant be older than the death date'
              //         }
              //       }
              //       return true
              //     }
              //   }
              // }}
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
                  // minDate={(deathDate && deathDate) || new Date()}
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

export default DeathFields
