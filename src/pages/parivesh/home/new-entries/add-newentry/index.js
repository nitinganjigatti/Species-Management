import React, { forwardRef, useState } from 'react'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import { Controller, useForm } from 'react-hook-form'
import {
  Autocomplete,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormHelperText,
  Grid,
  MenuItem,
  TextField,
  Typography
} from '@mui/material'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import Router, { useRouter } from 'next/router'
import { LoadingButton } from '@mui/lab'
import SingleDatePicker from 'src/components/SingleDatePicker'

const AddNewEntry = () => {
  const router = useRouter()
  const [btnLoader, setBtnLoader] = useState(false)
  const [editParams, setEditParams] = useState()

  const schema = yup.object().shape({
    specie: yup
      .object()
      .shape({
        name: yup.string().required('Specie is Required')
      })
      .required('Specie is Required'),
    totalCount: yup.string().required('Total Count is Required'),
    gender: yup.string().required('Gender is Required'),
    age: yup.number().typeError('Age must be a number').required('Age is Required'),
    reason: yup.string().required('Reason is Required'),
    ro_date: yup.date().required('Date is Required')
  })

  const defaultValues = {
    specie: null,
    gender: '',
    age: '',
    totalCount: '',
    reason: '',
    ro_date: null
  }

  const {
    reset,
    control,
    setValue,
    watch,
    getValues,
    clearErrors,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const CustomInput = forwardRef(({ ...props }, ref) => {
    return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
  })

  const onSubmit = async params => {
    console.log(params, 'data')
    // handle form submission
  }

  const RenderSidebarFooter = () => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'end', gap: 4 }}>
        <LoadingButton loading={btnLoader} size='large' type='submit' variant='contained'>
          {'Save'}
        </LoadingButton>
        <Button onClick={() => Router.push('')} size='large' type='reset' color='error' variant='outlined'>
          Cancel
        </Button>
      </Box>
    )
  }

  const specieData = [
    { id: 1, name: 'Sparrow' },
    { id: 2, name: 'Robin' }
  ]

  return (
    <>
      <Box>
        <Box>
          <Breadcrumbs aria-label='breadcrumb'>
            <Typography sx={{ cursor: 'pointer' }} color='inherit' onClick={() => Router.push('/parivesh/home')}>
              New Entries
            </Typography>
            <Typography color='text.primary'>New Report</Typography>
          </Breadcrumbs>
        </Box>

        <Box sx={{ mt: 5, background: '#FFFFFF', borderRadius: '10px' }}>
          <CardContent>
            <Typography sx={{ mb: '20px' }} variant='h6'>
              New Report
            </Typography>

            <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={2} sx={{ mb: 6 }}>
                <Grid item xs={12}>
                  <FormControl fullWidth error={Boolean(errors.specie)}>
                    <Controller
                      name='specie'
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <Autocomplete
                          sx={{ width: '100%' }}
                          options={specieData}
                          id='autocomplete-clearOnEscape'
                          value={value}
                          getOptionLabel={option => option.name || ''}
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                          onChange={(event, newValue) => {
                            onChange(newValue)
                          }}
                          renderInput={params => <TextField {...params} label='Select the Specie' />}
                        />
                      )}
                    />
                    {errors.specie && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.specie?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              </Grid>
              <Grid container spacing={2} sx={{ mb: 6 }}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <Controller
                      name='reason'
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          select
                          label='Reason*'
                          value={value}
                          onChange={onChange}
                          error={Boolean(errors.reason)}
                        >
                          <MenuItem value='reason1'>Reason 1</MenuItem>
                          <MenuItem value='reason2'>Reason 2</MenuItem>
                          <MenuItem value='reason3'>Reason 3</MenuItem>
                        </TextField>
                      )}
                    />
                    {errors.reason && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.reason?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mb: 6 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <Controller
                      name='gender'
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          select
                          label='Gender*'
                          value={value}
                          onChange={onChange}
                          error={Boolean(errors.gender)}
                        >
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
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <Controller
                      name='age'
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          label='Age*'
                          type='number'
                          value={value}
                          onChange={onChange}
                          error={Boolean(errors.age)}
                        />
                      )}
                    />
                    {errors.age && <FormHelperText sx={{ color: 'error.main' }}>{errors.age?.message}</FormHelperText>}
                  </FormControl>
                </Grid>
              </Grid>
              <Grid container spacing={2} sx={{ mb: 6 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <Controller
                      name='totalCount'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          label='Total Count*'
                          value={value}
                          onChange={onChange}
                          placeholder='Enter Total Count'
                          error={Boolean(errors.totalCount)}
                          name='totalCount'
                        />
                      )}
                    />
                    {errors.totalCount && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.totalCount?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <Controller
                      name='ro_date'
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <SingleDatePicker
                          fullWidth
                          date={value}
                          width={'100%'}
                          onChangeHandler={onChange}
                          customInput={<CustomInput label='Date*' error={Boolean(errors.ro_date)} />}
                        />
                      )}
                    />
                    {errors.ro_date && (
                      <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                        {errors.ro_date?.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              </Grid>

              <RenderSidebarFooter />
            </form>
          </CardContent>
        </Box>
      </Box>
    </>
  )
}

export default AddNewEntry
