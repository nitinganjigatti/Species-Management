// addState
// ** React Imports
import { useEffect, useCallback, Fragment } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'
import { getDriverById } from 'src/lib/api/pharmacy/driver'

import { useForm } from 'react-hook-form'

import Icon from 'src/@core/components/icon'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'

const schema = yup.object().shape({
  driver_name: yup
    .string()
    .transform(value => (value ? value.trim() : value))
    .required('Driver name is required')
    .min(3, 'Driver name must contain at least 3 characters'),

  active: yup.string().nullable(),

  phone_number: yup
    .string()
    .required('Phone Number is required')
    .matches(/^\d{10}$/, 'Phone Number must be exactly 10 digits'),

  vehicle_number: yup.string().required('Vehicle Number is required')
})

const defaultValues = {
  driver_name: '',
  phone_number: '',
  vehicle_number: '',
  active: '1'
}

const AddDriver = props => {
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
          <ControlledTextField
            name='driver_name'
            control={control}
            error={Boolean(errors.name)}
            placeholder='Driver Name'
            label='Driver Name*'
            fullWidth
            sx={{ mb: 6 }}
          />
          <ControlledTextField
            name='phone_number'
            type='number'
            control={control}
            error={Boolean(errors.name)}
            placeholder='Phone Number'
            label='Phone Number*'
            fullWidth
            sx={{ mb: 6 }}
          />

          <ControlledTextField
            label='Vehicle Number*'
            control={control}
            placeholder='Vehicle Number'
            error={Boolean(errors.name)}
            name='vehicle_number'
            fullWidth
            sx={{ mb: 6 }}
          />
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
