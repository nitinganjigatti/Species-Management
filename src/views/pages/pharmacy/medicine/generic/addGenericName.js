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
import { getGenericsById } from 'src/lib/api/pharmacy/genericNames'

import { useForm } from 'react-hook-form'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledRadioGroup from 'src/views/forms/form-fields/ControlledRadioGroup'

const schema = yup.object().shape({
  name: yup
    .string()
    .transform(value => (value ? value.trim() : value))
    .min(3, 'Generic name must contain at least 3 characters ')
    .required('Generic Name is Required'),
  status: yup.string().required('Status is Required')
})

const defaultValues = {
  name: '',
  status: 'active'
}

const AddGenericName = props => {
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
    const { name, status } = { ...params }

    const payload = {
      name,
      status
    }
    await handleSubmitData(payload)
  }

  // const getGeneric = async id => {}

  const getGeneric = useCallback(
    async id => {
      const response = await getGenericsById(id)
      if (response?.success) {
        reset(response.data)
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
      console.log()

      getGeneric(editParams?.id)
    }
  }, [resetForm, editParams, reset, getGeneric])

  const RenderSidebarFooter = () => {
    return (
      <Fragment>
        <LoadingButton size='large' type='submit' variant='contained'>
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
        <Typography variant='h6'>{editParams?.id !== null ? 'Edit' : 'Add'} Generic Name</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size='small' onClick={handleSidebarClose} sx={{ color: 'text.primary' }}>
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
        </Box>
      </Box>
      <Box className='sidebar-body' sx={{ p: theme => theme.spacing(5, 6) }}>
        <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}>
          <ControlledTextField
            name='name'
            control={control}
            required
            label='Generic Name*'
            placeholder='Generic Name'
            error={Boolean(errors.name)}
            fullWidth
            sx={{ mb: 6 }}
          />

          {editParams?.id !== null ? (
            <ControlledRadioGroup
              name='status'
              control={control}
              errors={errors}
              label='Status'
              required
              options={[
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' }
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

export default AddGenericName
