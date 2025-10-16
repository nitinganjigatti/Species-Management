import { forwardRef } from 'react'
import { Grid, FormControl, TextField, MenuItem, FormHelperText, Divider, Typography } from '@mui/material'
import { Controller } from 'react-hook-form'
import SingleDatePicker from 'src/components/SingleDatePicker'
import { Box } from '@mui/system'

const TransferForm = ({ control, errors, watch, clearErrors }) => {
  const CustomInput = forwardRef(({ ...props }, ref) => {
    return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
  })
  const possessionType = watch('possession_type')
  const male_count = watch('male_count') || 0
  const female_count = watch('female_count') || 0
  const other_count = watch('other_count') || 0

  // Calculate total count
  const totalCount = Number(male_count) + Number(female_count) + Number(other_count)

  return (
    <>
      <FormControl fullWidth sx={{ mb: 6 }}>
        <Controller
          name='organization_transfer'
          control={control}
          rules={{ required: true }}
          render={({ field: { value, onChange } }) => (
            <TextField
              label='Which organization would you transfer?'
              value={value}
              type='text'
              onChange={onChange}
              placeholder='Which organization would you transfer?'
              error={Boolean(errors.organization_transfer)}
              name='organization_transfer'
            />
          )}
        />

        {errors.organization_transfer && (
          <FormHelperText sx={{ color: 'error.main' }}>{errors.organization_transfer?.message}</FormHelperText>
        )}
      </FormControl>
      {/* <FormControl fullWidth sx={{ mb: 6 }}>
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
      </FormControl> */}
      {/* <FormControl fullWidth sx={{ mb: 6 }}>
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
      </FormControl> */}
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
      <Divider />
      <Grid item size={{ xs: 12 }} sx={{ mb: 6, mt: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant='h6' gutterBottom>
            Gender *
          </Typography>
          <Typography variant='subtitle1' gutterBottom>
            Total Count: {totalCount}
          </Typography>
        </Box>
      </Grid>
      <Grid item size={{ xs: 12, sm: 4 }} sx={{ mb: 6 }}>
        <FormControl fullWidth>
          <Controller
            name='male_count'
            control={control}
            rules={{ min: 0, pattern: /^\d*$/ }}
            render={({ field: { value, onChange } }) => (
              <TextField
                label='Male Count'
                value={value}
                variant='outlined'

                // onChange={onChange}
                onChange={e => {
                  onChange(e) // Update the value in the form
                  clearErrors('counts') // Clear the counts error on change
                }}
                placeholder='Enter the Male Count'
                error={Boolean(errors.male_count)}
                name='male_count'
              />
            )}
          />

          {errors.male_count && (
            <FormHelperText sx={{ color: 'error.main' }}>{errors.male_count?.message}</FormHelperText>
          )}
          {errors.counts && (
            <Grid item size={{ xs: 12 }} sx={{ mb: 6 }}>
              <FormHelperText sx={{ color: 'error.main' }}>{errors.counts.message}</FormHelperText>
            </Grid>
          )}
        </FormControl>
      </Grid>
      <Grid item size={{ xs: 12, sm: 4 }} sx={{ mb: 6 }}>
        <FormControl fullWidth>
          <Controller
            name='female_count'
            control={control}
            rules={{ min: 0, pattern: /^\d*$/ }}
            render={({ field: { value, onChange } }) => (
              <TextField
                label='Female Count'
                placeholder='Enter the Female Count'
                value={value}
                variant='outlined'

                // onChange={onChange}
                onChange={e => {
                  onChange(e) // Update the value in the form
                  clearErrors('counts') // Clear the counts error on change
                }}
                error={Boolean(errors.female_count)}
                name='female_count'

                // onBlur={() => {
                //   if (
                //     !Boolean(errors.maleCount) &&
                //     !Boolean(errors.femaleCount) &&
                //     !Boolean(errors.othersCount)
                //   ) {
                //     trigger() // Trigger validation on blur
                //   }
                // }}
              />
            )}
          />

          {errors.female_count && (
            <FormHelperText sx={{ color: 'error.main' }}>{errors.female_count?.message}</FormHelperText>
          )}
          {errors.counts && (
            <Grid item size={{ xs: 12 }} sx={{ mb: 6 }}>
              <FormHelperText sx={{ color: 'error.main' }}>{errors.counts.message}</FormHelperText>
            </Grid>
          )}
        </FormControl>
      </Grid>
      <Grid item size={{ xs: 12, sm: 4 }}>
        <FormControl fullWidth>
          <Controller
            name='other_count'
            control={control}
            rules={{ min: 0, pattern: /^\d*$/ }}
            render={({ field: { value, onChange } }) => (
              <TextField
                label='Others Count'
                placeholder='Enter the Others Count'
                value={value}
                variant='outlined'

                // onChange={onChange}
                onChange={e => {
                  onChange(e) // Update the value in the form
                  clearErrors('counts') // Clear the counts error on change
                }}
                error={Boolean(errors.other_count)}
                name='other_count'
              />
            )}
          />

          {errors.other_count && (
            <FormHelperText sx={{ color: 'error.main' }}>{errors.other_count?.message}</FormHelperText>
          )}
          {errors.counts && (
            <Grid item size={{ xs: 12 }} sx={{ mb: 6 }}>
              <FormHelperText sx={{ color: 'error.main' }}>{errors.counts.message}</FormHelperText>
            </Grid>
          )}
        </FormControl>
      </Grid>
    </>
  );
}

export default TransferForm
