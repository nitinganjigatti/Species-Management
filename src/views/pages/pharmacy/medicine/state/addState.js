// addState
// ** React Imports
import { useState, useEffect, forwardRef, useCallback, Fragment } from 'react'

import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

import { getStateById } from 'src/lib/api/pharmacy/getStates'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'
import { useRouter } from 'next/router'

// ** Third Party Imports
import { useForm } from 'react-hook-form'

import Icon from 'src/@core/components/icon'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledRadioGroup from 'src/views/forms/form-fields/ControlledRadioGroup'

const schema = yup.object().shape({
  name: yup
    .string()
    .matches(/^[A-Za-z\s]+$/, 'State Name must contain only alphabetic characters')
    .min(3, 'State Name must be at least 3 characters')
    .required('State Name is Required'),
  code: yup

    // .string()
    // .matches(/^\d{2,}$/, 'State code must contain more than 2 numeric characters')
    // .test('is-integer', 'State code must be an integer', value => Number.isInteger(Number(value)))
    // .test('greater-than-one', 'State code must be greater than 1', value => Number(value) <= 0)
    // .typeError('State code must be a number')
    // .required('State code is Required'),
    .string()
    .matches(/^(0[1-9]|[1-9]\d*)$/, 'State code must greater than 0')
    .test('is-integer', 'State code must be an integer', value => Number.isInteger(Number(value)))
    .test('valid-range', 'State code must be greater than 9', value => Number(value) > 0)
    .typeError('State code must be a numeric value')
    .required('State code is required'),
  short_code: yup
    .string()
    .matches(/^[A-Za-z]+$/, 'State short code must contain only alphabets')
    .min(2, 'State short code must contain two letters')
    .max(2, "State short code can't exceed two letters")
    .required('State short code is Required'),
  status: yup.string().nullable()
})

const defaultValues = {
  name: '',
  code: '',
  short_code: '',
  status: 'active'
}

const AddStates = props => {
  // ** Props
  const { addEventSidebarOpen, handleSidebarClose, handleSubmitData, resetForm, submitLoader, editParams } = props

  const {
    reset,
    control,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const onSubmit = async params => {
    const { name, code, short_code, status } = { ...params }

    const payload = {
      name,
      code,
      short_code,
      status
    }
    console.log(payload)
    await handleSubmitData(payload)
  }

  const getStates = useCallback(
    async id => {
      const response = await getStateById(id)
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
      getStates(editParams?.id)
    }
  }, [resetForm, editParams, reset, getStates])

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
        <Typography variant='h6'>{editParams?.id !== null ? 'Edit' : 'Add'} State</Typography>
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
            required={true}
            label='State Name*'
            placeholder='State Name'
            error={Boolean(errors.name)}
            fullWidth
            sx={{ mb: 6 }}
          />

          <ControlledTextField
            name='code'
            control={control}
            type='number'
            required={true}
            label='State Code*'
            placeholder='State Code*'
            error={Boolean(errors.name)}
            fullWidth
            sx={{ mb: 6 }}
          />

          <ControlledTextField
            name='short_code'
            control={control}
            required={true}
            label='Short Code*'
            placeholder='Short Code*'
            onChangeOverride={e => {
              const val = e?.target?.value
              if (typeof val === 'string') {
                setValue('short_code', val.toLocaleUpperCase())
              }
            }}
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

export default AddStates
