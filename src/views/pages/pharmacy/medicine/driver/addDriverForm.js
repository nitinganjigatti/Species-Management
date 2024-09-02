// addState
// ** React Imports
import { useState, useEffect, useCallback, Fragment } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import FormControlLabel from '@mui/material/FormControlLabel'
import { RadioGroup, FormLabel, Radio } from '@mui/material'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'
import { useRouter } from 'next/router'
import { getDriverById } from 'src/lib/api/pharmacy/driver'

// ** Third Party Imports
import { useForm, Controller } from 'react-hook-form'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Styled Components

const schema = yup.object().shape({
  driver_name: yup
    .string()
    .transform(value => (value ? value.trim() : value))
    .min(3, 'Driver name must contain at least 3 characters')
    .required('Driver name is Required'),
  active: yup.string().nullable(),
  phone_number: yup
    .number()
    .required('Phone Number is required')
    .test('is-valid-number', 'Phone Number must be exactly 10 digits', value => {
      return /^\d{10}$/.test(value)
    }),
  vehicle_number: yup.string().required('Vehicle Number is required')
})

const defaultValues = {
  driver_name: '',
  phone_number: '',
  vehicle_number: '',
  active: '1'
}

const AddDriver = props => {
  // ** Props
  const { addEventSidebarOpen, handleSidebarClose, handleSubmitData, resetForm, submitLoader, editParams } = props

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
    const { driver_name, phone_number, vehicle_number } = { ...params }

    const payload = {
      driver_name,
      phone_number,
      vehicle_number
    }
    await handleSubmitData(payload)
  }

  const getDriver = useCallback(
    async id => {
      try {
        const response = await getDriverById(id)
        if (response?.success) {
          reset({
            id: response.data.id,
            driver_name: response.data.driver_name,
            phone_number: response.data.phone_number,
            vehicle_number: response.data.vehicle_number
          })
        } else {
        }
      } catch (e) {
        console.log(e)
      }
    },
    [reset]
  )

  useEffect(() => {
    if (resetForm) {
      reset(defaultValues)
    }

    if (editParams?.id !== null) {
      getDriver(editParams?.id)
    }
  }, [resetForm, editParams, reset, getDriver])

  const RenderSidebarFooter = () => {
    return (
      <Fragment>
        <LoadingButton size='large' type='submit' variant='contained' loading={submitLoader}>
          Add
        </LoadingButton>
      </Fragment>
    )
  }

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
        <Typography variant='h6'>{editParams?.id !== null ? 'Edit' : 'Add'} Driver</Typography>
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
              name='driver_name'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  label='Driver Name*'
                  value={value}
                  onChange={onChange}
                  placeholder='Driver Name'
                  error={Boolean(errors.name)}
                  name='driver_name'
                />
              )}
            />
            {errors.driver_name && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors.driver_name.message}</FormHelperText>
            )}
          </FormControl>
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='phone_number'
              type='number'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  label='Phone Number*'
                  value={value}
                  type='number'
                  onChange={onChange}
                  placeholder='Phone Number'
                  error={Boolean(errors.name)}
                  name='phone_number'
                />
              )}
            />
            {errors.phone_number && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors.phone_number.message}</FormHelperText>
            )}
          </FormControl>
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='vehicle_number'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  label='Vehicle Number*'
                  value={value}
                  onChange={onChange}
                  placeholder='Vehicle Number'
                  error={Boolean(errors.name)}
                  name='vehicle_number'
                />
              )}
            />
            {errors.vehicle_number && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors.vehicle_number.message}</FormHelperText>
            )}
          </FormControl>

          {/* {editParams?.id !== null ? (
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
                      sx={errors.active ? { color: 'error.main' } : null}
                      control={<Radio sx={errors.active ? { color: 'error.main' } : null} />}
                    />
                    <FormControlLabel
                      value='0'
                      label='Inactive'
                      sx={errors.active ? { color: 'error.main' } : null}
                      control={<Radio sx={errors.active ? { color: 'error.main' } : null} />}
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
          ) : null} */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RenderSidebarFooter />
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddDriver
