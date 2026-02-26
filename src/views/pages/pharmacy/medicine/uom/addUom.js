// addState
// ** React Imports
import { useState, useEffect, useCallback, Fragment } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { getUnitsById } from 'src/lib/api/pharmacy/getUnits'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'
import { useRouter } from 'next/router'

import { useForm } from 'react-hook-form'

import Icon from 'src/@core/components/icon'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledRadioGroup from 'src/views/forms/form-fields/ControlledRadioGroup'

const schema = yup.object().shape({
  unit_name: yup
    .string()
    .transform(value => (value ? value.trim() : value))
    .min(1, 'UOM must contain at least 1 characters')
    .required('UOM is Required'),
  active: yup.string().nullable()
})

const defaultValues = {
  unit_name: '',
  active: '1'
}

const AddUOM = props => {
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
    const { unit_name, active } = { ...params }

    const payload = {
      unit_name: unit_name.trim(),
      active
    }
    await handleSubmitData(payload)
  }

  const getUnits = useCallback(
    async id => {
      const response = await getUnitsById(id)
      console.log('add state comp', response)
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
      getUnits(editParams?.id)
    }
  }, [resetForm, editParams, reset, getUnits])

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
        <Typography variant='h6'>{editParams?.id !== null ? 'Edit' : 'Add'} UOM</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size='small' onClick={handleSidebarClose} sx={{ color: 'text.primary' }}>
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
        </Box>
      </Box>
      <Box className='sidebar-body' sx={{ p: theme => theme.spacing(5, 6) }}>
        <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}>
          <ControlledTextField
            name='unit_name'
            control={control}
            placeholder='UOM Name'
            error={Boolean(errors.unit_name)}
            label='UOM Name*'
            required
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
                { label: 'Active', value: true, value: '1' },
                { label: 'Inactive', value: false, value: '0' }
              ]}
              row
              radioColor='primary'
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

export default AddUOM
