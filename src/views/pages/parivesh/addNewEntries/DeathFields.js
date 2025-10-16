import React, { useEffect, useState } from 'react'
import { Grid, FormControl, TextField, MenuItem, FormHelperText, Divider, Typography } from '@mui/material'
import { forwardRef } from 'react'
import { Controller } from 'react-hook-form'
import SingleDatePicker from 'src/components/SingleDatePicker'
import { Box } from '@mui/system'

const DeathFields = ({
  control,
  errors,
  watch,
  getValues,
  setValue,
  clearErrors,
  isEditMode,
  editParams,
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

    // <>
    //   <Grid container spacing={2} sx={{ mb: 6 }}>
    //     <Grid item xs={12} sm={6}>
    //       <FormControl fullWidth>
    //         <Controller
    //           name='possession_type'
    //           control={control}
    //           render={({ field: { value, onChange } }) => (
    //             <TextField
    //               select
    //               label='Reason*'
    //               placeholder='Reason'
    //               value={value}
    //               disabled={isEditMode}
    //               onChange={e => {
    //                 const value = e.target.value
    //                 onChange(e)
    //                 setReasonType(value)
    //                 if (!isEditMode) {
    //                   setValue('animal_count', '')
    //                   setValue('transaction_date', new Date())
    //                   setValue('reason_for_death', '')
    //                   setValue('death_date', null)
    //                   setValue('where_to_transfer', '')
    //                   setValue('where_to_acquisition', '')
    //                   setValue('dgft_number', '')
    //                   setValue('cites_required', '')
    //                   setValue('cites_appendix', '')
    //                   setValue('cites_numbers', '')
    //                   setValue('death_animal_id', '')
    //                   setValue('attachments', [])
    //                   setValue('dgft_attachments', [])
    //                   setValue('parent_registration_id', '')
    //                   setImgSrc([])
    //                   setDisplayFile([])
    //                   setDgftDisplayFile([])
    //                 }
    //                 setValue('gender', '')
    //               }}
    //               error={Boolean(errors.possession_type)}
    //             >
    //               <MenuItem value='birth'>Birth</MenuItem>
    //               <MenuItem value='death'>Death</MenuItem>
    //               <MenuItem value='transfer'>Transfer </MenuItem>
    //               <MenuItem value='acquisition'>Acquisition </MenuItem>
    //             </TextField>
    //           )}
    //         />
    //         {errors.possession_type && (
    //           <FormHelperText sx={{ color: 'error.main' }}>{errors.possession_type?.message}</FormHelperText>
    //         )}
    //       </FormControl>
    //     </Grid>
    //     <Grid item xs={12} sm={6}>
    //       <FormControl fullWidth>
    //         <Controller
    //           name='transaction_date'
    //           control={control}
    //           render={({ field: { value, onChange } }) => (
    //             <SingleDatePicker
    //               fullWidth
    //               date={value}
    //               width={'100%'}
    //               dateFormat='dd/MM/yyyy'
    //               // showTimeSelect
    //               // timeIntervals={15}
    //               onChangeHandler={onChange}
    //               maxDate={new Date()}
    //               // minDate={(deathDate && deathDate) || new Date()}
    //               customInput={<CustomInput label='Date*' error={Boolean(errors.transaction_date)} />}
    //             />
    //           )}
    //         />
    //         {errors.transaction_date && (
    //           <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
    //             {errors.transaction_date?.message}
    //           </FormHelperText>
    //         )}
    //       </FormControl>
    //     </Grid>
    //   </Grid>
    //   <Grid container spacing={2}>
    //     <Grid item xs={12} sm={6} sx={{ mb: 6 }}>
    //       <FormControl fullWidth>
    //         <Controller
    //           name='death_animal_id'
    //           control={control}
    //           rules={{ required: true }}
    //           render={({ field: { value, onChange } }) => (
    //             <TextField
    //               label='Animal ID (Optional)'
    //               value={value}
    //               onChange={onChange}
    //               placeholder='Enter Animal ID (Optional)'
    //               error={Boolean(errors.death_animal_id)}
    //               name='death_animal_id'
    //             />
    //           )}
    //         />
    //         {errors.death_animal_id && (
    //           <FormHelperText sx={{ color: 'error.main' }}>{errors.death_animal_id?.message}</FormHelperText>
    //         )}
    //       </FormControl>
    //     </Grid>
    //     <Grid item xs={12} sm={6} sx={{ mb: 6 }}>
    //       <FormControl fullWidth>
    //         <Controller
    //           name='death_date'
    //           rules={{ required: possessionType === 'death' ? true : false }}
    //           control={control}
    //           render={({ field: { value, onChange } }) => (
    //             <SingleDatePicker
    //               fullWidth
    //               date={value}
    //               width={'100%'}
    //               dateFormat='dd/MM/yyyy'
    //               // showTimeSelect
    //               // timeIntervals={15}
    //               onChangeHandler={onChange}
    //               // maxDate={new Date()}
    //               maxDate={
    //                 editParams?.transaction_date
    //                   ? new Date(Math.min(new Date(editParams?.transaction_date).getTime(), new Date().getTime()))
    //                   : new Date()
    //               }
    //               customInput={<CustomInput label='Date of Death*' error={Boolean(errors.death_date)} />}
    //             />
    //           )}
    //         />
    //         {errors.death_date && (
    //           <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
    //             {errors.death_date?.message}
    //           </FormHelperText>
    //         )}
    //       </FormControl>
    //     </Grid>
    //   </Grid>
    //   <Grid container spacing={2}>
    //     <Grid item xs={12} sm={12} sx={{ mb: 6 }}>
    //       <FormControl fullWidth>
    //         <Controller
    //           name='reason_for_death'
    //           control={control}
    //           rules={{ required: true }}
    //           render={({ field: { value, onChange } }) => (
    //             <TextField
    //               label='Reason for Death*'
    //               value={value}
    //               onChange={onChange}
    //               placeholder='Enter Reason for Death'
    //               error={Boolean(errors.reason_for_death)}
    //               name='reason_for_death'
    //             />
    //           )}
    //         />
    //         {errors.reason_for_death && (
    //           <FormHelperText sx={{ color: 'error.main' }}>{errors.reason_for_death?.message}</FormHelperText>
    //         )}
    //       </FormControl>
    //     </Grid>
    //     {/* <Grid item xs={12} sm={6} sx={{ mb: 6 }}>
    //       <FormControl fullWidth>
    //         <Controller
    //           name='death_date'
    //           rules={{ required: possessionType === 'death' ? true : false }}
    //           control={control}
    //           render={({ field: { value, onChange } }) => (
    //             <SingleDatePicker
    //               fullWidth
    //               date={value}
    //               width={'100%'}
    //               dateFormat='dd/MM/yyyy'
    //               // showTimeSelect
    //               // timeIntervals={15}
    //               onChangeHandler={onChange}
    //               // maxDate={new Date()}
    //               maxDate={
    //                 editParams?.transaction_date
    //                   ? new Date(Math.min(new Date(editParams?.transaction_date).getTime(), new Date().getTime()))
    //                   : new Date()
    //               }
    //               customInput={<CustomInput label='Date of Death*' error={Boolean(errors.death_date)} />}
    //             />
    //           )}
    //         />
    //         {errors.death_date && (
    //           <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
    //             {errors.death_date?.message}
    //           </FormHelperText>
    //         )}
    //       </FormControl>
    //     </Grid> */}
    //   </Grid>
    //   <Divider />
    //   <Grid item xs={12}>
    //     <Box mt={6}>
    //       <Typography variant='h5' gutterBottom>
    //         Gender
    //       </Typography>
    //       <Typography variant='subtitle1' gutterBottom>
    //         Total Count: {totalCount}
    //       </Typography>
    //     </Box>
    //   </Grid>
    //   <Grid container spacing={2}>
    //     <Grid item xs={12} sm={4} sx={{ mb: 6 }}>
    //       <FormControl fullWidth>
    //         <Controller
    //           name='male_count'
    //           control={control}
    //           rules={{ min: 0, pattern: /^\d*$/ }}
    //           render={({ field: { value, onChange } }) => (
    //             <TextField
    //               label='Male Count'
    //               value={value}
    //               variant='outlined'
    //               // onChange={onChange}
    //               onChange={e => {
    //                 onChange(e) // Update the value in the form
    //                 clearErrors('counts') // Clear the counts error on change
    //               }}
    //               placeholder='Enter the Male Count'
    //               error={Boolean(errors.male_count)}
    //               name='male_count'
    //             />
    //           )}
    //         />
    //         {errors.male_count && (
    //           <FormHelperText sx={{ color: 'error.main' }}>{errors.male_count?.message}</FormHelperText>
    //         )}
    //         {errors.counts && (
    //           <Grid item xs={12} sx={{ mb: 6 }}>
    //             <FormHelperText sx={{ color: 'error.main' }}>{errors.counts.message}</FormHelperText>
    //           </Grid>
    //         )}
    //       </FormControl>
    //     </Grid>
    //     <Grid item xs={12} sm={4} sx={{ mb: 6 }}>
    //       <FormControl fullWidth>
    //         <Controller
    //           name='female_count'
    //           control={control}
    //           rules={{ min: 0, pattern: /^\d*$/ }}
    //           render={({ field: { value, onChange } }) => (
    //             <TextField
    //               label='Female Count'
    //               placeholder='Enter the Female Count'
    //               value={value}
    //               variant='outlined'
    //               // onChange={onChange}
    //               onChange={e => {
    //                 onChange(e) // Update the value in the form
    //                 clearErrors('counts') // Clear the counts error on change
    //               }}
    //               error={Boolean(errors.female_count)}
    //               name='female_count'
    //             />
    //           )}
    //         />
    //         {errors.female_count && (
    //           <FormHelperText sx={{ color: 'error.main' }}>{errors.female_count?.message}</FormHelperText>
    //         )}
    //         {errors.counts && (
    //           <Grid item xs={12} sx={{ mb: 6 }}>
    //             <FormHelperText sx={{ color: 'error.main' }}>{errors.counts.message}</FormHelperText>
    //           </Grid>
    //         )}
    //       </FormControl>
    //     </Grid>
    //     <Grid item xs={12} sm={4}>
    //       <FormControl fullWidth>
    //         <Controller
    //           name='other_count'
    //           control={control}
    //           rules={{ min: 0, pattern: /^\d*$/ }}
    //           render={({ field: { value, onChange } }) => (
    //             <TextField
    //               label='Others Count'
    //               placeholder='Enter the Others Count'
    //               value={value}
    //               variant='outlined'
    //               // onChange={onChange}
    //               onChange={e => {
    //                 onChange(e) // Update the value in the form
    //                 clearErrors('counts') // Clear the counts error on change
    //               }}
    //               error={Boolean(errors.other_count)}
    //               name='other_count'
    //             />
    //           )}
    //         />
    //         {errors.other_count && (
    //           <FormHelperText sx={{ color: 'error.main' }}>{errors.other_count?.message}</FormHelperText>
    //         )}
    //         {errors.counts && (
    //           <Grid item xs={12} sx={{ mb: 6 }}>
    //             <FormHelperText sx={{ color: 'error.main' }}>{errors.counts.message}</FormHelperText>
    //           </Grid>
    //         )}
    //       </FormControl>
    //     </Grid>
    //   </Grid>
    //   {/* <Grid container spacing={2}>
    //     <Grid item xs={12} sm={6} sx={{ mb: 6 }}>
    //       <FormControl fullWidth>
    //         <Controller
    //           name='death_animal_id'
    //           control={control}
    //           rules={{ required: true }}
    //           render={({ field: { value, onChange } }) => (
    //             <TextField
    //               label='Animal ID (Optional)'
    //               value={value}
    //               onChange={onChange}
    //               placeholder='Enter Animal ID (Optional)'
    //               error={Boolean(errors.death_animal_id)}
    //               name='death_animal_id'
    //             />
    //           )}
    //         />
    //         {errors.death_animal_id && (
    //           <FormHelperText sx={{ color: 'error.main' }}>{errors.death_animal_id?.message}</FormHelperText>
    //         )}
    //       </FormControl>
    //     </Grid>
    //     <Grid item xs={12} sm={6} sx={{ mb: 6 }}>
    //       <Grid container spacing={2}>
    //         <Grid item xs={12} sm={12}>
    //           <FormControl fullWidth>
    //             <Controller
    //               name='gender'
    //               control={control}
    //               render={({ field: { value, onChange } }) => (
    //                 <TextField select label='Gender*' value={value} onChange={onChange} error={Boolean(errors.gender)}>
    //                   <MenuItem value='male'>Male</MenuItem>
    //                   <MenuItem value='female'>Female</MenuItem>
    //                   <MenuItem value='other'>Other</MenuItem>
    //                 </TextField>
    //               )}
    //             />
    //             {errors.gender && (
    //               <FormHelperText sx={{ color: 'error.main' }}>{errors.gender?.message}</FormHelperText>
    //             )}
    //           </FormControl>
    //         </Grid>
    //       </Grid>
    //     </Grid>
    //   </Grid> */}
    //   {/* <Grid container spacing={2} sx={{ mb: 6 }}>
    //     <Grid item xs={12} sm={6}>
    //       <FormControl fullWidth>
    //         <Controller
    //           name='transaction_date'
    //           control={control}
    //           render={({ field: { value, onChange } }) => (
    //             <SingleDatePicker
    //               fullWidth
    //               date={value}
    //               width={'100%'}
    //               dateFormat='dd/MM/yyyy'
    //               // showTimeSelect
    //               // timeIntervals={15}
    //               onChangeHandler={onChange}
    //               maxDate={new Date()}
    //               // minDate={(deathDate && deathDate) || new Date()}
    //               customInput={<CustomInput label='Date*' error={Boolean(errors.transaction_date)} />}
    //             />
    //           )}
    //         />
    //         {errors.transaction_date && (
    //           <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
    //             {errors.transaction_date?.message}
    //           </FormHelperText>
    //         )}
    //       </FormControl>
    //     </Grid>
    //   </Grid> */}
    // </>
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
      <Grid container spacing={2}>
        <Grid item size={{ xs: 12, sm: 6 }} sx={{ mb: 6 }}>
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
        <Grid item size={{ xs: 12, sm: 6 }} sx={{ mb: 6 }}>
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
        <Grid item size={{ xs: 12, sm: 6 }} sx={{ mb: 6 }}>
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
        <Grid item size={{ xs: 12, sm: 6 }} sx={{ mb: 6 }}>
          <Grid container spacing={2}>
            <Grid item size={{ xs: 12, sm: 12 }}>
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
        <Grid item size={{ xs: 12, sm: 6 }} s>
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
