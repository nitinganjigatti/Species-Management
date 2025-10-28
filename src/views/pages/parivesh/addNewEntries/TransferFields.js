import React from 'react'
import { Grid, FormControl, TextField, MenuItem, FormHelperText, Divider, Typography } from '@mui/material'
import { forwardRef } from 'react'
import { Controller } from 'react-hook-form'
import SingleDatePicker from 'src/components/SingleDatePicker'
import { Box } from '@mui/system'

const TransferFields = ({
  control,
  errors,
  watch,
  getValues,
  setValue,
  clearErrors,
  isEditMode,
  editParams,
  reasonType,
  setImgSrc,
  setDisplayFile,
  setDgftDisplayFile,
  setReasonType
}) => {
  const CustomInput = forwardRef(({ ...props }, ref) => {
    return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
  })
  const possessionType = watch('possession_type')

  // Watch maleCount, femaleCount, and othersCount
  const male_count = watch('male_count') || 0
  const female_count = watch('female_count') || 0
  const other_count = watch('other_count') || 0

  // Calculate total count
  const totalCount = Number(male_count) + Number(female_count) + Number(other_count)

  return (
    <>
      <Grid container spacing={2} sx={{ mb: 6 }}>
        <Grid item size={{ xs: 12 }}>
          <FormControl fullWidth>
            <Controller
              name='possession_type'
              control={control}
              render={({ field: { value, onChange } }) => (
                <TextField
                  select
                  label='Reason*'
                  placeholder='Reason'
                  value={value}
                  disabled={isEditMode}
                  onChange={e => {
                    const value = e.target.value
                    onChange(e)
                    setReasonType(value)
                    if (!isEditMode) {
                      setValue('animal_count', '')
                      setValue('transaction_date', new Date())
                      setValue('reason_for_death', '')
                      setValue('death_date', null)
                      setValue('where_to_transfer', '')
                      setValue('where_to_acquisition', '')
                      setValue('dgft_number', '')
                      setValue('cites_required', '')
                      setValue('cites_appendix', '')
                      setValue('cites_numbers', '')
                      setValue('death_animal_id', '')
                      setValue('attachments', [])
                      setValue('dgft_attachments', [])
                      setValue('parent_registration_id', '')
                      setImgSrc([])
                      setDisplayFile([])
                      setDgftDisplayFile([])
                    }
                    setValue('gender', '')
                  }}
                  error={Boolean(errors.possession_type)}
                >
                  <MenuItem value='birth'>Birth</MenuItem>
                  <MenuItem value='death'>Death</MenuItem>
                  <MenuItem value='transfer'>Transfer </MenuItem>
                  <MenuItem value='acquisition'>Acquisition </MenuItem>
                </TextField>
              )}
            />
            {errors.possession_type && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors.possession_type?.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>
      </Grid>
      <Grid container spacing={2} sx={{ mb: 6 }}>
        <Grid item size={{ xs: 12, sm: 6 }}>
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
        <Grid item size={{ xs: 12, sm: 6 }}>
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
      <Divider />
      <Grid item size={{ xs: 12 }}>
        <Box
          sx={{
            mt: 6
          }}
        >
          <Typography variant='h5' gutterBottom>
            Gender
          </Typography>
          <Typography variant='subtitle1' gutterBottom>
            Total Count: {totalCount}
          </Typography>
        </Box>
      </Grid>
      <Grid container spacing={3}>
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
      </Grid>
      {/* <Grid container spacing={2} sx={{ mb: 6 }}>
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
      </Grid> */}
    </>
  )
}

export default TransferFields
