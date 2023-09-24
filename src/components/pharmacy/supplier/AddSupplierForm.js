// ** React Imports
import { forwardRef, useState } from 'react'

// ** MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Radio from '@mui/material/Radio'
import Select from '@mui/material/Select'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Checkbox from '@mui/material/Checkbox'
import TextField from '@mui/material/TextField'
import FormLabel from '@mui/material/FormLabel'
import CardHeader from '@mui/material/CardHeader'
import InputLabel from '@mui/material/InputLabel'
import IconButton from '@mui/material/IconButton'
import RadioGroup from '@mui/material/RadioGroup'
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import OutlinedInput from '@mui/material/OutlinedInput'
import FormHelperText from '@mui/material/FormHelperText'
import InputAdornment from '@mui/material/InputAdornment'
import FormControlLabel from '@mui/material/FormControlLabel'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

// ** Third Party Imports
import toast from 'react-hot-toast'
import DatePicker from 'react-datepicker'
import { useForm, Controller } from 'react-hook-form'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

const defaultValues = {
  name: '',
  company_name: '',
  email: '',
  phone: '',
  mobile: '',
  address: '',
  gst_number: '',
  state_id: '',
  opening_balance: 0,
  description: ''
}

const schema = yup.object().shape({
  name: yup
    .string()
    .required('Supplier name is required')
    .matches(/^[a-zA-Z0-9\s]+$/, 'Invalid Supplier name format')
    .max(50, 'Supplier name must be at most 50 characters'),

  // email: yup.string().email('Enter valid email').nullable(),
  email: yup.string().test('valid-email', 'Invalid email format', function (value) {
    if (!value) {
      return true // Email is not required, so no validation needed
    }

    return yup.string().email().isValidSync(value)
  }),
  phone: yup
    .string()
    .nullable()
    .test('valid-phone', 'Enter valid phone number', function (value) {
      if (!value) {
        return true
      }
      const regex = /^[6-9]\d{9}$/

      return regex.test(value)
    }),

  // .matches(
  //   /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/,
  //   'Enter valid phone number',
  // )
  // .max(10, 'Maximum of 10 digits')
  // .nullable(),
  mobile: yup
    .string()
    .required('Mobile No is required')
    .matches(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Mobile number')
    .max(10, 'Maximum of 10 digits'),
  state_id: yup.string().required('Select state'),
  gst_number: yup
    .string()
    .nullable()
    .test('valid-gst', 'Enter valid GST number', function (value) {
      if (!value) {
        return true
      }
      const regex = /^(\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d[Z]{1}[A-Z\d]{1})$/

      return regex.test(value)
    }),

  // due_balance: yup.string().required('Enter due balance'),

  opening_balance: yup.string().nullable(),
  address: yup.string().nullable(),
  description: yup.string().nullable(),
  company_name: yup.string().nullable()
})

const CustomInput = forwardRef(({ ...props }, ref) => {
  return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
})

const AddSupplierForm = ({ action, onSubmit, statesList }) => {
  // ** Hooks
  const {
    reset,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  // const onSubmit = data => {
  //   console.log(data.name)
  //   console.log(data.phone)
  //   console.log(data)
  //   toast.success('Form Submitted')
  // }

  return (
    <Card>
      <CardHeader title='' action={action ?? null} />
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='name'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      value={value}
                      label='Supplier Name'
                      onChange={onChange}
                      placeholder=''
                      error={Boolean(errors.name)}
                      name='name'
                    />
                  )}
                />
                {errors.name && <FormHelperText sx={{ color: 'error.main' }}>{errors.name.message}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='company_name'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      value={value}
                      label='Contact Person'
                      name='company_name'
                      onChange={onChange}
                      placeholder=''
                    />
                  )}
                />
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='mobile'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <TextField
                      value={value}
                      label='Mobile Number'
                      onChange={onChange}
                      placeholder=''
                      error={Boolean(errors?.mobile)}
                      onBlur={onBlur}
                      name='mobile'
                    />
                  )}
                />
                {errors.mobile && (
                  <FormHelperText sx={{ color: 'error.main' }}> {errors?.mobile?.message} </FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel error={Boolean(errors?.state_id)} id='state_id'>
                  State
                </InputLabel>
                <Controller
                  name='state_id'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <Select
                      name='state_id'
                      value={value}
                      label='Select'
                      onChange={onChange}
                      error={Boolean(errors?.state_id)}
                      labelId='state_id'
                    >
                      {statesList?.map((item, index) => (
                        <MenuItem key={index} disabled={item?.status === 'inactive'} value={item?.id}>
                          {item?.name}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors?.state_id && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.state_id?.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='gst_number'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      value={value}
                      label='GST Number'
                      onChange={onChange}
                      placeholder=''
                      error={Boolean(errors?.gst_number)}
                      name='gst_number'
                    />
                  )}
                />
                {errors?.gst_number && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.gst_number?.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='email'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      type='email'
                      value={value}
                      label='Email'
                      onChange={onChange}
                      error={Boolean(errors?.email)}
                      placeholder=''
                      name='email'
                    />
                  )}
                />
                {errors?.email && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.email?.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='phone'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      value={value}
                      label='Phone'
                      onChange={onChange}
                      placeholder=''
                      error={Boolean(errors?.phone)}
                      name='phone'
                    />
                  )}
                />
                {errors?.phone && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.phone?.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='description'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      value={value}
                      label='Description'
                      onChange={onChange}
                      placeholder=''
                      name='description'
                    />
                  )}
                />
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <Controller
                  name='address'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => <TextField name='address' rows={4} multiline {...field} label='Address' />}
                />
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <Controller
                  name='opening_balance'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      value={value}
                      type='number'
                      label='Opening Balance'
                      onChange={onChange}
                      placeholder=''
                      name='opening_balance'

                      //error={Boolean(errors?.opening_balance)}
                    />
                  )}
                />
                {/* {errors.opening_balance && (
                  <FormHelperText sx={{ color: 'error.main' }}>This field is required</FormHelperText>
                )} */}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Button size='large' type='submit' variant='contained'>
                Submit
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default AddSupplierForm
