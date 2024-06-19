// ** React Imports
import { useState, useEffect, useCallback, Fragment, useRef, forwardRef } from 'react'
import Image from 'next/image'

// ** MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'
import { RadioGroup, FormLabel, FormControlLabel, Radio, Button, Grid } from '@mui/material'
import { Select, MenuItem } from '@mui/material'
import { useTheme } from '@mui/material/styles'

// ** Third Party Imports
import { useForm, Controller } from 'react-hook-form'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { getDrugById } from 'src/lib/api/pharmacy/getDrugs'
import SingleDatePicker from 'src/components/SingleDatePicker'

// ** Styled Components

const schema = yup.object().shape({
  name: yup
    .string()
    .transform(value => (value ? value.trim() : value))
    .required('Scientific Name is Required'),
  active: yup.string().required('Status is Required'),
  commonName: yup
    .string()
    .transform(value => (value ? value.trim() : value))
    .required('Common Name is Required'),
  totalCount: yup.string().required('Total Count is Required'),
  gender: yup.string().required('Gender is Required'),
  age: yup.number().typeError('Age must be a number').required('Age is Required'),
  ro_date: yup.date().required('Date is Required'),
  reason: yup.string().required('Reason is Required'),

  registrationNumber: yup.string().when('reason', {
    is: value => value === 'death',
    then: schema => schema.required('Registration Number is Required for Death Reason')
  }),
  reasonForDeath: yup.string().when('reason', {
    is: value => value === 'death',
    then: schema => schema.required('Reason for Death is Required')
  }),
  whereAndHowDisposed: yup.string().when('reason', {
    is: value => value === 'death',
    then: schema => schema.required('Where and How Disposed is Required for Death Reason')
  })
})

const defaultValues = {
  name: '',
  active: '1',
  registrationNumber: '',
  reasonForDeath: '',
  whereAndHowDisposed: ''
}

const AddSpeciesNewEntry = props => {
  // ** Props
  const { addEventSidebarOpen, handleSidebarClose, handleSubmitData, resetForm, submitLoader, editParams } = props

  // ** States
  const theme = useTheme()
  const [values, setValues] = useState(defaultValues)
  const [showAdditionalFields, setShowAdditionalFields] = useState(false)

  const {
    reset,
    control,
    setValue,
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

  const onSubmit = async params => {
    console.log(params, '////')
    const { name, active } = { ...params }

    const payload = {
      name: name.trim(),
      active
    }
    await handleSubmitData(payload)
  }

  const getDrugClass = useCallback(
    async id => {
      const response = await getDrugById(id)
      if (response?.success) {
        reset({ name: response.data.label, active: response.data.active, id: response.data.id })
      } else {
      }
    },
    [reset]
  )

  useEffect(() => {
    if (resetForm) {
      reset(defaultValues)
    }

    if (editParams?.id !== null) {
      getDrugClass(editParams?.id)
    }
  }, [resetForm, editParams, reset, getDrugClass])

  const RenderSidebarFooter = () => {
    return (
      <Fragment>
        <Button size='large' variant='outlined' sx={{ mr: 2, width: '100%' }} onClick={handleSidebarClose}>
          &nbsp; Cancel
        </Button>
        <LoadingButton size='large' type='submit' variant='contained' loading={submitLoader} sx={{ width: '100%' }}>
          Submit
        </LoadingButton>
      </Fragment>
    )
  }
  const CustomInput = forwardRef(({ ...props }, ref) => {
    return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
  })

  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 400] } }}
    >
      <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          backgroundColor: 'background.default',
          p: theme => theme.spacing(3, 3.255, 3, 5.255)
        }}
      >
        <Typography variant='h6'>{editParams?.id !== null ? 'Edit' : 'Add'} New Species</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size='small' onClick={handleSidebarClose} sx={{ color: 'text.primary' }}>
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
        </Box>
      </Box>
      <Box className='sidebar-body' sx={{ p: theme => theme.spacing(5, 6) }}>
        <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}>
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='name'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  label='Scientific Name*'
                  value={value}
                  onChange={onChange}
                  placeholder='Scientific Name'
                  error={Boolean(errors.name)}
                  name='name'
                />
              )}
            />
            {errors.name && <FormHelperText sx={{ color: 'error.main' }}>{errors.name.message}</FormHelperText>}
          </FormControl>
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='commonName'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  label='Common Name*'
                  value={value}
                  onChange={onChange}
                  placeholder='Common Name'
                  error={Boolean(errors.commonName)}
                  name='commonName'
                />
              )}
            />
            {errors.commonName && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors.commonName.message}</FormHelperText>
            )}
          </FormControl>
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='reason'
              control={control}
              render={({ field: { value, onChange } }) => (
                <TextField
                  select
                  label='Reason*'
                  placeholder='Reason'
                  value={value}
                  onChange={e => {
                    onChange(e)
                    setShowAdditionalFields(e.target.value === 'death') // Show additional fields only when reason is 'death'
                  }}
                  error={Boolean(errors.reason)}
                >
                  <MenuItem value='birth'>Birth</MenuItem>
                  <MenuItem value='death'>Death</MenuItem>
                  <MenuItem value='transfer'>Transfer </MenuItem>
                  <MenuItem value='acquisition'>Acquisition </MenuItem>
                </TextField>
              )}
            />
            {errors.reason && <FormHelperText sx={{ color: 'error.main' }}>{errors.reason?.message}</FormHelperText>}
          </FormControl>

          {showAdditionalFields && (
            <>
              {/* Additional input fields */}
              <FormControl fullWidth sx={{ mb: 6 }}>
                <Controller
                  name='registrationNumber'
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      label='Registration Number*'
                      value={value}
                      onChange={onChange}
                      placeholder='Allotted registration certificate number for Animal species'
                      error={Boolean(errors.registrationNumber)}
                      name='registrationNumber'
                    />
                  )}
                />
                {errors.registrationNumber && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.registrationNumber?.message}</FormHelperText>
                )}
              </FormControl>
              <FormControl fullWidth sx={{ mb: 6 }}>
                <Controller
                  name='reasonForDeath'
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      label='Reason for Death*'
                      value={value}
                      onChange={onChange}
                      placeholder='Enter Reason for Death'
                      error={Boolean(errors.reasonForDeath)}
                      name='reasonForDeath'
                    />
                  )}
                />
                {errors.reasonForDeath && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.reasonForDeath?.message}</FormHelperText>
                )}
              </FormControl>
              <FormControl fullWidth sx={{ mb: 6 }}>
                <Controller
                  name='whereAndHowDisposed'
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      label='Where and How Disposed*'
                      value={value}
                      onChange={onChange}
                      placeholder='Enter Where and How Disposed'
                      error={Boolean(errors.whereAndHowDisposed)}
                      name='whereAndHowDisposed'
                    />
                  )}
                />
                {errors.whereAndHowDisposed && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.whereAndHowDisposed?.message}</FormHelperText>
                )}
              </FormControl>
            </>
          )}

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
              name='age'
              control={control}
              render={({ field: { value, onChange } }) => (
                <TextField label='Age*' type='number' value={value} onChange={onChange} error={Boolean(errors.age)} />
              )}
            />
            {errors.age && <FormHelperText sx={{ color: 'error.main' }}>{errors.age?.message}</FormHelperText>}
          </FormControl>
          <FormControl fullWidth sx={{ mb: 6 }}>
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
          <FormControl fullWidth sx={{ mb: 6 }}>
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

          {editParams?.id !== null ? (
            <FormControl fullWidth sx={{ mb: 6 }} error={Boolean(errors.radio)}>
              <FormLabel>Status</FormLabel>
              <Controller
                name='active'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <RadioGroup row {...field} name='validation-basic-radio'>
                    <FormControlLabel
                      value='1'
                      label='Active'
                      sx={errors.status ? { color: 'error.main' } : null}
                      control={<Radio sx={errors.status ? { color: 'error.main' } : null} />}
                    />
                    <FormControlLabel
                      value='0'
                      label='Inactive'
                      sx={errors.status ? { color: 'error.main' } : null}
                      control={<Radio sx={errors.status ? { color: 'error.main' } : null} />}
                    />
                  </RadioGroup>
                )}
              />
              {errors.radio && (
                <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-radio'>
                  This field is required
                </FormHelperText>
              )}
            </FormControl>
          ) : null}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RenderSidebarFooter />
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddSpeciesNewEntry
