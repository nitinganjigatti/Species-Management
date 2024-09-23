import { Grid, FormControl, TextField, MenuItem, FormHelperText } from '@mui/material'
import { forwardRef } from 'react'
import { Controller } from 'react-hook-form'
import SingleDatePicker from 'src/components/SingleDatePicker'

const BirthFields = ({
  control,
  errors,
  reasonType,
  setReasonType,
  setDgftDisplayFile,
  watch,
  getValues,
  setValue,
  clearErrors,
  isEditMode,
  editParams,
  setImgSrc,
  setDisplayFile
}) => {
  const CustomInput = forwardRef(({ ...props }, ref) => {
    return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
  })
  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} sx={{ mb: 6 }}>
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
        <Grid item xs={12} sm={6} sx={{ mb: 6 }}>
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
        {reasonType !== 'death' && (
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
        )}
        <Grid item xs={12} sm={6}>
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

export default BirthFields
