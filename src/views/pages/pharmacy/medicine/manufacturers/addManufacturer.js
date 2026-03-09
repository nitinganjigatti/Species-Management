// ** React Imports
import { useState, useEffect, useCallback, Fragment } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'
import { useRouter } from 'next/router'

import { useForm } from 'react-hook-form'

import Icon from 'src/@core/components/icon'
import { getManufacturerById } from 'src/lib/api/pharmacy/manufacturer'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledRadioGroup from 'src/views/forms/form-fields/ControlledRadioGroup'

const schema = yup.object().shape({
  manufacturer_name: yup
    .string()
    .transform(value => (value ? value.trim() : value))
    .min(3, 'Manufacturer name must contain at least 3 characters')
    .required('Manufacturer Name is Required'),
  active: yup.string().required('Status is Required')
})

const defaultValues = {
  manufacturer_name: '',
  active: '1'
}

const AddManufacturer = props => {
  const { addEventSidebarOpen, handleSidebarClose, handleSubmitData, resetForm, submitLoader, editParams } = props

  const [values, setValues] = useState(defaultValues)

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
    const { manufacturer_name, active } = { ...params }

    const payload = {
      manufacturer_name: manufacturer_name.trim(),
      active
    }
    await handleSubmitData(payload)
  }

  const getManufacturer = useCallback(
    async id => {
      try {
        const response = await getManufacturerById(id)

        if (response?.success) {
          reset({ id: response.data.id, manufacturer_name: response.data.label, active: response.data.active })
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
      getManufacturer(editParams?.id)
    }
  }, [resetForm, editParams, reset, getManufacturer])

  const RenderSidebarFooter = () => {
    return (
      <Fragment>
        <LoadingButton size='large' type='submit' variant='contained' loading={submitLoader}>
          Submit
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
        <Typography variant='h6'>{editParams?.id !== null ? 'Edit' : 'Add'} Manufacturer</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size='small' onClick={handleSidebarClose} sx={{ color: 'text.primary' }}>
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
        </Box>
      </Box>
      <Box className='sidebar-body' sx={{ p: theme => theme.spacing(5, 6) }}>
        <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}>
          <ControlledTextField
            name='manufacturer_name'
            control={control}
            label='Manufacturer Name'
            placeholder='Manufacturer Name'
            required
            error={Boolean(errors.manufacturer_name)}
            fullWidth
            sx={{ mb: 6 }}
          />
          {editParams?.id !== null ? (
            <ControlledRadioGroup
              name='active'
              control={control}
              errors={errors}
              label='Status'
              required
              options={[
                { label: 'Active', value: '1' },
                { label: 'Inactive', value: '0' }
              ]}
              row
              gap={4}
              sx={{ mb: 6 }}
            />
          ) : null}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RenderSidebarFooter />
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddManufacturer
