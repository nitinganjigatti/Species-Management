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

// ** Third Party Imports
import toast from 'react-hot-toast'
import DatePicker from 'react-datepicker'
import { useForm, Controller } from 'react-hook-form'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

const defaultValues = {
  supplierName: '',
  contactPerson: '',
  mobileNumber: '',
  state: '',
  gstNumber: '',
  email: '',
  phone: '',
  address: '',
  description: '',
  openingBalance: 0

  // dob: null,
  // email: '',
  // radio: '',
  // select: '',
  // lastName: '',
  // password: '',
  // textarea: '',
  // firstName: '',
  // checkbox: false
}

const CustomInput = forwardRef(({ ...props }, ref) => {
  return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
})

const AddSupplierForm = ({ action }) => {
  // ** Hooks
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({ defaultValues })

  const onSubmit = () => {
    console.log(control._fields)
    console.log(control._formValues)
    toast.success('Form Submitted')
  }

  return (
    <Card>
      <CardHeader title='' action={action ?? null} />
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='supplierName'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      value={value}
                      label='Supplier Name'
                      onChange={onChange}
                      placeholder=''
                      error={Boolean(errors.supplierName)}

                      // aria-describedby='validation-basic-first-name'
                    />
                  )}
                />
                {errors.supplierName && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                    This field is required
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='contactPerson'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      value={value}
                      label='Contact Person'
                      onChange={onChange}
                      placeholder=''
                      error={Boolean(errors.contactPerson)}

                      // aria-describedby='validation-basic-first-name'
                    />
                  )}
                />
                {errors.contactPerson && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                    This field is required
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='mobileNumber'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      value={value}
                      label='Mobile Number'
                      onChange={onChange}
                      placeholder=''
                      error={Boolean(errors.mobileNumber)}

                      //aria-describedby='validation-basic-last-name'
                    />
                  )}
                />
                {errors.mobileNumber && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-last-name'>
                    This field is required
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id='validation-basic-state' error={Boolean(errors.state)} htmlFor='validation-basic-state'>
                  State
                </InputLabel>
                <Controller
                  name='state'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <Select
                      value={value}
                      label='Select'
                      onChange={onChange}
                      error={Boolean(errors.state)}
                      labelId='validation-basic-state'
                      aria-describedby='validation-basic-state'
                    >
                      <MenuItem value='west_bengal'>West Bengal</MenuItem>
                      <MenuItem value='maharashtra'>Maharashtra</MenuItem>
                    </Select>
                  )}
                />
                {errors.state && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-state'>
                    This field is required
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='gstNumber'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      value={value}
                      label='GST Number'
                      onChange={onChange}
                      placeholder=''
                      error={Boolean(errors.gstNumber)}

                      //aria-describedby='validation-basic-last-name'
                    />
                  )}
                />
                {errors.gstNumber && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-text'>
                    This field is required
                  </FormHelperText>
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
                      error={Boolean(errors.email)}
                      placeholder='carterleonard@gmail.com'
                      aria-describedby='validation-basic-email'
                    />
                  )}
                />
                {errors.email && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-email'>
                    This field is required
                  </FormHelperText>
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
                      error={Boolean(errors.phone)}

                      //aria-describedby='validation-basic-last-name'
                    />
                  )}
                />
                {errors.phone && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-last-name'>
                    This field is required
                  </FormHelperText>
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
                      error={Boolean(errors.description)}

                      //aria-describedby='validation-basic-last-name'
                    />
                  )}
                />
                {errors.description && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-last-name'>
                    This field is required
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <Controller
                  name='textarea'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <TextField
                      rows={4}
                      multiline
                      {...field}
                      label='Bio'
                      error={Boolean(errors.textarea)}
                      aria-describedby='validation-basic-textarea'
                    />
                  )}
                />
                {errors.textarea && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-textarea'>
                    This field is required
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <Controller
                  name='openingBalance'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      value={value}
                      label='Opening Balance'
                      onChange={onChange}
                      placeholder=''
                      error={Boolean(errors.openingBalance)}

                      //aria-describedby='validation-basic-last-name'
                    />
                  )}
                />
                {errors.openingBalance && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-last-name'>
                    This field is required
                  </FormHelperText>
                )}
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
